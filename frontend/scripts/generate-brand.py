#!/usr/bin/env python3
"""Génère le wordmark vectoriel du logo Lumio (public/brand/lumio-logo.svg).

Le texte « Lumio » est converti en chemins SVG à partir de la police Lexend
variable (wght=700, OFL 1.1, auto-hébergée dans public/fonts/), via fontTools.
L'icône (étincelle sur tuile indigo) est écrite à la main dans lumio-icon.svg.
"""
import os
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen

HERE = os.path.dirname(os.path.abspath(__file__))
FONT = os.path.join(HERE, "..", "public", "fonts", "lexend-var.woff2")
OUT = os.path.join(HERE, "..", "public", "brand")
os.makedirs(OUT, exist_ok=True)

TMP = "/tmp/lexend-bold.ttf"
font = TTFont(FONT)
instantiateVariableFont(font, {"wght": 700}, inplace=True)
font.save(TMP)
font = TTFont(TMP)
upm = font["head"].unitsPerEm
glyph_set = font.getGlyphSet()
cmap = font.getBestCmap()
hmtx = font["hmtx"]

TEXT = "Lumio"
CAP = 700  # hauteur de capitale en unités font
scale = CAP / upm

paths = []
x = 0.0
for ch in TEXT:
    gname = cmap[ord(ch)]
    pen = SVGPathPen(glyph_set)
    glyph_set[gname].draw(pen)
    d = pen.getCommands()
    if d:
        paths.append(f'<path transform="translate({x:.1f},0)" d="{d}"/>')
    x += hmtx[gname][0]
width = x
height = CAP + 0.22 * CAP  # petit débordement pour les descendantes éventuelles

wordmark = (
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width:.0f} {height:.0f}" '
    f'width="{width:.0f}" height="{height:.0f}">'
    f'<g transform="scale({scale:.6f},{-scale:.6f}) translate(0,{-upm * 0.78:.1f})" fill="#1C2333">'
    + "".join(paths)
    + "</g></svg>"
)
with open(os.path.join(OUT, "lumio-wordmark.svg"), "w") as f:
    f.write(wordmark)
print("wordmark:", os.path.join(OUT, "lumio-wordmark.svg"), f"viewBox 0 0 {width:.0f} {height:.0f}")

# --- Icône seule (écrite à la main) : tuile indigo + étincelle ambre ---
ICON = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96">
  <rect width="96" height="96" rx="22" fill="#4F46E5"/>
  <path d="M48 20 L55 41 L76 48 L55 55 L48 76 L41 55 L20 48 L41 41 Z" fill="#FBBF24"/>
  <path d="M67 20 L68.9 26.6 L75.5 28.5 L68.9 30.4 L67 37 L65.1 30.4 L58.5 28.5 L65.1 26.6 Z" fill="#FFFFFF" opacity="0.92"/>
</svg>
"""
with open(os.path.join(OUT, "lumio-icon.svg"), "w") as f:
    f.write(ICON)
print("icon:", os.path.join(OUT, "lumio-icon.svg"))

# --- Logo horizontal : icône + wordmark vectorisé ---
ICON_SIZE = 96
WM_H = 58  # hauteur du wordmark dans le logo
s = WM_H / height
wm_w = width * s
x0 = ICON_SIZE + 18
total_w = x0 + wm_w
inner = "".join(paths).replace("<path ", "<path ")
logo = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {total_w:.0f} 96" width="{total_w:.0f}" height="96">
  <rect width="96" height="96" rx="22" fill="#4F46E5"/>
  <path d="M48 20 L55 41 L76 48 L55 55 L48 76 L41 55 L20 48 L41 41 Z" fill="#FBBF24"/>
  <path d="M67 20 L68.9 26.6 L75.5 28.5 L68.9 30.4 L67 37 L65.1 30.4 L58.5 28.5 L65.1 26.6 Z" fill="#FFFFFF" opacity="0.92"/>
  <g transform="translate({x0:.1f},{(96 - WM_H) / 2:.1f}) scale({s:.6f},{-s:.6f}) translate(0,{-upm * 0.78:.1f})" fill="#1C2333">
    {inner}
  </g>
</svg>
"""
with open(os.path.join(OUT, "lumio-logo.svg"), "w") as f:
    f.write(logo)
print("logo:", os.path.join(OUT, "lumio-logo.svg"), f"viewBox 0 0 {total_w:.0f} 96")
