# AlterU Press

A newsstand of tiny tools. Drop something in, get something printable back.

🔗 https://yinxinghuan.github.io/alteru-press/

## In this issue

| # | Tool | Status |
|---|---|---|
| 01 | **Field Guide** — photograph → cultural dossier of the main object | live (demo mode until Worker deployed) |

## Local dev

```sh
python3 -m http.server 8765
# → http://localhost:8765/
# → http://localhost:8765/tools/field-guide/?demo=hat
```

## Structure

```
/
├── index.html                  hub landing page
├── shared/brand.css            shared editorial brand styles
├── tools/field-guide/
│   ├── index.html              tool page
│   ├── app.js                  glue / state / handlers
│   ├── guide.js                Worker client + demo dossiers
│   ├── poster.js               editorial dossier SVG renderer
│   ├── wall.js                 social wall (v1 = localStorage)
│   └── aigram.js               Aigram bridge (user identity + post to feed)
└── worker/                     Cloudflare Worker for Claude vision
```

## To make the tool actually work on a real photo

1. `cd worker && wrangler secret put ANTHROPIC_API_KEY && wrangler deploy`
2. Copy the returned worker URL
3. Set `WORKER_URL` in `tools/field-guide/guide.js`
4. `git push` — Pages rebuilds automatically

See `worker/README.md` for the full details.

## Roadmap

- v2.1 — Wall persistence on Cloudflare D1 + R2
- 02 — second tool
