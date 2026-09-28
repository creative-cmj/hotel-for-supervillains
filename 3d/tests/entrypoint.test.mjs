import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('public entrypoint opens the real 3D game and keeps classic playable', async () => {
  const root = await read('../../index.html');
  assert.match(root, /src="3d\/main\.js\?v=polished-hotel-1"/);
  assert.match(root, /id="world"/);
  const classic = await read('../../classic/index.html');
  assert.match(classic, /src="\.\.\/app\.js"/);
});

test('game loads the authoritative complete hotel and foot-level character assets', async () => {
  const main = await read('../main.js');
  const assets = await read('../world/assets.js');
  assert.match(main, /loadWorldAssets\(world,\s*\(status\)/);
  assert.match(assets, /new URL\(`\.\.\/assets\/\$\{name\}`\s*,\s*import\.meta\.url\)/);
  for (const file of ['grand_disaster_complete_asset_hotel.glb', 'grand_disaster_manager.glb', 'doctor_drizzle_final.glb']) {
    assert.match(assets, new RegExp(`assetUrl\\('${file.replace('.', '\\.')}\\'\\)`));
    assert.ok((await stat(new URL(`../assets/${file}`, import.meta.url))).size > 1000, `${file} must be a real local GLB`);
  }
  assert.match(assets, /ROOM_307_BATTERY_PLACEMENT/);
  assert.match(assets, /ROOM_307_WEATHER_MACHINE_VISUAL/);
});

test('published GLB requests are cache-busted and retry once', async () => {
  const assets = await readFile(new URL('../world/assets.js', import.meta.url), 'utf8');
  assert.match(assets, /ASSET_VERSION\s*=\s*'polished-hotel-1'/);
  assert.match(assets, /attempt\s*=\s*0;\s*attempt\s*<\s*2/);
  assert.match(assets, /retry=\$\{Date\.now\(\)\}/);
});

test('the playable camera is first-person and keeps carried items in view', async () => {
  const main = await read('../main.js');
  assert.match(main, /get cameraMode\(\) \{ return 'first-person'; \}/);
  assert.match(main, /camera\.add\(world\.heldBattery, world\.heldParcel\)/);
  assert.match(main, /camera\.position\.copy\(target\)/);
});
