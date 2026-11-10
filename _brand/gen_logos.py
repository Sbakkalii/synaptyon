#!/usr/bin/env python3
"""Generate the SynaptYon logo set as SVG with the wordmark outlined.

The mark is the hexagonal S from _includes/logo.html. The wordmark is
"SynaptYon" in Inter Bold, -0.01em tracking, the Y filled with the brand
gradient, in the proportions the site header uses (mark 26 px wide, word
1.12 rem, gap 0.6 rem). Text is converted to paths, so the files look the
same in Word, Google Docs, Keynote or at a printer without Inter installed.

usage: gen_logos.py FONTS_DIR OUT_DIR
"""
import json
import math
import os
import sys

import uharfbuzz as hb
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

FONTS, OUT = sys.argv[1], sys.argv[2]

MARK_W, MARK_H = 1236, 1484
MARK_PATHS = [
    "M5 383 L617 5 L1228 383 L1228 555 L617 178 L148 465 L148 630 L680 972 L590 1077 L30 728 L5 720 Z",
    "M637 458 L1228 820 L1228 1150 L680 1478 L680 1310 L1083 1065 L1083 905 L550 565 Z",
    "M5 975 L548 1310 L548 1478 L5 1150 Z",
]

# Site header proportions, in mark units (mark height 1484 = 31.2 px).
U = MARK_H / (26 * MARK_H / MARK_W)
WORD_SIZE = 1.12 * 16 * U
WORD_GAP = 0.6 * 16 * U
WORD_TRACK = -0.01
TAG_TEXT = "DOCUMENT INTELLIGENCE"
TAG_TRACK = 0.16

# Display size written into width/height: the mark is 160 px tall everywhere.
PX = 160 / MARK_H

PALETTES = {
    "blue-violet": {
        "mark": {"dark": ("#00c8ff", "#2f62ff", "#c83cff"), "light": ("#00c8ff", "#2f62ff", "#c83cff")},
        "y": {"dark": ("#00c8ff", "#2f62ff", "#c83cff"), "light": ("#00c8ff", "#2f62ff", "#c83cff")},
        "ink": {"dark": "#eef2fa", "light": "#0a1326"},
        "tag": {"dark": "#c3cbdb", "light": "#33405b"},
    },
    "emerald-gold": {
        "mark": {"dark": ("#f6cd60", "#e2ad49", "#c38a30"), "light": ("#d4a017", "#b8860b", "#8a6200")},
        "y": {"dark": ("#3fcf82", "#e2ad49", "#f6cd60"), "light": ("#0f7a42", "#b8860b", "#8a6d0a")},
        "ink": {"dark": "#f5f0dc", "light": "#04200f"},
        "tag": {"dark": "#e3dfc6", "light": "#34503d"},
    },
}


def num(v):
    s = f"{v:.1f}"
    return s[:-2] if s.endswith(".0") else s


class Font:
    def __init__(self, name):
        path = os.path.join(FONTS, name)
        self.tt = TTFont(path)
        self.gs = self.tt.getGlyphSet()
        self.upm = self.tt["head"].unitsPerEm
        self.cap = self.tt["OS/2"].sCapHeight
        self.asc = self.tt["hhea"].ascent
        self.desc = self.tt["hhea"].descent
        self.hb = hb.Font(hb.Face(hb.Blob.from_file_path(path)))

    def shape(self, text, size, track=0.0):
        buf = hb.Buffer()
        buf.add_str(text)
        buf.guess_segment_properties()
        hb.shape(self.hb, buf, {"kern": True, "liga": True})
        s = size / self.upm
        x, out = 0.0, []
        infos, poss = buf.glyph_infos, buf.glyph_positions
        for i, (info, pos) in enumerate(zip(infos, poss)):
            name = self.tt.getGlyphName(info.codepoint)
            m = (s, 0, 0, -s, x + pos.x_offset * s, -pos.y_offset * s)
            pen = SVGPathPen(self.gs, ntos=num)
            self.gs[name].draw(TransformPen(pen, m))
            bp = BoundsPen(self.gs)
            self.gs[name].draw(TransformPen(bp, m))
            out.append({"d": pen.getCommands(), "b": bp.bounds, "x": x, "adv": pos.x_advance * s})
            x += pos.x_advance * s
            if i < len(infos) - 1:
                x += track * size
        inked = [g["b"] for g in out if g["b"]]
        bounds = (min(b[0] for b in inked), min(b[1] for b in inked),
                  max(b[2] for b in inked), max(b[3] for b in inked))
        return {"glyphs": out, "bounds": bounds, "cap": self.cap * s,
                "asc": self.asc * s, "desc": self.desc * s}


BOLD = Font("Inter-700.ttf")
SEMI = Font("Inter-600.ttf")


def css_angle_vector(x0, y0, x1, y1, deg=118):
    """End points of a CSS linear-gradient(deg) over the box (x0,y0)-(x1,y1)."""
    w, h = x1 - x0, y1 - y0
    t = math.radians(deg)
    dx, dy = math.sin(t), -math.cos(t)
    half = (abs(w * dx) + abs(h * dy)) / 2
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    return cx - dx * half, cy - dy * half, cx + dx * half, cy + dy * half


