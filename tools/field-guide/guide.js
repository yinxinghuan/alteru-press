// AlterU Press · Field Guide · Worker client + Demos
// Talks to the Cloudflare Worker for Claude vision + illustration prompt.
// In demo mode, short-circuits to pre-baked dossiers + SVG specimen-card
// illustrations + simulated cross-user wall entries.

import { DEMO_ILLUSTRATIONS, svgToDataUrl } from "./illustrations.js";

const WORKER_URL = ""; // ← set after `wrangler deploy`. empty = demo-only mode.
const GEN_IMAGE_PROXY = "https://chat.aiwaves.tech/aigram/api/gen-image";

export async function fetchDossier({ imageDataUrl, demoKey } = {}) {
  if (demoKey) {
    const d = DEMOS[demoKey];
    if (!d) throw new Error(`unknown demo: ${demoKey}`);
    return {
      ok: true,
      ...d,
      illustration: svgToDataUrl(DEMO_ILLUSTRATIONS[demoKey]),
      _source: "demo",
    };
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
  const data = await r.json();
  if (!data.ok) return data;

  // Step 2: generate the specimen-card illustration via platform proxy
  try {
    const illustration = await generateIllustration({
      refImageDataUrl: imageDataUrl,
      prompt: data.illustration_prompt,
    });
    data.illustration = illustration;
  } catch (e) {
    console.warn("illustration gen failed", e);
    // Fallback: leave illustration empty; poster will use placeholder
  }

  return data;
}

async function generateIllustration({ refImageDataUrl, prompt }) {
  // Platform proxy expects { ref_url, prompt } per existing mini-games pattern.
  // Upload data URL to platform first, then call gen-image. The platform proxy
  // handles the ref-image hosting internally.
  const r = await fetch(GEN_IMAGE_PROXY, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      ref: refImageDataUrl,
      prompt,
    }),
  });
  if (!r.ok) throw new Error(`gen-image ${r.status}`);
  const data = await r.json();
  return data.url || data.image || null;
}

// ---------- Demos ----------

export const DEMO_KEYS = ["hat", "teapot", "satchel"];

