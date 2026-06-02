// AlterU Press · Almanac · Lunar / 干支 / 节气 calculations
//
// Uses `lunar-typescript` (https://github.com/6tail/lunar-typescript) via
// esm.sh CDN — fully ES module compatible, no bundler needed. The library
// is ~250 KB (cached) and provides authoritative Chinese-calendar data.
//
// Returns a normalized object the rest of the tool can consume:
//   {
//     gregorian: { y, m, d, weekday },
//     lunar:     { y, m, d, monthName, dayName, isLeap, animalYear },
//     ganzhi:    { year, month, day },     // strings, e.g. "丙午"
//     jieqi:     { current, next, daysUntilNext },
//     animals:   { year },                  // zh + en (Horse / Snake / etc.)
//   }

const ANIMALS_ZH = ["鼠","牛","虎","兔","龙","蛇","马","羊","猴","鸡","狗","猪"];
const ANIMALS_EN = ["Rat","Ox","Tiger","Rabbit","Dragon","Snake","Horse","Goat","Monkey","Rooster","Dog","Pig"];
const WEEKDAYS_ZH = ["星期日","星期一","星期二","星期三","星期四","星期五","星期六"];

let LunarMod = null;

async function ensureLib() {
  if (LunarMod) return LunarMod;
  try {
    LunarMod = await import("https://esm.sh/lunar-typescript@1.7.5");
  } catch (e) {
    console.warn("lunar-typescript failed to load:", e);
    LunarMod = null;
  }
  return LunarMod;
}

export async function getLunarInfo(date = new Date()) {
  const lib = await ensureLib();
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const weekday = WEEKDAYS_ZH[date.getDay()];

  if (!lib) {
    // Fallback: best-effort gregorian-only stub
    return fallbackInfo(date);
  }

  const Solar = lib.Solar.fromYmd(y, m, d);
  const Lunar = Solar.getLunar();

  // Animal index from 地支
  const yearBranch = Lunar.getYearZhi(); // e.g. "午"
  const branchIdx = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"].indexOf(yearBranch);
  const animalIdx = branchIdx >= 0 ? branchIdx : 0;

  // Jieqi info
  const currentJieqi = Lunar.getCurrentJieQi(); // current 节气 obj if today is one
  const prevJieqi = Lunar.getPrevJieQi();
  const nextJieqi = Lunar.getNextJieQi();
  const daysUntilNext = Math.ceil(
    (nextJieqi.getSolar().toDate().getTime() - date.getTime()) / 86_400_000
  );

  return {
    gregorian: { y, m, d, weekday },
    lunar: {
      y: Lunar.getYear(),
      m: Lunar.getMonth(),
      d: Lunar.getDay(),
      monthName: Lunar.getMonthInChinese(),
      dayName: Lunar.getDayInChinese(),
      isLeap: Lunar.getMonth() < 0, // negative = leap month
      animalYear: ANIMALS_ZH[animalIdx],
    },
    ganzhi: {
      year: Lunar.getYearInGanZhi(),
      month: Lunar.getMonthInGanZhi(),
      day: Lunar.getDayInGanZhi(),
    },
    jieqi: {
      current: currentJieqi ? currentJieqi.getName() : null,
      previous: prevJieqi ? prevJieqi.getName() : null,
      next: nextJieqi ? nextJieqi.getName() : null,
      daysUntilNext,
    },
    animals: {
      year: { zh: ANIMALS_ZH[animalIdx], en: ANIMALS_EN[animalIdx] },
    },
  };
}

function fallbackInfo(date) {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  // Very rough 干支 from year only (won't be authoritative)
  const stems = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
  const branches = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];
  const yearStem = stems[(y - 4) % 10];
  const yearBranch = branches[(y - 4) % 12];
  return {
    gregorian: { y, m, d, weekday: WEEKDAYS_ZH[date.getDay()] },
    lunar: { y, m, d, monthName: "?", dayName: "?", isLeap: false, animalYear: ANIMALS_ZH[(y - 4) % 12] },
    ganzhi: { year: yearStem + yearBranch, month: "?", day: "?" },
    jieqi: { current: null, previous: null, next: null, daysUntilNext: null },
    animals: { year: { zh: ANIMALS_ZH[(y - 4) % 12], en: ANIMALS_EN[(y - 4) % 12] } },
    _fallback: true,
  };
}
