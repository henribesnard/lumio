#!/usr/bin/env python3
"""Génère les assets de marque Lumio « Prisme » dans public/brand/.

- lumio-icon.svg      : prisme + 3 rayons (soleil, menthe, ciel) sur tuile « Lait »
- lumio-wordmark.svg  : « lumio » en Unbounded 800 vectorisé (OFL 1.1)
- lumio-logo.svg      : prisme + wordmark (horizontal)
- lumio-logo-dark.svg : idem, encre claire pour fonds sombres
- mascot.svg          : mascotte « Lumio, le prisme », état Écoute

Le texte est converti en chemins SVG depuis public/fonts/unbounded-var.woff2
(fontTools + brotli) : rendu identique partout, aucune police requise.
Usage : python3 scripts/generate-brand.py
"""

import os
import tempfile

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

HERE = os.path.dirname(os.path.abspath(__file__))
FONT = os.path.join(HERE, "..", "public", "fonts", "unbounded-var.woff2")
OUT = os.path.join(HERE, "..", "public", "brand")
os.makedirs(OUT, exist_ok=True)

INK = "#18132B"
INK_DARK = "#F1EEFA"
PRISM_DARK = "#5B3FD9"
PRISM_LIGHT = "#7A62F0"
SUN, MINT, SKY = "#FFC53D", "#12A37A", "#4C9BFF"
MILK = "#F6F5FB"

# Prisme (viewBox 0 0 120 120) — repris tel quel du design « Prisme ».
PRISM = (
    f'<path d="M56 14 Q60 10 64 14 L100 86 Q104 96 94 96 H26 Q16 96 20 86 Z" fill="{PRISM_DARK}"/>'
    f'<path d="M60 13 Q62 12 64 14 L100 86 Q104 96 94 96 H60 Z" fill="{PRISM_LIGHT}"/>'
)
RAYS = (
    '<g stroke-width="6" stroke-linecap="round">'
    f'<path d="M96 54 L116 44" stroke="{SUN}"/>'
    f'<path d="M100 64 L118 64" stroke="{MINT}"/>'
    f'<path d="M96 74 L116 84" stroke="{SKY}"/>'
    "</g>"
)

# --- wordmark vectorisé ---
font = TTFont(FONT)
instantiateVariableFont(font, {"wght": 800}, inplace=True)
with tempfile.NamedTemporaryFile(suffix=".ttf", delete=False) as tmp:
    font.save(tmp.name)
    font = TTFont(tmp.name)
upm = font["head"].unitsPerEm
glyph_set = font.getGlyphSet()
cmap = font.getBestCmap()
hmtx = font["hmtx"]

TEXT = "lumio"
TRACK = -0.035 * upm  # letter-spacing -2px à 58px dans le design
paths = []
x = 0.0
for ch in TEXT:
    gname = cmap[ord(ch)]
    pen = SVGPathPen(glyph_set)
    glyph_set[gname].draw(pen)
    d = pen.getCommands()
    if d:
        paths.append(f'<path transform="translate({x:.1f},0)" d="{d}"/>')
    x += hmtx[gname][0] + TRACK
width = x - TRACK
ASC = 0.80 * upm  # haut des ascendantes (l, i)
height = ASC + 0.04 * upm


def wordmark_group(tx: float, ty: float, s: float, fill: str) -> str:
    return (
        f'<g transform="translate({tx:.1f},{ty:.1f}) scale({s:.6f},{-s:.6f}) '
        f'translate(0,{-ASC:.1f})" fill="{fill}">' + "".join(paths) + "</g>"
    )


wm_svg = (
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width:.0f} {height:.0f}" '
    f'width="{width:.0f}" height="{height:.0f}">' + wordmark_group(0, 0, 1, INK) + "</svg>\n"
)
with open(os.path.join(OUT, "lumio-wordmark.svg"), "w") as f:
    f.write(wm_svg)

# --- icône : tuile Lait arrondie + prisme + rayons ---
ICON = (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">'
    f'<rect width="120" height="120" rx="28" fill="{MILK}"/>'
    f'<g transform="translate(-4 4)">{RAYS}{PRISM}</g>'
    "</svg>\n"
)
with open(os.path.join(OUT, "lumio-icon.svg"), "w") as f:
    f.write(ICON)


# --- logo horizontal ---
def logo(ink: str) -> str:
    wm_h = 62
    s = wm_h / height
    x0 = 132
    total_w = x0 + width * s
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {total_w:.0f} 120" '
        f'width="{total_w:.0f}" height="120">'
        f"{RAYS}{PRISM}"
        + wordmark_group(x0, (120 - wm_h) / 2 + 4, s, ink)
        + "</svg>\n"
    )


with open(os.path.join(OUT, "lumio-logo.svg"), "w") as f:
    f.write(logo(INK))
with open(os.path.join(OUT, "lumio-logo-dark.svg"), "w") as f:
    f.write(logo(INK_DARK))

# --- mascotte (état Écoute) ---
MASCOT = (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">'
    + PRISM
    + '<circle cx="50" cy="66" r="7" fill="#FFFFFF"/><circle cx="70" cy="66" r="7" fill="#FFFFFF"/>'
    f'<circle cx="50" cy="67" r="3.5" fill="{INK}"/><circle cx="70" cy="67" r="3.5" fill="{INK}"/>'
    '<path d="M53 80 Q60 85 67 80" fill="none" stroke="#FFFFFF" stroke-width="3.5" '
    'stroke-linecap="round"/></svg>\n'
)
with open(os.path.join(OUT, "mascot.svg"), "w") as f:
    f.write(MASCOT)

print("Assets de marque générés dans", OUT)
