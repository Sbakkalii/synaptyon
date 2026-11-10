#!/usr/bin/env python3
"""SynaptYon brand guide: A4 landscape PDF, built from the generated logo
files and business-card previews.

usage: gen_guide.py FONTS_DIR KIT_DIR WORK_DIR
"""
import itertools
import os
import re
import subprocess
import sys

from PIL import Image, ImageCms

FONTS, KIT, WORK = (os.path.abspath(a) for a in sys.argv[1:4])
LOGO = os.path.join(KIT, "logo")
CARDS = os.path.join(KIT, "business-cards")
EDITION = "November 2026"
_ids = itertools.count(1)

# Color conversion for coated paper (FOGRA39, the European standard).
_SRGB = ImageCms.createProfile("sRGB")
_CMYK = ImageCms.getOpenProfile("/usr/share/color/icc/colord/FOGRA39L_coated.icc")
_T = ImageCms.buildTransform(_SRGB, _CMYK, "RGB", "CMYK", renderingIntent=1,
                             flags=ImageCms.Flags.BLACKPOINTCOMPENSATION)


def rgb(hexv):
    return tuple(int(hexv[i:i + 2], 16) for i in (1, 3, 5))


def cmyk(hexv):
    px = ImageCms.applyTransform(Image.new("RGB", (1, 1), rgb(hexv)), _T).getpixel((0, 0))
    return " ".join(str(round(v / 2.55)) for v in px)


def lum(hexv):
    def ch(c):
        c /= 255
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = (ch(c) for c in rgb(hexv))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def svg(rel, cls="", style=""):
    """Inline a logo SVG with ids made unique, sized by CSS."""
    p = f"g{next(_ids)}"
    with open(os.path.join(LOGO, rel)) as fh:
        s = fh.read()
    s = re.sub(r'id="(\w+)"', rf'id="{p}\1"', s)
    s = re.sub(r'url\(#(\w+)\)', rf'url(#{p}\1)', s)
    s = re.sub(r' width="[^"]*" height="[^"]*"', f' class="{cls}" style="{style}"', s, count=1)
    return s


def vb_ratio(rel):
    with open(os.path.join(LOGO, rel)) as fh:
        _, _, w, h = map(float, re.search(r'viewBox="([\d.\- ]+)"', fh.read()).group(1).split())
    return w, h


def font_faces():
    faces = [("Inter", 400, "Inter-400.ttf"), ("Inter", 500, "Inter-500.ttf"), ("Inter", 600, "Inter-600.ttf"),
             ("Inter", 700, "Inter-700.ttf"), ("JetBrains Mono", 400, "JetBrainsMono-400.ttf"),
             ("JetBrains Mono", 500, "JetBrainsMono-500.ttf"), ("Source Serif 4", 400, "SourceSerif4-400.ttf"),
             ("Source Serif 4", 600, "SourceSerif4-600.ttf")]
    return "".join(f"@font-face{{font-family:'{f}';font-weight:{w};src:url('file://{FONTS}/{n}')}}"
                   for f, w, n in faces)


BLUE = [
    ("Cyan", "#00C8FF", "Logo gradient, start"),
    ("Blue", "#2F62FF", "Logo gradient, middle"),
    ("Violet", "#C83CFF", "Logo gradient, end"),
    ("Link blue", "#1D56DC", "Links and highlights on white"),
    ("Night", "#070A12", "Dark backgrounds, card fronts"),
    ("Ink", "#0A1326", "Text on white and light paper"),
    ("Slate", "#33405B", "Secondary text, captions"),
    ("Cloud", "#EEF2FA", "Text on dark; light backgrounds, table rows"),
]
GOLD = [
    ("Light gold", "#F6CD60", "Mark gradient on dark, start"),
    ("Gold", "#E2AD49", "Mark gradient on dark, middle"),
    ("Bronze", "#C38A30", "Mark gradient on dark, end"),
    ("Deep gold", "#B8860B", "Mark and accents on light paper"),
    ("Emerald", "#0F7A42", "Headings and accents on light paper"),
    ("Bright emerald", "#3FCF82", "Accents on dark backgrounds"),
    ("Graphite", "#101411", "Dark backgrounds, card fronts"),
    ("Forest ink", "#04200F", "Text on light paper"),
    ("Moss", "#34503D", "Secondary text, captions"),
    ("Cream", "#F3F0DC", "Light backgrounds, card backs"),
]


