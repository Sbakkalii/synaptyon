# SynaptYon site

Product site for SynaptYon SARL, served by GitHub Pages (Jekyll) at
https://sbakkalii.github.io/synaptyon/ until a company domain exists. It is a
preview: every page carries `noindex`.

SynaptYon sells four products that cover the whole Document Intelligence
chain, built from 17 features. The memory product (Mnemos) implements the architecture
in [“Amnesia by Design, Memory By Necessity”](https://arxiv.org/abs/2609.32041)
(Bakkali & Merimi, arXiv:2609.32041).

| Stage | Products |
| --- | --- |
| Ingest | Agora (ingestion & capture), Grammata (OCR & handwriting), Morphe (layout & tables) |
| Understand | Taxis (classification & routing), Kleis (key information extraction), Onoma (named entities), Pistis (trust & consistency) |
| Apply | Sibyl (QA & DocVQA), Heuresis (search), Epitome (summarisation), Hermeneus (translation) |
| Remember | Mnemos (document memory), Argus (validation gate), Chronos (versions), Ariadne (provenance), Lethe (deletion) |
| Measure | Anamnesis (evaluation harness) |

Solutions by document family (business, financial, historical, healthcare,
identity, legal) live in the same data file.

## Where things live

| What | File |
| --- | --- |
| Products, chain and solutions (shared with the founder's site, keep both copies identical) | `_data/products.yml` |
| Short labels for cited publications | `_data/pubs.yml` |
| Pipeline demo documents and scripted outputs | `_data/pipeline.yml` |
| Products overview page | `products/index.html` |
| Home page copy: lifecycle, commitments, cockpit parameters, engagements, names | `_data/sy.yml` |
| The paper's tables and equations | `_data/paper.yml` |
| Fictional documents used by the demos | `_data/demo.yml` |
| Product page template | `_layouts/product.html` |
| Design tokens (dark default, light palette) | `_includes/css/tokens.css` |
| Page styles | `_includes/css/sy.css` |
| Interactive figures | `assets/js/components/*.js`, `_includes/components/*.html` |

The harness cockpit on the home page is a simulation built from the paper's
equations with illustrative parameters (`_data/sy.yml`, `cockpit`); it is
labelled as such on the page and measures nothing.

## Before leaving preview

- Fill in the legal notice (`legal.html`): registered office, registration
  number, publication director, host.
- Switch `contact_email` in `_config.yml` (now a Gmail address) to a mailbox on the company domain.
- Point a custom domain at the repository, then remove `noindex` from
  `_config.yml` and the `Disallow` from `robots.txt`.
- Product names are working names: run a trademark check.
