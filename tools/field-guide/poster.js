// AlterU Press · Field Guide · Editorial dossier poster
// 1080×1920 (9:16) — sized for mobile fullscreen + Aigram feed + sharing.

export const POSTER_W = 1080;
export const POSTER_H = 1920;
const W = POSTER_W;
const H = POSTER_H;
const PAD = 72;

export function buildPosterSVG(dossier, imgDataUrl, opts = {}) {
  const author = opts.author || "anonymous";
  const issueNo = opts.issueNo || "0001";
  const date = opts.date || formatDate(new Date());

  const tx = svgEscape;
  const parts = [];
  let y;

  parts.push(`<rect width="${W}" height="${H}" fill="#F5F2EC"/>`);

  // -------- Header strip
  parts.push(`<g font-family="JetBrains Mono, monospace" font-size="13" letter-spacing="2.2" fill="#0F0F0F">
    <text x="${PAD}" y="48">ALTERU PRESS</text>
    <text x="${W / 2}" y="48" text-anchor="middle">FIELD GUIDE · No. ${tx(issueNo)}</text>
    <text x="${W - PAD}" y="48" text-anchor="end">${tx(date)}</text>
  </g>`);
  parts.push(`<line x1="${PAD}" y1="72" x2="${W - PAD}" y2="72" stroke="#0F0F0F" stroke-width="1.2"/>`);
  parts.push(`<line x1="${PAD}" y1="78" x2="${W - PAD}" y2="78" stroke="#0F0F0F" stroke-width="1.2"/>`);

  // -------- Kicker
  y = 138;
  parts.push(`<text x="${PAD}" y="${y}" font-family="JetBrains Mono, monospace" font-size="14" letter-spacing="3" fill="#7700A1">${tx((dossier.kicker || "").toUpperCase())}</text>`);

  // -------- Title (multi-line if needed)
  y += 64;
  const titleLines = wrapWords(dossier.title || "untitled", 17);
  for (const line of titleLines) {
    parts.push(`<text x="${PAD}" y="${y}" font-family="Playfair Display, serif" font-weight="900" font-size="120" fill="#0F0F0F" letter-spacing="-4">${tx(line)}</text>`);
    y += 116;
  }

  // "on display." subtitle
  parts.push(`<text x="${PAD}" y="${y}" font-family="Playfair Display, serif" font-weight="900" font-style="italic" font-size="72" fill="#E8709A" letter-spacing="-2">on display.</text>`);
  y += 30;

  // -------- Photo (big hero)
  const thumbMaxW = (W - PAD * 2);
  const thumbMaxH = 540;
  const ar = (opts.imgW && opts.imgH) ? opts.imgW / opts.imgH : 1.333;
  let tw = thumbMaxW, th = tw / ar;
  if (th > thumbMaxH) { th = thumbMaxH; tw = th * ar; }
  const tx0 = (W - tw) / 2;
  parts.push(`<rect x="${tx0 - 8}" y="${y - 8}" width="${tw + 16}" height="${th + 16}" fill="#0F0F0F"/>`);
  parts.push(`<image href="${imgDataUrl}" x="${tx0}" y="${y}" width="${tw}" height="${th}" preserveAspectRatio="xMidYMid slice"/>`);
  y += th + 28;

  // -------- Today's specimen (intro)
  parts.push(`<line x1="${PAD}" y1="${y}" x2="${W - PAD}" y2="${y}" stroke="#0F0F0F" stroke-width="1.2"/>`);
  y += 28;
  parts.push(sectionHead("Today's specimen", PAD, y));
  y += 32;
  const introLines = wrapWords(dossier.intro || "", 56);
  for (const line of introLines.slice(0, 3)) {
    parts.push(`<text x="${PAD}" y="${y}" font-family="Playfair Display, serif" font-style="italic" font-size="26" fill="#0F0F0F">${tx(line)}</text>`);
    y += 36;
  }
  y += 18;

  // -------- Anatomy
  parts.push(`<line x1="${PAD}" y1="${y}" x2="${W - PAD}" y2="${y}" stroke="#0F0F0F" stroke-width="1.2"/>`);
  y += 28;
  parts.push(sectionHead("Anatomy", PAD, y));
  parts.push(`<text x="${W - PAD}" y="${y}" text-anchor="end" font-family="JetBrains Mono, monospace" font-size="13" letter-spacing="2" fill="#6B6B6B">${(dossier.anatomy || []).length} PARTS</text>`);
  y += 34;

  for (const part of (dossier.anatomy || []).slice(0, 5)) {
    parts.push(`<text x="${PAD}" y="${y}" font-family="Playfair Display, serif" font-weight="700" font-size="22" fill="#0F0F0F">${tx(part.name)}</text>`);
    parts.push(`<line x1="${PAD + 140}" y1="${y - 8}" x2="${PAD + 190}" y2="${y - 8}" stroke="#6B6B6B" stroke-width="0.8"/>`);
    const noteLines = wrapWords(part.note || "", 58);
    const x0 = PAD + 200;
    parts.push(`<text x="${x0}" y="${y}" font-family="Montserrat, sans-serif" font-size="17" fill="#2A2A2A">${tx(noteLines[0] || "")}</text>`);
    if (noteLines[1]) {
      parts.push(`<text x="${x0}" y="${y + 22}" font-family="Montserrat, sans-serif" font-size="17" fill="#2A2A2A">${tx(noteLines[1])}</text>`);
      y += 48;
    } else {
      y += 30;
    }
  }
  y += 18;

  // -------- Relatives
  parts.push(`<line x1="${PAD}" y1="${y}" x2="${W - PAD}" y2="${y}" stroke="#0F0F0F" stroke-width="1.2"/>`);
  y += 28;
  parts.push(sectionHead("This object has relatives", PAD, y));
  parts.push(`<text x="${W - PAD}" y="${y}" text-anchor="end" font-family="JetBrains Mono, monospace" font-size="13" letter-spacing="2" fill="#6B6B6B">${(dossier.relatives || []).length} ENTRIES</text>`);
  y += 28;

  // Column widths: NAME 22% · ORIGIN 26% · NOTE 52%
  const tableW = W - PAD * 2;
  const col1 = PAD;
  const col2 = PAD + Math.round(tableW * 0.22);
  const col3 = PAD + Math.round(tableW * 0.48);

  parts.push(`<line x1="${PAD}" y1="${y}" x2="${W - PAD}" y2="${y}" stroke="#0F0F0F" stroke-width="0.8"/>`);
  y += 18;
  parts.push(`<text x="${col1}" y="${y}" font-family="JetBrains Mono, monospace" font-size="12" letter-spacing="2" fill="#999">NAME</text>`);
  parts.push(`<text x="${col2}" y="${y}" font-family="JetBrains Mono, monospace" font-size="12" letter-spacing="2" fill="#999">ORIGIN</text>`);
  parts.push(`<text x="${col3}" y="${y}" font-family="JetBrains Mono, monospace" font-size="12" letter-spacing="2" fill="#999">NOTE</text>`);
  y += 10;
  parts.push(`<line x1="${PAD}" y1="${y}" x2="${W - PAD}" y2="${y}" stroke="#0F0F0F" stroke-width="0.8"/>`);

  const relatives = (dossier.relatives || []).slice(0, 7);
  for (const rel of relatives) {
    y += 28;
    parts.push(`<text x="${col1}" y="${y}" font-family="Playfair Display, serif" font-weight="700" font-style="italic" font-size="21" fill="#0F0F0F">${tx(rel.name)}</text>`);
    parts.push(`<text x="${col2}" y="${y}" font-family="Montserrat, sans-serif" font-size="15" fill="#2A2A2A">${tx(rel.origin || "")}</text>`);
    const noteLines = wrapWords(rel.note || "", 44);
    parts.push(`<text x="${col3}" y="${y}" font-family="Montserrat, sans-serif" font-size="15" fill="#2A2A2A">${tx(noteLines[0] || "")}</text>`);
    if (noteLines[1]) {
      parts.push(`<text x="${col3}" y="${y + 18}" font-family="Montserrat, sans-serif" font-size="15" fill="#2A2A2A">${tx(noteLines[1])}</text>`);
      y += 18;
    }
    y += 10;
    parts.push(`<line x1="${PAD}" y1="${y}" x2="${W - PAD}" y2="${y}" stroke="#D9D9D9" stroke-width="0.6"/>`);
  }
  y += 28;

  // -------- Closing essay
  parts.push(`<line x1="${PAD}" y1="${y}" x2="${W - PAD}" y2="${y}" stroke="#0F0F0F" stroke-width="1.2"/>`);
  y += 28;
  parts.push(sectionHead("Why we make them", PAD, y));
  y += 34;
  const essayLines = wrapWords(dossier.essay || "", 64);
  for (const line of essayLines.slice(0, 5)) {
    parts.push(`<text x="${PAD}" y="${y}" font-family="Playfair Display, serif" font-size="21" fill="#2A2A2A">${tx(line)}</text>`);
    y += 32;
  }

  // -------- Footer
  const footY = H - 64;
  parts.push(`<line x1="${PAD}" y1="${footY - 32}" x2="${W - PAD}" y2="${footY - 32}" stroke="#0F0F0F" stroke-width="1.2"/>`);
  parts.push(`<line x1="${PAD}" y1="${footY - 26}" x2="${W - PAD}" y2="${footY - 26}" stroke="#0F0F0F" stroke-width="1.2"/>`);
  parts.push(`<g font-family="JetBrains Mono, monospace" font-size="13" letter-spacing="2" fill="#0F0F0F">
    <text x="${PAD}" y="${footY}">FILED BY @${tx(author.toUpperCase())}</text>
    <text x="${W / 2}" y="${footY}" text-anchor="middle">FIELD GUIDE · ALTERU PRESS</text>
    <text x="${W - PAD}" y="${footY}" text-anchor="end">SET IN PLAYFAIR</text>
  </g>`);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
${parts.join("\n")}
</svg>`;
}

function sectionHead(label, x, y) {
  return `<text x="${x}" y="${y}" font-family="JetBrains Mono, monospace" font-size="13" font-weight="600" letter-spacing="3" fill="#7700A1">${svgEscape(label.toUpperCase())}</text>`;
}

function svgEscape(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function wrapWords(s, maxChars) {
  const words = String(s).split(/\s+/);
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
  return lines;
}

function formatDate(d) {
  return d.toISOString().slice(0, 10).replace(/-/g, ".");
}