def swatches(cols):
    out = []
    for name, hexv, use in cols:
        ink = "#ffffff" if lum(hexv) < 0.36 else "#0a1326"
        r, g, b = rgb(hexv)
        out.append(f"""<div class="sw"><div class="sw__chip" style="background:{hexv};color:{ink}">
<b>{name}</b></div><dl><dt>HEX</dt><dd>{hexv}</dd><dt>RGB</dt><dd>{r} {g} {b}</dd>
<dt>CMYK</dt><dd>{cmyk(hexv)}</dd></dl><p>{use}</p></div>""")
    return "".join(out)


def foot(n):
    return f'<div class="foot"><span>SynaptYon brand guide · {EDITION}</span><span>{n:02d}</span></div>'


def tile(rel, bg, caption, fname, width="74%"):
    return (f'<figure class="tile"><div class="tile__box" style="background:{bg}">'
            f'{svg(rel, "tile__logo", f"width:{width}")}</div>'
            f'<figcaption><b>{caption}</b><code>{fname}</code></figcaption></figure>')


def dont(inner, bg, caption):
    return (f'<figure class="tile dont"><div class="tile__box" style="background:{bg}">{inner}</div>'
            f'<figcaption><b><span class="x">✕</span> {caption}</b></figcaption></figure>')


def card_img(name):
    return f'<img class="card" src="file://{CARDS}/{name}" alt="">'


