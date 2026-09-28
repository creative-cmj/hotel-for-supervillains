import * as THREE from '../vendor/three.module.js';

// The GLB is the sole building visual. These rectangles are gameplay collision only.
export const HOTEL_MAP_VERSION = 'complete-asset-hotel-1';
export const FLOOR_HEIGHTS = Object.freeze({ 0: 0, 2: 4.5, 3: 9 });
export const LOBBY_SPAWN = Object.freeze({ x: 0, y: 0, z: -17.3 });

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
  const roomDoorCollider = {minX:1.72,maxX:2.1,minZ:-4.78,maxZ:-3.22};
  colliders[3].push(roomDoorCollider);
  const objects = [];
  const avatar = new THREE.Group(); avatar.name='MANAGER_FOOT_ROOT';scene.add(avatar);
  const drizzle = new THREE.Group();drizzle.name='DRIZZLE_FOOT_ROOT';scene.add(drizzle);
  const battery = new THREE.Group();battery.name='BATTERY_GAMEPLAY_PROP';scene.add(battery);
  const batteryMat=new THREE.MeshStandardMaterial({color:0x29243d,metalness:.45});
  const batteryMesh=new THREE.Mesh(new THREE.BoxGeometry(.56,.35,.34),batteryMat);
  battery.add(batteryMesh);battery.position.set(-10.9,.95,-13.2);
  const heldBattery=battery.clone(true);avatar.add(heldBattery);heldBattery.position.set(-.75,1.05,-.1);heldBattery.visible=false;
  const noopPart=()=>({rotation:{x:0}});
  const world={scene,objects,colliders,avatar,drizzle,battery,heldBattery,roomDoor:null,doorCollider:roomDoorCollider,
    machine:null,animated:[],armL:noopPart(),armR:noopPart(),legL:noopPart(),legR:noopPart(),
    lift:null,liftDoors:[],spawn:LOBBY_SPAWN,hotel:null,guestDoors:[],roomOpen:false,
    openRoom307(){this.roomOpen=true;const index=colliders[3].indexOf(roomDoorCollider);if(index>=0)colliders[3].splice(index,1);if(this.roomDoor)this.roomDoor.rotation.y=-Math.PI/2;},
    setFloorVisibility(floor){for(const light of floorLights)light.position.y=FLOOR_HEIGHTS[floor]+3.4;if(!this.hotel)return;this.hotel.traverse(node=>{if(node.isMesh&&node.userData.hotelFloor!==undefined)node.visible=node.userData.hotelFloor===floor});}
  };
  return world;
}
