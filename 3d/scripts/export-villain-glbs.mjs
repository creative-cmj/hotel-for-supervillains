import { mkdir, writeFile } from 'node:fs/promises';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import * as THREE from '../vendor/three.module.js';
import { VILLAIN_ROSTER } from '../characters/villain-roster.js';
import { createVillainCharacter, inspectVillainCharacter } from '../characters/villain-builder.js';

globalThis.FileReader ??= class {
  readAsArrayBuffer(blob){blob.arrayBuffer().then((result)=>{this.result=result;this.onloadend?.();});}
  readAsDataURL(blob){blob.arrayBuffer().then((result)=>{this.result=`data:${blob.type};base64,${Buffer.from(result).toString('base64')}`;this.onloadend?.();});}
};

const output=new URL('../../assets/villain-roster/glb/',import.meta.url);await mkdir(output,{recursive:true});
const exporter=new GLTFExporter(),manifest=[];
function rotationTrack(character,nodeName,axis,angles,times=[0,.5,1]){const node=character.getObjectByName(nodeName),values=[];for(const angle of angles){const q=node.quaternion.clone().multiply(new THREE.Quaternion().setFromAxisAngle(axis,angle));values.push(q.x,q.y,q.z,q.w);}return new THREE.QuaternionKeyframeTrack(`${nodeName}.quaternion`,times,values);}
function animationClips(character){const x=new THREE.Vector3(1,0,0),y=new THREE.Vector3(0,1,0),z=new THREE.Vector3(0,0,1);return [
  new THREE.AnimationClip('Idle',1,[rotationTrack(character,'HEAD',y,[-.05,.05,-.05])]),
  new THREE.AnimationClip('Walk',1,[rotationTrack(character,'ARM_L_UPPER',x,[-.28,.28,-.28]),rotationTrack(character,'ARM_R_UPPER',x,[.28,-.28,.28]),rotationTrack(character,'LEG_L_UPPER',x,[.24,-.24,.24]),rotationTrack(character,'LEG_R_UPPER',x,[-.24,.24,-.24])]),
  new THREE.AnimationClip('Turn',1,[rotationTrack(character,'TORSO',y,[-.08,.08,-.08]),rotationTrack(character,'HEAD',y,[-.16,.16,-.16])]),
  new THREE.AnimationClip('Gesture',1,[rotationTrack(character,'ARM_L_UPPER',z,[0,.18,0]),rotationTrack(character,'ARM_R_UPPER',z,[0,-.18,0])]),
];}
for(const villain of VILLAIN_ROSTER){
  const character=createVillainCharacter(villain);character.updateMatrixWorld(true);
  const report=inspectVillainCharacter(character);
  const clips=animationClips(character),result=await exporter.parseAsync(character,{binary:true,onlyVisible:false,trs:true,animations:clips});
  const bytes=Buffer.from(result);await writeFile(new URL(`${villain.id}.glb`,output),bytes);
  manifest.push({id:villain.id,name:villain.name,file:`${villain.id}.glb`,bytes:bytes.length,triangles:report.triangles,dimensions:report.dimensions,animations:clips.map((clip)=>clip.name)});
}
await writeFile(new URL('manifest.json',output),`${JSON.stringify({license:'Original project assets; no third-party character geometry or textures.',characters:manifest},null,2)}\n`);
console.log(`Exported ${manifest.length} game-ready villain GLBs (${manifest.reduce((sum,item)=>sum+item.bytes,0).toLocaleString()} bytes).`);
