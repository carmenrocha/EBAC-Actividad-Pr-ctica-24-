document.addEventListener('DOMContentLoaded', async () => {
  const { el, showStatus, renderFields, getDetail, mapItem } = DW;
  const box = document.getElementById('ficha');
  const slug = new URLSearchParams(location.search).get('slug');
  if (!slug) return showStatus(box, 'Falta el dinosaurio. Elige uno desde el explorador.', 'error');
  showStatus(box, 'Cargando ficha…', 'loading');
  try {
    const d = await getDetail({ path: 'dinosaurs/' }, { slug, id: slug });
    const name = mapItem(d).title;
    document.title = `${name} · DinoWorld`;
    const photo = el('div', { class: 'ficha__photo' });
    DW.wikiImage(name).then((src) => { if (src) photo.append(el('img', { src, alt: `Foto de ${name}` })); });
    box.replaceChildren(
      el('h1', { text: name }),
      photo,
      ...renderFields(d),
      el('p', {}, el('a', { class: 'btn btn--ghost', href: 'explorer.html', text: 'Volver al explorador' })),
    );
  } catch (err) { showStatus(box, err.message, 'error'); }
});
