import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as THREE from '../vendor/three.module.js';
import { GLTFLoader } from '../vendor/addons/loaders/GLTFLoader.js';
import { createWorld } from '../world/scene.js';
import { collides } from '../systems/player.js';
import { createDoorSystem, GUEST_ROOMS } from '../systems/doors.js';

const bytes = await readFile(new URL('../assets/grand_disaster_complete_asset_hotel.glb', import.meta.url));
const gltf = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
const hotel = gltf.scene;
hotel.updateMatrixWorld(true);
const pos = name => {
  const node = hotel.getObjectByName(name);
  assert.ok(node, `Missing authored socket ${name}`);
  return node.getWorldPosition(new THREE.Vector3());
};

test('the authoritative visual has physical lobby, guest rooms, and all three elevator stops', () => {
  assert.deepEqual([1,2,3].map(f => pos(`ELEVATOR_STOP_FLOOR_${f}`).y), [0,4.5,9]);
  for (const name of ['MANAGER_COMPUTER_INTERACTIVE_VISUAL','HOTEL_PHONE_INTERACTIVE_VISUAL','ROOM_307_DOOR_HINGE','ROOM_307_BATTERY_PLACEMENT','ROOM_307_WEATHER_MACHINE_VISUAL','STAFF_STORAGE_DOOR_HINGE']) pos(name);
  assert.equal(pos('ROOM_307_DOOR_HINGE').y, 9);
});

test('scene starts at a lobby foot position, without the old procedural hotel', () => {
  const world = createWorld();
  assert.equal(world.spawn.y, 0);
  assert.equal(world.avatar.position.y, 0);
  assert.equal(world.scene.children.some(object => object.isMesh), false);
  assert.deepEqual(Object.keys(world.colliders), ['0','2','3']);
  assert.equal(collides(world.spawn.x, world.spawn.z, world.colliders[0]), false);
});

test('new collision blocks walls, keeps the storage doorway and room 307 opening navigable', () => {
  const world = createWorld();
  world.hotel = hotel;
  world.doors = createDoorSystem(world);
  assert.ok(collides(20.2,-17,world.colliders[0]));
  assert.ok(!collides(-10.9,-15.45,world.colliders[0]));
  assert.ok(collides(1.9,-4,world.colliders[3]));
  world.doors.open(307, true);
  assert.equal(collides(1.9,-4,world.colliders[3]),false);
  assert.equal(collides(0,-4,world.colliders[3]),false);
});

test('all 27 playable rooms have authored doors and the removed end bays are elevator lobbies', () => {
  assert.equal(GUEST_ROOMS.length, 27);
  for (const number of GUEST_ROOMS) assert.ok(hotel.getObjectByName(`ROOM_${number}_DOOR_HINGE`), `Room ${number} needs a door`);
  for (const number of [110,210,310]) assert.equal(hotel.getObjectByName(`ROOM_${number}_DOOR_HINGE`), undefined);
  for (const floor of [1,2,3]) assert.ok(hotel.getObjectByName(`FLOOR_${floor}_ELEVATOR_LOBBY_ROOT`));
});
