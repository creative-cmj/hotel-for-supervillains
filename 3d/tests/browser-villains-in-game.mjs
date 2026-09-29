import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
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
for(const [name,x,z,floor,file] of [['landlord',-11.1,-15.3,0,'preview-villain-in-game-lobby.png'],['uninvited',0,-3.4,2,'preview-villain-in-game-floor2.png'],['agent',0,9.5,3,'preview-villain-in-game-floor3.png']]){
  await evaluate(`window.__HOTEL_TEST__.setPos(${x},${z},${floor});window.__HOTEL_TEST__.setYaw(0)`);await delay(500);
  const shot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
  await writeFile(new URL(`../${file}`,import.meta.url),Buffer.from(shot.data,'base64'));
}
socket.close();console.log('In-game villain QA: PASS — 30 villains loaded and photographed on all three floors.');