def build():
    lw, lh = vb_ratio("blue-violet/synaptyon-logo-on-light.svg")
    cap_units = 1490 / 2048 * (1.12 * 16 * 1236 / 26)
    big_w = 132.0
    x_mm = cap_units / lw * big_w
    big_h = lh / lw * big_w

    css = f"""{font_faces()}
@page {{ size: 297mm 210mm; margin: 0; }}
* {{ box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }}
html, body {{ margin: 0; }}
body {{ font-family: 'Inter'; color: #0a1326; }}
.pg {{ position: relative; width: 297mm; height: 210mm; overflow: hidden; padding: 17mm 20mm 18mm; background: #fff; }}
.pg:not(:last-child) {{ break-after: page; }}
.kicker {{ margin: 0 0 3mm; color: #536079; font: 500 7.6pt/1 'JetBrains Mono'; letter-spacing: .14em; text-transform: uppercase; }}
h2 {{ margin: 0 0 7mm; font: 600 24pt/1.08 'Source Serif 4'; letter-spacing: -0.005em; }}
h3 {{ margin: 0 0 2mm; font: 700 10.5pt/1.3 'Inter'; }}
p, li {{ margin: 0 0 2.6mm; color: #33405b; font: 400 9.2pt/1.5 'Inter'; }}
code {{ font: 400 7.4pt/1.3 'JetBrains Mono'; color: #536079; }}
b {{ font-weight: 600; color: #0a1326; }}
.foot {{ position: absolute; left: 20mm; right: 20mm; bottom: 9mm; display: flex; justify-content: space-between;
  padding-top: 2.6mm; border-top: 0.25mm solid #d5dcea; color: #78849d; font: 400 6.8pt/1 'JetBrains Mono'; letter-spacing: .04em; }}
.cols {{ display: grid; grid-template-columns: 1fr 1fr; gap: 14mm; }}
.grad {{ background: linear-gradient(118deg, #00C8FF 0%, #2F62FF 50%, #C83CFF 100%); }}

/* cover */
.cover {{ background:
  radial-gradient(160mm 110mm at 82% 12%, rgba(47, 98, 255, .30), transparent 70%),
  radial-gradient(120mm 90mm at 8% 100%, rgba(200, 60, 255, .18), transparent 70%), #070a12; color: #eef2fa; }}
.cover .kicker {{ color: #8f9bb4; }}
.cover__logo {{ position: absolute; left: 20mm; top: 64mm; width: 168mm; height: auto; }}
.cover__title {{ position: absolute; left: 20mm; top: 20mm; }}
.cover__title h1 {{ margin: 0; color: #eef2fa; font: 600 12pt/1 'Inter'; letter-spacing: .01em; }}
.cover__slogan {{ position: absolute; left: 20mm; bottom: 22mm; margin: 0; color: #eef2fa; font: 600 26pt/1.1 'Source Serif 4'; }}
.cover__meta {{ position: absolute; right: 20mm; bottom: 22mm; text-align: right; color: #8f9bb4; font: 400 7.6pt/1.7 'JetBrains Mono'; }}
.cover__bar {{ position: absolute; left: 20mm; bottom: 15mm; width: 24mm; height: 1.1mm; border-radius: .6mm; }}

/* name page */
.wrong {{ display: flex; flex-wrap: wrap; gap: 2mm 5mm; margin: 1mm 0 5mm; }}
.wrong span {{ color: #b42318; font: 500 9pt/1.4 'Inter'; text-decoration: line-through; }}
.right {{ display: inline-block; margin: 1mm 0 5mm; font: 700 16pt/1 'Inter'; letter-spacing: -0.01em; }}
.right i {{ font-style: normal; background: linear-gradient(118deg, #00C8FF, #2F62FF 50%, #C83CFF); -webkit-background-clip: text; background-clip: text; color: transparent; }}
.say {{ margin: 0 0 6mm; padding: 5mm 6mm; border-radius: 2.4mm; background: #f6f8fc; }}
.say q {{ display: block; quotes: none; color: #0a1326; font: 600 17pt/1.2 'Source Serif 4'; }}
.say .q2 {{ font: 600 12.5pt/1.2 'Inter'; letter-spacing: -0.005em; }}
.say .q3 {{ font: 600 9.5pt/1.2 'Inter'; letter-spacing: .16em; }}
.say p {{ margin: 2.2mm 0 0; font-size: 8.4pt; }}
.prods {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 4mm; margin-top: 2mm; }}
.prod {{ padding: 4mm; border: 0.25mm solid #d5dcea; border-radius: 2.4mm; }}
.prod span {{ color: #536079; font: 500 6.8pt/1 'JetBrains Mono'; letter-spacing: .12em; text-transform: uppercase; }}
.prod b {{ display: block; margin: 1.6mm 0 1mm; font: 700 11pt/1.1 'Inter'; }}
.prod p {{ margin: 0; font-size: 8.4pt; line-height: 1.35; }}

/* logo page */
.space {{ position: relative; width: {big_w + 2 * x_mm:.2f}mm; height: {big_h + 2 * x_mm:.2f}mm;
  background: repeating-linear-gradient(45deg, #f3f6fb 0 1.2mm, #ffffff 1.2mm 2.4mm); border: 0.3mm dashed #9aa6bd; }}
.space svg {{ position: absolute; left: {x_mm:.2f}mm; top: {x_mm:.2f}mm; width: {big_w}mm; height: {big_h:.2f}mm; background: #fff; outline: 0.2mm solid #c0cadd; }}
.space i {{ position: absolute; padding: 0 1.2mm; border-radius: 1mm; background: #e2eafd; color: #1d56dc; font: 600 7.4pt/1.6 'JetBrains Mono'; font-style: normal; transform: translate(-50%, -50%); }}
.xmark {{ display: inline-block; padding: 0 1.4mm; border-radius: 1mm; background: #e2eafd; color: #1d56dc; font: 600 7.4pt/1.6 'JetBrains Mono'; }}
.sizes {{ display: flex; align-items: flex-end; gap: 12mm; margin-top: 9mm; }}
.sizes figure {{ margin: 0; }}
.sizes figcaption {{ margin-top: 2mm; color: #536079; font: 400 7pt/1.3 'JetBrains Mono'; }}

/* tiles */
.tiles {{ display: grid; grid-template-columns: repeat(3, 1fr); gap: 6mm 7mm; }}
.tile {{ margin: 0; }}
.tile__box {{ display: grid; place-items: center; height: 46mm; border-radius: 2.4mm; border: 0.25mm solid #e1e6ef; overflow: hidden; }}
.tile__logo {{ height: auto; }}
.tile figcaption {{ margin-top: 2.2mm; }}
.tile figcaption b {{ display: block; font: 600 8.6pt/1.3 'Inter'; }}
.tile figcaption code {{ display: block; margin-top: .6mm; }}
.dont .tile__box {{ height: 42mm; }}
.dont .x {{ color: #b42318; }}

/* swatches */
.gradbar {{ display: flex; justify-content: space-between; align-items: flex-end; height: 17mm; margin-bottom: 7mm; padding: 0 4mm 3mm;
  border-radius: 2.4mm; color: #fff; font: 500 7.4pt/1 'JetBrains Mono'; }}
.sws {{ display: grid; grid-template-columns: repeat(5, 1fr); gap: 5mm 5mm; }}
.sw__chip {{ display: flex; align-items: flex-end; height: 19mm; padding: 2.6mm 3mm; border-radius: 2mm; border: 0.25mm solid rgba(10, 19, 38, .1); }}
.sw__chip b {{ color: inherit; font: 600 8.6pt/1 'Inter'; }}
.sw dl {{ display: grid; grid-template-columns: 9mm 1fr; margin: 2.2mm 0 1mm; font: 400 7pt/1.55 'JetBrains Mono'; }}
.sw dt {{ color: #78849d; }}
.sw dd {{ margin: 0; color: #0a1326; }}
.sw p {{ margin: 0; font-size: 7.4pt; line-height: 1.35; }}
.note {{ margin-top: 5mm; font-size: 7.8pt; color: #536079; }}

/* type */
.types {{ display: grid; grid-template-columns: repeat(3, 1fr); gap: 8mm; }}
.type {{ padding: 6mm; border: 0.25mm solid #d5dcea; border-radius: 2.4mm; }}
.type .aa {{ margin: 0 0 3mm; font-size: 44pt; line-height: 1; color: #0a1326; }}
.type .abc {{ margin: 0 0 4mm; color: #33405b; font-size: 9pt; line-height: 1.45; word-break: break-all; }}
.scale {{ margin-top: 7mm; display: grid; grid-template-columns: 38mm 1fr; row-gap: 3.2mm; align-items: baseline; }}
.scale span {{ color: #536079; font: 400 7.2pt/1 'JetBrains Mono'; }}

/* cards */
.cards {{ display: grid; grid-template-columns: repeat(2, 85mm); gap: 7mm 9mm; }}
.card {{ display: block; width: 85mm; height: 55mm; border-radius: 1.2mm; box-shadow: 0 0.6mm 1.6mm rgba(10, 19, 38, .14), 0 5mm 12mm -6mm rgba(10, 19, 38, .35); }}
.cardrow {{ display: grid; grid-template-columns: auto 1fr; gap: 14mm; }}
.spec {{ margin: 0; padding: 0; list-style: none; }}
.spec li {{ margin-bottom: 2.6mm; font-size: 8.6pt; }}

/* files */
table {{ width: 100%; border-collapse: collapse; font-size: 8.4pt; }}
th {{ padding: 0 3mm 2.4mm 0; text-align: left; color: #536079; font: 500 6.8pt/1 'JetBrains Mono'; letter-spacing: .12em; text-transform: uppercase; border-bottom: 0.3mm solid #c0cadd; }}
td {{ padding: 2.4mm 3mm 2.4mm 0; vertical-align: top; border-bottom: 0.25mm solid #e1e6ef; color: #33405b; line-height: 1.4; }}
td:first-child {{ width: 74mm; }}
td code {{ font-size: 7.4pt; color: #0a1326; }}
"""

    pages = []

    # 1. Cover
    pages.append(f"""<section class="pg cover">
<div class="cover__title"><p class="kicker">Brand guide</p><h1>SynaptYon SARL</h1></div>
{svg("blue-violet/synaptyon-logo-tagline-on-dark.svg", "cover__logo")}
<p class="cover__slogan">Document AI that remembers.</p>
<div class="cover__bar grad"></div>
<div class="cover__meta">Logo · Name and slogan · Colours<br>Type · Business cards · Files<br>Edition {EDITION}</div>
</section>""")

    # 2. Name and words
    pages.append(f"""<section class="pg">
<p class="kicker">01 · Name and words</p><h2>How we write our name</h2>
<div class="cols">
<div>
<h3>The name</h3>
<p>One word, a capital <b>S</b> and a capital <b>Y</b>. In running text it is set in the same font and colour as the text around it; the coloured Y belongs to the logo only.</p>
<span class="right">Synapt<i>Y</i>on</span>
<div class="wrong"><span>Synaptyon</span><span>SYNAPTYON</span><span>Synapt Yon</span><span>Synapt-Yon</span><span>SynaptYON</span></div>
<h3>The company</h3>
<p><b>SynaptYon SARL</b> in contracts, invoices, letterheads and legal footers. <b>SynaptYon</b> everywhere else.</p>
</div>
<div>
<div class="say"><q>Document AI that remembers.</q><p><b>Slogan.</b> Headlines, the front of the business card, the first slide of a deck.</p></div>
<div class="say"><q class="q2">Document Intelligence, end to end</q><p><b>Descriptor.</b> Under the name in email signatures, document footers, the website title.</p></div>
<div class="say"><q class="q3">DOCUMENT INTELLIGENCE</q><p><b>Short descriptor.</b> The line inside the logo with tagline. Always in capitals, only in that logo.</p></div>
</div>
</div>
<div style="margin-top:4mm"><h3>The four products</h3>
<div class="prods">
<div class="prod"><span>Read</span><b>Grammata</b><p>Every page, read</p></div>
<div class="prod"><span>Extract</span><b>Kleis</b><p>The data you need, from any document</p></div>
<div class="prod"><span>Ask</span><b>Sibyl</b><p>Answers you can check</p></div>
<div class="prod"><span>Remember</span><b>Mnemos</b><p>Better with every document</p></div>
</div>
</div>
{foot(2)}</section>""")

    # 3. Logo
    pages.append(f"""<section class="pg">
<p class="kicker">02 · Logo</p><h2>The logo and its space</h2>
<div class="cols" style="grid-template-columns:auto 1fr;gap:12mm">
<div>
<div class="space">{svg("blue-violet/synaptyon-logo-on-light.svg")}
<i style="left:{x_mm / 2:.2f}mm;top:{x_mm + big_h / 2:.2f}mm">x</i>
<i style="left:{x_mm * 1.5 + big_w:.2f}mm;top:{x_mm + big_h / 2:.2f}mm">x</i>
<i style="left:{x_mm + big_w / 2:.2f}mm;top:{x_mm / 2:.2f}mm">x</i>
<i style="left:{x_mm + big_w / 2:.2f}mm;top:{x_mm * 1.5 + big_h:.2f}mm">x</i>
</div>
<div class="sizes">
<figure>{svg("blue-violet/synaptyon-logo-on-light.svg", "", "width:30mm;height:auto;display:block")}<figcaption>Smallest logo<br>30 mm · 120 px</figcaption></figure>
<figure>{svg("blue-violet/synaptyon-mark.svg", "", "width:6mm;height:auto;display:block")}<figcaption>Smallest mark<br>6 mm · 24 px</figcaption></figure>
<figure>{svg("blue-violet/synaptyon-mark.svg", "", "width:16mm;height:auto;display:block")}<figcaption>The mark<br>a hexagonal S</figcaption></figure>
<figure>{svg("blue-violet/synaptyon-logo-tagline-on-light.svg", "", "width:58mm;height:auto;display:block")}<figcaption>Logo with tagline<br>from 45 mm wide</figcaption></figure>
</div>
</div>
<div>
<h3>Mark and wordmark</h3>
<p>The logo is the hexagonal S and the word SynaptYon, side by side. Keep them together; use the mark alone only where the name is already written nearby, or space is square (profile pictures, app icons, favicons).</p>
<h3>Clear space <span class="xmark">x</span></h3>
<p>Leave at least <b>x</b> free on every side, where x is the height of the capital S in the wordmark. No text, edge or picture inside that space.</p>
<h3>Size</h3>
<p>Never smaller than 30 mm wide in print or 120 px on screen. Below that, use the mark. The logo with tagline needs 45 mm, so the small line stays readable.</p>
<h3>Placement</h3>
<p>In letters and reports: top left, 35–45 mm wide, on white. On slides: bottom left or top left, never centred over a photo.</p>
</div>
</div>
{foot(3)}</section>""")

    # 4. Versions
    pages.append(f"""<section class="pg">
<p class="kicker">03 · Versions</p><h2>Which logo, on which background</h2>
<div class="tiles">
{tile("blue-violet/synaptyon-logo-on-light.svg", "#ffffff", "Blue-violet, on white or light", "blue-violet/synaptyon-logo-on-light")}
{tile("blue-violet/synaptyon-logo-on-dark.svg", "#070a12", "Blue-violet, on dark", "blue-violet/synaptyon-logo-on-dark")}
{tile("one-colour/synaptyon-logo-black.svg", "#ffffff", "One colour, black", "one-colour/synaptyon-logo-black")}
{tile("emerald-gold/synaptyon-logo-on-light.svg", "#f3f0dc", "Emerald and gold, on cream or white", "emerald-gold/synaptyon-logo-on-light")}
{tile("emerald-gold/synaptyon-logo-on-dark.svg", "#101411", "Emerald and gold, on dark", "emerald-gold/synaptyon-logo-on-dark")}
{tile("one-colour/synaptyon-logo-white.svg", "#2f62ff", "One colour, white on any strong colour", "one-colour/synaptyon-logo-white")}
</div>
<p class="note"><b>Blue-violet is the main palette</b>: the website, slides, letters. <b>Emerald and gold</b> is the second palette, for formal or printed pieces. Use one palette per document, never both. Use the one-colour logo where colour is not possible: stamps, engraving, fax, a single-colour print run.</p>
{foot(4)}</section>""")

    # 5. Don'ts
    L = "blue-violet/synaptyon-logo-on-light.svg"
    pages.append(f"""<section class="pg">
<p class="kicker">04 · Misuse</p><h2>What not to do</h2>
<div class="tiles">
{dont(svg(L, "", "width:72%;height:auto;transform:scaleX(1.32) scaleY(.82)"), "#ffffff", "Do not stretch or squash it")}
{dont(svg(L, "", "width:72%;height:auto;filter:hue-rotate(150deg) saturate(1.4)"), "#ffffff", "Do not change its colours")}
{dont(svg(L, "", "width:72%;height:auto;filter:drop-shadow(1.2mm 1.2mm 0.8mm rgba(0,0,0,.55))"), "#ffffff", "Do not add shadows, outlines or effects")}
{dont(svg(L, "", "width:66%;height:auto;transform:rotate(-14deg)"), "#ffffff", "Do not rotate it")}
{dont(svg(L, "", "width:72%;height:auto"), "#5a6ff0", "Do not use the light-background logo on a strong colour")}
{dont('<span style="font:400 21pt/1 Georgia,serif;color:#2f62ff">Synaptyon</span>', "#ffffff", "Do not retype the name as a logo")}
</div>
<p class="note">Always place the original files from the kit. Resize by dragging a corner so the proportions stay fixed.</p>
{foot(5)}</section>""")

    # 6. Colours, blue-violet
    pages.append(f"""<section class="pg">
<p class="kicker">05 · Colours · main palette</p><h2>Blue-violet</h2>
<p class="kicker">Logo gradient · 118°</p><div class="gradbar grad"><span>#00C8FF</span><span>#2F62FF</span><span>#C83CFF</span></div>
<div class="sws">{swatches(BLUE)}<div class="sw"><p class="note" style="margin:0">CMYK values are conversions for coated paper (FOGRA39). Cyan and violet are brighter on screen than ink can print; ask the printer for a proof before a large run.</p></div></div>
{foot(6)}</section>""")

    # 7. Colours, emerald-gold
    pages.append(f"""<section class="pg">
<p class="kicker">06 · Colours · second palette</p><h2>Emerald and gold</h2>
<p class="kicker">Mark gradient on dark · on light paper the deeper #D4A017 → #B8860B → #8A6200</p><div class="gradbar" style="background:linear-gradient(118deg,#F6CD60,#E2AD49 50%,#C38A30);color:#101411"><span>#F6CD60</span><span>#E2AD49</span><span>#C38A30</span></div>
<div class="sws">{swatches(GOLD)}</div>
{foot(7)}</section>""")

    # 8. Type
    pages.append(f"""<section class="pg">
<p class="kicker">07 · Typography</p><h2>Three typefaces</h2>
<div class="types">
<div class="type"><p class="aa" style="font-family:Inter;font-weight:700">Aa</p><h3>Inter</h3>
<p class="abc" style="font-family:Inter">ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789 € % &amp;</p>
<p><b>Text and headings.</b> Body text, tables, interface, the wordmark. Regular 400, Semibold 600, Bold 700.</p><code>Without it: Arial</code></div>
<div class="type"><p class="aa" style="font-family:'Source Serif 4';font-weight:600">Aa</p><h3>Source Serif 4</h3>
<p class="abc" style="font-family:'Source Serif 4'">ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789 € % &amp;</p>
<p><b>Display.</b> Page titles, the slogan, quotes. Semibold 600; Regular 400 for long quotes.</p><code>Without it: Georgia</code></div>
<div class="type"><p class="aa" style="font-family:'JetBrains Mono';font-weight:500">Aa</p><h3>JetBrains Mono</h3>
<p class="abc" style="font-family:'JetBrains Mono'">ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789</p>
<p><b>Labels.</b> Small capitals labels, figures in tables, email and web addresses. Regular 400, Medium 500.</p><code>Without it: Consolas</code></div>
</div>
<div class="scale">
<span>Title · 24 pt</span><div style="font:600 24pt/1.1 'Source Serif 4'">Contract review, Q4</div>
<span>Heading · 13 pt</span><div style="font:700 13pt/1.2 Inter">What changed since the last version</div>
<span>Body · 10 pt</span><div style="font:400 10pt/1.5 Inter;color:#33405b">The amendment of 1 March replaces the notice period: three months instead of six.</div>
<span>Label · 7.5 pt</span><div style="font:500 7.5pt/1 'JetBrains Mono';letter-spacing:.14em;text-transform:uppercase;color:#536079">Source · amendment, p. 2</div>
</div>
<p class="note">All three are free (SIL Open Font License) at fonts.google.com. Install them on your computer to use them in Word, PowerPoint or Keynote. In Google Docs, look under Fonts → More fonts; if one is missing there, use the fallback shown.</p>
{foot(8)}</section>""")

    # 9. Business cards
    pages.append(f"""<section class="pg">
<p class="kicker">08 · Business cards</p><h2>Business cards</h2>
<div class="cardrow">
<div class="cards">
{card_img("synaptyon-business-card-blue-violet-front-preview.png")}{card_img("synaptyon-business-card-blue-violet-back-preview.png")}
{card_img("synaptyon-business-card-emerald-gold-front-preview.png")}{card_img("synaptyon-business-card-emerald-gold-back-preview.png")}
</div>
<ul class="spec">
<li><b>Size.</b> 85 × 55 mm, the European standard.</li>
<li><b>Print file.</b> 91 × 61 mm: 3 mm of bleed on every side, already in the PDF. Page 1 is the front, page 2 the back.</li>
<li><b>Safe area.</b> All text sits at least 4 mm inside the cut.</li>
<li><b>Paper.</b> Suggested: 350–400 g/m², matt or soft-touch, printed both sides.</li>
<li><b>Two palettes.</b> Top: blue-violet. Bottom: emerald and gold. Pick one for the whole team.</li>
<li><b>Files.</b> <code>business-cards/synaptyon-business-card-blue-violet-print.pdf</code> and <code>…-emerald-gold-print.pdf</code>. Upload as is to an online printer.</li>
</ul>
</div>
{foot(9)}</section>""")

    # 10. Files
    pages.append(f"""<section class="pg">
<p class="kicker">09 · Files</p><h2>What is in the kit</h2>
<table>
<tr><th>File</th><th>Use it for</th></tr>
<tr><td><code>logo/…/*-2400px.png</code></td><td>Word, Google Docs, PowerPoint, Keynote: letterheads, reports, invoices, slides. Transparent background. Insert, then drag a corner to size it.</td></tr>
<tr><td><code>logo/…/*-600px.png</code></td><td>Email signatures and small on-screen uses.</td></tr>
<tr><td><code>logo/…/*.svg</code></td><td>Websites, designers, and Word or PowerPoint 365, which accept SVG and keep it sharp at any size.</td></tr>
<tr><td><code>logo/…/*.pdf</code></td><td>Printers and sign makers: vector, the wordmark is outlined, no font needed.</td></tr>
<tr><td><code>logo/…/*-on-light · *-on-dark</code></td><td>Pick by the background, not by taste: on-light for white or pale paper, on-dark for black, navy or graphite.</td></tr>
<tr><td><code>logo/one-colour/</code></td><td>Black or white only: stamps, engraving, single-colour print.</td></tr>
<tr><td><code>logo/social/*-1024px.png</code></td><td>Profile pictures: LinkedIn, GitHub, email accounts. Square, the mark on the dark brand background.</td></tr>
<tr><td><code>business-cards/</code></td><td>Print PDFs with bleed, and preview images to share before printing.</td></tr>
<tr><td><code>synaptyon-brand-guide.pdf</code></td><td>This guide.</td></tr>
</table>
<p class="note">Logos in three groups: <code>blue-violet</code> (main), <code>emerald-gold</code> (second), <code>one-colour</code>. Questions about the brand: sbakkali.sirajai@gmail.com.</p>
{foot(10)}</section>""")

    return f"<!doctype html><html><head><meta charset='utf-8'><style>{css}</style></head><body>{''.join(pages)}</body></html>"


def main():
    os.makedirs(WORK, exist_ok=True)
    html = os.path.join(WORK, "guide.html")
    with open(html, "w") as fh:
        fh.write(build())
    pdf = os.path.join(KIT, "synaptyon-brand-guide.pdf")
    subprocess.run(["google-chrome", "--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check",
                    "--allow-file-access-from-files", "--no-pdf-header-footer", f"--user-data-dir={html}.ud",
                    f"--print-to-pdf={pdf}", f"file://{html}"], check=True, capture_output=True)
    print(pdf)


if __name__ == "__main__":
    main()
