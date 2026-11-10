#!/usr/bin/env python3
"""Business cards: 85 x 55 mm trim (European standard), 3 mm bleed on every
side, so each PDF page is 91 x 61 mm. Text stays at least 4 mm inside the
trim. Page 1 is the front (logo), page 2 the back (contact).

Edit CARD below to change the person or add a phone number, then re-run.

usage: gen_cards.py FONTS_DIR LOGO_DIR OUT_DIR WORK_DIR
"""
import os
import re
import subprocess
import sys

import pymupdf as fitz

FONTS, LOGO, OUT, WORK = (os.path.abspath(a) for a in sys.argv[1:5])

CARD = {
    "name": "Souhail Bakkali",
    "role": "Co-founder · Research &amp; Technology",
    "lines": ["sbakkali.sirajai@gmail.com", "sbakkalii.github.io/synaptyon"],
    "company": "SynaptYon SARL",
    "descriptor": "Document Intelligence, end to end",
    "slogan": "Document AI that remembers.",
}

PALETTES = {
    "blue-violet": {
        "front_bg": "#070a12", "glow_1": "rgba(47, 107, 255, 0.26)", "glow_2": "rgba(180, 60, 255, 0.16)",
        "front_ink": "#c3cbdb", "back_bg": "#ffffff", "ink": "#0a1326", "ink_2": "#33405b", "ink_3": "#536079",
        "rule": "#00c2ff, #2f6bff, #b43cff",
        "logo": "blue-violet/synaptyon-logo-on-dark.svg", "mark": "blue-violet/synaptyon-mark.svg",
    },
    "emerald-gold": {
        "front_bg": "#101411", "glow_1": "rgba(226, 173, 73, 0.2)", "glow_2": "rgba(63, 207, 130, 0.08)",
        "front_ink": "#e3dfc6", "back_bg": "#fffdf3", "ink": "#04200f", "ink_2": "#34503d", "ink_3": "#4f6a58",
        "rule": "#0f7a42, #b8860b, #8a6d0a",
        "logo": "emerald-gold/synaptyon-logo-on-dark.svg", "mark": "emerald-gold/synaptyon-mark-on-light.svg",
    },
}

CHROME = ["google-chrome", "--headless=new", "--disable-gpu", "--no-first-run",
          "--no-default-browser-check", "--allow-file-access-from-files", "--no-pdf-header-footer"]


def inline_svg(rel, prefix, css_class):
    with open(os.path.join(LOGO, rel)) as fh:
        s = fh.read()
    s = re.sub(r'id="(\w+)"', rf'id="{prefix}\1"', s)
    s = re.sub(r'url\(#(\w+)\)', rf'url(#{prefix}\1)', s)
    s = re.sub(r' width="[^"]*" height="[^"]*"', f' class="{css_class}"', s, count=1)
    return s


def font_faces():
    faces = [("Inter", 500, "Inter-500.ttf"), ("Inter", 600, "Inter-600.ttf"), ("Inter", 700, "Inter-700.ttf"),
             ("JetBrains Mono", 400, "JetBrainsMono-400.ttf"), ("Source Serif 4", 600, "SourceSerif4-600.ttf")]
    return "".join(f"@font-face{{font-family:'{f}';font-weight:{w};src:url('file://{FONTS}/{n}')}}"
                   for f, w, n in faces)


def card_html(pal):
    p = PALETTES[pal]
    lines = "".join(f"<li>{l}</li>" for l in CARD["lines"])
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>
{font_faces()}
@page {{ size: 91mm 61mm; margin: 0; }}
* {{ box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }}
html, body {{ margin: 0; }}
.page {{ position: relative; width: 91mm; height: 61mm; overflow: hidden; font-family: 'Inter'; }}
.page:not(:last-child) {{ break-after: page; }}
.front {{ background:
    radial-gradient(60mm 40mm at 78% 18%, {p['glow_1']}, transparent 70%),
    radial-gradient(50mm 34mm at 12% 96%, {p['glow_2']}, transparent 70%),
    {p['front_bg']}; }}
