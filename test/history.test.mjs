import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createState, History, placePhotos, setLayout, setCellOv, setTextOv, currentLayout, docKey, snapshot } from '../js/collage/core.js';

const fakePhoto = (id) => ({ id, name: `p${id}.jpg`, iw: 1200, ih: 800, bmp: { width: 1200, height: 800 } });

test('discrete changes undo and redo in order', () => {
  const s = createState({ layoutId: 'pure-four' });
  const h = new History();
  h.commit(s); s.spacing = 40;
  h.commit(s); setLayout(s, 'pure-grid');
  assert.equal(s.layoutId, 'pure-grid');
  assert.ok(h.undo(s)); assert.equal(s.layoutId, 'pure-four'); assert.equal(s.spacing, 40);
  assert.ok(h.undo(s)); assert.equal(s.spacing, 0);
  assert.ok(!h.undo(s), 'nothing left to undo');
  assert.ok(h.redo(s)); assert.equal(s.spacing, 40);
  assert.ok(h.redo(s)); assert.equal(s.layoutId, 'pure-grid');
  assert.ok(!h.canRedo);
});

test('a continuous drag becomes a single undo step, and no step if nothing changed', () => {
  const s = createState({ layoutId: 'pure-four' });
  const h = new History();
  h.begin(s);
  for (let k = 1; k <= 10; k++) setCellOv(s, currentLayout(s), 0, { w: 0.49 + k * 0.02 });   // ten intermediate moves
  assert.ok(h.end(s));
  assert.equal(h.past.length, 1);
  h.begin(s); h.begin(s); assert.ok(!h.end(s), 'no-op drag records nothing');
  assert.equal(h.past.length, 1);
  h.undo(s);
  assert.ok(!s.cellOv['pure-four'], 'one undo reverts the whole drag');
});

test('a new change after undo discards the redo branch', () => {
  const s = createState();
  const h = new History();
  h.commit(s); s.spacing = 10;
  h.commit(s); s.spacing = 20;
  h.undo(s);
  h.commit(s); s.spacing = 99;
  assert.ok(!h.canRedo);
  h.undo(s); assert.equal(s.spacing, 10);
});

test('undo restores photos, crops, words, styles and section sizes together', () => {
  const s = createState({ layoutId: 'pure-four' });
  const h = new History();
  const photos = [1, 2].map(fakePhoto);
  h.commit(s); s.photos.push(...photos); placePhotos(s, photos);
  h.commit(s); s.cells[0].zoom = 2; s.cells[0].panX = 0.1;
  h.commit(s); s.texts.headline = 'Hello'; setTextOv(s, 'headline', { dx: 0.1, scale: 1.3 });
  h.commit(s); s.style = { palette: { id: 'sage', roles: {} }, font: null }; s.accent = '#123456';
  const before = docKey(snapshot(s));
  h.undo(s); assert.equal(s.style.palette, null); assert.equal(s.accent, null);
  h.undo(s); assert.equal(s.texts.headline, undefined); assert.equal(s.textOv.headline, undefined);
  h.undo(s); assert.equal(s.cells[0].zoom, 1);
  h.undo(s); assert.equal(s.photos.length, 0); assert.equal(s.cells[0].photoId, null);
  h.redo(s); h.redo(s); h.redo(s); h.redo(s);
  assert.equal(docKey(snapshot(s)), before, 'redo returns to the exact same document');
});

test('history is capped and undo clears selection', () => {
  const s = createState();
  const h = new History(5);
  for (let k = 0; k < 20; k++) { h.commit(s); s.spacing = k; }
  assert.equal(h.past.length, 5);
  s.ui.selected = 2;
  h.undo(s);
  assert.equal(s.ui.selected, null);
});
