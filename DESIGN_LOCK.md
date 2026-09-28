You are the lead developer, gameplay programmer, 3D systems designer, UI/UX designer, and technical architect for an original 3D browser game.

PROJECT NAME:
HOTEL FOR SUPERVILLAINS

Your job is to build a REAL PLAYABLE GAME, not a visual prototype, static website, management dashboard, or collection of menus.

============================================================
1. THE GAME
============================================================

Hotel for Supervillains is a funny, stylish, high-energy 3D hotel-management adventure.

The player manages:

THE GRAND DISASTER

A luxurious five-star hotel specifically designed for retired, defeated, semi-reformed, and extremely inconvenient supervillains.

Normal hotels cannot handle these guests.

One villain might control weather.

Another might drink electricity.

Another might have escaped robots.

Another might own a pet kraken.

Another might accidentally fire lasers at mirrors.

The player is NOT a superhero.

The player is NOT a supervillain.

The player is the hotel manager.

Their job is:

KEEP THE GUESTS HAPPY.
KEEP THE HOTEL RUNNING.
KEEP THE MAYHEM UNDER CONTROL.
TRY NOT TO LET THE CITY GET DESTROYED.

The tone must be:

- Funny
- Stylish
- Weird
- Colorful
- Chaotic
- Family-friendly
- Energetic
- Mysterious at times
- Never grim or horror-focused

The game should feel like:

3D job simulator
+
hotel management game
+
exploration game
+
chaotic comedy adventure

============================================================
2. MOST IMPORTANT DESIGN RULE
============================================================

THIS IS NOT A MENU-BASED MANAGEMENT GAME.

The player physically exists inside the hotel.

Whenever something can reasonably be done physically, make the player physically do it.

BAD:

Click "Deliver Battery."

GOOD:

Walk to storage.
Find the battery.
Pick it up.
Carry it.
Ride the elevator.
Walk to the guest's room.
Hand it to the guest.

BAD:

Click "Repair Power."

GOOD:

Travel to maintenance.
Open the electrical cabinet.
Find the failed circuit.
Install the replacement component.
Reset the breaker.
Watch the lights return.

BAD:

Press Tab to open a giant management dashboard.

GOOD:

Walk behind reception.
Interact with the physical manager computer.
Camera moves toward its monitor.
Use the hotel-management software on the actual computer.

The hotel itself should be the primary interface.

============================================================
3. CAMERA AND PLAYER
============================================================

Create a polished first-person controller.

Controls:

WASD = Move
Mouse = Camera
Shift = Run
E = Interact
Esc = Exit computer/terminal or pause

Add smooth:

- Acceleration
- Deceleration
- Camera movement
- Character rotation
- Collision
- Stairs
- Door interaction
- Object interaction

The player should have a visible hotel-manager character.

The player must be able to:

- Walk
- Run
- Explore
- Talk to NPCs
- Open doors
- Ride elevators
- Pick up objects
- Carry objects
- Drop objects
- Place objects
- Push carts
- Use computers
- Answer phones
- Operate hotel machinery

Do not make movement feel like a flying debug camera.

============================================================
4. VISUAL IDENTITY
============================================================

The Grand Disaster should look like:

LUXURY FIVE-STAR HOTEL
+
COMIC-BOOK SUPERVILLAIN HEADQUARTERS

Use a premium stylized 3D aesthetic.

Main colors:

Deep purple
Black
Warm gold
Neon blue
Hot pink

Use warm luxury lighting mixed with neon villain technology.

The hotel should contain:

- Polished floors
- Gold trim
- Purple carpets
- Chandeliers
- Luxury furniture
- Neon signage
- Strange machinery
- Villain decorations
- Animated displays
- Dramatic lighting
- Large windows
- Decorative plants
- Hotel signs
- Luggage
- Bellhop carts
- Art
- Statues

It should look expensive but slightly ridiculous.

Do NOT make everything extremely dark.

Players must be able to clearly see where they are going.

============================================================
5. HOTEL LAYOUT
============================================================

Eventually the hotel can become enormous.

BUT DO NOT BUILD THE ENTIRE HOTEL FIRST.

The first playable version needs:

GROUND FLOOR:
- Main lobby
- Reception desk
- Manager computer
- Hotel phone
- Elevator
- Storage room
- Small manager area

