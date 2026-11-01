// The harness cockpit: how Anamnesis reports a memory system.
//
// A simulation, not a measurement. Quality and cost per session come from
// the paper's own forms with illustrative parameters per document family:
//   warm–cold contrast        β2 + β3·log(1 + k)              (Eq. 17)
//   contamination             P_cont(k) = 1 − (1 − p_e·p_c)^k  (Eq. 11)
//   expected Memory Harm      w_m · P_cont(k) · D_KL           (Eq. 12)
//   cumulative cost ratio     CE_cum(k) = 1 − Σ warm / Σ cold  (Eq. 18)
//   safe horizon              k ≤ ln(1 − δ) / ln(1 − p_e·p_c)  (Cor. III.7)
// Retrieval-only gains access·log(1 + k); Experience Gain is warm minus
// retrieval-only on the same future document, net of Memory Harm.
import { h, s, $, $$, clamp, uid, roving } from '../lib/dom.js';
import { mathHTML } from '../lib/math.js';

const K_MAX = 60;
const f = (k) => Math.log(1 + k);

function model(fam, pc, repair) {
  const rows = [];
  let warmCost = 0;
  let coldCost = 0;
  for (let k = 0; k <= K_MAX; k += 1) {
    const pcont = 1 - (1 - fam.pe * pc) ** k;
    const mh = fam.wm * pcont * fam.dkl;
    const cold = fam.q0;
    const ret = fam.q0 + fam.access * f(k);
    const egClean = k === 0 ? 0 : fam.b2 + fam.b3 * f(k);
    const warm = ret + egClean - mh;
    // Session k + 1 is the evaluation point; costs accumulate over 1 … k + 1.
    const cW = 1 - fam.cost_save * (1 - Math.exp(-k / fam.tau)) + fam.maint;
    warmCost += cW;
    coldCost += 1;
    rows.push({ k, pcont, mh, cold, ret, warm, eg: warm - ret, ce: 1 - cW, ceCum: 1 - warmCost / coldCost });
  }
  const p = fam.pe * pc;
  return {
    rows,
    ff: repair ? fam.ff_l3 : fam.ff_l2,
    cr: repair ? fam.cr_l3 : fam.cr_l2,
    p,
    breakEven: (rows.find((r) => r.k > 0 && r.ceCum > 0) || {}).k,
  };
}

const horizon = (p, delta) => (p >= 1 ? 0 : p <= 0 ? Infinity : Math.log(1 - delta) / Math.log(1 - p));
const pct = (v, d = 0) => `${(v * 100).toFixed(d)}%`;
const signed = (v, d = 3) => `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(d)}`;

