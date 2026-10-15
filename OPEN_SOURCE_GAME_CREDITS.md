# Neon District — Open Source Games Collection

Neon District includes independently developed browser games whose original source licenses explicitly permit reuse and adaptation.

## 1. Neon 2048 — imported original 2048

- Original developer: **Gabriele Cirulli**.
- Upstream repository: https://github.com/gabrielecirulli/2048
- Original license: **MIT** © 2014 Gabriele Cirulli.
- Preserved license: `third-party-2048-license.txt`.
- Imported original source modules: `js/bind_polyfill.js`, `js/classlist_polyfill.js`, `js/animframe_polyfill.js`, `js/keyboard_input_manager.js`, `js/html_actuator.js`, `js/grid.js`, `js/tile.js`, `js/local_storage_manager.js`, `js/game_manager.js`, and `js/application.js`. These are combined in `open-2048-engine.js` with per-source boundaries.
- Imported original styling: `open-2048-base.css` (system-font fallback replaces upstream bundled font).
- Neon District additions: `open-2048.html`, `open-2048-theme.css`, mobile arrow controls, an isolated localStorage namespace (`nd2048_`), and an exported in-page game object for integration checks.
- All original gameplay rules, movement/merge behavior, and score persistence remain from the original source.
- This adaptation is **not** the official 2048 website. No upstream endorsement is implied.

## 2. Pixel Hop Twins — imported original retro platformer

- Original developer: **stm1978**.
- Upstream repository: https://github.com/stm1978/retro-platformer
- Original source license: **MIT**; the project's README describes the original game graphics, audio and levels as CC0/public-domain assets.
- Preserved license: `third-party-platformer-license.txt`.
- Imported original modules: `src/{constants,input,audio,sprites,camera,level,player,enemy,game,main}.js`; these are re-hosted as `open-platformer-*.js`. Imports were changed only to use local root-level module URLs, and the main file exposes its game instance for local tests.
- Imported original levels: `levels/level1.json` and `levels/level2.json` as `open-platformer-level1.json` and `open-platformer-level2.json`. Level URLs in the engine are adjusted accordingly.
- Neon District additions: `open-platformer.html`, `open-platformer-theme.css`, iPad/mobile touch controller adapters, a home/credits interface, and a window-blur key-state safety fix.
- Procedural sprite art, original levels, gameplay, collision physics, and synthesized sound effects are all from the source repository.
- This adaptation is independently hosted and is **not** presented as the upstream developer's official game.

## 3. Offroad Expedition 3D — imported original 3D car physics/world engine

- Original author: **Sam Wilson**, source https://github.com/rsamwilson2323-cloud/rpg-car-game
- License: **MIT** © 2026 Sam Wilson; full upstream license in `third-party-offroad-license.txt`.
- Imported original work: the 3D terrain/biome system, Rapier-powered four-wheel vehicle physics, procedurally drawn fallback car, environmental objects, collectibles and upgrade system. All original core game scripts are retained in the local `open-offroad.html` page.
- Neon District additions: a prominent 3D game feature, original vector cover art, responsive return-to-arcade control, author credit, local startup indicator, and removed external Google Font import.
- The upstream game uses pinned CDN imports for Three.js and Rapier, so the user needs an active internet connection when loading it. Chromium/WebGPU/WebGL support varies; users should have a modern updated browser.
- The game does not use the same save data as the original Neon District titles.
- **Neither Neon District nor its maintainers are affiliated with the original author.** This is a credited MIT-licensed adaptation.

## License and deployment notes

The full original copyright notices and permission conditions remain in this public repository. Keep these files and visible developer credits intact when distributing copies or making further modifications. The game pages link to their actual upstream authors and original license files.

No external game-host iframe, tracker, payment account, login, or API key is required. Everything is local HTML, CSS, JavaScript and static JSON. Browser storage remains local to the device.

Neon District's existing games, save keys, multiplayer server, theme switcher, Favorites, and Arcade Passport are preserved. Source games are grouped in the **GITHUB GAMES** tab and featured in the Community Drops homepage section.

To review game integrations, run `npm run test:openSource`, `npm run test:arcade`, `npm run test:browser`, `npm run test:gameplay`, `npm run test:visual`, and `npm run test:visual3` in the existing GitHub Actions workflow.
