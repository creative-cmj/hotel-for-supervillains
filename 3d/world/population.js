import * as THREE from '../vendor/three.module.js';

export const HOTEL_POPULATION = Object.freeze([
  { id: 'receptionist', name: 'Mara', role: 'Receptionist', floor: 0, x: -0.6, z: -17.8, color: 0xf28bbb, line: 'Welcome to The Grand Disaster. The paperwork is only mildly cursed.' },
  { id: 'security', name: 'Bolt', role: 'Security', floor: 0, x: -6.3, z: -16.4, color: 0x59cce8, line: 'Lobby secure. Elevator music remains suspicious.' },
  { id: 'bellhop', name: 'Pip', role: 'Bellhop', floor: 0, x: 7.0, z: -18.2, color: 0xe8b85e, line: 'I handle luggage, parcels, and nonvenomous capes.' },
  { id: 'cleaner', name: 'Mopsey', role: 'Cleaner', floor: 2, x: 0.0, z: 5.5, color: 0xe65dba, line: 'Floor 2 is clean. Please ignore the faint smell of lightning.' },
  { id: 'guest-205', name: 'Voltessa', role: 'Guest · Room 205', floor: 2, x: 4.8, z: 0.7, color: 0x65d6ff, line: 'The outlets here are delightful. Very crunchy.' },
  { id: 'engineer', name: 'Quinn', role: 'Engineer', floor: 3, x: -0.4, z: 0.3, color: 0xffb452, line: 'If it hums, that is normal. If it sings, call me.' },
  { id: 'guest-303', name: 'The Bloom Queen', role: 'Guest · Room 303', floor: 3, x: 4.7, z: 4.7, color: 0x69d77f, line: 'My begonias have promised to behave.' },
]);

const floorHeight = (floor) => floor === 0 ? 0 : floor === 2 ? 4.5 : 9;

export function createPopulation(world) {
  const bodyGeometry = new THREE.CapsuleGeometry(0.24, 0.72, 3, 8);
  const headGeometry = new THREE.IcosahedronGeometry(0.28, 1);
  const hatGeometry = new THREE.CylinderGeometry(0.30, 0.35, 0.12, 10);
  const dark = new THREE.MeshStandardMaterial({ color: 0x15101f, roughness: 0.52 });
  const skin = new THREE.MeshStandardMaterial({ color: 0xc78566, roughness: 0.74 });
  const entries = [];
  for (const data of HOTEL_POPULATION) {
    const group = new THREE.Group();
    group.name = `NPC_${data.id.toUpperCase()}`;
    group.position.set(data.x, floorHeight(data.floor), data.z);
    group.userData.hotelFloor = data.floor;
    group.userData.baseY = group.position.y;
    group.userData.phase = entries.length * 0.83;
    const uniform = new THREE.MeshStandardMaterial({ color: data.color, roughness: 0.42, metalness: 0.08 });
    const body = new THREE.Mesh(bodyGeometry, uniform); body.position.y = 1.0; group.add(body);
    const head = new THREE.Mesh(headGeometry, skin); head.position.y = 1.78; group.add(head);
    const hat = new THREE.Mesh(hatGeometry, dark); hat.position.y = 2.06; group.add(hat);
    const badge = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.05, 0.12), uniform); badge.position.set(0, 1.25, -0.27); group.add(badge);
    world.scene.add(group);
    const object = {
      id: `npc-${data.id}`,
      action: 'npc',
      npc: data,
      position: new THREE.Vector3(data.x, floorHeight(data.floor), data.z),
      radius: 1.75,
      minFacing: 0,
      prompt: `Talk to ${data.name} · ${data.role}`,
      mesh: group,
    };
    world.objects.push(object);
    entries.push({ data, group });
  }
  world.population = entries;
  return entries;
}

export function updatePopulation(world, player, floor, elapsed) {
  for (const entry of world.population || []) {
    const sameFloor = entry.data.floor === floor;
    entry.group.visible = sameFloor;
    if (!sameFloor) continue;
    entry.group.position.y = entry.group.userData.baseY + Math.sin(elapsed * 1.5 + entry.group.userData.phase) * 0.025;
    const distance = Math.hypot(player.x - entry.group.position.x, player.z - entry.group.position.z);
    if (distance < 5) entry.group.rotation.y = Math.atan2(player.x - entry.group.position.x, player.z - entry.group.position.z);
  }
}
