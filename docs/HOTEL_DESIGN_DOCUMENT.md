# The Grand Disaster — Hotel Design Document

**Project:** *Hotel for Supervillains: The Grand Disaster*  
**Document status:** Planning reference for approval  
**Implementation target:** Existing Three.js browser game  
**Concept source:** Supplied Roblox-style visual concept board, used as reference rather than a literal blueprint

## 1. Purpose and locked decisions

This document converts the strongest ideas in the concept board into a hotel that can support physical player movement, working doors, elevator travel, guest requests, staff activity, and future expansion.

The concept board calls the project a Roblox game, but the current repository and `DESIGN_LOCK.md` define a Three.js browser game. This plan follows the existing project unless the owner explicitly changes platforms later. The chunky, readable proportions in the reference remain useful as an art-direction cue.

The following requirements stay locked:

- The player physically works as the hotel manager.
- The hotel is the main interface; management actions happen at physical objects.
- The first-shift phone, battery, elevator, Room 307, Doctor Drizzle, and manager-computer route must remain intact.
- The completed core hotel has three navigable floors with ten accessible guest rooms on each floor: 101–110, 201–210, and 301–310.
- The existing `/classic/` game remains separate and playable.
- The visual identity is luxury hotel plus playful supervillain headquarters: purple, black, warm gold, cyan, and restrained hot pink.
- The environment stays bright and readable.
- Existing modular architecture and approved assets are reused.
- Original characters replace any recognizable copyrighted designs.

## 2. Concept-board analysis

### Strong ideas to preserve

- A three-story central hotel mass with lower side wings and a highly visible entrance.
- A lightning-bolt hotel emblem used as a navigation landmark.
- Large cyan windows framed by dark purple walls and gold trim.
- A bright magenta roofline that gives the silhouette energy without turning the whole building into cyberpunk scenery.
- Reception as the visual center of the lobby.
- Elevators with gold frames and cyan indicators.
- Repeating room doors, plaques, lighting, and carpet patterns that make hallways readable.
- Standard rooms that share a common hotel kit but receive guest-specific props and color accents.
- A more theatrical third floor with VIP and special-room equipment.
- An active lobby with seating, luggage, plants, staff, and guest traffic while preserving broad walking lanes.

### Problems corrected from the image

- The Floor 2 diagram duplicates room 207 and omits a consistent sequence. The implementation uses 201–210.
- The Floor 3 diagram shows only a few rooms. The project requirement remains ten accessible rooms, 301–310.
- Several spaces in the concept are too tightly packed for a third-person player with a 0.35 m collision radius. Circulation widths are increased.
- The concept places some public rooms without believable service access. Restaurant, kitchen, bar, storage, and staff routes receive a connected back-of-house path.
- Stairs are visually absent. A compact emergency/service stair is planned beside the elevator core. The elevator remains the primary player route.
- The image mixes many character styles. Production characters will share consistent proportions, materials, facial language, and silhouette rules.
- The concept includes AI-generated labels and details that cannot be treated as construction dimensions.

## 3. Hotel overview

The Grand Disaster is organized around one simple navigation sentence:

> Enter the hotel, see reception, find the elevators, choose a floor, follow numbered doors.

The current building footprint already supports a central room corridor and a front public zone. The final plan expands the public floor laterally rather than sacrificing the ten Floor 1 guest rooms.

### Spatial standards

| Element | Planning standard |
| --- | --- |
| Floor elevations | 0 m, 4.5 m, and 9 m |
| Typical wall height | Approximately 4.0–4.8 m |
| Main lobby clear aisle | 3.0–4.0 m |
| Guest corridor clear width | 2.8–3.2 m |
| Service corridor clear width | 1.8–2.2 m |
| Usable doorway opening | 1.2–1.4 m |
| Elevator entrance clear zone | At least 2.5 m deep |
| Room-door approach | At least 1.5 m clear in front of each door |
| Furniture circulation | At least 1.0 m; 1.2 m on objective routes |
| Player reference | Approximately 2.2 m tall, 0.35 m collision radius |

## 4. Visual style

### Palette roles

