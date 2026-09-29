// ============================================================
// Collage Maker — core: state, geometry and editing operations.
//
// Everything in here is pure and DOM-free (no window, document or
// canvas), so it runs under node:test as well as in the browser. The
// UI module owns the singleton state and passes it in explicitly.
// ============================================================

import { SHAPES, LAYOUTS, THEMES, DEFAULT_BODY, TEXT_FONTS, exportPresets } from '../data/collage.js';

export const emptyCell = () => ({ photoId: null, zoom: 1, panX: 0.5, panY: 0.5 });
export const NO_OV = Object.freeze({ dx: 0, dy: 0, scale: 1, hidden: false });

export function createState(overrides = {}) {
  const s = {
    themeId: 'birthday',
    shapeId: 'square',
    layoutId: 'polaroid-wall',
    accent: null,                            // null = theme default
    style: { palette: null, font: null },    // palette / font-set applied over the theme
    spacing: 0,                              // 0–100: extra gap between sections
    photos: [],                              // { id, file, name, iw, ih, bmp }
    cells: [],                               // one per layout cell
    texts: {},                               // slotId -> user text (absent = theme default)
    textOv: {},                              // slotId -> { dx, dy, scale, hidden }
    cellOv: {},                              // layoutId -> { cellIndex: { x, y, w, h } }
    ui: { selected: null, selectedText: null, swapFrom: null, hideText: true, preset: 'web', format: 'jpeg',
          lastExport: null, tab: 'photos', layoutFilter: 'suggested', open: {} },
    ...overrides,
  };
  if (!s.cells.length) s.cells = currentLayout(s).cells.map(emptyCell);
  return s;
}

/* ---------------- lookups ---------------- */
export const currentTheme = (s) => THEMES.find(t => t.id === s.themeId);
export const currentShape = (s) => SHAPES.find(x => x.id === s.shapeId);
export const currentLayout = (s) => LAYOUTS.find(l => l.id === s.layoutId);
export const photoById = (s, id) => s.photos.find(p => p.id === id) || null;
export const hasContent = (s) => s.photos.length > 0 || Object.keys(s.texts).length > 0;
export function currentPreset(s) {
  const presets = exportPresets(currentShape(s));
  return presets.find(p => p.id === s.ui.preset) || presets[0];
}

// a style (palette + font set) is a skin laid over the theme; the renderer only ever sees the result
export function applyStyle(s, base) {
  const { palette, font } = s.style;
  return {
    ...base,
    palette: palette ? { ...palette.roles, band: palette.roles.bg } : base.palette,
    font: font ? font.display : base.font,
    body: font ? font.body : DEFAULT_BODY,
  };
}
export const styledTheme = (s) => applyStyle(s, currentTheme(s));
export const accentColor = (s) => s.accent || styledTheme(s).palette.accent;

/* ---------------- words ---------------- */
export const slotText = (s, slot) => (s.texts[slot.id] !== undefined ? s.texts[slot.id] : slot.default);
export const textOv = (s, id) => s.textOv[id] || NO_OV;
export function setTextOv(s, id, patch) { s.textOv[id] = { ...textOv(s, id), ...patch }; }
export const textVisible = (s, id) => !s.ui.hideText && !textOv(s, id).hidden;

