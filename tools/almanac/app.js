// AlterU Press · Almanac · app glue
// Open → fetch today's canonical page → render poster → enable stamp.

import { getTodayPage } from "./almanac.js";
import { buildAlmanacSVG, POSTER_W, POSTER_H } from "./poster.js";
import { aigramCtx, fetchUser } from "../field-guide/aigram.js";
import { t } from "../../shared/i18n.js";
import { buildIllustrationPrompt } from "./seasons.js";

const GEN_IMAGE_PROXY = "https://chat.aiwaves.tech/aigram/api/gen-image";
// Style anchor: a 1024×1024 botanical-illustration ref hosted on Pages.
// The model preserves aspect from ref; this is square → square output.
const STYLE_REF_URL = "https://yinxinghuan.github.io/alteru-press/tools/field-guide/img/hat.png";

const $ = (id) => document.getElementById(id);

const STAMPS_KEY = (dateKey) => `alteru-press:almanac:stamps:${dateKey}`;

let state = {
  user: { id: null, name: "anonymous", handle: "anonymous" },
  page: null,
  myStamp: null,
  illustrationUrl: null,
};

const ILLUSTRATION_BASE = new URL("img/daily/", import.meta.url).href;

init();

async function init() {
  // Aigram identity bootstrap — only show the chip when actually logged in
  $("userChip").classList.add("hidden");
  $("userChip").textContent = "";
  if (aigramCtx.isInside) {
    try {
      const u = await fetchUser();
      if (u) {
        state.user = u;
        $("userChip").textContent = `@${u.handle}`;
        $("userChip").classList.remove("hidden");
        $("userChip").removeAttribute("data-i18n");
      }
    } catch {}
  }

  $("publishStamp").addEventListener("click", stamp);
  $("dlPNG").addEventListener("click", downloadPNG);
  $("dlSVG").addEventListener("click", downloadSVG);

  try {
    const page = await getTodayPage(new Date());
    state.page = page;
    render();
    renderStampList();
    // Each user triggers their own gen-image for today.
    // In Aigram: hits the platform proxy → user gets a fresh illustration.
    // Standalone preview: falls back to committed PNG demo.
    requestUserIllustration(page).then((url) => {
      if (url) {
        state.illustrationUrl = url;
        render();
      }
      hideProcessing();
    });
  } catch (e) {
    console.error(e);
    toast(t("stamp.toast.failed"));
    hideProcessing();
  }
}

async function requestUserIllustration(page) {
  const dateKey = todayKey();
  const userKey = (state.user.handle || "anon").toLowerCase();
  const cacheKey = `alteru-press:almanac:illus:${userKey}:${dateKey}`;

  // 1. Per-user localStorage cache — same user opens twice on the same day → instant
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) return cached;
  } catch {}

  // 2. In Aigram: trigger gen-image for this user
  if (aigramCtx.isInside) {
    showProcessing("DRAWING", "Drawing today's almanac…");
    try {
      const prompt = buildIllustrationPrompt(page);
      const r = await fetch(GEN_IMAGE_PROXY, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ref: STYLE_REF_URL, prompt }),
      });
      if (r.ok) {
        const data = await r.json();
        const url = data.url || data.image || data.image_url;
        if (url) {
          try { localStorage.setItem(cacheKey, url); } catch {}
          return url;
        }
      }
    } catch (e) {
      console.warn("gen-image failed", e);
    }
  }

  // 3. Standalone/preview fallback: committed PNG demo
  const fallback = `${ILLUSTRATION_BASE}${dateKey}.png`;
  try {
    const r = await fetch(fallback, { method: "HEAD" });
    if (r.ok) return fallback;
  } catch {}
  return null;
}

function showProcessing(step, msg) {
  const el = $("processing");
  if (!el) return;
  $("processingStep").textContent = step;
  $("processingMsg").textContent = msg;
  el.classList.add("show");
}
function hideProcessing() {
  $("processing")?.classList.remove("show");
}

function render() {
  $("page").innerHTML = renderAlmanacHTML(state.page, {
    illustrationUrl: state.illustrationUrl,
    author: state.user.handle,
    stamp: state.myStamp,
  });
  $("page").classList.remove("hidden");
  $("stampRow").classList.remove("hidden");
  $("loading").classList.add("hidden");
}