.front .logo {{ position: absolute; left: 50%; top: 26.6mm; width: 50mm; height: auto; transform: translate(-50%, -50%); }}
.front .slogan {{ position: absolute; left: 0; right: 0; bottom: 9.4mm; margin: 0; text-align: center;
    color: {p['front_ink']}; font: 600 7.6pt/1 'Source Serif 4'; letter-spacing: 0.01em; }}
.back {{ background: {p['back_bg']}; color: {p['ink']}; }}
.back .mark {{ position: absolute; left: 8mm; top: 8mm; width: 6.4mm; height: auto; }}
.back .co {{ position: absolute; right: 8mm; top: 9.3mm; margin: 0; color: {p['ink_3']};
    font: 600 6.4pt/1 'Inter'; letter-spacing: 0.01em; }}
.back .who {{ position: absolute; left: 8mm; top: 23.4mm; }}
.back .name {{ margin: 0; font: 700 11.5pt/1.1 'Inter'; letter-spacing: -0.01em; }}
.back .role {{ margin: 1.3mm 0 0; color: {p['ink_2']}; font: 500 6.9pt/1.2 'Inter'; }}
.back .rule {{ width: 13mm; height: 0.55mm; margin: 3.2mm 0 2.8mm; border-radius: 0.3mm;
    background: linear-gradient(90deg, {p['rule']}); }}
.back ul {{ margin: 0; padding: 0; list-style: none; font: 400 6.7pt/1.62 'JetBrains Mono'; color: {p['ink']}; }}
.back .foot {{ position: absolute; left: 8mm; bottom: 8mm; margin: 0; color: {p['ink_3']};
    font: 500 6pt/1 'Inter'; }}
</style></head><body>
<section class="page front">
  {inline_svg(p['logo'], 'f', 'logo')}
  <p class="slogan">{CARD['slogan']}</p>
</section>
<section class="page back">
  {inline_svg(p['mark'], 'b', 'mark')}
  <p class="co">{CARD['company']}</p>
  <div class="who">
    <p class="name">{CARD['name']}</p>
    <p class="role">{CARD['role']}</p>
    <div class="rule"></div>
    <ul>{lines}</ul>
  </div>
  <p class="foot">{CARD['descriptor']}</p>
</section>
</body></html>"""


def main():
    os.makedirs(OUT, exist_ok=True)
    os.makedirs(WORK, exist_ok=True)
    for pal in PALETTES:
        html = os.path.join(WORK, f"card-{pal}.html")
        with open(html, "w") as fh:
            fh.write(card_html(pal))
        pdf = os.path.join(OUT, f"synaptyon-business-card-{pal}-print.pdf")
        subprocess.run(CHROME + [f"--user-data-dir={html}.ud", f"--print-to-pdf={pdf}", f"file://{html}"],
                       check=True, capture_output=True)
        doc = fitz.open(pdf)
        assert doc.page_count == 2, (pdf, doc.page_count)
        bleed = 3 * 72 / 25.4
        full = fitz.Rect(0, 0, 91 * 72 / 25.4, 61 * 72 / 25.4)
        for page in doc:  # Chrome rounds the page to whole CSS px; set it to exactly 91 x 61 mm
            page.set_mediabox(full)
            page.set_cropbox(full)
            page.set_bleedbox(full)
            page.set_trimbox(fitz.Rect(bleed, bleed, full.x1 - bleed, full.y1 - bleed))
        doc.save(pdf + ".tmp", garbage=3, deflate=True)
        doc.close()
        os.replace(pdf + ".tmp", pdf)
        doc = fitz.open(pdf)
        for page, side in zip(doc, ("front", "back")):
            r = page.rect
            clip = fitz.Rect(r.x0 + bleed, r.y0 + bleed, r.x1 - bleed, r.y1 - bleed)
            pix = page.get_pixmap(dpi=300, clip=clip)
            pix.save(os.path.join(OUT, f"synaptyon-business-card-{pal}-{side}-preview.png"))
        print(pdf, doc.page_count, [round(v / 72 * 25.4, 2) for v in doc[0].rect[2:]])


if __name__ == "__main__":
    main()
