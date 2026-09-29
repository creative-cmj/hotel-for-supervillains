# Character Technical Report

**Roster:** 30 characters
**Total standalone-lineup geometry:** 76,400 triangles
**Coordinate system:** Three.js Y-up
**Units:** 1 unit = 1 meter
**Textures:** none; compact PBR colors/emission are generated in code
**Third-party character assets:** none

Each character is built from reusable browser-ready geometry with a named root, head, neck, torso, hips, upper/lower limbs, two intentional hands, feet, face parts, and silhouette accessories. Origins sit at the feet. Joints overlap slightly so normal poses do not reveal gaps. The runtime has idle bobbing, head movement, and player-facing behavior. Full walk, sit, hold-item, reaction, and laugh animation clips remain future animation work; these are articulated object hierarchies rather than skinned Blender rigs.

| # | Character | Meshes | Triangles | Dimensions (m) | QC |
|---:|---|---:|---:|---|---|
| 1 | Doctor Drizzle | 36 | 2,536 | 1.122 × 3.028 × 0.76 | Complete |
| 2 | Professor Freezerburn | 28 | 2,796 | 1.507 × 2.196 × 1.12 | Complete |
| 3 | Captain Combustion | 36 | 2,038 | 1.288 × 2.813 × 0.84 | Complete |
| 4 | Baron Battery | 37 | 1,712 | 1.651 × 2.104 × 1.02 | Complete |
| 5 | Madame Vine | 38 | 3,244 | 1.233 × 2.537 × 0.8 | Complete |
| 6 | Doctor Buffering | 36 | 2,372 | 1.184 × 2.426 × 0.815 | Complete |
| 7 | Professor Kaboom | 41 | 2,874 | 1.032 × 2.484 × 0.86 | Complete |
| 8 | Lord Side-Eye | 34 | 2,468 | 0.976 × 2.653 × 0.659 | Complete |
| 9 | Mister Monday | 36 | 4,276 | 1.598 × 1.91 × 1.16 | Complete |
| 10 | The Landlord | 59 | 3,080 | 1.721 × 2.024 × 1.286 | Complete |
| 11 | Sir Sludge | 35 | 2,428 | 1.503 × 2.316 × 1.364 | Complete |
| 12 | Count Confusion | 36 | 2,424 | 1.205 × 2.802 × 0.84 | Complete |
| 13 | The Auditor | 55 | 3,496 | 1.101 × 2.601 × 0.61 | Complete |
| 14 | Professor Gravity | 29 | 1,560 | 1.547 × 2.395 × 1.123 | Complete |
| 15 | DJ Doom | 37 | 2,504 | 1.49 × 2.36 × 0.96 | Complete |
| 16 | Sandmaniac | 33 | 2,148 | 1.174 × 2.339 × 0.8 | Complete |
| 17 | General Glitch | 35 | 1,608 | 1.401 × 2.659 × 0.88 | Complete |
| 18 | Mister Midnight | 34 | 1,764 | 1.401 × 2.578 × 0.92 | Complete |
| 19 | Lady Luxury | 41 | 2,556 | 1.226 × 2.726 × 0.84 | Complete |
| 20 | Doctor Oops | 49 | 4,272 | 1.342 × 1.955 × 0.971 | Complete |
| 21 | The Pigeon King | 39 | 2,364 | 1.565 × 2.25 × 1.06 | Complete |
| 22 | Chef Catastrophe | 29 | 2,656 | 1.507 × 2.488 × 1.12 | Complete |
| 23 | Captain Coupon | 40 | 2,076 | 0.976 × 2.536 × 0.64 | Complete |
| 24 | The Uninvited Guest | 36 | 2,128 | 1.201 × 2.634 × 0.8 | Complete |
| 25 | Professor Nap | 28 | 2,184 | 1.582 × 2.529 × 1 | Complete |
| 26 | Mister Magnet | 38 | 2,512 | 1.795 × 2.159 × 1 | Complete |
| 27 | Doctor Bubble | 37 | 3,176 | 1.392 × 2.249 × 1.12 | Complete |
| 28 | King Concrete | 36 | 2,440 | 2.051 × 2.718 × 1.39 | Complete |
| 29 | Agent Awkward | 40 | 2,416 | 1.448 × 2.46 × 1.056 | Complete |
| 30 | The Final Boss | 33 | 2,292 | 1.975 × 3.148 × 1.28 | Complete |

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