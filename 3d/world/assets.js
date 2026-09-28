import * as THREE from '../vendor/three.module.js';
import { GLTFLoader } from '../vendor/addons/loaders/GLTFLoader.js';

const loader=new GLTFLoader();
const ASSET_VERSION='complete-hotel-3';
const assetUrl=name=>new URL(`../assets/${name}`,import.meta.url).href;
async function load(url){
  let lastError;
  for(let attempt=0;attempt<2;attempt++){
    const separator=url.includes('?')?'&':'?';
    const requestUrl=`${url}${separator}v=${ASSET_VERSION}${attempt?`&retry=${Date.now()}`:''}`;
    try{return (await loader.loadAsync(requestUrl)).scene}catch(error){lastError=error;if(!attempt)console.warn(`Retrying hotel asset ${url}`,error)}
  }
  throw lastError;
}
const requireNode=(root,name)=>{const node=root.getObjectByName(name);if(!node)throw Error(`Hotel asset missing ${name}`);return node};
const point=(node)=>node.getWorldPosition(new THREE.Vector3());
const register=(world,id,position,radius,action,prompt,mesh=null)=>world.objects.push({id,position:new THREE.Vector3(position.x,position.y,position.z),radius,action,prompt,mesh});

export async function loadWorldAssets(world){
  const [hotel,manager,drizzle]=await Promise.all([
    load(assetUrl('grand_disaster_complete_asset_hotel.glb')),
    load(assetUrl('grand_disaster_manager.glb')),
    load(assetUrl('doctor_drizzle_final.glb')),
  ]);
  hotel.name='AUTHORITATIVE_COMPLETE_HOTEL';
  hotel.traverse(node=>{if(node.isMesh){node.castShadow=false;node.receiveShadow=true;node.userData.ignoreCameraCollision=true}});
  hotel.updateMatrixWorld(true);
  world.cameraOccluders={0:[],2:[],3:[]};
  hotel.traverse(node=>{if(!node.isMesh)return;const bounds=new THREE.Box3().setFromObject(node);for(const [floor,height] of [[0,0],[2,4.5],[3,9]])if(bounds.min.y<height+3.6&&bounds.max.y>height+.8)world.cameraOccluders[floor].push(node);
    const named=/^STATIC_FLOOR_([123])_/.exec(node.name);
    const movingCar=(()=>{for(let parent=node.parent;parent;parent=parent.parent)if(parent.name==='ELEVATOR_CAR_MOVABLE')return true;return false})();
    if(named)node.userData.hotelFloor=Number(named[1])===1?0:Number(named[1]);
    else if(!movingCar&&bounds.max.y-bounds.min.y<4.25){const visualLevel=Math.round((bounds.min.y+bounds.max.y-4.2)/9);if(visualLevel>=0&&visualLevel<=2)node.userData.hotelFloor=[0,2,3][visualLevel]}
  });
  world.scene.add(hotel);hotel.updateMatrixWorld(true);world.hotel=hotel;
  // Character asset origins are feet (+0.01m). Do not parent to the old cylinder avatar.
  const managerBox=new THREE.Box3().setFromObject(manager);
  manager.position.y=-managerBox.min.y;
  world.avatar.add(manager);
  const guestBox=new THREE.Box3().setFromObject(drizzle);
  drizzle.position.y=-guestBox.min.y;
  world.drizzle.add(drizzle);
  world.drizzle.position.set(4.65,9,-4.1);
  world.lift=requireNode(hotel,'ELEVATOR_CAR_MOVABLE');
  world.liftDoors=[];
  for(const floor of [1,2,3]){
    const landing=requireNode(hotel,`ELEVATOR_ENTRANCE_FLOOR_${floor}`);
    const stop=point(requireNode(hotel,`ELEVATOR_STOP_FLOOR_${floor}`));
    if(Math.abs(stop.y-(floor-1)*4.5)>.01)throw Error(`Incorrect lift stop on floor ${floor}`);
    // Open the authored entrance slabs; the car remains at its authored foot-level origin.
    for(const node of landing.children.filter(child=>/^Elevator_Door(Left|Right)/.test(child.name))){
      node.position.x+=node.name.includes('Left')?-.72:.72;
      world.liftDoors.push(node);
    }
    register(world,`lift${floor===1?0:floor}`,new THREE.Vector3(-5,stop.y,-9.15),2.25,'lift',`Use Lift · ${floor===1?'Lobby':`Floor ${floor}`}`);
  }
  const phone=requireNode(hotel,'HOTEL_PHONE_INTERACTIVE_VISUAL');
  const computer=requireNode(hotel,'MANAGER_COMPUTER_INTERACTIVE_VISUAL');
  const phoneAt=point(phone),computerAt=point(computer);
  register(world,'phone',new THREE.Vector3(phoneAt.x,0,phoneAt.z),2.3,'phone','Answer Phone');
  register(world,'computer',new THREE.Vector3(computerAt.x,0,computerAt.z),2.3,'computer','Use Manager Computer');
  register(world,'battery',new THREE.Vector3(world.battery.position.x,0,world.battery.position.z),2.1,'battery','Pick Up Industrial Battery',world.battery);
  const storageDoor=requireNode(hotel,'STAFF_STORAGE_DOOR_HINGE');storageDoor.rotation.y=Math.PI/2;
  for(const floor of [1,2,3])for(let index=1;index<=10;index++){
    const number=floor*100+index;
    const hinge=requireNode(hotel,`ROOM_${number}_DOOR_HINGE`);
    if(number===307){world.roomDoor=hinge;continue}
    hinge.rotation.y=-Math.PI/2;
    world.guestDoors.push(hinge);
  }
  if(world.roomOpen)world.openRoom307();
  register(world,'room-door',new THREE.Vector3(1.16,9,-4),2.5,'door','Open Room 307',world.roomDoor);
  const weather=requireNode(hotel,'ROOM_307_WEATHER_MACHINE_VISUAL');
  const placement=requireNode(hotel,'ROOM_307_BATTERY_PLACEMENT');
  world.machine=weather.getObjectByProperty('isMesh',true);
  world.weatherMachine=weather;
  world.batteryPlacement=placement;
  register(world,'drizzle',new THREE.Vector3(4.65,9,-4.1),2.4,'drizzle','Give Battery to Doctor Drizzle',world.drizzle);
  world.setFloorVisibility(0);
  return {hotel,manager,drizzle,phone,computer,weather,placement};
}
