/**
 * MedienTracker - Hauptlogik (app.js)
 * iOS-optimierte PWA fuer iPhone und iPad
 */
'use strict';

// ============================================================
// KATEGORIEN & KONSTANTEN
// ============================================================
const KATEGORIEN = [
  { id: 'dvd',    name: 'DVDs',         farbe: '#ef4444', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="2" y="2" width="20" height="20" rx="2"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/><line x1="17" y1="17" x2="22" y2="17"/></svg>' },
  { id: 'buch',   name: 'Buecher',      farbe: '#10b981', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>' },
  { id: 'cd',     name: 'CDs',          farbe: '#a855f7', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>' },
  { id: 'nds',    name: 'Nintendo DS',  farbe: '#f59e0b', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/><line x1="15" y1="13" x2="15.01" y2="13"/><line x1="18" y1="11" x2="18.01" y2="11"/><path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.544-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z"/></svg>' },
  { id: 'switch', name: 'Switch',       farbe: '#ec4899', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="2" y="6" width="20" height="12" rx="6"/><circle cx="7" cy="12" r="2"/><line x1="15" y1="9" x2="17" y2="9"/><line x1="15" y1="12" x2="17" y2="12"/><line x1="15" y1="15" x2="17" y2="15"/></svg>' },
  { id: 'wii',    name: 'Wii',          farbe: '#3b82f6', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="5" y="2" width="14" height="20" rx="4"/><circle cx="12" cy="17" r="1.5"/><rect x="9" y="5" width="6" height="4" rx="1"/></svg>' }
];

const KAT_MAP = Object.fromEntries(KATEGORIEN.map(k => [k.id, k]));

const GENRES = {
  dvd:    ['Action', 'Animation', 'Dokumentation', 'Drama', 'Fantasy', 'Horror', 'Komoedie', 'Krimi', 'Romantik', 'Science-Fiction', 'Thriller'],
  buch:   ['Abenteuer', 'Biografie', 'Fantasy', 'Horror', 'Humor', 'Kinderbuch', 'Krimi', 'Lyrik', 'Ratgeber', 'Roman', 'Sachbuch', 'Science-Fiction'],
  cd:     ['Alternative', 'Blues', 'Elektro', 'HipHop', 'Jazz', 'Klassik', 'Metal', 'Pop', 'R&B', 'Rock', 'Soul'],
  nds:    ['Action', 'Abenteuer', 'Jump n Run', 'Puzzle', 'Racing', 'Rollenspiel', 'Sport', 'Strategie'],
  switch: ['Action', 'Abenteuer', 'Jump n Run', 'Multiplayer', 'Puzzle', 'Racing', 'Rollenspiel', 'Sport', 'Strategie'],
  wii:    ['Action', 'Abenteuer', 'Jump n Run', 'Party', 'Puzzle', 'Racing', 'Rollenspiel', 'Sport', 'Strategie'],
};

const STAR_FULL  = '<svg class="star-icon filled"  viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
const STAR_EMPTY = '<svg class="star-icon empty" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';

// ============================================================
// APP STATE
// ============================================================
const state = {
  view:       'dashboard',
  prevView:   null,
  kategorie:  null,
  tab:        'sammlung',
  editId:     null,
  newKat:     null,
  formStep:   1,
  filters:    { genre: '', fsk: '', bewertet: false, verliehen: false },
  sort:       'az',
  rating:     0,
  wunschliste: false,
  pendingBarcode: null,
  confirmCb:  null,
};

// ============================================================
// SERVICE WORKER
// ============================================================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => { console.log('[SW] Registered:', reg.scope); })
      .catch(err => { console.warn('[SW] Registration failed:', err); });
  });
}

// ============================================================
// INIT
// ============================================================
const App = {

  async init() {
    try {
      await DB.init();
      console.log('[App] DB initialized');
    } catch (err) {
      console.error('[App] DB init failed:', err);
      this.toast('Datenbankfehler: ' + err.message, 'error');
    }

    this._setupEvents();
    this.renderDashboard();
    this._initFirebase();

    // Dark mode aus Einstellungen laden
    const theme = await DB.getSetting('theme', 'dark');
    document.documentElement.setAttribute('data-theme', theme);
    document.getElementById('theme-toggle').classList.toggle('on', theme === 'dark');
  },

  // ============================================================
  // NAVIGATION
  // ============================================================
  navigate(view, params = {}) {
    state.prevView = state.view;
    state.view     = view;

    // Alle Views ausblenden
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));

    // Aktiven Nav-Tab setzen
    document.querySelectorAll('.nav-item').forEach(b => {
      b.classList.toggle('active',
        b.dataset.view === view || (view === 'kategorie' && b.dataset.view === 'sammlung')
      );
    });

    const header    = document.getElementById('page-title');
    const backBtn   = document.getElementById('back-btn');
    const hActions  = document.getElementById('header-actions');

    // Sync-Dot immer sichtbar
    const syncDot = document.getElementById('sync-status');
    hActions.innerHTML = '';
    hActions.appendChild(syncDot);

    switch (view) {
      case 'dashboard':
        document.getElementById('view-dashboard').classList.add('active');
        header.textContent = 'MedienTracker';
        backBtn.classList.add('hidden');
        this.renderDashboard();
        break;

      case 'sammlung':
        // Zeige Kategorie-Auswahl auf dem Dashboard
        document.getElementById('view-dashboard').classList.add('active');
        header.textContent = 'MedienTracker';
        backBtn.classList.add('hidden');
        this.renderDashboard();
        break;

      case 'kategorie':
        state.kategorie = params.kat || state.kategorie;
        state.tab       = params.tab || 'sammlung';
        document.getElementById('view-kategorie').classList.add('active');
        const kat = KAT_MAP[state.kategorie];
        header.textContent = kat ? kat.name : 'Kategorie';
        backBtn.classList.remove('hidden');
        // Filter-Btn fuer Hinzufuegen
        const addBtn = document.createElement('button');
        addBtn.className = 'header-btn';
        addBtn.setAttribute('aria-label', 'Neuer Artikel');
        addBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>';
        addBtn.onclick = () => this.navigate('hinzufuegen', { kat: state.kategorie });
        hActions.appendChild(addBtn);
        this.renderKategorie();
        break;

      case 'hinzufuegen':
        state.editId    = null;
        state.newKat    = params.kat || null;
        state.formStep  = state.newKat ? 2 : 1;
        state.rating    = 0;
        state.wunschliste = false;
        document.getElementById('view-form').classList.add('active');
        header.textContent = 'Hinzufuegen';
        backBtn.classList.remove('hidden');
        this.renderForm();
        break;

      case 'bearbeiten':
        state.editId = params.id;
        document.getElementById('view-form').classList.add('active');
        header.textContent = 'Bearbeiten';
        backBtn.classList.remove('hidden');
        this.renderFormEdit(params.id);
        break;

      case 'suche':
        document.getElementById('view-suche').classList.add('active');
        header.textContent = 'Suche';
        backBtn.classList.add('hidden');
        setTimeout(() => document.getElementById('search-input').focus(), 300);
        break;

      case 'verliehen':
        document.getElementById('view-verliehen').classList.add('active');
        header.textContent = 'Verliehen';
        backBtn.classList.remove('hidden');
        this.renderVerliehen();
        break;

      case 'detail':
        document.getElementById('view-detail').classList.add('active');
        header.textContent = 'Details';
        backBtn.classList.remove('hidden');
        this.renderDetail(params.id);
        break;

      default:
        document.getElementById('view-dashboard').classList.add('active');
        header.textContent = 'MedienTracker';
        backBtn.classList.add('hidden');
        this.renderDashboard();
    }
  },

  goBack() {
    if (state.prevView === 'kategorie' || state.view === 'bearbeiten') {
      this.navigate('kategorie');
    } else if (state.view === 'detail') {
      this.navigate('kategorie');
    } else {
      this.navigate('dashboard');
    }
  },

  // ============================================================
  // DASHBOARD
  // ============================================================
  async renderDashboard() {
    const stats    = await DB.getKategorieStats();
    const recent   = await DB.getRecentArtikel(6);
    const verliehen = await DB.getVerliehenArtikel();

    // Stats Grid
    const grid = document.getElementById('stats-grid');
    grid.innerHTML = KATEGORIEN.map(k => {
      const s = stats[k.id] || { sammlung: 0, wunschliste: 0 };
      return `
        <div class="stat-card" data-kat="${k.id}" onclick="App.navigate('kategorie',{kat:'${k.id}'})">
          <div class="stat-icon" style="background:${k.farbe}">${k.icon}</div>
          <div class="stat-name">${k.name}</div>
          <div class="stat-count">${s.sammlung}</div>
          <div class="stat-sub">${s.wunschliste > 0 ? `+ ${s.wunschliste} Wunsch` : 'Artikel'}</div>
        </div>`;
    }).join('');

    // Recent List
    const recentEl = document.getElementById('recent-list');
    if (recent.length === 0) {
      recentEl.innerHTML = '<p style="padding:0 16px; color:var(--text3); font-size:0.85rem;">Noch keine Artikel. Tippe + um zu starten.</p>';
    } else {
      recentEl.innerHTML = recent.map(a => `
        <div class="recent-item" onclick="App.navigate('detail',{id:'${a.id}'})">
          <div class="recent-cover">
            ${a.coverBild
              ? `<img src="${a.coverBild}" alt="${_esc(a.titel)}" loading="lazy" onerror="this.style.display='none'">`
              : KAT_MAP[a.kategorie]?.icon || ''
            }
          </div>
          <div class="recent-label">${_esc(a.titel)}</div>
        </div>`).join('');
    }

    // Verliehen Quick
    const lentEl = document.getElementById('lent-quick');
    const lentSection = document.getElementById('lent-section');
    if (verliehen.length === 0) {
      lentSection.style.display = 'none';
    } else {
      lentSection.style.display = 'block';
      lentEl.innerHTML = verliehen.slice(0, 3).map(a => {
        const days = _daysSince(a.verliehenSeit || a.erstelltAm);
        return `
          <div class="verliehen-card ${days > 30 ? 'overdue' : ''}"
               onclick="App.navigate('detail',{id:'${a.id}'})">
            <div class="verliehen-cover">
              ${a.coverBild
                ? `<img src="${a.coverBild}" alt="${_esc(a.titel)}" loading="lazy">`
                : KAT_MAP[a.kategorie]?.icon || ''
              }
            </div>
            <div class="verliehen-info">
              <div class="verliehen-titel">${_esc(a.titel)}</div>
              <div class="verliehen-person">an ${_esc(a.verliehenAn)}</div>
              <span class="verliehen-days ${days > 30 ? 'overdue' : 'ok'}">${days} Tage</span>
            </div>
          </div>`;
      }).join('');
    }
  },

  // ============================================================
  // KATEGORIE VIEW
  // ============================================================
  async renderKategorie() {
    const kat = state.kategorie;
    if (!kat) return;

    // Tabs
    document.getElementById('tab-sammlung').classList.toggle('active', state.tab === 'sammlung');
    document.getElementById('tab-wunschliste').classList.toggle('active', state.tab === 'wunschliste');

    // Artikel laden
    let items = await DB.getArtikelByKategorie(kat, state.tab === 'wunschliste');

    // Filter anwenden
    const f = state.filters;
    if (f.genre)     items = items.filter(a => a.genre === f.genre);
    if (f.fsk)       items = items.filter(a => a.fsk   === f.fsk);
    if (f.bewertet)  items = items.filter(a => (a.bewertung || 0) > 0);
    if (f.verliehen) items = items.filter(a => a.verliehenAn && a.verliehenAn.trim());

    // Sortierung
    switch (state.sort) {
      case 'za':        items.sort((a,b) => (b.titel||'').localeCompare(a.titel||'', 'de')); break;
      case 'bewertung': items.sort((a,b) => (b.bewertung||0) - (a.bewertung||0));             break;
      case 'jahr':      items.sort((a,b) => (b.erscheinungsjahr||0) - (a.erscheinungsjahr||0)); break;
      case 'neu':       items.sort((a,b) => b.erstelltAm - a.erstelltAm);                    break;
      default:          items.sort((a,b) => (a.titel||'').localeCompare(b.titel||'', 'de'));  break;
    }

    const container = document.getElementById('kategorie-list');
    if (items.length === 0) {
      container.innerHTML = this._emptyState(
        KAT_MAP[kat]?.icon,
        state.tab === 'wunschliste' ? 'Wunschliste leer' : 'Keine Artikel',
        state.tab === 'wunschliste'
          ? 'Fuege Artikel zur Wunschliste hinzu indem du beim Erstellen "Auf Wunschliste" aktivierst.'
          : 'Tippe + oder den Button oben um deinen ersten Artikel hinzuzufuegen.'
      );
      return;
    }

    container.innerHTML = items.map((a, idx) => this._itemCard(a, idx, items.length)).join('');

    // Swipe-Gesten aktivieren
    container.querySelectorAll('.item-card').forEach(card => {
      this._setupSwipe(card);
    });
  },

  _emptyState(icon, title, msg) {
    return `<div class="empty-state">
      <div style="width:56px;height:56px;margin:0 auto 16px;opacity:0.3;">${icon || ''}</div>
      <h3>${title}</h3>
      <p>${msg}</p>
    </div>`;
  },

  _itemCard(a, idx, total) {
    const kat  = KAT_MAP[a.kategorie];
    const last = idx === total - 1;
    const stars = _renderStars(a.bewertung || 0, 'small');
    const lentBadge = a.verliehenAn ? `<span class="item-badge lent">Verliehen</span>` : '';
    const fskBadge  = a.fsk ? `<span class="item-badge fsk">${_esc(a.fsk)}</span>` : '';

    return `
      <div class="item-card-wrap" data-id="${a.id}">
        <div class="swipe-action-left">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          Bearbeiten
        </div>
        <div class="swipe-action-right">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          Loeschen
        </div>
        <div class="item-card" data-id="${a.id}" onclick="App.navigate('detail',{id:'${a.id}'})">
          <div class="item-cover">
            ${a.coverBild
              ? `<img src="${a.coverBild}" alt="${_esc(a.titel)}" loading="lazy" onerror="this.style.display='none'">`
              : `<div class="item-cover-placeholder" style="color:${kat?.farbe}">${kat?.icon || ''}</div>`
            }
          </div>
          <div class="item-info">
            <div class="item-titel">${_esc(a.titel)}</div>
            <div class="item-meta">
              ${a.erscheinungsjahr ? `<span>${a.erscheinungsjahr}</span>` : ''}
              ${a.genre ? `<span>${_esc(a.genre)}</span>` : ''}
              ${fskBadge}${lentBadge}
            </div>
            <div class="stars-row">${stars}</div>
          </div>
        </div>
      </div>`;
  },

  // ============================================================
  // SWIPE GESTURES
  // ============================================================
  _setupSwipe(cardEl) {
    const wrap = cardEl.closest('.item-card-wrap');
    if (!wrap) return;
    const id = cardEl.dataset.id;
    let startX = 0, dx = 0, dragging = false;

    cardEl.addEventListener('touchstart', (e) => {
      startX   = e.touches[0].clientX;
      dx       = 0;
      dragging = true;
      cardEl.style.transition = 'none';
    }, { passive: true });

    cardEl.addEventListener('touchmove', (e) => {
      if (!dragging) return;
      dx = e.touches[0].clientX - startX;
      const clamped = Math.max(-90, Math.min(90, dx));
      cardEl.style.transform = `translateX(${clamped}px)`;
    }, { passive: true });

    cardEl.addEventListener('touchend', () => {
      dragging = false;
      cardEl.style.transition = 'transform 0.2s ease';
      if (dx < -70) {
        // Loeschen
        cardEl.style.transform = 'translateX(-90px)';
        setTimeout(() => { cardEl.style.transform = ''; }, 800);
        this.confirmDelete(id);
      } else if (dx > 70) {
        // Bearbeiten
        cardEl.style.transform = '';
        this.navigate('bearbeiten', { id });
      } else {
        cardEl.style.transform = '';
      }
    });
  },

  // ============================================================
  // FORM - NEUER ARTIKEL
  // ============================================================
  renderForm() {
    const step1 = document.getElementById('form-step-kat');
    const step2 = document.getElementById('form-step-scan');
    const step3 = document.getElementById('form-step-fields');

    step1.style.display = 'none';
    step2.style.display = 'none';
    step3.style.display = 'none';

    if (state.formStep === 1) {
      // Kategorie waehlen
      step1.style.display = 'block';
      this._renderKatGrid();
    } else if (state.formStep === 2) {
      // Scan-Option
      step2.style.display = 'block';
    } else {
      // Felder
      step3.style.display = 'block';
      this._resetForm();
      this._populateGenres(state.newKat || state.kategorie);
      document.getElementById('f-kat').value = state.newKat || state.kategorie || '';
    }
  },

  _renderKatGrid() {
    const grid = document.getElementById('kat-grid');
    grid.innerHTML = KATEGORIEN.map(k => `
      <div class="kat-option" data-kat="${k.id}" onclick="App._selectKat('${k.id}')">
        <div class="kat-icon" style="background:${k.farbe}">${k.icon}</div>
        ${k.name}
      </div>`).join('');
  },

  _selectKat(katId) {
    state.newKat   = katId;
    state.formStep = 2;
    this.renderForm();
  },

  skipScan() {
    state.formStep = 3;
    this.renderForm();
  },

  _resetForm() {
    const form = document.getElementById('artikel-form');
    form.reset();
    document.getElementById('f-bewertung').value = '0';
    document.getElementById('f-wunschliste').value = 'false';
    document.getElementById('f-wunschliste-toggle').classList.remove('on');
    document.getElementById('f-wunschliste-toggle').setAttribute('aria-checked', 'false');
    document.getElementById('cover-img').style.display = 'none';
    document.getElementById('cover-placeholder').style.display = '';
    document.getElementById('cover-data').value = '';
    state.rating      = 0;
    state.wunschliste = false;
    this._updateRatingUI(0);
  },

  _populateGenres(katId) {
    const sel    = document.getElementById('f-genre');
    const genres = GENRES[katId] || [];
    sel.innerHTML = '<option value="">-- waehlen --</option>' +
      genres.map(g => `<option value="${g}">${g}</option>`).join('');
  },

  // ============================================================
  // FORM - BEARBEITEN
  // ============================================================
  async renderFormEdit(id) {
    const step1 = document.getElementById('form-step-kat');
    const step2 = document.getElementById('form-step-scan');
    const step3 = document.getElementById('form-step-fields');
    step1.style.display = 'none';
    step2.style.display = 'none';
    step3.style.display = 'block';

    const a = await DB.getArtikelById(id);
    if (!a) { this.toast('Artikel nicht gefunden', 'error'); this.goBack(); return; }

    state.newKat      = a.kategorie;
    state.rating      = a.bewertung  || 0;
    state.wunschliste = a.istWunschliste || false;

    this._populateGenres(a.kategorie);

    document.getElementById('f-id').value       = a.id;
    document.getElementById('f-kat').value      = a.kategorie;
    document.getElementById('f-erstellt').value = a.erstelltAm || '';
    document.getElementById('f-titel').value    = a.titel || '';
    document.getElementById('f-jahr').value     = a.erscheinungsjahr || '';
    document.getElementById('f-genre').value    = a.genre   || '';
    document.getElementById('f-band').value     = a.band    || '';
    document.getElementById('f-dauer').value    = a.spieldauer || '';
    document.getElementById('f-fsk').value      = a.fsk     || '';
    document.getElementById('f-verliehen').value = a.verliehenAn || '';
    document.getElementById('f-bewertung').value = state.rating;
    document.getElementById('f-wunschliste').value = state.wunschliste ? 'true' : 'false';
    document.getElementById('cover-data').value = a.coverBild || '';

    const toggle = document.getElementById('f-wunschliste-toggle');
    toggle.classList.toggle('on', state.wunschliste);
    toggle.setAttribute('aria-checked', state.wunschliste.toString());

    this._updateRatingUI(state.rating);

    if (a.coverBild) {
      const img = document.getElementById('cover-img');
      img.src = a.coverBild;
      img.style.display = 'block';
      document.getElementById('cover-placeholder').style.display = 'none';
    }
  },

  // ============================================================
  // FORM SAVE
  // ============================================================
  async saveArtikel(e) {
    e.preventDefault();
    const form  = document.getElementById('artikel-form');
    const data  = new FormData(form);
    const titel = (data.get('titel') || '').trim();

    if (!titel) {
      this.toast('Bitte Titel eingeben', 'error');
      document.getElementById('f-titel').focus();
      return;
    }

    const isEdit = !!data.get('id');
    const artikel = {
      id:               data.get('id') || DB.generateId(),
      titel,
      coverBild:        data.get('coverBild') || '',
      erscheinungsjahr: data.get('erscheinungsjahr') ? parseInt(data.get('erscheinungsjahr')) : null,
      genre:            data.get('genre') || '',
      band:             data.get('band')  || '',
      spieldauer:       data.get('spieldauer') || '',
      fsk:              data.get('fsk')   || '',
      bewertung:        parseInt(data.get('bewertung')) || 0,
      verliehenAn:      data.get('verliehenAn') || '',
      istWunschliste:   data.get('istWunschliste') === 'true',
      kategorie:        data.get('kategorie') || state.newKat || state.kategorie,
      erstelltAm:       data.get('erstelltAm') ? parseInt(data.get('erstelltAm')) : null,
    };

    if (artikel.verliehenAn && !isEdit) {
      artikel.verliehenSeit = Date.now();
    }

    try {
      if (isEdit) {
        await DB.updateArtikel(artikel);
        this.toast('Artikel aktualisiert', 'success');
      } else {
        await DB.addArtikel(artikel);
        this.toast('Artikel hinzugefuegt', 'success');
      }

      // Firebase sync
      FirebaseSync.syncToCloud().catch(() => {});

      // Navigation
      if (state.kategorie) {
        this.navigate('kategorie');
      } else {
        state.kategorie = artikel.kategorie;
        this.navigate('kategorie');
      }
    } catch (err) {
      console.error('Save error:', err);
      this.toast('Fehler beim Speichern: ' + err.message, 'error');
    }
  },

  // ============================================================
  // DETAIL VIEW
  // ============================================================
  async renderDetail(id) {
    const a = await DB.getArtikelById(id);
    if (!a) { this.toast('Artikel nicht gefunden', 'error'); this.goBack(); return; }

    const kat   = KAT_MAP[a.kategorie];
    const stars = _renderStars(a.bewertung || 0, 'large');
    const isWL  = a.istWunschliste;
    const days  = a.verliehenAn ? _daysSince(a.verliehenSeit || a.erstelltAm) : null;

    const html = `
      <div class="detail-cover-wrap">
        <div class="detail-cover">
          ${a.coverBild
            ? `<img src="${a.coverBild}" alt="${_esc(a.titel)}" onerror="this.style.display='none'">`
            : `<div style="color:${kat?.farbe || 'var(--text3)'}">${kat?.icon || ''}</div>`
          }
        </div>
      </div>
      <div class="detail-title">${_esc(a.titel)}</div>
      <div class="detail-subtitle">
        ${[a.erscheinungsjahr, kat?.name].filter(Boolean).join(' &bull; ')}
      </div>
      <div class="detail-stars">${stars}</div>

      <div class="detail-actions">
        <button class="detail-action-btn btn-primary" onclick="App.navigate('bearbeiten',{id:'${a.id}'})">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          Bearbeiten
        </button>
        <button class="detail-action-btn ${isWL ? 'btn-success' : 'btn-secondary'}"
                onclick="App.toggleWunschlisteItem('${a.id}',${!isWL})">
          <svg viewBox="0 0 24 24" fill="${isWL ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          ${isWL ? 'In Sammlung' : 'Wunschliste'}
        </button>
        <button class="detail-action-btn btn-danger" onclick="App.confirmDelete('${a.id}')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          Loeschen
        </button>
      </div>

      ${a.verliehenAn ? `
      <div style="margin-bottom:16px; padding:12px; background:var(--warning-bg); border-radius:var(--radius-sm); display:flex; align-items:center; gap:10px; justify-content:space-between;">
        <div>
          <div style="font-size:0.82rem; color:var(--warning); font-weight:600;">Verliehen an ${_esc(a.verliehenAn)}</div>
          <div style="font-size:0.75rem; color:var(--text3); margin-top:2px;">${days} Tage ${days > 30 ? '&#9888; Lange her!' : ''}</div>
        </div>
        <button class="btn-success detail-action-btn" style="flex:0 0 auto; padding:0 14px;"
                onclick="App.returnItem('${a.id}')">
          Zurueck
        </button>
      </div>` : ''}

      <div class="detail-info-table">
        ${_infoRow('Genre',       a.genre)}
        ${_infoRow('FSK',         a.fsk)}
        ${_infoRow('Band/Staffel', a.band)}
        ${_infoRow('Spieldauer',  a.spieldauer)}
        ${_infoRow('Hinzugefuegt', a.erstelltAm ? new Date(a.erstelltAm).toLocaleDateString('de-DE') : null)}
      </div>`;

    document.getElementById('detail-content').innerHTML = html;
  },

  async toggleWunschlisteItem(id, toWunschliste) {
    const a = await DB.getArtikelById(id);
    if (!a) return;
    a.istWunschliste = toWunschliste;
    await DB.updateArtikel(a);
    FirebaseSync.syncToCloud().catch(() => {});
    this.toast(toWunschliste ? 'Auf Wunschliste verschoben' : 'In Sammlung verschoben', 'success');
    this.renderDetail(id);
  },

  async returnItem(id) {
    const a = await DB.getArtikelById(id);
    if (!a) return;
    const person = a.verliehenAn;
    a.verliehenAn   = '';
    a.verliehenSeit = null;
    await DB.updateArtikel(a);
    FirebaseSync.syncToCloud().catch(() => {});
    this.toast(`Zurueck von ${person}`, 'success');
    this.renderDetail(id);
  },

  // ============================================================
  // DELETE
  // ============================================================
  confirmDelete(id) {
    state.confirmCb = () => this._doDelete(id);
    document.getElementById('confirm-title').textContent = 'Artikel loeschen?';
    document.getElementById('confirm-msg').textContent   = 'Dieser Artikel wird dauerhaft geloescht.';
    document.getElementById('confirm-overlay').classList.remove('hidden');
  },

  async _doDelete(id) {
    try {
      await DB.deleteArtikel(id);
      FirebaseSync.deleteFromCloud(id).catch(() => {});
      this.toast('Artikel geloescht', 'info');
      if (state.view === 'detail') {
        this.navigate('kategorie');
      } else {
        this.renderKategorie();
      }
    } catch (err) {
      this.toast('Loeschen fehlgeschlagen', 'error');
    }
  },

  // ============================================================
  // SEARCH
  // ============================================================
  async handleSearch(query) {
    const resultsEl = document.getElementById('search-results');
    document.getElementById('search-clear').style.display = query ? '' : 'none';

    if (!query || query.length < 1) {
      resultsEl.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <h3>Suche</h3>
          <p>Gib einen Suchbegriff ein</p>
        </div>`;
      return;
    }

    const results = await DB.searchArtikel(query);

    if (results.length === 0) {
      resultsEl.innerHTML = `
        <div class="empty-state">
          <h3>Keine Ergebnisse</h3>
          <p>Keine Artikel gefunden fuer "${_esc(query)}"</p>
        </div>`;
      return;
    }

    // Gruppieren nach Kategorie
    const grouped = {};
    for (const a of results) {
      if (!grouped[a.kategorie]) grouped[a.kategorie] = [];
      grouped[a.kategorie].push(a);
    }

    let html = '';
    for (const [katId, items] of Object.entries(grouped)) {
      const kat = KAT_MAP[katId];
      html += `<div class="search-group-title" style="color:${kat?.farbe}">${kat?.name || katId}</div>`;
      html += `<div class="item-list" style="padding:0;">`;
      html += items.map((a, i) => this._itemCard(a, i, items.length)).join('');
      html += `</div>`;
    }
    resultsEl.innerHTML = html;
  },

  clearSearch() {
    const input = document.getElementById('search-input');
    input.value = '';
    input.focus();
    this.handleSearch('');
  },

  // ============================================================
  // VERLIEHEN VIEW
  // ============================================================
  async renderVerliehen() {
    const items = await DB.getVerliehenArtikel();
    const list  = document.getElementById('verliehen-list');

    if (items.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <h3>Nichts verliehen</h3>
          <p>Aktuell ist kein Artikel verliehen</p>
        </div>`;
      return;
    }

    list.innerHTML = items.map(a => {
      const kat  = KAT_MAP[a.kategorie];
      const days = _daysSince(a.verliehenSeit || a.erstelltAm);
      return `
        <div class="verliehen-card ${days > 30 ? 'overdue' : ''}"
             onclick="App.navigate('detail',{id:'${a.id}'})">
          <div class="verliehen-cover">
            ${a.coverBild
              ? `<img src="${a.coverBild}" alt="${_esc(a.titel)}" loading="lazy">`
              : `<div style="color:${kat?.farbe}">${kat?.icon || ''}</div>`
            }
          </div>
          <div class="verliehen-info">
            <div class="verliehen-titel">${_esc(a.titel)}</div>
            <div class="verliehen-person">an ${_esc(a.verliehenAn)}</div>
            <div style="font-size:0.72rem;color:var(--text3);">${kat?.name || ''}</div>
            <span class="verliehen-days ${days > 30 ? 'overdue' : 'ok'}">
              ${days} Tage ${days > 30 ? '&#9888;' : ''}
            </span>
          </div>
          <button class="verliehen-return" onclick="event.stopPropagation();App.returnItem('${a.id}')" aria-label="Zurueck">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </button>
        </div>`;
    }).join('');
  },

  // ============================================================
  // SCANNER
  // ============================================================
  async openScanner() {
    document.getElementById('scanner-modal').classList.remove('hidden');
    document.getElementById('scanner-manual-input').value = '';

    try {
      await Scanner.start('scanner-viewport', async (barcode, fmt) => {
        await Scanner.stop();
        document.getElementById('scanner-modal').classList.add('hidden');
        this.toast('Barcode erkannt: ' + barcode, 'info');
        await this._handleBarcode(barcode);
      });
    } catch (err) {
      console.warn('Scanner error:', err);
      this.toast('Kamera nicht verfuegbar. Bitte manuell eingeben.', 'warning');
    }
  },

  async closeScanner() {
    await Scanner.stop();
    document.getElementById('scanner-modal').classList.add('hidden');
  },

  async handleManualBarcode() {
    const val = document.getElementById('scanner-manual-input').value.trim();
    if (!val) { this.toast('Bitte Barcode eingeben', 'error'); return; }
    await Scanner.stop();
    document.getElementById('scanner-modal').classList.add('hidden');
    await this._handleBarcode(val);
  },

  async _handleBarcode(barcode) {
    const kat = state.newKat || state.kategorie;
    console.log('[App] Barcode verarbeiten:', barcode, '| Kategorie:', kat);
    this.toast('Suche Daten...', 'info');

    try {
      const result = await API.searchByBarcode(barcode, kat);

      // Formular oeffnen (egal ob Daten gefunden oder nicht)
      state.formStep = 3;
      this.renderForm();
      await new Promise(r => setTimeout(r, 100));

      if (result && result.titel) {
        // Vollstaendige Daten gefunden
        console.log('[App] Daten gefunden:', result.titel, '| Quelle:', result._quelle);
        document.getElementById('f-titel').value = result.titel;
        if (result.erscheinungsjahr) document.getElementById('f-jahr').value = result.erscheinungsjahr;
        if (result.genre) {
          const sel = document.getElementById('f-genre');
          for (const opt of sel.options) {
            if (opt.value === result.genre) { sel.value = result.genre; break; }
          }
        }
        if (result.fsk)        document.getElementById('f-fsk').value = result.fsk;
        if (result.spieldauer) document.getElementById('f-dauer').value = result.spieldauer;
        if (result.coverBild) {
          document.getElementById('cover-data').value = result.coverBild;
          const img = document.getElementById('cover-img');
          img.src = result.coverBild;
          img.style.display = 'block';
          document.getElementById('cover-placeholder').style.display = 'none';
        }
        this.toast('Daten gefunden! (' + (result._quelle || 'API') + ')', 'success');

      } else if (result && result.isbn) {
        // Nur ISBN bekannt - kein Buchtitel in Datenbanken
        console.log('[App] Nur ISBN gefunden:', result.isbn);
        if (result.coverBild) {
          document.getElementById('cover-data').value = result.coverBild;
          const img = document.getElementById('cover-img');
          img.src = result.coverBild;
          img.style.display = 'block';
          img.onerror = () => {
            img.style.display = 'none';
            document.getElementById('cover-placeholder').style.display = '';
            document.getElementById('cover-data').value = '';
          };
          document.getElementById('cover-placeholder').style.display = 'none';
        }
        // ISBN ins Band-Feld eintragen damit die erkannte Nummer sichtbar bleibt
        document.getElementById('f-band').value = 'ISBN: ' + result.isbn;
        this.toast(
          'Kein Buchtitel gefunden. ISBN ' + result.isbn + ' erkannt - bitte Titel manuell ausfullen.',
          'warning'
        );

      } else {
        // Gar nichts gefunden
        console.warn('[App] Keine Daten fuer Barcode:', barcode);
        this.toast(
          'Keine Daten gefunden fuer: ' + barcode + ' - bitte manuell ausfullen.',
          'warning'
        );
      }
    } catch (err) {
      console.error('[App] Fehler bei Barcode-Suche:', err);
      state.formStep = 3;
      this.renderForm();
      this.toast('Fehler bei der Suche. Bitte manuell ausfullen.', 'error');
    }
  },

  // ============================================================
  // COVER
  // ============================================================
  handleCoverUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      this.toast('Bild zu gross (max. 3 MB)', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      document.getElementById('cover-data').value = dataUrl;
      const img = document.getElementById('cover-img');
      img.src = dataUrl;
      img.style.display = 'block';
      document.getElementById('cover-placeholder').style.display = 'none';
    };
    reader.readAsDataURL(file);
  },

  openCoverUrlDialog() {
    const url = prompt('Cover-URL eingeben:');
    if (!url || !url.trim()) return;
    document.getElementById('cover-data').value = url.trim();
    const img = document.getElementById('cover-img');
    img.src = url.trim();
    img.style.display = 'block';
    img.onerror = () => {
      img.style.display = 'none';
      document.getElementById('cover-placeholder').style.display = '';
      this.toast('Bild konnte nicht geladen werden', 'error');
    };
    document.getElementById('cover-placeholder').style.display = 'none';
  },

  // ============================================================
  // RATING
  // ============================================================
  _updateRatingUI(rating) {
    document.querySelectorAll('.rating-star').forEach(btn => {
      const val = parseInt(btn.dataset.val);
      btn.classList.toggle('active', val <= rating);
    });
    document.getElementById('f-bewertung').value = rating;
  },

  // ============================================================
  // FILTER & SORT
  // ============================================================
  openFilterGenre() {
    const kat    = state.kategorie;
    const genres = GENRES[kat] || [];
    const current = state.filters.genre;
    const options = ['', ...genres];
    const chosen  = prompt(
      'Genre filtern:\n' + options.map((g, i) => `${i}: ${g || 'Alle'}`).join('\n') +
      '\n\nNummer eingeben:',
      options.indexOf(current) >= 0 ? options.indexOf(current) : 0
    );
    if (chosen === null) return;
    const idx = parseInt(chosen);
    if (!isNaN(idx) && idx >= 0 && idx < options.length) {
      state.filters.genre = options[idx];
      document.getElementById('filter-genre-btn').classList.toggle('active', !!options[idx]);
      this.renderKategorie();
    }
  },

  openFilterFSK() {
    const options = ['', 'FSK 0', 'FSK 6', 'FSK 12', 'FSK 16', 'FSK 18'];
    const current = state.filters.fsk;
    const chosen  = prompt(
      'FSK filtern:\n' + options.map((f, i) => `${i}: ${f || 'Alle'}`).join('\n'),
      options.indexOf(current) >= 0 ? options.indexOf(current) : 0
    );
    if (chosen === null) return;
    const idx = parseInt(chosen);
    if (!isNaN(idx) && idx >= 0 && idx < options.length) {
      state.filters.fsk = options[idx];
      document.getElementById('filter-fsk-btn').classList.toggle('active', !!options[idx]);
      this.renderKategorie();
    }
  },

  toggleFilterBewertet() {
    state.filters.bewertet = !state.filters.bewertet;
    document.getElementById('filter-bewertet-btn').classList.toggle('active', state.filters.bewertet);
    this.renderKategorie();
  },

  toggleFilterVerliehen() {
    state.filters.verliehen = !state.filters.verliehen;
    document.getElementById('filter-verliehen-btn').classList.toggle('active', state.filters.verliehen);
    this.renderKategorie();
  },

  setSort(val) {
    state.sort = val;
    this.renderKategorie();
  },

  toggleWunschliste() {
    state.wunschliste = !state.wunschliste;
    const toggle = document.getElementById('f-wunschliste-toggle');
    toggle.classList.toggle('on', state.wunschliste);
    toggle.setAttribute('aria-checked', state.wunschliste.toString());
    document.getElementById('f-wunschliste').value = state.wunschliste ? 'true' : 'false';
  },

  // ============================================================
  // TOAST
  // ============================================================
  toast(msg, type = 'info') {
    const icons = {
      success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>',
      error:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
      warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
      info:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'
    };
    const el  = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `${icons[type] || ''}<span>${_esc(msg)}</span>`;
    document.getElementById('toast-container').appendChild(el);
    setTimeout(() => el.remove(), 2900);
  },

  // ============================================================
  // THEME
  // ============================================================
  toggleTheme() {
    const cur  = document.documentElement.getAttribute('data-theme') === 'dark';
    const next = cur ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    document.getElementById('theme-toggle').classList.toggle('on', next === 'dark');
    DB.setSetting('theme', next);
  },

  // ============================================================
  // FIREBASE INIT
  // ============================================================
  _initFirebase() {
    const banner = document.getElementById('firebase-banner');
    FirebaseSync.init((status) => {
      const dot = document.getElementById('sync-status');
      dot.className = '';
      if (status.status === 'not_configured') {
        banner.classList.remove('hidden');
        dot.className = '';
      } else if (status.status === 'connected') {
        banner.classList.add('hidden');
        dot.className = 'connected';
        FirebaseSync.startRealtimeSync((type) => {
          if (state.view === 'kategorie') this.renderKategorie();
          if (state.view === 'dashboard') this.renderDashboard();
        });
        FirebaseSync.syncToCloud();
      } else if (status.status === 'syncing') {
        dot.className = 'syncing';
      } else if (status.status === 'error') {
        dot.className = 'error';
        console.warn('[Firebase]', status.msg);
      } else if (status.status === 'initializing') {
        dot.className = 'syncing';
      }
    }).catch(err => console.warn('[Firebase] Init catch:', err));
  },

  // ============================================================
  // EVENT LISTENERS
  // ============================================================
  _setupEvents() {
    // Back-Button
    document.getElementById('back-btn').addEventListener('click', () => this.goBack());

    // Tabs
    document.getElementById('tab-sammlung').addEventListener('click', () => {
      state.tab = 'sammlung';
      this.renderKategorie();
    });
    document.getElementById('tab-wunschliste').addEventListener('click', () => {
      state.tab = 'wunschliste';
      this.renderKategorie();
    });

    // Suche
    const searchInput = document.getElementById('search-input');
    let searchTimer;
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => this.handleSearch(searchInput.value.trim()), 250);
    });

    // Rating Stars
    document.getElementById('rating-input').addEventListener('click', (e) => {
      const btn = e.target.closest('.rating-star');
      if (!btn) return;
      const val = parseInt(btn.dataset.val);
      state.rating = (state.rating === val) ? 0 : val;
      this._updateRatingUI(state.rating);
    });

    // Confirm Dialog
    document.getElementById('confirm-ok').addEventListener('click', () => {
      document.getElementById('confirm-overlay').classList.add('hidden');
      if (state.confirmCb) { state.confirmCb(); state.confirmCb = null; }
    });
    document.getElementById('confirm-cancel').addEventListener('click', () => {
      document.getElementById('confirm-overlay').classList.add('hidden');
      state.confirmCb = null;
    });
    document.getElementById('confirm-overlay').addEventListener('click', (e) => {
      if (e.target === document.getElementById('confirm-overlay')) {
        document.getElementById('confirm-overlay').classList.add('hidden');
        state.confirmCb = null;
      }
    });

    // iOS: Prevent double-tap zoom on buttons
    document.addEventListener('touchend', (e) => {
      if (e.target.closest('button, a, .stat-card, .item-card, .recent-item')) {
        e.preventDefault();
      }
    }, { passive: false });

    // iOS: Prevent overscroll
    document.getElementById('main-content').addEventListener('touchmove', (e) => {
      // Allow scrolling inside content
    }, { passive: true });

    // Keyboard: hide scanner on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (!document.getElementById('scanner-modal').classList.contains('hidden')) {
          this.closeScanner();
        }
        if (!document.getElementById('confirm-overlay').classList.contains('hidden')) {
          document.getElementById('confirm-overlay').classList.add('hidden');
          state.confirmCb = null;
        }
      }
    });
  }
};

// ============================================================
// UTILITY FUNCTIONS
// ============================================================
function _esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function _renderStars(rating, size = 'small') {
  let html = '';
  for (let i = 1; i <= 5; i++) {
    html += i <= rating ? STAR_FULL : STAR_EMPTY;
  }
  return html;
}

function _daysSince(ts) {
  if (!ts) return 0;
  return Math.floor((Date.now() - ts) / 86400000);
}

function _infoRow(label, value) {
  if (!value) return '';
  return `
    <div class="detail-info-row">
      <div class="detail-info-label">${label}</div>
      <div class="detail-info-value">${_esc(String(value))}</div>
    </div>`;
}

// ============================================================
// ENTRY POINT
// ============================================================
document.addEventListener('DOMContentLoaded', () => App.init());