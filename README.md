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
| `js/collage.js` | Collage Maker UI — open to guests: tool tabs (Photos → Layout → Style → Text), contextual card, pointer editing, undo/redo, drafts, export with progress |
| `js/collage/core.js` | Collage core (pure, DOM-free): state, geometry, text-slot resolution, section overrides, editing ops, History, draft serialization |
| `js/collage/render.js` | Collage canvas renderer — one code path for preview, thumbnails and export |
| `js/collage/draft.js` | Local draft persistence in IndexedDB (document + original photo files); this browser only, no sync |
| `js/data/collage.js` | Collage data: canvas shapes + export presets, 37 layouts (17 moodboard, 10 photos-only, 10 classic), 6 theme packs, 12 palettes, 9 font sets, 8 combinations |
| `test/*.test.mjs` | node:test coverage for the collage core, history and draft serialization — `npm test` (no dependencies) |
| `server/server.mjs` | Accounts & progress API — zero-dep Node, SQLite, scrypt passwords, HMAC session cookies, Google ID-token verification |

## Collage Maker notes

- No account needed. Photos never leave the browser: editing uses a ≤1600px working copy, the export re-decodes the originals. There is no upload code path.
- Drafts autosave to IndexedDB in the current browser only (document + photo files). They do not sync between devices or accounts. Empty boards are not kept.
- Export presets derive from the canvas shape; the largest is 4096px on the long edge, with an automatic 75%/50% retry if the device cannot allocate the canvas (the result line reports the actual size).
- Formats: JPEG, PNG, WebP and GIF are supported by every current browser. HEIC (iPhone) decodes only where the browser itself supports it (Safari); this has not been verified on a device in this repo.
- Keyboard: every panel control, the Photos grid and the word “adjust” buttons work with Tab/Enter; resizing sections and free dragging on the canvas are pointer-only.

## Notes

- Course progress is saved to the signed-in account (the API); the Collage Maker needs no account.
- No build step, no dependencies; plain ES modules.
- Content is fully editable: each lesson is a list of typed blocks (`p`, `tip`,
  `table`, `assignment`, `widget`, …) in the curriculum files.