| Color | Use |
| --- | --- |
| Deep purple | Primary walls, upholstery, carpets, room identity |
| Black | Structural frames, machinery, furniture bases |
| Warm gold | Trim, handles, landmark frames, premium details |
| Cyan | Navigation, elevator indicators, interactive technology |
| Hot pink | Roofline, event accents, limited room highlights |
| Warm ivory | Ceilings, bedding, bright wall fields, visual relief |

Pink and cyan should guide attention. They should not cover every surface. Warm ivory and medium-value purple keep the building readable, while black is reserved for frames and focal contrast rather than large unlit walls.

### Architectural language

- Strong rectangular hotel forms softened with bevels and rounded furniture.
- Gold reveals around doors and major wall breaks.
- Repeated lightning and storm motifs used as hotel branding, not as copies of superhero insignia.
- Large windows with cyan glass and warm interior silhouettes.
- Premium materials with stylized roughness rather than photoreal textures.
- Guest-specific technology treated as an inserted layer over a consistent five-star hotel base.

### Lighting language

- Warm ceiling light establishes comfort and visibility.
- Cyan light identifies elevators, technology, containment equipment, and objectives.
- Pink light marks entertainment areas and controlled moments of mayhem.
- Corridors must remain readable at the far end; no long black tunnels.
- Interactable objects receive local contrast and subtle emissive accents instead of harsh outlines.

## 5. Floor 1 — Lobby, public areas, and guest rooms 101–110

Floor 1 combines the existing ten-room rear corridor with a larger public front wing.

```text
                         MAIN ENTRANCE
                               ↓
┌───────────────────┬────────────────────────┬─────────────────────┐
│ Lounge / waiting  │ Grand lobby            │ Restaurant / bar    │
│ Restrooms nearby  │ Reception landmark     │ Kitchen behind      │
│ Concierge point   │ Manager station        │ Service access      │
├───────────────────┼───────────┬────────────┼─────────────────────┤
│ Staff / security  │ Elevators │ Main route │ Storage / receiving │
│ Service stair     │           │ to rooms   │ Maintenance access  │
└───────────────────┴───────────┴────────────┴─────────────────────┘
                               ↓
            101  103  105  107  109
            ────────────────────────  rear guest corridor
            102  104  106  108  110
```

### Main entrance

- A covered entry with a large lightning emblem visible from outside.
- Glass-and-gold doors wide enough for the player, guests, and a luggage cart.
- A direct view to reception from the threshold.
- A secondary sightline to the cyan elevator indicators.
- Luggage staging stays to one side so arrivals do not block the route.

### Grand lobby and reception

- Reception remains the dominant landmark and first point of attention.
- The approved reception desk retains the physical manager computer and phone.
- A clear 3–4 m approach connects entrance and desk.
- Lounge seating forms small islands outside the main route.
- A central or overhead lightning emblem reinforces hotel identity.
- Plants, luggage, a chandelier, and restrained villain-tech displays create activity without clutter.

### Lounge and waiting area

- Two or three seating groups with different sightlines.
- Space for waiting guests, short conversations, and future check-in events.
- Concierge point near the boundary between lounge and reception.
- Wall art and a hotel directory provide orientation.

### Restaurant and bar

- Located in a lateral public wing so it can be discovered from the lobby without interrupting check-in traffic.
- Bar uses pink accent lighting and gold shelving as its landmark.
- Restaurant uses warm lighting, purple upholstery, and wider table spacing for NPC movement.
- A host stand controls entry and can support physical reservations or delivery tasks.
- The restaurant should initially be a compact playable zone, with expansion space reserved.

### Kitchen

- Directly behind the restaurant and bar.
- Two routes: one to the dining room and one to a service corridor.
- Includes preparation benches, cold storage, cooking line, dish area, and pick-up counter.
- Large equipment becomes collision; small utensils remain decoration or interactable props.

### Restrooms

- Near public areas but outside the main lobby sightline.
- One shared accessible layout is sufficient for the first implementation.
- Clear wall sign and warm lighting distinguish the entrance.

### Staff, storage, and manager areas

