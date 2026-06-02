# AlterU Press

A newsstand of tiny tools. Drop something in, get something printable back.

🔗 https://yinxinghuan.github.io/alteru-press/

## In this issue

| # | Tool | Status |
|---|---|---|
| 01 | **Field Guide** — photograph → cultural dossier of the main object | live |
| 02 | **Almanac** — open → today's editorial almanac page | live |

## Local dev

```sh
python3 -m http.server 8765
# → http://localhost:8765/
# → http://localhost:8765/tools/field-guide/?demo=hat
# → http://localhost:8765/tools/almanac/
```

## Structure

```
/
├── index.html                  hub landing page
├── shared/
│   ├── brand.css               shared editorial brand styles
│   └── i18n.js                 zh / en UI strings
├── tools/field-guide/
│   ├── index.html              tool page
│   ├── app.js                  glue / state / handlers
│   ├── guide.js                upload → game-chat (LLM) → gen-image
│   ├── poster.js               1080×1920 SVG (download artifact)
│   ├── illustrations.js        demo PNGs
│   ├── wall.js                 social wall
│   └── aigram.js               Aigram bridge
└── tools/almanac/
    ├── index.html
    ├── app.js
    ├── lunar.js                via lunar-typescript@esm.sh
    ├── astronomy.js            sunrise/sunset + moon phase
    ├── seasons.js              24 节气 → subject map for daily illus prompt
    ├── seedpool.js             宜/忌 + on-this-day + editor's note (date-seeded)
    ├── almanac.js              canonical page builder
    ├── poster.js               1080×1920 SVG (download artifact)
    └── img/daily/              cached daily illustrations
```

## Platform integration

All AI calls go through the platform endpoints (anonymous, work in or outside Aigram):

- `chat.aiwaves.tech/aigram/api/upload` — user photo → public URL
- `chat.aiwaves.tech/aigram/api/game-chat` — text LLM, OpenAI format
- `chat.aiwaves.tech/aigram/api/gen-image` — txt2img / img2img

Field Guide pipeline (same as tap-and-tell):

```
photo → upload → URL
      → game-chat (LLM imagines a dossier; never sees the photo)
      → gen-image (ref = URL, prompt = dossier.illustration_prompt)
      → render
```

The visual fidelity comes from img2img; the dossier text is the model's plausible invention.

## Roadmap

- Almanac P3 — stamp persistence on platform `useGameSave`
- Field Guide / Almanac — more demo / archetype illustrations cached
