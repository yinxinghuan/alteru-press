// AlterU Press · Aigram bridge
//
// VERBATIM port of the platform's official bridge from
// /Users/yin/code/games/shared/runtime/bridge.ts.
//
// Per platform team's skill rule: do NOT rewrite or simplify the bodies of
// callAigramAPI / postAigramAPI. The postMessage envelope (base64 + uuid +
// emitter) and the iOS WKWebView fallback are load-bearing.

// ─── Context (read once at module load) ──────────────────────────────────

const _params = typeof window !== "undefined"
  ? new URLSearchParams(window.location.search)
  : new URLSearchParams();
const _rawOrigin = _params.get("api_origin");

/** Aigram host origin (URL-decoded). Null when running outside Aigram. */
export const api_origin = _rawOrigin ? decodeURIComponent(_rawOrigin) : null;

/** Current player's telegram_id, supplied by Aigram on iframe launch. */
export const telegramId = _params.get("telegram_id");

/** True when both `api_origin` and `telegram_id` are present. */
export const isInAigram = !!api_origin && !!telegramId;

// ─── Base64 helpers ──────────────────────────────────────────────────────

function toBase64(str) {
  return btoa(unescape(encodeURIComponent(str)));
}
function fromBase64(str) {
  return decodeURIComponent(escape(atob(str)));
}

// ─── callAigramAPI ───────────────────────────────────────────────────────

export function callAigramAPI(url, method = "GET", data = null) {
  return new Promise((resolve, reject) => {
    const requestId = crypto.randomUUID();
    let timer;
    const payload = toBase64(JSON.stringify({
      url,
      method,
      data,
      request_id: requestId,
      emitter: window.location.origin,
    }));

    function handleResult(result) {
      clearTimeout(timer);
      cleanup();
      if (result.success) resolve(result.data);
      else reject(new Error(result.error || "API error"));
    }

    // iOS WKWebView: native calls this global function with the response JSON.
    const cbKey = "__aigram_cb_" + requestId.replace(/-/g, "_");
    window[cbKey] = function (resultJson) {
      try {
        const result = JSON.parse(resultJson);
        if (result.request_id !== requestId) return;
        handleResult(result);
      } catch {}
    };

    // Web iframe / Android WebView: listen for postMessage response.
    function handler(event) {
      if (api_origin && event.origin !== api_origin) return;
      const msg = typeof event.data === "string" ? event.data : "";
      if (!msg.startsWith("callAPIResult-")) return;
      try {
        const result = JSON.parse(fromBase64(msg.slice("callAPIResult-".length)));
        if (result.request_id !== requestId) return;
        handleResult(result);
      } catch {}
    }
    window.addEventListener("message", handler);

    function cleanup() {
      window.removeEventListener("message", handler);
      try { delete window[cbKey]; } catch { window[cbKey] = undefined; }
    }

    timer = setTimeout(function () {
      cleanup();
      reject(new Error("timeout"));
    }, 10_000);

    // Send: iOS WKWebView first, fallback to postMessage.
    const w = window;
    if (w.webkit && w.webkit.messageHandlers && w.webkit.messageHandlers.aigram) {
      w.webkit.messageHandlers.aigram.postMessage("callAPI-" + payload);
    } else {
      window.parent.postMessage("callAPI-" + payload, api_origin || "*");
    }
  });
}

// ─── postAigramAPI ───────────────────────────────────────────────────────

export function postAigramAPI(url, method = "POST", data = null) {
  const payload = toBase64(JSON.stringify({
    url,
    method,
    data,
    request_id: crypto.randomUUID(),
    emitter: window.location.origin,
  }));
  const w = window;
  if (w.webkit && w.webkit.messageHandlers && w.webkit.messageHandlers.aigram) {
    w.webkit.messageHandlers.aigram.postMessage("callAPI-" + payload);
  } else {
    window.parent.postMessage("callAPI-" + payload, api_origin || "*");
  }
}

// ─── AW.* system call (dual-path) ────────────────────────────────────────

function sendAWMessage(message) {
  const w = window;
  if (w.webkit && w.webkit.messageHandlers && w.webkit.messageHandlers.aigram) {
    w.webkit.messageHandlers.aigram.postMessage(JSON.stringify(message));
  } else if (window.parent) {
    window.parent.postMessage(message, api_origin || "*");
  }
}

export function openAigramProfile(userId) {
  if (!userId) return;
  sendAWMessage({ type: "AW.PROFILE.OPEN", payload: { id: String(userId) } });
}

export function openAigramPost(noteId) {
  if (!noteId) return;
  sendAWMessage({ type: "AW.POST.OPEN", payload: { id: String(noteId) } });
}

// ─── High-level helpers ──────────────────────────────────────────────────

/**
 * Fetch current user via the canonical platform URL. Resolves to null when
 * not in Aigram or when the API errors.
 */
export async function fetchCurrentUser() {
  if (!isInAigram || !telegramId) return null;
  try {
    const res = await callAigramAPI(
      `/note/telegram/user/get/info/by/telegram_id?telegram_id=${encodeURIComponent(telegramId)}`,
      "GET",
    );
    // Unwrap if the bridge handed us an AigramResponse envelope
    const u = res?.data ?? res;
    if (!u) return null;
    return {
      id: u.telegram_id || telegramId,
      name: u.name || u.first_name || u.username || `user${telegramId}`,
      handle: u.username || u.name || `user${telegramId}`,
      avatar: u.head_url || u.avatar || null,
    };
  } catch (e) {
    console.warn("fetchCurrentUser failed:", e);
    return null;
  }
}

/**
 * Post current creation to the user's Aigram feed. Fire-and-forget.
 */
export function postToFeed({ note, imageUrl, link } = {}) {
  if (!isInAigram) return { ok: false, reason: "not_in_aigram" };
  try {
    postAigramAPI("/note/telegram/note/add", "POST", {
      content: note || "",
      images: imageUrl ? [imageUrl] : [],
      link: link || "",
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: String(e) };
  }
}