- Storage connects to the lobby and service corridor so the existing battery mission remains quick and legible.
- The manager station remains behind reception rather than becoming a detached office menu.
- Staff/security space sits near the elevator core for quick access to public and guest areas.
- Receiving and bulk storage connect to the kitchen and service path.
- The service stair is adjacent to the elevator shaft and visually marked as staff/emergency access.

### Floor 1 movement

1. Player enters and sees reception.
2. The ringing phone pulls the player behind the desk.
3. The objective and signage direct the player to storage.
4. The player returns through the lobby carrying the battery.
5. Cyan elevator lighting provides the next landmark.
6. The rear guest corridor remains available without cutting through restaurant or staff rooms.

## 6. Floor 2 — Main guest floor, rooms 201–210

Floor 2 is the clearest expression of the repeatable hotel system: five rooms on each side of a central corridor, with compact service spaces at the ends and elevator landing.

```text
       201    203    205    207    209
┌─────┬──────┬──────┬──────┬──────┬─────┐
│ svc │                                    │ staff / linen
│     │      central carpeted corridor     │ station
└─────┴──────┴──────┴──────┴──────┴─────┘
       202    204    206    208    210
                       ↑
             elevator landing + stair
```

### Layout and navigation

- Elevator doors open onto a distinct landing with a directory and seating niche.
- Room numbers increase predictably along the corridor.
- Odd rooms occupy one side; even rooms occupy the other.
- Repeating ceiling lights establish rhythm and distance.
- The corridor remains compact; no decorative dead-end branches.
- A strong end-wall landmark prevents the hall from reading as an infinite tunnel.

### Secondary spaces

- Linen/service closet at one corridor end.
- Small staff station near the elevator landing.
- Maintenance panel and utility access at the opposite end.
- Cleaning-cart parking recess that does not narrow the corridor.
- Service stair tied to the same vertical core as Floor 1.

### Standard-room base

Every standard room includes:

- Working door and clear entrance path.
- Bed, nightstand, lamp, desk, chair, luggage bench, art, and window.
- At least one open event zone where guest problems can occur.
- A guest-theme socket for props, effects, and equipment.
- A visible place for deliveries or repair targets.

Four furnishing arrangements can repeat, but color, artwork, equipment, and guest effects should prevent obvious repetition.

## 7. Floor 3 — VIP and special guests, rooms 301–310

Floor 3 remains a ten-room floor so the hotel meets the thirty-room requirement. Exclusivity comes from premium finishes, stronger landmarks, and specialty equipment rather than deleting rooms.

```text
       301    303    305    307    309
┌─────┬──────┬──────┬──────┬──────┬─────┐
│ sec │      premium central corridor      │ svc
│ obs │   wider visual bays and displays   │ lab
└─────┴──────┴──────┴──────┴──────┴─────┘
       302    304    306    308    310
                       ↑
          VIP elevator landing + service stair
```

### Room identities

| Room | Planned identity |
| --- | --- |
| 301 | Cold-climate VIP suite with insulated display elements |
| 302 | Technology suite with expanded power and network panels |
| 303 | Botanical suite with sealed planters and irrigation props |
| 304 | Luxury flexible suite for wealthy or theatrical guests |
| 305 | Reinforced special-guest room with replaceable hazard panels |
| 306 | Acoustic/illusion-ready suite with controlled lighting |
| 307 | Doctor Drizzle’s weather suite; existing mission stays intact |
| 308 | Containment-ready room with observation window and airlock styling |
| 309 | Gravity/cosmic suite with anchored furniture and sensor props |
| 310 | High-security adaptable VIP suite for rotating guests |

The room shells remain modular. Some VIP rooms can gain bay windows, alcoves, or deeper exterior extensions later while their corridor doors and numbering stay fixed.

### Shared third-floor spaces

- Observation/security station near the elevator landing.
- Small containment-support lab outside the guest-room count.
- Staff/service closet for protective equipment and replacement parts.
- Premium lounge niche with a view into the city.
- Strong cyan-and-gold elevator landmark.
- More dramatic art and ceiling treatment than Floor 2, while keeping paths bright.

