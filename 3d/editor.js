import * as THREE from './vendor/three.module.js';
import { CATALOG, FLOOR_HEIGHTS, createCatalogObject, serializeObject } from './editor/catalog.js';
import { PRESETS } from './editor/presets.js';

const el = (id) => document.getElementById(id);
const canvas = el('editor-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.25));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.4;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x120d1a);
scene.fog = new THREE.Fog(0x120d1a, 35, 85);
scene.add(new THREE.HemisphereLight(0xdad9ff, 0x281832, 2.7));
const sun = new THREE.DirectionalLight(0xffddb2, 2.4); sun.position.set(10, 22, 9); scene.add(sun);
const camera = new THREE.PerspectiveCamera(52, 1, .1, 120);
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const roots = [];
const selectionBox = new THREE.BoxHelper(undefined, 0x55eaff); selectionBox.visible = false; scene.add(selectionBox);
let selected = null;
let floor = 1;
let viewAngle = Math.PI * .25;
let distance = 20;
let idCounter = 1;
let pointerDown = null;

for (const level of [1, 2, 3]) {
  const grid = new THREE.GridHelper(40, 40, level === 1 ? 0xd39a50 : level === 2 ? 0xe358bd : 0x52d8ee, 0x44304d);
  grid.position.y = FLOOR_HEIGHTS[level] - .02;
  grid.userData.floor = level;
  scene.add(grid);
}

function status(message) { el('status').textContent = message; }
function snap(value) {
  const step = Number(el('snap').value);
  return Math.round(value / step) * step;
}
function activeRoots() { return roots.filter((root) => root.userData.layout.floor === floor); }
function updateFloorVisibility() {
  for (const root of roots) root.visible = root.userData.layout.floor === floor;
  scene.children.filter((child) => child.isGridHelper).forEach((grid) => { grid.visible = grid.userData.floor === floor; });
  if (selected && selected.userData.layout.floor !== floor) select(null);
  document.querySelectorAll('#floors button').forEach((button) => button.classList.toggle('active', Number(button.dataset.floor) === floor));
}
function updateCamera() {
  const y = FLOOR_HEIGHTS[floor];
  camera.position.set(Math.sin(viewAngle) * distance, y + distance * .68, Math.cos(viewAngle) * distance);
  camera.lookAt(0, y, 0);
}
function select(root) {
  selected = root;
  selectionBox.visible = Boolean(root);
  el('nothing-selected').hidden = Boolean(root);
  el('selection-fields').hidden = !root;
  if (!root) return;
  selectionBox.setFromObject(root);
  el('selected-name').textContent = `${CATALOG[root.userData.layout.type].label} · ${root.userData.layout.id}`;
  el('object-x').value = root.position.x.toFixed(2);
  el('object-z').value = root.position.z.toFixed(2);
  el('object-y').value = (root.position.y - FLOOR_HEIGHTS[floor]).toFixed(2);
  el('object-r').value = Math.round(THREE.MathUtils.radToDeg(root.rotation.y));
  el('object-sx').value = root.scale.x.toFixed(2);
  el('object-sz').value = root.scale.z.toFixed(2);
}
function updateSelectionFromFields() {
  if (!selected) return;
  selected.position.set(
    Number(el('object-x').value),
    FLOOR_HEIGHTS[floor] + Number(el('object-y').value),
    Number(el('object-z').value),
  );
  selected.rotation.y = THREE.MathUtils.degToRad(Number(el('object-r').value));
  selected.scale.x = Number(el('object-sx').value);
  selected.scale.z = Number(el('object-sz').value);
  selectionBox.setFromObject(selected);
}
function addObject(type, source = null) {
  const data = source ? { ...source, id: `${type}-${Date.now()}-${idCounter++}` } : {
    id: `${type}-${Date.now()}-${idCounter++}`,
    type,
    floor,
    position: [0, FLOOR_HEIGHTS[floor] + (CATALOG[type].offsetY || 0), 0],
    rotationY: 0,
    scale: [1, 1, 1],
  };
  data.floor = floor;
  if (source) data.position = [snap(source.position[0] + .75), source.position[1], snap(source.position[2] + .75)];
  const root = createCatalogObject(type, data);
  scene.add(root);
  roots.push(root);
  select(root);
  status(`Added ${CATALOG[type].label} to Floor ${floor}`);
}
function addPreset(presetId) {
  const preset = PRESETS[presetId];
  for (const [type, x, z, rotationY, scale = [1,1,1]] of preset.objects) {
    const definition = CATALOG[type];
    addObject(type, { type, floor, position: [x, FLOOR_HEIGHTS[floor] + (definition.offsetY || 0), z], rotationY, scale });
  }
  status(`Added editable ${preset.label} preset to Floor ${floor}`);
}
function deleteSelected() {
  if (!selected) return;
  const index = roots.indexOf(selected);
  if (index >= 0) roots.splice(index, 1);
  scene.remove(selected);
  select(null);
  status('Object removed');
}
function serializeLayout() {
  return { version: 1, name: el('layout-name').value.trim() || 'Custom Hotel Additions', objects: roots.map(serializeObject) };
}
function loadLayout(layout) {
  if (layout.version !== 1 || !Array.isArray(layout.objects)) throw Error('This is not a Grand Disaster layout file.');
  for (const root of roots.splice(0)) scene.remove(root);
  el('layout-name').value = layout.name || 'Custom Hotel Additions';
  for (const data of layout.objects) {
    const root = createCatalogObject(data.type, data);
    scene.add(root); roots.push(root);
  }
  select(null);
  updateFloorVisibility();
  status(`Loaded ${roots.length} objects`);
}
function downloadLayout() {
  const blob = new Blob([JSON.stringify(serializeLayout(), null, 2) + '\n'], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = 'custom-layout.json'; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  status('Downloaded custom-layout.json');
}

const categories = [...new Set(Object.values(CATALOG).map((entry) => entry.category))];
for (const category of categories) {
  const heading = document.createElement('h3'); heading.textContent = category; el('palette').append(heading);
  for (const [type, definition] of Object.entries(CATALOG).filter(([, entry]) => entry.category === category)) {
    const button = document.createElement('button');
    button.textContent = `＋ ${definition.label}`;
    button.onclick = () => addObject(type);
    el('palette').append(button);
  }
}
for (const [presetId, preset] of Object.entries(PRESETS)) {
  const button = document.createElement('button');
  button.textContent = preset.label;
  button.onclick = () => addPreset(presetId);
  el('presets').append(button);
}
document.querySelectorAll('#floors button').forEach((button) => {
  button.onclick = () => { floor = Number(button.dataset.floor); updateFloorVisibility(); updateCamera(); status(`Editing Floor ${floor}`); };
});
for (const id of ['object-x','object-z','object-y','object-r','object-sx','object-sz']) el(id).addEventListener('input', updateSelectionFromFields);
el('duplicate').onclick = () => { if (selected) addObject(selected.userData.layout.type, serializeObject(selected)); };
el('delete').onclick = deleteSelected;
el('view-left').onclick = () => { viewAngle -= Math.PI / 4; updateCamera(); };
el('view-right').onclick = () => { viewAngle += Math.PI / 4; updateCamera(); };
el('zoom-in').onclick = () => { distance = Math.max(9, distance - 3); updateCamera(); };
el('zoom-out').onclick = () => { distance = Math.min(55, distance + 3); updateCamera(); };
el('save-browser').onclick = () => { localStorage.setItem('grand-disaster-layout-draft', JSON.stringify(serializeLayout())); status('Draft saved in this browser'); };
el('load-browser').onclick = () => {
  const saved = localStorage.getItem('grand-disaster-layout-draft');
  if (!saved) return status('No browser draft found');
  try { loadLayout(JSON.parse(saved)); } catch (error) { status(error.message); }
};
el('export-json').onclick = downloadLayout;
el('import-json').onchange = async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try { loadLayout(JSON.parse(await file.text())); } catch (error) { status(error.message); }
  event.target.value = '';
};

canvas.addEventListener('pointerdown', (event) => { pointerDown = { x: event.clientX, y: event.clientY }; });
canvas.addEventListener('pointerup', (event) => {
  if (!pointerDown || Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y) > 5) return;
  const rect = canvas.getBoundingClientRect();
  pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObjects(activeRoots(), true)[0];
  select(hit?.object.userData.editorRoot || null);
});
canvas.addEventListener('wheel', (event) => {
  event.preventDefault();
  distance = THREE.MathUtils.clamp(distance + Math.sign(event.deltaY) * 2, 9, 55);
  updateCamera();
}, { passive: false });
window.addEventListener('keydown', (event) => {
  if (event.target.matches('input,select')) return;
  if (event.ctrlKey && event.code === 'KeyD') { event.preventDefault(); if (selected) addObject(selected.userData.layout.type, serializeObject(selected)); return; }
  if (!selected) return;
  const step = Number(el('snap').value);
  if (event.code === 'ArrowLeft') selected.position.x = snap(selected.position.x - step);
  if (event.code === 'ArrowRight') selected.position.x = snap(selected.position.x + step);
  if (event.code === 'ArrowUp') selected.position.z = snap(selected.position.z - step);
  if (event.code === 'ArrowDown') selected.position.z = snap(selected.position.z + step);
  if (event.code === 'PageUp') selected.position.y += step;
  if (event.code === 'PageDown') selected.position.y -= step;
  if (event.code === 'KeyQ') selected.rotation.y += Math.PI / 12;
  if (event.code === 'KeyE') selected.rotation.y -= Math.PI / 12;
  if (event.code === 'Delete' || event.code === 'Backspace') { deleteSelected(); return; }
  if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','PageUp','PageDown','KeyQ','KeyE'].includes(event.code)) {
    event.preventDefault(); select(selected);
  }
});
function resize() {
  const width = canvas.clientWidth, height = canvas.clientHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}
function frame() {
  resize();
  if (selected) selectionBox.setFromObject(selected);
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
updateFloorVisibility();
updateCamera();
frame();
window.__HOTEL_EDITOR_TEST__ = { CATALOG, serializeLayout, loadLayout, addObject, get floor() { return floor; }, get objectCount() { return roots.length; } };
