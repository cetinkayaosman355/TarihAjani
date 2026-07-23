/* STORIA — shared UI behaviours: scroll header, reveal-on-scroll, mobile nav,
   accordion. Progressive-enhancement only; the page works without it. */
(function () {
  'use strict';

  // Theme toggle (landing)
  var themeBtn = document.getElementById('themeBtn');
  if (themeBtn) themeBtn.addEventListener('click', function () {
    var cur = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', cur);
    try { localStorage.setItem('storia_theme', cur); } catch (e) {}
    var tc = document.querySelector('meta[name="theme-color"]');
    if (tc) tc.setAttribute('content', cur === 'dark' ? '#14110C' : '#FBF8F2');
  });

  // Sticky header shadow after scroll
  var header = document.querySelector('.site-header');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('scrolled', window.scrollY > 12);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // Reveal on scroll
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && reveals.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  // Mobile nav
  var toggle = document.querySelector('.nav-toggle');
  var drawer = document.querySelector('#mobileNav');
  if (toggle && drawer) {
    var setOpen = function (open) {
      drawer.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
    };
    toggle.addEventListener('click', function () {
      setOpen(!drawer.classList.contains('open'));
    });
    drawer.addEventListener('click', function (e) {
      if (e.target.tagName === 'A' || e.target === drawer) setOpen(false);
    });
  }

  // Accordion (FAQ)
  document.querySelectorAll('[data-acc]').forEach(function (item) {
    var btn = item.querySelector('[data-acc-btn]');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var open = item.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(open));
    });
  });

  // Smooth-scroll for same-page anchors (respects reduced motion via CSS)
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id.length < 2) return;
      var t = document.querySelector(id);
      if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
  });
})();
