import * as THREE from '../vendor/three.module.js';

const materialCache = new Map();
const geometryCache = new Map();
const mat = (color, metalness = .08, roughness = .56, emissive = 0x000000) => {
  const key = `${color}-${metalness}-${roughness}-${emissive}`;
  if (!materialCache.has(key)) materialCache.set(key, new THREE.MeshStandardMaterial({ color, metalness, roughness, emissive, emissiveIntensity: emissive ? .75 : 0 }));
  return materialCache.get(key);
};
const geometry = (key, build) => {
  if (!geometryCache.has(key)) geometryCache.set(key, build());
  return geometryCache.get(key);
};
const boxGeo = (x,y,z) => geometry(`box-${x}-${y}-${z}`, () => new THREE.BoxGeometry(x,y,z));
const sphereGeo = (r=1) => geometry(`sphere-${r}`, () => new THREE.SphereGeometry(r, 12, 8));
const cylinderGeo = (a,b,h,segments=10) => geometry(`cylinder-${a}-${b}-${h}-${segments}`, () => new THREE.CylinderGeometry(a,b,h,segments));
const coneGeo = (r,h,segments=10) => geometry(`cone-${r}-${h}-${segments}`, () => new THREE.ConeGeometry(r,h,segments));
const torusGeo = (r,tube) => geometry(`torus-${r}-${tube}`, () => new THREE.TorusGeometry(r,tube,8,20));
const octaGeo = (r) => geometry(`octa-${r}`, () => new THREE.OctahedronGeometry(r));
const dodecaGeo = (r) => geometry(`dodeca-${r}`, () => new THREE.DodecahedronGeometry(r,0));

