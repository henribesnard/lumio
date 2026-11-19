"""CLI commands for Lumio (admin creation, openapi export, etc.)."""

from __future__ import annotations

import asyncio
import getpass
import json
import sys

from app.auth.passwords import hash_password, validate_admin_password
from app.config import get_settings


def create_admin() -> None:
    """Create the admin account interactively."""
    settings = get_settings()

    print("=== Création du compte administrateur Lumio ===\n")
    email = input("Email : ").strip()
    if not email or "@" not in email:
        print("Email invalide.")
        sys.exit(1)

    password = getpass.getpass("Mot de passe (≥ 12 caractères) : ")
    error = validate_admin_password(password)
    if error:
        print(f"Erreur : {error}")
        sys.exit(1)

    confirm = getpass.getpass("Confirmer le mot de passe : ")
    if password != confirm:
        print("Les mots de passe ne correspondent pas.")
        sys.exit(1)

    async def _create():
        from app.db.session import async_session
        from app.db.models import Admin
        from sqlalchemy import select

        async with async_session() as db:
            # Check if admin already exists
            result = await db.execute(select(Admin).where(Admin.email == email))
            if result.scalar_one_or_none():
                print(f"Un administrateur avec l'email {email} existe déjà.")
                sys.exit(1)

            admin = Admin(
                email=email,
                password_hash=hash_password(password),
            )
            db.add(admin)
            await db.commit()
            print(f"\nAdministrateur créé : {email}")
            print("Connectez-vous sur /admin/login")

    asyncio.run(_create())


def export_openapi() -> None:
    """Export the OpenAPI schema to stdout."""
    from app.main import app

    schema = app.openapi()
    print(json.dumps(schema, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python -m app.cli <command>")
        print("Commands: create-admin, export-openapi")
        sys.exit(1)

    command = sys.argv[1]
    if command == "create-admin":
        create_admin()
    elif command == "export-openapi":
        export_openapi()
    else:
        print(f"Commande inconnue : {command}")
        sys.exit(1)
