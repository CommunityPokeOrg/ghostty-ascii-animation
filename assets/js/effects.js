// Interactive effects panel for the Ghostty ASCII animation demo.
// Every control maps to a CSS custom property on :root (see effects.css),
// so changes apply live without touching the animation driver.
// Settings persist in localStorage.

(function () {
  "use strict";

  const STORAGE_KEY = "ghostty-ascii-fx";

  const FONT_STACKS = {
    jetbrains: '"JetBrains Mono", monospace',
    vt323: '"VT323", "JetBrains Mono", monospace',
    firacode: '"Fira Code", "JetBrains Mono", monospace',
    plex: '"IBM Plex Mono", "JetBrains Mono", monospace',
    courier: '"Courier New", Courier, monospace',
  };

  const PHOSPHOR = {
    default: { fg: "#c3c3c4", accent: "#3551f3" },
    amber: { fg: "#ffb000", accent: "#ffd27a" },
    green: { fg: "#33ff66", accent: "#8affc1" },
  };

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
    afterglow: false,
    afterglowBlur: 8,
    scanlines: false,
    scanlineOpacity: 0.25,
    flicker: false,
    flickerAmp: 0.08,
    vignette: false,
    ca: false,
    caAmp: 1,
    curve: 0,
    noise: false,
    noiseOpacity: 0.08,
    font: "jetbrains",
    phosphor: "default",
    lineHeight: 1.3,
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

  function applyCA() {
    setVar("--fx-ca", (state.ca ? state.caAmp : 0) + "px");
  }

  function applyAfterglow() {
    setVar("--fx-afterglow", (state.afterglow ? state.afterglowBlur : 0) + "px");
  }

  function applyNoise() {
    setVar("--fx-noise", state.noise ? state.noiseOpacity : 0);
    setOverlay("fx-noise-overlay", state.noise);
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
    afterglow: applyAfterglow,
    afterglowBlur: applyAfterglow,
    scanlineOpacity: (v) => setVar("--fx-scanline-opacity", v),
    flickerAmp: (v) => setVar("--fx-flicker-amp", v),
    ca: applyCA,
    caAmp: applyCA,
    curve: (v) => setVar("--fx-curve", v + "deg"),
    noise: applyNoise,
    noiseOpacity: applyNoise,
    font: (v) => setVar("--fx-font", FONT_STACKS[v] || FONT_STACKS.jetbrains),
    phosphor: (v) => {
      const p = PHOSPHOR[v] || PHOSPHOR.default;
      setVar("--fx-fg-color", p.fg);
      setVar("--fx-accent-color", p.accent);
    },
    lineHeight: (v) => setVar("--fx-line-height", v),
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
    afterglowBlur: (v) => v + "px",
    letterSpacing: (v) => v + "px",
    caAmp: (v) => v + "px",
    curve: (v) => v + "°",
    scale: (v) => v + "×",
    scanlineOpacity: (v) => v,
    flickerAmp: (v) => v,
    noiseOpacity: (v) => v,
    lineHeight: (v) => v,
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
      input.addEventListener("change", onInput); // <select> reliably fires change
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
