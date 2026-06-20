/**
 * MedienTracker - API Layer (api.js)
 * Open Library (Buecher) + OMDb (DVDs) + Google Books
 *
 * FIX: Console-Logging, Open Library Search als 3. Fallback,
 *      Erkennung von Rate-Limiting (429), Teilrueckgabe mit ISBN
 */
const API = (() => {
  'use strict';

  // Eintragen nach kostenloser Registrierung auf https://www.omdbapi.com/apikey.aspx
  let OMDB_KEY = 'DEIN_OMDB_KEY';

  function setOmdbKey(key) { OMDB_KEY = key; }
  function hasOmdbKey()    { return OMDB_KEY && OMDB_KEY !== 'DEIN_OMDB_KEY'; }

  // ---------- HTTP-HELFER ----------

  async function _json(url) {
    try {
      console.log('[API] Anfrage:', url);
      const res = await fetch(url);

      if (res.status === 429) {
        console.warn('[API] Rate-Limit (429) - ueberspringe diese Quelle:', url);
        return null;
      }
      if (!res.ok) {
        console.warn(`[API] HTTP ${res.status} ${res.statusText} fuer:`, url);
        return null;
      }

      const data = await res.json();
      const keys = Object.keys(data);
      console.log('[API] Antwort OK:', keys.length, 'Felder. Erste Keys:', keys.slice(0, 5).join(', '));
      return data;
    } catch (err) {
      console.error('[API] Netzwerkfehler:', err.message, '| URL:', url);
      return null;
    }
  }

  // ---------- BUECHER ----------

  async function searchBuchByISBN(isbn) {
    const clean = isbn.replace(/[-\s]/g, '');
    console.log('[API] Buch-Suche fuer ISBN:', clean);

    // 1. Google Books (zuverlaessiger, kein Key noetig - kann aber Rate-Limiting haben)
    const gData = await _json(
      `https://www.googleapis.com/books/v1/volumes?q=isbn:${clean}`
    );
    if (gData && gData.items && gData.items.length > 0) {
      const v = gData.items[0].volumeInfo;
      console.log('[API] Google Books Treffer:', v.title);
      return {
        titel:            v.title || '',
        autor:            (v.authors || []).join(', '),
        erscheinungsjahr: v.publishedDate ? parseInt(v.publishedDate) : null,
        genre:            (v.categories || [])[0] || '',
        coverBild:        v.imageLinks
                            ? (v.imageLinks.thumbnail || v.imageLinks.smallThumbnail || '').replace('http:', 'https:')
                            : null,
        seitenanzahl:     v.pageCount || null,
        verlag:           v.publisher || '',
        isbn:             clean,
        _quelle:          'google-books'
      };
    }
    console.log('[API] Google Books: kein Treffer oder Rate-Limit, versuche Open Library...');

    // 2. Open Library bibkeys-API (klassischer Endpunkt)
    const olData = await _json(
      `https://openlibrary.org/api/books?bibkeys=ISBN:${clean}&format=json&jscmd=data`
    );
    if (olData && olData[`ISBN:${clean}`]) {
      const b = olData[`ISBN:${clean}`];
      const cover = b.cover ? (b.cover.large || b.cover.medium || null) : null;
      console.log('[API] Open Library bibkeys Treffer:', b.title);
      return {
        titel:            b.title || '',
        autor:            (b.authors || []).map(a => a.name).join(', '),
        erscheinungsjahr: b.publish_date ? parseInt(b.publish_date) : null,
        genre:            (b.subjects || [])[0]?.name || '',
        coverBild:        cover,
        verlag:           (b.publishers || [])[0]?.name || '',
        isbn:             clean,
        _quelle:          'open-library'
      };
    }
    console.log('[API] Open Library bibkeys: kein Treffer, versuche Open Library Search...');

    // 3. Open Library Search-API (bessere Abdeckung, speziell fuer deutsche Buecher)
    const olSearch = await _json(
      `https://openlibrary.org/search.json?isbn=${clean}&limit=1`
    );
    if (olSearch && olSearch.docs && olSearch.docs.length > 0) {
      const doc = olSearch.docs[0];
      // Cover-URL aus cover_i ableiten
      const coverBild = doc.cover_i
        ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
        : null;
      console.log('[API] Open Library Search Treffer:', doc.title);
      return {
        titel:            doc.title || '',
        autor:            (doc.author_name || []).join(', '),
        erscheinungsjahr: doc.first_publish_year || null,
        genre:            '',
        coverBild,
        verlag:           (doc.publisher || [])[0] || '',
        isbn:             clean,
        _quelle:          'open-library-search'
      };
    }
    console.log('[API] Open Library Search: kein Treffer fuer ISBN', clean);

    // 4. Letzter Ausweg: Teildata zurueckgeben, damit ISBN im Formular sichtbar bleibt
    console.warn('[API] Alle Quellen erschoepft - Fallback mit ISBN-Nummer');
    return {
      titel:    '',
      isbn:     clean,
      coverBild: `https://covers.openlibrary.org/b/isbn/${clean}-L.jpg`,
      _quelle:  'fallback-isbn'
    };
  }

  // ---------- DVDS / FILME ----------

  async function searchDVDByTitle(titel, typ = 'movie') {
    if (!hasOmdbKey()) {
      console.warn('[API] OMDb-Key nicht gesetzt. Kostenlos registrieren auf omdbapi.com');
      return null;
    }
    const data = await _json(
      `https://www.omdbapi.com/?apikey=${OMDB_KEY}&t=${encodeURIComponent(titel)}&type=${typ}`
    );
    if (!data || data.Response !== 'True') {
      console.log('[API] OMDb kein Treffer fuer:', titel);
      return null;
    }
    console.log('[API] OMDb Treffer:', data.Title);
    return {
      titel:            data.Title || '',
      erscheinungsjahr: parseInt(data.Year) || null,
      genre:            (data.Genre || '').split(',')[0].trim(),
      coverBild:        data.Poster !== 'N/A' ? data.Poster : null,
      fsk:              _parseFSK(data.Rated),
      spieldauer:       data.Runtime || '',
      imdbId:           data.imdbID  || '',
      _quelle:          'omdb'
    };
  }

  async function searchByBarcode(barcode, kategorie) {
    const clean = barcode.replace(/\s/g, '');
    console.log('[API] Barcode erkannt:', clean, '| Kategorie:', kategorie);

    // ISBN (Buecher): starts with 978/979 (13-stellig) oder 10-stellig
    if (
      kategorie === 'buch' ||
      (clean.length === 13 && (clean.startsWith('978') || clean.startsWith('979'))) ||
      clean.length === 10
    ) {
      console.log('[API] Erkenne als Buch-ISBN');
      return searchBuchByISBN(clean);
    }

    // EAN -> UPC lookup (kostenlos, trial)
    console.log('[API] Versuche UPC-Datenbank...');
    const upc = await _json(`https://api.upcitemdb.com/prod/trial/lookup?upc=${clean}`);
    if (upc && upc.items && upc.items.length > 0) {
      const item = upc.items[0];
      console.log('[API] UPC Treffer:', item.title);
      if ((kategorie === 'dvd' || kategorie === 'cd') && item.title) {
        const omdbResult = await searchDVDByTitle(item.title);
        if (omdbResult) return omdbResult;
      }
      return {
        titel:    item.title || '',
        coverBild: (item.images || [])[0] || null,
        _quelle:   'upcitemdb'
      };
    }

    // Fallback: als Buch versuchen
    if (clean.length >= 10) {
      console.log('[API] Letzter Fallback: versuche als ISBN...');
      const buchResult = await searchBuchByISBN(clean);
      if (buchResult && buchResult.titel) return buchResult;
    }

    console.warn('[API] Keine Daten gefunden fuer Barcode:', clean);
    return null;
  }

  function _parseFSK(rated) {
    const map = {
      'G': 'FSK 0', 'PG': 'FSK 6', 'PG-13': 'FSK 12',
      'R': 'FSK 16', 'NC-17': 'FSK 18',
      'TV-Y': 'FSK 0', 'TV-G': 'FSK 0', 'TV-PG': 'FSK 6',
      'TV-14': 'FSK 12', 'TV-MA': 'FSK 18'
    };
    return map[rated] || '';
  }

  return { searchBuchByISBN, searchDVDByTitle, searchByBarcode, setOmdbKey, hasOmdbKey };
})();