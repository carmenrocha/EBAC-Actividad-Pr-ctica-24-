(function () {
  const spots = [...document.querySelectorAll('.hotspot')];
  const setOpen = (s, open) => { s.classList.toggle('is-open', open); s.querySelector('.hotspot__btn').setAttribute('aria-expanded', String(open)); };
  const closeAll = (except) => spots.forEach((s) => s !== except && setOpen(s, false));
  spots.forEach((s) => s.querySelector('.hotspot__btn').addEventListener('click', (e) => {
    e.stopPropagation();
    const open = !s.classList.contains('is-open');
    closeAll(s); setOpen(s, open);
  }));
  document.addEventListener('click', (e) => { if (!e.target.closest('.hotspot')) closeAll(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAll(); });

  if (location.hash === '#calibrar') {
    const media = document.querySelector('.hero__media');
    const out = Object.assign(document.createElement('pre'), { className: 'calib' });
    document.body.append(out);
    const report = () => {
      out.textContent = spots.map((s, i) => `.hotspot--${i + 1} { top: ${s.style.top || getComputedStyle(s).top}; left: ${s.style.left || getComputedStyle(s).left}; }`).join('\n');
    };
    spots.forEach((s) => {
      s.style.touchAction = 'none'; s.style.cursor = 'grab';
      s.addEventListener('pointerdown', (e) => {
        e.preventDefault(); s.setPointerCapture(e.pointerId);
        const move = (ev) => {
          const r = media.getBoundingClientRect();
          s.style.left = `${Math.min(100, Math.max(0, ((ev.clientX - r.left) / r.width) * 100)).toFixed(1)}%`;
          s.style.top = `${Math.min(100, Math.max(0, ((ev.clientY - r.top) / r.height) * 100)).toFixed(1)}%`;
          report();
        };
        const up = () => { s.removeEventListener('pointermove', move); s.removeEventListener('pointerup', up); };
        s.addEventListener('pointermove', move); s.addEventListener('pointerup', up);
      });
    });
    report();
  }
})();
