// AlterU Press · Field Guide · Worker client
// Single entry point — talks to the Cloudflare Worker for the Claude vision
// dossier. Demo mode short-circuits to pre-baked responses so the layout is
// testable without a deployed worker.

const WORKER_URL = ""; // ← set after `wrangler deploy`. empty = demo-only mode.

export async function fetchDossier({ imageDataUrl, demoKey } = {}) {
  if (demoKey) {
    const d = DEMOS[demoKey];
    if (!d) throw new Error(`unknown demo: ${demoKey}`);
    return { ok: true, ...d, _source: "demo" };
  }
  if (!WORKER_URL) {
    return { ok: false, reason: "worker_not_configured" };
  }

  const m = (imageDataUrl || "").match(/^data:([^;]+);base64,(.+)$/);
  if (!m) return { ok: false, reason: "bad_image" };
  const mime = m[1];
  const imageBase64 = m[2];

  const r = await fetch(`${WORKER_URL}/dossier`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ imageBase64, mime }),
  });
  if (!r.ok) return { ok: false, reason: `worker_${r.status}` };
  return await r.json();
}

// ---------- Demos ----------

export const DEMO_KEYS = ["hat", "teapot", "satchel"];

export const DEMOS = {
  hat: {
    title: "a panama hat",
    kicker: "WOVEN STRAW HEADWEAR",
    intro: "Hand-plaited from young toquilla straw on Ecuador's coast. The grosgrain ribbon is fresh, the brim still holds its curl.",
    anatomy: [
      { name: "crown",  note: "the dome above the brim; here, blocked round and creased optimo-style" },
      { name: "brim",   note: "flat-curled, about 7 cm; shades the eyes without obstructing peripheral view" },
      { name: "ribbon", note: "single bow at the band; black grosgrain; replaceable, often by tailor" },
      { name: "weave",  note: "fino grade; closer plait equals lighter, finer, more expensive" },
      { name: "sweatband", note: "thin leather inside the crown; absorbs salt; the part that ages first" },
    ],
    relatives: [
      { name: "fedora",   origin: "Italy / US, 1890s",    note: "felt, soft crown, brim pinch; the jazz-era city hat" },
      { name: "beret",    origin: "French Basque",         note: "round wool, flat, no brim; military and folk reuse" },
      { name: "bowler",   origin: "England, 1849",         note: "hard felt; first worn by gamekeepers, then clerks" },
      { name: "stetson",  origin: "American West, 1865",   note: "wide brim, weatherproofed; cattle-trail provenance" },
      { name: "turban",   origin: "Persia / South Asia",   note: "wound cloth; status, devotion, climate; not one form" },
      { name: "tarboosh", origin: "Maghreb / Ottoman",     note: "cylindrical red felt; civil servant signal under Ottoman rule" },
      { name: "non",      origin: "Vietnam, 13th c.",      note: "conical palm leaf; field workers; rain runs off the rim" },
      { name: "ushanka",  origin: "Russia, 17th c.",       note: "fur, ear flaps that tie up; designed for −30 °C" },
    ],
    essay: "We make hats to negotiate with the sky. Sun, rain, cold, holy days, court. The straw braided here would not look out of place in a 1920s race-day photograph or a present-day mango orchard — which is the trick of a great hat: it survives across centuries by quietly doing one job well.",
  },

  teapot: {
    title: "a clay teapot",
    kicker: "DOMESTIC CERAMICS",
    intro: "Unglazed dark clay, probably Yixing zisha. The spout is short and sharp; the lid pearl is worn smooth by an owner's thumb.",
    anatomy: [
      { name: "body",   note: "the chamber; thinner walls retain heat; thicker walls keep water hot longer" },
      { name: "spout",  note: "angled to break the pour cleanly without dribbling down the side" },
      { name: "lid",    note: "fits snug enough that a finger on the air-hole stops the pour mid-pour" },
      { name: "handle", note: "loop, side, or cane-wrapped; weight balance against a full body matters" },
      { name: "pearl",  note: "the small knob on the lid; a worn pearl is a sign of years of use" },
    ],
    relatives: [
      { name: "yixing",   origin: "Jiangsu, 16th c.",     note: "purple clay; seasons with each tea; one pot per leaf type" },
      { name: "tetsubin", origin: "Japan, 17th c.",        note: "cast iron, enamel-lined; brews and serves; weighty heat" },
      { name: "samovar",  origin: "Russia, 18th c.",       note: "tea is concentrated in a small pot atop a hot water urn" },
      { name: "kyusu",    origin: "Japan, 18th c.",        note: "side-handle pot for sencha; small, intimate, single-cup" },
      { name: "moroccan", origin: "Maghreb, 19th c.",      note: "silver or tin, long spout; for high-pour mint green tea" },
      { name: "brown betty", origin: "Stoke, 17th c.",     note: "red Etruria clay, manganese glaze; the canonical English pot" },
      { name: "turkish çaydanlık", origin: "Anatolia",     note: "stacked double pot; strong tea above, hot water below" },
    ],
    essay: "A teapot is a household clock. It marks afternoons, visits, the moment a meeting becomes a conversation. Every culture that brews leaves in water has built a vessel around the ritual, and most of those vessels turn out to look like one another — a body, a handle, a spout, a way to be set down between sips.",
  },

  satchel: {
    title: "a leather satchel",
    kicker: "TRAVEL BAGS",
    intro: "Vegetable-tanned leather, brass buckles, single shoulder strap. The corners are scuffed from being set down on stone steps.",
    anatomy: [
      { name: "flap",   note: "covers the opening; rain runs off; closes with strap or twist-lock" },
      { name: "buckles",note: "two brass tongues; tarnished but functional; sit forward of the body" },
      { name: "gusset", note: "the side panels; their depth determines how much the bag holds" },
      { name: "strap",  note: "single, adjustable; rides on the shoulder, not across the chest" },
      { name: "lining", note: "cotton or unlined; an unlined satchel ages with the carrier" },
    ],
    relatives: [
      { name: "messenger",  origin: "US, 1950s",         note: "courier-derived; cross-body, larger flap, urban bicycle posture" },
      { name: "doctor's bag", origin: "England, 1860s",  note: "hard frame, hinged opening; once held tools for house calls" },
      { name: "musette",    origin: "France, WWI",        note: "soldier's small canvas sling; later cyclists' food bag" },
      { name: "tote",       origin: "US, 1944",           note: "open top, twin handles; built by L.L. Bean for ice carrying" },
      { name: "furoshiki",  origin: "Japan, 8th c.",      note: "single cloth, no handles; tied around objects to carry them" },
      { name: "mochila",    origin: "Andes, pre-Columbian", note: "knotted fibre net; flexible volume; daily market use" },
      { name: "kete",       origin: "Aotearoa Māori",     note: "woven flax basket; ceremonial weight; gifts and carry" },
    ],
    essay: "We carry things because we keep going home and leaving it again. A bag is the smallest possible house — flap for a roof, gusset for a wall, strap for an exit. The best ones don't look new for long; they are improved by miles, by being set down on the wrong surface, by being trusted with the same handful of objects every day.",
  },
};
