"""Round-trip the new Queuejack GLB and sample exported animation bounds."""
from pathlib import Path
import bpy
from mathutils import Vector

path = Path(__file__).resolve().parent / "queuejack-stick.glb"
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(path))
rigs = [obj for obj in bpy.context.scene.objects if obj.type == "ARMATURE"]
assert len(rigs) == 1, len(rigs)
rig = rigs[0]
meshes = [obj for obj in bpy.context.scene.objects if obj.type == "MESH" and obj.parent == rig]
assert len(meshes) == 1, len(meshes)
mesh = meshes[0]
assert len(bpy.data.actions) == 18, len(bpy.data.actions)
assert any(group.name == "QUEUE_TICKET" for group in mesh.vertex_groups)
points = [mesh.matrix_world @ vertex.co for vertex in mesh.data.vertices]
minimum = Vector(tuple(min(p[i] for p in points) for i in range(3)))
maximum = Vector(tuple(max(p[i] for p in points) for i in range(3)))
size = maximum - minimum
assert 2.4 < size.z < 2.65, size
assert -.025 <= minimum.z < .025, minimum
assert len(mesh.data.polygons) < 3000, len(mesh.data.polygons)
assert len(mesh.data.materials) <= 4, len(mesh.data.materials)
print("STICK_QUEUEJACK_GLB_OK", "dimensions_m", tuple(round(v, 3) for v in size),
      "floor_z", round(minimum.z, 3), "triangles", len(mesh.data.polygons),
      "materials", len(mesh.data.materials), "bones", len(rig.data.bones),
      "actions", len(bpy.data.actions), "bytes", path.stat().st_size)

for action in sorted(bpy.data.actions, key=lambda item: item.name):
    rig.animation_data.action = action
    if action.slots:
        rig.animation_data.action_slot = action.slots[0]
    start, end = action.frame_range
    frames = sorted({round(start + (end-start)*step/8) for step in range(9)})
    bottoms = []
    for frame in frames:
        bpy.context.scene.frame_set(frame)
        evaluated = mesh.evaluated_get(bpy.context.evaluated_depsgraph_get())
        data = evaluated.to_mesh()
        bottoms.append(round(min((evaluated.matrix_world @ vertex.co).z for vertex in data.vertices), 3))
        evaluated.to_mesh_clear()
    print("ANIMATION_FLOOR", action.name, bottoms)
    if action.name in {"Idle", "Walk", "FastWalk", "SitDown", "SittingIdle", "StandUp", "Queuejack_ShowTicket"}:
        assert min(bottoms) >= -.03, (action.name, bottoms)
