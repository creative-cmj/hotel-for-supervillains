import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
const base=process.env.CDP_ENDPOINT??'http://127.0.0.1:9232';
const host=process.env.HOTEL_URL??'http://127.0.0.1:4181';
const targets=await(await fetch(base+'/json')).json();
const target=targets.find(t=>t.type==='page'&&t.url.startsWith(host+'/3d/'));
assert.ok(target,'Launch Chrome with this hotel test page');
const socket=new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true})});
let seq=1;const pending=new Map(),exceptions=[];
socket.addEventListener('message',({data})=>{const message=JSON.parse(data);if(message.method==='Runtime.exceptionThrown')exceptions.push(message.params.exceptionDetails.exception?.description);const entry=pending.get(message.id);if(entry){pending.delete(message.id);message.error?entry.reject(Error(message.error.message)):entry.resolve(message.result)}});
const call=(method,params={})=>new Promise((resolve,reject)=>{const id=seq++;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}))});
const evalJS=async expression=>{const result=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(result.exceptionDetails)throw Error(result.exceptionDetails.exception?.description||JSON.stringify(result.exceptionDetails));return result.result.value};
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const key=async(code,keyName)=>{await call('Input.dispatchKeyEvent',{type:'keyDown',code,key:keyName});await delay(60);await call('Input.dispatchKeyEvent',{type:'keyUp',code,key:keyName})};
const where=()=>evalJS('JSON.stringify({x:window.__HOTEL_TEST__.player.x,z:window.__HOTEL_TEST__.player.z,y:window.__HOTEL_TEST__.player.y,step:window.__HOTEL_TEST__.mission.step,floor:window.__HOTEL_TEST__.mission.floor})');
const walk=async(axis,goal,yaw,max=100)=>{await evalJS(`window.__HOTEL_TEST__.setYaw(${yaw})`);const start=await evalJS(`window.__HOTEL_TEST__.player.${axis}`);await call('Input.dispatchKeyEvent',{type:'keyDown',code:'KeyW',key:'w'});for(let i=0;i<max;i++){const value=await evalJS(`window.__HOTEL_TEST__.player.${axis}`);if(start<goal?value>=goal:value<=goal)break;await delay(120)}await call('Input.dispatchKeyEvent',{type:'keyUp',code:'KeyW',key:'w'});const value=await evalJS(`window.__HOTEL_TEST__.player.${axis}`);console.log('walk',axis,goal,await where());assert.ok(start<goal?value>=goal:value<=goal,`Blocked moving ${axis}: ${await where()}`)};
const shot=async name=>{const image=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile(new URL(`../preview-complete-${name}.png`,import.meta.url),Buffer.from(image.data,'base64'))};
try{
  await call('Runtime.enable');
  await evalJS("localStorage.removeItem('grand-disaster-3d-v1');localStorage.removeItem('grand-disaster-3d-player-v1')");
  for(let attempt=0;attempt<3;attempt++){
    await call('Page.navigate',{url:host+`/3d/game.html?debug=1&test=${Date.now()}-${attempt}`});
    for(let i=0;i<60;i++){if(await evalJS('Boolean(window.__HOTEL_ASSETS_READY__)'))break;await delay(250)}
    if(await evalJS('Boolean(window.__HOTEL_ASSETS_READY__)'))break;
    console.warn('Retrying hotel navigation after missing game module',exceptions);
  }
  assert.ok(await evalJS('Boolean(window.__HOTEL_ASSETS_READY__)'),'Game booted');
  const info=await evalJS("window.__HOTEL_ASSETS_READY__.then(v=>({ready:!!v,name:v?.hotel?.name,feet:window.__HOTEL_TEST__.player.y,objects:window.__HOTEL_TEST__.objectCount})).catch(e=>({error:e.message}))");
  console.log('assets',info,'exceptions',exceptions);
  assert.equal(info?.name,'AUTHORITATIVE_COMPLETE_HOTEL');
  assert.equal(info.feet,0);
  await evalJS("document.querySelector('#start').click()");await delay(700);await shot('lobby');
  assert.equal(await evalJS('window.__HOTEL_TEST__.mission.step'),'phone');
  await walk('z',-15.3,Math.PI);await walk('x',3.35,Math.PI/2);await walk('z',-15.7,0);await key('KeyE','e');
  assert.equal(await evalJS('window.__HOTEL_TEST__.mission.step'),'battery');
  await evalJS("document.querySelector('#close-dialogue').click()");
  await walk('x',0,-Math.PI/2);await walk('z',-17.8,0);await walk('x',-10.9,-Math.PI/2);await walk('z',-13.55,Math.PI);await key('KeyE','e');
  assert.equal(await evalJS('window.__HOTEL_TEST__.mission.step'),'elevator');
  await walk('z',-17.1,0);await walk('x',0,Math.PI/2);await walk('z',-10.2,Math.PI);await walk('x',-5,-Math.PI/2);
  await evalJS('window.__HOTEL_TEST__.setYaw(Math.PI)');await key('KeyE','e');await delay(3000);
  assert.equal(await evalJS('window.__HOTEL_TEST__.mission.floor'),3);
  assert.equal(await evalJS('window.__HOTEL_TEST__.player.y'),9);
  await shot('floor3');
  await walk('x',0,Math.PI/2);await walk('z',-4.6,Math.PI);await evalJS('window.__HOTEL_TEST__.setYaw(Math.PI/2)');await key('KeyE','e');
  assert.equal(await evalJS('window.__HOTEL_TEST__.mission.roomOpen'),true);
  await walk('x',4.65,Math.PI/2);await shot('room307');await evalJS('window.__HOTEL_TEST__.setYaw(-Math.PI/2)');await key('KeyE','e');
  assert.equal(await evalJS('window.__HOTEL_TEST__.mission.step'),'computer');
  await walk('x',0,-Math.PI/2);await walk('z',-9.1,0);await walk('x',-5,-Math.PI/2);await evalJS('window.__HOTEL_TEST__.setYaw(Math.PI)');await key('KeyE','e');await delay(3000);
  assert.equal(await evalJS('window.__HOTEL_TEST__.mission.floor'),0);
  await walk('x',0,Math.PI/2);await walk('z',-15.2,0);await walk('x',2.2,Math.PI/2);await evalJS('window.__HOTEL_TEST__.setYaw(0)');await key('KeyE','e');
  assert.equal(await evalJS("document.querySelector('#computer').hidden"),false);
  await key('Escape','Escape');
  assert.equal(await evalJS('window.__HOTEL_TEST__.mission.step'),'complete');
  // The otherwise optional middle floor must also be reachable by walking and elevator travel.
  await walk('x',0,-Math.PI/2);await walk('z',-9.1,Math.PI);await walk('x',-5,-Math.PI/2);
  await evalJS('window.__HOTEL_TEST__.setYaw(Math.PI)');await key('KeyE','e');await delay(3000);
  assert.equal(await evalJS('window.__HOTEL_TEST__.mission.floor'),2);
  assert.equal(await evalJS('window.__HOTEL_TEST__.player.y'),4.5);
  await shot('floor2');
  await walk('x',0,Math.PI/2);await walk('z',7.2,Math.PI);await walk('x',3.5,Math.PI/2);
  assert.ok(await evalJS('window.__HOTEL_TEST__.player.x')>3,'Walk through Room 201 doorway');
  await walk('x',0,-Math.PI/2);await walk('z',-9.1,0);await walk('x',-5,-Math.PI/2);
  await evalJS('window.__HOTEL_TEST__.setYaw(Math.PI)');await key('KeyE','e');await delay(3000);
  assert.equal(await evalJS('window.__HOTEL_TEST__.mission.floor'),3);
  assert.equal(await evalJS('window.__HOTEL_TEST__.player.y'),9);
  assert.deepEqual(exceptions,[]);
  console.log('PASS — walked phone → storage → lift → Room 307 → Drizzle → computer; lift middle stop y=4.5 and Room 201 doorway.');
}finally{socket.close()}