FLOOR 3:
- Elevator landing
- Hallway
- Several decorative doors
- Room 307
- Doctor Drizzle's room

Later we can add:

- Kitchen
- Restaurant
- Maintenance
- Security
- Basement
- Spa
- Monster aquarium
- Gift shop
- Rooftop
- Garage
- More guest floors

============================================================
6. INTERACTION SYSTEM
============================================================

Create ONE reusable interaction system.

Interactable objects should be able to provide:

E — Talk

E — Pick Up

E — Open

E — Use

E — Place

E — Answer

E — Repair

Only show the prompt when the player is looking at or standing close enough to the correct object.

Use subtle highlighting on important interactable objects.

Do not make the highlight extremely bright.

The interaction system must be reusable.

DO NOT create completely separate interaction logic for every individual object.

============================================================
7. PHYSICAL ITEM SYSTEM
============================================================

Items physically exist.

The player can:

- Pick them up
- Carry them
- Drop them
- Place them
- Give them to NPCs

If the player is carrying a battery, the battery should visibly appear in their hands.

Do NOT immediately create a giant inventory.

Small key items may eventually go into pockets/keyring, but large items remain physical.

Example objects:

- Battery packs
- Towels
- Food trays
- Tools
- Replacement lights
- Electrical parts
- Cleaning supplies
- Keys
- Keycards
- Strange villain equipment

============================================================
8. HOTEL CART
============================================================

Eventually implement a pushable hotel cart.

Objects can physically be placed onto it.

Example:

Battery
Towels
Repair kit
Room-service tray

The cart should be usable inside elevators.

Prioritize stable gameplay physics over perfect realistic physics.

============================================================
9. MINIMAL GAME HUD
============================================================

There IS normal screen UI, but keep it minimal.

The HUD should look polished and premium.

DO NOT make it look like a website.

DO NOT cover the screen with panels.

HUD should show:

TOP LEFT:
Hotel Cash

Example:
$4,850

TOP CENTER OR TOP RIGHT:
Reputation

Example:
REPUTATION 72

Mayhem Meter

Example:
MAYHEM 24%

BOTTOM/LEFT OR SIDE:
Current Objective

Example:

CURRENT REQUEST

Doctor Drizzle
Room 307

Find a replacement battery.

When carrying the correct item:

Deliver Battery to Room 307

Interaction prompt appears near the center/bottom.

Example:

[E] Pick Up Battery

Use subtle animation.

============================================================
10. MAYHEM UI
============================================================

Mayhem is important.

Range:

0–100

0–20:
CALM

21–40:
UNSTABLE

41–60:
CHAOTIC

61–80:
CRITICAL

81–99:
DISASTER

100:
TOTAL DISASTER

The Mayhem display should subtly become more intense as it rises.

At low Mayhem:
Calm.

At medium Mayhem:
More animated.

At high Mayhem:
Warning effects.

Do not make it annoying or cover the player's screen.

============================================================
11. IN-WORLD UI RULE
============================================================

Most detailed interfaces MUST physically exist inside the hotel.

Examples:

Management = Manager computer

Security = Security monitors

Elevators = Physical elevator buttons

Maintenance = Physical electrical panels

Guest calls = Physical telephone

Room controls = Physical wall panels

Advanced upgrades = Manager computer

The player should think:

"I need to check the computer."

NOT:

"I need to open the management menu."

============================================================
12. MANAGER COMPUTER
============================================================

This is one of the game's most important interfaces.

Place a physical computer behind the reception desk.

The computer should physically have:

- Monitor
- Keyboard
- Mouse
- Desk
- Hotel equipment nearby

When nearby:

[E] Use Manager Computer

When activated:

1. Stop normal character movement.
2. Smoothly move camera toward monitor.
3. Keep monitor frame visible.
4. Allow player to control the computer.
5. Display GRAND DISASTER OS.
6. Press Esc or EXIT to leave.
7. Camera smoothly returns.
8. Character movement returns.

DO NOT simply teleport into a generic fullscreen website.

============================================================
13. GRAND DISASTER OS
============================================================

The hotel's operating system should look extremely polished.

Style:

Dark purple
Black
Gold
Neon blue
Small pink accents

It should feel like:

