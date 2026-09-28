import * as THREE from '../vendor/three.module.js';

export const FLOOR_HEIGHTS = Object.freeze({ 1: 0, 2: 4.5, 3: 9 });

export const CATALOG = Object.freeze({
  wall: { label: 'Wall', category: 'Architecture', size: [4, 4.5, .22], solid: true },
  floor: { label: 'Floor Tile', category: 'Architecture', size: [4, .12, 4], solid: false },
  ceiling: { label: 'Ceiling Tile', category: 'Architecture', size: [4, .12, 4], solid: false, offsetY: 4.45 },
  column: { label: 'Gold Column', category: 'Architecture', size: [.45, 4.5, .45], solid: true },
  doorframe: { label: 'Door Frame', category: 'Architecture', size: [2.2, 3.2, .28], solid: false, builder: 'doorframe' },
  door: { label: 'Working Door Visual', category: 'Architecture', size: [1.85, 3, .16], solid: false, builder: 'door' },
  window: { label: 'Neon Window', category: 'Architecture', size: [2.5, 2.2, .16], solid: false, builder: 'window', offsetY: 1.1 },
  bed: { label: 'Luxury Bed', category: 'Furniture', size: [2.2, .8, 2.5], solid: true, builder: 'bed' },
  sofa: { label: 'Sofa', category: 'Furniture', size: [2.4, 1.05, .95], solid: true, builder: 'sofa' },
  chair: { label: 'Chair', category: 'Furniture', size: [.75, 1.05, .75], solid: true, builder: 'chair' },
  table: { label: 'Table', category: 'Furniture', size: [1.45, .82, 1.05], solid: true, builder: 'table' },
  desk: { label: 'Desk', category: 'Furniture', size: [2.1, 1.05, .8], solid: true, builder: 'desk' },
  nightstand: { label: 'Nightstand', category: 'Furniture', size: [.65, .65, .55], solid: true },
  shelf: { label: 'Shelf', category: 'Furniture', size: [1.25, 2.15, .45], solid: true, builder: 'shelf' },
  lamp: { label: 'Lamp', category: 'Props', size: [.55, 1.4, .55], solid: true, builder: 'lamp' },
  plant: { label: 'Plant', category: 'Props', size: [.7, 1.35, .7], solid: true, builder: 'plant' },
  sign: { label: 'Wall Sign', category: 'Props', size: [1.8, .65, .12], solid: false },
  luggage: { label: 'Luggage Cart', category: 'Hotel', size: [1.3, 2, .75], solid: true, builder: 'luggage' },
  reception: { label: 'Reception Desk', category: 'Hotel', size: [3.4, 1.2, 1.05], solid: true, builder: 'reception' },
  suitcase: { label: 'Villain Suitcase', category: 'Hotel', size: [.72, 1, .34], solid: true, builder: 'suitcase' },
  roomService: { label: 'Room Service Cart', category: 'Hotel', size: [1.45, 1.05, .76], solid: true, builder: 'roomService' },
  housekeeping: { label: 'Housekeeping Cart', category: 'Hotel', size: [1.55, 1.38, .72], solid: true, builder: 'housekeeping' },
  velvetRope: { label: 'Velvet Rope Barrier', category: 'Hotel', size: [2.1, 1.05, .28], solid: true, builder: 'velvetRope' },
  roomPlaque: { label: 'Gold Room Plaque', category: 'Hotel', size: [.9, .42, .1], solid: false, builder: 'roomPlaque', offsetY: 2.15 },
  wardrobe: { label: 'Luxury Wardrobe', category: 'Furniture', size: [1.45, 2.25, .68], solid: true, builder: 'wardrobe' },
  minibar: { label: 'Supervillain Minibar', category: 'Furniture', size: [1.25, 1.15, .58], solid: true, builder: 'minibar' },
  securityCamera: { label: 'Security Camera', category: 'Props', size: [.62, .42, .42], solid: false, builder: 'securityCamera', offsetY: 3.35 },
  console: { label: 'Villain Console', category: 'Villain Tech', size: [1.7, 1.25, .75], solid: true, builder: 'console' },
  emitter: { label: 'Energy Emitter', category: 'Villain Tech', size: [1.1, 1.65, 1.1], solid: true, builder: 'emitter' },
  weatherMachine: { label: 'Pocket Weather Machine', category: 'Villain Tech', size: [1.8, 2.25, 1.45], solid: true, builder: 'weatherMachine' },
  portalMirror: { label: 'Portal Mirror', category: 'Villain Tech', size: [1.45, 2.35, .42], solid: true, builder: 'portalMirror' },
  guestMarker: { label: 'Guest Placeholder', category: 'Characters', size: [.65, 1.9, .65], solid: false, builder: 'guestMarker' },
  pointLight: { label: 'Point Light', category: 'Lights', size: [.25, .25, .25], solid: false, builder: 'pointLight', offsetY: 2.8 },
  chandelier: { label: 'Lightning Chandelier', category: 'Lights', size: [1.6, 1.1, 1.6], solid: false, builder: 'chandelier', offsetY: 3.35 },
  wallSconce: { label: 'Neon Wall Sconce', category: 'Lights', size: [.42, .72, .3], solid: false, builder: 'wallSconce', offsetY: 2.35 },
});

