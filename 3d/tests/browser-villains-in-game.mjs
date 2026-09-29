import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { VILLAIN_ROSTER } from '../characters/villain-roster.js';
const endpoint=process.env.CDP_ENDPOINT??'http://127.0.0.1:9231';
const targets=await(await fetch(`${endpoint}/json`)).json();
const target=targets.find((entry)=>entry.type==='page'&&entry.url.includes('127.0.0.1:4180'));
assert.ok(target,'Chrome must have a local hotel tab');
const socket=new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true});});
let id=1;const pending=new Map();socket.addEventListener('message',({data})=>{const message=JSON.parse(data);if(!pending.has(message.id))return;const entry=pending.get(message.id);pending.delete(message.id);message.error?entry.reject(Error(message.error.message)):entry.resolve(message.result);});
const call=(method,params={})=>new Promise((resolve,reject)=>{const key=id++;pending.set(key,{resolve,reject});socket.send(JSON.stringify({id:key,method,params}));});
const evaluate=async(expression)=>{const result=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(result.exceptionDetails)throw Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text);return result.result.value;};
const delay=(ms)=>new Promise((resolve)=>setTimeout(resolve,ms));
await call('Runtime.enable');await call('Network.enable');await call('Network.setCacheDisabled',{cacheDisabled:true});
await call('Page.navigate',{url:`http://127.0.0.1:4180/3d/game.html?debug=1&villains=${Date.now()}`});
for(let attempt=0;attempt<100&&!await evaluate('Boolean(window.__HOTEL_TEST__)');attempt++)await delay(100);
for(let attempt=0;attempt<100&&await evaluate("document.querySelector('#start').disabled");attempt++)await delay(100);
await evaluate("document.querySelector('#start').click()");await delay(250);
assert.equal(await evaluate('window.__HOTEL_TEST__.villainCount'),30);
for(const villain of VILLAIN_ROSTER)assert.ok(await evaluate(`Boolean(window.__HOTEL_TEST__.interactions['${villain.id==='doctor-drizzle'?'drizzle':`npc-${villain.id}`}'])`),`${villain.name} must have an in-hotel interaction`);
const bounds=JSON.parse(await evaluate('JSON.stringify(window.__HOTEL_TEST__.villainBounds)'));assert.equal(bounds.length,30);
for(const entry of bounds){const floorY=entry.floor===0?0:entry.floor===2?4.5:9;assert.ok(entry.min[1]>=floorY-.02,`${entry.id} must stand on its floor`);assert.ok(entry.max[1]-floorY<2.85,`${entry.id} must clear hotel door height`);assert.ok(entry.max[0]-entry.min[0]<2.5,`${entry.id} must clear hallway width`);}
const qualityGuests=[
  ['mister-monday',-3.05,-4,0,-Math.PI/2,108,'preview-redesign-mister-monday-hotel.png'],
  ['the-landlord',-11.1,-15.3,0,0,null,'preview-redesign-landlord-hotel.png'],
  ['the-auditor',-3.05,8,2,-Math.PI/2,202,'preview-redesign-auditor-hotel.png'],
  ['doctor-oops',3.05,8,3,Math.PI/2,301,'preview-redesign-doctor-oops-hotel.png'],
  ['agent-awkward',0,9.5,3,0,null,'preview-redesign-agent-awkward-hotel.png'],
];
for(const [name,x,z,floor,yaw,room,file] of qualityGuests){
  assert.ok(await evaluate(`Boolean(window.__HOTEL_TEST__.interactions['npc-${name}'])`),`${name} must be present in the hotel`);
  if(room)await evaluate(`window.__HOTEL_TEST__.interact('room-${room}')`);
  await evaluate(`window.__HOTEL_TEST__.setPos(${x},${z},${floor});window.__HOTEL_TEST__.setYaw(${yaw})`);await delay(500);
  const shot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
  await writeFile(new URL(`../${file}`,import.meta.url),Buffer.from(shot.data,'base64'));
}
socket.close();console.log('In-game villain QA: PASS — all 30 villains have interactions, stand on their floor, clear doors/hallways, and five are photographed in rooms/public space.');
