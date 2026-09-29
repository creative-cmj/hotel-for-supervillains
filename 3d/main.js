import * as THREE from './vendor/three.module.js';
import { createWorld, HOTEL_MAP_VERSION, FLOOR_HEIGHTS } from './world/scene.js';
import { loadWorldAssets } from './world/assets.js?v=polished-hotel-1';
import { updatePopulation } from './world/population.js';
import { VILLAIN_ROSTER } from './characters/villain-roster.js';
import { advancePlayer, collides } from './systems/player.js';
import { findInteraction } from './systems/interaction.js';
import { initialMission, transition } from './systems/mission.js';
import {
  REQUEST_CATALOG,
  acceptNextRequest,
  activeRequestDefinition,
  canOfferRequest,
  completeRequest,
  dropRequestItem,
  pickupRequestItem,
  requestObjective,
} from './systems/requests.js';

const el = (id) => document.getElementById(id);
const canvas = el('world');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, .85));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.5;
renderer.shadowMap.enabled = false;

const world = createWorld();
const camera = new THREE.PerspectiveCamera(72, innerWidth / innerHeight, .08, 80);
world.scene.add(camera);
camera.add(world.heldBattery, world.heldParcel);
world.heldBattery.position.set(.48, -.55, -1.08);
world.heldBattery.rotation.set(.1, -.2, -.08);
world.heldBattery.scale.setScalar(.52);
world.heldParcel.position.set(.48, -.56, -1.06);
world.heldParcel.rotation.set(.08, -.18, -.06);
world.heldParcel.scale.setScalar(.5);
let mission = loadMission();
let player = loadPlayer();
let started = false;
let paused = false;
let dialogue = false;
let computer = false;
let elevatorMenu = false;
let osTab = 'home';
let isRiding = false;
let toastUntil = 0;
let last = performance.now();
let ringClock = 0;
let stepClock = 0;
let musicClock = 0;
let audio = null;
let soundOn = true;
let elapsed = 0;
let currentCandidate = null;
let machinePulseUntil = 0;
const keys = new Set();
const aim = { yaw: Math.PI / 2, pitch: .28 };
const debugEnabled = new URLSearchParams(location.search).get('debug') === '1';

window.__HOTEL_ASSETS_READY__ = loadWorldAssets(world, (status) => {
  el('loading-status').textContent = status;
}).then((assets) => {
  world.lift.position.y = FLOOR_HEIGHTS[mission.floor];
  world.setFloorVisibility(mission.floor);
  if (mission.roomOpen) world.doors.open(307, true);
  updateHud();
  const start = el('start');
  start.disabled = false;
  start.innerHTML = 'CLOCK IN <span>↗</span>';
  el('loading-status').textContent = '27 guest rooms · 3 floors · Hotel ready';
  return assets;
}).catch((error) => {
  console.error('Unable to load the polished hotel', error);
  const start = el('start');
  start.disabled = false;
  start.textContent = 'RETRY HOTEL LOAD';
  start.onclick = () => location.reload();
  el('loading-status').textContent = 'Hotel asset failed to load. Check the local server and retry.';
  return null;
});

function loadMission() {
  try {
    const data = JSON.parse(localStorage.getItem('grand-disaster-3d-v1'));
    if (data?.mapVersion === HOTEL_MAP_VERSION && [0, 2, 3].includes(data.floor)) {
      return { ...initialMission(), ...data, request: data.request || null };
    }
    localStorage.removeItem('grand-disaster-3d-v1');
    localStorage.removeItem('grand-disaster-3d-player-v1');
  } catch {}
  return initialMission();
}

