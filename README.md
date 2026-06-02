# AlterU Press

A newsstand of tiny tools. Drop something in, get something printable back.

🔗 https://yinxinghuan.github.io/alteru-press/

## In this issue

| # | Tool | Status |
|---|---|---|
| 01 | **Image Spec** — picture → magazine spec sheet | live |

## Local dev

```sh
python3 -m http.server 8765
# → http://localhost:8765/
```

## Structure

```
/
├── index.html                  hub landing page
├── shared/brand.css            shared editorial brand styles
├── tools/image-spec/
│   ├── index.html              tool page
│   ├── app.js                  glue / state / handlers
│   ├── analyze.js              client-side pixel analysis
│   ├── poster.js               editorial SVG poster renderer
│   ├── wall.js                 social wall (v1 = localStorage)
│   └── aigram.js               Aigram bridge (user identity + post to feed)
└── worker/                     Cloudflare Worker scaffold for AI reading note
```

## Roadmap

- v1.1 — Claude vision reading note via Worker
- v1.2 — Wall persistence on Cloudflare D1 + R2
- 02 — second tool
