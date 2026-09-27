# Hotel for Supervillains — The Grand Disaster

**The main game is a playable 3D first-shift vertical slice.** You are the hotel manager, physically moving through the lobby, storage room, elevator, third-floor hall, and Doctor Drizzle's Room 307. The old browser management game is preserved at [`classic/`](classic/).

## Play locally

From this repository's root:

```bash
python -m http.server 4180
```

Open `http://127.0.0.1:4180/` in a desktop browser with WebGL support. The browser version is also published via GitHub Pages. The 3D runtime's Three.js dependency is vendored under `3d/vendor`, so playing does not require npm or an external CDN.

- WASD or arrow keys: move. Mouse: camera. Shift: run.
- E: interact. Q: drop the battery. Esc: close the computer or pause.
- Walk to the ringing front-desk phone, answer Drizzle's request, find and carry the industrial battery from Storage, enter the lift and select Floor 3, open Room 307, deliver the battery, ride back, and use the physical manager computer.
- Computer apps: HOME, GUESTS, HOTEL MAP. Exit with Esc or EXIT.
- Progress is saved locally in the browser under new `grand-disaster-3d-*` keys. The classic game's saves are not touched.
- Developer tools are deliberately hidden in normal play; `?debug=1` enables test-only teleports and other controls.

## Verify

```bash
node --test 3d/tests/foundation.test.mjs 3d/tests/entrypoint.test.mjs
```

For the browser acceptance playthrough: serve the repository on port 4180, launch Chrome with `--remote-debugging-port=9231` on `http://127.0.0.1:4180/3d/game.html?debug=1`, then run:

```bash
node 3d/tests/browser-vertical-slice.mjs
```

The browser test uses real keyboard events for movement/interactions, developer teleports to shorten long walks, asserts movement/collision and the complete mission state, exercises all three OS views, verifies local persistence and both public entrypoints, and collects browser exceptions.

## Scope

This is **the first tutorial mission**, not a complete hotel simulator. Later staff, carts, expanded floors, multiple guests, upgrades, emergencies, and story systems remain future work. The full requested product/design specification is locked in [`DESIGN_LOCK.md`](DESIGN_LOCK.md). The old shift-management experience remains playable at `classic/`; it is not the main 3D game.

Three.js is MIT licensed; its original license is included in `3d/vendor/THREE_LICENSE.txt`.
