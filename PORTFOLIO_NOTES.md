# Notes for the next content pass

The October 22, 2026 edit uses details already in `index.html` and the scripted guide. It does not independently verify project functionality or outcomes. Existing project dates, education, employment dates, and deployed-site status are retained.

## Verification for this pass

- `node --check script.js` passed. JavaScript edits only change three preset replies.
- `python tests/check_assets.py` passed against a temporary local HTTP server: 18 local assets returned HTTP 200, 19 launch targets resolved, 22 images had alt attributes, IDs were unique, CSS braces balanced, and UTF-8 remained intact.
- Whitespace validation passed with `git -c core.whitespace=cr-at-eol diff --check`, respecting the existing CRLF files.
- Both stylesheets, responsive breakpoints, window behavior, keyboard handling, reduced-motion rules, and external destinations remain unchanged. The About note now opens Projects, matching its new content.
- Browser inventory was empty and opening the in-app browser returned "Browser is not available: iab." Desktop/mobile appearance, runtime interactions, and external video playback were not browser-verified in this pass. Before publishing, check the longer project text at desktop and phone widths, then try the window controls, keyboard navigation, and trailer.

## What felt generic

- The introduction used "curious human," "building things," and "useful little experiments" before explaining any specific work.
- "A little rain. A little code," the desk caption, the boot slogan, and the coffee footer repeated the atmosphere already conveyed by the illustration and palette. One rainy-evening detail remains in About.
- "Problem solver," "lifelong learner," and "real projects, real lessons" could describe almost any portfolio. The new copy names the game, academy, teaching, and tools used on particular projects.
- The "NICE TO MEET YOU!" sticker and "FILE CABINET / NO. 01" stamp added decorative labels without useful information. Those elements were removed; the desktop concept and artwork remain.
- Project headings such as "controllers with personality" and "from the inside out" obscured the personal connection and work. They now introduce your brother's shop, your taekwondo game, and the academy by name.
- The JARVIS emblem and Nightcrawler artwork are illustrations, not evidence of working interfaces. The copy now says what visitors can actually see and distinguishes JARVIS mini from the Windows project.

## Details only you can add

Keep these as editing prompts until you can provide the facts. They are not claims to publish as written.

### Taekwondo game

- What happened when combos failed? What caused the bug, what did you change, and what worked afterward?
- Which movements or gameplay decisions came from teaching taekwondo? Add one example if there is a real connection.
- Add a gameplay screenshot or short clip showing that specific sequence, with a caption explaining your contribution.
- Clarify whether a playable build exists and whether you want to share it. The portfolio currently links a trailer, not a playable build.

### JARVIS

- Name one task the Windows assistant can complete today, the steps involved, and what still fails or requires your input.
- Explain one actual implementation decision: for example, how a command is handled or how you limit computer access, if implemented.
- Add an actual interface screenshot or short recording. Identify any mocked steps, and specify which parts you implemented or adapted with AI assistance.
- Keep the Windows project separate from the portfolio's preset-response navigation guide.

### Nightcrawler Collectibles

- List what works now and what is still planned: gallery, requests, estimates, order tracking, or payment matching. The current code does not establish which of these are implemented.
- Describe the actual difficulty in matching orders to external payments and any approach you have tried. Do not imply an integrated checkout unless one exists.
- Add a screenshot of the current site, labeled as a development version, or a real controller photo you have permission to use. Keep project artwork labeled as artwork.

### Ultimate Taekwondo Academy

- What can staff actually do with the admin tools? Give one concrete workflow without exposing private student or account data.
- Describe one deployment or troubleshooting problem from GoDaddy/cPanel and how you handled it.
- Add desktop and phone screenshots of the live pages you built. The current image is the academy logo.
- Include feedback or results only if you can substantiate them; no metrics are needed just to make this sound credible.

### About and teaching

- Add a brief class-planning or teaching moment that says something specific about how you work, if you want to share one. There is no need to force a lesson about coding.
- A real photo of your desk, Smokey, or a project in progress could complement the existing illustrated avatar. Use a caption that says what it shows.