const palette = {
  purple: 0x64258b,
  pink: 0xe84ca5,
  cyan: 0x38c9e8,
  gold: 0xd8a84e,
  black: 0x17121f,
  cream: 0xf0dfe8,
  green: 0x58b86b,
};

const material = (color, options = {}) => new THREE.MeshStandardMaterial({
  color,
  roughness: options.roughness ?? .48,
  metalness: options.metalness ?? .08,
  emissive: options.emissive ?? 0x000000,
  emissiveIntensity: options.emissiveIntensity ?? 0,
});
const materials = {
  purple: material(palette.purple),
  pink: material(palette.pink),
  cyan: material(palette.cyan, { emissive: 0x126a78, emissiveIntensity: .75 }),
  gold: material(palette.gold, { metalness: .7, roughness: .24 }),
  black: material(palette.black, { metalness: .25, roughness: .3 }),
  cream: material(palette.cream, { roughness: .72 }),
  green: material(palette.green),
};

function box(group, size, position, mat = materials.purple) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), mat);
  mesh.position.set(...position);
  group.add(mesh);
  return mesh;
}
function cylinder(group, radii, height, position, mat = materials.gold, segments = 12) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radii[0], radii[1], height, segments), mat);
  mesh.position.set(...position);
  group.add(mesh);
  return mesh;
}
function sphere(group, radius, position, mat = materials.cyan, segments = 12) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, segments, Math.max(8, segments - 4)), mat);
  mesh.position.set(...position);
  group.add(mesh);
  return mesh;
}
function torus(group, radius, tube, position, mat = materials.gold, rotation = [Math.PI / 2, 0, 0]) {
  const mesh = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 8, 20), mat);
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  group.add(mesh);
  return mesh;
}

