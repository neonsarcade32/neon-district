# Neon District

## 🎮 Play Arcade City

[**PLAY ARCADE CITY 3D**](https://neonsarcade32.github.io/neon-district/arcade-city.html?v=2.1.8)

That link goes straight into Arcade City 3D. Choose **OPEN WORLD** to join the public city or **SOLO** to play by yourself.

Neon District and Arcade City 3D.

## Multiplayer server

Arcade City Open World uses:

https://charlies-arcade-games.onrender.com/

The Node.js multiplayer server is in `server.js` and is deployed through Render using `render.yaml`.

## Neon Freeski 3D

[Play Neon Freeski 3D](https://neonsarcade32.github.io/neon-district/neon-freeski.html) — a fully native browser game built for Neon District. It has 3D mountain terrain, carving, charged jumps, kickers, air rotations, grabs, rails, score combos, 3 park settings and local high scores. It is **independently developed**, not a copy of Cork7 or its proprietary game files.

The Cork7 catalog entry runs the original Cork7 browser client in-site, while Neon Freeski is a separate original Neon District game. Cork7 uses `X-Frame-Options: SAMEORIGIN`, so the integration does not use an iframe.

Run `npm run test:arcade` for catalog integrity. For browser gameplay QA, run the local server and `npm run test:freeski` (requires Playwright plus an installed Microsoft Edge browser). Set `ARCADE_TEST_URL` to a different local server URL when needed.

### Cork7 in-site integration

The existing Cork7 Sports card launches the actual Cork7 browser client from `cork7.html`, not an iframe or a recreation. `cork7.html` now contains a static copy of the original client bootstrap HTML and an inline version of the navigation bridge. This avoids an intermittent browser-side `fetch()` failure that displayed an unavailable screen. On iPad, stylesheets and the primary JavaScript runtime are now served as first-party files under `cork7-assets/_next/static/`. Cork7's original images, fonts, 3D models, audio, backend, and selected lazy-loaded modules still depend on cork7.com. The integration requires the author's permission and may need maintenance when upstream hashed files change. Solo mode has been browser-tested; external account authentication and multiplayer may require additional support by Cork7's operator. Permission to integrate the client was provided by the user as a message from the game developer. Keep the original developer's credits in the client.

#### iPad Safari loading fix (October 22, 2026)

The original Cork7 HTML referenced resources on a different origin, producing an unstyled page with a nonresponsive Ride button for some iPad users. We now serve its primary CSS, JavaScript bundles, and game engine from the Neon District site. The inline entry bridge also provides a safe solo-route fallback when the Ride handler does not initialize. The game is tested in an emulated iPad browser, but real Safari/WebKit and account-dependent features require device verification. `cork7-assets` is a snapshot of the upstream game's client files; keep their rights/attribution and update matched hashes together if the upstream game changes.

#### Cork7 WebKit module completeness

The mirrored client now includes the complete transitive JavaScript chunk dependency graph (39 chunks), including the missing `meshopt_decoder.module-rFMdj35V.js` and park-collision modules. Without the decoder, selecting a park could reach 100% on the loading screen without initializing the mountain. `tests/arcade-integrity.cjs` checks every referenced relative JavaScript chunk to catch omissions. The original audio, image, texture, and non-JS external resources may still be fetched from cork7.com; this remains an authorized integration, not a fully independent server or authenticated multiplayer backend.
