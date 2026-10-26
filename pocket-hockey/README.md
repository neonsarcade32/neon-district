# Pocket Hockey — Neon District browser port

This is a new browser implementation inspired by the publicly available Pocket Hockey project at https://github.com/siam-mujadded/Pocket-Hockey. It does not copy the original project's source files or bundled images/audio. Review the original repository's license before reusing any of its assets or code.

## Current prototype

- Portrait rink rendered with Canvas.
- Local two-player controls: drag/touch on each player's half; keyboard bottom arrows and top WASD.
- Puck movement, wall rebounds, mallet collisions, goals, first-to-five match, pause, restart, and locally generated sound effects.
- No external runtime libraries or network assets.
- A service worker caches the app shell for offline launch.

## Offline verification checklist

The service worker being installed is **not** proof that offline play works. Verify on the deployed origin:

1. Open the game while online and wait for the cache status.
2. Reload once so the service worker controls the page.
3. Disconnect networking or use browser devtools offline mode.
4. Reload the game and confirm the board renders.
5. Play a full match, including mallet movement, collisions, goals, restart, and sound after user interaction.
6. Reconnect and confirm the game returns to normal.

The status badge reports network status and cache registration; it deliberately does not claim that a true offline launch has been verified.

## Controls

- Touch: drag a mallet on your half.
- Bottom player: arrow keys.
- Top player: W/A/S/D.
- First player to five goals wins.
