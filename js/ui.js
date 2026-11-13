(function () {
  const el = (tag, props = {}, ...children) => {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (k === 'class') node.className = v;
      else if (k === 'text') node.textContent = v;
      else node.setAttribute(k, v);
    }
    node.append(...children.filter(Boolean));
    return node;
  };
  DW.el = el;

  DW.showStatus = (container, message, type = 'info') => {
    const box = el('p', { class: `status${type === 'error' ? ' status--error' : ''}`, role: type === 'error' ? 'alert' : 'status' });
    if (type === 'loading') box.append(el('span', { class: 'loader', 'aria-hidden': 'true' }));
    box.append(message);
    container.replaceChildren(box);
  };


  DW.card = (m, opts = {}) => {
    let img = null;
    if (m.image) { img = el('img', { class: 'card__img', src: m.image, alt: '', loading: 'lazy' }); img.addEventListener('error', () => img.remove()); }
    const action = opts.href
      ? el('a', { class: 'btn btn--ghost', href: opts.href, text: 'Ver ficha' })
      : el('button', { class: 'btn btn--ghost', type: 'button', text: 'Ver más' });
    if (!opts.href && opts.onOpen) action.addEventListener('click', opts.onOpen);
    const article = el('article', { class: 'card' },
      img,
      opts.rank ? el('span', { class: 'card__rank', text: `#${opts.rank}`, title: 'Posición entre los más conocidos' }) : null,
      el('h3', { text: m.title }),
      ...m.tags.map((t) => el('span', { class: 'tag', text: t })),
      m.summary ? el('p', { text: m.summary.slice(0, 130) + (m.summary.length > 130 ? '…' : '') }) : null,
      action,
    );

    if (opts.photo && !m.image) {
      DW.wikiImage(opts.photo).then((src) => {
        if (!src || article.querySelector('.card__img')) return;
        const pic = el('img', { class: 'card__img', src, alt: `Foto de ${m.title}`, loading: 'lazy' });
        pic.addEventListener('error', () => pic.remove());
        article.prepend(pic);
      });
    }
    return el('li', {}, article);
  };

  const pretty = (k) => k.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());
  const text = (v) => (v && typeof v === 'object' ? v.name ?? v.title ?? v.term ?? JSON.stringify(v) : String(v));
  DW.renderFields = (d) => {
    const descKey = ['description', 'summary', 'definition', 'answer', 'content', 'excerpt'].find((k) => typeof d[k] === 'string' && d[k]);
    const skip = new Set(['name', 'title', 'term', 'question', 'slug', 'id', 'url', 'image', 'image_url', 'thumbnail', 'photo', '_type', descKey]);
    const dl = el('dl', { class: 'dl' });
    for (const [k, v] of Object.entries(d)) {
      if (skip.has(k) || v === null || v === '' || (Array.isArray(v) && !v.length)) continue;
      const value = Array.isArray(v) ? v.map(text).join(', ') : text(v);
      if (value.length > 200) continue;
      dl.append(el('dt', { text: pretty(k) }), el('dd', { text: value }));
    }
    return [descKey ? el('p', { class: 'lead', text: d[descKey] }) : null, dl.children.length ? el('section', { class: 'panel' }, dl) : null];
  };
})();
