// AlterU Press · Field Guide · Wall (v1: localStorage)
// API designed so swapping in a backend later is a 2-line change.

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

export function getWall({ limit = 24 } = {}) {
  return read().slice(0, limit);
}

export function publish(entry) {
  const id = `s_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const record = {
    id,
    createdAt: Date.now(),
    author: entry.author || "anonymous",
    handle: entry.handle || "anonymous",
    thumb: entry.thumb || null,
    title: entry.title || "untitled",
    kicker: entry.kicker || "",
    likes: 0,
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
  return read().find(e => e.id === id) || null;
}
