// Minimal responsive SVG bar chart (replaces Recharts).
// Usage: put <div class="weekly-chart" data-chart='{"data":[...],"name":"...","maxBar":28,"yWidth":24,"radius":6,"font":11}'></div>
// in the page, then call drawCharts(root). Charts redraw automatically on window resize.
const SVG_NS = 'http://www.w3.org/2000/svg';
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function niceTicks(max) {
  const top = Math.max(4, max);
  const step = Math.max(1, Math.ceil(top / 4));
  const ticks = [];
  for (let v = 0; v <= step * 4; v += step) ticks.push(v);
  return ticks;
}

function roundedTopBar(x, y, w, h, r) {
  if (h <= 0) return '';
  r = Math.min(r, w / 2, h);
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}

function draw(container) {
  const cfg = JSON.parse(container.dataset.chart);
  const { data = [], name = 'Value', maxBar = 30, yWidth = 60, radius = 6, font = 12 } = cfg;
  const width = container.clientWidth || 300;
  const height = container.clientHeight || 200;
  const margin = { top: 5, right: 5, bottom: 5, left: 5 };
  const xAxisH = font + 14;
  const plotX = margin.left + yWidth;
  const plotY = margin.top;
  const plotW = Math.max(10, width - plotX - margin.right);
  const plotH = Math.max(10, height - plotY - margin.bottom - xAxisH);
  const ticks = niceTicks(Math.max(0, ...data.map((d) => d.completed)));
  const top = ticks[ticks.length - 1];
  const yOf = (v) => plotY + plotH - (v / top) * plotH;
  const band = data.length ? plotW / data.length : plotW;
  const barW = Math.min(maxBar, band * 0.8);

  let svg = `<svg xmlns="${SVG_NS}" width="${width}" height="${height}" style="display:block;overflow:visible">`;
  ticks.forEach((t) => {
    const y = yOf(t);
    svg += `<line x1="${plotX}" x2="${plotX + plotW}" y1="${y}" y2="${y}" stroke="var(--line)" stroke-dasharray="3 3"/>`;
    svg += `<text x="${plotX - 6}" y="${y}" dy="0.35em" text-anchor="end" fill="var(--muted)" font-size="${font}">${t}</text>`;
  });
  data.forEach((d, i) => {
    const bx = plotX + band * i;
    const h = plotH - (yOf(d.completed) - plotY);
    svg += `<g class="chart-band" data-index="${i}">`;
    svg += `<rect class="chart-cursor" x="${bx}" y="${plotY}" width="${band}" height="${plotH}" fill="var(--chart-hover, rgba(0,0,0,.06))" opacity="0"/>`;
    svg += `<path d="${roundedTopBar(bx + (band - barW) / 2, yOf(d.completed), barW, h, radius)}" fill="#a995f5"/>`;
    svg += `<text x="${bx + band / 2}" y="${plotY + plotH + 8}" dy="0.71em" text-anchor="middle" fill="var(--muted)" font-size="${font}">${esc(d.label)}</text>`;
    svg += `<rect x="${bx}" y="${plotY}" width="${band}" height="${plotH}" fill="transparent"/>`;
    svg += '</g>';
  });
  svg += '</svg>';

  container.style.position = 'relative';
  container.innerHTML = svg + '<div class="chart-tooltip" style="position:absolute;pointer-events:none;display:none;padding:8px 12px;border-radius:12px;border:1px solid var(--line);background:var(--panel);color:var(--text);font-size:13px;white-space:nowrap;box-shadow:0 6px 18px rgba(0,0,0,.08);z-index:5"></div>';
  const tip = container.querySelector('.chart-tooltip');
  container.querySelectorAll('.chart-band').forEach((g) => {
    const d = data[Number(g.dataset.index)];
    const cursor = g.querySelector('.chart-cursor');
    g.addEventListener('mousemove', (e) => {
      cursor.setAttribute('opacity', '1');
      tip.innerHTML = `<div style="margin-bottom:4px">${esc(d.label)}</div><div style="color:#a995f5">${esc(name)} : ${d.completed}</div>`;
      tip.style.display = 'block';
      const box = container.getBoundingClientRect();
      let left = e.clientX - box.left + 12;
      if (left + tip.offsetWidth > box.width) left = e.clientX - box.left - tip.offsetWidth - 12;
      tip.style.left = `${left}px`;
      tip.style.top = `${Math.max(0, e.clientY - box.top - tip.offsetHeight - 8)}px`;
    });
    g.addEventListener('mouseleave', () => { cursor.setAttribute('opacity', '0'); tip.style.display = 'none'; });
  });
}

export function drawCharts(root = document) {
  root.querySelectorAll('[data-chart]').forEach(draw);
}

let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => drawCharts(), 100);
});
