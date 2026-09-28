import { GLTFLoader } from '../vendor/addons/loaders/GLTFLoader.js';

const loader = new GLTFLoader();

function shadows(root) {
  root.userData.ignoreCameraCollision = true;
  root.traverse((node) => {
    if (!node.isMesh) return;
    node.castShadow = true;
    node.receiveShadow = true;
  });
}

async function load(url) {
  const gltf = await loader.loadAsync(url);
  shadows(gltf.scene);
  return gltf.scene;
}

function hideLegacyCharacter(group, keep) {
  for (const child of group.children) {
    if (child !== keep) child.visible = false;
  }
}

function cloneNamed(source, prefix) {
  const group = new source.constructor();
  group.name = `${prefix}_GAME_ROOT`;
  const match = source.getObjectByName(prefix);
  if (match) group.add(match.clone(true));
  return group;
}

export async function loadWorldAssets(world) {
  const [desk, manager, drizzle, pack] = await Promise.all([
    load('./assets/reception_desk.glb'),
    load('./assets/manager.glb'),
    load('./assets/doctor_drizzle.glb'),
    load('./assets/final_interior_pack.glb'),
  ]);

  world.legacyDesk.forEach((mesh) => { mesh.visible = false; });
  desk.name = 'RECEPTION_DESK_GAME_ASSET';
  desk.position.set(5, 0, -6);
  world.scene.add(desk);

  hideLegacyCharacter(world.avatar, world.heldBattery);
  manager.name = 'MANAGER_GAME_ASSET';
  world.avatar.add(manager);

  hideLegacyCharacter(world.drizzle);
  drizzle.name = 'DOCTOR_DRIZZLE_GAME_ASSET';
  world.drizzle.add(drizzle);

  const floorThree = new pack.constructor();
  floorThree.name = 'FLOOR3_SPECIAL_ROOM_ASSETS';
  const roomRoots = [
    'ROOM_301_COLD_CLIMATE_MODULE', 'ROOM_302_TECHNOLOGY_MODULE',
    'ROOM_303_BOTANICAL_MODULE', 'ROOM_304_LUXURY_FLEXIBLE_MODULE',
    'ROOM_305_REINFORCED_MODULE', 'ROOM_306_ACOUSTIC_ILLUSION_MODULE',
    'ROOM_307_WEATHER_INSTRUMENTS_MODULE', 'ROOM_308_CONTAINMENT_MODULE',
    'ROOM_309_GRAVITY_COSMIC_MODULE', 'ROOM_310_HIGH_SECURITY_MODULE',
    'FLOOR3_SECURITY_AND_SUPPORT',
  ];
  for (const name of roomRoots) {
    const root = pack.getObjectByName(name);
    if (root) floorThree.add(root.clone(true));
  }
  floorThree.position.set(7, 0, -19);
  world.scene.add(floorThree);

  const ambience = cloneNamed(pack, 'HOTEL_AMBIENT_PROPS');
  ambience.position.set(7.5, 0, 11.4);
  world.scene.add(ambience);

  return { desk, manager, drizzle, floorThree, ambience };
}
