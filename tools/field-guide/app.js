// AlterU Press · Field Guide · app glue
// Mobile-first instant-use tool: tap → camera → AI dossier → specimen card →
// publish to cross-user wall. Detail overlay shows full field guide.

import { buildPosterSVG, POSTER_W, POSTER_H } from "./poster.js";
import * as Wall from "./wall.js";
import { aigramCtx, fetchUser, postToFeed } from "./aigram.js";
import { fetchDossier, DEMO_KEYS, DEMOS } from "./guide.js";
import { DEMO_ILLUSTRATIONS, svgToDataUrl } from "./illustrations.js";
import { t, applyI18n } from "../../shared/i18n.js";

const $ = (id) => document.getElementById(id);

const dropzone = $("upload");
const fileInput = $("file");
const processing = $("processing");
const processingMsg = $("processingMsg");
const processingStep = $("processingStep");
const detailEl = $("detail");
const posterWrap = $("posterWrap");
const detailAuthorEl = $("detailAuthor");
const userChip = $("userChip");
const shareFeedBtn = $("shareFeedBtn");

let state = {
  user: { id: null, name: "anonymous", handle: "anonymous" },
  currentDossier: null,
  currentSvg: null,
  currentDataUrl: null,
  currentEntry: null,
};

init();

async function init() {
  // Aigram identity bootstrap
  if (aigramCtx.isInside) {
    try {
      const u = await fetchUser();
      if (u) {
        state.user = u;
        userChip.textContent = `@${u.handle}`;
        userChip.removeAttribute("data-i18n");
        shareFeedBtn.classList.remove("hidden");
      } else {
        userChip.textContent = t("nav.anon");
      }
    } catch {
      userChip.textContent = t("nav.anon");
    }
  } else {
    userChip.textContent = t("nav.anon");
  }

  // Demo bar — keep object names English (decorative), wrap with localized prefix
  const demoBar = $("demoBar");
  if (demoBar) {
    const prefix = t("tool.cta.demoLabel");
    demoBar.innerHTML = `<span style="color:var(--paper);opacity:.6;margin-right:6px">${prefix} ·</span>` +
      DEMO_KEYS.map(k => `<a data-demo="${k}">${k}</a>`).join(" ");
    demoBar.addEventListener("click", (e) => {
      e.stopPropagation();
      const a = e.target.closest("[data-demo]");
      if (a) runDemo(a.dataset.demo);
    });
  }

  // Dropzone events
  dropzone.addEventListener("click", (e) => {
    if (e.target.closest("[data-demo]")) return;
    fileInput.click();
  });
  fileInput.addEventListener("change", (e) => {
    const f = e.target.files && e.target.files[0];
    if (f) handleFile(f);
  });

  // Detail overlay
  $("detailClose").addEventListener("click", closeDetail);
  $("dlPNG").addEventListener("click", downloadPNG);
  $("dlSVG").addEventListener("click", downloadSVG);
  $("publishBtn").addEventListener("click", publishToWall);
  shareFeedBtn.addEventListener("click", shareToFeed);

  // ?demo=key bootstrap
  const qsDemo = new URLSearchParams(location.search).get("demo");
  if (qsDemo && DEMO_KEYS.includes(qsDemo)) {
    runDemo(qsDemo);
  }

  renderWall();
}

async function handleFile(file) {
  if (!file || !file.type.startsWith("image/")) {
    toast(t("toast.notImage"));
    return;
  }
  showProcessing(t("proc.read.step"), t("proc.read.msg"));

  const url = await fileToDataURL(file);

  let dossier;
  try {
    dossier = await fetchDossier({ imageDataUrl: url });
  } catch (e) {
    console.error(e);
    toast(t("toast.pressDown"));
    hideProcessing();
    return;
  }
  if (!dossier || !dossier.ok) {
    if (dossier?.reason === "worker_not_configured") {
      toast(t("toast.workerOff"));
    } else {
      toast(t("toast.cantRead"));
    }
    hideProcessing();
    return;
  }

  showProcessing(t("proc.draw.step"), t("proc.draw.msg"));
  await new Promise(r => setTimeout(r, 600)); // brief artistic pause

  finalizeResult({ url, dossier });
}

async function runDemo(key) {
  showProcessing(t("proc.read.step"), t("proc.demo.read"));
  await new Promise(r => setTimeout(r, 400));
  const dossier = await fetchDossier({ demoKey: key });
  if (!dossier || !dossier.ok) {
    toast(`${t("toast.noDemo")}: "${key}"`);
    hideProcessing();
    return;
  }
  showProcessing(t("proc.draw.step"), t("proc.draw.msg"));
  await new Promise(r => setTimeout(r, 600));
  // For demo, the "original photo" is just for show; we already have illustration
  finalizeResult({ url: null, dossier });
}

function finalizeResult({ url, dossier }) {
  const svg = buildPosterSVG(dossier, dossier.illustration, {
    author: state.user.handle,
    date: new Date().toISOString().slice(0, 10).replace(/-/g, "."),
    issueNo: nextIssueNo(),
  });

  state.currentDossier = dossier;
  state.currentSvg = svg;
  state.currentDataUrl = url;
  state.currentEntry = null;

  // Show detail with self header
  detailAuthorEl.innerHTML = `
    <div class="avatar">${escapeHtml((state.user.handle || "a")[0])}</div>
    <div class="name">@${escapeHtml(state.user.handle)}</div>
    <div class="when">${escapeHtml(t("time.justNow"))}</div>
  `;
  posterWrap.innerHTML = svg;
  hideProcessing();
  detailEl.classList.add("show");
}

