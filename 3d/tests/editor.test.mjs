import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { CATALOG, createCatalogObject, layoutCollider, serializeObject } from '../editor/catalog.js';
import { PRESETS } from '../editor/presets.js';

test('no-Blender catalog builds and serializes every reusable object', () => {
  assert.ok(Object.keys(CATALOG).length >= 15);
  for (const type of Object.keys(CATALOG)) {
    const root = createCatalogObject(type, { id: `test-${type}`, type, floor: 2, position: [1, 4.5, -2], rotationY: 90, scale: [1,1,1] });
    assert.ok(root.children.length > 0, `${type} needs visible geometry`);
    assert.deepEqual(serializeObject(root), { id: `test-${type}`, type, floor: 2, position: [1,4.5,-2], rotationY: 90, scale: [1,1,1] });
  }
});

test('solid editor objects generate simple game collision', () => {
  const collider = layoutCollider({ id: 'wall-1', type: 'wall', floor: 1, position: [2,0,3], rotationY: 90, scale: [1,1,1] });
  assert.ok(collider.minX < 2 && collider.maxX > 2);
  assert.ok(collider.minZ < 3 && collider.maxZ > 3);
  const mirrored = layoutCollider({ id: 'wall-mirror', type: 'wall', floor: 1, position: [0,0,0], rotationY: 0, scale: [-1,1,1] });
  assert.ok(mirrored.minX < mirrored.maxX, 'mirrored solid objects still need valid collision bounds');
  assert.equal(layoutCollider({ id: 'floor-1', type: 'floor', floor: 1, position: [0,0,0], rotationY: 0, scale: [1,1,1] }), null);
});

test('editor ships multiple editable room presets and an empty safe runtime layout', async () => {
  assert.deepEqual(Object.keys(PRESETS), ['standardA','standardB','vip','lobby','hallway','showcase']);
  for (const preset of Object.values(PRESETS)) assert.ok(preset.objects.length >= 8);
  for (const [name, preset] of Object.entries(PRESETS)) {
    for (const [type] of preset.objects) assert.ok(CATALOG[type], `${name} references missing ${type}`);
  }
  assert.ok(PRESETS.lobby.objects.some(([type]) => type === 'reception'), 'lobby starter must contain the reception desk it promises');
  const layout = JSON.parse(await readFile(new URL('../data/custom-layout.json', import.meta.url), 'utf8'));
  assert.deepEqual(layout, { version: 1, name: 'Custom Hotel Additions', objects: [] });
});

test('visual editor exposes floor, transform, preset, save, import, and export controls', async () => {
  const html = await readFile(new URL('../editor.html', import.meta.url), 'utf8');
  for (const id of ['project-state','floors','preset-x','preset-z','preset-view-center','palette','palette-search','asset-categories','presets','object-list','outliner-search','object-x','object-z','object-y','object-r','object-sx','object-sy','object-sz','duplicate','delete','undo','redo','zoom-in','zoom-out','reset-view','camera-speed','transform-space','show-collisions','scene-stats','history-list','version-picker','action-log','play-test','quick-save','quick-test','shortcut-help','shortcut-dialog','toolbar-help','save-browser','load-browser','restore-auto','export-json','import-json','import-model']) {
    assert.match(html, new RegExp(`id=["']${id}["']`));
  }
});

test('visual editor provides keyboard, mouse zoom, rotate, pan, and reset camera controls', async () => {
  const source = await readFile(new URL('../editor.js', import.meta.url), 'utf8');
  for (const control of ['KeyW','KeyA','KeyS','KeyD','wheel','pointermove','reset-view']) {
    assert.match(source, new RegExp(control));
  }
});

test('professional editor includes history, versioning, diagnostics, GLB inspection, materials, and play-test mode', async () => {
  const source = await readFile(new URL('../editor.js', import.meta.url), 'utf8');
  for (const feature of ['GLTFLoader','pushHistory','restoreHistory','saveVersion','sceneMetrics','refreshCollisionPreview','togglePlayTest','duplicateFloor','numberSelectedDoors','updateMaterial','updateLight','snapOpeningToWall','application/x-hotel-asset','transformTool']) {
    assert.match(source, new RegExp(feature));
  }
  assert.equal(CATALOG.pointLight.category, 'Lights');
  assert.equal(CATALOG.guestMarker.category, 'Characters');
  assert.ok(PRESETS.hallway.objects.length >= 8);
});

test('hotel prop batch provides efficient game-ready models across useful categories', () => {
  const additions = ['suitcase','wardrobe','minibar','roomService','housekeeping','velvetRope','roomPlaque','securityCamera','weatherMachine','portalMirror','chandelier','wallSconce'];
  for (const type of additions) {
    assert.ok(CATALOG[type], `${type} must be available in the editor catalog`);
    const root = createCatalogObject(type, { id:`batch-${type}`, type, floor:1, position:[0, CATALOG[type].offsetY || 0, 0], rotationY:0, scale:[1,1,1] });
    let triangles = 0;
    root.traverse((node) => { if (node.isMesh) triangles += node.geometry.index ? node.geometry.index.count / 3 : node.geometry.attributes.position.count / 3; });
    assert.ok(triangles > 0 && triangles < 5000, `${type} should be visible and browser-efficient`);
  }
  assert.equal(PRESETS.showcase.objects.length, 14);
});