// effective typeface for one piece of text: the theme/style default for its role
// ('display' headings, 'body' small text; o.italic for quotes), then the user's
// per-text choices — font, bold, italic — layered on top
export function textStyle(theme, ov = NO_OV, kind = 'display', o = {}) {
  const pick = ov.font ? TEXT_FONTS.find(f => f.id === ov.font) : null;
  const body = theme.body || DEFAULT_BODY;
  let family, weight, italic, generic;
  if (pick) { family = pick.family; weight = 400; italic = !!o.italic; generic = pick.generic; }
  else if (kind === 'body') { family = body.family; weight = 400; italic = !!o.italic; generic = 'sans-serif'; }
  else { family = theme.font.family; weight = theme.font.weight; italic = !!theme.font.italic || !!o.italic; generic = 'serif'; }
  if (ov.bold !== undefined) weight = ov.bold ? 700 : 400;
  if (ov.italic !== undefined) italic = !!ov.italic;
  return { family, weight, italic, generic, bold: weight >= 600, underline: !!ov.underline, color: ov.color || null };
}
export function textFont(theme, ov, size, kind, o) {
  const t = textStyle(theme, ov, kind, o);
  return `${t.italic ? 'italic ' : ''}${t.weight} ${size}px "${t.family}", ${t.generic}`;
}
// every catalogue font a document needs loaded: chosen per-text fonts plus the theme's
// own families (so bold/italic toggles on the default font have real faces)
export function fontsInUse(s, theme) {
  const ids = new Set(Object.values(s.textOv).map(o => o && o.font).filter(Boolean));
  const fams = [theme.font.family, (theme.body || DEFAULT_BODY).family];
  return TEXT_FONTS.filter(f => ids.has(f.id) || fams.includes(f.family));
}
export const slotsFor = (theme, layout) => [...theme.slots, ...(layout.slots || [])];

// text cells claim slots in cell order, first non-empty unused candidate wins —
// so "Split Banner" shows the age numeral on Birthday but the names on Wedding
export function resolveTextSlots(s, theme, layout) {
  const defs = Object.fromEntries(slotsFor(theme, layout).map(x => [x.id, x]));
  const used = new Set();
  return layout.cells.map((c) => {
    if (c.type !== 'text') return null;
    const want = c.style === 'title' ? 2 : 1;
    const picked = [];
    for (const id of c.slots) {
      const def = defs[id];
      if (!def || used.has(id) || !slotText(s, def).trim()) continue;
      picked.push(def); used.add(id);
      if (picked.length === want) break;
    }
    return picked;
  });
}

/* ---------------- sections ---------------- */
export const isPhotoCell = (s, i, layout = currentLayout(s)) => (layout.cells[i].type || 'photo') === 'photo';
export const firstEmptyPhotoCell = (s) => s.cells.findIndex((c, i) => !c.photoId && isPhotoCell(s, i));
export const photoCellIndices = (s) => s.cells.map((_, i) => i).filter(i => isPhotoCell(s, i));
export const photoCellCount = (layout) => layout.cells.filter(c => (c.type || 'photo') === 'photo').length;

// a layout cell with the user's size/position override applied (normalized content units)
export function cellDef(s, layout, i) {
  const ov = s.cellOv[layout.id] && s.cellOv[layout.id][i];
  return ov ? { ...layout.cells[i], ...ov } : layout.cells[i];
}
export function setCellOv(s, layout, i, patch) {
  const all = s.cellOv[layout.id] || (s.cellOv[layout.id] = {});
  const c = layout.cells[i];
  all[i] = { x: c.x, y: c.y, w: c.w, h: c.h, ...(all[i] || {}), ...patch };
}
export const hasCellOv = (s, layout, i) => !!(s.cellOv[layout.id] && s.cellOv[layout.id][i]);
export function clearCellOv(s, layout, i) {
  if (!s.cellOv[layout.id]) return;
  if (i === undefined) delete s.cellOv[layout.id];
  else { delete s.cellOv[layout.id][i]; if (!Object.keys(s.cellOv[layout.id]).length) delete s.cellOv[layout.id]; }
}

