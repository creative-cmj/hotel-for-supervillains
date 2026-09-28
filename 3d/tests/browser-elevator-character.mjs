import assert from 'node:assert/strict';

const endpoint=process.env.CDP_ENDPOINT??'http://127.0.0.1:9232';
const host=process.env.HOTEL_URL??'http://127.0.0.1:4180';
const page=process.env.HOTEL_PAGE??'/3d/game.html';
const targets=await(await fetch(`${endpoint}/json`)).json();
const target=targets.find(item=>item.type==='page');
assert.ok(target,'Launch Chrome with remote debugging before running this test');

const socket=new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true})});
let sequence=0;
const pending=new Map();
socket.addEventListener('message',({data})=>{const message=JSON.parse(data);const entry=pending.get(message.id);if(!entry)return;pending.delete(message.id);message.error?entry.reject(Error(message.error.message)):entry.resolve(message.result)});
const call=(method,params={})=>new Promise((resolve,reject)=>{const id=++sequence;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}))});
const evaluate=async expression=>{const response=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(response.exceptionDetails)throw Error(response.exceptionDetails.exception?.description);return response.result.value};
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const pressE=async()=>{await call('Input.dispatchKeyEvent',{type:'keyDown',code:'KeyE',key:'e'});await wait(80);await call('Input.dispatchKeyEvent',{type:'keyUp',code:'KeyE',key:'e'})};
const rideFrom=async(floor,expectedFloor,expectedY)=>{
  await evaluate(`window.__HOTEL_TEST__.setPos(-5,-8.6,${floor});window.__HOTEL_TEST__.setYaw(0)`);
  await pressE();
  assert.equal(await evaluate('window.__HOTEL_TEST__.riding'),true,`Elevator should start on floor ${floor}`);
  await wait(2800);
  assert.equal(await evaluate('window.__HOTEL_TEST__.mission.floor'),expectedFloor);
  assert.equal(await evaluate('window.__HOTEL_TEST__.player.y'),expectedY);
  assert.equal(await evaluate('window.__HOTEL_TEST__.liftY'),expectedY);
};

try{
  await call('Runtime.enable');
  await call('Page.navigate',{url:`${host}${page}?debug=1&elevator=${Date.now()}`});
  for(let attempt=0;attempt<80&&!await evaluate('Boolean(window.__HOTEL_TEST__&&window.__HOTEL_ASSETS_READY__)');attempt++)await wait(100);
  await evaluate('window.__HOTEL_ASSETS_READY__.then(()=>true)');
  assert.equal(await evaluate('window.__HOTEL_TEST__.hotelName'),'AUTHORITATIVE_COMPLETE_HOTEL');
  assert.ok(await evaluate("Boolean(window.__HOTEL_TEST__.managerName)"),'New manager GLB should be attached');
  await evaluate("document.querySelector('#start').click()");
  for(let attempt=0;attempt<30&&!await evaluate('window.__HOTEL_TEST__.started');attempt++)await wait(100);
  assert.equal(await evaluate('window.__HOTEL_TEST__.started'),true);
  await rideFrom(0,2,4.5);
  await rideFrom(2,3,9);
  await rideFrom(3,0,0);
  console.log('PASS — complete hotel only, new manager attached, elevator stops at y=0, 4.5, and 9.');
}finally{
  socket.close();
}
