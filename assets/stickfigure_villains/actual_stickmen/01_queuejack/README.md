# Queuejack — actual stick-man asset 01

This character follows the blue ticket-holding Queuejack in the user's 30-character lineup image. It is a new asset, separate from the superseded cartoon-bodied `assets/stickfigure_villains/01_queuejack/` prototype. The game does **not** load it yet; integration belongs to the game code.

| Deliverable | File |
|---|---|
| Editable Blender source | `queuejack-stick.blend` |
| Game-ready export | `queuejack-stick.glb` |
| Build, export, and round-trip validation | `build.py`, `validate.py` |
| Multi-angle previews | `queuejack-front.png`, `queuejack-three-quarter.png`, `queuejack-side.png`, `queuejack-back.png` |
| Motion and QA previews | `queuejack-walk.png`, `queuejack-sit.png`, `queuejack-show-ticket.png`, `queuejack-neutral-gray.png`, `queuejack-black-silhouette.png`, `queuejack-hotel-scale.png`, and `qa-pose-*.png` |

**Export measurements:** 2.486 m high, 1.173 m wide including the raised ticket and arm, 0.427 m deep; feet at ground level. The GLB imports into Blender with Z-up and is converted by glTF to the game's Y-up convention. It contains one skinned mesh, 21 bones, 2,656 triangles, four flat materials, zero image textures, and 18 animation actions. The GLB is about 314 KiB. The rest-pose origin is at the feet. The 2.2 m gold bar in the hotel-scale preview is a QA marker only and is not exported.

Actions: `Idle`, `Walk`, `FastWalk`, `Turn`, `Talk`, `Listen`, `SitDown`, `SittingIdle`, `StandUp`, `HoldItem`, `GiveItem`, `ReceiveItem`, `Happy`, `Angry`, `Confused`, `Surprised`, `Impatient`, `Queuejack_ShowTicket`. The ticket is bound to `QUEUE_TICKET` in his raised hand. The asset does not include collision, AI, navigation, or game event wiring.

**QA:** inspected front, three-quarter, side, and back renders; neutral-gray and black-silhouette tests; a hotel height comparison; and representative movement, sit, ticket, and emotion poses. The arms, legs, and central body use continuous skinned tube surfaces so bends no longer look like stacked cylinder pieces. A Blender GLB re-import verified geometry, action count, scale, foot placement, triangle count, and material count. This is asset QA, not an in-game playtest. The show-ticket clip is a short gesture and should be triggered by game code.

**License/source:** original procedural mesh, materials, and animation from this project. No third-party model, texture, or audio is included. The supplied character lineup image is a design reference and is not redistributed in this folder.
