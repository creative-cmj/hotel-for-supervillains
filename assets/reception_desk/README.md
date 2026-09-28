# Grand Disaster reception desk

Proof asset for *Hotel for Supervillains: The Grand Disaster*.

## Integration

- `grand_disaster_reception_desk.glb` is the game-ready model.
- `grand_disaster_reception_desk.blend` is the editable Blender 5.1 source.
- Units are meters. The root origin is at the center of the desk footprint on the floor.
- The GLB is Y-up and its customer-facing front points toward local `+Z`.
- The rear work surface contains a cyan computer-placement inlay and a pink phone-placement inlay. They are visual guides, not colliders or embedded props.
- Use a simple box collider sized to the desired player clearance; collision geometry is intentionally left to the game integrator.

## Art and materials

The asset uses seven named, reusable PBR materials and no image textures. All geometry and materials are original project work. No third-party models, textures, fonts, or copyrighted character designs are included.

## Files

- `preview_front.png`
- `preview_rear.png`
- `preview_three_quarter.png`
- `verification.json` — measured bounds, topology, materials, transform checks, and GLB re-import results
- `build_reception_desk.py` — deterministic Blender build/export/verification script

## Verified asset data

| Asset | Bounds | Mesh objects | Vertices | Triangles | Materials | Textures |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| Grand Disaster reception desk | 7.200 × 1.757 × 1.163 m | 27 | 6,488 | 3,272 | 7 | None |

The GLB is 233,144 bytes. All mesh scales are applied, every mesh has a material, the root re-imports at `(0, 0, 0)`, the geometry touches the placement plane at zero height, and the re-imported triangle count exactly matches the source export.

Named component groups include the main carcass, countertop, front facets, gold dividers and edge trim, central octagonal crest, cyan gem, pink lightning mark, cable channel, cable grommets, computer bay inlay, and phone bay inlay. The source also contains a clearly named `PREVIEW_ONLY` collection for lighting and renders; that collection is excluded from the GLB.

Run the builder with:

```powershell
& 'C:\Program Files\Blender Foundation\Blender 5.1\blender.exe' --background --python build_reception_desk.py
```

The script exports the GLB, renders all previews, saves the editable source, clears the scene, re-imports the GLB, and fails if size, origin, transforms, materials, or triangle counts do not verify.
