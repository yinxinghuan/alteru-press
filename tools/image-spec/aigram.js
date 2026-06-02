// AlterU Press · Aigram bridge
// Detects running inside Aigram (api_origin + telegram_id in query string)
// and exposes helpers to fetch real user info + post the spec to feed.

const SITE_BASE = "https://yinxinghuan.github.io/alteru-press";

function qs(name) {
  try {
    return new URL(location.href).searchParams.get(name);
  } catch { return null; }
}

export const aigramCtx = {
  api_origin: qs("api_origin"),
  telegram_id: qs("telegram_id"),
  get isInside() { return !!(this.api_origin && this.telegram_id); },
};

export async function fetchUser() {
  if (!aigramCtx.isInside) return null;
  try {
    const url = `${aigramCtx.api_origin}/api/v1/user/get/by/telegram/${encodeURIComponent(aigramCtx.telegram_id)}`;
    const res = await callAigram(url, "GET");
    if (res && res.data) {
      return {
        id: res.data.telegram_id || aigramCtx.telegram_id,
        name: res.data.first_name || res.data.username || `user${aigramCtx.telegram_id}`,
        handle: res.data.username || `user${aigramCtx.telegram_id}`,
        avatar: res.data.avatar || null,
      };
    }
  } catch (e) {
    console.warn("fetchUser failed", e);
  }
  return null;
}

export async function postToFeed({ note, imageUrl, specId }) {
  if (!aigramCtx.isInside) {
    return { ok: false, reason: "not-in-aigram" };
  }
  try {
    const link = `${SITE_BASE}/tools/image-spec/?spec=${encodeURIComponent(specId || "")}`;
    const payload = {
      content: note || "Filed an image spec.",
      images: imageUrl ? [imageUrl] : [],
      link,
      from: "AlterU Press · Image Spec",
    };
    const url = `${aigramCtx.api_origin}/note/telegram/note/add`;
    await callAigram(url, "POST", payload);
    return { ok: true };
  } catch (e) {
    console.warn("postToFeed failed", e);
    return { ok: false, reason: String(e) };
  }
}

export function openAigramPost(noteId) {
  if (!aigramCtx.isInside || !window.parent) return false;
  try {
    window.parent.postMessage({
      type: "AW.POST.OPEN",
      payload: { id: noteId },
    }, "*");
    return true;
  } catch { return false; }
}

// Aigram callAPI helper — uses postMessage callAPI-<b64>/callAPIResult-<b64> contract
// when available. Falls back to direct fetch if parent doesn't respond in 1s.
function callAigram(url, method = "GET", body = null) {
  return new Promise((resolve, reject) => {
    if (window.parent && window.parent !== window) {
      const reqId = Math.random().toString(36).slice(2);
      const payload = { url, method, body, reqId };
      const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
      const reqType = `callAPI-${b64}`;
      const resType = `callAPIResult-${b64}`;

      let done = false;
      const handler = (ev) => {
        if (!ev.data || ev.data.type !== resType) return;
        done = true;
        window.removeEventListener("message", handler);
        if (ev.data.payload && ev.data.payload.ok) resolve(ev.data.payload.data);
        else reject(new Error(ev.data.payload?.error || "aigram callAPI failed"));
      };
      window.addEventListener("message", handler);
      window.parent.postMessage({ type: reqType }, "*");

      setTimeout(() => {
        if (done) return;
        window.removeEventListener("message", handler);
        directFetch(url, method, body).then(resolve, reject);
      }, 1200);
      return;
    }
    directFetch(url, method, body).then(resolve, reject);
  });
}

async function directFetch(url, method, body) {
  const init = { method, headers: { "Content-Type": "application/json" } };
  if (body) init.body = JSON.stringify(body);
  const r = await fetch(url, init);
  if (!r.ok) throw new Error(`http ${r.status}`);
  return r.json();
}
