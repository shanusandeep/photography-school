// ============================================================
// Collage Maker — local draft persistence (IndexedDB).
// Stores the serialized document plus the original photo files so an
// accidental refresh can be recovered. Everything stays in this
// browser; nothing is uploaded and nothing syncs between devices.
// ============================================================

const DB_NAME = 'darkroom-collage', DB_VERSION = 1;

function openDb() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in globalThis)) return reject(new Error('IndexedDB unavailable'));
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('doc')) db.createObjectStore('doc');
      if (!db.objectStoreNames.contains('photos')) db.createObjectStore('photos');
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('IndexedDB open failed'));
    req.onblocked = () => reject(new Error('IndexedDB blocked'));
  });
}
const done = (tx) => new Promise((resolve, reject) => { tx.oncomplete = resolve; tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error || new Error('aborted')); });
const get = (store, key) => new Promise((resolve, reject) => { const r = store.get(key); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); });
const keys = (store) => new Promise((resolve, reject) => { const r = store.getAllKeys(); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); });

// save the document and any photo files not yet stored; drop files for photos that are gone
export async function saveDraft(doc, photos) {
  const db = await openDb();
  try {
    const tx = db.transaction(['doc', 'photos'], 'readwrite');
    const ps = tx.objectStore('photos');
    const have = new Set(await keys(ps));
    const want = new Set(photos.map(p => p.id));
    for (const p of photos) if (!have.has(p.id)) ps.put({ id: p.id, name: p.name, file: p.file }, p.id);
    for (const k of have) if (!want.has(k)) ps.delete(k);
    tx.objectStore('doc').put(doc, 'current');
    await done(tx);
  } finally { db.close(); }
}

export async function loadDraft() {
  const db = await openDb();
  try {
    const tx = db.transaction(['doc', 'photos'], 'readonly');
    const doc = await get(tx.objectStore('doc'), 'current');
    if (!doc) return null;
    const ps = tx.objectStore('photos');
    const photos = [];
    for (const p of doc.photos || []) { const rec = await get(ps, p.id); if (rec && rec.file) photos.push(rec); }
    await done(tx);
    return { doc, photos };
  } finally { db.close(); }
}

export async function clearDraft() {
  const db = await openDb();
  try {
    const tx = db.transaction(['doc', 'photos'], 'readwrite');
    tx.objectStore('doc').clear(); tx.objectStore('photos').clear();
    await done(tx);
  } finally { db.close(); }
}

export const isQuotaError = (err) => !!err && (err.name === 'QuotaExceededError' || /quota/i.test(String(err.message || err)));
