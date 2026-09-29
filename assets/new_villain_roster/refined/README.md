# Queuejack — Character 01 refined pass

This folder contains the second-pass production asset for **Queuejack only**. Character 02 and the rest of the roster were not modified.

## Deliverables

- `blend/01-queuejack-refined.blend` — editable Blender source with named geometry, materials, a simple future-animation skeleton, and QA lighting/camera stage.
- `glb/01-queuejack-refined.glb` — game-ready static visual export under the single `QUEUEJACK_ROOT` node.
- `renders/01-queuejack-refined-{front,left,right,back,hero}.png` — inspected angle renders.
- `renders/01-queuejack-old-vs-refined.png` — preserved blockout beside the refined model.

The original blockout remains at `../blend/01-queuejack.blend` and `../glb/01-queuejack.glb`.

## Verified export data

| Property | Value |
|---|---:|
| Exported mesh nodes | 49 |
| Triangles | 11,831 |
| Bounds | 1.145 m wide × 0.808 m deep × 2.803 m high |
| Lowest geometry | 0.010 m |
| GLB size | 398,012 bytes |
| Textures | None; compact PBR materials only |
| GLB root | `QUEUEJACK_ROOT` |

The exported GLB was imported into a clean temporary Blender scene after export. Its hierarchy, dimensions, ground contact, mesh count, triangle count, and file size were measured from the imported result. Blender converts its Z-up authoring scene to glTF's Y-up convention on export.

## Art and topology changes

- Replaced spherical shoulder caps and disconnected joint pieces with continuous tapered sleeves.
- Rebuilt the coat from a custom ring mesh with sloped shoulders, waist taper, split tails, lapels, trim, buttons, and a claim-ticket pocket.
- Rebuilt the long head with a cheek/jaw silhouette, tiny eyes, directional brows, nose, asymmetric smile, ears, and swept hair.
- Added connected tapered legs, pointed dress shoes with soles, wrist cuffs, palms, and thumbs.
- Posed one arm around the signature queue-post baton and offset the feet for an impatient, forward-moving stance.
- Added a readable glowing baton lens and ticket detail without particle effects.

## Materials and license

All geometry, materials, and design work in this refined asset are original for *Hotel for Supervillains*. No third-party models or textures are included, so no external attribution is required.

The GLB is ready for scale and visual testing in Three.js. The skeleton in the `.blend` is a simple editable setup for a later animation pass; animation and skin-weight approval should happen before production rigging.
