// AlterU Press · Almanac · 1080×1920 SVG poster

export const POSTER_W = 1080;
export const POSTER_H = 1920;
const W = POSTER_W;
const H = POSTER_H;
const PAD = 72;

export function buildAlmanacSVG(page, opts = {}) {
  const author = opts.author || "anonymous";
  const stamp = opts.stamp || null; // { note, time }
  const tx = svgEscape;
  const parts = [];

  parts.push(`<rect width="${W}" height="${H}" fill="#F5F2EC"/>`);

  // ───────── Header
  parts.push(`<g font-family="JetBrains Mono, monospace" font-size="13" letter-spacing="2.2" fill="#0F0F0F">
    <text x="${PAD}" y="48">ALTERU PRESS</text>
    <text x="${W / 2}" y="48" text-anchor="middle">ALMANAC · No. ${tx(page.issueNo)}</text>
    <text x="${W - PAD}" y="48" text-anchor="end">${tx(formatDate(page.date))}</text>
  </g>`);
  parts.push(`<line x1="${PAD}" y1="72" x2="${W - PAD}" y2="72" stroke="#0F0F0F" stroke-width="1.2"/>`);
  parts.push(`<line x1="${PAD}" y1="78" x2="${W - PAD}" y2="78" stroke="#0F0F0F" stroke-width="1.2"/>`);

  let y = 162;

  // ───────── Big date title
  parts.push(`<text x="${PAD}" y="${y}" font-family="Playfair Display, serif" font-weight="900" font-size="92" fill="#0F0F0F" letter-spacing="-3">${tx(page.date.monthEn)}</text>`);
  y += 92;
  parts.push(`<text x="${PAD}" y="${y}" font-family="Playfair Display, serif" font-weight="900" font-style="italic" font-size="92" fill="#E8709A" letter-spacing="-3">${tx(page.date.ordinalEn)}.</text>`);
  // Moon phase chip (top right)
  const phase = page.sunMoon.moon;
  parts.push(`<g transform="translate(${W - PAD - 220}, 154)">
    <rect width="220" height="74" fill="none" stroke="#0F0F0F" stroke-width="1"/>
    <text x="14" y="26" font-family="JetBrains Mono, monospace" font-size="10" letter-spacing="2" fill="#6B6B6B">MOON</text>
    <text x="14" y="52" font-family="Playfair Display, serif" font-style="italic" font-weight="700" font-size="20" fill="#0F0F0F">${tx(phase.name)}</text>
    <text x="206" y="66" text-anchor="end" font-family="JetBrains Mono, monospace" font-size="11" fill="#6B6B6B">${phase.illumination}% lit</text>
  </g>`);
  y += 38;

  // ───────── Hero illustration
  y += 16;
  const heroH = 540;
  const heroW = W - PAD * 2;
  if (opts.illustrationUrl) {
    // Frame
    parts.push(`<rect x="${PAD - 6}" y="${y - 6}" width="${heroW + 12}" height="${heroH + 12}" fill="#0F0F0F"/>`);
    parts.push(`<image href="${opts.illustrationUrl}" x="${PAD}" y="${y}" width="${heroW}" height="${heroH}" preserveAspectRatio="xMidYMid slice"/>`);
  } else {
    // Placeholder (image still loading or not yet generated for this date)
    parts.push(`<rect x="${PAD}" y="${y}" width="${heroW}" height="${heroH}" fill="#E8DEC7" stroke="#0F0F0F" stroke-width="1.5"/>`);
    parts.push(`<rect x="${PAD + 16}" y="${y + 16}" width="${heroW - 32}" height="${heroH - 32}" fill="none" stroke="#6B6B6B" stroke-width="0.8" stroke-dasharray="6,4"/>`);
    parts.push(`<text x="${W / 2}" y="${y + heroH / 2 - 14}" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="11" letter-spacing="3" fill="#6B6B6B">DAILY ILLUSTRATION</text>`);
    parts.push(`<text x="${W / 2}" y="${y + heroH / 2 + 14}" text-anchor="middle" font-family="Playfair Display, serif" font-style="italic" font-size="20" fill="#6B6B6B">— forthcoming —</text>`);
  }
  y += heroH + 28;

  // ───────── Lunar block
  parts.push(`<line x1="${PAD}" y1="${y}" x2="${W - PAD}" y2="${y}" stroke="#0F0F0F" stroke-width="1.2"/>`);
  y += 28;
  parts.push(sectionHead("Lunar", PAD, y));
  if (page.jieqi.next) {
    parts.push(`<text x="${W - PAD}" y="${y}" text-anchor="end" font-family="JetBrains Mono, monospace" font-size="11" letter-spacing="2" fill="#6B6B6B">${tx(page.jieqi.next)} · ${page.jieqi.daysUntilNext}D</text>`);
  }
  y += 32;
  if (page.lunar.monthName && page.lunar.dayName) {
    parts.push(`<text x="${PAD}" y="${y}" font-family="Playfair Display, serif" font-style="italic" font-weight="700" font-size="32" fill="#0F0F0F">农历 ${tx(page.lunar.monthName)}${tx(page.lunar.dayName)}</text>`);
    y += 38;
  }
  parts.push(`<text x="${PAD}" y="${y}" font-family="JetBrains Mono, monospace" font-size="16" letter-spacing="1.5" fill="#2A2A2A">${tx(page.ganzhi.year)} 年 · ${tx(page.ganzhi.month)} 月 · ${tx(page.ganzhi.day)} 日</text>`);
  y += 30;

  // ───────── Sun / moon table
  parts.push(`<line x1="${PAD}" y1="${y}" x2="${W - PAD}" y2="${y}" stroke="#0F0F0F" stroke-width="1.2"/>`);
  y += 28;
  parts.push(sectionHead("Sun · Moon", PAD, y));
  y += 32;
  const sm = page.sunMoon;
  const colW = (W - PAD * 2) / 2;
  drawKV(parts, "SUNRISE", sm.sunrise || "—",  PAD, y);
  drawKV(parts, "SUNSET",  sm.sunset || "—",   PAD, y + 28);
  drawKV(parts, "MOONRISE", sm.moonrise || "—", PAD + colW, y);
  drawKV(parts, "MOONSET",  sm.moonset || "—",  PAD + colW, y + 28);
  y += 68;

  // ───────── 宜 / 忌 columns
  parts.push(`<line x1="${PAD}" y1="${y}" x2="${W - PAD}" y2="${y}" stroke="#0F0F0F" stroke-width="1.2"/>`);
  y += 28;
  parts.push(`<text x="${PAD}" y="${y}" font-family="JetBrains Mono, monospace" font-size="13" font-weight="600" letter-spacing="3" fill="#7700A1">宜 · AUSPICIOUS</text>`);
  parts.push(`<text x="${PAD + colW}" y="${y}" font-family="JetBrains Mono, monospace" font-size="13" font-weight="600" letter-spacing="3" fill="#7700A1">忌 · INAUSPICIOUS</text>`);
  y += 30;
  for (let i = 0; i < 3; i++) {
    const yiItem = page.yi[i];
    const jiItem = page.ji[i];
    if (yiItem) {
      parts.push(`<text x="${PAD}" y="${y}" font-family="Playfair Display, serif" font-weight="700" font-size="22" fill="#0F0F0F">· ${tx(yiItem.zh)}</text>`);
      parts.push(`<text x="${PAD + 14}" y="${y + 22}" font-family="Montserrat, sans-serif" font-style="italic" font-size="14" fill="#6B6B6B">${tx(yiItem.en)}</text>`);
    }
    if (jiItem) {
      parts.push(`<text x="${PAD + colW}" y="${y}" font-family="Playfair Display, serif" font-weight="700" font-size="22" fill="#0F0F0F">· ${tx(jiItem.zh)}</text>`);
      parts.push(`<text x="${PAD + colW + 14}" y="${y + 22}" font-family="Montserrat, sans-serif" font-style="italic" font-size="14" fill="#6B6B6B">${tx(jiItem.en)}</text>`);
    }
    y += 50;
  }
  y += 8;

  // ───────── On this day
  parts.push(`<line x1="${PAD}" y1="${y}" x2="${W - PAD}" y2="${y}" stroke="#0F0F0F" stroke-width="1.2"/>`);
  y += 28;
  parts.push(sectionHead("On this day", PAD, y));
  y += 32;
  for (const entry of (page.onThisDay || []).slice(0, 3)) {
    const text = typeof entry === "string" ? entry : `${entry.year} — ${entry.text}`;
    const lines = wrapWords(text, 56);
    for (const line of lines.slice(0, 2)) {
      parts.push(`<text x="${PAD}" y="${y}" font-family="Montserrat, sans-serif" font-size="17" fill="#0F0F0F">${tx(line)}</text>`);
      y += 24;
    }
    y += 6;
  }
  y += 8;

  // ───────── Editor's note
  parts.push(`<line x1="${PAD}" y1="${y}" x2="${W - PAD}" y2="${y}" stroke="#0F0F0F" stroke-width="1.2"/>`);
  y += 28;
  parts.push(sectionHead("Editor's note", PAD, y));
  y += 36;
  const noteLines = wrapWords(page.editorNote || "", 30);
  for (const line of noteLines.slice(0, 5)) {
    parts.push(`<text x="${PAD}" y="${y}" font-family="Playfair Display, serif" font-style="italic" font-size="22" fill="#2A2A2A">"${tx(line)}"</text>`);
    y += 32;
  }

  // ───────── Stamp area
  if (stamp) {
    y += 20;
    parts.push(`<line x1="${PAD}" y1="${y}" x2="${W - PAD}" y2="${y}" stroke="#0F0F0F" stroke-width="0.8" stroke-dasharray="4,4"/>`);
    y += 28;
    parts.push(`<text x="${PAD}" y="${y}" font-family="JetBrains Mono, monospace" font-size="12" letter-spacing="2.4" fill="#E8709A">STAMPED BY @${tx((author || "you").toUpperCase())} · ${tx(stamp.time || "")}</text>`);
    y += 30;
    const stampLines = wrapWords(stamp.note || "", 28);
    for (const line of stampLines.slice(0, 2)) {
      parts.push(`<text x="${PAD}" y="${y}" font-family="Playfair Display, serif" font-weight="700" font-size="24" fill="#0F0F0F">"${tx(line)}"</text>`);
      y += 32;
    }
  }

  // ───────── Footer
  const footY = H - 56;
  parts.push(`<line x1="${PAD}" y1="${footY - 28}" x2="${W - PAD}" y2="${footY - 28}" stroke="#0F0F0F" stroke-width="1.2"/>`);
  parts.push(`<line x1="${PAD}" y1="${footY - 22}" x2="${W - PAD}" y2="${footY - 22}" stroke="#0F0F0F" stroke-width="1.2"/>`);
  parts.push(`<g font-family="JetBrains Mono, monospace" font-size="13" letter-spacing="2" fill="#0F0F0F">
    <text x="${PAD}" y="${footY}">ALMANAC · ALTERU PRESS</text>
    <text x="${W / 2}" y="${footY}" text-anchor="middle">${tx(page.date.weekday || "")}</text>
    <text x="${W - PAD}" y="${footY}" text-anchor="end">${tx(page.animals.year.en + " · " + page.animals.year.zh)}</text>
  </g>`);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
${parts.join("\n")}
</svg>`;
}

function sectionHead(label, x, y) {
  return `<text x="${x}" y="${y}" font-family="JetBrains Mono, monospace" font-size="13" font-weight="600" letter-spacing="3" fill="#7700A1">${svgEscape(label.toUpperCase())}</text>`;
}

function drawKV(parts, k, v, x, y) {
  parts.push(`<text x="${x}" y="${y}" font-family="JetBrains Mono, monospace" font-size="11" letter-spacing="2" fill="#6B6B6B">${svgEscape(k)}</text>`);
  parts.push(`<text x="${x}" y="${y + 22}" font-family="Playfair Display, serif" font-weight="700" font-size="26" fill="#0F0F0F">${svgEscape(v)}</text>`);
}

function svgEscape(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function wrapWords(s, maxChars) {
  const isCJK = /[一-鿿]/.test(String(s));
  if (isCJK) {
    // Naïve char-based wrap for CJK content
    const out = [];
    let cur = "";
    for (const ch of String(s)) {
      if (cur.length >= maxChars && /[\s,，。、]/.test(ch)) {
        out.push(cur.trim()); cur = "";
      } else {
        cur += ch;
        if (cur.length >= maxChars + 8) { out.push(cur); cur = ""; }
      }
    }
    if (cur) out.push(cur);
    return out;
  }
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

function formatDate(date) {
  return `${date.y}.${String(date.m).padStart(2, "0")}.${String(date.d).padStart(2, "0")}`;
}
