// AlterU Press · reading-note Worker
// Cloudflare Worker that calls Anthropic Claude vision to produce a short
// editorial reading note + object/mood data for an image.
//
// Env vars (set via `wrangler secret put`):
//   ANTHROPIC_API_KEY      Anthropic API key
//
// Frontend posts: { imageBase64, mime, palette: [{hex, name, pct}] }
// Worker returns: { note, scene, mood, objects: [{name, count}] }

const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 400;

const SYSTEM_PROMPT = `You are the editor of AlterU Press, a small magazine that prints "spec sheets" for images. For every picture filed, you produce:

1. A single-sentence "reading note" — no more than 14 words. Tone: a quiet, observant editorial caption. Specific, not generic. Avoid adjective stacks. Avoid the words "image" / "photo" / "picture".
2. A short scene label (2-4 words). E.g. "kitchen, morning" / "subway platform".
3. A mood label (1-2 words). E.g. "still" / "anxious bright" / "domestic".
4. An objects list — up to 6 entries, each with a name and an integer count. Only confidently visible things.

Reply with ONLY valid JSON matching this schema, no preamble:
{"note": string, "scene": string, "mood": string, "objects": [{"name": string, "count": integer}]}`;

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return cors(new Response(null, { status: 204 }));
    const url = new URL(request.url);
    if (url.pathname !== "/analyze" || request.method !== "POST") {
      return cors(json({ error: "POST /analyze" }, 404));
    }

    let body;
    try { body = await request.json(); }
    catch { return cors(json({ error: "invalid json" }, 400)); }

    const { imageBase64, mime = "image/jpeg", palette = [] } = body || {};
    if (!imageBase64) return cors(json({ error: "missing imageBase64" }, 400));

    const paletteHint = palette.slice(0, 5).map(c => `${c.hex} (${c.name}, ${c.pct}%)`).join(", ");

    const messages = [{
      role: "user",
      content: [
        { type: "image", source: { type: "base64", media_type: mime, data: imageBase64 } },
        { type: "text", text: `Picture filed for analysis. Dominant colours: ${paletteHint || "n/a"}.\n\nReturn the JSON.` },
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
