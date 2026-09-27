import assert from 'node:assert/strict';

const endpoint = process.env.CDP_ENDPOINT ?? 'http://127.0.0.1:9228';
const targets = await (await fetch(`${endpoint}/json`)).json();
const target = targets.find((item) => item.type === 'page' && item.url.includes('127.0.0.1:4179'));
assert.ok(target, 'Expected a Chrome page for the local hotel game');

const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true });
  socket.addEventListener('error', reject, { once: true });
});
let nextId = 1;
const pending = new Map();
socket.addEventListener('message', ({ data }) => {
  const message = JSON.parse(data);
  if (pending.has(message.id)) {
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    message.error ? reject(new Error(message.error.message)) : resolve(message.result);
  }
});
function evaluate(expression) {
  const id = nextId++;
  socket.send(JSON.stringify({ id, method: 'Runtime.evaluate', params: { expression, returnByValue: true, awaitPromise: true } }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

assert.match((await evaluate('document.body.innerText')).result.value, /Welcome to/);
await evaluate("document.querySelector('[data-action=start]').click()");
assert.match((await evaluate('document.body.innerText')).result.value, /SHIFT\s+1\s*\/\s*5/);
await evaluate("document.querySelector('[data-action=fulfill]').click()");
assert.match((await evaluate('document.body.innerText')).result.value, /MANAGER ACTIONS\s*3left this shift/);
await evaluate("for (let i = 0; i < 2; i += 1) document.querySelector('[data-action=fulfill]:not(:disabled)').click()");
assert.match((await evaluate('document.body.innerText')).result.value, /3\/3 situations contained/);
await evaluate("document.querySelector('[data-action=end]').click()");
assert.match((await evaluate('document.body.innerText')).result.value, /SHIFT\s+2\s*\/\s*5/);

socket.close();
console.log('Browser playthrough: PASS — opened hotel, handled requests, and advanced a shift.');
