// AlterU Press · Field Guide · app glue
// Mobile-first instant-use tool: tap → camera → AI dossier → specimen card →
// publish to cross-user wall. Detail overlay shows full field guide.

import { buildPosterSVG, POSTER_W, POSTER_H } from "./poster.js?v=p5";
import * as Wall from "./wall.js?v=p5";
import { aigramCtx, fetchUser, postToFeed } from "./aigram.js?v=p5";
import { openAigramProfile } from "../../shared/bridge.js?v=p5";
import { fetchDossier, DEMO_KEYS, DEMOS } from "./guide.js?v=p5";
import { DEMO_ILLUSTRATIONS, svgToDataUrl } from "./illustrations.js?v=p5";
import { t, applyI18n } from "../../shared/i18n.js?v=p5";

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
  // Aigram identity bootstrap — fire-and-forget so the page renders
  // immediately even if the bridge is slow.
  userChip.classList.add("hidden");
  userChip.textContent = "";
  if (aigramCtx.isInside) {
    fetchUser().then((u) => {
      if (!u) return;
      state.user = u;
      userChip.textContent = `@${u.handle}`;
      userChip.classList.remove("hidden");
      shareFeedBtn.classList.remove("hidden");
    }).catch(() => {});
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
  $("publishBtn").addEventListener("click", publishToWall);
  shareFeedBtn.addEventListener("click", shareToFeed);

  // ?demo=key bootstrap
  const qsDemo = new URLSearchParams(location.search).get("demo");
  if (qsDemo && DEMO_KEYS.includes(qsDemo)) {
    runDemo(qsDemo);
  }

  // Wall click delegation — single listener, doesn't need re-binding on render
  document.getElementById("wallGrid").addEventListener("click", onWallClick);
  detailAuthorEl.addEventListener("click", (e) => {
    const tap = e.target.closest("[data-profile]");
    if (tap) openAigramProfile(tap.getAttribute("data-profile"));
  });
  Wall.prefetch();
  renderWall();
}

async function handleFile(file) {
  if (!file || !file.type.startsWith("image/")) {
    toast(t("toast.notImage"));
    return;
  }
  showProcessing(t("proc.upload.step"), t("proc.upload.msg"));
  const url = await fileToDataURL(file);

  let dossier;
  try {
    dossier = await fetchDossier({
      imageDataUrl: url,
      onProgress: (phase, data) => {
        if (phase === "upload") showProcessing(t("proc.upload.step"), t("proc.upload.msg"));
        else if (phase === "look")   showProcessing(t("proc.look.step"),   t("proc.look.msg"));
        else if (phase === "looked" && data?.labels?.[0]) {
          showProcessing(t("proc.seen.step"), `· ${data.labels.slice(0, 2).join(" · ")} ·`);
        }
        else if (phase === "write") showProcessing(t("proc.read.step"),  t("proc.read.msg"));
        else if (phase === "draw")  showProcessing(t("proc.draw.step"),  t("proc.draw.msg"));
      },
    });
  } catch (e) {
    console.error(e);
    toast(t("toast.pressDown"));
    hideProcessing();
    return;
  }
  if (!dossier || !dossier.ok) {
    toast(t("toast.cantRead"));
    hideProcessing();
    return;
  }

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
  state.currentDossier = dossier;
  state.currentSvg = null; // SVG generated lazily on download click
  state.currentDataUrl = url;
  state.currentEntry = null;
  state.publishing = false;
  const btn = $("publishBtn");
  if (btn) {
    btn.disabled = false;
    btn.style.opacity = "";
    btn.textContent = t("detail.publish");
  }

  const meAvatar = state.user.avatar
    ? `<img src="${escapeHtml(state.user.avatar)}" alt="">`
    : escapeHtml((state.user.handle || "a")[0].toUpperCase());
  detailAuthorEl.innerHTML = `
    <div class="avatar">${meAvatar}</div>
    <div class="name">@${escapeHtml(state.user.handle)}</div>
    <div class="when">${escapeHtml(t("time.justNow"))}</div>
  `;
  posterWrap.innerHTML = renderDossierHTML(dossier);
  hideProcessing();
  detailEl.classList.add("show");
}

function openDetailFromWall(entry) {
  state.currentEntry = entry;
  // Reconstruct dossier from entry (covers both real saves and the demo
  // samples that ship illustration + title only).
  let dossier;
  if (entry.demoKey && DEMOS[entry.demoKey]) {
    dossier = { ...DEMOS[entry.demoKey], illustration: DEMO_ILLUSTRATIONS[entry.demoKey] };
  } else {
    dossier = {
      title:     entry.title || "untitled",
      kicker:    entry.kicker || "",
      intro:     entry.intro || "",
      anatomy:   entry.anatomy || [],
      relatives: entry.relatives || [],
      essay:     entry.essay || "",
      illustration: entry.illustration || null,
    };
  }

  state.currentDossier = dossier;
  state.currentSvg = null;

  const name = entry.userName || entry.handle || "anon";
  const avatarHtml = entry.userAvatarUrl
    ? `<img src="${escapeHtml(entry.userAvatarUrl)}" alt="">`
    : escapeHtml((name || "a")[0].toUpperCase());
  detailAuthorEl.innerHTML = `
    <div class="avatar" ${entry.userId ? `data-profile="${escapeHtml(entry.userId)}"` : ""}>${avatarHtml}</div>
    <div class="name" ${entry.userId ? `data-profile="${escapeHtml(entry.userId)}"` : ""}>@${escapeHtml(name)}</div>
    <div class="when">${formatRelTime(entry.createdAt)}</div>
  `;
  posterWrap.innerHTML = renderDossierHTML(dossier);
  detailEl.classList.add("show");
}

