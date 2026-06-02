// AlterU Press · Field Guide Worker
// Cloudflare Worker that calls Anthropic Claude vision and returns a structured
// "field guide" dossier for the main object in a photo.
//
// Env vars (set via `wrangler secret put`):
//   ANTHROPIC_API_KEY      Anthropic API key
//
// Frontend posts: { imageBase64, mime }
// Worker returns: see SCHEMA below.

const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 1400;

const SYSTEM_PROMPT = `You are the staff cultural anthropologist at AlterU Press, a small editorial that publishes single-page "field guides" to ordinary objects. A reader has sent in a photograph. Your job:

1. Identify the single most interesting MAN-MADE OBJECT in the picture. Ignore people, plants, sky, food unless they ARE the subject. If the picture is mostly a person, identify their most distinctive worn / held object (a hat, a bag, a coat). If nothing is identifiable, return {"ok": false, "reason": "..."}.

2. Write a short editorial dossier with the following structure:

  - title           — a noun phrase, the subject name. lower case. e.g. "a panama hat" / "a clay teapot" / "a leather satchel"
  - kicker          — 4-word category label, e.g. "WOVEN STRAW HEADWEAR" / "DOMESTIC CERAMICS" / "TRAVEL BAGS"
  - intro           — 1-2 sentences. specific, observational. plain English. mention what makes THIS one particular. 30 words max.
  - anatomy         — 4-6 named parts of the object. each: { name (1-3 words), note (8-14 words explaining its purpose / craft) }
  - relatives       — 6-8 cultural variants of the object across world / history. each: { name (1-3 words), origin (region + rough era), note (10-16 words on its difference / context) }. spread the cultures — don't list 6 European variants.
  - essay           — 2-3 sentence closing reflection on what this category of object MEANS culturally. why humans make them. status / function / ritual / climate. 50-70 words. essayist tone, not encyclopedic.

3. Reply with ONLY a single JSON object, no markdown, no preamble:

{
  "ok": true,
  "title": string,
  "kicker": string,
  "intro": string,
  "anatomy": [{"name": string, "note": string}],
  "relatives": [{"name": string, "origin": string, "note": string}],
  "essay": string
}

Tone notes:
- Avoid "amazing", "iconic", "rich history". Avoid adjective stacks.
- No emojis. No bullet points in prose fields.
- It's OK to admit "probably" or "likely" if uncertain about the specific origin of THIS object.
- Anatomy notes should sound like a field manual ("flat-curled brim, ≈7cm; shades the eyes").
- Relatives should feel cross-cultural and curious (a bowler next to a turban next to a fez).
- Essay should sound like Wallpaper / Cabinet Magazine, not a textbook.`;

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return cors(new Response(null, { status: 204 }));
    const url = new URL(request.url);
    if (url.pathname !== "/dossier" || request.method !== "POST") {
      return cors(json({ error: "POST /dossier" }, 404));
    }

    let body;
    try { body = await request.json(); }
    catch { return cors(json({ error: "invalid json" }, 400)); }

    const { imageBase64, mime = "image/jpeg" } = body || {};
    if (!imageBase64) return cors(json({ error: "missing imageBase64" }, 400));

    const messages = [{
      role: "user",
      content: [
        { type: "image", source: { type: "base64", media_type: mime, data: imageBase64 } },
        { type: "text", text: "Photo filed for the Field Guide. Return the JSON dossier." },
      ],
    }];

    try {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: MAX_TOKENS,
          system: SYSTEM_PROMPT,
          messages,
        }),
      });

      if (!r.ok) {
        const txt = await r.text();
        return cors(json({ error: "anthropic", detail: txt.slice(0, 400) }, 502));
      }
      const data = await r.json();
      const text = (data.content || []).filter(c => c.type === "text").map(c => c.text).join("");
      const parsed = safeParse(text);
      if (!parsed) return cors(json({ error: "bad_model_output", raw: text.slice(0, 400) }, 502));
      return cors(json(parsed));
    } catch (e) {
      return cors(json({ error: String(e) }, 500));
    }
  },
};

function safeParse(s) {
  try { return JSON.parse(s); }
  catch {
    const m = s.match(/\{[\s\S]*\}/);
    if (m) { try { return JSON.parse(m[0]); } catch {} }
    return null;
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function cors(res) {
  const headers = new Headers(res.headers);
  headers.set("access-control-allow-origin", "*");
  headers.set("access-control-allow-methods", "POST, OPTIONS");
  headers.set("access-control-allow-headers", "content-type");
  return new Response(res.body, { status: res.status, headers });
}
