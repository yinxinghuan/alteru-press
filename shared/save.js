// AlterU Press · per-user save (vanilla port of useGameSave)
//
// Wraps the platform's session-scoped save endpoints:
//   GET  /note/aigram/ai/game/get/data/list?session_id=<uuid>   → 6 latest users
//   POST /note/aigram/ai/game/save/data { session_id, resource_data: JSON.stringify(payload) }
//
// Same dual-layer model as the React hook: localStorage mirror for instant
// reads + cloud debounced flush at ~1s. Caller owns the payload shape.

import { callAigramAPI, postAigramAPI, isInAigram, telegramId } from "./bridge.js";

const GAME_UUID = (() => {
  if (typeof document === "undefined") return null;
  if (typeof window !== "undefined" && window.__GAME_UUID__) return window.__GAME_UUID__;
  const meta = document.querySelector('meta[name="game-uuid"]');
  return meta ? meta.getAttribute("content") : null;
})();

/**
 * Create a save store for a given local key (used to namespace localStorage).
 * Cloud scoping is the GAME_UUID, not the local key.
 *
 *   const save = createSave("field-guide");
 *   await save.load();          // returns { archive: [...] } | null
 *   save.persist(myPayload);    // localStorage sync, cloud debounced
 */
export function createSave(localKey) {
  const lsKey = `alteru-press:${localKey}:save`;
  const canSync = isInAigram && !!GAME_UUID && !!telegramId;
  let timer = null;
  let pending = null;

  async function load() {
    if (canSync) {
      try {
        const res = await callAigramAPI(
          `/note/aigram/ai/game/get/data/list?session_id=${encodeURIComponent(GAME_UUID)}`,
          "GET",
        );
        const rows = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        const mine = rows.find(r => r.user_id === telegramId);
        if (mine && mine.resource_data) {
          try { return JSON.parse(mine.resource_data); } catch {}
        }
      } catch {}
    }
    try {
      const raw = localStorage.getItem(lsKey);
      if (raw) return JSON.parse(raw);
    } catch {}
    return null;
  }

  function persist(payload) {
    const withTs = { ...payload, _lastActive: Date.now() };
    try { localStorage.setItem(lsKey, JSON.stringify(withTs)); } catch {}
    if (canSync) {
      pending = withTs;
      if (timer) clearTimeout(timer);
      timer = setTimeout(flushCloud, 1000);
    }
  }

  function flushCloud() {
    const payload = pending;
    pending = null;
    timer = null;
    if (!payload || !canSync) return;
    postAigramAPI("/note/aigram/ai/game/save/data", "POST", {
      session_id: GAME_UUID,
      resource_data: JSON.stringify(payload),
    });
  }

  // On unload, flush any pending write so we don't lose it.
  if (typeof window !== "undefined") {
    window.addEventListener("beforeunload", () => {
      if (timer) {
        clearTimeout(timer);
        flushCloud();
      }
    });
  }

  function clear() {
    if (timer) { clearTimeout(timer); timer = null; }
    pending = null;
    try { localStorage.removeItem(lsKey); } catch {}
    if (canSync) {
      postAigramAPI("/note/aigram/ai/game/save/data", "POST", {
        session_id: GAME_UUID,
        resource_data: "",
      });
    }
  }

  return { load, persist, clear };
}

/**
 * Cross-user list — returns ALL entries from EVERY recent user, not just
 * the player's own. Each entry has user_id + parsed payload. Use this for
 * walls / galleries.
 *
 * IMPORTANT: do NOT take `row[0].archive[0]` and call it a wall. Iterate
 * each row's whole archive list. See social-wall skill.
 */
export async function listCrossUserSaves() {
  if (!isInAigram || !GAME_UUID) return [];
  try {
    const res = await callAigramAPI(
      `/note/aigram/ai/game/get/data/list?session_id=${encodeURIComponent(GAME_UUID)}`,
      "GET",
    );
    const rows = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
    const out = [];
    for (const row of rows) {
      if (!row || !row.user_id || !row.resource_data) continue;
      let parsed;
      try { parsed = JSON.parse(row.resource_data); } catch { continue; }
      out.push({
        user_id: row.user_id,
        time: row.time,
        payload: parsed,
      });
    }
    return out;
  } catch (e) {
    console.warn("listCrossUserSaves failed:", e);
    return [];
  }
}

// ─── User-info cache ─────────────────────────────────────────────────────
// /note/telegram/user/get/info/by/telegram_id is the canonical lookup.
// Cache results per telegram_id since they don't change often.

const userCache = new Map();

export async function fetchUserInfo(telegram_id) {
  if (!telegram_id) return null;
  const key = String(telegram_id);
  if (userCache.has(key)) return userCache.get(key);
  if (!isInAigram) return null;
  try {
    const res = await callAigramAPI(
      `/note/telegram/user/get/info/by/telegram_id?telegram_id=${encodeURIComponent(key)}`,
      "GET",
    );
    const u = res?.data ?? res;
    if (!u) return null;
    const info = {
      telegram_id: key,
      name: u.name || u.first_name || u.username || `user${key}`,
      handle: u.username || u.name || `user${key}`,
      head_url: u.head_url || null,
    };
    userCache.set(key, info);
    return info;
  } catch (e) {
    return null;
  }
}

export function currentTelegramId() {
  return telegramId;
}

export function gameUuid() {
  return GAME_UUID;
}
