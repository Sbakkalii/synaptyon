# Brand kit sources

`../brand/` holds the published brand kit: logos (SVG, transparent PNG,
vector PDF), business cards (print PDFs with 3 mm bleed), the brand guide
(`synaptyon-brand-guide.pdf`) and everything zipped in
`synaptyon-brand-kit.zip`. Jekyll ignores this `_brand/` folder, so only the
outputs are served, under `/synaptyon/brand/`.

Rebuild everything with:

```sh
_brand/build.sh
```

| Script | Makes |
| --- | --- |
| `gen_logos.py` | the logo SVGs: the mark from `_includes/logo.html`, the wordmark in Inter Bold converted to outlines |
| `render.py` | PNG at two sizes and vector PDF of every SVG, plus square profile pictures (headless Chrome) |
| `gen_cards.py` | business cards, 85 × 55 mm with 3 mm bleed; edit `CARD` to change the person or add a phone |
| `gen_guide.py` | the A4 landscape brand guide; CMYK values converted with FOGRA39 (coated paper) |

The colours come from the site: the blue-violet palette from
`_includes/css/tokens.css`, the emerald and gold palette from
`_includes/css/palette-forest.css`. Change them there and here together.