function loadPlayer() {
  const fallback = { ...world.spawn, y: FLOOR_HEIGHTS[mission.floor], vx: 0, vz: 0, yaw: Math.PI / 2 };
  if (mission.floor !== 0) Object.assign(fallback, { x: -5, z: -9.1 });
  try {
    const stored = JSON.parse(localStorage.getItem('grand-disaster-3d-player-v1'));
    const valid = stored?.mapVersion === HOTEL_MAP_VERSION && stored.floor === mission.floor &&
      Number.isFinite(stored.x) && Number.isFinite(stored.z) &&
      Math.abs(stored.x) < 19.6 && stored.z > -21.5 && stored.z < 9.5 &&
      !collides(stored.x, stored.z, world.colliders[stored.floor]);
    return valid ? { ...fallback, x: stored.x, z: stored.z } : fallback;
  } catch { return fallback; }
}

function save() {
  localStorage.setItem('grand-disaster-3d-v1', JSON.stringify({ ...mission, mapVersion: HOTEL_MAP_VERSION }));
  localStorage.setItem('grand-disaster-3d-player-v1', JSON.stringify({
    x: player.x, z: player.z, floor: mission.floor, mapVersion: HOTEL_MAP_VERSION,
  }));
}

function lockPointer() { canvas.requestPointerLock?.().catch(() => {}); }
function floorName(floor) { return floor === 0 ? 'FLOOR 1 · LOBBY' : floor === 2 ? 'FLOOR 2 · GUEST ROOMS' : 'FLOOR 3 · VIP / SPECIAL'; }
function tone(freq = 600, duration = .15, kind = 'sine', volume = .024) {
  if (!audio || !soundOn) return;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = kind;
  osc.frequency.setValueAtTime(freq, audio.currentTime);
  gain.gain.setValueAtTime(volume, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + duration);
  osc.connect(gain).connect(audio.destination);
  osc.start();
  osc.stop(audio.currentTime + duration);
}
function ring() { tone(700, .12); setTimeout(() => tone(860, .15), 140); }
function notify(text, seconds = 3) {
  el('toast').textContent = text;
  el('toast').classList.add('show');
  toastUntil = performance.now() + seconds * 1000;
}
function tutorialObjective() {
  return ({
    phone: 'Answer the front desk phone',
    battery: 'Find the industrial battery in Storage',
    elevator: 'Carry the battery to the elevator · Floor 3',
    deliver: 'Bring the battery to Drizzle · Room 307',
    computer: 'Return to reception · Check the manager computer',
    complete: 'First shift complete · Answer the phone for guest work',
  })[mission.step];
}
function tutorialHint() {
  return ({
    phone: 'WASD move · Mouse look · Shift run',
    battery: 'Follow the STORAGE sign beside reception',
    elevator: 'Use the lift panel and select Floor 3',
    deliver: 'Open Room 307 and walk inside',
    computer: 'Use the lift, select Lobby, then return to the desk',
    complete: canOfferRequest(mission) ? 'The front desk phone has a new guest request' : 'Explore the hotel while the next request arrives',
  })[mission.step];
}

function available(object) {
  const id = object.id;
  if (id === 'phone') return mission.step === 'phone' || canOfferRequest(mission);
  if (id === 'battery') return mission.step === 'battery' && !mission.carried;
  if (id === 'request-item') return mission.request?.stage === 'pickup' && !mission.carried;
  if (id === 'drizzle') return mission.step === 'deliver' && mission.roomOpen && mission.carried === 'battery';
  if (id === 'computer') return mission.floor === 0;
  if (id === 'stairwell') return mission.floor === 0;
  if (id.startsWith('lift')) return mission.floor === Number(id.slice(4)) && !isRiding;
  if (object.action === 'guest-door') return world.doors?.get(object.number)?.floor === mission.floor;
  if (object.action === 'request-delivery') {
    return mission.request?.stage === 'delivery' && mission.request.room === object.number &&
      mission.carried === 'service-parcel' && world.doors?.get(object.number)?.state === 'open';
  }
  if (object.action === 'npc') return object.npc.floor === mission.floor;
  return false;
}

