import assert from 'node:assert/strict';

const endpoint = process.env.CDP_ENDPOINT ?? 'http://127.0.0.1:9231';
const targets = await (await fetch(`${endpoint}/json`)).json();
const target = targets.find((entry) => entry.type === 'page' && entry.url.includes('127.0.0.1:4180'));
assert.ok(target, 'Chrome must open the local hotel website');
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true });
  socket.addEventListener('error', reject, { once: true });
});
let id = 1;
const pending = new Map();
socket.addEventListener('message', ({ data }) => {
  const message = JSON.parse(data);
  if (!pending.has(message.id)) return;
  const entry = pending.get(message.id);
  pending.delete(message.id);
  message.error ? entry.reject(Error(message.error.message)) : entry.resolve(message.result);
});
const call = (method, params = {}) => new Promise((resolve, reject) => {
  const key = id++;
  pending.set(key, { resolve, reject });
  socket.send(JSON.stringify({ id: key, method, params }));
});
const evaluate = async (expression) => {
  const result = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result.value;
};
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const measure = () => evaluate(`new Promise(resolve=>{const samples=[];let last=performance.now();const tick=now=>{samples.push(now-last);last=now;if(samples.length<240)requestAnimationFrame(tick);else{const useful=samples.slice(20),sorted=[...useful].sort((a,b)=>a-b),average=useful.reduce((a,b)=>a+b,0)/useful.length;resolve({fps:Number((1000/average).toFixed(1)),averageMs:Number(average.toFixed(2)),p95Ms:Number(sorted[Math.floor(sorted.length*.95)].toFixed(2)),maxMs:Number(Math.max(...useful).toFixed(2))})}};requestAnimationFrame(tick)})`);

await call('Runtime.enable');
await call('Network.enable');
await call('Network.setCacheDisabled', { cacheDisabled: true });
const loadStarted = Date.now();
await call('Page.navigate', { url: 'http://127.0.0.1:4180/3d/game.html?debug=1&performance=1' });
for (let attempt = 0; attempt < 80 && !await evaluate('Boolean(window.__HOTEL_TEST__)'); attempt++) await delay(100);
for (let attempt = 0; attempt < 100 && await evaluate("document.querySelector('#start').disabled"); attempt++) await delay(100);
const loadMs = Date.now() - loadStarted;
await evaluate("document.querySelector('#start').click()");
await delay(300);
const floors = {};
for (const [name, floor] of [['lobby', 0], ['floor2', 2], ['floor3', 3]]) {
  await evaluate(`window.__HOTEL_TEST__.setPos(0,2,${floor})`);
  await delay(500);
  floors[name] = await measure();
}
socket.close();
console.log(JSON.stringify({ loadMs, floors }, null, 2));
