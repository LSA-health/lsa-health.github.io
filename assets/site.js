// LabSense site behaviour (Lane WS2). No network request, no storage, no tracking.
// Without JavaScript every stop of the worked case is shown in order and every card detail is open.
(function () {
  "use strict";
  var root = document.documentElement;
  root.classList.add("js");

  // mobile menu
  var btn = document.querySelector(".menu-btn");
  var nav = document.getElementById("site-nav");
  if (btn && nav) {
    var close = function (focusBtn) {
      nav.classList.remove("open");
      btn.setAttribute("aria-expanded", "false");
      if (focusBtn) btn.focus();
    };
    btn.addEventListener("click", function () {
      var open = !nav.classList.contains("open");
      nav.classList.toggle("open", open);
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) { var first = nav.querySelector("a"); if (first) first.focus(); }
    });
    nav.addEventListener("click", function (e) {
      var a = e.target.closest("a");
      if (!a) return;
      var wasOpen = nav.classList.contains("open");
      close(false);
      // same-page section links from the open menu: scroll and focus the section ourselves, after the menu has closed
      var u = new URL(a.href, location.href);
      if (wasOpen && u.pathname === location.pathname && u.hash && u.hash.indexOf("#stop-") !== 0) {
        var target = document.getElementById(decodeURIComponent(u.hash.slice(1)));
        if (target) {
          e.preventDefault();
          history.replaceState(null, "", u.hash);
          var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
          var h = target.querySelector("h2, h1") || target;
          if (!h.hasAttribute("tabindex")) h.setAttribute("tabindex", "-1");
          h.focus({ preventScroll: true });
        }
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("open")) close(true);
    });
  }

  // worked case: one tab list, one panel at a time, Previous and Next
  var tabs = Array.prototype.slice.call(document.querySelectorAll(".stops [role=tab]"));
  var stops = tabs.map(function (t) { return document.getElementById(t.getAttribute("aria-controls")); });
  var prev = document.querySelector(".stop-nav .prev");
  var next = document.querySelector(".stop-nav .next");
  var pos = document.querySelector(".stop-nav .pos");
  var endBox = document.getElementById("case-end");
  var restart = document.querySelector(".case-end .restart");
  var cur = 0;
  function show(i, focusWhat) {
    if (!tabs.length) return;
    i = Math.max(0, Math.min(tabs.length - 1, i));
    cur = i;
    tabs.forEach(function (t, k) {
      var on = k === i;
      t.setAttribute("aria-selected", on ? "true" : "false");
      t.tabIndex = on ? 0 : -1;
      stops[k].hidden = !on;
    });
    if (prev) prev.disabled = i === 0;
    var last = i === tabs.length - 1;
    if (next) { next.hidden = last; next.disabled = false; }
    if (endBox) endBox.hidden = !last;
    if (pos) pos.textContent = (window.matchMedia("(max-width: 620px)").matches ? "Step " : "Stop ") + (i + 1) + " of " + tabs.length;
    var strip = tabs[i].closest(".stops");
    if (strip && strip.scrollWidth > strip.clientWidth) strip.scrollLeft = Math.max(0, tabs[i].parentNode.offsetLeft - 12);
    if (focusWhat === "tab") tabs[i].focus();
    if (focusWhat === "heading") {
      var h = stops[i].querySelector("h3");
      if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); }
      var frame = document.getElementById("case-frame");
      if (frame && frame.getBoundingClientRect().top < 0) frame.scrollIntoView({ block: "start" });
    }
  }
  if (tabs.length) {
    // the stop sections are tab panels only when scripting runs
    stops.forEach(function (s, k) {
      s.setAttribute("role", "tabpanel");
      s.setAttribute("aria-labelledby", tabs[k].id);
      s.tabIndex = -1;
    });
    tabs.forEach(function (t, k) {
      t.addEventListener("click", function () { show(k); });
      t.addEventListener("keydown", function (e) {
        var key = e.key, n = tabs.length;
        if (key === "ArrowDown" || key === "ArrowRight") { e.preventDefault(); show((k + 1) % n, "tab"); }
        else if (key === "ArrowUp" || key === "ArrowLeft") { e.preventDefault(); show((k - 1 + n) % n, "tab"); }
        else if (key === "Home") { e.preventDefault(); show(0, "tab"); }
        else if (key === "End") { e.preventDefault(); show(n - 1, "tab"); }
      });
    });
    if (prev) prev.addEventListener("click", function () { show(cur - 1, "heading"); });
    if (next) next.addEventListener("click", function () { show(cur + 1, "heading"); });
    if (restart) restart.addEventListener("click", function () { show(0, "heading"); });
    var fromHash = function () {
      var m = /^#stop-(\d+)$/.exec(location.hash);
      if (m) { show(+m[1] - 1); var f = document.getElementById("case-frame"); if (f) f.scrollIntoView({ block: "start" }); }
    };
    show(0);
    fromHash();
    window.addEventListener("hashchange", fromHash);
    // links inside the page that point at a stop
    document.addEventListener("click", function (e) {
      var a = e.target.closest("a[href^='#stop-']");
      if (!a) return;
      var m = /^#stop-(\d+)$/.exec(a.getAttribute("href"));
      if (m) { e.preventDefault(); show(+m[1] - 1, "heading"); history.replaceState(null, "", a.getAttribute("href")); }
    });
  }

  // copy the contact address: clipboard API in the click handler, otherwise select the text for the visitor
  Array.prototype.forEach.call(document.querySelectorAll(".copy-btn"), function (b) {
    var src = document.getElementById(b.getAttribute("data-copy"));
    var status = b.parentNode.querySelector(".copy-status");
    var say = function (m) { if (status) status.textContent = m; };
    var selectIt = function () {
      var r = document.createRange(); r.selectNodeContents(src);
      var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
    };
    b.addEventListener("click", function () {
      var text = src.textContent.trim();
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(function () { say("Address copied"); }, function () { selectIt(); say("Address selected: press Ctrl+C or Command+C to copy"); });
      } else { selectIt(); say("Address selected: press Ctrl+C or Command+C to copy"); }
    });
  });

  // results cards: More detail
  Array.prototype.forEach.call(document.querySelectorAll(".ac-more"), function (b) {
    var d = document.getElementById(b.getAttribute("aria-controls"));
    if (!d) return;
    var label = b.querySelector(".lbl");
    var set = function (open) {
      d.hidden = !open;
      var card = b.closest(".acard"); if (card) card.classList.toggle("is-open", open);
      b.setAttribute("aria-expanded", open ? "true" : "false");
      if (label) label.textContent = open ? "Less detail" : "More detail";
    };
    set(false);
    b.addEventListener("click", function () { set(d.hidden); });
    b.closest(".acard").addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !d.hidden) { set(false); b.focus(); }
    });
  });
})();

