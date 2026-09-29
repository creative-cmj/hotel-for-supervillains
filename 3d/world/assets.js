import * as THREE from '../vendor/three.module.js';
import { GLTFLoader } from '../vendor/addons/loaders/GLTFLoader.js';
import { createDoorSystem, GUEST_ROOMS } from '../systems/doors.js';
import { createPopulation } from './population.js';
import { loadEditableLayout } from './editable-layout.js';

const loader = new GLTFLoader();
const ASSET_VERSION = 'polished-hotel-1';
const assetUrl = (name) => new URL(`../assets/${name}`, import.meta.url).href;

async function load(url, label, onStatus) {
  let lastError;
  for (let attempt = 0; attempt < 2; attempt++) {
    const separator = url.includes('?') ? '&' : '?';
    const requestUrl = `${url}${separator}v=${ASSET_VERSION}${attempt ? `&retry=${Date.now()}` : ''}`;
    onStatus?.(attempt ? `Retrying ${label}…` : `Loading ${label}…`);
    try { return (await loader.loadAsync(requestUrl)).scene; }
    catch (error) { lastError = error; if (!attempt) console.warn(`Retrying hotel asset ${url}`, error); }
  }
  throw lastError;
}

const requireNode = (root, name) => {
  const node = root.getObjectByName(name);
  if (!node) throw Error(`Hotel asset missing ${name}`);
  return node;
};
const point = (node) => node.getWorldPosition(new THREE.Vector3());
const register = (world, id, position, radius, action, prompt, mesh = null, options = {}) => {
  const object = { id, position: new THREE.Vector3(position.x, position.y, position.z), radius, action, prompt, mesh, ...options };
  world.objects.push(object);
  return object;
};

function hasAncestor(node, name) {
  for (let current = node.parent; current; current = current.parent) if (current.name === name) return true;
  return false;
}

function floorForMesh(node, bounds) {
  const staticName = /^STATIC_FLOOR_([123])_/.exec(node.name);
  if (staticName) return Number(staticName[1]) === 1 ? 0 : Number(staticName[1]);
  const roomName = /^ROOM_([123])\d\d_/.exec(node.name);
  if (roomName) return Number(roomName[1]) === 1 ? 0 : Number(roomName[1]);
  const landingName = /^FLOOR_([123])_ELEVATOR_/.exec(node.name);
  if (landingName) return Number(landingName[1]) === 1 ? 0 : Number(landingName[1]);
  const entranceName = /^ELEVATOR_ENTRANCE_FLOOR_([123])/.exec(node.name);
  if (entranceName) return Number(entranceName[1]) === 1 ? 0 : Number(entranceName[1]);
  if (hasAncestor(node, 'ELEVATOR_CAR_MOVABLE')) return undefined;
  const height = bounds.max.y - bounds.min.y;
  if (height > 4.7) return undefined;
  if (bounds.min.y >= 8.8) return 3;
  if (bounds.min.y >= 4.3 && bounds.max.y <= 9.0) return 2;
  if (bounds.min.y < 4.3 && bounds.max.y <= 4.6) return 0;
  return undefined;
}

