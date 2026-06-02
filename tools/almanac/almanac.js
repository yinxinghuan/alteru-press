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

export async function getTodayPage(date = new Date()) {
  const [lunarInfo, astronomy, wikiHistory] = await Promise.all([
    getLunarInfo(date),
    Promise.resolve(getAstronomy(date)),
    fetchWikipediaOnThisDay(date),
  ]);

  const yi = pickYi(date);
  const ji = pickJi(date);
  const fictional = pickFictionalHistory(date);
  const editorNote = pickEditorNote(date);

  // Merge wiki + fictional (1 fictional, up to 2 wiki)
  const onThisDay = [...wikiHistory, ...fictional].slice(0, 3);

  return {
    issueNo: issueNumberFor(date),
    date: {
      y: lunarInfo.gregorian.y,
      m: lunarInfo.gregorian.m,
      d: lunarInfo.gregorian.d,
      weekday: lunarInfo.gregorian.weekday,
      monthEn: MONTH_NAMES_EN[lunarInfo.gregorian.m - 1],
      ordinalEn: DAY_ORDINAL_EN[lunarInfo.gregorian.d - 1] || String(lunarInfo.gregorian.d),
    },
    lunar: lunarInfo.lunar,
    ganzhi: lunarInfo.ganzhi,
    jieqi: lunarInfo.jieqi,
    animals: lunarInfo.animals,
    sunMoon: astronomy,
    yi,
    ji,
    onThisDay,
    editorNote,
  };
}

function issueNumberFor(date) {
  // Issue No = day-of-year for now. Almanac No. 0001 = Jan 1.
  const start = new Date(date.getFullYear(), 0, 0);
  const n = Math.floor((date - start) / 86_400_000);
  return String(n).padStart(4, "0");
}
