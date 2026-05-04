(function () {
  if (typeof window === 'undefined') return;

  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function getTarget() {
    return document.querySelector('main') || document.body;
  }

  /* ---------- Enter animation ---------- */
  function triggerEnter() {
    if (reduced) return;
    var el = getTarget();
    if (!el) return;
    el.classList.remove('tirana-page-exit', 'tirana-page-enter');
    void el.offsetWidth; // force reflow so the animation always restarts
    el.classList.add('tirana-page-enter');
  }

  /* ---------- Exit animation + navigation ---------- */
  var navigating = false;

  function navigateTo(url) {
    if (navigating) return;
    navigating = true;

    if (reduced) {
      window.location.href = url;
      return;
    }

    var el = getTarget();
    el.classList.remove('tirana-page-enter');
    el.classList.add('tirana-page-exit');

    setTimeout(function () {
      window.location.href = url;
    }, 260); // matches the exit animation duration
  }

  // Intercept all internal link clicks in capture phase so we run before
  // any other handler (including Next.js's router).
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented) return;
    // Modified clicks (Ctrl, Cmd, middle-button, etc.) open new tabs — leave them alone.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;

    var link = e.target.closest('a[href]');
    if (!link) return;

    var href = link.getAttribute('href');
    // Skip in-page anchors, external protocols, and explicit new-tab links.
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
    if (link.target && link.target !== '_self') return;

    var url;
    try { url = new URL(href, location.href); } catch (_) { return; }
    if (url.origin !== location.origin) return;
    // Same page (e.g. anchor scroll) — let the browser handle it.
    if (url.pathname === location.pathname && url.search === location.search && url.hash) return;

    e.preventDefault();
    navigateTo(url.href);
  }, true);

  /* ---------- SPA locationchange hook (for any programmatic pushState calls) ---------- */
  ['pushState', 'replaceState'].forEach(function (method) {
    var orig = history[method];
    history[method] = function () {
      var result = orig.apply(this, arguments);
      window.dispatchEvent(new Event('locationchange'));
      return result;
    };
  });
  window.addEventListener('popstate', function () {
    window.dispatchEvent(new Event('locationchange'));
  });
  window.addEventListener('locationchange', function () {
    requestAnimationFrame(function () {
      requestAnimationFrame(triggerEnter);
    });
  });

  /* ---------- Initial page load ---------- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', triggerEnter);
  } else {
    triggerEnter();
  }
})();
