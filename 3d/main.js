import * as THREE from './vendor/three.module.js';
import { createWorld } from './world/scene.js';
import { advancePlayer, collides } from './systems/player.js';
import { findInteraction } from './systems/interaction.js';
import { initialMission, transition } from './systems/mission.js';

const el = (id) => document.getElementById(id);
const canvas=el('world');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.5;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const world=createWorld();const camera=new THREE.PerspectiveCamera(63,innerWidth/innerHeight,.1,80);
const raycaster=new THREE.Raycaster();
let mission=loadMission();let player=loadPlayer();world.lift.position.y=player.y;
let started=false,paused=false,dialogue=false,computer=false,osTab='home',isRiding=false,toastUntil=0,last=performance.now(),ringClock=0,stepClock=0,musicClock=0,audio=null,soundOn=true,elapsed=0;
const keys=new Set();const aim={yaw:0,pitch:.28};const debugEnabled=new URLSearchParams(location.search).get('debug')==='1';
function lockPointer(){canvas.requestPointerLock?.().catch(()=>{});}
function loadMission(){try{const data=JSON.parse(localStorage.getItem('grand-disaster-3d-v1'));return data?.step?data:initialMission()}catch{return initialMission()}}
function loadPlayer(){const fallback={x:0,z:6,y:mission.floor===3?9:0,vx:0,vz:0,yaw:0};try{const stored=JSON.parse(localStorage.getItem('grand-disaster-3d-player-v1'));return Number.isFinite(stored?.x)&&Number.isFinite(stored?.z)&&stored.floor===mission.floor?{...fallback,x:stored.x,z:stored.z}:fallback}catch{return fallback}}
function save(){localStorage.setItem('grand-disaster-3d-v1',JSON.stringify(mission));localStorage.setItem('grand-disaster-3d-player-v1',JSON.stringify({x:player.x,z:player.z,floor:mission.floor}));}
function tone(freq=.6,duration=.15,kind='sine',volume=.024){if(!audio||!soundOn)return;const osc=audio.createOscillator(),gain=audio.createGain();osc.type=kind;osc.frequency.setValueAtTime(freq,audio.currentTime);gain.gain.setValueAtTime(volume,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);osc.connect(gain).connect(audio.destination);osc.start();osc.stop(audio.currentTime+duration)}
function ring(){tone(700,.12);setTimeout(()=>tone(860,.15),140)}
function notify(text,seconds=3){el('toast').textContent=text;el('toast').classList.add('show');toastUntil=performance.now()+seconds*1000}
function objective(){return ({phone:'Answer the front desk phone',battery:'Find the industrial battery in Storage',elevator:'Carry the battery to the elevator · Floor 3',deliver:'Bring the battery to Drizzle · Room 307',computer:'Return to reception · Check the manager computer',complete:'First shift training complete'})[mission.step]}
function available(object){const id=object.id;if(id==='phone')return mission.step==='phone';if(id==='battery')return mission.step==='battery'&&!mission.carried;if(id==='drizzle')return mission.step==='deliver'&&mission.roomOpen&&mission.carried==='battery';if(id==='room-door')return mission.floor===3&&!mission.roomOpen;if(id==='computer')return mission.floor===0;
if(id==='lift0')return mission.floor===0&&!isRiding;if(id==='lift3')return mission.floor===3&&!isRiding;return false;}
function updateHud(){el('cash').textContent=`$${mission.cash.toLocaleString()}`;el('reputation').innerHTML=`REPUTATION <b>${mission.reputation}</b>`;el('mayhem').innerHTML=`MAYHEM <b>${mission.mayhem}%</b>`;el('mayhem').dataset.level=mission.mayhem>60?'danger':mission.mayhem>40?'warning':'calm';el('objective').textContent=objective();el('hint').textContent=mission.step==='phone'?'WASD move · Mouse look · Shift run':mission.step==='battery'?'Follow the STORAGE sign near the lobby wall':mission.step==='elevator'?'Find the lift on the lobby’s left side':mission.step==='deliver'?'Follow the FLOOR 3 hallway signs to Room 307':mission.step==='computer'?'Ride back down and find the desk monitor':'The hotel is officially your problem now.';
world.battery.visible=mission.carried!=='battery'&&mission.step!=='computer'&&mission.step!=='complete';world.heldBattery.visible=mission.carried==='battery';if(mission.roomOpen){world.roomDoor.rotation.y=Math.PI/2;world.roomDoor.position.x=9.2;const index=world.colliders[3].indexOf(world.doorCollider);if(index>=0)world.colliders[3].splice(index,1)}if(mission.step==='computer'||mission.step==='complete'){world.machine.material.emissiveIntensity=1.5;world.machine.material.color.setHex(0x89eeef)}}
function setState(event){const next=transition(mission,event);if(next===mission)return false;mission=next;save();updateHud();return true}
function openComputer(){if(mission.floor!==0)return;computer=true;keys.clear();el('computer').hidden=false;setState('use-computer');renderOs();document.exitPointerLock?.();tone(440,.1);}
function closeComputer(){computer=false;el('computer').hidden=true;if(setState('exit-computer'))notify('FIRST SHIFT TRAINING COMPLETE · The Grand Disaster is officially your problem now.',7);tone(380,.1)}
function renderOs(){const view=el('os-view');document.querySelectorAll('#computer nav button').forEach(b=>b.classList.toggle('active',b.dataset.tab===osTab));
if(osTab==='home')view.innerHTML=`<div class="os-title"><div><small>WELCOME BACK, MANAGER</small><h2>THE GRAND DISASTER</h2><p>Shift 1 · Hotel systems reporting normally, mostly.</p></div><div class="os-icon">H</div></div><div class="os-grid"><article><small>HOTEL CASH</small><b>$${mission.cash.toLocaleString()}</b></article><article><small>REPUTATION</small><b>${mission.reputation}</b></article><article><small>MAYHEM</small><b>${mission.mayhem}%</b></article></div><div class="os-note">ACTIVE GUESTS <b>1</b> <span>·</span> ACTIVE REQUESTS <b>${mission.step==='computer'||mission.step==='complete'?0:1}</b></div>`;
else if(osTab==='guests')view.innerHTML=`<div class="os-title"><div><small>RESIDENT DIRECTORY</small><h2>ACTIVE GUESTS</h2></div></div><article class="guest-profile"><div class="guest-crest">☁</div><div><small>ROOM 307 · RETIRED WEATHER VILLAIN</small><h3>DOCTOR DRIZZLE</h3><p>Satisfaction: <b>${mission.step==='computer'||mission.step==='complete'?'98':'72'}%</b> · Status: ${mission.step==='computer'||mission.step==='complete'?'Pleasantly Grumpy':'Slightly Irritated'}</p><p>Request: Industrial Weather Battery · ${mission.step==='computer'||mission.step==='complete'?'COMPLETED':'PENDING'}</p></div></article>`;
else view.innerHTML=`<div class="os-title"><div><small>FACILITY NAVIGATION</small><h2>HOTEL MAP</h2></div></div><div class="map-floor"><b>GROUND FLOOR</b><div><span>MAIN LOBBY</span><span>RECEPTION</span><span>STORAGE →</span><span>← ELEVATOR</span></div></div><div class="map-floor"><b>FLOOR 3</b><div><span>ELEVATOR</span><span>HALLWAY →</span><span>ROOM 307 · DRIZZLE</span></div></div>`;
}
function interact(target){if(!target||isRiding)return;
switch(target.action){
case 'phone':if(setState('answer-phone')){dialogue=true;el('dialogue').hidden=false;document.exitPointerLock?.();tone(320,.3);notify('NEW REQUEST · DOCTOR DRIZZLE · ROOM 307',4)}break;
case 'battery':if(setState('pick-battery')){tone(580,.12);notify('BATTERY SECURED · Deliver to Room 307')}break;
case 'door':if(setState('open-room')){tone(240,.17);notify('Room 307 unlocked')}break;
case 'drizzle':if(setState('deliver')){tone(640,.2);setTimeout(()=>tone(880,.27),210);notify('“Finally! Another five minutes and we’d have tornado season.” · +$300  +5 REP  −4 MAYHEM',7)}break;
case 'computer':openComputer();break;
case 'lift':rideLift(mission.floor===0?3:0);break;
}}
function rideLift(destination){if(isRiding)return;isRiding=true;keys.clear();const originY=mission.floor===3?9:0;const destY=destination===3?9:0;const startTime=performance.now();player.x=-5;player.z=-10.15;player.vx=player.vz=0;tone(165,2.35,'triangle',.015);notify(`LIFT · ${destination===3?'FLOOR 3':'LOBBY'}`,3);
function move(){const progress=Math.min(1,(performance.now()-startTime)/2400);const eased=progress*progress*(3-2*progress);const doorGap=progress<.18?1.45-4.2*progress:progress>.82?.7+4.2*(progress-.82):.7;world.liftDoors[0].position.x=-doorGap;world.liftDoors[1].position.x=doorGap;player.y=originY+(destY-originY)*eased;world.lift.position.y=player.y; if(progress<1)requestAnimationFrame(move);else{player.y=destY;world.lift.position.y=destY;world.liftDoors[0].position.x=-1.45;world.liftDoors[1].position.x=1.45;mission={...mission,floor:destination};if(destination===3)setState('arrive-floor3');else setState('arrive-lobby');player.z=-8.1;isRiding=false;save();updateHud();tone(900,.25)}}move();}
function drop(){if(mission.carried!=='battery'||isRiding)return;if(setState('drop-battery')){world.battery.position.set(player.x,player.y+1,player.z-1);const entry=world.objects.find(o=>o.id==='battery');entry.position.set(player.x,player.y,player.z-1);notify('Battery dropped · pick it back up');tone(240,.12)}}
function update(dt){if(!started||paused||dialogue||computer)return;
const input={forward:keys.has('KeyW')||keys.has('ArrowUp'),back:keys.has('KeyS')||keys.has('ArrowDown'),left:keys.has('KeyA')||keys.has('ArrowLeft'),right:keys.has('KeyD')||keys.has('ArrowRight'),run:keys.has('ShiftLeft')||keys.has('ShiftRight')};
if(!isRiding){player.y=mission.floor===3?9:0;player.yaw=aim.yaw;player=advancePlayer(player,input,dt,world.colliders[mission.floor]);}
world.avatar.position.set(player.x,player.y,player.z);world.avatar.rotation.y=-player.yaw;
const stride=Math.min(1,Math.hypot(player.vx,player.vz)/4);const wave=Math.sin(elapsed*10)*stride;world.legL.rotation.x=wave*.52;world.legR.rotation.x=-wave*.52;world.armL.rotation.x=-wave*.36;world.armR.rotation.x=wave*.36;
if(stride>.25&&!isRiding){stepClock+=dt;if(stepClock>(input.run?.25:.39)){tone(125,.055,'triangle',.004);stepClock=0}}else stepClock=0;
musicClock+=dt;if(musicClock>(mission.mayhem>60?.29:mission.mayhem>40?.46:.7)){const notes=[196,246.94,293.66,392,329.63,246.94];tone(notes[Math.floor(elapsed*1.7)%notes.length],.22,'sine',.0025);musicClock=0}
const candidate=findInteraction(player,world.objects,available);el('prompt').hidden=!candidate;el('prompt').textContent=candidate?`[E] ${candidate.prompt}`:'';if(candidate){const highlight=candidate.mesh;if(highlight?.material?.emissive)highlight.material.emissiveIntensity=.7;}
if(mission.step==='phone'){ringClock+=dt;if(ringClock>3.2){ring();ringClock=0}}
}
function frame(now){const dt=Math.min(.05,(now-last)/1000);last=now;elapsed+=dt;update(dt);
const target=new THREE.Vector3(player.x,player.y+1.3,player.z);
let desired=new THREE.Vector3(player.x-Math.sin(aim.yaw)*5.8,player.y+3.2+Math.sin(aim.pitch)*3,player.z+Math.cos(aim.yaw)*5.8);
if(computer){target.set(7,1.58,-6.4);desired.set(7,1.8,-3.9);}else if(!started){target.set(0,8,19);desired.set(Math.sin(elapsed*.25)*3,10,45);}
// Camera raycasting against large walls prevents seeing through hotel partitions.
if(started&&!computer){const direction=desired.clone().sub(target),distance=direction.length();raycaster.set(target,direction.normalize());raycaster.far=distance;const hit=raycaster.intersectObjects(world.scene.children,true).find(h=>{let node=h.object;while(node){if(node===world.avatar)return false;node=node.parent}return h.object.isMesh&&h.distance>.9&&h.distance<distance-.2});if(hit)desired=target.clone().add(direction.multiplyScalar(Math.max(1,hit.distance-.25)));}
camera.position.lerp(desired,Math.min(1,dt*7));camera.lookAt(target);renderer.render(world.scene,camera);
if(toastUntil&&now>toastUntil){el('toast').classList.remove('show');toastUntil=0}requestAnimationFrame(frame)}
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
window.addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();keys.add(e.code);if(e.code==='Escape'){if(computer)closeComputer();else if(dialogue){dialogue=false;el('dialogue').hidden=true}else if(started){paused=!paused;el('pause').hidden=!paused;keys.clear()}}if(!started||paused||dialogue||computer)return;if(e.code==='KeyE'&&!e.repeat)interact(findInteraction(player,world.objects,available));if(e.code==='KeyQ'&&!e.repeat)drop()});
window.addEventListener('keyup',e=>keys.delete(e.code));
canvas.addEventListener('click',()=>{if(started&&!paused&&!computer&&!dialogue)lockPointer()});
window.addEventListener('mousemove',e=>{if(!started||computer||paused||dialogue)return;if(document.pointerLockElement===canvas||e.buttons===1){aim.yaw-=e.movementX*.0026;aim.pitch=THREE.MathUtils.clamp(aim.pitch+e.movementY*.002,-.45,.75)}});
el('start').onclick=()=>{started=true;el('intro').hidden=true;audio=new (window.AudioContext||window.webkitAudioContext)();lockPointer();notify('FIRST SHIFT · Welcome to The Grand Disaster',4)};
el('close-dialogue').onclick=()=>{dialogue=false;el('dialogue').hidden=true;lockPointer()};
el('resume').onclick=()=>{paused=false;el('pause').hidden=true;lockPointer()};
el('restart').onclick=()=>{localStorage.removeItem('grand-disaster-3d-v1');location.reload()};
el('exit-os').onclick=closeComputer;
document.querySelectorAll('#computer nav button').forEach(button=>button.onclick=()=>{osTab=button.dataset.tab;renderOs();tone(520,.06)});
el('sound').onclick=()=>{soundOn=!soundOn;el('sound').textContent=soundOn?'♪':'×'};
if(debugEnabled){el('debug').hidden=false;el('debug').innerHTML='<b>DEV TOOLS</b>'+['ADD CASH','REP +10','MAYHEM +20','LOBBY','STORAGE','FLOOR 3','SPAWN BATTERY','RESET REQUEST','COMPLETE REQUEST','RESET TUTORIAL','TRIGGER CALL'].map((label,index)=>`<button data-dev="${index}">${label}</button>`).join('');el('debug').onclick=e=>{const button=e.target.closest('[data-dev]');if(!button)return;const id=Number(button.dataset.dev);if(id===0)mission.cash+=500;if(id===1)mission.reputation=Math.min(100,mission.reputation+10);if(id===2)mission.mayhem=Math.min(100,mission.mayhem+20);if(id===3||id===4||id===5){mission.floor=id===5?3:0;player.y=id===5?9:0;player.x=id===4?16:id===5?0:0;player.z=id===4?3:id===5?-19:4;world.lift.position.y=player.y}if(id===6){mission.carried='battery';mission.step='elevator'}if(id===7){mission=initialMission()}if(id===8){mission={...mission,floor:3,roomOpen:true,carried:'battery',step:'deliver'};setState('deliver')}if(id===9){localStorage.removeItem('grand-disaster-3d-v1');location.reload()}if(id===10){setState('answer-phone');dialogue=true;el('dialogue').hidden=false}save();updateHud()};}
updateHud();requestAnimationFrame(frame);
window.__HOTEL_TEST__=debugEnabled?{get mission(){return mission},get player(){return player},isBlocked:(x,z,floor=mission.floor)=>collides(x,z,world.colliders[floor]),setYaw:(yaw)=>{aim.yaw=yaw;player.yaw=yaw},interact:(id)=>interact(world.objects.find(o=>o.id===id)),setPos:(x,z,floor=mission.floor)=>{player.x=x;player.z=z;player.y=floor?9:0;mission.floor=floor;world.lift.position.y=player.y;save();updateHud()}}:undefined;
