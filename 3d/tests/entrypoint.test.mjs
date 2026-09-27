import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('public entrypoint opens the real 3D game and keeps classic playable', async () => {
  const root = await read('../../index.html');
  assert.match(root, /src="3d\/main\.js"/);
  assert.match(root, /id="world"/);
  const classic = await read('../../classic/index.html');
  assert.match(classic, /src="\.\.\/app\.js"/);
});
