# Reading-note Worker

Cloudflare Worker that calls Claude vision and returns the editorial reading note + scene/mood/object data for one image.

## Deploy

```sh
cd worker
wrangler secret put ANTHROPIC_API_KEY
wrangler deploy
```

You'll get a URL like `https://alteru-press-readingnote.<your-account>.workers.dev`.

## Wire frontend

In `tools/image-spec/app.js`, swap the rule-based `generateReadingNote` for a call to the Worker:

```js
const READING_NOTE_ENDPOINT = "https://alteru-press-readingnote.<your-account>.workers.dev/analyze";

async function generateReadingNote(spec, dataUrl) {
  try {
    const imageBase64 = dataUrl.split(",")[1];
    const mime = dataUrl.match(/^data:([^;]+);/)?.[1] || "image/jpeg";
    const r = await fetch(READING_NOTE_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ imageBase64, mime, palette: spec.palette }),
    });
    const data = await r.json();
    if (data.note) return data.note;
  } catch (e) { console.warn("reading note fallback", e); }
  return ruleBasedNote(spec);
}
```

(Keep the existing rule-based function as `ruleBasedNote` for offline fallback.)

## Cost

~$0.005 per image with `claude-sonnet-4-6` + ~10 KB image input.

## Schema

Returns:
```json
{
  "note": "Quiet, near-window, two cups uncleared.",
  "scene": "kitchen, morning",
  "mood": "still",
  "objects": [
    { "name": "cup", "count": 2 },
    { "name": "chair", "count": 1 }
  ]
}
```