function updateDoorPrompts() {
  if (!world.doors) return;
  for (const door of world.doors.doors.values()) {
    if (door.number === 307 && !mission.roomOpen) {
      door.object.prompt = mission.step === 'deliver' && mission.carried === 'battery'
        ? 'Unlock Room 307'
        : 'Room 307 · Occupied';
    } else {
      door.object.prompt = door.state === 'open' || door.state === 'opening'
        ? `Close Room ${door.number}`
        : `Open Room ${door.number}`;
    }
  }
}

function updateHud() {
  el('cash').textContent = `$${mission.cash.toLocaleString()}`;
  el('reputation').innerHTML = `REPUTATION <b>${mission.reputation}</b>`;
  el('mayhem').innerHTML = `MAYHEM <b>${mission.mayhem}%</b>`;
  el('mayhem').dataset.level = mission.mayhem > 60 ? 'danger' : mission.mayhem > 40 ? 'warning' : 'calm';
  const request = requestObjective(mission);
  el('objective-label').textContent = request ? 'GUEST REQUEST · CURRENT OBJECTIVE' : 'FIRST SHIFT · CURRENT OBJECTIVE';
  el('objective').textContent = request?.title || tutorialObjective();
  el('hint').textContent = request?.hint || tutorialHint();
  world.battery.visible = mission.step === 'battery' && mission.carried !== 'battery';
  world.heldBattery.visible = started && !computer && mission.carried === 'battery';
  world.serviceParcel.visible = mission.request?.stage === 'pickup' && !mission.carried;
  world.heldParcel.visible = started && !computer && mission.carried === 'service-parcel';
  if ((mission.step === 'computer' || mission.step === 'complete') && world.machine?.material?.emissive) {
    world.machine.material.emissiveIntensity = 1.5;
  }
  updateDoorPrompts();
}

function setState(event) {
  const next = transition(mission, event);
  if (next === mission) return false;
  mission = next;
  save();
  updateHud();
  return true;
}
function setDialogue(label, speaker, copy, button = 'ON IT →') {
  el('dialogue-label').textContent = label;
  el('dialogue-speaker').textContent = speaker;
  el('dialogue-copy').textContent = copy;
  el('close-dialogue').textContent = button;
  dialogue = true;
  el('dialogue').hidden = false;
  document.exitPointerLock?.();
}
function openComputer() {
  if (mission.floor !== 0) return;
  computer = true;
  keys.clear();
  el('computer').hidden = false;
  setState('use-computer');
  updateHud();
  renderOs();
  document.exitPointerLock?.();
  tone(440, .1);
}
function closeComputer() {
  computer = false;
  el('computer').hidden = true;
  if (setState('exit-computer')) notify('FIRST SHIFT COMPLETE · The hotel is open for repeatable guest requests.', 7);
  updateHud();
  tone(380, .1);
}

