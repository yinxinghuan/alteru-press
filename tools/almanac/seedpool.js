// AlterU Press · Almanac · Seed pools
//
// 宜 / 忌 / on-this-day(虚构层) / editor's note 都从这里挑。
// 选择是按日期 hash 确定的 → 同一日所有用户看到同一组 → "canonical 页"。
//
// 真实历史 on-this-day 走 Wikipedia REST 异步拉。

// ─── 宜 (Auspicious) ─────────────────────────────────────────────────────
const YI_POOL = [
  { zh: "出行",        en: "travel" },
  { zh: "写信",        en: "write a letter" },
  { zh: "理发",        en: "cut hair" },
  { zh: "整理书桌",    en: "clear the desk" },
  { zh: "煮茶",        en: "brew tea" },
  { zh: "见旧朋友",    en: "see an old friend" },
  { zh: "做小买卖",    en: "make a small trade" },
  { zh: "添置衣物",    en: "buy new clothes" },
  { zh: "读完那本书",  en: "finish the book" },
  { zh: "拖延但温柔地",en: "procrastinate gently" },
  { zh: "洗澡",        en: "take a bath" },
  { zh: "种花",        en: "plant flowers" },
  { zh: "搬动家具",    en: "rearrange furniture" },
  { zh: "去市场",      en: "go to the market" },
  { zh: "睡到自然醒",  en: "sleep until you wake" },
  { zh: "扔旧物",      en: "throw old things out" },
  { zh: "录段语音",    en: "record a voice memo" },
  { zh: "做一次决定",  en: "make a decision" },
  { zh: "给妈打电话",  en: "call your mother" },
  { zh: "走远一点",    en: "walk further than usual" },
];

// ─── 忌 (Inauspicious) ────────────────────────────────────────────────────
const JI_POOL = [
  { zh: "争辩",        en: "argue" },
  { zh: "借钱",        en: "lend money" },
  { zh: "久坐",        en: "sit too long" },
  { zh: "深夜回消息",  en: "reply at midnight" },
  { zh: "签合同",      en: "sign contracts" },
  { zh: "起新房",      en: "break new ground" },
  { zh: "动土",        en: "disturb the earth" },
  { zh: "见前任",      en: "see your ex" },
  { zh: "做大决定",    en: "make big decisions" },
  { zh: "刷社交媒体",  en: "scroll feeds" },
  { zh: "答应别的事",  en: "agree to more" },
  { zh: "买新设备",    en: "buy new gadgets" },
  { zh: "对小孩发火",  en: "yell at children" },
  { zh: "猜测他人想法",en: "guess at others' thoughts" },
  { zh: "做菜不放盐",  en: "cook without salt" },
  { zh: "通宵",        en: "stay up all night" },
  { zh: "冷战",        en: "give the silent treatment" },
  { zh: "解释自己",    en: "over-explain yourself" },
  { zh: "对镜子皱眉",  en: "frown at the mirror" },
  { zh: "重读旧消息",  en: "re-read old messages" },
];

// ─── On this day · AlterU 宇宙虚构事件 ────────────────────────────────────
// 1-2 条会跟真实 Wikipedia 历史混排。
const FICTIONAL_HISTORY = [
  "2042 — Mira Lane 在 Blue Note 唱完最后一首 'No One Else But Me'。",
  "2031 — AlterU Press 创刊号在 Brooklyn 一台二手柯式机上印出。",
  "2055 — Yixing 茶壶博物馆首次允许游客触摸壶身。",
  "2089 — 第一支 replicant 工会成立于东京新宿。",
  "1994 — 芝加哥 PSAP-12 第一个值班晚上没有人接电话。",
  "1988 — Eleanor 在 Brookline 给两人摆桌，第 207 天。",
  "2024 — Riley 关掉直播软件，没人发现今晚是最后一次。",
  "1991 — Elena 在 Bucharest 第六区放下电话，谁出价都不卖了。",
  "1962 — 一个穿红丝绒大衣的女人在 Saint-Roch 说完第五件罪。",
  "1956 — Mira 在 Blue Velvet 的化妆台上擦掉口红。",
  "1986 — 8 月一个 Iowa 主妇看了一下午邻居家的儿子推剪草坪。",
  "2026 — AlterU Press 创刊号上线。Field Guide 是第一个登台的物件。",
];

// ─── Editor's notes (短句池) ─────────────────────────────────────────────
const NOTES = [
  "今天是个适合写信的日子。星期三总是有种被夹在中间的感觉 — 既不像周一那样狼狈, 也不像周五那样松懈。",
  "记得有些事不需要解释。比如今天的天气, 比如昨晚没接的那通电话。",
  "你以为自己在等待。其实只是窗外有风。",
  "把抽屉打开。最深处有一张你从没寄出的明信片, 它今天该走了。",
  "天黑得越来越早, 这不是季节, 是你最近看屏幕太多。",
  "一杯热水, 一只旧鞋。今天值得做的事情其实非常少。",
  "如果有人今天问你过得怎么样, 试试看用三个字回答。",
  "潮水来去, 而你只是在岸上看着。这不丢人。",
  "把那个总在想的人写进日记, 然后合上。今天就这样。",
  "星期五的会议挪到星期二是有原因的。一切都比你以为的更紧。",
];

// ─── 选择函数（用日期 hash 做种子）───────────────────────────────────────

function dateSeed(date) {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  // Mulberry32-ish seed
  let h = (y * 10000 + m * 100 + d) | 0;
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

function rng(seed) {
  return function () {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickN(arr, n, rand) {
  const copy = [...arr];
  const out = [];
  for (let i = 0; i < n && copy.length; i++) {
    const idx = Math.floor(rand() * copy.length);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
}

export function pickYi(date) {
  const r = rng(dateSeed(date) ^ 0xa11);
  return pickN(YI_POOL, 3, r);
}

export function pickJi(date) {
  const r = rng(dateSeed(date) ^ 0xb22);
  return pickN(JI_POOL, 3, r);
}

export function pickFictionalHistory(date) {
  const r = rng(dateSeed(date) ^ 0xc33);
  return pickN(FICTIONAL_HISTORY, 1, r);
}

export function pickEditorNote(date) {
  const r = rng(dateSeed(date) ^ 0xd44);
  return pickN(NOTES, 1, r)[0];
}

// ─── 真实 on-this-day · Wikipedia REST API ──────────────────────────────
export async function fetchWikipediaOnThisDay(date) {
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  try {
    const url = `https://en.wikipedia.org/api/rest_v1/feed/onthisday/events/${mm}/${dd}`;
    const r = await fetch(url);
    if (!r.ok) throw new Error("wiki " + r.status);
    const data = await r.json();
    const events = (data.events || []).filter(e => e.year && e.text);
    // Deterministic 2 picks per day
    const rand = rng(dateSeed(date) ^ 0xe55);
    return pickN(events, 2, rand).map(e => ({
      year: e.year,
      text: e.text.length > 70 ? e.text.slice(0, 67) + "…" : e.text,
    }));
  } catch {
    return [];
  }
}
