# Character Technical Report

**Roster:** 30 characters
**Total standalone-lineup geometry:** 66,124 triangles
**Coordinate system:** Three.js Y-up
**Units:** 1 unit = 1 meter
**Textures:** none; compact PBR colors/emission are generated in code
**Third-party character assets:** none

Each character is built from reusable browser-ready geometry with a named root, head, neck, torso, hips, upper/lower limbs, two intentional hands, feet, face parts, and silhouette accessories. Origins sit at the feet. Joints overlap slightly so normal poses do not reveal gaps. The runtime has idle bobbing, head movement, and player-facing behavior. Full walk, sit, hold-item, reaction, and laugh animation clips remain future animation work; these are articulated object hierarchies rather than skinned Blender rigs.

| # | Character | Meshes | Triangles | Dimensions (m) | QC |
|---:|---|---:|---:|---|---|
| 1 | Doctor Drizzle | 34 | 2,456 | 1.122 × 3.018 × 0.76 | Complete |
| 2 | Professor Freezerburn | 26 | 2,460 | 1.434 × 2.186 × 1.12 | Complete |
| 3 | Captain Combustion | 34 | 1,958 | 1.288 × 2.803 × 0.84 | Complete |
| 4 | Baron Battery | 33 | 1,600 | 1.651 × 2.094 × 1.02 | Complete |
| 5 | Madame Vine | 38 | 3,244 | 1.233 × 2.527 × 0.8 | Complete |
| 6 | Doctor Buffering | 34 | 2,292 | 1.184 × 2.416 × 0.815 | Complete |
| 7 | Professor Kaboom | 39 | 2,794 | 1.032 × 2.474 × 0.86 | Complete |
| 8 | Lord Side-Eye | 32 | 2,388 | 0.976 × 2.643 × 0.659 | Complete |
| 9 | Mister Monday | 25 | 2,136 | 1.216 × 2.096 × 0.86 | Complete |
| 10 | The Landlord | 34 | 1,792 | 1.38 × 2.076 × 0.9 | Complete |
| 11 | Sir Sludge | 35 | 2,428 | 1.503 × 2.316 × 1.364 | Complete |
| 12 | Count Confusion | 34 | 2,344 | 1.205 × 2.792 × 0.84 | Complete |
| 13 | The Auditor | 39 | 3,412 | 1.155 × 2.246 × 0.72 | Complete |
| 14 | Professor Gravity | 29 | 1,560 | 1.547 × 2.395 × 1.123 | Complete |
| 15 | DJ Doom | 35 | 2,424 | 1.49 × 2.35 × 0.96 | Complete |
| 16 | Sandmaniac | 31 | 2,068 | 1.174 × 2.329 × 0.8 | Complete |
| 17 | General Glitch | 31 | 1,496 | 1.401 × 2.649 × 0.88 | Complete |
| 18 | Mister Midnight | 30 | 1,652 | 1.401 × 2.568 × 0.92 | Complete |
| 19 | Lady Luxury | 39 | 2,476 | 1.226 × 2.716 × 0.84 | Complete |
| 20 | Doctor Oops | 30 | 2,256 | 1.33 × 2.054 × 0.84 | Complete |
| 21 | The Pigeon King | 37 | 2,284 | 1.565 × 2.24 × 1.06 | Complete |
| 22 | Chef Catastrophe | 27 | 2,320 | 1.434 × 2.478 × 1.12 | Complete |
| 23 | Captain Coupon | 38 | 1,996 | 0.976 × 2.526 × 0.64 | Complete |
| 24 | The Uninvited Guest | 36 | 2,128 | 1.201 × 2.624 × 0.8 | Complete |
| 25 | Professor Nap | 26 | 1,848 | 1.545 × 2.519 × 1 | Complete |
| 26 | Mister Magnet | 36 | 2,432 | 1.795 × 2.149 × 1 | Complete |
| 27 | Doctor Bubble | 35 | 3,096 | 1.392 × 2.239 × 1.12 | Complete |
| 28 | King Concrete | 30 | 1,432 | 2.051 × 2.708 × 1.39 | Complete |
| 29 | Agent Awkward | 31 | 2,068 | 1.282 × 2.309 × 0.72 | Complete |
| 30 | The Final Boss | 27 | 1,284 | 1.975 × 3.138 × 1.28 | Complete |

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