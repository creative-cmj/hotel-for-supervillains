# Build Hotel for Supervillains without Blender

You can now build hotel layouts directly in the browser with the project's **Hotel Builder**. Blender is optional.

## Start the tools

Open PowerShell in the repository root and run:

```powershell
python -m http.server 4180
```

Open:

- Game: <http://127.0.0.1:4180/>
- Hotel Builder: <http://127.0.0.1:4180/3d/editor.html>

Do not open the HTML files directly from Explorer. The local server is required for JavaScript modules and GLB files.

## Build a room or hotel area

1. Select **Floor 1**, **Floor 2**, or **Floor 3**.
2. Add individual walls, floors, furniture, signs, hotel props, or villain-tech pieces.
3. Alternatively, add **Standard Room A**, **Standard Room B**, **VIP Room**, or **Lobby Seating** as an editable starting point.
4. Click an object in the 3D view.
5. Move the camera with W/A/S/D. Hold Shift to move faster.
6. Zoom with the mouse wheel, rotate with right-drag, and pan with middle-drag. Use **Reset** if you lose the room.
7. Move the selected object with the arrow keys or exact X/Z fields.
8. Rotate the selected object with Q/E or the Rotation field.
9. Use Page Up/Page Down for object height.
10. Press Ctrl+D to duplicate or Delete to remove.
11. Use **Save Draft** while working. This stores a private draft in that browser.
12. Use **Download JSON** when the layout is ready.

## Fast editor controls

- **W/A/S/D** moves the camera; hold **Shift** for the faster speed.
- Mouse wheel zooms, right-drag orbits, and middle-drag pans.
- Left-drag an object to move it. Choose **Rotate** or **Scale** in the toolbar to make the same drag rotate or resize it.
- **F** focuses the selection, **Home** resets the camera, and **Numpad 7** opens the high top view.
- **G** selects Move, **R** selects Rotate, and **Alt+S** selects Scale while keeping ordinary S available for camera movement.
- Ctrl/Command-click objects in the viewport or outliner to select several. Ctrl+D duplicates; Ctrl+Z and Ctrl+Y undo and redo.
- Arrow keys nudge the selection. Choose World or Local in the toolbar, and change Snap for the movement/grid size.

The asset browser supports search, category filters, favorites, recently used pieces, and drag-and-drop into the viewport. Door, door-frame, and window pieces align to a nearby wall after you drag or drop them close to it.

## Safety and verification

Every recorded edit updates the visible history, the AI action log, and a browser autosave. **Save Version** makes named restore points such as `Hotel_v01`; the newest 25 versions are retained in that browser. Use **Verify Current Scene** to refresh triangle, material, light, draw-call, hidden-object, and out-of-bounds warnings. **Show Collisions** draws the simple gameplay collision boxes.

The **Play-test at player height** button enters a first-person preview with WASD, mouse look, and collision against solid custom-layout pieces. Press Escape to return to editing. This preview is for quick spatial checks; use the main game link for the complete elevator, mission, doors, guests, saving, and interaction systems.

## Imported models

The importer inspects `.glb` and self-contained `.gltf` files before previewing them. It reports file size, dimensions, mesh count, triangle count, materials, and textures. Browser security makes uploaded previews session-only, so copy an approved model into `assets/external/`, record its license, and let the game integration reference that repository file. Convert `.fbx` and `.obj` files to GLB in Blockbench first.

## Put a layout in the game

The editor downloads `custom-layout.json`.

Copy it over:

```text
3d/data/custom-layout.json
```

Reload the game. The runtime automatically builds those objects, shows only the current floor's objects, and creates simple collision for solid objects. No game-code edit is required.

Keep important gameplay areas clear:

- Reception phone and computer
- Storage battery location
- Elevator entrance at approximately X -5, Z -9
- Center guest corridor between X -2 and X 2
- Room 307 doorway and Doctor Drizzle

## Use external models without Blender

The built-in catalog uses efficient Three.js primitives. For a special prop or character:

1. Download a low-poly `.glb` with a license that permits your game.
2. Put it under `assets/external/<creator-or-pack>/`.
3. Add the source URL, creator, license, and modifications to `assets/external/LICENSES.md`.
4. Test scale in the game. One game unit is approximately one meter; the player is about 2.2 meters tall.

Good sources include:

- [Kenney](https://kenney.nl/assets) — many assets are CC0; verify the individual pack.
- [Quaternius](https://quaternius.com/) — many packs are CC0; verify the pack page.
- [Poly Pizza](https://poly.pizza/) — licenses vary per model; record each one.

Do not use a model merely because it is downloadable. Record its actual license.

## Optional Blockbench workflow

[Blockbench](https://www.blockbench.net/) is easier than Blender for small low-poly props.

1. Start a generic model.
2. Work in meters and keep the model near the origin.
3. Put the bottom center at Y 0.
4. Use descriptive object and material names.
5. Export as glTF/GLB.
6. Record any textures and licenses.

You do not need Blockbench for walls, floors, doors, beds, sofas, desks, lamps, signs, plants, luggage carts, or the included villain-tech pieces.

## Files in the no-Blender system

- `3d/editor.html` — visual editor
- `3d/editor.js` — selection, transforms, floors, import/export
- `3d/editor/catalog.js` — reusable architecture and prop catalog
- `3d/editor/presets.js` — editable room presets
- `3d/data/custom-layout.json` — layout loaded by the game
- `3d/world/editable-layout.js` — JSON-to-game runtime
- `assets/external/LICENSES.md` — third-party license log

## Safe workflow

Keep one working JSON file in Git. Commit after a room or public area plays correctly. Test the actual walking path, doorway, camera, collision, and interactions before duplicating the room across floors.