function guestRows() {
  const active = activeRequestDefinition(mission);
  const featured = [
    `<article class="guest-profile"><div class="guest-crest">☁</div><div><small>ROOM 307 · WEATHER VILLAIN</small><h3>DOCTOR DRIZZLE</h3><p>Status: ${mission.step === 'computer' || mission.step === 'complete' ? 'Machine restored · Pleasantly grumpy' : 'Waiting for industrial battery'}</p></div></article>`,
    `<article class="guest-profile"><div class="guest-crest">ϟ</div><div><small>ROOM 205 · ELECTRICAL SPECIALIST</small><h3>VOLTESSA</h3><p>${active?.room === 205 ? 'Active request: Voltage Regulator' : 'Status: Enjoying the outlets'}</p></div></article>`,
    `<article class="guest-profile"><div class="guest-crest">❦</div><div><small>ROOM 303 · BOTANICAL VILLAIN</small><h3>THE BLOOM QUEEN</h3><p>${active?.room === 303 ? 'Active request: Containment Filter' : 'Status: Begonias contained'}</p></div></article>`,
  ];
  const roster = VILLAIN_ROSTER.slice(1).map((villain) => {
    const current = active?.guest === villain.name;
    return `<article class="guest-profile"><div class="guest-crest" style="color:#${villain.colors[1].toString(16).padStart(6,'0')}">${villain.name[0]}</div><div><small>ROOM ${villain.room} · ${villain.power.toUpperCase()}</small><h3>${villain.name.toUpperCase()}</h3><p>${current ? `Active request: ${villain.item}` : villain.personality}</p></div></article>`;
  });
  return [...featured,...roster].join('');
}
function renderOs() {
  const view = el('os-view');
  document.querySelectorAll('#computer nav button').forEach((button) => button.classList.toggle('active', button.dataset.tab === osTab));
  if (osTab === 'home') {
    view.innerHTML = `<div class="os-title"><div><small>WELCOME BACK, MANAGER</small><h2>THE GRAND DISASTER</h2><p>Three floors online · 27 guest rooms accessible.</p></div><div class="os-icon">H</div></div><div class="os-grid"><article><small>HOTEL CASH</small><b>$${mission.cash.toLocaleString()}</b></article><article><small>REPUTATION</small><b>${mission.reputation}</b></article><article><small>MAYHEM</small><b>${mission.mayhem}%</b></article></div><div class="os-note">ACTIVE GUESTS <b>32</b><span>·</span>ACTIVE REQUESTS <b>${mission.request ? 1 : 0}</b><span>·</span>STAFF ON DUTY <b>5</b></div>`;
  } else if (osTab === 'guests') {
    view.innerHTML = `<div class="os-title"><div><small>RESIDENT DIRECTORY</small><h2>ACTIVE GUESTS</h2></div></div>${guestRows()}`;
  } else {
    view.innerHTML = `<div class="os-title"><div><small>FACILITY NAVIGATION</small><h2>HOTEL MAP</h2><p>YOU ARE HERE · ${floorName(mission.floor)}</p></div></div>
      <div class="map-floor"><b>FLOOR 1 · LOBBY / SERVICE</b><div><span>RECEPTION</span><span>STORAGE</span><span>RESTAURANT + BAR</span><span>LOUNGE</span><span>ROOMS 101–109</span><span>LIFT</span><span>EMERGENCY STAIR</span></div></div>
      <div class="map-floor"><b>FLOOR 2 · GUEST ROOMS</b><div><span>ROOMS 201–209</span><span>VOLTESSA · 205</span><span>CENTRAL LIFT LOBBY</span></div></div>
      <div class="map-floor"><b>FLOOR 3 · VIP / SPECIAL</b><div><span>ROOMS 301–309</span><span>BLOOM QUEEN · 303</span><span>DOCTOR DRIZZLE · 307</span><span>CENTRAL LIFT LOBBY</span></div></div>`;
  }
}

function openElevatorPanel() {
  elevatorMenu = true;
  keys.clear();
  el('elevator-panel').hidden = false;
  el('elevator-current').textContent = `CURRENT · ${floorName(mission.floor)}`;
  document.querySelectorAll('.floor-buttons button').forEach((button) => {
    button.disabled = Number(button.dataset.floor) === mission.floor;
  });
  document.exitPointerLock?.();
  tone(520, .08);
}
function closeElevatorPanel(relock = true) {
  elevatorMenu = false;
  el('elevator-panel').hidden = true;
  if (relock && started && !paused) lockPointer();
}

function rideLift(destination) {
  if (isRiding || !world.lift || destination === mission.floor) return;
  closeElevatorPanel(false);
  isRiding = true;
  keys.clear();
  const originY = FLOOR_HEIGHTS[mission.floor];
  const destY = FLOOR_HEIGHTS[destination];
  const startTime = performance.now();
  player.x = -5;
  player.z = -13.35;
  player.vx = player.vz = 0;
  el('floor-indicator').hidden = false;
  el('floor-indicator').textContent = `${floorName(mission.floor)} → ${floorName(destination)}`;
  tone(165, 2.35, 'triangle', .015);
  function move() {
    const progress = Math.min(1, (performance.now() - startTime) / 2400);
    const eased = progress * progress * (3 - 2 * progress);
    player.y = originY + (destY - originY) * eased;
    world.lift.position.y = player.y;
    if (progress < 1) requestAnimationFrame(move);
    else {
      mission = { ...mission, floor: destination };
      if (destination === 3) mission = transition(mission, 'arrive-floor3');
      player.y = destY;
      player.z = -9.05;
      world.lift.position.y = destY;
      world.setFloorVisibility(destination);
      isRiding = false;
      el('floor-indicator').textContent = floorName(destination);
      setTimeout(() => { if (!isRiding) el('floor-indicator').hidden = true; }, 1100);
      save();
      updateHud();
      tone(900, .25);
      lockPointer();
    }
  }
  move();
}

