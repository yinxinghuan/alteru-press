// AlterU Press · Field Guide · Editorial dossier poster
// Renders the Claude dossier (title / kicker / intro / anatomy / relatives / essay)
// as a single-page magazine spread.

export const POSTER_W = 880;
export const POSTER_H = 1640;
const W = POSTER_W;
const H = POSTER_H;
const PAD = 56;

export function buildPosterSVG(dossier, imgDataUrl, opts = {}) {
  const author = opts.author || "anonymous";
  const issueNo = opts.issueNo || "0001";
  const date = opts.date || formatDate(new Date());

  const tx = svgEscape;
  const parts = [];
  let y;

  // Background
  parts.push(`<rect width="${W}" height="${H}" fill="#F5F2EC"/>`);

  // -------- Header bar
  parts.push(`<g font-family="JetBrains Mono, monospace" font-size="11" letter-spacing="2" fill="#0F0F0F">
    <text x="${PAD}" y="36">ALTERU PRESS</text>
    <text x="${W / 2}" y="36" text-anchor="middle">FIELD GUIDE · No. ${tx(issueNo)}</text>
    <text x="${W - PAD}" y="36" text-anchor="end">${tx(date)}</text>
  </g>`);
  parts.push(`<line x1="${PAD}" y1="56" x2="${W - PAD}" y2="56" stroke="#0F0F0F" stroke-width="1"/>`);
  parts.push(`<line x1="${PAD}" y1="60" x2="${W - PAD}" y2="60" stroke="#0F0F0F" stroke-width="1"/>`);

  // -------- Kicker
  y = 110;
  parts.push(`<text x="${PAD}" y="${y}" font-family="JetBrains Mono, monospace" font-size="11" letter-spacing="2.4" fill="#7700A1">${tx((dossier.kicker || "").toUpperCase())}</text>`);

  // -------- Title (multi-line if needed)
  y += 50;
  const titleLines = wrapWords(dossier.title || "untitled", 18);
  for (const line of titleLines) {
    parts.push(`<text x="${PAD}" y="${y}" font-family="Playfair Display, serif" font-weight="900" font-size="86" fill="#0F0F0F" letter-spacing="-3">${tx(line)}</text>`);
    y += 86;
  }

  // "on display." subtitle
  parts.push(`<text x="${PAD}" y="${y}" font-family="Playfair Display, serif" font-weight="900" font-style="italic" font-size="56" fill="#E8709A" letter-spacing="-1.5">on display.</text>`);
  y += 22;

  // -------- Photo
  const thumbMaxW = (W - PAD * 2);
  const thumbMaxH = 320;
  const ar = (opts.imgW && opts.imgH) ? opts.imgW / opts.imgH : 1.333;
  let tw = thumbMaxW, th = tw / ar;
  if (th > thumbMaxH) { th = thumbMaxH; tw = th * ar; }
  const tx0 = (W - tw) / 2;
  parts.push(`<rect x="${tx0 - 6}" y="${y - 6}" width="${tw + 12}" height="${th + 12}" fill="#0F0F0F"/>`);
  parts.push(`<image href="${imgDataUrl}" x="${tx0}" y="${y}" width="${tw}" height="${th}" preserveAspectRatio="xMidYMid slice"/>`);
  y += th + 22;

  // -------- Today's specimen (intro)
  parts.push(`<line x1="${PAD}" y1="${y}" x2="${W - PAD}" y2="${y}" stroke="#0F0F0F" stroke-width="1"/>`);
  y += 22;
  parts.push(sectionHead("Today's specimen", PAD, y));
  y += 24;
  const introLines = wrapWords(dossier.intro || "", 60);
  for (const line of introLines.slice(0, 3)) {
    parts.push(`<text x="${PAD}" y="${y}" font-family="Playfair Display, serif" font-style="italic" font-size="19" fill="#0F0F0F">${tx(line)}</text>`);
    y += 26;
  }
  y += 14;

  // -------- Anatomy
  parts.push(`<line x1="${PAD}" y1="${y}" x2="${W - PAD}" y2="${y}" stroke="#0F0F0F" stroke-width="1"/>`);
  y += 22;
  parts.push(sectionHead("Anatomy", PAD, y));
  parts.push(`<text x="${W - PAD}" y="${y}" text-anchor="end" font-family="JetBrains Mono, monospace" font-size="10" letter-spacing="1.5" fill="#6B6B6B">${(dossier.anatomy || []).length} PARTS</text>`);
  y += 26;

  for (const part of (dossier.anatomy || []).slice(0, 6)) {
    parts.push(`<text x="${PAD}" y="${y}" font-family="Playfair Display, serif" font-weight="700" font-size="17" fill="#0F0F0F">${tx(part.name)}</text>`);
    parts.push(`<line x1="${PAD + 110}" y1="${y - 6}" x2="${PAD + 150}" y2="${y - 6}" stroke="#6B6B6B" stroke-width="0.6"/>`);
    const noteLines = wrapWords(part.note || "", 64);
    const x0 = PAD + 160;
    parts.push(`<text x="${x0}" y="${y}" font-family="Montserrat, sans-serif" font-size="13" fill="#2A2A2A">${tx(noteLines[0] || "")}</text>`);
    if (noteLines[1]) {
      parts.push(`<text x="${x0}" y="${y + 18}" font-family="Montserrat, sans-serif" font-size="13" fill="#2A2A2A">${tx(noteLines[1])}</text>`);
      y += 40;
    } else {
      y += 26;
    }
  }
  y += 14;

  // -------- Relatives
  parts.push(`<line x1="${PAD}" y1="${y}" x2="${W - PAD}" y2="${y}" stroke="#0F0F0F" stroke-width="1"/>`);
  y += 22;
  parts.push(sectionHead("This object has relatives", PAD, y));
  parts.push(`<text x="${W - PAD}" y="${y}" text-anchor="end" font-family="JetBrains Mono, monospace" font-size="10" letter-spacing="1.5" fill="#6B6B6B">${(dossier.relatives || []).length} ENTRIES</text>`);
  y += 22;

  // Column widths: NAME 22% · ORIGIN 24% · NOTE 54%
  const tableW = W - PAD * 2;
  const col1 = PAD;
  const col2 = PAD + Math.round(tableW * 0.22);
  const col3 = PAD + Math.round(tableW * 0.46);

  // Header row
  parts.push(`<line x1="${PAD}" y1="${y}" x2="${W - PAD}" y2="${y}" stroke="#0F0F0F" stroke-width="0.6"/>`);
  y += 14;
  parts.push(`<text x="${col1}" y="${y}" font-family="JetBrains Mono, monospace" font-size="9.5" letter-spacing="1.6" fill="#999">NAME</text>`);
  parts.push(`<text x="${col2}" y="${y}" font-family="JetBrains Mono, monospace" font-size="9.5" letter-spacing="1.6" fill="#999">ORIGIN</text>`);
  parts.push(`<text x="${col3}" y="${y}" font-family="JetBrains Mono, monospace" font-size="9.5" letter-spacing="1.6" fill="#999">NOTE</text>`);
  y += 8;
  parts.push(`<line x1="${PAD}" y1="${y}" x2="${W - PAD}" y2="${y}" stroke="#0F0F0F" stroke-width="0.6"/>`);

  const relatives = (dossier.relatives || []).slice(0, 8);
  for (const rel of relatives) {
    y += 22;
    parts.push(`<text x="${col1}" y="${y}" font-family="Playfair Display, serif" font-weight="700" font-style="italic" font-size="16" fill="#0F0F0F">${tx(rel.name)}</text>`);
    parts.push(`<text x="${col2}" y="${y}" font-family="Montserrat, sans-serif" font-size="12" fill="#2A2A2A">${tx(rel.origin || "")}</text>`);
    const noteLines = wrapWords(rel.note || "", 50);
    parts.push(`<text x="${col3}" y="${y}" font-family="Montserrat, sans-serif" font-size="12" fill="#2A2A2A">${tx(noteLines[0] || "")}</text>`);
    if (noteLines[1]) {
      parts.push(`<text x="${col3}" y="${y + 14}" font-family="Montserrat, sans-serif" font-size="12" fill="#2A2A2A">${tx(noteLines[1])}</text>`);
      y += 14;
    }
    y += 8;
    parts.push(`<line x1="${PAD}" y1="${y}" x2="${W - PAD}" y2="${y}" stroke="#D9D9D9" stroke-width="0.5"/>`);
  }
  y += 20;

  // -------- Closing essay
  parts.push(`<line x1="${PAD}" y1="${y}" x2="${W - PAD}" y2="${y}" stroke="#0F0F0F" stroke-width="1"/>`);
  y += 22;
  parts.push(sectionHead("Why we make them", PAD, y));
  y += 26;
  const essayLines = wrapWords(dossier.essay || "", 68);
  for (const line of essayLines.slice(0, 6)) {
    parts.push(`<text x="${PAD}" y="${y}" font-family="Playfair Display, serif" font-size="16" fill="#2A2A2A">${tx(line)}</text>`);
    y += 24;
  }

  // -------- Footer
  const footY = H - 56;
  parts.push(`<line x1="${PAD}" y1="${footY - 26}" x2="${W - PAD}" y2="${footY - 26}" stroke="#0F0F0F" stroke-width="1"/>`);
  parts.push(`<line x1="${PAD}" y1="${footY - 22}" x2="${W - PAD}" y2="${footY - 22}" stroke="#0F0F0F" stroke-width="1"/>`);
  parts.push(`<g font-family="JetBrains Mono, monospace" font-size="10.5" letter-spacing="1.6" fill="#0F0F0F">
    <text x="${PAD}" y="${footY}">FILED BY @${tx(author.toUpperCase())}</text>
    <text x="${W / 2}" y="${footY}" text-anchor="middle">FIELD GUIDE · ALTERU PRESS</text>
    <text x="${W - PAD}" y="${footY}" text-anchor="end">SET IN PLAYFAIR</text>
  </g>`);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
${parts.join("\n")}
</svg>`;
}

function sectionHead(label, x, y) {
  return `<text x="${x}" y="${y}" font-family="JetBrains Mono, monospace" font-size="10.5" font-weight="600" letter-spacing="2.4" fill="#7700A1">${svgEscape(label.toUpperCase())}</text>`;
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
