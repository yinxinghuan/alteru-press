// AlterU Press · Field Guide · app glue
// Photo in → Claude vision dossier (via Worker) → Editorial poster.

import { buildPosterSVG, POSTER_W, POSTER_H } from "./poster.js";
import * as Wall from "./wall.js";
import { aigramCtx, fetchUser, postToFeed } from "./aigram.js";
import { fetchDossier, DEMO_KEYS } from "./guide.js";

const $ = (id) => document.getElementById(id);
const dropzone = $("upload");
const fileInput = $("file");
const processing = $("processing");
const processingMsg = $("processingMsg");
const result = $("result");
const posterWrap = $("posterWrap");
const readout = $("readout");
const userChip = $("userChip");
const shareFeedBtn = $("shareFeedBtn");

let state = {
  user: { id: null, name: "anonymous", handle: "anonymous" },
  currentDossier: null,
  currentSvg: null,
  currentDataUrl: null,
  currentImg: null,
  currentEntry: null,
};

init();

async function init() {
  // Aigram identity bootstrap
  if (aigramCtx.isInside) {
    userChip.textContent = "syncing aigram…";
    try {
      const u = await fetchUser();
      if (u) {
        state.user = u;
        userChip.textContent = `@${u.handle} · via aigram`;
        shareFeedBtn.classList.remove("hidden");
      } else {
        userChip.textContent = "anon · aigram (no profile)";
      }
    } catch {
      userChip.textContent = "anon · aigram (offline)";
    }
  } else {
    userChip.textContent = "anon · independent";
  }

  // Demo mode: ?demo=hat | teapot | satchel
  const qsDemo = new URLSearchParams(location.search).get("demo");
  if (qsDemo) {
    runDemo(qsDemo);
    return;
  }

  // Wire up dropzone
  dropzone.addEventListener("click", () => fileInput.click());
  dropzone.addEventListener("dragover", (e) => { e.preventDefault(); dropzone.classList.add("hover"); });
  dropzone.addEventListener("dragleave", () => dropzone.classList.remove("hover"));
  dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropzone.classList.remove("hover");
    const f = e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) handleFile(f);
  });
  fileInput.addEventListener("change", (e) => {
    const f = e.target.files && e.target.files[0];
    if (f) handleFile(f);
  });
  document.addEventListener("paste", (e) => {
    if (!result.classList.contains("hidden")) return;
    const f = [...(e.clipboardData?.files || [])][0];
    if (f) handleFile(f);
  });

  // Demo chip(s)
  const demoBar = $("demoBar");
  if (demoBar) {
    demoBar.innerHTML = DEMO_KEYS.map(k => `<a href="?demo=${k}">${k}</a>`).join(" · ");
  }

  $("dlPNG").addEventListener("click", downloadPNG);
  $("dlSVG").addEventListener("click", downloadSVG);
  $("publishBtn").addEventListener("click", publishToWall);
  $("resetBtn").addEventListener("click", resetView);
  shareFeedBtn.addEventListener("click", shareToFeed);

  renderWall();
}

async function handleFile(file) {
  if (!file || !file.type.startsWith("image/")) {
    toast("That doesn't look like an image.");
    return;
  }
  showProcessing("Identifying the subject…");

  const url = await fileToDataURL(file);
  const img = await loadImage(url);

  let dossier;
  try {
    dossier = await fetchDossier({ imageDataUrl: url });
  } catch (e) {
    console.error(e);
    toast("The press is unreachable.");
    resetView();
    return;
  }
  if (!dossier || !dossier.ok) {
    if (dossier?.reason === "worker_not_configured") {
      toast("Worker not deployed yet — try a /?demo=hat link");
    } else {
      toast(dossier?.reason ? `Couldn't read this — ${dossier.reason}` : "Couldn't read this picture.");
    }
    resetView();
    return;
  }

  finalizeResult({ url, img, dossier });
}

async function runDemo(key) {
  showProcessing("Pulling a demo dossier…");
  const dossier = await fetchDossier({ demoKey: key });
  if (!dossier || !dossier.ok) {
    toast(`No such demo "${key}"`);
    resetView();
    return;
  }
  // Use a sampled stock image for the demo
  const url = `https://picsum.photos/seed/alteru-${key}/1200/900`;
  const img = await loadImage(url);
  const dataUrl = await urlToDataUrl(url);
  finalizeResult({ url: dataUrl, img, dossier });
}

