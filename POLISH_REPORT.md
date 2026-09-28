# Three-floor repair and polish report

## Change log

### Elevator overlap

**Problem:** Rooms 110, 210, and 310 occupied the elevator approach.

**Change:** Removed those three room modules and converted their bays into aligned, lit elevator lobbies with signs and seating. The playable inventory is now 27 real guest rooms.

**Reason:** A clear arrival space is more useful than retaining three architecturally broken rooms.

**Verification:** The exported GLB contains three `ELEVATOR_LOBBY_ROOT` modules, all three lift stops remain vertically aligned, and the browser test rides to every floor.

### Elevator interaction

**Problem:** The old interaction chose a destination automatically and gave weak arrival feedback.

**Change:** Added a floor-selection panel, disabled the current floor, and added departure/arrival indicators.

**Verification:** Browser QA selects Floors 2, 3, and the Lobby through the visible controls.

### Rooms and doors

**Problem:** Room 307 could sequence-break and other guest doors were decorative.

**Change:** Added one data-driven 27-room door system with closed, opening, open, closing, occupied, and mission-locked behavior. Room 307 unlocks only during the battery-delivery stage.

**Verification:** A clean-save browser test physically crosses every retained doorway with held movement input. Source tests verify the 27 authored hinges and the removal of Rooms 110, 210, and 310.

### Collision and camera

**Problem:** Public furniture lacked collision, low frame rates caused movement jumps, and the camera could enter walls or collapse at elevator and guest-room thresholds.

**Change:** Added simple collision boxes around major public furniture and structures, movement substeps with a capped delta, and a true first-person camera that stays inside the player collision volume. Carried mission items render at the lower-right of the first-person view.

**Verification:** Automated movement cannot cross exterior/public collision, Room 307 changes from blocked to traversable only after opening, and the browser test confirms first-person mode while crossing every room threshold.

### Hotel use and population

**Problem:** The hotel felt empty and stopped after First Shift.

**Change:** Added seven lightweight staff/guest figures, ambient dialogue, a data-driven request catalog, parcel carrying, room delivery, rewards, and a cooldown. Updated the manager terminal with three floors, room ranges, public areas, active guests, and YOU ARE HERE.

**Verification:** Browser QA completes First Shift and a second Room 205 request, then confirms save/reload and the terminal guest/map views.

### Visual and asset cleanup

**Problem:** Floor identity was weak and Room 301 contained unexplained floating pieces.

**Change:** Added gold/purple, magenta, and cyan floor accents, dedicated lift-lobby furnishings, and an emitter-mounted display for the Room 301 effect. The Blender process is reproducible rather than a hand-edited runtime-only export.

**Verification:** `assets/polished_hotel/verification.json` records 271 mesh objects, 414,138 vertices, 200,360 triangles, 27 rooms, three lift lobbies, and preserved Room 307 mission sockets.

## Performance

The earlier QA baseline was approximately 15.4 FPS in the lobby and 9.9 FPS on Floor 3. The polished build disables shadows, caps pixel ratio, culls meshes by active floor, shares NPC geometry, skips distant NPC updates, and uses simple collision boxes.

The final cache-disabled background Chrome probe measured:

| Area | FPS | Average frame | p95 frame |
|---|---:|---:|---:|
| Lobby | 60.0 | 16.67 ms | 16.8 ms |
| Floor 2 | 60.0 | 16.67 ms | 16.8 ms |
| Floor 3 | 59.5 | 16.82 ms | 16.8 ms |

Local asset readiness was 260 ms over the local HTTP server with browser cache disabled. These figures are from automated headless Chrome on the development machine and are suitable for regression comparison; deployed network load and other hardware will differ.

## Final QA

- First Shift: PASS
- Movement and low-FPS delta handling: PASS
- First-person camera: PASS across lift travel, Room 307, and all guest-room thresholds
- Structural and public-wing collision: PASS
- Three-floor elevator: PASS
- All 27 retained doors and doorway traversal: PASS
- Reception phone/computer targeting: PASS
- Room 307 sequence and delivery: PASS
- Guest rooms: PASS for access and doorway traversal
- Storage and carried battery: PASS
- Manager map and UI: PASS
- Seven-person starter population: PASS
- Repeatable Room 205 request: PASS
- Save/reload, pause, root entrypoint, and Classic: PASS
- Automated source/asset suite: 12/12 PASS

## Remaining future work

The current population uses efficient stylized figures with idle/look behavior rather than fully rigged characters. Repeatable work currently has two delivery definitions. Individual room furniture themes still share the established modular layouts. Rich staff schedules, more request types, animation rigs, room-specific effects, and deployed-hardware profiling remain future content work rather than blockers for this repair pass.

## Screenshots

The automated browser test writes the following ignored QA artifacts under `3d/`: `preview-lobby-polished.png`, `preview-public-wing-polished.png`, `preview-lounge-polished.png`, `preview-elevator-panel-polished.png`, `preview-floor2-polished.png`, `preview-floor3-polished.png`, `preview-standard-room-polished.png`, `preview-room307-polished.png`, `preview-storage-polished.png`, and `preview-computer-polished.png`.