/* ---------------- geometry (shared by preview, thumbnails and export) ---------------- */
export function geometry(s, W, H, opts = {}) {
  const theme = applyStyle(s, opts.theme || currentTheme(s));
  const layout = opts.layout || currentLayout(s);
  const u = Math.min(W, H);
  const m = theme.margin * u;
  const noBand = layout.band === false || s.ui.hideText;
  const bandH = noBand ? 0 : theme.band.h * H;
  const top = theme.band.pos === 'top';
  const content = noBand ? { x: m, y: m, w: W - 2 * m, h: H - 2 * m } : { x: m, y: top ? bandH : m, w: W - 2 * m, h: H - bandH - m };
  const band = { x: m, y: top ? 0 : H - bandH, w: W - 2 * m, h: bandH };
  const insetB = u * 0.012;
  const gap = (s.spacing / 100) * u * 0.03;          // extra breathing room between sections

  const cells = layout.cells.map((c0, ci) => {
    const c = cellDef(s, layout, ci);
    const type = c.type || 'photo';
    if (layout.polaroid) {
      const frameW = c.w * Math.min(content.w, content.h * 1.02) * (1 - (s.spacing / 100) * 0.25);
      const frameH = frameW * 1.2;
      const center = { x: content.x + c.x * content.w, y: content.y + c.y * content.h };
      const rect = { x: center.x - frameW / 2, y: center.y - frameH / 2, w: frameW, h: frameH };
      const pad = frameW * 0.065;
      const photo = { x: rect.x + pad, y: rect.y + pad, w: frameW - 2 * pad, h: frameW - 2 * pad };
      return { def: c, type, rect, photo, center, rot: (c.rot || 0) * Math.PI / 180, polaroid: true, radius: 0 };
    }
    let rect = { x: content.x + c.x * content.w, y: content.y + c.y * content.h, w: c.w * content.w, h: c.h * content.h };
    if (gap && rect.w > 3 * gap && rect.h > 3 * gap) rect = { x: rect.x + gap, y: rect.y + gap, w: rect.w - 2 * gap, h: rect.h - 2 * gap };
    const b = c.frame ? insetB * 1.3 : c.inset ? insetB : 0;
    const photo = b ? { x: rect.x + b, y: rect.y + b, w: rect.w - 2 * b, h: rect.h - 2 * b } : rect;
    return { def: c, type, rect, photo, center: { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 },
             rot: (c.rot || 0) * Math.PI / 180, inset: !!c.inset, frame: !!c.frame, tape: !!c.tape, radius: (c.radius || 0) * u };
  });
  const decor = (layout.decor || []).map(d => ({ x: content.x + d.x * content.w, y: content.y + d.y * content.h, r: d.r * u }));
  return { W, H, u, theme, layout, content, band, cells, decor, textSlots: resolveTextSlots(s, theme, layout), textBoxes: {} };
}

// cover-fit a photo into a box, then apply zoom + normalized pan
export function fitPhoto(box, iw, ih, cell) {
  const k = Math.max(box.w / iw, box.h / ih) * cell.zoom;
  const dw = iw * k, dh = ih * k;
  return { s: k, dw, dh, dx: box.x - (dw - box.w) * cell.panX, dy: box.y - (dh - box.h) * cell.panY };
}

// effective print resolution of a cell's photo at a given export size
export function cellQuality(s, g, i) {
  if (!isPhotoCell(s, i, g.layout)) return null;
  const c = s.cells[i], p = photoById(s, c.photoId);
  if (!p) return null;
  const f = fitPhoto(g.cells[i].photo, p.iw, p.ih, c);
  return { upscale: f.s, dpi: 300 / Math.max(1, f.s) };
}

