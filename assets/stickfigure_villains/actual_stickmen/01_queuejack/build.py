"""Build the new actual-stick-man Queuejack from the shared animation rig.

The older cartoon-bodied Queuejack is deliberately not opened or overwritten.
"""
from __future__ import annotations

import math
from pathlib import Path

import bpy
from mathutils import Vector

OUT = Path(__file__).resolve().parent
ROOT = OUT.parents[1]
bpy.ops.wm.open_mainfile(filepath=str(ROOT / "foundation" / "style-rig-animation-test.blend"))
scene = bpy.context.scene
arm = bpy.data.objects["STYLE_RIG"]
arm.name = "Queuejack_StickRig"

# The old foundation only supplies an action-compatible armature and QA lights.
# Delete every old body mesh; the new mesh is built from slim, joined sticks.
for obj in list(scene.objects):
    if obj.type == "MESH" and obj.name.startswith("STYLE_"):
        bpy.data.objects.remove(obj, do_unlink=True)

# Tall but truly thin. Right hand holds a readable ticket near the head;
# left hand rests near the hip like the user's roster image.
SX, SZ = .92, 1.32
bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode="EDIT")
for bone in arm.data.edit_bones:
    for point in (bone.head, bone.tail):
        point.x *= SX
        point.z *= SZ

def rest(name, head, tail):
    bone = arm.data.edit_bones[name]
    bone.head = head
    bone.tail = tail

rest("L_SHOULDER", (-.20, 0, 1.80), (-.29, 0, 1.78))
rest("L_UPPER_ARM", (-.29, 0, 1.78), (-.43, 0, 1.39))
rest("L_FOREARM", (-.43, 0, 1.39), (-.32, -.015, 1.19))
rest("L_HAND", (-.32, -.015, 1.19), (-.30, -.015, 1.13))
rest("R_SHOULDER", (.20, 0, 1.80), (.28, 0, 1.78))
rest("R_UPPER_ARM", (.28, 0, 1.78), (.43, 0, 1.83))
rest("R_FOREARM", (.43, 0, 1.83), (.50, -.015, 2.17))
rest("R_HAND", (.50, -.015, 2.17), (.51, -.015, 2.23))
ticket_bone = arm.data.edit_bones.new("QUEUE_TICKET")
ticket_bone.head = (.50, -.04, 2.16)
ticket_bone.tail = (.56, -.04, 2.29)
ticket_bone.parent = arm.data.edit_bones["R_HAND"]
bpy.ops.object.mode_set(mode="OBJECT")

# Scale vertical action translations to match the taller rest skeleton. Keep
# the source walk's deliberate downward contact keys so the feet reach y=0.
for action in bpy.data.actions:
    for layer in action.layers:
        for strip in layer.strips:
            for bag in strip.channelbags:
                for fc in bag.fcurves:
                    if fc.data_path.endswith("location") and fc.array_index == 1:
                        for key in fc.keyframe_points:
                            key.co.y *= SZ
                            key.handle_left.y *= SZ
                            key.handle_right.y *= SZ
                            if action.name == "FastWalk" and fc.data_path == 'pose.bones["ROOT"].location' and key.co.y < 0:
                                key.co.y -= .015
                                key.handle_left.y -= .015
                                key.handle_right.y -= .015

def recolor(old_name, new_name, rgb):
    mat = bpy.data.materials[old_name]
    mat.name = new_name
    mat.diffuse_color = (*rgb, 1)
    mat.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (*rgb, 1)
    return mat

BLUE = recolor("Style_Primary_Teal", "Queuejack_ElectricBlue", (.005, .105, .66))
INK = recolor("Style_FaceAndShoe_Ink", "Queuejack_FaceInk", (.015, .025, .075))
PAPER = recolor("Style_Eye_White", "Queuejack_TicketPaper", (.98, .97, .93))
PINK = recolor("Style_Secondary_Cream", "Queuejack_TicketRed", (.93, .08, .21))

def bind(obj, bone_name, material):
    obj.data.materials.append(material)
    obj.parent = arm
    obj.matrix_parent_inverse = arm.matrix_world.inverted()
    group = obj.vertex_groups.new(name=bone_name)
    group.add(list(range(len(obj.data.vertices))), 1, "REPLACE")
    modifier = obj.modifiers.new("StickSkin", "ARMATURE")
    modifier.object = arm
    return obj

