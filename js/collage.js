// ============================================================
// Collage Maker — UI: workspace view, pointer editing, fonts,
// photo loading and export. Pure logic lives in ./collage/core.js,
// drawing in ./collage/render.js.
//
// Photos never leave the browser: files stay as File objects, we keep
// a ≤1600px working bitmap for editing and re-decode the originals
// one at a time at export.
// ============================================================

import { SHAPES, LAYOUTS, THEMES, PALETTES, FONT_SETS, COMBOS, DEFAULT_BODY, exportPresets } from './data/collage.js';
import {
  createState, emptyCell, currentTheme, currentShape, currentLayout, photoById, hasContent, currentPreset as presetOf,
  styledTheme, accentColor, slotText, textOv, setTextOv, slotsFor, isPhotoCell, firstEmptyPhotoCell, photoCellIndices,
  cellDef, setCellOv, hasCellOv, clearCellOv, geometry as geometryOf, fitPhoto, cellQuality as cellQualityOf,
  setLayout as setLayoutOf, setTheme as setThemeOf, setShape as setShapeOf, swapCells as swapCellsOf, assignPhoto as assignPhotoOf,
  clearCell as clearCellOf, removePhoto as removePhotoOf, placePhotos, resetDocument, History, serializeDraft, deserializeDraft, restore, suggestedLayouts,
} from './collage/core.js';
import { saveDraft, loadDraft, clearDraft, isQuotaError } from './collage/draft.js';
import { drawBackground, drawCell, drawForeground, imagePalette as imagePaletteOf, isDark, rotateTo } from './collage/render.js';

/* ============================================================
   state (module singleton — survives hash navigation)
   ============================================================ */
const state = createState();
let nextPhotoId = 1;
const makeCanvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

// thin wrappers that bind the singleton
const geometry = (W, H, opts) => geometryOf(state, W, H, opts);
const cellQuality = (g, i) => cellQualityOf(state, g, i);
const imagePalette = (p) => imagePaletteOf(p, makeCanvas);

window.addEventListener('beforeunload', (e) => {
  if (hasContent(state)) { e.preventDefault(); e.returnValue = ''; }
});

/* ============================================================
   fonts — must be loaded before ANY render so text wraps the same
   in preview and export
   ============================================================ */
