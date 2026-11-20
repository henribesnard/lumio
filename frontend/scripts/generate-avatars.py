#!/usr/bin/env python3
"""Génère les 12 avatars originaux de Lumio (public/avatars/avatar-01..12.svg).

Formes géométriques simples, originales, cohérentes avec la piste « Brume » :
chaque avatar = une silhouette colorée sur un disque de teinte claire, avec un
visage minimal (2 yeux + sourire). viewBox 0 0 64 64, pas de texte, pas d'emoji.
"""
import os

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "avatars")
os.makedirs(OUT, exist_ok=True)

INK = "#1C2333"

def tint(hex_color, ratio=0.82):
    c = hex_color.lstrip("#")
    r, g, b = (int(c[i:i+2], 16) for i in (0, 2, 4))
    f = lambda v: round(v + (255 - v) * ratio)
    return "#%02X%02X%02X" % (f(r), f(g), f(b))

# (couleur, forme svg centrée, nom)
SHAPES = [
    ("#4F46E5", '<circle cx="32" cy="34" r="22"/>'),
    ("#0E7490", '<rect x="12" y="14" width="40" height="40" rx="12"/>'),
    ("#D97706", '<path d="M32 12 L54 50 L10 50 Z"/>'),
    ("#DB2777", '<path d="M32 12 L51 25 L43 48 L21 48 L13 25 Z"/>'),
    ("#15803D", '<path d="M32 12 L52 32 L32 52 L12 32 Z"/>'),
    ("#7C3AED", '<path d="M32 10 L38.5 25.5 L54 32 L38.5 38.5 L32 54 L25.5 38.5 L10 32 L25.5 25.5 Z"/>'),
    ("#B45309", '<path d="M32 12 C44 12 52 22 52 33 C52 45 43 54 32 54 C21 54 12 45 12 33 C12 22 20 12 32 12 Z"/>'),
    ("#0D9488", '<path d="M32 10 C40 10 46 18 46 26 C46 30 44 33 42 35 L42 48 C42 52 38 55 32 55 C26 55 22 52 22 48 L22 35 C20 33 18 30 18 26 C18 18 24 10 32 10 Z"/>'),
    ("#EA580C", '<rect x="14" y="20" width="36" height="30" rx="15"/>'),
    ("#2563EB", '<path d="M14 44 C14 26 22 14 32 14 C42 14 50 26 50 44 Z"/>'),
    ("#65A30D", '<path d="M20 14 H44 L52 30 L44 50 H20 L12 30 Z"/>'),
    ("#9333EA", '<rect x="16" y="18" width="32" height="32" rx="8"/><line x1="26" y1="18" x2="22" y2="9" stroke="{c}" stroke-width="3" stroke-linecap="round"/><line x1="38" y1="18" x2="42" y2="9" stroke="{c}" stroke-width="3" stroke-linecap="round"/><circle cx="22" cy="8" r="2.6" fill="{c}"/><circle cx="42" cy="8" r="2.6" fill="{c}"/>'),
]

FACE = (
    '<circle cx="25.5" cy="30" r="4.2" fill="#FFFFFF"/>'
    '<circle cx="38.5" cy="30" r="4.2" fill="#FFFFFF"/>'
    f'<circle cx="26.6" cy="31" r="2.1" fill="{INK}"/>'
    f'<circle cx="39.6" cy="31" r="2.1" fill="{INK}"/>'
    '<path d="M25 39 Q32 46 39 39" stroke="#FFFFFF" stroke-width="3" fill="none" stroke-linecap="round"/>'
)

for i, (color, shape) in enumerate(SHAPES, start=1):
    shape = shape.replace("{c}", color)
    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <circle cx="32" cy="32" r="30" fill="{tint(color)}"/>
  <g fill="{color}">{shape}</g>
  {FACE}
</svg>
"""
    with open(os.path.join(OUT, f"avatar-{i:02d}.svg"), "w") as f:
        f.write(svg)
    print(f"avatar-{i:02d}.svg", color)