Luxury hotel software
+
supervillain technology

Keep layouts clean.

Do not overcrowd it.

Eventually applications include:

HOME
GUESTS
ROOMS
HOTEL MAP
STAFF
SECURITY
FINANCES
CONSTRUCTION
MESSAGES

For the first version, only implement:

HOME
GUESTS
HOTEL MAP

HOME:

THE GRAND DISASTER

Shift 1

Cash: $4,850
Reputation: 72
Mayhem: 12%

Active Guests: 1
Active Requests: 1

GUESTS:

DOCTOR DRIZZLE

Room 307

Satisfaction: 72%

Status:
Slightly Irritated

Current Request:
Replacement Weather Machine Battery

HOTEL MAP:

Show simple hotel map.

Lobby
Storage
Elevator
Floor 3
Room 307

============================================================
14. HOTEL PHONE
============================================================

Put a physical telephone at reception.

It should actually ring.

Player walks to it.

[E] Answer Phone

Camera can slightly focus on phone.

Villain dialogue appears.

Example:

DOCTOR DRIZZLE:

"Front desk!"

"My weather machine is dying!"

"And unless you want Room 307 to develop its own climate, I suggest finding me another battery."

Then:

NEW REQUEST

Weather Emergency Prevention

Find an Industrial Battery Pack.

Deliver it to Room 307.

Do not display giant tutorial windows.

============================================================
15. FIRST VILLAIN
============================================================

Create:

DOCTOR DRIZZLE

He is a retired weather-controlling supervillain.

PERSONALITY:

Grumpy
Dramatic
Impatient
Funny
Secretly not that bad

VISUAL STYLE:

Stylized supervillain.

Long dramatic coat.

Weather-themed technology.

Small portable weather machine.

Cloud/lightning motifs.

Do NOT use copyrighted superhero/villain designs.

He must be completely original.

============================================================
16. DOCTOR DRIZZLE'S ROOM
============================================================

Room 307 should immediately tell the player who lives there.

Include:

- Luxury bed
- Purple/gold hotel furniture
- Weather machine
- Weather instruments
- Small cloud effects
- Electrical equipment
- Windows
- Desk
- Suitcases
- Strange gadgets

The room should feel personalized.

============================================================
17. FIRST REQUEST
============================================================

Doctor Drizzle needs:

INDUSTRIAL WEATHER BATTERY

Request sequence:

1. Doctor Drizzle calls reception.
2. Player answers phone.
3. Request appears.
4. Objective says:

Find Industrial Battery Pack in Storage.

5. Tutorial guides player toward Storage.
6. Player enters Storage.
7. Battery is subtly highlighted.
8. Player approaches battery.

[E] Pick Up Battery

9. Battery appears in player's hands.
10. Objective changes:

Deliver Battery to Doctor Drizzle — Room 307

11. Player travels to elevator.
12. Player physically enters elevator.
13. Player presses Floor 3.
14. Elevator travels.
15. Doors open.
16. Player follows signs to Room 307.
17. Player opens/knocks on door.
18. Doctor Drizzle is inside.
19. Player approaches.

[E] Give Battery

20. Drizzle reacts.

Example:

"Finally!"

"Another five minutes and this room would have had a tornado season."

21. Weather machine powers up.

22. Reward:

+$300 CASH
+5 REPUTATION
-4 MAYHEM

23. Satisfaction increases.

24. Tutorial mission completes.

============================================================
18. TUTORIAL
============================================================

MAKE THE TUTORIAL VERY GOOD.

The tutorial should teach through PLAYING.

Do not stop the player every ten seconds with paragraphs.

The tutorial should feel like the player's first shift.

============================================================
19. TUTORIAL INTRO
============================================================

Start with a short cinematic.

Exterior shot:

THE GRAND DISASTER

Huge luxurious hotel.

Neon sign.

Strange villain vehicles outside.

Maybe distant harmless supervillain effects.

Camera moves toward hotel.

Title appears:

HOTEL FOR SUPERVILLAINS

THE GRAND DISASTER

Then transition inside.

The player is behind reception.

A small message:

FIRST SHIFT

Welcome to The Grand Disaster.

Then:

WASD — Move
MOUSE — Look
SHIFT — Run

Allow player to immediately move.