function mesh(group, geo, material, name, position=[0,0,0], scale=[1,1,1], rotation=[0,0,0]) {
  const result = new THREE.Mesh(geo, material);
  result.name = name;
  result.position.set(...position);
  result.scale.set(...scale);
  result.rotation.set(...rotation);
  result.castShadow = false;
  result.receiveShadow = true;
  group.add(result);
  return result;
}
function limb(group, name, from, to, radius, material) {
  const start = new THREE.Vector3(...from), end = new THREE.Vector3(...to);
  const center = start.clone().add(end).multiplyScalar(.5);
  const result = mesh(group, cylinderGeo(radius,radius,start.distanceTo(end)+radius*.55,10), material, name, center.toArray());
  result.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), end.clone().sub(start).normalize());
  return result;
}
function proportions(archetype) {
  const map = {
    tall:{height:2.45,torsoW:.62,torsoH:.95,depth:.38,head:.27,leg:.78}, round:{height:1.82,torsoW:.92,torsoH:.82,depth:.56,head:.31,leg:.44}, athletic:{height:2.15,torsoW:.78,torsoH:.82,depth:.42,head:.28,leg:.68}, wide:{height:2.12,torsoW:1.02,torsoH:.78,depth:.48,head:.28,leg:.62}, elegant:{height:2.3,torsoW:.68,torsoH:.94,depth:.4,head:.27,leg:.72}, average:{height:2.08,torsoW:.68,torsoH:.78,depth:.4,head:.29,leg:.65}, tiny:{height:1.55,torsoW:.48,torsoH:.5,depth:.36,head:.43,leg:.38}, skinny:{height:2.5,torsoW:.48,torsoH:1.02,depth:.32,head:.26,leg:.83}, slouch:{height:1.9,torsoW:.7,torsoH:.73,depth:.43,head:.31,leg:.55}, blocky:{height:2.0,torsoW:.78,torsoH:.78,depth:.45,head:.3,leg:.57}, slime:{height:1.72,torsoW:.94,torsoH:.82,depth:.62,head:.35,leg:.3}, cape:{height:2.18,torsoW:.7,torsoH:.86,depth:.42,head:.3,leg:.64}, rigid:{height:2.15,torsoW:.62,torsoH:.88,depth:.36,head:.28,leg:.68}, floating:{height:2.18,torsoW:.78,torsoH:.9,depth:.48,head:.3,leg:.46}, broad:{height:2.18,torsoW:.96,torsoH:.78,depth:.46,head:.29,leg:.65}, wrapped:{height:2.22,torsoW:.67,torsoH:.86,depth:.4,head:.29,leg:.7}, asymmetric:{height:2.2,torsoW:.78,torsoH:.84,depth:.44,head:.3,leg:.66}, hooded:{height:2.42,torsoW:.78,torsoH:1.04,depth:.46,head:.28,leg:.67}, regal:{height:2.38,torsoW:.72,torsoH:.94,depth:.42,head:.28,leg:.73}, lopsided:{height:1.82,torsoW:.64,torsoH:.68,depth:.42,head:.34,leg:.5}, barrel:{height:1.85,torsoW:.9,torsoH:.82,depth:.53,head:.3,leg:.43}, faceless:{height:2.32,torsoW:.65,torsoH:1.0,depth:.4,head:.29,leg:.64}, soft:{height:1.72,torsoW:.82,torsoH:.73,depth:.5,head:.33,leg:.4}, armored:{height:2.2,torsoW:.98,torsoH:.84,depth:.5,head:.28,leg:.62}, bubble:{height:1.92,torsoW:.88,torsoH:.78,depth:.56,head:.33,leg:.47}, rock:{height:2.34,torsoW:1.18,torsoH:.92,depth:.62,head:.31,leg:.61}, boss:{height:2.78,torsoW:1.28,torsoH:1.12,depth:.64,head:.2,leg:.78},
  };
  return map[archetype] || map.average;
}
function headGeometry(shape, radius) {
  if (['square','block','tiny','split'].includes(shape)) return boxGeo(radius*1.65,radius*1.55,radius*1.5);
  if (shape === 'long') return sphereGeo(radius);
  if (shape === 'triangle' || shape === 'wedge') return coneGeo(radius*.92,radius*1.8,6);
  if (shape === 'cylinder') return cylinderGeo(radius*.82,radius*.82,radius*1.7,12);
  if (shape === 'diamond') return octaGeo(radius*1.12);
  return sphereGeo(radius);
}
function makeHand(parent, side, position, style, primary, accent) {
  const hand = new THREE.Group();
  hand.name = `HAND_${side < 0 ? 'L' : 'R'}`;
  hand.position.set(...position);
  parent.add(hand);
  if (style === 'claw' || style === 'mechanical') {
    mesh(hand, boxGeo(.16,.18,.13), accent, 'PALM');
    for (const z of [-.06,.06]) {
      const finger=mesh(hand, cylinderGeo(.025,.035,.19,7), primary, `CLAW_${z}`, [side*.12,-.03,z]);
      finger.rotation.z=Math.PI/2;
    }
  } else if (style === 'stoneFist' || style === 'giantGlove') {
    mesh(hand, dodecaGeo(style === 'giantGlove' ? .2 : .16), primary, 'FIST');
  } else if (style === 'energy') {
    mesh(hand, octaGeo(.14), mat(0x66eaff,.15,.2,0x176b87), 'ENERGY_HAND');
  } else if (style === 'vine' || style === 'slime' || style === 'shadow') {
    mesh(hand, sphereGeo(.13), primary, 'PALM', [0,0,0], [1,.72,1]);
    for (const z of [-.065,0,.065]) limb(hand, `FINGER_${z}`, [side*.03,-.02,z],[side*.17,-.07,z],.022,primary);
  } else {
    const size = style === 'ovenMitt' || style === 'mitten' ? .15 : .125;
    mesh(hand, sphereGeo(size), primary, 'PALM', [0,0,0], [1,.86,.72]);
    if (!['mitten','ovenMitt'].includes(style)) for (const z of [-.055,0,.055]) limb(hand, `FINGER_${z}`, [side*.02,-.04,z],[side*.12,-.08,z],.018,primary);
  }
  return hand;
}
function addFace(group, definition, center, radius, faceDepth, skinMat) {
  const face = new THREE.Group(); face.name='FACE'; face.position.set(center[0],center[1],center[2]-faceDepth); group.add(face);
  const white=mat(0xf8f1e8,0,.72), dark=mat(0x15111c,0,.45), mouthMat=mat(0x54162f,0,.6);
  let leftX=-radius*.34,rightX=radius*.34,eyeY=radius*.12,leftScale=[1,1,1],rightScale=[1,1,1],pupilLX=0,pupilRX=0,mouthW=radius*.68,mouthY=-radius*.35,mouthRot=0;
  switch(definition.expression){
    case 'sideEye': pupilLX=pupilRX=radius*.11; leftScale=[1.15,.78,.42];rightScale=[1.15,.78,.42];mouthW*=.8;break;
    case 'sleepy': leftScale=rightScale=[1.1,.28,.4];mouthRot=.08;break;
    case 'shocked': leftScale=rightScale=[1.35,1.45,.45];mouthW*=.35;break;
    case 'confused': leftScale=[1.25,1.25,.4];rightScale=[.8,.75,.4];mouthRot=.25;break;
    case 'tinyAngry': leftScale=rightScale=[.68,.48,.35];eyeY=radius*.18;mouthRot=0;break;
    case 'blank': leftScale=rightScale=[.82,.82,.38];mouthW*=.45;break;
    case 'lost': leftScale=[1.4,1.35,.4];rightScale=[.72,.72,.4];mouthRot=-.2;break;
    case 'unimpressed': leftScale=rightScale=[1.12,.3,.4];mouthW*=.75;break;
    case 'worried': leftScale=rightScale=[1.18,1.28,.4];mouthRot=.12;break;
    case 'mismatched': leftScale=[.7,1.3,.4];rightScale=[1.4,.55,.4];pupilRX=radius*.08;break;
    case 'maniac': leftScale=rightScale=[1.4,1.4,.4];mouthW*=1.25;break;
    case 'evilHappy': leftScale=rightScale=[.9,.9,.4];mouthW*=1.2;break;
  }
  for (const [x,scale,pupil] of [[leftX,leftScale,pupilLX],[rightX,rightScale,pupilRX]]) {
    mesh(face,sphereGeo(radius*.19),white,`EYE_${x<0?'L':'R'}`,[x,eyeY,0],scale);
    mesh(face,sphereGeo(radius*.075),dark,`PUPIL_${x<0?'L':'R'}`,[x+pupil,eyeY,-radius*.16],[1,1,.5]);
  }
  const mouth=mesh(face,boxGeo(mouthW,radius*.075,radius*.055),mouthMat,'MOUTH',[0,mouthY,-radius*.03]); mouth.rotation.z=mouthRot;
  if (['smug','grin','happy','evilHappy','maniac','proud'].includes(definition.expression)) {
    const tooth=mesh(face,boxGeo(mouthW*.75,radius*.1,radius*.06),white,'TEETH',[0,mouthY+.015,-radius*.055]); tooth.rotation.z=mouthRot;
  }
  const browTilt = ['angry','tinyAngry','stern','tryingHard'].includes(definition.expression) ? .28 : definition.expression==='worried' ? -.24 : 0;
  for(const side of [-1,1]) { const brow=mesh(face,boxGeo(radius*.34,radius*.045,radius*.04),dark,`BROW_${side<0?'L':'R'}`,[side*radius*.33,eyeY+radius*.28,-radius*.12]);brow.rotation.z=side*browTilt; }
  return face;
}
function addCape(group, p, material, wide=1) {
  const cape=mesh(group,boxGeo(p.torsoW*wide,p.torsoH*1.15,.07),material,'CAPE',[0,p.leg+p.torsoH*.53,p.depth*.62]);
  cape.rotation.x=-.08;
}
function addAccessory(group, definition, p, headY, materials) {
  const [primary,secondary,accent,skin]=materials;
  const top=headY+p.head*.9;
  const front=-p.depth*.7;
  switch(definition.accessories[0]) {
    case 'stormPack':
      boxAccessory(group,[p.torsoW*.9,.66,.22],[0,p.leg+p.torsoH*.5,p.depth*.66],secondary,'STORM_PACK');
      for(const x of [-.28,.28]){const rod=mesh(group,cylinderGeo(.035,.035,.65,8),accent,'LIGHTNING_ROD',[x,top+.2,0]);rod.rotation.z=x>0?.18:-.18;sphere(group,.07,[x+(x>0?.06:-.06),top+.52,0],secondary,'ROD_GLOW');}
      break;
    case 'parkaHood': torus(group,p.head*1.18,p.head*.2,[0,headY,0],primary,'FUR_HOOD',[0,0,0]); for(const x of [-.55,.55])sphere(group,.17,[x*p.torsoW,p.leg+p.torsoH*.7,0],secondary,'PUFF'); break;
    case 'flameHair': for(let i=0;i<5;i++){const flame=mesh(group,coneGeo(.13+i*.012,.44+i*.05,7),i%2?accent:primary,`FLAME_${i}`,[(i-2)*.12,top+.18+(i%2)*.09,0]);flame.rotation.z=(i-2)*-.08;}break;
    case 'batteryPacks': for(const x of [-.62,.62]){boxAccessory(group,[.26,.58,.32],[x*p.torsoW,p.leg+p.torsoH*.55,0],secondary,'BATTERY_PACK');for(const z of [-.08,.08])mesh(group,cylinderGeo(.035,.035,.1,8),accent,'BATTERY_TERMINAL',[x*p.torsoW,p.leg+p.torsoH*.88,z]);}break;
    case 'vineCrown': for(let i=0;i<7;i++){const a=(i/7)*Math.PI*2;sphere(group,.09,[Math.cos(a)*p.head*.85,top+Math.sin(a)*.08,Math.sin(a)*p.head*.45],i%2?primary:secondary,'FLOWER');}addCape(group,p,primary,.9);break;
    case 'bufferHalo': torus(group,p.head*1.25,.045,[0,top+.18,0],secondary,'BUFFER_HALO',[Math.PI/2,0,0]);for(let i=0;i<4;i++)boxAccessory(group,[.12,.12,.04],[(i-1.5)*.16,top+.18,0],i<3?secondary:accent,`LOAD_${i}`);break;
    case 'blastGoggles': for(const x of [-.18,.18])torus(group,.14,.045,[x,headY+.08,front-.07],accent,'GOGGLE',[0,0,0]);for(let i=0;i<7;i++){const spike=mesh(group,coneGeo(.09,.5,7),primary,`HAIR_${i}`,[(i-3)*.1,top+.2+Math.abs(i-3)*.04,.08]);spike.rotation.z=(i-3)*.14;}break;
    case 'monocleCape': torus(group,.13,.025,[p.head*.32,headY+.04,front-.09],accent,'MONOCLE',[0,0,0]);addCape(group,p,primary,1.25);boxAccessory(group,[p.torsoW*1.05,.35,.28],[0,p.leg+p.torsoH*.88,0],secondary,'HIGH_COLLAR');break;
    case 'coffeeMug': boxAccessory(group,[.22,.24,.2],[-p.torsoW*.72,p.leg+p.torsoH*.18,-.1],primary,'COFFEE_MUG');torus(group,.1,.025,[-p.torsoW*.84,p.leg+p.torsoH*.2,-.1],accent,'MUG_HANDLE',[0,Math.PI/2,0]);break;
    case 'keysClipboard': boxAccessory(group,[.38,.52,.06],[p.torsoW*.7,p.leg+p.torsoH*.35,-.12],accent,'CLIPBOARD');for(let i=0;i<4;i++)mesh(group,boxGeo(.04,.18,.025),secondary,`KEY_${i}`,[-p.torsoW*.5+i*.06,p.leg+p.torsoH*.15,front]);break;
    case 'slimeCrown': for(const x of [-.2,0,.2])mesh(group,coneGeo(.09,x===0?.32:.24,6),accent,'CROWN_POINT',[x,top+.12,0]);break;
    case 'magicianHat': mesh(group,cylinderGeo(p.head*.62,p.head*.78,.55,12),primary,'TOP_HAT',[0,top+.26,0]);mesh(group,cylinderGeo(p.head*1.0,p.head*1.0,.07,16),accent,'HAT_BRIM',[0,top,0]);for(const x of [-.55,.55])sphere(group,.11,[x*p.torsoW,headY+.1,0],secondary,'QUESTION_ORB');break;
    case 'calculator': boxAccessory(group,[.32,.42,.08],[p.torsoW*.7,p.leg+p.torsoH*.35,front],primary,'CALCULATOR');for(let x=-1;x<=1;x++)for(let y=0;y<3;y++)sphere(group,.022,[p.torsoW*.7+x*.07,p.leg+p.torsoH*.25+y*.08,front-.06],accent,'BUTTON');break;
    case 'orbitObjects': for(let i=0;i<5;i++){const a=(i/5)*Math.PI*2;const object=mesh(group,i%2?octaGeo(.09):boxGeo(.13,.05,.08),i%2?accent:secondary,`ORBIT_${i}`,[Math.cos(a)*.75,headY+Math.sin(a)*.45,Math.sin(a)*.35]);object.rotation.z=a;}break;
    case 'headphones': torus(group,p.head*1.05,.07,[0,headY+.06,0],primary,'HEADPHONES',[0,0,0]);for(const x of [-.42,.42])boxAccessory(group,[.16,.34,.16],[x*p.head/.3,headY,0],secondary,'EARPHONE');for(const x of [-.62,.62])boxAccessory(group,[.3,.48,.42],[x*p.torsoW,p.leg+p.torsoH*.6,0],primary,'SPEAKER');break;
    case 'sandGoggles': boxAccessory(group,[p.head*1.45,.18,.08],[0,headY+.08,front-.07],secondary,'SAND_GOGGLES');addCape(group,p,accent,.82);break;
    case 'glitchPanels': for(const [x,y,s] of [[-.5,.75,1],[.55,.45,.7],[-.42,.2,.55]])boxAccessory(group,[.24*s,.18*s,.05],[x*p.torsoW,p.leg+y*p.torsoH,front],x>0?primary:secondary,'GLITCH_PANEL');mesh(group,coneGeo(.06,.42,6),accent,'ANTENNA',[.16,top+.18,0]);break;
    case 'shadowHood': mesh(group,coneGeo(p.head*1.45,p.head*2.3,12),primary,'SHADOW_HOOD',[0,headY+.08,.04]);addCape(group,p,primary,1.3);break;
    case 'goldCrown': for(let i=-2;i<=2;i++)mesh(group,coneGeo(.07,.24+(.12*Math.abs(i%2)),6),accent,'CROWN_POINT',[i*.12,top+.15,0]);addCape(group,p,primary,1.15);for(const x of [-.48,.48])sphere(group,.1,[x*p.torsoW,headY-.2,front],secondary,'JEWEL');break;
    case 'brokenDrone': boxAccessory(group,[.38,.18,.3],[p.torsoW*.8,headY+.25,0],secondary,'BROKEN_DRONE');for(const z of [-.22,.22])torus(group,.1,.025,[p.torsoW*.8,headY+.28,z],accent,'DRONE_ROTOR',[Math.PI/2,0,0]);break;
    case 'pigeonCrown': for(let i=-2;i<=2;i++)mesh(group,coneGeo(.07,.22,5),accent,'CROWN_POINT',[i*.11,top+.12,0]);const bird=mesh(group,sphereGeo(.16),secondary,'PIGEON',[p.torsoW*.72,headY+.1,0],[1.25,.8,.8]);mesh(group,coneGeo(.07,.18,5),accent,'BEAK',[p.torsoW*.88,headY+.1,-.1],[1,1,1],[Math.PI/2,0,0]);break;
    case 'chefHat': for(const x of [-.18,0,.18])sphere(group,.22,[x,top+.22,0],skin,'CHEF_HAT_PUFF');boxAccessory(group,[.58,.28,.42],[0,top,0],skin,'CHEF_HAT_BAND');break;
    case 'couponCape': addCape(group,p,secondary,1.15);for(let i=0;i<8;i++)boxAccessory(group,[.16,.25,.02],[(i%4-1.5)*.18,p.leg+.2+Math.floor(i/4)*.28,p.depth*.68],i%2?accent:skin,`COUPON_${i}`);break;
    case 'phantomDoor': boxAccessory(group,[.08,1.25,.5],[p.torsoW*.72,p.leg+p.torsoH*.45,.1],primary,'PHANTOM_DOOR');for(let i=0;i<5;i++)boxAccessory(group,[.05,.15,.025],[(i-2)*.11,top+.18,0],accent,`KEY_HALO_${i}`);break;
    case 'pillowCape': addCape(group,p,primary,1.15);boxAccessory(group,[.58,.32,.18],[p.torsoW*.72,p.leg+p.torsoH*.28,-.1],skin,'EVIL_PILLOW');mesh(group,coneGeo(.3,.58,10),secondary,'NIGHT_CAP',[0,top+.2,0],[1,1,1],[0,0,.35]);break;
    case 'magnets': for(const x of [-.62,.62]){torus(group,.22,.07,[x*p.torsoW,p.leg+p.torsoH*.65,0],x<0?primary:secondary,'MAGNET',[0,0,0]);}for(let i=0;i<5;i++)boxAccessory(group,[.04,.3,.025],[(i-2)*.11,p.leg+p.torsoH*.35,front],accent,`CUTLERY_${i}`);break;
    case 'bubbleTank':
      for(const x of [-.25,.25])cylinder(group,.14,.42,[x,p.leg+p.torsoH*.55,p.depth*.75],secondary,'BUBBLE_TANK');
      for(const rotation of [[0,0,0],[Math.PI/2,0,0],[0,Math.PI/2,0]]) torus(group,p.head*1.35,.025,[0,headY,0],mat(0x9eeeff,.25,.22,0x174958),'BUBBLE_HELMET_RING',rotation);
      break;
    case 'concreteShoulders': for(const x of [-.6,.6])mesh(group,dodecaGeo(.34),primary,'STONE_SHOULDER',[x*p.torsoW,p.leg+p.torsoH*.78,0]);for(let i=-2;i<=2;i++)mesh(group,boxGeo(.06,.32,.06),accent,'REBAR_CROWN',[i*.12,top+.17,0]);break;
    case 'spyTie': boxAccessory(group,[.12,.62,.025],[0,p.leg+p.torsoH*.48,front],secondary,'SPY_TIE');boxAccessory(group,[.55,.34,.18],[p.torsoW*.72,p.leg+p.torsoH*.2,0],primary,'BRIEFCASE');break;
    case 'finalHorns': for(const side of [-1,1]){const horn=mesh(group,coneGeo(.16,.72,8),accent,'DOOM_HORN',[side*p.head*.75,top+.28,0]);horn.rotation.z=side*.45;}addCape(group,p,primary,1.35);break;
  }
}
function boxAccessory(group,size,position,material,name){return mesh(group,boxGeo(...size),material,name,position);}
function sphere(group,r,position,material,name='SPHERE'){return mesh(group,sphereGeo(r),material,name,position);}
function cylinder(group,r,h,position,material,name='CYLINDER'){return mesh(group,cylinderGeo(r,r,h,10),material,name,position);}
function torus(group,r,tube,position,material,name='TORUS',rotation=[Math.PI/2,0,0]){return mesh(group,torusGeo(r,tube),material,name,position,[1,1,1],rotation);}

