// AlterU Press · Image Spec · app glue

import { analyzeImage } from "./analyze.js";
import { buildPosterSVG } from "./poster.js";
import * as Wall from "./wall.js";
import { aigramCtx, fetchUser, postToFeed } from "./aigram.js";

const $ = (id) => document.getElementById(id);
const dropzone = $("upload");
const fileInput = $("file");
const processing = $("processing");
const result = $("result");
const posterWrap = $("posterWrap");
const readout = $("readout");
const userChip = $("userChip");
const shareFeedBtn = $("shareFeedBtn");

let state = {
  user: { id: null, name: "anonymous", handle: "anonymous" },
  currentSpec: null,
  currentSvg: null,
  currentDataUrl: null,
  currentEntry: null,
};

init();

async function init() {
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
  dropzone.addEventListener("paste", (e) => {
    const f = [...(e.clipboardData?.files || [])][0];
    if (f) handleFile(f);
  });
  document.addEventListener("paste", (e) => {
    if (!result.classList.contains("hidden")) return;
    const f = [...(e.clipboardData?.files || [])][0];
    if (f) handleFile(f);
  });

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
  showProcessing();

  const url = await fileToDataURL(file);
  const img = await loadImage(url);

  await new Promise(r => setTimeout(r, 80));

  let spec;
  try {
    spec = await analyzeImage(img);
  } catch (e) {
    console.error(e);
    toast("Couldn't analyse this image.");
    resetView();
    return;
  }

  const note = generateReadingNote(spec);
  const svg = buildPosterSVG(spec, url, {
    author: state.user.handle,
    note,
    date: new Date().toISOString().slice(0, 10).replace(/-/g, "."),
    issueNo: nextIssueNo(),
  });

  state.currentSpec = spec;
  state.currentSvg = svg;
  state.currentDataUrl = url;
  state.currentNote = note;
  state.currentEntry = null;

  showResult(svg, spec);
}

function showProcessing() {
  dropzone.classList.add("hidden");
  result.classList.add("hidden");
  processing.classList.remove("hidden");
}
function showResult(svg, spec) {
  dropzone.classList.add("hidden");
  processing.classList.add("hidden");
  result.classList.remove("hidden");
  posterWrap.innerHTML = svg;
  readout.innerHTML = `
    <b>${spec.dimensions.w} × ${spec.dimensions.h}</b> · ${spec.dimensions.aspect}<br>
    Brightness · <b>${spec.brightness.label}</b> (${spec.brightness.avg})<br>
    Temperature · <b>${spec.temperature.label}</b> · ${spec.temperature.warm}/${spec.temperature.cool}<br>
    Edges · <b>${spec.edges.label}</b> · ${spec.edges.score}/10<br>
    Saturation · <b>${spec.saturation.label}</b> · ${spec.saturation.avg}<br>
    Focal · <b>${spec.focal.label}</b><br>
    Analysed in <b>${spec.elapsed}ms</b>
  `;
}
function resetView() {
  dropzone.classList.remove("hidden");
  processing.classList.add("hidden");
  result.classList.add("hidden");
  posterWrap.innerHTML = "";
  fileInput.value = "";
  state.currentSpec = null;
  state.currentSvg = null;
  state.currentDataUrl = null;
  state.currentEntry = null;
}

async function downloadPNG() {
  if (!state.currentSvg) return;
  const scale = 2;
  const svgBlob = new Blob([state.currentSvg], { type: "image/svg+xml;charset=utf-8" });
  const svgUrl = URL.createObjectURL(svgBlob);
  const img = await loadImage(svgUrl);

  const W = 880, H = 1240;
  const canvas = document.createElement("canvas");
  canvas.width = W * scale;
  canvas.height = H * scale;
  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);
  ctx.fillStyle = "#F5F2EC";
  ctx.fillRect(0, 0, W, H);
  ctx.drawImage(img, 0, 0, W, H);
  URL.revokeObjectURL(svgUrl);

  const blob = await new Promise(r => canvas.toBlob(r, "image/png", 0.96));
  const name = `image-spec-${Date.now()}.png`;
  downloadBlob(blob, name);
  toast("PNG downloaded");
}

function downloadSVG() {
  if (!state.currentSvg) return;
  const blob = new Blob([state.currentSvg], { type: "image/svg+xml;charset=utf-8" });
  downloadBlob(blob, `image-spec-${Date.now()}.svg`);
  toast("SVG downloaded");
}

function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function publishToWall() {
  if (!state.currentSpec) return;
  const thumb = await makeThumb(state.currentDataUrl, 360);
  const entry = Wall.publish({
    author: state.user.name,
    handle: state.user.handle,
    thumb,
    palette: state.currentSpec.palette,
    aspect: state.currentSpec.dimensions.aspect,
  });
  state.currentEntry = entry;
  renderWall();
  toast("Posted to the wall");
}

async function shareToFeed() {
  if (!aigramCtx.isInside) {
    toast("Not in Aigram");
    return;
  }
  if (!state.currentEntry) {
    await publishToWall();
  }
  const r = await postToFeed({
    note: state.currentNote || "Filed an image spec.",
    imageUrl: state.currentEntry?.thumb,
    specId: state.currentEntry?.id,
  });
  toast(r.ok ? "Shared to feed" : "Couldn't share");
}

function renderWall() {
  const grid = document.getElementById("wallGrid");
  const items = Wall.getWall({ limit: 24 });
  if (!items.length) {
    grid.innerHTML = `<div class="wall-empty">No dispatches yet. Be the first to file.</div>`;
    return;
  }
  grid.innerHTML = items.map(it => `
    <div class="wall-card" data-id="${it.id}">
      ${it.thumb ? `<img class="thumb" src="${it.thumb}" alt="">` : `<div class="thumb"></div>`}
      <div class="colors">
        ${it.palette.map(c => `<span style="flex:${c.pct};background:${c.hex}"></span>`).join("")}
      </div>
      <div class="meta">
        <span>@${escapeHtml(it.handle).slice(0, 14)}</span>
        <span>${it.aspect}</span>
      </div>
    </div>
  `).join("");
}

function generateReadingNote(spec) {
  const top = spec.palette[0];
  const second = spec.palette[1];
  const adj = pick([
    "Quiet", "Restless", "Composed", "Punchy", "Tender", "Crisp", "Hushed",
    "Slow", "Brash", "Considered", "Tilted", "Patient"
  ]);
  const mood =
    spec.brightness.label === "dim" ? "after hours" :
    spec.brightness.label === "blown" ? "midday glare" :
    spec.temperature.label === "warm" ? "an afternoon" :
    spec.temperature.label === "cool" ? "an evening" :
    "an interval";
  const tone = top ? top.name : "untitled";
  const counter = second ? `against ${second.name}` : "alone";
  return `${adj} · ${tone} ${counter}, read at ${mood}.`;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
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
  toast._t = setTimeout(() => t.classList.remove("show"), 1800);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
}
