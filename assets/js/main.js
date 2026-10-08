/* Huey · portfolio interactions (vanilla JS, no dependencies) */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduced = reduceMQ.matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------------- Theme toggle ---------------- */
  var themeBtn = $('#theme-toggle');
  function syncThemeLabel() {
    var t = root.getAttribute('data-theme');
    themeBtn.setAttribute('aria-label', t === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
  }
  syncThemeLabel();
  themeBtn.addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
    syncThemeLabel();
    document.dispatchEvent(new CustomEvent('themechange'));
  });

  /* ---------------- Nav: scrolled state, progress, burger ---------------- */
  var nav = $('#top-nav');
  var bar = $('.scroll-progress span');
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var y = window.scrollY;
      nav.classList.toggle('is-scrolled', y > 12);
      var h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, y / h) : 0) + ')';
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var burger = $('#nav-burger');
  var links = $('#nav-links');
  function setMenu(open) {
    links.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  burger.addEventListener('click', function () { setMenu(!links.classList.contains('is-open')); });
  links.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && links.classList.contains('is-open')) { setMenu(false); burger.focus(); }
  });
  document.addEventListener('click', function (e) {
    if (links.classList.contains('is-open') && !e.target.closest('#nav-links, #nav-burger')) setMenu(false);
  });

  /* ---------------- Active section highlighting ---------------- */
  var navLinks = $$('#nav-links a');
  var sectionIds = navLinks.map(function (a) { return a.getAttribute('href').slice(1); });
  function updateActive() {
    var mid = window.innerHeight * 0.35;
    var current = null;
    sectionIds.forEach(function (id) {
      var el = document.getElementById(id);
      if (el && el.getBoundingClientRect().top <= mid) current = id;
    });
    if ((window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 4) current = sectionIds[sectionIds.length - 1];
    navLinks.forEach(function (a) {
      var on = a.getAttribute('href') === '#' + current;
      a.classList.toggle('is-active', on);
      if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
  }
  window.addEventListener('scroll', function () { requestAnimationFrame(updateActive); }, { passive: true });
  updateActive();

  /* ---------------- Code card output typing ---------------- */
  var out = $('#code-out');
  if (out && !reduced) {
    var full = out.textContent;
    out.textContent = '';
    out.classList.add('is-typing');
    setTimeout(function () {
      var i = 0;
      (function step() {
        out.textContent = full.slice(0, ++i);
        if (i < full.length) setTimeout(step, 38);
        else setTimeout(function () { out.classList.remove('is-typing'); }, 1200);
      })();
    }, 1500);
  }

  /* ---------------- Counters ---------------- */
  function fmt(n) { return Math.round(n).toLocaleString('en-US'); }
  function runCounter(el) {
    var to = parseFloat(el.getAttribute('data-to'));
    if (reduced) { el.textContent = fmt(to); return; }
    var dur = 1600, t0 = null;
    function frame(t) {
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / dur);
      var eased = 1 - Math.pow(1 - p, 4);
      el.textContent = fmt(to * eased);
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* ---------------- Scroll reveal ---------------- */
  // Stagger siblings that reveal together
  $$('.proj-grid, .timeline').forEach(function (group) {
    $$(':scope > .reveal', group).forEach(function (el, i) { el.style.setProperty('--d', (i * 0.09) + 's'); });
  });
  var counters = $$('.count');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        $$('.count', en.target).forEach(function (c) { if (!c.dataset.done) { c.dataset.done = 1; runCounter(c); } });
        io.unobserve(en.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    $$('.reveal').forEach(function (el) { io.observe(el); });
  } else {
    $$('.reveal').forEach(function (el) { el.classList.add('is-in'); });
    counters.forEach(function (c) { c.textContent = fmt(+c.dataset.to); });
  }
  // Prime counters to 0 so they visibly count up (text stays correct without JS)
  if (!reduced) counters.forEach(function (c) { if (!c.dataset.done) c.textContent = '0'; });

  /* ---------------- Spotlight + tilt ---------------- */
  if (finePointer) {
    document.addEventListener('pointermove', function (e) {
      var el = e.target.closest && e.target.closest('.spotlight');
      if (!el) return;
      var r = el.getBoundingClientRect();
      el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      el.style.setProperty('--my', (e.clientY - r.top) + 'px');
    }, { passive: true });

    if (!reduced) {
      $$('.tilt').forEach(function (el) {
        var max = el.classList.contains('code-card') ? 8 : 4;
        el.addEventListener('pointermove', function (e) {
          var r = el.getBoundingClientRect();
          var x = (e.clientX - r.left) / r.width - 0.5;
          var y = (e.clientY - r.top) / r.height - 0.5;
          el.style.transform = 'perspective(1000px) rotateX(' + (-y * max) + 'deg) rotateY(' + (x * max) + 'deg) translateY(-4px)';
        });
        el.addEventListener('pointerleave', function () { el.style.transform = ''; });
      });
    }
  }

  /* ---------------- Modals ---------------- */
  var lastOpener = null;
  function openModal(id, opener) {
    var d = document.getElementById(id);
    if (!d) return;
    lastOpener = opener || document.activeElement;
    if (typeof d.showModal === 'function') d.showModal(); else d.setAttribute('open', '');
    root.style.setProperty('--sbw', (window.innerWidth - root.clientWidth) + 'px');
    root.classList.add('modal-open');
    var inner = $('.modal__inner', d); if (inner) inner.scrollTop = 0;
    var v = $('video', d);
    if (v && !reduced) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
    // Focus the scrollable body so wheel, arrow keys, PageUp/PageDown, Space and Home/End scroll it right away
    if (inner) inner.focus({ preventScroll: true });
  }
  function closeModal(d) {
    if (!d || !d.open) return;
    var v = $('video', d); if (v) v.pause();
    var finish = function () {
      d.classList.remove('is-closing');
      if (typeof d.close === 'function') d.close(); else d.removeAttribute('open');
      root.classList.remove('modal-open');
      if (lastOpener && lastOpener.focus) lastOpener.focus();
    };
    if (reduced) return finish();
    d.classList.add('is-closing');
    setTimeout(finish, 220);
  }
  document.addEventListener('click', function (e) {
    var opener = e.target.closest('[data-modal]');
    if (opener) { e.preventDefault(); openModal(opener.getAttribute('data-modal'), opener); return; }
    var closer = e.target.closest('[data-close]');
    if (closer) { closeModal(closer.closest('dialog')); }
  });
  $$('dialog.modal').forEach(function (d) {
    d.addEventListener('cancel', function (e) { e.preventDefault(); closeModal(d); });
    d.addEventListener('click', function (e) { if (e.target === d) closeModal(d); }); // backdrop
    d.addEventListener('close', function () { root.classList.remove('modal-open'); });
  });
  // Make whole project cards clickable (except inner links/buttons)
  $$('.proj, .featured').forEach(function (card) {
    var btn = $('[data-modal]', card);
    if (!btn) return;
    card.style.cursor = 'pointer';
    card.addEventListener('click', function (e) {
      if (e.target.closest('a, button')) return;
      if (window.getSelection && String(window.getSelection())) return;
      openModal(btn.getAttribute('data-modal'), btn);
    });
  });

  /* ---------------- Timeline filter ---------------- */
  var fbtns = $$('.filter__btn');
  fbtns.forEach(function (b) {
    b.addEventListener('click', function () {
      var f = b.getAttribute('data-filter');
      fbtns.forEach(function (x) { var on = x === b; x.classList.toggle('is-active', on); x.setAttribute('aria-pressed', String(on)); });
      $$('#timeline .tl').forEach(function (li) {
        var show = f === 'all' || li.getAttribute('data-kind') === f;
        li.classList.toggle('is-hidden', !show);
        if (show) li.classList.add('is-in');
      });
    });
  });

  /* ---------------- Skills -> evidence ---------------- */
  var S = {
    upf: { t: 'Ultra-Processed Food Scanner', modal: 'modal-upf' },
    thesis: { t: "Master's thesis · crypto topic modeling", modal: 'modal-thesis' },
    health: { t: 'Examining Poor Health Across California', modal: 'modal-health' },
    beh: { t: 'Data Science Intern · Behaivior', href: '#experience' },
    ta: { t: 'Teaching Associate · CSU Long Beach', href: '#experience' },
    ms: { t: 'M.S. Applied Statistics · CSULB', href: '#about' }
  };
  var E = {
    python: ['Python', [['upf', 'Built the food-scanning app in Python, plus a Streamlit web app validated with Python unit tests.'], ['beh', 'Analyzed real-time physiological and accelerometer time-series data from smartwatches in Python.']]],
    r: ['R', [['health', 'Screened 23 risk factors in R with association testing, logistic regression and random forest validation.']]],
    sql: ['SQL / PostgreSQL', [['thesis', 'Stored 189,000+ YouTube comments in PostgreSQL and retrieved them for preprocessing into a ~115,000-comment corpus.'], ['upf', 'The scanner app is built in Python with PostgreSQL and Expo.']]],
    api: ['YouTube Data API', [['thesis', 'Built a YouTube Data API pipeline that collected 189,000+ comments on cryptocurrency.']]],
    timeseries: ['Time-series data', [['beh', 'Modeled user activity patterns from real-time smartwatch physiological and accelerometer time series.'], ['thesis', 'Tracked five years of discourse in six-month windows.'], ['ms', 'Time Series Analysis coursework.']]],
    xgboost: ['XGBoost', [['beh', 'Built XGBoost models to flag relapse risk among substance users, cutting false positives by 10%.']]],
    nn: ['Neural networks', [['beh', 'Built neural network models to flag relapse risk, reducing unnecessary intervention costs.']]],
    rf: ['Random forest', [['health', 'Used random forest validation to confirm the strongest of 23 risk factors.']]],
    topic: ['Topic modeling', [['thesis', 'Compared four topic-modeling methods, detecting shifts tied to the Nov 2022 FTX collapse and 2024 mining-cost debates.']]],
    vlm: ['Vision-language models', [['upf', 'A vision-language model reads ingredient labels from a photo before rules assign a NOVA group.']]],
    ollama: ['Ollama / Qwen3-VL', [['upf', 'Runs Qwen3-VL via Ollama to read ingredient labels, with human review for uncertain scans.']]],
    cuml: ['RAPIDS cuML (GPU)', [['thesis', 'GPU-accelerated the topic-model comparison with RAPIDS cuML.']]],
    logreg: ['Logistic regression', [['health', 'Logistic regression turned the strongest signal into a threshold: 14+ bad physical health days per month predicted a 91% probability of poor health.']]],
    assoc: ['Association testing', [['health', 'Association testing to screen 23 candidate risk factors.']]],
    regression: ['Regression analysis', [['ms', 'Regression Analysis coursework.'], ['health', 'Logistic regression on 2022 CDC BRFSS data.']]],
    inference: ['Statistical inference', [['ms', 'Statistical Inference coursework.'], ['ta', 'Diagnosed recurring conceptual errors in statistical reasoning during bi-weekly office hours.']]],
    doe: ['Experimental design', [['ms', 'Experimental Design coursework.']]],
    consult: ['Statistical consulting', [['health', 'On a 3-person consulting team advising the Long Beach Dept. of Health & Human Services.'], ['ms', 'Statistical Consulting coursework.']]],
    tableau: ['Tableau', [['health', 'Lead Tableau developer: built dashboards on 2022 CDC BRFSS data to isolate the largest risk factor.']]],
    streamlit: ['Streamlit', [['upf', 'Streamlit web app: upload an ingredient-list photo and see the NOVA classification and parsed ingredients.']]],
    expo: ['Expo', [['upf', 'Built the mobile food-scanning app with Expo.']]],
    gcp: ['Google Cloud Platform', [['beh', 'Supported deployment of ML models to Google Cloud Platform.']]],
    tests: ['Unit testing', [['beh', 'Built unit test coverage to validate prediction correctness before release.'], ['upf', 'Validated the Streamlit web app with Python unit tests.']]],
    teach: ['Teaching & communication', [['ta', 'Taught 3 concurrent STAT 90 sections to 70+ students with workshops, team roles and individualized feedback.'], ['health', 'Translated model results into a single screening threshold for a city health department.']]]
  };
  var evTitle = $('#ev-title'), evList = $('#ev-list');
  var skillBtns = $$('.skill');
  function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function showSkill(key) {
    var e = E[key]; if (!e) return;
    skillBtns.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-skill') === key)); });
    evTitle.textContent = e[0];
    evList.innerHTML = e[1].map(function (row) {
      var s = S[row[0]];
      var link = s.modal
        ? '<button type="button" class="ev-link" data-modal="' + s.modal + '">Open project →</button>'
        : '<a href="' + s.href + '">Jump to section →</a>';
      return '<li><b>' + esc(s.t) + '</b><span>' + esc(row[1]) + '</span>' + link + '</li>';
    }).join('');
  }
  skillBtns.forEach(function (b) {
    b.setAttribute('aria-pressed', 'false');
    b.addEventListener('click', function () {
      showSkill(b.getAttribute('data-skill'));
      // On stacked (mobile) layouts the panel sits below the chips: bring it into view
      var panel = $('.evidence');
      if (window.innerWidth <= 1080 && panel) {
        var r = panel.getBoundingClientRect();
        if (r.top > window.innerHeight - 120 || r.bottom < 0) panel.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
      }
    });
  });
  showSkill('python');

  /* ---------------- Copy email ---------------- */
  var toast = $('#toast'), toastT;
  function showToast(msg) {
    toast.textContent = msg; toast.classList.add('is-on');
    clearTimeout(toastT); toastT = setTimeout(function () { toast.classList.remove('is-on'); }, 2200);
  }
  $$('.copy-btn').forEach(function (b) {
    b.addEventListener('click', function () {
      var txt = b.getAttribute('data-copy');
      var done = function () { showToast('Copied ' + txt + ' to clipboard'); var l = $('span', b); if (l) { l.textContent = 'Copied!'; setTimeout(function () { l.textContent = 'Copy email'; }, 2000); } };
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(txt).then(done, function () { showToast(txt); });
      else {
        var ta = document.createElement('textarea'); ta.value = txt; ta.setAttribute('readonly', ''); ta.style.position = 'absolute'; ta.style.left = '-9999px';
        document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); done(); } catch (err) { showToast(txt); }
        document.body.removeChild(ta);
      }
    });
  });

  var yr = $('#year'); if (yr) yr.textContent = new Date().getFullYear();

  /* ---------------- Network canvas (hero) ---------------- */
  var canvas = $('#net-canvas');
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext('2d');
    var W = 0, H = 0, DPR = Math.min(window.devicePixelRatio || 1, 2);
    var nodes = [], mouse = { x: -9999, y: -9999 }, running = false, visible = true, raf = 0;
    var col1 = '129,140,248', col2 = '45,212,191';
    function readColors() {
      var cs = getComputedStyle(root);
      col1 = cs.getPropertyValue('--net').trim() || col1;
      col2 = cs.getPropertyValue('--net2').trim() || col2;
    }
    function resize() {
      var r = canvas.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      var n = Math.max(28, Math.min(95, Math.round(W * H / 15000)));
      nodes = [];
      for (var i = 0; i < n; i++) {
        nodes.push({
          x: Math.random() * W, y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.32, vy: (Math.random() - 0.5) * 0.32,
          r: Math.random() < 0.12 ? 2.6 : 1.3 + Math.random() * 0.9,
          c: Math.random() < 0.18 ? 2 : 1
        });
      }
      if (!running) draw();
    }
    var LINK = 140;
    function draw() {
      ctx.clearRect(0, 0, W, H);
      var i, j, a, b, dx, dy, d2, alpha;
      for (i = 0; i < nodes.length; i++) {
        a = nodes[i];
        if (running) {
          a.x += a.vx; a.y += a.vy;
          if (a.x < -20) a.x = W + 20; else if (a.x > W + 20) a.x = -20;
          if (a.y < -20) a.y = H + 20; else if (a.y > H + 20) a.y = -20;
          dx = a.x - mouse.x; dy = a.y - mouse.y; d2 = dx * dx + dy * dy;
          if (d2 < 22000 && d2 > 1) { var f = 0.6 / Math.sqrt(d2); a.x += dx * f; a.y += dy * f; }
        }
        for (j = i + 1; j < nodes.length; j++) {
          b = nodes[j]; dx = a.x - b.x; dy = a.y - b.y; d2 = dx * dx + dy * dy;
          if (d2 < LINK * LINK) {
            alpha = (1 - Math.sqrt(d2) / LINK) * 0.28;
            ctx.strokeStyle = 'rgba(' + (a.c === 2 && b.c === 2 ? col2 : col1) + ',' + alpha.toFixed(3) + ')';
            ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
        dx = a.x - mouse.x; dy = a.y - mouse.y; d2 = dx * dx + dy * dy;
        if (d2 < 200 * 200) {
          alpha = (1 - Math.sqrt(d2) / 200) * 0.55;
          ctx.strokeStyle = 'rgba(' + col2 + ',' + alpha.toFixed(3) + ')';
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }
      }
      for (i = 0; i < nodes.length; i++) {
        a = nodes[i];
        ctx.fillStyle = 'rgba(' + (a.c === 2 ? col2 : col1) + ',' + (a.r > 2 ? 0.95 : 0.7) + ')';
        ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2); ctx.fill();
        if (a.r > 2) {
          ctx.fillStyle = 'rgba(' + (a.c === 2 ? col2 : col1) + ',0.12)';
          ctx.beginPath(); ctx.arc(a.x, a.y, a.r * 4, 0, Math.PI * 2); ctx.fill();
        }
      }
    }
    function loop() { if (!running) return; draw(); raf = requestAnimationFrame(loop); }
    function start() { if (reduced || running || !visible || document.hidden) return; running = true; raf = requestAnimationFrame(loop); }
    function stop() { running = false; cancelAnimationFrame(raf); }

    readColors(); resize();
    var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(resize, 150); });
    document.addEventListener('themechange', function () { readColors(); if (!running) draw(); });
    var hero = $('.hero');
    hero.addEventListener('pointermove', function (e) { var r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; }, { passive: true });
    hero.addEventListener('pointerleave', function () { mouse.x = mouse.y = -9999; });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) start(); else stop(); }).observe(hero);
    }
    document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else start(); });
    reduceMQ.addEventListener && reduceMQ.addEventListener('change', function (e) { reduced = e.matches; if (reduced) { stop(); draw(); } else start(); });
    start();
  }
})();