export function createVillainCharacter(definition, options = {}) {
  const p=proportions(definition.archetype);
  const group=new THREE.Group();group.name=`VILLAIN_${definition.id.toUpperCase()}`;group.userData.villain=definition;
  const primary=mat(definition.colors[0],definition.archetype==='armored'||definition.archetype==='boss' ? .45 : .08,.48);
  const secondary=mat(definition.colors[1],.12,.45,definition.archetype==='glitch'?definition.colors[1]:0);
  const accent=mat(definition.colors[2],.55,.28);
  const skinColor=definition.archetype==='slime'?definition.colors[0]:definition.archetype==='rock'?0x858992:definition.archetype==='robot'?0xaeb8c7:0xc98b70;
  const skin=mat(skinColor,definition.archetype==='rock'?.18:.02,.68);
  const hipY=.32+p.leg;
  const torsoY=hipY+p.torsoH*.46;
  const torsoGeo = definition.archetype==='rock'?dodecaGeo(.6):definition.archetype==='slime'?sphereGeo(.55):definition.archetype==='boss'||definition.archetype==='armored'||definition.archetype==='blocky'?boxGeo(1,1,1):sphereGeo(.5);
  const torso=mesh(group,torsoGeo,primary,'TORSO',[0,torsoY,0],[p.torsoW/(definition.archetype==='rock'?.95:1),p.torsoH/(definition.archetype==='slime'?.9:1),p.depth/.5]);
  mesh(group,cylinderGeo(p.torsoW*.46,p.torsoW*.5,.18,10),accent,'HIPS',[0,hipY,0]);
  const legSpread=p.torsoW*.24;
  for(const side of [-1,1]){
    const hip=[side*legSpread,hipY-.03,0],knee=[side*legSpread*.95,.34+p.leg*.48,side*.015],ankle=[side*legSpread,.18,.015];
    limb(group,`LEG_${side<0?'L':'R'}_UPPER`,hip,knee,definition.archetype==='rock'?.15:.105,primary);
    limb(group,`LEG_${side<0?'L':'R'}_LOWER`,knee,ankle,definition.archetype==='rock'?.14:.095,secondary);
    mesh(group,definition.archetype==='rock'?dodecaGeo(.18):boxGeo(.26,.18,.42),definition.archetype==='rock'?skin:accent,`FOOT_${side<0?'L':'R'}`,[side*legSpread,.1,-.1]);
  }
  const shoulderY=hipY+p.torsoH*.78, shoulderX=p.torsoW*.52;
  const armEntries=[];
  for(const side of [-1,1]){
    const shoulder=[side*shoulderX,shoulderY,0],elbow=[side*(shoulderX+.12),shoulderY-.4,definition.archetype==='lopsided'&&side>0?.12:0],wrist=[side*(shoulderX+.08),shoulderY-.72,-.02];
    const upper=limb(group,`ARM_${side<0?'L':'R'}_UPPER`,shoulder,elbow,definition.archetype==='boss'||definition.archetype==='rock'?.16:.095,primary);
    const lower=limb(group,`ARM_${side<0?'L':'R'}_LOWER`,elbow,wrist,definition.archetype==='boss'||definition.archetype==='rock'?.145:.085,secondary);
    const hand=makeHand(group,side,[wrist[0],wrist[1]-.08,wrist[2]],definition.handStyle,skin,accent);
    armEntries.push({side,upper,lower,hand});
  }
  const neckY=hipY+p.torsoH*.92;
  mesh(group,cylinderGeo(p.head*.28,p.head*.31,.2,10),skin,'NECK',[0,neckY+.03,0]);
  const headY=neckY+p.head*.82;
  const headScale=definition.headShape==='long'?[.78,1.35,.82]:definition.headShape==='heart'?[1.12,1,.9]:definition.headShape==='giant'?[1.2,1.1,1]:[1,1,1];
  const head=mesh(group,headGeometry(definition.headShape,p.head),skin,'HEAD',[0,headY,0],headScale);
  addFace(group,definition,[0,headY,0],p.head,p.head*.72,skin);
  if(['cape','hooded','regal','faceless','boss'].includes(definition.archetype)) addCape(group,p,secondary,definition.archetype==='boss'?1.4:1.1);
  if(definition.archetype==='floating'){const robe=mesh(group,coneGeo(p.torsoW*.72,p.leg+.35,12),primary,'FLOATING_ROBE',[0,(p.leg+.35)/2,0]);robe.rotation.y=Math.PI;}
  if(definition.archetype==='slime') for(const side of [-1,1])sphere(group,.19,[side*.27,.13,0],primary,`SLIME_FOOT_${side}`);
  addAccessory(group,definition,p,headY,[primary,secondary,accent,skin]);
  group.userData.parts={head,torso,arms:armEntries};
  group.userData.baseScale=options.scale || 1;
  group.scale.setScalar(options.scale || 1);
  return group;
}

