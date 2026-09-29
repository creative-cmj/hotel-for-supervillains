import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';

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
const exceptions = [];
socket.addEventListener('message', ({ data }) => {
  const message = JSON.parse(data);
  if (message.method === 'Runtime.exceptionThrown') exceptions.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
  if (!pending.has(message.id)) return;
  const { resolve, reject } = pending.get(message.id);
  pending.delete(message.id);
  message.error ? reject(Error(message.error.message)) : resolve(message.result);
});
const call = (method, params = {}) => new Promise((resolve, reject) => {
  const key = id++;
  pending.set(key, { resolve, reject });
  socket.send(JSON.stringify({ id: key, method, params }));
});
const evaluate = async (expression) => {
  const result = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw Error(result.exceptionDetails.exception?.description || JSON.stringify(result.exceptionDetails));
  return result.result.value;
};
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const key = async (code, keyName) => {
  await call('Input.dispatchKeyEvent', { type: 'keyDown', code, key: keyName });
  await delay(70);
  await call('Input.dispatchKeyEvent', { type: 'keyUp', code, key: keyName });
  await delay(70);
};
const setNear = async (objectId, dx, dz, yaw, floor) => {
  const targetPosition = JSON.parse(await evaluate(`JSON.stringify(window.__HOTEL_TEST__.interactions['${objectId}'])`));
  assert.ok(targetPosition, `Missing interaction ${objectId}`);
  await evaluate(`window.__HOTEL_TEST__.setPos(${targetPosition.x + dx},${targetPosition.z + dz},${floor ?? 'window.__HOTEL_TEST__.mission.floor'});window.__HOTEL_TEST__.setYaw(${yaw})`);
  await delay(150);
};
const screenshot = async (name) => {
  const image = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  await writeFile(new URL(`../${name}`, import.meta.url), Buffer.from(image.data, 'base64'));
};

await call('Runtime.enable');
await call('Page.navigate', { url: 'http://127.0.0.1:4180/3d/game.html?debug=1&qa=polished' });
await delay(900);
await evaluate("localStorage.removeItem('grand-disaster-3d-v1');localStorage.removeItem('grand-disaster-3d-player-v1')");
await call('Page.reload', { ignoreCache: true });
await delay(900);
exceptions.length = 0;
for (let i = 0; i < 50 && !await evaluate('Boolean(window.__HOTEL_TEST__)'); i++) await delay(250);
assert.ok(await evaluate('Boolean(window.__HOTEL_TEST__)'), '3D game failed to boot');
for (let i = 0; i < 50 && await evaluate("document.querySelector('#start').disabled"); i++) await delay(250);
assert.equal(await evaluate('window.__HOTEL_TEST__.roomCount'), 27);
assert.equal(await evaluate('window.__HOTEL_TEST__.populationCount'), 36);
assert.equal(await evaluate('window.__HOTEL_TEST__.villainCount'), 30);
assert.equal(await evaluate('window.__HOTEL_TEST__.cameraMode'), 'first-person');
assert.equal(await evaluate("document.querySelector('#loading-status').textContent"), '27 guest rooms · 3 floors · Hotel ready');
await evaluate("document.querySelector('#start').click()");
await delay(300);
await screenshot('preview-lobby-polished.png');

// Movement is driven by real held keyboard input, then collision is checked at the outer wall.
await evaluate('window.__HOTEL_TEST__.setYaw(0)');
const start = JSON.parse(await evaluate('JSON.stringify(window.__HOTEL_TEST__.player)'));
await call('Input.dispatchKeyEvent', { type: 'keyDown', code: 'KeyW', key: 'w' });
await delay(400);
await call('Input.dispatchKeyEvent', { type: 'keyUp', code: 'KeyW', key: 'w' });
await delay(120);
const moved = JSON.parse(await evaluate('JSON.stringify(window.__HOTEL_TEST__.player)'));
assert.ok(moved.z < start.z - .25, 'Held W must move the manager through the 3D hotel');
assert.equal(await evaluate('window.__HOTEL_TEST__.isBlocked(20.2,-17,0)'), true);
await evaluate('window.__HOTEL_TEST__.setPos(8.8,-18,0);window.__HOTEL_TEST__.setYaw(Math.PI/2)');
await delay(250);
await screenshot('preview-public-wing-polished.png');
await evaluate('window.__HOTEL_TEST__.setPos(-10.5,-17.2,0);window.__HOTEL_TEST__.setYaw(-Math.PI/2)');
await delay(250);
await screenshot('preview-lounge-polished.png');

