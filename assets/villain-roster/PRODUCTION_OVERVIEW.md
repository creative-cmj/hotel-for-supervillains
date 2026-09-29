# Villain Character Production Overview

All 30 individual source prompts in `assets/villain-roster/prompts/` were read before the production geometry was changed. The prompt files control each character’s scale, proportions, palette, clothing direction, expression, signature prop, and whether any object may intentionally float.

## Shared production system

- Three reusable connected-body foundations: standard, short/soft, and large/heavy, with tall and asymmetrical proportion variants.
- Capsule arm and leg meshes overlap modeled shoulder, elbow, knee, wrist, hip, and ankle transitions.
- Every hand contains a palm, thumb, and grouped fingers or a prompt-authorized equivalent such as stone or mechanical hands.
- Shoes use rounded game-ready geometry with toe, heel, and sole volume.
- Hair is attached to the scalp; clothing profiles overlap the underlying body and use fitted hems, lapels, collars, belts, or capes where the prompt asks for them.
- Shared standard, tall, short, heavy, stone, slime, and mechanical animation structures are available to the runtime.
- Original project materials only. There are no third-party character models or textures.

## Character matrix

| # | Batch | Character | Scale | Target height | Head ratio | Shoulder ratio | Foundation | Required signature | Intentional floats | Triangles | GLB size |
|---:|:---:|---|---:|---:|---:|---:|---|---|---:|---:|---:|
| 1 | A | Doctor Drizzle | 1.04× | 2.132 m | 0.25 | 0.9 | tall | weatherDial | 0 | 5,408 | 144.0 KB |
| 2 | A | Professor Freezerburn | 0.86× | 1.763 m | 0.33 | 1.2 | round | iceScraper | 0 | 5,426 | 139.2 KB |
| 3 | A | Captain Combustion | 1.08× | 2.214 m | 0.25 | 1.4 | athletic | extinguisher | 0 | 5,350 | 141.9 KB |
| 4 | A | Baron Battery | 0.98× | 2.009 m | 0.25 | 1.1 | barrel | batteryCane | 0 | 5,288 | 134.9 KB |
| 5 | A | Madame Vine | 1.07× | 2.193 m | 0.2 | 0.8 | elegant | pruningShears | 0 | 5,838 | 142.7 KB |
| 6 | B | Doctor Buffering | 1.00× | 2.050 m | 0.25 | 0.9 | slouch | tablet | 0 | 5,032 | 126.0 KB |
| 7 | B | Professor Kaboom | 0.75× | 1.537 m | 0.33 | 1 | tiny | detonator | 0 | 5,310 | 138.5 KB |
| 8 | B | Lord Side-Eye | 1.16× | 2.378 m | 0.25 | 0.7 | skinny | umbrellaCane | 0 | 5,652 | 146.9 KB |
| 9 | B | Mister Monday | 0.99× | 2.029 m | 0.25 | 0.9 | slouch | coffeeCup | 0 | 5,920 | 149.3 KB |
| 10 | B | The Landlord | 0.94× | 1.927 m | 0.2 | 1.3 | blocky | brassKey | 0 | 5,556 | 145.8 KB |
| 11 | C | Sir Sludge | 0.91× | 1.865 m | 0.25 | 1.2 | slime | spoonSword | 0 | 5,284 | 124.0 KB |
| 12 | C | Count Confusion | 1.05× | 2.152 m | 0.25 | 0.8 | cape | stageWand | 0 | 5,408 | 144.0 KB |
| 13 | C | The Auditor | 1.00× | 2.050 m | 0.22 | 0.8 | rigid | ledger | 0 | 5,064 | 130.1 KB |
| 14 | C | Professor Gravity | 0.97× | 1.988 m | 0.29 | 0.8 | average | gravityDial | 2 | 5,504 | 137.0 KB |
| 15 | C | DJ Doom | 1.01× | 2.071 m | 0.25 | 1.3 | broad | headphones | 0 | 5,340 | 137.6 KB |
| 16 | D | Sandmaniac | 0.99× | 2.029 m | 0.24 | 0.9 | wrapped | sandTimer | 0 | 5,220 | 132.8 KB |
| 17 | D | General Glitch | 1.03× | 2.111 m | 0.2 | 1.3 | asymmetric | commandBracer | 0 | 3,456 | 109.6 KB |
| 18 | D | Mister Midnight | 1.09× | 2.235 m | 0.25 | 1 | hooded | lantern | 0 | 5,340 | 139.2 KB |
| 19 | D | Lady Luxury | 1.06× | 2.173 m | 0.2 | 0.8 | regal | gemCane | 0 | 5,372 | 141.2 KB |
| 20 | D | Doctor Oops | 0.90× | 1.845 m | 0.33 | 0.9 | lopsided | bentRayGun | 0 | 5,472 | 163.1 KB |
| 21 | E | The Pigeon King | 0.92× | 1.886 m | 0.2 | 1.1 | barrel | pigeon | 0 | 5,600 | 141.6 KB |
| 22 | E | Chef Catastrophe | 1.03× | 2.111 m | 0.25 | 1.4 | round | spatula | 0 | 5,832 | 144.0 KB |
| 23 | E | Captain Coupon | 0.89× | 1.824 m | 0.33 | 0.8 | skinny | coupon | 0 | 5,516 | 143.5 KB |
| 24 | E | The Uninvited Guest | 1.00× | 2.050 m | 0.24 | 0.9 | average | keycard | 0 | 5,184 | 142.3 KB |
| 25 | E | Professor Nap | 0.87× | 1.783 m | 0.33 | 1 | soft | pillow | 0 | 5,192 | 134.2 KB |
| 26 | F | Mister Magnet | 0.96× | 1.968 m | 0.25 | 1.2 | armored | magnetGauntlet | 3 | 5,612 | 144.6 KB |
| 27 | F | Doctor Bubble | 0.93× | 1.906 m | 0.27 | 0.9 | bubble | bubbleWand | 0 | 5,592 | 142.7 KB |
| 28 | F | King Concrete | 1.23× | 2.521 m | 0.17 | 1.6 | rock | permitPlaque | 0 | 4,580 | 124.1 KB |
| 29 | F | Agent Awkward | 1.02× | 2.091 m | 0.2 | 0.8 | skinny | earpiece | 0 | 5,268 | 136.7 KB |
| 30 | F | The Final Boss | 1.27× | 2.603 m | 0.125 | 1.7 | boss | tinyClipboard | 0 | 4,396 | 115.1 KB |

## QA status

- Total geometry: 159,012 triangles across 30 runtime characters.
- All 30 GLBs parse successfully, have feet at `y=0`, remain below 10,000 triangles each, and fit the hotel circulation bounds.
- Every GLB contains shared `Idle`, `Walk`, `Turn`, and `Gesture` node-animation clips. Runtime NPCs also idle, turn toward the player, move their arms, and look around.
- Automated attachment checks cover head/neck, neck/torso, torso/hips, both arms/hands, and both legs/feet.
- Neutral-gray and black-silhouette inspection modes are built into the roster viewer.
- The browser QA captures front, front three-quarter, right, back three-quarter, back, left, high, low, face, hands, neutral gray, and black silhouette views.
- Sit, talk, item-specific holding, reactions, and villain-laugh clips remain a later animation expansion.

Combined GLB size: 4.04 MB.
