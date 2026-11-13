window.DW = window.DW || {};
(function () {
  const http = axios.create({ baseURL: 'https://dinofyi.com/api/v1/', timeout: 15000, headers: { Accept: 'application/json' } });

  DW.RESOURCES = [
    { key: 'dinosaurs', label: 'Dinosaurios', path: 'dinosaurs/' },
    { key: 'periods', label: 'Períodos', path: 'periods/' },
    { key: 'classifications', label: 'Clasificaciones', path: 'classifications/' },
    { key: 'countries', label: 'Países', path: 'countries/' },
    { key: 'sites', label: 'Sitios', path: 'sites/' },
    { key: 'comparisons', label: 'Comparaciones', path: 'comparisons/', noDetail: true },
    { key: 'glossary', label: 'Glosario', path: 'glossary/' },
    { key: 'glossary-categories', label: 'Categorías del glosario', path: 'glossary-categories/', noDetail: true },
    { key: 'guides', label: 'Guías', path: 'guides/' },
    { key: 'guide-series', label: 'Series de guías', path: 'guide-series/', noDetail: true },
    { key: 'faqs', label: 'Preguntas frecuentes', path: 'faqs/', noDetail: true },
  ];

  function friendlyError(err) {
    if (err.code === 'ECONNABORTED') return 'La API tardó demasiado en responder. Inténtalo de nuevo.';
    if (err.response) return err.response.status === 404 ? 'No encontramos ese recurso.' : `La API respondió con un error (${err.response.status}).`;
    return 'No se pudo conectar con la API (red o CORS). Abre la consola (F12) para ver el detalle.';
  }
  async function get(path, params) {
    try { return (await http.get(path, { params })).data; }
    catch (err) { console.error('[API]', path, err); const e = new Error(friendlyError(err)); e.status = err.response?.status; throw e; }
  }

  function flatten(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.results)) return data.results;
    if (Array.isArray(data?.items)) return data.items;
    const out = [];
    for (const [k, v] of Object.entries(data || {})) if (Array.isArray(v)) out.push(...v.map((x) => ({ ...x, _type: x._type ?? k })));
    return out;
  }

  DW.getList = async (pathOrUrl) => {
    const data = await get(String(pathOrUrl).replace(/^http:/, 'https:'));
    return { items: flatten(data), next: data?.next ? String(data.next).replace(/^http:/, 'https:') : null, total: data?.count ?? null };
  };

  DW.getDetail = async (res, item) => {
    const ids = [...new Set([item.slug, item.id].filter((v) => v !== undefined && v !== null && v !== ''))];
    let last = new Error('Sin identificador.');
    for (const id of ids) {
      try { return await get(`${res.path}${encodeURIComponent(id)}/`); }
      catch (e) { last = e; if (e.status !== 404) throw e; }
    }
    throw last;
  };
  DW.search = async (q) => flatten(await get('search/', { q }));

  const photoCache = new Map();
  DW.wikiImage = (name) => {
    const key = String(name).trim();
    if (!photoCache.has(key)) {
      photoCache.set(key, fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(key.replace(/ /g, '_'))}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((j) => (j && j.type !== 'disambiguation' ? j.thumbnail?.source ?? null : null))
        .catch(() => null));
    }
    return photoCache.get(key);
  };

  const label = (v) => (v && typeof v === 'object' ? v.name ?? v.title ?? v.term ?? '' : v ?? '');
  const firstString = (d) => Object.values(d).find((v) => typeof v === 'string' && v && !/^https?:/.test(v)) ?? '';
  const imgOf = (v) => (v && typeof v === 'object' ? v.url ?? v.src ?? '' : v ?? '');
  DW.mapItem = (d) => {
    const title = d.name ?? d.title ?? d.term ?? d.question ?? firstString(d) ?? 'Sin título';
    const tags = ['period', 'temporal_range', 'classification', 'clade', 'diet', 'country', 'category', 'series', 'type']
      .map((k) => String(label(d[k]))).filter(Boolean).slice(0, 2);
    return {
      key: d.slug ?? d.id ?? title,
      title: String(title),
      tags,
      summary: String(d.summary ?? d.description ?? d.definition ?? d.answer ?? d.excerpt ?? d.short_description ?? ''),
      image: imgOf(d.image ?? d.image_url ?? d.thumbnail ?? d.photo),
    };
  };

  const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  DW.findByNames = async (names) => {
    const settled = await Promise.allSettled(names.map((n) => DW.search(n)));
    if (settled.every((r) => r.status === 'rejected')) throw settled[0].reason;
    const seen = new Set(); const out = [];
    settled.forEach((r, i) => {
      if (r.status !== 'fulfilled') return;
      const list = r.value.filter((d) => !d._type || /dino/i.test(d._type));
      const t = norm(names[i]);
      const name = (d) => norm(d.name ?? d.title);
      const hit = list.find((d) => name(d) === t) ?? list.find((d) => name(d).startsWith(t)) ?? list.find((d) => name(d).includes(t));
      const key = hit && (hit.slug ?? hit.id);
      if (hit && !seen.has(key)) { seen.add(key); out.push(hit); }
    });
    return out;
  };
})();
