// AlterU Press · Image Spec · Editorial SVG poster renderer
// Produces a self-contained SVG (image embedded as base64) that can be
// downloaded directly or rasterized to PNG.

const W = 880;
const H = 1240;
const PAD = 56;

export function buildPosterSVG(spec, imgDataUrl, opts = {}) {
  const author = opts.author || "anonymous";
  const issueNo = opts.issueNo || "0001";
  const date = opts.date || formatDate(new Date());
  const note = opts.note || "";

  const tx = svgEscape;

  let y = 0;
  const parts = [];

  parts.push(`<rect width="${W}" height="${H}" fill="#F5F2EC"/>`);

  // ---- Header bar
  parts.push(`<g font-family="JetBrains Mono, monospace" font-size="11" letter-spacing="2" fill="#0F0F0F">
    <text x="${PAD}" y="36">ALTERU PRESS</text>
    <text x="${W / 2}" y="36" text-anchor="middle">ISSUE 01 · IMAGE SPEC · No. ${tx(issueNo)}</text>
    <text x="${W - PAD}" y="36" text-anchor="end">${tx(date)}</text>
  </g>`);
  parts.push(`<line x1="${PAD}" y1="56" x2="${W - PAD}" y2="56" stroke="#0F0F0F" stroke-width="1"/>`);
  parts.push(`<line x1="${PAD}" y1="60" x2="${W - PAD}" y2="60" stroke="#0F0F0F" stroke-width="1"/>`);

  // ---- Nameplate
  y = 144;
  parts.push(`<text x="${PAD}" y="${y}" font-family="Playfair Display, serif" font-weight="900" font-style="italic" font-size="92" fill="#0F0F0F" letter-spacing="-3">Image</text>`);
  y += 90;
  parts.push(`<text x="${PAD}" y="${y}" font-family="Playfair Display, serif" font-weight="900" font-size="92" fill="#E8709A" letter-spacing="-3">Spec.</text>`);

  // ---- Subtitle
  y += 36;
  parts.push(`<text x="${PAD}" y="${y}" font-family="JetBrains Mono, monospace" font-size="11" letter-spacing="2" fill="#6B6B6B">AN ANATOMICAL STUDY OF THE PICTURE YOU BROUGHT</text>`);

  // ---- Thumbnail
  y += 28;
  const thumbMaxW = (W - PAD * 2);
  const thumbMaxH = 360;
  const ar = spec.dimensions.w / spec.dimensions.h;
  let tw = thumbMaxW;
  let th = tw / ar;
  if (th > thumbMaxH) { th = thumbMaxH; tw = th * ar; }
  const tx0 = (W - tw) / 2;
  parts.push(`<rect x="${tx0 - 6}" y="${y - 6}" width="${tw + 12}" height="${th + 12}" fill="#0F0F0F"/>`);
  parts.push(`<image href="${imgDataUrl}" x="${tx0}" y="${y}" width="${tw}" height="${th}" preserveAspectRatio="xMidYMid slice"/>`);
  y += th + 18;

  // ---- Reading note (semantic, optional)
  if (note) {
    const wrapped = wrapText(note, 86);
    for (const line of wrapped) {
      parts.push(`<text x="${W / 2}" y="${y}" text-anchor="middle" font-family="Playfair Display, serif" font-style="italic" font-size="16" fill="#2A2A2A">${tx(line)}</text>`);
      y += 22;
    }
    y += 8;
  }

  // ---- Section: Stat strip (dimensions + orientation + aspect)
  y += 4;
  parts.push(sectionRule(PAD, W - PAD, y));
  y += 22;
  parts.push(sectionHead("Dimensions", PAD, y));
  y += 24;

  const stats = [
    { label: "WIDTH",  value: `${spec.dimensions.w}px` },
    { label: "HEIGHT", value: `${spec.dimensions.h}px` },
    { label: "RATIO",  value: spec.dimensions.aspect },
    { label: "MEGAPIXELS", value: `${spec.dimensions.megapixels}` },
    { label: "ORIENTATION", value: spec.dimensions.orientation },
  ];
  const colW = (W - PAD * 2) / stats.length;
  stats.forEach((s, i) => {
    const cx = PAD + colW * i;
    parts.push(`<text x="${cx}" y="${y}" font-family="JetBrains Mono, monospace" font-size="9.5" letter-spacing="1.6" fill="#999">${tx(s.label)}</text>`);
    parts.push(`<text x="${cx}" y="${y + 26}" font-family="Playfair Display, serif" font-weight="700" font-size="22" fill="#0F0F0F">${tx(String(s.value))}</text>`);
  });
  y += 56;

  // ---- Section: Dominant colors
  parts.push(sectionRule(PAD, W - PAD, y));
  y += 22;
  parts.push(sectionHead("Dominant colours", PAD, y));
  parts.push(`<text x="${W - PAD}" y="${y}" text-anchor="end" font-family="JetBrains Mono, monospace" font-size="10" letter-spacing="1.5" fill="#6B6B6B">${spec.palette.length} EXTRACTED</text>`);
  y += 24;

  const barAreaW = W - PAD * 2;
  let xAcc = PAD;
  for (const c of spec.palette) {
    const bw = (c.pct / 100) * barAreaW;
    parts.push(`<rect x="${xAcc}" y="${y}" width="${bw}" height="22" fill="${c.hex}"/>`);
    xAcc += bw;
  }
  parts.push(`<rect x="${PAD - 0.5}" y="${y - 0.5}" width="${barAreaW + 1}" height="23" fill="none" stroke="#0F0F0F" stroke-width="1"/>`);
  y += 38;

  for (const c of spec.palette) {
    parts.push(`<rect x="${PAD}" y="${y - 14}" width="22" height="22" fill="${c.hex}" stroke="#0F0F0F" stroke-width="0.5"/>`);
    parts.push(`<text x="${PAD + 34}" y="${y + 2}" font-family="JetBrains Mono, monospace" font-size="13" font-weight="500" fill="#0F0F0F">${tx(c.hex)}</text>`);
    parts.push(`<text x="${PAD + 134}" y="${y + 2}" font-family="Montserrat, sans-serif" font-size="13" fill="#2A2A2A">${tx(c.name)}</text>`);
    parts.push(`<text x="${W - PAD}" y="${y + 2}" text-anchor="end" font-family="JetBrains Mono, monospace" font-size="13" font-weight="600" fill="#0F0F0F">${c.pct.toFixed(1)}%</text>`);
    y += 24;
  }

  y += 14;

  // ---- Two-column section: Brightness + Temperature
  parts.push(sectionRule(PAD, W - PAD, y));
  y += 22;
  const colMid = W / 2;
  parts.push(sectionHead("Brightness", PAD, y));
  parts.push(sectionHead("Colour temperature", colMid + 12, y));
  y += 24;

  const histW = colMid - PAD - 24;
  const histH = 56;
  const bins = spec.brightness.histogram;
  const bw = histW / bins.length;
  bins.forEach((v, i) => {
    const h = Math.max(1, v * histH);
    parts.push(`<rect x="${PAD + i * bw}" y="${y + (histH - h)}" width="${bw - 1.5}" height="${h}" fill="#0F0F0F"/>`);
  });
  parts.push(`<line x1="${PAD}" y1="${y + histH + 2}" x2="${PAD + histW}" y2="${y + histH + 2}" stroke="#0F0F0F" stroke-width="1"/>`);
  parts.push(`<text x="${PAD}" y="${y + histH + 18}" font-family="JetBrains Mono, monospace" font-size="9.5" letter-spacing="1.4" fill="#999">SHADOWS</text>`);
  parts.push(`<text x="${PAD + histW}" y="${y + histH + 18}" text-anchor="end" font-family="JetBrains Mono, monospace" font-size="9.5" letter-spacing="1.4" fill="#999">HIGHLIGHTS</text>`);
  parts.push(`<text x="${PAD}" y="${y + histH + 38}" font-family="Playfair Display, serif" font-style="italic" font-size="18" font-weight="700" fill="#0F0F0F">${tx(spec.brightness.label)}</text>`);
  parts.push(`<text x="${PAD + histW}" y="${y + histH + 38}" text-anchor="end" font-family="JetBrains Mono, monospace" font-size="13" fill="#6B6B6B">avg ${spec.brightness.avg}/255</text>`);

  // Temperature bar (column 2)
  const tempX = colMid + 12;
  const tempW = (W - PAD) - tempX;
  const warmW = (spec.temperature.warm / 100) * tempW;
  const coolW = (spec.temperature.cool / 100) * tempW;
  const neutralW = Math.max(0, tempW - warmW - coolW);
  parts.push(`<rect x="${tempX}" y="${y}" width="${warmW}" height="20" fill="#E8709A"/>`);
  parts.push(`<rect x="${tempX + warmW}" y="${y}" width="${neutralW}" height="20" fill="#CFCFCF"/>`);
  parts.push(`<rect x="${tempX + warmW + neutralW}" y="${y}" width="${coolW}" height="20" fill="#4A7AB8"/>`);
  parts.push(`<rect x="${tempX - 0.5}" y="${y - 0.5}" width="${tempW + 1}" height="21" fill="none" stroke="#0F0F0F" stroke-width="1"/>`);
  parts.push(`<text x="${tempX}" y="${y + 38}" font-family="JetBrains Mono, monospace" font-size="9.5" letter-spacing="1.4" fill="#E8709A">WARM ${spec.temperature.warm}%</text>`);
  parts.push(`<text x="${tempX + tempW}" y="${y + 38}" text-anchor="end" font-family="JetBrains Mono, monospace" font-size="9.5" letter-spacing="1.4" fill="#4A7AB8">COOL ${spec.temperature.cool}%</text>`);
  parts.push(`<text x="${tempX}" y="${y + 76}" font-family="Playfair Display, serif" font-style="italic" font-size="18" font-weight="700" fill="#0F0F0F">${tx(spec.temperature.label)}</text>`);

  y += histH + 60;

  // ---- Section: Composition
  parts.push(sectionRule(PAD, W - PAD, y));
  y += 22;
  parts.push(sectionHead("Composition", PAD, y));
  y += 24;

  const compStats = [
    { label: "EDGE DENSITY", value: `${spec.edges.score} / 10`, sub: spec.edges.label },
    { label: "SATURATION",   value: `${spec.saturation.avg}`,    sub: spec.saturation.label },
    { label: "VIVID PIXELS", value: `${spec.saturation.vividPct}%`, sub: spec.saturation.vividPct > 30 ? "punchy" : "restrained" },
    { label: "FOCAL POINT",  value: spec.focal.label,            sub: focalGloss(spec.focal) },
  ];
  const ccolW = (W - PAD * 2) / compStats.length;
  compStats.forEach((s, i) => {
    const cx = PAD + ccolW * i;
    parts.push(`<text x="${cx}" y="${y}" font-family="JetBrains Mono, monospace" font-size="9.5" letter-spacing="1.6" fill="#999">${tx(s.label)}</text>`);
    parts.push(`<text x="${cx}" y="${y + 26}" font-family="Playfair Display, serif" font-weight="700" font-size="20" fill="#0F0F0F">${tx(String(s.value))}</text>`);
    if (s.sub) parts.push(`<text x="${cx}" y="${y + 48}" font-family="Playfair Display, serif" font-style="italic" font-size="14" fill="#6B6B6B">${tx(s.sub)}</text>`);
  });
  y += 76;

  // ---- Footer
  const footY = H - 64;
  parts.push(`<line x1="${PAD}" y1="${footY - 32}" x2="${W - PAD}" y2="${footY - 32}" stroke="#0F0F0F" stroke-width="1"/>`);
  parts.push(`<line x1="${PAD}" y1="${footY - 28}" x2="${W - PAD}" y2="${footY - 28}" stroke="#0F0F0F" stroke-width="1"/>`);
  parts.push(`<g font-family="JetBrains Mono, monospace" font-size="10.5" letter-spacing="1.6" fill="#0F0F0F">
    <text x="${PAD}" y="${footY}">FILED BY @${tx(author.toUpperCase())}</text>
    <text x="${W / 2}" y="${footY}" text-anchor="middle">SET IN PLAYFAIR · MONTSERRAT · JETBRAINS MONO</text>
    <text x="${W - PAD}" y="${footY}" text-anchor="end">© ALTERU PRESS</text>
  </g>`);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
${parts.join("\n")}
</svg>`;
  return svg;
}

function sectionRule(x0, x1, y) {
  return `<line x1="${x0}" y1="${y}" x2="${x1}" y2="${y}" stroke="#0F0F0F" stroke-width="1"/>`;
}
function sectionHead(label, x, y) {
  return `<text x="${x}" y="${y}" font-family="JetBrains Mono, monospace" font-size="10.5" font-weight="600" letter-spacing="2.4" fill="#7700A1">${svgEscape(label.toUpperCase())}</text>`;
}

function focalGloss(focal) {
  if (focal.label === "centered") return "rule of thirds ignored";
  if (focal.gridX <= 1 || focal.gridX >= 4) return "off-axis";
  return "near a third";
}

function svgEscape(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function wrapText(s, maxChars) {
  const words = s.split(/\s+/);
  const lines = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > maxChars) {
      if (cur) lines.push(cur);
      cur = w;
    } else {
      cur = (cur + " " + w).trim();
    }
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 3);
}

function formatDate(d) {
  return d.toISOString().slice(0, 10).replace(/-/g, ".");
}
