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

The Cork7 catalog entry still links to [the official game](https://cork7.com/) and now provides a clear in-site alternative. Cork7 uses `X-Frame-Options: SAMEORIGIN`, which prevents embedding it inside our site. We do not override that restriction.

Run `npm run test:arcade` for catalog integrity. For browser gameplay QA, run the local server and `npm run test:freeski` (requires Playwright plus an installed Microsoft Edge browser). Set `ARCADE_TEST_URL` to a different local server URL when needed.

### Cork7 in-site integration

The existing Cork7 Sports card launches the actual Cork7 browser client from `cork7.html`, not an iframe or a recreation. The small loader fetches the original HTML from Cork7 on page load, then uses `cork7-bridge.js` to keep solo park selections on Neon District. The original game supplies its scripts, models and other assets. **These upstream files are not mirrored locally yet.** Solo mode has been browser-tested; external account authentication and multiplayer may require additional support by Cork7's operator. Permission to integrate the client was provided by the user as a message from the game developer. Keep the original developer's credits in the client.