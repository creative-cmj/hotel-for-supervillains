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
const characterProportionOverrides = Object.freeze({
  'mister-monday': { torsoW:.92,torsoH:.62,depth:.58,head:.37,leg:.42 },
  'the-landlord': { torsoW:1.16,torsoH:.98,depth:.62,head:.29,leg:.38 },
  'the-auditor': { torsoW:.46,torsoH:1.05,depth:.3,head:.23,leg:.88 },
  'doctor-oops': { torsoW:.46,torsoH:.48,depth:.36,head:.47,leg:.3 },
  'agent-awkward': { torsoW:.58,torsoH:.88,depth:.38,head:.25,leg:.8 },
});
function characterProportions(definition) {
  return { ...proportions(definition.archetype), ...(characterProportionOverrides[definition.id] || {}) };
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
    for (const z of [-.065,0,.065]) {
      const finger=mesh(hand, cylinderGeo(.025,.035,.19,7), primary, `CLAW_${z}`, [side*.12,-.03,z]);
      finger.rotation.z=Math.PI/2;
    }
    const thumb=mesh(hand,cylinderGeo(.03,.04,.14,7),primary,'THUMB',[side*.08,.035,-.1]);thumb.rotation.z=side*Math.PI/3;
  } else if (style === 'stoneFist' || style === 'giantGlove') {
    const size=style === 'giantGlove' ? .2 : .16;mesh(hand, dodecaGeo(size), primary, 'FIST');
    for(let index=0;index<3;index++)sphere(hand,size*.36,[(index-1)*size*.55,-size*.55,-size*.45],accent,`KNUCKLE_${index}`);
  } else if (style === 'energy') {
    mesh(hand, octaGeo(.14), mat(0x66eaff,.15,.2,0x176b87), 'ENERGY_HAND');
  } else if (style === 'vine' || style === 'slime' || style === 'shadow') {
    mesh(hand, sphereGeo(.13), primary, 'PALM', [0,0,0], [1,.72,1]);
    for (const z of [-.065,0,.065]) limb(hand, `FINGER_${z}`, [side*.03,-.02,z],[side*.17,-.07,z],.022,primary);
  } else {
    const size = style === 'ovenMitt' || style === 'mitten' ? .15 : .125;
    mesh(hand, sphereGeo(size), primary, 'PALM', [0,0,0], [1,.86,.72]);
    if (['mitten','ovenMitt'].includes(style)) sphere(hand,size*.48,[side*size*.82,.01,-size*.38],primary,'THUMB');
    else {
      for (const z of [-.055,0,.055]) limb(hand, `FINGER_${z}`, [side*.02,-.04,z],[side*.12,-.08,z],.018,primary);
      const thumb=limb(hand,'THUMB',[0,.01,-.04],[side*.1,.015,-.1],.025,primary);thumb.rotation.z+=side*.12;
    }
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
  if(definition.id==='mister-monday'){leftScale=[1.2,.2,.38];rightScale=[.9,.14,.38];leftX=-radius*.31;rightX=radius*.38;mouthRot=-.12;}
  if(definition.id==='the-landlord'){leftScale=rightScale=[.88,.34,.38];leftX=-radius*.3;rightX=radius*.3;mouthW*=.88;}
  if(definition.id==='the-auditor'){leftScale=[.55,.38,.34];rightScale=[.7,.42,.34];leftX=-radius*.27;rightX=radius*.3;eyeY=radius*.2;mouthW*=.62;}
  if(definition.id==='doctor-oops'){leftScale=[1.5,1.45,.42];rightScale=[.72,.7,.38];leftX=-radius*.3;rightX=radius*.34;mouthRot=.2;}
  if(definition.id==='agent-awkward'){leftScale=[.86,1.05,.38];rightScale=[1.05,.76,.38];leftX=-radius*.29;rightX=radius*.35;mouthW*=.82;mouthRot=-.18;}
  for (const [x,scale,pupil] of [[leftX,leftScale,pupilLX],[rightX,rightScale,pupilRX]]) {
    mesh(face,sphereGeo(radius*.19),white,`EYE_${x<0?'L':'R'}`,[x,eyeY,0],scale);
    mesh(face,sphereGeo(radius*.075),dark,`PUPIL_${x<0?'L':'R'}`,[x+pupil,eyeY,-radius*.16],[1,1,.5]);
  }
  const mouth=mesh(face,boxGeo(mouthW,radius*.075,radius*.055),mouthMat,'MOUTH',[0,mouthY,-radius*.03]); mouth.rotation.z=mouthRot;
  if (['smug','grin','happy','evilHappy','maniac','proud'].includes(definition.expression)) {
    const tooth=mesh(face,boxGeo(mouthW*.75,radius*.1,radius*.06),white,'TEETH',[0,mouthY+.015,-radius*.055]); tooth.rotation.z=mouthRot;
  }
  const browTilt = ['angry','tinyAngry','stern','tryingHard'].includes(definition.expression) ? .28 : definition.expression==='worried' ? -.24 : 0;
  for(const side of [-1,1]) {
    const specialTilt=definition.id==='the-landlord'?(side<0?.04:-.04):definition.id==='the-auditor'?(side<0?.45:-.16):definition.id==='agent-awkward'?(side<0?-.42:.08):browTilt;
    const brow=mesh(face,boxGeo(radius*(definition.id==='the-landlord'?.48:.34),radius*.045,radius*.04),dark,`BROW_${side<0?'L':'R'}`,[side*radius*.33,eyeY+radius*(definition.id==='agent-awkward'&&side<0?.42:.28),-radius*.12]);brow.rotation.z=side*specialTilt;
  }
  if(definition.id==='mister-monday') for(const side of [-1,1]) mesh(face,torusGeo(radius*.18,radius*.025),mat(0x70505b,0,.82),`EYE_BAG_${side<0?'L':'R'}`,[side*radius*.34,eyeY-radius*.1,-radius*.12],[1,.42,.3],[0,0,0]);
  if(definition.id==='the-landlord') {
    for(const side of [-1,1]) addGlassesFrame(face,side*radius*.31,eyeY,radius*.46,radius*.3,radius*.035,dark,`GLASSES_${side<0?'L':'R'}`);
    boxAccessory(face,[radius*.2,radius*.035,radius*.04],[0,eyeY,-radius*.18],dark,'GLASSES_BRIDGE');
    mesh(face,coneGeo(radius*.14,radius*.25,6),skinMat,'NOSE',[0,-radius*.04,-radius*.18],[1,1,1],[Math.PI/2,0,0]);
  }
  if(definition.id==='the-auditor') {
    for(const side of [-1,1]) addGlassesFrame(face,side*radius*.3,eyeY,radius*.38,radius*.25,radius*.035,dark,`ANGULAR_GLASSES_${side<0?'L':'R'}`);
    boxAccessory(face,[radius*.17,radius*.035,radius*.04],[0,eyeY,-radius*.18],dark,'GLASSES_BRIDGE');
  }
  if(definition.id==='doctor-oops') for(const side of [-1,1]) torus(face,radius*(side<0?.27:.19),radius*.045,[side*radius*.32,eyeY,-radius*.2],accentForFace(definition),'GOGGLE',[0,0,0]);
  if(definition.id==='doctor-oops') sphere(face,radius*.075,[radius*.34,eyeY,-radius*.27],mat(0x15111c,0,.35,0x4c1849),'MECHANICAL_LENS');
  if(definition.id==='doctor-oops') for(const rotation of [-.7,.7]) mesh(face,boxGeo(radius*.28,radius*.035,radius*.04),accentForFace(definition),'BROKEN_LENS',[-radius*.34,eyeY,-radius*.27],[1,1,1],[0,0,rotation]);
  if(definition.id==='agent-awkward') mesh(face,boxGeo(mouthW*.65,radius*.12,radius*.06),white,'AWKWARD_TEETH',[0,mouthY+.015,-radius*.06],[1,.75,1],[0,0,mouthRot]);
  return face;
}
function accentForFace(definition){return mat(definition.colors[2],.45,.3);}
function addGlassesFrame(group,x,y,width,height,thickness,material,name){
  for(const offset of [-1,1]) boxAccessory(group,[width,thickness,.035],[x,y+offset*height*.5,-.06],material,`${name}_H${offset}`);
  for(const offset of [-1,1]) boxAccessory(group,[thickness,height,.035],[x+offset*width*.5,y,-.06],material,`${name}_V${offset}`);
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
    case 'coffeeMug': boxAccessory(group,[.26,.29,.23],[-p.torsoW*.65,p.leg+p.torsoH*.2,-.16],primary,'COFFEE_MUG');torus(group,.12,.03,[-p.torsoW*.79,p.leg+p.torsoH*.22,-.16],accent,'MUG_HANDLE',[0,Math.PI/2,0]);for(let i=0;i<2;i++)torus(group,.055+i*.018,.014,[-p.torsoW*.65,p.leg+p.torsoH*.43+i*.09,-.16],skin,`STEAM_${i}`,[0,0,0]);break;
    case 'keysClipboard': boxAccessory(group,[.46,.62,.08],[p.torsoW*.56,p.leg+p.torsoH*.3,-.16],accent,'CLIPBOARD');for(let i=0;i<5;i++)mesh(group,boxGeo(.045,.2,.028),secondary,`KEY_${i}`,[-p.torsoW*.45+i*.07,p.leg+p.torsoH*.12,front]);torus(group,.2,.035,[-p.torsoW*.42,p.leg+p.torsoH*.2,front],secondary,'KEY_RING',[0,0,0]);break;
    case 'slimeCrown': for(const x of [-.2,0,.2])mesh(group,coneGeo(.09,x===0?.32:.24,6),accent,'CROWN_POINT',[x,top+.12,0]);break;
    case 'magicianHat': mesh(group,cylinderGeo(p.head*.62,p.head*.78,.55,12),primary,'TOP_HAT',[0,top+.26,0]);mesh(group,cylinderGeo(p.head*1.0,p.head*1.0,.07,16),accent,'HAT_BRIM',[0,top,0]);for(const x of [-.55,.55])sphere(group,.11,[x*p.torsoW,headY+.1,0],secondary,'QUESTION_ORB');break;
    case 'calculator': boxAccessory(group,[.34,.48,.09],[p.torsoW*.72,p.leg+p.torsoH*.3,front],primary,'CALCULATOR');for(let x=-1;x<=1;x++)for(let y=0;y<3;y++)sphere(group,.024,[p.torsoW*.72+x*.075,p.leg+p.torsoH*.2+y*.085,front-.06],accent,'BUTTON');break;
    case 'orbitObjects': for(let i=0;i<5;i++){const a=(i/5)*Math.PI*2;const object=mesh(group,i%2?octaGeo(.09):boxGeo(.13,.05,.08),i%2?accent:secondary,`ORBIT_${i}`,[Math.cos(a)*.75,headY+Math.sin(a)*.45,Math.sin(a)*.35]);object.rotation.z=a;}break;
    case 'headphones': torus(group,p.head*1.05,.07,[0,headY+.06,0],primary,'HEADPHONES',[0,0,0]);for(const x of [-.42,.42])boxAccessory(group,[.16,.34,.16],[x*p.head/.3,headY,0],secondary,'EARPHONE');for(const x of [-.62,.62])boxAccessory(group,[.3,.48,.42],[x*p.torsoW,p.leg+p.torsoH*.6,0],primary,'SPEAKER');break;
    case 'sandGoggles': boxAccessory(group,[p.head*1.45,.18,.08],[0,headY+.08,front-.07],secondary,'SAND_GOGGLES');addCape(group,p,accent,.82);break;
    case 'glitchPanels': for(const [x,y,s] of [[-.5,.75,1],[.55,.45,.7],[-.42,.2,.55]])boxAccessory(group,[.24*s,.18*s,.05],[x*p.torsoW,p.leg+y*p.torsoH,front],x>0?primary:secondary,'GLITCH_PANEL');mesh(group,coneGeo(.06,.42,6),accent,'ANTENNA',[.16,top+.18,0]);break;
    case 'shadowHood': mesh(group,coneGeo(p.head*1.45,p.head*2.3,12),primary,'SHADOW_HOOD',[0,headY+.08,.04]);addCape(group,p,primary,1.3);break;
    case 'goldCrown': for(let i=-2;i<=2;i++)mesh(group,coneGeo(.07,.24+(.12*Math.abs(i%2)),6),accent,'CROWN_POINT',[i*.12,top+.15,0]);addCape(group,p,primary,1.15);for(const x of [-.48,.48])sphere(group,.1,[x*p.torsoW,headY-.2,front],secondary,'JEWEL');break;
    case 'brokenDrone': boxAccessory(group,[.32,.44,.2],[0,p.leg+p.torsoH*.55,p.depth*.75],primary,'DRONE_BACKPACK');limb(group,'DRONE_SUPPORT',[p.torsoW*.2,p.leg+p.torsoH*.72,p.depth*.65],[p.torsoW*.88,headY+.2,.02],.035,accent);boxAccessory(group,[.46,.18,.3],[p.torsoW*.9,headY+.22,.02],secondary,'BROKEN_DRONE');for(const z of [-.22,.22])torus(group,.1,.025,[p.torsoW*.9,headY+.25,z+.02],accent,'DRONE_ROTOR',[Math.PI/2,0,0]);break;
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
    case 'spyTie': boxAccessory(group,[.11,.68,.025],[0,p.leg+p.torsoH*.48,front],secondary,'SPY_TIE');boxAccessory(group,[.68,.48,.2],[p.torsoW*.78,p.leg+p.torsoH*.12,0],primary,'BRIEFCASE');torus(group,.12,.022,[p.torsoW*.78,p.leg+p.torsoH*.4,0],accent,'BRIEFCASE_HANDLE',[0,0,0]);break;
    case 'finalHorns': for(const side of [-1,1]){const horn=mesh(group,coneGeo(.16,.72,8),accent,'DOOM_HORN',[side*p.head*.75,top+.28,0]);horn.rotation.z=side*.45;}addCape(group,p,primary,1.35);break;
  }
}
function addQualityDetails(group,definition,p,anchors,materials){
  const [primary,secondary,accent,skin]=materials;const {hipY,torsoY,shoulderY,headY,front}=anchors;
  if(definition.id==='mister-monday'){
    mesh(group,sphereGeo(.5),secondary,'OVERSIZED_HOODIE',[0,torsoY-.05,.05],[p.torsoW*1.12,p.torsoH*.98,p.depth*1.18]);
    torus(group,p.head*.72,.09,[0,headY-p.head*.64,-.01],primary,'SLOUCH_COLLAR',[Math.PI/2,0,0]);
    for(const side of [-1,1])boxAccessory(group,[p.torsoW*.42,p.torsoH*.58,.08],[side*p.torsoW*.23,hipY-.03,p.depth*.56],primary,`COAT_TAIL_${side}`);
    boxAccessory(group,[.1,.5,.025],[.05,torsoY-.05,front-.04],accent,'LOOSE_TIE');
  }
  if(definition.id==='the-landlord'){
    boxAccessory(group,[p.torsoW*1.08,p.torsoH*1.04,p.depth*1.06],[0,torsoY,.02],primary,'CARDIGAN_BLOCK');
    for(const side of [-1,1])boxAccessory(group,[p.torsoW*.16,p.torsoH*.82,.035],[side*p.torsoW*.23,torsoY,front-.04],secondary,`CARDIGAN_LAPEL_${side}`);
    for(let index=0;index<4;index++)sphere(group,.035,[0,hipY+.15+index*.18,front-.08],accent,`CARDIGAN_BUTTON_${index}`);
    for(let index=0;index<4;index++)boxAccessory(group,[.64-index*.04,.035,.34],[0,shoulderY-.1+index*.055,p.depth*.8],index%2?skin:accent,`CONTRACT_STACK_${index}`);
  }
  if(definition.id==='the-auditor'){
    boxAccessory(group,[p.torsoW*1.45,p.torsoH*1.42,.09],[0,torsoY-.12,p.depth*.64],primary,'LEDGER_CAPE');
    for(const side of [-1,1])mesh(group,coneGeo(.12,.42,4),accent,`PEN_SHOULDER_${side}`,[side*p.torsoW*.7,shoulderY+.06,0],[1,1,1],[0,0,side*.72]);
    boxAccessory(group,[p.torsoW*.9,.05,.035],[0,torsoY+.16,front-.05],skin,'PINSTRIPE_1');
    boxAccessory(group,[p.torsoW*.9,.05,.035],[0,torsoY-.13,front-.05],skin,'PINSTRIPE_2');
  }
  if(definition.id==='doctor-oops'){
    for(const side of [-1,1])boxAccessory(group,[p.torsoW*.45,p.torsoH*.7,.055],[side*p.torsoW*.23,hipY+.02,p.depth*.55],skin,`LAB_COAT_TAIL_${side}`);
    for(const y of [shoulderY-.12,shoulderY-.4])torus(group,.17,.035,[p.torsoW*.75,y,0],accent,'MECH_ARM_RING',[Math.PI/2,0,0]);
    torus(group,p.head*.82,.055,[0,headY+.02,-p.head*.76],secondary,'GIANT_GOGGLE_STRAP',[0,0,0]);
    for(let index=0;index<3;index++)boxAccessory(group,[.08,.22,.06],[-p.torsoW*.44+index*.12,hipY+.28,front-.04],accent,`TOOL_${index}`);
  }
  if(definition.id==='agent-awkward'){
    mesh(group,cylinderGeo(p.torsoW*.34,p.torsoW*.78,p.torsoH*1.18,4),primary,'TRENCH_COAT',[0,hipY+p.torsoH*.35,.04]);
    for(const side of [-1,1])boxAccessory(group,[p.torsoW*.42,.42,.09],[side*p.torsoW*.23,shoulderY-.02,p.depth*.54],secondary,`HIGH_COLLAR_${side}`);
    boxAccessory(group,[.055,.28,.045],[p.head*.72,headY+.02,-p.head*.55],accent,'EARPIECE');
    limb(group,'EARPIECE_WIRE',[p.head*.72,headY-.03,-p.head*.5],[p.torsoW*.38,shoulderY-.25,front],.012,accent);
  }
}
function boxAccessory(group,size,position,material,name){return mesh(group,boxGeo(...size),material,name,position);}
function sphere(group,r,position,material,name='SPHERE'){return mesh(group,sphereGeo(r),material,name,position);}
function cylinder(group,r,h,position,material,name='CYLINDER'){return mesh(group,cylinderGeo(r,r,h,10),material,name,position);}
function torus(group,r,tube,position,material,name='TORUS',rotation=[Math.PI/2,0,0]){return mesh(group,torusGeo(r,tube),material,name,position,[1,1,1],rotation);}

