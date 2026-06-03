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
    "hub.tool02.kicker": "Tool · Daily",
    "hub.tool02.title": "Almanac",
    "hub.tool02.p": "A daily page for today's date — sun, moon, weather lore, 宜 / 忌, on-this-day. The whole platform shares the same canonical page; you stamp it with one line of your own.",
    "hub.tool02.meta": "~ 5 sec · canonical · daily",
    "hub.tool02.open": "Open →",

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
    "proc.upload.step": "UPLOADING",
    "proc.upload.msg":  "Sending the photograph…",
    "proc.read.step":   "WRITING",
    "proc.read.msg":    "Writing the dossier…",
    "proc.draw.step":   "DRAWING",
    "proc.draw.msg":    "Drawing the specimen card · this takes a few minutes",
    "proc.demo.read":   "Reading the demo…",

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

    // Field Guide · dossier section headings
    "fg.section.specimen":  "Today's specimen",
    "fg.section.anatomy":   "Anatomy",
    "fg.section.relatives": "This object has relatives",
    "fg.section.essay":     "Why we make them",
    "fg.parts":             "{n} parts",
    "fg.entries":           "{n} entries",
    "fg.filed":             "Filed · AlterU Press · Field Guide",
    "fg.subtitle":          "on display.",

    // Almanac
    "alm.loading":          "Reading today's page…",
    "alm.drawing.step":     "DRAWING",
    "alm.drawing.msg":      "Drawing today's almanac…",
    "alm.section.lunar":    "Lunar",
    "alm.section.sunmoon":  "Sun · Moon",
    "alm.section.yj":       "Auspicious · Inauspicious",
    "alm.section.otd":      "On this day",
    "alm.section.note":     "Editor's note",
    "alm.sm.sunrise":       "Sunrise",
    "alm.sm.sunset":        "Sunset",
    "alm.sm.moonrise":      "Moonrise",
    "alm.sm.moonset":       "Moonset",
    "alm.yj.yi":            "Auspicious",
    "alm.yj.ji":            "Inauspicious",
    "alm.moon.label":       "Moon",
    "alm.moon.lit":         "% lit",
    "alm.daysUntil":        "{n}d",
    "alm.stampBy":          "Stamped by",
    "alm.filed":            "Almanac · AlterU Press",
    "alm.quietDay":         "— quiet day —",
    "alm.illusForthcoming": "— daily illustration forthcoming —",

    // Stamp composer
    "stamp.heading":        "Stamp this page",
    "stamp.placeholder":    "one line · max 60 chars",
    "stamp.cta":            "Stamp",
    "stamp.hint":           "your stamp goes on your copy + the wall below",
    "stamp.wallHeading":    "On the wall",
    "stamp.wallToday":      "today",
    "stamp.wallCount":      "today · {n}",
    "stamp.wallEmpty":      "No stamps yet today. Be the first.",
    "stamp.toast.empty":    "Write a line first",
    "stamp.toast.stamped":  "Stamped",
    "stamp.toast.failed":   "Couldn't load today's page",
    "stamp.alreadyStamped": "Update stamp",
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
    "hub.tool02.kicker": "工具 · 每日",
    "hub.tool02.title": "Almanac",
    "hub.tool02.p": "每天一页给今天的日历 —— 日月升落、宜忌、节气、历史上的今天。全平台同一页，每个人用一句话盖个自己的章。",
    "hub.tool02.meta": "约 5 秒 · 共享 · 每日",
    "hub.tool02.open": "打开 →",

    "nav.back": "← 总站",
    "nav.anon": "未登录",

    "tool.cta.title": "Identify any ordinary thing.",
    "tool.cta.hint":  "点一下，拍张照",
    "tool.cta.demoLabel": "或来份 demo",

    "wall.heading": "其他人发的",
    "wall.recent":  "最近",
    "wall.countSuffix": "张标本",
    "wall.empty":   "还没人发。来开第一张。",

    "proc.upload.step": "上传中",
    "proc.upload.msg":  "正在上传照片…",
    "proc.read.step":   "撰写中",
    "proc.read.msg":    "正在撰写说明书…",
    "proc.draw.step":   "绘制中",
    "proc.draw.msg":    "正在画标本卡 · 约需几分钟",
    "proc.demo.read":   "正在加载 demo…",

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

    "fg.section.specimen":  "今日标本",
    "fg.section.anatomy":   "解剖",
    "fg.section.relatives": "它有亲戚",
    "fg.section.essay":     "为什么我们做这些",
    "fg.parts":             "{n} 个部位",
    "fg.entries":           "{n} 条",
    "fg.filed":             "归档 · AlterU Press · Field Guide",
    "fg.subtitle":          "on display.",

    "alm.loading":          "正在翻今天这一页…",
    "alm.drawing.step":     "绘制中",
    "alm.drawing.msg":      "正在画今日的图…",
    "alm.section.lunar":    "农历",
    "alm.section.sunmoon":  "日 · 月",
    "alm.section.yj":       "宜 · 忌",
    "alm.section.otd":      "历史上的今天",
    "alm.section.note":     "编辑短语",
    "alm.sm.sunrise":       "日出",
    "alm.sm.sunset":        "日落",
    "alm.sm.moonrise":      "月出",
    "alm.sm.moonset":       "月落",
    "alm.yj.yi":            "宜",
    "alm.yj.ji":            "忌",
    "alm.moon.label":       "月",
    "alm.moon.lit":         "% 亮",
    "alm.daysUntil":        "还有 {n} 天",
    "alm.stampBy":          "盖章人",
    "alm.filed":            "Almanac · AlterU Press",
    "alm.quietDay":         "— 静日 —",
    "alm.illusForthcoming": "— 今日插图加载中 —",

    "stamp.heading":        "给这一页盖个章",
    "stamp.placeholder":    "一句话 · 最多 60 字",
    "stamp.cta":            "盖章",
    "stamp.hint":           "你的章会出现在自己的副本里，和下面的墙上",
    "stamp.wallHeading":    "墙上",
    "stamp.wallToday":      "今天",
    "stamp.wallCount":      "今天 · {n}",
    "stamp.wallEmpty":      "今天还没有人盖章。来开第一个。",
    "stamp.toast.empty":    "先写一句话",
    "stamp.toast.stamped":  "已盖章",
    "stamp.toast.failed":   "今天这一页加载失败",
    "stamp.alreadyStamped": "更新章",
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
