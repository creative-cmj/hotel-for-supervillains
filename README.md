# Hotel for Supervillains — The Grand Disaster

**The main game is a playable three-floor 3D hotel.** You are the manager, physically moving through the lobby, public and service areas, 27 accessible guest rooms, three lift landings, and Doctor Drizzle's Room 307. The First Shift tutorial remains the opening route, then the phone offers repeatable guest deliveries. The old browser management game is preserved at [`classic/`](classic/).

## Play locally

From this repository's root:

```bash
python -m http.server 4180
```

Open `http://127.0.0.1:4180/` in a desktop browser with WebGL support. The browser version is also published via GitHub Pages. The 3D runtime's Three.js dependency is vendored under `3d/vendor`, so playing does not require npm or an external CDN.

- First-person view. WASD or arrow keys: move. Mouse: look. Shift: run.
- E: interact. Q: drop a carried item. Esc: close a panel, close the computer, or pause.
- Walk to the ringing front-desk phone, answer Drizzle's request, find and carry the industrial battery from Storage, enter the lift and select Floor 3, open Room 307, deliver the battery, ride back, and use the physical manager computer.
- Computer apps: HOME, GUESTS, HOTEL MAP. Exit with Esc or EXIT.
- Progress is saved locally in the browser under new `grand-disaster-3d-*` keys. The classic game's saves are not touched.
- After First Shift, answer the phone for repeatable requests from Voltessa and the Bloom Queen, collect their parcel in Storage, ride to the assigned floor, open the real room door, and deliver inside.
- Developer tools are deliberately hidden in normal play; `?debug=1` enables test-only teleports and other controls.

## Verify

```bash
node --test 3d/tests/foundation.test.mjs 3d/tests/entrypoint.test.mjs 3d/tests/complete-hotel.test.mjs
```

For the browser acceptance playthrough: serve the repository on port 4180, launch Chrome with `--remote-debugging-port=9231` on `http://127.0.0.1:4180/3d/game.html?debug=1`, then run:

```bash
node 3d/tests/browser-vertical-slice.mjs
```

With the same Chrome debugging session active, profile all three floors with:

```bash
node 3d/tests/performance-smoke.mjs
```

The browser test uses real keyboard and interaction events for movement, the First Shift route, lift selection, Room 307, a repeatable Room 205 delivery, the manager OS, all 27 door systems, save/reload, pause, the root entrypoint, and Classic. It collects browser exceptions and captures visual QA screenshots under `3d/preview-*-polished.png`. After publication, run `npm run test:live --prefix 3d` with Chrome on CDP port 9231 to smoke-test the deployed root and Classic paths.

## Scope

This pass completes the repaired three-floor environment and establishes the first repeatable hotel-work loop. It is still an early playable hotel rather than the final simulator: staff have ambient dialogue but no schedules, only two repeatable guest requests exist, and upgrades, emergencies, deeper stories, and richer room-specific activities remain future work. The full product and art direction remains locked in [`DESIGN_LOCK.md`](DESIGN_LOCK.md). The old shift-management experience remains playable at `classic/`.

The editable Blender post-process, exported GLB, build script, verification report, dimensions, triangle count, and licensing notes are in [`assets/polished_hotel/`](assets/polished_hotel/).

Three.js is MIT licensed; its original license is included in `3d/vendor/THREE_LICENSE.txt`.