const builders = {
  doorframe(group) {
    box(group, [.18, 3.2, .28], [-1.01, 1.6, 0], materials.gold);
    box(group, [.18, 3.2, .28], [1.01, 1.6, 0], materials.gold);
    box(group, [2.2, .18, .28], [0, 3.11, 0], materials.gold);
  },
  door(group) {
    box(group, [1.85, 3, .16], [0, 1.5, 0], materials.purple);
    box(group, [.08, 2.7, .18], [-.72, 1.5, -.02], materials.gold);
    cylinder(group, [.055, .055], .12, [.67, 1.45, -.13], materials.gold, 10).rotation.x = Math.PI / 2;
  },
  window(group) {
    box(group, [2.5, 2.2, .12], [0, 1.1, 0], materials.black);
    box(group, [2.2, 1.9, .08], [0, 1.1, -.08], materials.cyan);
    box(group, [.08, 2.05, .16], [0, 1.1, -.1], materials.gold);
  },
  bed(group) {
    box(group, [2.2, .42, 2.5], [0, .32, 0], materials.black);
    box(group, [2.05, .35, 2.15], [0, .65, .08], materials.cream);
    box(group, [2.2, 1.3, .18], [0, 1.05, 1.16], materials.purple);
    box(group, [.8, .18, .5], [-.5, .88, -.65], materials.pink);
    box(group, [.8, .18, .5], [.5, .88, -.65], materials.pink);
  },
  sofa(group) {
    box(group, [2.4, .42, .92], [0, .36, 0], materials.purple);
    box(group, [2.4, .78, .24], [0, .77, .34], materials.purple);
    box(group, [.24, .68, .92], [-1.08, .58, 0], materials.gold);
    box(group, [.24, .68, .92], [1.08, .58, 0], materials.gold);
  },
  chair(group) {
    box(group, [.7, .16, .68], [0, .52, 0], materials.pink);
    box(group, [.7, .75, .14], [0, .88, .27], materials.purple);
    for (const x of [-.25, .25]) for (const z of [-.22, .22]) box(group, [.08, .52, .08], [x, .26, z], materials.gold);
  },
  table(group) {
    box(group, [1.45, .16, 1.05], [0, .76, 0], materials.black);
    for (const x of [-.55, .55]) for (const z of [-.36, .36]) box(group, [.09, .72, .09], [x, .36, z], materials.gold);
  },
  desk(group) {
    box(group, [2.1, .16, .8], [0, .95, 0], materials.black);
    box(group, [.18, .95, .72], [-.85, .48, 0], materials.gold);
    box(group, [.18, .95, .72], [.85, .48, 0], materials.gold);
  },
  shelf(group) {
    box(group, [1.25, 2.15, .18], [0, 1.08, .14], materials.black);
    for (const y of [.15, .72, 1.29, 1.86]) box(group, [1.25, .1, .45], [0, y, 0], materials.gold);
  },
  lamp(group) {
    cylinder(group, [.18, .22], .52, [0, .26, 0], materials.gold);
    cylinder(group, [.055, .055], .62, [0, .83, 0], materials.gold, 10);
    cylinder(group, [.18, .34], .42, [0, 1.24, 0], materials.pink);
  },
  plant(group) {
    cylinder(group, [.25, .34], .48, [0, .24, 0], materials.gold);
    for (const [x, z, r] of [[0,0,0],[-.18,0,.35],[.18,.05,-.35],[0,-.15,.8]]) {
      const leaf = box(group, [.18, .75, .12], [x, .85, z], materials.green);
      leaf.rotation.z = r;
    }
  },
  luggage(group) {
    box(group, [1.15, .12, .7], [0, .18, 0], materials.gold);
    for (const x of [-.48,.48]) {
      box(group, [.08, 1.65, .08], [x, 1, .28], materials.gold);
      cylinder(group, [.09,.09], .08, [x,.07,-.25], materials.black);
    }
    box(group, [1.05, .08, .08], [0, 1.8, .28], materials.gold);
  },
  reception(group) {
    box(group, [3.4, 1.05, 1.05], [0, .525, 0], materials.black);
    box(group, [3.5, .13, 1.16], [0, 1.08, 0], materials.gold);
    box(group, [2.5, .58, .08], [0, .55, -.53], materials.purple);
    box(group, [.34, .34, .1], [0, .57, -.59], materials.cyan).rotation.z = Math.PI / 4;
  },
  suitcase(group) {
    box(group, [.72, .82, .32], [0, .45, 0], materials.purple);
    box(group, [.76, .07, .35], [0, .45, 0], materials.gold);
    box(group, [.28, .08, .08], [0, .93, 0], materials.gold);
    for (const x of [-.25,.25]) cylinder(group, [.055,.055], .08, [x,.04,0], materials.black, 8);
    box(group, [.16, .22, .04], [0, .58, -.18], materials.cyan);
  },
  wardrobe(group) {
    box(group, [1.45, 2.25, .68], [0, 1.125, 0], materials.black);
    box(group, [1.34, 2.08, .08], [0, 1.14, -.35], materials.purple);
    box(group, [.06, 2.08, .1], [0, 1.14, -.4], materials.gold);
    for (const x of [-.28,.28]) sphere(group, .055, [x,1.15,-.43], materials.gold, 8);
    box(group, [1.52, .11, .76], [0, 2.2, 0], materials.gold);
  },
  minibar(group) {
    box(group, [1.25, 1.15, .58], [0, .575, 0], materials.black);
    box(group, [1.12, .63, .07], [0, .73, -.31], materials.cyan);
    box(group, [1.32, .1, .66], [0, 1.13, 0], materials.gold);
    for (const x of [-.38,-.12,.14,.4]) {
      cylinder(group, [.06,.075], .3, [x,.62,-.37], x === .14 ? materials.pink : materials.gold, 8);
      cylinder(group, [.03,.03], .11, [x,.82,-.37], materials.cream, 8);
    }
  },
  roomService(group) {
    box(group, [1.35, .11, .72], [0, .72, 0], materials.gold);
    box(group, [1.26, .08, .66], [0, .28, 0], materials.black);
    for (const x of [-.57,.57]) for (const z of [-.26,.26]) {
      box(group, [.06, .72, .06], [x,.42,z], materials.gold);
      cylinder(group, [.09,.09], .06, [x,.07,z], materials.black, 10).rotation.z = Math.PI / 2;
    }
    cylinder(group, [.47,.52], .22, [0,.89,0], materials.cream, 20);
    sphere(group, .08, [0,1.04,0], materials.gold, 8);
  },
  housekeeping(group) {
    box(group, [1.3, .72, .65], [0, .62, 0], materials.purple);
    box(group, [1.55, .12, .72], [0, .17, 0], materials.gold);
    box(group, [.55, .58, .66], [-.46, 1.08, 0], materials.black);
    for (const z of [-.24,.24]) box(group, [.45,.08,.12], [.34,.92,z], materials.cream);
    for (const x of [-.58,.58]) for (const z of [-.27,.27]) cylinder(group, [.1,.1], .07, [x,.06,z], materials.black, 10).rotation.z = Math.PI / 2;
  },
  velvetRope(group) {
    for (const x of [-.92,.92]) {
      cylinder(group, [.13,.18], .12, [x,.06,0], materials.gold, 12);
      cylinder(group, [.045,.045], .82, [x,.51,0], materials.gold, 10);
      sphere(group, .11, [x,.96,0], materials.gold, 10);
    }
    const rope = cylinder(group, [.055,.055], 1.78, [0,.82,0], materials.pink, 12);
    rope.rotation.z = Math.PI / 2;
  },
  roomPlaque(group) {
    box(group, [.9, .42, .08], [0, .21, 0], materials.black);
    box(group, [.82, .34, .04], [0, .21, -.06], materials.gold);
    const bolt = box(group, [.12,.26,.035], [-.05,.23,-.09], materials.purple); bolt.rotation.z = -.35;
    const bolt2 = box(group, [.12,.23,.035], [.07,.13,-.09], materials.purple); bolt2.rotation.z = -.35;
  },
  securityCamera(group) {
    box(group, [.18,.18,.26], [0,.1,.11], materials.gold);
    const body = box(group, [.48,.27,.28], [0,.05,-.16], materials.cream); body.rotation.x = -.12;
    cylinder(group, [.11,.13], .09, [0,.04,-.34], materials.black, 12).rotation.x = Math.PI / 2;
    sphere(group, .055, [0,.04,-.4], materials.cyan, 8);
    box(group, [.08,.35,.08], [0,-.12,.2], materials.gold).rotation.x = -.4;
  },
  console(group) {
    box(group, [1.7, .8, .75], [0, .4, 0], materials.black);
    const screen = box(group, [1.35, .62, .08], [0, 1.0, -.25], materials.cyan);
    screen.rotation.x = -.28;
  },
  emitter(group) {
    cylinder(group, [.5, .62], .38, [0, .19, 0], materials.gold);
    cylinder(group, [.32, .42], .72, [0, .72, 0], materials.black);
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(.42), materials.cyan);
    core.position.y = 1.38;
    group.add(core);
  },
  weatherMachine(group) {
    box(group, [1.65,.3,1.3], [0,.15,0], materials.gold);
    box(group, [1.45,.82,1.14], [0,.7,0], materials.black);
    box(group, [1.12,.52,.07], [0,.78,-.61], materials.cyan);
    for (const x of [-.48,0,.48]) {
      cylinder(group, [.07,.07], .78, [x,1.48,0], materials.gold, 10);
      torus(group, .18, .045, [x,1.46,0], x === 0 ? materials.pink : materials.cyan, [0,0,0]);
      sphere(group, .13, [x,1.91,0], x === 0 ? materials.pink : materials.cyan, 10);
    }
    for (const x of [-.5,0,.5]) sphere(group, .055, [x,.58,-.67], x === 0 ? materials.pink : materials.gold, 8);
  },
  portalMirror(group) {
    box(group, [1.45,.18,.42], [0,.09,0], materials.gold);
    cylinder(group, [.12,.12], 1.8, [-.62,1.05,0], materials.gold, 10);
    cylinder(group, [.12,.12], 1.8, [.62,1.05,0], materials.gold, 10);
    torus(group, .62, .1, [0,1.78,0], materials.gold, [0,0,0]);
    const portal = new THREE.Mesh(new THREE.CircleGeometry(.52, 24), materials.cyan);
    portal.position.set(0,1.78,-.08);
    group.add(portal);
    box(group, [1.05,1.35,.08], [0,.92,-.06], materials.cyan);
  },
  guestMarker(group) {
    cylinder(group, [.28, .34], 1.15, [0, .78, 0], materials.purple, 12);
    const head = new THREE.Mesh(new THREE.SphereGeometry(.31, 12, 8), materials.cream);
    head.position.y = 1.58;
    group.add(head);
    box(group, [.72, .1, .25], [0, .12, 0], materials.gold);
  },
  pointLight(group) {
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(.14, 12, 8), materials.cyan);
    group.add(bulb);
    const light = new THREE.PointLight(0x55ddff, 5, 9, 2);
    light.name = 'EDITOR_POINT_LIGHT';
    group.add(light);
  },
  chandelier(group) {
    cylinder(group, [.045,.045], .52, [0,.78,0], materials.gold, 10);
    torus(group, .62, .055, [0,.48,0], materials.gold);
    for (let i=0;i<8;i++) {
      const angle=(i/8)*Math.PI*2,x=Math.cos(angle)*.62,z=Math.sin(angle)*.62;
      cylinder(group,[.035,.035],.28,[x,.3,z],materials.gold,8);
      sphere(group,.11,[x,.12,z],i%2?materials.pink:materials.cyan,10);
    }
    const light = new THREE.PointLight(0xffb7df, 5.5, 11, 2);
    light.position.y = .15;
    light.name = 'EDITOR_POINT_LIGHT';
    group.add(light);
  },
  wallSconce(group) {
    box(group,[.22,.55,.12],[0,.26,.08],materials.gold);
    box(group,[.08,.15,.22],[0,.25,-.08],materials.gold).rotation.x=-.45;
    const shade=cylinder(group,[.13,.24],.3,[0,.12,-.23],materials.pink,12); shade.rotation.x=Math.PI/2;
    sphere(group,.08,[0,.1,-.4],materials.cyan,10);
    const light=new THREE.PointLight(0x61dfff,3.2,6,2);light.position.set(0,.1,-.42);light.name='EDITOR_POINT_LIGHT';group.add(light);
  },
};

