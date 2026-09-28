# Grand Disaster polished hotel

This asset is a non-destructive post-process of the approved complete hotel.
It removes Rooms 110, 210, and 310, which occupied the elevator shaft approach,
and turns each former room bay into a clear elevator lobby. Room 307 and all
First Shift mission sockets remain intact.

`build_polished_hotel.py` imports the approved combined hotel, removes only the
three conflicting room interiors and door visuals, replaces the floating Room
301 ice pieces with an emitter-mounted display, adds floor-specific elevator
landing materials and signs, and exports an editable `.blend` plus game-ready
`.glb`.

Build with Blender 5.1 or newer:

```powershell
& 'C:\Program Files\Blender Foundation\Blender 5.1\blender.exe' --background --python assets/polished_hotel/build_polished_hotel.py
```

Units are meters. The GLB is Y-up. No external textures are required.

## Game-ready asset report

- Export: `grand_disaster_polished_hotel.glb` (14,680,860 bytes)
- Editable source: `grand_disaster_polished_hotel.blend`
- Mesh objects: 271
- Vertices: 414,138
- Triangles: 200,360
- Blender-space bounds: 40.475 m wide × 32.313 m deep × 13.600 m high
- Playable rooms: 27; Rooms 110, 210, and 310 are intentionally replaced by lift lobbies
- Textures: no external bitmap textures; compact procedural/material-color workflow
- Runtime SHA-256 match: the exported GLB is byte-identical to `3d/assets/grand_disaster_complete_asset_hotel.glb`

The machine-readable verification data is in `verification.json`.
