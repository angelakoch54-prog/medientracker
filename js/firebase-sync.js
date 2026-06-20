/**
 * MedienTracker - Firebase Cloud-Sync (firebase-sync.js)
 *
 * WICHTIG: Bitte zuerst setup_anleitung.html lesen!
 * Angela muss ein Firebase-Projekt anlegen und die Config unten eintragen.
 */
const FirebaseSync = (() => {
  'use strict';

  // ================================================================
  //  FIREBASE KONFIGURATION - HIER EINTRAGEN!
  //  (Werte aus Firebase Console > Projekteinstellungen > Web-App)
  // ================================================================
  const FIREBASE_CONFIG = {
    apiKey:            "DEINE_API_KEY",
    authDomain:        "DEIN_PROJEKT.firebaseapp.com",
    projectId:         "DEIN_PROJEKT_ID",
    storageBucket:     "DEIN_PROJEKT.appspot.com",
    messagingSenderId: "DEINE_SENDER_ID",
    appId:             "DEINE_APP_ID"
  };
  // ================================================================

  let _app      = null;
  let _auth     = null;
  let _fs       = null;
  let _user     = null;
  let _listener = null;
  let _busy     = false;
  let _cb       = () => {};

  function _isConfigured() {
    return FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.apiKey !== 'DEINE_API_KEY';
  }

  function _col() {
    if (!_fs || !_user) return null;
    return _fs.collection('users').doc(_user.uid).collection('artikel');
  }

  async function init(statusCallback) {
    _cb = statusCallback || (() => {});

    if (!_isConfigured()) {
      _cb({ status: 'not_configured', msg: 'Firebase nicht eingerichtet. Anleitung: setup_anleitung.html' });
      return false;
    }
    if (typeof firebase === 'undefined') {
      _cb({ status: 'error', msg: 'Firebase SDK nicht geladen' });
      return false;
    }

    try {
      _app  = firebase.apps.length ? firebase.apps[0] : firebase.initializeApp(FIREBASE_CONFIG);
      _auth = firebase.auth();
      _fs   = firebase.firestore();

      // Offline-Persistenz aktivieren
      try {
        await _fs.enablePersistence({ synchronizeTabs: true });
      } catch (e) {
        if (e.code !== 'failed-precondition' && e.code !== 'unimplemented') {
          console.warn('[Firebase] Persistenz:', e.code);
        }
      }

      _cb({ status: 'initializing', msg: 'Verbinde...' });
      await _signIn();
      return true;
    } catch (err) {
      console.error('[Firebase] Init-Fehler:', err);
      _cb({ status: 'error', msg: 'Firebase-Fehler: ' + err.message });
      return false;
    }
  }

  function _signIn() {
    return new Promise((resolve, reject) => {
      _auth.onAuthStateChanged(async (u) => {
        if (u) {
          _user = u;
          _cb({ status: 'connected', msg: 'Verbunden', uid: u.uid });
          resolve(u);
        } else {
          try {
            const r = await _auth.signInAnonymously();
            _user = r.user;
            _cb({ status: 'connected', msg: 'Anonym angemeldet', uid: _user.uid });
            resolve(_user);
          } catch (err) {
            _cb({ status: 'error', msg: 'Anmeldung fehlgeschlagen' });
            reject(err);
          }
        }
      });
    });
  }

  async function syncToCloud() {
    if (!_isConfigured() || !_user || !_fs || _busy) return;
    _busy = true;
    _cb({ status: 'syncing', msg: 'Synchronisiere...' });

    try {
      const unsynced = await DB.getUnsyncedArtikel();
      if (!unsynced.length) {
        _busy = false;
        _cb({ status: 'connected', msg: 'Aktuell' });
        return;
      }
      const col   = _col();
      const batch = _fs.batch();
      for (const a of unsynced) {
        const { _synced, ...data } = a;
        batch.set(col.doc(a.id), data, { merge: true });
      }
      await batch.commit();
      for (const a of unsynced) await DB.markAsSynced(a.id);
      _cb({ status: 'connected', msg: `${unsynced.length} Artikel synchronisiert` });
    } catch (err) {
      console.error('[Firebase] Sync-Fehler:', err);
      _cb({ status: 'error', msg: 'Sync fehlgeschlagen' });
    }
    _busy = false;
  }

  async function deleteFromCloud(id) {
    if (!_isConfigured() || !_user || !_fs) return;
    try { await _col().doc(id).delete(); } catch (e) { console.warn('[Firebase] Delete:', e); }
  }

  function startRealtimeSync(onUpdate) {
    if (!_isConfigured() || !_user || !_fs) return;
    const col = _col();
    _listener = col.orderBy('aktualisiertAm', 'desc').onSnapshot(
      async (snap) => {
        for (const chg of snap.docChanges()) {
          const data = { id: chg.doc.id, ...chg.doc.data() };
          if (chg.type === 'added' || chg.type === 'modified') {
            await DB.upsertArtikel(data);
            if (onUpdate) onUpdate(chg.type, data);
          }
        }
      },
      (err) => {
        console.error('[Firebase] Realtime-Fehler:', err);
        _cb({ status: 'error', msg: 'Echtzeit-Sync Fehler' });
      }
    );
  }

  function stopRealtimeSync() {
    if (_listener) { _listener(); _listener = null; }
  }

  async function signOut() {
    stopRealtimeSync();
    if (_auth) { await _auth.signOut(); _user = null; }
    _cb({ status: 'disconnected', msg: 'Abgemeldet' });
  }

  return {
    init, syncToCloud, deleteFromCloud,
    startRealtimeSync, stopRealtimeSync, signOut,
    get isConfigured() { return _isConfigured(); },
    get isConnected()  { return !!_user; },
    get userId()       { return _user ? _user.uid : null; }
  };
})();