export function createVillainCharacter(definition, options = {}) {
  const p=characterProportions(definition);
  const group=new THREE.Group();group.name=`VILLAIN_${definition.id.toUpperCase()}`;group.userData.villain=definition;
  const primary=mat(definition.colors[0],definition.archetype==='armored'||definition.archetype==='boss' ? .45 : .08,.48);
  const secondary=mat(definition.colors[1],.12,.45,definition.archetype==='glitch'?definition.colors[1]:0);
  const accent=mat(definition.colors[2],.55,.28);
  const skinColor=definition.archetype==='slime'?definition.colors[0]:definition.archetype==='rock'?0x858992:definition.archetype==='robot'?0xaeb8c7:0xc98b70;
  const skin=mat(skinColor,definition.archetype==='rock'?.18:.02,.68);
  const hipY=.32+p.leg;
  const torsoY=hipY+p.torsoH*.46;
  const squareTorso=['the-landlord','the-auditor','agent-awkward'].includes(definition.id);
  const torsoGeo = definition.archetype==='rock'?dodecaGeo(.6):definition.archetype==='slime'?sphereGeo(.55):definition.archetype==='boss'||definition.archetype==='armored'||definition.archetype==='blocky'||squareTorso?boxGeo(1,1,1):sphereGeo(.5);
  const torso=mesh(group,torsoGeo,primary,'TORSO',[0,torsoY,0],[p.torsoW/(definition.archetype==='rock'?.95:1),p.torsoH/(definition.archetype==='slime'?.9:1),p.depth/.5]);
  mesh(group,cylinderGeo(p.torsoW*.46,p.torsoW*.5,.18,10),accent,'HIPS',[0,hipY,0]);
  const legSpread=p.torsoW*.24;
  for(const side of [-1,1]){
    const awkward=definition.id==='agent-awkward';
    const hip=[side*legSpread,hipY-.03,0],knee=[side*legSpread*(awkward?1.35:.95),.34+p.leg*.48,awkward?-.05:side*.015],ankle=[side*legSpread*(awkward?.72:1),.18,.015];
    limb(group,`LEG_${side<0?'L':'R'}_UPPER`,hip,knee,definition.archetype==='rock'?.15:.105,primary);
    limb(group,`LEG_${side<0?'L':'R'}_LOWER`,knee,ankle,definition.archetype==='rock'?.14:.095,secondary);
    const footSize=definition.id==='mister-monday'?[.38,.16,.5]:definition.id==='doctor-oops'?[.36,.22,.52]:definition.id==='agent-awkward'?[.24,.16,.54]:[.26,.18,.42];
    mesh(group,definition.archetype==='rock'?dodecaGeo(.18):boxGeo(...footSize),definition.archetype==='rock'?skin:accent,`FOOT_${side<0?'L':'R'}`,[ankle[0],footSize[1]*.5,-.1]);
  }
  const shoulderY=hipY+p.torsoH*.78, shoulderX=p.torsoW*.52;
  const armEntries=[];
  for(const side of [-1,1]){
    let shoulder=[side*shoulderX,shoulderY,0],elbow=[side*(shoulderX+.12),shoulderY-.4,definition.archetype==='lopsided'&&side>0?.12:0],wrist=[side*(shoulderX+.08),shoulderY-.72,-.02];
    if(definition.id==='mister-monday'){shoulder=[side*shoulderX,shoulderY-.12,-.05];elbow=[side*(shoulderX+.2),shoulderY-.38,-.12];wrist=[side*(shoulderX+.12),shoulderY-.66,-.15];}
    if(definition.id==='doctor-oops'&&side>0){elbow=[side*(shoulderX+.27),shoulderY-.26,.02];wrist=[side*(shoulderX+.3),shoulderY-.68,-.08];}
    if(definition.id==='agent-awkward'&&side<0){elbow=[side*(shoulderX+.24),shoulderY-.25,-.08];wrist=[.14,shoulderY-.43,-.43];}
    const customArm=definition.id==='doctor-oops'&&side>0;
    const upper=limb(group,`ARM_${side<0?'L':'R'}_UPPER`,shoulder,elbow,customArm?.15:definition.archetype==='boss'||definition.archetype==='rock'?.16:.095,customArm?accent:primary);
    const lower=limb(group,`ARM_${side<0?'L':'R'}_LOWER`,elbow,wrist,customArm?.14:definition.archetype==='boss'||definition.archetype==='rock'?.145:.085,customArm?secondary:secondary);
    const hand=makeHand(group,side,[wrist[0],wrist[1]-.08,wrist[2]],definition.handStyle,skin,accent);
    armEntries.push({side,upper,lower,hand});
  }
  const neckY=hipY+p.torsoH*.92;
  const headForward=definition.id==='mister-monday'?-.16:definition.id==='doctor-oops'?-.06:0;
  mesh(group,cylinderGeo(p.head*.28,p.head*.31,.2,10),skin,'NECK',[0,neckY+.03,headForward*.45]);
  const headY=neckY+p.head*.82;
  let headScale=definition.headShape==='long'?[.78,1.35,.82]:definition.headShape==='heart'?[1.12,1,.9]:definition.headShape==='giant'?[1.2,1.1,1]:[1,1,1];
  if(definition.id==='mister-monday')headScale=[1.12,.8,.95];
  if(definition.id==='the-landlord')headScale=[1.3,.82,.92];
  if(definition.id==='the-auditor')headScale=[.92,1.38,.82];
  if(definition.id==='doctor-oops')headScale=[1.25,1.08,1];
  if(definition.id==='agent-awkward')headScale=[.88,1.3,.86];
  const head=mesh(group,headGeometry(definition.headShape,p.head),skin,'HEAD',[0,headY,headForward],headScale);
  addFace(group,definition,[0,headY,headForward],p.head,p.head*.72,skin);
  if(['cape','hooded','regal','faceless','boss'].includes(definition.archetype)) addCape(group,p,secondary,definition.archetype==='boss'?1.4:1.1);
  if(definition.archetype==='floating'){const robe=mesh(group,coneGeo(p.torsoW*.72,p.leg+.35,12),primary,'FLOATING_ROBE',[0,(p.leg+.35)/2,0]);robe.rotation.y=Math.PI;}
  if(definition.archetype==='slime') for(const side of [-1,1])sphere(group,.19,[side*.27,.13,0],primary,`SLIME_FOOT_${side}`);
  addAccessory(group,definition,p,headY,[primary,secondary,accent,skin]);
  addQualityDetails(group,definition,p,{hipY,torsoY,shoulderY,headY,front:-p.depth*.7},[primary,secondary,accent,skin]);
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
  const pairs=[['HEAD','NECK'],['NECK','TORSO'],['TORSO','HIPS'],...['L','R'].flatMap((side)=>[[`TORSO`,`ARM_${side}_UPPER`],[`ARM_${side}_UPPER`,`ARM_${side}_LOWER`],[`ARM_${side}_LOWER`,`HAND_${side}`],[`HIPS`,`LEG_${side}_UPPER`],[`LEG_${side}_UPPER`,`LEG_${side}_LOWER`],[`LEG_${side}_LOWER`,`FOOT_${side}`]])];
  const jointGaps=[];
  for(const [firstName,secondName] of pairs){
    const first=group.getObjectByName(firstName),second=group.getObjectByName(secondName);if(!first||!second)continue;
    const a=new THREE.Box3().setFromObject(first),b=new THREE.Box3().setFromObject(second);
    const dx=Math.max(0,a.min.x-b.max.x,b.min.x-a.max.x),dy=Math.max(0,a.min.y-b.max.y,b.min.y-a.max.y),dz=Math.max(0,a.min.z-b.max.z,b.min.z-a.max.z);
    const gap=Math.hypot(dx,dy,dz);if(gap>.045)jointGaps.push({joint:`${firstName}→${secondName}`,gap:Number(gap.toFixed(3))});
  }
  return {missing,jointGaps,meshes,triangles:Math.round(triangles),dimensions:size.toArray().map((value)=>Number(value.toFixed(3))),minY:Number(bounds.min.y.toFixed(3)),maxY:Number(bounds.max.y.toFixed(3))};
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
