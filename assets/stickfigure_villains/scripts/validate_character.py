"""Round-trip a produced GLB in Blender and sample each animation's floor bounds.

Usage: blender -b --python validate_character.py -- 02_knickknack 0.95
"""
from pathlib import Path
import sys
import bpy
from mathutils import Vector

args=sys.argv[sys.argv.index("--")+1:]
slug=args[0]
expected_height=float(args[1])
root=Path(__file__).resolve().parents[1]
path=root/slug/(slug+".glb")
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(path))
rigs=[o for o in bpy.context.scene.objects if o.type=="ARMATURE"]
assert len(rigs)==1,[(o.name,o.type) for o in bpy.context.scene.objects]
rig=rigs[0]
meshes=[o for o in bpy.context.scene.objects if o.type=="MESH" and o.parent==rig]
assert len(meshes)==1,len(meshes)
mesh=meshes[0]
assert len(bpy.data.actions)==18,len(bpy.data.actions)
points=[mesh.matrix_world@v.co for v in mesh.data.vertices]
low=Vector(tuple(min(p[i] for p in points) for i in range(3)))
high=Vector(tuple(max(p[i] for p in points) for i in range(3)))
dim=high-low
assert abs(dim.z-expected_height)<.15,(dim,expected_height)
assert -.04<low.z<.06,low
assert len(mesh.data.polygons)<8000,len(mesh.data.polygons)
assert len(mesh.data.materials)<=5,len(mesh.data.materials)
print("CHARACTER_GLB_OK",slug,"dimensions_m",tuple(round(v,3) for v in dim),
      "floor_z",round(low.z,3),"triangles",len(mesh.data.polygons),
      "materials",len(mesh.data.materials),"bones",len(rig.data.bones),
      "actions",len(bpy.data.actions),"bytes",path.stat().st_size)

for action in sorted(bpy.data.actions,key=lambda a:a.name):
    rig.animation_data.action=action
    if action.slots: rig.animation_data.action_slot=action.slots[0]
    start,end=action.frame_range
    floor=[]
    for frame in sorted({int(start),int((start+end)/2),int(end)}):
        bpy.context.scene.frame_set(frame)
        evaluated=mesh.evaluated_get(bpy.context.evaluated_depsgraph_get())
        data=evaluated.to_mesh()
        floor.append(round(min((evaluated.matrix_world@v.co).z for v in data.vertices),3))
        evaluated.to_mesh_clear()
    print("ANIMATION_FLOOR",action.name,floor)
