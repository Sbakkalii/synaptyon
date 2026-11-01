# SynaptYon site

Product site for SynaptYon SARL, served by GitHub Pages (Jekyll) at
https://sbakkalii.github.io/synaptyon/ until a company domain exists. It is a
preview: every page carries `noindex`.

The six products each implement one part of the architecture in
[“Amnesia by Design, Memory By Necessity”](https://arxiv.org/abs/2609.32041)
(Bakkali & Merimi, arXiv:2609.32041).

| Product | Role | Paper |
| --- | --- | --- |
| Mnemos | Persistent document state | §III-A–C, Algorithm 1 |
| Argus | Pre-write validation gate | §III-B, Theorem III.4 |
| Chronos | Bitemporal reconciliation | 𝒮_sup, §V-B |
| Ariadne | Recursive provenance | P_t invariant, §V-B |
| Lethe | Verifiable forgetting | §III-D, §V-C, Algorithm 2 |
| Anamnesis | Longitudinal benchmark harness | §IV |

## Where things live

| What | File |
| --- | --- |
| Products (shared with the founder's site, keep both copies identical) | `_data/products.yml` |
| Home page copy: lifecycle, domains, cockpit parameters, services, name | `_data/sy.yml` |
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
- Switch `contact_email` in `_config.yml` to a company mailbox.
- Point a custom domain at the repository, then remove `noindex` from
  `_config.yml` and the `Disallow` from `robots.txt`.
- Product names are working names: run a trademark check.
