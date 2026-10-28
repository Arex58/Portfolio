# Smokey's Studio

Alejandro Peña's personal desktop portfolio. Websites, games, and side projects, with Smokey supervising.

A pastel pixel-art computer in a rainy nighttime room, with an original animated Smokey companion based on her photographs. The real portfolio runs inside the computer display. The city, rain, lamp, coffee, keyboard, mouse, and Smokey live outside it.

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

`npm run build` generates minified local CSS. **Commit `assets/portfolio.css` with every source/style change.** It is deliberately not ignored: GitHub Pages publishing from a branch does not run npm automatically. Keep `index.html`, the compiled CSS, `script.js`, `room.js`, `assets/`, `Photos/`, and `.nojekyll` in the publishing branch's root. Configure Pages to publish from that branch and root folder.

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
| `cozy.css` | Semantic day/night colors, Smokey's Studio styling, rain, image framing, responsive and container rules |
| `workstation.css` | Current pixel room, computer casing, desk props, screen hierarchy, responsive layouts |
| `room.js` | Original canvas city and Smokey artwork, rain rendering, cat state machine, motion controls |
| `desk-controls.js` | Working desk keys, text selection, JARVIS submission, draggable mouse, screen cursor and pointer activation |
| `assets/portfolio.css` | Generated stylesheet loaded by the page; include in commits |
| `index.html` | Existing content and application templates, new studio identity |
| `script.js` | Boot, app launcher, drag/resize, taskbar, themes, audio, JARVIS mini, trailer handling |
| `assets/smokey-face.svg` | Smokey's pixel face on a transparent background; OS taskbar icon and favicon |
| `assets/rain-streaks.svg` | Small repeating SVG rain texture |
| `assets/keycaps.svg` | Original 24×16 SVG key tile with four flat shades; native-size desktop and half-size mobile rendering |
| `assets/rainy-desk.svg`, `assets/rainy-desk-pixel.png` | Legacy assets; no longer shown in the portfolio |
| `playwright.config.js`, `tests/desktop.spec.js`, `tests/room.spec.js` | Browser regression checks, scene behavior tests, and screenshots |
| `tests/check_assets.py` | Self-contained asset, template, encoding, and subdirectory checks |

The workstation uses peach `#efaf99`, dusty pink `#d28c91`, purple `#80547c`, mint `#a9cfc0`, and yellow `#f1d38f`, with dark stepped outlines. Semantic roles provide contrasting night and warm screen palettes. Original artwork uses integer canvas coordinates and nearest-neighbor display scaling.

Tailwind is introduced incrementally: `dh:` prefixed utilities avoid collisions with old classes, and Preflight is omitted to preserve existing element defaults. The legacy styles sit in the components layer. Custom rain animation and window behavior remain ordinary CSS/JavaScript. See the official [CLI installation](https://tailwindcss.com/docs/installation/tailwind-cli) and [disabling Preflight](https://tailwindcss.com/docs/preflight#disabling-preflight) documentation.

Dependencies: `tailwindcss` 4.3.3, `@tailwindcss/cli` 4.3.3, and `@playwright/test` for development/testing only. `package-lock.json` fixes the installed dependency graph.

## Desktop controls

- Open any shortcut or header action; use titlebar controls to minimize, maximize/restore, or close.
- Drag a titlebar, or move the active window with **Alt+Shift+Arrow**.
- Drag the lower-right resize grip, or focus it and use the arrow keys.
- **Escape** closes the top window and restores focus. Taskbar buttons restore minimized apps.
- Mobile uses full-screen application sheets with internal scrolling.
- Press the physical yellow power button to start. The 1.7-second boot can be skipped; subsequent boots in the tab take 450ms. Reduced motion loads in 100ms with no flicker. Power off cancels startup and stops audio.
- Day/night preference is saved locally. Pressing power starts the looping music at 30% volume and enables interface sounds. Both taskbar toggles can mute them independently; power-off stops the music and disables interface sounds. Each new power-on enables both again. Nothing plays before the power-button gesture.
- Pet Smokey with click, tap, Enter, or Space. She stays on her cushion, occasionally blinks, and gives a small tail flick every sixteen seconds. Greetings rotate through four messages; every eleventh pet reveals her tongue-out expression.
- Shortcuts retain their original 64×64 PNGs. Hover or keyboard focus reveals a description; Escape dismisses it. A mint corner marker identifies open apps, including minimized ones. Mobile uses three columns and 44px minimum window/control touch targets.
- Pause room motion with the footer control. System reduced motion also stops rain, steam, and character movement. Hidden tabs cancel the scene's animation frame loop; visible animation is capped at 20fps.
- The desk keyboard types into the selected text field, or opens JARVIS when none is available. Shift toggles capitals; Del deletes the selection or preceding character; Enter submits. Pointer presses preserve text selection, and every key also works with keyboard focus.
- Drag the mint desk mouse to move the pixel cursor inside the display. Tap/click it to activate the pointed control. When the mouse has keyboard focus, arrow keys move the cursor, Shift+Arrow moves precisely, Home centers it, and Enter/Space clicks. The wheel over its pad scrolls the pointed panel. The controls are disabled when the computer is off.
- The top title is text only. The OS taskbar and favicon use only Smokey's pixel face. The SS_ monograms, bookshelf, wall print, and visible mouse instructions have been removed; the desk cat remains. Mouse instructions are available as an accessible description.

The seven app icons use generated pixel artwork with shaded, recognizable objects. Project images remain intact. See `assets/icons/ARTWORK.md` for the icon prompts and provenance. Project images use contain framing. JARVIS mini remains a scripted navigation guide, separate from the in-progress Windows assistant. No experience, project features, or achievements were added.

## Tests and limits

`npm test` runs the JavaScript syntax check and Playwright against installed Chrome. Set `PLAYWRIGHT_CHANNEL=msedge` to use installed Edge. Stop any unrelated server on port 8000 first. `npm run test:assets` starts its own temporary server and needs no setup. Screenshots and failure traces are written to ignored `test-results/`.

See `VERIFICATION.md` for the executed checks and external-service limits. This repository change does not publish or push the website.
