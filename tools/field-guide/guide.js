// AlterU Press · Field Guide · Platform-API client
//
// Same pattern as tap-and-tell: the LLM doesn't see the photo. It
// imagines a plausible dossier; the photo only goes to gen-image as a
// visual reference. Visual continuity comes from img2img; textual
// flavor comes from the LLM's invention.
//
// Endpoints (all anonymous, work in or outside Aigram):
//   upload    · multipart, returns public R2 URL
//   game-chat · OpenAI-format text LLM
//   gen-image · txt2img / img2img, ~200s

import { DEMO_ILLUSTRATIONS } from "./illustrations.js";
import { locale } from "../../shared/i18n.js";

const UPLOAD_URL    = "https://chat.aiwaves.tech/aigram/api/upload";
const CHAT_URL      = "https://chat.aiwaves.tech/aigram/api/game-chat";
const GEN_IMAGE_URL = "https://chat.aiwaves.tech/aigram/api/gen-image";
const RECOGNIZE_URL = "https://chat.aiwaves.tech/aigram/api/recognize";

// ─── Public API ──────────────────────────────────────────────────────────

export async function fetchDossier({ imageDataUrl, demoKey, onProgress } = {}) {
  const progress = onProgress || (() => {});

  if (demoKey) {
    const d = DEMOS[demoKey];
    if (!d) throw new Error(`unknown demo: ${demoKey}`);
    return { ok: true, ...d, illustration: DEMO_ILLUSTRATIONS[demoKey], _source: "demo" };
  }

  if (!imageDataUrl) {
    return { ok: false, reason: "no_image" };
  }

  try {
    // 1. Upload photo → public URL (used as recognize input + gen-image ref)
    progress("upload");
    const photoUrl = await uploadDataUrl(imageDataUrl);

    // 2. Vision recognize — labels/parts/caption that actually match the
    //    photo. Falls back to {} if the endpoint hiccups so the dossier
    //    path still works.
    progress("look");
    const vision = await recognizeViaVision(photoUrl).catch(e => {
      console.warn("recognize failed; proceeding without vision", e);
      return null;
    });

    // 3. LLM writes the dossier, now grounded in what's actually in the photo.
    progress("write");
    const dossier = await composeDossierViaLLM(vision);
    if (!dossier) return { ok: false, reason: "llm_no_dossier" };

    // 4. gen-image makes the specimen card using photo as ref + the
    //    illustration_prompt from the LLM. This is what gives the
    //    output visual fidelity to the actual object the user shot.
    progress("draw");
    let illustration = null;
    try {
      illustration = await generateIllustration({
        ref_url: photoUrl,
        prompt: dossier.illustration_prompt || defaultSpecimenPrompt(dossier.title),
      });
    } catch (e) {
      console.warn("gen-image failed; shipping dossier without illustration", e);
    }

    progress("done");
    return { ok: true, ...dossier, illustration, _source: "live" };
  } catch (e) {
    console.error("fetchDossier failed:", e);
    return { ok: false, reason: String(e?.message || e) };
  }
}

// ─── Step 1 · upload ─────────────────────────────────────────────────────

async function uploadDataUrl(dataUrl) {
  const m = (dataUrl || "").match(/^data:([^;]+);base64,(.+)$/);
  if (!m) throw new Error("bad image data url");
  const mime = m[1];
  const bin  = atob(m[2]);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const blob = new Blob([bytes], { type: mime });

  const form = new FormData();
  form.append("file", blob, "photo." + (mime.split("/")[1] || "jpg"));
  const res = await fetch(UPLOAD_URL, { method: "POST", body: form });
  if (!res.ok) throw new Error(`upload http ${res.status}`);
  const json = await res.json();
  if (!json.url) throw new Error("upload returned no url");
  return json.url;
}

// ─── Step 2 · LLM dossier ────────────────────────────────────────────────

