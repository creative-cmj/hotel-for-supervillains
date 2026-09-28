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

test('game loads the authoritative complete hotel and foot-level character assets', async () => {
  const main = await read('../main.js');
  const assets = await read('../world/assets.js');
  assert.match(main, /loadWorldAssets\(world\)/);
  for (const file of ['grand_disaster_complete_asset_hotel.glb', 'grand_disaster_manager.glb', 'doctor_drizzle_final.glb']) {
    assert.match(assets, new RegExp(`assets/${file.replace('.', '\\.')}`));
    assert.ok((await stat(new URL(`../assets/${file}`, import.meta.url))).size > 1000, `${file} must be a real local GLB`);
  }
  assert.match(assets, /ROOM_307_BATTERY_PLACEMENT/);
  assert.match(assets, /ROOM_307_WEATHER_MACHINE_VISUAL/);
});

test('published GLB requests are cache-busted and retry once', async () => {
  const assets = await readFile(new URL('../world/assets.js', import.meta.url), 'utf8');
  assert.match(assets, /ASSET_VERSION='complete-hotel-3'/);
  assert.match(assets, /attempt<2/);
  assert.match(assets, /retry=\$\{Date\.now\(\)\}/);
});
