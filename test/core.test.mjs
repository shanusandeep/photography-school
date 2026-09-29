import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SHAPES, LAYOUTS, THEMES, exportPresets } from '../js/data/collage.js';
import { createState, geometry, setLayout, placePhotos, cellQuality, resolveTextSlots, setCellOv, suggestedLayouts, photoCellCount, currentLayout, currentTheme } from '../js/collage/core.js';

const fakePhoto = (id, iw = 1200, ih = 800) => ({ id, name: `p${id}.jpg`, iw, ih, bmp: { width: iw, height: ih } });

test('export presets never change the canvas proportions', () => {
  for (const shape of SHAPES) {
    for (const p of exportPresets(shape)) {
      assert.ok(Math.abs(p.w / p.h - shape.ar) < 0.01, `${shape.id}/${p.id} keeps aspect`);
    }
    if (shape.print) assert.ok(exportPresets(shape).some(p => p.id === 'print'));
  }
  assert.ok(!exportPresets(SHAPES.find(s => s.id === 'wide')).some(p => p.id === 'print'), 'no print preset for 16:9');
});

test('every theme × shape × layout stays inside the canvas and clear of the text band', () => {
  const s = createState({ ui: { ...createState().ui, hideText: false } });
  let combos = 0;
  for (const theme of THEMES) for (const shape of SHAPES) for (const layout of LAYOUTS) {
    combos++;
    const W = 600, H = Math.round(600 / shape.ar);
    const g = geometry(s, W, H, { theme, layout });
    g.cells.forEach((cell, i) => {
      const cs = Math.cos(cell.rot), sn = Math.sin(cell.rot);
      const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy]) => {
        const lx = sx * cell.rect.w / 2, ly = sy * cell.rect.h / 2;
        return { x: cell.center.x + lx * cs - ly * sn, y: cell.center.y + lx * sn + ly * cs };
      });
      assert.ok(corners.every(p => p.x >= -1 && p.y >= -1 && p.x <= W + 1 && p.y <= H + 1), `${theme.id}/${shape.id}/${layout.id} cell ${i} inside canvas`);
      if (g.band.h > 0) assert.ok(corners.every(p => theme.band.pos === 'top' ? p.y >= g.band.y + g.band.h - 1 : p.y <= g.band.y + 1), `${theme.id}/${shape.id}/${layout.id} cell ${i} clear of band`);
    });
  }
  assert.equal(combos, THEMES.length * SHAPES.length * LAYOUTS.length);
});

test('hiding words collapses the band so photos fill the canvas', () => {
  const s = createState();
  s.ui.hideText = false;
  const withBand = geometry(s, 500, 500).band.h;
  s.ui.hideText = true;
  assert.ok(withBand > 0);
  assert.equal(geometry(s, 500, 500).band.h, 0);
});

test('layout round trip 6 → 4 → 6 restores every photo in its original cell', () => {
  const s = createState({ layoutId: 'polaroid-wall' });
  const photos = [1, 2, 3, 4, 5, 6].map(id => fakePhoto(id));
  s.photos.push(...photos);
  placePhotos(s, photos);
  const before = s.cells.map(c => c.photoId);
  setLayout(s, 'grid-2x2');
  assert.equal(s.cells.filter(c => c.photoId).length, 4);
  setLayout(s, 'polaroid-wall');
  assert.deepEqual(s.cells.map(c => c.photoId), before);
});

test('photos are only ever placed into photo cells', () => {
  const s = createState({ layoutId: 'checkerboard' });
  const photos = [1, 2, 3, 4, 5].map(id => fakePhoto(id));
  s.photos.push(...photos);
  placePhotos(s, photos);
  const layout = currentLayout(s);
  s.cells.forEach((c, i) => { if (c.photoId) assert.equal(layout.cells[i].type || 'photo', 'photo'); });
  assert.equal(s.cells.filter(c => c.photoId).length, photoCellCount(layout));
});

test('text cells claim slots in order without reuse', () => {
  const s = createState({ themeId: 'birthday', layoutId: 'split-banner' });
  const theme = currentTheme(s), layout = currentLayout(s);
  const picks = resolveTextSlots(s, theme, layout).filter(Boolean).map(p => p.map(x => x.id));
  assert.deepEqual(picks, [['numeral'], ['headline'], ['subline']]);
  s.themeId = 'wedding';                                  // no numeral: big cell takes the headline, label takes the subline
  const picks2 = resolveTextSlots(s, currentTheme(s), layout).filter(Boolean).map(p => p.map(x => x.id));
  assert.deepEqual(picks2, [['headline'], ['subline'], []]);
});

test('section overrides move geometry and spacing shrinks cells toward their centres', () => {
  const s = createState({ layoutId: 'pure-four' });
  const g0 = geometry(s, 400, 400);
  setCellOv(s, currentLayout(s), 0, { w: 0.7, h: 0.7 });
  const g1 = geometry(s, 400, 400);
  assert.ok(g1.cells[0].rect.w > g0.cells[0].rect.w);
  s.spacing = 100;
  const g2 = geometry(s, 400, 400);
  assert.ok(g2.cells[1].rect.w < g0.cells[1].rect.w);
  assert.ok(Math.abs(g2.cells[1].center.x - g0.cells[1].center.x) < 0.01, 'spacing keeps the centre');
});

test('print quality warns when a photo is upscaled beyond 150 dpi equivalent', () => {
  const s = createState({ layoutId: 'bleed-diptych' });
  const small = fakePhoto(1, 600, 400), big = fakePhoto(2, 6000, 4000);
  s.photos.push(small, big); placePhotos(s, [small, big]);
  const g = geometry(s, 2400, 2400);
  assert.ok(cellQuality(s, g, 0).dpi < 150);
  assert.equal(cellQuality(s, g, 1).dpi, 300);
});

test('suggested layouts fit the photo count', () => {
  const s = createState();
  const four = suggestedLayouts(s, 4).map(l => photoCellCount(l));
  assert.ok(four.every(n => n >= 4 && n <= 6), `4 photos → ${four}`);
  assert.equal(suggestedLayouts(s, 1).length, 6);
});
