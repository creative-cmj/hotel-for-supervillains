# Grand Disaster final interior asset pack

This asset-only handoff completes the planned environment and manager modeling pass. It does not modify the Classic game.

## Included

- Ten named Floor 3 theme modules: cold, technology, botanical, luxury, reinforced, acoustic/illusion, Room 307 weather instruments, containment, gravity/cosmic, and high security.
- Floor 2 cleaning cart, linen shelf, staff station, maintenance panel, amenity bins, and towels.
- Floor 3 observation desk, security monitors, containment cabinet, and movable maintenance case.
- Reception key rack, room-key tags, request-ticket tray, and tickets.
- Original static hotel-manager model as separate editable `.blend` and game-ready `.glb` files.
- A combined hotel GLB containing the previous three-floor furnished hotel, Floor 1 public wings, and this final interior layer.

## Files

- `grand_disaster_final_interior_pack.blend/.glb` — editable and optimized add-on pack for integration.
- `grand_disaster_complete_asset_hotel.blend/.glb` — combined visual reference.
- `grand_disaster_manager.blend/.glb` — static manager model at real-world scale.
- `verification.json` — clean Blender re-import statistics.
- `previews/` — inspected room-module, service-prop, and character views.

GLBs use meters, Y-up, and face +Z. Materials are embedded and require no external textures. Named room roots are gameplay sockets. `CLEANING_CART_MOVABLE` and `MAINTENANCE_CASE_MOVABLE` remain separate interaction targets. Room 307's existing weather machine and battery-placement root are preserved in the combined hotel.

The manager file is deliberately unrigged. Its root carries `rig_status = static_unrigged`; locomotion and animation requirements still need agreement with the coding/animation integrator before rigging.

## Integration boundary

The coding assistant still owns collision, navmesh or movement blocking, door and elevator animation, interactions, saving, task logic, effects, selective loading, and browser playtesting. The combined hotel is a review reference; the smaller add-on GLB is the preferred integration source.