function openDetailFromWall(entry) {
  state.currentEntry = entry;
  // Build poster from entry's stored dossier OR reconstruct from demo
  const dossier = entry.dossier || (entry.demoKey ? {
    ...DEMOS[entry.demoKey],
    illustration: svgToDataUrl(DEMO_ILLUSTRATIONS[entry.demoKey]),
  } : null);
  if (!dossier) { toast("Couldn't load that entry"); return; }

  const svg = buildPosterSVG(dossier, dossier.illustration, {
    author: entry.handle,
    date: formatRelDate(entry.createdAt),
    issueNo: String(entry.issueNo || "----").padStart(4, "0"),
  });

  state.currentDossier = dossier;
  state.currentSvg = svg;

  detailAuthorEl.innerHTML = `
    <div class="avatar">${escapeHtml((entry.handle || "a")[0])}</div>
    <div class="name">@${escapeHtml(entry.handle)}</div>
    <div class="when">${formatRelTime(entry.createdAt)}</div>
  `;
  posterWrap.innerHTML = svg;
  detailEl.classList.add("show");
}

function closeDetail() {
  detailEl.classList.remove("show");
  state.currentDossier = null;
  state.currentSvg = null;
  state.currentDataUrl = null;
  state.currentEntry = null;
  fileInput.value = "";
  posterWrap.innerHTML = "";
}

function showProcessing(step, msg) {
  processingStep.textContent = step;
  processingMsg.textContent = msg;
  processing.classList.add("show");
}
function hideProcessing() {
  processing.classList.remove("show");
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
  toast(t("toast.pngSaved"));
}

function downloadSVG() {
  if (!state.currentSvg) return;
  const blob = new Blob([state.currentSvg], { type: "image/svg+xml;charset=utf-8" });
  downloadBlob(blob, `field-guide-${slug(state.currentDossier?.title)}-${Date.now()}.svg`);
  toast(t("toast.svgSaved"));
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
  const entry = Wall.publish({
    author: state.user.name,
    handle: state.user.handle,
    avatar: state.user.avatar,
    illustration: state.currentDossier.illustration,
    title: state.currentDossier.title,
    kicker: state.currentDossier.kicker,
  });
  state.currentEntry = entry;
  renderWall();
  toast(t("toast.posted"));
}

async function shareToFeed() {
  if (!aigramCtx.isInside) { toast(t("toast.notAigram")); return; }
  if (!state.currentEntry) await publishToWall();
  const r = await postToFeed({
    note: `Field-guided ${state.currentDossier.title}.`,
    imageUrl: state.currentEntry?.illustration,
    specId: state.currentEntry?.id,
  });
  toast(r.ok ? t("toast.sharedFeed") : t("toast.shareFail"));
}

function renderWall() {
  const grid = document.getElementById("wallGrid");
  const items = Wall.getWall({ limit: 30 });
  if (!items.length) {
    grid.innerHTML = `<div class="wall-empty">${escapeHtml(t("wall.empty"))}</div>`;
    return;
  }
  $("wallCount").textContent = `${items.length} ${t("wall.countSuffix")}`;
  grid.innerHTML = items.map(it => {
    const illusSrc = it.illustration || (it.demoKey ? svgToDataUrl(DEMO_ILLUSTRATIONS[it.demoKey]) : "");
    const initial = (it.handle || "a")[0].toUpperCase();
    return `
    <div class="wall-card" data-id="${escapeHtml(it.id)}">
      <img class="illus" src="${illusSrc}" alt="">
      <div class="body">
        <div class="title">${escapeHtml(it.title || "untitled")}</div>
        <div class="author" data-author="${escapeHtml(it.handle)}">
          <div class="avatar">${escapeHtml(initial)}</div>
          <span class="name">@${escapeHtml(it.handle)}</span>
        </div>
        <div class="stats">
          <span>${formatRelTime(it.createdAt)}</span>
          <span>♥ ${it.likes || 0}</span>
        </div>
      </div>
    </div>`;
  }).join("");

  grid.addEventListener("click", (e) => {
    const authorChip = e.target.closest(".author");
    if (authorChip) {
      e.stopPropagation();
      openProfile(authorChip.dataset.author);
      return;
    }
    const card = e.target.closest(".wall-card");
    if (card) {
      const entry = Wall.getEntry(card.dataset.id);
      if (entry) openDetailFromWall(entry);
    }
  }, { once: true });
  // Re-attach next render
  setTimeout(() => renderWall._bind?.(), 0);
}

function openProfile(handle) {
  if (aigramCtx.isInside && window.parent !== window) {
    try {
      window.parent.postMessage({ type: "AW.PROFILE.OPEN", payload: { id: handle } }, "*");
      return;
    } catch {}
  }
  toast(`${t("toast.profileSim")} @${handle}`);
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

function formatRelTime(ts) {
  if (!ts) return "";
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return t("time.justNow");
  if (m < 60) return t("time.minAgo", { n: m });
  const h = Math.floor(m / 60);
  if (h < 24) return t("time.hrAgo", { n: h });
  const d = Math.floor(h / 24);
  return t("time.dayAgo", { n: d });
}

function formatRelDate(ts) {
  if (!ts) return new Date().toISOString().slice(0, 10).replace(/-/g, ".");
  return new Date(ts).toISOString().slice(0, 10).replace(/-/g, ".");
}