def rod(name, a, b, radius, bone_name, material, sides=8):
    a, b = Vector(a), Vector(b)
    bpy.ops.mesh.primitive_cylinder_add(vertices=sides, radius=radius, depth=(b-a).length, location=(a+b)*.5)
    obj = bpy.context.object
    obj.name = name
    obj.rotation_euler = (b-a).to_track_quat("Z", "Y").to_euler()
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    return bind(obj, bone_name, material)

def ball(name, center, size, bone_name, material, segments=12, rings=8):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=rings, location=center)
    obj = bpy.context.object
    obj.name = name
    obj.scale = size
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    return bind(obj, bone_name, material)

def bent_limb(name, a, b, c, radii, upper_bone, lower_bone, material):
    """A continuous two-bone stick with a soft bend and shared surface normals."""
    a, b, c = Vector(a), Vector(b), Vector(c)
    samples = ((a, 0), (a.lerp(b, .08), 0), (a.lerp(b, .55), 0),
               (a.lerp(b, .91), .22), (b, .50), (b.lerp(c, .09), .78),
               (b.lerp(c, .55), 1), (b.lerp(c, .92), 1), (c, 1))
    verts, faces = [], []
    side_count = 10
    for i, (point, _) in enumerate(samples):
        before = samples[max(0, i-1)][0]
        after = samples[min(len(samples)-1, i+1)][0]
        tangent = (after-before).normalized()
        axis_u = tangent.cross(Vector((0, 1, 0))).normalized()
        axis_v = tangent.cross(axis_u).normalized()
        radius = radii[0] + (radii[1]-radii[0]) * (i/8)
        if i in (0, 8):
            radius *= .78
        for j in range(side_count):
            angle = math.tau * j / side_count
            verts.append(point + radius*(math.cos(angle)*axis_u + math.sin(angle)*axis_v))
        if i:
            for j in range(side_count):
                nxt = (j+1) % side_count
                faces.append(((i-1)*side_count+j, (i-1)*side_count+nxt,
                              i*side_count+nxt, i*side_count+j))
    faces.extend((tuple(reversed(range(side_count))),
                  tuple((len(samples)-1)*side_count+j for j in range(side_count))))
    mesh = bpy.data.meshes.new(name + "Mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    scene.collection.objects.link(obj)
    mesh.materials.append(material)
    for polygon in mesh.polygons:
        polygon.use_smooth = len(polygon.vertices) == 4
    obj.parent = arm
    obj.matrix_parent_inverse = arm.matrix_world.inverted()
    top = obj.vertex_groups.new(name=upper_bone)
    bottom = obj.vertex_groups.new(name=lower_bone)
    for i, (_, lower_weight) in enumerate(samples):
        indices = list(range(i*side_count, (i+1)*side_count))
        if lower_weight < 1:
            top.add(indices, 1-lower_weight, "REPLACE")
        if lower_weight > 0:
            bottom.add(indices, lower_weight, "REPLACE")
    modifier = obj.modifiers.new("StickSkin", "ARMATURE")
    modifier.object = arm
    return obj

def spine_tube():
    """One tapered torso/neck surface, blended across four rig bones."""
    rings = ((1.096,.045), (1.22,.049), (1.31,.051), (1.39,.052),
             (1.50,.052), (1.63,.051), (1.72,.050), (1.82,.048),
             (1.88,.044), (1.94,.035), (2.07,.034))
    count = 10
    verts, faces = [], []
    for i, (z, radius) in enumerate(rings):
        for j in range(count):
            theta = math.tau*j/count
            verts.append((radius*math.cos(theta), radius*math.sin(theta), z))
        if i:
            for j in range(count):
                k = (j+1)%count
                faces.append(((i-1)*count+j,(i-1)*count+k,i*count+k,i*count+j))
    faces.extend((tuple(reversed(range(count))),
                  tuple((len(rings)-1)*count+j for j in range(count))))
    mesh = bpy.data.meshes.new("Queuejack_ContinuousSpineMesh")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new("Queuejack_ContinuousSpine", mesh)
    scene.collection.objects.link(obj)
    mesh.materials.append(BLUE)
    for poly in mesh.polygons:
        poly.use_smooth = len(poly.vertices) == 4
    obj.parent = arm
    obj.matrix_parent_inverse = arm.matrix_world.inverted()
    groups = {name:obj.vertex_groups.new(name=name) for name in ("PELVIS","SPINE","CHEST","NECK")}
    for i, (z, _) in enumerate(rings):
        if z < 1.31:
            weights = (("PELVIS",1),)
        elif z < 1.39:
            t = (z-1.31)/.08
            weights = (("PELVIS",1-t),("SPINE",t))
        elif z < 1.63:
            weights = (("SPINE",1),)
        elif z < 1.72:
            t = (z-1.63)/.09
            weights = (("SPINE",1-t),("CHEST",t))
        elif z < 1.88:
            weights = (("CHEST",1),)
        elif z < 1.94:
            t = (z-1.88)/.06
            weights = (("CHEST",1-t),("NECK",t))
        else:
            weights = (("NECK",1),)
        indices = list(range(i*count,(i+1)*count))
        for bone_name, weight in weights:
            if weight > .0001:
                groups[bone_name].add(indices,weight,"REPLACE")
    modifier = obj.modifiers.new("StickSkin","ARMATURE")
    modifier.object = arm
    return obj

def plate(name, center, size, bone_name, material, bevel=0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=center)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = size
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    if bevel:
        mod = obj.modifiers.new("SoftPaperCorners", "BEVEL")
        mod.width = bevel
        mod.segments = 2
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.modifier_apply(modifier=mod.name)
    return bind(obj, bone_name, material)

# Keep the central body one clean, flexible stick instead of four stacked rods.
spine_tube()
rod("Queuejack_HeadStem", (0, 0, 2.07), (0, 0, 2.17), .035, "HEAD", BLUE)

# Shoulder and hip junctions are literal short stick branches. They bridge the
# central line to the limb lines so a neutral pose never looks disassembled.
for side, sign in (("L", -1), ("R", 1)):
    rod(f"Queuejack_{side}_ShoulderBridge", (0, 0, 1.80), (sign*.30, 0, 1.79), .034, "CHEST", BLUE)
    rod(f"Queuejack_{side}_HipBridge", (0, 0, 1.105), (sign*.129, 0, 1.105), .041, "PELVIS", BLUE)

ball("Queuejack_RoundHead", (0, -.005, 2.29), (.190, .176, .196), "HEAD", BLUE, 16, 10)
for side, sign in (("L", -1), ("R", 1)):
    upper = arm.data.bones[f"{side}_UPPER_ARM"]
    forearm = arm.data.bones[f"{side}_FOREARM"]
    bent_limb(f"Queuejack_{side}_ContinuousArm", upper.head_local, upper.tail_local,
              forearm.tail_local, (.037,.029), f"{side}_UPPER_ARM", f"{side}_FOREARM", BLUE)
    thigh = arm.data.bones[f"{side}_THIGH"]
    shin = arm.data.bones[f"{side}_SHIN"]
    ankle = shin.tail_local.copy()
    ankle.z = .12
    bent_limb(f"Queuejack_{side}_ContinuousLeg", thigh.head_local, thigh.tail_local,
              ankle, (.043,.036), f"{side}_THIGH", f"{side}_SHIN", BLUE)
    hand_bone = arm.data.bones[f"{side}_HAND"]
    rod(f"Queuejack_{side}_WristBridge", hand_bone.head_local, hand_bone.tail_local,
        .030, f"{side}_HAND", BLUE)
    ball(f"Queuejack_{side}_TinyHand", hand_bone.tail_local, (.052, .047, .062), f"{side}_HAND", BLUE)
    foot_bone = arm.data.bones[f"{side}_FOOT"]
    x = foot_bone.head_local.x
    ball(f"Queuejack_{side}_SmallFoot", (x, -.09, .065), (.104, .166, .065), f"{side}_FOOT", BLUE)

# Dot eyes, severe angled eyebrows, and a tiny unimpressed mouth.
for side, sign in (("L", -1), ("R", 1)):
    ball(f"Queuejack_{side}_DotEye", (sign*.070, -.174, 2.325), (.020, .013, .031), "HEAD", INK, 10, 6)
    brow_a = (sign*.030, -.178, 2.381 + (.005 if side == "L" else 0))
    brow_b = (sign*.125, -.162, 2.410 + (.005 if side == "L" else 0))
    rod(f"Queuejack_{side}_AngryBrow", brow_a, brow_b, .012, "HEAD", INK, 6)
rod("Queuejack_SmugMouth", (-.051, -.179, 2.235), (.044, -.179, 2.230), .007, "HEAD", INK, 6)

# An intentionally oversized numbered ticket, held at its bottom-left corner.
# It is broad enough to remain readable at ordinary corridor distance.
plate("Queuejack_TicketCard", (.575, -.060, 2.295), (.270, .013, .365), "QUEUE_TICKET", PAPER, .018)
ball("Queuejack_TicketGripThumb", (.472, -.085, 2.145), (.039, .028, .046), "R_HAND", BLUE, 10, 6)
plate("Queuejack_TicketTopBand", (.575, -.070, 2.438), (.225, .004, .027), "QUEUE_TICKET", PINK)
rod("Queuejack_TicketNumberStroke", (.566, -.073, 2.253), (.566, -.073, 2.371), .012, "QUEUE_TICKET", PINK, 6)
rod("Queuejack_TicketNumberHook", (.532, -.073, 2.335), (.566, -.073, 2.371), .011, "QUEUE_TICKET", PINK, 6)
rod("Queuejack_TicketNumberBase", (.528, -.073, 2.246), (.610, -.073, 2.246), .010, "QUEUE_TICKET", PINK, 6)
for index, z in enumerate((2.207, 2.174)):
    rod(f"Queuejack_TicketPrintedLine_{index}", (.493, -.073, z), (.651, -.073, z), .004, "QUEUE_TICKET", INK, 6)

# A self-contained show-the-ticket beat. The printed card stays in his grip.
special = bpy.data.actions.new("Queuejack_ShowTicket")
special.use_fake_user = True
arm.animation_data.action = special
for frame, wrist, nod, tilt in ((1, 0, 0, 0), (8, -.22, -.04, .16), (16, .58, .10, -.36), (25, -.28, -.04, .21), (37, 0, 0, 0)):
    scene.frame_set(frame)
    ticket = arm.pose.bones["QUEUE_TICKET"]
    ticket.rotation_mode = "XYZ"
    ticket.rotation_euler = (0, wrist, tilt)
    ticket.keyframe_insert(data_path="rotation_euler", frame=frame, group="QUEUE_TICKET")
    head = arm.pose.bones["HEAD"]
    head.rotation_mode = "XYZ"
    head.rotation_euler = (nod, 0, -.05 if frame in (16, 25) else 0)
    head.keyframe_insert(data_path="rotation_euler", frame=frame, group="HEAD")
special["loop"] = False
special["frames"] = (1, 37)

# One skinned mesh keeps renderer draw calls modest while retaining named
# submeshes in the editable source until the last build step.
meshes = [obj for obj in scene.objects if obj.type == "MESH" and obj.parent == arm]
bpy.ops.object.select_all(action="DESELECT")
for obj in meshes:
    obj.select_set(True)
bpy.context.view_layer.objects.active = meshes[0]
bpy.ops.object.join()
body = bpy.context.object
body.name = "Queuejack_StickMesh"
assert any(mod.type == "ARMATURE" for mod in body.modifiers)

def reset(action_name="Idle"):
    arm.animation_data.action = None
    for pose_bone in arm.pose.bones:
        pose_bone.rotation_mode = "XYZ"
        pose_bone.rotation_euler = (0, 0, 0)
        pose_bone.location = (0, 0, 0)
    action = bpy.data.actions[action_name]
    arm.animation_data.action = action
    arm.animation_data.action_slot = action.slots[0]

camera = scene.camera
camera.data.ortho_scale = 3.20
scene.render.resolution_x = 760
scene.render.resolution_y = 760

def render(label, position, action="Idle", frame=1):
    reset(action)
    scene.frame_set(frame)
    camera.location = position
    camera.rotation_euler = (Vector((.12, 0, 1.27)) - camera.location).to_track_quat("-Z", "Y").to_euler()
    scene.render.filepath = str(OUT / f"queuejack-{label}.png")
    bpy.ops.render.render(write_still=True)

render("front", (0, -5, 2.7))
render("three-quarter", (3.0, -4.1, 2.7))
render("side", (5, 0, 2.7))
render("back", (0, 5, 2.7))
render("walk", (3.0, -4.1, 2.7), "Walk", 1)
render("sit", (5, 0, 2.7), "SitDown", 25)
render("show-ticket", (3.0, -4.1, 2.7), "Queuejack_ShowTicket", 16)
reset("Idle")
scene.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=str(OUT / "queuejack-stick.blend"))
bpy.ops.object.select_all(action="DESELECT")
arm.select_set(True)
body.select_set(True)
bpy.context.view_layer.objects.active = arm
bpy.ops.export_scene.gltf(filepath=str(OUT / "queuejack-stick.glb"), export_format="GLB", use_selection=True,
                          export_animations=True, export_animation_mode="ACTIONS", export_apply=True)
print("QUEUEJACK_STICK_BUILD_COMPLETE", len(bpy.data.actions), len(body.data.polygons))
