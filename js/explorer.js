document.addEventListener('DOMContentLoaded', () => {
  const { RESOURCES, el, showStatus, card, renderFields, getList, getDetail, search, findByNames, mapItem } = DW;
  const grid = document.getElementById('results');
  const status = document.getElementById('status');
  const more = document.getElementById('more');
  const form = document.getElementById('search-form');
  const input = document.getElementById('q');
  const tabs = document.getElementById('tabs');     
  const dialog = document.getElementById('detail'); 

  const FAMOUS = [
    'Tyrannosaurus rex', 'Triceratops', 'Velociraptor', 'Stegosaurus', 'Spinosaurus', 'Brachiosaurus',
    'Diplodocus', 'Allosaurus', 'Ankylosaurus', 'Giganotosaurus', 'Carnotaurus', 'Parasaurolophus',
    'Pachycephalosaurus', 'Iguanodon', 'Apatosaurus', 'Dilophosaurus', 'Compsognathus', 'Gallimimus',
    'Utahraptor', 'Deinonychus', 'Argentinosaurus', 'Baryonyx', 'Therizinosaurus', 'Microraptor',
  ];

  let res = RESOURCES[0];
  let next = null;
  let token = 0;
  const shown = new Set();

  const resFor = (raw) => (raw._type
    ? RESOURCES.find((r) => r.key === raw._type || r.path.replace(/\/$/, '') === raw._type) ?? null
    : res);

  function openDetail(r, raw) {
    const body = dialog.querySelector('.detail__body');
    const draw = (d) => body.replaceChildren(el('h2', { text: mapItem(d).title }), ...renderFields(d));
    draw(raw);
    if (!dialog.open) dialog.showModal();
    if (r && !r.noDetail) getDetail(r, raw).then((d) => { if (dialog.open) draw({ ...raw, ...d }); }).catch(() => {});
  }

  function addCards(items, ranked = false) {
    let n = 0;
    for (const raw of items) {
      const m = mapItem(raw);
      if (shown.has(m.key)) continue;
      shown.add(m.key);
      const opts = dialog
        ? { onOpen: () => openDetail(resFor(raw), raw) }
        : { href: `dino.html?slug=${encodeURIComponent(raw.slug ?? raw.id)}` };
      if (ranked) opts.rank = ++n;
      if (!tabs || resFor(raw)?.key === 'dinosaurs') opts.photo = m.title;
      grid.append(card(m, opts));
    }
  }

  async function loadMore(t) {
    more.disabled = true;
    if (!grid.children.length) showStatus(status, 'Cargando…', 'loading');
    try {
      const { items, next: n } = await getList(next);
      if (t !== token) return;
      addCards(items);
      next = n;
      more.hidden = !next;
      if (grid.children.length) status.replaceChildren(); else showStatus(status, 'No hay elementos para mostrar.');
    } catch (err) { if (t === token) showStatus(status, err.message, 'error'); }
    finally { more.disabled = false; }
  }

  async function selectResource(r) {
    res = r; const t = ++token;
    next = r.path; shown.clear(); grid.replaceChildren(); more.hidden = true;
    if (tabs) [...tabs.children].forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.key === r.key)));
    if (r.key !== 'dinosaurs') return loadMore(t);
    showStatus(status, 'Cargando los dinosaurios más conocidos…', 'loading');
    try {
      const famous = await findByNames(FAMOUS);
      if (t !== token) return;
      addCards(famous, true);
      if (!famous.length) return loadMore(t);
      showStatus(status, 'Pulsa “Cargar más” para ver todo el catálogo.');
      more.hidden = false;
    } catch (err) { if (t === token) showStatus(status, err.message, 'error'); }
  }

  async function runSearch(q) {
    const t = ++token;
    more.hidden = true; shown.clear(); grid.replaceChildren();
    showStatus(status, `Buscando “${q}”…`, 'loading');
    try {
      let items = await search(q);
      if (t !== token) return;
      if (!tabs) items = items.filter((d) => !d._type || /dino/i.test(d._type));
      addCards(items);
      status.replaceChildren();
      if (!grid.children.length) showStatus(status, `Sin resultados para “${q}”. Prueba con “raptor” o “saurus”.`);
    } catch (err) { if (t === token) showStatus(status, err.message, 'error'); }
  }

  if (tabs) {
    RESOURCES.forEach((r) => {
      const b = el('button', { class: 'tab', type: 'button', 'data-key': r.key, 'aria-pressed': 'false', text: r.label });
      b.addEventListener('click', () => { input.value = ''; selectResource(r); });
      tabs.append(b);
    });
  }
  if (dialog) {
    dialog.querySelector('.detail__close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
  }
  form.addEventListener('submit', (e) => { e.preventDefault(); const q = input.value.trim(); if (q) runSearch(q); else selectResource(res); });
  more.addEventListener('click', () => loadMore(token));
  selectResource(RESOURCES[0]);

  const statTotal = document.getElementById('stat-total');
  if (statTotal) {
    Promise.all([getList('dinosaurs/'), getList('periods/')]).then(([d, p]) => {
      if (d.total) statTotal.textContent = d.total.toLocaleString('es');
      const n = p.total ?? p.items.length;
      if (n) document.getElementById('stat-periods').textContent = n;
    }).catch(() => {});
  }
});
