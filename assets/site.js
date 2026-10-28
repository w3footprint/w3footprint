(function () {
  'use strict';
  var d = document, w = window;
  var reduce = w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = w.matchMedia && w.matchMedia('(hover: hover) and (pointer: fine)').matches;
  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); }

  /* scroll progress, nav, back to top */
  var bar = $('#progress'), nav = $('#nav'), top = $('#totop');
  function onScroll() {
    var y = w.scrollY, h = d.documentElement.scrollHeight - w.innerHeight;
    if (bar) bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, y / h) : 0) + ')';
    if (nav) nav.classList.toggle('solid', y > 40 && !d.body.classList.contains('menu-open'));
    if (top) top.classList.toggle('show', y > 700);
    fillStatement();
  }
  if (top) top.addEventListener('click', function () { w.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); });

  /* mobile drawer */
  var burger = $('.burger');
  if (burger) burger.addEventListener('click', function () {
    var open = d.body.classList.toggle('menu-open');
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    onScroll();
  });
  $$('.drawer a').forEach(function (a) { a.addEventListener('click', function () { d.body.classList.remove('menu-open'); }); });
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape') d.body.classList.remove('menu-open'); });

  /* reveal on scroll, with stagger inside grids */
  $$('.grid, .work, .steps, .rows, .tags').forEach(function (g) {
    $$(':scope > .reveal, :scope > li, :scope > .tile, :scope > .card, :scope > .case', g).forEach(function (c, i) { c.classList.add('reveal'); c.style.setProperty('--d', (i * 0.08) + 's'); });
  });
  var rev = $$('.reveal');
  if (!('IntersectionObserver' in w) || reduce) { rev.forEach(function (e) { e.classList.add('in'); }); }
  else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -4% 0px' });
    rev.forEach(function (e) { io.observe(e); });
  }

  /* count-up numbers */
  $$('[data-count]').forEach(function (el) {
    var end = parseFloat(el.getAttribute('data-count')), suffix = el.getAttribute('data-suffix') || '', done = false;
    function run() {
      if (done) return; done = true;
      if (reduce) { el.textContent = end + suffix; return; }
      var t0 = null, dur = 1400;
      function step(t) { if (!t0) t0 = t; var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 4); el.textContent = Math.round(end * e) + suffix; if (p < 1) requestAnimationFrame(step); }
      requestAnimationFrame(step);
    }
    el.textContent = '0' + suffix;
    if (!('IntersectionObserver' in w)) { run(); return; }
    new IntersectionObserver(function (es, o) { es.forEach(function (en) { if (en.isIntersecting) { run(); o.disconnect(); } }); }, { threshold: 0.6 }).observe(el);
  });

  /* statement fills word by word as you scroll */
  var st = $('.statement[data-fill]'), words = [];
  if (st) {
    (function wrap(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = d.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(d.createTextNode(p)); return; }
            var s = d.createElement('span'); s.className = 'w' + (node.classList && node.classList.contains('g') ? ' g' : ''); s.textContent = p; frag.appendChild(s); words.push(s);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1) wrap(n);
      });
    })(st);
    if (reduce) st.classList.add('static');
  }
  function fillStatement() {
    if (!st || reduce || !words.length) return;
    var r = st.getBoundingClientRect(), vh = w.innerHeight;
    var p = (vh * 0.85 - r.top) / (r.height + vh * 0.25);
    p = Math.max(0, Math.min(1, p));
    var n = Math.round(p * words.length);
    for (var i = 0; i < words.length; i++) words[i].classList.toggle('on', i < n);
  }

  /* problem rows drive the sticky panel (one block per .prob) */
  $$('.prob').forEach(function (blk) {
    var rows = $$('.rows .row', blk), scenes = $$('.panel .scene', blk);
    function setActive(i) { rows.forEach(function (r, k) { r.classList.toggle('active', k === i); }); scenes.forEach(function (s, k) { s.classList.toggle('on', k === i); }); }
    setActive(0);
    if (!('IntersectionObserver' in w)) { rows.forEach(function (r) { r.classList.add('active'); }); return; }
    var rio = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) setActive(rows.indexOf(en.target)); });
    }, { rootMargin: '-40% 0px -45% 0px' });
    rows.forEach(function (r) { rio.observe(r); });
  });

  /* hero: rotating headline words, background scene and progress bars stay in sync */
  var rot = $('#hero[data-rotate]');
  if (rot) {
    var verbs = $$('.rot-verb .rw', rot), objs = $$('.rot-obj .rw', rot), scn = $$('.hero-scene', rot), bars = $$('.hbars i', rot), cur = 0, timer;
    function show(n) {
      [verbs, objs, scn, bars].forEach(function (list) { list.forEach(function (el, k) { el.classList.toggle('off', k === cur && k !== n); el.classList.toggle('on', k === n); }); });
      var prev = cur; cur = n;
      setTimeout(function () { [verbs, objs, scn].forEach(function (list) { if (list[prev] && prev !== cur) list[prev].classList.remove('off'); }); }, 800);
    }
    function loop() { clearInterval(timer); if (reduce) return; timer = setInterval(function () { show((cur + 1) % verbs.length); }, 4200); }
    bars.forEach(function (b, k) { b.addEventListener('click', function () { show(k); loop(); }); });
    show(0); loop();
  }

  /* pinned horizontal rail (desktop): vertical scroll moves the cards sideways */
  var rail = $('.rail-sect[data-rail]');
  if (rail) {
    var pin = $('.rail-pin', rail), track = $('.scroller', rail), on = false;
    function measure() {
      var want = w.innerWidth > 960 && !reduce;
      if (want !== on) { on = want; rail.classList.toggle('pinned', on); if (!on) { rail.style.height = ''; track.style.transform = ''; } }
      if (on) { var dist = Math.max(0, track.scrollWidth - w.innerWidth + 64); rail.style.height = (w.innerHeight + dist) + 'px'; rail._dist = dist; }
    }
    function move() {
      if (!on) return;
      var r = rail.getBoundingClientRect(), p = Math.max(0, Math.min(1, -r.top / (rail._dist || 1)));
      track.style.transform = 'translateX(' + (-p * rail._dist) + 'px)';
    }
    measure(); move();
    w.addEventListener('resize', function () { measure(); move(); });
    w.addEventListener('scroll', move, { passive: true });
    w.addEventListener('load', function () { measure(); move(); });
  }

  /* technology filter chips */
  $$('[data-filters]').forEach(function (bar) {
    var scope = bar.parentNode;
    $$('button', bar).forEach(function (b) {
      b.addEventListener('click', function () {
        $$('button', bar).forEach(function (o) { o.classList.toggle('on', o === b); });
        var f = b.getAttribute('data-f');
        $$('[data-cat]', scope).forEach(function (t) { var hit = f === 'all' || t.getAttribute('data-cat') === f; t.style.display = hit ? '' : 'none'; if (hit) t.classList.add('in'); });
      });
    });
  });

  /* hero: light follows the cursor, curves drift */
  var hero = $('#hero') || $('.page-hero');
  if (hero && fine && !reduce) {
    var curves = $('.curves', hero);
    hero.addEventListener('mousemove', function (e) {
      var r = hero.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      hero.style.setProperty('--mx', (x * 100) + '%'); hero.style.setProperty('--my', (y * 100) + '%');
      if (curves) curves.style.transform = 'translate(' + ((x - .5) * -28) + 'px,' + ((y - .5) * -20) + 'px)';
    });
    hero.addEventListener('mouseleave', function () { if (curves) curves.style.transform = ''; });
  }

  /* cards: spotlight follows the cursor */
  if (fine) {
    $$('.card, .svc, .case, .tile').forEach(function (c) {
      c.addEventListener('mousemove', function (e) {
        var r = c.getBoundingClientRect();
        c.style.setProperty('--cx', (e.clientX - r.left) + 'px'); c.style.setProperty('--cy', (e.clientY - r.top) + 'px');
      });
    });
  }

  /* magnetic pills */
  if (fine && !reduce) {
    $$('.pill.lg, nav .pill, .cta .pill').forEach(function (b) {
      b.addEventListener('mousemove', function (e) {
        var r = b.getBoundingClientRect();
        b.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * .18) + 'px,' + ((e.clientY - r.top - r.height / 2) * .28 - 2) + 'px)';
      });
      b.addEventListener('mouseleave', function () { b.style.transform = ''; });
    });
  }

  /* horizontal scroller: drag, arrows */
  $$('.scroller').forEach(function (sc) {
    var down = false, sx = 0, sl = 0, moved = 0;
    sc.addEventListener('mousedown', function (e) { down = true; moved = 0; sx = e.pageX; sl = sc.scrollLeft; sc.classList.add('drag'); });
    w.addEventListener('mouseup', function () { down = false; sc.classList.remove('drag'); });
    sc.addEventListener('mousemove', function (e) { if (!down) return; moved = e.pageX - sx; sc.scrollLeft = sl - moved; });
    sc.addEventListener('click', function (e) { if (Math.abs(moved) > 6) { e.preventDefault(); e.stopPropagation(); } }, true);
    var wrap = sc.parentNode;
    $$('[data-dir]', wrap).forEach(function (b) {
      b.addEventListener('click', function () { sc.scrollBy({ left: parseInt(b.getAttribute('data-dir'), 10) * 424, behavior: 'smooth' }); });
    });
  });

  /* FAQ: one open at a time */
  $$('.faq details').forEach(function (dt) {
    dt.addEventListener('toggle', function () { if (dt.open) $$('.faq details').forEach(function (o) { if (o !== dt) o.open = false; }); });
  });

  w.addEventListener('scroll', onScroll, { passive: true });
  w.addEventListener('resize', onScroll);
  onScroll();
})();
