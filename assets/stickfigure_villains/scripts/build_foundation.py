"""Build one simple style/rig/animation test figure in Blender 5.1.

This is deliberately not one of the 30 villains. It proves the shared shape
language and animation setup before production starts on Queuejack.
"""
from __future__ import annotations

import math
from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "foundation"
OUT.mkdir(parents=True, exist_ok=True)

bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
for data in list(bpy.data.actions):
    bpy.data.actions.remove(data)

scene = bpy.context.scene
scene.render.engine = "BLENDER_EEVEE"
scene.render.resolution_x = 700
scene.render.resolution_y = 700
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "PNG"
scene.render.film_transparent = True
scene.view_settings.view_transform = "AgX"
scene.world.color = (0.045, 0.035, 0.07)
scene.unit_settings.system = "METRIC"
scene.unit_settings.scale_length = 1
scene.render.fps = 24


def material(name, color, roughness=0.7):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1)
    mat.use_nodes = True
    principled = mat.node_tree.nodes.get("Principled BSDF")
    principled.inputs["Base Color"].default_value = (*color, 1)
    principled.inputs["Roughness"].default_value = roughness
    return mat


TEAL = material("Style_Primary_Teal", (0.035, 0.52, 0.56))
CREAM = material("Style_Secondary_Cream", (0.92, 0.78, 0.57))
DARK = material("Style_FaceAndShoe_Ink", (0.035, 0.028, 0.09))
WHITE = material("Style_Eye_White", (0.96, 0.94, 0.87))


def bind(obj, bone, mat):
    obj.data.materials.append(mat)
    obj.name = f"STYLE_{obj.name}_{bone}"
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    # glTF requires the armature to parent each skinned mesh.  Since the rig
    # sits at the origin, parenting preserves the modeled world coordinates.
    obj.parent = arm
    obj.matrix_parent_inverse = arm.matrix_world.inverted()
    group = obj.vertex_groups.new(name=bone)
    group.add(list(range(len(obj.data.vertices))), 1.0, "REPLACE")
    modifier = obj.modifiers.new("RigidBoneWeight", "ARMATURE")
    modifier.object = arm
    return obj


def sphere(name, center, size, bone, mat, segments=16, rings=10):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=rings, location=center)
    obj = bpy.context.object
    obj.name = name
    obj.scale = size
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    for face in obj.data.polygons:
        face.use_smooth = True
    return bind(obj, bone, mat)


def tube(name, a, b, radii, bone, mat, sides=10):
    """Shaped capsule-like limb from endpoint a to b with deliberate taper."""
    a, b = Vector(a), Vector(b)
    axis = (b - a).normalized()
    tangent = axis.cross(Vector((0, 1, 0))).normalized()
    if tangent.length < 0.01:
        tangent = axis.cross(Vector((1, 0, 0))).normalized()
    bitangent = axis.cross(tangent).normalized()
    verts = []
    fractions = (0, 0.12, 0.50, 0.88, 1)
    for i, fraction in enumerate(fractions):
        center = a.lerp(b, fraction)
        radius = radii[i]
        for j in range(sides):
            angle = 2 * math.pi * j / sides
            verts.append(center + radius * (math.cos(angle) * tangent + math.sin(angle) * bitangent))
    faces = [tuple(reversed(range(sides)))]
    for i in range(len(fractions) - 1):
        for j in range(sides):
            n = (j + 1) % sides
            faces.append((i * sides + j, i * sides + n, (i + 1) * sides + n, (i + 1) * sides + j))
    faces.append(tuple((len(fractions) - 1) * sides + j for j in range(sides)))
    mesh = bpy.data.meshes.new(name + "_Mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    scene.collection.objects.link(obj)
    for face in mesh.polygons:
        face.use_smooth = len(face.vertices) == 4
    return bind(obj, bone, mat)


def rounded_box(name, center, size, bone, mat, bevel=0.06):
    bpy.ops.mesh.primitive_cube_add(size=1, location=center)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = size
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    mod = obj.modifiers.new("HandSculptedSoftEdge", "BEVEL")
    mod.width = bevel
    mod.segments = 2
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=mod.name)
    obj.modifiers.new("WeightedNormals", "WEIGHTED_NORMAL")
    return bind(obj, bone, mat)


