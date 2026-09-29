// ============================================================
// Collage Maker — canvas renderer.
//
// One renderer, two outputs: the on-screen preview and the print
// export both call geometry() + drawBackground/drawCell/drawForeground
// with different pixel sizes, so what you see is what you download.
// Needs a 2D context; never touches the DOM otherwise.
// ============================================================

import { DEFAULT_BODY } from '../data/collage.js';
import { slotText, textOv, textVisible, slotsFor, fitPhoto, accentColor, photoById, textStyle, textFont } from './core.js';

/* ---------------- colour helpers ---------------- */
export const isDark = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) < 128;
};
const inkOn = (bg) => isDark(bg) ? '#f4efe6' : '#1a1712';   // legible ink for a given panel colour
const lumOf = ([r, g, b]) => 0.299 * r + 0.587 * g + 0.114 * b;
const satOf = ([r, g, b]) => Math.max(r, g, b) - Math.min(r, g, b);
const mixC = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
export const hexC = (c) => '#' + c.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');

/* ---------------- photo colours (needs a canvas to sample) ---------------- */
// up to five distinct dominant colours of a photo, most common first
export function photoColors(p, makeCanvas) {
  if (p.colors) return p.colors;
  const c = makeCanvas(32, 32);
  const cx = c.getContext('2d', { willReadFrequently: true });
  cx.drawImage(p.bmp, 0, 0, 32, 32);
  const d = cx.getImageData(0, 0, 32, 32).data;
  const buckets = new Map();
  for (let i = 0; i < d.length; i += 4) {
    const key = `${d[i] >> 5},${d[i + 1] >> 5},${d[i + 2] >> 5}`;
    const b = buckets.get(key) || { n: 0, r: 0, g: 0, b: 0 };
    b.n++; b.r += d[i]; b.g += d[i + 1]; b.b += d[i + 2];
    buckets.set(key, b);
  }
  const sorted = [...buckets.values()].sort((a, b) => b.n - a.n).map(b => [b.r / b.n, b.g / b.n, b.b / b.n]);
  const picked = [];
  for (const col of sorted) {
    if (picked.every(q => Math.hypot(q[0] - col[0], q[1] - col[1], q[2] - col[2]) > 48)) picked.push(col);
    if (picked.length === 5) break;
  }
  p.colors = picked.map(c => c.map(v => v | 0));
  return p.colors;
}
// turn a photo's colours into bg / panel / mat / text / accent roles that stay legible
export function rolesFromColors(cols) {
  const sorted = [...cols].sort((a, b) => lumOf(a) - lumOf(b));
  let dark = sorted[0], light = sorted[sorted.length - 1];
  if (lumOf(light) < 170) light = mixC(light, [255, 255, 255], 0.55);
  if (lumOf(dark) > 90) dark = mixC(dark, [0, 0, 0], 0.6);
  const mids = sorted.slice(1, -1);
  const accent = (mids.length ? mids : sorted).slice().sort((a, b) => satOf(b) - satOf(a))[0];
  return { bg: hexC(light), panel: hexC(mixC(light, mids[0] || dark, 0.35)), mat: hexC(mixC(light, [255, 255, 255], 0.7)), text: hexC(dark), accent: hexC(accent) };
}
export function imagePalette(p, makeCanvas) {
  const cols = photoColors(p, makeCanvas);
  return { id: `img-${p.id}`, name: p.name, roles: rolesFromColors(cols), stripes: cols.map(hexC) };
}
function boardPalette(s, theme, makeCanvas) {
  const out = [];
  for (const c of s.cells) {
    const p = photoById(s, c.photoId);
    if (!p) continue;
    for (const v of photoColors(p, makeCanvas).slice(0, 2)) {
      if (out.every(q => Math.hypot(q[0] - v[0], q[1] - v[1], q[2] - v[2]) > 40)) out.push(v);
      if (out.length === 6) return out.map(hexC);
    }
  }
  const res = out.map(hexC);
  const fill = [theme.palette.accent, theme.palette.mat, theme.palette.panel, theme.palette.text, theme.palette.bg, theme.palette.accent];
  let k = 0;
  while (res.length < 6) res.push(fill[k++ % fill.length]);
  return res;
}

