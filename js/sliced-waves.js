/*
 * sliced-waves.js — animated light waves behind the Home page hero.
 *
 * Plain-JavaScript port of the <SlicedWaves /> component from React Bits
 * (https://reactbits.dev, MIT + Commons Clause). The drawing code (WebGL
 * shaders, layout, animation) is unchanged; only the React wrapper was
 * replaced so it runs on a static Quarto site without React.
 *
 * ── HOW TO CHANGE THE LOOK ─────────────────────────────────────────────────
 * Edit OPTIONS just below. Every option is explained in the React Bits table:
 * colours, number of ribbons, speed, position, blur, glow, fade…
 * LIGHT and DARK hold the few settings that differ per colour mode.
 */
(function () {
  'use strict';

  var OPTIONS = {
    color1: '#1AC5FB',   // sky cyan
    color2: '#1D74F2',   // brand blue
    color3: '#0a3a8c',   // deep navy
    ribbons: 3,
    spacing: 26,
    barWidth: 0.5,
    ribbonHeight: 0.4,
    spread: 0.14,
    amplitude: 0.12,
    frequency: 1,
    speed: 0.6,          // calm, not distracting
    perspective: 0.45,
    curve: 0.5,
    blur: 0.6,
    glow: 1,
    brightness: 1.1,
    position: 0.55,      // 0 = top of the photo box, 1 = bottom
    rotation: 0,
    slices: 0,
    grain: 0.05,
    mouseInteraction: true,
    intro: true,
    fade: 0.35,          // soft edges so it melts into the page
    opacity: 1,
    paused: false,
    dpr: undefined
  };
  var LIGHT = { lightMode: true, opacity: 0.55 };
  var DARK = { lightMode: false, opacity: 0.9 };

  // ─────────────────────────── shaders (unchanged) ───────────────────────────
  var BAR_VERTEX = `#version 300 es
in vec2 aCorner;
in vec4 aShape;
in vec4 aTop;
in vec4 aBottom;
uniform vec2 uView;
uniform float uAngle;
out vec2 vLocal;
out vec4 vShape;
out vec4 vTop;
out vec4 vBottom;
void main() {
  float halo = aShape.z + 5.0;
  float reachX = aShape.z + max(aTop.w * 2.5, halo * 2.0);
  float reachY = aShape.w + max(aTop.w * 2.5, halo * 2.0);
  vec2 local = aCorner * vec2(reachX, reachY);
  vLocal = local;
  vShape = aShape;
  vTop = aTop;
  vBottom = aBottom;
  float c = cos(uAngle);
  float s = sin(uAngle);
  vec2 p = aShape.xy + local - uView * 0.5;
  p = vec2(c * p.x - s * p.y, s * p.x + c * p.y) + uView * 0.5;
  gl_Position = vec4(p.x / uView.x * 2.0 - 1.0, 1.0 - p.y / uView.y * 2.0, 0.0, 1.0);
}`;

  var BAR_FRAGMENT = `#version 300 es
precision highp float;
in vec2 vLocal;
in vec4 vShape;
in vec4 vTop;
in vec4 vBottom;
uniform float uGlow;
uniform float uSlices;
uniform float uBase;
uniform float uHalfBar;
uniform float uScale;
out vec4 outColor;

float erfApprox(float x) {
  float a = x * x;
  float t = 1.0 - exp(-a * (1.2732395 + 0.147 * a) / (1.0 + 0.147 * a));
  return sign(x) * sqrt(max(t, 0.0));
}

float box(float d, float h, float s) {
  float k = 0.70710678 / max(s, 0.3);
  return 0.5 * (erfApprox((h - d) * k) + erfApprox((h + d) * k));
}

void main() {
  float blur = vTop.w;
  float body = box(vLocal.x, vShape.z, blur) * box(vLocal.y, vShape.w, blur * 1.15);
  float halo = vShape.z + 5.0;
  float glow = box(vLocal.x, vShape.z, halo) * box(vLocal.y, vShape.w, halo);
  float t = clamp(vLocal.y / max(vShape.w, 0.001) * 0.5 + 0.5, 0.0, 1.0);
  vec3 color = mix(vTop.rgb, vBottom.rgb, t);
  float v = clamp(vLocal.y / max(vShape.w, 0.001), -1.0, 1.0);
  float core = exp(-pow(vLocal.x / max(vShape.z + blur * 0.5, 0.5), 2.0) * 1.5);
  body *= (1.0 + 0.35 * core) * (1.0 - 0.35 * v * v * v * v);
  if (uSlices > 0.0) {
    float cell = vShape.z / max(uHalfBar, 0.00001) / uSlices;
    float y = (uBase - vShape.y - vLocal.y) / max(cell, 0.001);
    float f = 1.0 - abs(fract(y) - 0.5) * 2.0;
    float soft = clamp(blur / max(cell, 0.001) * 1.6, 0.04, 1.0);
    body *= smoothstep(0.28 - soft, 0.28 + soft, f);
  }
  vec3 tint = color * color / max(max(color.r, max(color.g, color.b)), 0.05);
  outColor = vec4((color * body + tint * uGlow * glow * 0.16) * vBottom.w * uScale, 1.0);
}`;

  var QUAD_VERTEX = `#version 300 es
in vec2 aCorner;
void main() {
  gl_Position = vec4(aCorner, 0.0, 1.0);
}`;

  var COMPOSITE = `#version 300 es
precision highp float;
uniform sampler2D uLight;
uniform vec2 uResolution;
uniform float uScale;
uniform float uExposure;
uniform float uGrain;
uniform float uTime;
uniform float uFade;
uniform float uOpacity;
uniform float uLightMode;
out vec4 outColor;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float smootherstep(float edge, float x) {
  float t = clamp(x / max(edge, 0.0001), 0.0, 1.0);
  return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

void main() {
  vec3 hdr = texelFetch(uLight, ivec2(gl_FragCoord.xy), 0).rgb / uScale * uExposure;
  vec2 uv = gl_FragCoord.xy / uResolution;
  float edge = uFade * 0.5;
  float mask = smootherstep(edge, uv.x) * smootherstep(edge, 1.0 - uv.x) * smootherstep(edge, uv.y) * smootherstep(edge, 1.0 - uv.y);
  mask *= uOpacity;
  float grain = (hash(gl_FragCoord.xy + fract(uTime * 7.31) * 113.0) - 0.5) * uGrain;
  float peak = max(hdr.r, max(hdr.g, hdr.b));
  if (uLightMode > 0.5) {
    vec3 hue = hdr / max(peak, 0.0001);
    float tone = dot(hue, vec3(0.2126, 0.7152, 0.0722));
    vec3 color = pow(clamp(hue * min(1.0, 0.66 / max(tone, 0.001)), 0.0, 1.0), vec3(1.0 / 2.2));
    float alpha = clamp((1.0 - exp(-peak * 1.1)) * 0.85 * (1.0 + grain), 0.0, 1.0) * mask;
    outColor = vec4(color * alpha, alpha);
  } else {
    vec3 mapped = 1.0 - exp(-hdr);
    mapped = mix(mapped, vec3(1.0), smoothstep(1.1, 3.2, peak) * 0.75);
    float level = max(mapped.r, max(mapped.g, mapped.b));
    mapped = clamp(mapped + grain * (0.25 + level), 0.0, 1.0) * mask;
    outColor = vec4(mapped, max(mapped.r, max(mapped.g, mapped.b)));
  }
}`;

  var TAU = Math.PI * 2;
  var MAX_RIBBONS = 6;
  var FOCAL = 1.1;
  var DISTANCE = 2.6;
  var INTRO_SECONDS = 1.5;
  var MAX_RENDER_DIM = 2560;

  function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
  function hash(n) { var v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); }
  function noise(x) {
    var i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
    return hash(i) * (1 - u) + hash(i + 1) * u;
  }
  function compile(gl, type, source) {
    var shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
    gl.deleteShader(shader);
    return null;
  }
  function link(gl, vs, fs, attributes) {
    var vertex = compile(gl, gl.VERTEX_SHADER, vs);
    var fragment = compile(gl, gl.FRAGMENT_SHADER, fs);
    var program = gl.createProgram();
    if (!vertex || !fragment || !program) return null;
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    attributes.forEach(function (name, index) { gl.bindAttribLocation(program, index, name); });
    gl.linkProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    if (gl.getProgramParameter(program, gl.LINK_STATUS)) return program;
    gl.deleteProgram(program);
    return null;
  }
  function locate(gl, program, names) {
    var result = {};
    names.forEach(function (n) { result[n] = gl.getUniformLocation(program, n); });
    return result;
  }

  // Turns raw options into checked, clamped settings (same rules as the React version).
  function normalise(o) {
    return {
      color1: String(o.color1), color2: String(o.color2), color3: String(o.color3),
      ribbons: Math.round(clamp(o.ribbons, 1, MAX_RIBBONS)),
      spacing: clamp(o.spacing, 4, 200),
      barWidth: clamp(o.barWidth, 0.05, 1),
      ribbonHeight: Math.max(0, o.ribbonHeight),
      spread: Math.max(0, o.spread),
      amplitude: Math.max(0, o.amplitude),
      frequency: Math.max(0, o.frequency),
      speed: o.speed,
      perspective: clamp(o.perspective, 0, 1),
      curve: clamp(o.curve, 0, 1),
      blur: clamp(o.blur, 0, 2),
      glow: Math.max(0, o.glow),
      brightness: Math.max(0, o.brightness),
      position: clamp(o.position, 0, 1),
      rotation: o.rotation,
      slices: Math.max(0, Math.round(o.slices)),
      grain: Math.max(0, o.grain),
      mouseInteraction: o.mouseInteraction,
      intro: o.intro,
      fade: clamp(o.fade, 0, 1),
      opacity: clamp(o.opacity, 0, 1),
      lightMode: !!o.lightMode,
      paused: o.paused,
      dpr: o.dpr
    };
  }

  // Mounts the effect inside `container`. Returns { update(opts), destroy() }.
  function mount(container, initial) {
    var current = normalise(initial);
    var canvas = document.createElement('canvas');
    canvas.className = 'sliced-waves-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    container.classList.add('sliced-waves-container');
    container.appendChild(canvas);

    var gl = canvas.getContext('webgl2', {
      alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false
    });
    if (!gl) return null; // very old browser: the page simply shows no waves

    var floatTarget = !!gl.getExtension('EXT_color_buffer_float');
    var lightScale = floatTarget ? 1 : 0.25;
    var barProgram = link(gl, BAR_VERTEX, BAR_FRAGMENT, ['aCorner', 'aShape', 'aTop', 'aBottom']);
    var compositeProgram = link(gl, QUAD_VERTEX, COMPOSITE, ['aCorner']);
    if (!barProgram || !compositeProgram) return null;
    var bar = locate(gl, barProgram, ['uView', 'uAngle', 'uGlow', 'uSlices', 'uBase', 'uHalfBar', 'uScale']);
    var composite = locate(gl, compositeProgram, ['uLight', 'uResolution', 'uScale', 'uExposure', 'uGrain', 'uTime', 'uFade', 'uOpacity', 'uLightMode']);

    var cornerBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cornerBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    var instanceBuffer = gl.createBuffer();
    var barVao = gl.createVertexArray();
    gl.bindVertexArray(barVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, cornerBuffer);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer);
    for (var attribute = 1; attribute <= 3; attribute++) {
      gl.enableVertexAttribArray(attribute);
      gl.vertexAttribPointer(attribute, 4, gl.FLOAT, false, 48, (attribute - 1) * 16);
      gl.vertexAttribDivisor(attribute, 1);
    }
    var quadBuffer = gl.createBuffer();
    var quadVao = gl.createVertexArray();
    gl.bindVertexArray(quadVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);

    var lightTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, lightTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    var framebuffer = gl.createFramebuffer();

    var probe = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    var reduce = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false;
    var colorCache = new Map();
    var instances = new Float32Array(0);
    var pointer = { x: 0, y: 0, inside: false };
    var state = {
      width: 1, height: 1, targetWidth: 0, targetHeight: 0, time: 0,
      intro: current.intro && !reduce ? 0 : 1,
      focus: DISTANCE, focusVelocity: 0, lift: 0, liftX: 0
    };
    var raf = 0, last = 0, visible = true, alive = true;

    function toLinear(value) {
      if (colorCache.has(value)) return colorCache.get(value);
      var rgb = [1, 1, 1];
      if (probe && value) {
        probe.clearRect(0, 0, 1, 1);
        probe.fillStyle = '#000000';
        probe.fillStyle = /^[0-9a-f]{3,8}$/i.test(value) ? '#' + value : value;
        probe.fillRect(0, 0, 1, 1);
        var d = probe.getImageData(0, 0, 1, 1).data;
        rgb = [d[0], d[1], d[2]].map(function (v) { return Math.pow(v / 255, 2.2); });
      }
      colorCache.set(value, rgb);
      return rgb;
    }

    function writePalette(palette, x, offset) {
      var n = palette.length;
      var f = ((x % n) + n) % n;
      var i = Math.floor(f);
      var m = f - i;
      m = m * m * (3 - 2 * m);
      var a = palette[i], b = palette[(i + 1) % n];
      for (var c = 0; c < 3; c++) instances[offset + c] = a[c] + (b[c] - a[c]) * m;
    }

    function ensureTarget() {
      if (state.targetWidth === canvas.width && state.targetHeight === canvas.height) return;
      state.targetWidth = canvas.width;
      state.targetHeight = canvas.height;
      gl.bindTexture(gl.TEXTURE_2D, lightTexture);
      if (floatTarget) {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, canvas.width, canvas.height, 0, gl.RGBA, gl.HALF_FLOAT, null);
      } else {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, canvas.width, canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, lightTexture, 0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    function layout(s) {
      var w = state.width, h = state.height;
      var F = h * FOCAL;
      var centerScale = F / DISTANCE;
      var pitch = s.spacing / centerScale;
      var halfBar = pitch * s.barWidth * 0.5;
      var yaw = s.perspective * 0.66;
      var cosYaw = Math.cos(yaw), sinYaw = Math.sin(yaw);
      var bend = s.curve * 0.6;
      var angle = (s.rotation * Math.PI) / 180;
      var span = Math.abs(Math.cos(angle)) * w * 0.5 + Math.abs(Math.sin(angle)) * h * 0.5;
      var reach = Math.ceil(((Math.max(w, h) / F) * DISTANCE * 2.4) / pitch);
      var bars = [];
      for (var i = -reach; i <= reach; i++) {
        var x = i * pitch;
        var local = bend * Math.sin(x * 0.9 + 0.8);
        var X = x * cosYaw - local * sinYaw;
        var Z = x * sinYaw + local * cosYaw + DISTANCE;
        if (Z < 0.45) continue;
        var scale = F / Z;
        var sx = w * 0.5 + X * scale;
        if (Math.abs(sx - w * 0.5) > span + halfBar * scale + 80) continue;
        bars.push({ i: i, x: x, Z: Z, sx: sx, scale: scale });
      }
      return { bars: bars, halfBar: halfBar, centerScale: centerScale };
    }

    function build(s, view) {
      var w = state.width, h = state.height;
      var bars = view.bars, halfBar = view.halfBar, centerScale = view.centerScale;
      var palette = [s.color1, s.color2, s.color3].map(toLinear);
      var t = state.time;
      var thickness = (s.ribbonHeight * h * 0.5) / centerScale;
      var separation = (s.spread * h) / centerScale;
      var amplitude = (s.amplitude * h) / centerScale;
      var frequency = 0.22 * s.frequency;
      var base = h * s.position;
      var focus = state.focus;
      var blurScale = s.blur * 16;
      var sweep = 1.6 + 0.04 * (s.ribbons - 1);
      var needed = bars.length * s.ribbons * 12;
      if (needed > instances.length) instances = new Float32Array(needed + 1200);
      var count = 0;
      for (var k = 0; k < bars.length; k++) {
        var b = bars[k];
        var hw = halfBar * b.scale;
        var across = b.sx / Math.max(w, 1);
        var lift = state.lift * Math.exp(-Math.pow((b.sx - state.liftX) / Math.max(w * 0.12, 60), 2));
        var blurPx = (0.5 + s.blur * 0.6 + blurScale * Math.abs(focus / b.Z - 1)) * (s.lightMode ? 0.55 : 1);
        for (var r = 0; r < s.ribbons; r++) {
          var offset = (r - (s.ribbons - 1) / 2) * separation;
          var wave =
            0.62 * Math.sin(TAU * frequency * b.x - t * 1.6 + r * 2.1) +
            0.38 * Math.sin(TAU * frequency * 1.9 * b.x + t * 2.25 + r * 1.3);
          var yc = offset + wave * amplitude;
          var swell = 0.5 + 0.5 * Math.sin(TAU * frequency * 0.7 * b.x + t * 1.1 + r * 2.7);
          var grow = clamp((state.intro * sweep - across - r * 0.04) / 0.6, 0, 1);
          var eased = grow * grow * (3 - 2 * grow);
          var th = thickness * (0.6 + 0.4 * swell) * eased;
          var hh = th * b.scale;
          if (hh < 0.4) continue;
          var tone = r * 1.15 + b.x * 0.3 + t * 0.12;
          var o = count * 12;
          instances[o] = b.sx;
          instances[o + 1] = base - yc * b.scale;
          instances[o + 2] = hw;
          instances[o + 3] = hh;
          writePalette(palette, tone - 0.22, o + 4);
          instances[o + 7] = blurPx;
          writePalette(palette, tone + 0.22, o + 8);
          instances[o + 11] =
            (0.75 + 0.25 * noise(b.i * 0.9 + r * 7.7 - t * 1.2)) * (1 + lift * 0.6) * (0.4 + 0.6 * eased);
          count++;
        }
      }
      return { count: count, halfBar: halfBar, base: base };
    }

    function render(s, view) {
      view = view || layout(s);
      ensureTarget();
      var built = build(s, view);
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      if (built.count > 0) {
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE);
        gl.useProgram(barProgram);
        gl.uniform2f(bar.uView, state.width, state.height);
        gl.uniform1f(bar.uAngle, (s.rotation * Math.PI) / 180);
        gl.uniform1f(bar.uGlow, s.lightMode ? s.glow * 0.4 : s.glow);
        gl.uniform1f(bar.uSlices, s.slices);
        gl.uniform1f(bar.uBase, built.base);
        gl.uniform1f(bar.uHalfBar, built.halfBar);
        gl.uniform1f(bar.uScale, lightScale);
        gl.bindVertexArray(barVao);
        gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, instances.subarray(0, built.count * 12), gl.DYNAMIC_DRAW);
        gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, built.count);
        gl.disable(gl.BLEND);
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(compositeProgram);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, lightTexture);
      gl.uniform1i(composite.uLight, 0);
      gl.uniform2f(composite.uResolution, canvas.width, canvas.height);
      gl.uniform1f(composite.uScale, lightScale);
      gl.uniform1f(composite.uExposure, 1.6 * s.brightness);
      gl.uniform1f(composite.uGrain, s.grain);
      gl.uniform1f(composite.uTime, state.time % 1000);
      gl.uniform1f(composite.uFade, s.fade);
      gl.uniform1f(composite.uOpacity, s.opacity);
      gl.uniform1f(composite.uLightMode, s.lightMode ? 1 : 0);
      gl.bindVertexArray(quadVao);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindVertexArray(null);
    }

    function focusTarget(view, x) {
      var best = null;
      view.bars.forEach(function (b) {
        if (!best || Math.abs(b.sx - x) < Math.abs(best.sx - x)) best = b;
      });
      return best ? best.Z : DISTANCE;
    }

    function frame(now) {
      raf = 0;
      if (!alive || !visible || document.hidden) return;
      var s = current;
      var dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;
      var moving = !s.paused && !reduce;
      if (moving) state.time += dt * s.speed;
      if (!s.intro || reduce) state.intro = 1;
      else if (state.intro < 1) state.intro = Math.min(1, state.intro + dt / INTRO_SECONDS);

      var engaged = s.mouseInteraction && pointer.inside && !reduce;
      var angle = (s.rotation * Math.PI) / 180;
      var localX =
        Math.cos(angle) * (pointer.x - state.width * 0.5) +
        Math.sin(angle) * (pointer.y - state.height * 0.5) +
        state.width * 0.5;
      var view = layout(s);
      var target = engaged ? focusTarget(view, localX) : DISTANCE;
      state.focusVelocity += (36 * (target - state.focus) - 11 * state.focusVelocity) * dt;
      state.focus += state.focusVelocity * dt;
      state.lift += ((engaged ? 1 : 0) - state.lift) * (1 - Math.exp(-dt / (engaged ? 0.25 : 0.6)));
      state.liftX += (localX - state.liftX) * (1 - Math.exp(-dt / 0.12));

      render(s, view);
      var settling =
        state.intro < 1 ||
        Math.abs(target - state.focus) > 0.001 ||
        Math.abs(state.focusVelocity) > 0.001 ||
        state.lift > 0.002 ||
        engaged;
      if (moving || settling) raf = requestAnimationFrame(frame);
      else last = 0;
    }

    function wake() {
      if (!raf && alive && visible && !document.hidden) raf = requestAnimationFrame(frame);
    }

    function resize() {
      var s = current;
      var width = Math.max(1, container.clientWidth);
      var height = Math.max(1, container.clientHeight);
      var base = Math.min(s.dpr || window.devicePixelRatio || 1, 2);
      var longest = Math.max(width, height) * base;
      var ratio = longest > MAX_RENDER_DIM ? (base * MAX_RENDER_DIM) / longest : base;
      state.width = width;
      state.height = height;
      canvas.width = Math.max(1, Math.round(width * ratio));
      canvas.height = Math.max(1, Math.round(height * ratio));
      if (!raf) render(s);
      wake();
    }

    function onPointerMove(event) {
      var rect = container.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.inside = pointer.x >= 0 && pointer.y >= 0 && pointer.x <= rect.width && pointer.y <= rect.height;
      wake();
    }
    function onPointerLeave() { pointer.inside = false; wake(); }
    function onVisibility() { last = 0; wake(); }

    var resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    var intersection = new IntersectionObserver(function (entries) {
      visible = entries.some(function (e) { return e.isIntersecting; });
      if (visible) { last = 0; wake(); }
    });
    intersection.observe(container);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onPointerLeave);
    document.addEventListener('visibilitychange', onVisibility);
    resize();

    return {
      update: function (opts) {
        current = normalise(Object.assign({}, initial, opts));
        if (!raf) render(current);
        wake();
      },
      destroy: function () {
        alive = false;
        cancelAnimationFrame(raf);
        resizeObserver.disconnect();
        intersection.disconnect();
        window.removeEventListener('pointermove', onPointerMove);
        document.documentElement.removeEventListener('pointerleave', onPointerLeave);
        document.removeEventListener('visibilitychange', onVisibility);
        canvas.remove();
      }
    };
  }

  // js/hero-bg.js decides when to start it (and which background to show).
  window.SlicedWaves = {
    mount: mount,
    optionsFor: function (dark) { return Object.assign({}, OPTIONS, dark ? DARK : LIGHT); }
  };
})();
