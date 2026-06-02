// AlterU Press · Almanac · Subject + prompt for the daily illustration
//
// Each 节气 (solar term) anchors a seasonal subject, the way a 19th c.
// almanac would have a different woodcut for each fortnight. The prompt
// also weaves in the moon phase and the date so each day's image carries
// some small variation.

// Subject map · {节气 (Chinese): { en, latin, subject_en, palette, mood }}
export const TERM_SUBJECTS = {
  "立春":   { en: "Beginning of Spring", latin: "Prunus mume",      subject: "a single sprig of plum blossom, first to flower in the cold", palette: "pale pink and warm bone white", mood: "still recovering from winter" },
  "雨水":   { en: "Rain Water",          latin: "Salix babylonica", subject: "a willow branch with new yellow-green buds, dripping with rain", palette: "soft greens and grey wash", mood: "thawing" },
  "惊蛰":   { en: "Awakening of Insects",latin: "Bombyx mori",      subject: "a single silk moth, wings spread, antennae forward", palette: "ivory and dust", mood: "first stir" },
  "春分":   { en: "Spring Equinox",      latin: "Hirundo rustica",  subject: "a barn swallow in flight, forked tail clear, mid-spring", palette: "blue-black and chestnut", mood: "arriving" },
  "清明":   { en: "Clear and Bright",    latin: "Prunus persica",   subject: "a peach blossom branch with five fresh blooms", palette: "soft pink and tender green", mood: "fragile and clear" },
  "谷雨":   { en: "Grain Rain",          latin: "Camellia sinensis",subject: "two fresh tea leaves and a bud, on a stem", palette: "tender green", mood: "rising sap" },
  "立夏":   { en: "Beginning of Summer", latin: "Paeonia lactiflora",subject: "an open peony bloom, slightly past peak", palette: "deep pink and gold-green", mood: "abundance" },
  "小满":   { en: "Grain Full",          latin: "Morus alba",       subject: "a mulberry branch with leaves and three early purple berries", palette: "leaf green and oxblood", mood: "filling out" },
  "芒种":   { en: "Grain in Ear",        latin: "Hordeum vulgare",  subject: "a single sheaf of bristly barley grain, golden green, on a stem", palette: "wheat gold and chaff cream", mood: "harvest preparing" },
  "夏至":   { en: "Summer Solstice",     latin: "Cryptotympana atrata",subject: "a single cicada at rest on a twig, wings folded over a glossy body", palette: "lacquered black and amber", mood: "high heat" },
  "小暑":   { en: "Minor Heat",          latin: "Nelumbo nucifera", subject: "a single lotus seed-head, dried, surrounded by two leaves", palette: "muddy green and ochre", mood: "languid" },
  "大暑":   { en: "Major Heat",          latin: "Helianthus annuus",subject: "a sunflower with seeds half-revealed, head heavy", palette: "brass and umber", mood: "drowsy heat" },
  "立秋":   { en: "Beginning of Autumn", latin: "Lagenaria siceraria",subject: "a single hanging gourd on a thin vine, dust on the skin", palette: "pale tan and bottle green", mood: "ripening" },
  "处暑":   { en: "End of Heat",         latin: "Egretta garzetta", subject: "a little egret standing in shallow water, looking down", palette: "pure white and reed brown", mood: "quieter" },
  "白露":   { en: "White Dew",           latin: "Chrysanthemum indicum",subject: "a wild chrysanthemum with three small yellow flowers and ferny leaves", palette: "yellow and dew-grey", mood: "clarity" },
  "秋分":   { en: "Autumn Equinox",      latin: "Punica granatum",  subject: "a pomegranate split open, seeds glistening, one half in profile", palette: "crimson and parchment", mood: "balanced abundance" },
  "寒露":   { en: "Cold Dew",            latin: "Anser anser",      subject: "a single wild goose in flight, neck stretched south", palette: "slate and ink", mood: "leaving" },
  "霜降":   { en: "Frost Descent",       latin: "Acer palmatum",    subject: "a Japanese maple leaf, edges curling, deep red into rust", palette: "red oxide and rust", mood: "letting go" },
  "立冬":   { en: "Beginning of Winter", latin: "Phyllostachys edulis",subject: "a section of bamboo cane with one knife-thin new leaf", palette: "cold green and bone", mood: "holding firm" },
  "小雪":   { en: "Minor Snow",          latin: "Chaenomeles speciosa",subject: "a quince twig with three withered fruits still clinging", palette: "ochre and grey", mood: "first frost" },
  "大雪":   { en: "Major Snow",          latin: "Ilex aquifolium",  subject: "a holly branch with three red berries against dark leaves", palette: "blood red and pine green", mood: "deep cold" },
  "冬至":   { en: "Winter Solstice",     latin: "Prunus mume",      subject: "a plum branch with one bud about to open, snow on the wood", palette: "white snow and ink twig", mood: "the turning point" },
  "小寒":   { en: "Minor Cold",          latin: "Narcissus papyraceus",subject: "a paperwhite narcissus, three flowers and stem, set in pebble water", palette: "white and porcelain green", mood: "fragrance in the cold" },
  "大寒":   { en: "Major Cold",          latin: "Pinus tabuliformis",subject: "a pinecone half-open, scales spread, lying on the ground", palette: "warm brown and ash", mood: "endurance" },
};

// ── Build the gen-image prompt for a given canonical page ────────────────

export function buildIllustrationPrompt(page) {
  // page.jieqi.previous / next / current — pick the one closest in time
  const term =
    page.jieqi.current ||
    page.jieqi.next ||
    page.jieqi.previous ||
    "芒种"; // safe fallback

  const meta = TERM_SUBJECTS[term] || TERM_SUBJECTS["芒种"];
  const moon = page.sunMoon.moon.name;
  const phaseHint = page.sunMoon.moon.illumination < 25
    ? "the moon a thin crescent"
    : page.sunMoon.moon.illumination > 75
    ? "the moon almost full"
    : "the moon at quarter";

  return [
    "A vintage 19th-century farmer's almanac woodcut illustration.",
    "Cream paper background with double border frame.",
    "Hand-drawn ink line illustration with delicate watercolor wash.",
    `Subject: ${meta.subject}, ${meta.palette}.`,
    "Centered, isolated, soft morning light.",
    `Top header in small caps: "${page.date.monthEn.toUpperCase()} ${page.date.d} · ${term.toUpperCase()}".`,
    `Italic Latin subtitle: "${meta.latin} · ${meta.en}".`,
    `Bottom corner label in small caps: "${phaseHint}".`,
    'Botanical engraving aesthetic, museum almanac style, scientific accuracy,',
    "NOT a photograph, drawn illustration only, high detail, editorial line art,",
    `mood: ${meta.mood}.`,
  ].join(" ");
}

export function getCurrentTermSubject(termZh) {
  return TERM_SUBJECTS[termZh] || null;
}
