// Interactive effects panel for the Ghostty ASCII animation demo.
// Every control maps to a CSS custom property on :root (see effects.css),
// so changes apply live without touching the animation driver.
// Settings persist in localStorage.

(function () {
  "use strict";

  const STORAGE_KEY = "ghostty-ascii-fx";

  const DEFAULTS = {
    hue: 0,
    brightness: 1,
    contrast: 1,
    saturate: 1,
    grayscale: 0,
    invert: false,
    glowColor: "#3551f3",
    glowBlur: 0,
    glowSpread: 0,
    scanlines: false,
    scanlineOpacity: 0.25,
    flicker: false,
    flickerAmp: 0.08,
    vignette: false,
    letterSpacing: 0,
    scale: 1,
  };

  const root = document.documentElement;
  const state = loadSettings();

  function loadSettings() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return { ...DEFAULTS, ...saved };
    } catch {
      return { ...DEFAULTS };
    }
  }

  function saveSettings() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage unavailable — effects still work for the session */
    }
  }

  function setVar(name, value) {
    root.style.setProperty(name, value);
  }

  const APPLIERS = {
    hue: (v) => setVar("--fx-hue", v + "deg"),
    brightness: (v) => setVar("--fx-brightness", v),
    contrast: (v) => setVar("--fx-contrast", v),
    saturate: (v) => setVar("--fx-saturate", v),
    grayscale: (v) => setVar("--fx-grayscale", v),
    invert: (v) => setVar("--fx-invert", v ? 1 : 0),
    glowColor: (v) => setVar("--fx-glow-color", v),
    glowBlur: (v) => setVar("--fx-glow-blur", v + "px"),
    glowSpread: (v) => setVar("--fx-glow-spread", v + "px"),
    scanlineOpacity: (v) => setVar("--fx-scanline-opacity", v),
    flickerAmp: (v) => setVar("--fx-flicker-amp", v),
    letterSpacing: (v) => setVar("--fx-letter-spacing", v + "px"),
    scale: (v) => setVar("--fx-scale", v),
    scanlines: (v) => setOverlay("fx-scanlines-overlay", v),
    flicker: (v) => setOverlay("fx-flicker-overlay", v),
    vignette: (v) => setOverlay("fx-vignette-overlay", v),
  };

  const FORMATTERS = {
    hue: (v) => v + "°",
    glowBlur: (v) => v + "px",
    glowSpread: (v) => v + "px",
    letterSpacing: (v) => v + "px",
    scale: (v) => v + "×",
    scanlineOpacity: (v) => v,
    flickerAmp: (v) => v,
    brightness: (v) => v,
    contrast: (v) => v,
    saturate: (v) => v,
    grayscale: (v) => v,
  };

  function setOverlay(id, on) {
    const el = document.getElementById(id);
    if (el) el.hidden = !on;
  }

  function applyAll() {
    for (const key of Object.keys(APPLIERS)) {
      APPLIERS[key](state[key]);
    }
  }

  function syncControls() {
    document.querySelectorAll("[data-fx]").forEach((input) => {
      const key = input.dataset.fx;
      if (input.type === "checkbox") input.checked = Boolean(state[key]);
      else input.value = state[key];
      updateOutput(key);
    });
  }

  function updateOutput(key) {
    const input = document.querySelector(`[data-fx="${key}"]`);
    if (!input) return;
    const out = document.getElementById(input.id + "-out");
    if (!out) return;
    const fmt = FORMATTERS[key] || ((v) => v);
    out.textContent = fmt(state[key]);
  }

  function onInput(e) {
    const key = e.target.dataset.fx;
    if (!key) return;
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    state[key] = e.target.type === "range" ? Number(value) : value;
    APPLIERS[key](state[key]);
    updateOutput(key);
    saveSettings();
  }

  function init() {
    const toggle = document.getElementById("fx-toggle");
    const panel = document.getElementById("fx-panel");
    if (!toggle || !panel) return;

    const setOpen = (open) => {
      panel.hidden = !open;
      toggle.setAttribute("aria-expanded", String(open));
    };

    toggle.addEventListener("click", () => setOpen(panel.hidden));

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !panel.hidden) {
        setOpen(false);
        toggle.focus();
      }
    });

    document.querySelectorAll("[data-fx]").forEach((input) => {
      input.addEventListener("input", onInput);
    });

    const reset = document.getElementById("fx-reset");
    if (reset) {
      reset.addEventListener("click", () => {
        Object.assign(state, DEFAULTS);
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch {}
        syncControls();
        applyAll();
      });
    }

    syncControls();
    applyAll();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
