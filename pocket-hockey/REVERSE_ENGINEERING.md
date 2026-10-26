# Pocket Hockey source audit

## Scope and evidence

Audited the public source repository `siam-mujadded/Pocket-Hockey`, especially `Pocket Hockey/BallDemo.cpp`, `Pocket Hockey/iGraphics.h`, `Pocket Hockey/IGraphics.cbp`, and the README files. The README is mostly generic iGraphics documentation, not a game specification. This is a source-level audit; the Windows executable has not been run here.

The repository does not contain an obvious LICENSE file. Treat its original source and art/audio assets as copyrighted unless the author confirms reuse terms. This port should reproduce observable mechanics with a fresh implementation and newly drawn visuals/audio rather than copying the repository's assets or source verbatim.

## Original game model

- **Runtime:** C++ using the iGraphics wrapper over legacy OpenGL/GLUT, with Windows headers and Win32 `PlaySound` calls. The included Code::Blocks project links Windows-era libraries and builds an `.exe`; it is not browser-native.
- **Window / coordinates:** `iInitialize(1100, 1200, ...)`. The rink is drawn from `(300, 300)` with width 500 and height 900.
- **Rink / goals:** horizontal centre line at y=750, centre circle radius 100, goal-area outlines at both ends, and goal bars around x=500..600 at the bottom and top.
- **Starting positions:** puck `(550, 750)`; player 1 `(550, 525)`; player 2 `(550, 975)`.
- **Controls:** player 1 uses arrow keys; player 2 uses W/A/S/D; P starts / returns from a goal screen; the UI also draws Exit, Resume, and Pause buttons.
- **Animation:** `iSetTimer(5, change)` calls the game update roughly every 5 ms. The puck starts with `dx=7`, `dy=9`, and `angle=0`; movement is calculated as `x += dx*cos(PI*angle)`, `y += dy*sin(PI*angle)`.
- **Walls:** the puck is clamped and its direction component is flipped at the rink's rectangular bounds.
- **Player collision:** a distance threshold and per-player collision flags attempt to avoid repeatedly handling the same contact. The code then uses many quadrant-specific `tan/atan/sqrt` expressions to alter direction.
- **Goals / state:** goal checks depend on puck x-range, y-range, and the sign of `dy`. A goal pauses timer 0, plays a cheer, resets puck and players, and switches to a game-over screen naming a winner. There is no conventional numeric score system; this appears to be a rudimentary single-goal match flow.
- **Audio / graphics assets:** references include bitmap backgrounds and puck/player images, plus collision, crowd, and cheer WAV files. Some sound/background logic is commented out.

## Important source-level risks and defects

1. `collision1`, `collision2`, `collision`, and `crowd` are global integers without explicit initialization; globals are zero-initialized by C++, but the state transitions are still fragile.
2. The puck's position update mixes `dx/dy` with a shared angle and trigonometric factors, while collisions mutate both the components and angle. This can produce unintuitive motion and should be measured against the original rather than assumed to be physically correct.
3. Collision calculations divide by `playerX - ballX` and call `tan(angle)`; exact/near-zero denominators can cause unstable or undefined-looking behavior.
4. The collision response is duplicated for each player, has many commented-out experimental branches, and does not use a conventional normal/tangent impulse.
5. The drawn pause/resume/exit button coordinates are checked using mouse coordinates, but the code relies on a hard-coded window layout.
6. The goal flow is state-flag based, not a robust score/match system. The P key toggles `back_index` with an assignment (`back_index=+1`) in one path, so it should be tested carefully.
7. The project file only lists `BallDemo.cpp` as a compilation unit and uses legacy Windows-specific dependencies. A browser port must reimplement rendering, input, audio, timing, and state handling.

## Port plan

1. Preserve the recognizable original structure: tall rink, two player paddles, central line/circle, goal mouths, title screen, pause/resume/exit, and one-goal winner/replay flow.
2. Recreate the controls (arrows for player 1, WASD for player 2, P to start/replay) and support touch input as an additional browser adaptation.
3. Use deterministic, testable vector collision logic for the browser implementation. Document any correction where the original code is numerically unstable; do not claim it is byte-for-byte behavior.
4. Verify both players' bounds, puck wall rebounds, paddle contact, goal detection at both ends, pause/resume, replay, and narrow-screen layout.
5. Keep the implementation separate from the original repository and do not reuse its assets until licensing is confirmed.

## Status

- [x] Repository tree and key source files inspected.
- [x] Original controls, board geometry, state flow, and physics approach mapped.
- [ ] Original Windows executable run side-by-side for behavior capture.
- [ ] Browser port tested in a real browser.
- [ ] Touch and keyboard controls verified.
- [ ] Physics and goal edge cases tested.