arm_data = bpy.data.armatures.new("Style_BaseRig_Data")
arm = bpy.data.objects.new("STYLE_RIG", arm_data)
scene.collection.objects.link(arm)
bpy.context.view_layer.objects.active = arm
arm.select_set(True)
bpy.ops.object.mode_set(mode="EDIT")


def bone(name, head, tail, parent=None):
    b = arm_data.edit_bones.new(name)
    b.head, b.tail = head, tail
    if parent:
        b.parent = arm_data.edit_bones[parent]
    return b


bone("ROOT", (0, 0, 0), (0, 0, 0.18))
bone("PELVIS", (0, 0, 0.83), (0, 0, 1.02), "ROOT")
bone("SPINE", (0, 0, 1.02), (0, 0, 1.27), "PELVIS")
bone("CHEST", (0, 0, 1.27), (0, 0, 1.45), "SPINE")
bone("NECK", (0, 0, 1.45), (0, 0, 1.57), "CHEST")
bone("HEAD", (0, 0, 1.57), (0, 0, 1.86), "NECK")
for side, sign in (("L", -1), ("R", 1)):
    bone(f"{side}_SHOULDER", (sign * 0.24, 0, 1.36), (sign * 0.34, 0, 1.34), "CHEST")
    bone(f"{side}_UPPER_ARM", (sign * 0.34, 0, 1.34), (sign * 0.41, 0, 1.04), f"{side}_SHOULDER")
    bone(f"{side}_FOREARM", (sign * 0.41, 0, 1.04), (sign * 0.44, -0.015, 0.77), f"{side}_UPPER_ARM")
    bone(f"{side}_HAND", (sign * 0.44, -0.015, 0.77), (sign * 0.44, -0.015, 0.63), f"{side}_FOREARM")
    bone(f"{side}_THIGH", (sign * 0.14, 0, 0.84), (sign * 0.14, 0, 0.47), "PELVIS")
    bone(f"{side}_SHIN", (sign * 0.14, 0, 0.47), (sign * 0.14, 0, 0.16), f"{side}_THIGH")
    bone(f"{side}_FOOT", (sign * 0.14, 0, 0.16), (sign * 0.14, -0.23, 0.12), f"{side}_SHIN")
bpy.ops.object.mode_set(mode="OBJECT")
arm.show_in_front = True
arm_data.display_type = "STICK"

# The overlapping, shaped masses are intentional. All geometry is weighted to
# a named bone and deforms rigidly; the overlap hides hinge seams in motion.
tube("TorsoContinuous", (0, 0, 0.86), (0, 0, 1.43), (0.18, 0.225, 0.21, 0.25, 0.18), "SPINE", TEAL, 16)
sphere("HipJoin", (0, 0, 0.84), (0.20, 0.14, 0.13), "PELVIS", TEAL)
tube("NeckSocket", (0, 0, 1.43), (0, 0, 1.58), (0.075, 0.09, 0.08, 0.075, 0.06), "NECK", CREAM)
sphere("HeadSculpt", (0, -0.015, 1.69), (0.225, 0.18, 0.23), "HEAD", CREAM, 20, 12)
for side, sign in (("L", -1), ("R", 1)):
    sphere(f"{side}_ShoulderJoin", (sign * 0.31, 0, 1.33), (0.105, 0.105, 0.105), f"{side}_SHOULDER", TEAL)
    tube(f"{side}_UpperArmSculpt", (sign * 0.33, 0, 1.31), (sign * 0.405, 0, 1.05), (0.07, 0.09, 0.08, 0.07, 0.055), f"{side}_UPPER_ARM", TEAL)
    sphere(f"{side}_ElbowJoin", (sign * 0.405, 0, 1.04), (0.062, 0.064, 0.067), f"{side}_FOREARM", CREAM, 12, 8)
    tube(f"{side}_ForearmSculpt", (sign * 0.405, 0, 1.035), (sign * 0.44, -0.015, 0.78), (0.05, 0.065, 0.07, 0.055, 0.044), f"{side}_FOREARM", CREAM)
    sphere(f"{side}_MittenHand", (sign * 0.44, -0.025, 0.70), (0.077, 0.055, 0.092), f"{side}_HAND", CREAM, 12, 8)
    sphere(f"{side}_ThumbNotch", (sign * 0.38, -0.065, 0.73), (0.031, 0.038, 0.047), f"{side}_HAND", CREAM, 10, 8)
    sphere(f"{side}_HipSocket", (sign * 0.14, 0, 0.84), (0.095, 0.095, 0.11), "PELVIS", TEAL)
    tube(f"{side}_ThighSculpt", (sign * 0.14, 0, 0.81), (sign * 0.14, 0, 0.47), (0.073, 0.09, 0.086, 0.075, 0.066), f"{side}_THIGH", DARK)
    sphere(f"{side}_KneeJoin", (sign * 0.14, 0, 0.47), (0.068, 0.07, 0.07), f"{side}_SHIN", CREAM, 12, 8)
    tube(f"{side}_ShinSculpt", (sign * 0.14, 0, 0.45), (sign * 0.14, 0, 0.16), (0.063, 0.081, 0.074, 0.057, 0.05), f"{side}_SHIN", DARK)
    rounded_box(f"{side}_Shoe", (sign * 0.14, -0.12, 0.085), (0.20, 0.34, 0.17), f"{side}_FOOT", DARK, 0.075)

