#!/usr/bin/env bash
# Rebuild the brand kit in ../brand (logos, business cards, brand guide, zip).
# Needs: python3, curl, Google Chrome, and the FOGRA39 ICC profile shipped with
# colord (/usr/share/color/icc/colord/FOGRA39L_coated.icc).
# To change a business card (name, role, phone...), edit CARD in gen_cards.py.
set -euo pipefail

HERE=$(cd "$(dirname "$0")" && pwd)
ROOT=$(dirname "$HERE")
WORK=${WORK:-$(mktemp -d)}
FONTS="$WORK/fonts"
OUT="$WORK/out"
mkdir -p "$FONTS"

# Static TTFs from Google Fonts (SIL Open Font License), the fonts the site uses.
for spec in "Inter:wght@400;500;600;700;800" "JetBrains+Mono:wght@400;500" "Source+Serif+4:wght@400;600"; do
  curl -fsS "https://fonts.googleapis.com/css2?family=$spec"
done | grep -oE "font-family: '[^']+'|font-weight: [0-9]+|url\([^)]+\)" | paste - - - |
while IFS=$'\t' read -r fam w u; do
  name=$(echo "$fam" | sed -E "s/font-family: '([^']+)'/\1/; s/ //g")
  url=${u#url(}; url=${url%)}
  curl -fsS -o "$FONTS/$name-${w#font-weight: }.ttf" "$url"
done

python3 -m venv "$WORK/venv"
"$WORK/venv/bin/pip" -q install fonttools uharfbuzz pymupdf pillow
PY="$WORK/venv/bin/python"

"$PY" "$HERE/gen_logos.py" "$FONTS" "$OUT/logo"
"$PY" "$HERE/render.py" "$OUT/logo" "$WORK/render"
"$PY" "$HERE/gen_cards.py" "$FONTS" "$OUT/logo" "$OUT/business-cards" "$WORK/cards"
"$PY" "$HERE/gen_guide.py" "$FONTS" "$OUT" "$WORK/guide"
rm -f "$OUT/logo/manifest.json"

mkdir -p "$ROOT/brand"
cp -r "$OUT"/. "$ROOT/brand/"
"$PY" - "$ROOT/brand" <<'EOF'
import os, sys, zipfile
root = sys.argv[1]
dest = os.path.join(root, "synaptyon-brand-kit.zip")
with zipfile.ZipFile(dest, "w", zipfile.ZIP_DEFLATED) as zf:
    for d, _, files in sorted(os.walk(root)):
        for f in sorted(files):
            p = os.path.join(d, f)
            if p != dest:
                zf.write(p, os.path.join("synaptyon-brand-kit", os.path.relpath(p, root)))
print(dest)
EOF
echo "brand kit rebuilt in $ROOT/brand (work files in $WORK)"