// Round 10c: interactive transcript. Without JavaScript it is a plain list of timed lines.
// With JavaScript each line's time becomes a button that seeks the film, and the current line is highlighted during playback.
(function () {
  document.querySelectorAll("[data-tx]").forEach(function (box) {
    var scope = box.closest("section");
    var video = scope && scope.querySelector("video");
    if (!video) return;
    var items = Array.prototype.slice.call(box.querySelectorAll(".tx-list > li"));
    var list = box.querySelector(".tx-list");
    box.classList.add("tx-on");
    items.forEach(function (li) {
      var t = li.querySelector(".tx-t");
      var b = document.createElement("button");
      b.type = "button";
      b.className = "tx-b";
      b.textContent = t.textContent;
      b.setAttribute("aria-label", "Play from " + t.textContent + ": " + li.querySelector(".tx-x").textContent);
      t.replaceWith(b);
      b.addEventListener("click", function () {
        var t = parseFloat(li.getAttribute("data-start")) + 0.01;
        var playing = !video.paused;
        var go = function () { video.currentTime = t; if (playing) { var p = video.play(); if (p && p.catch) p.catch(function () {}); } mark(); };
        if (video.readyState >= 1) go();
        else { video.addEventListener("loadedmetadata", go, { once: true }); video.preload = "metadata"; video.load(); }
      });
    });
    var last = -1;
    function mark() {
      var now = video.currentTime, idx = -1;
      for (var i = 0; i < items.length; i++) {
        if (now >= parseFloat(items[i].getAttribute("data-start")) && now < parseFloat(items[i].getAttribute("data-end")) + 0.15) { idx = i; break; }
      }
      if (idx === last) return;
      if (last >= 0) { items[last].classList.remove("now"); items[last].removeAttribute("aria-current"); }
      if (idx >= 0) {
        items[idx].classList.add("now"); items[idx].setAttribute("aria-current", "true");
        var li = items[idx];
        if (li.offsetTop < list.scrollTop || li.offsetTop + li.offsetHeight > list.scrollTop + list.clientHeight) list.scrollTop = li.offsetTop - list.offsetTop - 8;
      }
      last = idx;
    }
    video.addEventListener("timeupdate", mark);
    video.addEventListener("seeked", mark);
  });
})();