# Face is far enough forward to read at ordinary third-person camera distance.
for side, sign in (("L", -1), ("R", 1)):
    sphere(f"{side}_Eye", (sign * 0.084, -0.177, 1.73), (0.055, 0.027, 0.065), "HEAD", WHITE, 12, 8)
    sphere(f"{side}_Pupil", (sign * 0.084, -0.200, 1.725), (0.020, 0.012, 0.033), "HEAD", DARK, 10, 8)
    tube(f"{side}_Brow", (sign * 0.03, -0.191, 1.825), (sign * 0.135, -0.176, 1.84), (0.012, 0.016, 0.016, 0.014, 0.009), "HEAD", DARK, 8)
tube("CurvedSmile", (-0.077, -0.182, 1.615), (0.077, -0.182, 1.615), (0.004, 0.009, 0.012, 0.009, 0.004), "HEAD", DARK, 10)


def set_pose(**spec):
    for pb in arm.pose.bones:
        pb.rotation_mode = "XYZ"
        pb.rotation_euler = (0, 0, 0)
        pb.location = (0, 0, 0)
    for name, xyz in spec.items():
        if name == "ROOT_Z":
            arm.pose.bones["ROOT"].location.y = xyz
        elif name == "PELVIS_Z":
            arm.pose.bones["PELVIS"].location.y = xyz
        else:
            arm.pose.bones[name].rotation_euler = xyz


def clip(name, frames):
    action = bpy.data.actions.new(name)
    action.use_fake_user = True
    arm.animation_data_create()
    arm.animation_data.action = action
    keys = sorted(frames)
    for frame in keys:
        scene.frame_set(frame)
        set_pose(**frames[frame])
        for pb in arm.pose.bones:
            pb.keyframe_insert(data_path="rotation_euler", frame=frame, group=pb.name)
            if pb.name in {"ROOT", "PELVIS"}:
                pb.keyframe_insert(data_path="location", frame=frame, group=pb.name)
    action["loop"] = name in {"Idle", "Walk", "FastWalk", "Talk", "Listen", "SittingIdle", "Impatient"}
    action["frames"] = (keys[0], keys[-1])
    return action


def activate(name):
    action = bpy.data.actions[name]
    arm.animation_data.action = action
    if action.slots:
        arm.animation_data.action_slot = action.slots[0]