function renderAlmanacHTML(p, opts = {}) {
  const e = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
  const dateStr = `${p.date.y}.${String(p.date.m).padStart(2,"0")}.${String(p.date.d).padStart(2,"0")}`;
  const phase = p.sunMoon.moon;

  const lunarBlock = p.lunar.monthName && p.lunar.dayName ? `
    <section class="lunar">
      <h3>${e(t("alm.section.lunar"))} ${p.jieqi.next ? `<span class="meta">${e(p.jieqi.next)} · ${e(t("alm.daysUntil", { n: p.jieqi.daysUntilNext }))}</span>` : ""}</h3>
      <div class="ml">农历 ${e(p.lunar.monthName)}${e(p.lunar.dayName)}</div>
      <div class="gz">${e(p.ganzhi.year)} 年 · ${e(p.ganzhi.month)} 月 · ${e(p.ganzhi.day)} 日</div>
    </section>` : "";

  const smBlock = `
    <section>
      <h3>${e(t("alm.section.sunmoon"))}</h3>
      <div class="sm">
        <div class="item"><div class="k">${e(t("alm.sm.sunrise"))}</div>  <div class="v">${e(p.sunMoon.sunrise || "—")}</div></div>
        <div class="item"><div class="k">${e(t("alm.sm.sunset"))}</div>   <div class="v">${e(p.sunMoon.sunset || "—")}</div></div>
        <div class="item"><div class="k">${e(t("alm.sm.moonrise"))}</div> <div class="v">${e(p.sunMoon.moonrise || "—")}</div></div>
        <div class="item"><div class="k">${e(t("alm.sm.moonset"))}</div>  <div class="v">${e(p.sunMoon.moonset || "—")}</div></div>
      </div>
    </section>`;

  const yi = (p.yi || []).map(x => `
    <div class="item"><div class="zh">· ${e(x.zh)}</div><div class="en">${e(x.en)}</div></div>
  `).join("");
  const ji = (p.ji || []).map(x => `
    <div class="item"><div class="zh">· ${e(x.zh)}</div><div class="en">${e(x.en)}</div></div>
  `).join("");

  const yjBlock = `
    <section>
      <h3>${e(t("alm.section.yj"))}</h3>
      <div class="yj">
        <div class="col"><h4>${e(t("alm.yj.yi"))}</h4>${yi}</div>
        <div class="col"><h4>${e(t("alm.yj.ji"))}</h4>${ji}</div>
      </div>
    </section>`;

  const otd = (p.onThisDay || []).slice(0, 3).map(x => {
    if (typeof x === "string") return `<div class="item">${e(x)}</div>`;
    return `<div class="item"><b>${e(x.year)}</b>${e(x.text)}</div>`;
  }).join("");
  const otdBlock = `
    <section class="otd">
      <h3>${e(t("alm.section.otd"))}</h3>
      ${otd || `<div class="item" style="color:var(--mute);font-style:italic">${e(t("alm.quietDay"))}</div>`}
    </section>`;

  const noteBlock = `
    <section>
      <h3>${e(t("alm.section.note"))}</h3>
      <div class="note">"${e(p.editorNote || "")}"</div>
    </section>`;

  const stampBlock = opts.stamp ? `
    <div class="stamp-box">
      <div class="by">${e(t("alm.stampBy"))} @${e((opts.author || "you").toUpperCase())} · ${e(opts.stamp.time || "")}</div>
      <div class="note">"${e(opts.stamp.note || "")}"</div>
    </div>` : "";

  const illusBlock = opts.illustrationUrl
    ? `<img class="illus" src="${e(opts.illustrationUrl)}" alt="">`
    : `<div class="illus-fallback">${e(t("alm.illusForthcoming"))}</div>`;

  return `
    <article class="alm">
      <div class="head">
        <div class="row">
          <span>ALTERU PRESS</span>
          <span>Almanac · No. ${e(p.issueNo)}</span>
          <span>${e(dateStr)}</span>
        </div>
        <h1>${e(p.date.monthEn)}<em>${e(p.date.ordinalEn)}.</em></h1>
        <div class="moon-chip">${e(t("alm.moon.label"))} · <em>${e(phase.name)}</em> · ${phase.illumination}${e(t("alm.moon.lit"))}</div>
      </div>
      ${illusBlock}
      ${lunarBlock}
      ${smBlock}
      ${yjBlock}
      ${otdBlock}
      ${noteBlock}
      ${stampBlock}
      <div class="filed">${e(t("alm.filed"))} · ${e(p.date.weekday || "")}</div>
    </article>
  `;
}