### Room 307

Room 307 remains the first fully authored special room:

- Purple-and-gold hotel furniture.
- Bed, desk, luggage space, and clear delivery route.
- Doctor Drizzle’s weather machine and named battery dock.
- Weather instruments, pressure gauges, cloud motifs, cables, and suitcases.
- Controlled cloud and lightning effects that do not obscure the player.
- Enough open space for Doctor Drizzle, the player, and the delivery interaction.

## 8. Player movement and wayfinding

### Primary route

```text
Entrance → Reception → Objective location → Elevator → Floor landing → Numbered room
```

This route should be understandable without opening a map. The manager computer map supports memory but does not replace environmental navigation.

### Landmark hierarchy

1. **Exterior:** lightning emblem and magenta roofline.
2. **Lobby:** reception desk and large lightning logo.
3. **Elevators:** cyan indicators within gold frames.
4. **Guest corridors:** numbered doors, carpet direction, ceiling-light rhythm.
5. **VIP floor:** premium trim and specialty display niches.
6. **Containment:** reinforced frames, blue/cyan lighting, observation glass.

### Circulation rules

- No furniture inside the main objective path.
- Doors open into protected clearance zones.
- Luggage and cleaning carts park in recesses.
- Important routes avoid sharp blind corners.
- Decorative clusters sit against walls or inside lounge islands.
- NPC waiting points do not overlap door triggers or elevator entrances.
- Service circulation connects kitchen, storage, staff areas, and elevator core without forcing staff through lounge seating.

## 9. Guest-room system

Guest rooms use a common luxury shell plus swappable theme modules.

### Base hotel layer

- Architecture, door, plaque, window, trim, floor, ceiling.
- Bed, desk, lamp, chair, luggage bench, art.
- Standard lighting and collision volumes.

### Guest-theme layer

- One focal prop or machine.
- One wall or window treatment.
- One small prop family.
- One controlled lighting/effect profile.
- One problem zone that can support a physical request.

### Reusable hazard modules

- Heat shield and sprinkler booster.
- Cold insulation and thawing vent.
- Electrical isolation panel and battery dock.
- Water-resistant floor insert and drain.
- Botanical containment planter.
- Chemical cabinet and wash station.
- Acoustic dampening panels.
- Reinforced observation window.
- Furniture anchor set for gravity events.
- Replaceable technology rack.

This approach creates readable room identities without building thirty unrelated rooms.

## 10. Original villain roster plan

The supplied character panel demonstrates the needed variety. The following roster is original and intended as a planning pool, not a commitment to build everyone at once.