def stops(c):
    return "".join(f'<stop offset="{o}" stop-color="{col}"/>' for o, col in zip(("0", "0.5", "1"), c))


def mark_svg(fill_ref):
    return f'<g fill="{fill_ref}">' + "".join(f'<path d="{d}"/>' for d in MARK_PATHS) + "</g>"


def mark_grad(gid, colors):
    return (f'<linearGradient id="{gid}" x1="0" y1="0" x2="{MARK_W}" y2="{MARK_H}" '
            f'gradientUnits="userSpaceOnUse">{stops(colors)}</linearGradient>')


def wrap(vb, body, title):
    x, y, w, h = vb
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{num(x)} {num(y)} {num(w)} {num(h)}" '
            f'width="{num(w * PX)}" height="{num(h * PX)}" role="img" aria-label="{title}">'
            f'<title>{title}</title>{body}</svg>\n')


def build(kind, palette=None, bg="light", mono=None):
    """kind: mark | logo | tagline. palette name, bg dark|light, or mono colour."""
    defs, body = [], []
    if mono:
        mark_fill = ink = y_fill = tag = mono
    else:
        p = PALETTES[palette]
        defs.append(mark_grad("m", p["mark"][bg]))
        mark_fill, ink, tag = "url(#m)", p["ink"][bg], p["tag"][bg]
        y_fill = "url(#y)"
    body.append(mark_svg(mark_fill))
    if kind == "mark":
        return wrap((0, 0, MARK_W, MARK_H), f"<defs>{''.join(defs)}</defs>{''.join(body)}" if defs else "".join(body),
                    "SynaptYon")

    word = BOLD.shape("SynaptYon", WORD_SIZE, WORD_TRACK)
    wx = MARK_W + WORD_GAP
    cap = word["cap"]
    if kind == "logo":
        by = MARK_H / 2 + cap / 2
    else:
        tag_unit = SEMI.shape(TAG_TEXT, 1000, TAG_TRACK)
        wb = word["bounds"]
        tb = tag_unit["bounds"]
        tsize = 1000 * (wb[2] - wb[0]) / (tb[2] - tb[0])
        tagw = SEMI.shape(TAG_TEXT, tsize, TAG_TRACK)
        gap = 0.62 * cap
        group = cap + gap + tagw["cap"]
        by = MARK_H / 2 - group / 2 + cap
        tby = by + gap + tagw["cap"]
        tx = wx + wb[0] - tagw["bounds"][0]
        body.append(f'<g transform="translate({num(tx)} {num(tby)})" fill="{tag}">'
                    + "".join(f'<path d="{g["d"]}"/>' for g in tagw["glyphs"] if g["d"]) + "</g>")

    glyphs = word["glyphs"]
    yg = glyphs[6]  # the Y of SynaptYon
    if not mono:
        x0, y0, x1, y1 = css_angle_vector(yg["x"], -word["asc"], yg["x"] + yg["adv"], -word["desc"])
        defs.append(f'<linearGradient id="y" x1="{num(x0)}" y1="{num(y0)}" x2="{num(x1)}" y2="{num(y1)}" '
                    f'gradientUnits="userSpaceOnUse">{stops(PALETTES[palette]["y"][bg])}</linearGradient>')
    rest = "".join(f'<path d="{g["d"]}"/>' for i, g in enumerate(glyphs) if i != 6 and g["d"])
    body.append(f'<g transform="translate({num(wx)} {num(by)})"><g fill="{ink}">{rest}</g>'
                f'<path fill="{y_fill}" d="{yg["d"]}"/></g>')
    right = wx + word["bounds"][2] + 8
    out = f"<defs>{''.join(defs)}</defs>" if defs else ""
    return wrap((0, 0, right, MARK_H), out + "".join(body), "SynaptYon")


def write(rel, svg, manifest):
    path = os.path.join(OUT, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as fh:
        fh.write(svg)
    manifest.append(rel)


def main():
    manifest = []
    for pal in PALETTES:
        if pal == "blue-violet":
            write(f"{pal}/synaptyon-mark.svg", build("mark", pal, "dark"), manifest)
        else:
            write(f"{pal}/synaptyon-mark-on-dark.svg", build("mark", pal, "dark"), manifest)
            write(f"{pal}/synaptyon-mark-on-light.svg", build("mark", pal, "light"), manifest)
        for bg in ("light", "dark"):
            write(f"{pal}/synaptyon-logo-on-{bg}.svg", build("logo", pal, bg), manifest)
            write(f"{pal}/synaptyon-logo-tagline-on-{bg}.svg", build("tagline", pal, bg), manifest)
    for name, col in (("black", "#000000"), ("white", "#ffffff")):
        write(f"one-colour/synaptyon-mark-{name}.svg", build("mark", mono=col), manifest)
        write(f"one-colour/synaptyon-logo-{name}.svg", build("logo", mono=col), manifest)
        write(f"one-colour/synaptyon-logo-tagline-{name}.svg", build("tagline", mono=col), manifest)
    with open(os.path.join(OUT, "manifest.json"), "w") as fh:
        json.dump(manifest, fh, indent=1)
    print("\n".join(manifest))


if __name__ == "__main__":
    main()
