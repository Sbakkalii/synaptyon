#!/usr/bin/env python3
"""Render the logo SVGs to transparent PNG (two sizes) and vector PDF with
headless Chrome, and make square profile pictures.

usage: render.py LOGO_DIR WORK_DIR
"""
import json
import math
import os
import re
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor

LOGO, WORK = os.path.abspath(sys.argv[1]), os.path.abspath(sys.argv[2])
CHROME = ["google-chrome", "--headless=new", "--disable-gpu", "--hide-scrollbars",
          "--default-background-color=00000000", "--no-first-run", "--no-default-browser-check",
          "--allow-file-access-from-files"]
os.makedirs(WORK, exist_ok=True)


def viewbox(svg_path):
    with open(svg_path) as fh:
        m = re.search(r'viewBox="([\d.\- ]+)"', fh.read())
    _, _, w, h = map(float, m.group(1).split())
    return w, h


def png(svg, out, width, height=None, bg=None, inner=None):
    w, h = viewbox(svg)
    if height is None:
        height = math.ceil(width * h / w)
    iw = inner or width
    ih = iw * h / w
    html = os.path.join(WORK, os.path.basename(out) + ".html")
    with open(html, "w") as fh:
        fh.write(f"""<!doctype html><html><head><style>
html,body{{margin:0;width:{width}px;height:{height}px;overflow:hidden;background:{bg or 'transparent'}}}
body{{display:grid;place-items:center}}
img{{display:block;width:{iw}px;height:{ih}px}}
</style></head><body><img src="file://{svg}"></body></html>""")
    subprocess.run(CHROME + [f"--user-data-dir={html}.ud", f"--window-size={width},{height}", f"--screenshot={out}", f"file://{html}"],
                   check=True, capture_output=True)
    return out


def pdf(svg, out, width_mm):
    w, h = viewbox(svg)
    height_mm = width_mm * h / w
    html = os.path.join(WORK, os.path.basename(out) + ".html")
    with open(svg) as fh:
        inline = fh.read()
    inline = re.sub(r' width="[^"]*" height="[^"]*"', ' width="100%" height="100%"', inline, count=1)
    with open(html, "w") as fh:
        fh.write(f"""<!doctype html><html><head><style>
@page{{size:{width_mm:.3f}mm {height_mm:.3f}mm;margin:0}}
html,body{{margin:0;width:{width_mm:.3f}mm;height:{height_mm:.3f}mm;overflow:hidden}}
svg{{display:block;width:{width_mm:.3f}mm;height:{height_mm:.3f}mm}}
</style></head><body>{inline}</body></html>""")
    subprocess.run(CHROME + [f"--user-data-dir={html}.ud", "--no-pdf-header-footer", f"--print-to-pdf={out}", f"file://{html}"],
                   check=True, capture_output=True)
    return out


def main():
    with open(os.path.join(LOGO, "manifest.json")) as fh:
        svgs = json.load(fh)
    jobs = []
    for rel in svgs:
        src = os.path.join(LOGO, rel)
        stem = src[:-4]
        is_mark = "-mark" in os.path.basename(rel)
        big, small = (1000, 250) if is_mark else (2400, 600)
        jobs.append((png, (src, f"{stem}-{big}px.png", big)))
        jobs.append((png, (src, f"{stem}-{small}px.png", small)))
        jobs.append((pdf, (src, f"{stem}.pdf", 20 if is_mark else 60)))
    social = os.path.join(LOGO, "social")
    os.makedirs(social, exist_ok=True)
    for name, mark, bg in (("blue-violet", "blue-violet/synaptyon-mark.svg", "#070a12"),
                           ("emerald-gold", "emerald-gold/synaptyon-mark-on-dark.svg", "#101411")):
        jobs.append((png, (os.path.join(LOGO, mark), os.path.join(social, f"synaptyon-profile-{name}-1024px.png"),
                           1024, 1024, bg, 470)))
    with ThreadPoolExecutor(6) as ex:
        done = list(ex.map(lambda j: j[0](*j[1]), jobs))
    print(len(done), "files")


if __name__ == "__main__":
    main()