function handlePhone() {
  if (mission.step === 'phone') {
    if (!setState('answer-phone')) return;
    setDialogue(
      'FRONT DESK LINE · ROOM 307',
      'DOCTOR DRIZZLE',
      'Front desk! My weather machine is dying. Find an industrial battery in Storage, unless you would like my room to develop its own tornado season.',
    );
    notify('NEW REQUEST · DOCTOR DRIZZLE · ROOM 307', 4);
    tone(320, .3);
    return;
  }
  if (!canOfferRequest(mission)) {
    notify('Front desk line is quiet for the moment.');
    return;
  }
  mission = acceptNextRequest(mission);
  const definition = activeRequestDefinition(mission);
  save();
  updateHud();
  setDialogue(
    `FRONT DESK LINE · ROOM ${definition.room}`,
    definition.guest.toUpperCase(),
    `${definition.request} Collect the ${definition.item} from Storage and bring it to Room ${definition.room}.`,
    'ACCEPT REQUEST →',
  );
  notify(`NEW GUEST REQUEST · ${definition.guest.toUpperCase()} · ROOM ${definition.room}`, 5);
}

function interact(target) {
  if (!target || isRiding) return;
  switch (target.action) {
    case 'phone': handlePhone(); break;
    case 'battery':
      if (setState('pick-battery')) { tone(580, .12); notify('BATTERY SECURED · Take the lift to Floor 3'); }
      break;
    case 'request-item': {
      const next = pickupRequestItem(mission);
      if (next !== mission) {
        mission = next;
        save();
        updateHud();
        tone(580, .12);
        notify('GUEST SERVICE PARCEL SECURED');
      }
      break;
    }
    case 'guest-door': {
      const number = target.number;
      if (number === 307 && !mission.roomOpen) {
        if (mission.step !== 'deliver' || mission.carried !== 'battery') {
          notify('ROOM 307 · OCCUPIED · Finish the current objective first.');
          tone(190, .1);
          break;
        }
        if (setState('open-room')) {
          world.doors.open(307);
          tone(240, .17);
          notify('ROOM 307 UNLOCKED · Walk inside and meet Doctor Drizzle');
        }
      } else {
        const result = world.doors.toggle(number);
        tone(result === 'opening' ? 330 : 220, .1);
      }
      updateDoorPrompts();
      break;
    }
    case 'request-delivery': {
      const definition = activeRequestDefinition(mission);
      const next = completeRequest(mission, target.number);
      if (next !== mission) {
        mission = next;
        save();
        updateHud();
        tone(640, .2);
        setTimeout(() => tone(880, .27), 210);
        notify(`REQUEST COMPLETE · ${definition.guest} · +$${definition.reward} · +${definition.reputation} REP`, 6);
      }
      break;
    }
    case 'drizzle':
      if (setState('deliver')) {
        machinePulseUntil = performance.now() + 2500;
        tone(640, .2);
        setTimeout(() => tone(880, .27), 210);
        notify('“Finally! Another five minutes and we would have tornado season.” · +$300 · +5 REP', 7);
      }
      break;
    case 'computer': openComputer(); break;
    case 'lift': openElevatorPanel(); break;
    case 'npc': notify(`${target.npc.name}: “${target.npc.line}”`, 5); tone(430, .08); break;
    case 'stairwell': notify('EMERGENCY STAIRWELL · Alarmed staff access. Use the lift during normal service.', 5); tone(190, .1); break;
  }
}

