// ============================================================
// The Print Table — collage data: canvas shapes, layouts, themes.
// All geometry is normalized (0..1 of the content area) so the
// same numbers drive the on-screen preview and the print export.
// ============================================================

/* ---------------- canvas shapes ---------------- */
export const SHAPES = [
  { id: 'square',   name: 'Square',        hint: '1 : 1 · Instagram, 8×8″',  ar: 1,          print: { label: '8×8 in',  w: 2400, h: 2400 } },
  { id: 'portrait', name: 'Portrait 4×5',  hint: '4 : 5 · 8×10″ print',      ar: 4 / 5,      print: { label: '8×10 in', w: 2400, h: 3000 } },
  { id: 'a4',       name: 'A4 Portrait',   hint: '210 × 297 mm',             ar: 210 / 297,  print: { label: 'A4',      w: 2480, h: 3508 } },
  { id: 'wide',     name: 'Widescreen',    hint: '16 : 9 · screens, TV',     ar: 16 / 9,     print: null },
];

// export presets are derived from the shape so the export can never change
// the canvas proportions the user composed in
export function exportPresets(shape) {
  const dims = (long) => shape.ar >= 1
    ? { w: long, h: Math.round(long / shape.ar) }
    : { w: Math.round(long * shape.ar), h: long };
  const presets = [
    { id: 'web',  label: 'Web & social', note: 'sharp on any screen', ...dims(2048) },
  ];
  if (shape.print) presets.push({ id: 'print', label: `Print ${shape.print.label} @ 300 DPI`, note: 'lab-ready', w: shape.print.w, h: shape.print.h });
  presets.push({ id: 'max', label: 'Maximum', note: 'largest this device can render', ...dims(4096) });
  return presets;
}

/* ---------------- layouts ---------------- */
// cell: { x, y, w, h } in content-area units. Optional: rot (deg, polaroid
// frames), inset (draws a mat border), ar (fixed photo aspect: h derived).
function grid(cols, rows, gap) {
  const cw = (1 - gap * (cols - 1)) / cols;
  const ch = (1 - gap * (rows - 1)) / rows;
  const cells = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    cells.push({ x: c * (cw + gap), y: r * (ch + gap), w: cw, h: ch });
  }
  return cells;
}

export const LAYOUTS = [
  { id: 'contact-sheet', name: 'Contact Sheet', desc: '3 × 3 grid', cells: grid(3, 3, 0.025) },
  { id: 'grid-2x2', name: 'Four Up', desc: '2 × 2 grid', cells: grid(2, 2, 0.03) },
  { id: 'triptych', name: 'Triptych', desc: 'three panels', cells: grid(3, 1, 0.03) },
  { id: 'diptych', name: 'Diptych', desc: 'two halves', cells: grid(2, 1, 0.03) },
  { id: 'filmstrip', name: 'Filmstrip', desc: 'four frames', deco: 'filmstrip',
    cells: [0, 1, 2, 3].map(i => ({ x: 0.03 + i * 0.2425, w: 0.2125, y: 0.3, h: 0.4 })) },
  { id: 'polaroid-wall', name: 'Polaroid Wall', desc: 'scattered prints', polaroid: true,
    // x,y = frame center; w = frame width; frames are 1 : 1.2 (photo 1 : 1)
    cells: [
      { x: 0.20, y: 0.27, w: 0.34, rot: -7 }, { x: 0.52, y: 0.25, w: 0.32, rot: 5 }, { x: 0.82, y: 0.29, w: 0.33, rot: -4 },
      { x: 0.24, y: 0.71, w: 0.33, rot: 4 },  { x: 0.55, y: 0.73, w: 0.34, rot: -6 }, { x: 0.83, y: 0.70, w: 0.32, rot: 7 },
    ] },
  { id: 'magazine', name: 'Magazine Cover', desc: 'full bleed + inset',
    cells: [{ x: 0, y: 0, w: 1, h: 1 }, { x: 0.63, y: 0.64, w: 0.32, h: 0.31, inset: true }] },
  { id: 'hero-sidebar', name: 'Hero + Sidebar', desc: 'one big, three small',
    cells: [{ x: 0, y: 0, w: 0.655, h: 1 }, { x: 0.68, y: 0, w: 0.32, h: 0.32 }, { x: 0.68, y: 0.34, w: 0.32, h: 0.32 }, { x: 0.68, y: 0.68, w: 0.32, h: 0.32 }] },
  { id: 'twelve-grid', name: 'Twelve Months', desc: '4 × 3 · a first year', cells: grid(4, 3, 0.02) },
  { id: 'big-little', name: 'Big & Little', desc: 'hero over three',
    cells: [{ x: 0, y: 0, w: 1, h: 0.64 }, { x: 0, y: 0.67, w: 0.32, h: 0.33 }, { x: 0.34, y: 0.67, w: 0.32, h: 0.33 }, { x: 0.68, y: 0.67, w: 0.32, h: 0.33 }] },
];

