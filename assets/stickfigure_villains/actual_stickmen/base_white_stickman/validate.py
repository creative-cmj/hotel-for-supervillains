"""Re-import the GLB and verify the reusable white stick-person handoff."""
from pathlib import Path
import bpy
from mathutils import Vector

path=Path(__file__).resolve().parent/"base-white-stickman.glb"
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(path))
rigs=[obj for obj in bpy.context.scene.objects if obj.type=="ARMATURE"]
meshes=[obj for obj in bpy.context.scene.objects if obj.type=="MESH" and obj.parent in rigs]
assert len(rigs)==1,(len(rigs),[obj.name for obj in rigs])
assert len(meshes)==2,(len(meshes),[obj.name for obj in meshes])
assert all(obj.parent==rigs[0] for obj in meshes)
assert len(rigs[0].data.bones)>=17
face=next(obj for obj in meshes if obj.data.shape_keys)
keys={key.name for key in face.data.shape_keys.key_blocks}
assert {"Basis","Happy","Angry","Surprised","Confused","Sad"}<=keys,keys
for name in keys-{"Basis"}:
    basis=face.data.shape_keys.key_blocks["Basis"]
    target=face.data.shape_keys.key_blocks[name]
    assert any((target.data[i].co-basis.data[i].co).length>.001
               for i in range(len(face.data.vertices))),name
positions=[obj.matrix_world@vertex.co for obj in meshes for vertex in obj.data.vertices]
minimum=Vector(tuple(min(point[i] for point in positions) for i in range(3)))
maximum=Vector(tuple(max(point[i] for point in positions) for i in range(3)))
size=maximum-minimum
triangles=sum(len(poly.vertices)-2 for obj in meshes for poly in obj.data.polygons)
assert 2.15<size.z<2.3,size
assert abs(minimum.z)<.02,minimum
assert triangles<5000,triangles
assert len({mat.name for obj in meshes for mat in obj.data.materials})==3
print("WHITE_STICKMAN_GLB_OK", "size_m",tuple(round(value,3) for value in size),
      "ground_z",round(minimum.z,3),"triangles",triangles,
      "bones",len(rigs[0].data.bones),"meshes",len(meshes),
      "morphs",sorted(keys-{"Basis"}),"bytes",path.stat().st_size)