export default function init(root, ctx) {
  const data = ctx.data(root, 'cockpit');
  if (!data) return;
  const app = $('[data-app]', root);
  const staticEl = $('[data-static]', root);
  const id = uid('ck');
  const metric = Object.fromEntries(data.metrics.map((m) => [m.id, m]));

  const state = { fam: 0, k: 24, gate: data.gates.findIndex((g) => g.id === 'standard'), repair: true };
  if (state.gate < 0) state.gate = 0;

  /* ---------------------------------------------------------- controls */
  const tabs = data.families.map((fam, i) => h('button', {
    class: 'c-cockpit__tab', type: 'button', role: 'tab',
    id: `${id}-tab-${fam.id}`, 'aria-selected': String(i === state.fam), 'aria-controls': `${id}-panel`,
    tabindex: i === state.fam ? '0' : '-1', onClick: () => select(i),
  }, fam.label));
  const tablist = h('div', { class: 'c-cockpit__tabs', role: 'tablist', 'aria-label': 'Document family' }, tabs);
  roving(tabs, { onSelect: (i) => select(i) });

  const kOut = h('output', { class: 'c-cockpit__kout', for: `${id}-k` });
  const kInput = h('input', {
    type: 'range', id: `${id}-k`, min: '1', max: String(K_MAX), step: '1', value: String(state.k),
    onInput: (e) => { state.k = Number(e.target.value); render(); },
  });
  const gateBtns = data.gates.map((g, i) => h('button', {
    type: 'button', class: 'c-cockpit__seg', 'aria-pressed': String(i === state.gate),
    onClick: () => { state.gate = i; render(); },
  }, g.label));
  const repairInput = h('input', { type: 'checkbox', id: `${id}-repair`, checked: state.repair, onChange: (e) => { state.repair = e.target.checked; render(); } });

  const controls = h('div', { class: 'c-cockpit__controls' },
    h('div', { class: 'c-cockpit__ctl c-cockpit__ctl--k' },
      h('label', { for: `${id}-k` }, 'Sessions seen ', h('span', { class: 'math' }, 'k')), kOut, kInput),
    h('div', { class: 'c-cockpit__ctl', role: 'group', 'aria-label': 'Validation gate (Argus)' },
      h('span', { class: 'c-cockpit__ctl-k' }, 'Validation gate'), h('div', { class: 'c-cockpit__segs' }, gateBtns)),
    h('div', { class: 'c-cockpit__ctl c-cockpit__ctl--sw' },
      h('label', { class: 'switch', for: `${id}-repair` }, repairInput, h('span', { class: 'switch__ui', 'aria-hidden': 'true' }), h('span', {}, 'Schema repair on deletion (Level 3)'))),
  );

  /* -------------------------------------------------------------- KPIs */
  const kpiDefs = [
    { id: 'eg', note: 'vs retrieval-only, same future document' },
    { id: 'ce', note: 'cumulative compute saved, sessions 1 … k+1', cum: true },
    { id: 'mh', note: 'quality lost to contaminated state' },
    { id: 'ff', note: 'leakage removed by a deletion' },
    { id: 'cr', note: 'retained quality after the deletion' },
  ];
  const kpis = kpiDefs.map((d) => {
    const val = h('span', { class: 'kpi__v' });
    const el = h('div', { class: 'kpi', dataset: { metric: d.id } },
      h('span', { class: 'kpi__k' }, h('b', {}, d.cum ? 'CE' : metric[d.id].abbr), d.cum ? h('sub', {}, 'cum') : null, ' ', metric[d.id].name),
      val,
      h('span', { class: 'kpi__n' }, d.note));
    return { ...d, el, val };
  });

  /* ------------------------------------------------------------- chart */
  // Chart width follows its container so axis text stays legible on phones.
  let W = 640;
  const H = 250, PL = 44, PR = 14, PT = 14, PB = 30;
  const x = (k) => PL + (k / K_MAX) * (W - PL - PR);
  let yLo = 0.4, yHi = 1;
  const y = (q) => PT + (1 - (q - yLo) / (yHi - yLo)) * (H - PT - PB);
  const gradId = `${id}-g`;
  const chart = s('svg', { class: 'c-cockpit__chart', viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-labelledby': `${id}-chart-t` });
  const chartTitle = s('title', { id: `${id}-chart-t` });
  const gridG = s('g', { class: 'ck-grid' });
  const lines = {
    cold: s('path', { class: 'ck-line ck-line--cold' }),
    ret: s('path', { class: 'ck-line ck-line--ret' }),
    warm: s('path', { class: 'ck-line ck-line--warm', stroke: `url(#${gradId})` }),
  };
  const area = s('path', { class: 'ck-area' });
  const marker = s('g', { class: 'ck-marker' }, s('line', { y1: PT, y2: H - PB }), s('circle', { r: 4.5, class: 'ck-dot' }), s('text', { class: 'ck-mk-t', y: PT + 10 }));
  chart.append(
    chartTitle,
    s('defs', {}, s('linearGradient', { id: gradId, x1: '0', y1: '0', x2: '1', y2: '0' },
      s('stop', { offset: '0', 'stop-color': '#00c8ff' }), s('stop', { offset: '.55', 'stop-color': '#2f6bff' }), s('stop', { offset: '1', 'stop-color': '#c040ff' }))),
    gridG, area, lines.cold, lines.ret, lines.warm, marker,
  );
  const legend = h('ul', { class: 'c-cockpit__legend' },
    h('li', { class: 'lg-warm' }, 'Warm state ', h('span', { class: 'math', html: mathHTML('S_k') })),
    h('li', { class: 'lg-ret' }, 'Retrieval-only ', h('span', { class: 'math', html: mathHTML('R_k') })),
    h('li', { class: 'lg-cold' }, 'Cold ', h('span', { class: 'math', html: mathHTML('S_0 = ∅') })));

  // Cumulative cost ratio, as a bar strip.
  let CW = 640;
  const CH = 64;
  const cost = s('svg', { class: 'c-cockpit__cost', viewBox: `0 0 ${CW} ${CH}`, role: 'img', 'aria-labelledby': `${id}-cost-t` });
  const costTitle = s('title', { id: `${id}-cost-t` });
  const costBars = s('g', {});
  const costZero = s('line', { class: 'ck-zero', x1: PL, y1: CH / 2, y2: CH / 2 });
  cost.append(costTitle, costBars, costZero, s('text', { class: 'ck-axis', x: PL - 6, y: 12, 'text-anchor': 'end' }, 'saves'), s('text', { class: 'ck-axis', x: PL - 6, y: CH - 4, 'text-anchor': 'end' }, 'costs'));

  /* ----------------------------------------------------------- reading */
  const reading = h('div', { class: 'c-cockpit__read', 'aria-live': 'polite' });

  const chartWrap = h('div', { class: 'c-cockpit__chartwrap' },
        h('p', { class: 'c-cockpit__ck' }, 'Quality on the next document, by sessions seen'), chart, legend,
        h('p', { class: 'c-cockpit__ck' }, 'Cumulative cost ratio ', h('span', { class: 'math', html: mathHTML('CE_cum(k)') })), cost);
  const panel = h('div', { class: 'c-cockpit__panel', role: 'tabpanel', id: `${id}-panel`, tabindex: '0' },
    controls,
    h('div', { class: 'c-cockpit__kpis' }, kpis.map((k) => k.el)),
    h('div', { class: 'c-cockpit__viz' }, chartWrap, reading));

  app.append(tablist, panel);
  app.hidden = false;
  staticEl.hidden = true;

  function select(i) {
    state.fam = i;
    tabs.forEach((t, j) => { t.setAttribute('aria-selected', String(j === i)); t.tabIndex = j === i ? 0 : -1; });
    panel.setAttribute('aria-labelledby', tabs[i].id);
    render();
  }

  function pathFor(rows, key) {
    return rows.filter((r) => r.k > 0).map((r, i) => `${i ? 'L' : 'M'}${x(r.k).toFixed(1)} ${y(r[key]).toFixed(1)}`).join(' ');
  }

  function fit() {
    const inner = chartWrap.clientWidth - 32;
    const next = Math.round(clamp(inner > 0 ? inner : 640, 320, 760));
    if (next === W) return false;
    W = next;
    CW = next;
    chart.setAttribute('viewBox', `0 0 ${W} ${H}`);
    cost.setAttribute('viewBox', `0 0 ${CW} ${CH}`);
    costZero.setAttribute('x2', CW - PR);
    return true;
  }

  function render() {
    fit();
    costZero.setAttribute('x2', CW - PR);
    const fam = data.families[state.fam];
    const gate = data.gates[state.gate];
    const m = model(fam, gate.pc, state.repair);
    const r = m.rows[state.k];
    const hz = horizon(m.p, data.delta);
    gateBtns.forEach((b, j) => b.setAttribute('aria-pressed', String(j === state.gate)));
    kOut.textContent = `${state.k}`;

    // Axis range: fit the family's curves with some headroom.
    const vals = m.rows.filter((q) => q.k > 0).flatMap((q) => [q.cold, q.ret, q.warm]);
    yLo = Math.max(0, Math.floor((Math.min(...vals) - 0.04) * 20) / 20);
    yHi = Math.min(1, Math.ceil((Math.max(...vals) + 0.03) * 20) / 20);

    gridG.replaceChildren();
    for (let q = yLo; q <= yHi + 1e-9; q += 0.05) {
      gridG.append(s('line', { x1: PL, x2: W - PR, y1: y(q), y2: y(q) }), s('text', { class: 'ck-axis', x: PL - 6, y: y(q) + 3, 'text-anchor': 'end' }, q.toFixed(2)));
    }
    for (const kk of (W < 480 ? [1, 20, 40, 60] : [1, 10, 20, 30, 40, 50, 60])) gridG.append(s('text', { class: 'ck-axis', x: x(kk), y: H - 10, 'text-anchor': 'middle' }, kk === 1 ? 'k = 1' : String(kk)));

    lines.cold.setAttribute('d', pathFor(m.rows, 'cold'));
    lines.ret.setAttribute('d', pathFor(m.rows, 'ret'));
    lines.warm.setAttribute('d', pathFor(m.rows, 'warm'));
    const upper = m.rows.filter((q) => q.k > 0);
    area.setAttribute('d', `${pathFor(m.rows, 'warm')} ${upper.slice().reverse().map((q) => `L${x(q.k).toFixed(1)} ${y(q.ret).toFixed(1)}`).join(' ')} Z`);
    area.classList.toggle('is-neg', r.eg < 0);
    marker.setAttribute('transform', `translate(${x(state.k).toFixed(1)} 0)`);
    marker.querySelector('circle').setAttribute('cy', y(r.warm).toFixed(1));
    const mt = marker.querySelector('text');
    mt.textContent = `k = ${state.k}`;
    mt.setAttribute('text-anchor', state.k > K_MAX * 0.8 ? 'end' : 'start');
    mt.setAttribute('x', state.k > K_MAX * 0.8 ? -8 : 8);
    chartTitle.textContent = `${fam.label}: after ${state.k} sessions, warm ${r.warm.toFixed(3)}, retrieval-only ${r.ret.toFixed(3)}, cold ${r.cold.toFixed(3)}.`;

    costBars.replaceChildren();
    const bw = (CW - PL - PR) / K_MAX;
    for (const q of m.rows) {
      if (q.k === 0) continue;
      const v = clamp(q.ceCum, -0.5, 0.5);
      const hgt = Math.abs(v) / 0.5 * (CH / 2 - 4);
      costBars.append(s('rect', {
        class: `ck-bar${v >= 0 ? '' : ' is-neg'}${q.k === state.k ? ' is-on' : ''}`,
        x: (PL + (q.k - 1) * bw + 1).toFixed(1), width: Math.max(1, bw - 2).toFixed(1),
        y: (v >= 0 ? CH / 2 - hgt : CH / 2).toFixed(1), height: Math.max(1, hgt).toFixed(1),
      }));
    }
    costTitle.textContent = `Cumulative cost ratio after ${state.k} sessions: ${pct(r.ceCum)}${m.breakEven ? `, positive from session ${m.breakEven}` : ', never positive in this window'}.`;

    // KPIs
    const set = (kp, text, tone) => { kp.val.textContent = text; kp.el.dataset.tone = tone; };
    set(kpis[0], signed(r.eg), r.eg > 0.005 ? 'good' : r.eg < -0.005 ? 'bad' : 'flat');
    set(kpis[1], `${r.ceCum >= 0 ? '+' : '−'}${pct(Math.abs(r.ceCum))}`, r.ceCum > 0 ? 'good' : 'bad');
    set(kpis[2], r.mh.toFixed(3), r.mh < 0.01 ? 'good' : r.mh < 0.05 ? 'flat' : 'bad');
    set(kpis[3], m.ff.toFixed(2), m.ff >= 0.9 ? 'good' : 'bad');
    set(kpis[4], m.cr.toFixed(2), m.cr >= 0.95 ? 'good' : 'flat');

    // Reading: what the numbers say, and what to do.
    const lines_ = [];
    let action;
    if (r.eg > 0.005) {
      lines_.push(`After ${state.k} sessions of ${fam.unit}, warm state scores ${signed(r.eg)} better than retrieval-only on the same future document.`);
    } else if (r.eg < -0.005) {
      lines_.push(`Memory is hurting: contaminated writes cost ${r.mh.toFixed(3)} of quality, more than consolidation adds. Warm state is ${signed(r.eg)} against retrieval-only.`);
    } else {
      lines_.push(`Warm state and retrieval-only are level after ${state.k} sessions: consolidation has not paid off yet.`);
    }
    lines_.push(m.breakEven
      ? (state.k >= m.breakEven ? `Cumulative compute is ${pct(r.ceCum)} below cold processing; the stream paid for its memory at session ${m.breakEven}.` : `Memory still costs more than it saves; at this rate it pays off at session ${m.breakEven}.`)
      : 'Memory maintenance outweighs the savings over this window.');
    if (gate.pc >= 1) {
      lines_.push(`Without a gate, the chance that some wrong observation was consolidated is ${pct(r.pcont)} after ${state.k} sessions.`);
      action = `Turn the gate on: with the strict gate, contamination stays under ${pct(data.delta)} for ${Math.floor(horizon(fam.pe * data.gates[0].pc, data.delta))} sessions.`;
    } else if (state.k > hz) {
      lines_.push(`With the ${gate.label.toLowerCase()}, contamination passed ${pct(data.delta)} at session ${Math.floor(hz) + 1}.`);
      action = `Re-verify consolidated state before session ${Math.floor(hz)}, or tighten the gate.`;
    } else {
      lines_.push(`With the ${gate.label.toLowerCase()}, contamination stays under ${pct(data.delta)} until session ${Number.isFinite(hz) ? Math.floor(hz) : '∞'}.`);
    }
    if (!state.repair) {
      lines_.push(`A deletion that stops at Level 2 leaves ${pct(1 - m.ff)} of the target's leakage in consolidated schemas.`);
      action ||= 'Enable schema repair: a deletion has to reach the schemas built from the deleted document.';
    } else {
      lines_.push(`Schema repair removes ${pct(m.ff)} of the leakage and keeps ${pct(m.cr)} of retained quality.`);
    }
    action ||= r.eg > 0.005 ? 'Keep the state; report all five metrics together at the next evaluation point.' : 'Keep the stream running: consolidation needs repeated families to pay off.';

    reading.replaceChildren(
      h('p', { class: 'c-cockpit__read-k' }, h('span', { class: 'c-cockpit__dot', 'aria-hidden': 'true' }), 'Reading'),
      ...lines_.map((t) => h('p', {}, t)),
      h('p', { class: 'c-cockpit__action' }, h('b', {}, 'Action: '), action));
  }

  select(state.fam);
  if ('ResizeObserver' in window) {
    new ResizeObserver(() => { if (fit()) render(); }).observe(chartWrap);
  }
}
