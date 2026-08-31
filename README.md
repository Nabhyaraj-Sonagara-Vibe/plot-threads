# PlotThreads

A single-page, no-signup web app for serial and novel writers to track their
plot threads — subplots, mysteries, and promises made to readers — and see at
a glance which ones have gone stale.

**Live app (after merge):** https://Nabhyaraj-Sonagara-Vibe.github.io/plot-threads/

## The problem

Writers of long serials and novels (web serial authors, r/writing,
r/fantasywriters) routinely lose track of subplots and unresolved "promises"
to readers. Most people fall back on fragile Google Docs or notebook systems.
Dedicated tools that solve this properly — Storyflow, Plottr, Dabble,
Campfire, NovelCrafter — are all subscription products ($9.99+/mo) or require
setting up Obsidian as a makeshift story bible. Nothing free and
purpose-built exists.

## What it does

- Add a plot thread: name + description of the promise you made to readers.
- Tag it **planted**, **developing**, or **resolved**.
- Record the chapter number it was last touched at.
- Set your current chapter and a "stale after N chapters" threshold.
- Threads that haven't moved in longer than the threshold get flagged
  **stale** with a red highlight, so you never forget a dangling subplot.
- Filter by status or "stale only" to triage quickly.
- Everything is stored in your browser's `localStorage` — no account, no
  server, no data leaving your machine.

## How to run it

No build step, no dependencies. Just open `index.html` in a browser:

```bash
git clone https://github.com/Nabhyaraj-Sonagara-Vibe/plot-threads.git
cd plot-threads
open index.html   # or: python3 -m http.server 8000
```

Once this repo's PR is merged to `main`, it will also be live automatically at:
https://Nabhyaraj-Sonagara-Vibe.github.io/plot-threads/

## Why I built this

Spotted a serial writer on RoyalRoad's forums (`royalroad.com/forums/post/1555907`)
explicitly wishing for a *free* tool to track plot threads because Google
Docs and notebooks weren't cutting it. A quick market check confirmed every
purpose-built plot-thread tracker (Storyflow, Plottr, Dabble, Campfire,
NovelCrafter) is paid — Storyflow's subplot tracker specifically is
subscription-only with no free plan. Obsidian can be bent into this shape but
needs manual setup. PlotThreads is a small, free, zero-setup tool that does
exactly the one thing those writers asked for.

## Tech

Plain HTML/CSS/JS, no framework, no build tools, no backend. Persistence via
`localStorage`. Deployed as a static site on GitHub Pages.

## Tests

`tests/logic.test.js` is a small Node smoke test covering the core
stale-detection and filtering/sorting logic (no browser/DOM required — it
imports the pure functions exported from `app.js`). Run it with:

```bash
node tests/logic.test.js
```

## License

MIT — see [LICENSE](LICENSE).
