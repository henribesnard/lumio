#!/usr/bin/env python3
"""Génère les 12 avatars originaux de Lumio (public/avatars/avatar-01..12.svg).

Identité « Prisme » : un disque aux couleurs du spectre (soleil, ciel, menthe,
corail, lavande, prisme) et une forme géométrique à l'encre, comme dans le
design (Léa : triangle sur soleil ; Noah : carré tourné sur ciel).
viewBox 0 0 52 52, pas de texte, pas de visage, pas d'emoji.
Usage : python3 scripts/generate-avatars.py
"""

import os

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "avatars")
os.makedirs(OUT, exist_ok=True)

INK = "#18132B"
WHITE = "#FFFFFF"
SUN, SKY, MINT, CORAL, LAVENDER, PRISM = (
    "#FFC53D",
    "#4C9BFF",
    "#4FD1A5",
    "#FF9A7F",
    "#B7AEE0",
    "#7A62F0",
)

# (fond, forme, couleur de la forme)
AVATARS = [
    (SUN, '<path d="M26 10 L40 36 H12 Z"/>', INK),  # 01 triangle
    (SKY, '<rect x="15" y="15" width="22" height="22" rx="4" transform="rotate(12 26 26)"/>', INK),
    (MINT, '<circle cx="26" cy="26" r="11"/>', INK),  # 03 rond
    (CORAL, '<path d="M26 11 L41 26 L26 41 L11 26 Z"/>', INK),  # 04 losange
    (LAVENDER, '<path d="M12 33 A14 14 0 0 1 40 33 Z"/>', INK),  # 05 demi-lune
    (PRISM, '<path d="M26 10 L30 22 L42 26 L30 30 L26 42 L22 30 L10 26 L22 22 Z"/>', WHITE),
    (SUN, '<path d="M26 11 L39 18.5 V33.5 L26 41 L13 33.5 V18.5 Z"/>', INK),  # 07 hexagone
    (SKY, '<path d="M21 12 H31 V21 H40 V31 H31 V40 H21 V31 H12 V21 H21 Z"/>', INK),  # 08 croix
    (MINT, '<circle cx="26" cy="26" r="12" fill="none" stroke-width="6"/>', INK),  # 09 anneau
    (CORAL, '<path d="M13 40 V26 A13 13 0 0 1 39 26 V40 H31 V27 A5 5 0 0 0 21 27 V40 Z"/>', INK),
    (LAVENDER, '<g><rect x="12" y="15" width="28" height="6" rx="3"/><rect x="12" y="23" width="28" height="6" rx="3"/><rect x="12" y="31" width="28" height="6" rx="3"/></g>', INK),
    (PRISM, '<path d="M26 11 L39 38 H13 Z"/><path d="M26 11 L39 38 H26 Z" opacity="0.7"/>', WHITE),
]

for i, (bg, shape, fg) in enumerate(AVATARS, start=1):
    attr = f'stroke="{fg}"' if 'fill="none"' in shape else f'fill="{fg}"'
    svg = (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52" width="52" height="52">'
        f'<circle cx="26" cy="26" r="26" fill="{bg}"/>'
        f"<g {attr}>{shape}</g></svg>\n"
    )
    with open(os.path.join(OUT, f"avatar-{i:02d}.svg"), "w") as f:
        f.write(svg)
print("12 avatars générés dans", OUT)