| Guest | Theme and silhouette | Room preference | Request or event | Difficulty |
| --- | --- | --- | --- | --- |
| Doctor Drizzle | Weather coat, cloud pack, antenna cane | 307 weather suite | Replacement battery; indoor micro-storm | Intro |
| Baroness Borealis | Tall crystalline collar, wide ice cape | Cold suite | Defrost a door without melting her luggage | Medium |
| Ember Earl | Compact furnace armor, smoking crown | Heat-shielded room | Replace a scorched room-service tray | Medium |
| Aunt Ampère | Coiled hair, insulated gloves, cable bustle | Electrical suite | Hotel lights flicker when she gets excited | Medium |
| Madame Mulch | Layered leaf gown, walking planter | Botanical suite | Recover escaped vines from a vent | Medium |
| Patch Cord | Asymmetrical tech jacket, monitor backpack | Technology suite | Reconnect a polite runaway robot | Medium |
| Professor Perhaps | Oversized goggles, many-pocket lab coat | Lab-ready room | Identify which invention is actually harmless | Easy |
| Umbra Bell | Bell-shaped cloak, long shadow limbs | Low-glare suite | Return a shadow that checked out early | Hard |
| Captain Caustic | Round chemical tanks, sealed boots | Chemical-ready room | Deliver neutralizer to a leaking suitcase | Hard |
| Duke Effervescence | Bubble helmet, buoyant formalwear | Water-resistant room | Capture floating bath bubbles in the hall | Easy |
| Quarry Queen | Broad stone mantle, tiny gold spectacles | Reinforced room | Move a cracked statue using a cart | Medium |
| Count Clockwise | Tall clockwork collar, uneven ticking gait | Quiet premium room | Reset clocks caught in a five-minute loop | Hard |
| Sir Downforce | Heavy boots, floating shoulder pieces | Anchored suite | Secure furniture before gravity reverses | Hard |
| Diva Decibel | Dramatic microphone staff, sound-wave cape | Acoustic suite | Repair dampening panels before rehearsal | Medium |
| Mirror Morrow | Split-color suit, reflective mask | Controlled-light room | Find the real luggage among illusions | Medium |
| Ooze Cruise | Friendly translucent body in formal vest | Washable room | Retrieve a keycard suspended inside him | Easy |
| Sirocco Sam | Flowing sand coat, glass goggles | Sealed-vent room | Clean sand from an elevator sensor | Medium |
| Velocity Vex | Streamlined bellhop-inspired suit | Clear-layout room | Deliver a package that keeps moving | Hard |
| Lady Alembic | Bottle-shaped accessories, potion sash | Chemical-ready room | Sort mislabeled but family-friendly potions | Medium |
| Doctor Suggestion | Spiral lapels, enormous polite glasses | Quiet suite | Stop hypnotized luggage carts from queuing | Hard |
| Lady Locust | Wing-shaped coat, insect messenger cases | Reinforced-window room | Guide a harmless swarm back into carriers | Hard |
| Chairman Calamity | Wide luxury suit, tiny hovering desk | VIP suite | Arrange absurdly specific amenities | Medium |
| Harlequin Hazard | Angular patchwork silhouette, prop cases | Flexible suite | Locate a prank package before check-in | Medium |
| Velvet Finger | Narrow coat, oversized soft gloves | Standard premium room | Recover hotel property she “borrowed” | Medium |
| Unit Nuisance | Boxy service robot with elegant bow tie | Technology suite | Replace a logic module after task overload | Easy |
| Null Nebula | Star-field cloak, floating geometric head | Cosmic suite | Stabilize a harmless pocket void | Hard |
| The Polite Unknown | Changing silhouette, immaculate luggage | Containment-ready room | Fulfill a request the computer cannot classify | Expert |

Character production begins with silhouettes and animation requirements. Rigging does not begin until locomotion, interaction, and performance budgets are agreed.

## 11. Staff and NPC roster

| Role | Primary zone | Gameplay purpose | Distinctive visual cue |
| --- | --- | --- | --- |
| Player manager | Entire hotel | Physical jobs, decisions, guest service | Premium manager uniform and key ring |
| Receptionist | Front desk | Check-in, directions, queue handling | Lightning lapel pin and room-key sash |
| Concierge | Lobby | Unusual requests and local information | Tall hat and compact request tablet |
| Bellhop/valet | Entrance and lobby | Luggage, carts, arrivals | Gold-trimmed jacket and cart gloves |
| Chef | Kitchen | Food requests and kitchen events | Angular chef coat and heat-safe apron |
| Bartender | Bar | Drink requests and social events | Plum vest with glowing bottle opener |
| Cleaner | Rooms and corridors | Messes, laundry, room reset | Utility cart and color-coded tools |
| Security officer | Lobby and Floor 3 | Dangerous events and access control | Broad silhouette and cyan visor |
| Maintenance engineer | Service spaces | Power, elevator, plumbing, machinery | Tool harness and insulated boots |
| Containment specialist | Floor 3 lab | Special-room systems | Protective coat with modular gloves |
| Shopkeeper | Future lobby shop | Optional supplies and souvenirs | Display apron and dramatic spectacles |

Staff should support physical tasks rather than replace them with menus. A staff member can point the player toward a problem, carry background props, or perform visible ambient work.

## 12. Master asset checklist

### Already have

#### Architecture and navigation

- 4 m and 2 m wall sections.
- Wall corners and doorway sections.
- Standard door frames and door panels.
- Floor, ceiling, carpet, and trim modules.
- Window module.
- Room plaque base and digits 0–9.
- Direction sign.
- Wall sconce and ceiling light.
- Elevator entrance, indicator, car shell, three stops, landing doors, and movable car root.
- Three-floor assembled hotel with rooms 101–110, 201–210, and 301–310.

