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
  clearCell as clearCellOf, removePhoto as removePhotoOf, placePhotos, resetDocument,
} from './collage/core.js';
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

/* ============================================================
   state operations (single-level undo for photo moves, as before)
   ============================================================ */
function pushUndo() { state.undo = state.cells.map(c => ({ ...c })); }
function undo() { if (state.undo) { state.cells = state.undo; state.undo = null; } }
function setLayout(id) { setLayoutOf(state, id); state.undo = null; }
function setTheme(id) { setThemeOf(state, id); }
function setShape(id) { setShapeOf(state, id); }
function swapCells(a, b) { if (a !== b) { pushUndo(); swapCellsOf(state, a, b); } }
function assignPhoto(i, pid) { pushUndo(); assignPhotoOf(state, i, pid); }
function clearCell(i) { pushUndo(); clearCellOf(state, i); }
function removePhoto(pid) {
  pushUndo();
  const p = photoById(state, pid);
  if (p && p.bmp && p.bmp.close) p.bmp.close();
  removePhotoOf(state, pid);
}
function resetAll() {
  state.photos.forEach(p => p.bmp && p.bmp.close && p.bmp.close());
  resetDocument(state); state.undo = null;
}

/* ============================================================
   export
   ============================================================ */
async function exportCollage(preset, format) {
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
      for (let i = 0; i < g.cells.length; i++) {
        const c = state.cells[i], p = isPhotoCell(state, i) ? photoById(state, c.photoId) : null;
        if (!p) { drawCell(state, ctx, g, i, null, { makeCanvas }); continue; }
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

// local-dev inspection handle (never on the live site)
if (['localhost', '127.0.0.1'].includes(location.hostname)) window.__pt = { state, geometry, exportCollage, addPhotos };

/* ============================================================
   view
   ============================================================ */
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

export function viewCollage(app) {
  app.innerHTML = `
  <div class="view pt">
    <div class="pt-layout" data-layout-root>
      <aside class="pt-side">
        <div class="pt-side-head">
          <span class="mono" style="color:var(--amber)">Collage Maker · free</span>
          <span class="mono" style="color:var(--paper-faint)">photos stay on this device</span>
        </div>
        <section class="pt-step">
          <div class="pt-step-title"><span class="mono">01 · Theme</span></div>
          <div class="pt-chips" data-themes>
            ${THEMES.map(t => `<button class="pt-chip ${t.id === state.themeId ? 'on' : ''}" data-theme="${t.id}"><b>${t.name}</b><span>${t.tag}</span></button>`).join('')}
          </div>
          <label class="pt-accent"><span class="mono">Accent</span><input type="color" data-accent value="${accentColor(state)}"><button class="chip" data-accent-reset>reset</button></label>
        </section>

        <section class="pt-step">
          <div class="pt-step-title"><span class="mono">02 · Style</span><button class="chip" data-style-reset>theme default</button></div>
          <div class="pt-sub mono">Combinations</div>
          <div class="pt-scroll" data-combos></div>
          <div class="pt-sub mono">Color palettes</div>
          <div class="pt-palettes" data-palettes></div>
          <div class="pt-sub mono">Image palettes — from your photos</div>
          <div class="pt-scroll" data-imgpal></div>
          <div class="pt-sub mono">Font sets</div>
          <div class="pt-fonts" data-fonts></div>
        </section>

        <section class="pt-step">
          <div class="pt-step-title"><span class="mono">03 · Shape</span></div>
          <div class="pt-chips" data-shapes>
            ${SHAPES.map(s => `<button class="pt-chip ${s.id === state.shapeId ? 'on' : ''}" data-shape="${s.id}"><b>${s.name}</b><span>${s.hint}</span></button>`).join('')}
          </div>
        </section>

        <section class="pt-step">
          <div class="pt-step-title"><span class="mono">04 · Layout</span><button class="chip" data-layout-reset hidden>↔ reset sizes</button></div>
          <p class="pt-note">Click a section to get handles — drag them to resize, drag the grip to move. Photos refit automatically; use zoom to adjust.</p>
          <div class="pt-layouts" data-layouts></div>
        </section>

        <section class="pt-step">
          <div class="pt-step-title"><span class="mono">05 · Words</span><button class="chip ${state.ui.hideText ? 'on' : ''}" data-hide-all>${state.ui.hideText ? 'show words' : 'photos only'}</button></div>
          <p class="pt-note">Words are off by default. Turn them on to add a title, caption or number — then drag them on the canvas to move, click for size, reset and remove.</p>
          <div data-slots></div>
        </section>
      </aside>

      <main class="pt-main">
        <div class="pt-stage" data-stage>
          <div class="pt-canvas-wrap" data-wrap>
            <canvas data-preview aria-label="Collage preview"></canvas>
            <div class="pt-toolbar" data-toolbar hidden>
              <button data-act="zoom-out" title="Zoom out" data-photo-only>−</button>
              <button data-act="zoom-in" title="Zoom in" data-photo-only>+</button>
              <span class="pt-sep" data-photo-only></span>
              <button data-act="up" title="Move to previous cell" data-photo-only>↑</button>
              <button data-act="down" title="Move to next cell" data-photo-only>↓</button>
              <button data-act="swap" title="Swap with another cell" data-photo-only>⇄ Swap</button>
              <span class="pt-sep" data-photo-only></span>
              <button data-act="replace" title="Replace photo" data-photo-only>Replace</button>
              <button data-act="add" title="Add a photo here" data-empty-only>+ Add photo</button>
              <button data-act="reset-cell" title="Reset this section's size & position" data-ov-only>↔ Reset size</button>
              <span class="pt-sep" data-photo-only></span>
              <button data-act="clear" class="pt-danger" title="Remove the photo from this section" data-photo-only>Clear</button>
              <span class="pt-sep"></span>
              <button data-act="done" title="Done — hide these controls" aria-label="Done">✕</button>
            </div>
            <div class="pt-toolbar" data-text-toolbar hidden>
              <button data-tact="smaller" title="Smaller text">A−</button>
              <button data-tact="bigger" title="Bigger text">A+</button>
              <span class="pt-sep"></span>
              <button data-tact="reset" title="Reset position & size">↺ Reset</button>
              <button data-tact="hide" class="pt-danger" title="Remove this text">Remove</button>
              <span class="pt-sep"></span>
              <button data-tact="done" title="Done — hide these controls" aria-label="Done">✕</button>
            </div>
          </div>
          <p class="pt-hint" data-hint>Click an empty cell to add photos · drag a photo to reposition · scroll or pinch to zoom · click a photo for more controls</p>
        </div>

        <div class="pt-bottom">
          <div class="pt-tray">
            <button class="btn btn-primary btn-small" data-add>+ Add photos</button>
            <div class="pt-thumbs" data-thumbs></div>
            <input type="file" accept="image/*" multiple hidden data-file>
          </div>
          <div class="pt-export">
            <div class="pt-export-row">
              <label><span class="mono">Size</span><select data-preset></select></label>
              <label><span class="mono">Format</span><select data-format>
                <option value="jpeg" ${state.ui.format === 'jpeg' ? 'selected' : ''}>JPEG (smaller)</option>
                <option value="png" ${state.ui.format === 'png' ? 'selected' : ''}>PNG (lossless)</option>
              </select></label>
              <button class="btn btn-primary" data-download>Download</button>
              <button class="btn btn-ghost btn-small" data-undo disabled>↺ Undo</button>
              <button class="btn btn-ghost btn-small" data-new>New collage</button>
            </div>
            <p class="pt-export-info" data-export-info></p>
            <p class="pt-export-warn" data-export-warn hidden></p>
            <p class="pt-export-done" data-export-done hidden></p>
          </div>
        </div>
      </main>
    </div>
  </div>`;

  const $ = (s) => app.querySelector(s);
  const wrap = $('[data-wrap]'), canvas = $('[data-preview]'), ctx = canvas.getContext('2d');
  const toolbar = $('[data-toolbar]');
  const fileInput = $('[data-file]');
  let fileTarget = null;            // cell index a file pick is aimed at
  let cssW = 0, cssH = 0, dpr = 1;
  let raf = 0;
  let lastG = null;
  let drag = null, pinch = null, textDrag = null, cellDrag = null;

  /* ---------- preview rendering ---------- */
  const stage = $('[data-stage]');
  const layoutRoot = $('[data-layout-root]');
  const isDesktop = () => window.matchMedia('(min-width: 901px)').matches;
  // full-page workspace: the layout grid fills the viewport under the top bar (desktop only)
  function sizeWorkspace() {
    const topbar = document.querySelector('.topbar');
    layoutRoot.style.height = isDesktop() ? `${window.innerHeight - (topbar ? topbar.offsetHeight : 0)}px` : '';
  }
  function sizeCanvas() {
    const ar = currentShape(state).ar;
    const pad = 28, hintRoom = 34;
    const availW = Math.max(200, stage.clientWidth - pad * 2);
    const availH = isDesktop() ? Math.max(200, stage.clientHeight - pad * 2 - hintRoom) : Infinity;
    cssW = Math.round(Math.min(availW, availH * ar));
    cssH = Math.round(cssW / ar);
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.style.width = `${cssW}px`; canvas.style.height = `${cssH}px`;
    canvas.width = Math.round(cssW * dpr); canvas.height = Math.round(cssH * dpr);
  }

  function draw() {
    raf = 0;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const g = geometry(cssW, cssH);
    drawBackground(state, ctx, g);
    g.cells.forEach((_, i) => drawCell(state, ctx, g, i, photoById(state, state.cells[i].photoId)?.bmp || null, { preview: true, makeCanvas }));
    drawForeground(state, ctx, g, makeCanvas);

    // low-resolution badges for the chosen export size
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
  }
  // rAF is paused in hidden tabs; fall back to a timer so state never gets ahead of the canvas
  const redraw = () => { if (!raf) raf = document.hidden ? setTimeout(draw, 16) : requestAnimationFrame(draw); };

  const textToolbar = $('[data-text-toolbar]');
  function positionTextToolbar(g) {
    const id = state.ui.selectedText, b = id && g.textBoxes[id];
    if (!b || textDrag) { textToolbar.hidden = true; return; }      // never cover the words while they're being moved
    textToolbar.hidden = false;
    const above = b.y - 52;
    textToolbar.style.left = `${Math.max(130, Math.min(cssW - 130, b.x + b.w / 2))}px`;
    textToolbar.style.top = `${above > 4 ? above : Math.min(cssH - 44, b.y + b.h + 14)}px`;
  }
  function hitText(x, y) {
    if (!lastG) return null;
    for (const id of Object.keys(lastG.textBoxes).reverse()) {
      const b = lastG.textBoxes[id];
      if (x >= b.x - 6 && x <= b.x + b.w + 6 && y >= b.y - 4 && y <= b.y + b.h + 4) return id;
    }
    return null;
  }
  textToolbar.addEventListener('click', (e) => {
    const act = e.target.closest('[data-tact]')?.dataset.tact, id = state.ui.selectedText;
    if (!act || !id) return;
    const ov = textOv(state, id);
    if (act === 'bigger') setTextOv(state, id, { scale: Math.min(3, ov.scale * 1.12) });
    else if (act === 'smaller') setTextOv(state, id, { scale: Math.max(0.4, ov.scale / 1.12) });
    else if (act === 'reset') delete state.textOv[id];
    else if (act === 'hide') { setTextOv(state, id, { hidden: true }); state.ui.selectedText = null; }
    else if (act === 'done') state.ui.selectedText = null;
    renderSlots(); redraw();
  });

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
    const top = Math.min(cssH - 44, cell.center.y + (cell.rot ? half * 0.9 : cell.rect.h / 2) + 22);   // clear of the bottom handles
    toolbar.style.left = `${Math.max(120, Math.min(cssW - 120, cell.center.x))}px`;
    toolbar.style.top = `${top}px`;
  }

  /* ---------- styles ---------- */
  const bar = (stripes) => `<span class="pt-bar">${stripes.map(c => `<i style="background:${c}"></i>`).join('')}</span>`;
  function renderStyles() {
    const st = state.style;
    $('[data-combos]').innerHTML = COMBOS.map(c => {
      const p = PALETTES.find(x => x.id === c.palette), f = FONT_SETS.find(x => x.id === c.font);
      const on = st.palette?.id === p.id && st.font?.id === f.id;
      return `<button class="pt-combo ${on ? 'on' : ''}" data-combo="${p.id}|${f.id}">${bar(p.stripes)}
        <b style="font-family:'${f.display.family}';font-style:${f.display.italic ? 'italic' : 'normal'};font-weight:${f.display.weight}">${p.name}</b>
        <span style="font-family:'${f.body.family}'">${f.body.family}</span></button>`;
    }).join('');
    $('[data-palettes]').innerHTML = PALETTES.map(p =>
      `<button class="pt-pal ${st.palette?.id === p.id ? 'on' : ''}" data-palette="${p.id}" title="${p.name}">${bar(p.stripes)}<span>${p.name}</span></button>`).join('');
    const imgs = state.photos.map(imagePalette);
    $('[data-imgpal]').innerHTML = imgs.length
      ? imgs.map(p => `<button class="pt-imgpal ${st.palette?.id === p.id ? 'on' : ''}" data-imgpalette="${p.id}" title="${esc(p.name)}">${bar(p.stripes)}<canvas width="72" height="46" data-photo="${p.id.slice(4)}"></canvas></button>`).join('')
      : '<span class="pt-tray-empty">Add photos to get palettes drawn from them.</span>';
    $('[data-imgpal]').querySelectorAll('canvas[data-photo]').forEach(c => {
      const p = photoById(state, +c.dataset.photo); if (!p) return;
      const cx = c.getContext('2d'), k = Math.max(72 / p.bmp.width, 46 / p.bmp.height);
      cx.drawImage(p.bmp, (72 - p.bmp.width * k) / 2, (46 - p.bmp.height * k) / 2, p.bmp.width * k, p.bmp.height * k);
    });
    $('[data-fonts]').innerHTML = FONT_SETS.map(f =>
      `<button class="pt-font ${st.font?.id === f.id ? 'on' : ''}" data-fontset="${f.id}">
        <b style="font-family:'${f.display.family}';font-style:${f.display.italic ? 'italic' : 'normal'};font-weight:${f.display.weight}">${f.display.family}</b>
        <span style="font-family:'${f.body.family}'">${f.body.family}</span></button>`).join('');
    FONT_SETS.forEach(f => ensureFonts({ font: f.display, body: f.body }));   // so the cards preview in their own faces
  }
  async function applyStyleChange() {
    await ensureFonts(styledTheme(state));
    $('[data-accent]').value = accentColor(state);
    renderStyles(); renderLayouts(); redraw();
  }
  $('[data-combos]').addEventListener('click', (e) => {
    const b = e.target.closest('[data-combo]'); if (!b) return;
    const [pid, fid] = b.dataset.combo.split('|');
    state.style = { palette: PALETTES.find(p => p.id === pid), font: FONT_SETS.find(f => f.id === fid) };
    state.accent = null; applyStyleChange();
  });
  $('[data-palettes]').addEventListener('click', (e) => {
    const b = e.target.closest('[data-palette]'); if (!b) return;
    state.style.palette = PALETTES.find(p => p.id === b.dataset.palette); state.accent = null; applyStyleChange();
  });
  $('[data-imgpal]').addEventListener('click', (e) => {
    const b = e.target.closest('[data-imgpalette]'); if (!b) return;
    const p = photoById(state, +b.dataset.imgpalette.slice(4)); if (!p) return;
    state.style.palette = imagePalette(p); state.accent = null; applyStyleChange();
  });
  $('[data-fonts]').addEventListener('click', (e) => {
    const b = e.target.closest('[data-fontset]'); if (!b) return;
    state.style.font = FONT_SETS.find(f => f.id === b.dataset.fontset); applyStyleChange();
  });
  $('[data-style-reset]').addEventListener('click', () => { state.style = { palette: null, font: null }; state.accent = null; applyStyleChange(); });

  function renderLayouts() {
    const box = $('[data-layouts]');
    const theme = styledTheme(state), shape = currentShape(state);
    const btn = (l) => `
      <button class="pt-layout-btn ${l.id === state.layoutId ? 'on' : ''}" data-layout="${l.id}" title="${l.desc}">
        <canvas width="${Math.round(88 * (shape.ar >= 1 ? 1 : shape.ar))}" height="${Math.round(88 * (shape.ar >= 1 ? 1 / shape.ar : 1))}"></canvas>
        <span>${theme.suggested.includes(l.id) ? '★ ' : ''}${l.name}</span>
      </button>`;
    box.innerHTML =
      `<div class="pt-group mono">Moodboard</div>${LAYOUTS.filter(l => l.group === 'moodboard').map(btn).join('')}` +
      `<div class="pt-group mono">Photos only</div>${LAYOUTS.filter(l => l.group === 'photos').map(btn).join('')}` +
      `<div class="pt-group mono">Classic</div>${LAYOUTS.filter(l => !l.group).map(btn).join('')}`;
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
        cx.globalAlpha = 0.85;
        cx.fillStyle = cell.type === 'photo' ? accentColor(state) : ink;
        cx.fillRect(cell.rect.x, cell.rect.y, cell.rect.w, cell.rect.h);
        cx.restore();
      });
      btn.addEventListener('click', () => { setLayout(btn.dataset.layout); renderLayouts(); renderSlots(); renderThumbs(); updateExport(); redraw(); });
    });
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
          <button class="chip ${ov.hidden ? '' : 'on'}" data-slot-toggle="${s.id}" title="${ov.hidden ? 'Show' : 'Hide'} this text">${ov.hidden ? 'show' : 'on'}</button>
          <button class="chip" data-slot-reset="${s.id}" title="Reset position & size" ${changed ? '' : 'disabled'}>↺</button>
        </div>
      </div>`;
    }).join('');
    $('[data-slots]').querySelectorAll('[data-slot]').forEach(inp => inp.addEventListener('input', () => {
      state.texts[inp.dataset.slot] = inp.value;
      redraw();
    }));
  }
  $('[data-slots]').addEventListener('click', (e) => {
    const t = e.target.closest('[data-slot-toggle]'), r = e.target.closest('[data-slot-reset]');
    if (t) { setTextOv(state, t.dataset.slotToggle, { hidden: !textOv(state, t.dataset.slotToggle).hidden }); if (state.ui.selectedText === t.dataset.slotToggle) state.ui.selectedText = null; }
    else if (r) { delete state.textOv[r.dataset.slotReset]; }
    else return;
    renderSlots(); redraw();
  });
  $('[data-layout-reset]').addEventListener('click', () => { clearCellOv(state, currentLayout(state)); renderLayouts(); afterChange(); });
  $('[data-hide-all]').addEventListener('click', (e) => {
    state.ui.hideText = !state.ui.hideText;
    state.ui.selectedText = null;
    e.currentTarget.textContent = state.ui.hideText ? 'show words' : 'photos only';
    e.currentTarget.classList.toggle('on', state.ui.hideText);
    renderLayouts(); afterChange();
  });

  function renderThumbs() {
    renderStyles();                       // image palettes follow the photo tray
    const box = $('[data-thumbs]');
    box.innerHTML = '';
    if (!state.photos.length) { box.innerHTML = '<span class="pt-tray-empty">No photos yet — add some, or click any empty cell.</span>'; return; }
    state.photos.forEach(p => {
      const inCell = state.cells.findIndex(c => c.photoId === p.id);
      const el = document.createElement('div');
      el.className = `pt-thumb ${inCell >= 0 ? 'placed' : ''}`;
      el.title = inCell >= 0 ? `${p.name} — in cell ${inCell + 1}. Click to move to the selected cell.` : `${p.name} — not placed. Click to place.`;
      const c = makeCanvas(64, 64), cx = c.getContext('2d');
      const k = Math.max(64 / p.bmp.width, 64 / p.bmp.height);
      cx.drawImage(p.bmp, (64 - p.bmp.width * k) / 2, (64 - p.bmp.height * k) / 2, p.bmp.width * k, p.bmp.height * k);
      el.appendChild(c);
      if (inCell >= 0) { const b = document.createElement('i'); b.textContent = inCell + 1; el.appendChild(b); }
      const rm = document.createElement('button'); rm.textContent = '✕'; rm.title = 'Remove photo';
      rm.addEventListener('click', (e) => { e.stopPropagation(); removePhoto(p.id); afterChange(); });
      el.appendChild(rm);
      el.addEventListener('click', () => {
        let idx = state.ui.selected;
        if (idx === null || !isPhotoCell(state, idx)) idx = firstEmptyPhotoCell(state);
        if (idx < 0) idx = photoCellIndices(state)[0];
        assignPhoto(idx, p.id);
        state.ui.selected = idx;
        afterChange();
      });
      box.appendChild(el);
    });
  }

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
    $('[data-undo]').disabled = !state.undo;
    const done = $('[data-export-done]');
    if (state.ui.lastExport) {
      const r = state.ui.lastExport;
      done.hidden = false;
      done.textContent = `Saved ${r.name} — ${r.W} × ${r.H} px (${(r.W / 300).toFixed(1)} × ${(r.H / 300).toFixed(1)} in at 300 DPI)` +
        (r.reduced ? ` · rendered below the requested ${r.requested.w} × ${r.requested.h} because this device ran out of canvas memory.` : '');
    } else done.hidden = true;
  }

  function afterChange() { renderThumbs(); updateExport(); redraw(); }

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
    if (hk) { beginCellDrag(hk, pt); redraw(); return; }
    const tid = state.ui.swapFrom === null ? hitText(pt.x, pt.y) : null;
    if (tid) {
      state.ui.selectedText = tid; state.ui.selected = null;
      textDrag = { id: tid, startX: pt.x, startY: pt.y, dx0: textOv(state, tid).dx, dy0: textOv(state, tid).dy };
      redraw(); return;
    }
    state.ui.selectedText = null;
    const i = hitTest(pt.x, pt.y);
    if (i < 0) { state.ui.selected = null; state.ui.swapFrom = null; redraw(); return; }
    if (state.ui.swapFrom !== null) {
      swapCells(state.ui.swapFrom, i);
      state.ui.selected = i; state.ui.swapFrom = null;
      $('[data-hint]').textContent = 'Swapped.';
      afterChange();
      return;
    }
    const c = state.cells[i];
    if (!isPhotoCell(state, i)) { state.ui.selected = i; redraw(); return; }
    if (!c.photoId) { fileTarget = i; state.ui.selected = i; fileInput.click(); redraw(); return; }
    const g = geometry(cssW, cssH);
    const p = photoById(state, c.photoId);
    const f = fitPhoto(g.cells[i].photo, p.bmp.width, p.bmp.height, c);
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
    const c = state.cells[i];
    c.zoom = Math.min(4, Math.max(1, c.zoom * (e.deltaY < 0 ? 1.06 : 0.94)));
    state.ui.selected = i;
    redraw(); updateExport();
  }, { passive: false });

  /* ---------- toolbar ---------- */
  toolbar.addEventListener('click', (e) => {
    const act = e.target.closest('[data-act]')?.dataset.act;
    const i = state.ui.selected;
    if (!act || i === null) return;
    const c = state.cells[i] || {};
    switch (act) {
      case 'zoom-in': c.zoom = Math.min(4, c.zoom * 1.15); break;
      case 'zoom-out': c.zoom = Math.max(1, c.zoom / 1.15); break;
      case 'up': { const ps = photoCellIndices(state), k = ps.indexOf(i); if (k > 0) { swapCells(i, ps[k - 1]); state.ui.selected = ps[k - 1]; } break; }
      case 'down': { const ps = photoCellIndices(state), k = ps.indexOf(i); if (k < ps.length - 1) { swapCells(i, ps[k + 1]); state.ui.selected = ps[k + 1]; } break; }
      case 'swap': state.ui.swapFrom = i; $('[data-hint]').textContent = 'Swap mode — click the cell to swap with (click the same cell to cancel).'; break;
      case 'replace': case 'add': fileTarget = i; fileInput.click(); break;
      case 'clear': clearCell(i); break;
      case 'reset-cell': clearCellOv(state, currentLayout(state), i); renderLayouts(); break;
      case 'done': deselect(); break;
    }
    afterChange();
  });

  // tapping anywhere outside the collage, or pressing Escape, puts the controls away
  function deselect() { state.ui.selected = null; state.ui.selectedText = null; state.ui.swapFrom = null; }
  stage.addEventListener('pointerdown', (e) => { if (!wrap.contains(e.target)) { deselect(); redraw(); } });
  const onKey = (e) => { if (e.key === 'Escape' && (state.ui.selected !== null || state.ui.selectedText)) { deselect(); redraw(); } };
  document.addEventListener('keydown', onKey);

  /* ---------- file input / tray ---------- */
  fileInput.addEventListener('change', async () => {
    const files = [...fileInput.files];
    fileInput.value = '';
    if (!files.length) return;
    $('[data-hint]').textContent = 'Loading photos…';
    pushUndo();
    await addPhotos(files, fileTarget);
    fileTarget = null;
    $('[data-hint]').textContent = 'Drag a photo to reposition · scroll or pinch to zoom · click a photo for more controls';
    afterChange();
  });
  $('[data-add]').addEventListener('click', () => { fileTarget = null; fileInput.click(); });

  wrap.addEventListener('dragover', (e) => { e.preventDefault(); wrap.classList.add('drop'); });
  wrap.addEventListener('dragleave', () => wrap.classList.remove('drop'));
  wrap.addEventListener('drop', async (e) => {
    e.preventDefault(); wrap.classList.remove('drop');
    const r = canvas.getBoundingClientRect();
    const i = hitTest(e.clientX - r.left, e.clientY - r.top);
    pushUndo();
    await addPhotos([...e.dataTransfer.files], i >= 0 ? i : null);
    afterChange();
  });

  /* ---------- theme / shape / accent ---------- */
  $('[data-themes]').addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-theme]'); if (!btn) return;
    setTheme(btn.dataset.theme);
    $('[data-themes]').querySelectorAll('.pt-chip').forEach(b => b.classList.toggle('on', b === btn));
    $('[data-accent]').value = accentColor(state);
    await ensureFonts(styledTheme(state));
    renderLayouts(); renderSlots(); afterChange();
  });
  $('[data-shapes]').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-shape]'); if (!btn) return;
    setShape(btn.dataset.shape);
    $('[data-shapes]').querySelectorAll('.pt-chip').forEach(b => b.classList.toggle('on', b === btn));
    sizeCanvas(); renderLayouts(); afterChange();
  });
  $('[data-accent]').addEventListener('input', (e) => { state.accent = e.target.value; renderLayouts(); redraw(); });
  $('[data-accent-reset]').addEventListener('click', () => { state.accent = null; $('[data-accent]').value = accentColor(state); renderLayouts(); redraw(); });

  /* ---------- export ---------- */
  $('[data-preset]').addEventListener('change', (e) => { state.ui.preset = e.target.value; updateExport(); redraw(); });
  $('[data-format]').addEventListener('change', (e) => { state.ui.format = e.target.value; });
  $('[data-undo]').addEventListener('click', () => { undo(); afterChange(); });
  $('[data-new]').addEventListener('click', () => {
    if (hasContent(state) && !confirm('Discard this collage and start a new one?')) return;
    resetAll(); renderSlots(); afterChange();
  });
  $('[data-download]').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    btn.disabled = true; btn.textContent = 'Rendering…';
    try {
      state.ui.lastExport = await exportCollage(presetOf(state), state.ui.format);
    } catch (err) {
      alert('Export failed — this device could not render the collage. Try a smaller size.');
    } finally {
      btn.disabled = false; btn.textContent = 'Download';
      updateExport();
    }
  });

  /* ---------- boot ---------- */
  const ro = new ResizeObserver(() => requestAnimationFrame(() => { sizeCanvas(); redraw(); }));
  ro.observe(stage);
  window.addEventListener('resize', sizeWorkspace);
  sizeWorkspace();
  sizeCanvas();
  renderLayouts(); renderSlots(); renderThumbs(); updateExport();
  ensureFonts(styledTheme(state)).then(() => { renderLayouts(); redraw(); });
  draw();
}
