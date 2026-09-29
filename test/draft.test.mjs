import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createState, placePhotos, setCellOv, setTextOv, currentLayout, serializeDraft, deserializeDraft, restore, snapshot, docKey, DRAFT_VERSION } from '../js/collage/core.js';
import { PALETTES, FONT_SETS } from '../js/data/collage.js';

const fakePhoto = (id) => ({ id, name: `p${id}.jpg`, iw: 1200, ih: 800, bmp: { width: 1200, height: 800 }, file: { size: 1 } });

function richState() {
  const s = createState({ layoutId: 'checkerboard', themeId: 'newborn', shapeId: 'portrait' });
  const photos = [1, 2, 3].map(fakePhoto);
  s.photos.push(...photos); placePhotos(s, photos);
  s.cells[1].zoom = 1.8; s.cells[1].panX = 0.2;
  s.texts.headline = 'Emma'; setTextOv(s, 'headline', { dx: 0.05, dy: -0.02, scale: 1.2 });
  setCellOv(s, currentLayout(s), 1, { w: 0.6 });
  s.style = { palette: PALETTES[3], font: FONT_SETS[2] }; s.accent = '#abcdef'; s.spacing = 25; s.ui.hideText = false;
  return s;
}

test('a draft is plain JSON and round-trips the whole document', () => {
  const s = richState();
  const draft = serializeDraft(s, 123);
  assert.equal(draft.v, DRAFT_VERSION);
  assert.equal(draft.savedAt, 123);
  assert.doesNotThrow(() => JSON.stringify(draft));
  assert.ok(!('bmp' in draft.photos[0]) && !('file' in draft.photos[0]), 'photo files are stored separately');
  const json = JSON.parse(JSON.stringify(draft));
  const photosById = Object.fromEntries(s.photos.map(p => [p.id, p]));
  const snap = deserializeDraft(json, photosById);
  const t = createState();
  restore(t, snap);
  assert.equal(docKey(snapshot(t)), docKey(snapshot(s)));
});

test('image palettes survive by value, curated palettes and font sets by id', () => {
  const s = richState();
  s.style.palette = { id: 'img-2', name: 'p2.jpg', roles: { bg: '#fff', panel: '#eee', mat: '#fff', text: '#000', accent: '#f00' }, stripes: ['#fff'] };
  const d = JSON.parse(JSON.stringify(serializeDraft(s)));
  assert.equal(d.style.paletteId, null);
  assert.equal(d.style.imagePalette.id, 'img-2');
  assert.equal(d.style.fontId, FONT_SETS[2].id);
  const snap = deserializeDraft(d, Object.fromEntries(s.photos.map(p => [p.id, p])));
  assert.equal(snap.style.palette.id, 'img-2');
  assert.equal(snap.style.font, FONT_SETS[2]);
});

test('missing photos, unknown layouts and old versions degrade gracefully', () => {
  const s = richState();
  const d = JSON.parse(JSON.stringify(serializeDraft(s)));
  const snap = deserializeDraft(d, { 1: s.photos[0] });             // photos 2 and 3 could not be re-read
  assert.equal(snap.photos.length, 1);
  assert.ok(snap.cells.every(c => c.photoId === null || c.photoId === 1), 'cells referencing lost photos are emptied');
  const d2 = { ...d, layoutId: 'no-such-layout' };
  const snap2 = deserializeDraft(d2, {});
  assert.equal(snap2.layoutId, 'story-strip');
  assert.equal(snap2.cells.length, 3, 'cells rebuilt for the fallback layout');
  assert.equal(deserializeDraft({ ...d, v: 99 }, {}), null);
  assert.equal(deserializeDraft(null, {}), null);
});
