import { test } from 'node:test';
import assert from 'node:assert/strict';
import { THEMES, TEXT_FONTS } from '../js/data/collage.js';
import { createState, textStyle, textFont, fontsInUse, setTextOv, History, serializeDraft, deserializeDraft, restore, snapshot, docKey, applyStyle } from '../js/collage/core.js';

const theme = (id) => applyStyle(createState(), THEMES.find(t => t.id === id));

test('defaults follow the theme: display font for headings, body font for small text, italic quotes', () => {
  const t = theme('graduation');                         // Playfair Display 700
  assert.deepEqual([textStyle(t).family, textStyle(t).weight, textStyle(t).bold], ['Playfair Display', 700, true]);
  assert.equal(textStyle(t, undefined, 'body').family, 'Hanken Grotesk');
  assert.equal(textStyle(t, undefined, 'body').bold, false);
  assert.equal(textStyle(t, undefined, 'body', { italic: true }).italic, true);
  assert.equal(textStyle(theme('newborn')).italic, true, 'Cormorant theme font is italic by default');
});

test('bold, italic, underline, colour and font override the defaults', () => {
  const t = theme('graduation');
  assert.equal(textStyle(t, { bold: false }).weight, 400, 'bold can be switched off on a bold theme font');
  assert.equal(textStyle(t, { italic: true }).italic, true);
  assert.equal(textStyle(theme('newborn'), { italic: false }).italic, false, 'italic can be switched off');
  const picked = textStyle(t, { font: 'dancing', bold: true, underline: true, color: '#ff0000' });
  assert.deepEqual([picked.family, picked.weight, picked.generic, picked.underline, picked.color], ['Dancing Script', 700, 'cursive', true, '#ff0000']);
  assert.equal(textFont(t, { font: 'lato', italic: true }, 20, 'display'), 'italic 400 20px "Lato", sans-serif');
  assert.equal(textStyle(t, { font: 'no-such-font' }).family, 'Playfair Display', 'unknown fonts fall back to the theme');
});

test('fontsInUse lists chosen fonts plus the theme families from the catalogue', () => {
  const s = createState({ themeId: 'graduation' });
  setTextOv(s, 'headline', { font: 'pacifico' });
  const fams = fontsInUse(s, theme('graduation')).map(f => f.family).sort();
  assert.deepEqual(fams, ['Hanken Grotesk', 'Pacifico', 'Playfair Display']);
  assert.ok(TEXT_FONTS.every(f => f.id && f.family && f.param && f.group && f.generic));
});

test('text styling is part of undo and drafts', () => {
  const s = createState();
  const h = new History();
  h.commit(s); setTextOv(s, 'headline', { font: 'oswald', bold: true, underline: true, color: '#123456' });
  const styled = docKey(snapshot(s));
  h.undo(s); assert.equal(s.textOv.headline, undefined);
  h.redo(s); assert.equal(docKey(snapshot(s)), styled);
  const back = createState();
  restore(back, deserializeDraft(JSON.parse(JSON.stringify(serializeDraft(s))), {}));
  assert.deepEqual({ ...back.textOv.headline }, { ...s.textOv.headline });
});
