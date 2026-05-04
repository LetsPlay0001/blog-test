(function () {
  if (typeof window === 'undefined') return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  function getTarget() {
    return document.querySelector('main') || document.body;
  }

  function trigger() {
    var el = getTarget();
    if (!el) return;
    el.classList.remove('tirana-page-enter');
    // Force reflow so the animation restarts when re-applied.
    void el.offsetWidth;
    el.classList.add('tirana-page-enter');
  }

  // Patch history methods so SPA navigations (Next.js client-side routing)
  // also fire a 'locationchange' event we can hook into.
  ['pushState', 'replaceState'].forEach(function (method) {
    var original = history[method];
    history[method] = function () {
      var result = original.apply(this, arguments);
      window.dispatchEvent(new Event('locationchange'));
      return result;
    };
  });
  window.addEventListener('popstate', function () {
    window.dispatchEvent(new Event('locationchange'));
  });
  window.addEventListener('locationchange', function () {
    // Wait one frame for Next.js to swap in the new page content.
    requestAnimationFrame(function () {
      requestAnimationFrame(trigger);
    });
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', trigger);
  } else {
    trigger();
  }
})();
