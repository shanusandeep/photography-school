// ============================================================
// The Print Table — themed collage studio.
//
// One renderer, two outputs: the on-screen preview and the print
// export both call geometry() + drawBackground/drawCell/drawForeground
// with different pixel sizes. All crop state is normalized, so what
// you see is what you download.
//
// Photos never leave the browser: files stay as File objects, we keep
// a ≤1600px working bitmap for editing and re-decode the originals
// one at a time at export.
// ============================================================

import { SHAPES, LAYOUTS, THEMES, exportPresets } from './data/collage.js';

/* ============================================================
   state (module singleton — survives hash navigation)
   ============================================================ */
const emptyCell = () => ({ photoId: null, zoom: 1, panX: 0.5, panY: 0.5 });

const state = {
  themeId: 'birthday',
  shapeId: 'square',
  layoutId: 'polaroid-wall',
  accent: null,               // null = theme default
  photos: [],                 // { id, file, name, iw, ih, bmp }
  cells: [],                  // one per layout cell
  texts: {},                  // slotId -> user text (absent = theme default)
  undo: null,                 // single-level snapshot of cells
  ui: { selected: null, swapFrom: null, preset: 'web', format: 'jpeg', lastExport: null },
};
state.cells = currentLayout().cells.map(emptyCell);

let nextPhotoId = 1;

function currentTheme() { return THEMES.find(t => t.id === state.themeId); }
function currentShape() { return SHAPES.find(s => s.id === state.shapeId); }
function currentLayout() { return LAYOUTS.find(l => l.id === state.layoutId); }
function photoById(id) { return state.photos.find(p => p.id === id) || null; }
function accentColor() { return state.accent || currentTheme().palette.accent; }
function hasContent() { return state.photos.length > 0 || Object.keys(state.texts).length > 0; }
function slotText(slot) { return state.texts[slot.id] !== undefined ? state.texts[slot.id] : slot.default; }

window.addEventListener('beforeunload', (e) => {
  if (hasContent()) { e.preventDefault(); e.returnValue = ''; }
});

/* ============================================================
   fonts — must be loaded before ANY render so text wraps the same
   in preview and export
   ============================================================ */
