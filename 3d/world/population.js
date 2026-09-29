import * as THREE from '../vendor/three.module.js';
import { GUEST_ROOMS, roomLocation } from '../systems/doors.js';
import { VILLAIN_ROSTER } from '../characters/villain-roster.js';
import { createVillainCharacter, updateVillainCharacter } from '../characters/villain-builder.js';

export const HOTEL_STAFF = Object.freeze([
  { id:'receptionist',name:'Mara',role:'Receptionist',floor:0,x:-.6,z:-17.8,color:0xf28bbb,line:'Welcome to The Grand Disaster. The paperwork is only mildly cursed.' },
  { id:'security',name:'Bolt',role:'Security',floor:0,x:-6.3,z:-16.4,color:0x59cce8,line:'Lobby secure. Elevator music remains suspicious.' },
  { id:'bellhop',name:'Pip',role:'Bellhop',floor:0,x:7,z:-18.2,color:0xe8b85e,line:'I handle luggage, parcels, and nonvenomous capes.' },
  { id:'cleaner',name:'Mopsey',role:'Cleaner',floor:2,x:0,z:5.5,color:0xe65dba,line:'Floor 2 is clean. Please ignore the faint smell of lightning.' },
  { id:'guest-205',name:'Voltessa',role:'Guest · Room 205',floor:2,x:4.8,z:.7,color:0x65d6ff,line:'The outlets here are delightful. Very crunchy.' },
  { id:'engineer',name:'Quinn',role:'Engineer',floor:3,x:-.4,z:.3,color:0xffb452,line:'If it hums, that is normal. If it sings, call me.' },
  { id:'guest-303',name:'The Bloom Queen',role:'Guest · Room 303',floor:3,x:4.7,z:4.7,color:0x69d77f,line:'My begonias have promised to behave.' },
]);

const PUBLIC_PLACEMENTS = Object.freeze({
  'the-landlord': { floor:0,x:-11.1,z:-18.3,role:'Guest · Reviewing the lobby lease' },
  'pigeon-king': { floor:0,x:10.2,z:-18.6,role:'Guest · Holding court in the lounge' },
  'captain-coupon': { floor:0,x:17.2,z:-17.4,role:'Guest · Inspecting restaurant prices' },
  'uninvited-guest': { floor:2,x:0,z:-6.5,role:'Guest · Reservation missing' },
  'agent-awkward': { floor:3,x:0,z:6.5,role:'Guest · Avoiding conversation' },
});
const availableRooms = GUEST_ROOMS.filter((room) => ![205,303,307].includes(room));
let roomIndex = 0;
export const VILLAIN_PLACEMENTS = Object.freeze(VILLAIN_ROSTER.filter((villain) => villain.id !== 'doctor-drizzle').map((villain) => {
  const publicPlacement = PUBLIC_PLACEMENTS[villain.id];
  if (publicPlacement) return { ...villain, ...publicPlacement };
  const room = availableRooms[roomIndex++];
  const location = roomLocation(room);
  return { ...villain, room, floor:location.floor, x:location.side*4.75, z:location.z+(room%2?.28:-.28), role:`Guest · Room ${room}` };
}));

export const HOTEL_POPULATION = Object.freeze([...HOTEL_STAFF, ...VILLAIN_PLACEMENTS]);
const floorHeight = (floor) => floor === 0 ? 0 : floor === 2 ? 4.5 : 9;

function createStaffCharacter(data) {
  const group=new THREE.Group();group.name=`NPC_${data.id.toUpperCase()}`;
  const uniform=new THREE.MeshStandardMaterial({color:data.color,roughness:.42,metalness:.08});
  const dark=new THREE.MeshStandardMaterial({color:0x15101f,roughness:.52});
  const skin=new THREE.MeshStandardMaterial({color:0xc78566,roughness:.74});
  const body=new THREE.Mesh(new THREE.CapsuleGeometry(.24,.72,3,8),uniform);body.position.y=1;group.add(body);
  const head=new THREE.Mesh(new THREE.IcosahedronGeometry(.28,1),skin);head.position.y=1.78;group.add(head);
  const hat=new THREE.Mesh(new THREE.CylinderGeometry(.3,.35,.12,10),dark);hat.position.y=2.06;group.add(hat);
  const badge=new THREE.Mesh(new THREE.BoxGeometry(.18,.05,.12),uniform);badge.position.set(0,1.25,-.27);group.add(badge);
  return group;
}

function registerPopulationEntry(world, data, group, entries, kind) {
  group.position.set(data.x,floorHeight(data.floor),data.z);
  group.userData.hotelFloor=data.floor;
  group.userData.baseY=group.position.y;
  group.userData.phase=entries.length*.83;
  world.scene.add(group);
  const object={id:`npc-${data.id}`,action:'npc',npc:data,position:new THREE.Vector3(data.x,floorHeight(data.floor),data.z),radius:1.75,minFacing:0,prompt:`Talk to ${data.name} · ${data.role}`,mesh:group};
  world.objects.push(object);
  entries.push({data,group,kind});
}

export function createPopulation(world) {
  const entries=[];
  for(const data of HOTEL_STAFF) registerPopulationEntry(world,data,createStaffCharacter(data),entries,'staff');
  for(const data of VILLAIN_PLACEMENTS) {
    const group=createVillainCharacter(data);
    registerPopulationEntry(world,data,group,entries,'villain');
  }
  world.population=entries;
  return entries;
}

export function updatePopulation(world,player,floor,elapsed) {
  for(const entry of world.population||[]) {
    const sameFloor=entry.data.floor===floor;
    entry.group.visible=sameFloor;
    if(!sameFloor)continue;
    if(entry.kind==='villain') updateVillainCharacter(entry,player,elapsed);
    else {
      entry.group.position.y=entry.group.userData.baseY+Math.sin(elapsed*1.5+entry.group.userData.phase)*.025;
      const distance=Math.hypot(player.x-entry.group.position.x,player.z-entry.group.position.z);
      if(distance<5)entry.group.rotation.y=Math.atan2(player.x-entry.group.position.x,player.z-entry.group.position.z);
    }
  }
}
