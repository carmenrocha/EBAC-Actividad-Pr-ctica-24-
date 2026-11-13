document.addEventListener('DOMContentLoaded', () => {
  const { el, showStatus, card, findByNames, mapItem, getList } = DW;

  const ERAS = {
    triassic:   ['Coelophysis', 'Plateosaurus', 'Eoraptor', 'Herrerasaurus', 'Saturnalia', 'Liliensternus'],
    jurassic:   ['Diplodocus', 'Allosaurus', 'Stegosaurus', 'Brachiosaurus', 'Apatosaurus', 'Ceratosaurus'],
    cretaceous: ['Tyrannosaurus rex', 'Triceratops', 'Velociraptor', 'Spinosaurus', 'Ankylosaurus', 'Iguanodon'],
  };

  document.querySelectorAll('[data-era]').forEach(async (section) => {
    const status = section.querySelector('.era__status');
    const grid = section.querySelector('.grid');
    showStatus(status, 'Cargando especies…', 'loading');
    try {
      const dinos = await findByNames(ERAS[section.dataset.era]);
      grid.replaceChildren(...dinos.map((d) => card(mapItem(d), { photo: mapItem(d).title, href: `dino.html?slug=${encodeURIComponent(d.slug ?? d.id)}` })));
      if (dinos.length) status.replaceChildren(); else showStatus(status, 'No encontramos especies de esta época.');
    } catch (err) { showStatus(status, err.message, 'error'); }
  });

  const list = document.getElementById('periods');
  showStatus(list, 'Cargando períodos…', 'loading');
  getList('periods/').then(({ items }) => {
    list.replaceChildren(el('ul', { class: 'grid' }, ...items.map((p) => el('li', {}, card(mapItem(p), {}).firstChild))));
  }).catch((err) => showStatus(list, err.message, 'error'));
});