const fontLoads = new Map();
function loadFamily(family, param, spec) {
  if (!fontLoads.has(family)) {
    fontLoads.set(family, (async () => {
      if (!document.getElementById(`gf-${family}`)) {
        const link = document.createElement('link');
        link.id = `gf-${family}`; link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, '+')}:${param}&display=swap`;
        document.head.appendChild(link);
      }
      try { await document.fonts.load(spec); }
      catch { /* fall back to system font; still deterministic per device */ }
    })());
  }
  return fontLoads.get(family);
}
function ensureFonts(theme) {
  const { family, param, weight, italic } = theme.font;
  const body = theme.body || DEFAULT_BODY;
  return Promise.all([
    loadFamily(family, param, `${italic ? 'italic ' : ''}${weight} 40px "${family}"`),
    loadFamily(body.family, body.param, `400 20px "${body.family}"`),
  ]);
}

/* ============================================================
   photos
   ============================================================ */
function loadImg(url) {
  return new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = url; });
}
// resize with the browser's high-quality resampler; canvas fallback halves stepwise
async function resized(img, w, h) {
  try { return await createImageBitmap(img, { resizeWidth: w, resizeHeight: h, resizeQuality: 'high' }); }
  catch {
    let src = img, sw = img.naturalWidth || img.width, sh = img.naturalHeight || img.height;
    while (sw / 2 > w) {
      const c = makeCanvas(Math.round(sw / 2), Math.round(sh / 2));
      c.getContext('2d').drawImage(src, 0, 0, c.width, c.height); src = c; sw = c.width; sh = c.height;
    }
    const c = makeCanvas(w, h);
    c.getContext('2d').drawImage(src, 0, 0, w, h);
    return c;
  }
}
async function decodePhoto(file, id) {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImg(url);
    const iw = img.naturalWidth, ih = img.naturalHeight;
    const k = Math.min(1, 1600 / Math.max(iw, ih));
    const bmp = await resized(img, Math.max(1, Math.round(iw * k)), Math.max(1, Math.round(ih * k)));
    return { id, file, name: file.name, iw, ih, bmp };
  } finally { URL.revokeObjectURL(url); }
}
async function addPhotos(files, targetCell = null) {
  const added = [];
  for (const file of files) {
    if (!file.type.startsWith('image/')) continue;
    try { added.push(await decodePhoto(file, nextPhotoId++)); }
    catch { /* unreadable file — skip */ }
  }
  if (!added.length) return added;
  state.photos.push(...added);
  placePhotos(state, added, targetCell);
  return added;
}

const SAMPLE_PHOTOS = ['hero', 'craft', 'genres', 'advanced', 'focus', 'light'];   // CC-licensed images already on the site (credits on Field Notes)
async function loadSamplePhotos() {
  const files = [];
  for (const n of SAMPLE_PHOTOS) {
    try { const b = await fetch(`img/${n}.jpg`).then(r => r.ok ? r.blob() : null); if (b) files.push(new File([b], `sample-${n}.jpg`, { type: 'image/jpeg' })); }
    catch { /* offline: skip */ }
  }
  return files;
}

/* ============================================================
   state operations — every meaningful change goes through history
   ============================================================ */
const history = new History();
const commit = () => history.commit(state);
function setLayout(id) { if (id !== state.layoutId) { commit(); setLayoutOf(state, id); } }
function setTheme(id) { commit(); setThemeOf(state, id); }
function setShape(id) { if (id !== state.shapeId) { commit(); setShapeOf(state, id); } }
function swapCells(a, b) { if (a !== b) { commit(); swapCellsOf(state, a, b); } }
function assignPhoto(i, pid) { commit(); assignPhotoOf(state, i, pid); }
function clearCell(i) { commit(); clearCellOf(state, i); }
function removePhoto(pid) { commit(); removePhotoOf(state, pid); }   // bitmap stays alive for undo
function resetAll() {
  const seen = new Set();
  [...state.photos, ...history.past.flatMap(x => x.photos), ...history.future.flatMap(x => x.photos)]
    .forEach(p => { if (!seen.has(p.id)) { seen.add(p.id); if (p.bmp && p.bmp.close) p.bmp.close(); } });
  resetDocument(state); history.clear();
}

/* ============================================================
   export
   ============================================================ */
async function exportCollage(preset, format, onProgress = () => {}) {
  onProgress({ phase: 'fonts' });
  await ensureFonts(styledTheme(state));
  const type = format === 'png' ? 'image/png' : 'image/jpeg';
  let result = null;
  for (const k of [1, 0.75, 0.5]) {
    const W = Math.round(preset.w * k), H = Math.round(preset.h * k);
    try {
      const canvas = makeCanvas(W, H);
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('no context');
      const g = geometry(W, H);
      drawBackground(state, ctx, g);
      // decode originals one at a time, sized exactly to what the cell draws, then release
      const total = state.cells.filter((c, i) => isPhotoCell(state, i) && c.photoId).length;
      let n = 0;
      for (let i = 0; i < g.cells.length; i++) {
        const c = state.cells[i], p = isPhotoCell(state, i) ? photoById(state, c.photoId) : null;
        if (!p) { drawCell(state, ctx, g, i, null, { makeCanvas }); continue; }
        onProgress({ phase: 'photo', i: ++n, n: total, W, H, reduced: k < 1 });
        const f = fitPhoto(g.cells[i].photo, p.iw, p.ih, c);
        const url = URL.createObjectURL(p.file);
        let bmp;
        try {
          const img = await loadImg(url);
          bmp = await resized(img, Math.max(1, Math.round(f.dw)), Math.max(1, Math.round(f.dh)));
          drawCell(state, ctx, g, i, bmp, { makeCanvas });
        } finally {
          URL.revokeObjectURL(url);
          if (bmp && bmp.close) bmp.close();
        }
      }
      drawForeground(state, ctx, g, makeCanvas);
      onProgress({ phase: 'encode', W, H });
      const blob = await new Promise(res => canvas.toBlob(res, type, 0.92));
      if (!blob || blob.size < 2000) throw new Error('blob failed');
      canvas.width = canvas.height = 1;      // release the big buffer promptly
      result = { blob, W, H, reduced: k < 1, requested: preset };
      break;
    } catch (err) {
      if (k === 0.5) throw err;
    }
  }
  const name = `darkroom-${state.themeId}-${state.layoutId}-${result.W}x${result.H}.${format === 'png' ? 'png' : 'jpg'}`;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(result.blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 30000);
  return { ...result, name };
}

/* ============================================================
   local draft — autosaved to IndexedDB in this browser only
   ============================================================ */
const draft = { enabled: false, timer: 0, failed: null, lastSaved: null, listeners: new Set() };
function scheduleSave() {
  if (!draft.enabled) return;
  clearTimeout(draft.timer);
  draft.timer = setTimeout(async () => {
    try {
      if (!hasContent(state)) { await clearDraft(); draft.lastSaved = null; }     // an empty board is not worth recovering
      else { await saveDraft(serializeDraft(state), state.photos); draft.lastSaved = Date.now(); }
      draft.failed = null;
    } catch (err) {
      draft.failed = isQuotaError(err) ? 'storage is full' : 'storage is unavailable';
      draft.enabled = false;                       // stop retrying; editing continues untouched
    }
    draft.listeners.forEach(fn => fn());
  }, 1200);
}
function discardDraft() { clearDraft().catch(() => {}); }

// local-dev inspection handle (never on the live site)
if (['localhost', '127.0.0.1'].includes(location.hostname)) window.__pt = { state, geometry, exportCollage, addPhotos, history, draft, loadDraft };

/* ============================================================
   view — workspace: tool tabs (Photos → Layout → Style → Text),
   a contextual card for whatever is selected, the canvas stage and
   a slim action bar (add photos, undo/redo, export)
   ============================================================ */
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const TABS = [['photos', 'Photos'], ['layout', 'Layout'], ['style', 'Style'], ['text', 'Text']];
const LAYOUT_FILTERS = [['suggested', 'Suggested'], ['moodboard', 'Moodboard'], ['photos', 'Photos only'], ['classic', 'Classic'], ['all', 'All']];
const HINT_DEFAULT = 'Drag a photo to reposition · scroll or pinch to zoom · click a photo or words for controls · Esc to deselect';

export function viewCollage(app) {
  app.innerHTML = `
  <div class="view pt">
    <div class="pt-layout" data-layout-root>
      <aside class="pt-side" aria-label="Collage tools">
        <div class="pt-side-head">
          <span class="mono" style="color:var(--amber)">Collage Maker · free</span>
          <span class="mono" style="color:var(--paper-faint)" data-save-status>photos stay on this device</span>
        </div>
        <div class="pt-tabs" role="tablist" aria-label="Tool groups">
          ${TABS.map(([id, label]) => `<button role="tab" id="pt-tab-${id}" aria-controls="pt-panel-${id}" aria-selected="${state.ui.tab === id}" tabindex="${state.ui.tab === id ? 0 : -1}" data-tab="${id}">${label}</button>`).join('')}
        </div>
        <div class="pt-context" data-context hidden aria-live="polite"></div>
        <div class="pt-panels" data-panels>

          <section class="pt-panel" id="pt-panel-photos" role="tabpanel" aria-labelledby="pt-tab-photos" data-panel="photos">
            <div class="pt-row">
              <button class="btn btn-primary btn-small" data-add>+ Add photos</button>
              <button class="btn btn-ghost btn-small" data-samples>Try sample photos</button>
            </div>
            <div class="pt-photos" data-photos></div>
            <p class="pt-note">Click a placed photo to select its section; click an unplaced one to drop it into the selected (or next empty) section. JPEG, PNG, WebP or GIF · photos stay on this device.</p>
          </section>

          <section class="pt-panel" id="pt-panel-layout" role="tabpanel" aria-labelledby="pt-tab-layout" data-panel="layout" hidden>
            <div class="pt-sub mono">Canvas shape</div>
            <div class="pt-chips" data-shapes>
              ${SHAPES.map(s => `<button class="pt-chip ${s.id === state.shapeId ? 'on' : ''}" data-shape="${s.id}"><b>${s.name}</b><span>${s.hint}</span></button>`).join('')}
            </div>
            <label class="pt-range"><span class="mono">Spacing</span><input type="range" data-spacing min="0" max="100" value="${state.spacing}" aria-label="Spacing between sections"><output data-spacing-out>${state.spacing}</output></label>
            <div class="pt-sub mono" style="display:flex;justify-content:space-between;align-items:baseline">Layouts <button class="chip" data-layout-reset hidden>↔ reset sizes</button></div>
            <div class="pt-filters" data-layout-filters>
              ${LAYOUT_FILTERS.map(([id, label]) => `<button class="chip ${state.ui.layoutFilter === id ? 'on' : ''}" data-filter="${id}">${label}</button>`).join('')}
            </div>
            <div class="pt-layouts" data-layouts></div>
            <p class="pt-note">Click a section on the canvas for resize handles and a move grip; photos refit automatically. (Handles need a pointer; everything else works with the keyboard.)</p>
          </section>

          <section class="pt-panel" id="pt-panel-style" role="tabpanel" aria-labelledby="pt-tab-style" data-panel="style" hidden>
            <div class="pt-sub mono">Theme</div>
            <div class="pt-chips" data-themes>
              ${THEMES.map(t => `<button class="pt-chip ${t.id === state.themeId ? 'on' : ''}" data-theme="${t.id}"><b>${t.name}</b><span>${t.tag}</span></button>`).join('')}
            </div>
            <label class="pt-accent"><span class="mono">Accent</span><input type="color" data-accent aria-label="Accent colour" value="${accentColor(state)}"><button class="chip" data-accent-reset>reset</button><span style="flex:1"></span><button class="chip" data-style-reset>theme default</button></label>
            <details data-open="combos" ${state.ui.open.combos !== false ? 'open' : ''}><summary class="mono">Combinations</summary><div class="pt-scroll" data-combos></div></details>
            <details data-open="palettes" ${state.ui.open.palettes ? 'open' : ''}><summary class="mono">Color palettes</summary><div class="pt-palettes" data-palettes></div></details>
            <details data-open="imgpal" ${state.ui.open.imgpal ? 'open' : ''}><summary class="mono">Image palettes — from your photos</summary><div class="pt-scroll" data-imgpal></div></details>
            <details data-open="fonts" ${state.ui.open.fonts ? 'open' : ''}><summary class="mono">Font sets</summary><div class="pt-fonts" data-fonts></div></details>
          </section>

          <section class="pt-panel" id="pt-panel-text" role="tabpanel" aria-labelledby="pt-tab-text" data-panel="text" hidden>
            <div class="pt-row" style="justify-content:space-between;align-items:center">
              <span class="pt-sub mono" style="margin:0">Words on the collage</span>
              <button class="chip ${state.ui.hideText ? '' : 'on'}" data-hide-all role="switch" aria-checked="${!state.ui.hideText}">${state.ui.hideText ? 'turn words on' : 'words on'}</button>
            </div>
            <p class="pt-note">Words are off by default. Turn them on to add a title, caption or number — then drag them on the canvas, or use “adjust” here for size and position.</p>
            <div data-slots></div>
          </section>
        </div>
      </aside>

      <div class="pt-main">
        <div class="pt-stage" data-stage>
          <div class="pt-canvas-wrap" data-wrap>
            <canvas data-preview tabindex="0" role="img" aria-label="Collage preview. Photos and words can be dragged with a pointer; use the panel controls for keyboard editing."></canvas>
            <div class="pt-toolbar" data-toolbar hidden role="toolbar" aria-label="Selected section">
              <button data-act="zoom-out" title="Zoom out" data-photo-only aria-label="Zoom out">−</button>
              <button data-act="zoom-in" title="Zoom in" data-photo-only aria-label="Zoom in">+</button>
              <span class="pt-sep" data-photo-only></span>
              <button data-act="up" title="Move to previous section" data-photo-only aria-label="Move photo to previous section">↑</button>
              <button data-act="down" title="Move to next section" data-photo-only aria-label="Move photo to next section">↓</button>
              <button data-act="swap" title="Swap with another section" data-photo-only aria-label="Swap with another section">⇄ Swap</button>
              <span class="pt-sep" data-photo-only></span>
              <button data-act="replace" title="Replace photo" data-photo-only aria-label="Replace photo">Replace</button>
              <button data-act="add" title="Add a photo here" data-empty-only aria-label="Add a photo here">+ Add photo</button>
              <button data-act="reset-cell" title="Reset this section's size & position" data-ov-only aria-label="Reset section size and position">↔ Reset size</button>
              <span class="pt-sep" data-photo-only></span>
              <button data-act="clear" class="pt-danger" title="Remove the photo from this section" data-photo-only aria-label="Remove photo from section">Clear</button>
              <span class="pt-sep"></span>
              <button data-act="done" title="Done — hide these controls" aria-label="Done">✕</button>
            </div>
            <div class="pt-toolbar" data-text-toolbar hidden role="toolbar" aria-label="Selected text">
              <button data-tact="smaller" title="Smaller text" aria-label="Smaller text">A−</button>
              <button data-tact="bigger" title="Bigger text" aria-label="Bigger text">A+</button>
              <span class="pt-sep"></span>
              <button data-tact="reset" title="Reset position & size" aria-label="Reset text position and size">↺ Reset</button>
              <button data-tact="hide" class="pt-danger" title="Remove this text" aria-label="Remove this text">Remove</button>
              <span class="pt-sep"></span>
              <button data-tact="done" title="Done — hide these controls" aria-label="Done">✕</button>
            </div>
          </div>
          <p class="pt-hint" data-hint>${HINT_DEFAULT}</p>
          <div class="pt-empty" data-empty hidden>
            <span class="mono" style="color:var(--amber)">Collage Maker</span>
            <h2>Create a photo collage</h2>
            <p>Add a few photos and they drop straight into the layout. Then pick a theme, resize sections, add words if you like, and download a print-ready file.</p>
            <div class="pt-empty-actions">
              <button class="btn btn-primary" data-empty-add>+ Add photos</button>
              <button class="btn btn-ghost" data-empty-samples>Try sample photos</button>
            </div>
            <small>JPEG, PNG, WebP or GIF. Large photos are fine — you edit a lighter copy and the original is used for the download. iPhone HEIC files open only in browsers that support them (Safari does; Chrome does not) — convert those to JPEG first. Photos stay on this device.</small>
          </div>
          <div class="pt-draft" data-draft hidden role="region" aria-label="Unfinished collage">
            <div><b>Unfinished collage found</b><span data-draft-meta></span><small>Saved in this browser only — it does not sync to other devices.</small></div>
            <div class="pt-draft-actions">
              <button class="btn btn-primary btn-small" data-draft-restore>Restore</button>
              <button class="btn btn-ghost btn-small" data-draft-discard>Discard</button>
            </div>
          </div>
        </div>

        <div class="pt-bottom">
          <div class="pt-actions">
            <button class="btn btn-primary btn-small" data-add-bottom>+ Add photos</button>
            <button class="btn btn-ghost btn-small" data-undo disabled title="Undo (Ctrl/Cmd+Z)" aria-label="Undo">↺ Undo</button>
            <button class="btn btn-ghost btn-small" data-redo disabled title="Redo (Ctrl/Cmd+Shift+Z)" aria-label="Redo">↻ Redo</button>
            <input type="file" accept="image/*" multiple hidden data-file aria-label="Choose photos">
          </div>
          <div class="pt-export">
            <div class="pt-export-row">
              <label><span class="mono">Size</span><select data-preset aria-label="Export size"></select></label>
              <label><span class="mono">Format</span><select data-format aria-label="Export format">
                <option value="jpeg" ${state.ui.format === 'jpeg' ? 'selected' : ''}>JPEG (smaller)</option>
                <option value="png" ${state.ui.format === 'png' ? 'selected' : ''}>PNG (lossless)</option>
              </select></label>
              <button class="btn btn-primary" data-download>Download</button>
              <span class="pt-sep-v" aria-hidden="true"></span>
              <button class="btn btn-ghost btn-small pt-danger-btn" data-new>New collage</button>
            </div>
            <p class="pt-export-info" data-export-info></p>
            <p class="pt-export-warn" data-export-warn hidden></p>
            <p class="pt-export-status" data-export-status role="status" aria-live="polite" hidden></p>
            <p class="pt-export-done" data-export-done hidden></p>
            <p class="pt-export-error" data-export-error role="alert" hidden></p>
            <p class="pt-export-warn" data-save-note hidden></p>
          </div>
        </div>
      </div>
    </div>
  </div>`;

  const $ = (s) => app.querySelector(s);
  const wrap = $('[data-wrap]'), canvas = $('[data-preview]'), ctx = canvas.getContext('2d');
  const toolbar = $('[data-toolbar]'), textToolbar = $('[data-text-toolbar]');
  const fileInput = $('[data-file]');
  const stage = $('[data-stage]'), layoutRoot = $('[data-layout-root]'), side = $('.pt-side');
  let fileTarget = null;            // cell index a file pick is aimed at
  let cssW = 0, cssH = 0, dpr = 1;
  let raf = 0;
  let lastG = null;
  let drag = null, pinch = null, textDrag = null, cellDrag = null;
  const isDesktop = () => window.matchMedia('(min-width: 901px)').matches;

  /* ---------- tool tabs (desktop: always open; phones: a collapsible sheet) ---------- */
  function showTab(id, { focus = false, toggle = false, keep = false } = {}) {
    const same = state.ui.tab === id;
    if (toggle && same && !isDesktop()) { side.classList.toggle('collapsed'); }
    else { state.ui.tab = id; if (!keep) side.classList.remove('collapsed'); }
    app.querySelectorAll('[role="tab"]').forEach(b => {
      const on = b.dataset.tab === state.ui.tab;
      b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1;
      if (on && focus) b.focus();
    });
    app.querySelectorAll('[data-panel]').forEach(p => { p.hidden = p.dataset.panel !== state.ui.tab; });
    sizeCanvas(); redraw();
  }
  $('.pt-tabs').addEventListener('click', (e) => { const b = e.target.closest('[data-tab]'); if (b) showTab(b.dataset.tab, { toggle: true }); });
  $('.pt-tabs').addEventListener('keydown', (e) => {
    const ids = TABS.map(t => t[0]), k = ids.indexOf(state.ui.tab);
    if (e.key === 'ArrowRight') { e.preventDefault(); showTab(ids[(k + 1) % ids.length], { focus: true }); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); showTab(ids[(k - 1 + ids.length) % ids.length], { focus: true }); }
    if (e.key === 'Home') { e.preventDefault(); showTab(ids[0], { focus: true }); }
    if (e.key === 'End') { e.preventDefault(); showTab(ids[ids.length - 1], { focus: true }); }
  });
  app.querySelectorAll('details[data-open]').forEach(d => d.addEventListener('toggle', () => { state.ui.open[d.dataset.open] = d.open; }));

  /* ---------- sizing ---------- */
  function sizeWorkspace() {
    const topbar = document.querySelector('.topbar');
    layoutRoot.style.height = `${window.innerHeight - (topbar ? topbar.offsetHeight : 0)}px`;
    if (isDesktop()) side.classList.remove('collapsed');
  }
  function sizeCanvas() {
    const ar = currentShape(state).ar;
    const pad = isDesktop() ? 28 : 12, hintRoom = isDesktop() ? 34 : 28;
    const availW = Math.max(120, stage.clientWidth - pad * 2);
    const availH = Math.max(120, stage.clientHeight - pad * 2 - (isDesktop() ? hintRoom : 0));
    cssW = Math.round(Math.min(availW, availH * ar));
    cssH = Math.round(cssW / ar);
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.style.width = `${cssW}px`; canvas.style.height = `${cssH}px`;
    canvas.width = Math.round(cssW * dpr); canvas.height = Math.round(cssH * dpr);
  }

  /* ---------- preview rendering ---------- */
  function draw() {
    raf = 0;
    if (!document.body.contains(canvas)) return;          // view was replaced by navigation
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const g = geometry(cssW, cssH);
    drawBackground(state, ctx, g);
    g.cells.forEach((_, i) => drawCell(state, ctx, g, i, photoById(state, state.cells[i].photoId)?.bmp || null, { preview: true, makeCanvas }));
    drawForeground(state, ctx, g, makeCanvas);

    const preset = presetOf(state);
    const ge = geometry(preset.w, preset.h);
    g.cells.forEach((cell, i) => {
      const q = cellQuality(ge, i);
      if (!q || q.dpi >= 150) return;
      ctx.save(); rotateTo(ctx, cell);
      const r = 9, x = cell.photo.x + cell.photo.w - r - 6, y = cell.photo.y + r + 6;
      ctx.fillStyle = '#e8a33d'; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#12100d'; ctx.font = '700 12px "Hanken Grotesk"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('!', x, y + 0.5);
      ctx.restore();
    });

    lastG = g;
    const tb = state.ui.selectedText && g.textBoxes[state.ui.selectedText];
    if (tb) {
      ctx.save(); ctx.strokeStyle = '#e8a33d'; ctx.lineWidth = 1.5; ctx.setLineDash([5, 4]);
      ctx.strokeRect(tb.x - 6, tb.y - 4, tb.w + 12, tb.h + 8); ctx.restore();
    }
    positionTextToolbar(g);
    const hi = state.ui.swapFrom ?? state.ui.selected;
    if (hi !== null && g.cells[hi]) {
      const cell = g.cells[hi];
      ctx.save(); rotateTo(ctx, cell);
      ctx.strokeStyle = state.ui.swapFrom !== null ? '#7fa650' : '#e8a33d'; ctx.lineWidth = 2.5; ctx.setLineDash([7, 5]);
      ctx.strokeRect(cell.rect.x - 2, cell.rect.y - 2, cell.rect.w + 4, cell.rect.h + 4);
      ctx.restore();
      if (state.ui.swapFrom === null && !drag) drawHandles(ctx, cell);
    }
    positionToolbar(g);
    $('[data-layout-reset]').hidden = !state.cellOv[g.layout.id];
    renderContext(g);
  }
  const redraw = () => { scheduleSave(); if (!raf) raf = document.hidden ? setTimeout(draw, 16) : requestAnimationFrame(draw); };
  function renderSaveStatus() {
    const st = $('[data-save-status]'), note = $('[data-save-note]');
    if (!st) return;
    if (draft.failed) { st.textContent = 'draft autosave off'; note.hidden = false; note.textContent = `⚠ Draft autosave is off — ${draft.failed}. Editing still works; download to keep your work.`; }
    else if (draft.lastSaved) { st.textContent = 'draft saved · this browser only'; note.hidden = true; }
    else { st.textContent = 'photos stay on this device'; note.hidden = true; }
  }
  draft.listeners.clear(); draft.listeners.add(renderSaveStatus);

  /* ---------- floating toolbars on the canvas ---------- */
  function positionTextToolbar(g) {
    const id = state.ui.selectedText, b = id && g.textBoxes[id];
    if (!b || textDrag) { textToolbar.hidden = true; return; }
    textToolbar.hidden = false;
    const above = b.y - 52;
    textToolbar.style.left = `${Math.max(130, Math.min(cssW - 130, b.x + b.w / 2))}px`;
    textToolbar.style.top = `${above > 4 ? above : Math.min(cssH - 44, b.y + b.h + 14)}px`;
  }
  function positionToolbar(g) {
    const i = state.ui.selected;
    if (i === null || state.ui.swapFrom !== null || drag || cellDrag) { toolbar.hidden = true; return; }
    const cell = g.cells[i];
    const hasPhoto = cell.type === 'photo' && !!state.cells[i].photoId;
    const ov = hasCellOv(state, g.layout, i);
    toolbar.querySelectorAll('[data-photo-only]').forEach(b => { b.hidden = !hasPhoto; });
    toolbar.querySelectorAll('[data-empty-only]').forEach(b => { b.hidden = !(cell.type === 'photo' && !hasPhoto); });
    toolbar.querySelectorAll('[data-ov-only]').forEach(b => { b.hidden = !ov; });
    if (!hasPhoto && cell.type !== 'photo' && !ov) { toolbar.hidden = true; return; }
    toolbar.hidden = false;
    const half = Math.hypot(cell.rect.w, cell.rect.h) / 2;
    const top = Math.min(cssH - 44, cell.center.y + (cell.rot ? half * 0.9 : cell.rect.h / 2) + 22);
    toolbar.style.left = `${Math.max(120, Math.min(cssW - 120, cell.center.x))}px`;
    toolbar.style.top = `${top}px`;
  }
  function hitText(x, y) {
    if (!lastG) return null;
    for (const id of Object.keys(lastG.textBoxes).reverse()) {
      const b = lastG.textBoxes[id];
      if (x >= b.x - 6 && x <= b.x + b.w + 6 && y >= b.y - 4 && y <= b.y + b.h + 4) return id;
    }
    return null;
  }

  /* ---------- selection actions (shared by toolbars and the context card) ---------- */
  function deselect() { state.ui.selected = null; state.ui.selectedText = null; state.ui.swapFrom = null; }
  function textAction(act) {
    const id = state.ui.selectedText; if (!id) return;
    const ov = textOv(state, id);
    if (act !== 'done') commit();
    if (act === 'bigger') setTextOv(state, id, { scale: Math.min(3, ov.scale * 1.12) });
    else if (act === 'smaller') setTextOv(state, id, { scale: Math.max(0.4, ov.scale / 1.12) });
    else if (act === 'reset') delete state.textOv[id];
    else if (act === 'hide') { setTextOv(state, id, { hidden: true }); state.ui.selectedText = null; }
    else if (act === 'done') state.ui.selectedText = null;
    else if (act.startsWith('nudge-')) {
      const [, dir] = act.split('-'); const step = 0.02;
      setTextOv(state, id, { dx: ov.dx + (dir === 'l' ? -step : dir === 'r' ? step : 0), dy: ov.dy + (dir === 'u' ? -step : dir === 'd' ? step : 0) });
    }
    renderSlots(); redraw();
  }
  function cellAction(act) {
    const i = state.ui.selected; if (i === null) return;
    const c = state.cells[i] || {};
    if (['zoom-in', 'zoom-out', 'reset-cell'].includes(act) || act.startsWith('crop-')) commit();
    switch (act) {
      case 'zoom-in': c.zoom = Math.min(4, c.zoom * 1.15); break;
      case 'zoom-out': c.zoom = Math.max(1, c.zoom / 1.15); break;
      case 'up': { const ps = photoCellIndices(state), k = ps.indexOf(i); if (k > 0) { swapCells(i, ps[k - 1]); state.ui.selected = ps[k - 1]; } break; }
      case 'down': { const ps = photoCellIndices(state), k = ps.indexOf(i); if (k < ps.length - 1) { swapCells(i, ps[k + 1]); state.ui.selected = ps[k + 1]; } break; }
      case 'swap': state.ui.swapFrom = i; $('[data-hint]').textContent = 'Swap mode — click the section to swap with (click the same section to cancel).'; break;
      case 'replace': case 'add': fileTarget = i; fileInput.click(); break;
      case 'clear': clearCell(i); break;
      case 'reset-cell': clearCellOv(state, currentLayout(state), i); renderLayouts(); break;
      case 'done': deselect(); break;
      case 'crop-l': c.panX = Math.max(0, c.panX - 0.05); break;
      case 'crop-r': c.panX = Math.min(1, c.panX + 0.05); break;
      case 'crop-u': c.panY = Math.max(0, c.panY - 0.05); break;
      case 'crop-d': c.panY = Math.min(1, c.panY + 0.05); break;
    }
    afterChange();
  }
  toolbar.addEventListener('click', (e) => { const act = e.target.closest('[data-act]')?.dataset.act; if (act) cellAction(act); });
  textToolbar.addEventListener('click', (e) => { const act = e.target.closest('[data-tact]')?.dataset.tact; if (act) textAction(act); });

  // the contextual card mirrors the floating toolbars for keyboard and phone users
  function renderContext(g) {
    const box = $('[data-context]');
    const i = state.ui.selected, tid = state.ui.selectedText;
    if ((i !== null || tid) && !isDesktop() && box.hidden) side.classList.remove('collapsed');   // phones: open the sheet so the controls are reachable
    if (tid) {
      const slot = slotsFor(currentTheme(state), currentLayout(state)).find(x => x.id === tid);
      const ov = textOv(state, tid);
      box.hidden = false;
      box.innerHTML = `
        <div class="pt-ctx-head"><span class="mono">Selected text</span><b>${esc(slot ? slot.label : tid)}</b></div>
        <div class="pt-ctx-row" role="group" aria-label="Text size">
          <button class="chip" data-ctx-t="smaller" aria-label="Smaller text">A−</button><button class="chip" data-ctx-t="bigger" aria-label="Bigger text">A+</button>
          <span class="mono pt-ctx-val">${Math.round(ov.scale * 100)}%</span>
        </div>
        <div class="pt-ctx-row" role="group" aria-label="Nudge position">
          <button class="chip" data-ctx-t="nudge-l" aria-label="Nudge left">◀</button><button class="chip" data-ctx-t="nudge-u" aria-label="Nudge up">▲</button><button class="chip" data-ctx-t="nudge-d" aria-label="Nudge down">▼</button><button class="chip" data-ctx-t="nudge-r" aria-label="Nudge right">▶</button>
          <span style="flex:1"></span><button class="chip" data-ctx-t="reset">↺ reset</button>
        </div>
        <div class="pt-ctx-row"><button class="chip pt-danger" data-ctx-t="hide">remove text</button><span style="flex:1"></span><button class="chip" data-ctx-t="done">done</button></div>`;
      return;
    }
    if (i === null || !g.cells[i]) { box.hidden = true; box.innerHTML = ''; return; }
    const cell = g.cells[i], c = state.cells[i], p = c.photoId ? photoById(state, c.photoId) : null;
    const ov = hasCellOv(state, g.layout, i);
    box.hidden = false;
    if (cell.type !== 'photo') {
      box.innerHTML = `<div class="pt-ctx-head"><span class="mono">Selected section ${i + 1}</span><b>${cell.type === 'text' ? 'Words panel' : 'Colour swatches'}</b></div>
        <div class="pt-ctx-row">${ov ? '<button class="chip" data-ctx-c="reset-cell">↔ reset size</button>' : '<span class="pt-note" style="margin:0">Drag its handles on the canvas to resize.</span>'}<span style="flex:1"></span><button class="chip" data-ctx-c="done">done</button></div>`;
      return;
    }
    if (!p) {
      box.innerHTML = `<div class="pt-ctx-head"><span class="mono">Selected section ${i + 1}</span><b>Empty</b></div>
        <div class="pt-ctx-row"><button class="chip on" data-ctx-c="add">+ add a photo here</button>${ov ? '<button class="chip" data-ctx-c="reset-cell">↔ reset size</button>' : ''}<span style="flex:1"></span><button class="chip" data-ctx-c="done">done</button></div>`;
      return;
    }
    box.innerHTML = `
      <div class="pt-ctx-head"><span class="mono">Selected photo · section ${i + 1}</span><b title="${esc(p.name)}">${esc(p.name)}</b></div>
      <label class="pt-range"><span class="mono">Zoom</span><input type="range" data-ctx-zoom min="100" max="400" value="${Math.round(c.zoom * 100)}" aria-label="Zoom photo inside its section"><output>${Math.round(c.zoom * 100)}%</output></label>
      <div class="pt-ctx-row" role="group" aria-label="Move the crop">
        <span class="mono pt-ctx-label">Crop</span>
        <button class="chip" data-ctx-c="crop-l" aria-label="Show more of the left">◀</button><button class="chip" data-ctx-c="crop-u" aria-label="Show more of the top">▲</button><button class="chip" data-ctx-c="crop-d" aria-label="Show more of the bottom">▼</button><button class="chip" data-ctx-c="crop-r" aria-label="Show more of the right">▶</button>
      </div>
      <div class="pt-ctx-row" role="group" aria-label="Order and placement">
        <button class="chip" data-ctx-c="up" aria-label="Move to previous section">↑ prev</button><button class="chip" data-ctx-c="down" aria-label="Move to next section">↓ next</button>
        <button class="chip" data-ctx-c="swap">⇄ swap…</button><button class="chip" data-ctx-c="replace">replace</button>${ov ? '<button class="chip" data-ctx-c="reset-cell">↔ reset size</button>' : ''}
      </div>
      <div class="pt-ctx-row"><button class="chip pt-danger" data-ctx-c="clear">clear section</button><span style="flex:1"></span><button class="chip" data-ctx-c="done">done</button></div>`;
  }
  $('[data-context]').addEventListener('click', (e) => {
    const c = e.target.closest('[data-ctx-c]'), t = e.target.closest('[data-ctx-t]');
    if (c) cellAction(c.dataset.ctxC); else if (t) textAction(t.dataset.ctxT);
  });
  $('[data-context]').addEventListener('input', (e) => {
    const z = e.target.closest('[data-ctx-zoom]'); if (!z || state.ui.selected === null) return;
    coalesce('zoom:' + state.ui.selected); state.cells[state.ui.selected].zoom = +z.value / 100; z.nextElementSibling.textContent = `${z.value}%`; redraw();
  });
  $('[data-context]').addEventListener('change', (e) => { if (e.target.closest('[data-ctx-zoom]')) { history.end(state); updateExport(); } });

  /* ---------- history helpers ---------- */
  const coalesceTimers = {};
  function coalesce(key, ms = 600) {
    history.begin(state);
    clearTimeout(coalesceTimers[key]);
    coalesceTimers[key] = setTimeout(() => { history.end(state); updateExport(); }, ms);
  }
  async function refreshAll() {
    $('[data-themes]').querySelectorAll('[data-theme]').forEach(b => b.classList.toggle('on', b.dataset.theme === state.themeId));
    $('[data-shapes]').querySelectorAll('[data-shape]').forEach(b => b.classList.toggle('on', b.dataset.shape === state.shapeId));
    $('[data-accent]').value = accentColor(state);
    $('[data-spacing]').value = state.spacing; $('[data-spacing-out]').textContent = state.spacing;
    renderHideAll();
    sizeCanvas();
    await ensureFonts(styledTheme(state));
    renderLayouts(); renderSlots(); afterChange();
  }
  function doUndo() { if (history.undo(state)) refreshAll(); }
  function doRedo() { if (history.redo(state)) refreshAll(); }

  /* ---------- styles ---------- */
  const bar = (stripes) => `<span class="pt-bar">${stripes.map(c => `<i style="background:${c}"></i>`).join('')}</span>`;
  function renderStyles() {
    const st = state.style;
    $('[data-combos]').innerHTML = COMBOS.map(c => {
      const p = PALETTES.find(x => x.id === c.palette), f = FONT_SETS.find(x => x.id === c.font);
      const on = st.palette?.id === p.id && st.font?.id === f.id;
      return `<button class="pt-combo ${on ? 'on' : ''}" data-combo="${p.id}|${f.id}" aria-pressed="${on}">${bar(p.stripes)}
        <b style="font-family:'${f.display.family}';font-style:${f.display.italic ? 'italic' : 'normal'};font-weight:${f.display.weight}">${p.name}</b>
        <span style="font-family:'${f.body.family}'">${f.body.family}</span></button>`;
    }).join('');
    $('[data-palettes]').innerHTML = PALETTES.map(p =>
      `<button class="pt-pal ${st.palette?.id === p.id ? 'on' : ''}" data-palette="${p.id}" title="${p.name}" aria-pressed="${st.palette?.id === p.id}">${bar(p.stripes)}<span>${p.name}</span></button>`).join('');
    const imgs = state.photos.map(imagePalette);
    $('[data-imgpal]').innerHTML = imgs.length
      ? imgs.map(p => `<button class="pt-imgpal ${st.palette?.id === p.id ? 'on' : ''}" data-imgpalette="${p.id}" title="${esc(p.name)}" aria-label="Palette from ${esc(p.name)}" aria-pressed="${st.palette?.id === p.id}">${bar(p.stripes)}<canvas width="72" height="46" data-photo="${p.id.slice(4)}"></canvas></button>`).join('')
      : '<span class="pt-tray-empty">Add photos to get palettes drawn from them.</span>';
    $('[data-imgpal]').querySelectorAll('canvas[data-photo]').forEach(c => {
      const p = photoById(state, +c.dataset.photo); if (!p) return;
      const cx = c.getContext('2d'), k = Math.max(72 / p.bmp.width, 46 / p.bmp.height);
      cx.drawImage(p.bmp, (72 - p.bmp.width * k) / 2, (46 - p.bmp.height * k) / 2, p.bmp.width * k, p.bmp.height * k);
    });
    $('[data-fonts]').innerHTML = FONT_SETS.map(f =>
      `<button class="pt-font ${st.font?.id === f.id ? 'on' : ''}" data-fontset="${f.id}" aria-pressed="${st.font?.id === f.id}">
        <b style="font-family:'${f.display.family}';font-style:${f.display.italic ? 'italic' : 'normal'};font-weight:${f.display.weight}">${f.display.family}</b>
        <span style="font-family:'${f.body.family}'">${f.body.family}</span></button>`).join('');
    FONT_SETS.forEach(f => ensureFonts({ font: f.display, body: f.body }));
  }
  async function applyStyleChange() {
    await ensureFonts(styledTheme(state));
    $('[data-accent]').value = accentColor(state);
    renderStyles(); renderLayouts(); redraw();
  }
  $('[data-combos]').addEventListener('click', (e) => {
    const b = e.target.closest('[data-combo]'); if (!b) return;
    const [pid, fid] = b.dataset.combo.split('|');
    commit(); state.style = { palette: PALETTES.find(p => p.id === pid), font: FONT_SETS.find(f => f.id === fid) }; state.accent = null; applyStyleChange();
  });
  $('[data-palettes]').addEventListener('click', (e) => {
    const b = e.target.closest('[data-palette]'); if (!b) return;
    commit(); state.style.palette = PALETTES.find(p => p.id === b.dataset.palette); state.accent = null; applyStyleChange();
  });
  $('[data-imgpal]').addEventListener('click', (e) => {
    const b = e.target.closest('[data-imgpalette]'); if (!b) return;
    const p = photoById(state, +b.dataset.imgpalette.slice(4)); if (!p) return;
    commit(); state.style.palette = imagePalette(p); state.accent = null; applyStyleChange();
  });
  $('[data-fonts]').addEventListener('click', (e) => {
    const b = e.target.closest('[data-fontset]'); if (!b) return;
    commit(); state.style.font = FONT_SETS.find(f => f.id === b.dataset.fontset); applyStyleChange();
  });
  $('[data-style-reset]').addEventListener('click', () => { commit(); state.style = { palette: null, font: null }; state.accent = null; applyStyleChange(); });
  $('[data-themes]').addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-theme]'); if (!btn) return;
    setTheme(btn.dataset.theme);
    $('[data-themes]').querySelectorAll('.pt-chip').forEach(b => b.classList.toggle('on', b === btn));
    $('[data-accent]').value = accentColor(state);
    await ensureFonts(styledTheme(state));
    renderLayouts(); renderSlots(); afterChange();
  });
  $('[data-accent]').addEventListener('input', (e) => { coalesce('accent'); state.accent = e.target.value; renderLayouts(); redraw(); });
  $('[data-accent-reset]').addEventListener('click', () => { commit(); state.accent = null; $('[data-accent]').value = accentColor(state); renderLayouts(); redraw(); });

  /* ---------- layout panel ---------- */
  function visibleLayouts() {
    const f = state.ui.layoutFilter;
    if (f === 'suggested') {
      const sug = suggestedLayouts(state, state.photos.length);
      if (!sug.some(l => l.id === state.layoutId)) sug.push(currentLayout(state));
      return sug;
    }
    if (f === 'all') return LAYOUTS;
    return LAYOUTS.filter(l => (l.group || 'classic') === f);
  }
  function renderLayouts() {
    const box = $('[data-layouts]');
    const theme = styledTheme(state), shape = currentShape(state);
    const list = visibleLayouts();
    layoutsFor = state.photos.length;
    const n = state.photos.length;
    box.innerHTML = (state.ui.layoutFilter === 'suggested' ? `<div class="pt-group mono">${n ? `Good fits for ${n} photo${n > 1 ? 's' : ''}` : 'Popular picks'} · <button class="pt-link" data-filter="all">view all ${LAYOUTS.length}</button></div>` : '') +
      list.map(l => `
      <button class="pt-layout-btn ${l.id === state.layoutId ? 'on' : ''}" data-layout="${l.id}" title="${l.desc}" aria-pressed="${l.id === state.layoutId}">
        <canvas width="${Math.round(88 * (shape.ar >= 1 ? 1 : shape.ar))}" height="${Math.round(88 * (shape.ar >= 1 ? 1 / shape.ar : 1))}" aria-hidden="true"></canvas>
        <span>${theme.suggested.includes(l.id) ? '★ ' : ''}${l.name}</span>
      </button>`).join('');
    box.querySelectorAll('[data-layout]').forEach(btn => {
      const c = btn.querySelector('canvas'), cx = c.getContext('2d');
      const layout = LAYOUTS.find(l => l.id === btn.dataset.layout);
      const g = geometry(c.width, c.height, { layout });
      cx.fillStyle = theme.palette.bg; cx.fillRect(0, 0, c.width, c.height);
      cx.fillStyle = isDark(theme.palette.bg) ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.1)';
      cx.fillRect(g.band.x, g.band.y, g.band.w, g.band.h);
      const ink = isDark(theme.palette.bg) ? 'rgba(255,255,255,.28)' : 'rgba(0,0,0,.18)';
      g.cells.forEach(cell => {
        cx.save(); rotateTo(cx, cell);
        cx.globalAlpha = 0.85; cx.fillStyle = cell.type === 'photo' ? accentColor(state) : ink;
        cx.fillRect(cell.rect.x, cell.rect.y, cell.rect.w, cell.rect.h);
        cx.restore();
      });
      btn.addEventListener('click', () => { setLayout(btn.dataset.layout); renderLayouts(); renderSlots(); afterChange(); });
    });
    app.querySelectorAll('[data-layout-filters] [data-filter]').forEach(b => b.classList.toggle('on', b.dataset.filter === state.ui.layoutFilter));
  }
  app.addEventListener('click', (e) => {
    const f = e.target.closest('[data-filter]'); if (!f || !f.closest('[data-panel="layout"]')) return;
    state.ui.layoutFilter = f.dataset.filter; renderLayouts();
  });
  $('[data-shapes]').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-shape]'); if (!btn) return;
    setShape(btn.dataset.shape);
    $('[data-shapes]').querySelectorAll('.pt-chip').forEach(b => b.classList.toggle('on', b === btn));
    sizeCanvas(); renderLayouts(); afterChange();
  });
  $('[data-layout-reset]').addEventListener('click', () => { commit(); clearCellOv(state, currentLayout(state)); renderLayouts(); afterChange(); });
  $('[data-spacing]').addEventListener('input', (e) => { coalesce('spacing'); state.spacing = +e.target.value; $('[data-spacing-out]').textContent = state.spacing; redraw(); });
  $('[data-spacing]').addEventListener('change', () => { history.end(state); renderLayouts(); updateExport(); });

  /* ---------- text panel ---------- */
  function renderHideAll() {
    const b = $('[data-hide-all]');
    b.textContent = state.ui.hideText ? 'turn words on' : 'words on'; b.classList.toggle('on', !state.ui.hideText); b.setAttribute('aria-checked', String(!state.ui.hideText));
  }
  function renderSlots() {
    const theme = currentTheme(state);
    $('[data-slots]').innerHTML = slotsFor(theme, currentLayout(state)).map(s => {
      const ov = textOv(state, s.id), changed = ov.dx || ov.dy || ov.scale !== 1;
      return `
      <div class="pt-slot ${ov.hidden ? 'off' : ''}">
        <label class="field pt-field"><span>${s.label}</span>
          <input type="text" data-slot="${s.id}" value="${esc(slotText(state, s))}" maxlength="${s.style === 'numeral' ? 6 : 80}" placeholder="${esc(s.default)}">
        </label>
        <div class="pt-slot-actions">
          <button class="chip ${ov.hidden ? '' : 'on'}" data-slot-toggle="${s.id}" role="switch" aria-checked="${!ov.hidden}" aria-label="${s.label} ${ov.hidden ? 'hidden' : 'shown'}">${ov.hidden ? 'show' : 'on'}</button>
          <button class="chip" data-slot-adjust="${s.id}" ${ov.hidden || state.ui.hideText ? 'disabled' : ''} aria-label="Adjust ${s.label} size and position">adjust</button>
          <button class="chip" data-slot-reset="${s.id}" title="Reset position & size" aria-label="Reset ${s.label} position and size" ${changed ? '' : 'disabled'}>↺</button>
        </div>
      </div>`;
    }).join('');
    $('[data-slots]').querySelectorAll('[data-slot]').forEach(inp => inp.addEventListener('input', () => {
      coalesce('text:' + inp.dataset.slot, 800);
      state.texts[inp.dataset.slot] = inp.value;
      redraw();
    }));
  }
  $('[data-slots]').addEventListener('click', (e) => {
    const t = e.target.closest('[data-slot-toggle]'), r = e.target.closest('[data-slot-reset]'), a = e.target.closest('[data-slot-adjust]');
    if (a) { state.ui.selected = null; state.ui.selectedText = a.dataset.slotAdjust; redraw(); return; }
    if (t || r) commit();
    if (t) { setTextOv(state, t.dataset.slotToggle, { hidden: !textOv(state, t.dataset.slotToggle).hidden }); if (state.ui.selectedText === t.dataset.slotToggle) state.ui.selectedText = null; }
    else if (r) { delete state.textOv[r.dataset.slotReset]; }
    else return;
    renderSlots(); redraw();
  });
  $('[data-hide-all]').addEventListener('click', () => {
    commit(); state.ui.hideText = !state.ui.hideText; state.ui.selectedText = null;
    renderHideAll(); renderLayouts(); renderSlots(); afterChange();
  });

  /* ---------- photos panel ---------- */
  function renderPhotos() {
    renderStyles();                       // image palettes follow the photos
    const box = $('[data-photos]');
    box.innerHTML = '';
    if (!state.photos.length) { box.innerHTML = '<p class="pt-tray-empty">No photos yet. Add some, or try the samples.</p>'; return; }
    state.photos.forEach(p => {
      const inCell = state.cells.findIndex(c => c.photoId === p.id);
      const selected = inCell >= 0 && state.ui.selected === inCell;
      const el = document.createElement('button');
      el.type = 'button';
      el.className = `pt-thumb ${inCell >= 0 ? 'placed' : ''} ${selected ? 'sel' : ''}`;
      el.title = inCell >= 0 ? `${p.name} — section ${inCell + 1}. Click to select it.` : `${p.name} — not placed. Click to place it.`;
      el.setAttribute('aria-label', el.title); el.setAttribute('aria-pressed', String(selected));
      const c = makeCanvas(72, 72), cx = c.getContext('2d');
      const k = Math.max(72 / p.bmp.width, 72 / p.bmp.height);
      cx.drawImage(p.bmp, (72 - p.bmp.width * k) / 2, (72 - p.bmp.height * k) / 2, p.bmp.width * k, p.bmp.height * k);
      el.appendChild(c);
      if (inCell >= 0) { const b = document.createElement('i'); b.textContent = inCell + 1; el.appendChild(b); }
      const rm = document.createElement('span'); rm.className = 'pt-thumb-remove'; rm.setAttribute('role', 'button'); rm.tabIndex = 0;
      rm.textContent = '✕'; rm.title = `Remove ${p.name}`; rm.setAttribute('aria-label', rm.title);
      const remove = (e) => { e.preventDefault(); e.stopPropagation(); removePhoto(p.id); if (state.ui.selected !== null && !state.cells[state.ui.selected]) deselect(); afterChange(); };
      rm.addEventListener('click', remove);
      rm.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') remove(e); });
      el.appendChild(rm);
      el.addEventListener('click', () => {
        if (inCell >= 0) { state.ui.selectedText = null; state.ui.selected = inCell; afterChange(); return; }
        let idx = state.ui.selected;
        if (idx === null || !isPhotoCell(state, idx)) idx = firstEmptyPhotoCell(state);
        if (idx < 0) idx = photoCellIndices(state)[0];
        assignPhoto(idx, p.id);
        state.ui.selected = idx; state.ui.selectedText = null;
        afterChange();
      });
      box.appendChild(el);
    });
  }

  /* ---------- export bar ---------- */
  function updateExport() {
    const shape = currentShape(state);
    const presets = exportPresets(shape);
    const sel = $('[data-preset]');
    sel.innerHTML = presets.map(p => `<option value="${p.id}" ${p.id === state.ui.preset ? 'selected' : ''}>${p.label} — ${p.w} × ${p.h}</option>`).join('');
    const p = presetOf(state);
    $('[data-export-info]').textContent = `${p.w} × ${p.h} px · prints ${(p.w / 300).toFixed(1)} × ${(p.h / 300).toFixed(1)} in at 300 DPI · ${p.note}`;
    const ge = geometry(p.w, p.h);
    const soft = state.cells.map((_, i) => cellQuality(ge, i)).filter(q => q && q.dpi < 150).length;
    const warn = $('[data-export-warn]');
    warn.hidden = !soft;
    if (soft) warn.textContent = `⚠ ${soft} photo${soft > 1 ? 's' : ''} fall${soft > 1 ? '' : 's'} below 150 DPI at this size (marked ! on the preview) — zoom out, use a smaller size, or expect softness in print.`;
    $('[data-download]').disabled = !state.photos.length;
    $('[data-undo]').disabled = !history.canUndo;
    $('[data-redo]').disabled = !history.canRedo;
    const done = $('[data-export-done]');
    if (state.ui.lastExport) {
      const r = state.ui.lastExport;
      done.hidden = false;
      done.textContent = `Saved ${r.name} — ${r.W} × ${r.H} px (${(r.W / 300).toFixed(1)} × ${(r.H / 300).toFixed(1)} in at 300 DPI)` +
        (r.reduced ? ` · rendered below the requested ${r.requested.w} × ${r.requested.h} because this device ran out of canvas memory.` : '');
    } else done.hidden = true;
  }
  function renderEmpty() { $('[data-empty]').hidden = state.photos.length > 0 || !$('[data-draft]').hidden; }
  let layoutsFor = -1;                                    // photo count the layout list was built for
  function afterChange() {
    renderPhotos(); updateExport(); renderEmpty();
    if (state.ui.layoutFilter === 'suggested' && layoutsFor !== state.photos.length) renderLayouts();
    redraw();
  }
  async function useSamples() {
    $('[data-hint]').textContent = 'Loading sample photos…';
    const files = await loadSamplePhotos();
    if (files.length) { commit(); await addPhotos(files); }
    $('[data-hint]').textContent = files.length ? `Sample photos placed — ${HINT_DEFAULT}` : 'Sample photos could not be loaded.';
    afterChange();
  }
  $('[data-empty-add]').addEventListener('click', () => { fileTarget = null; fileInput.click(); });
  $('[data-empty-samples]').addEventListener('click', useSamples);
  $('[data-samples]').addEventListener('click', useSamples);
  $('[data-add]').addEventListener('click', () => { fileTarget = null; fileInput.click(); });
  $('[data-add-bottom]').addEventListener('click', () => { fileTarget = null; fileInput.click(); });

  /* ---------- section handles (resize / move) ---------- */
  const HANDLE_R = 7;
  function cellHandles(cell) {
    const r = cell.rect, cx = cell.center.x, cy = cell.center.y;
    const local = cell.rot
      ? [['nw', r.x, r.y], ['ne', r.x + r.w, r.y], ['se', r.x + r.w, r.y + r.h], ['sw', r.x, r.y + r.h]]
      : [['nw', r.x, r.y], ['n', cx, r.y], ['ne', r.x + r.w, r.y], ['e', r.x + r.w, cy], ['se', r.x + r.w, r.y + r.h], ['s', cx, r.y + r.h], ['sw', r.x, r.y + r.h], ['w', r.x, cy]];
    local.push(['move', cx, r.y - 22]);
    const cs = Math.cos(cell.rot), sn = Math.sin(cell.rot);
    return local.map(([id, x, y]) => { const dx = x - cx, dy = y - cy; return { id, x: cx + dx * cs - dy * sn, y: cy + dx * sn + dy * cs }; });
  }
  function drawHandles(ctx, cell) {
    for (const h of cellHandles(cell)) {
      ctx.save(); ctx.beginPath();
      if (h.id === 'move') { ctx.arc(h.x, h.y, HANDLE_R + 3, 0, Math.PI * 2); ctx.fillStyle = '#e8a33d'; ctx.fill(); ctx.fillStyle = '#12100d'; ctx.font = '700 11px "Hanken Grotesk"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('✥', h.x, h.y + 0.5); }
      else { ctx.rect(h.x - HANDLE_R + 1, h.y - HANDLE_R + 1, HANDLE_R * 2 - 2, HANDLE_R * 2 - 2); ctx.fillStyle = '#e8a33d'; ctx.strokeStyle = '#12100d'; ctx.lineWidth = 1.5; ctx.fill(); ctx.stroke(); }
      ctx.restore();
    }
  }
  function hitHandle(x, y) {
    const i = state.ui.selected;
    if (i === null || !lastG || !lastG.cells[i]) return null;
    for (const h of cellHandles(lastG.cells[i])) if (Math.hypot(x - h.x, y - h.y) <= HANDLE_R + 5) return h.id;
    return null;
  }
  function beginCellDrag(kind, pt) {
    const i = state.ui.selected, g = lastG, cell = g.cells[i];
    const d = cellDef(state, g.layout, i);
    cellDrag = { i, kind, startX: pt.x, startY: pt.y, def0: { x: d.x, y: d.y, w: d.w, h: d.h }, center: cell.center, rot: cell.rot, content: g.content,
                 r0: Math.hypot(pt.x - cell.center.x, pt.y - cell.center.y), polaroid: !!cell.polaroid };
  }
  function applyCellDrag(pt) {
    const { i, kind, def0, content, rot, polaroid } = cellDrag;
    const layout = currentLayout(state);
    const dxn = (pt.x - cellDrag.startX) / content.w, dyn = (pt.y - cellDrag.startY) / content.h;
    const MIN = 0.06;
    let { x, y, w, h } = def0;
    if (kind === 'move') {
      x = def0.x + dxn; y = def0.y + dyn;
      if (!polaroid) { x = Math.max(0, Math.min(1 - w, x)); y = Math.max(0, Math.min(1 - h, y)); }
      else { x = Math.max(0.05, Math.min(0.95, x)); y = Math.max(0.05, Math.min(0.95, y)); }
      setCellOv(state, layout, i, { x, y }); return;
    }
    if (rot || polaroid) {
      const f = Math.max(0.3, Math.min(3, Math.hypot(pt.x - cellDrag.center.x, pt.y - cellDrag.center.y) / Math.max(1, cellDrag.r0)));
      const nw = Math.max(MIN, def0.w * f);
      if (polaroid) setCellOv(state, layout, i, { w: nw });
      else { const nh = Math.max(MIN, def0.h * f); setCellOv(state, layout, i, { w: nw, h: nh, x: def0.x + (def0.w - nw) / 2, y: def0.y + (def0.h - nh) / 2 }); }
      return;
    }
    if (kind.includes('e')) w = Math.max(MIN, Math.min(1 - x, def0.w + dxn));
    if (kind.includes('s')) h = Math.max(MIN, Math.min(1 - y, def0.h + dyn));
    if (kind.includes('w')) { const nx = Math.max(0, Math.min(def0.x + def0.w - MIN, def0.x + dxn)); w = def0.x + def0.w - nx; x = nx; }
    if (kind.includes('n')) { const ny = Math.max(0, Math.min(def0.y + def0.h - MIN, def0.y + dyn)); h = def0.y + def0.h - ny; y = ny; }
    setCellOv(state, layout, i, { x, y, w, h });
  }

  /* ---------- pointer interaction on the preview ---------- */
  function hitTest(x, y) {
    const g = geometry(cssW, cssH);
    for (let i = g.cells.length - 1; i >= 0; i--) {
      const cell = g.cells[i];
      const dx = x - cell.center.x, dy = y - cell.center.y;
      const cos = Math.cos(-cell.rot), sin = Math.sin(-cell.rot);
      const lx = dx * cos - dy * sin, ly = dx * sin + dy * cos;
      if (Math.abs(lx) <= cell.rect.w / 2 && Math.abs(ly) <= cell.rect.h / 2) return i;
    }
    return -1;
  }
  const pointers = new Map();
  const pos = (e) => { const b = canvas.getBoundingClientRect(); return { x: e.clientX - b.left, y: e.clientY - b.top }; };

  canvas.addEventListener('pointerdown', (e) => {
    try { canvas.setPointerCapture(e.pointerId); } catch { /* synthetic or already-released pointer */ }
    const pt = pos(e);
    pointers.set(e.pointerId, pt);
    if (pointers.size === 2 && drag) {
      const [a, b] = [...pointers.values()];
      pinch = { i: drag.i, dist: Math.hypot(a.x - b.x, a.y - b.y), zoom: state.cells[drag.i].zoom };
      drag = null;
      return;
    }
    const hk = state.ui.swapFrom === null ? hitHandle(pt.x, pt.y) : null;
    if (hk) { history.begin(state); beginCellDrag(hk, pt); redraw(); return; }
    const tid = state.ui.swapFrom === null ? hitText(pt.x, pt.y) : null;
    if (tid) {
      state.ui.selectedText = tid; state.ui.selected = null;
      history.begin(state);
      textDrag = { id: tid, startX: pt.x, startY: pt.y, dx0: textOv(state, tid).dx, dy0: textOv(state, tid).dy };
      redraw(); return;
    }
    state.ui.selectedText = null;
    const i = hitTest(pt.x, pt.y);
    if (i < 0) { state.ui.selected = null; state.ui.swapFrom = null; redraw(); return; }
    if (state.ui.swapFrom !== null) {
      swapCells(state.ui.swapFrom, i);
      state.ui.selected = i; state.ui.swapFrom = null;
      $('[data-hint]').textContent = `Swapped. ${HINT_DEFAULT}`;
      afterChange();
      return;
    }
    const c = state.cells[i];
    if (!isPhotoCell(state, i)) { state.ui.selected = i; redraw(); return; }
    if (!c.photoId) { fileTarget = i; state.ui.selected = i; fileInput.click(); redraw(); return; }
    const g = geometry(cssW, cssH);
    const p = photoById(state, c.photoId);
    const f = fitPhoto(g.cells[i].photo, p.bmp.width, p.bmp.height, c);
    history.begin(state);
    drag = { i, startX: pt.x, startY: pt.y, panX: c.panX, panY: c.panY, moved: false,
             overX: f.dw - g.cells[i].photo.w, overY: f.dh - g.cells[i].photo.h, rot: g.cells[i].rot };
    state.ui.selected = i;
    redraw();
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!pointers.has(e.pointerId)) return;
    const pt = pos(e);
    pointers.set(e.pointerId, pt);
    if (pinch && pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      state.cells[pinch.i].zoom = Math.min(4, Math.max(1, pinch.zoom * d / pinch.dist));
      redraw(); return;
    }
    if (cellDrag) { applyCellDrag(pt); redraw(); return; }
    if (textDrag) {
      setTextOv(state, textDrag.id, { dx: textDrag.dx0 + (pt.x - textDrag.startX) / cssW, dy: textDrag.dy0 + (pt.y - textDrag.startY) / cssH });
      redraw(); return;
    }
    if (!drag) return;
    const dx = pt.x - drag.startX, dy = pt.y - drag.startY;
    if (Math.hypot(dx, dy) > 3) drag.moved = true;
    const cos = Math.cos(-drag.rot), sin = Math.sin(-drag.rot);
    const lx = dx * cos - dy * sin, ly = dx * sin + dy * cos;
    const c = state.cells[drag.i];
    if (drag.overX > 0) c.panX = Math.min(1, Math.max(0, drag.panX - lx / drag.overX));
    if (drag.overY > 0) c.panY = Math.min(1, Math.max(0, drag.panY - ly / drag.overY));
    redraw();
  });
  const endPointer = (e) => {
    pointers.delete(e.pointerId);
    if ((cellDrag || textDrag || drag || pinch) && pointers.size === 0) history.end(state);
    if (cellDrag) { cellDrag = null; renderLayouts(); updateExport(); redraw(); }
    if (textDrag) { textDrag = null; renderSlots(); redraw(); }
    if (pinch && pointers.size < 2) { pinch = null; updateExport(); }
    if (drag) { drag = null; updateExport(); redraw(); }
  };
  canvas.addEventListener('pointerup', endPointer);
  canvas.addEventListener('pointercancel', endPointer);
  canvas.addEventListener('wheel', (e) => {
    const pt = pos(e);
    const i = hitTest(pt.x, pt.y);
    if (i < 0 || !state.cells[i].photoId) return;
    e.preventDefault();
    coalesce('wheel:' + i, 500);
    const c = state.cells[i];
    c.zoom = Math.min(4, Math.max(1, c.zoom * (e.deltaY < 0 ? 1.06 : 0.94)));
    state.ui.selected = i;
    redraw(); updateExport();
  }, { passive: false });
  stage.addEventListener('pointerdown', (e) => { if (!wrap.contains(e.target) && !e.target.closest('.pt-draft, .pt-empty')) { deselect(); redraw(); } });
  const onKey = (e) => {
    if (!document.body.contains(canvas)) { document.removeEventListener('keydown', onKey); return; }
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) && e.target.type !== 'range';
    if (e.key === 'Escape' && (state.ui.selected !== null || state.ui.selectedText)) { deselect(); redraw(); return; }
    if (typing) return;
    const mod = e.metaKey || e.ctrlKey;
    if (mod && !e.shiftKey && e.key.toLowerCase() === 'z') { e.preventDefault(); doUndo(); }
    else if (mod && ((e.shiftKey && e.key.toLowerCase() === 'z') || e.key.toLowerCase() === 'y')) { e.preventDefault(); doRedo(); }
  };
  document.addEventListener('keydown', onKey);

  /* ---------- files ---------- */
  fileInput.addEventListener('change', async () => {
    const files = [...fileInput.files];
    fileInput.value = '';
    if (!files.length) return;
    $('[data-hint]').textContent = 'Loading photos…';
    commit();
    await addPhotos(files, fileTarget);
    fileTarget = null;
    $('[data-hint]').textContent = HINT_DEFAULT;
    afterChange();
  });
  wrap.addEventListener('dragover', (e) => { e.preventDefault(); wrap.classList.add('drop'); });
  wrap.addEventListener('dragleave', () => wrap.classList.remove('drop'));
  wrap.addEventListener('drop', async (e) => {
    e.preventDefault(); wrap.classList.remove('drop');
    const r = canvas.getBoundingClientRect();
    const i = hitTest(e.clientX - r.left, e.clientY - r.top);
    commit();
    await addPhotos([...e.dataTransfer.files], i >= 0 ? i : null);
    afterChange();
  });

  /* ---------- export / undo / new ---------- */
  $('[data-preset]').addEventListener('change', (e) => { state.ui.preset = e.target.value; updateExport(); redraw(); });
  $('[data-format]').addEventListener('change', (e) => { state.ui.format = e.target.value; });
  $('[data-undo]').addEventListener('click', doUndo);
  $('[data-redo]').addEventListener('click', doRedo);
  $('[data-new]').addEventListener('click', () => {
    if (hasContent(state) && !confirm('Discard this collage and start a new one?')) return;
    resetAll(); discardDraft(); draft.lastSaved = null; renderSaveStatus(); renderHideAll(); renderLayouts(); renderSlots(); afterChange();
  });
  $('[data-download]').addEventListener('click', async (e) => {
    const btn = e.currentTarget, status = $('[data-export-status]'), error = $('[data-export-error]');
    const preset = presetOf(state), fmt = state.ui.format.toUpperCase();
    btn.disabled = true; btn.textContent = 'Rendering…';
    error.hidden = true; $('[data-export-done]').hidden = true; status.hidden = false;
    status.textContent = `Preparing ${fmt} at ${preset.w} × ${preset.h}…`;
    try {
      state.ui.lastExport = await exportCollage(preset, state.ui.format, (p) => {
        if (p.phase === 'fonts') status.textContent = `Loading fonts…`;
        else if (p.phase === 'photo') status.textContent = `Rendering photo ${p.i} of ${p.n} at ${p.W} × ${p.H}${p.reduced ? ' (reduced — retrying smaller)' : ''}…`;
        else if (p.phase === 'encode') status.textContent = `Encoding ${fmt} (${p.W} × ${p.H})…`;
      });
      status.hidden = true;
    } catch (err) {
      status.hidden = true;
      error.hidden = false;
      error.textContent = `Export failed — this device could not render ${preset.w} × ${preset.h}. Try a smaller size, or close other tabs and retry. (${err && err.message ? err.message : err})`;
    } finally {
      btn.disabled = false; btn.textContent = 'Download';
      updateExport();
    }
  });

  /* ---------- draft recovery ---------- */
  const banner = $('[data-draft]');
  const hasDraftContent = (doc) => doc && (doc.photos?.length || Object.keys(doc.texts || {}).length);
  async function offerDraft() {
    if (hasContent(state)) { draft.enabled = true; return; }
    let found = null;
    try { found = await loadDraft(); } catch { /* no storage: just keep editing */ }
    if (!found || !found.photos.length || !hasDraftContent(found.doc)) { draft.enabled = true; return; }
    const when = new Date(found.doc.savedAt);
    $('[data-draft-meta]').textContent = ` · ${found.photos.length} photo${found.photos.length > 1 ? 's' : ''} · ${when.toLocaleDateString()} ${when.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    banner.hidden = false; renderEmpty();
    $('[data-draft-restore]').focus();
  }
  async function restoreDraft() {
    banner.hidden = true;
    $('[data-hint]').textContent = 'Restoring your collage…';
    let found = null;
    try { found = await loadDraft(); } catch { found = null; }
    if (found) {
      const photosById = {};
      for (const rec of found.photos) { try { photosById[rec.id] = await decodePhoto(rec.file, rec.id); } catch { /* unreadable file — skipped */ } }
      const snap = deserializeDraft(found.doc, photosById);
      if (snap) {
        restore(state, snap);
        nextPhotoId = Math.max(nextPhotoId, ...snap.photos.map(p => p.id + 1));
        history.clear();
      }
    }
    draft.enabled = true; draft.lastSaved = found ? found.doc.savedAt : null;
    $('[data-hint]').textContent = HINT_DEFAULT;
    await refreshAll(); renderSaveStatus();
  }
  $('[data-draft-restore]').addEventListener('click', restoreDraft);
  $('[data-draft-discard]').addEventListener('click', () => { banner.hidden = true; discardDraft(); draft.enabled = true; renderEmpty(); });

  /* ---------- boot ---------- */
  const ro = new ResizeObserver(() => (document.hidden ? setTimeout : requestAnimationFrame)(() => { sizeCanvas(); redraw(); }));   // rAF is paused in hidden tabs
  ro.observe(stage);
  window.addEventListener('resize', sizeWorkspace);
  sizeWorkspace();
  if (!isDesktop()) side.classList.add('collapsed');
  showTab(state.ui.tab, { keep: true });
  renderLayouts(); renderSlots(); renderPhotos(); updateExport();
  ensureFonts(styledTheme(state)).then(() => { renderLayouts(); redraw(); });
  renderSaveStatus(); renderEmpty();
  draw();
  offerDraft();
}
