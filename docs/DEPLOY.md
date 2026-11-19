# Déploiement Lumio — VPS 38.143.19.38

## Prérequis

- Docker et Docker Compose installés
- Caddy installé hors Docker avec le plugin `cloudflare`
- Jeton Cloudflare API (`CF_API_TOKEN`) configuré pour Caddy

### 1. Vérifier le jeton Cloudflare pour Caddy

```bash
grep -ri "cloudflare\|CF_API_TOKEN" /etc/caddy/
systemctl show caddy --property=Environment
```

Si le jeton est absent :

```bash
# Créer /etc/caddy/caddy.env
echo 'CF_API_TOKEN=votre_jeton_cloudflare' > /etc/caddy/caddy.env
chmod 600 /etc/caddy/caddy.env
chown caddy:caddy /etc/caddy/caddy.env

# Ajouter EnvironmentFile dans le service Caddy
systemctl edit caddy
# Ajouter :
# [Service]
# EnvironmentFile=/etc/caddy/caddy.env

systemctl daemon-reload
systemctl restart caddy
```

### 2. Vérifier que les ports sont libres

```bash
ss -ltnp | grep -E ':(3100|8100)\b'
```

Si un port est occupé, modifier `FRONTEND_PORT` / `BACKEND_PORT` dans `.env` et adapter le Caddyfile.

### 3. Cloner et configurer

```bash
cd /opt
git clone https://github.com/henribesnard/lumio.git
cd lumio

cp .env.example .env
# Renseigner dans .env :
# - MISTRAL_API_KEY
# - SESSION_SECRET (au moins 32 caractères aléatoires)
# - POSTGRES_PASSWORD (mot de passe fort)
# - PUBLIC_URL=https://lumio.wezon.fr
```

### 4. Lancer la stack

```bash
docker compose up -d --build
```

### 5. Appliquer les migrations

```bash
docker compose exec backend alembic upgrade head
```

### 6. Créer le compte administrateur

```bash
docker compose exec -it backend python -m app.cli create-admin
```

### 7. Configurer Caddy

Sauvegarder le Caddyfile actuel :

```bash
cp /etc/caddy/Caddyfile /etc/caddy/Caddyfile.bak.$(date +%Y%m%d)
```

Ajouter ce bloc **à la fin** du Caddyfile, **sans toucher aux autres sites** :

```caddyfile
lumio.wezon.fr {
	tls {
		dns cloudflare {env.CF_API_TOKEN}
	}
	encode zstd gzip
	header {
		Strict-Transport-Security "max-age=31536000; includeSubDomains"
		X-Content-Type-Options "nosniff"
		X-Frame-Options "DENY"
		Referrer-Policy "strict-origin-when-cross-origin"
		Permissions-Policy "camera=(), microphone=(), geolocation=()"
		-Server
	}
	handle /api/* {
		reverse_proxy 127.0.0.1:8100 {
			header_up X-Real-IP {http.request.header.CF-Connecting-IP}
			flush_interval -1
		}
	}
	handle {
		reverse_proxy 127.0.0.1:3100
	}
	log {
		output file /var/log/caddy/lumio.access.log {
			roll_size 10mb
			roll_keep 5
		}
	}
}
```

### 8. Valider et recharger Caddy

```bash
caddy validate --config /etc/caddy/Caddyfile
systemctl reload caddy
```

### 9. Vérifications

```bash
# Vérifier les logs Caddy
journalctl -u caddy --since "5 min ago" | grep lumio

# Vérifier le certificat et les headers
curl -I https://lumio.wezon.fr

# Tester le SSE
curl -N https://lumio.wezon.fr/api/health

# Vérifier les conteneurs
docker compose ps
docker compose logs --tail=20 backend
```

## Mise à jour

```bash
cd /opt/lumio
git pull
docker compose up -d --build
docker compose exec backend alembic upgrade head
```

## Sauvegarde

### Manuelle

```bash
bash scripts/backup.sh
```

### Cron quotidien (recommandé)

```bash
crontab -e
# Ajouter :
0 3 * * * cd /opt/lumio && bash scripts/backup.sh >> /var/log/lumio-backup.log 2>&1
```

Les sauvegardes sont conservées 14 jours dans `./backups/`.

### Restauration

```bash
gunzip < backups/lumio_backup_YYYYMMDD_HHMMSS.sql.gz | \
  docker compose exec -T db psql -U lumio lumio
```

## Dépannage

| Problème | Commande |
|----------|----------|
| Logs backend | `docker compose logs -f backend` |
| Logs Caddy | `journalctl -u caddy -f` |
| DB inaccessible | `docker compose exec db pg_isready` |
| Certificat | `curl -vI https://lumio.wezon.fr 2>&1 \| grep certificate` |
| Recréer la base | `docker compose down -v && docker compose up -d` |
