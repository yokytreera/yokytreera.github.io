/*
 * rising-lines.js — lines of light rising from a glowing horizon,
 * drawn behind the Home page photo.
 *
 * Written from scratch for this site (plain JavaScript + <canvas>), inspired
 * by the idea of the "Rising Lines" effect on React Bits Pro. No Pro code used.
 *
 * ── HOW TO CHANGE THE LOOK ─────────────────────────────────────────────────
 * Edit DEFAULTS below:
 *   colors       [tail & haze colour, line colour] in dark mode
 *   lightColors  the same for light mode (drawn as soft ink on white)
 *   density      how many lines (1 = normal, 2 = twice as many)
 *   speed        how fast they rise
 *   lineLength   length of each line's fading tail
 *   horizon      where the glowing horizon sits: 0 = top of box, 1 = bottom
 *   spread       how wide the field of lines is (1 = normal)
 *   particles    brightness of the little sparks (0 = no sparks)
 *   updraft      how strongly lines speed up under the mouse
 */
(function () {
  'use strict';

  var DEFAULTS = {
    colors: ['#1D74F2', '#1AC5FB'],       // dark mode: brand-blue tail, cyan line
    lightColors: ['#1AC5FB', '#1D74F2'],  // light mode: cyan tail, brand-blue ink
    lightMode: false,
    density: 1.6,
    speed: 0.6,
    lineWidth: 1.4,
    lineLength: 1.35,
    horizon: 0.84,
    horizonGlow: 1.3,
    depth: 0.5,
    spread: 1,
    updraft: 1,
    particles: 1.3,
    interactive: true,
    intro: true,
    paused: false,
    dpr: 2
  };

  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function rand(a, b) { return a + Math.random() * (b - a); }
  function ease(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
  function hexToRgb(h) {
    h = String(h).replace('#', '');
    if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
    var n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function rgba(c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + clamp(a, 0, 1).toFixed(3) + ')'; }
  // Random position across the box, bunched towards the centre (behind the photo)
  function centreX(spread) {
    var u = (Math.random() + Math.random() + Math.random()) / 3; // bell-shaped 0..1
    return clamp(0.5 + (u - 0.5) * 2.2 * spread, 0.02, 0.98);
  }

  function mount(container, options) {
    var o = Object.assign({}, DEFAULTS, options);
    var canvas = document.createElement('canvas');
    canvas.className = 'rising-lines-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    container.appendChild(canvas);
    var ctx = canvas.getContext('2d');
    if (!ctx) return null;

    var reduce = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false;
    var W = 1, H = 1, ratio = 1;
    var lines = [], sparks = [], pal;
    var introT = o.intro && !reduce ? 0 : 1;
    var raf = 0, last = 0, alive = true, visible = true;
    var pointer = { x: 0, inside: false, lift: 0 };

    function setPalette() {
      var c = o.lightMode ? o.lightColors : o.colors;
      pal = {
        tail: hexToRgb(c[0]),
        line: hexToRgb(c[1]),
        head: o.lightMode ? [29, 29, 31] : [255, 255, 255]
      };
    }

    // ---- lines ----------------------------------------------------------------
    function spawn(line, x, boost, delay) {
      line.x = x === undefined ? centreX(o.spread) : clamp(x, 0.01, 0.99);
      line.z = Math.random();                                   // 0 = near, 1 = far
      line.y = 0;                                               // distance risen above its start
      line.v = rand(45, 120) * (1 - 0.45 * line.z) * (boost || 1);
      line.len = rand(0.12, 0.32) * (1 - 0.4 * line.z);         // share of box height
      line.w = (1.5 - 0.9 * line.z);
      line.a = clamp(1 - line.z * o.depth * 1.3, 0.15, 1);
      line.delay = delay === undefined ? rand(0, 1.4) : delay;
    }
    function lineCount() { return Math.round(o.density * clamp(W / 6, 30, 110)); }
    function fillLines() {
      var n = lineCount();
      while (lines.length < n) { var l = {}; spawn(l); l.delay = rand(0, 3); lines.push(l); }
      lines.length = n;
    }

    // ---- sparks ---------------------------------------------------------------
    function spawnSpark(s) {
      s.x = centreX(o.spread * 0.9);
      s.y = 0;
      s.vy = rand(14, 40);
      s.phase = rand(0, 6.28);
      s.life = 0;
      s.max = rand(1.6, 3.6);
      s.r = rand(0.5, 1.3);
    }
    function fillSparks() {
      var n = Math.round(36 * o.particles);
      while (sparks.length < n) { var s = {}; spawnSpark(s); s.life = rand(0, s.max); sparks.push(s); }
      sparks.length = n;
    }

    // How much the pointer column lifts a line at horizontal position x (0..1)
    function liftAt(x) {
      if (!o.interactive || pointer.lift < 0.001) return 0;
      var d = (x * W - pointer.x) / Math.max(W * 0.09, 30);
      return pointer.lift * o.updraft * Math.exp(-d * d);
    }

    function step(dt) {
      var sp = o.speed;
      if (introT < 1) introT = Math.min(1, introT + dt / 1.6);
      var open = ease(introT);
      var horizonY = H * o.horizon;
      pointer.lift += ((pointer.inside ? 1 : 0) - pointer.lift) * (1 - Math.exp(-dt / (pointer.inside ? 0.25 : 0.6)));

      lines.forEach(function (l) {
        if (Math.abs(l.x - 0.5) > open * 0.55) return;          // horizon opens from the centre
        if (l.delay > 0) { l.delay -= dt; return; }
        var lift = liftAt(l.x);
        l.y += l.v * sp * (1 + 1.6 * lift) * dt * (H / 240);
        var start = horizonY - l.z * o.depth * H * 0.12;
        if (start - l.y < -l.len * H * o.lineLength) {
          // finished: respawn, sometimes under the pointer so the column gets denser
          var underPointer = pointer.lift > 0.3 && Math.random() < 0.35 * o.updraft;
          spawn(l, underPointer ? pointer.x / W + rand(-0.04, 0.04) : undefined, 1,
                rand(0, underPointer ? 0.2 : 1.2) / Math.max(sp, 0.05));
        }
      });
      sparks.forEach(function (s) {
        var lift = liftAt(s.x);
        s.life += dt;
        s.y += s.vy * sp * (1 + lift) * dt * (H / 240);
        if (s.life > s.max) spawnSpark(s);
      });
    }

    function draw() {
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.clearRect(0, 0, W, H);
      var open = ease(introT);
      var horizonY = H * o.horizon;
      var ink = o.lightMode;
      ctx.globalCompositeOperation = ink ? 'source-over' : 'lighter';
      var k = ink ? 0.75 : 1; // light mode is gentler

      // Haze rising above the horizon
      var hazeW = W * 0.5 * o.spread * open;
      if (hazeW > 1) {
        ctx.save();
        ctx.translate(W / 2, horizonY);
        ctx.scale(hazeW, H * 0.5);
        var haze = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
        haze.addColorStop(0, rgba(pal.tail, 0.28 * o.depth * k));
        haze.addColorStop(1, rgba(pal.tail, 0));
        ctx.fillStyle = haze;
        ctx.fillRect(-1, -1, 2, 1);
        ctx.restore();

        // Glow of the horizon itself
        ctx.save();
        ctx.translate(W / 2, horizonY);
        ctx.scale(W * 0.42 * o.spread * open, H * 0.07);
        var glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
        glow.addColorStop(0, rgba(pal.line, 0.65 * o.horizonGlow * k));
        glow.addColorStop(0.45, rgba(pal.tail, 0.3 * o.horizonGlow * k));
        glow.addColorStop(1, rgba(pal.tail, 0));
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, 0, 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // The thin bright horizon line
        var half = W * 0.4 * o.spread * open;
        var hl = ctx.createLinearGradient(W / 2 - half, 0, W / 2 + half, 0);
        hl.addColorStop(0, rgba(pal.line, 0));
        hl.addColorStop(0.5, rgba(pal.head, 0.9 * o.horizonGlow * k));
        hl.addColorStop(1, rgba(pal.line, 0));
        ctx.strokeStyle = hl;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(W / 2 - half, horizonY);
        ctx.lineTo(W / 2 + half, horizonY);
        ctx.stroke();
      }

      // Rising lines: bright head, line colour, fading tail
      ctx.lineCap = 'round';
      lines.forEach(function (l) {
        if (l.delay > 0 || l.y <= 0) return;
        if (Math.abs(l.x - 0.5) > open * 0.55) return;
        var start = horizonY - l.z * o.depth * H * 0.12;
        var headY = start - l.y;
        var tailY = Math.min(start, headY + l.len * H * o.lineLength);
        if (tailY - headY < 1) return;
        var px = l.x * W;
        var lift = liftAt(l.x);
        var fadeTop = clamp(headY / (H * 0.35), 0, 1);           // dissolve near the top
        var a = l.a * fadeTop * (1 + 0.6 * lift) * k;
        var g = ctx.createLinearGradient(px, headY, px, tailY);
        g.addColorStop(0, rgba(pal.head, a));
        g.addColorStop(0.18, rgba(pal.line, a * 0.85));
        g.addColorStop(1, rgba(pal.tail, 0));
        ctx.strokeStyle = g;
        ctx.lineWidth = l.w * o.lineWidth;
        ctx.beginPath();
        ctx.moveTo(px, headY);
        ctx.lineTo(px, tailY);
        ctx.stroke();
      });

      // Sparks drifting upwards
      if (o.particles > 0) {
        sparks.forEach(function (s) {
          var y = horizonY - s.y;
          var x = s.x * W + Math.sin(s.phase + s.life * 2) * 4;
          var life = s.life / s.max;
          var a = Math.sin(life * Math.PI) * 0.8 * o.particles * clamp(y / (H * 0.3), 0, 1) * k;
          if (a <= 0.01 || Math.abs(s.x - 0.5) > open * 0.55) return;
          ctx.fillStyle = rgba(ink ? pal.head : pal.line, a);
          ctx.beginPath();
          ctx.arc(x, y, s.r, 0, Math.PI * 2);
          ctx.fill();
        });
      }
      ctx.globalCompositeOperation = 'source-over';
    }

    function frame(now) {
      raf = 0;
      if (!alive || !visible || document.hidden) return;
      var dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;
      if (!o.paused) step(dt);
      draw();
      if (!o.paused) raf = requestAnimationFrame(frame);
      else last = 0;
    }
    function wake() {
      if (reduce) { draw(); return; }
      if (!raf && alive && visible && !document.hidden) raf = requestAnimationFrame(frame);
    }

    function resize() {
      W = Math.max(1, container.clientWidth);
      H = Math.max(1, container.clientHeight);
      ratio = Math.min(o.dpr || 2, window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * ratio);
      canvas.height = Math.round(H * ratio);
      fillLines();
      fillSparks();
      draw();
      wake();
    }

    // Reduced motion: show one still frame with lines already risen
    function stillFrame() {
      introT = 1;
      lines.forEach(function (l) { l.delay = 0; l.y = rand(0.05, 0.75) * H; });
      sparks.forEach(function (s) { s.life = rand(0.3, 0.7) * s.max; s.y = rand(0.05, 0.5) * H; });
      draw();
    }

    // Pointer: the effect itself ignores clicks so the photo/links still work,
    // so we listen on the parent box (the photo area) instead.
    var host = container.parentElement || container;
    function onMove(e) {
      var r = canvas.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.inside = pointer.x >= 0 && pointer.x <= r.width && e.clientY >= r.top && e.clientY <= r.bottom;
    }
    function onLeave() { pointer.inside = false; }
    function onClick(e) {
      if (!o.interactive || reduce) return;
      var r = canvas.getBoundingClientRect();
      launch((e.clientX - r.left) / r.width, 1);
    }
    // A volley of lines from the horizon at x (0..1). Volleys stack.
    function launch(x, strength) {
      var n = Math.round(14 * (strength || 1));
      for (var i = 0; i < n; i++) {
        var l = {};
        spawn(l, x + rand(-0.035, 0.035), 1.5, i * 0.025);
        l.volley = true;
        lines.push(l);
      }
      // trim old volley lines so the count does not grow forever
      var extra = lines.length - lineCount() * 2;
      if (extra > 0) lines.splice(lineCount(), extra);
      wake();
    }
    function onVisibility() { last = 0; wake(); }

    setPalette();
    var ro = new ResizeObserver(resize);
    ro.observe(container);
    var io = new IntersectionObserver(function (entries) {
      visible = entries.some(function (en) { return en.isIntersecting; });
      if (visible) { last = 0; wake(); }
    });
    io.observe(container);
    host.addEventListener('pointermove', onMove, { passive: true });
    host.addEventListener('pointerleave', onLeave);
    host.addEventListener('click', onClick);
    document.addEventListener('visibilitychange', onVisibility);
    resize();
    if (reduce) stillFrame();

    return {
      update: function (opts) {
        Object.assign(o, opts);
        setPalette();
        if (reduce) stillFrame(); else { draw(); wake(); }
      },
      launch: launch,
      destroy: function () {
        alive = false;
        cancelAnimationFrame(raf);
        ro.disconnect();
        io.disconnect();
        host.removeEventListener('pointermove', onMove);
        host.removeEventListener('pointerleave', onLeave);
        host.removeEventListener('click', onClick);
        document.removeEventListener('visibilitychange', onVisibility);
        canvas.remove();
      }
    };
  }

  window.RisingLines = { mount: mount, defaults: DEFAULTS };
})();
