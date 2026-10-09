// Vanilla JS port of the animated terminal from https://ghostty.org
// (ghostty-org/website, MIT License).
//
// Faithful to the original component:
//   - FrameScheduler: requestAnimationFrame loop ticking at a fixed fps
//   - AnimatedTerminal: cycles frames at ~32 fps (frameLengthMs = 31)
//   - Terminal: macOS / Adwaita window chrome chosen by user agent
//   - Konami code easter egg: up up down down left right left right b a
//     toggles turbo mode (240 fps)
//   - Honors prefers-reduced-motion, pauses on window blur

class FrameScheduler {
  constructor(callback, fps = 30) {
    this.callback = callback;
    this.frameTime = 1000 / fps;
    this._animation = null;
    this.lastFrame = -1;
    this.update = this.update.bind(this);
  }
  updateFPS(fps) {
    this.frameTime = 1000 / fps;
  }
  start() {
    if (this._animation == null) {
      this._animation = requestAnimationFrame(this.update);
    }
  }
  pause() {
    if (this._animation != null) {
      this.lastFrame = -1;
      cancelAnimationFrame(this._animation);
      this._animation = null;
    }
  }
  update(t) {
    let delta = t - this.lastFrame;
    if (this.lastFrame === -1) {
      this.lastFrame = t;
    } else {
      while (delta >= this.frameTime) {
        this.callback();
        delta -= this.frameTime;
        this.lastFrame += this.frameTime;
      }
    }
    this._animation = requestAnimationFrame(this.update);
  }
}

const KONAMI = [
  "arrowup", "arrowup", "arrowdown", "arrowdown",
  "arrowleft", "arrowright", "arrowleft", "arrowright", "b", "a",
];

const ICONS = {
  x: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
  menu: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16"/><path d="M4 12h16"/><path d="M4 19h16"/></svg>',
  layoutGrid: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>',
  squarePlus: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>',
};

function buildTerminal({ columns, rows, fontSize = "medium", title, whitespacePadding = 0 }) {
  const isLinux = /Linux/i.test(window.navigator.userAgent);
  const platform = isLinux ? "adwaita" : "macos";

  const el = document.createElement("div");
  el.className = `terminal font-${fontSize} ${platform}`;
  el.style.setProperty("--columns", columns + 2 * whitespacePadding);
  el.style.setProperty("--rows", rows);

  const controls =
    platform === "adwaita"
      ? `<ul class="window-controls start"><li><span class="icon">${ICONS.squarePlus}</span></li></ul>
         <ul class="window-controls end"><li><span class="icon">${ICONS.layoutGrid}</span></li><li><span class="icon">${ICONS.menu}</span></li><li class="circular-button"><span class="icon">${ICONS.x}</span></li></ul>`
      : `<ul class="window-controls start"><li class="circular-button"></li><li class="circular-button"></li><li class="circular-button"></li></ul>`;

  el.innerHTML = `
    <div class="header">${controls}<p class="title">${title}</p></div>
    <code class="content disable-scrolling"></code>`;
  return el;
}

function AnimatedTerminal(parent, {
  columns, rows, fontSize, title, frames, whitespacePadding, frameLengthMs,
}) {
  const fps = 1000 / frameLengthMs;
  const pad = " ".repeat(whitespacePadding);
  const termEl = buildTerminal({ columns, rows, fontSize, title, whitespacePadding });
  const contentEl = termEl.querySelector(".content");
  parent.appendChild(termEl);

  let frameIndex = 0;
  const render = () => {
    contentEl.innerHTML = frames[frameIndex]
      .map((line) => `<div>${pad}${line}${pad}</div>`)
      .join("");
  };

  const scheduler = new FrameScheduler(() => {
    frameIndex = (frameIndex + 1) % frames.length;
    render();
  }, fps);

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    render(); // static first frame, no animation
    return;
  }

  const start = () => scheduler.start();
  const pause = () => scheduler.pause();
  const progress = [];
  const onKey = (e) => {
    const key = e.key.toLowerCase();
    if (KONAMI[progress.length] === key) progress.push(key);
    else progress.length = 0;
    if (progress.length === KONAMI.length) {
      scheduler.updateFPS(scheduler.frameTime === 1000 / fps ? 240 : fps);
      progress.length = 0;
    }
  };

  window.addEventListener("focus", start);
  window.addEventListener("blur", pause);
  window.addEventListener("keyup", onKey);
  if (document.visibilityState === "visible") scheduler.start();
  render();
}

// --- bootstrap -----------------------------------------------------------

function fontSizeFor(w, h) {
  const s = w > 1100 ? "small" : w > 674 ? "tiny" : "xtiny";
  const o = h > 900 ? "small" : h > 750 ? "tiny" : "xtiny";
  for (const e of ["xtiny", "tiny", "small"]) {
    if (s === e || o === e) return e;
  }
  return "small";
}

function init() {
  const data = window.GHOSTTY_TERMINAL_DATA || {};
  const frames = Object.keys(data)
    .filter((k) => k.startsWith("home/animation_frames"))
    .sort()
    .map((k) => data[k]);

  const wrapper = document.getElementById("terminal-wrapper");
  const size = fontSizeFor(window.innerWidth, window.innerHeight);
  const pad = window.innerWidth > 950 ? 20 : window.innerWidth > 850 ? 10 : 0;

  AnimatedTerminal(wrapper, {
    title: "\ud83d\udc7b Ghostty",
    fontSize: size,
    whitespacePadding: pad,
    columns: 100,
    rows: 41,
    frames,
    frameLengthMs: 31,
  });
}

document.addEventListener("DOMContentLoaded", init);
