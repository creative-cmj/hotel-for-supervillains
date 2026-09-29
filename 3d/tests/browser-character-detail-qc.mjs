import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

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
const label=process.env.QC_LABEL??'current';
const requested=(process.env.QC_INDICES??'').split(',').filter(Boolean).map(Number);
const indices=requested.length?requested:Array.from({length:30},(_,index)=>index);
const output=new URL(`../character-qc/${label}/`,import.meta.url);await mkdir(output,{recursive:true});
await call('Runtime.enable');await call('Network.enable');await call('Network.setCacheDisabled',{cacheDisabled:true});
await call('Page.navigate',{url:`http://127.0.0.1:4180/3d/characters.html?detailQa=${Date.now()}`});
for(let attempt=0;attempt<100&&!await evaluate('Boolean(window.__VILLAIN_ROSTER_TEST__)');attempt++)await delay(100);
assert.equal(await evaluate('window.__VILLAIN_ROSTER_TEST__.entries.length'),30);
await evaluate('window.__VILLAIN_ROSTER_TEST__.pauseAnimations(true)');
const views=[['front',0,.25,3.8],['right',Math.PI/2,.25,3.8],['back',Math.PI,.25,3.8],['left',-Math.PI/2,.25,3.8],['above',0,1.05,4.5],['low',0,.06,4.1]];
for(const index of indices){
  await evaluate(`window.__VILLAIN_ROSTER_TEST__.isolate(${index})`);
  const slug=await evaluate(`window.__VILLAIN_ROSTER_TEST__.entries[${index}].data.id`);
  for(const [name,yaw,elevation,distance] of views){
    await evaluate(`window.__VILLAIN_ROSTER_TEST__.setCamera(${yaw},${elevation},${distance})`);await delay(45);
    const shot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
    await writeFile(new URL(`${String(index+1).padStart(2,'0')}-${slug}-${name}.png`,output),Buffer.from(shot.data,'base64'));
  }
  await evaluate(`window.__VILLAIN_ROSTER_TEST__.setSilhouette(true);window.__VILLAIN_ROSTER_TEST__.selectEntry(window.__VILLAIN_ROSTER_TEST__.entries[${index}]);window.__VILLAIN_ROSTER_TEST__.setCamera(0,.25,3.8)`);await delay(45);
  let shot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
  await writeFile(new URL(`${String(index+1).padStart(2,'0')}-${slug}-silhouette.png`,output),Buffer.from(shot.data,'base64'));
  await evaluate(`window.__VILLAIN_ROSTER_TEST__.setSilhouette(false);(()=>{const e=window.__VILLAIN_ROSTER_TEST__.entries[${index}],p=e.group.position;window.__VILLAIN_ROSTER_TEST__.setTarget(p.x,e.report.maxY-.28,p.z);window.__VILLAIN_ROSTER_TEST__.setCamera(0,0,1.35)})()`);await delay(45);
  shot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
  await writeFile(new URL(`${String(index+1).padStart(2,'0')}-${slug}-face.png`,output),Buffer.from(shot.data,'base64'));
  await evaluate(`(()=>{const e=window.__VILLAIN_ROSTER_TEST__.entries[${index}],p=e.group.position;window.__VILLAIN_ROSTER_TEST__.setTarget(p.x,e.report.maxY*.42,p.z);window.__VILLAIN_ROSTER_TEST__.setCamera(0,0,2.1)})()`);await delay(45);
  shot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
  await writeFile(new URL(`${String(index+1).padStart(2,'0')}-${slug}-hands.png`,output),Buffer.from(shot.data,'base64'));
}
socket.close();console.log(`Detailed character QC capture: PASS — ${indices.length} villains × 9 inspection views (${label}).`);
