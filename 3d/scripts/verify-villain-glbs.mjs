import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as THREE from '../vendor/three.module.js';
import { GLTFLoader } from '../vendor/addons/loaders/GLTFLoader.js';
import { VILLAIN_ROSTER } from '../characters/villain-roster.js';

globalThis.ProgressEvent??=class ProgressEvent{constructor(type,init={}){this.type=type;Object.assign(this,init);}};
const loader=new GLTFLoader(),manifest=JSON.parse(await readFile(new URL('../../assets/villain-roster/glb/manifest.json',import.meta.url),'utf8'));
assert.equal(manifest.characters.length,30);
for(const [index,villain] of VILLAIN_ROSTER.entries()){
  const entry=manifest.characters[index];assert.equal(entry.id,villain.id);
  const bytes=await readFile(new URL(`../../assets/villain-roster/glb/${entry.file}`,import.meta.url));
  assert.equal(bytes.subarray(0,4).toString('ascii'),'glTF',`${villain.name} needs a valid GLB header`);
  const arrayBuffer=bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),gltf=await loader.parseAsync(arrayBuffer,'');
  let meshes=0,triangles=0;gltf.scene.traverse((node)=>{if(!node.isMesh)return;meshes++;triangles+=node.geometry.index?node.geometry.index.count/3:node.geometry.attributes.position.count/3;});
  const bounds=new THREE.Box3().setFromObject(gltf.scene),size=bounds.getSize(new THREE.Vector3());
  assert.ok(meshes>=18,`${villain.name} lost modeled parts during export`);assert.ok(triangles>300&&triangles<10000,`${villain.name} GLB triangle count is invalid`);assert.ok(bounds.min.y>-.01&&bounds.max.y<3,`${villain.name} GLB origin or scale is invalid`);assert.ok(size.x<2.5&&size.z<2,`${villain.name} cannot clear hotel circulation`);
  assert.deepEqual(gltf.animations.map((clip)=>clip.name),['Idle','Walk','Turn','Gesture'],`${villain.name} needs the shared animation set`);
}
console.log('Villain GLB verification: PASS — 30/30 parse with four animation clips, retain geometry, stand at y=0, and fit hotel circulation.');
