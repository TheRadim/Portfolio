/* Recommendations for SimpleRent – small behaviours. The pages read fine without this file. */
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* Interactive header example */
  var proto = $('.proto');
  if (proto) {
    var btns = $$('[data-menu]', proto);
    var closeAll = function (except) {
      btns.forEach(function (b) {
        if (b === except) return;
        b.setAttribute('aria-expanded', 'false');
        var p = document.getElementById(b.getAttribute('aria-controls')); if (p) p.hidden = true;
      });
    };
    btns.forEach(function (b) {
      var panel = document.getElementById(b.getAttribute('aria-controls'));
      b.addEventListener('click', function () {
        var open = b.getAttribute('aria-expanded') === 'true';
        closeAll(b);
        b.setAttribute('aria-expanded', String(!open));
        panel.hidden = open;
      });
      b.addEventListener('keydown', function (e) {
        var i = btns.indexOf(b);
        if (e.key === 'ArrowRight') { e.preventDefault(); btns[(i + 1) % btns.length].focus(); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); btns[(i - 1 + btns.length) % btns.length].focus(); }
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        var openBtn = btns.filter(function (b) { return b.getAttribute('aria-expanded') === 'true'; })[0];
        closeAll(); if (openBtn) openBtn.focus();
      }
    });
    document.addEventListener('click', function (e) { if (!proto.contains(e.target)) closeAll(); });
    $$('.p-panel a, .p-drawer a', proto).forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); }); });

    var burger = $('[data-burger]', proto), drawer = $('.p-drawer', proto);
    if (burger) burger.addEventListener('click', function () {
      var open = drawer.classList.toggle('open');
      burger.setAttribute('aria-expanded', String(open));
    });

    /* Desktop / phone width */
    $$('.seg button').forEach(function (b) {
      b.addEventListener('click', function () {
        $$('.seg button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        proto.classList.toggle('phone', b.dataset.w === 'phone');
        closeAll();
      });
    });
  }

  /* Parts list with one preview */
  var list = $('.parts .list');
  if (list) {
    var imgs = $$('.parts .view img'), cap = $('.parts .view p');
    var show = function (a) {
      $$('a', list).forEach(function (x) { x.classList.toggle('cur', x === a); });
      imgs.forEach(function (im) { im.classList.toggle('show', im.dataset.k === a.dataset.k); });
      if (cap) cap.innerHTML = '<b>' + a.dataset.name + '.</b> ' + a.dataset.desc;
    };
    $$('a', list).forEach(function (a) {
      a.addEventListener('mouseenter', function () { show(a); });
      a.addEventListener('focus', function () { show(a); });
    });
    var first = $('a', list); if (first) show(first);
  }

  /* Components page: state switches */
  $$('.states').forEach(function (g) {
    var target = g.nextElementSibling;
    $$('button', g).forEach(function (b) {
      b.addEventListener('click', function () {
        $$('button', g).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        $$('[data-state]', target).forEach(function (v) { v.hidden = v.getAttribute('data-state') !== b.dataset.s; });
      });
    });
  });
})();
