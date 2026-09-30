"""Round-trip GLB import check: skin, actions, scale, floor contact, triangles."""
from pathlib import Path
import bpy
from mathutils import Vector

root=Path(__file__).resolve().parents[1]
path=root/"01_queuejack"/"01_queuejack.glb"
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(path))
armatures=[o for o in bpy.context.scene.objects if o.type=="ARMATURE"]
assert len(armatures)==1, len(armatures)
meshes=[o for o in bpy.context.scene.objects if o.type=="MESH" and o.parent==armatures[0]]
assert len(meshes)==1, len(meshes)
assert len(bpy.data.actions)==18, len(bpy.data.actions)
assert all(o.parent==armatures[0] for o in meshes)
points=[o.matrix_world@v.co for o in meshes for v in o.data.vertices]
lo=Vector(tuple(min(p[i] for p in points) for i in range(3)))
hi=Vector(tuple(max(p[i] for p in points) for i in range(3)))
dim=hi-lo
assert -0.04 < lo.z < 0.06, lo
assert 2.4 < dim.z < 2.75, dim
assert len(meshes[0].data.materials)<=5
print("QUEUEJACK_GLB_ROUNDTRIP_OK", "dimensions_m",tuple(round(v,3) for v in dim),
      "floor_z",round(lo.z,3),"triangles",len(meshes[0].data.polygons),
      "actions",len(bpy.data.actions),"materials",len(meshes[0].data.materials),
      "bytes",path.stat().st_size)

# Sample the whole animation library, including transitions, after import.
for action in sorted(bpy.data.actions,key=lambda a:a.name):
    armatures[0].animation_data.action=action
    if action.slots:
        armatures[0].animation_data.action_slot=action.slots[0]
    start,end=action.frame_range
    minima=[]
    for frame in sorted({int(start),int((start+end)/2),int(end)}):
        bpy.context.scene.frame_set(frame)
        evaluated=meshes[0].evaluated_get(bpy.context.evaluated_depsgraph_get())
        mesh=evaluated.to_mesh()
        minima.append(round(min((evaluated.matrix_world@v.co).z for v in mesh.vertices),3))
        evaluated.to_mesh_clear()
    print("ANIMATION_FLOOR",action.name,minima)
