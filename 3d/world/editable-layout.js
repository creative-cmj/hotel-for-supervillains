import { createCatalogObject, layoutCollider } from '../editor/catalog.js';

export async function loadEditableLayout(world, onStatus) {
  onStatus?.('Loading custom layout…');
  const url = new URL('../data/custom-layout.json', import.meta.url);
  const response = await fetch(`${url.href}?v=1`, { cache: 'no-cache' });
  if (!response.ok) throw Error(`Unable to load custom layout: ${response.status}`);
  const layout = await response.json();
  if (layout.version !== 1 || !Array.isArray(layout.objects)) throw Error('Unsupported custom layout format');
  const roots = [];
  for (const data of layout.objects) {
    const root = createCatalogObject(data.type, data);
    root.userData.hotelFloor = data.floor === 1 ? 0 : data.floor;
    root.visible = root.userData.hotelFloor === 0;
    world.scene.add(root);
    roots.push(root);
    const collider = layoutCollider(data);
    if (collider) world.colliders[root.userData.hotelFloor].push(collider);
  }
  world.editableLayout = roots;
  return roots;
}
