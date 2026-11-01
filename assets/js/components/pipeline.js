// Pipeline explorer: one fictional document through the whole chain.
//
// Four fictional documents (_data/pipeline.yml), one per family, each with a
// scripted output for every stage, from capture checks to the claims written
// to memory. The page on the left is drawn as SVG from the document's own
// text lines, and each stage lays its overlay on it; the panel on the right
// shows that stage's output as a readable view or as JSON. Output items and
// page marks share keys, so pointing at one lights the other. Nothing is
// recognised at runtime: the outputs are written in advance, and only their
// boxes are measured on the drawn page.
import { h, s, $, $$, clamp, uid, roving } from '../lib/dom.js';

const STEP_MS = 1600;   // dwell per stage while the chain runs
const FLAG = 0.9;       // words below this confidence are flagged for review
const LOW = 0.75;       // and below this, read as low
const PAD = 4;          // a region's box extends this far around its lines
const DESK = 14;        // desk around the page, in page units

const RESULT = { pass: 'Pass', warn: 'Warning', fail: 'Fail' };
const TALLY = { pass: 'pass', warn: 'warning', fail: 'fail' };
const BAND = { ok: '0.90 or more', mid: '0.75 to 0.90: review', low: 'Below 0.75: low' };
// Font size as a share of the line box height, per text style.
const SIZE = { brand: 0.95, title: 0.92, small: 0.86, mono: 0.8, hand: 0.86, handb: 0.88, hand2: 0.86, sign: 1, serifb: 0.92, serif: 0.86 };
// JSON keys: the data's short names, spelled out.
const JSON_KEYS = { s: 'subject', p: 'predicate', o: 'object', t: 'text', q: 'question', a: 'answer', conf: 'confidence', norm: 'normalised', at: 'source', near: 'closest', from: 'valid_from', to: 'valid_to', dst: 'target', dest: 'destination' };

/* ------------------------------------------------------------------ icons */

const ICONS = {
  play: [['path', { d: 'M8 5.5v13a.5.5 0 0 0 .77.42l10.2-6.5a.5.5 0 0 0 0-.84L8.77 5.08A.5.5 0 0 0 8 5.5Z', fill: 'currentColor', stroke: 'none' }]],
  pause: [['rect', { x: 6.5, y: 5, width: 3.6, height: 14, rx: 1, fill: 'currentColor', stroke: 'none' }], ['rect', { x: 13.9, y: 5, width: 3.6, height: 14, rx: 1, fill: 'currentColor', stroke: 'none' }]],
  prev: [['path', { d: 'm14.5 6-6 6 6 6' }]],
  next: [['path', { d: 'm9.5 6 6 6-6 6' }]],
  pass: [['path', { d: 'm6 12.5 4 4 8-9' }]],
  warn: [['path', { d: 'M12 6.5v7' }], ['path', { d: 'M12 17.6h.01' }]],
  fail: [['path', { d: 'm7.5 7.5 9 9M16.5 7.5l-9 9' }]],
  arrow: [['path', { d: 'M5 12h14' }], ['path', { d: 'm13 6 6 6-6 6' }]],
  abstain: [['circle', { cx: 12, cy: 12, r: 8 }], ['path', { d: 'm6.4 17.6 11.2-11.2' }]],
  link: [['path', { d: 'M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1' }], ['path', { d: 'M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1' }]],
  memory: [['ellipse', { cx: 12, cy: 6, rx: 7, ry: 2.6 }], ['path', { d: 'M5 6v6c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6V6' }], ['path', { d: 'M5 12v6c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6v-6' }]],
};

function icon(name) {
  return s('svg', {
    viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2,
    'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true', focusable: 'false',
  }, ICONS[name].map(([tag, attrs]) => s(tag, attrs)));
}

/* --------------------------------------------------------------- helpers */

const hidden = (text) => h('span', { class: 'visually-hidden', text });
const two = (n) => String(n).padStart(2, '0');
const fix = (v, d = 2) => Number(v).toFixed(d);
const plural = (n, word, many = `${word}s`) => `${n} ${n === 1 ? word : many}`;
const lc = (text) => text.charAt(0).toLowerCase() + text.slice(1);
const bandOf = (c) => (c >= FLAG ? 'ok' : c >= LOW ? 'mid' : 'low');

const isBox = (v) => Array.isArray(v) && v.length === 4 && v.every((n) => typeof n === 'number');
/** Refs as a list: "r3", "l12", "l12#text", a literal box, or a list of these. */
const refsOf = (at) => (at == null ? [] : isBox(at) ? [at] : [].concat(at));
const refId = (ref) => (isBox(ref) ? 'box' : ref.split('#')[0]);
const linesOf = (region) => region.lines || (region.rows ? region.rows.flat().filter(Boolean) : []);
const grow = ([x, y, w, hh], d) => [x - d, y - d, w + 2 * d, hh + 2 * d];
const rounded = (b) => (b ? b.map((v) => Math.round(v)) : null);

function union(boxes) {
  const bs = boxes.filter(Boolean);
  if (!bs.length) return null;
  const x0 = Math.min(...bs.map((b) => b[0]));
  const y0 = Math.min(...bs.map((b) => b[1]));
  const x1 = Math.max(...bs.map((b) => b[0] + b[2]));
  const y1 = Math.max(...bs.map((b) => b[1] + b[3]));
  return [x0, y0, x1 - x0, y1 - y0];
}

// FNV-1a, for stable jitter: unflagged words should not all read 0.985.
function hash(str) {
  let x = 2166136261;
  for (let i = 0; i < str.length; i += 1) { x ^= str.charCodeAt(i); x = Math.imul(x, 16777619); }
  return (x >>> 0) / 4294967296;
}
const bare = (w) => w.replace(/^[(«“]+|[.,;:!?)»”]+$/g, '');

/** A line's words with their offset and confidence; only its `lo` words fall below FLAG. */
function wordsOf(line) {
  const base = line.c ?? 0.985;
  return [...line.t.matchAll(/\S+/g)].map((m) => {
    const lo = line.lo ? line.lo[bare(m[0])] : undefined;
    const c = lo ?? clamp(base + (hash(`${line.id}:${m.index}`) - 0.5) * 0.04, FLAG + 0.005, 0.998);
    return { text: m[0], i: m.index, conf: Math.round(c * 1000) / 1000 };
  });
}
const mean = (ws) => Math.round((ws.reduce((a, w) => a + w.conf, 0) / Math.max(1, ws.length)) * 1000) / 1000;

/** Pretty JSON with short arrays and small flat objects kept on one line. */
function pretty(v, ind = '') {
  const flat = (x) => x === null || typeof x !== 'object';
  if (Array.isArray(v)) {
    if (!v.length) return '[]';
    if (v.every(flat)) return `[${v.map((x) => JSON.stringify(x)).join(', ')}]`;
    return `[\n${v.map((x) => `${ind}  ${pretty(x, `${ind}  `)}`).join(',\n')}\n${ind}]`;
  }
  if (v && typeof v === 'object') {
    const keys = Object.keys(v).filter((k) => v[k] !== undefined);
    const one = `{ ${keys.map((k) => `${JSON.stringify(k)}: ${JSON.stringify(v[k])}`).join(', ')} }`;
    if (keys.every((k) => flat(v[k]) || (Array.isArray(v[k]) && v[k].every(flat))) && one.length <= 64) return one;
    return `{\n${keys.map((k) => `${ind}  ${JSON.stringify(k)}: ${pretty(v[k], `${ind}  `)}`).join(',\n')}\n${ind}}`;
  }
  return JSON.stringify(v);
}

/** JSON text as nodes, with keys, strings, numbers and literals marked for colour. */
function highlight(text) {
  const out = [];
  const re = /("(?:\\.|[^"\\])*")(\s*:)?|(-?\d+(?:\.\d+)?)|\b(true|false|null)\b/g;
  let last = 0;
  for (const m of text.matchAll(re)) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1] && m[2]) out.push(h('span', { class: 'pl-j-k', text: m[1] }), m[2]);
    else if (m[1]) out.push(h('span', { class: 'pl-j-s', text: m[1] }));
    else if (m[3]) out.push(h('span', { class: 'pl-j-n', text: m[3] }));
    else out.push(h('span', { class: 'pl-j-l', text: m[4] }));
    last = m.index + m[0].length;
  }
  out.push(text.slice(last));
  return out;
}

/* ------------------------------------------------------------- drawing */

