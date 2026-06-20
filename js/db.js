/**
 * MedienTracker - IndexedDB Layer (db.js)
 * Vollstaendige Offline-Datenspeicherung
 */
const DB = (() => {
  'use strict';
  const DB_NAME    = 'MedienTrackerDB';
  const DB_VERSION = 2;
  const S_ARTIKEL  = 'artikel';
  const S_SETTINGS = 'einstellungen';
  let _db = null;

  function _promisify(req) {
    return new Promise((res, rej) => {
      req.onsuccess = () => res(req.result);
      req.onerror   = () => rej(req.error);
    });
  }

  function _store(name, mode = 'readonly') {
    return _db.transaction(name, mode).objectStore(name);
  }

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 8);
  }

  async function init() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onerror   = () => reject(req.error);
      req.onsuccess = () => { _db = req.result; resolve(); };
      req.onupgradeneeded = (e) => {
        const d = e.target.result;
        if (!d.objectStoreNames.contains(S_ARTIKEL)) {
          const s = d.createObjectStore(S_ARTIKEL, { keyPath: 'id' });
          s.createIndex('kategorie',             'kategorie',                       { unique: false });
          s.createIndex('titel',                 'titel',                           { unique: false });
          s.createIndex('istWunschliste',        'istWunschliste',                  { unique: false });
          s.createIndex('verliehenAn',           'verliehenAn',                     { unique: false });
          s.createIndex('erstelltAm',            'erstelltAm',                      { unique: false });
          s.createIndex('kat_wl',                ['kategorie','istWunschliste'],     { unique: false });
          s.createIndex('aktualisiertAm',        'aktualisiertAm',                  { unique: false });
        }
        if (!d.objectStoreNames.contains(S_SETTINGS)) {
          d.createObjectStore(S_SETTINGS, { keyPath: 'key' });
        }
      };
    });
  }

  async function addArtikel(data) {
    const now = Date.now();
    const artikel = Object.assign({}, data, {
      id:           data.id          || generateId(),
      istWunschliste: data.istWunschliste ?? false,
      erstelltAm:   data.erstelltAm  || now,
      aktualisiertAm: now,
      _synced:      false
    });
    await _promisify(_store(S_ARTIKEL, 'readwrite').add(artikel));
    return artikel;
  }

  async function updateArtikel(data) {
    const artikel = Object.assign({}, data, {
      aktualisiertAm: Date.now(),
      _synced: false
    });
    await _promisify(_store(S_ARTIKEL, 'readwrite').put(artikel));
    return artikel;
  }

  async function deleteArtikel(id) {
    await _promisify(_store(S_ARTIKEL, 'readwrite').delete(id));
    return id;
  }

  async function getArtikelById(id) {
    return _promisify(_store(S_ARTIKEL).get(id));
  }

  async function getAllArtikel() {
    return _promisify(_store(S_ARTIKEL).getAll());
  }

  async function getArtikelByKategorie(kategorie, istWunschliste = false) {
    const idx   = _store(S_ARTIKEL).index('kat_wl');
    const items = await _promisify(idx.getAll([kategorie, istWunschliste]));
    return items.sort((a, b) => (a.titel || '').localeCompare(b.titel || '', 'de', { sensitivity: 'base' }));
  }

  async function getRecentArtikel(limit = 5) {
    const all = await getAllArtikel();
    return all
      .filter(a => !a.istWunschliste)
      .sort((a, b) => b.erstelltAm - a.erstelltAm)
      .slice(0, limit);
  }

  async function getVerliehenArtikel() {
    const all = await getAllArtikel();
    return all
      .filter(a => a.verliehenAn && a.verliehenAn.trim() !== '')
      .sort((a, b) => (a.verliehenSeit || a.erstelltAm) - (b.verliehenSeit || b.erstelltAm));
  }

  async function getKategorieStats() {
    const all   = await getAllArtikel();
    const stats = {};
    for (const a of all) {
      if (!stats[a.kategorie]) stats[a.kategorie] = { sammlung: 0, wunschliste: 0 };
      if (a.istWunschliste) stats[a.kategorie].wunschliste++;
      else                  stats[a.kategorie].sammlung++;
    }
    return stats;
  }

  async function searchArtikel(query) {
    if (!query || query.length < 1) return [];
    const q   = query.toLowerCase();
    const all = await getAllArtikel();
    return all.filter(a =>
      (a.titel       || '').toLowerCase().includes(q) ||
      (a.genre       || '').toLowerCase().includes(q) ||
      (a.band        || '').toLowerCase().includes(q) ||
      (a.verliehenAn || '').toLowerCase().includes(q)
    );
  }

  async function getSetting(key, def = null) {
    const r = await _promisify(_store(S_SETTINGS).get(key));
    return r != null ? r.value : def;
  }

  async function setSetting(key, value) {
    await _promisify(_store(S_SETTINGS, 'readwrite').put({ key, value }));
  }

  async function getUnsyncedArtikel() {
    const all = await getAllArtikel();
    return all.filter(a => !a._synced);
  }

  async function markAsSynced(id) {
    const a = await getArtikelById(id);
    if (a) { a._synced = true; await _promisify(_store(S_ARTIKEL, 'readwrite').put(a)); }
  }

  async function upsertArtikel(data) {
    const existing = await getArtikelById(data.id);
    const artikel  = Object.assign({}, data, { _synced: true });
    const s        = _store(S_ARTIKEL, 'readwrite');
    if (existing) {
      if ((data.aktualisiertAm || 0) >= (existing.aktualisiertAm || 0)) {
        await _promisify(s.put(artikel));
      }
    } else {
      await _promisify(s.add(artikel));
    }
    return artikel;
  }

  return {
    init, generateId,
    addArtikel, updateArtikel, deleteArtikel,
    getArtikelById, getAllArtikel, getArtikelByKategorie,
    getRecentArtikel, getVerliehenArtikel, getKategorieStats,
    searchArtikel, getSetting, setSetting,
    getUnsyncedArtikel, markAsSynced, upsertArtikel
  };
})();