function stamp() {
  const note = $("stampInput").value.trim();
  if (!note) {
    toast(t("stamp.toast.empty"));
    return;
  }
  const now = new Date();
  const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  state.myStamp = { note, time };
  saveMyStamp(note, time);
  render();
  renderStampList();
  toast(t("stamp.toast.stamped"));
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function saveMyStamp(note, time) {
  const key = STAMPS_KEY(todayKey());
  let list = [];
  try {
    const raw = localStorage.getItem(key);
    if (raw) list = JSON.parse(raw) || [];
  } catch {}
  // Replace previous self stamp if any
  list = list.filter(s => s.handle !== state.user.handle);
  list.unshift({
    handle: state.user.handle,
    name: state.user.name,
    note, time,
    createdAt: Date.now(),
  });
  localStorage.setItem(key, JSON.stringify(list.slice(0, 60)));
}

function getStamps() {
  const key = STAMPS_KEY(todayKey());
  // Local self-stamps
  let local = [];
  try {
    const raw = localStorage.getItem(key);
    if (raw) local = JSON.parse(raw) || [];
  } catch {}
  // Sample cross-user stamps for preview density
  const samples = [
    { handle: "jenny",      name: "Jenny",      note: "记得给妈打电话",                  time: "18:22", createdAt: Date.now() - 1000 * 60 * 80 },
    { handle: "algram",     name: "Algram",     note: "今天发现窗外有只新麻雀",            time: "11:14", createdAt: Date.now() - 1000 * 60 * 200 },
    { handle: "ghostpixel", name: "ghostpixel", note: "决定不回那条三天前的消息了",        time: "14:08", createdAt: Date.now() - 1000 * 60 * 400 },
    { handle: "isaya",      name: "Isaya",      note: "the rain finally stopped at 4pm.", time: "16:02", createdAt: Date.now() - 1000 * 60 * 520 },
    { handle: "jmf",        name: "JM·F",       note: "wrote one paragraph today.",       time: "21:45", createdAt: Date.now() - 1000 * 60 * 720 },
  ];
  return [...local, ...samples].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 30);
}

function renderStampList() {
  const list = getStamps();
  const el = $("stampList");
  if (!list.length) {
    el.innerHTML = `<div class="stamps-empty">${escapeHtml(t("stamp.wallEmpty"))}</div>`;
    $("stampCount").textContent = t("stamp.wallCount", { n: 0 });
    return;
  }
  $("stampCount").textContent = t("stamp.wallCount", { n: list.length });
  el.innerHTML = list.map(s => `
    <div class="stamp-card">
      <div class="author">
        <div class="avatar">${escapeHtml((s.handle || "a")[0].toUpperCase())}</div>
        <span class="name">@${escapeHtml(s.handle)}</span>
        <span class="when">${escapeHtml(s.time || "")}</span>
      </div>
      <div class="note">${escapeHtml(s.note)}</div>
    </div>
  `).join("");
}

async function downloadPNG() {
  if (!state.page) return;
  const svgStr = buildAlmanacSVG(state.page, {
    author: state.user.handle,
    stamp: state.myStamp,
    illustrationUrl: state.illustrationUrl,
  });
  const scale = 2;
  const svgBlob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
  const svgUrl = URL.createObjectURL(svgBlob);
  const img = await loadImage(svgUrl);
  const canvas = document.createElement("canvas");
  canvas.width = POSTER_W * scale;
  canvas.height = POSTER_H * scale;
  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);
  ctx.fillStyle = "#F5F2EC";
  ctx.fillRect(0, 0, POSTER_W, POSTER_H);
  ctx.drawImage(img, 0, 0, POSTER_W, POSTER_H);
  URL.revokeObjectURL(svgUrl);
  const blob = await new Promise(r => canvas.toBlob(r, "image/png", 0.96));
  download(blob, `almanac-${todayKey()}.png`);
  toast(t("toast.pngSaved"));
}

function downloadSVG() {
  if (!state.page) return;
  const svg = buildAlmanacSVG(state.page, {
    author: state.user.handle,
    stamp: state.myStamp,
  });
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  download(blob, `almanac-${todayKey()}.svg`);
  toast(t("toast.svgSaved"));
}

function download(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function loadImage(src) {
  return new Promise((res, rej) => {
    const i = new Image();
    i.crossOrigin = "anonymous";
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = src;
  });
}

function toast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove("show"), 2200);
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
}
