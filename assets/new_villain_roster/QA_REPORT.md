# 30-Villain Production QA

## Delivered

- 30 individual editable Blender files in `blend/`
- 30 individual game-ready GLBs in `glb/`
- 120 individual QA renders: front, three-quarter, side, and back
- Five-character batch lineups after every five models
- Final 30-character contact sheet, material lineup, neutral-gray pass, and silhouette pass
- `blend/all-30-villains-master.blend` with a 2.2 m player reference and 2.5 m doorway reference

## Verification

- Every GLB passed the glTF 2.0 binary header/length check.
- Every GLB was imported into Blender to assemble the master QA scene.
- Every individual character was visually inspected from four angles.
- Every character contains a named armature and exactly two exported animation clips (`Idle` and `Gesture`).
- Origins are at scene ground level; scene units are metric; exports are Y-up through Blender's glTF exporter.
- Total exported geometry: 574,088 triangles across 30 GLBs.
- Total GLB size: 16.00 MiB.

## Construction note

These are stylized modular characters. Limbs, facial features, garments, and accessories are overlapping connected visual components parented to a humanoid armature. They are intentionally efficient for a browser game and are not continuous organic sculpt topology. The coding pass still needs to assign NPC logic, navigation, collisions, mission behavior, and final animation controllers in Three.js.

## Scale

Character designs range from very small guests to tall guests and were checked beside a 2.2 m player proxy and a 2.5 m doorway. The game integrator should preserve the GLB scene scale and test collider width separately from visual width.
