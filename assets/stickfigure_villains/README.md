# Villain character production

This folder is a new character-art branch for *Hotel for Supervillains*. The active game and `/classic/` are untouched. The previous roster is preserved on Git branch `backup/pre-stickfigure-roster`; previous untracked character work is in `C:\Users\Caleb Johnson\Downloads\hotel-character-roster-recovery-2026-09-29`.

## Status

The **new primary art direction is actual 3D stick men**, documented for all 30 guests in [`STICKMAN_DESIGN_PLAN.md`](STICKMAN_DESIGN_PLAN.md). The previous `DESIGN_PLAN.md`, foundation, and four numbered character assets are **superseded cartoon-bodied prototypes**. Their editable Blender files, GLBs, and renders remain for comparison and recovery, but they do not satisfy the new visual brief and should not be integrated into the game as the intended roster. New stick-man modeling has not started. No site deployment was made.

## Earlier prototype: 01 Queuejack

| Asset | File |
|---|---|
| Editable model, rig, actions, QA stage | `01_queuejack/01_queuejack.blend` |
| Prototype GLB | `01_queuejack/01_queuejack.glb` |
| Normal views | `queuejack-front.png`, `queuejack-three-quarter.png`, `queuejack-side.png`, `queuejack-back.png` in `01_queuejack/` |
| Motion views | `queuejack-walk.png`, `queuejack-sit.png`, `queuejack-ticket-flick.png` |
| Art checks | `queuejack-silhouette-front.png`, `queuejack-silhouette-three-quarter.png`, `queuejack-neutral-gray.png`, `queuejack-hotel-scale.png` |

Queuejack is an original 2.573 m tall villain with a long printed queue-ticket tail, fitted blue coat, gold lapels, smug face, and a cane with its own grip bone. Exported glTF is **Y-up**; re-import into Blender reported dimensions **0.933 × 1.232 × 2.573 m**, floor contact at **0.000 m**, **5,972 triangles**, **5 materials**, one skinned mesh, one skin, **27 bones**, and **18 clips** (17 shared hotel actions plus `Queuejack_TicketFlick`). GLB size is about 0.5 MB. The 2.2 m manager and 2.76 m door references are shown in `queuejack-hotel-scale.png`; they are not exported.

All meshes and materials were created in Blender with Python and visual Blender inspection. **Third-party models/textures: none.** All materials are flat node colors; **texture size: none**. The source `.blend` contains lighting, camera, and floor objects used only for QA. The GLB contains only the skinned character. The object origin is at ground center, with a clean root bone. The continuous ticket ribbon has its own feature bones, and the cane rotates clear of the floor during sitting.

The 17 shared clips are `Idle`, `Walk`, `FastWalk`, `Turn`, `Talk`, `Listen`, `SitDown`, `SittingIdle`, `StandUp`, `HoldItem`, `GiveItem`, `ReceiveItem`, `Happy`, `Angry`, `Confused`, `Surprised`, and `Impatient`. They are **animation assets**, not NPC behavior. The coding assistant still needs to select and blend clips, place the guest, implement navigation and interactions, and check clipping with actual hotel furniture. The ticket-flick clip should be triggered by a guest interaction/event. Collision should be supplied by the game, not generated from the character mesh.

## Earlier prototype: 02 Knickknack

The editable file is `02_knickknack/02_knickknack.blend` and the exported game asset is `02_knickknack/02_knickknack.glb`. The folder also contains front, three-quarter, side, back, walk, sitting, special pen-reveal, neutral-gray, silhouette, and hotel-scale renders. Knickknack is a tiny, pear-shaped, nervous guest with a giant teal loot sack and a souvenir hotel pen. The sack and pen have dedicated rig bones; the special clip is `Knickknack_DisplayHotelPen`.

The exported GLB was re-imported and measured at **1.212 × 0.556 × 0.998 m**, floor contact **0.000 m**, **6,254 triangles**, **5 flat-color materials**, one skinned mesh, **23 bones**, and **18 clips** (17 shared plus the special). It is **491,436 bytes**. Front, three-quarter, side, back, walk, sitting, gray, black-silhouette, and hotel-scale views were visually inspected. The pen-reveal height was corrected after inspection; the last export has no gap between the pen and sack opening. The sack makes this guest considerably wider than his body, so game collision and doorway placement require an integration test.

These characters and all their materials are original Blender geometry with **no external textures or third-party licenses**.

## Earlier prototype: 03 Mrs Mute

The editable file is `03_mrs_mute/03_mrs_mute.blend`; the Y-up export is `03_mrs_mute/03_mrs_mute.glb`. Her defining silhouette is a broad padded acoustic collar around a narrow plum figure. She holds a small cyan hotel bell and has an unimpressed expression. `MrsMute_RingAndIgnore` is her character clip. Front, three-quarter, side, back, walk, sitting, special-action, gray, black-silhouette, and hotel-scale previews are alongside the files.

The GLB re-import measured **1.024 × 0.858 × 1.889 m**, floor contact **0.000 m**, **7,340 triangles**, **5 flat-color materials**, one skinned mesh, **21 bones**, and **18 clips**. It is **536,520 bytes**. The first walk export clipped the shoes by about 2 cm; the final export raises walk contact and passed the repeated floor sample. Her collar is close to a 1 m overall width, so integration should verify doorway and nearby NPC spacing. All geometry/materials are original and untextured; **third-party licenses: none**.

## Earlier prototype: 04 Patchwork Pete

The editable file is `04_patchwork_pete/04_patchwork_pete.blend`; the Y-up export is `04_patchwork_pete/04_patchwork_pete.glb`. He has a broad, short silhouette, uneven proud face, and one huge orange stitched torso repair. A tiny needle is his optional secondary prop. `PatchworkPete_SlapPatch` animates an admiring slap and patch response. Front, three-quarter, side, back, walk, sitting, special-action, gray, black-silhouette, and hotel-scale previews are alongside the files.

The re-imported GLB measured **1.230 × 0.616 × 1.688 m**, floor contact **0.000 m**, **5,736 triangles**, **5 flat-color materials**, one skinned mesh, **21 bones**, and **18 clips**. It is **468,056 bytes**. The first fabric slab showed torso clipping; its depth and placement were corrected before delivery. Walk contact was also raised after a sampled export exposed shoe penetration. All geometry/materials are original and untextured; **third-party licenses: none**.

## Build and validation

In Blender 5.1, run `scripts/build_foundation.py`, then each `build_*.py` character script separately. Their corresponding `qa_*.py` scripts generate gray, silhouette, and hotel-scale previews without altering the deliverables. `scripts/validate_01_queuejack.py` and `scripts/validate_character.py -- <folder> <height>` re-import GLBs and check mesh, skin, action count, metric scale, floor origin, and sampled animation contact. The project’s basic Node tests also pass (9/9).

Those earlier files passed structural GLB checks for the old direction, not the new stick-man visual gate. Production now restarts at Character 01 Queuejack under `STICKMAN_DESIGN_PLAN.md`. Its new Blender file should be visually inspected and tested before Character 02 begins.