============================================================
20. TEACH INTERACTION NATURALLY
============================================================

The phone begins ringing.

Objective:

ANSWER THE FRONT DESK PHONE

The ringing sound helps the player locate it.

When player approaches:

[E] Answer

This naturally teaches interaction.

============================================================
21. TEACH REQUESTS NATURALLY
============================================================

Doctor Drizzle gives his battery request.

Show a compact animated request card.

NEW REQUEST

DOCTOR DRIZZLE
ROOM 307

Replacement Weather Battery

Then shrink it into the normal objective UI.

============================================================
22. TEACH NAVIGATION NATURALLY
============================================================

Objective:

FIND STORAGE

Use environmental navigation FIRST:

- Hotel signs
- Room signs
- Floor directory
- Lighting
- Architecture

During tutorial only, a subtle waypoint may appear.

Do NOT permanently put giant glowing arrows everywhere.

============================================================
23. TEACH PICKUP NATURALLY
============================================================

Inside Storage, subtly highlight the battery.

When player approaches:

[E] Pick Up

After pickup:

OBJECTS CAN BE CARRIED AND DELIVERED.

Keep tutorial message visible for only a few seconds.

============================================================
24. TEACH ELEVATOR NATURALLY
============================================================

Objective changes:

DELIVER BATTERY
ROOM 307 — FLOOR 3

Player follows signs to elevator.

When entering:

LOOK AT THE FLOOR PANEL AND SELECT FLOOR 3.

Player physically presses 3.

Elevator doors close.

Elevator travels.

Use:

- Elevator hum
- Floor indicator
- Soft elevator music
- DING

Then doors open.

============================================================
25. TEACH DELIVERY
============================================================

Room signs make 307 easy to locate.

At Drizzle:

[E] Give Battery

Reward animation appears.

Do NOT create an enormous mobile-game reward popup.

Use elegant compact feedback:

REQUEST COMPLETE

+$300
+5 Reputation
-4 Mayhem

============================================================
26. TEACH MANAGER COMPUTER AFTER FIRST REQUEST
============================================================

After completing Drizzle's request:

Manager device:

FRONT DESK MESSAGE

"Nice work. Your manager computer is ready."

Objective:

RETURN TO RECEPTION

CHECK MANAGER COMPUTER

Player returns.

Computer subtly glows.

[E] Use Manager Computer

Camera zooms toward screen.

Brief tutorial:

GRAND DISASTER OS

Manage guests, rooms, finances and hotel systems from here.

Then let the player explore:

HOME
GUESTS
HOTEL MAP

Do NOT force them through every button.

============================================================
27. TUTORIAL COMPLETION
============================================================

When player exits computer:

FIRST SHIFT TRAINING COMPLETE

Then:

"The Grand Disaster is officially your problem now."

This should establish the game's humor.

Afterward, normal gameplay begins.

============================================================
28. TUTORIAL RULES
============================================================

Tutorial must:

- Teach movement
- Teach interaction
- Teach phone
- Teach requests
- Teach navigation
- Teach item pickup
- Teach carrying
- Teach elevator
- Teach delivery
- Teach rewards
- Teach computer

Tutorial must NOT:

- Dump huge paragraphs
- Freeze player constantly
- Explain systems that don't matter yet
- Require reading a manual
- Show 20 controls at once
- Use giant arrows constantly

Teach one thing at a time.

============================================================
29. SOUND DESIGN
============================================================

Audio should make the hotel feel alive.

Add:

- Lobby ambience
- Soft conversations
- Footsteps
- Door sounds
- Elevator movement
- Elevator ding
- Elevator music
- Telephone ringing
- Computer sounds
- Object pickup
- Request completion
- Weather machine
- Electrical sounds
- Distant hotel activity

Music reacts to Mayhem.

LOW MAYHEM:
Elegant quirky hotel music.

MEDIUM:
More energy/percussion.

HIGH:
Fast chaotic music.

Still funny, not terrifying.

============================================================
30. HOTEL NPC LIFE
============================================================

Eventually NPCs should:

- Walk
- Sit
- Talk
- Use elevators
- Carry luggage
- Clean
- Work
- Visit rooms
- React to emergencies

For the FIRST BUILD, only add a small amount of background activity.

