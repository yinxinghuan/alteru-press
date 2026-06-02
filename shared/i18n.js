// AlterU Press · shared i18n
//
// Lightweight zh / en. UI microcopy only.
// Decorative editorial titles ("Field Guide.", "On display.", "Press",
// "Vol. 01", section heads in the printed poster, etc.) stay English by
// design — they are brand / artifact text, not UI.
//
// Usage in HTML:  <span data-i18n="wall.heading">On the wall</span>
//                 — innerText is replaced on load if locale != en.
// Usage in JS:    import { t, locale, applyI18n } from "../../shared/i18n.js";

const STORAGE_KEY = "alteru-press:locale";

const STRINGS = {
  en: {
    // Hub
    "hub.lede.h": "Each issue is a small machine. You feed it. It returns a thing you could pin to a wall.",
    "hub.lede.p": "Single-purpose tools designed like printed matter. Drop something in, the press turns it into a field guide, a spec sheet, a chart you didn't ask for but kind of wanted.",
    "hub.toc.h":  "In this issue",
    "hub.toc.count": "01 live · more in print",
    "hub.tool01.kicker": "Tool · Cultural",
    "hub.tool01.p": "Photograph the most ordinary thing in the room — a hat, a teapot, a bag. The press identifies it, names its parts, finds its cousins across eight cultures, and types up a one-page field guide.",
    "hub.tool01.meta": "~ 10 sec · vision: Claude",
    "hub.tool01.open": "Open →",
    "hub.tool02.kicker": "Tool · Forthcoming",
    "hub.tool02.title": "Untitled No. 2",
    "hub.tool02.p": "The next press. Coming soon.",
    "hub.tool02.meta": "TBA",
    "hub.tool02.open": "In print",

    // Nav
    "nav.back": "← Press",
    "nav.anon": "anon",

    // Tool home
    "tool.cta.title": "Identify any ordinary thing.",
    "tool.cta.hint":  "Tap to take a photograph",
    "tool.cta.demoLabel": "or try a demo",

    // Wall
    "wall.heading": "On the wall",
    "wall.recent":  "Recent",
    "wall.countSuffix": "on the wall",
    "wall.empty":   "No specimens yet. Be the first to file.",

    // Processing
    "proc.read.step": "READING",
    "proc.read.msg":  "Reading the picture…",
    "proc.draw.step": "DRAWING",
    "proc.draw.msg":  "Drawing the specimen card…",
    "proc.demo.read": "Reading the demo…",

    // Detail
    "detail.close":   "← Close",
    "detail.brand":   "Field Guide",
    "detail.publish": "Publish",
    "detail.png":     "PNG",
    "detail.svg":     "SVG",
    "detail.share":   "Share",

    // Toasts
    "toast.notImage":   "Not an image",
    "toast.pngSaved":   "PNG saved",
    "toast.svgSaved":   "SVG saved",
    "toast.posted":     "Posted to the wall",
    "toast.notAigram":  "Not in Aigram",
    "toast.sharedFeed": "Shared to feed",
    "toast.shareFail":  "Couldn't share",
    "toast.cantRead":   "Couldn't read this picture",
    "toast.pressDown":  "The press is unreachable",
    "toast.noDemo":     "No such demo",
    "toast.workerOff":  "Worker not deployed — try a demo",
    "toast.profileSim": "would open",

    // Time
    "time.justNow": "just now",
    "time.minAgo":  "{n}m ago",
    "time.hrAgo":   "{n}h ago",
    "time.dayAgo":  "{n}d ago",
  },

  zh: {
    "hub.lede.h": "每一期都是一台小机器。你喂它一样东西，它还你一张可以钉在墙上的东西。",
    "hub.lede.p": "单一用途的小工具，设计感像印刷品。喂它一张东西，它返回一份图鉴 / 一张说明 / 一张你没要但有点想要的图。",
    "hub.toc.h":  "本期内容",
    "hub.toc.count": "01 在售 · 更多即将上架",
    "hub.tool01.kicker": "工具 · 文化",
    "hub.tool01.p": "拍下屋里最普通的东西 —— 一顶帽子，一个茶壶，一只包。工具识别它、拆解它的部位、找出八种文化里的远亲，然后印一张说明书给你。",
    "hub.tool01.meta": "约 10 秒 · 视觉：Claude",
    "hub.tool01.open": "打开 →",
    "hub.tool02.kicker": "工具 · 即将出版",
    "hub.tool02.title": "Untitled No. 2",
    "hub.tool02.p": "下一台机器。即将上线。",
    "hub.tool02.meta": "待定",
    "hub.tool02.open": "印刷中",

    "nav.back": "← 总站",
    "nav.anon": "未登录",

    "tool.cta.title": "Identify any ordinary thing.",
    "tool.cta.hint":  "点一下，拍张照",
    "tool.cta.demoLabel": "或来份 demo",

    "wall.heading": "其他人发的",
    "wall.recent":  "最近",
    "wall.countSuffix": "张标本",
    "wall.empty":   "还没人发。来开第一张。",

    "proc.read.step": "识别中",
    "proc.read.msg":  "识别中…",
    "proc.draw.step": "绘制中",
    "proc.draw.msg":  "正在画标本卡…",
    "proc.demo.read": "正在加载 demo…",

    "detail.close":   "← 关闭",
    "detail.brand":   "Field Guide",
    "detail.publish": "发到墙",
    "detail.png":     "PNG",
    "detail.svg":     "SVG",
    "detail.share":   "分享",

    "toast.notImage":   "这不是图片",
    "toast.pngSaved":   "PNG 已保存",
    "toast.svgSaved":   "SVG 已保存",
    "toast.posted":     "已发到墙上",
    "toast.notAigram":  "不在 Aigram 内",
    "toast.sharedFeed": "已分享到 feed",
    "toast.shareFail":  "分享失败",
    "toast.cantRead":   "这张图识别不了",
    "toast.pressDown":  "印刷机暂时联不上",
    "toast.noDemo":     "没有这个 demo",
    "toast.workerOff":  "Worker 还没部署，先试 demo 链接",
    "toast.profileSim": "将打开",

    "time.justNow": "刚刚",
    "time.minAgo":  "{n} 分钟前",
    "time.hrAgo":   "{n} 小时前",
    "time.dayAgo":  "{n} 天前",
  },
};

export function detectLocale() {
  try {
    const override = localStorage.getItem(STORAGE_KEY);
    if (override === "zh" || override === "en") return override;
  } catch {}
  const navLang = (navigator.language || "en").toLowerCase();
  return navLang.startsWith("zh") ? "zh" : "en";
}

export let locale = detectLocale();

export function setLocale(l) {
  if (l !== "zh" && l !== "en") return;
  locale = l;
  try { localStorage.setItem(STORAGE_KEY, l); } catch {}
  applyI18n();
}

export function t(key, vars = {}) {
  const table = STRINGS[locale] || STRINGS.en;
  let s = table[key] ?? STRINGS.en[key] ?? key;
  for (const k in vars) s = s.replace(`{${k}}`, vars[k]);
  return s;
}

export function applyI18n(root = document) {
  root.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    el.textContent = t(key);
  });
  root.querySelectorAll("[data-i18n-attr]").forEach((el) => {
    // format: "attr:key,attr2:key2"
    el.getAttribute("data-i18n-attr").split(",").forEach((pair) => {
      const [attr, key] = pair.split(":").map(s => s.trim());
      if (attr && key) el.setAttribute(attr, t(key));
    });
  });
  document.documentElement.setAttribute("lang", locale);
}

// Auto-apply on script import
if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => applyI18n());
  } else {
    applyI18n();
  }
}