// First Shift: every mission action uses the visible prompt and real E key.
await setNear('phone', 0, 1.0, 0, 0);
await key('KeyE', 'e');
assert.equal(await evaluate('window.__HOTEL_TEST__.mission.step'), 'battery');
assert.equal(await evaluate("document.querySelector('#dialogue').hidden"), false);
await evaluate("document.querySelector('#close-dialogue').click()");
await setNear('battery', 0, 1.0, 0, 0);
await key('KeyE', 'e');
assert.equal(await evaluate('window.__HOTEL_TEST__.mission.carried'), 'battery');
await screenshot('preview-storage-polished.png');

await setNear('lift0', 0, 1.0, 0, 0);
await key('KeyE', 'e');
assert.equal(await evaluate("document.querySelector('#elevator-panel').hidden"), false);
assert.equal(await evaluate(`document.querySelector('[data-floor="0"]').disabled`), true);
await screenshot('preview-elevator-panel-polished.png');
await evaluate(`document.querySelector('[data-floor="3"]').click()`);
await delay(2650);
assert.equal(await evaluate('window.__HOTEL_TEST__.mission.floor'), 3);
assert.equal(await evaluate('window.__HOTEL_TEST__.mission.step'), 'deliver');
await screenshot('preview-floor3-polished.png');

await evaluate('window.__HOTEL_TEST__.setPos(.45,-4,3);window.__HOTEL_TEST__.setYaw(Math.PI/2)');
await delay(120);
assert.equal(await evaluate('window.__HOTEL_TEST__.isBlocked(1.9,-4,3)'), true);
await key('KeyE', 'e');
await delay(500);
assert.equal(await evaluate('window.__HOTEL_TEST__.mission.roomOpen'), true);
assert.equal(await evaluate('window.__HOTEL_TEST__.isBlocked(1.9,-4,3)'), false);
await setNear('drizzle', -1.65, 0, Math.PI / 2, 3);
await key('KeyE', 'e');
assert.equal(await evaluate('window.__HOTEL_TEST__.mission.step'), 'computer');
assert.equal(await evaluate('window.__HOTEL_TEST__.mission.cash'), 5150);
await screenshot('preview-room307-polished.png');

await setNear('lift3', 0, 1.0, 0, 3);
await key('KeyE', 'e');
await evaluate(`document.querySelector('[data-floor="0"]').click()`);
await delay(2650);
assert.equal(await evaluate('window.__HOTEL_TEST__.mission.floor'), 0);
await setNear('computer', 0, 1.0, 0, 0);
await key('KeyE', 'e');
assert.equal(await evaluate("document.querySelector('#computer').hidden"), false);
await evaluate("document.querySelector('[data-tab=guests]').click()");
assert.match(await evaluate("document.querySelector('#os-view').textContent"), /VOLTESSA/);
await evaluate("document.querySelector('[data-tab=map]').click()");
const mapText = await evaluate("document.querySelector('#os-view').textContent");
assert.match(mapText, /ROOMS 101–109/);
assert.match(mapText, /ROOMS 201–209/);
assert.match(mapText, /ROOMS 301–309/);
await screenshot('preview-computer-polished.png');
await key('Escape', 'Escape');
assert.equal(await evaluate('window.__HOTEL_TEST__.mission.step'), 'complete');