const fontLoads = new Map();
function ensureFonts(theme) {
  const { family, param, weight, italic } = theme.font;
  if (!fontLoads.has(family)) {
    fontLoads.set(family, (async () => {
      if (!document.getElementById(`gf-${family}`)) {
        const link = document.createElement('link');
        link.id = `gf-${family}`; link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, '+')}:${param}&display=swap`;
        document.head.appendChild(link);
      }
      try {
        await document.fonts.load(`${italic ? 'italic ' : ''}${weight} 40px "${family}"`);
        await document.fonts.load('400 20px "Hanken Grotesk"');
      } catch { /* fall back to system font; still deterministic per device */ }
    })());
  }
  return fontLoads.get(family);
}

/* ============================================================
   geometry — shared by preview, thumbnails and export
   ============================================================ */
function geometry(W, H, opts = {}) {
  const theme = opts.theme || currentTheme();
  const layout = opts.layout || currentLayout();
  const m = theme.margin * Math.min(W, H);
  const bandH = theme.band.h * H;
  const top = theme.band.pos === 'top';
  const content = { x: m, y: top ? bandH : m, w: W - 2 * m, h: H - bandH - m };
  const band = { x: m, y: top ? 0 : H - bandH, w: W - 2 * m, h: bandH };
  const insetB = Math.min(W, H) * 0.012;

  const cells = layout.cells.map((c) => {
    if (layout.polaroid) {
      const frameW = c.w * Math.min(content.w, content.h * 1.02);
      const frameH = frameW * 1.2;
      const center = { x: content.x + c.x * content.w, y: content.y + c.y * content.h };
      const rect = { x: center.x - frameW / 2, y: center.y - frameH / 2, w: frameW, h: frameH };
      const pad = frameW * 0.065;
      const photo = { x: rect.x + pad, y: rect.y + pad, w: frameW - 2 * pad, h: frameW - 2 * pad };
      return { rect, photo, center, rot: (c.rot || 0) * Math.PI / 180, polaroid: true };
    }
    const rect = { x: content.x + c.x * content.w, y: content.y + c.y * content.h, w: c.w * content.w, h: c.h * content.h };
    const photo = c.inset ? { x: rect.x + insetB, y: rect.y + insetB, w: rect.w - 2 * insetB, h: rect.h - 2 * insetB } : rect;
    return { rect, photo, center: { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 }, rot: 0, inset: !!c.inset };
  });
  return { W, H, theme, layout, content, band, cells };
}

// cover-fit a photo into a box, then apply zoom + normalized pan
function fitPhoto(box, iw, ih, cell) {
  const s = Math.max(box.w / iw, box.h / ih) * cell.zoom;
  const dw = iw * s, dh = ih * s;
  return { s, dw, dh, dx: box.x - (dw - box.w) * cell.panX, dy: box.y - (dh - box.h) * cell.panY };
}

const isDark = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) < 128;
};

/* ============================================================
   drawing
   ============================================================ */
function drawBackground(ctx, g) {
  const { theme, layout, W, H, content } = g;
  ctx.fillStyle = theme.palette.bg;
  ctx.fillRect(0, 0, W, H);

  if (layout.deco === 'filmstrip') {
    const y0 = content.y + content.h * 0.22, y1 = content.y + content.h * 0.78;
    ctx.fillStyle = '#0c0b09';
    ctx.fillRect(content.x, y0, content.w, y1 - y0);
    ctx.fillStyle = theme.palette.bg;
    const holeW = content.w * 0.018, holeH = (y1 - y0) * 0.06, step = content.w * 0.036;
    for (let x = content.x + step / 2; x < content.x + content.w - holeW; x += step) {
      ctx.fillRect(x, y0 + holeH * 0.6, holeW, holeH);
      ctx.fillRect(x, y1 - holeH * 1.6, holeW, holeH);
    }
  }
}

function drawCell(ctx, g, i, image, opts = {}) {
  const cell = g.cells[i], c = state.cells[i];
  const { theme } = g;
  ctx.save();
  if (cell.rot) { ctx.translate(cell.center.x, cell.center.y); ctx.rotate(cell.rot); ctx.translate(-cell.center.x, -cell.center.y); }

  if (cell.polaroid) {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = g.W * 0.02; ctx.shadowOffsetY = g.W * 0.006;
    ctx.fillStyle = theme.palette.mat;
    ctx.fillRect(cell.rect.x, cell.rect.y, cell.rect.w, cell.rect.h);
    ctx.restore();
  } else if (cell.inset) {
    ctx.fillStyle = theme.palette.mat;
    ctx.fillRect(cell.rect.x, cell.rect.y, cell.rect.w, cell.rect.h);
  }

  const p = cell.photo;
  ctx.beginPath(); ctx.rect(p.x, p.y, p.w, p.h); ctx.clip();
  if (image) {
    const f = fitPhoto(p, image.width, image.height, c);
    ctx.drawImage(image, f.dx, f.dy, f.dw, f.dh);
  } else {
    const dark = isDark(theme.palette.bg);
    ctx.fillStyle = cell.polaroid ? 'rgba(0,0,0,.08)' : dark ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.06)';
    ctx.fillRect(p.x, p.y, p.w, p.h);
    if (opts.preview) {
      const s = Math.min(p.w, p.h);
      ctx.strokeStyle = dark && !cell.polaroid ? 'rgba(255,255,255,.25)' : 'rgba(0,0,0,.22)';
      ctx.lineWidth = 1.5; ctx.setLineDash([6, 5]);
      ctx.strokeRect(p.x + 4, p.y + 4, p.w - 8, p.h - 8);
      ctx.setLineDash([]);
      ctx.fillStyle = ctx.strokeStyle;
      ctx.font = `300 ${Math.max(18, s * 0.28)}px "Hanken Grotesk"`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('+', p.x + p.w / 2, p.y + p.h / 2);
    }
  }
  ctx.restore();
}

function drawForeground(ctx, g) {
  drawOrnaments(ctx, g);
  drawTextBand(ctx, g);
}

/* ---- seeded scatter so ornaments land identically at any size ---- */
function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

function heartPath(ctx, x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.3);
  ctx.bezierCurveTo(x, y, x - s * 0.5, y, x - s * 0.5, y + s * 0.3);
  ctx.bezierCurveTo(x - s * 0.5, y + s * 0.6, x, y + s * 0.8, x, y + s);
  ctx.bezierCurveTo(x, y + s * 0.8, x + s * 0.5, y + s * 0.6, x + s * 0.5, y + s * 0.3);
  ctx.bezierCurveTo(x + s * 0.5, y, x, y, x, y + s * 0.3);
  ctx.closePath();
}
function starPath(ctx, x, y, s) {
  ctx.beginPath();
  for (let k = 0; k < 8; k++) {
    const r = k % 2 ? s * 0.38 : s, a = k * Math.PI / 4 - Math.PI / 2;
    ctx[k ? 'lineTo' : 'moveTo'](x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  ctx.closePath();
}
function leafPath(ctx, x, y, len, ang) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  ctx.beginPath(); ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(len * 0.5, -len * 0.32, len, 0);
  ctx.quadraticCurveTo(len * 0.5, len * 0.32, 0, 0);
  ctx.closePath(); ctx.restore();
}

function drawOrnaments(ctx, g) {
  const { theme, band, W, H } = g;
  const accent = accentColor();
  const u = Math.min(W, H);
  const r = rng(7);
  ctx.save();
  switch (theme.ornament) {
    case 'confetti': {
      const colors = [accent, theme.palette.mat, '#e05a6d', '#5ab0d6'];
      for (let k = 0; k < 46; k++) {
        const inBand = k < 30;
        const x = inBand ? band.x + r() * band.w : r() * W;
        const y = inBand ? band.y + r() * band.h : (theme.band.pos === 'top' ? H - r() * u * 0.12 : r() * u * 0.12);
        ctx.save(); ctx.translate(x, y); ctx.rotate(r() * Math.PI);
        ctx.fillStyle = colors[k % colors.length]; ctx.globalAlpha = 0.85;
        const s = u * (0.006 + r() * 0.01);
        if (k % 3) ctx.fillRect(-s, -s * 0.45, s * 2, s * 0.9);
        else { ctx.beginPath(); ctx.arc(0, 0, s * 0.7, 0, Math.PI * 2); ctx.fill(); }
        ctx.restore();
      }
      break;
    }
    case 'stars': {
      ctx.fillStyle = accent;
      for (let k = 0; k < 16; k++) {
        const side = k % 2 ? 0 : 1;                         // keep the middle clear for the words
        const x = band.x + (side ? 0.78 + r() * 0.2 : 0.02 + r() * 0.2) * band.w;
        const y = band.y + (0.15 + r() * 0.7) * band.h;
        ctx.globalAlpha = 0.35 + r() * 0.65;
        starPath(ctx, x, y, u * (0.006 + r() * 0.012)); ctx.fill();
      }
      break;
    }
    case 'hearts': {
      ctx.fillStyle = accent;
      for (let k = 0; k < 12; k++) {
        const side = k % 2;
        const x = band.x + (side ? 0.8 + r() * 0.18 : 0.02 + r() * 0.18) * band.w;
        const y = band.y + (0.1 + r() * 0.6) * band.h;
        ctx.globalAlpha = 0.3 + r() * 0.6;
        heartPath(ctx, x, y, u * (0.012 + r() * 0.018)); ctx.fill();
      }
      break;
    }
    case 'laurel': {
      ctx.fillStyle = accent; ctx.strokeStyle = accent; ctx.lineWidth = Math.max(1, u * 0.002);
      const y = band.y + band.h * 0.5, len = u * 0.028;
      [[band.x, 1], [band.x + band.w, -1]].forEach(([x0, dir]) => {
        ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + dir * band.w * 0.14, y); ctx.stroke();
        for (let k = 0; k < 6; k++) {
          const x = x0 + dir * (k + 0.5) * band.w * 0.022;
          leafPath(ctx, x, y, len * dir, -0.9); ctx.fill();
          leafPath(ctx, x, y, len * dir, 0.9); ctx.fill();
        }
      });
      break;
    }
    case 'leaves': {
      ctx.fillStyle = accent;
      const edgeY = theme.band.pos === 'top' ? band.y + band.h * 0.96 : band.y + band.h * 0.04;
      const len = u * 0.03;
      for (let k = 0; k < 22; k++) {
        const x = band.x + (k + 0.5) / 22 * band.w;
        ctx.globalAlpha = 0.45 + (k % 3) * 0.2;
        leafPath(ctx, x, edgeY, len, (theme.band.pos === 'top' ? -1 : 1) * (0.45 + (k % 2) * 0.5)); ctx.fill();
      }
      break;
    }
    case 'corners': {
      ctx.strokeStyle = accent; ctx.lineWidth = Math.max(1, u * 0.0025);
      const L = u * 0.03, o = u * 0.014;
      [[o, o, 1, 1], [W - o, o, -1, 1], [o, H - o, 1, -1], [W - o, H - o, -1, -1]].forEach(([x, y, sx, sy]) => {
        ctx.beginPath(); ctx.moveTo(x, y + sy * L); ctx.lineTo(x, y); ctx.lineTo(x + sx * L, y); ctx.stroke();
      });
      break;
    }
  }
  ctx.restore();
}

function fontStr(theme, size, kind) {
  if (kind === 'body') return `400 ${size}px "Hanken Grotesk", sans-serif`;
  const f = theme.font;
  return `${f.italic ? 'italic ' : ''}${f.weight} ${size}px "${f.family}", serif`;
}
// shrink font size until the line fits; deterministic across scales
function fitFont(ctx, text, theme, size, kind, maxW) {
  let s = size;
  ctx.font = fontStr(theme, s, kind);
  while (s > size * 0.35 && ctx.measureText(text).width > maxW) { s *= 0.94; ctx.font = fontStr(theme, s, kind); }
  return s;
}

function drawTextBand(ctx, g) {
  const { theme, band } = g;
  const slots = Object.fromEntries(theme.slots.map(s => [s.style, slotText(s).trim()]));
  const padX = band.w * 0.03;
  ctx.save();
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = theme.palette.text;

  if (slots.numeral) {
    ctx.textAlign = 'left';
    const nSize = fitFont(ctx, slots.numeral, theme, band.h * 0.8, 'display', band.w * 0.4);
    const nw = ctx.measureText(slots.numeral).width;
    ctx.fillStyle = accentColor();
    ctx.fillText(slots.numeral, band.x + padX, band.y + band.h * 0.5 + nSize * 0.36);
    const tx = band.x + padX + nw + band.h * 0.22;
    const avail = band.x + band.w - padX - tx;
    ctx.fillStyle = theme.palette.text;
    if (slots.headline) { fitFont(ctx, slots.headline, theme, band.h * 0.3, 'display', avail); ctx.fillText(slots.headline, tx, band.y + band.h * 0.5); }
    if (slots.subline) { fitFont(ctx, slots.subline, theme, band.h * 0.13, 'body', avail); ctx.globalAlpha = 0.8; ctx.fillText(slots.subline, tx, band.y + band.h * 0.73); }
  } else {
    ctx.textAlign = 'center';
    const cx = band.x + band.w / 2, avail = band.w - 2 * padX;
    if (slots.headline) { fitFont(ctx, slots.headline, theme, band.h * 0.4, 'display', avail); ctx.fillText(slots.headline, cx, band.y + band.h * 0.55); }
    if (slots.subline) { fitFont(ctx, slots.subline, theme, band.h * 0.14, 'body', avail); ctx.globalAlpha = 0.8; ctx.fillText(slots.subline, cx, band.y + band.h * 0.82); }
  }
  ctx.restore();
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
      const c = document.createElement('canvas'); c.width = Math.round(sw / 2); c.height = Math.round(sh / 2);
      c.getContext('2d').drawImage(src, 0, 0, c.width, c.height); src = c; sw = c.width; sh = c.height;
    }
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    c.getContext('2d').drawImage(src, 0, 0, w, h);
    return c;
  }
}

async function addPhotos(files, targetCell = null) {
  const added = [];
  for (const file of files) {
    if (!file.type.startsWith('image/')) continue;
    const url = URL.createObjectURL(file);
    try {
      const img = await loadImg(url);
      const iw = img.naturalWidth, ih = img.naturalHeight;
      const k = Math.min(1, 1600 / Math.max(iw, ih));
      const bmp = await resized(img, Math.max(1, Math.round(iw * k)), Math.max(1, Math.round(ih * k)));
      const photo = { id: nextPhotoId++, file, name: file.name, iw, ih, bmp };
      state.photos.push(photo); added.push(photo);
    } catch { /* unreadable file — skip */ }
    finally { URL.revokeObjectURL(url); }
  }
  if (!added.length) return;
  pushUndo();
  let first = true;
  for (const p of added) {
    let idx = -1;
    if (first && targetCell !== null) idx = targetCell;
    else idx = state.cells.findIndex(c => !c.photoId);
    if (idx >= 0) state.cells[idx] = { ...emptyCell(), photoId: p.id };
    first = false;
  }
}

/* ============================================================
   state operations
   ============================================================ */
function pushUndo() { state.undo = state.cells.map(c => ({ ...c })); }
function undo() { if (state.undo) { state.cells = state.undo; state.undo = null; } }

function setLayout(id) {
  if (id === state.layoutId) return;
  // placed photos first (in cell order), then the tray — so a 6→4→6 round trip restores everything
  const placed = state.cells.map(c => c.photoId).filter(Boolean);
  const order = [...placed, ...state.photos.map(p => p.id).filter(pid => !placed.includes(pid))];
  state.layoutId = id;
  state.cells = currentLayout().cells.map(emptyCell);
  order.forEach((pid, i) => { if (i < state.cells.length) state.cells[i].photoId = pid; });
  state.ui.selected = null; state.ui.swapFrom = null; state.undo = null;
}
function setTheme(id) { state.themeId = id; state.accent = null; }
function setShape(id) { state.shapeId = id; if (!exportPresets(currentShape()).some(p => p.id === state.ui.preset)) state.ui.preset = 'web'; }
function swapCells(a, b) {
  if (a === b) return;
  pushUndo();
  const t = state.cells[a]; state.cells[a] = state.cells[b]; state.cells[b] = t;
}
function assignPhoto(cellIdx, photoId) {
  pushUndo();
  state.cells[cellIdx] = { ...emptyCell(), photoId };
}
function clearCell(i) { pushUndo(); state.cells[i] = emptyCell(); }
function removePhoto(photoId) {
  pushUndo();
  state.cells.forEach((c, i) => { if (c.photoId === photoId) state.cells[i] = emptyCell(); });
  const p = photoById(photoId);
  if (p && p.bmp && p.bmp.close) p.bmp.close();
  state.photos = state.photos.filter(p => p.id !== photoId);
}
function resetAll() {
  state.photos.forEach(p => p.bmp && p.bmp.close && p.bmp.close());
  state.photos = []; state.texts = {}; state.accent = null; state.undo = null;
  state.cells = currentLayout().cells.map(emptyCell);
  state.ui.selected = null; state.ui.swapFrom = null; state.ui.lastExport = null;
}

// effective print resolution of a cell's photo at a given export size
function cellQuality(g, i) {
  const c = state.cells[i], p = photoById(c.photoId);
  if (!p) return null;
  const f = fitPhoto(g.cells[i].photo, p.iw, p.ih, c);
  return { upscale: f.s, dpi: 300 / Math.max(1, f.s) };
}

/* ============================================================
   export
   ============================================================ */
async function exportCollage(preset, format) {
  const theme = currentTheme();
  await ensureFonts(theme);
  const type = format === 'png' ? 'image/png' : 'image/jpeg';
  let result = null;
  for (const k of [1, 0.75, 0.5]) {
    const W = Math.round(preset.w * k), H = Math.round(preset.h * k);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('no context');
      const g = geometry(W, H);
      drawBackground(ctx, g);
      // decode originals one at a time, sized exactly to what the cell draws, then release
      for (let i = 0; i < g.cells.length; i++) {
        const c = state.cells[i], p = photoById(c.photoId);
        if (!p) { drawCell(ctx, g, i, null); continue; }
        const f = fitPhoto(g.cells[i].photo, p.iw, p.ih, c);
        const url = URL.createObjectURL(p.file);
        let bmp;
        try {
          const img = await loadImg(url);
          bmp = await resized(img, Math.max(1, Math.round(f.dw)), Math.max(1, Math.round(f.dh)));
          drawCell(ctx, g, i, bmp);
        } finally {
          URL.revokeObjectURL(url);
          if (bmp && bmp.close) bmp.close();
        }
      }
      drawForeground(ctx, g);
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
  const theme = currentTheme(), shape = currentShape();

  app.innerHTML = `
  <div class="view pt">
    <div class="crumbs"><a href="#/">Studio</a> / <span>The Print Table</span></div>
    <div class="pt-head">
      <div>
        <span class="mono" style="color:var(--amber)">COLLAGE STUDIO</span>
        <h1>The Print Table</h1>
        <p>Pick a theme, choose a shape, lay out your photos, add the words — then download a print-quality file. Your photos never leave this device.</p>
      </div>
    </div>

    <div class="pt-layout">
      <aside class="pt-side">
        <section class="pt-step">
          <div class="pt-step-title"><span class="mono">01 · Theme</span></div>
          <div class="pt-chips" data-themes>
            ${THEMES.map(t => `<button class="pt-chip ${t.id === state.themeId ? 'on' : ''}" data-theme="${t.id}"><b>${t.name}</b><span>${t.tag}</span></button>`).join('')}
          </div>
          <label class="pt-accent"><span class="mono">Accent</span><input type="color" data-accent value="${accentColor()}"><button class="chip" data-accent-reset>reset</button></label>
        </section>

        <section class="pt-step">
          <div class="pt-step-title"><span class="mono">02 · Shape</span></div>
          <div class="pt-chips" data-shapes>
            ${SHAPES.map(s => `<button class="pt-chip ${s.id === state.shapeId ? 'on' : ''}" data-shape="${s.id}"><b>${s.name}</b><span>${s.hint}</span></button>`).join('')}
          </div>
        </section>

        <section class="pt-step">
          <div class="pt-step-title"><span class="mono">03 · Layout</span><span class="mono pt-suggest">★ suits this theme</span></div>
          <div class="pt-layouts" data-layouts></div>
        </section>

        <section class="pt-step">
          <div class="pt-step-title"><span class="mono">04 · Words</span></div>
          <div data-slots></div>
        </section>
      </aside>

      <main class="pt-main">
        <div class="pt-canvas-wrap" data-wrap>
          <canvas data-preview aria-label="Collage preview"></canvas>
          <div class="pt-toolbar" data-toolbar hidden>
            <button data-act="zoom-out" title="Zoom out">−</button>
            <button data-act="zoom-in" title="Zoom in">+</button>
            <span class="pt-sep"></span>
            <button data-act="up" title="Move to previous cell">↑</button>
            <button data-act="down" title="Move to next cell">↓</button>
            <button data-act="swap" title="Swap with another cell">⇄ Swap</button>
            <span class="pt-sep"></span>
            <button data-act="replace" title="Replace photo">Replace</button>
            <button data-act="clear" title="Clear cell">✕</button>
          </div>
        </div>
        <p class="pt-hint" data-hint>Click an empty cell to add photos · drag a photo to reposition · scroll or pinch to zoom · click a photo for more controls</p>

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

  /* ---------- preview rendering ---------- */
  function sizeCanvas() {
    const ar = currentShape().ar;
    cssW = Math.max(200, wrap.clientWidth);
    cssH = Math.round(cssW / ar);
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.style.width = `${cssW}px`; canvas.style.height = `${cssH}px`;
    canvas.width = Math.round(cssW * dpr); canvas.height = Math.round(cssH * dpr);
  }

  function draw() {
    raf = 0;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const g = geometry(cssW, cssH);
    drawBackground(ctx, g);
    g.cells.forEach((_, i) => drawCell(ctx, g, i, photoById(state.cells[i].photoId)?.bmp || null, { preview: true }));
    drawForeground(ctx, g);

    // low-resolution badges for the chosen export size
    const preset = currentPreset();
    const ge = geometry(preset.w, preset.h);
    g.cells.forEach((cell, i) => {
      const q = cellQuality(ge, i);
      if (!q || q.dpi >= 150) return;
      ctx.save();
      if (cell.rot) { ctx.translate(cell.center.x, cell.center.y); ctx.rotate(cell.rot); ctx.translate(-cell.center.x, -cell.center.y); }
      const r = 9, x = cell.photo.x + cell.photo.w - r - 6, y = cell.photo.y + r + 6;
      ctx.fillStyle = '#e8a33d'; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#12100d'; ctx.font = '700 12px "Hanken Grotesk"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('!', x, y + 0.5);
      ctx.restore();
    });

    // selection / swap highlight
    const hi = state.ui.swapFrom ?? state.ui.selected;
    if (hi !== null && g.cells[hi]) {
      const cell = g.cells[hi];
      ctx.save();
      if (cell.rot) { ctx.translate(cell.center.x, cell.center.y); ctx.rotate(cell.rot); ctx.translate(-cell.center.x, -cell.center.y); }
      ctx.strokeStyle = state.ui.swapFrom !== null ? '#7fa650' : '#e8a33d'; ctx.lineWidth = 2.5; ctx.setLineDash([7, 5]);
      ctx.strokeRect(cell.rect.x - 2, cell.rect.y - 2, cell.rect.w + 4, cell.rect.h + 4);
      ctx.restore();
    }
    positionToolbar(g);
  }
  const redraw = () => { if (!raf) raf = requestAnimationFrame(draw); };

  function positionToolbar(g) {
    const i = state.ui.selected;
    if (i === null || !state.cells[i]?.photoId || state.ui.swapFrom !== null) { toolbar.hidden = true; return; }
    const cell = g.cells[i];
    toolbar.hidden = false;
    const half = Math.hypot(cell.rect.w, cell.rect.h) / 2;
    const top = Math.min(cssH - 44, cell.center.y + (cell.rot ? half * 0.9 : cell.rect.h / 2) + 8);
    toolbar.style.left = `${Math.max(120, Math.min(cssW - 120, cell.center.x))}px`;
    toolbar.style.top = `${top}px`;
  }

  /* ---------- side panel ---------- */
  function currentPreset() { return exportPresets(currentShape()).find(p => p.id === state.ui.preset) || exportPresets(currentShape())[0]; }

  function renderLayouts() {
    const box = $('[data-layouts]');
    const theme = currentTheme(), shape = currentShape();
    box.innerHTML = LAYOUTS.map(l => `
      <button class="pt-layout-btn ${l.id === state.layoutId ? 'on' : ''}" data-layout="${l.id}" title="${l.desc}">
        <canvas width="${Math.round(88 * (shape.ar >= 1 ? 1 : shape.ar))}" height="${Math.round(88 * (shape.ar >= 1 ? 1 / shape.ar : 1))}"></canvas>
        <span>${theme.suggested.includes(l.id) ? '★ ' : ''}${l.name}</span>
      </button>`).join('');
    box.querySelectorAll('[data-layout]').forEach(btn => {
      const c = btn.querySelector('canvas'), cx = c.getContext('2d');
      const layout = LAYOUTS.find(l => l.id === btn.dataset.layout);
      const g = geometry(c.width, c.height, { layout });
      cx.fillStyle = theme.palette.bg; cx.fillRect(0, 0, c.width, c.height);
      cx.fillStyle = isDark(theme.palette.bg) ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.1)';
      cx.fillRect(g.band.x, g.band.y, g.band.w, g.band.h);
      cx.fillStyle = accentColor();
      g.cells.forEach(cell => {
        cx.save();
        if (cell.rot) { cx.translate(cell.center.x, cell.center.y); cx.rotate(cell.rot); cx.translate(-cell.center.x, -cell.center.y); }
        cx.globalAlpha = 0.85; cx.fillRect(cell.rect.x, cell.rect.y, cell.rect.w, cell.rect.h);
        cx.restore();
      });
      btn.addEventListener('click', () => { setLayout(btn.dataset.layout); renderLayouts(); renderThumbs(); updateExport(); redraw(); });
    });
  }

  function renderSlots() {
    const theme = currentTheme();
    $('[data-slots]').innerHTML = theme.slots.map(s => `
      <label class="field pt-field"><span>${s.label}</span>
        <input type="text" data-slot="${s.id}" value="${esc(slotText(s))}" maxlength="${s.style === 'numeral' ? 6 : 80}" placeholder="${esc(s.default)}">
      </label>`).join('');
    $('[data-slots]').querySelectorAll('[data-slot]').forEach(inp => inp.addEventListener('input', () => {
      state.texts[inp.dataset.slot] = inp.value;
      redraw();
    }));
  }

  function renderThumbs() {
    const box = $('[data-thumbs]');
    box.innerHTML = '';
    if (!state.photos.length) { box.innerHTML = '<span class="pt-tray-empty">No photos yet — add some, or click any empty cell.</span>'; return; }
    state.photos.forEach(p => {
      const inCell = state.cells.findIndex(c => c.photoId === p.id);
      const el = document.createElement('div');
      el.className = `pt-thumb ${inCell >= 0 ? 'placed' : ''}`;
      el.title = inCell >= 0 ? `${p.name} — in cell ${inCell + 1}. Click to move to the selected cell.` : `${p.name} — not placed. Click to place.`;
      const c = document.createElement('canvas'); c.width = 64; c.height = 64;
      const cx = c.getContext('2d');
      const s = Math.max(64 / p.bmp.width, 64 / p.bmp.height);
      cx.drawImage(p.bmp, (64 - p.bmp.width * s) / 2, (64 - p.bmp.height * s) / 2, p.bmp.width * s, p.bmp.height * s);
      el.appendChild(c);
      if (inCell >= 0) { const b = document.createElement('i'); b.textContent = inCell + 1; el.appendChild(b); }
      const rm = document.createElement('button'); rm.textContent = '✕'; rm.title = 'Remove photo';
      rm.addEventListener('click', (e) => { e.stopPropagation(); removePhoto(p.id); afterChange(); });
      el.appendChild(rm);
      el.addEventListener('click', () => {
        let idx = state.ui.selected;
        if (idx === null) idx = state.cells.findIndex(c => !c.photoId);
        if (idx < 0 || idx === null) idx = 0;
        assignPhoto(idx, p.id);
        state.ui.selected = idx;
        afterChange();
      });
      box.appendChild(el);
    });
  }

  function updateExport() {
    const shape = currentShape();
    const presets = exportPresets(shape);
    const sel = $('[data-preset]');
    sel.innerHTML = presets.map(p => `<option value="${p.id}" ${p.id === state.ui.preset ? 'selected' : ''}>${p.label} — ${p.w} × ${p.h}</option>`).join('');
    const p = currentPreset();
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
  let drag = null;   // { i, startX, startY, panX, panY, moved, overX, overY, rot }
  let pinch = null;  // { i, dist, zoom }
  // canvas-local coordinates from client coords (offsetX is unreliable under transforms / off-screen)
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
    if (!c.photoId) { fileTarget = i; state.ui.selected = i; fileInput.click(); redraw(); return; }
    const g = geometry(cssW, cssH);
    const p = photoById(c.photoId);
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
    if (pinch && pointers.size < 2) { pinch = null; updateExport(); }
    if (drag) { drag = null; updateExport(); }
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
    const c = state.cells[i];
    switch (act) {
      case 'zoom-in': c.zoom = Math.min(4, c.zoom * 1.15); break;
      case 'zoom-out': c.zoom = Math.max(1, c.zoom / 1.15); break;
      case 'up': if (i > 0) { swapCells(i, i - 1); state.ui.selected = i - 1; } break;
      case 'down': if (i < state.cells.length - 1) { swapCells(i, i + 1); state.ui.selected = i + 1; } break;
      case 'swap': state.ui.swapFrom = i; $('[data-hint]').textContent = 'Swap mode — click the cell to swap with (click the same cell to cancel).'; break;
      case 'replace': fileTarget = i; fileInput.click(); break;
      case 'clear': clearCell(i); break;
    }
    afterChange();
  });

  /* ---------- file input / tray ---------- */
  fileInput.addEventListener('change', async () => {
    const files = [...fileInput.files];
    fileInput.value = '';
    if (!files.length) return;
    $('[data-hint]').textContent = 'Loading photos…';
    await addPhotos(files, fileTarget);
    fileTarget = null;
    $('[data-hint]').textContent = 'Drag a photo to reposition · scroll or pinch to zoom · click a photo for more controls';
    afterChange();
  });
  $('[data-add]').addEventListener('click', () => { fileTarget = null; fileInput.click(); });

  // drop files straight onto the canvas
  wrap.addEventListener('dragover', (e) => { e.preventDefault(); wrap.classList.add('drop'); });
  wrap.addEventListener('dragleave', () => wrap.classList.remove('drop'));
  wrap.addEventListener('drop', async (e) => {
    e.preventDefault(); wrap.classList.remove('drop');
    const r = canvas.getBoundingClientRect();
    const i = hitTest(e.clientX - r.left, e.clientY - r.top);
    await addPhotos([...e.dataTransfer.files], i >= 0 ? i : null);
    afterChange();
  });

  /* ---------- theme / shape / accent ---------- */
  $('[data-themes]').addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-theme]'); if (!btn) return;
    setTheme(btn.dataset.theme);
    $('[data-themes]').querySelectorAll('.pt-chip').forEach(b => b.classList.toggle('on', b === btn));
    $('[data-accent]').value = accentColor();
    await ensureFonts(currentTheme());
    renderLayouts(); renderSlots(); afterChange();
  });
  $('[data-shapes]').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-shape]'); if (!btn) return;
    setShape(btn.dataset.shape);
    $('[data-shapes]').querySelectorAll('.pt-chip').forEach(b => b.classList.toggle('on', b === btn));
    sizeCanvas(); renderLayouts(); afterChange();
  });
  $('[data-accent]').addEventListener('input', (e) => { state.accent = e.target.value; renderLayouts(); redraw(); });
  $('[data-accent-reset]').addEventListener('click', () => { state.accent = null; $('[data-accent]').value = accentColor(); renderLayouts(); redraw(); });

  /* ---------- export ---------- */
  $('[data-preset]').addEventListener('change', (e) => { state.ui.preset = e.target.value; updateExport(); redraw(); });
  $('[data-format]').addEventListener('change', (e) => { state.ui.format = e.target.value; });
  $('[data-undo]').addEventListener('click', () => { undo(); afterChange(); });
  $('[data-new]').addEventListener('click', () => {
    if (hasContent() && !confirm('Discard this collage and start a new one?')) return;
    resetAll(); renderSlots(); afterChange();
  });
  $('[data-download]').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    btn.disabled = true; btn.textContent = 'Rendering…';
    try {
      state.ui.lastExport = await exportCollage(currentPreset(), state.ui.format);
    } catch (err) {
      alert('Export failed — this device could not render the collage. Try a smaller size.');
    } finally {
      btn.disabled = false; btn.textContent = 'Download';
      updateExport();
    }
  });

  /* ---------- boot ---------- */
  const ro = new ResizeObserver(() => { sizeCanvas(); redraw(); });
  ro.observe(wrap);
  sizeCanvas();
  renderLayouts(); renderSlots(); renderThumbs(); updateExport();
  ensureFonts(theme).then(() => { renderLayouts(); redraw(); });
  draw();
}
