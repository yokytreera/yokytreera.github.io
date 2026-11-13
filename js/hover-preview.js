/*
  Hover preview for project links (used on the About page).

  Hover over a link to a project and a small card appears above it with the
  project's picture, title and one-line summary. The card content is read from
  the Projects page, so it always matches what you wrote in each project's
  title / description / image. Nothing to update here when projects change.

  - Only runs on devices with a mouse or trackpad (not phones or tablets).
  - Also shows when a link gets keyboard focus.
  - Respects "reduce motion": the card fades without moving.
  - If anything fails (e.g. opening the page as a file), links just work as normal.
*/
(function () {
  if (!window.fetch || !window.DOMParser) return;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  var meta = document.querySelector('meta[name="quarto:offset"]');
  var root = new URL(meta ? meta.content : "./", location.href);
  var listURL = new URL("projects/index.html", root);
  var PROJECT = /\/projects\/[^\/]+\/(index\.html)?$/;

  var links = Array.prototype.filter.call(
    document.querySelectorAll("main a[href]"),
    function (a) { return PROJECT.test(new URL(a.href, location.href).pathname); }
  );
  if (!links.length) return;

  // ---- read the Projects page once ---------------------------------------------
  var loading = null;
  function key(url) { return new URL(url, location.href).pathname.replace(/index\.html$/, ""); }
  function text(el) { return el ? el.textContent.replace(/\s+/g, " ").trim() : ""; }
  function load() {
    if (!loading) {
      loading = fetch(listURL.href)
        .then(function (r) { return r.ok ? r.text() : ""; })
        .then(function (html) {
          var out = {};
          var doc = new DOMParser().parseFromString(html, "text/html");
          doc.querySelectorAll("a.quarto-grid-link").forEach(function (a) {
            var img = a.querySelector("img");
            var src = img ? new URL(img.getAttribute("src"), listURL).href : null;
            if (src && /placeholder/.test(src)) src = null;
            out[key(new URL(a.getAttribute("href"), listURL).href)] = {
              title: text(a.querySelector(".listing-title")),
              desc: text(a.querySelector(".listing-description")),
              img: src
            };
          });
          return out;
        })
        .catch(function () { return {}; });
    }
    return loading;
  }

  // ---- the card -------------------------------------------------------------
  var card = document.createElement("div");
  card.className = "hp-card";
  card.setAttribute("aria-hidden", "true");
  card.innerHTML = '<img class="hp-img" alt="" decoding="async"><div class="hp-body"><div class="hp-t"></div><div class="hp-d"></div></div>';
  document.body.appendChild(card);
  var cImg = card.querySelector(".hp-img"), cT = card.querySelector(".hp-t"), cD = card.querySelector(".hp-d");
  var current = null, timer = null;

  function place(link, x, y) {
    var rects = link.getClientRects();
    var r = rects[0];
    for (var i = 0; i < rects.length; i++) {           // the line of the link under the pointer
      if (y >= rects[i].top - 2 && y <= rects[i].bottom + 2) { r = rects[i]; break; }
    }
    var w = card.offsetWidth, h = card.offsetHeight, gap = 10, pad = 12;
    var cx = (x == null) ? r.left + r.width / 2 : x;
    var left = Math.min(Math.max(cx - w / 2, pad), window.innerWidth - w - pad);
    var top = r.top - h - gap;
    card.classList.toggle("below", top < pad);
    if (top < pad) top = r.bottom + gap;
    card.style.left = left + "px";
    card.style.top = top + "px";
  }

  function show(link, x, y) {
    clearTimeout(timer);
    timer = setTimeout(function () {
      load().then(function (data) {
        var d = data[key(link.href)];
        if (!d || current !== link) return;
        cT.textContent = d.title;
        cD.textContent = d.desc;
        if (d.img) { cImg.src = d.img; cImg.hidden = false; } else { cImg.hidden = true; cImg.removeAttribute("src"); }
        place(link, x, y);
        card.classList.add("is-on");
      });
    }, 90);
  }
  function hide() {
    clearTimeout(timer);
    current = null;
    card.classList.remove("is-on");
  }

  links.forEach(function (a) {
    if (finePointer) {
      a.addEventListener("mouseenter", function (e) { current = a; load(); show(a, e.clientX, e.clientY); });
      a.addEventListener("mouseleave", hide);
    }
    a.addEventListener("focus", function () { current = a; show(a, null, null); });
    a.addEventListener("blur", hide);
  });
  window.addEventListener("scroll", hide, { passive: true });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") hide(); });
})();