Do not waste development time creating dozens of NPCs before the core gameplay works.

============================================================
31. FUTURE VILLAINS
============================================================

Do not implement these immediately, but architect systems so they can be added later.

COUNT BYTEULA

Electricity-consuming vampire.

Needs Wi-Fi-free rooms.

May drain floor power.

LADY KRAKEN

Elegant ocean villain.

Travels with pet kraken.

PROFESSOR BEEP

Retired robotics villain.

Robots can escape.

MIRROR MASTER MAX

Laser villain.

Needs anti-laser mirrors.

All characters must be original.

============================================================
32. FUTURE EMERGENCIES
============================================================

Design systems to eventually support:

Portal leaks

Power failures

Floods

Escaped robots

Villain arguments

Monster problems

Haunted elevators

Gravity failures

Secret hero inspections

Emergencies physically happen in the hotel.

============================================================
33. FUTURE STAFF
============================================================

Eventually:

Ghost Housekeeper
Goblin Bellhop
Mad Scientist Maintenance Worker
Robot Concierge
Monster Security Guard

They physically work in the hotel.

============================================================
34. FUTURE HOTEL UPGRADES
============================================================

Eventually:

Villain Spa
Monster Aquarium
Cursed Gift Shop
Underground Garage
Restaurant
Security Room
Maintenance Workshop
Rooftop Lounge
Portal Containment
Emergency Generator
More guest floors

Upgrades must physically change the hotel.

============================================================
35. STORY
============================================================

Eventually introduce a mystery.

Someone is secretly using the hotel.

Clues:

Missing equipment

Strange power usage

Security cameras failing

Unknown deliveries

Locked basement rooms

Mysterious computer logins

Strange noises underground

Do NOT prioritize this yet.

Gameplay comes first.

============================================================
36. SAVE SYSTEM
============================================================

Eventually save:

Cash
Reputation
Shift
Hotel upgrades
Unlocked floors
Staff
Villain relationships
Story choices

Implement the architecture cleanly so saving can be expanded.

============================================================
37. CODE QUALITY
============================================================

Do NOT put everything into one file.

Use modular systems.

Create reusable systems such as:

PlayerController
CameraController
InteractionSystem
CarrySystem
DialogueSystem
RequestSystem
NPCSystem
VillainSystem
HotelSystem
RoomSystem
DoorSystem
ElevatorSystem
EconomySystem
ReputationSystem
MayhemSystem
ComputerSystem
TutorialSystem
AudioSystem
SaveSystem

Keep content data-driven where practical.

Do not hard-code every villain or request into core gameplay code.

============================================================
38. BROWSER PERFORMANCE
============================================================

This is a 3D browser game.

Performance matters.

Use:

- Efficient geometry
- Reusable assets
- Instancing
- Sensible texture sizes
- Efficient lighting
- Limited expensive real-time effects
- Object pooling when useful
- Optimized shadows
- Frustum culling
- LOD when needed

Do not attempt photorealism.

Aim for beautiful stylized graphics that run smoothly.

============================================================
39. DEVELOPMENT DEBUG MODE
============================================================

Create a developer-only debug system.

Allow:

Add Cash
Set Reputation
Set Mayhem
Teleport Lobby
Teleport Storage
Teleport Floor 3
Spawn Battery
Reset Request
Complete Request
Reset Tutorial
Trigger Phone Call

This will make testing much faster.

Do not expose debug controls in normal gameplay.

============================================================
40. BUILD ORDER — EXTREMELY IMPORTANT
============================================================

DO NOT TRY TO BUILD THE ENTIRE GAME AT ONCE.

BUILD IN PHASES.

============================================================
PHASE 1A — TECHNICAL FOUNDATION
============================================================

FIRST create:

- 3D renderer
- Game loop
- Scene system
- Player controller
- First-person camera
- Collision
- Interaction system
- Basic audio architecture

Test movement.

Do not continue until movement feels good.

============================================================
PHASE 1B — HOTEL VERTICAL SLICE
============================================================

Build ONLY:

Lobby

Reception

Storage

Elevator

Floor 3 hallway

Room 307

Use modular reusable architecture.

Make navigation understandable.

============================================================
PHASE 1C — FIRST GAMEPLAY
============================================================

Implement:

Doctor Drizzle