// Round 12b: in-page section links scroll smoothly (instantly with reduced motion) under the sticky header,
// update the address with replaceState (no history entry per click) and move focus to the section heading.
(function () {
  document.addEventListener("click", function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest("a[href*='#']");
    if (!a) return;
    var u = new URL(a.href, location.href);
    if (u.pathname !== location.pathname || !u.hash || u.hash.indexOf("#stop-") === 0) return;
    var target = document.getElementById(decodeURIComponent(u.hash.slice(1)));
    if (!target) return;
    e.preventDefault();
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    history.replaceState(null, "", u.hash);
    var h = target.matches("h1,h2,h3") ? target : (target.querySelector("h2, h1, h3") || target);
    if (!h.hasAttribute("tabindex")) h.setAttribute("tabindex", "-1");
    h.focus({ preventScroll: true });
  });
})();

// Round 12b: evaluation request dialog. It composes an email in the visitor's own mail program; nothing is stored or sent here.
(function () {
  var dlg = document.getElementById("eval-dlg");
  var open = document.querySelector(".eval-open");
  if (!dlg || !open || typeof dlg.showModal !== "function") return;
  open.hidden = false;
  var plain = open.parentNode.querySelector("a[href^='mailto:']"); if (plain) plain.hidden = true;
  var form = document.getElementById("eval-form");
  var err = form.querySelector(".eval-err");
  var addr = (document.getElementById("contact-addr") || {}).textContent || "";
  open.addEventListener("click", function () { err.hidden = true; dlg.showModal(); var f = form.querySelector("input"); if (f) f.focus(); });
  form.querySelector(".eval-cancel").addEventListener("click", function () { dlg.close(); });
  dlg.addEventListener("close", function () { open.focus(); });
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var v = function (id) { return document.getElementById(id).value.trim(); };
    var name = v("ev-name"), role = v("ev-role"), inst = v("ev-inst"), obj = v("ev-obj");
    if (!name || !role || !inst || !obj) { err.hidden = false; var first = [["ev-name", name], ["ev-role", role], ["ev-inst", inst], ["ev-obj", obj]].filter(function (x) { return !x[1]; })[0]; document.getElementById(first[0]).focus(); return; }
    var body = "Name: " + name + "\r\nRole or specialty: " + role + "\r\nInstitution: " + inst + "\r\nEvaluation objective: " + obj + "\r\n\r\n(No real patient records are included in this message.)";
    var href = "mailto:" + addr.trim() + "?subject=" + encodeURIComponent("LabSense supervised evaluation request") + "&body=" + encodeURIComponent(body);
    dlg.setAttribute("data-mailto", href);
    dlg.close();
    window.location.href = href;
  });
})();