function renderDossierHTML(dossier) {
  const illusSrc = dossier.illustration || "";
  const intro = escapeHtml(dossier.intro || "");
  const anatomy = (dossier.anatomy || []).slice(0, 6).map(p => `
    <div class="part">
      <div class="name">${escapeHtml(p.name)}</div>
      <div class="note">${escapeHtml(p.note)}</div>
    </div>
  `).join("");
  const relatives = (dossier.relatives || []).slice(0, 8).map(r => `
    <div class="rel">
      <div class="rname">${escapeHtml(r.name)}</div>
      <div class="rorigin">${escapeHtml(r.origin || "")}</div>
      <div class="rnote">${escapeHtml(r.note || "")}</div>
    </div>
  `).join("");

  return `
    <article class="dossier">
      ${illusSrc ? `<img class="illus" src="${illusSrc}" alt="">` : ""}
      <div class="body">
        <div class="kicker">${escapeHtml(dossier.kicker || "")}</div>
        <div class="title">${escapeHtml(dossier.title || "untitled")}</div>
        <div class="subtitle">${escapeHtml(t("fg.subtitle"))}</div>

        <section>
          <h3>${escapeHtml(t("fg.section.specimen"))}</h3>
          <p class="intro">${intro}</p>
        </section>

        <section>
          <h3>${escapeHtml(t("fg.section.anatomy"))} <span class="count">${escapeHtml(t("fg.parts", { n: (dossier.anatomy || []).length }))}</span></h3>
          <div class="anatomy">${anatomy}</div>
        </section>

        <section>
          <h3>${escapeHtml(t("fg.section.relatives"))} <span class="count">${escapeHtml(t("fg.entries", { n: (dossier.relatives || []).length }))}</span></h3>
          <div class="relatives">${relatives}</div>
        </section>

        <section>
          <h3>${escapeHtml(t("fg.section.essay"))}</h3>
          <p class="essay">${escapeHtml(dossier.essay || "")}</p>
        </section>

        <div class="filed">${escapeHtml(t("fg.filed"))}</div>
      </div>
    </article>
  `;
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

function ensureSvg() {
  if (state.currentSvg) return state.currentSvg;
  if (!state.currentDossier) return null;
  const d = state.currentDossier;
  state.currentSvg = buildPosterSVG(d, d.illustration, {
    author: state.user.handle,
    date: new Date().toISOString().slice(0, 10).replace(/-/g, "."),
    issueNo: nextIssueNo(),
  });
  return state.currentSvg;
}

async function downloadPNG() {
  if (!ensureSvg()) return;
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
  if (!ensureSvg()) return;
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
  if (state.publishing || state.currentEntry) return; // dedupe
  state.publishing = true;
  const btn = $("publishBtn");
  if (btn) {
    btn.disabled = true;
    btn.style.opacity = "0.5";
    btn.textContent = "✓ " + t("toast.posted");
  }
  try {
    const entry = await Wall.publish({
      illustration: state.currentDossier.illustration,
      title: state.currentDossier.title,
      kicker: state.currentDossier.kicker,
      intro: state.currentDossier.intro,
      anatomy: state.currentDossier.anatomy,
      relatives: state.currentDossier.relatives,
      essay: state.currentDossier.essay,
    });
    state.currentEntry = entry;
    await renderWall();
    toast(t("toast.posted"));
  } finally {
    state.publishing = false;
  }
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

async function renderWall() {
  const grid = document.getElementById("wallGrid");
  const items = await Wall.getWall({ limit: 30 });
  if (!items.length) {
    grid.innerHTML = `<div class="wall-empty">${escapeHtml(t("wall.empty"))}</div>`;
    return;
  }
  $("wallCount").textContent = `${items.length} ${t("wall.countSuffix")}`;
  grid.innerHTML = items.map(it => {
    const illusSrc = it.illustration || (it.demoKey ? svgToDataUrl(DEMO_ILLUSTRATIONS[it.demoKey]) : "");
    return `
    <div class="wall-card" data-id="${escapeHtml(it.id)}">
      <img class="illus" src="${illusSrc}" alt="">
      <div class="body">
        <div class="title">${escapeHtml(it.title || "untitled")}</div>
        ${renderAuthorChip(it)}
        <div class="stats">
          <span>${formatRelTime(it.createdAt)}</span>
          ${it.likes ? `<span>♥ ${it.likes}</span>` : ""}
        </div>
      </div>
    </div>`;
  }).join("");
}

function renderAuthorChip(entry) {
  if (entry.isSelf) {
    return `<div class="author author--me"><span class="name">YOU</span></div>`;
  }
  const name = entry.userName || entry.handle || "·";
  const avatar = entry.userAvatarUrl
    ? `<img src="${escapeHtml(entry.userAvatarUrl)}" alt="" draggable="false">`
    : `<span class="avatar-letter">${escapeHtml((name || "?")[0].toUpperCase())}</span>`;
  const tap = entry.userId ? `data-profile="${escapeHtml(entry.userId)}"` : "";
  return `
    <div class="author" ${tap}>
      <span class="avatar">${avatar}</span>
      <span class="name">@${escapeHtml(name)}</span>
    </div>`;
}

// Delegated click — wired ONCE at init below
function onWallClick(e) {
  const authorChip = e.target.closest("[data-profile]");
  if (authorChip) {
    e.stopPropagation();
    openAigramProfile(authorChip.getAttribute("data-profile"));
    return;
  }
  const card = e.target.closest(".wall-card");
  if (card) {
    Wall.getEntry(card.dataset.id).then((entry) => {
      if (entry) openDetailFromWall(entry);
    });
  }
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