export async function loadWorldAssets(world, onStatus) {
  const [hotel, manager] = await Promise.all([
    load(assetUrl('grand_disaster_complete_asset_hotel.glb'), 'hotel structure', onStatus),
    load(assetUrl('grand_disaster_manager.glb'), 'manager', onStatus),
  ]);
  onStatus?.('Preparing rooms and collisions…');
  hotel.name = 'AUTHORITATIVE_POLISHED_HOTEL';
  hotel.updateMatrixWorld(true);
  world.cameraOccluders = { 0: [], 2: [], 3: [] };
  hotel.traverse((node) => {
    if (!node.isMesh) return;
    node.castShadow = false;
    node.receiveShadow = true;
    const bounds = new THREE.Box3().setFromObject(node);
    const assigned = floorForMesh(node, bounds);
    if (assigned !== undefined) node.userData.hotelFloor = assigned;
    for (const [floor, height] of [[0, 0], [2, 4.5], [3, 9]]) {
      if ((assigned === undefined || assigned === floor) && bounds.min.y < height + 4.2 && bounds.max.y > height + .15) world.cameraOccluders[floor].push(node);
    }
  });
  world.scene.add(hotel);
  hotel.updateMatrixWorld(true);
  world.hotel = hotel;

  const managerBox = new THREE.Box3().setFromObject(manager);
  manager.position.y = -managerBox.min.y;
  world.avatar.add(manager);
  // Room 307 keeps its mission trigger without loading a character model.
  world.drizzle.position.set(6.0, 9, -3.15);

  world.lift = requireNode(hotel, 'ELEVATOR_CAR_MOVABLE');
  world.liftDoors = [];
  for (const floor of [1, 2, 3]) {
    const landing = requireNode(hotel, `ELEVATOR_ENTRANCE_FLOOR_${floor}`);
    const stop = point(requireNode(hotel, `ELEVATOR_STOP_FLOOR_${floor}`));
    if (Math.abs(stop.y - (floor - 1) * 4.5) > .01) throw Error(`Incorrect lift stop on floor ${floor}`);
    for (const node of landing.children.filter((child) => /^Elevator_Door(Left|Right)/.test(child.name))) {
      node.position.x += node.name.includes('Left') ? -.72 : .72;
      world.liftDoors.push(node);
    }
    register(world, `lift${floor === 1 ? 0 : floor}`, new THREE.Vector3(-5, stop.y, -9.15), 2.05, 'lift', `Use Lift Panel · ${floor === 1 ? 'Lobby' : `Floor ${floor}`}`, landing, { minFacing: -.05 });
  }

  const phone = requireNode(hotel, 'HOTEL_PHONE_INTERACTIVE_VISUAL');
  const computer = requireNode(hotel, 'MANAGER_COMPUTER_INTERACTIVE_VISUAL');
  const phoneAt = point(phone), computerAt = point(computer);
  register(world, 'phone', new THREE.Vector3(phoneAt.x, 0, phoneAt.z), 1.45, 'phone', 'Answer Phone', phone, { minFacing: .18, priority: -.12 });
  register(world, 'computer', new THREE.Vector3(computerAt.x, 0, computerAt.z), 1.55, 'computer', 'Use Manager Computer', computer, { minFacing: .22 });
  register(world, 'battery', new THREE.Vector3(world.battery.position.x, 0, world.battery.position.z), 1.85, 'battery', 'Pick Up Industrial Battery', world.battery, { minFacing: -.05 });
  register(world, 'request-item', new THREE.Vector3(world.serviceParcel.position.x, 0, world.serviceParcel.position.z), 1.85, 'request-item', 'Pick Up Guest Service Parcel', world.serviceParcel, { minFacing: -.05 });

  const storageDoor = requireNode(hotel, 'STAFF_STORAGE_DOOR_HINGE');
  storageDoor.rotation.y = Math.PI / 2;
  world.doors = createDoorSystem(world);
  world.roomDoor = world.doors.get(307).hinge;
  world.guestDoors = GUEST_ROOMS.filter((number) => number !== 307).map((number) => world.doors.get(number).hinge);
  register(world, 'stairwell', new THREE.Vector3(-17.5, 0, -14.85), 1.8, 'stairwell', 'Emergency Stairwell · Staff Access', requireNode(hotel, 'SERVICE_STAIR_DOOR_HINGE'), { minFacing: .05 });

  const weather = requireNode(hotel, 'ROOM_307_WEATHER_MACHINE_VISUAL');
  const placement = requireNode(hotel, 'ROOM_307_BATTERY_PLACEMENT');
  world.machine = weather.getObjectByProperty('isMesh', true);
  world.weatherMachine = weather;
  world.batteryPlacement = placement;
  register(world, 'drizzle', new THREE.Vector3(6.0, 9, -3.15), 1.9, 'drizzle', 'Give Battery to Doctor Drizzle', world.drizzle, { minFacing: -.1 });

  createPopulation(world);
  await loadEditableLayout(world, onStatus);
  world.setFloorVisibility(0);
  onStatus?.('Hotel ready');
  return { hotel, manager, phone, computer, weather, placement };
}