export const DEMOS = {
  hat: {
    title: "a panama hat",
    kicker: "WOVEN STRAW HEADWEAR",
    intro: "Hand-plaited from young toquilla straw on Ecuador's coast. The grosgrain ribbon is fresh, the brim still holds its curl.",
    anatomy: [
      { name: "crown",  note: "the dome above the brim; blocked round, creased optimo-style" },
      { name: "brim",   note: "flat-curled, ≈ 7 cm; shades the eyes without obstructing view" },
      { name: "ribbon", note: "single bow at the band; black grosgrain; replaceable" },
      { name: "weave",  note: "fino grade; closer plait equals lighter, finer, more expensive" },
      { name: "sweatband", note: "thin leather inside the crown; absorbs salt; ages first" },
    ],
    relatives: [
      { name: "fedora",   origin: "Italy / US, 1890s",    note: "felt, soft crown, brim pinch; the jazz-era city hat" },
      { name: "beret",    origin: "French Basque",         note: "round wool, flat, no brim; military and folk reuse" },
      { name: "bowler",   origin: "England, 1849",         note: "hard felt; first worn by gamekeepers, then clerks" },
      { name: "stetson",  origin: "American West, 1865",   note: "wide brim, weatherproofed; cattle-trail provenance" },
      { name: "turban",   origin: "Persia / South Asia",   note: "wound cloth; status, devotion, climate; not one form" },
      { name: "tarboosh", origin: "Maghreb / Ottoman",     note: "cylindrical red felt; civil servant signal" },
    ],
    essay: "We make hats to negotiate with the sky. Sun, rain, cold, holy days, court. The straw braided here would not look out of place in a 1920s race-day photograph or a present-day mango orchard — which is the trick of a great hat: it survives by quietly doing one job well.",
    illustration_prompt: "vintage 19th century natural history specimen card of a panama hat, cream paper background, ink line drawing with subtle watercolor wash, side view, labeled parts (crown / brim / ribbon / weave), isolated, museum catalogue style, suitable for framing",
  },

  teapot: {
    title: "a clay teapot",
    kicker: "DOMESTIC CERAMICS",
    intro: "Unglazed dark clay, probably Yixing zisha. The spout is short and sharp; the lid pearl is worn smooth by an owner's thumb.",
    anatomy: [
      { name: "body",   note: "the chamber; wall thickness governs heat retention" },
      { name: "spout",  note: "angled to break the pour cleanly without dribbling" },
      { name: "lid",    note: "fits snug; a finger on the air-hole stops the pour" },
      { name: "handle", note: "loop, side, or cane-wrapped; balance against full body" },
      { name: "pearl",  note: "the lid knob; a worn pearl is the sign of long use" },
    ],
    relatives: [
      { name: "yixing",   origin: "Jiangsu, 16th c.",     note: "purple clay; seasons with each tea; one pot per leaf" },
      { name: "tetsubin", origin: "Japan, 17th c.",        note: "cast iron, enamel-lined; brews and serves; weighty heat" },
      { name: "samovar",  origin: "Russia, 18th c.",       note: "small pot atop a hot water urn; concentrate then dilute" },
      { name: "kyusu",    origin: "Japan, 18th c.",        note: "side-handle pot for sencha; small, intimate, single-cup" },
      { name: "moroccan", origin: "Maghreb, 19th c.",      note: "silver or tin, long spout; for high-pour mint green tea" },
      { name: "brown betty", origin: "Stoke, 17th c.",     note: "red Etruria clay, manganese glaze; canonical English pot" },
    ],
    essay: "A teapot is a household clock. It marks afternoons, visits, the moment a meeting becomes a conversation. Every culture that brews leaves in water has built a vessel around the ritual, and most of those vessels turn out to look like one another — a body, a handle, a spout, a way to be set down between sips.",
    illustration_prompt: "vintage 19th century natural history specimen card of a yixing clay teapot, cream paper background, ink line drawing with subtle watercolor wash, side view, labeled parts (lid / pearl / spout / handle / body), isolated, museum catalogue style",
  },

  satchel: {
    title: "a leather satchel",
    kicker: "TRAVEL BAGS",
    intro: "Vegetable-tanned leather, brass buckles, single shoulder strap. The corners are scuffed from being set down on stone steps.",
    anatomy: [
      { name: "flap",   note: "covers the opening; rain runs off; closes with strap" },
      { name: "buckles",note: "two brass tongues; tarnished but functional" },
      { name: "gusset", note: "the side panels; depth determines how much it holds" },
      { name: "strap",  note: "single, adjustable; rides on the shoulder, not chest" },
      { name: "lining", note: "cotton or unlined; an unlined satchel ages with you" },
    ],
    relatives: [
      { name: "messenger",  origin: "US, 1950s",         note: "courier-derived; cross-body, larger flap, urban posture" },
      { name: "doctor's bag", origin: "England, 1860s",  note: "hard frame, hinged opening; once held tools for house calls" },
      { name: "musette",    origin: "France, WWI",        note: "soldier's small canvas sling; later cyclists' food bag" },
      { name: "tote",       origin: "US, 1944",           note: "open top, twin handles; built by L.L. Bean for ice carrying" },
      { name: "furoshiki",  origin: "Japan, 8th c.",      note: "single cloth, no handles; tied around objects to carry" },
      { name: "mochila",    origin: "Andes, pre-Columbian", note: "knotted fibre net; flexible volume; daily market use" },
    ],
    essay: "We carry things because we keep going home and leaving it again. A bag is the smallest possible house — flap for a roof, gusset for a wall, strap for an exit. The best ones don't look new for long; they are improved by miles, by being set down on the wrong surface, by being trusted.",
    illustration_prompt: "vintage 19th century natural history specimen card of a leather satchel, cream paper background, ink line drawing with subtle watercolor wash, front view, labeled parts (flap / buckles / strap / gusset / body), isolated, museum catalogue style",
  },
};

// ---------- Sample cross-user wall entries (demo) ----------
// Used to populate the wall when there's no platform persistence connected,
// so the social feature is visible during preview.
export const SAMPLE_WALL_ENTRIES = [
  { id: "s_demo_1", author: "Algram",     handle: "algram",     title: "a panama hat",     kicker: "WOVEN STRAW HEADWEAR", demoKey: "hat",     createdAt: Date.now() - 1000 * 60 * 12,  likes: 23 },
  { id: "s_demo_2", author: "Jenny",      handle: "jenny",      title: "a clay teapot",    kicker: "DOMESTIC CERAMICS",    demoKey: "teapot",  createdAt: Date.now() - 1000 * 60 * 47,  likes: 12 },
  { id: "s_demo_3", author: "JM·F",       handle: "jmf",        title: "a leather satchel",kicker: "TRAVEL BAGS",          demoKey: "satchel", createdAt: Date.now() - 1000 * 60 * 90,  likes: 31 },
  { id: "s_demo_4", author: "ghostpixel", handle: "ghostpixel", title: "a panama hat",     kicker: "WOVEN STRAW HEADWEAR", demoKey: "hat",     createdAt: Date.now() - 1000 * 60 * 180, likes: 8 },
  { id: "s_demo_5", author: "Isaya",      handle: "isaya",      title: "a clay teapot",    kicker: "DOMESTIC CERAMICS",    demoKey: "teapot",  createdAt: Date.now() - 1000 * 60 * 260, likes: 17 },
  { id: "s_demo_6", author: "Isabel",     handle: "isabel",     title: "a leather satchel",kicker: "TRAVEL BAGS",          demoKey: "satchel", createdAt: Date.now() - 1000 * 60 * 480, likes: 5 },
];
