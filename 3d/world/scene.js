import * as THREE from '../vendor/three.module.js';

const C = { purple:0x24152f, plum:0x3b2450, wall:0x413051, floor:0x6f6080, carpet:0x803e75, gold:0xe9b96d, pink:0xeb6db1, cyan:0x67dcec, ivory:0xf2e9f4, dark:0x191323, wood:0x714c61, green:0x629c8b };
const mat = (color, metalness=0, roughness=.7) => new THREE.MeshStandardMaterial({color,metalness,roughness});
const mats = Object.fromEntries(Object.entries(C).map(([key,color]) => [key, mat(color, key === 'gold' ? .65 : .1)]));
const emissive = (color,intensity=1.5) => new THREE.MeshStandardMaterial({ color, emissive:color, emissiveIntensity:intensity, roughness:.4 });

export function createWorld() {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x100d1c); scene.fog = new THREE.Fog(0x100d1c, 25, 75);
  scene.add(new THREE.HemisphereLight(0xc6ccff,0x36203a,2.1));
  const light = new THREE.DirectionalLight(0xffdec0,2.3); light.position.set(8,22,7); light.castShadow=true; light.shadow.mapSize.set(1024,1024); light.shadow.camera.left=-30; light.shadow.camera.right=30; light.shadow.camera.top=30; light.shadow.camera.bottom=-35; scene.add(light);
  const objects = []; const colliders = { 0:[], 3:[] }; const animated = [];
  function mesh(geometry, material, x,y,z, parent=scene) { const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m; }
  function box(x,y,z,w,h,d,material=mats.wall,parent=scene) { return mesh(new THREE.BoxGeometry(w,h,d),material,x,y,z,parent); }
  function wall(floor,x,z,w,d,height=4.8) { const y=floor===3?9:0; box(x,y+height/2,z,w,height,d);colliders[floor].push({minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2}); }
  function label(text,x,y,z,width=2.5,height=.55,fg='#fff4d4',bg='#362446',rotation=0) {
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;const ctx=canvas.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,512,128);ctx.strokeStyle='#eac381';ctx.lineWidth=7;ctx.strokeRect(6,6,500,116);ctx.fillStyle=fg;ctx.font='bold 45px Georgia';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,256,66,480);
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;const panel=new THREE.Mesh(new THREE.PlaneGeometry(width,height),new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide}));panel.position.set(x,y,z);panel.rotation.y=rotation;scene.add(panel);return panel;
  }
  function lightBar(x,y,z,color=C.gold,w=2) { const m=box(x,y,z,w,.08,.08,emissive(color,.8));return m; }
  function register(id,x,y,z,radius,action,prompt,visible) { objects.push({id,position:new THREE.Vector3(x,y,z),radius,action,prompt,mesh:visible}); }
  function door(floor,x,z,w,d) { return box(x,(floor===3?9:0)+1.4,z,w,2.8,d,mats.wood); }
  function plant(x,y,z){box(x,y+.25,z,.7,.5,.7,mats.gold);const crown=mesh(new THREE.ConeGeometry(.75,2,7),mats.green,x,y+1.5,z);crown.rotation.z=.12;}
  function columns(x,z,y=0){box(x,y+2.3,z,.55,4.6,.55,mats.ivory);box(x,y+.15,z,.8,.3,.8,mats.gold);box(x,y+4.45,z,.8,.3,.8,mats.gold);}
  function lamp(x,z,y=0){const bulb=mesh(new THREE.SphereGeometry(.24,12,8),emissive(C.gold,1),x,y+3.8,z);const point=new THREE.PointLight(C.gold,11,9);point.position.copy(bulb.position);scene.add(point);}
  // Establishing shot: a visible luxury facade outside the playable lobby.
  box(0,8,19,29,16,1.4,mats.plum);box(0,.18,29,37,.3,23,mats.dark);
  for(const x of [-10,-6,-2,2,6,10])for(const y of [4,8,12]){box(x,y,19.75,2.7,2.6,.12,mats.gold);box(x,y,19.84,2.42,2.33,.12,emissive(C.cyan,.12));}
  label('THE GRAND DISASTER',0,15,19.9,12,1.7);
  for(const x of [-13,13]){box(x,3,20,1,6,1,mats.ivory);box(x,6.2,20,1.3,.55,1.3,mats.gold)}
  for(const x of [-17,17]){box(x,1.2,30,2.6,1.1,4.8,mats.dark);box(x,1.65,30,2.3,.6,.8,mats.pink)}
  box(0,.08,32,8,.1,23,mats.carpet);
  // Lobby: a bright, navigable hall, with the reception straight ahead.
  box(0,-.18,0,26,.3,24,mats.floor);box(0,.015,1,6,.04,20,mats.carpet);
  wall(0,-13,0,.6,24);wall(0,13,-6,.6,12);wall(0,13,9,.6,6);wall(0,0,12,26,.6);wall(0,-9.8,-12,6.4,.6);wall(0,4.8,-12,16.4,.6);
  for(const x of [-10,10])for(const z of [-8,8])columns(x,z);
  for(const x of [-7,7])for(const z of [-6,5])lamp(x,z);
  for(const x of [-9,9])for(const z of [-4,7])plant(x,0,z);
  box(5,.57,-6,9,1.15,1.8,mats.wood);box(5,1.17,-6,9,.12,1.9,mats.gold);box(5,1.42,-7,7,.55,.12,mats.ivory);
  label('THE GRAND DISASTER',5,3.4,-11.65,6,.9);
  // Computer physically rests behind the desk, not an HUD shortcut.
  box(7,1.63,-6.4,1.35,.9,.16,mats.dark);box(7,1.63,-6.29,1.14,.67,.025,emissive(C.cyan,.2));box(7,1.1,-5.9,1.15,.07,.38,mats.dark);
  register('computer',7,0,-6.4,2,'computer','Use Manager Computer',null);
  box(2.4,1.28,-5.7,.55,.14,.4,mats.dark);box(2.3,1.48,-5.75,.25,.23,.2,mats.gold);
  register('phone',2.4,0,-5.7,2,'phone','Answer Phone',null);
  label('STORAGE  →',11.15,2.65,-.5,2.9,.58,'#fff4d4','#362446',Math.PI/2);
  label('LIFT  ←',-7.4,2.65,-7.75,2.2,.58);
  // Storage through a real gap in the east lobby wall.
  box(16,-.18,3,6,.3,11,mats.floor);wall(0,19,3,.5,11);wall(0,16,-2.5,6,.5);wall(0,16,8.5,6,.5);wall(0,13,7,.5,3);wall(0,13,-1,.5,3);label('STORAGE',17.4,3,-2.2,2.6,.55);
  for(const x of [15,17.6])for(const z of [.5,5.5]){box(x,.65,z,1.7,1.25,.7,mats.wood);box(x,1.32,z,1.8,.08,.76,mats.gold)}
  const battery=new THREE.Group();box(0,0,0,.75,.48,.43,mats.dark,battery);box(0,.27,0,.44,.09,.22,mats.gold,battery);for(const x of [-.2,.2])box(x,.34,0,.12,.06,.1,mats.cyan,battery);scene.add(battery);battery.position.set(15,1.62,5.5);
  register('battery',15,0,5.5,2,'battery','Pick Up Industrial Battery',battery);
  // Elevator car is the only cross-floor route. Its entire visual group rises physically.
  const lift=new THREE.Group();scene.add(lift);lift.position.set(-5,0,-10.2);
  box(0,.05,0,3.2,.14,3.3,mats.gold,lift);box(-1.55,2,0,.15,4,3.3,mats.wood,lift);box(1.55,2,0,.15,4,3.3,mats.wood,lift);box(0,2,-1.6,3.2,4,.16,mats.wood,lift);box(0,4,0,3.2,.16,3.3,mats.gold,lift);
  const liftDoors=[box(-1.45,1.45,1.65,1.3,2.9,.1,mats.gold,lift),box(1.45,1.45,1.65,1.3,2.9,.1,mats.gold,lift)];
  const shaft=box(-5,5,-12.1,4,14,.35,mats.wall);shaft.castShadow=false;
  for(const floor of [0,3]){const y=floor===3?9:0;box(-5,y-.12,-8.3,3.5,.2,.8,mats.gold);label(floor===0?'LOBBY':'FLOOR 3',-5,y+3.5,-8.29,2.8,.5);register(floor===0?'lift0':'lift3',-5,y,-9.1,2.4,'lift',floor===0?'Select Floor 3':'Select Lobby',null);}
  // Third floor stretches toward Room 307. Extra doors are decorative and honest.
  box(0,8.82,-18,17,.3,24,mats.floor);box(0,9.02,-18,3,.04,22,mats.carpet);
  wall(3,-8.5,-18,.5,24);wall(3,8.5,-11,.5,10);wall(3,8.5,-17.5,.5,1);wall(3,8.5,-29,.5,2);wall(3,0,-30,17,.5);wall(3,-7.55,-6.4,1.9,.5);wall(3,2.55,-6.4,11.9,.5);
  for(const z of [-12,-19,-26]){lamp(-6,z,9);lamp(6,z,9)}
  for(const z of [-13,-17,-29]){door(3,-8.15,z,.12,.95);label(z===-13?'301':z===-17?'303':'309',-8.02,11,z,1,.4,'#f9e9ae','#4d365a',Math.PI/2)}
  label('ROOM 307  →',3,12,-15,3,.55);
  // Room 307, with a door opening in its hallway-facing wall.
  box(13,8.82,-23,9,.3,12,mats.floor);wall(3,17.5,-23,.4,12);wall(3,13,-29,9,.5);wall(3,13,-17,9,.5);wall(3,8.5,-23.5,.5,7.5);
  const roomDoor=door(3,8.48,-18.9,.12,1.6);const doorCollider={minX:8.2,maxX:8.85,minZ:-19.7,maxZ:-18.1};colliders[3].push(doorCollider);register('room-door',8.15,9,-18.9,2.2,'door','Open Room 307',roomDoor);
  label('307',8.03,11,-20.7,1.1,.48,'#fff4d4','#4d365a',Math.PI/2);
  box(14,9.55,-25,3.2,.8,3,mats.wood);box(14,10.05,-25,2.7,.22,2.6,mats.ivory);box(10.5,9.55,-26.8,1.5,1,1,mats.wood);
  for(const x of [11,15.5])lamp(x,-27,9);
  // Drizzle: coat, shoulders, face, storm-crown and weather console.
  const drizzle=new THREE.Group();scene.add(drizzle);drizzle.position.set(13,9,-20.6);
  mesh(new THREE.CylinderGeometry(.48,.78,1.8,9),mats.plum,0,1.2,0,drizzle);
  mesh(new THREE.SphereGeometry(.34,12,10),mat(0xb8908e),0,2.3,0,drizzle);
  box(0,2.68,0,.8,.19,.72,mats.dark,drizzle);box(0,2.85,0,.4,.2,.5,mats.gold,drizzle);
  for(const x of [-.69,.69])box(x,1.25,0,.35,1.16,.4,mats.purple,drizzle);
  box(15,9.68,-20.6,1.3,1.35,.7,mats.wood);const machine=mesh(new THREE.SphereGeometry(.45,14,10),emissive(C.cyan,.4),15,10.7,-20.6);animated.push(machine);
  register('drizzle',13,9,-20.6,2.7,'drizzle','Give Battery to Doctor Drizzle',drizzle);
  label('DR. DRIZZLE',13,12,-16.72,3,.55);
  // The manager's body visibly carries the battery and faces their direction of travel.
  const avatar=new THREE.Group();scene.add(avatar);
  mesh(new THREE.CylinderGeometry(.37,.48,1.2,10),mats.dark,0,1.08,0,avatar);
  box(0,1.45,-.31,.36,.68,.08,mats.gold,avatar);
  mesh(new THREE.SphereGeometry(.3,12,10),mat(0xc4958b),0,1.95,0,avatar);
  box(0,2.21,0,.67,.17,.6,mats.purple,avatar);
  const armL=box(-.56,1.1,-.06,.22,.95,.27,mats.plum,avatar);const armR=box(.56,1.1,-.06,.22,.95,.27,mats.plum,avatar);
  const legL=box(-.19,.38,0,.26,.76,.32,mats.dark,avatar);const legR=box(.19,.38,0,.26,.76,.32,mats.dark,avatar);
  const heldBattery=new THREE.Group();avatar.add(heldBattery);heldBattery.position.set(-.88,1.18,-.1);box(0,0,0,.66,.43,.42,mats.dark,heldBattery);box(0,.23,0,.35,.08,.17,mats.gold,heldBattery);box(0,.01,.22,.52,.24,.035,mats.cyan,heldBattery);box(0,.01,.25,.24,.06,.02,mats.dark,heldBattery);heldBattery.visible=false;
  return {scene,objects,colliders,avatar,lift,liftDoors,battery,heldBattery,roomDoor,doorCollider,machine,animated,armL,armR,legL,legR,label};
}
