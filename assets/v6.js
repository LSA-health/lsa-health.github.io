// LabSense v6: progressive enhancement only. Without this file every journey step is shown in order.
// From v5 site.js, with two changes: the page is not scrolled on load, and links to #jpN open that step.
(function () {
  "use strict";
  document.documentElement.classList.add("js");

  function initJourney(root) {
    var tabs = Array.prototype.slice.call(root.querySelectorAll('[role="tab"]'));
    var panels = tabs.map(function (t) { return document.getElementById(t.getAttribute("aria-controls")); });
    function select(i, focus, reveal) {
      tabs.forEach(function (t, k) {
        var on = k === i;
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.tabIndex = on ? 0 : -1;
        panels[k].hidden = !on;
        if (on && reveal) {
          panels[k].classList.remove("enter");
          void panels[k].offsetWidth;
          panels[k].classList.add("enter");
        }
      });
      if (focus) tabs[i].focus();
      if (reveal) tabs[i].scrollIntoView({ block: "nearest", inline: "nearest" });
    }
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { select(i, false, true); });
      t.addEventListener("keydown", function (e) {
        var n = tabs.length, j = null;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") j = (i + 1) % n;
        else if (e.key === "ArrowLeft" || e.key === "ArrowUp") j = (i - 1 + n) % n;
        else if (e.key === "Home") j = 0;
        else if (e.key === "End") j = n - 1;
        if (j !== null) { e.preventDefault(); select(j, true, true); }
      });
    });
    function fromHash() {
      var k = panels.map(function (p) { return "#" + p.id; }).indexOf(location.hash);
      if (k >= 0) { select(k, false, false); root.scrollIntoView({ block: "start" }); tabs[k].focus({ preventScroll: true }); return true; }
      return false;
    }
    window.addEventListener("hashchange", fromHash);
    if (!fromHash()) select(0, false, false);
  }

  // v7: compact menu on narrow screens. Without this file the links simply wrap under the brand.
  function initMenu() {
    var btn = document.querySelector(".menu-btn"), nav = document.getElementById("site-nav");
    if (!btn || !nav) return;
    function set(open, focusBtn) {
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      nav.classList.toggle("open", open);
      if (!open && focusBtn) btn.focus();
    }
    btn.addEventListener("click", function () { set(btn.getAttribute("aria-expanded") !== "true", false); });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) set(false, false); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && btn.getAttribute("aria-expanded") === "true") set(false, true);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    Array.prototype.forEach.call(document.querySelectorAll("[data-journey]"), initJourney);
    initMenu();
  });
})();
