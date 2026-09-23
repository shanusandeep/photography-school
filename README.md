# The Darkroom — Photography School

A complete, self-contained web app that teaches photography from zero to craft:
10 training modules, 37 lessons, 5 interactive labs, per-module quizzes, field
assignments, and progress tracking (saved in your browser).

## Run it

Any static file server works. From this folder:

```sh
python3 -m http.server 8517
```

Then open http://localhost:8517

For accounts/progress-sync locally, also run the API (Node ≥ 22.5):

```sh
COOKIE_SECURE=0 CORS_ORIGINS=http://localhost:8517 node server/server.mjs
```

The frontend auto-targets `http://localhost:8092` when served from localhost,
and same-origin `/api` in production. Without the API running, the app works
in guest mode (localStorage only).

## What's inside

| Path | Purpose |
|---|---|
| `index.html` | Shell, fonts, top bar |
| `css/style.css` | The "darkroom" theme (warm black + safelight amber) |
| `js/app.js` | Hash router, views, quiz engine, progress store |
| `js/widgets.js` | Interactive labs: exposure simulator, depth-of-field visualizer, histogram trainer, composition trainer, editing desk |
| `js/data/curriculum-a.js` | Modules 01–05 (Fundamentals, Exposure, Focus, Composition, Light) |
| `js/data/curriculum-b.js` | Modules 06–10 (Lenses & Gear, Genres, Editing, Advanced, Craft) |
| `js/data/index.js` | Data index + Field Notes cards |
| `js/auth.js` | Sign-in modal, session state, Google SSO button |
| `js/collage.js` | The Print Table — themed collage studio: shared canvas renderer (preview = export), pointer editing, high-res export with memory fallback |
| `js/data/collage.js` | Collage data: canvas shapes + export presets, 10 layouts, 6 theme packs (fonts, palettes, text slots, ornaments) |
| `server/server.mjs` | Accounts & progress API — zero-dep Node, SQLite, scrypt passwords, HMAC session cookies, Google ID-token verification |

## Notes

- Progress lives in `localStorage` under `darkroom-progress-v1` — clear it to reset the course.
- No build step, no dependencies; plain ES modules.
- Content is fully editable: each lesson is a list of typed blocks (`p`, `tip`,
  `table`, `assignment`, `widget`, …) in the curriculum files.
