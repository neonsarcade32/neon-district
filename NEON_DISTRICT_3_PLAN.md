# NEON DISTRICT 3.0 — MEGA UPDATE PLAN

**Project:** `neonsarcade32/neon-district`  
**Goal:** turn every arcade game into a polished, reliable, replayable feature, while keeping current save data and the live multiplayer server safe.

## Release rules

1. Preserve existing best scores, favorites, recent games, and Idle Empire saves wherever technically possible.
2. Work in a dedicated branch, run automated checks, then merge only tested changes.
3. Never claim “100% working” based on source inspection alone: test real gameplay loops on desktop and touch devices.
4. Keep 3D games playable in solo mode even if their online server is unavailable.
5. Optimize for smooth gameplay on Chromebooks, ordinary laptops, phones and tablets.
6. Every game must have: visible controls, a functional play/replay path, correct scoring, clear win/lose states, responsive layout, and no uncaught JS errors.

## Existing foundation already added in this branch

- Catalog now exposes **all 35 playable game pages**, not merely 30.
- Site branding updated to **Neon District 3.0** without replacing the existing 3D engines.
- Free Throw Fever and Goalkeeper Rush now have actual gameplay and 10-shot scoring rather than inert controls.
- Laser Defender and Rooftop Run now include the missing status/difficulty UI required by their scripts.
- Local multiplayer/static server can now serve the actual browser game JavaScript without exposing server files.
- Snake Maze Challenge, Pong local 2-player, Tap 3-Life Survival and Reaction Lab pause/stat improvements.
- Common small-game polish toolbar and fullscreen capability when the browser supports it.
- Automated catalog, asset, JS syntax, multiplayer, and 35-game browser smoke checks in GitHub Actions.

## Flagship updates — next production milestones

### Arcade City 3D
- Verify load and start modes, driving and on-foot controls, house/shop entry and exit, cars, homes, races, missions, camera and minimap.
- Map audit: blocked roads, invisible walls, spawn points, inaccessible properties, route signage and garage access.
- Driving v3: traction/drift consistency, responsive steering at speed, collisions, better camera and engine audio.
- World v3: distinct neighborhoods and destinations, pedestrians/ambient traffic, clear mission objectives and rewards.
- Progression: saved owned homes, money, cars, unlocks and achievements with recovery for corrupt saves.
- Multiplayer: join/rejoin, six-player private rooms, public-world presence, reconnect and timeout behavior.
- QA: test solo first; test desktop and touch; measure frame time, fix lag and WebGL fallbacks.

### Neon Bowling 3D
- Verify both existing game modes, pins, ball release, spin/hook, strike and spare rules, tenth frame, scoreboard and saved best.
- Better alley and pin presentation, improved roll replay camera, clearer power meter, sounds and bowling feedback.
- Expand to challenges, shot mastery, career bests, and optional cosmetics only after the core 10-frame scoring is trusted.
- QA: gutter, open frame, spare, consecutive strikes, strike in 10th frame, perfect game, replay, mobile release.

## Small-game expansion track

| Game | Target expansion after core checks |
|---|---|
| Snake Arena | Maze Challenge (started), optional modifiers, leaderboard per mode, responsive swipe |
| Pong Arena | Local 2-player (started), tournaments, better AI and paddle effects |
| Reaction Lab | Session stats (started), consistency chart, skill tiers |
| Tap Rush | Survival (started), target patterns, precision rounds, mode records |
| Breakout | New stages and power-ups, improved collisions |
| Flappy Flight | Biomes, missions, wind and obstacle variety |
| Traffic Rush | Wider traffic variety, vehicle options, near-miss combos |
| Neon Tetris | Ghost piece, levels, hold and clearer mobile controls |
| Neon Dino Run | Missions, new obstacles, speed tiers and animation |
| Space Shooter | Enemy patterns, bosses, weapon pickups |
| Hockey Shootout | Shot types, goalie difficulty, challenge ladder |
| Hockey Breakaway | New dekes, defensive pressure and match series |
| Drift Racer | New courses, physics tuning, lap and replay records |
| Ski Rush | Slalom maps, tricks, checkpoints, weather and records |
| Basketball Shootout | New courts, timed rounds, release skill rewards |
| QB Challenge | Routes, defense patterns, passing challenges |
| Home Run Derby | Pitch types, stadium targets, streak bonuses |
| Idle Empire | Progression balance, offline gains, save/restore QA |
| Field Goal Frenzy | Wind conditions, distance ladder, timing clarity |
| Mini Golf | More holes, par and collision QA |
| Turbo Slalom | New courses, split times, ghost runs |
| Meteor Dodge | Enemy patterns, shield and escalating hazards |
| Stack Tower | Precision combos, visual styles, leaderboard |
| Penalty Shootout | Goalkeeper AI, tournaments, shot varieties |
| Circuit Hacker | Larger puzzles, new patterns and checkpoint modes |
| Beat Tiles | New charts, timing windows, accessible input |
| Claw Machine | New prizes, claw controls and rewards |
| Color Dash | New patterns, speed scaling, color accessibility |
| Free Throw Fever | 10-shot base game (started), skill tiers and streak effects |
| Goalkeeper Rush | 10-save base game (started), shot patterns and dives |
| Highway Escape | Better traffic AI, hazards, near misses and cars |
| Laser Defender | Fixed startup UI (started), stronger waves, bosses and upgrades |
| Rooftop Run | Fixed startup UI (started), obstacle variety, parkour effects and boost |

## QA gates

- **Gate A — source/static:** all 35 linked pages exist; all required assets load; JavaScript syntax parses.
- **Gate B — runtime smoke:** every title opens with no uncaught page errors; home and restart routes work.
- **Gate C — gameplay:** every mode played from start to finish, score changes, clean reset, saved records.
- **Gate D — mobile:** minimum 390px viewport, touch controls, no unreachable primary UI.
- **Gate E — flagship:** Arcade City and Bowling pass dedicated driving, physics, scoring and save tests.
- **Gate F — regression:** multiplayer HTTP/WebSocket tests, existing user saves remain intact.

**Status:** Gates A and B have initial automated coverage; Gate C and flagship Gate E require deeper interactive test cases. A green smoke test does not certify every possible game state.

## Rollout

**Wave 1:** foundation, broken game fixes, all-game smoke checks.  
**Wave 2:** Arcade City 3D and Bowling 3D flagship gameplay expansion.  
**Wave 3:** first ten small games get richer gameplay, then repeat for remaining groups.  
**Wave 4:** cross-device performance, save compatibility, visual QA and polished Neon District 3.0 launch.
