# Extracted source

Raw, unmodified artifacts pulled from https://ghostty.org
([ghostty-org/website](https://github.com/ghostty-org/website), MIT License).

- `terminalData.json` — the `terminalData` object decoded from the page's
  React Server Components stream (`self.__next_f.push` payload). Maps
  `home/animation_frames/frame_NNN` → array of 41 line strings.
  `<span class="b">…</span>` marks the brand-blue glyphs.
- `ghostty-home-chunk.js` — the Turbopack chunk containing module `86970`,
  the homepage component: `Terminal` chrome, `AnimatedTerminal`,
  `FrameScheduler` (rAF clock at `1000/31` fps), Konami-code turbo mode,
  reduced-motion + focus/blur handling.
- `ghostty-terminal.css` — the `Terminal.module.css` rules and the
  `html,body` design-token blocks (`--gray-*`, `--brand-color`) exactly as
  shipped.