export function inspectVillainCharacter(group) {
  const required=['HEAD','NECK','TORSO','HIPS','ARM_L_UPPER','ARM_L_LOWER','HAND_L','ARM_R_UPPER','ARM_R_LOWER','HAND_R','LEG_L_UPPER','LEG_L_LOWER','FOOT_L','LEG_R_UPPER','LEG_R_LOWER','FOOT_R','FACE'];
  const missing=required.filter((name)=>!group.getObjectByName(name));
  let meshes=0,triangles=0;
  group.traverse((node)=>{if(!node.isMesh)return;meshes++;triangles+=node.geometry.index?node.geometry.index.count/3:(node.geometry.attributes.position?.count||0)/3;});
  const bounds=new THREE.Box3().setFromObject(group),size=bounds.getSize(new THREE.Vector3());
  return {missing,meshes,triangles:Math.round(triangles),dimensions:size.toArray().map((value)=>Number(value.toFixed(3))),minY:Number(bounds.min.y.toFixed(3)),maxY:Number(bounds.max.y.toFixed(3))};
}

export function updateVillainCharacter(entry, player, elapsed) {
  const {group,data}=entry;
  group.position.y=group.userData.baseY+Math.sin(elapsed*1.25+group.userData.phase)*.018;
  const distance=Math.hypot(player.x-group.position.x,player.z-group.position.z);
  if(distance<5)group.rotation.y=Math.atan2(player.x-group.position.x,player.z-group.position.z)+Math.PI;
  const parts=group.userData.parts;
  if(parts?.head)parts.head.rotation.y=Math.sin(elapsed*.7+group.userData.phase)*.08;
  if(parts?.arms)for(const arm of parts.arms)arm.upper.rotation.z+=Math.sin(elapsed*1.1+group.userData.phase+arm.side)*.0015;
}