function drop() {
  if (isRiding) return;
  if (mission.carried === 'battery' && setState('drop-battery')) {
    world.battery.position.set(player.x, player.y + .95, player.z - 1);
    world.objects.find((object) => object.id === 'battery').position.set(player.x, player.y, player.z - 1);
    notify('Battery dropped · Pick it back up');
    tone(240, .12);
  } else if (mission.carried === 'service-parcel') {
    const next = dropRequestItem(mission);
    if (next !== mission) {
      mission = next;
      world.serviceParcel.position.set(player.x, player.y + .9, player.z - 1);
      world.objects.find((object) => object.id === 'request-item').position.set(player.x, player.y, player.z - 1);
      save();
      updateHud();
      notify('Guest parcel dropped · Pick it back up');
      tone(240, .12);
    }
  }
}

function update(delta) {
  if (!started || paused || dialogue || computer || elevatorMenu) return;
  const input = {
    forward: keys.has('KeyW') || keys.has('ArrowUp'),
    back: keys.has('KeyS') || keys.has('ArrowDown'),
    left: keys.has('KeyA') || keys.has('ArrowLeft'),
    right: keys.has('KeyD') || keys.has('ArrowRight'),
    run: keys.has('ShiftLeft') || keys.has('ShiftRight'),
  };
  if (!isRiding) {
    player.y = FLOOR_HEIGHTS[mission.floor];
    player.yaw = aim.yaw;
    player = advancePlayer(player, input, delta, world.colliders[mission.floor]);
  }
  world.doors?.update(delta);
  updatePopulation(world, player, mission.floor, elapsed);
  if (world.drizzle) {
    world.drizzle.visible = mission.floor === 3;
    if (world.drizzle.visible) {
      world.drizzle.rotation.y = Math.atan2(player.x - world.drizzle.position.x, player.z - world.drizzle.position.z);
      world.drizzle.position.y = 9 + Math.sin(elapsed * 1.8) * .025;
    }
  }
  if (machinePulseUntil && world.machine?.material?.emissive) {
    world.machine.material.emissiveIntensity = performance.now() < machinePulseUntil ? 2.2 + Math.sin(elapsed * 12) * .8 : 1.5;
  }
  world.avatar.position.set(player.x, player.y, player.z);
  world.avatar.rotation.y = -player.yaw;
  const stride = Math.min(1, Math.hypot(player.vx, player.vz) / 4);
  const wave = Math.sin(elapsed * 10) * stride;
  world.legL.rotation.x = wave * .52;
  world.legR.rotation.x = -wave * .52;
  world.armL.rotation.x = -wave * .36;
  world.armR.rotation.x = wave * .36;
  if (stride > .25 && !isRiding) {
    stepClock += delta;
    if (stepClock > (input.run ? .25 : .39)) { tone(125, .055, 'triangle', .004); stepClock = 0; }
  } else stepClock = 0;
  musicClock += delta;
  if (musicClock > (mission.mayhem > 60 ? .29 : mission.mayhem > 40 ? .46 : .7)) {
    const notes = [196, 246.94, 293.66, 392, 329.63, 246.94];
    tone(notes[Math.floor(elapsed * 1.7) % notes.length], .22, 'sine', .0025);
    musicClock = 0;
  }
  currentCandidate = findInteraction(player, world.objects, available);
  el('prompt').hidden = !currentCandidate;
  el('prompt').textContent = currentCandidate ? `[E] ${currentCandidate.prompt}` : '';
  if (mission.step === 'phone' || canOfferRequest(mission)) {
    ringClock += delta;
    if (ringClock > 3.2) { ring(); ringClock = 0; }
  } else ringClock = 0;
}

