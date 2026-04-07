# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start Vite dev server with HMR
npm run build     # Production build to dist/
npm run preview   # Preview production build locally
```

No test runner is configured yet.

## Architecture

This is a Vite vanilla JS project — no framework, no bundler config file (Vite defaults are used as-is).

- `index.html` — entry point; mounts `#app` and loads `src/main.js` as an ES module
- `src/main.js` — renders the full page HTML into `#app` via a template literal, then calls `setupCounter`
- `src/counter.js` — exports `setupCounter`, a self-contained click counter bound to a DOM element
- `src/style.css` — all styles; uses CSS custom properties for theming, with a `prefers-color-scheme: dark` block for dark mode
- `public/` — static assets served at root (`/favicon.svg`, `/icons.svg` sprite sheet)
- `src/assets/` — images imported directly in JS (Vite handles URL resolution)

## Git & GitHub

All changes should be committed locally and pushed to `https://github.com/schnickischnacki/glsl-tv` on the `main` branch. Use clean, descriptive commit messages. No force-pushing to `main`.
