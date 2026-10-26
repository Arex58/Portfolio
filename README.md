# DrizzleHaven Studio

Alejandro Pena's personal desktop portfolio. **Where ideas find their home.**

The existing HTML templates, vanilla JavaScript window manager, projects, supplied artwork, resume, and links remain in place. Tailwind CSS v4 is a build-time dependency; the published site needs no Node server or browser CDN.

## Development

Requires Node.js 20+ with npm, and Python 3 for the preview and asset tests.

```powershell
npm ci
npm run dev
```

The official Tailwind CLI watches `css/tailwind.css`, its imported stylesheets, `index.html`, and `script.js`, writing `assets/portfolio.css`. In another terminal:

```powershell
npm run preview
```

Open http://127.0.0.1:8000. Serve over HTTP(S) for the YouTube embed and clipboard support. Google Fonts and YouTube require an internet connection; system font fallbacks keep the page readable offline.

## Production and GitHub Pages

```powershell
npm run build
npm run test:assets
npm test
```

`npm run build` generates minified local CSS. **Commit `assets/portfolio.css` with every source/style change.** It is deliberately not ignored: GitHub Pages publishing from a branch does not run npm automatically. Keep `index.html`, the compiled CSS, `script.js`, `assets/`, `Photos/`, and `.nojekyll` in the publishing branch's root. Configure Pages to publish from that branch and root folder.

All local document, stylesheet, script, and image references are relative, including the CSS rain texture. The site works at `/Portfolio/` without a framework router or base-URL rewrite. To preview that exact path, stop the regular preview server and run:

```powershell
python -m http.server 8000 --bind 127.0.0.1 --directory ..
```

Then open http://127.0.0.1:8000/Portfolio/. The browser tests automatically start this server when port 8000 is free.

## Styling and files

| File | Responsibility |
| --- | --- |
| `css/tailwind.css` | CSS entry, brand palette, font families, spacing, radii, shadows, explicit source scanning |
| `styles.css` | Retained desktop and application layout rules |
| `cozy.css` | Semantic day/night colors, DrizzleHaven styling, rain, image framing, responsive and container rules |
| `assets/portfolio.css` | Generated stylesheet loaded by the page; include in commits |
| `index.html` | Existing content and application templates, new studio identity |
| `script.js` | Boot, app launcher, drag/resize, taskbar, themes, audio, JARVIS mini, trailer handling |
| `assets/drizzlehaven.svg` | Custom cloud-and-home studio mark and favicon |
| `assets/rain-streaks.svg` | Small repeating SVG rain texture |
| `assets/rainy-desk.svg` | Existing illustrated desk, recolored for the overcast palette |
| `playwright.config.js`, `tests/desktop.spec.js` | Browser regression checks and screenshots |
| `tests/check_assets.py` | Self-contained asset, template, encoding, and subdirectory checks |

The palette is midnight `#151C23`, slate `#263440`, mist `#8FAAB9`, cloud `#C7D0D5`, amber `#D6AC78`, and cream `#ECE8DF`. Semantic roles provide contrasting day/night surfaces. Existing custom CSS uses the same theme variables as new utilities.

Tailwind is introduced incrementally: `dh:` prefixed utilities avoid collisions with old classes, and Preflight is omitted to preserve existing element defaults. The legacy styles sit in the components layer. Custom rain animation and window behavior remain ordinary CSS/JavaScript. See the official [CLI installation](https://tailwindcss.com/docs/installation/tailwind-cli) and [disabling Preflight](https://tailwindcss.com/docs/preflight#disabling-preflight) documentation.

Dependencies: `tailwindcss` 4.3.3, `@tailwindcss/cli` 4.3.3, and `@playwright/test` for development/testing only. `package-lock.json` fixes the installed dependency graph.

## Desktop controls

- Open any shortcut or header action; use titlebar controls to minimize, maximize/restore, or close.
- Drag a titlebar, or move the active window with **Alt+Shift+Arrow**.
- Drag the lower-right resize grip, or focus it and use the arrow keys.
- **Escape** closes the top window and restores focus. Taskbar buttons restore minimized apps.
- Mobile uses full-screen application sheets with internal scrolling.
- Boot is skippable, runs once per tab session, and is bypassed for reduced motion. Rain and hover motion also stop for reduced motion; rain pauses in background tabs.
- Day/night preference is saved locally. Interface sound is opt-in and off by default.

All seven supplied app icons and project images remain intact. Project images use contain framing. JARVIS mini remains a scripted navigation guide, separate from the in-progress Windows assistant. No experience, project features, or achievements were added.

## Tests and limits

`npm test` runs the JavaScript syntax check and Playwright against installed Chrome. Set `PLAYWRIGHT_CHANNEL=msedge` to use installed Edge. Stop any unrelated server on port 8000 first. `npm run test:assets` starts its own temporary server and needs no setup. Screenshots and failure traces are written to ignored `test-results/`.

See `VERIFICATION.md` for the executed checks and external-service limits. This repository change does not publish or push the website.
