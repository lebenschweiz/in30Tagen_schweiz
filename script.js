(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var config = window.LP_CONFIG || {};

  /* ---------- Scroll: Fortschritt, Header, Sticky-CTA, Zeitleiste ---------- */
  var progress = document.querySelector(".scroll-progress");
  var header = document.querySelector(".site-header");
  var stickyCta = document.querySelector(".sticky-cta");
  var hero = document.querySelector(".hero");
  var applySection = document.getElementById("bewerben");
  var timeline = document.querySelector(".timeline");
  var railFill = document.getElementById("rail-fill");
  var phases = Array.prototype.slice.call(document.querySelectorAll(".phase"));
  var heroGlow = document.querySelector(".hero-glow");
  var ticking = false;

  function onScroll() {
    var y = window.scrollY;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = "scaleX(" + (max > 0 ? y / max : 0) + ")";
    header.classList.toggle("scrolled", y > 8);

    // Sticky-CTA nur zwischen Hero und Formular zeigen
    var heroBottom = hero.offsetTop + hero.offsetHeight;
    var applyTop = applySection.getBoundingClientRect().top;
    var applyBottom = applySection.getBoundingClientRect().bottom;
    var inApply = applyTop < window.innerHeight && applyBottom > 0;
    stickyCta.classList.toggle("show", y > heroBottom - 100 && !inApply);

    // Zeitleiste füllt sich mit dem Scrollen
    if (timeline) {
      var r = timeline.getBoundingClientRect();
      var start = window.innerHeight * 0.6;
      var p = Math.min(1, Math.max(0, (start - r.top) / r.height));
      railFill.style.transform = "scaleY(" + p + ")";
      phases.forEach(function (ph) {
        var node = ph.querySelector(".phase-node").getBoundingClientRect();
        ph.classList.toggle("active", node.top < start);
      });
    }

    // Leichter Parallax-Effekt für das Leuchten im Hero
    if (heroGlow && !reduceMotion && y < window.innerHeight) {
      heroGlow.style.transform = "translate(-50%, " + y * 0.35 + "px)";
    }
    ticking = false;
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  /* ---------- Reveal beim Scrollen ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- Zahlen hochzählen ---------- */
  function countUp(el, to, duration, onTick) {
    if (reduceMotion) { onTick(to, 1); return; }
    var t0 = null;
    function frame(t) {
      if (!t0) t0 = t;
      var k = Math.min(1, (t - t0) / duration);
      var eased = 1 - Math.pow(1 - k, 3);
      onTick(Math.round(to * eased), eased);
      if (k < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function whenVisible(el, cb) {
    if (!("IntersectionObserver" in window)) { cb(); return; }
    var o = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { o.disconnect(); cb(); }
    }, { threshold: 0.4 });
    o.observe(el);
  }

  // Hero-Karte: Tag 0 → 90, Ziele haken sich ab
  var dayCount = document.getElementById("day-count");
  var dayBar = document.getElementById("day-bar");
  var goals = Array.prototype.slice.call(document.querySelectorAll(".journey-list li"));
  if (dayCount) {
    setTimeout(function () {
      countUp(dayCount, 90, 2600, function (v, k) {
        dayCount.textContent = v;
        dayBar.style.transform = "scaleX(" + k + ")";
        goals.forEach(function (g) {
          if (v >= +g.dataset.day) g.classList.add("done");
        });
      });
    }, 700);
  }

  document.querySelectorAll("[data-count]").forEach(function (el) {
    var to = +el.dataset.count;
    el.textContent = "0";
    whenVisible(el, function () {
      countUp(el, to, 1200, function (v) { el.textContent = v; });
    });
  });

  /* ---------- Spotlight, Magnet-Buttons und Tilt (nur mit Maus) ---------- */
  if (finePointer && !reduceMotion) {
    document.querySelectorAll(".spotlight, .card, .btn-primary").forEach(function (el) {
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty("--mx", e.clientX - r.left + "px");
        el.style.setProperty("--my", e.clientY - r.top + "px");
      });
    });

    document.querySelectorAll(".magnetic").forEach(function (el) {
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        var dx = (e.clientX - r.left - r.width / 2) * 0.18;
        var dy = (e.clientY - r.top - r.height / 2) * 0.3;
        el.style.transform = "translate(" + dx + "px," + dy + "px)";
      });
      el.addEventListener("pointerleave", function () { el.style.transform = ""; });
    });

    document.querySelectorAll(".tilt").forEach(function (el) {
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = "perspective(900px) rotateX(" + (-py * 6) + "deg) rotateY(" + (px * 8) + "deg)";
      });
      el.addEventListener("pointerleave", function () { el.style.transform = ""; });
    });
  }

  /* ---------- Phasen-Akkordeon ---------- */
  phases.forEach(function (ph) {
    var btn = ph.querySelector(".phase-toggle");
    btn.addEventListener("click", function () {
      var open = !ph.classList.contains("open");
      ph.classList.toggle("open", open);
      btn.setAttribute("aria-expanded", String(open));
    });
  });

  /* ---------- FAQ ---------- */
  document.querySelectorAll(".faq-item").forEach(function (item) {
    var btn = item.querySelector(".faq-q");
    btn.addEventListener("click", function () {
      var open = !item.classList.contains("open");
      document.querySelectorAll(".faq-item.open").forEach(function (o) {
        if (o !== item) { o.classList.remove("open"); o.querySelector(".faq-q").setAttribute("aria-expanded", "false"); }
      });
      item.classList.toggle("open", open);
      btn.setAttribute("aria-expanded", String(open));
    });
  });

  /* ---------- Preis-Umschalter ---------- */
  var priceSwitch = document.querySelector(".price-switch");
  if (priceSwitch) {
    var priceValue = document.getElementById("price-value");
    var pricePrefix = document.getElementById("price-prefix");
    var priceSub = document.getElementById("price-sub");
    var plans = {
      once: { prefix: "", value: 1950, sub: "einmalig · oder 3 × 690 CHF, insgesamt 2.070 CHF" },
      rates: { prefix: "3 × ", value: 690, sub: "in drei Raten, insgesamt 2.070 CHF · einmalig 1.950 CHF" }
    };
    var fmt = function (n) { return n.toLocaleString("de-CH").replace(/[’']/g, "."); };
    priceSwitch.querySelectorAll("button").forEach(function (b) {
      b.addEventListener("click", function () {
        var plan = plans[b.dataset.plan];
        priceSwitch.querySelectorAll("button").forEach(function (o) { o.setAttribute("aria-pressed", String(o === b)); });
        priceSwitch.classList.toggle("rates", b.dataset.plan === "rates");
        pricePrefix.textContent = plan.prefix;
        priceSub.textContent = plan.sub;
        var from = parseInt(priceValue.textContent.replace(/\D/g, ""), 10) || 0;
        countUp(priceValue, plan.value - from, 500, function (v) { priceValue.textContent = fmt(from + v); });
      });
    });
  }

  /* ---------- Bewerbungsformular ---------- */
  var form = document.getElementById("apply-form");
  if (!form) return;
  var steps = Array.prototype.slice.call(form.querySelectorAll(".step"));
  var stepperItems = Array.prototype.slice.call(document.querySelectorAll(".stepper-item"));
  var current = 0;

  function radios(name) { return form.querySelectorAll('input[name="' + name + '"]'); }

  // Hinweise einblenden, wenn eine Ausschluss-Antwort gewählt wird
  form.querySelectorAll("input[type=radio]").forEach(function (r) {
    r.addEventListener("change", function () {
      var hint = form.querySelector('[data-hint-for="' + r.name + '"]');
      if (hint) hint.classList.toggle("show", r.hasAttribute("data-stop"));
      r.closest(".options").classList.remove("invalid");
    });
  });

  // Zeichenzähler für die Freitext-Antwort
  form.querySelectorAll("[data-counter]").forEach(function (ta) {
    var counter = ta.parentNode.querySelector(".counter");
    var goal = +ta.dataset.counter;
    function upd() {
      var n = ta.value.trim().length;
      counter.textContent = n >= goal ? "✓ ausführlich" : n + " / " + goal + " Zeichen empfohlen";
      counter.classList.toggle("ok", n >= goal);
    }
    ta.addEventListener("input", upd);
    upd();
  });

  form.querySelectorAll(".input").forEach(function (inp) {
    inp.addEventListener("input", function () { inp.classList.remove("invalid"); });
  });

  function validate(step) {
    var ok = true;
    var seen = {};
    step.querySelectorAll("input[type=radio][required]").forEach(function (r) {
      if (seen[r.name]) return;
      seen[r.name] = true;
      var checked = Array.prototype.some.call(radios(r.name), function (x) { return x.checked; });
      if (!checked) { ok = false; r.closest(".options").classList.add("invalid"); }
    });
    step.querySelectorAll(".input[required]").forEach(function (inp) {
      var v = inp.value.trim();
      var min = +inp.getAttribute("minlength") || 1;
      var valid = v.length >= min && (inp.type !== "email" || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v));
      if (!valid) { ok = false; inp.classList.add("invalid"); }
    });
    var err = step.querySelector(".form-error");
    err.classList.remove("show");
    if (!ok) { void err.offsetWidth; err.classList.add("show"); }
    return ok;
  }

  function show(i, back) {
    steps[current].classList.remove("active", "back");
    current = i;
    steps[i].classList.add("active");
    steps[i].classList.toggle("back", !!back);
    stepperItems.forEach(function (s, k) {
      s.classList.toggle("done", k < i);
      s.classList.toggle("current", k === i);
    });
    var top = form.closest(".form-shell").getBoundingClientRect().top + window.scrollY - 90;
    if (window.scrollY > top) window.scrollTo({ top: top, behavior: reduceMotion ? "auto" : "smooth" });
    var first = steps[i].querySelector("input, textarea");
    if (first && finePointer) first.focus({ preventScroll: true });
  }

  form.querySelectorAll("[data-next]").forEach(function (b) {
    b.addEventListener("click", function () {
      if (validate(steps[current])) show(current + 1);
    });
  });
  form.querySelectorAll("[data-prev]").forEach(function (b) {
    b.addEventListener("click", function () { show(current - 1, true); });
  });

  // Enter in Textfeldern führt zum nächsten Schritt statt zum Absenden
  form.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && e.target.tagName === "INPUT" && current < steps.length - 1) {
      e.preventDefault();
      steps[current].querySelector("[data-next]").click();
    }
  });

  function collect() {
    var data = {};
    new FormData(form).forEach(function (v, k) { data[k] = v; });
    var params = new URLSearchParams(location.search);
    ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"].forEach(function (k) {
      if (params.get(k)) data[k] = params.get(k);
    });
    data.referrer = document.referrer || "";
    data.vorpruefung = form.querySelector("input[data-stop]:checked") ? "nicht bestanden" : "bestanden";
    data.zeitpunkt = new Date().toISOString();
    return data;
  }

  function showResult(passed, data) {
    form.style.display = "none";
    document.querySelector(".stepper").style.display = "none";
    var el = document.getElementById(passed ? "result-ok" : "result-no");
    el.classList.add("active");
    if (passed && config.calendarUrl) {
      var url = new URL(config.calendarUrl);
      url.searchParams.set("name", data.vorname || "");
      url.searchParams.set("email", data.email || "");
      var frame = document.createElement("iframe");
      frame.className = "calendar-frame";
      frame.title = "Termin für den Aufnahme-Check wählen";
      frame.loading = "lazy";
      frame.src = url.toString();
      document.getElementById("calendar-slot").appendChild(frame);
    }
    el.focus({ preventScroll: true });
    var top = el.getBoundingClientRect().top + window.scrollY - 120;
    window.scrollTo({ top: top, behavior: reduceMotion ? "auto" : "smooth" });
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!validate(steps[current])) return;
    var btn = form.querySelector("button[type=submit]");
    btn.classList.add("loading");
    btn.disabled = true;
    var data = collect();
    var passed = data.vorpruefung === "bestanden";

    var send = config.formEndpoint
      ? fetch(config.formEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(data)
        })
      : Promise.reject(new Error("LP_CONFIG.formEndpoint ist nicht gesetzt"));

    send.catch(function (err) {
      if (window.console) console.warn("Antrag konnte nicht gesendet werden:", err);
    }).then(function () {
      btn.classList.remove("loading");
      showResult(passed, data);
    });
  });
})();