neutral = {}
clip("Idle", {1: neutral, 13: {"ROOT_Z": 0.018, "CHEST": (0.025, 0, 0), "HEAD": (0, 0, 0.07)}, 25: {"ROOT_Z": 0, "HEAD": (0, 0, -0.04)}, 37: {"ROOT_Z": 0.015, "CHEST": (-0.02, 0, 0)}, 49: neutral})
for name, stride, bob, end in (("Walk", 0.44, 0.025, 25), ("FastWalk", 0.65, 0.045, 17)):
    def step(direction, lift):
        return {"L_THIGH": (direction * stride, 0, 0), "R_THIGH": (-direction * stride, 0, 0),
                "L_UPPER_ARM": (-direction * stride * 0.67, 0, 0), "R_UPPER_ARM": (direction * stride * 0.67, 0, 0),
                "L_SHIN": (-0.12 if direction > 0 else 0.20, 0, 0), "R_SHIN": (0.20 if direction > 0 else -0.12, 0, 0),
                "ROOT_Z": bob if lift else (-0.06 if name == "FastWalk" else -0.02)}
    clip(name, {1: step(1, False), 1 + (end - 1) // 4: step(0, True), 1 + (end - 1) // 2: step(-1, False), 1 + 3 * (end - 1) // 4: step(0, True), end: step(1, False)})
clip("Turn", {1: neutral, 13: {"ROOT": (0, math.pi / 4, 0)}, 25: {"ROOT": (0, math.pi / 2, 0)}})
clip("Talk", {1: neutral, 10: {"L_UPPER_ARM": (-0.35, 0, 0.2), "R_UPPER_ARM": (-0.58, 0, -0.15), "HEAD": (0.07, 0, -0.10)}, 19: {"L_UPPER_ARM": (-0.5, 0, 0.4), "R_FOREARM": (-0.55, 0, 0), "HEAD": (-0.05, 0, 0.10)}, 28: {"R_UPPER_ARM": (-0.5, 0, -0.3), "CHEST": (0.04, 0, 0)}, 37: neutral})
clip("Listen", {1: neutral, 12: {"HEAD": (0.08, 0.12, 0.2), "CHEST": (0.03, 0, 0)}, 25: {"HEAD": (0.07, 0.12, 0.17)}, 37: neutral})
seated = {"PELVIS_Z": -0.253, "L_THIGH": (-1.25, 0, 0), "R_THIGH": (-1.25, 0, 0), "L_SHIN": (1.25, 0, 0), "R_SHIN": (1.25, 0, 0)}
clip("SitDown", {1: neutral, 13: {"PELVIS_Z": -0.075, "L_THIGH": (-0.65, 0, 0), "R_THIGH": (-0.65, 0, 0), "L_SHIN": (0.65, 0, 0), "R_SHIN": (0.65, 0, 0)}, 25: seated})
clip("SittingIdle", {1: seated, 13: {**seated, "CHEST": (0.03, 0, 0), "HEAD": (0, 0, 0.08)}, 25: seated, 37: {**seated, "HEAD": (0, 0, -0.07)}, 49: seated})
clip("StandUp", {1: seated, 13: {"PELVIS_Z": -0.075, "L_THIGH": (-0.65, 0, 0), "R_THIGH": (-0.65, 0, 0), "L_SHIN": (0.65, 0, 0), "R_SHIN": (0.65, 0, 0)}, 25: neutral})
hold = {"L_UPPER_ARM": (-0.78, 0, -0.22), "R_UPPER_ARM": (-0.78, 0, 0.22), "L_FOREARM": (-0.28, 0, 0), "R_FOREARM": (-0.28, 0, 0)}
clip("HoldItem", {1: neutral, 12: hold, 25: hold})
clip("GiveItem", {1: hold, 11: {**hold, "L_UPPER_ARM": (-1.10, 0, -0.20), "R_UPPER_ARM": (-1.10, 0, 0.20), "CHEST": (0.10, 0, 0)}, 25: neutral})
clip("ReceiveItem", {1: neutral, 12: {"L_UPPER_ARM": (-0.98, 0, -0.18), "R_UPPER_ARM": (-0.98, 0, 0.18)}, 25: hold})
clip("Happy", {1: neutral, 8: {"ROOT_Z": 0.12, "L_UPPER_ARM": (0, 0, -0.75), "R_UPPER_ARM": (0, 0, 0.75), "HEAD": (0, 0, 0.12)}, 16: {"ROOT_Z": 0, "L_UPPER_ARM": (0, 0, -0.65), "R_UPPER_ARM": (0, 0, 0.65)}, 25: neutral})
clip("Angry", {1: neutral, 10: {"CHEST": (0.12, 0, 0), "HEAD": (-0.10, 0, 0), "L_FOREARM": (-0.7, 0, 0), "R_FOREARM": (-0.7, 0, 0)}, 18: {"ROOT_Z": -0.04, "CHEST": (0.16, 0, 0)}, 25: neutral})
clip("Confused", {1: neutral, 10: {"HEAD": (0, 0.28, 0.18), "R_UPPER_ARM": (-0.45, 0, -0.20)}, 18: {"HEAD": (0, -0.18, -0.15), "R_FOREARM": (-0.65, 0, 0)}, 25: neutral})
clip("Surprised", {1: neutral, 7: {"ROOT_Z": 0.08, "CHEST": (-0.18, 0, 0), "L_UPPER_ARM": (0, 0, -0.45), "R_UPPER_ARM": (0, 0, 0.45), "HEAD": (-0.14, 0, 0)}, 18: {"ROOT_Z": 0, "HEAD": (-0.08, 0, 0)}, 25: neutral})
clip("Impatient", {1: neutral, 10: {"R_THIGH": (0.10, 0, 0), "R_FOOT": (0.16, 0, 0), "L_UPPER_ARM": (-0.15, 0, 0.15)}, 19: {"R_THIGH": (0, 0, 0), "R_FOOT": (0, 0, 0), "HEAD": (0, 0, -0.18)}, 28: {"R_THIGH": (0.10, 0, 0), "R_FOOT": (0.16, 0, 0)}, 37: neutral})

set_pose()
scene.frame_set(1)
activate("Idle")
scene.frame_start, scene.frame_end = 1, 49

# QA stage; excluded from the GLB by selected-object export.
floor_mat = material("QA_Floor_Purple", (0.14, 0.09, 0.20))
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, -0.035))
floor = bpy.context.object
floor.name = "QA_Floor_NotForExport"
floor.dimensions = (4, 4, 0.07)
floor.data.materials.append(floor_mat)
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