// A signature: a tall capital loop, then a slanted run of small waves with
// the odd backward stroke, smoothed as a Catmull-Rom curve; a swash under it.
function scribble([x, y, w, hh], seed) {
  const r = (k) => hash(`${seed}:${k}`);
  const base = y + hh * 0.72;
  const pts = [[x, base], [x + w * 0.1, y + hh * 0.02], [x + w * 0.03, y + hh * 0.3], [x + w * 0.16, base]];
  const n = 9 + Math.floor(r('n') * 4);
  for (let k = 1; k <= n; k += 1) {
    const u = 0.16 + (k / n) * 0.72;
    const up = k % 2 === 1;
    const back = up && r(`b${k}`) > 0.62 ? w * 0.035 : 0;
    pts.push([x + u * w - back, up ? y + hh * (0.22 + r(`h${k}`) * 0.28) : base + hh * (r(`d${k}`) - 0.5) * 0.1]);
  }
  pts.push([x + w * 0.96, y + hh * 0.38]);
  const p = (i) => pts[clamp(i, 0, pts.length - 1)];
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i += 1) {
    const [a, b, c, e] = [p(i - 1), p(i), p(i + 1), p(i + 2)];
    d += ` C${(b[0] + (c[0] - a[0]) / 6).toFixed(1)} ${(b[1] + (c[1] - a[1]) / 6).toFixed(1)} ${(c[0] - (e[0] - b[0]) / 6).toFixed(1)} ${(c[1] - (e[1] - b[1]) / 6).toFixed(1)} ${c[0].toFixed(1)} ${c[1].toFixed(1)}`;
  }
  return `${d} M${x + w * 0.05} ${y + hh * 0.95} C${x + w * 0.35} ${y + hh * 0.8} ${x + w * 0.7} ${y + hh * 1.04} ${x + w} ${y + hh * 0.84}`;
}

const flourish = ([x, y, w, hh]) => `M${x} ${y + hh * 0.6} C${x + w * 0.3} ${y + hh * 1.2} ${x + w * 0.62} ${y - hh * 0.3} ${x + w} ${y + hh * 0.45}`;

function drawArt(a, i) {
  const [x, y, w, hh] = a.b;
  switch (a.k) {
    case 'logo': return s('g', { class: 'pl-logo' },
      a.round ? s('circle', { cx: x + w / 2, cy: y + hh / 2, r: w / 2 }) : s('rect', { x, y, width: w, height: hh, rx: 6 }),
      s('text', { x: x + w / 2, y: y + hh * 0.68, 'text-anchor': 'middle', 'font-size': hh * (a.t.length > 1 ? 0.42 : 0.6) }, a.t));
    case 'band': return s('rect', { class: 'pl-band', x, y, width: w, height: hh, rx: 2 });
    case 'frame': return s('rect', { class: 'pl-frame', x, y, width: w, height: hh, rx: 4 });
    case 'rule': return s('line', { class: 'pl-rule', x1: x, y1: y, x2: x + w, y2: y });
    case 'vrule': return s('line', { class: 'pl-rule pl-rule--v', x1: x, y1: y, x2: x, y2: y + hh });
    case 'spot': return s('circle', { class: 'pl-spot', cx: x, cy: y, r: w });
    case 'sign': return s('path', { class: ['pl-sign', a.ink && `pl-sign--${a.ink}`], d: scribble(a.b, `sign${i}${x}`) });
    case 'flourish': return s('path', { class: 'pl-sign', d: flourish(a.b) });
    case 'stamp': {
      const cx = x + w / 2;
      const cy = y + hh / 2;
      const lines = a.t || [];
      const fs = a.round ? 7 : 9;
      return s('g', { class: ['pl-stamp', a.ink && `pl-stamp--${a.ink}`, a.round && 'is-round'], transform: `rotate(${a.rot || 0} ${cx} ${cy})` },
        a.round
          ? [s('circle', { cx, cy, r: w / 2 }), s('circle', { cx, cy, r: w / 2 - 4 })]
          : [s('rect', { x, y, width: w, height: hh, rx: 5 }), s('rect', { x: x + 3, y: y + 3, width: w - 6, height: hh - 6, rx: 3 })],
        lines.map((t, k) => s('text', {
          x: cx, y: cy + (k - (lines.length - 1) / 2) * fs * 1.35 + fs * 0.35, 'text-anchor': 'middle',
          'font-size': k === 0 ? fs * 1.08 : fs,
        }, t)));
    }
    default: return null;
  }
}

/* ----------------------------------------------------------------- init */

