/* Navegación compartida de las presentaciones: deslizar, flechas, teclado, puntos y pantalla completa */
(function () {
  // Navegación: deslizar, flechas, teclado y puntos
  const deck = document.getElementById('deck');
  const slides = [...deck.children];
  const dots = document.getElementById('dots');
  dots.innerHTML = slides.map((_, i) => `<button aria-label="Ir a la diapositiva ${i + 1}"></button>`).join('');
  const go = i => deck.scrollTo({ left: Math.max(0, Math.min(slides.length - 1, i)) * deck.clientWidth });
  const idx = () => Math.round(deck.scrollLeft / deck.clientWidth);
  const update = () => {
    const i = idx();
    [...dots.children].forEach((d, j) => d.classList.toggle('on', i === j));
    document.getElementById('count').textContent = `${i + 1} / ${slides.length}`;
    document.getElementById('prev').disabled = i === 0;
    document.getElementById('next').disabled = i === slides.length - 1;
  };
  [...dots.children].forEach((d, i) => d.addEventListener('click', () => go(i)));
  document.getElementById('prev').addEventListener('click', () => go(idx() - 1));
  document.getElementById('next').addEventListener('click', () => go(idx() + 1));
  document.addEventListener('keydown', e => {
    if (['ArrowRight', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); go(idx() + 1); }
    if (['ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); go(idx() - 1); }
  });
  deck.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
  window.addEventListener('resize', () => go(idx()));
  update();

  const fs = document.getElementById('fs');
  const el = document.documentElement;
  const req = el.requestFullscreen || el.webkitRequestFullscreen;
  if (!req) fs.style.display = 'none';
  fs.addEventListener('click', () => {
    if (document.fullscreenElement || document.webkitFullscreenElement) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    else req.call(el);
  });
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('../sw.js', { updateViaCache: 'none' }).catch(() => {});
})();

/* Modo captura (?shot=N): muestra solo la diapositiva N, sin controles, para exportar imágenes */
(function () {
  const n = new URLSearchParams(location.search).get('shot');
  if (n === null) return;
  document.querySelectorAll('.controls, .fs, .count').forEach(e => { e.style.display = 'none'; });
  const deck = document.getElementById('deck');
  deck.style.scrollBehavior = 'auto';
  const go = () => { deck.scrollLeft = (+n) * deck.clientWidth; };
  go(); window.addEventListener('load', go);
})();
