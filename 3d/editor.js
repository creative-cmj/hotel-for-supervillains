import * as THREE from './vendor/three.module.js';
import { GLTFLoader } from './vendor/addons/loaders/GLTFLoader.js';
import { CATALOG, FLOOR_HEIGHTS, createCatalogObject, layoutCollider, serializeObject } from './editor/catalog.js';
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
scene.fog = new THREE.Fog(0x120d1a, 40, 100);
scene.add(new THREE.HemisphereLight(0xdad9ff, 0x281832, 2.7));
const sun = new THREE.DirectionalLight(0xffddb2, 2.4);
sun.position.set(10, 22, 9);
scene.add(sun);
const camera = new THREE.PerspectiveCamera(52, 1, .08, 150);
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const roots = [];
const importedRoots = [];
const selectedRoots = [];
const selectionBox = new THREE.BoxHelper(undefined, 0x55eaff);
selectionBox.visible = false;
scene.add(selectionBox);
const collisionGroup = new THREE.Group();
collisionGroup.name = 'COLLISION_PREVIEW';
collisionGroup.visible = false;
scene.add(collisionGroup);
const gizmo = new THREE.Group();
gizmo.name = 'TRANSFORM_GIZMO';
gizmo.visible = false;
scene.add(gizmo);
for (const [color, direction] of [[0xff5a72, new THREE.Vector3(1,0,0)], [0x6fe27e, new THREE.Vector3(0,1,0)], [0x57b9ff, new THREE.Vector3(0,0,1)]]) {
  const arrow = new THREE.ArrowHelper(direction, new THREE.Vector3(), 1.35, color, .24, .12);
  arrow.userData.editorGizmo = true;
  gizmo.add(arrow);
}

let floor = 1;
let viewAngle = Math.PI * .25;
let viewElevation = .68;
let distance = 20;
const viewTarget = new THREE.Vector3(0, FLOOR_HEIGHTS[1], 0);
const playPosition = new THREE.Vector3(0, FLOOR_HEIGHTS[1], 7);
let playPitch = 0;
let playMode = false;
const cameraKeys = new Set();
let idCounter = 1;
let pointerDown = null;
let lastFrame = performance.now();
let transformTool = 'move';
let activeCategory = 'All';
let history = [];
let historyIndex = -1;
let historyTimer = 0;
let replaying = false;
let actionLog = [];
let favoriteAssets = JSON.parse(localStorage.getItem('grand-disaster-editor-favorites') || '[]');
let recentAssets = JSON.parse(localStorage.getItem('grand-disaster-editor-recent') || '[]');

for (const level of [1, 2, 3]) {
  const color = level === 1 ? 0xd39a50 : level === 2 ? 0xe358bd : 0x52d8ee;
  const grid = new THREE.GridHelper(40, 40, color, 0x44304d);
  grid.position.y = FLOOR_HEIGHTS[level] - .02;
  grid.userData.floor = level;
  scene.add(grid);
}