function dossierSystemPrompt(lang) {
  const langDirective = lang === "zh"
    ? '\n\nLANGUAGE: Write title / kicker / intro / anatomy notes / relative names+origins+notes / essay all in 中文 (simplified Chinese). Only the illustration_prompt stays English (it goes to an image model).'
    : '\n\nLANGUAGE: Write everything in English.';

  return `You are the staff cultural anthropologist at AlterU Press, a small editorial that publishes single-page "field guides" to ordinary objects. A reader has photographed an ordinary object and a vision system has already identified what it is — you must commit to that identification (do not second-guess or substitute a different object) and write a dossier as if you had inspected it.

Output STRICT JSON only — no markdown, no preamble, exactly this shape:
{
  "title": string,
  "kicker": string,
  "intro": string,
  "anatomy": [{ "name": string, "note": string }],
  "relatives": [{ "name": string, "origin": string, "note": string }],
  "essay": string,
  "illustration_prompt": string
}

Rules:
- title: a short noun phrase, the imagined subject
- kicker: 4-word category label in small caps
- intro: 1-2 sentences, ≤ 30 words, plain observational tone
- anatomy: 4-6 entries, each note 8-14 words
- relatives: 6-8 cross-cultural variants of the same category (Italian fedora next to Persian turban next to Vietnamese non), each note 10-16 words
- essay: 2-3 sentences, 50-70 words, why we make this kind of object, cultural reflection
- illustration_prompt: ALWAYS English. A single sentence describing the object as a 19th c. natural history specimen card to be drawn from the user's photo as visual reference. e.g. "vintage 19th c. natural history specimen card of a panama hat on cream paper, ink line with watercolor wash, labeled parts (crown, brim, ribbon, weave), museum catalogue style"

Tone: editorial, Wallpaper / Cabinet Magazine. Avoid "amazing" / "iconic" / "rich history". No emojis.` + langDirective;
}

async function recognizeViaVision(imageUrl) {
  const res = await fetch(RECOGNIZE_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ image_url: imageUrl, mode: "object" }),
  });
  if (!res.ok) throw new Error(`recognize http ${res.status}`);
  const json = await res.json();
  if (!json.ok) return null;
  return json;
}

function visionBrief(vision) {
  if (!vision) return "";
  const labels = (vision.labels || []).slice(0, 3).join(", ");
  const parts = (vision.parts || []).slice(0, 4).join("; ");
  const attrs = (vision.attributes || []).slice(0, 4).join(", ");
  const caption = vision.caption || "";
  const subject = labels || caption.split(/[.,;]/)[0] || "an ordinary object";
  return [
    `VISION REPORT (commit to this — do not substitute):`,
    `· subject: ${subject}`,
    caption ? `· caption: ${caption}` : "",
    attrs    ? `· attributes: ${attrs}` : "",
    parts    ? `· visible parts: ${parts}` : "",
  ].filter(Boolean).join("\n");
}

async function composeDossierViaLLM(vision) {
  const lang = locale === "zh" ? "zh" : "en";
  const brief = visionBrief(vision);
  const userMsg = brief
    ? `${brief}\n\nWrite the dossier for this specific subject. title MUST match the vision subject (rephrase naturally, but do not pick a different object). Return JSON only.`
    : `A reader just photographed an ordinary man-made object. Imagine what it might be and write the dossier. Return JSON only. seed:${Math.random().toString(36).slice(2, 8)}`;
  const res = await fetch(CHAT_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      messages: [
        { role: "system", content: dossierSystemPrompt(lang) },
        { role: "user",   content: userMsg },
      ],
    }),
  });
  if (!res.ok) throw new Error(`game-chat http ${res.status}`);
  const json = await res.json();
  const reply = json.choices?.[0]?.message?.content ?? "";
  return safeParseDossier(reply);
}

function safeParseDossier(raw) {
  const cleaned = String(raw || "").replace(/```json/g, "").replace(/```/g, "").trim();
  const m = cleaned.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    const obj = JSON.parse(m[0]);
    if (typeof obj.title !== "string") return null;
    return {
      title:    obj.title,
      kicker:   obj.kicker || "",
      intro:    obj.intro  || "",
      anatomy:  Array.isArray(obj.anatomy)   ? obj.anatomy.slice(0, 6)  : [],
      relatives:Array.isArray(obj.relatives) ? obj.relatives.slice(0, 8) : [],
      essay:    obj.essay  || "",
      illustration_prompt: obj.illustration_prompt || "",
    };
  } catch { return null; }
}

// ─── Step 3 · gen-image ──────────────────────────────────────────────────

async function generateIllustration({ ref_url, prompt }) {
  const res = await fetch(GEN_IMAGE_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ prompt, ref_url }),
  });
  if (!res.ok) throw new Error(`gen-image http ${res.status}`);
  const json = await res.json();
  if (!json.url) throw new Error("gen-image returned no url");
  return json.url;
}

function defaultSpecimenPrompt(title) {
  return `vintage 19th-century natural history specimen card of ${title || "an ordinary object"}, cream paper background with double border frame, hand-drawn ink line with delicate watercolor wash, labeled parts, museum catalogue style, isolated single object, NOT a photograph, drawn illustration only, high detail, editorial line art`;
}

// ─── Demos (unchanged shape) ─────────────────────────────────────────────

export const DEMO_KEYS = ["hat", "teapot", "satchel"];

