// AlterU Press · Almanac · Page builder
// Aggregates lunar + astronomy + seed pools → today's canonical page.

import { getLunarInfo } from "./lunar.js";
import { getAstronomy } from "./astronomy.js";
import {
  pickYi, pickJi, pickFictionalHistory, pickEditorNote,
  fetchWikipediaOnThisDay,
} from "./seedpool.js";

const MONTH_NAMES_EN = [
  "January", "February", "March",     "April",   "May",      "June",
  "July",    "August",   "September",  "October", "November", "December",
];
const DAY_ORDINAL_EN = [
  "First", "Second", "Third", "Fourth", "Fifth", "Sixth", "Seventh", "Eighth",
  "Ninth", "Tenth", "Eleventh", "Twelfth", "Thirteenth", "Fourteenth",
  "Fifteenth", "Sixteenth", "Seventeenth", "Eighteenth", "Nineteenth",
  "Twentieth", "Twenty-first", "Twenty-second", "Twenty-third", "Twenty-fourth",
  "Twenty-fifth", "Twenty-sixth", "Twenty-seventh", "Twenty-eighth",
  "Twenty-ninth", "Thirtieth", "Thirty-first",
];

/**
 * Returns a page that renders IMMEDIATELY — all synchronous local data.
 * Lunar / jieqi / wiki on-this-day come later via augmentPage(); that way
 * the user sees the page in 0ms and missing pieces fade in as they
 * arrive. Aigram's iframe may block external fetches; this lets the page
 * survive that.
 */
export function getInstantPage(date = new Date()) {
  const astronomy = getAstronomy(date);
  const fallbackInfo = fallbackLunarShape(date);
  return {
    issueNo: issueNumberFor(date),
    date: {
      y: fallbackInfo.gregorian.y,
      m: fallbackInfo.gregorian.m,
      d: fallbackInfo.gregorian.d,
      weekday: fallbackInfo.gregorian.weekday,
      monthEn: MONTH_NAMES_EN[fallbackInfo.gregorian.m - 1],
      ordinalEn: DAY_ORDINAL_EN[fallbackInfo.gregorian.d - 1] || String(fallbackInfo.gregorian.d),
    },
    lunar: fallbackInfo.lunar,
    ganzhi: fallbackInfo.ganzhi,
    jieqi: fallbackInfo.jieqi,
    animals: fallbackInfo.animals,
    sunMoon: astronomy,
    yi: pickYi(date),
    ji: pickJi(date),
    onThisDay: pickFictionalHistory(date), // fictional only until wiki arrives
    editorNote: pickEditorNote(date),
  };
}

/**
 * Fills lunar / jieqi / animals / wiki in-place. Caller re-renders when
 * this resolves. Failures leave the fallback values from instant page.
 */
export async function augmentPage(page, date = new Date()) {
  const [lunarRes, wikiRes] = await Promise.allSettled([
    getLunarInfo(date),
    fetchWikipediaOnThisDay(date),
  ]);

  if (lunarRes.status === "fulfilled" && lunarRes.value && !lunarRes.value._fallback) {
    const li = lunarRes.value;
    page.lunar = li.lunar;
    page.ganzhi = li.ganzhi;
    page.jieqi = li.jieqi;
    page.animals = li.animals;
  }
  if (wikiRes.status === "fulfilled" && wikiRes.value.length) {
    const fictional = pickFictionalHistory(date);
    page.onThisDay = [...wikiRes.value, ...fictional].slice(0, 3);
  }
  return page;
}

// Backwards-compatible single-shot loader (returns when fully augmented)
export async function getTodayPage(date = new Date()) {
  const page = getInstantPage(date);
  await augmentPage(page, date);
  return page;
}

function fallbackLunarShape(date) {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const WEEKDAYS_ZH = ["星期日","星期一","星期二","星期三","星期四","星期五","星期六"];
  const stems = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
  const branches = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];
  const animals = [
    ["鼠","Rat"],["牛","Ox"],["虎","Tiger"],["兔","Rabbit"],["龙","Dragon"],["蛇","Snake"],
    ["马","Horse"],["羊","Goat"],["猴","Monkey"],["鸡","Rooster"],["狗","Dog"],["猪","Pig"],
  ];
  const yearStemIdx = ((y - 4) % 10 + 10) % 10;
  const yearBranchIdx = ((y - 4) % 12 + 12) % 12;
  return {
    gregorian: { y, m, d, weekday: WEEKDAYS_ZH[date.getDay()] },
    lunar: { y, m, d, monthName: "", dayName: "", isLeap: false, animalYear: animals[yearBranchIdx][0] },
    ganzhi: { year: stems[yearStemIdx] + branches[yearBranchIdx], month: "", day: "" },
    jieqi: { current: null, previous: null, next: null, daysUntilNext: null },
    animals: { year: { zh: animals[yearBranchIdx][0], en: animals[yearBranchIdx][1] } },
  };
}

function issueNumberFor(date) {
  // Issue No = day-of-year for now. Almanac No. 0001 = Jan 1.
  const start = new Date(date.getFullYear(), 0, 0);
  const n = Math.floor((date - start) / 86_400_000);
  return String(n).padStart(4, "0");
}