#### Lobby and furnishings

- Approved reception desk.
- Physical manager-computer visual root.
- Physical hotel-phone visual root.
- Beds, mattresses, headboards, covers, and pillows.
- Desks, chairs, lamps, nightstands, luggage benches, and room art.
- Sofas, coffee table, plants, chandeliers, storage shelving, and luggage cart.
- Four reusable room-furnishing variants.
- Furnished lobby, corridors, and elevator landings.

#### Special-room assets

- Room 307 weather machine.
- Named Room 307 battery-placement marker.
- Existing game-side industrial battery and first-shift mission behavior.

### Need to find

These are good candidates for licensed premade assets, followed by optimization and rematerialing:

- Restaurant chairs, small tables, booths, and host stand components.
- Kitchen appliances, preparation tables, sinks, shelving, cookware, and dish racks.
- Restroom fixtures and accessories.
- Office filing cabinets, small storage bins, and staff lockers.
- Cleaning cart, mop, vacuum, laundry bags, towels, and amenity containers.
- Expanded luggage set and hotel trolley variations.
- Bar glassware, bottles, taps, and back-bar shelving details.
- Generic food props and room-service trays.
- Security monitors, cameras, intercoms, and access panels.
- Laboratory containers, carts, cases, gauges, and neutral generic instruments.
- Decorative sculptures, wall art, planters, rugs, and table accessories.
- Exterior street furniture and generic vehicles if the exterior becomes playable.

Preferred sources should permit commercial game use. Every acquired asset needs a record containing source URL, creator, license, required attribution, modification notes, original triangle count, final triangle count, and texture sizes.

### Need to create or significantly modify

- Final hotel lightning logo and exterior signage.
- Expanded front entrance, canopy, and side-wing facade modules.
- Restaurant/bar visual identity and branded signs.
- Kitchen service doors and pass-through window.
- Floor directory signs and back-of-house wayfinding.
- Service stair kit and safety signage.
- Room hazard modules listed in the guest-room system.
- Containment-ready door, observation window, and airlock details.
- Floor 3 security/observation station.
- Doctor Drizzle character and final weather-machine animation setup.
- Original staff and villain characters.
- Interaction-ready versions of acquired props with clean pivots and simplified collision proxies.
- Hotel-specific ambient props: key racks, request tickets, branded luggage tags, staff tablets, and maintenance cases.

## 13. Asset-sourcing and adaptation rules

The workflow for a missing generic asset is:

```text
Search → compare → verify license → record source → import → clean → optimize
→ rematerial → set scale/origin → create collision proxy → test in game
```

An asset is not approved merely because it looks suitable. It must:

- Permit the intended commercial game use.
- Include attribution when required.
- Avoid recognizable copyrighted character or brand elements.
- Match meter scale and Y-up GLB export.
- Use descriptive object and material names.
- Have applied transforms, correct normals, and sensible pivots.
- Remove hidden or unnecessary geometry.
- Use texture resolutions appropriate to screen size.
- Match the hotel palette and stylized material response.
- Pass a browser performance and visual test before widespread duplication.

## 14. Environment activity plan

The hotel should feel occupied through controlled activity layers:

### Persistent activity

- Receptionist at the desk.
- Bellhop or luggage cart near the entrance.
- One or two lobby guests in seating zones.
- Staff crossing between service doors.
- Subtle elevator indicator changes.
- Small screen, chandelier, and sign animation.

### Request-driven activity

- Guest appears at or inside their assigned room.
- Relevant staff move toward staging points.
- Props and effects activate only for the current event.
- Clean-up or repair state remains visible until physically resolved.

### Density rules

- Main routes remain clear at all times.
- A room receives one strong focal machine or effect, not several competing effects.
- Decorative clutter clusters at edges and on surfaces.
- NPC idle points are authored rather than randomly scattered.
- Effects have distance-based limits and stop when their room is unloaded.

## 15. Gameplay considerations

