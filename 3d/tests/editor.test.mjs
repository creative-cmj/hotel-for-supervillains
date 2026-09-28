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
  assert.equal(layoutCollider({ id: 'floor-1', type: 'floor', floor: 1, position: [0,0,0], rotationY: 0, scale: [1,1,1] }), null);
});

test('editor ships multiple editable room presets and an empty safe runtime layout', async () => {
  assert.deepEqual(Object.keys(PRESETS), ['standardA','standardB','vip','lobby']);
  for (const preset of Object.values(PRESETS)) assert.ok(preset.objects.length >= 8);
  const layout = JSON.parse(await readFile(new URL('../data/custom-layout.json', import.meta.url), 'utf8'));
  assert.deepEqual(layout, { version: 1, name: 'Custom Hotel Additions', objects: [] });
});

test('visual editor exposes floor, transform, preset, save, import, and export controls', async () => {
  const html = await readFile(new URL('../editor.html', import.meta.url), 'utf8');
  for (const id of ['floors','palette','presets','object-x','object-z','object-y','object-r','duplicate','delete','zoom-in','zoom-out','reset-view','save-browser','load-browser','export-json','import-json']) {
    assert.match(html, new RegExp(`id=["']${id}["']`));
  }
});

test('visual editor provides keyboard, mouse zoom, rotate, pan, and reset camera controls', async () => {
  const source = await readFile(new URL('../editor.js', import.meta.url), 'utf8');
  for (const control of ['KeyW','KeyA','KeyS','KeyD','wheel','pointermove','reset-view']) {
    assert.match(source, new RegExp(control));
  }
});