export function createCatalogObject(type, data = {}) {
  const definition = CATALOG[type];
  if (!definition) throw Error(`Unknown editor object type: ${type}`);
  const group = new THREE.Group();
  group.name = data.id || `layout-${type}`;
  if (definition.builder) builders[definition.builder](group);
  else box(group, definition.size, [0, definition.size[1] / 2, 0], type === 'column' ? materials.gold : type === 'floor' || type === 'ceiling' ? materials.cream : materials.purple);
  const floor = Number(data.floor || 1);
  const position = data.position || [0, FLOOR_HEIGHTS[floor] + (definition.offsetY || 0), 0];
  group.position.set(...position);
  group.rotation.y = THREE.MathUtils.degToRad(Number(data.rotationY || 0));
  group.scale.set(...(data.scale || [1, 1, 1]));
  group.userData.layout = { id: group.name, type, floor, solid: definition.solid };
  group.traverse((child) => {
    if (child.isMesh) {
      if (data.material) {
        child.material = child.material.clone();
        if (data.material.color) child.material.color?.set(data.material.color);
        if (data.material.emission) child.material.emissive?.set(data.material.emission);
        if (Number.isFinite(data.material.roughness)) child.material.roughness = data.material.roughness;
        if (Number.isFinite(data.material.metalness)) child.material.metalness = data.material.metalness;
      }
      child.castShadow = false;
      child.receiveShadow = true;
      child.userData.editorRoot = group;
    }
    if (child.isPointLight && data.light) {
      child.intensity = Number(data.light.intensity ?? child.intensity);
      child.distance = Number(data.light.range ?? child.distance);
      child.castShadow = Boolean(data.light.shadow);
    }
  });
  return group;
}

export function layoutCollider(data) {
  const definition = CATALOG[data.type];
  if (!definition?.solid) return null;
  const scale = data.scale || [1, 1, 1];
  const quarterTurn = Math.abs(Math.round(Number(data.rotationY || 0) / 90)) % 2 === 1;
  const width = definition.size[quarterTurn ? 2 : 0] * Math.abs(scale[quarterTurn ? 2 : 0]);
  const depth = definition.size[quarterTurn ? 0 : 2] * Math.abs(scale[quarterTurn ? 0 : 2]);
  return {
    minX: data.position[0] - width / 2,
    maxX: data.position[0] + width / 2,
    minZ: data.position[2] - depth / 2,
    maxZ: data.position[2] + depth / 2,
    editableLayoutId: data.id,
  };
}

export function serializeObject(group) {
  return {
    id: group.userData.layout.id,
    type: group.userData.layout.type,
    floor: group.userData.layout.floor,
    position: [group.position.x, group.position.y, group.position.z].map((value) => Number(value.toFixed(3))),
    rotationY: Number(THREE.MathUtils.radToDeg(group.rotation.y).toFixed(1)),
    scale: [group.scale.x, group.scale.y, group.scale.z].map((value) => Number(value.toFixed(3))),
  };
}