- Every decorative door that represents a guest room eventually opens into a real room.
- Repeated hotel jobs should use common physical verbs: carry, place, clean, repair, deliver, inspect, push, and operate.
- A room theme must create gameplay opportunities, not only a color change.
- Elevator and room doors need stable animation and collision states.
- The luggage cart must fit through doors and inside the elevator.
- Room interactions need enough space for the player, carried object, guest, and camera.
- Signs should reduce dependence on HUD arrows.
- Special effects must preserve silhouettes and interaction prompts.
- Current first-shift objectives remain the regression path for every expansion.

## 16. Optimization requirements

### Geometry and draw calls

- Load or reveal floors independently when practical.
- Instance repeated room, light, plaque, and furniture modules.
- Batch static architecture by floor and material.
- Preserve separate roots only for moving or interactive objects.
- Use simple collision primitives rather than render meshes.
- Use level-of-detail versions for exterior props and complex character accessories.

### Materials and textures

- Share a controlled hotel material library.
- Atlas related small props when it reduces state changes.
- Prefer 1K or 2K textures for reusable furniture; reserve larger maps for rare hero assets.
- Use compressed browser-ready textures after the art direction is stable.
- Limit transparent materials and overlapping emissive glass.

### Effects and characters

- Pool particles and transient effect objects.
- Cap dynamic lights per visible room.
- Disable off-floor animation and effects.
- Keep guest rigs and material counts consistent.
- Test the complete lobby and one worst-case special room on target browser hardware before multiplying content.

## 17. Construction order

### Stage 0 — Approve this plan

- Confirm floor functions, room numbering, visual hierarchy, and asset categories.
- Confirm that the implementation remains the Three.js browser project.

### Stage 1 — Complete Floor 1 gameplay space

- Preserve the current first-shift route.
- Refine lobby circulation and reception landmark.
- Add restaurant/bar shell, kitchen shell, restrooms, staff route, and service stair shell.
- Integrate existing furniture selectively.
- Add collision and working doors through the coding workflow.
- Walk the entrance-to-phone-to-storage-to-elevator route in the browser.

**Exit test:** A player can navigate every Floor 1 space without clipping, blocked routes, or unclear wayfinding; the original mission still works.

### Stage 2 — Complete Floor 2 guest system

- Build rooms 201–210 from the standard shell.
- Finish service closet, staff station, maintenance access, and cleaning-cart recess.
- Add two or three guest-theme modules and repeatable work requests.
- Test every doorway and the elevator approach at walking speed.

**Exit test:** All ten rooms are physically accessible, distinct enough to identify, and support at least one repeatable hotel-work loop.

### Stage 3 — Complete Floor 3 special system

- Preserve and polish Room 307 first.
- Add observation/security and containment-support spaces.
- Build the remaining specialty rooms with modular hazard kits.
- Test elevator arrival, corridor navigation, Room 307 delivery, and special-room effects.

**Exit test:** Rooms 301–310 are accessible, Room 307’s mission remains intact, and special effects do not harm navigation or performance.

### Stage 4 — Character and staff production

- Approve silhouettes and role priorities.
- Define shared rig and animation needs.
- Produce the player manager, Doctor Drizzle, receptionist, and one service worker first.
- Add further guests only after one complete guest request works with animation and room effects.

### Stage 5 — Content multiplication and exterior

- Expand villain roster, room variants, restaurant activity, and staff ambience.
- Build final exterior facade and entrance presentation.
- Add only the content that survives performance, navigation, and gameplay testing.

## 18. Approval checklist

Before asset sourcing or further construction begins, approve or revise:

- Three-floor arrangement and thirty-room requirement.
- Floor 1 public-wing expansion while retaining rooms 101–110.
- Floor 2 numbering and service-space placement.
- Floor 3 room identities and Room 307 placement.
- Primary entrance-to-reception-to-elevator route.
- Visual palette and lighting hierarchy.
- Villain and staff roster direction.
- Already-have, need-to-find, and need-to-create categories.
- Construction order and stage exit tests.

No new Blender construction or third-party asset download is authorized by this planning document alone.
