import assert from 'node:assert/strict';
const targets=await(await fetch('http://127.0.0.1:9232/json')).json();
const tab=targets.find(t=>t.type==='page'&&t.url.includes('127.0.0.1:4181/3d/'));
assert.ok(tab,'Local game page required');
const ws=new WebSocket(tab.webSocketDebuggerUrl);
await new Promise(resolve=>ws.addEventListener('open',resolve,{once:true}));
let id=1;const pending=new Map();
ws.addEventListener('message',({data})=>{const m=JSON.parse(data),p=pending.get(m.id);if(p){pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result)}});
const call=(method,params={})=>new Promise((resolve,reject)=>{const key=id++;pending.set(key,{resolve,reject});ws.send(JSON.stringify({id:key,method,params}))});
const js=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description);return r.result.value};
const load=async()=>{for(let i=0;i<80;i++){if(await js('Boolean(window.__HOTEL_ASSETS_READY__)'))return await js('window.__HOTEL_ASSETS_READY__.then(()=>true)');await new Promise(r=>setTimeout(r,250))}throw Error('Missing game module after navigation')};
try{
  await call('Runtime.enable');
  await js("localStorage.setItem('grand-disaster-3d-v1',JSON.stringify({step:'complete',floor:3,mapVersion:'previous-map'}));localStorage.setItem('grand-disaster-3d-player-v1',JSON.stringify({x:18,z:9,floor:3,mapVersion:'previous-map'}))");
  await call('Page.navigate',{url:'http://127.0.0.1:4181/3d/game.html?debug=1&reset='+Date.now()});
  assert.ok(await load());
  assert.equal(await js('window.__HOTEL_TEST__.mission.step'),'phone');
  assert.equal(await js('window.__HOTEL_TEST__.mission.floor'),0);
  assert.equal(await js('window.__HOTEL_TEST__.player.y'),0);
  assert.ok(Math.abs(await js('window.__HOTEL_TEST__.player.z')+17.3)<.01);
  await js('window.__HOTEL_TEST__.setPos(0,-14,0)');
  assert.equal(await js("Boolean(localStorage.getItem('grand-disaster-3d-v1')&&localStorage.getItem('grand-disaster-3d-player-v1'))"),true);
  await js("document.querySelector('#restart').click()");
  await load();
  assert.equal(await js("localStorage.getItem('grand-disaster-3d-v1')"),null);
  assert.equal(await js("localStorage.getItem('grand-disaster-3d-player-v1')"),null);
  assert.equal(await js('window.__HOTEL_TEST__.player.y'),0);
  console.log('PASS — invalid map-version save resets to lobby feet y=0; restart clears both keys.');
}finally{ws.close()}
