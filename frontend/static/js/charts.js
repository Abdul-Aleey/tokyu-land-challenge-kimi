/* Hand-built SVG donut + bar charts. No external chart library --
   full control over the mark specs (rounded bar ends, surface gaps,
   hover tooltips) called for by the design. */

const Charts = (() => {
  const NS = "http://www.w3.org/2000/svg";

  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  function el(tag, attrs) {
    const node = document.createElementNS(NS, tag);
    for (const k in attrs) node.setAttribute(k, attrs[k]);
    return node;
  }

  function makeTooltip(container) {
    const tip = document.createElement("div");
    tip.className = "chart-tooltip";
    container.style.position = "relative";
    container.appendChild(tip);
    return tip;
  }

  function showTooltip(tip, container, x, y, html) {
    tip.innerHTML = "";
    tip.appendChild(html);
    const rect = container.getBoundingClientRect();
    let left = x + 14;
    let top = y - 10;
    if (left + 160 > rect.width) left = x - 160;
    tip.style.left = `${left}px`;
    tip.style.top = `${top}px`;
    tip.style.opacity = "1";
  }

  function hideTooltip(tip) {
    tip.style.opacity = "0";
  }

  function ttRow(label, value) {
    const wrap = document.createElement("div");
    const v = document.createElement("div");
    v.className = "tt-val";
    v.textContent = value;
    const l = document.createElement("div");
    l.className = "tt-label";
    l.textContent = label;
    wrap.appendChild(v);
    wrap.appendChild(l);
    return wrap;
  }

  /** data: [{label, value, color}] */
  function donut(container, data, opts = {}) {
    container.innerHTML = "";
    const total = data.reduce((s, d) => s + d.value, 0);
    const size = 200;
    const r = 78;
    const inner = 48;
    const cx = size / 2, cy = size / 2;
    const gapDeg = total > 0 ? 2.2 : 0;

    const svg = el("svg", { viewBox: `0 0 ${size} ${size}`, width: "100%", height: "180" });
    const muted = cssVar("--text-muted");

    if (total === 0) {
      const t = el("text", { x: cx, y: cy, "text-anchor": "middle", "dominant-baseline": "middle", fill: muted, "font-size": "12" });
      t.textContent = opts.emptyLabel || "No data";
      svg.appendChild(t);
      container.appendChild(svg);
      return;
    }

    let angle = -90;
    const tip = makeTooltip(container);
    const segments = [];

    data.forEach((d) => {
      if (d.value <= 0) return;
      const sweep = (d.value / total) * 360 - gapDeg;
      const startA = angle;
      const endA = angle + Math.max(sweep, 0);
      angle += (d.value / total) * 360;

      const path = arcPath(cx, cy, r, inner, startA, endA);
      const p = el("path", { d: path, fill: d.color, stroke: "none", class: "donut-seg" });
      p.style.cursor = "pointer";
      p.style.transition = "opacity 0.15s ease";
      p.addEventListener("pointerenter", (e) => {
        p.style.opacity = "0.85";
        const pct = ((d.value / total) * 100).toFixed(0);
        showTooltip(tip, container, e.offsetX, e.offsetY, ttRow(`${d.label} (${pct}%)`, d.value));
      });
      p.addEventListener("pointermove", (e) => {
        const pct = ((d.value / total) * 100).toFixed(0);
        showTooltip(tip, container, e.offsetX, e.offsetY, ttRow(`${d.label} (${pct}%)`, d.value));
      });
      p.addEventListener("pointerleave", () => { p.style.opacity = "1"; hideTooltip(tip); });
      if (opts.onSegmentClick) p.addEventListener("click", () => opts.onSegmentClick(d));
      svg.appendChild(p);
      segments.push(d);
    });

    const centerVal = el("text", { x: cx, y: cy - 4, "text-anchor": "middle", fill: cssVar("--text-primary"), "font-size": "26", "font-weight": "700" });
    centerVal.textContent = total;
    const centerLabel = el("text", { x: cx, y: cy + 16, "text-anchor": "middle", fill: muted, "font-size": "10" });
    centerLabel.textContent = opts.centerLabel || "";
    svg.appendChild(centerVal);
    svg.appendChild(centerLabel);

    container.appendChild(svg);

    const legend = document.createElement("div");
    legend.className = "chart-legend";
    data.forEach((d) => {
      const item = document.createElement("div");
      item.className = "chart-legend-item";
      const dot = document.createElement("span");
      dot.className = "dot";
      dot.style.background = d.color;
      const label = document.createElement("span");
      label.textContent = d.label + " ";
      const val = document.createElement("span");
      val.className = "val";
      val.textContent = d.value;
      item.appendChild(dot);
      item.appendChild(label);
      item.appendChild(val);
      if (opts.onSegmentClick) {
        item.style.cursor = "pointer";
        item.addEventListener("click", () => opts.onSegmentClick(d));
      }
      legend.appendChild(item);
    });
    container.appendChild(legend);
  }

  function arcPath(cx, cy, rOuter, rInner, startDeg, endDeg) {
    if (endDeg <= startDeg) return "";
    const s1 = polar(cx, cy, rOuter, startDeg);
    const e1 = polar(cx, cy, rOuter, endDeg);
    const s2 = polar(cx, cy, rInner, endDeg);
    const e2 = polar(cx, cy, rInner, startDeg);
    const large = endDeg - startDeg > 180 ? 1 : 0;
    return [
      `M ${s1.x} ${s1.y}`,
      `A ${rOuter} ${rOuter} 0 ${large} 1 ${e1.x} ${e1.y}`,
      `L ${s2.x} ${s2.y}`,
      `A ${rInner} ${rInner} 0 ${large} 0 ${e2.x} ${e2.y}`,
      "Z",
    ].join(" ");
  }

  function polar(cx, cy, r, deg) {
    const rad = (deg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  /** data: [{label, value, color}] */
  function barChart(container, data, opts = {}) {
    container.innerHTML = "";
    const width = Math.max(container.clientWidth || 640, 320);
    const height = 200;
    const padL = 30, padR = 10, padT = 24, padB = 30;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;
    const max = Math.max(1, ...data.map((d) => d.value));
    const n = data.length;
    const bandW = plotW / n;
    const barW = Math.min(24, bandW * 0.55);

    const svg = el("svg", { viewBox: `0 0 ${width} ${height}`, width: "100%", height: "220" });
    const muted = cssVar("--text-muted");
    const gridColor = cssVar("--border-strong") || "#ccc";

    const baseline = padT + plotH;
    svg.appendChild(el("line", { x1: padL, y1: baseline, x2: width - padR, y2: baseline, stroke: gridColor, "stroke-width": 1 }));

    const tip = makeTooltip(container);

    data.forEach((d, i) => {
      const bx = padL + i * bandW + (bandW - barW) / 2;
      const h = max > 0 ? (d.value / max) * plotH : 0;
      const by = baseline - h;
      const r = Math.min(4, h);

      let path;
      if (h <= 0) {
        path = "";
      } else {
        path = `M ${bx} ${by + r} A ${r} ${r} 0 0 1 ${bx + r} ${by} L ${bx + barW - r} ${by} A ${r} ${r} 0 0 1 ${bx + barW} ${by + r} L ${bx + barW} ${baseline} L ${bx} ${baseline} Z`;
      }

      if (path) {
        const p = el("path", { d: path, fill: d.color });
        p.style.cursor = "pointer";
        const hit = el("rect", { x: bx - 4, y: padT, width: barW + 8, height: plotH, fill: "transparent" });
        hit.style.cursor = "pointer";
        hit.addEventListener("pointerenter", (e) => showTooltip(tip, container, e.offsetX, e.offsetY, ttRow(d.label, d.value)));
        hit.addEventListener("pointermove", (e) => showTooltip(tip, container, e.offsetX, e.offsetY, ttRow(d.label, d.value)));
        hit.addEventListener("pointerleave", () => hideTooltip(tip));
        svg.appendChild(p);
        svg.appendChild(hit);

        if (d.value > 0) {
          const valLabel = el("text", { x: bx + barW / 2, y: by - 6, "text-anchor": "middle", "font-size": "10", fill: muted });
          valLabel.textContent = d.value;
          svg.appendChild(valLabel);
        }
      }

      const xLabel = el("text", { x: bx + barW / 2, y: baseline + 16, "text-anchor": "middle", "font-size": "10", fill: muted });
      xLabel.textContent = d.label;
      svg.appendChild(xLabel);
    });

    container.appendChild(svg);

    if (opts.legend) {
      const legend = document.createElement("div");
      legend.className = "chart-legend";
      opts.legend.forEach((l) => {
        const item = document.createElement("div");
        item.className = "chart-legend-item";
        const dot = document.createElement("span");
        dot.className = "dot";
        dot.style.background = l.color;
        const label = document.createElement("span");
        label.textContent = l.label;
        item.appendChild(dot);
        item.appendChild(label);
        legend.appendChild(item);
      });
      container.appendChild(legend);
    }
  }

  return { donut, barChart, cssVar };
})();
