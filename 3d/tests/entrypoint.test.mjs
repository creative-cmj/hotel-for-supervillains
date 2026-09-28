import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('public entrypoint opens the real 3D game and keeps classic playable', async () => {
  const root = await read('../../index.html');
  assert.match(root, /src="3d\/main\.js"/);
  assert.match(root, /id="world"/);
  const classic = await read('../../classic/index.html');
  assert.match(classic, /src="\.\.\/app\.js"/);
});

test('game loads the approved GLB environment and character assets locally', async () => {
  const main = await read('../main.js');
  const assets = await read('../world/assets.js');
  assert.match(main, /loadWorldAssets\(world\)/);
  for (const file of ['reception_desk.glb', 'final_interior_pack.glb', 'manager.glb', 'doctor_drizzle.glb']) {
    assert.match(assets, new RegExp(`assets/${file.replace('.', '\\.')}`));
    assert.ok((await stat(new URL(`../assets/${file}`, import.meta.url))).size > 1000, `${file} must be a real local GLB`);
  }
  assert.match(assets, /ROOM_307_WEATHER_INSTRUMENTS_MODULE/);
  assert.match(assets, /FLOOR3_SECURITY_AND_SUPPORT/);
});
