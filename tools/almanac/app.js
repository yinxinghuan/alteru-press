// AlterU Press · Almanac · app glue
// Open → fetch today's canonical page → render poster → enable stamp.

import { getInstantPage, augmentPage } from "./almanac.js?v=p3";
import { buildAlmanacSVG, POSTER_W, POSTER_H } from "./poster.js?v=p3";
import { aigramCtx, fetchUser } from "../field-guide/aigram.js?v=p3";
import { t } from "../../shared/i18n.js?v=p3";
import { buildIllustrationPrompt } from "./seasons.js?v=p3";
import { createSave, listCrossUserSaves, fetchUserInfo, currentTelegramId } from "../../shared/save.js?v=p3";
import { openAigramProfile, isInAigram } from "../../shared/bridge.js?v=p3";

const almanacSave = createSave("almanac");
let myStamps = {}; // { [dateKey]: { note, time, createdAt } }
let stampsLoaded = false;

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
  // Aigram identity bootstrap — fire-and-forget so the page can render
  // even if the bridge is slow (up to 10s timeout otherwise).
  $("userChip").classList.add("hidden");
  $("userChip").textContent = "";
  if (aigramCtx.isInside) {
    fetchUser().then((u) => {
      if (!u) return;
      state.user = u;
      $("userChip").textContent = `@${u.handle}`;
      $("userChip").classList.remove("hidden");
    }).catch(() => {});
  }

  $("publishStamp").addEventListener("click", stamp);
  $("dlPNG").addEventListener("click", downloadPNG);
  $("dlSVG").addEventListener("click", downloadSVG);

  // Stamp wall click delegation — profile tap
  $("stampList").addEventListener("click", (e) => {
    const tap = e.target.closest("[data-profile]");
    if (tap) openAigramProfile(tap.getAttribute("data-profile"));
  });

  try {
    const now = new Date();
    // Phase 1 · render the page IMMEDIATELY with synchronous local data.
    // Lunar / jieqi / wikipedia might be blocked by Aigram's CSP; we
    // don't make the user wait on them.
    const page = getInstantPage(now);
    state.page = page;
    render();
    renderStampList();

    // Phase 2 · augment with lunar / jieqi / wiki async — re-render when
    // each piece resolves. Failures leave the fallback values; no toast.
    augmentPage(page, now).then(() => {
      state.page = page;
      render();
    }).catch(() => {});

    // Phase 3 · daily illustration (gen-image), parallel to augmentation.
    requestUserIllustration(page).then((url) => {
      if (url) {
        state.illustrationUrl = url;
        render();
      }
      hideProcessing();
    });
  } catch (e) {
    console.error("almanac init failed", e);
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

async function stamp() {
  const note = $("stampInput").value.trim();
  if (!note) { toast(t("stamp.toast.empty")); return; }
  if (state.stamping) return;
  state.stamping = true;
  const btn = $("publishStamp");
  const originalLabel = btn?.textContent || "";
  if (btn) { btn.disabled = true; btn.style.opacity = "0.5"; }
  try {
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    state.myStamp = { note, time };

    await ensureStampsLoaded();
    myStamps[todayKey()] = { note, time, createdAt: Date.now() };
    almanacSave.persist({ stamps: myStamps });

    render();
    await renderStampList();
    toast(t("stamp.toast.stamped"));
  } finally {
    state.stamping = false;
    if (btn) {
      btn.disabled = false;
      btn.style.opacity = "";
      // After publish, button reflects that a stamp now exists today
      btn.textContent = "✓ " + t("stamp.alreadyStamped");
    }
  }
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

async function ensureStampsLoaded() {
  if (stampsLoaded) return;
  stampsLoaded = true;
  const data = await almanacSave.load();
  if (data && data.stamps && typeof data.stamps === "object") {
    myStamps = data.stamps;
  }
  // Restore today's stamp into UI state — textarea pre-filled + button
  // already-stamped so user doesn't accidentally re-stamp blindly.
  const todayStamp = myStamps[todayKey()];
  if (todayStamp) {
    state.myStamp = { note: todayStamp.note, time: todayStamp.time };
    syncStampButtonAlreadyStamped();
  }
}

function syncStampButtonAlreadyStamped() {
  const input = $("stampInput");
  const btn = $("publishStamp");
  if (input && state.myStamp?.note) input.value = state.myStamp.note;
  if (btn) {
    btn.textContent = "✓ " + t("stamp.alreadyStamped");
  }
}

const SAMPLES = [
  { userId: "demo_jenny",      name: "Jenny",      handle: "jenny",      note: "记得给妈打电话",                  time: "18:22", createdAt: Date.now() - 1000 * 60 * 80 },
  { userId: "demo_algram",     name: "Algram",     handle: "algram",     note: "今天发现窗外有只新麻雀",            time: "11:14", createdAt: Date.now() - 1000 * 60 * 200 },
  { userId: "demo_ghostpixel", name: "ghostpixel", handle: "ghostpixel", note: "决定不回那条三天前的消息了",        time: "14:08", createdAt: Date.now() - 1000 * 60 * 400 },
  { userId: "demo_isaya",      name: "Isaya",      handle: "isaya",      note: "the rain finally stopped at 4pm.", time: "16:02", createdAt: Date.now() - 1000 * 60 * 520 },
];

async function getStamps() {
  await ensureStampsLoaded();
  const today = todayKey();
  const me = currentTelegramId();
  const list = [];

  // My stamp (optimistic) — if I stamped today
  if (myStamps[today]) {
    list.push({
      userId: me || "me",
      userName: "YOU",
      userAvatarUrl: null,
      handle: state.user.handle,
      note: myStamps[today].note,
      time: myStamps[today].time,
      createdAt: myStamps[today].createdAt,
      isSelf: true,
    });
  }

  // Cross-user
  if (isInAigram) {
    const rows = await listCrossUserSaves();
    const uniqueIds = new Set();
    const others = [];
    for (const row of rows) {
      if (!row || row.user_id === me) continue;
      const today_stamp = row.payload?.stamps?.[today];
      if (!today_stamp) continue;
      uniqueIds.add(row.user_id);
      others.push({
        userId: row.user_id,
        note: today_stamp.note,
        time: today_stamp.time,
        createdAt: today_stamp.createdAt,
        isSelf: false,
        userName: null,
        userAvatarUrl: null,
      });
    }
    // Resolve user info
    const infoMap = new Map();
    await Promise.all(Array.from(uniqueIds).map(async (uid) => {
      const info = await fetchUserInfo(uid);
      if (info) infoMap.set(uid, info);
    }));
    for (const s of others) {
      const info = infoMap.get(s.userId);
      if (info) {
        s.userName = info.handle || info.name;
        s.userAvatarUrl = info.head_url;
      }
    }
    list.push(...others);
  }

  // Samples only in standalone preview (not real Aigram)
  if (list.length === 0 && !isInAigram) {
    for (const s of SAMPLES) {
      list.push({ ...s, userName: s.handle, isSelf: false });
    }
  }

  list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  return list.slice(0, 30);
}

async function renderStampList() {
  const list = await getStamps();
  const el = $("stampList");
  if (!list.length) {
    el.innerHTML = `<div class="stamps-empty">${escapeHtml(t("stamp.wallEmpty"))}</div>`;
    $("stampCount").textContent = t("stamp.wallCount", { n: 0 });
    return;
  }
  $("stampCount").textContent = t("stamp.wallCount", { n: list.length });
  el.innerHTML = list.map(s => {
    const name = s.userName || s.handle || "·";
    const avatarHtml = s.isSelf
      ? ""
      : s.userAvatarUrl
        ? `<div class="avatar"><img src="${escapeHtml(s.userAvatarUrl)}" alt="" draggable="false"></div>`
        : `<div class="avatar"><span class="avatar-letter">${escapeHtml((name || "?")[0].toUpperCase())}</span></div>`;
    const author = s.isSelf
      ? `<div class="author author--me"><span class="name">YOU</span></div>`
      : `<div class="author" ${s.userId ? `data-profile="${escapeHtml(s.userId)}"` : ""}>${avatarHtml}<span class="name">@${escapeHtml(name)}</span></div>`;
    return `
    <div class="stamp-card">
      <div class="row">${author}<span class="when">${escapeHtml(s.time || "")}</span></div>
      <div class="note">${escapeHtml(s.note)}</div>
    </div>`;
  }).join("");
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
