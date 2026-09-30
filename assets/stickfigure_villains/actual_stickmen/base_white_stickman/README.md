# White stick-person base

This is an original Blender interpretation of the user's white stick-person turnaround. It is a **reference base** for future villain characters, separate from Queuejack and from the playable game. No game code or existing character file was changed.

| File | Purpose |
|---|---|
| `base-white-stickman.blend` | Editable Blender source with rig, meshes, facial shape keys, and a QA lighting stage |
| `base-white-stickman.glb` | Game-ready Y-up export containing only the rig and character meshes |
| `build.py`, `validate.py` | Rebuild and GLB round-trip verification |
| `base-*.png` | Front, three-quarter, side, three-quarter back, and back renders |
| `expression-*.png` | Neutral plus five expression close-ups |

**Size and performance:** 2.213 m tall, 0.876 m wide, 0.611 m deep, with feet at ground level. The GLB has two skinned meshes, 17 bones, 4,768 triangles, three flat materials, five facial morph targets, and no image textures. Blender displays Z-up; the exported GLB uses glTF's Y-up convention.

The `StickPerson_Rig` has root, pelvis, torso, neck, head, paired upper/lower arms, hands, thighs, shins, and feet. Face shape keys on `StickPerson_ExpressionFace` are `Happy`, `Angry`, `Surprised`, `Confused`, and `Sad`; zero values give the neutral smile. These are expression controls, **not** pre-made movement animations. The character is intentionally plain so future villains can receive distinct colors, silhouettes, props, proportions, and animation without copying one guest design.

**QA:** inspected all five angles and six face previews against the supplied image, then corrected shoulder/hip joins, shoe profile, expression shapes, and studio lighting. Blender re-import of the GLB verified the rig, both skinned meshes, morph targets, orientation/size after glTF conversion, ground contact, triangle count, and materials. This is asset verification, not an in-game playtest.

**License:** all mesh geometry, rigging, facial shapes, materials, and renders were made for this repository. No third-party model or texture is included. The user-provided image was used only as a visual reference and is not redistributed here.
