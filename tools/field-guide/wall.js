// AlterU Press · Field Guide · cross-user wall
//
// Pattern follows social-wall skill from games workspace:
//   1. Each user persists their OWN archive (capped at 20) via useGameSave.
//   2. Wall = pull cross-user list, iterate EACH row's whole archive
//      (NOT [0]), resolve head_url per unique user, optimistic-merge the
//      player's own latest entry so the wall reflects publish instantly.
//   3. Display cap is applied at render, not at fetch / persist.

import { createSave, listCrossUserSaves, fetchUserInfo, currentTelegramId } from "../../shared/save.js";
import { isInAigram } from "../../shared/bridge.js";
import { SAMPLE_WALL_ENTRIES } from "./guide.js";

const SAVE_KEY = "field-guide";
const ARCHIVE_CAP = 20; // per user; "throttle at input, never at display"

const save = createSave(SAVE_KEY);

// ─── My archive (read-mirror + write through) ────────────────────────────

let myArchive = []; // array of entries; mirror of cloud save
let loaded = false;

async function ensureLoaded() {
  if (loaded) return;
  loaded = true;
  const data = await save.load();
  if (data && Array.isArray(data.archive)) {
    myArchive = data.archive;
  }
}

function newId() {
  return `s_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export async function publish(entry) {
  await ensureLoaded();
  const record = {
    id: newId(),
    createdAt: Date.now(),
    title: entry.title || "untitled",
    kicker: entry.kicker || "",
    illustration: entry.illustration || null,
    // Full dossier so other users can read the entry when tapping it on
    // their wall. Per social-wall skill: throttle at input (cap 20
    // entries), not at display.
    intro:     entry.intro     || "",
    anatomy:   entry.anatomy   || [],
    relatives: entry.relatives || [],
    essay:     entry.essay     || "",
  };
  // Insert newest first, cap to 20.
  myArchive = [record, ...myArchive].slice(0, ARCHIVE_CAP);
  save.persist({ archive: myArchive });
  return record;
}

// ─── Wall view ───────────────────────────────────────────────────────────

/**
 * Returns merged list of all known entries, newest first.
 *
 * Each entry carries:
 *   { id, title, kicker, illustration, createdAt,
 *     userId, userName, userAvatarUrl, isSelf }
 *
 * Sources, in priority order:
 *   1. My archive (optimistic — covers the 1-3s cloud sync window)
 *   2. Cross-user list (all other users' archives merged)
 *   3. Sample entries (only shown when no real cloud data — for preview)
 */
export async function getWall({ limit = 30 } = {}) {
  await ensureLoaded();
  const me = currentTelegramId();
  const all = [];

  // 1. mine — flatten the whole archive (NOT just the latest)
  for (const e of myArchive) {
    all.push({
      ...e,
      userId: me || "me",
      userName: "YOU",
      userAvatarUrl: null,
      isSelf: true,
    });
  }

  // 2. cross-user (if in Aigram)
  if (isInAigram) {
    const rows = await listCrossUserSaves();
    const uniqueUserIds = new Set();
    for (const row of rows) {
      if (!row || row.user_id === me) continue; // self handled above
      const archive = Array.isArray(row.payload?.archive) ? row.payload.archive : [];
      uniqueUserIds.add(row.user_id);
      for (const e of archive) {
        all.push({
          ...e,
          userId: row.user_id,
          userName: null,             // populated below from cache
          userAvatarUrl: null,
          isSelf: false,
        });
      }
    }
    // Resolve user info per unique user (cached after first lookup)
    const infoMap = new Map();
    await Promise.all(
      Array.from(uniqueUserIds).map(async (uid) => {
        const info = await fetchUserInfo(uid);
        if (info) infoMap.set(uid, info);
      }),
    );
    for (const entry of all) {
      if (entry.isSelf) continue;
      const info = infoMap.get(entry.userId);
      if (info) {
        entry.userName = info.handle || info.name;
        entry.userAvatarUrl = info.head_url;
      }
    }
  }

  // 3. samples — only when wall is otherwise empty (preview / standalone)
  if (all.length === 0) {
    for (const s of SAMPLE_WALL_ENTRIES) {
      all.push({
        id: s.id,
        title: s.title,
        kicker: s.kicker,
        demoKey: s.demoKey,
        createdAt: s.createdAt,
        userId: s.handle,
        userName: s.handle,
        userAvatarUrl: null,
        isSelf: false,
        likes: s.likes,
      });
    }
  }

  // Dedupe by entry.id (covers optimistic + cloud-sync race)
  const seen = new Set();
  const dedup = [];
  for (const e of all) {
    if (e.id && seen.has(e.id)) continue;
    if (e.id) seen.add(e.id);
    dedup.push(e);
  }

  dedup.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  return dedup.slice(0, limit);
}

export async function getEntry(id) {
  const wall = await getWall({ limit: 60 });
  return wall.find(e => e.id === id) || null;
}

// Loader hint for the host app — preloads cache before first render
export function prefetch() {
  void ensureLoaded();
}