/* ---------------- editing operations ---------------- */
export function setLayout(s, id) {
  if (id === s.layoutId || !LAYOUTS.some(l => l.id === id)) return;
  // placed photos first (in cell order), then the tray — so a 6→4→6 round trip restores everything
  const placed = s.cells.map(c => c.photoId).filter(Boolean);
  const order = [...placed, ...s.photos.map(p => p.id).filter(pid => !placed.includes(pid))];
  s.layoutId = id;
  s.cells = currentLayout(s).cells.map(emptyCell);
  const targets = photoCellIndices(s);
  order.forEach((pid, k) => { if (k < targets.length) s.cells[targets[k]].photoId = pid; });
  s.ui.selected = null; s.ui.swapFrom = null; s.ui.selectedText = null;
}
export function setTheme(s, id) { s.themeId = id; s.accent = null; s.style = { palette: null, font: null }; }
export function setShape(s, id) {
  s.shapeId = id;
  if (!exportPresets(currentShape(s)).some(p => p.id === s.ui.preset)) s.ui.preset = 'web';
}
export function swapCells(s, a, b) {
  if (a === b) return;
  const t = s.cells[a]; s.cells[a] = s.cells[b]; s.cells[b] = t;
}
export function assignPhoto(s, cellIdx, photoId) { s.cells[cellIdx] = { ...emptyCell(), photoId }; }
export function clearCell(s, i) { s.cells[i] = emptyCell(); }
export function removePhoto(s, photoId) {
  s.cells.forEach((c, i) => { if (c.photoId === photoId) s.cells[i] = emptyCell(); });
  s.photos = s.photos.filter(p => p.id !== photoId);
}
// place newly added photos: first into the requested cell, then into empty cells in order
export function placePhotos(s, photos, targetCell = null) {
  photos.forEach((p, k) => {
    let idx = -1;
    if (k === 0 && targetCell !== null && isPhotoCell(s, targetCell)) idx = targetCell;
    else idx = firstEmptyPhotoCell(s);
    if (idx >= 0) s.cells[idx] = { ...emptyCell(), photoId: p.id };
  });
}
export function resetDocument(s) {
  s.photos = []; s.texts = {}; s.textOv = {}; s.cellOv = {}; s.accent = null; s.spacing = 0;
  s.style = { palette: null, font: null };
  s.cells = currentLayout(s).cells.map(emptyCell);
  s.ui.selected = null; s.ui.selectedText = null; s.ui.swapFrom = null; s.ui.lastExport = null;
}

// layouts worth showing first for a given number of photos
export function suggestedLayouts(s, n) {
  const theme = currentTheme(s);
  const count = Math.max(1, n);
  const score = (l) => {
    const c = photoCellCount(l);
    const fit = c >= count && c <= count + 2 ? 0 : c < count ? (count - c) * 2 + 1 : c - count;
    return fit - (theme.suggested.includes(l.id) ? 0.5 : 0);
  };
  return [...LAYOUTS].sort((a, b) => score(a) - score(b)).slice(0, 6);
}

/* ---------------- history (multi-level undo / redo) ---------------- */
// A snapshot is the editable document: everything except transient UI state.
// Photos are shared by reference (their bitmaps are heavy and never mutated).
export function snapshot(s) {
  return {
    themeId: s.themeId, shapeId: s.shapeId, layoutId: s.layoutId, accent: s.accent,
    style: { palette: s.style.palette, font: s.style.font }, spacing: s.spacing,
    photos: [...s.photos],
    cells: s.cells.map(c => ({ ...c })),
    texts: { ...s.texts },
    textOv: JSON.parse(JSON.stringify(s.textOv)),
    cellOv: JSON.parse(JSON.stringify(s.cellOv)),
    hideText: s.ui.hideText,
  };
}
export function restore(s, snap) {
  s.themeId = snap.themeId; s.shapeId = snap.shapeId; s.layoutId = snap.layoutId; s.accent = snap.accent;
  s.style = { palette: snap.style.palette, font: snap.style.font }; s.spacing = snap.spacing;
  s.photos = [...snap.photos];
  s.cells = snap.cells.map(c => ({ ...c }));
  s.texts = { ...snap.texts };
  s.textOv = JSON.parse(JSON.stringify(snap.textOv));
  s.cellOv = JSON.parse(JSON.stringify(snap.cellOv));
  s.ui.hideText = snap.hideText;
  s.ui.selected = null; s.ui.selectedText = null; s.ui.swapFrom = null;
}
// comparable fingerprint of a snapshot (photos and styles by id)
export const docKey = (snap) => JSON.stringify({
  ...snap, photos: snap.photos.map(p => p.id), style: { palette: snap.style.palette?.id || null, font: snap.style.font?.id || null },
});