// Repeatable work: phone -> storage pickup -> Floor 2 -> open assigned room -> delivery.
await setNear('phone', 0, 1.0, 0, 0);
await key('KeyE', 'e');
assert.equal(await evaluate('window.__HOTEL_TEST__.mission.request.room'), 205);
await evaluate("document.querySelector('#close-dialogue').click()");
await setNear('request-item', 0, 1.0, 0, 0);
await key('KeyE', 'e');
assert.equal(await evaluate('window.__HOTEL_TEST__.mission.carried'), 'service-parcel');
await setNear('lift0', 0, 1.0, 0, 0);
await key('KeyE', 'e');
await evaluate(`document.querySelector('[data-floor="2"]').click()`);
await delay(2650);
assert.equal(await evaluate('window.__HOTEL_TEST__.mission.floor'), 2);
await screenshot('preview-floor2-polished.png');
await evaluate('window.__HOTEL_TEST__.setPos(.45,0,2);window.__HOTEL_TEST__.setYaw(Math.PI/2)');
await delay(120);
await key('KeyE', 'e');
await delay(500);
await evaluate('window.__HOTEL_TEST__.setPos(2.5,0,2);window.__HOTEL_TEST__.setYaw(Math.PI/2)');
await delay(120);
await screenshot('preview-standard-room-polished.png');
await key('KeyE', 'e');
assert.equal(await evaluate('window.__HOTEL_TEST__.mission.request'), null);
assert.equal(await evaluate('window.__HOTEL_TEST__.mission.cash'), 5330);

// Physically cross every retained guest-room doorway with held movement input.
const rooms = [101,102,103,104,105,106,107,108,109,201,202,203,204,205,206,207,208,209,301,302,303,304,305,306,307,308,309];
for (const room of rooms) {
  const floor = room < 200 ? 0 : room < 300 ? 2 : 3;
  const side = room % 2 ? 1 : -1;
  const door = JSON.parse(await evaluate(`JSON.stringify(window.__HOTEL_TEST__.interactions['room-${room}'])`));
  await evaluate(`window.__HOTEL_TEST__.setPos(${side * .45},${door.z},${floor});window.__HOTEL_TEST__.setYaw(${side > 0 ? 'Math.PI/2' : '-Math.PI/2'})`);
  await delay(80);
  const state = await evaluate(`window.__HOTEL_TEST__.doorStates['${room}']`);
  if (!['open','opening'].includes(state)) { await key('KeyE', 'e'); await delay(450); }
  await call('Input.dispatchKeyEvent', { type: 'keyDown', code: 'KeyW', key: 'w' });
  await delay(650);
  await call('Input.dispatchKeyEvent', { type: 'keyUp', code: 'KeyW', key: 'w' });
  await delay(80);
  const enteredX = await evaluate('window.__HOTEL_TEST__.player.x');
  assert.ok(side > 0 ? enteredX > 2.2 : enteredX < -2.2, `Could not walk through Room ${room} doorway; x=${enteredX}`);
}
const doorStates = JSON.parse(await evaluate('JSON.stringify(window.__HOTEL_TEST__.doorStates)'));
assert.equal(Object.keys(doorStates).length, 27);
assert.ok(Object.values(doorStates).every((state) => ['opening','closing','open','closed'].includes(state)));

await key('Escape', 'Escape');
assert.equal(await evaluate("document.querySelector('#pause').hidden"), false);
await key('Escape', 'Escape');
assert.equal(await evaluate("document.querySelector('#pause').hidden"), true);
await call('Page.reload', { ignoreCache: true });
await delay(1100);
assert.equal(await evaluate('window.__HOTEL_TEST__.mission.step'), 'complete');
assert.deepEqual(exceptions, [], 'Unexpected browser JavaScript exception');

await call('Page.navigate', { url: 'http://127.0.0.1:4180/' });
await delay(1100);
assert.equal(await evaluate("document.querySelector('#world').width>100"), true);
assert.equal(await evaluate('window.__HOTEL_TEST__===undefined'), true);
await call('Page.navigate', { url: 'http://127.0.0.1:4180/classic/' });
await delay(500);
await evaluate("localStorage.removeItem('hotel-for-supervillains-v1')");
await call('Page.reload', { ignoreCache: true });
await delay(500);
assert.match(await evaluate('document.body.innerText'), /Keep the villains cozy/);
await evaluate("document.querySelector('[data-action=start]').click()");
assert.match(await evaluate('document.body.innerText'), /SHIFT\s+1\s*\/\s*5/);
socket.close();
console.log('Browser QA: PASS — movement, collision, phone, carry/drop state, 3-floor lift panel, Room 307, terminal map, repeatable Room 205 request, 27 doors, save/reload, pause, root and Classic.');