function finalizeResult({ url, img, dossier }) {
  const svg = buildPosterSVG(dossier, url, {
    author: state.user.handle,
    imgW: img.naturalWidth,
    imgH: img.naturalHeight,
    date: new Date().toISOString().slice(0, 10).replace(/-/g, "."),
    issueNo: nextIssueNo(),
  });

  state.currentDossier = dossier;
  state.currentSvg = svg;
  state.currentDataUrl = url;
  state.currentImg = img;
  state.currentEntry = null;

  showResult(svg, dossier);
}

function showProcessing(msg) {
  dropzone.classList.add("hidden");
  result.classList.add("hidden");
  processing.classList.remove("hidden");
  if (processingMsg) processingMsg.textContent = msg || "Reading the picture…";
}
function showResult(svg, dossier) {
  dropzone.classList.add("hidden");
  processing.classList.add("hidden");
  result.classList.remove("hidden");
  posterWrap.innerHTML = svg;
  readout.innerHTML = `
    <b>${escapeHtml(dossier.title)}</b><br>
    <span style="color:var(--mute)">${escapeHtml(dossier.kicker || "")}</span><br>
    <span style="color:var(--mute)">${(dossier.anatomy || []).length} parts · ${(dossier.relatives || []).length} relatives</span>
    ${dossier._source === "demo" ? `<br><span style="color:var(--pink-strong);font-weight:600">DEMO MODE</span>` : ""}
  `;
}
function resetView() {
  dropzone.classList.remove("hidden");
  processing.classList.add("hidden");
  result.classList.add("hidden");
  posterWrap.innerHTML = "";
  fileInput.value = "";
  state.currentDossier = null;
  state.currentSvg = null;
  state.currentDataUrl = null;
  state.currentImg = null;
  state.currentEntry = null;
}

async function downloadPNG() {
  if (!state.currentSvg) return;
  const scale = 2;
  const svgBlob = new Blob([state.currentSvg], { type: "image/svg+xml;charset=utf-8" });
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
  downloadBlob(blob, `field-guide-${slug(state.currentDossier?.title)}-${Date.now()}.png`);
  toast("PNG downloaded");
}

function downloadSVG() {
  if (!state.currentSvg) return;
  const blob = new Blob([state.currentSvg], { type: "image/svg+xml;charset=utf-8" });
  downloadBlob(blob, `field-guide-${slug(state.currentDossier?.title)}-${Date.now()}.svg`);
  toast("SVG downloaded");
}

function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function publishToWall() {
  if (!state.currentDossier) return;
  const thumb = await makeThumb(state.currentDataUrl, 360);
  const entry = Wall.publish({
    author: state.user.name,
    handle: state.user.handle,
    thumb,
    title: state.currentDossier.title,
    kicker: state.currentDossier.kicker,
  });
  state.currentEntry = entry;
  renderWall();
  toast("Posted to the wall");
}

async function shareToFeed() {
  if (!aigramCtx.isInside) { toast("Not in Aigram"); return; }
  if (!state.currentEntry) await publishToWall();
  const r = await postToFeed({
    note: `Field-guided ${state.currentDossier.title}.`,
    imageUrl: state.currentEntry?.thumb,
    specId: state.currentEntry?.id,
  });
  toast(r.ok ? "Shared to feed" : "Couldn't share");
}

function renderWall() {
  const grid = document.getElementById("wallGrid");
  const items = Wall.getWall({ limit: 24 });
  if (!items.length) {
    grid.innerHTML = `<div class="wall-empty">No specimens on display yet. Be the first to file.</div>`;
    return;
  }
  grid.innerHTML = items.map(it => `
    <div class="wall-card" data-id="${it.id}">
      ${it.thumb ? `<img class="thumb" src="${it.thumb}" alt="">` : `<div class="thumb"></div>`}
      <div class="title">${escapeHtml(it.title || "untitled")}</div>
      <div class="meta">
        <span>@${escapeHtml(it.handle).slice(0, 14)}</span>
        <span>${escapeHtml((it.kicker || "").split(" ").slice(0, 2).join(" "))}</span>
      </div>
    </div>
  `).join("");
}

function nextIssueNo() {
  const n = Number(localStorage.getItem("alteru-press:issueCounter") || "0") + 1;
  localStorage.setItem("alteru-press:issueCounter", String(n));
  return String(n).padStart(4, "0");
}

function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function urlToDataUrl(url) {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.readAsDataURL(blob);
  });
}

async function makeThumb(dataUrl, maxSize) {
  const img = await loadImage(dataUrl);
  const scale = Math.min(1, maxSize / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.round(img.naturalWidth * scale);
  const h = Math.round(img.naturalHeight * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", 0.78);
}

function toast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove("show"), 2200);
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
}

function slug(s) {
  return String(s || "untitled").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