function frame(now) {
  const delta = Math.min(.1, (now - last) / 1000);
  last = now;
  elapsed += delta;
  update(delta);
  const target = new THREE.Vector3(player.x, player.y + 1.72, player.z);
  if (computer) {
    target.set(2.2, 1.62, -17);
    camera.position.lerp(new THREE.Vector3(2.2, 1.8, -13.8), Math.min(1, delta * 10));
    camera.lookAt(target);
  } else if (!started) {
    target.set(0, 2, -18);
    camera.position.lerp(new THREE.Vector3(Math.sin(elapsed * .25) * 2, 4, -11), Math.min(1, delta * 7));
    camera.lookAt(target);
  } else {
    const cosPitch = Math.cos(aim.pitch);
    camera.position.copy(target);
    camera.lookAt(
      target.x + Math.sin(aim.yaw) * cosPitch,
      target.y - Math.sin(aim.pitch),
      target.z - Math.cos(aim.yaw) * cosPitch,
    );
  }
  world.avatar.visible = !started;
  renderer.render(world.scene, camera);
  if (toastUntil && now > toastUntil) {
    el('toast').classList.remove('show');
    toastUntil = 0;
  }
  requestAnimationFrame(frame);
}

window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
window.addEventListener('keydown', (event) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) event.preventDefault();
  keys.add(event.code);
  if (event.code === 'Escape') {
    if (elevatorMenu) closeElevatorPanel();
    else if (computer) closeComputer();
    else if (dialogue) {
      dialogue = false;
      el('dialogue').hidden = true;
      lockPointer();
    } else if (started) {
      paused = !paused;
      el('pause').hidden = !paused;
      keys.clear();
    }
  }
  if (!started || paused || dialogue || computer || elevatorMenu) return;
  if (event.code === 'KeyE' && !event.repeat) interact(currentCandidate || findInteraction(player, world.objects, available));
  if (event.code === 'KeyQ' && !event.repeat) drop();
});
window.addEventListener('keyup', (event) => keys.delete(event.code));
canvas.addEventListener('click', () => {
  if (started && !paused && !computer && !dialogue && !elevatorMenu) lockPointer();
});
window.addEventListener('mousemove', (event) => {
  if (!started || computer || paused || dialogue || elevatorMenu) return;
  if (document.pointerLockElement === canvas || event.buttons === 1) {
    aim.yaw -= event.movementX * .0026;
    aim.pitch = THREE.MathUtils.clamp(aim.pitch + event.movementY * .002, -.45, .75);
  }
});

el('start').onclick = async () => {
  if (!await window.__HOTEL_ASSETS_READY__) return;
  started = true;
  el('intro').hidden = true;
  audio = new (window.AudioContext || window.webkitAudioContext)();
  updateHud();
  lockPointer();
  notify('FIRST SHIFT · Welcome to The Grand Disaster', 4);
};
el('close-dialogue').onclick = () => {
  dialogue = false;
  el('dialogue').hidden = true;
  lockPointer();
};
el('close-elevator').onclick = () => closeElevatorPanel();
document.querySelectorAll('.floor-buttons button').forEach((button) => {
  button.onclick = () => rideLift(Number(button.dataset.floor));
});
el('resume').onclick = () => {
  paused = false;
  el('pause').hidden = true;
  lockPointer();
};
el('restart').onclick = () => {
  localStorage.removeItem('grand-disaster-3d-v1');
  localStorage.removeItem('grand-disaster-3d-player-v1');
  location.reload();
};
el('exit-os').onclick = closeComputer;
document.querySelectorAll('#computer nav button').forEach((button) => {
  button.onclick = () => { osTab = button.dataset.tab; renderOs(); tone(520, .06); };
});
el('sound').onclick = () => {
  soundOn = !soundOn;
  el('sound').textContent = soundOn ? '♪' : '×';
};

