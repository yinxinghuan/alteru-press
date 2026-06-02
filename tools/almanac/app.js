// AlterU Press · Almanac · app glue
// Open → fetch today's canonical page → render poster → enable stamp.

import { getTodayPage } from "./almanac.js";
import { buildAlmanacSVG, POSTER_W, POSTER_H } from "./poster.js";
import { aigramCtx, fetchUser } from "../field-guide/aigram.js";
import { t } from "../../shared/i18n.js";

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
  // Aigram identity bootstrap
  if (aigramCtx.isInside) {
    try {
      const u = await fetchUser();
      if (u) {
        state.user = u;
        $("userChip").textContent = `@${u.handle}`;
      } else {
        $("userChip").textContent = "anon";
      }
    } catch { $("userChip").textContent = "anon"; }
  }

  $("publishStamp").addEventListener("click", stamp);
  $("dlPNG").addEventListener("click", downloadPNG);
  $("dlSVG").addEventListener("click", downloadSVG);

  try {
    const page = await getTodayPage(new Date());
    state.page = page;
    render();
    renderStampList();
    // Try to load today's illustration (committed PNG or Worker-generated later)
    loadIllustration(todayKey()).then((url) => {
      if (url) {
        state.illustrationUrl = url;
        render();
      }
    });
  } catch (e) {
    console.error(e);
    toast("Couldn't load today's page");
  }
}

async function loadIllustration(dateKey) {
  // Try the static path first (canonical PNG committed in repo)
  const staticUrl = `${ILLUSTRATION_BASE}${dateKey}.png`;
  try {
    const r = await fetch(staticUrl, { method: "HEAD" });
    if (r.ok) return staticUrl;
  } catch {}
  // Worker fallback would go here in a later phase.
  return null;
}

function render() {
  const svg = buildAlmanacSVG(state.page, {
    author: state.user.handle,
    stamp: state.myStamp,
    illustrationUrl: state.illustrationUrl,
  });
  $("page").innerHTML = svg;
  $("page").classList.remove("hidden");
  $("stampRow").classList.remove("hidden");
  $("loading").classList.add("hidden");
}

function stamp() {
  const note = $("stampInput").value.trim();
  if (!note) {
    toast("Write a line first");
    return;
  }
  const now = new Date();
  const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  state.myStamp = { note, time };
  saveMyStamp(note, time);
  render();
  renderStampList();
  toast("Stamped");
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
    el.innerHTML = `<div class="stamps-empty">No stamps yet today. Be the first.</div>`;
    $("stampCount").textContent = "today · 0";
    return;
  }
  $("stampCount").textContent = `today · ${list.length}`;
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
  toast("PNG saved");
}

function downloadSVG() {
  if (!state.page) return;
  const svg = buildAlmanacSVG(state.page, {
    author: state.user.handle,
    stamp: state.myStamp,
  });
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  download(blob, `almanac-${todayKey()}.svg`);
  toast("SVG saved");
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