export class History {
  constructor(limit = 60) { this.limit = limit; this.past = []; this.future = []; this.pending = null; }
  get canUndo() { return this.past.length > 0; }
  get canRedo() { return this.future.length > 0; }
  clear() { this.past = []; this.future = []; this.pending = null; }
  #push(snap) { this.past.push(snap); if (this.past.length > this.limit) this.past.shift(); this.future = []; }
  // record the state BEFORE a discrete change
  commit(s) { this.pending = null; this.#push(snapshot(s)); }
  // continuous changes (drags, sliders, typing): remember where they started…
  begin(s) { if (!this.pending) this.pending = snapshot(s); }
  // …and record one step when they end, only if something actually changed
  end(s) {
    if (!this.pending) return false;
    const changed = docKey(this.pending) !== docKey(snapshot(s));
    if (changed) this.#push(this.pending);
    this.pending = null;
    return changed;
  }
  undo(s) {
    if (this.pending) this.end(s);
    if (!this.past.length) return false;
    this.future.push(snapshot(s));
    restore(s, this.past.pop());
    return true;
  }
  redo(s) {
    if (!this.future.length) return false;
    this.past.push(snapshot(s));
    restore(s, this.future.pop());
    return true;
  }
}

/* ---------------- draft serialization (pure; storage lives in draft.js) ---------------- */
import { PALETTES, FONT_SETS } from '../data/collage.js';
export const DRAFT_VERSION = 1;
export function serializeDraft(s, now = Date.now()) {
  const snap = snapshot(s);
  const pal = s.style.palette;
  return {
    v: DRAFT_VERSION, savedAt: now,
    themeId: snap.themeId, shapeId: snap.shapeId, layoutId: snap.layoutId, accent: snap.accent, spacing: snap.spacing,
    style: { paletteId: pal && !String(pal.id).startsWith('img-') ? pal.id : null, imagePalette: pal && String(pal.id).startsWith('img-') ? pal : null, fontId: s.style.font?.id || null },
    photos: snap.photos.map(p => ({ id: p.id, name: p.name, iw: p.iw, ih: p.ih })),
    cells: snap.cells, texts: snap.texts, textOv: snap.textOv, cellOv: snap.cellOv, hideText: snap.hideText,
  };
}
// rebuild a restorable snapshot from a saved draft and the re-decoded photos (by id);
// anything that no longer exists (a removed layout, a missing photo) degrades gracefully
export function deserializeDraft(draft, photosById) {
  if (!draft || draft.v !== DRAFT_VERSION) return null;
  const layout = LAYOUTS.find(l => l.id === draft.layoutId) || LAYOUTS[0];
  const theme = THEMES.find(t => t.id === draft.themeId) || THEMES[0];
  const shape = SHAPES.find(x => x.id === draft.shapeId) || SHAPES[0];
  const photos = draft.photos.map(p => photosById[p.id]).filter(Boolean);
  const ids = new Set(photos.map(p => p.id));
  let cells = Array.isArray(draft.cells) && draft.cells.length === layout.cells.length
    ? draft.cells.map(c => ({ ...emptyCell(), ...c, photoId: ids.has(c.photoId) ? c.photoId : null }))
    : layout.cells.map(emptyCell);
  return {
    themeId: theme.id, shapeId: shape.id, layoutId: layout.id, accent: draft.accent || null, spacing: +draft.spacing || 0,
    style: { palette: draft.style?.imagePalette || PALETTES.find(p => p.id === draft.style?.paletteId) || null, font: FONT_SETS.find(f => f.id === draft.style?.fontId) || null },
    photos, cells, texts: { ...(draft.texts || {}) }, textOv: { ...(draft.textOv || {}) }, cellOv: { ...(draft.cellOv || {}) }, hideText: draft.hideText !== false,
  };
}
