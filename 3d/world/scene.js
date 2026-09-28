import * as THREE from '../vendor/three.module.js';

// The GLB is the sole building visual. These rectangles are gameplay collision only.
export const HOTEL_MAP_VERSION = 'polished-hotel-1';
export const FLOOR_HEIGHTS = Object.freeze({ 0: 0, 2: 4.5, 3: 9 });
export const LOBBY_SPAWN = Object.freeze({ x: 0, y: 0, z: -14.5 });

export function createWorld() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x100d1c);
  scene.fog = new THREE.Fog(0x100d1c, 32, 95);
  scene.add(new THREE.HemisphereLight(0xd3dcff, 0x403052, 2.5));
  const sunlight = new THREE.DirectionalLight(0xffe1c2, 2.1);
  sunlight.position.set(8, 24, 12);
  scene.add(sunlight);
  const floorLights=[];
  for (const [x,z,intensity] of [[0,-17,12],[0,1,10],[-5,-9,7]]) {
    const light=new THREE.PointLight(0xffd8ba,intensity,15);
    light.position.set(x,3.4,z);
    scene.add(light);floorLights.push(light);
  }
  const colliders = { 0: [], 2: [], 3: [] };
  const rect = (floor, x1, x2, z1, z2) => colliders[floor].push({minX:x1,maxX:x2,minZ:z1,maxZ:z2});
  for (const floor of [0,2,3]) {
    rect(floor,-20.3,-20,-22.1,10.2); rect(floor,20,20.3,-22.1,10.2);
    rect(floor,-20.3,20.3,-22.3,-22); rect(floor,-20.3,20.3,10,10.3);
    // The two public-wing portals and the lobby-to-guest-corridor opening are gaps.
    for (const x of [-8,8]) for (const [a,b] of [[-22,-19.7],[-16.3,-12]]) rect(floor,x-.15,x+.15,a,b);
    for (const [a,b] of [[-8,-7.2],[-2.7,-1.65],[1.65,8]]) rect(floor,a,b,-12.17,-11.83);
    // Guest corridor partitions: every room has a real doorway, not a solid wall.
    for (const x of [-1.91,1.91]) {
      for (const z of [-8,-4,0,4,8]) {
        // The west edge of the first bay opens into the elevator lobby.
        if(x!==-1.91||z!==-8)rect(floor,x-.13,x+.13,z-2,z-.78);
        rect(floor,x-.13,x+.13,z+.78,z+2);
      }
    }
    for (const z of [-10,-6,-2,2,6,10]) {
      if(z!==-10)rect(floor,-8,-2.1,z-.13,z+.13);
      rect(floor,2.1,8,z-.13,z+.13);
    }
    for (const x of [-8,8]) rect(floor,x-.15,x+.15,-11.8,10);
    // Lift shaft back and sides; the lobby-facing entrance at z=-10 stays open.
    rect(floor,-7,-6.8,-13.5,-10.5);rect(floor,-3.2,-3,-13.5,-10.5);
    rect(floor,-7,-3,-13.65,-13.4);
  }
  // Reception and public furniture the player must navigate around.
  rect(0,1,4.1,-17.65,-16.92);
  rect(0,-2.7,-.5,-20.1,-18.3);
  // East public wing: bar, kitchen, partition walls and purposeful table clusters.
  rect(0,9.25,15.95,-16.30,-14.20);
  rect(0,11.35,17.45,-13.80,-11.70);
  rect(0,8.0,15.90,-14.60,-14.30);rect(0,17.40,20.0,-14.60,-14.30);
  for(const [x,z] of [[10.8,-20.1],[14,-20.1],[17.2,-20.1],[11.4,-17],[16.5,-17]])rect(0,x-1.05,x+1.05,z-1.05,z+1.05);
  // West wing: lounge clusters, service partitions, stair and staff fixtures.
  for(const [x,z] of [[-17.4,-19.8],[-12.5,-19.8],[-17.4,-17],[-14.8,-19.8],[-14.8,-17.1]])rect(0,x-1.25,x+1.25,z-.72,z+.72);
  for(const [x1,x2] of [[-20,-18.25],[-16.75,-14.95],[-13.45,-11.65],[-10.15,-8]])rect(0,x1,x2,-15.58,-15.32);
  rect(0,-15.98,-15.72,-15.45,-10);rect(0,-12.68,-12.42,-15.45,-10);
  rect(0,-19.5,-14.75,-13.45,-11.35); // compact service stair envelope
  const objects = [];
  const avatar = new THREE.Group(); avatar.name='MANAGER_FOOT_ROOT';scene.add(avatar);
  const drizzle = new THREE.Group();drizzle.name='DRIZZLE_FOOT_ROOT';scene.add(drizzle);
  const battery = new THREE.Group();battery.name='BATTERY_GAMEPLAY_PROP';scene.add(battery);
  const batteryMat=new THREE.MeshStandardMaterial({color:0x29243d,metalness:.55,roughness:.28});
  const batteryGlow=new THREE.MeshStandardMaterial({color:0x32cce8,emissive:0x1688aa,emissiveIntensity:1.2,metalness:.18,roughness:.22});
  const batteryGold=new THREE.MeshStandardMaterial({color:0xdba94f,metalness:.75,roughness:.25});
  battery.add(new THREE.Mesh(new THREE.BoxGeometry(.68,.42,.42),batteryMat));
  for(const side of [-1,1]){const terminal=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,.14,10),batteryGold);terminal.position.set(side*.19,.27,0);battery.add(terminal)}
  const core=new THREE.Mesh(new THREE.BoxGeometry(.44,.12,.445),batteryGlow);core.position.y=.04;battery.add(core);
  battery.position.set(-10.9,.95,-13.2);
  const heldBattery=battery.clone(true);avatar.add(heldBattery);heldBattery.position.set(0,1.18,-.48);heldBattery.scale.setScalar(1.18);heldBattery.rotation.x=.12;heldBattery.visible=false;
  const serviceParcel=new THREE.Group();serviceParcel.name='SERVICE_REQUEST_PARCEL';scene.add(serviceParcel);
  const parcelBody=new THREE.Mesh(new THREE.BoxGeometry(.72,.42,.52),batteryMat);serviceParcel.add(parcelBody);
  const parcelBand=new THREE.Mesh(new THREE.BoxGeometry(.14,.45,.55),batteryGold);serviceParcel.add(parcelBand);
  const parcelGlow=new THREE.Mesh(new THREE.BoxGeometry(.46,.08,.555),batteryGlow);parcelGlow.position.y=.05;serviceParcel.add(parcelGlow);
  serviceParcel.position.set(-9.6,.9,-13.4);serviceParcel.visible=false;
  const heldParcel=serviceParcel.clone(true);avatar.add(heldParcel);heldParcel.position.set(0,1.16,-.46);heldParcel.scale.setScalar(1.05);heldParcel.visible=false;
  const noopPart=()=>({rotation:{x:0}});
  const world={scene,objects,colliders,avatar,drizzle,battery,heldBattery,serviceParcel,heldParcel,roomDoor:null,doorCollider:null,
    machine:null,animated:[],armL:noopPart(),armR:noopPart(),legL:noopPart(),legR:noopPart(),
    lift:null,liftDoors:[],spawn:LOBBY_SPAWN,hotel:null,guestDoors:[],roomOpen:false,doors:null,population:[],editableLayout:[],
    openRoom307(){this.roomOpen=true;this.doors?.open(307,true);},
    setFloorVisibility(floor){
      const accent=floor===0?0xffd8ba:floor===2?0xff70c8:0x55d9ff;
      for(const light of floorLights){light.position.y=FLOOR_HEIGHTS[floor]+3.4;light.color.setHex(accent)}
      if(this.hotel)this.hotel.traverse(node=>{if(node.isMesh){const assigned=node.userData.hotelFloor;node.visible=assigned===undefined||assigned===floor}});
      for(const entry of this.population||[])entry.group.visible=entry.data.floor===floor;
      for(const root of this.editableLayout||[])root.visible=root.userData.hotelFloor===floor;
    }
  };
  return world;
}