export const DEMOS = {
  hat: {
    title: "a panama hat",
    kicker: "WOVEN STRAW HEADWEAR",
    intro: "Hand-plaited from young toquilla straw on Ecuador's coast. The grosgrain ribbon is fresh, the brim still holds its curl.",
    anatomy: [
      { name: "crown",     note: "the dome above the brim; blocked round, creased optimo-style" },
      { name: "brim",      note: "flat-curled, ≈ 7 cm; shades the eyes without obstructing view" },
      { name: "ribbon",    note: "single bow at the band; black grosgrain; replaceable" },
      { name: "weave",     note: "fino grade; closer plait equals lighter, finer, more expensive" },
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
    illustration_prompt: "vintage 19th century natural history specimen card of a panama hat, cream paper background, ink line drawing with subtle watercolor wash, side view, labeled parts (crown / brim / ribbon / weave), isolated, museum catalogue style",
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
      { name: "yixing",      origin: "Jiangsu, 16th c.",     note: "purple clay; seasons with each tea; one pot per leaf" },
      { name: "tetsubin",    origin: "Japan, 17th c.",        note: "cast iron, enamel-lined; brews and serves; weighty heat" },
      { name: "samovar",     origin: "Russia, 18th c.",       note: "small pot atop a hot water urn; concentrate then dilute" },
      { name: "kyusu",       origin: "Japan, 18th c.",        note: "side-handle pot for sencha; small, intimate, single-cup" },
      { name: "moroccan",    origin: "Maghreb, 19th c.",      note: "silver or tin, long spout; for high-pour mint green tea" },
      { name: "brown betty", origin: "Stoke, 17th c.",        note: "red Etruria clay, manganese glaze; canonical English pot" },
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
      { name: "messenger",    origin: "US, 1950s",            note: "courier-derived; cross-body, larger flap, urban posture" },
      { name: "doctor's bag", origin: "England, 1860s",       note: "hard frame, hinged opening; once held tools for house calls" },
      { name: "musette",      origin: "France, WWI",          note: "soldier's small canvas sling; later cyclists' food bag" },
      { name: "tote",         origin: "US, 1944",             note: "open top, twin handles; built by L.L. Bean for ice carrying" },
      { name: "furoshiki",    origin: "Japan, 8th c.",        note: "single cloth, no handles; tied around objects to carry" },
      { name: "mochila",      origin: "Andes, pre-Columbian", note: "knotted fibre net; flexible volume; daily market use" },
    ],
    essay: "We carry things because we keep going home and leaving it again. A bag is the smallest possible house — flap for a roof, gusset for a wall, strap for an exit. The best ones don't look new for long; they are improved by miles, by being set down on the wrong surface, by being trusted.",
    illustration_prompt: "vintage 19th century natural history specimen card of a leather satchel, cream paper background, ink line drawing with subtle watercolor wash, front view, labeled parts (flap / buckles / strap / gusset / body), isolated, museum catalogue style",
  },
};

// Sample cross-user wall entries
export const SAMPLE_WALL_ENTRIES = [
  { id: "s_demo_1", author: "Algram",     handle: "algram",     title: "a panama hat",     kicker: "WOVEN STRAW HEADWEAR", demoKey: "hat",     createdAt: Date.now() - 1000 * 60 * 12,  likes: 23 },
  { id: "s_demo_2", author: "Jenny",      handle: "jenny",      title: "a clay teapot",    kicker: "DOMESTIC CERAMICS",    demoKey: "teapot",  createdAt: Date.now() - 1000 * 60 * 47,  likes: 12 },
  { id: "s_demo_3", author: "JM·F",       handle: "jmf",        title: "a leather satchel",kicker: "TRAVEL BAGS",          demoKey: "satchel", createdAt: Date.now() - 1000 * 60 * 90,  likes: 31 },
  { id: "s_demo_4", author: "ghostpixel", handle: "ghostpixel", title: "a panama hat",     kicker: "WOVEN STRAW HEADWEAR", demoKey: "hat",     createdAt: Date.now() - 1000 * 60 * 180, likes: 8 },
  { id: "s_demo_5", author: "Isaya",      handle: "isaya",      title: "a clay teapot",    kicker: "DOMESTIC CERAMICS",    demoKey: "teapot",  createdAt: Date.now() - 1000 * 60 * 260, likes: 17 },
  { id: "s_demo_6", author: "Isabel",     handle: "isabel",     title: "a leather satchel",kicker: "TRAVEL BAGS",          demoKey: "satchel", createdAt: Date.now() - 1000 * 60 * 480, likes: 5 },
];
