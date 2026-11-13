/*
 * hero-bg.js — chooses the animated background behind your photo.
 *
 *   DEFAULT               which background visitors see: 'rising' or 'waves'
 *   SHOW_COMPARE_SWITCH   true = shows a small switch at the bottom of the
 *                         Home page so you can compare the two.
 *                         Set it to false before you publish.
 *
 * You can also open the page as  index.html?bg=waves  or  ?bg=rising
 */
(function () {
  'use strict';
  var DEFAULT = 'waves';
  var SHOW_COMPARE_SWITCH = false;

  var el = document.getElementById('hero-bg');
  if (!el) return;

  var choice = DEFAULT;
  if (SHOW_COMPARE_SWITCH) {
    try { choice = localStorage.getItem('hero-bg') || DEFAULT; } catch (e) {}
  }
  var fromUrl = new URLSearchParams(location.search).get('bg');
  if (fromUrl === 'waves' || fromUrl === 'rising') choice = fromUrl;

  function isDark() { return document.body.classList.contains('quarto-dark'); }
  function options() {
    return choice === 'waves' ? window.SlicedWaves.optionsFor(isDark()) : { lightMode: !isDark() };
  }

  var effect = null;
  function start() {
    if (effect) effect.destroy();
    el.className = 'hero-bg is-' + choice;
    el.innerHTML = '';
    var lib = choice === 'waves' ? window.SlicedWaves : window.RisingLines;
    effect = lib ? lib.mount(el, options()) : null;
  }
  start();

  // Follow Quarto's light/dark switch
  new MutationObserver(function () { if (effect) effect.update(options()); })
    .observe(document.body, { attributes: true, attributeFilter: ['class'] });

  if (!SHOW_COMPARE_SWITCH) return;
  var bar = document.createElement('div');
  bar.className = 'bg-compare';
  bar.setAttribute('role', 'group');
  bar.setAttribute('aria-label', 'Compare photo backgrounds');
  [['rising', 'Rising lines'], ['waves', 'Waves']].forEach(function (item) {
    var b = document.createElement('button');
    b.type = 'button';
    b.textContent = item[1];
    b.dataset.bg = item[0];
    b.addEventListener('click', function () {
      choice = item[0];
      try { localStorage.setItem('hero-bg', choice); } catch (e) {}
      start();
      mark();
    });
    bar.appendChild(b);
  });
  function mark() {
    bar.querySelectorAll('button').forEach(function (b) {
      b.classList.toggle('active', b.dataset.bg === choice);
      b.setAttribute('aria-pressed', b.dataset.bg === choice);
    });
  }
  mark();
  document.body.appendChild(bar);
})();
