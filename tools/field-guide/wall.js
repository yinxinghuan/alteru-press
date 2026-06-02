// AlterU Press · Field Guide · Wall (v1: localStorage + sample seed)
// Cross-user wall. v1 persists in localStorage; v2 will swap to platform
// useGameSave (read all users' entries via aigram API).

import { SAMPLE_WALL_ENTRIES } from "./guide.js";

const STORAGE_KEY = "alteru-press:field-guide:wall:v1";
const MAX_LOCAL = 60;

function read() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}
function write(arr) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(arr)); } catch {}
}

export function getWall({ limit = 30 } = {}) {
  // Merge self-published + sample cross-user entries, newest first
  const local = read();
  const samples = SAMPLE_WALL_ENTRIES || [];
  const merged = [...local, ...samples]
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .slice(0, limit);
  return merged;
}

export function publish(entry) {
  const id = `s_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const record = {
    id,
    createdAt: Date.now(),
    author: entry.author || "anonymous",
    handle: entry.handle || "anonymous",
    avatar: entry.avatar || null,
    thumb: entry.thumb || null,
    illustration: entry.illustration || null,
    title: entry.title || "untitled",
    kicker: entry.kicker || "",
    likes: 0,
    self: true,
  };
  const cur = read();
  cur.unshift(record);
  write(cur.slice(0, MAX_LOCAL));
  return record;
}

export function like(id) {
  const cur = read();
  const i = cur.findIndex(e => e.id === id);
  if (i < 0) return null;
  cur[i].likes = (cur[i].likes || 0) + 1;
  write(cur);
  return cur[i];
}

export function getEntry(id) {
  // Look in both local + samples
  const local = read();
  const samples = SAMPLE_WALL_ENTRIES || [];
  return [...local, ...samples].find(e => e.id === id) || null;
}
