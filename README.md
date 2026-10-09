# Ghostty ASCII Animation

A standalone, dependency-free demo of the ASCII terminal animation shown on
the [ghostty.org](https://ghostty.org) homepage — the little terminal window
that renders the Ghostty ghost out of ASCII characters.

Everything was extracted directly from the live site (Next.js RSC payload +
JS chunk). The upstream site is open source at
[ghostty-org/website](https://github.com/ghostty-org/website) under the MIT
License.

## What was extracted

| Piece | Source | In this repo |
|---|---|---|
| 235 animation frames (41 rows × 100 cols, `<span class="b">` = brand blue) | `terminalData` in the page's RSC stream | `extracted/terminalData.json`, `assets/js/frames.js` |
| Animation driver (`FrameScheduler` rAF loop, ~32 fps, `frameLengthMs: 31`) | Turbopack chunk `f7c68759b3ddecfd.js` (module `86970`) | `extracted/ghostty-home-chunk.js` (original), `assets/js/terminal.js` (vanilla port) |
| Terminal chrome CSS (macOS + Adwaita variants, font-size scale, design tokens) | `Terminal.module.css` / `globals.css` | `extracted/ghostty-terminal.css` (original), `assets/css/terminal.css` (port) |
| JetBrains Mono subset (Latin) | `_next/static/media/*.woff2` | `assets/fonts/jetbrains-mono.woff2` |

Faithful details carried over:

- macOS traffic-light chrome, or GNOME/Adwaita chrome on Linux user agents
- Responsive font size (`xtiny` / `tiny` / `small`) and whitespace padding
  based on viewport size
- `prefers-reduced-motion` renders a static first frame
- Pauses on window blur, resumes on focus
- **Konami code easter egg**: `↑ ↑ ↓ ↓ ← → ← → B A` toggles 240 fps turbo mode

## Run locally

No build step — it's a static page:

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

Opening `index.html` directly from disk also works.

## Deploy to GitHub Pages

The repo ships `.github/workflows/pages.yml`, a standard static-site deploy
(`actions/upload-pages-artifact` + `actions/deploy-pages`) that publishes the
repository root on every push to `main`.

One-time setup:

1. Repo **Settings → Pages → Build and deployment → Source** → select
   **GitHub Actions**.
2. Push to `main` (or run the workflow manually) — the demo goes live at
   `https://<org>.github.io/ghostty-ascii-animation/`.

## Files

```
index.html                      demo page
assets/css/terminal.css         ported terminal styles + design tokens
assets/js/terminal.js           vanilla JS port of the animation driver
assets/js/frames.js             the 235 frames (window.GHOSTTY_TERMINAL_DATA)
assets/fonts/jetbrains-mono.woff2
extracted/                      raw, unmodified extracted source for reference
.github/workflows/pages.yml     GitHub Pages deployment
```

## License

Extracted code and assets are from
[ghostty-org/website](https://github.com/ghostty-org/website), MIT License —
see [LICENSE](LICENSE). The demo wrapper here is also MIT.
