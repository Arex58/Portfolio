# Rainbyte Studio — Alejandro Pena's personal workspace

A cozy rainy-night portfolio in plain HTML, CSS, and JavaScript. Rainbyte Studio is a temporary, replaceable identity; no registration or commercial clearance is claimed.

## Run locally

From this folder:

```powershell
python -m http.server 8000 --bind 127.0.0.1
```

Open `http://127.0.0.1:8000`. No build or dependencies are required. Serve over HTTP(S), rather than opening `index.html` as a file, for embedded YouTube playback. Fonts, YouTube, and external links require internet; the portfolio uses local assets.

## What changed

- Illustrated coding desk, rainy window, warm lamp and drink; muted navy, teal, cream and amber palettes.
- Alejandro Pena remains prominent; original rain-cloud/terminal logo in `assets/rainbyte.svg` doubles as the favicon.
- A 1.6-second startup can be skipped immediately. It runs once per tab session and is skipped for reduced-motion preferences.
- All seven supplied ZIP icons are used unchanged, with transparency intact. Desktop icon hover/focus scales 1.08 over 210 ms; reduced motion removes movement.
- Full cat avatar featuring Alejandro and Smokey, and supplied JARVIS emblem. All project art uses contain framing with natural proportions.
- Existing project content, résumé PDF, email, LinkedIn, academy site, scripted JARVIS guide, and draggable/minimizable windows retained.

## Edit the project

| File | Purpose |
| --- | --- |
| `index.html` | Portfolio text, templates, links, desktop icon mapping |
| `styles.css` | Existing base window and content layout |
| `cozy.css` | Rainbyte palette, responsive overrides, image framing, new desktop styling |
| `script.js` | Window manager, boot, theme, local guide, lazy loading, video errors; `iconFiles` maps window/taskbar art |
| `assets/rainbyte.svg` | Original temporary studio mark and favicon |
| `assets/rainy-desk.svg` | Original illustrated workspace |
| `assets/alex-smokey.png` | Supplied Cozy Cartoon Cat Cuddle Avatar |
| `assets/jarvis-emblem.png` | Supplied J.A.R.V.I.S. HUD Emblem |
| `assets/Alejandro_Pena_Resume.pdf` | Existing résumé, unchanged |

ZIP artwork mapping in `assets/icons/`: `about_me` → About, `my_projects` → Projects, `toolbox` → Skills, `my_story` → Story, `resume` → Résumé, `jarvis` → JARVIS, `say_hi` → Contact. Original filenames have the `game_icon_` prefix and `.png` extension. Supplied raster art was copied without modification.

## YouTube diagnosis and remaining limit

The original video is retained: https://youtu.be/wflFSHQjeUA.

The previous embed URL was already valid. No application CSP or overlay was found blocking it. The old README recommended opening the HTML directly, which can omit the HTTP referrer that YouTube requires; this is a plausible cause, **not a confirmed diagnosis for this video**. YouTube documents missing client identification as error 153: https://developers.google.com/youtube/iframe_api_reference#onError.

The player now loads when its project window opens, uses inline playback, an explicit HTTP(S) origin and referrer policy, a responsive frame with a 200px minimum height, and no autoplay. The official player API reports unavailable/private videos, owner-disabled embedding, client identification failures, and playback errors in the page. A permanent **Watch on YouTube** link preserves access to the original URL. Minimizing pauses an initialized video; closing destroys it.

Actual video playback, owner embedding permissions, and availability could not be confirmed: Chrome and in-app browser connections were unavailable, and direct YouTube requests failed. No successful-playback claim is made.

## Verification

Check JavaScript syntax:

```powershell
node --check script.js
```

With the local server running:

```powershell
python tests/check_assets.py
```

See `VERIFICATION.md` for executed results and the remaining browser checks. No desktop/mobile screenshots were generated because browser automation was unavailable.