const primarySelection = () => selectedRoots.at(-1) || null;
function status(message) { el('status').textContent = message; }
function snap(value) { const step = Number(el('snap').value); return Math.round(value / step) * step; }
function activeRoots() { return roots.filter((root) => root.userData.layout.floor === floor && !root.userData.editor?.hidden); }
function rootLabel(root) { return root.userData.editor?.name || CATALOG[root.userData.layout.type]?.label || root.name; }
function setPointer(event) {
  const rect = canvas.getBoundingClientRect();
  pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
}
function updateCamera() {
  const y = FLOOR_HEIGHTS[floor];
  if (playMode) {
    camera.position.copy(playPosition);
    camera.rotation.order = 'YXZ';
    camera.rotation.set(playPitch, viewAngle + Math.PI, 0);
    return;
  }
  viewTarget.y = y;
  camera.position.set(viewTarget.x + Math.sin(viewAngle) * distance, y + distance * viewElevation, viewTarget.z + Math.cos(viewAngle) * distance);
  camera.lookAt(viewTarget);
}
function resetView() {
  viewTarget.set(0, FLOOR_HEIGHTS[floor], 0);
  viewAngle = Math.PI * .25;
  viewElevation = .68;
  distance = 20;
  updateCamera();
  status(`View reset on Floor ${floor}`);
}
function focusSelected() {
  const root = primarySelection();
  if (!root) return status('Select an object to focus it');
  const sphere = new THREE.Box3().setFromObject(root).getBoundingSphere(new THREE.Sphere());
  viewTarget.copy(sphere.center);
  viewTarget.y = FLOOR_HEIGHTS[floor];
  distance = THREE.MathUtils.clamp(sphere.radius * 5 + 4, 6, 28);
  updateCamera();
  status(`Focused ${rootLabel(root)}`);
}
function collidesAt(x, z) {
  for (const root of activeRoots()) {
    const collider = layoutCollider(serializeRoot(root));
    if (collider && x + .35 > collider.minX && x - .35 < collider.maxX && z + .35 > collider.minZ && z - .35 < collider.maxZ) return true;
  }
  return false;
}
function moveCamera(delta) {
  const forward = Number(cameraKeys.has('KeyW')) - Number(cameraKeys.has('KeyS'));
  const right = Number(cameraKeys.has('KeyD')) - Number(cameraKeys.has('KeyA'));
  if (!forward && !right) return;
  const length = Math.hypot(forward, right) || 1;
  const speed = Number(el('camera-speed').value) * (cameraKeys.has('ShiftLeft') || cameraKeys.has('ShiftRight') ? 2 : 1) * delta;
  const dx = ((-Math.sin(viewAngle) * forward + Math.cos(viewAngle) * right) / length) * speed;
  const dz = ((-Math.cos(viewAngle) * forward - Math.sin(viewAngle) * right) / length) * speed;
  if (playMode) {
    if (!collidesAt(playPosition.x + dx, playPosition.z)) playPosition.x += dx;
    if (!collidesAt(playPosition.x, playPosition.z + dz)) playPosition.z += dz;
  } else {
    viewTarget.x += dx;
    viewTarget.z += dz;
  }
  updateCamera();
}
function updateFloorVisibility() {
  for (const root of roots) root.visible = root.userData.layout.floor === floor && !root.userData.editor?.hidden;
  for (const root of importedRoots) root.visible = root.userData.floor === floor && !root.userData.hidden;
  scene.children.filter((child) => child.isGridHelper).forEach((grid) => { grid.visible = grid.userData.floor === floor && !playMode; });
  for (let i = selectedRoots.length - 1; i >= 0; i--) if (selectedRoots[i].userData.layout.floor !== floor) selectedRoots.splice(i, 1);
  document.querySelectorAll('#floors button').forEach((button) => button.classList.toggle('active', Number(button.dataset.floor) === floor));
  refreshSelectionUI();
  renderOutliner();
  refreshCollisionPreview();
}
function select(root, additive = false) {
  if (!additive) selectedRoots.length = 0;
  if (root) {
    const existing = selectedRoots.indexOf(root);
    if (additive && existing >= 0) selectedRoots.splice(existing, 1);
    else if (existing < 0) selectedRoots.push(root);
  }
  refreshSelectionUI();
  renderOutliner();
}
function refreshSelectionUI() {
  const root = primarySelection();
  selectionBox.visible = Boolean(root) && !playMode;
  gizmo.visible = Boolean(root) && !playMode;
  el('nothing-selected').hidden = Boolean(root);
  el('selection-fields').hidden = !root;
  if (!root) return;
  selectionBox.setFromObject(root);
  gizmo.position.copy(root.position);
  gizmo.scale.setScalar(Math.max(.7, distance / 18));
  const prefix = selectedRoots.length > 1 ? `${selectedRoots.length} objects · ` : '';
  el('selected-name').textContent = `${prefix}${rootLabel(root)} · ${root.userData.layout.id}`;
  el('object-name').value = rootLabel(root);
  el('object-collection').value = root.userData.editor?.collection || '';
  const parentSelect = el('object-parent');
  parentSelect.replaceChildren(new Option('None', ''));
  for (const candidate of roots.filter((entry) => entry !== root && entry.userData.layout.floor === floor)) parentSelect.add(new Option(rootLabel(candidate), candidate.userData.layout.id));
  parentSelect.value = root.userData.editor?.parentId || '';
  el('object-x').value = root.position.x.toFixed(2);
  el('object-z').value = root.position.z.toFixed(2);
  el('object-y').value = (root.position.y - FLOOR_HEIGHTS[floor]).toFixed(2);
  el('object-r').value = Math.round(THREE.MathUtils.radToDeg(root.rotation.y));
  el('object-sx').value = root.scale.x.toFixed(2);
  el('object-sy').value = root.scale.y.toFixed(2);
  el('object-sz').value = root.scale.z.toFixed(2);
  el('toggle-hidden').textContent = root.userData.editor?.hidden ? 'Show' : 'Hide';
  el('toggle-locked').textContent = root.userData.editor?.locked ? 'Unlock' : 'Lock';
  const material = firstMaterial(root);
  if (material) {
    el('material-color').value = `#${material.color.getHexString()}`;
    el('material-emission').value = `#${material.emissive?.getHexString?.() || '000000'}`;
    el('material-roughness').value = material.roughness ?? .5;
    el('material-metalness').value = material.metalness ?? .1;
  }
  const light = root.getObjectByName('EDITOR_POINT_LIGHT');
  el('light-controls').hidden = !light;
  if (light) {
    el('light-intensity').value = light.intensity;
    el('light-range').value = light.distance;
    el('light-shadow').checked = light.castShadow;
  }
}
function serializeRoot(root) {
  const data = serializeObject(root);
  const editor = root.userData.editor || {};
  if (editor.name) data.name = editor.name;
  if (editor.hidden || editor.locked || editor.parentId || editor.collection) data.editor = { hidden: Boolean(editor.hidden), locked: Boolean(editor.locked), parentId: editor.parentId || null, collection: editor.collection || '' };
  if (editor.material) data.material = { ...editor.material };
  if (editor.light) data.light = { ...editor.light };
  return data;
}
function hydrateRoot(data) {
  const root = createCatalogObject(data.type, data);
  root.userData.editor = {
    name: data.name || '',
    hidden: Boolean(data.editor?.hidden),
    locked: Boolean(data.editor?.locked),
    parentId: data.editor?.parentId || null,
    collection: data.editor?.collection || '',
    material: data.material || null,
    light: data.light || null,
  };
  if (data.material) applyMaterialData(root, data.material);
  if (data.light) applyLightData(root, data.light);
  scene.add(root);
  roots.push(root);
  return root;
}
function serializeLayout() {
  return { version: 1, name: el('layout-name').value.trim() || 'Custom Hotel Additions', objects: roots.map(serializeRoot) };
}
function loadLayout(layout, options = {}) {
  if (layout.version !== 1 || !Array.isArray(layout.objects)) throw Error('This is not a Grand Disaster layout file.');
  for (const root of roots.splice(0)) scene.remove(root);
  selectedRoots.length = 0;
  el('layout-name').value = layout.name || 'Custom Hotel Additions';
  for (const data of layout.objects) if (CATALOG[data.type]) hydrateRoot(data);
  updateFloorVisibility();
  status(`Loaded ${roots.length} objects`);
  if (options.resetHistory !== false) {
    history = [];
    historyIndex = -1;
    pushHistory(options.label || 'Loaded layout', true);
  }
}
function addObject(type, source = null, options = {}) {
  const definition = CATALOG[type];
  const data = source ? structuredClone(source) : {
    type,
    floor,
    position: [snap(viewTarget.x), FLOOR_HEIGHTS[floor] + (definition.offsetY || 0), snap(viewTarget.z)],
    rotationY: 0,
    scale: [1, 1, 1],
  };
  data.id = `${type}-${Date.now()}-${idCounter++}`;
  data.floor = floor;
  if (source && !options.exact) data.position = [snap(source.position[0] + .75), source.position[1], snap(source.position[2] + .75)];
  const root = hydrateRoot(data);
  select(root);
  recentAssets = [type, ...recentAssets.filter((entry) => entry !== type)].slice(0, 8);
  localStorage.setItem('grand-disaster-editor-recent', JSON.stringify(recentAssets));
  if (options.record !== false) pushHistory(`Added ${definition.label}`);
  status(`Added ${definition.label} to Floor ${floor}`);
  return root;
}
function addPreset(presetId) {
  const preset = PRESETS[presetId];
  const added = [];
  for (const [type, x, z, rotationY, scale = [1,1,1]] of preset.objects) {
    const definition = CATALOG[type];
    added.push(addObject(type, {
      type,
      floor,
      position: [x + snap(viewTarget.x), FLOOR_HEIGHTS[floor] + (definition.offsetY || 0), z + snap(viewTarget.z)],
      rotationY,
      scale,
    }, { exact: true, record: false }));
  }
  selectedRoots.splice(0, selectedRoots.length, ...added);
  refreshSelectionUI();
  renderOutliner();
  pushHistory(`Added ${preset.label} prefab`);
  status(`Added editable ${preset.label} prefab to Floor ${floor}`);
}
function deleteSelected() {
  if (!selectedRoots.length) return;
  const deletable = selectedRoots.filter((root) => !root.userData.editor?.locked);
  for (const root of deletable) {
    roots.splice(roots.indexOf(root), 1);
    scene.remove(root);
  }
  selectedRoots.length = 0;
  refreshSelectionUI();
  renderOutliner();
  if (deletable.length) pushHistory(`Deleted ${deletable.length} object${deletable.length === 1 ? '' : 's'}`);
  status(deletable.length ? 'Selection removed' : 'Unlock the selection before deleting');
}
function duplicateSelected(offset = .75) {
  const copies = [...selectedRoots].map((root) => {
    const data = serializeRoot(root);
    data.position[0] += offset;
    data.position[2] += offset;
    return addObject(data.type, data, { exact: true, record: false });
  });
  selectedRoots.splice(0, selectedRoots.length, ...copies);
  refreshSelectionUI();
  renderOutliner();
  if (copies.length) pushHistory(`Duplicated ${copies.length} object${copies.length === 1 ? '' : 's'}`);
}
function updateSelectionFromFields() {
  const root = primarySelection();
  if (!root || root.userData.editor?.locked) return;
  root.position.set(Number(el('object-x').value), FLOOR_HEIGHTS[floor] + Number(el('object-y').value), Number(el('object-z').value));
  root.rotation.y = THREE.MathUtils.degToRad(Number(el('object-r').value));
  root.scale.set(Math.max(.05, Number(el('object-sx').value)), Math.max(.05, Number(el('object-sy').value)), Math.max(.05, Number(el('object-sz').value)));
  selectionBox.setFromObject(root);
  gizmo.position.copy(root.position);
  scheduleHistory('Changed transform');
}
function nudgeSelection(x, z) {
  if (!selectedRoots.length) return;
  const step = Number(el('snap').value);
  const primary = primarySelection();
  let dx = x * step, dz = z * step;
  if (el('transform-space').value === 'local' && primary) {
    const c = Math.cos(primary.rotation.y), s = Math.sin(primary.rotation.y);
    [dx, dz] = [dx * c + dz * s, -dx * s + dz * c];
  }
  for (const root of selectedRoots) if (!root.userData.editor?.locked) {
    root.position.x = snap(root.position.x + dx);
    root.position.z = snap(root.position.z + dz);
  }
  refreshSelectionUI();
  pushHistory('Moved selection');
}
function snapOpeningToWall(root) {
  if (!['door','doorframe','window'].includes(root.userData.layout.type)) return;
  let nearest = null, best = 1.5;
  for (const wall of roots.filter((entry) => entry.userData.layout.floor === floor && entry.userData.layout.type === 'wall')) {
    const dx = Math.abs(root.position.x-wall.position.x), dz = Math.abs(root.position.z-wall.position.z);
    const distanceToLine = Math.abs(Math.sin(wall.rotation.y)) > .7 ? dx : dz;
    if (distanceToLine < best) { best=distanceToLine; nearest=wall; }
  }
  if (!nearest) return;
  root.rotation.y = nearest.rotation.y;
  if (Math.abs(Math.sin(nearest.rotation.y)) > .7) root.position.x = nearest.position.x;
  else root.position.z = nearest.position.z;
  status(`${rootLabel(root)} snapped to nearby wall`);
}
function alignSelection(axis) {
  const primary = primarySelection();
  if (!primary || selectedRoots.length < 2) return status('Select two or more objects to align');
  for (const root of selectedRoots) if (!root.userData.editor?.locked) root.position[axis] = primary.position[axis];
  refreshSelectionUI();
  pushHistory(`Aligned selection on ${axis.toUpperCase()}`);
}
function firstMaterial(root) {
  let found = null;
  root.traverse((node) => { if (!found && node.isMesh && node.material?.isMeshStandardMaterial) found = node.material; });
  return found;
}
function applyMaterialData(root, data) {
  root.traverse((node) => {
    if (!node.isMesh || !node.material) return;
    node.material = node.material.clone();
    if (data.color) node.material.color?.set(data.color);
    if (data.emission) node.material.emissive?.set(data.emission);
    if (Number.isFinite(data.roughness)) node.material.roughness = data.roughness;
    if (Number.isFinite(data.metalness)) node.material.metalness = data.metalness;
  });
  root.userData.editor ||= {};
  root.userData.editor.material = { ...data };
}
function updateMaterial() {
  if (!selectedRoots.length) return;
  const data = {
    color: el('material-color').value,
    emission: el('material-emission').value,
    roughness: Number(el('material-roughness').value),
    metalness: Number(el('material-metalness').value),
  };
  for (const root of selectedRoots) if (!root.userData.editor?.locked) applyMaterialData(root, data);
  scheduleHistory('Changed material');
}
function applyLightData(root, data) {
  const light = root.getObjectByName('EDITOR_POINT_LIGHT');
  if (!light) return;
  light.intensity = THREE.MathUtils.clamp(Number(data.intensity) || 0, 0, 20);
  light.distance = THREE.MathUtils.clamp(Number(data.range) || 1, 1, 40);
  light.castShadow = Boolean(data.shadow);
  renderer.shadowMap.enabled = roots.some((candidate) => candidate.getObjectByName('EDITOR_POINT_LIGHT')?.castShadow) || light.castShadow;
  root.userData.editor ||= {};
  root.userData.editor.light = { intensity:light.intensity, range:light.distance, shadow:light.castShadow };
}
function updateLight() {
  const root = primarySelection();
  if (!root) return;
  applyLightData(root, { intensity:Number(el('light-intensity').value), range:Number(el('light-range').value), shadow:el('light-shadow').checked });
  scheduleHistory('Changed light');
}
function renderPalette() {
  const palette = el('palette');
  palette.replaceChildren();
  const search = el('palette-search').value.trim().toLowerCase();
  const icons = { Architecture:'▦', Furniture:'▰', Decor:'✦', Hotel:'♜', 'Villain Tech':'⚡', Characters:'◆', Lights:'☀' };
  for (const category of [...new Set(Object.values(CATALOG).map((entry) => entry.category))]) {
    const matches = Object.entries(CATALOG).filter(([type,entry]) => entry.category === category && (!search || entry.label.toLowerCase().includes(search)) && (activeCategory === 'All' || activeCategory === category || (activeCategory === 'Favorites' && favoriteAssets.includes(type)) || (activeCategory === 'Recent' && recentAssets.includes(type))));
    if (!matches.length) continue;
    const heading = document.createElement('h3');
    heading.textContent = category;
    palette.append(heading);
    for (const [type, definition] of matches) {
      const button = document.createElement('button');
      button.dataset.icon = icons[category] || '◆';
      button.className = 'asset-add';
      button.innerHTML = `${definition.label}<span class="favorite-star ${favoriteAssets.includes(type) ? 'active' : ''}" title="Favorite">★</span>`;
      button.title = `Add ${definition.label}`;
      button.draggable = true;
      button.ondragstart = (event) => event.dataTransfer.setData('application/x-hotel-asset', type);
      button.onclick = (event) => {
        if (event.target.closest('.favorite-star')) {
          favoriteAssets = favoriteAssets.includes(type) ? favoriteAssets.filter((entry) => entry !== type) : [...favoriteAssets, type];
          localStorage.setItem('grand-disaster-editor-favorites', JSON.stringify(favoriteAssets));
          renderCategories(); renderPalette();
          return;
        }
        addObject(type);
      };
      palette.append(button);
    }
  }
}
function renderCategories() {
  const host = el('asset-categories');
  host.replaceChildren();
  for (const category of ['All', 'Favorites', 'Recent', ...new Set(Object.values(CATALOG).map((entry) => entry.category))]) {
    const button = document.createElement('button');
    button.textContent = category;
    button.classList.toggle('active', category === activeCategory);
    button.onclick = () => { activeCategory = category; renderCategories(); renderPalette(); };
    host.append(button);
  }
}
function renderOutliner() {
  const host = el('object-list');
  host.replaceChildren();
  const query = el('outliner-search').value.trim().toLowerCase();
  const all = roots.filter((root) => root.userData.layout.floor === floor);
  const visible = all.filter((root) => !query || `${rootLabel(root)} ${root.userData.layout.id} ${root.userData.editor?.collection || ''}`.toLowerCase().includes(query)).sort((a,b) => (a.userData.editor?.collection || 'Ungrouped').localeCompare(b.userData.editor?.collection || 'Ungrouped') || rootLabel(a).localeCompare(rootLabel(b)));
  el('object-count').textContent = String(all.length);
  if (!visible.length) {
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.textContent = query ? 'No matching objects.' : 'This floor is empty.';
    host.append(empty);
    return;
  }
  let currentCollection = null;
  for (const root of visible) {
    const collection = root.userData.editor?.collection || 'Ungrouped';
    if (collection !== currentCollection) {
      currentCollection = collection;
      const heading = document.createElement('div'); heading.className = 'collection-heading'; heading.textContent = collection; host.append(heading);
    }
    const button = document.createElement('button');
    button.classList.toggle('active', selectedRoots.includes(root));
    button.classList.toggle('hidden-object', root.userData.editor?.hidden);
    button.classList.toggle('locked-object', root.userData.editor?.locked);
    button.classList.toggle('child-object', Boolean(root.userData.editor?.parentId));
    button.innerHTML = `<span><span class="object-icon">◆</span> ${rootLabel(root)}</span><small>${root.userData.editor?.locked ? '🔒' : ''}${root.userData.editor?.hidden ? ' ◌' : ''}</small>`;
    button.onclick = (event) => select(root, event.ctrlKey || event.metaKey || event.shiftKey);
    button.ondblclick = () => { select(root); focusSelected(); };
    host.append(button);
  }
}
function updateHistoryUI() {
  el('undo').disabled = historyIndex <= 0;
  el('redo').disabled = historyIndex >= history.length - 1;
  el('history-count').textContent = String(history.length);
  const host = el('history-list');
  host.replaceChildren();
  const start = Math.max(0, history.length - 14);
  history.slice(start).forEach((entry, offset) => {
    const actual = start + offset;
    const button = document.createElement('button');
    button.textContent = `${actual + 1}. ${entry.label}`;
    button.classList.toggle('current', actual === historyIndex);
    button.onclick = () => restoreHistory(actual);
    host.append(button);
  });
}
function addAction(message) {
  actionLog.unshift({ time: new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }), message });
  actionLog = actionLog.slice(0, 50);
  const host = el('action-log');
  host.replaceChildren();
  for (const item of actionLog.slice(0, 12)) {
    const row = document.createElement('div');
    row.textContent = `${item.time} · ${item.message}`;
    host.append(row);
  }
}
function pushHistory(label, force = false) {
  if (replaying) return;
  clearTimeout(historyTimer);
  const json = JSON.stringify(serializeLayout());
  if (!force && history[historyIndex]?.json === json) return;
  history.splice(historyIndex + 1);
  history.push({ label, json, floor, time: Date.now() });
  if (history.length > 80) history.shift();
  historyIndex = history.length - 1;
  localStorage.setItem('grand-disaster-layout-autosave', json);
  updateHistoryUI();
  addAction(label);
  updateStats();
}
function scheduleHistory(label) {
  clearTimeout(historyTimer);
  historyTimer = setTimeout(() => pushHistory(label), 250);
}
function restoreHistory(index) {
  if (index < 0 || index >= history.length) return;
  replaying = true;
  historyIndex = index;
  floor = history[index].floor;
  loadLayout(JSON.parse(history[index].json), { resetHistory:false });
  replaying = false;
  updateHistoryUI();
  addAction(`Restored history: ${history[index].label}`);
  status(`Restored ${history[index].label}`);
}
function saveVersion() {
  const versions = JSON.parse(localStorage.getItem('grand-disaster-layout-versions') || '[]');
  const number = (versions.at(-1)?.number || 0) + 1;
  const name = `Hotel_v${String(number).padStart(2,'0')}`;
  versions.push({ number, name, savedAt: new Date().toISOString(), layout: serializeLayout() });
  localStorage.setItem('grand-disaster-layout-versions', JSON.stringify(versions.slice(-25)));
  status(`Saved ${name}`);
  addAction(`Saved version ${name}`);
}
function restoreLatestVersion() {
  const versions = JSON.parse(localStorage.getItem('grand-disaster-layout-versions') || '[]');
  const latest = versions.at(-1);
  if (!latest) return status('No saved versions yet');
  loadLayout(latest.layout, { label:`Restored ${latest.name}` });
  status(`Restored ${latest.name}`);
}
function refreshCollisionPreview() {
  collisionGroup.clear();
  if (!collisionGroup.visible) return;
  const material = new THREE.MeshBasicMaterial({ color:0xff475f, transparent:true, opacity:.22, depthWrite:false });
  for (const root of activeRoots()) {
    const collider = layoutCollider(serializeRoot(root));
    if (!collider) continue;
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(collider.maxX-collider.minX, 2.2, collider.maxZ-collider.minZ), material);
    mesh.position.set((collider.minX+collider.maxX)/2, FLOOR_HEIGHTS[floor]+1.1, (collider.minZ+collider.maxZ)/2);
    collisionGroup.add(mesh);
  }
}
function sceneMetrics() {
  let triangles = 0, meshes = 0, hidden = 0, lights = 0, shadowLights = 0;
  const materials = new Set();
  for (const root of roots) {
    if (root.userData.editor?.hidden) hidden++;
    root.traverse((node) => {
      if (node.isLight) { lights++; if (node.castShadow) shadowLights++; }
      if (!node.isMesh) return;
      meshes++;
      triangles += node.geometry.index ? node.geometry.index.count / 3 : (node.geometry.attributes.position?.count || 0) / 3;
      for (const material of Array.isArray(node.material) ? node.material : [node.material]) materials.add(material);
    });
  }
  return { objects:roots.length, meshes, triangles:Math.round(triangles), materials:materials.size, hidden, lights, shadowLights };
}
function updateStats() {
  const stats = sceneMetrics();
  el('scene-stats').innerHTML = `<b>${stats.objects}</b> objects · <b>${stats.triangles.toLocaleString()}</b> triangles<br>${stats.meshes} meshes · ${stats.materials} materials · ${renderer.info.render.calls} draw calls · ${stats.lights} lights`;
  const warnings = [];
  if (stats.triangles > 150000) warnings.push('Triangle count is high for a browser scene.');
  if (stats.materials > 60) warnings.push('Many material instances may increase draw calls.');
  if (stats.hidden) warnings.push(`${stats.hidden} hidden object${stats.hidden === 1 ? '' : 's'} will still be exported.`);
  if (stats.lights > 8) warnings.push(`${stats.lights} real-time lights may hurt browser performance.`);
  if (stats.shadowLights > 2) warnings.push(`${stats.shadowLights} shadow-casting lights are expensive. Keep this below three.`);
  const outside = roots.filter((root) => Math.abs(root.position.x) > 35 || Math.abs(root.position.z) > 35).length;
  if (outside) warnings.push(`${outside} object${outside === 1 ? '' : 's'} may be outside the playable hotel.`);
  const host = el('scene-warnings');
  host.replaceChildren();
  if (!warnings.length) {
    const ok = document.createElement('div');
    ok.style.borderLeftColor = '#57d78a';
    ok.textContent = 'No obvious performance or placement problems.';
    host.append(ok);
  } else for (const warning of warnings) {
    const row = document.createElement('div');
    row.textContent = warning;
    host.append(row);
  }
  return warnings;
}
function verifyScene() {
  const warnings = updateStats();
  refreshCollisionPreview();
  addAction(`Verified scene: ${warnings.length ? `${warnings.length} warning(s)` : 'passed'}`);
  status(warnings.length ? `Verification found ${warnings.length} warning(s)` : 'Scene verification passed');
}
function duplicateFloor() {
  const sourceFloor = floor;
  const target = floor === 3 ? 1 : floor + 1;
  const source = roots.filter((root) => root.userData.layout.floor === sourceFloor);
  if (!source.length) return status('This floor is empty');
  const added = [];
  for (const root of source) {
    const data = serializeRoot(root);
    data.floor = target;
    data.position[1] += FLOOR_HEIGHTS[target] - FLOOR_HEIGHTS[sourceFloor];
    floor = target;
    added.push(addObject(data.type, data, { exact:true, record:false }));
  }
  floor = target;
  selectedRoots.splice(0, selectedRoots.length, ...added);
  updateFloorVisibility();
  resetView();
  pushHistory(`Duplicated Floor ${sourceFloor} to Floor ${target}`);
  status(`Duplicated ${added.length} objects to Floor ${target}`);
}
function numberSelectedDoors() {
  const doors = selectedRoots.filter((root) => root.userData.layout.type === 'doorframe');
  if (!doors.length) return status('Select one or more door frames first');
  doors.sort((a,b) => a.position.z-b.position.z || a.position.x-b.position.x).forEach((root,index) => {
    root.userData.editor ||= {};
    root.userData.editor.name = `Room ${floor}${String(index+1).padStart(2,'0')} Door`;
  });
  renderOutliner();
  refreshSelectionUI();
  pushHistory(`Numbered ${doors.length} room doors`);
}
function downloadLayout() {
  const blob = new Blob([JSON.stringify(serializeLayout(), null, 2) + '\n'], { type:'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'custom-layout.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  status('Downloaded custom-layout.json');
  addAction('Exported layout JSON');
}
async function inspectModel(file) {
  const report = el('model-report');
  const extension = file.name.split('.').pop().toLowerCase();
  if (!['glb','gltf'].includes(extension)) {
    report.textContent = 'Use GLB or embedded glTF. Convert FBX/OBJ in Blockbench first.';
    return;
  }
  report.textContent = `Inspecting ${file.name}…`;
  try {
    const buffer = await file.arrayBuffer();
    const gltf = await new Promise((resolve,reject) => new GLTFLoader().parse(buffer, '', resolve, reject));
    const root = gltf.scene;
    let triangles=0, meshes=0;
    const materials=new Set(), textures=new Set();
    root.traverse((node) => {
      if (!node.isMesh) return;
      meshes++;
      triangles += node.geometry.index ? node.geometry.index.count/3 : (node.geometry.attributes.position?.count || 0)/3;
      for (const material of Array.isArray(node.material) ? node.material : [node.material]) {
        materials.add(material);
        for (const value of Object.values(material || {})) if (value?.isTexture) textures.add(value);
      }
    });
    const size = new THREE.Box3().setFromObject(root).getSize(new THREE.Vector3());
    report.innerHTML = `<b>${file.name}</b><br>${(file.size/1048576).toFixed(2)} MB · ${meshes} meshes · ${Math.round(triangles).toLocaleString()} triangles<br>${materials.size} materials · ${textures.size} textures · ${size.x.toFixed(2)} × ${size.y.toFixed(2)} × ${size.z.toFixed(2)} m<br><button id="add-inspected-model">Add preview to scene</button><br><small>Preview imports are session-only. Copy the licensed GLB into assets/external before game integration.</small>`;
    el('add-inspected-model').onclick = () => {
      root.position.set(viewTarget.x, FLOOR_HEIGHTS[floor], viewTarget.z);
      root.userData.floor=floor;
      root.userData.sourceFile=file.name;
      scene.add(root);
      importedRoots.push(root);
      el('add-inspected-model').disabled=true;
      status(`Added ${file.name} preview`);
      addAction(`Imported preview ${file.name}`);
      updateStats();
    };
  } catch (error) {
    report.textContent = `Could not inspect ${file.name}: ${error.message}`;
  }
}
function togglePlayTest() {
  playMode = !playMode;
  el('play-test').classList.toggle('active', playMode);
  el('play-test').textContent = playMode ? '■ Exit play-test (Esc)' : '▶ Play-test at player height';
  selectionBox.visible = gizmo.visible = false;
  if (playMode) {
    playPosition.set(viewTarget.x, FLOOR_HEIGHTS[floor]+1.7, viewTarget.z+3);
    playPitch=0;
    canvas.requestPointerLock?.();
    status('Play-test: WASD walk · mouse look · Esc exits');
  } else {
    document.exitPointerLock?.();
    updateFloorVisibility();
    status('Returned to edit mode');
  }
  updateCamera();
}
function setTransformTool(tool) {
  transformTool=tool;
  for (const name of ['move','rotate','scale']) el(`tool-${name}`).classList.toggle('active', name===tool);
  status(`${tool[0].toUpperCase()+tool.slice(1)} tool selected`);
}

renderCategories();
renderPalette();
for (const [presetId,preset] of Object.entries(PRESETS)) {
  const button=document.createElement('button');
  button.textContent=preset.label;
  button.onclick=()=>addPreset(presetId);
  el('presets').append(button);
}
for (const [name,color] of Object.entries({ Purple:'#64258b', Pink:'#e84ca5', Cyan:'#38c9e8', Black:'#17121f', Gold:'#d8a84e', Cream:'#f0dfe8' })) {
  const button=document.createElement('button');
  button.style.background=color;
  button.title=name;
  button.onclick=()=>{ el('material-color').value=color; updateMaterial(); };
  el('material-swatches').append(button);
}
document.querySelectorAll('#floors button').forEach((button)=>{
  button.onclick=()=>{ floor=Number(button.dataset.floor); updateFloorVisibility(); resetView(); status(`Editing Floor ${floor}`); };
});
el('palette-search').oninput=renderPalette;
el('outliner-search').oninput=renderOutliner;
for (const id of ['object-x','object-z','object-y','object-r','object-sx','object-sy','object-sz']) el(id).addEventListener('input',updateSelectionFromFields);
for (const id of ['material-color','material-emission','material-roughness','material-metalness']) el(id).addEventListener('input',updateMaterial);
for (const id of ['light-intensity','light-range','light-shadow']) el(id).addEventListener('input',updateLight);
el('object-name').addEventListener('change',()=>{
  const root=primarySelection();
  if(!root)return;
  root.userData.editor ||= {};
  root.userData.editor.name=el('object-name').value.trim();
  renderOutliner();
  pushHistory('Renamed object');
});
el('object-collection').addEventListener('change',()=>{
  for (const root of selectedRoots) { root.userData.editor ||= {}; root.userData.editor.collection = el('object-collection').value.trim(); }
  renderOutliner(); pushHistory('Changed collection');
});
el('object-parent').addEventListener('change',()=>{
  const root=primarySelection(); if(!root)return; root.userData.editor ||= {}; root.userData.editor.parentId=el('object-parent').value || null;
  renderOutliner(); pushHistory('Changed parent');
});
document.querySelectorAll('[data-nudge]').forEach((button)=>button.onclick=()=>{
  const [x,z]=button.dataset.nudge.split(',').map(Number);
  nudgeSelection(x,z);
});
el('rotate-left').onclick=()=>{ for(const root of selectedRoots) if(!root.userData.editor?.locked) root.rotation.y+=Math.PI/12; refreshSelectionUI(); pushHistory('Rotated selection'); };
el('rotate-right').onclick=()=>{ for(const root of selectedRoots) if(!root.userData.editor?.locked) root.rotation.y-=Math.PI/12; refreshSelectionUI(); pushHistory('Rotated selection'); };
el('duplicate').onclick=()=>duplicateSelected();
el('duplicate-room').onclick=()=>duplicateSelected(4);
el('delete').onclick=deleteSelected;
el('focus-selected').onclick=focusSelected;
el('focus-view').onclick=focusSelected;
el('align-x').onclick=()=>alignSelection('x');
el('align-z').onclick=()=>alignSelection('z');
el('mirror-x').onclick=()=>{ for(const root of selectedRoots) if(!root.userData.editor?.locked) root.scale.x*=-1; refreshSelectionUI(); pushHistory('Mirrored selection on X'); };
el('reset-transform').onclick=()=>{ for(const root of selectedRoots) if(!root.userData.editor?.locked) { root.rotation.set(0,0,0); root.scale.set(1,1,1); } refreshSelectionUI(); pushHistory('Reset transforms'); };
el('toggle-hidden').onclick=()=>{ for(const root of selectedRoots) { root.userData.editor ||= {}; root.userData.editor.hidden=!root.userData.editor.hidden; } updateFloorVisibility(); pushHistory('Changed visibility'); };
el('toggle-locked').onclick=()=>{ for(const root of selectedRoots) { root.userData.editor ||= {}; root.userData.editor.locked=!root.userData.editor.locked; } refreshSelectionUI(); renderOutliner(); pushHistory('Changed lock state'); };
el('duplicate-floor').onclick=duplicateFloor;
el('room-numbers').onclick=numberSelectedDoors;
el('show-collisions').onclick=()=>{
  collisionGroup.visible=!collisionGroup.visible;
  refreshCollisionPreview();
  el('show-collisions').textContent=collisionGroup.visible?'Hide Collisions':'Show Collisions';
};
el('refresh-stats').onclick=updateStats;
el('verify-scene').onclick=verifyScene;
el('undo').onclick=()=>restoreHistory(historyIndex-1);
el('redo').onclick=()=>restoreHistory(historyIndex+1);
el('save-version').onclick=saveVersion;
el('restore-version').onclick=restoreLatestVersion;
el('save-browser').onclick=()=>{ localStorage.setItem('grand-disaster-layout-draft',JSON.stringify(serializeLayout())); status('Draft saved in this browser'); addAction('Saved browser draft'); };
el('load-browser').onclick=()=>{
  const saved=localStorage.getItem('grand-disaster-layout-draft');
  if(!saved)return status('No browser draft found');
  try{loadLayout(JSON.parse(saved),{label:'Loaded browser draft'});}catch(error){status(error.message);}
};
el('restore-auto').onclick=()=>{
  const saved=localStorage.getItem('grand-disaster-layout-autosave');
  if(!saved)return status('No autosave found');
  try{loadLayout(JSON.parse(saved),{label:'Restored autosave'});}catch(error){status(error.message);}
};
el('export-json').onclick=downloadLayout;
el('import-json').onchange=async(event)=>{
  const file=event.target.files[0];
  if(!file)return;
  try{loadLayout(JSON.parse(await file.text()),{label:`Imported ${file.name}`});}catch(error){status(error.message);}
  event.target.value='';
};
el('import-model').onchange=async(event)=>{
  const file=event.target.files[0];
  if(file)await inspectModel(file);
  event.target.value='';
};
el('view-left').onclick=()=>{viewAngle-=Math.PI/4;updateCamera();};
el('view-right').onclick=()=>{viewAngle+=Math.PI/4;updateCamera();};
el('top-view').onclick=()=>{viewElevation=1.8;distance=Math.max(distance,14);updateCamera();status('Top view');};
el('zoom-in').onclick=()=>{distance=Math.max(4,distance-3);updateCamera();};
el('zoom-out').onclick=()=>{distance=Math.min(70,distance+3);updateCamera();};
el('reset-view').onclick=resetView;
el('play-test').onclick=togglePlayTest;
for(const tool of ['move','rotate','scale']) el(`tool-${tool}`).onclick=()=>setTransformTool(tool);

canvas.addEventListener('contextmenu',(event)=>event.preventDefault());
canvas.addEventListener('pointerdown',(event)=>{
  setPointer(event);
  const hit=raycaster.intersectObjects(activeRoots(),true).find((entry)=>!entry.object.userData.editorGizmo);
  const root=hit?.object.userData.editorRoot || null;
  if(event.button===0 && root){
    select(root,event.ctrlKey||event.metaKey||event.shiftKey);
    dragPlane.constant=-root.position.y;
    const point=new THREE.Vector3();
    raycaster.ray.intersectPlane(dragPlane,point);
    pointerDown={x:event.clientX,y:event.clientY,lastX:event.clientX,lastY:event.clientY,button:event.button,moved:false,dragRoot:root,offset:point.sub(root.position),initialRotation:root.rotation.y,initialScale:root.scale.clone()};
  } else {
    pointerDown={x:event.clientX,y:event.clientY,lastX:event.clientX,lastY:event.clientY,button:event.button,moved:false,empty:event.button===0&&!root};
  }
  canvas.setPointerCapture?.(event.pointerId);
});
canvas.addEventListener('pointermove',(event)=>{
  if(!pointerDown)return;
  const dx=event.clientX-pointerDown.lastX,dy=event.clientY-pointerDown.lastY;
  if(Math.hypot(event.clientX-pointerDown.x,event.clientY-pointerDown.y)>4)pointerDown.moved=true;
  if(pointerDown.button===2){
    viewAngle-=dx*.009;
    viewElevation=THREE.MathUtils.clamp(viewElevation+dy*.008,.15,1.8);
    updateCamera();
  } else if(pointerDown.button===1){
    const scale=distance*.0028;
    viewTarget.x+=(-Math.cos(viewAngle)*dx+Math.sin(viewAngle)*dy)*scale;
    viewTarget.z+=(Math.sin(viewAngle)*dx+Math.cos(viewAngle)*dy)*scale;
    updateCamera();
  } else if(pointerDown.dragRoot&&pointerDown.moved&&!pointerDown.dragRoot.userData.editor?.locked){
    const totalX=event.clientX-pointerDown.x,totalY=event.clientY-pointerDown.y;
    if(transformTool==='move'){
      setPointer(event);
      const point=new THREE.Vector3();
      if(raycaster.ray.intersectPlane(dragPlane,point)){
        pointerDown.dragRoot.position.x=snap(point.x-pointerDown.offset.x);
        pointerDown.dragRoot.position.z=snap(point.z-pointerDown.offset.z);
      }
    } else if(transformTool==='rotate') {
      const degrees=Math.round(THREE.MathUtils.radToDeg(pointerDown.initialRotation+totalX*.01)/15)*15;
      pointerDown.dragRoot.rotation.y=THREE.MathUtils.degToRad(degrees);
    } else if(transformTool==='scale') {
      const factor=Math.max(.1,1+(totalX-totalY)*.01);
      pointerDown.dragRoot.scale.copy(pointerDown.initialScale).multiplyScalar(factor);
    }
    refreshSelectionUI();
    canvas.classList.add('dragging');
  }
  pointerDown.lastX=event.clientX;
  pointerDown.lastY=event.clientY;
});
canvas.addEventListener('pointerup',()=>{
  if(!pointerDown)return;
  const moved=pointerDown.moved,dragged=pointerDown.dragRoot,empty=pointerDown.empty;
  pointerDown=null;
  canvas.classList.remove('dragging');
  if(dragged&&moved){snapOpeningToWall(dragged);refreshSelectionUI();pushHistory(`${transformTool[0].toUpperCase()+transformTool.slice(1)} transform`);}
  else if(empty&&!moved)select(null);
});
canvas.addEventListener('pointercancel',()=>{pointerDown=null;canvas.classList.remove('dragging');});
canvas.addEventListener('dragover',(event)=>{event.preventDefault();event.dataTransfer.dropEffect='copy';});
canvas.addEventListener('drop',(event)=>{
  event.preventDefault();
  const type=event.dataTransfer.getData('application/x-hotel-asset');
  if(!CATALOG[type])return;
  setPointer(event);dragPlane.constant=-FLOOR_HEIGHTS[floor];const point=new THREE.Vector3();
  const root=addObject(type,null,{record:false});
  if(raycaster.ray.intersectPlane(dragPlane,point)){root.position.x=snap(point.x);root.position.z=snap(point.z);snapOpeningToWall(root);refreshSelectionUI();pushHistory(`Dropped ${CATALOG[type].label}`);}
});
canvas.addEventListener('wheel',(event)=>{
  event.preventDefault();
  distance=THREE.MathUtils.clamp(distance*Math.exp(event.deltaY*.0012),4,70);
  updateCamera();
},{passive:false});
document.addEventListener('mousemove',(event)=>{
  if(playMode&&document.pointerLockElement===canvas){
    viewAngle-=event.movementX*.0023;
    playPitch=THREE.MathUtils.clamp(playPitch-event.movementY*.002,-1.35,1.35);
    updateCamera();
  }
});
document.addEventListener('pointerlockchange',()=>{
  if(playMode&&document.pointerLockElement!==canvas)togglePlayTest();
});
window.addEventListener('keydown',(event)=>{
  if(event.target.matches('input,select,textarea'))return;
  if((event.ctrlKey||event.metaKey)&&event.code==='KeyZ'){event.preventDefault();restoreHistory(historyIndex+(event.shiftKey?1:-1));return;}
  if((event.ctrlKey||event.metaKey)&&event.code==='KeyY'){event.preventDefault();restoreHistory(historyIndex+1);return;}
  if((event.ctrlKey||event.metaKey)&&event.code==='KeyD'){event.preventDefault();duplicateSelected();return;}
  if(event.code==='KeyF'){focusSelected();return;}
  if(event.code==='Home'){resetView();return;}
  if(event.code==='Numpad7'){viewElevation=1.8;updateCamera();return;}
  if(event.code==='KeyG'){setTransformTool('move');return;}
  if(event.code==='KeyR'&&selectedRoots.length){setTransformTool('rotate');return;}
  if(event.altKey&&event.code==='KeyS'&&selectedRoots.length){event.preventDefault();setTransformTool('scale');return;}
  if(event.code==='Escape'&&playMode){togglePlayTest();return;}
  if(['KeyW','KeyA','KeyS','KeyD','ShiftLeft','ShiftRight'].includes(event.code)){
    cameraKeys.add(event.code);
    event.preventDefault();
    return;
  }
  if(!selectedRoots.length)return;
  if(event.code==='ArrowLeft')nudgeSelection(-1,0);
  if(event.code==='ArrowRight')nudgeSelection(1,0);
  if(event.code==='ArrowUp')nudgeSelection(0,-1);
  if(event.code==='ArrowDown')nudgeSelection(0,1);
  if(event.code==='PageUp'||event.code==='PageDown'){
    const amount=Number(el('snap').value)*(event.code==='PageUp'?1:-1);
    for(const root of selectedRoots)if(!root.userData.editor?.locked)root.position.y+=amount;
    refreshSelectionUI();
    pushHistory('Changed height');
  }
  if(event.code==='Delete'||event.code==='Backspace')deleteSelected();
});
window.addEventListener('keyup',(event)=>cameraKeys.delete(event.code));
window.addEventListener('blur',()=>cameraKeys.clear());
function resize(){
  const width=canvas.clientWidth,height=canvas.clientHeight;
  if(canvas.width!==Math.floor(width*renderer.getPixelRatio())||canvas.height!==Math.floor(height*renderer.getPixelRatio())){
    renderer.setSize(width,height,false);
    camera.aspect=width/height;
    camera.updateProjectionMatrix();
  }
}
function frame(now){
  const delta=Math.min(.05,(now-lastFrame)/1000);
  lastFrame=now;
  moveCamera(delta);
  resize();
  if(primarySelection())selectionBox.setFromObject(primarySelection());
  gizmo.visible=Boolean(primarySelection())&&!playMode;
  renderer.render(scene,camera);
  requestAnimationFrame(frame);
}

updateFloorVisibility();
updateCamera();
pushHistory('Started editor',true);
updateStats();
requestAnimationFrame(frame);
window.__HOTEL_EDITOR_TEST__={
  CATALOG,serializeLayout,loadLayout,addObject,select,verifyScene,
  get floor(){return floor;},
  get objectCount(){return roots.length;},
  get selectionCount(){return selectedRoots.length;},
  get historyLength(){return history.length;},
  get cameraState(){return{target:viewTarget.toArray(),distance,angle:viewAngle,elevation:viewElevation,playMode};},
};
