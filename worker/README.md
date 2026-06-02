# Field Guide Worker

Cloudflare Worker that calls Claude vision and returns a structured dossier for the main object in a photograph.

## Deploy

```sh
cd worker
npm install -g wrangler        # one time
wrangler login                  # one time
wrangler secret put ANTHROPIC_API_KEY
wrangler deploy
```

You'll get a URL like `https://alteru-press-fieldguide.<your-account>.workers.dev`.

## Wire frontend

In `tools/field-guide/app.js`, set:

```js
const WORKER_URL = "https://alteru-press-fieldguide.<your-account>.workers.dev";
```

Commit + push. Pages rebuilds automatically.

## Cost

~$0.01 per photo with `claude-sonnet-4-6` (≈1.2 KB input image base64 + ~1k output tokens).

## Returned schema

```json
{
  "ok": true,
  "title": "a panama hat",
  "kicker": "WOVEN STRAW HEADWEAR",
  "intro": "Hand-plaited from young toquilla straw on Ecuador's coast. The grosgrain ribbon is fresh, the brim still holds its curl.",
  "anatomy": [
    { "name": "crown", "note": "the dome above the brim; here, blocked round and creased optimo-style" },
    { "name": "brim",  "note": "flat-curled, about 7 cm; shades eyes without obstructing peripheral view" },
    { "name": "ribbon","note": "single bow at the band; black grosgrain; replaceable, often by tailor" },
    { "name": "weave", "note": "fino grade; closer plait equals lighter, finer, more expensive" }
  ],
  "relatives": [
    { "name": "fedora", "origin": "Italy / US, 1890s",     "note": "felt, soft crown, brim pinch; the jazz-era city hat" },
    { "name": "beret",  "origin": "French Basque",          "note": "round wool, flat, no brim; military and folk reuse" },
    { "name": "bowler", "origin": "England, 1849",          "note": "hard felt; first worn by gamekeepers, then clerks" },
    { "name": "stetson","origin": "American West, 1865",    "note": "wide brim, weatherproofed; cattle-trail provenance" },
    { "name": "turban", "origin": "Persia / South Asia",    "note": "wound cloth; status, devotion, climate; not just one form" },
    { "name": "tarboosh","origin":"Maghreb / Ottoman",      "note": "cylindrical red felt; civil servant signal under Ottoman rule" }
  ],
  "essay": "We make hats to negotiate with the sky. Sun, rain, cold, holy days, court. The straw braided here would not look out of place in a 1920s race-day photograph or a present-day mango orchard — which is the trick of a great hat: it survives across centuries by quietly doing one job well."
}
```

## Errors

- `{"ok": false, "reason": "..."}` — model couldn't find a clear subject.
- `{"error": "anthropic", "detail": "..."}` — API call failed.
- `{"error": "bad_model_output", "raw": "..."}` — model returned non-JSON.
