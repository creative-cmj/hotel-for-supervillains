# Character Technical Report

**Roster:** 30 characters
**Total standalone-lineup geometry:** 159,012 triangles
**Coordinate system:** Three.js Y-up
**Units:** 1 unit = 1 meter
**Textures:** none; compact PBR colors/emission are generated in code
**Third-party character assets:** none

Each character is built from reusable browser-ready geometry with a named root, head, neck, torso, hips, upper/lower limbs, two intentional hands, feet, face parts, and silhouette accessories. Origins sit at the feet. Joints overlap slightly so normal poses do not reveal gaps. The runtime has idle bobbing, head movement, and player-facing behavior. Full walk, sit, hold-item, reaction, and laugh animation clips remain future animation work; these are articulated object hierarchies rather than skinned Blender rigs.

| # | Character | Meshes | Triangles | Dimensions (m) | QC |
|---:|---|---:|---:|---|---|
| 1 | Doctor Drizzle | 45 | 5,408 | 0.894 × 2.132 × 0.563 | Complete |
| 2 | Professor Freezerburn | 42 | 5,426 | 0.857 × 1.763 × 0.562 | Complete |
| 3 | Captain Combustion | 44 | 5,350 | 1.128 × 2.214 × 0.685 | Complete |
| 4 | Baron Battery | 41 | 5,288 | 1.162 × 2.009 × 0.794 | Complete |
| 5 | Madame Vine | 44 | 5,838 | 0.841 × 2.193 × 0.502 | Complete |
| 6 | Doctor Buffering | 44 | 5,032 | 1.05 × 2.05 × 0.652 | Complete |
| 7 | Professor Kaboom | 43 | 5,310 | 0.696 × 1.538 × 0.544 | Complete |
| 8 | Lord Side-Eye | 44 | 5,652 | 0.814 × 2.378 × 0.508 | Complete |
| 9 | Mister Monday | 46 | 5,920 | 1.25 × 2.029 × 0.742 | Complete |
| 10 | The Landlord | 46 | 5,556 | 1.231 × 1.927 × 0.868 | Complete |
| 11 | Sir Sludge | 39 | 5,284 | 1.254 × 1.865 × 0.811 | Complete |
| 12 | Count Confusion | 45 | 5,408 | 0.815 × 2.152 × 0.564 | Complete |
| 13 | The Auditor | 41 | 5,064 | 0.857 × 2.05 × 0.633 | Complete |
| 14 | Professor Gravity | 42 | 5,504 | 0.86 × 1.988 × 0.56 | Complete |
| 15 | DJ Doom | 43 | 5,340 | 1.138 × 2.071 × 0.78 | Complete |
| 16 | Sandmaniac | 42 | 5,220 | 0.918 × 2.029 × 0.613 | Complete |
| 17 | General Glitch | 38 | 3,456 | 1.375 × 2.111 × 0.88 | Complete |
| 18 | Mister Midnight | 44 | 5,340 | 0.968 × 2.235 × 0.695 | Complete |
| 19 | Lady Luxury | 44 | 5,372 | 0.869 × 2.173 × 0.657 | Complete |
| 20 | Doctor Oops | 44 | 5,472 | 1.045 × 1.845 × 0.592 | Complete |
| 21 | The Pigeon King | 46 | 5,600 | 1.042 × 1.886 × 0.65 | Complete |
| 22 | Chef Catastrophe | 45 | 5,832 | 1.143 × 2.111 × 0.726 | Complete |
| 23 | Captain Coupon | 44 | 5,516 | 0.625 × 1.824 × 0.408 | Complete |
| 24 | The Uninvited Guest | 42 | 5,184 | 0.994 × 2.05 × 0.821 | Complete |
| 25 | Professor Nap | 41 | 5,192 | 1.018 × 1.783 × 0.656 | Complete |
| 26 | Mister Magnet | 43 | 5,612 | 1.302 × 1.968 × 0.685 | Complete |
| 27 | Doctor Bubble | 43 | 5,592 | 0.91 × 1.906 × 0.61 | Complete |
| 28 | King Concrete | 44 | 4,580 | 1.812 × 2.521 × 1.54 | Complete |
| 29 | Agent Awkward | 46 | 5,268 | 0.936 × 2.091 × 0.797 | Complete |
| 30 | The Final Boss | 37 | 4,396 | 1.857 × 2.603 × 1.447 | Complete |

## Runtime integration

- Doctor Drizzle keeps the existing Room 307 mission model and behavior.
- The other 29 guests are placed across the lobby/public spaces and accessible rooms on all three floors.
- Every new guest has interaction dialogue and a repeatable hotel-service request.
- The manager computer guest list includes the complete roster.
- Shared materials and cached geometries keep browser cost low.

## Verification

- Automated body, hands, origin, dimensions, triangle limits, uniqueness, placement, and request-coverage tests run in six batches of five.
- Browser QA renders all six batches and records full-lineup front, back, and side views.
- The complete hotel route is exercised separately by `tests/browser-vertical-slice.mjs`.