def light(name, location, power, size):
    data = bpy.data.lights.new(name, "AREA")
    data.energy, data.shape, data.size = power, "DISK", size
    obj = bpy.data.objects.new(name, data)
    scene.collection.objects.link(obj)
    obj.location = location
    direction = Vector((0, 0, 1.0)) - obj.location
    obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


light("QA_Key", (2.3, -3.2, 4.5), 650, 3)
light("QA_Fill", (-3, -1, 2.6), 350, 2)
light("QA_Rim", (0, 3, 3.4), 800, 2)
camera_data = bpy.data.cameras.new("QA_Ortho")
camera = bpy.data.objects.new("QA_Ortho", camera_data)
scene.collection.objects.link(camera)
scene.camera = camera
camera_data.type = "ORTHO"
camera_data.ortho_scale = 2.7


def render_view(label, position, frame=1, action="Idle"):
    activate(action)
    scene.frame_set(frame)
    camera.location = position
    camera.rotation_euler = (Vector((0, 0, 0.93)) - camera.location).to_track_quat("-Z", "Y").to_euler()
    scene.render.filepath = str(OUT / f"style-test-{label}.png")
    bpy.ops.render.render(write_still=True)


render_view("front", (0, -4.7, 1.3))
render_view("three-quarter", (3.2, -4.0, 1.5))
render_view("side", (4.7, 0, 1.3))
render_view("back", (0, 4.7, 1.3))
render_view("walk-contact", (3.2, -4.0, 1.5), 1, "Walk")
render_view("sit-pose", (4.7, 0, 1.3), 25, "SitDown")

scene.frame_set(1)
activate("Idle")
bpy.ops.wm.save_as_mainfile(filepath=str(OUT / "style-rig-animation-test.blend"))

# Export is a structural test only. Animation action compatibility is audited
# after export; the .blend remains the editable source of truth.
bpy.ops.object.select_all(action="DESELECT")
arm.select_set(True)
for obj in scene.objects:
    if obj.type == "MESH" and obj.name.startswith("STYLE_"):
        obj.select_set(True)
bpy.context.view_layer.objects.active = arm
bpy.ops.export_scene.gltf(
    filepath=str(OUT / "style-rig-animation-test.glb"),
    export_format="GLB",
    use_selection=True,
    export_animations=True,
    export_animation_mode="ACTIONS",
    export_apply=True,
)
print("STYLE_FOUNDATION_COMPLETE", len(bpy.data.actions), OUT)