/* ---------------- fonts ---------------- */
export function fontStr(theme, size, kind) {
  if (kind === 'body') return `400 ${size}px "${(theme.body || DEFAULT_BODY).family}", sans-serif`;
  const f = theme.font;
  return `${f.italic ? 'italic ' : ''}${f.weight} ${size}px "${f.family}", serif`;
}
// shrink font size until the line fits; deterministic across scales.
// With (s, id) the text's own font choice is used for measuring.
function fitFont(ctx, text, theme, size, kind, maxW, s = null, id = null, o = {}) {
  const f = (k) => (s && id) ? textFont(theme, textOv(s, id), k, kind, o) : fontStr(theme, k, kind);
  let k = size;
  ctx.font = f(k);
  while (k > size * 0.35 && ctx.measureText(text).width > maxW) { k *= 0.94; ctx.font = f(k); }
  return k;
}
// underline under a run of text drawn with the current fillStyle / alpha
function underline(ctx, x, y, w, size, align) {
  const x0 = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
  ctx.fillRect(x0, y + size * 0.1, w, Math.max(1, size * 0.055));
}
function setTracking(ctx, px) { if ('letterSpacing' in ctx) ctx.letterSpacing = `${px}px`; }
function wrapLines(ctx, text, maxW) {
  const words = text.split(/\s+/), lines = []; let line = '';
  for (const w of words) {
    const t = line ? `${line} ${w}` : w;
    if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t;
  }
  if (line) lines.push(line);
  return lines;
}

/* ---------------- primitives ---------------- */
function rotateTo(ctx, cell) {
  if (cell.rot) { ctx.translate(cell.center.x, cell.center.y); ctx.rotate(cell.rot); ctx.translate(-cell.center.x, -cell.center.y); }
}
export { rotateTo };
function pathRoundRect(ctx, r, radius) {
  ctx.beginPath();
  if (radius > 0 && ctx.roundRect) ctx.roundRect(r.x, r.y, r.w, r.h, radius);
  else ctx.rect(r.x, r.y, r.w, r.h);
}
// seeded scatter so ornaments land identically at any size
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
function tornStripPath(ctx, r, u) {
  const rnd = rng(31), amp = u * 0.007, step = Math.max(6, r.w / 48);
  ctx.beginPath(); ctx.moveTo(r.x, r.y);
  for (let x = r.x; x <= r.x + r.w; x += step) ctx.lineTo(x, r.y + (rnd() - 0.5) * amp * 2);
  ctx.lineTo(r.x + r.w, r.y + r.h);
  for (let x = r.x + r.w; x >= r.x; x -= step) ctx.lineTo(x, r.y + r.h + (rnd() - 0.5) * amp * 2);
  ctx.closePath();
}

/* ---------------- text items (movable / resizable / removable) ---------------- */
// draw one line of text as an editable item; records its box for hit-testing
function drawLine(s, ctx, g, id, text, x, y, size, kind, o = {}) {
  if (!text || !textVisible(s, id)) return null;
  const ov = textOv(s, id);
  size *= ov.scale;
  ctx.save();
  ctx.translate(ov.dx * g.W, ov.dy * g.H);
  const st = textStyle(g.theme, ov, kind, o);
  ctx.font = textFont(g.theme, ov, size, kind, o);
  if (o.tracking) setTracking(ctx, o.tracking * size);
  if (o.shadow) { ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = g.u * 0.012; }
  ctx.textAlign = o.align || 'center'; ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = st.color || o.color || g.theme.palette.text; ctx.globalAlpha = o.alpha ?? 1;
  ctx.fillText(text, x, y);
  const w = ctx.measureText(text).width;
  if (st.underline) underline(ctx, x, y, w, size, o.align || 'center');
  if (o.tracking) setTracking(ctx, 0);
  ctx.restore();
  const bx = (o.align || 'center') === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
  const box = { x: bx + ov.dx * g.W, y: y - size * 0.82 + ov.dy * g.H, w, h: size * 1.05, style: st };
  g.textBoxes[id] = box;
  return box;
}