/* ---------------- themes ---------------- */
// A theme is a skin + content pack applied over any layout:
//   font      Google font for headline/numeral (weight must exist for the family)
//   palette   bg / mat (frames, insets) / text / accent (ornaments, numeral) / band
//   band      where the words live: pos top|bottom, h = fraction of canvas height
//   slots     editable text fields with defaults (headline, subline, numeral)
//   ornament  name of the decoration drawn by the renderer
export const THEMES = [
  {
    id: 'newborn', name: 'Newborn', tag: 'soft & sweet',
    font: { family: 'Cormorant Garamond', param: 'ital,wght@0,600;1,600', weight: 600, italic: true },
    palette: { bg: '#f7f0e7', mat: '#ffffff', text: '#5b4a40', accent: '#d8a49b', band: '#f7f0e7' },
    band: { pos: 'top', h: 0.17 }, margin: 0.045,
    slots: [
      { id: 'headline', label: 'Name', default: 'Emma Rose', style: 'headline' },
      { id: 'subline', label: 'Details', default: 'Born 12 June 2026 · 7 lb 4 oz · 20 in', style: 'subline' },
    ],
    ornament: 'stars', suggested: ['twelve-grid', 'polaroid-wall', 'big-little'],
  },
  {
    id: 'birthday', name: 'Birthday', tag: 'any age — type the number',
    font: { family: 'Bebas Neue', param: 'wght@400', weight: 400, italic: false },
    palette: { bg: '#15111a', mat: '#f4ecdf', text: '#f7f1e6', accent: '#f2b134', band: '#15111a' },
    band: { pos: 'bottom', h: 0.2 }, margin: 0.04,
    slots: [
      { id: 'numeral', label: 'Age', default: '40', style: 'numeral' },
      { id: 'headline', label: 'Headline', default: 'Happy Birthday, Sandeep', style: 'headline' },
      { id: 'subline', label: 'Caption', default: 'Forty & fabulous · 12 · 08 · 2026', style: 'subline' },
    ],
    ornament: 'confetti', suggested: ['polaroid-wall', 'grid-2x2', 'big-little'],
  },
  {
    id: 'graduation', name: 'Graduation', tag: 'class of …',
    font: { family: 'Playfair Display', param: 'wght@700', weight: 700, italic: false },
    palette: { bg: '#0f1b2d', mat: '#f3e9d2', text: '#f3e9d2', accent: '#c9a227', band: '#0f1b2d' },
    band: { pos: 'bottom', h: 0.19 }, margin: 0.04,
    slots: [
      { id: 'numeral', label: 'Year', default: '2026', style: 'numeral' },
      { id: 'headline', label: 'Headline', default: 'Class of 2026', style: 'headline' },
      { id: 'subline', label: 'Caption', default: 'Sandeep Shanu · Bachelor of Science', style: 'subline' },
    ],
    ornament: 'laurel', suggested: ['diptych', 'hero-sidebar', 'contact-sheet'],
  },
  {
    id: 'wedding', name: 'Wedding', tag: 'or anniversary',
    font: { family: 'Great Vibes', param: 'wght@400', weight: 400, italic: false },
    palette: { bg: '#fbf7f1', mat: '#ffffff', text: '#4a3f3a', accent: '#b8926f', band: '#fbf7f1' },
    band: { pos: 'bottom', h: 0.18 }, margin: 0.045,
    slots: [
      { id: 'headline', label: 'Names', default: 'Priya & Sandeep', style: 'headline' },
      { id: 'subline', label: 'Caption', default: 'Married on the twelfth of June, 2026', style: 'subline' },
    ],
    ornament: 'hearts', suggested: ['triptych', 'magazine', 'grid-2x2'],
  },
  {
    id: 'maternity', name: 'Maternity', tag: 'waiting for you',
    font: { family: 'Cormorant Garamond', param: 'ital,wght@0,600;1,600', weight: 600, italic: true },
    palette: { bg: '#eef0e8', mat: '#ffffff', text: '#3f4a3c', accent: '#8fa383', band: '#eef0e8' },
    band: { pos: 'top', h: 0.16 }, margin: 0.045,
    slots: [
      { id: 'headline', label: 'Headline', default: 'Waiting for you', style: 'headline' },
      { id: 'subline', label: 'Caption', default: 'Baby Shanu · arriving November 2026', style: 'subline' },
    ],
    ornament: 'leaves', suggested: ['triptych', 'hero-sidebar', 'polaroid-wall'],
  },
  {
    id: 'classic', name: 'Classic', tag: 'the darkroom look',
    font: { family: 'Young Serif', param: 'wght@400', weight: 400, italic: false },
    palette: { bg: '#12100d', mat: '#ece5d8', text: '#ece5d8', accent: '#e8a33d', band: '#12100d' },
    band: { pos: 'bottom', h: 0.14 }, margin: 0.04,
    slots: [
      { id: 'headline', label: 'Title', default: 'The Darkroom', style: 'headline' },
      { id: 'subline', label: 'Caption', default: 'Print № 01 · f/2 · 1/125 · ISO 400', style: 'subline' },
    ],
    ornament: 'corners', suggested: ['contact-sheet', 'filmstrip', 'diptych'],
  },
];