Hotel phone

Dialogue

Request system

Industrial Battery

Pickup

Carry

Drop

Delivery

Cash

Reputation

Mayhem

Minimal HUD

============================================================
PHASE 1D — TUTORIAL
============================================================

Connect the systems into the tutorial described above.

The tutorial must be playable from beginning to end.

============================================================
PHASE 1E — MANAGER COMPUTER
============================================================

Implement physical manager computer.

Add:

HOME

GUESTS

HOTEL MAP

Make computer interaction polished.

============================================================
PHASE 1F — POLISH
============================================================

Before adding more content:

Improve:

Lighting

Materials

Animations

UI

Tutorial timing

Camera

Movement

Sounds

Hotel signage

Object feedback

NPC feedback

Performance

Fix bugs.

============================================================
41. FIRST VERSION SUCCESS TEST
============================================================

DO NOT MOVE INTO LARGE-SCALE DEVELOPMENT UNTIL THIS WORKS:

Player starts game.

Intro plays.

Player learns movement.

Phone rings.

Player walks to phone.

Player answers.

Doctor Drizzle asks for battery.

Request appears.

Player finds Storage.

Player finds battery.

Player physically picks it up.

Battery visibly appears in hands.

Player walks to elevator.

Player enters elevator.

Player presses Floor 3.

Elevator physically travels.

Player exits.

Player finds Room 307.

Player gives battery to Drizzle.

Drizzle reacts.

Weather machine activates.

Player receives:

+$300
+5 Reputation
-4 Mayhem

Player returns to reception.

Player uses physical manager computer.

Camera moves toward screen.

GRAND DISASTER OS works.

Player can view:

HOME
GUESTS
HOTEL MAP

Player exits computer.

Tutorial finishes.

THE GAME IS NOW PLAYABLE.

============================================================
42. DO NOT FAKE FEATURES
============================================================

This is critical.

If something appears functional, make it functional.

Do not create fake buttons.

Do not create fake elevators.

Do not create fake security feeds.

Do not say an NPC is somewhere when they are not.

Do not make an upgrade change only a number if it is supposed to modify the hotel.

Fewer REAL features are better than 100 fake features.

============================================================
43. DEVELOPMENT BEHAVIOR
============================================================

Before making major changes:

1. Inspect existing project structure.
2. Understand existing systems.
3. Preserve working functionality.
4. Implement the smallest logical piece.
5. Test it.
6. Fix errors.
7. Verify integration.
8. Continue.

Do not constantly rewrite working systems.

Do not create duplicate systems when an existing system can be extended.

When encountering an error:

Investigate the actual cause.

Do not randomly remove functionality until the error disappears.

============================================================
44. UI QUALITY STANDARD
============================================================

UI must look intentionally designed.

Use consistent:

Typography

Spacing

Corner radius

Iconography

Animation timing

Panel styling

Button styling

Colors

Do not generate generic bootstrap-looking panels.

Normal HUD should be subtle.

Computer UI can be more detailed because it exists physically on the manager computer.

Animations should include:

Soft fades

Small slides

Hover states

Button press feedback

Notification transitions

Request-completion animation

Mayhem changes

Cash changes

Avoid excessive animation.

============================================================
45. FINAL DEVELOPMENT INSTRUCTION
============================================================

Start with PHASE 1A.

DO NOT begin by generating the entire hotel.

DO NOT implement all villains.

DO NOT implement all upgrades.

DO NOT implement the final story.

Your current mission is to create the FIRST POLISHED PLAYABLE VERTICAL SLICE.

The most important experience is:

PHONE RINGS
→
VILLAIN REQUEST
→
PHYSICAL EXPLORATION
→
FIND OBJECT
→
PICK IT UP
→
RIDE ELEVATOR
→
DELIVER IT
→
VILLAIN REACTS
→
PLAYER GETS REWARDED
→
CHECK PHYSICAL MANAGER COMPUTER

Make that experience fun before expanding anything else.

Once Phase 1A is working, continue through Phase 1B, 1C, 1D, 1E, and 1F in order.

At the end of each phase, test the actual game and fix blocking problems before proceeding.

Do not substitute screenshots, mockups, placeholder web pages, or descriptions for functioning gameplay.

BUILD THE GAME.