/* ---------------- layers ---------------- */
export function drawBackground(s, ctx, g) {
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

export function drawCell(s, ctx, g, i, image, opts = {}) {
  const cell = g.cells[i];
  if (cell.type === 'text') return drawTextCell(s, ctx, g, i);
  if (cell.type === 'swatch') return drawSwatchCell(s, ctx, g, i, opts.makeCanvas);
  const c = s.cells[i];
  const { theme } = g;
  ctx.save();
  rotateTo(ctx, cell);
  if (cell.polaroid || cell.frame) {
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
  ctx.save();
  pathRoundRect(ctx, p, cell.radius); ctx.clip();
  if (image) {
    const f = fitPhoto(p, image.width, image.height, c);
    ctx.drawImage(image, f.dx, f.dy, f.dw, f.dh);
  } else {
    const dark = isDark(theme.palette.bg);
    ctx.fillStyle = (cell.polaroid || cell.frame) ? 'rgba(0,0,0,.08)' : dark ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.06)';
    ctx.fillRect(p.x, p.y, p.w, p.h);
    if (opts.preview) {
      const k = Math.min(p.w, p.h);
      ctx.strokeStyle = dark && !cell.polaroid && !cell.frame ? 'rgba(255,255,255,.25)' : 'rgba(0,0,0,.22)';
      ctx.lineWidth = 1.5; ctx.setLineDash([6, 5]);
      ctx.strokeRect(p.x + 4, p.y + 4, p.w - 8, p.h - 8);
      ctx.setLineDash([]);
      ctx.fillStyle = ctx.strokeStyle;
      ctx.font = `300 ${Math.max(18, k * 0.28)}px "Hanken Grotesk"`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('+', p.x + p.w / 2, p.y + p.h / 2);
    }
  }
  ctx.restore();
  if (cell.def.caption) drawCaption(s, ctx, g, cell);
  if (cell.tape) drawTape(ctx, g, cell);
  ctx.restore();
}

function drawTextCell(s, ctx, g, i) {
  const cell = g.cells[i], def = cell.def, theme = g.theme, r = cell.rect, u = g.u;
  const slots = g.textSlots[i] || [];
  const vals = slots.map(x => slotText(s, x).trim());
  ctx.save();
  rotateTo(ctx, cell);
  let ink = theme.palette.text;
  if (def.bg === 'panel') { ctx.fillStyle = theme.palette.panel; ctx.fillRect(r.x, r.y, r.w, r.h); ink = inkOn(theme.palette.panel); }
  else if (def.bg === 'mat') {
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = u * 0.015; ctx.shadowOffsetY = u * 0.004;
    ctx.fillStyle = theme.palette.mat;
    if (def.torn) { tornStripPath(ctx, r, u); ctx.fill(); } else ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.restore(); ink = inkOn(theme.palette.mat);
  }
  ctx.restore();
  if (!vals.length) return;
  const align = def.align || 'center';
  const padX = r.w * 0.07;
  const ax = align === 'left' ? r.x + padX : r.x + r.w / 2;
  const maxW = r.w - 2 * padX;
  const ids = slots.map(x => x.id);

  switch (def.style) {
    case 'title': {
      const [a, b] = vals;
      const size = fitFont(ctx, a, theme, Math.min(r.h * (b ? 0.34 : 0.4), r.w * 0.16), 'display', maxW, s, ids[0]);
      drawLine(s, ctx, g, ids[0], a, ax, r.y + r.h * (b ? 0.5 : 0.6), size, 'display', { align, color: ink });
      if (b) {
        const up = b.toUpperCase();
        const s2 = fitFont(ctx, up, theme, Math.min(r.h * 0.11, size * 0.4), 'body', maxW / 1.3, s, ids[1]);
        drawLine(s, ctx, g, ids[1], up, ax, r.y + r.h * 0.72, s2, 'body', { align, color: ink, alpha: 0.85, tracking: 0.28 });
      }
      break;
    }
    case 'quote': {
      if (!textVisible(s, ids[0])) break;
      const ov = textOv(s, ids[0]);
      const size = Math.min(r.h * 0.1, r.w * 0.085) * ov.scale;
      ctx.save();
      ctx.translate(ov.dx * g.W, ov.dy * g.H);
      const st = textStyle(theme, ov, 'body', { italic: true });
      ctx.font = textFont(theme, ov, size, 'body', { italic: true });
      ctx.textAlign = align; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = st.color || ink;
      const lines = wrapLines(ctx, vals[0], maxW).slice(0, 6);
      const lh = size * 1.35, y0 = r.y + r.h / 2 - (lines.length - 1) * lh / 2 + size * 0.35;
      let wMax = 0;
      lines.forEach((ln, k) => {
        const lw = ctx.measureText(ln).width;
        ctx.fillText(ln, ax, y0 + k * lh);
        if (st.underline) underline(ctx, ax, y0 + k * lh, lw, size, align);
        wMax = Math.max(wMax, lw);
      });
      ctx.restore();
      const bx = align === 'left' ? ax : ax - wMax / 2;
      g.textBoxes[ids[0]] = { x: bx + ov.dx * g.W, y: y0 - size * 0.85 + ov.dy * g.H, w: wMax, h: (lines.length - 1) * lh + size * 1.1, style: st };
      break;
    }
    case 'big': {
      const size = fitFont(ctx, vals[0], theme, r.h * 0.82, 'display', r.w * 0.9, s, ids[0]);
      drawLine(s, ctx, g, ids[0], vals[0], ax, r.y + r.h / 2 + size * 0.36, size, 'display', { align, color: ink });
      break;
    }
    case 'label': {
      const t = vals[0].toUpperCase();
      const size = fitFont(ctx, t, theme, Math.min(r.h * 0.6, u * 0.04), 'body', maxW / 1.3, s, ids[0]);
      drawLine(s, ctx, g, ids[0], t, ax, r.y + r.h / 2 + size * 0.36, size, 'body',
        { align, tracking: 0.3, color: def.bg === 'none' ? theme.palette.mat : ink, shadow: def.bg === 'none' });
      break;
    }
  }
}

function drawSwatchCell(s, ctx, g, i, makeCanvas) {
  const cell = g.cells[i], def = cell.def, theme = g.theme, r = cell.rect;
  const pal = boardPalette(s, theme, makeCanvas);
  ctx.save();
  if (def.bg === 'panel') { ctx.fillStyle = theme.palette.panel; ctx.fillRect(r.x, r.y, r.w, r.h); }
  const ring = theme.palette.mat;
  if (def.style === 'grid') {
    const k = Math.min(r.w / 4.4, r.h / 3.2), gap = k * 0.22;
    const x0 = r.x + r.w / 2 - (3 * k + 2 * gap) / 2, y0 = r.y + r.h / 2 - (2 * k + gap) / 2;
    pal.forEach((col, n) => { ctx.fillStyle = col; ctx.fillRect(x0 + (n % 3) * (k + gap), y0 + Math.floor(n / 3) * (k + gap), k, k); });
  } else if (def.style === 'chips') {
    const n = 5, k = Math.min(r.h * 0.8, r.w / (n * 1.3)), gap = k * 0.3;
    const x0 = r.x, y0 = r.y + r.h / 2 - k / 2;
    pal.slice(0, n).forEach((col, q) => { ctx.fillStyle = col; ctx.fillRect(x0 + q * (k + gap), y0, k, k); });
  } else {
    const n = 3, rad = Math.min(r.w * 0.4, r.h / (n * 2.4));
    pal.slice(0, n).forEach((col, q) => {
      const cy = r.y + r.h / 2 + (q - 1) * rad * 2.4;
      ctx.beginPath(); ctx.arc(r.x + r.w / 2, cy, rad, 0, Math.PI * 2);
      ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = rad * 0.18; ctx.strokeStyle = ring; ctx.stroke();
    });
  }
  ctx.restore();
}

function drawDecor(s, ctx, g, makeCanvas) {
  if (!g.decor.length) return;
  const pal = boardPalette(s, g.theme, makeCanvas);
  ctx.save();
  g.decor.forEach((d, k) => {
    ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
    ctx.fillStyle = pal[(k * 2 + 1) % pal.length]; ctx.fill();
    ctx.lineWidth = d.r * 0.28; ctx.strokeStyle = g.theme.palette.mat; ctx.stroke();
  });
  ctx.restore();
}

function drawCaption(s, ctx, g, cell) {
  const theme = g.theme, u = g.u, p = cell.photo;
  const slot = slotsFor(theme, g.layout).find(x => x.id === cell.def.caption);
  const text = slot ? slotText(s, slot).trim() : '';
  if (!text || !textVisible(s, slot.id)) return;
  const ov = textOv(s, slot.id);
  const size = Math.max(9, u * 0.026) * ov.scale;
  ctx.save();
  ctx.translate(ov.dx * g.W, ov.dy * g.H);
  const st = textStyle(theme, ov, 'body');
  ctx.font = textFont(theme, ov, size, 'body');
  setTracking(ctx, size * 0.32);
  const tw = ctx.measureText(text).width, padX = size * 1.2, h = size * 2.1;
  const x = p.x + p.w / 2 - (tw + 2 * padX) / 2, y = p.y + p.h / 2 - h / 2;
  ctx.fillStyle = theme.palette.mat; ctx.globalAlpha = 0.92;
  ctx.fillRect(x, y, tw + 2 * padX, h);
  ctx.globalAlpha = 1; ctx.fillStyle = st.color || inkOn(theme.palette.mat);
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  const ty = y + h / 2 + size * 0.05;
  ctx.fillText(text, x + padX, ty);
  if (st.underline) underline(ctx, x + padX, ty + size * 0.32, tw, size, 'left');
  setTracking(ctx, 0);
  ctx.restore();
  g.textBoxes[slot.id] = { x: x + ov.dx * g.W, y: y + ov.dy * g.H, w: tw + 2 * padX, h, style: st };
}

function drawTape(ctx, g, cell) {
  const r = cell.rect, u = g.u;
  const w = Math.max(r.w * 0.2, u * 0.06), h = u * 0.02;
  ctx.save();
  ctx.fillStyle = 'rgba(228, 216, 186, .82)';
  [[r.x + r.w * 0.14, -0.12], [r.x + r.w * 0.86, 0.1]].forEach(([x, a]) => {
    ctx.save(); ctx.translate(x, r.y); ctx.rotate(a);
    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.restore();
  });
  ctx.restore();
}

function drawOrnaments(s, ctx, g) {
  const { theme, band, W, H } = g;
  const accent = accentColor(s);
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
        const q = u * (0.006 + r() * 0.01);
        if (k % 3) ctx.fillRect(-q, -q * 0.45, q * 2, q * 0.9);
        else { ctx.beginPath(); ctx.arc(0, 0, q * 0.7, 0, Math.PI * 2); ctx.fill(); }
        ctx.restore();
      }
      break;
    }
    case 'stars': {
      ctx.fillStyle = accent;
      for (let k = 0; k < 16; k++) {
        const side = k % 2 ? 0 : 1;
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

function drawTextBand(s, ctx, g) {
  const { theme, band } = g;
  const byStyle = Object.fromEntries(theme.slots.map(x => [x.style, x]));
  const val = (x) => (x && textVisible(s, x.id)) ? slotText(s, x).trim() : '';
  const numeral = val(byStyle.numeral), headline = val(byStyle.headline), subline = val(byStyle.subline);
  const padX = band.w * 0.03;
  if (numeral) {
    const nSize = fitFont(ctx, numeral, theme, band.h * 0.8, 'display', band.w * 0.4, s, byStyle.numeral.id);
    const nw = ctx.measureText(numeral).width;
    drawLine(s, ctx, g, byStyle.numeral.id, numeral, band.x + padX, band.y + band.h * 0.5 + nSize * 0.36, nSize, 'display', { align: 'left', color: accentColor(s) });
    const tx = band.x + padX + nw + band.h * 0.22;
    const avail = band.x + band.w - padX - tx;
    if (headline) drawLine(s, ctx, g, byStyle.headline.id, headline, tx, band.y + band.h * 0.5, fitFont(ctx, headline, theme, band.h * 0.3, 'display', avail, s, byStyle.headline.id), 'display', { align: 'left' });
    if (subline) drawLine(s, ctx, g, byStyle.subline.id, subline, tx, band.y + band.h * 0.73, fitFont(ctx, subline, theme, band.h * 0.13, 'body', avail, s, byStyle.subline.id), 'body', { align: 'left', alpha: 0.8 });
  } else {
    const cx = band.x + band.w / 2, avail = band.w - 2 * padX;
    if (headline) drawLine(s, ctx, g, byStyle.headline.id, headline, cx, band.y + band.h * 0.55, fitFont(ctx, headline, theme, band.h * 0.4, 'display', avail, s, byStyle.headline.id), 'display');
    if (subline) drawLine(s, ctx, g, byStyle.subline.id, subline, cx, band.y + band.h * 0.82, fitFont(ctx, subline, theme, band.h * 0.14, 'body', avail, s, byStyle.subline.id), 'body', { alpha: 0.8 });
  }
}

export function drawForeground(s, ctx, g, makeCanvas) {
  drawDecor(s, ctx, g, makeCanvas);
  if (g.band.h > 0 || g.theme.ornament === 'corners') drawOrnaments(s, ctx, g);
  if (g.band.h > 0) drawTextBand(s, ctx, g);
}

// draw a whole composition from already-decoded images (preview & thumbnails)
export function drawAll(s, ctx, g, imageFor, opts = {}) {
  drawBackground(s, ctx, g);
  g.cells.forEach((_, i) => drawCell(s, ctx, g, i, imageFor(i), opts));
  drawForeground(s, ctx, g, opts.makeCanvas);
}