if (debugEnabled) {
  el('debug').hidden = false;
  el('debug').innerHTML = '<b>DEV TOOLS</b>' + ['ADD CASH', 'REP +10', 'MAYHEM +20', 'LOBBY', 'STORAGE', 'FLOOR 2', 'FLOOR 3', 'SPAWN BATTERY', 'RESET REQUEST', 'COMPLETE FIRST SHIFT', 'RESET TUTORIAL', 'TRIGGER CALL']
    .map((label, index) => `<button data-dev="${index}">${label}</button>`).join('');
  el('debug').onclick = (event) => {
    const button = event.target.closest('[data-dev]');
    if (!button) return;
    const id = Number(button.dataset.dev);
    if (id === 0) mission.cash += 500;
    if (id === 1) mission.reputation = Math.min(100, mission.reputation + 10);
    if (id === 2) mission.mayhem = Math.min(100, mission.mayhem + 20);
    if ([3, 4, 5, 6].includes(id)) {
      const floor = id === 5 ? 2 : id === 6 ? 3 : 0;
      mission.floor = floor;
      player.y = FLOOR_HEIGHTS[floor];
      player.x = id === 4 ? -10.9 : -5;
      player.z = id === 4 ? -13.2 : -9.05;
      world.lift.position.y = player.y;
      world.setFloorVisibility(floor);
    }
    if (id === 7) { mission.carried = 'battery'; mission.step = 'elevator'; }
    if (id === 8) { mission.request = null; mission.nextRequestAt = 0; }
    if (id === 9) mission = { ...initialMission(), step: 'complete', floor: 0, cash: 5150, reputation: 77, mayhem: 8 };
    if (id === 10) {
      localStorage.removeItem('grand-disaster-3d-v1');
      localStorage.removeItem('grand-disaster-3d-player-v1');
      location.reload();
    }
    if (id === 11) handlePhone();
    save();
    updateHud();
  };
}

updateHud();
requestAnimationFrame(frame);
window.__HOTEL_TEST__ = debugEnabled ? {
  get mission() { return mission; },
  get player() { return player; },
  get started() { return started; },
  get riding() { return isRiding; },
  get liftY() { return world.lift?.position.y; },
  get managerName() { return world.avatar.children.find((child) => child.name === 'grand_disaster_manager')?.name ?? world.avatar.children.find((child) => child !== world.heldBattery && child !== world.heldParcel)?.name ?? null; },
  get hotelName() { return world.hotel?.name ?? null; },
  get roomCount() { return world.doors?.doors.size ?? 0; },
  get doorStates() { return Object.fromEntries([...(world.doors?.doors || [])].map(([number, door]) => [number, door.state])); },
  get populationCount() { return world.population?.length ?? 0; },
  get villainCount() { return 1 + (world.population?.filter((entry) => entry.kind === 'villain').length ?? 0); },
  get villainBounds() { const entries=(world.population||[]).filter((entry)=>entry.kind==='villain').map((entry)=>{const box=new THREE.Box3().setFromObject(entry.group);return {id:entry.data.id,floor:entry.data.floor,min:box.min.toArray(),max:box.max.toArray()};});const drizzleBox=new THREE.Box3().setFromObject(world.drizzle);entries.push({id:'doctor-drizzle',floor:3,min:drizzleBox.min.toArray(),max:drizzleBox.max.toArray()});return entries; },
  get cameraMode() { return 'first-person'; },
  get interactions() { return Object.fromEntries(world.objects.map((object) => [object.id, { x: object.position.x, y: object.position.y, z: object.position.z, action: object.action, number: object.number }])); },
  isBlocked: (x, z, floor = mission.floor) => collides(x, z, world.colliders[floor]),
  setYaw: (yaw) => { aim.yaw = yaw; player.yaw = yaw; },
  interact: (id) => interact(world.objects.find((object) => object.id === id)),
  rideLift,
  setPos: (x, z, floor = mission.floor) => {
    player.x = x;
    player.z = z;
    player.y = FLOOR_HEIGHTS[floor];
    mission.floor = floor;
    if (world.lift) world.lift.position.y = player.y;
    world.setFloorVisibility(floor);
    save();
    updateHud();
  },
} : undefined;