export default function init(root, ctx) {
  const data = ctx.data(root, 'pipeline');
  const app = $('[data-app]', root);
  const staticEl = $('[data-static]', root);
  const docs = (data && Array.isArray(data.documents) ? data.documents : []).filter((d) => d && d.lines && d.regions && d.out);
  const stages = data && Array.isArray(data.stages) ? data.stages : [];
  if (!docs.length || !stages.length || !app) return;

  const id = uid('pl');
  const types = data.types || {};
  const last = stages.length - 1;
  for (const d of docs) {
    d.lineMap = new Map(d.lines.map((l) => [l.id, l]));
    d.regionMap = new Map(d.regions.map((r) => [r.id, r]));
    d.words = new Map(d.lines.map((l) => [l.id, wordsOf(l)]));
  }

  const state = {
    doc: Math.max(0, docs.findIndex((d) => d.id === data.doc)),
    stage: Math.max(0, stages.findIndex((st) => st.id === data.stage)),
    format: 'view',
  };
  const picks = { ask: new Map(), translate: new Map() };  // selected question / region per document
  let doc = docs[state.doc];
  let playing = false;
  let timer = 0;
  let hoverKeys = null;
  let focusKeys = null;

  /* ---------------------------------------------------------- controls */

  const docTabs = docs.map((d) => h('button', {
    type: 'button', role: 'tab', class: 'c-pipeline__dtab', id: `${id}-doc-${d.id}`,
    'aria-selected': 'false', 'aria-controls': `${id}-docpanel`, tabindex: '-1',
    onClick: () => { stop(); selectDoc(docs.indexOf(d)); },
  },
  h('span', { class: 'c-pipeline__dfam', text: d.family_label }), hidden(': '),
  h('span', { class: 'c-pipeline__dname', text: d.name })));
  const docList = h('div', { class: 'c-pipeline__docs', role: 'tablist', 'aria-label': 'Fictional documents' }, docTabs);
  roving(docTabs, { onSelect: (i) => { stop(); selectDoc(i); } });

  // Stage tabs, grouped under their chain stage (Ingest, Understand, …).
  const groups = [];
  stages.forEach((st, i) => {
    const gid = st.group || 'chain';
    let g = groups[groups.length - 1];
    if (!g || g.id !== gid) { g = { id: gid, name: st.groupName || 'Chain', idx: [] }; groups.push(g); }
    g.idx.push(i);
  });
  const stageTabs = stages.map((st, i) => h('button', {
    type: 'button', role: 'tab', class: 'c-pipeline__stab', id: `${id}-st-${st.id}`,
    'aria-selected': 'false', 'aria-controls': `${id}-stage`, tabindex: '-1',
    'aria-describedby': `${id}-g-${st.group || 'chain'}`,
    onClick: () => { stop(); goStage(i); },
  },
  h('span', { class: 'c-pipeline__snum', 'aria-hidden': 'true' }, two(i + 1), icon('pass')),
  h('span', { class: 'c-pipeline__sname', text: st.name }),
  h('span', { class: 'c-pipeline__sprod' }, hidden(', '), st.product.name)));
  const rail = h('div', { class: 'c-pipeline__rail', role: 'tablist', 'aria-label': 'Stages of the chain' },
    groups.map((g) => {
      const el = h('div', { class: 'c-pipeline__group' },
        h('span', { class: 'c-pipeline__gname', id: `${id}-g-${g.id}`, 'aria-hidden': 'true', text: g.name }),
        h('div', { class: 'c-pipeline__gtabs' }, g.idx.map((i) => stageTabs[i])));
      el.style.setProperty('--n', g.idx.length);
      return el;
    }));
  roving(stageTabs, { onSelect: (i) => { stop(); goStage(i); } });

  const iconBtn = (name, label, onClick) => h('button', {
    type: 'button', class: 'c-pipeline__icon', 'aria-label': label, title: label, onClick,
  }, icon(name));
  const prevBtn = iconBtn('prev', 'Previous stage', () => { stop(); step(-1); });
  const nextBtn = iconBtn('next', 'Next stage', () => { stop(); step(1); });
  const playIcon = h('span', { class: 'c-pipeline__play-i' }, icon('play'));
  const playText = h('span', { text: 'Run the chain' });
  const playBtn = h('button', { type: 'button', class: 'c-pipeline__play', onClick: togglePlay }, playIcon, playText);
  const counter = h('span', { class: 'c-pipeline__count' });
  const transport = h('div', { class: 'c-pipeline__transport', role: 'group', 'aria-label': 'Chain playback' },
    prevBtn, playBtn, nextBtn, counter);

  /* --------------------------------------------------------- page view */

  const titleId = `${id}-title`;
  const svgTitle = s('title', { id: titleId });
  const glareId = `${id}-glare`;
  const scanId = `${id}-scan`;
  const paper = s('rect', { class: 'pl-paper', x: 0, y: 0, rx: 3 });
  const shadow = s('rect', { class: 'pl-shadow', x: 2, y: 5, rx: 3 });
  const artG = s('g', { class: 'pl-art' });
  const underG = s('g', { class: 'pl-under' });
  const textG = s('g', { class: 'pl-text' });
  const fxG = s('g', { class: 'pl-fx', 'aria-hidden': 'true' });
  const overG = s('g', { class: 'pl-over' });
  const sheet = s('g', { class: 'pl-sheet' }, shadow, paper, artG, underG, textG, fxG, overG);
  const svg = s('svg', { class: 'c-pipeline__svg', role: 'img', 'aria-labelledby': titleId, preserveAspectRatio: 'xMidYMid meet' },
    svgTitle,
    s('defs', {},
      s('radialGradient', { id: glareId }, s('stop', { offset: '0', class: 'pl-glare-a' }), s('stop', { offset: '.55', class: 'pl-glare-b' }), s('stop', { offset: '1', class: 'pl-glare-c' })),
      s('linearGradient', { id: scanId, x1: '0', y1: '0', x2: '0', y2: '1' }, s('stop', { offset: '0', class: 'pl-scan-a' }), s('stop', { offset: '1', class: 'pl-scan-b' }))),
    sheet);
  const pageRef = h('span', { class: 'c-pipeline__pref' });
  const pageName = h('span', { class: 'c-pipeline__pname' });
  const pageView = h('div', { class: 'c-pipeline__pageview' },
    h('div', { class: 'c-pipeline__pagebar' }, pageRef, pageName, h('span', { class: 'tag', text: 'Fictional' })),
    h('div', { class: 'c-pipeline__desk' }, svg));

  /* -------------------------------------------------------- output view */

  const outStep = h('p', { class: 'c-pipeline__ostep' });
  const outName = h('p', { class: 'c-pipeline__oname' });
  const outBrief = h('p', { class: 'c-pipeline__obrief' });
  const chip = h('a', { class: 'c-pipeline__chip' });
  const fmtBtns = ['view', 'json'].map((f) => h('button', {
    type: 'button', 'aria-pressed': String(f === state.format), onClick: () => setFormat(f),
  }, f === 'view' ? 'View' : 'JSON'));
  const view = h('div', { class: 'c-pipeline__view', role: 'region', tabindex: '0' });
  const pre = h('pre', { class: 'c-pipeline__json', role: 'region', tabindex: '0', hidden: true });
  const out = h('div', { class: 'c-pipeline__out' },
    h('div', { class: 'c-pipeline__ohead' },
      h('div', { class: 'c-pipeline__otitle' }, outStep, outName),
      h('div', { class: 'segmented c-pipeline__fmt', role: 'group', 'aria-label': 'Output format' }, fmtBtns),
      outBrief,
      chip),
    view, pre);

  const stagePanel = h('div', { class: 'c-pipeline__stage', role: 'tabpanel', id: `${id}-stage` }, pageView, out);
  const docPanel = h('div', { class: 'c-pipeline__docpanel', role: 'tabpanel', id: `${id}-docpanel` }, rail, stagePanel);

  app.append(h('div', { class: 'c-pipeline__top' }, docList, transport), docPanel);
  app.hidden = false;
  if (staticEl) staticEl.hidden = true;
  root.style.setProperty('--pl-step', `${STEP_MS}ms`);
  if (ctx.reducedMotion) {
    root.classList.add('is-still');
    playBtn.title = 'Reduced motion: steps one stage at a time';
  }

  /* ----------------------------------------------------------- geometry */
  // Boxes come from the drawn text, so overlays sit on the glyphs. Until the
  // page is laid out (fonts loading, hidden tab) a proportional estimate
  // stands in, and the next layout redraws the overlay.

  let textEls = new Map();
  let boxCache = new Map();
  let estimated = false;

  function charBox(lineId, i, n) {
    const line = doc.lineMap.get(lineId);
    if (!line) return null;
    const key = `${lineId}:${i}:${n}`;
    if (boxCache.has(key)) return boxCache.get(key);
    let box = null;
    const el = textEls.get(lineId);
    try {
      const a = el.getExtentOfChar(i);
      const b = el.getExtentOfChar(i + n - 1);
      if (a.width > 0 || b.width > 0) box = [a.x, line.b[1], b.x + b.width - a.x, line.b[3]];
    } catch { /* not laid out yet */ }
    if (!box) {
      estimated = true;
      const [x, y, w, hh] = line.b;
      return [x + (w * i) / line.t.length, y, (w * n) / line.t.length, hh];
    }
    boxCache.set(key, box);
    return box;
  }

  const lineBox = (lineId) => {
    const line = doc.lineMap.get(lineId);
    return line ? charBox(lineId, 0, line.t.length) : null;
  };
  const regionBox = (r) => r.box || grow(union(linesOf(r).map(lineBox)), PAD);

  function boxOf(ref) {
    if (isBox(ref)) return ref;
    if (typeof ref !== 'string') return null;
    const cut = ref.indexOf('#');
    if (cut > 0) {
      const lineId = ref.slice(0, cut);
      const text = ref.slice(cut + 1);
      const line = doc.lineMap.get(lineId);
      const i = line ? line.t.indexOf(text) : -1;
      return i >= 0 ? charBox(lineId, i, text.length) : lineBox(lineId);
    }
    if (doc.regionMap.has(ref)) return regionBox(doc.regionMap.get(ref));
    return lineBox(ref);
  }
  const boxesOf = (at) => refsOf(at).map(boxOf).filter(Boolean);

  /* --------------------------------------------------------------- page */

  function drawPage() {
    const { w: W, h: H } = doc.page;
    svg.setAttribute('viewBox', `${-DESK} ${-DESK} ${W + 2 * DESK} ${H + 2 * DESK}`);
    svg.style.setProperty('--pl-ratio', `${W + 2 * DESK} / ${H + 2 * DESK}`);
    for (const r of [paper, shadow]) { r.setAttribute('width', W); r.setAttribute('height', H); }
    svg.setAttribute('class', `c-pipeline__svg pl-page--${doc.page.paper || 'plain'} pl-ink--${doc.page.ink || 'print'}`);
    artG.replaceChildren(...(doc.art || []).map(drawArt).filter(Boolean), ...tableRules());
    textEls = new Map();
    boxCache = new Map();
    textG.replaceChildren(...doc.lines.map((line) => {
      const [x, y, w, hh] = line.b;
      const anchor = line.a === 'end' ? 'end' : line.a === 'mid' ? 'middle' : 'start';
      const el = s('text', {
        class: `pl-t pl-t--${line.st || 'body'}`,
        x: anchor === 'end' ? x + w : anchor === 'middle' ? x + w / 2 : x,
        y: (y + hh * 0.8).toFixed(1),
        'font-size': (hh * (SIZE[line.st] || 0.82)).toFixed(1),
        'text-anchor': anchor,
      }, line.t);
      textEls.set(line.id, el);
      return el;
    }));
    pageRef.textContent = doc.ref;
    pageName.textContent = `${doc.name} · page 1 of 1`;
    fitText();
  }

  // Rules between the rows of each table, from the rows' own lines.
  function tableRules() {
    const rules = [];
    for (const r of doc.regions) {
      if (!r.rows || !r.box) continue;
      const rows = r.rows.map((row) => union(row.filter(Boolean).map((lid) => doc.lineMap.get(lid).b)));
      for (let k = 1; k < rows.length - 1; k += 1) {
        const yy = (rows[k][1] + rows[k][3] + rows[k + 1][1]) / 2;
        rules.push(s('line', { class: 'pl-rule pl-rule--row', x1: r.box[0], x2: r.box[0] + r.box[2], y1: yy.toFixed(1), y2: yy.toFixed(1) }));
      }
    }
    return rules;
  }

  // A line wider than its box (a fallback font, say) is condensed to fit.
  function fitText() {
    let laidOut = true;
    for (const [lineId, el] of textEls) {
      el.removeAttribute('textLength');
      el.removeAttribute('lengthAdjust');
      let len = 0;
      try { len = el.getComputedTextLength(); } catch { len = 0; }
      if (!len) { laidOut = false; continue; }
      const w = doc.lineMap.get(lineId).b[2];
      if (len > w) {
        el.setAttribute('textLength', w);
        el.setAttribute('lengthAdjust', 'spacingAndGlyphs');
      }
    }
    return laidOut;
  }

  // Ingest shows the capture as it arrived: tilted, faded, soft or with glare.
  function applyEffects(stageId) {
    const eff = (stageId === 'ingest' && doc.out.ingest && doc.out.ingest.effect) || {};
    sheet.style.transform = eff.rotate ? `rotate(${eff.rotate}deg) scale(0.95)` : '';
    svg.classList.toggle('is-faded', Boolean(eff.fade));
    svg.classList.toggle('is-soft', Boolean(eff.blur));
    const fx = [];
    if (eff.glare) {
      const [x, y, w, hh] = eff.glare;
      fx.push(s('ellipse', { class: 'pl-glare', cx: x + w / 2, cy: y + hh / 2, rx: w / 2, ry: hh / 2, fill: `url(#${glareId})` }));
    }
    if (stageId === 'ingest' && !ctx.reducedMotion) {
      fx.push(s('rect', { class: 'pl-scan', x: 0, y: -40, width: doc.page.w, height: 40, fill: `url(#${scanId})` }));
    }
    fxG.replaceChildren(...fx);
  }

  /* ------------------------------------------------------------ overlay */

  function rect(b, cls, rx = 2) {
    return s('rect', { class: cls, x: b[0].toFixed(1), y: b[1].toFixed(1), width: Math.max(1, b[2]).toFixed(1), height: Math.max(1, b[3]).toFixed(1), rx });
  }

  /** A tab on a box's top-left edge: an optional number part and a label. */
  function tab(b, n, text, cls = '') {
    if (!b) return null;
    const nw = n != null ? String(n).length * 5 + 7 : 0;
    const tw = text ? text.length * 4.55 + 8 : 0;
    const w = nw + tw;
    const x = clamp(b[0], 0, doc.page.w - w);
    const y = b[1] - 12 >= 0 ? b[1] - 12 : b[1] + 1;
    return s('g', { class: ['pl-tab', cls], transform: `translate(${x.toFixed(1)} ${y.toFixed(1)})` },
      n != null ? [s('rect', { class: 'pl-tab__n', width: nw, height: 11, rx: 2 }), s('text', { class: 'pl-tab__nt', x: nw / 2, y: 8.2, 'text-anchor': 'middle' }, String(n))] : null,
      text ? [s('rect', { class: 'pl-tab__b', x: nw, width: tw, height: 11, rx: 2 }), s('text', { class: 'pl-tab__t', x: nw + 4, y: 8 }, text)] : null);
  }

  /** A marker disc with a pass / warning / fail glyph at a box's top-right corner. */
  function marker(b, result) {
    const x = clamp(b[0] + b[2], 8, doc.page.w - 8);
    const y = clamp(b[1], 8, doc.page.h - 8);
    return s('g', { class: `pl-marker is-${result}`, transform: `translate(${x.toFixed(1)} ${y.toFixed(1)})` },
      s('circle', { r: 7.5 }),
      s('g', { transform: 'translate(-6 -6) scale(.5)' }, ICONS[result].map(([tag, attrs]) => s(tag, { ...attrs, fill: 'none' }))));
  }

  function mark(keys, kind, children, extra = {}) {
    return s('g', { class: `pl-m pl-m--${kind}`, 'data-keys': [].concat(keys).join(' '), ...extra }, children);
  }

  const OVERLAYS = {
    ingest(o) {
      const c = 12;
      const m = 5;
      const { w: W, h: H } = doc.page;
      const crop = s('g', { class: 'pl-crop' }, [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]]
        .map(([x, y, dx, dy]) => s('path', { d: `M${x} ${y + dy * c}V${y}H${x + dx * c}` })));
      const over = [crop];
      for (const chk of o.checks || []) {
        if (!chk.at) continue;
        const bs = boxesOf(chk.at).map((b) => grow(b, 3));
        if (bs.length) over.push(mark(chk.id, `check is-${chk.result}`, [...bs.map((b) => rect(b, 'pl-b')), tab(bs[0], null, `${chk.name} · ${RESULT[chk.result]}`, `is-${chk.result}`)]));
      }
      return { over };
    },
    read() {
      const under = [];
      const over = [];
      for (const line of doc.lines) {
        const ws = doc.words.get(line.id);
        const boxes = ws.map((w) => charBox(line.id, w.i, w.text.length));
        under.push(mark(line.id, 'word', ws.map((w, k) => rect(grow(boxes[k], 1), `pl-w is-${bandOf(w.conf)}`, 1.5))));
        const flags = ws.map((w, k) => {
          const b = grow(boxes[k], 1);
          if (w.conf >= FLAG) return null;
          return w.conf < LOW ? rect(b, 'pl-flag is-low', 1.5) : s('line', { class: 'pl-flag is-mid', x1: b[0], x2: b[0] + b[2], y1: b[1] + b[3], y2: b[1] + b[3] });
        });
        over.push(mark(line.id, 'line', [rect(grow(lineBox(line.id), 2.5), 'pl-b'), ...flags]));
      }
      return { under, over };
    },
    layout() {
      return {
        over: doc.regions.map((r, i) => {
          const b = regionBox(r);
          return mark(r.id, 'region', [rect(b, 'pl-b'), r.rows ? grid(r, b) : null, tab(b, i + 1, types[r.type] || r.type)], { 'data-type': r.type });
        }),
      };
    },
    classify(o) {
      return { over: (o.cues || []).map((c, i) => mark(`cue-${i}`, 'cue', boxesOf(c.at).map((b, k) => [rect(grow(b, 2), 'pl-b'), k === 0 ? tab(grow(b, 2), i + 1, 'Cue') : null]))) };
    },
    extract(o) {
      const fields = o.fields || [];
      return {
        under: fields.map((f) => mark(f.key, 'fill', boxesOf(f.at).map((b) => rect(grow(b, 2), 'pl-fill')))),
        over: fields.map((f, i) => {
          const bs = boxesOf(f.at).map((b) => grow(b, 2));
          return mark(f.key, `field${f.conf < FLAG ? ' is-review' : ''}`, [...bs.map((b) => rect(b, 'pl-b')), tab(bs[0], i + 1, null, 'pl-tab--n'), tab(bs[0], i + 1, f.key, 'pl-tab--full')]);
        }),
      };
    },
    entities(o) {
      const spans = o.spans || [];
      return {
        under: spans.map((e, i) => mark(`e${i}`, 'fill', boxesOf(e.at).map((b) => rect(grow(b, 1.5), 'pl-fill')), { 'data-ent': e.type })),
        over: spans.map((e, i) => {
          const bs = boxesOf(e.at).map((b) => grow(b, 1.5));
          return mark(`e${i}`, 'ent', [...bs.map((b) => s('line', { class: 'pl-uline', x1: b[0], x2: b[0] + b[2], y1: b[1] + b[3], y2: b[1] + b[3] })), tab(bs[0], null, e.type)], { 'data-ent': e.type });
        }),
      };
    },
    verify(o) {
      return {
        over: (o.checks || []).map((c) => {
          const bs = boxesOf(c.at).map((b) => grow(b, 2));
          return bs.length ? mark(c.id, `check is-${c.result}`, [...bs.map((b) => rect(b, 'pl-b')), marker(union(bs), c.result)]) : null;
        }),
      };
    },
    ask(o) {
      const sel = picks.ask.get(doc.id) || 0;
      return {
        over: (o.qa || []).map((q, i) => {
          const at = q.abstain ? q.near : q.at;
          if (!at) return null;
          const bs = boxesOf(at).map((b) => grow(b, 2.5));
          return mark(`q${i}`, `${q.abstain ? 'near' : 'answer'} pl-m--pick${i === sel ? ' is-sel' : ''}`,
            [...bs.map((b) => rect(b, 'pl-b')), tab(bs[0], null, q.abstain ? 'Closest text, not an answer' : `Answer · ${fix(q.conf)}`)]);
        }),
      };
    },
    summarise(o) {
      const cited = new Map();
      (o.sentences || []).forEach((snt, i) => refsOf(snt.at).forEach((ref) => cited.set(ref, [...(cited.get(ref) || []), i])));
      return {
        over: [...cited].map(([ref, idx]) => {
          const b = boxOf(ref);
          return mark(idx.map((i) => `s${i}`), 'cite', [rect(b, 'pl-b'), tab(b, null, idx.map((i) => `[${i + 1}]`).join(' '))]);
        }),
      };
    },
    translate(o) {
      const sel = picks.translate.get(doc.id) || 0;
      return {
        over: (o.items || []).map((it, i) => {
          const b = boxOf(it.at);
          return mark(`t${i}`, `focus pl-m--pick${i === sel ? ' is-sel' : ''}`, [rect(grow(b, 2), 'pl-b'), tab(grow(b, 2), null, 'FR → EN')]);
        }),
      };
    },
    remember(o) {
      const over = (o.claims || []).map((c, i) => {
        const bs = boxesOf(c.at).map((b) => grow(b, 2));
        return mark(`c${i}`, `claim${c.status === 'review' ? ' is-review' : ''}`, [...bs.map((b) => rect(b, 'pl-b')), tab(bs[0], i + 1, 'Claim')]);
      });
      if (o.reconcile) {
        const bs = boxesOf(o.reconcile.at).map((b) => grow(b, 5));
        over.push(mark('rec', 'rec', [...bs.map((b) => rect(b, 'pl-b')), tab(bs[0], null, o.reconcile.outcome || 'Reconciled')]));
      }
      return { over };
    },
  };

  // Lines between the columns and rows of a rebuilt table.
  function grid(r, b) {
    const rows = r.rows.map((row) => row.map((lid) => (lid ? lineBox(lid) : null)));
    const lines = [];
    for (let j = 1; j < r.rows[0].length; j += 1) {
      const left = Math.max(...rows.map((row) => row.slice(0, j).filter(Boolean).map((c) => c[0] + c[2])).flat());
      const right = Math.min(...rows.map((row) => row[j]).filter(Boolean).map((c) => c[0]));
      if (Number.isFinite(left) && Number.isFinite(right)) {
        const xx = right > left ? (left + right) / 2 : right - 3;
        lines.push(s('line', { x1: xx, x2: xx, y1: b[1], y2: b[1] + b[3] }));
      }
    }
    const spans = rows.map((row) => union(row));
    for (let k = 0; k < spans.length - 1; k += 1) {
      const yy = (spans[k][1] + spans[k][3] + spans[k + 1][1]) / 2;
      lines.push(s('line', { x1: b[0], x2: b[0] + b[2], y1: yy, y2: yy }));
    }
    return s('g', { class: 'pl-grid' }, lines);
  }

  function drawOverlay() {
    const st = stages[state.stage];
    const o = doc.out[st.id] || {};
    estimated = false;
    const { under = [], over = [] } = (OVERLAYS[st.id] || (() => ({})))(o);
    const marks = [...under, ...over].filter(Boolean);
    if (!ctx.reducedMotion) marks.forEach((m, i) => m.style.setProperty('--d', `${Math.min(i, 24) * 18}ms`));
    underG.replaceChildren(...under.filter(Boolean));
    overG.replaceChildren(...over.filter(Boolean));
    svgTitle.textContent = pageTitle();
    syncHot();
  }

  const pageTitle = () => {
    const st = stages[state.stage];
    return `${doc.title}, a fictional document, page 1 of 1. ${describe(st, doc.out[st.id] || {})}`;
  };

  // What the overlay shows, for the SVG's title.
  function describe(st, o) {
    const issues = (list) => list.filter((c) => c.result !== 'pass');
    switch (st.id) {
      case 'ingest': {
        const warn = issues(o.checks || []);
        return `Capture checks: page edges detected${warn.length ? `, ${warn.map((c) => `${lc(c.name)} ${lc(RESULT[c.result])}`).join(', ')}` : ', all checks pass'}${o.effect ? '; the page is shown as captured, before correction' : ''}.`;
      }
      case 'read': {
        const n = [...doc.words.values()].flat().filter((w) => w.conf < FLAG).length;
        return `Every word tinted by recognition confidence; ${plural(n, 'word')} flagged below 0.90, underlined or outlined.`;
      }
      case 'layout': return `${doc.regions.length} typed regions, numbered in reading order.`;
      case 'classify': return `Classified as ${lc(o.top[0].type)}; ${plural(o.cues.length, 'region')} that cue the type are outlined.`;
      case 'extract': return `${plural(o.fields.length, 'extracted field')}, each boxed and numbered.`;
      case 'entities': return `${plural(o.spans.length, 'entity', 'entities')} highlighted and labelled by type.`;
      case 'verify': return `${plural(o.checks.length, 'check')} marked on the boxes they involve: ${tally(o.checks)}.`;
      case 'ask': {
        const q = o.qa[picks.ask.get(doc.id) || 0];
        return q.abstain ? `No answer box: the document cannot answer “${q.q}”${q.near ? '; the closest text is outlined' : ''}.` : `The answer to “${q.q}” is highlighted.`;
      }
      case 'summarise': return `Regions cited by the ${plural(o.sentences.length, 'summary sentence')}, with their citation numbers.`;
      case 'translate': {
        const it = o.items[picks.translate.get(doc.id) || 0];
        return `Region ${it.at} selected for translation from French to English.`;
      }
      case 'remember': return `${plural(o.claims.length, 'claim')} written to memory, outlined on the text they come from.`;
      default: return '';
    }
  }

  function tally(checks) {
    return ['pass', 'warn', 'fail'].map((r) => [r, checks.filter((c) => c.result === r).length])
      .filter(([, n]) => n).map(([r, n]) => (r === 'warn' ? plural(n, 'warning') : `${n} ${TALLY[r]}`)).join(', ');
  }

  /* ------------------------------------------------------- output parts */

  const sec = (text, extra) => h('p', { class: 'pl-sec' }, text, extra || null);
  const ill = (text = 'Illustrative') => h('span', { class: 'pl-ill', text });

  function item(keys, ...kids) {
    const attrs = { class: 'pl-item' };
    if (keys && keys.length) { attrs.dataset = { keys: keys.join(' ') }; attrs.tabindex = '-1'; }
    return h('li', attrs, kids);
  }

  function ref(r) {
    return h('span', { class: 'pl-ref' }, hidden('source '), refId(r));
  }
  function refs(at) {
    const ids = [...new Set(refsOf(at).map(refId))];
    return ids.length ? h('span', { class: 'pl-refs' }, ids.map(ref)) : null;
  }
  function conf(c, cls) {
    const band = bandOf(Math.round(c * 100) / 100);  // the band of the value shown
    return h('span', { class: ['pl-conf', `is-${band}`, cls] }, hidden('confidence '), fix(c));
  }
  const review = (text = 'Review') => h('span', { class: 'pl-review' }, icon('warn'), text);
  const result = (r) => h('span', { class: `pl-res is-${r}` }, icon(r), RESULT[r]);
  const meter = (v) => h('span', { class: 'pl-meter', 'aria-hidden': 'true' }, h('span', { style: { width: `${clamp(v, 0, 1) * 100}%` } }));
  const textOf = (r) => linesOf(r).map((lid) => doc.lineMap.get(lid).t);

  function validity(c) {
    if (c.to) return h('span', { class: 'pl-valid' }, c.from, h('span', { 'aria-hidden': 'true', text: ' → ' }), hidden(' to '), c.to);
    return h('span', { class: 'pl-valid' }, `valid from ${c.from}`);
  }

  function legend() {
    return h('ul', { class: 'pl-legend', 'aria-label': 'Confidence bands' },
      ['ok', 'mid', 'low'].map((b) => h('li', {}, h('span', { class: `pl-sw is-${b}`, 'aria-hidden': 'true' }), BAND[b])));
  }

  /** A pick list (questions, regions to translate) with a card for the picked one. */
  function picker(kind, list, label, keyOf, cardOf) {
    const sel = () => picks[kind].get(doc.id) || 0;
    const card = h('div', { class: 'pl-pickcard' });
    const btns = list.map((x, i) => h('button', {
      type: 'button', class: 'pl-pick', 'aria-pressed': String(i === sel()), dataset: { keys: keyOf(i) },
      onClick: () => {
        picks[kind].set(doc.id, i);
        btns.forEach((b, j) => b.setAttribute('aria-pressed', String(i === j)));
        card.replaceChildren(cardOf(list[i], i));
        $$('.pl-m--pick', overG).forEach((m) => m.classList.toggle('is-sel', m.dataset.keys === keyOf(i)));
        svgTitle.textContent = pageTitle();
        ctx.announce(card.textContent.replace(/\s+/g, ' ').trim().slice(0, 240));
      },
    }, label(x, i)));
    card.replaceChildren(cardOf(list[sel()], sel()));
    return [h('div', { class: `pl-picks pl-picks--${kind}`, role: 'group', 'aria-label': kind === 'ask' ? 'Questions' : 'Regions to translate' }, btns), card];
  }

  const VIEWS = {
    ingest(o) {
      return [
        h('div', { class: 'pl-score' },
          h('span', { class: 'pl-score__v', text: fix(o.score) }),
          h('span', { class: 'pl-score__b' },
            h('span', { class: 'pl-score__k', text: 'Capture quality' }), meter(o.score),
            h('span', { class: `pl-score__verdict is-${o.checks.some((c) => c.result !== 'pass') ? 'warn' : 'pass'}` }, icon(o.checks.some((c) => c.result !== 'pass') ? 'warn' : 'pass'), o.verdict))),
        h('dl', { class: 'pl-dl' }, [['Format', o.format], ['Pages', o.pages], ['Source', o.source], ['Resolution', o.resolution]]
          .map(([k, v]) => h('div', {}, h('dt', { text: k }), h('dd', { text: String(v) })))),
        sec('Quality checks'),
        h('ul', { class: 'pl-list' }, o.checks.map((c) => item(c.at ? [c.id] : null,
          h('div', { class: 'pl-row' }, result(c.result), h('b', { text: c.name }), h('span', { class: 'pl-mono pl-push', text: c.value })),
          c.note ? h('p', { class: 'pl-note', text: c.note }) : null))),
        sec('Applied'),
        h('ul', { class: 'pl-bullets' }, o.actions.map((a) => h('li', { text: a }))),
      ];
    },
    read(o) {
      const all = [...doc.words.values()].flat();
      const flagged = all.filter((w) => w.conf < FLAG).length;
      return [
        h('ul', { class: 'pl-chips', 'aria-label': 'Recognition' }, [o.lang, `${o.script} script`, o.mode, `mean ${fix(mean(all), 3)}`, `${flagged} flagged`].map((t) => h('li', { text: t }))),
        legend(),
        sec(`Text lines · ${doc.lines.length}`),
        h('ol', { class: 'pl-list pl-lines' }, doc.lines.map((l) => item([l.id],
          h('span', { class: 'pl-lid', text: l.id }),
          h('span', { class: 'pl-ltext', lang: 'fr' }, doc.words.get(l.id).map((w, k) => [k ? ' ' : '',
            w.conf < FLAG ? h('mark', { class: `pl-wflag is-${bandOf(w.conf)}` }, w.text, h('span', { class: 'pl-wflag__c' }, hidden(' confidence '), fix(w.conf))) : w.text])),
          conf(mean(doc.words.get(l.id)), 'pl-push')))),
      ];
    },
    layout() {
      return [
        sec(`Regions · ${doc.regions.length}, in reading order`),
        h('ol', { class: 'pl-list pl-regions' }, doc.regions.map((r, i) => {
          const text = textOf(r).join(' ');
          return item([r.id],
            h('div', { class: 'pl-row' },
              h('span', { class: 'pl-ord', text: String(i + 1) }),
              h('span', { class: 'pl-type', dataset: { type: r.type }, text: types[r.type] || r.type }),
              h('span', { class: 'pl-preview', lang: text ? 'fr' : null, text: text || 'Graphic, no text' }),
              h('span', { class: 'pl-mono pl-push pl-dim', text: r.id })),
            r.rows ? table(r) : null);
        })),
      ];
    },
    classify(o) {
      return [
        sec('Document type · top 3'),
        h('ol', { class: 'pl-bars' }, o.top.map((t, i) => h('li', { class: i === 0 ? 'is-top' : null },
          h('span', { class: 'pl-bars__t' }, t.type, i === 0 ? h('span', { class: 'pl-bars__pick', text: 'Chosen' }) : null),
          h('span', { class: 'pl-bars__bar', 'aria-hidden': 'true' }, h('span', { style: { width: `${t.score * 100}%` } })),
          h('span', { class: 'pl-mono', text: fix(t.score) })))),
        h('div', { class: 'pl-card pl-route' }, icon('arrow'),
          h('div', { class: 'pl-card__b' }, h('p', { class: 'pl-card__k', text: 'Routed to' }), h('p', { class: 'pl-card__v', text: o.route.dest }), h('p', { class: 'pl-note', text: o.route.why }))),
        sec('Cues on the page'),
        h('ul', { class: 'pl-list' }, o.cues.map((c, i) => item([`cue-${i}`],
          h('div', { class: 'pl-row' }, h('span', { class: 'pl-ord', text: String(i + 1) }), h('span', { text: c.text }), h('span', { class: 'pl-push' }, refs(c.at)))))),
      ];
    },
    extract(o) {
      const held = o.fields.filter((f) => f.conf < FLAG).length;
      return [
        sec(`Fields · ${o.fields.length}`, held ? ` · ${held} for review` : null),
        h('ol', { class: 'pl-list pl-fields' }, o.fields.map((f, i) => item([f.key],
          h('div', { class: 'pl-row' },
            h('span', { class: 'pl-ord', text: String(i + 1) }), h('span', { class: 'pl-key', text: f.key }),
            f.conf < FLAG ? review() : null, conf(f.conf, 'pl-push')),
          h('div', { class: 'pl-kv' },
            h('span', { class: 'pl-raw', lang: 'fr', text: f.raw }),
            h('span', { class: 'pl-arrow', 'aria-hidden': 'true' }, icon('arrow')), hidden(' normalised to '),
            h('span', { class: 'pl-norm', text: f.norm }),
            h('span', { class: 'pl-push' }, refs(f.at)))))),
      ];
    },
    entities(o) {
      return [
        sec(`Entities · ${o.spans.length}`, [' · ', ill('Links illustrative')]),
        h('ul', { class: 'pl-list' }, o.spans.map((e, i) => item([`e${i}`],
          h('div', { class: 'pl-row' },
            h('span', { class: 'pl-ent', dataset: { ent: e.type }, text: e.type }),
            h('span', { class: 'pl-etext', lang: 'fr', text: e.text }),
            e.id ? h('span', { class: 'pl-mono pl-push pl-link' }, icon('link'), hidden('linked to '), e.id) : h('span', { class: 'pl-mono pl-push pl-dim' }, hidden('normalised '), e.norm)),
          e.seen ? h('p', { class: 'pl-note' }, h('b', { text: 'Also seen in ' }), e.seen, ' ', ill()) : null))),
        h('p', { class: 'pl-foot', text: 'Entity ids and “also seen in” notes are illustrative: no knowledge base sits behind this demo.' }),
      ];
    },
    verify(o) {
      return [
        h('ul', { class: 'pl-tally', 'aria-label': 'Results' }, ['pass', 'warn', 'fail'].map((r) => {
          const n = o.checks.filter((c) => c.result === r).length;
          return n ? h('li', { class: `is-${r}` }, icon(r), r === 'warn' ? plural(n, 'warning') : `${n} ${TALLY[r]}`) : null;
        })),
        h('ul', { class: 'pl-list' }, o.checks.map((c) => item([c.id],
          h('div', { class: 'pl-row' }, result(c.result), h('b', { text: c.name })),
          h('p', { class: 'pl-note', text: c.detail }),
          refs(c.at)))),
      ];
    },
    ask(o) {
      return [
        sec('Suggested questions'),
        ...picker('ask', o.qa, (q) => q.q, (i) => `q${i}`, (q) => (q.abstain
          ? h('div', { class: 'pl-card pl-answer is-abstain' },
            h('p', { class: 'pl-card__k' }, icon('abstain'), 'Abstains · not in the document'),
            h('p', { class: 'pl-card__q', text: q.q }),
            h('p', { class: 'pl-card__v', text: q.a }),
            q.near ? h('p', { class: 'pl-note' }, 'Closest text, outlined on the page: ', refs(q.near)) : null)
          : h('div', { class: 'pl-card pl-answer' },
            h('p', { class: 'pl-card__k' }, icon('pass'), 'Answer'),
            h('p', { class: 'pl-card__q', text: q.q }),
            h('p', { class: 'pl-card__v', text: q.a }),
            h('div', { class: 'pl-row' }, h('span', { class: 'pl-dim', text: 'Cites' }), refs(q.at), q.conf < FLAG ? review('Low confidence') : null, conf(q.conf, 'pl-push'))))),
      ];
    },
    summarise(o) {
      return [
        sec(`Summary · ${plural(o.sentences.length, 'sentence')}`),
        h('ol', { class: 'pl-list pl-summary' }, o.sentences.map((snt, i) => item([`s${i}`],
          h('p', {}, h('span', { class: 'pl-cite', text: `[${i + 1}]` }), ' ', snt.t),
          h('div', { class: 'pl-row' }, h('span', { class: 'pl-dim', text: 'Cites' }), refs(snt.at))))),
      ];
    },
    translate(o) {
      return [
        sec('Region'),
        ...picker('translate', o.items, (it) => `${it.at} · ${types[doc.regionMap.get(it.at)?.type] || 'Region'}`, (i) => `t${i}`, (it) => h('div', { class: 'pl-tr' },
          h('div', { class: 'pl-tr__side' }, h('p', { class: 'pl-tr__k', text: 'French · source' }),
            h('p', { class: 'pl-tr__text', lang: 'fr' }, textOf(doc.regionMap.get(it.at) || {}).map((t) => h('span', { text: t })))),
          h('div', { class: 'pl-tr__side is-dst' }, h('p', { class: 'pl-tr__k', text: 'English · target' }), h('p', { class: 'pl-tr__text', lang: 'en', text: it.dst })),
          it.terms && it.terms.length ? h('div', { class: 'pl-tr__terms' }, h('p', { class: 'pl-tr__k', text: 'Terminology kept' }),
            h('ul', {}, it.terms.map(([fr, en]) => h('li', {}, h('span', { lang: 'fr', text: fr }), h('span', { 'aria-hidden': 'true', text: ' → ' }), hidden(' becomes '), en)))) : null)),
      ];
    },
    remember(o, st) {
      return [
        sec(`Claims written · ${o.claims.length}`, [' · ', ill()]),
        h('ul', { class: 'pl-list pl-claims' }, o.claims.map((c, i) => item([`c${i}`],
          h('p', { class: 'pl-claim' }, h('span', { class: 'pl-ord', text: String(i + 1) }), h('b', { text: c.s }), ' ', h('span', { class: 'pl-claim__p', text: c.p }), ' ', h('span', { class: 'pl-claim__o', text: c.o })),
          h('div', { class: 'pl-row pl-meta' }, validity(c), h('span', { class: 'pl-prov' }, hidden('provenance '), doc.ref, ' ', refs(c.at)), c.status === 'review' ? review('Held for review') : null),
          c.note ? h('p', { class: 'pl-note', text: c.note }) : null))),
        o.reconcile ? h('ul', { class: 'pl-list' }, item(['rec'], h('div', { class: 'pl-card pl-rec' }, icon('memory'),
          h('div', { class: 'pl-card__b' }, h('p', { class: 'pl-card__k' }, 'Reconciliation · ', h('b', { text: o.reconcile.outcome })), h('p', { class: 'pl-card__v', text: o.reconcile.text }), refs(o.reconcile.at))))) : null,
        h('p', { class: 'pl-foot' }, 'Illustrative: the earlier documents and the memory itself are scripted. ',
          h('a', { href: st.product.url }, `How ${st.product.name} keeps claims`, h('span', { 'aria-hidden': 'true', text: ' →' }))),
      ];
    },
  };

  // A rebuilt table, rows × columns, with the header row as column heads.
  function table(r) {
    const cell = (lid) => (lid ? doc.lineMap.get(lid).t : '');
    const [head, ...body] = r.rows;
    // Row headers: the widest left-aligned column (designation, label).
    let rh = 0;
    head.forEach((lid, j) => {
      const l = lid && doc.lineMap.get(lid);
      const best = head[rh] && doc.lineMap.get(head[rh]);
      if (l && l.a !== 'end' && (!best || l.b[2] > best.b[2])) rh = j;
    });
    const num = head.map((lid) => Boolean(lid && doc.lineMap.get(lid).a === 'end'));
    return h('div', { class: 'pl-tblwrap' },
      h('p', { class: 'pl-dim', text: `Rebuilt as ${r.rows.length} rows × ${head.length} columns` }),
      h('table', { class: 'pl-tbl', lang: 'fr' },
        h('thead', {}, h('tr', {}, head.map((lid, j) => h('th', { scope: 'col', class: num[j] ? 'is-num' : null, text: cell(lid) })))),
        h('tbody', {}, body.map((row) => h('tr', {}, row.map((lid, j) => (j === rh
          ? h('th', { scope: 'row', text: cell(lid) })
          : h('td', { class: num[j] ? 'is-num' : null, text: cell(lid) }))))))));
  }

  /* --------------------------------------------------------------- JSON */

  function clean(v) {
    if (Array.isArray(v)) return v.map(clean);
    if (!v || typeof v !== 'object') return v;
    const o = {};
    for (const [k, x] of Object.entries(v)) {
      if (k === 'brief' || k === 'effect') continue;
      if (k === 'at' || k === 'near') {
        o[JSON_KEYS[k]] = refsOf(x).map((r) => (isBox(r) ? { box: r } : { ref: refId(r), ...(r.includes('#') ? { text: r.slice(r.indexOf('#') + 1) } : {}), box: rounded(boxOf(r)) }));
      } else if (k === 'terms') {
        o.terms = x.map(([fr, en]) => ({ fr, en }));
      } else {
        o[JSON_KEYS[k] || k] = clean(x);
      }
    }
    return o;
  }

  function stageJSON(st) {
    const o = doc.out[st.id] || {};
    const head = { stage: st.id, product: st.product.id, document: doc.ref, fictional: true };
    if (st.id === 'read') {
      return {
        ...head, language: o.lang, script: o.script, mode: o.mode, flag_below: FLAG,
        lines: doc.lines.map((l) => {
          const ws = doc.words.get(l.id);
          return { id: l.id, box: rounded(lineBox(l.id)), text: l.t, confidence: mean(ws), words: ws.map((w) => ({ text: w.text, confidence: w.conf })) };
        }),
      };
    }
    if (st.id === 'layout') {
      return {
        ...head,
        regions: doc.regions.map((r, i) => ({
          id: r.id, type: r.type, order: i + 1, box: rounded(regionBox(r)), lines: linesOf(r),
          table: r.rows ? { rows: r.rows.length, columns: r.rows[0].length, cells: r.rows.map((row) => row.map((lid) => (lid ? doc.lineMap.get(lid).t : ''))) } : undefined,
        })),
      };
    }
    const body = clean(o);
    if (st.id === 'translate') {
      body.source_language = 'fr';
      body.target_language = 'en';
      body.items.forEach((it, i) => { it.source_text = textOf(doc.regionMap.get(o.items[i].at) || {}).join('\n'); });
    }
    return { ...head, ...body };
  }

  /* ------------------------------------------------------------- render */

  function renderOutput() {
    const st = stages[state.stage];
    const o = doc.out[st.id] || {};
    outStep.replaceChildren(h('span', { 'aria-hidden': 'true', text: `${two(state.stage + 1)} / ${two(stages.length)}` }), hidden(`Step ${state.stage + 1} of ${stages.length}`), ` · ${st.groupName || ''}`);
    outName.textContent = st.name;
    outBrief.textContent = o.brief || '';
    chip.href = st.product.url;
    chip.replaceChildren(h('b', { text: st.product.name }), ` · ${st.product.role}`, h('span', { class: 'c-pipeline__chip-a', 'aria-hidden': 'true' }, icon('arrow')));
    view.setAttribute('aria-label', `${st.name} output, ${lc(doc.name)}`);
    pre.setAttribute('aria-label', `${st.name} output as JSON, ${lc(doc.name)}`);
    hoverKeys = null;
    focusKeys = null;
    view.replaceChildren(...(VIEWS[st.id] ? VIEWS[st.id](o, st) : []).filter(Boolean));
    view.scrollTop = 0;
    const first = $('.pl-item[data-keys]', view);
    if (first) first.tabIndex = 0;
    if (!ctx.reducedMotion) view.animate([{ opacity: 0, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }], { duration: 220, easing: 'ease-out' });
    if (state.format === 'json') renderJSON();
  }

  function renderJSON() {
    pre.replaceChildren(...highlight(pretty(stageJSON(stages[state.stage]))));
    pre.scrollTop = 0;
  }

  function renderStage() {
    const st = stages[state.stage];
    applyEffects(st.id);
    drawOverlay();
    renderOutput();
    stageTabs.forEach((t, j) => {
      const on = j === state.stage;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      t.dataset.state = j < state.stage ? 'done' : on ? 'current' : 'next';
    });
    stagePanel.setAttribute('aria-labelledby', stageTabs[state.stage].id);
    root.dataset.stage = st.id;
    syncTransport();
  }

  function selectDoc(i, { announce = true } = {}) {
    state.doc = clamp(i, 0, docs.length - 1);
    doc = docs[state.doc];
    docTabs.forEach((t, j) => {
      t.setAttribute('aria-selected', String(j === state.doc));
      t.tabIndex = j === state.doc ? 0 : -1;
    });
    docPanel.setAttribute('aria-labelledby', docTabs[state.doc].id);
    drawPage();
    renderStage();
    if (announce) ctx.announce(`${doc.family_label}: ${doc.name}, fictional. ${say()}`);
  }

  function goStage(j, { announce = true } = {}) {
    state.stage = clamp(j, 0, last);
    renderStage();
    if (announce) ctx.announce(say());
  }

  const say = () => {
    const st = stages[state.stage];
    return `Step ${state.stage + 1} of ${stages.length}, ${st.name} · ${st.product.name}: ${(doc.out[st.id] || {}).brief || ''}`;
  };

  function step(d) {
    const j = state.stage + d;
    if (j < 0 || j > last) return;
    goStage(j);
  }

  function setFormat(f) {
    state.format = f;
    fmtBtns.forEach((b, i) => b.setAttribute('aria-pressed', String(['view', 'json'][i] === f)));
    view.hidden = f !== 'view';
    pre.hidden = f !== 'json';
    if (f === 'json') renderJSON();
    setHot(null);
  }

  // Font loading or a first layout after a hidden start: measure again.
  function relayout() {
    if (!fitText()) return;
    boxCache = new Map();
    drawOverlay();
    if (state.format === 'json') renderJSON();
  }

  /* ----------------------------------------------------- linked highlight */

  function setHot(keys) {
    const set = keys && keys.length ? new Set(keys) : null;
    const hit = (el) => Boolean(set) && el.dataset.keys.split(' ').some((k) => set.has(k));
    $$('[data-keys]', svg).forEach((el) => el.classList.toggle('is-hot', hit(el)));
    $$('[data-keys]', view).forEach((el) => el.classList.toggle('is-hot', hit(el)));
    svg.classList.toggle('has-hot', Boolean(set));
  }
  const syncHot = () => setHot(hoverKeys || focusKeys);
  const keysOf = (el) => (el && el.dataset.keys ? el.dataset.keys.split(' ') : null);

  view.addEventListener('pointerover', (e) => {
    const keys = keysOf(e.target.closest('[data-keys]'));
    if (String(keys) === String(hoverKeys)) return;
    hoverKeys = keys;
    syncHot();
  });
  view.addEventListener('pointerleave', () => { hoverKeys = null; syncHot(); });
  view.addEventListener('focusin', (e) => {
    const el = e.target.closest('[data-keys]');
    if (el && el.classList.contains('pl-item')) $$('.pl-item[data-keys]', view).forEach((c) => { c.tabIndex = c === el ? 0 : -1; });
    focusKeys = keysOf(el);
    syncHot();
  });
  view.addEventListener('focusout', (e) => {
    if (!view.contains(e.relatedTarget)) { focusKeys = null; syncHot(); }
  });
  // Arrow keys move between output items: one tab stop for the whole list.
  view.addEventListener('keydown', (e) => {
    const items = $$('.pl-item[data-keys]', view);
    const i = items.indexOf(document.activeElement);
    if (i < 0) return;
    const to = { ArrowDown: i + 1, ArrowUp: i - 1, Home: 0, End: items.length - 1 }[e.key];
    if (to === undefined) return;
    e.preventDefault();
    items[clamp(to, 0, items.length - 1)].focus();
  });

  svg.addEventListener('pointerover', (e) => {
    const keys = keysOf(e.target.closest('[data-keys]'));
    if (String(keys) === String(hoverKeys)) return;
    hoverKeys = keys;
    syncHot();
    if (keys && !view.hidden) {
      const el = $$('[data-keys]', view).find((c) => c.dataset.keys.split(' ').some((k) => keys.includes(k)));
      if (el) bringIntoView(el);
    }
  });
  svg.addEventListener('pointerleave', () => { hoverKeys = null; syncHot(); });

  // Scroll the output panel only, never the page.
  function bringIntoView(el) {
    const v = view.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    if (r.top < v.top) view.scrollTop -= v.top - r.top + 8;
    else if (r.bottom > v.bottom) view.scrollTop += r.bottom - v.bottom + 8;
  }

  /* ----------------------------------------------------------- playback */

  function syncTransport() {
    counter.replaceChildren(h('span', { 'aria-hidden': 'true' }, h('b', { text: two(state.stage + 1) }), ` / ${two(stages.length)}`), hidden(`Step ${state.stage + 1} of ${stages.length}`));
    prevBtn.setAttribute('aria-disabled', String(state.stage === 0));
    nextBtn.setAttribute('aria-disabled', String(state.stage === last));
    playIcon.replaceChildren(icon(playing ? 'pause' : 'play'));
    playText.textContent = playing ? 'Pause' : 'Run the chain';
    root.classList.toggle('is-playing', playing);
    $$('.c-pipeline__prog', rail).forEach((el) => el.remove());
    if (playing && timer) stageTabs[state.stage].append(h('span', { class: 'c-pipeline__prog', 'aria-hidden': 'true' }));
  }

  // On screen now, measured rather than remembered from the last observer call.
  const onScreen = () => {
    const r = root.getBoundingClientRect();
    return r.width > 0 && r.bottom > 0 && r.top < window.innerHeight;
  };

  function schedule() {
    clearTimeout(timer);
    timer = 0;
    if (playing && onScreen() && !document.hidden) {
      timer = setTimeout(() => {
        timer = 0;
        goStage(state.stage + 1, { announce: false });
        if (state.stage >= last) {
          stop();
          ctx.announce(`Chain complete. ${say()}`);
        } else schedule();
      }, STEP_MS);
    }
    syncTransport();
  }

  function stop() {
    if (!playing) return;
    playing = false;
    clearTimeout(timer);
    timer = 0;
    syncTransport();
  }

  // Under reduced motion there is no timer: each press steps one stage.
  function togglePlay() {
    if (playing) { stop(); ctx.announce('Paused.'); return; }
    if (ctx.reducedMotion) { goStage(state.stage >= last ? 0 : state.stage + 1); return; }
    playing = true;
    if (state.stage >= last) goStage(0, { announce: false });
    ctx.announce(`Running the chain on the ${lc(doc.name)}.`);
    schedule();
  }

  // Pause the clock while the explorer is off screen or the tab is hidden.
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(() => {
      if (playing && (!onScreen() || !timer)) schedule();
    }, { threshold: [0, 0.15] }).observe(root);
  }
  document.addEventListener('visibilitychange', () => { if (playing) schedule(); });

  /* -------------------------------------------------------------- start */

  if (document.fonts) {
    document.fonts.ready.then(relayout);
    document.fonts.addEventListener?.('loadingdone', relayout);
  }
  if ('ResizeObserver' in window) {
    let wasVisible = false;
    new ResizeObserver(() => {
      const visible = svg.getBoundingClientRect().width > 0;
      if (visible && (!wasVisible || estimated)) relayout();
      wasVisible = visible;
    }).observe(svg);
  }
  selectDoc(state.doc, { announce: false });
}
