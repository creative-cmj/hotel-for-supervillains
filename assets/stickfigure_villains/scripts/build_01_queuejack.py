"""Build Queuejack individually from the verified shared style/rig foundation."""
from __future__ import annotations

import math
from pathlib import Path

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "01_queuejack"
OUT.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(ROOT / "foundation" / "style-rig-animation-test.blend"))
scene = bpy.context.scene
arm = bpy.data.objects["STYLE_RIG"]
arm.name = "Queuejack_Rig"

# A very tall, narrow line-cutting dandy.  This changes the actual rest mesh and
# armature together, rather than merely scaling the finished character object.
for obj in list(scene.objects):
    if obj.type == "MESH" and obj.name.startswith("STYLE_"):
        for v in obj.data.vertices:
            v.co.x *= .73
            v.co.y *= .88
            v.co.z *= 1.34
        obj.name = obj.name.replace("STYLE_", "Queuejack_")
bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode="EDIT")
for b in arm.data.edit_bones:
    for p in (b.head, b.tail):
        p.x *= .73
        p.y *= .88
        p.z *= 1.34
bpy.ops.object.mode_set(mode="OBJECT")

# Translation keys are distances in metres.  Keep the tall variant's root bob
# and chair transition proportional to the rest rig's 1.34x vertical scale.
for action in bpy.data.actions:
    for layer in action.layers:
        for strip in layer.strips:
            for bag in strip.channelbags:
                for fc in bag.fcurves:
                    if fc.data_path.endswith('location') and fc.array_index==1:
                        for key in fc.keyframe_points:
                            key.co.y *= 1.34
                            key.handle_left.y *= 1.34
                            key.handle_right.y *= 1.34

def color(mat_name, rgb):
    m = bpy.data.materials[mat_name]
    m.diffuse_color = (*rgb, 1)
    m.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (*rgb, 1)
    return m

INK = color("Style_Primary_Teal", (.025, .055, .18))
CREAM = color("Style_Secondary_Cream", (.89, .81, .65))
DARK = color("Style_FaceAndShoe_Ink", (.021, .026, .065))
WHITE = color("Style_Eye_White", (.96, .92, .80))
GOLD = bpy.data.materials.new("Queuejack_BrassAccent")
GOLD.diffuse_color = (.70, .35, .055, 1)
GOLD.use_nodes = True
GOLD.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (.70, .35, .055, 1)
GOLD.node_tree.nodes["Principled BSDF"].inputs["Metallic"].default_value = .36

def bind(obj, bone, mat):
    obj.data.materials.append(mat)
    obj.parent = arm
    obj.matrix_parent_inverse = arm.matrix_world.inverted()
    group = obj.vertex_groups.new(name=bone)
    group.add(list(range(len(obj.data.vertices))), 1.0, "REPLACE")
    mod = obj.modifiers.new("ArmatureSkin", "ARMATURE")
    mod.object = arm
    return obj

def poly(name, verts, faces, bone, mat):
    mesh = bpy.data.meshes.new(name + "_Mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    scene.collection.objects.link(obj)
    for face in mesh.polygons:
        face.use_smooth = False
    return bind(obj, bone, mat)

def panel(name, outline, thickness, bone, mat):
    # Convex shallow applique with real edge depth; normal faces point outward.
    n = len(outline)
    back = [(x, y + thickness, z) for x, y, z in outline]
    faces = [tuple(range(n)), tuple(range(2*n-1, n-1, -1))]
    for i in range(n):
        j = (i+1) % n
        faces.append((i, j, n+j, n+i))
    return poly(name, outline+back, faces, bone, mat)

def uv_sphere(name, center, size, bone, mat, segments=12, rings=8):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=rings, location=center)
    obj=bpy.context.object
    obj.name=name
    obj.scale=size
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    for f in obj.data.polygons: f.use_smooth=True
    return bind(obj,bone,mat)

def cylinder_between(name, a, b, radius, bone, mat, vertices=12):
    a,b=Vector(a),Vector(b)
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=(b-a).length, location=(a+b)*.5)
    obj=bpy.context.object
    obj.name=name
    obj.rotation_euler=(b-a).to_track_quat("Z","Y").to_euler()
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    for f in obj.data.polygons: f.use_smooth=len(f.vertices)==4
    return bind(obj,bone,mat)

# Collar and continuous angular tailcoat distinguish him without dense detail.
for sign, side in ((-1,"L"),(1,"R")):
    panel(f"Queuejack_{side}_GoldLapel", [
        (sign*.06,-.205,1.85),(sign*.16,-.155,1.88),
        (sign*.12,-.205,1.58),(sign*.027,-.216,1.44)], .018, "CHEST", GOLD)
    panel(f"Queuejack_{side}_CoatHem", [
        (sign*.06,-.155,1.38),(sign*.15,-.12,1.40),
        (sign*.13,-.10,1.00),(sign*.035,-.15,.95)], .020, "SPINE", INK)
    uv_sphere(f"Queuejack_{side}_Cuff", (sign*.322,-.014,1.055), (.055,.052,.034), f"{side}_FOREARM", GOLD)

# A slightly lopsided, smug face; large features survive the gameplay camera.
for obj in scene.objects:
    if obj.name.endswith("L_Brow_Mesh_HEAD"):
        for v in obj.data.vertices: v.co.z += .016 * (v.co.x < 0)
    elif "CurvedSmile" in obj.name:
        for v in obj.data.vertices: v.co.z += .025 * (v.co.x > 0)

# His slim cane is actually held in the right mitten.  The tip touches floor
# in the neutral pose; its handle sits just under the hand.
bpy.context.view_layer.objects.active=arm
bpy.ops.object.mode_set(mode="EDIT")
cane_bone=arm.data.edit_bones.new("CANE_GRIP")
cane_bone.head=(.335,-.026,.93)
cane_bone.tail=(.335,-.026,.82)
cane_bone.parent=arm.data.edit_bones["R_HAND"]
bpy.ops.object.mode_set(mode="OBJECT")
cylinder_between("Queuejack_CaneShaft", (.335,-.026,.02), (.335,-.026,.89), .018, "CANE_GRIP", DARK)
uv_sphere("Queuejack_CaneKnob", (.335,-.026,.90), (.048,.048,.046), "CANE_GRIP", GOLD)
cylinder_between("Queuejack_CaneFerrule", (.335,-.026,.028), (.335,-.026,.09), .024, "CANE_GRIP", GOLD)

# Rotate the cane up across his lap when seated so it never goes through the
# hotel floor.  This is a small character-specific edit to three core clips.
for action_name,keys in {
    "SitDown":((1,0),(13,.55),(25,1.1)),
    "SittingIdle":((1,1.1),(49,1.1)),
    "StandUp":((1,1.1),(13,.55),(25,0)),
}.items():
    action=bpy.data.actions[action_name]
    arm.animation_data.action=action
    arm.animation_data.action_slot=action.slots[0]
    for frame,angle in keys:
        scene.frame_set(frame)
        pb=arm.pose.bones["CANE_GRIP"]
        pb.rotation_mode="XYZ"
        pb.rotation_euler=(angle,0,0)
        pb.keyframe_insert(data_path="rotation_euler",frame=frame,group=pb.name)

# A dramatic hotel queue-ticket tail curls sideways behind the coat so it
# reads in side and three-quarter silhouette.  Three rigid overlapping strips
# follow separate feature bones during the character-specific animation.
bpy.context.view_layer.objects.active=arm
bpy.ops.object.mode_set(mode="EDIT")
points=[(0,.13,1.53),(.035,.31,1.31),(.14,.54,1.21),(.30,.75,1.30),(.47,.89,1.48),(.55,.91,1.72),(.50,.81,1.94)]
anchors=list(zip(points[:-1],points[1:]))
for i,(head,tail) in enumerate(anchors,1):
    b=arm.data.edit_bones.new(f"TICKET_{i}")
    b.head=head; b.tail=tail
    b.parent=arm.data.edit_bones["SPINE" if i==1 else f"TICKET_{i-1}"]
bpy.ops.object.mode_set(mode="OBJECT")
# One continuous ribbon mesh, with blended skin weights at the bends.  The
# cross-section lies in the side-view plane, so the tail reads as a curl rather
# than a collection of paper rectangles.
verts=[]
ring_frames=[]
for i,p in enumerate(points):
    center=Vector(p)
    direction=(Vector(points[min(i+1,len(points)-1)])-Vector(points[max(i-1,0)])).normalized()
    across=direction.cross(Vector((1,0,0))).normalized()*.068
    normal=direction.cross(across).normalized()*.006
    ring_frames.append((center,direction,across,normal))
    verts.extend([tuple(center-across-normal),tuple(center+across-normal),
                  tuple(center+across+normal),tuple(center-across+normal)])
faces=[]
for i in range(len(points)-1):
    a,b=4*i,4*(i+1)
    for j in range(4):
        k=(j+1)%4
        faces.append((a+j,b+j,b+k,a+k))
faces.extend([(3,2,1,0),tuple(range(4*(len(points)-1),4*len(points)))])
ribbon=poly("Queuejack_ContinuousTicketRibbon",verts,faces,"TICKET_1",CREAM)
initial=ribbon.vertex_groups.get("TICKET_1")
initial.remove(list(range(len(verts))))
for i in range(len(points)):
    indices=list(range(4*i,4*i+4))
    if i==0:
        ribbon.vertex_groups["TICKET_1"].add(indices,1,"REPLACE")
    elif i==len(points)-1:
        ribbon.vertex_groups[f"TICKET_{len(anchors)}"].add(indices,1,"REPLACE")
    else:
        ribbon.vertex_groups[f"TICKET_{i}"].add(indices,.5,"REPLACE")
        ribbon.vertex_groups.new(name=f"TICKET_{i+1}") if not ribbon.vertex_groups.get(f"TICKET_{i+1}") else None
        ribbon.vertex_groups[f"TICKET_{i+1}"].add(indices,.5,"REPLACE")
# Large printed dashes sell the queue-ticket joke without a texture image.
for i in (2,4,6):
    p0,p1=Vector(points[i-1]),Vector(points[i])
    center=p0.lerp(p1,.5)
    _,direction,across,normal=ring_frames[i]
    for face_side in (-1,1):
        offset=normal*(face_side*1.6)
        dash=[tuple(center-across*.47-direction*.012+offset),
              tuple(center+across*.47-direction*.012+offset),
              tuple(center+across*.47+direction*.012+offset),
              tuple(center-across*.47+direction*.012+offset)]
        poly(f"Queuejack_TicketDash_{i}_{face_side}",dash,[(0,1,2,3)],f"TICKET_{i}",DARK)

# The foundation rig's 17 clips remain intact.  One additional action animates
# the defining ticket tail with a theatrical 'first in line' flick.
special=bpy.data.actions.new("Queuejack_TicketFlick")
special.use_fake_user=True
arm.animation_data.action=special
for frame,angle in ((1,0),(7,-.28),(14,.46),(20,-.14),(29,0)):
    scene.frame_set(frame)
    for i in range(1,len(anchors)+1):
        pb=arm.pose.bones[f"TICKET_{i}"]
        pb.rotation_mode="XYZ"
        pb.rotation_euler=(angle*(.27+i*.09),0,angle*(.12+i*.04))
        pb.keyframe_insert(data_path="rotation_euler",frame=frame,group=pb.name)
special["loop"]=False
special["frames"]=(1,29)

idle=bpy.data.actions["Idle"]
arm.animation_data.action=idle
arm.animation_data.action_slot=idle.slots[0]
scene.frame_set(1)

# Join skinned islands into one editable mesh.  glTF then needs one skin and a
# few material primitives instead of dozens of individual draw calls.
meshes=[o for o in scene.objects if o.type=="MESH" and o.parent==arm]
bpy.ops.object.select_all(action="DESELECT")
for obj in meshes: obj.select_set(True)
bpy.context.view_layer.objects.active=meshes[0]
bpy.ops.object.join()
body=bpy.context.object
body.name="Queuejack_SkinnedMesh"
assert len(body.vertex_groups)>=20
assert any(m.type=="ARMATURE" for m in body.modifiers)

# QA floor/camera/lights remain in the .blend, but are excluded from the GLB.
camera=scene.camera
camera.data.ortho_scale=3.35
def render(label,position,action="Idle",frame=1):
    arm.animation_data.action=None
    for pb in arm.pose.bones:
        pb.rotation_mode="XYZ"
        pb.rotation_euler=(0,0,0)
        pb.location=(0,0,0)
    a=bpy.data.actions[action]
    arm.animation_data.action=a
    arm.animation_data.action_slot=a.slots[0]
    scene.frame_set(frame)
    camera.location=position
    camera.rotation_euler=(Vector((0,0,1.25))-camera.location).to_track_quat("-Z","Y").to_euler()
    scene.render.filepath=str(OUT/f"queuejack-{label}.png")
    bpy.ops.render.render(write_still=True)

render("front",(0,-6,1.8))
render("three-quarter",(4,-5,1.8))
render("side",(6,0,1.8))
render("back",(0,6,1.8))
render("walk",(4,-5,1.8),"Walk",1)
render("sit",(6,0,1.8),"SitDown",25)
render("ticket-flick",(4,-5,1.8),"Queuejack_TicketFlick",14)

arm.animation_data.action=None
for pb in arm.pose.bones:
    pb.rotation_mode="XYZ"
    pb.rotation_euler=(0,0,0)
    pb.location=(0,0,0)
arm.animation_data.action=idle
arm.animation_data.action_slot=idle.slots[0]
scene.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/"01_queuejack.blend"))
bpy.ops.object.select_all(action="DESELECT")
arm.select_set(True); body.select_set(True)
bpy.context.view_layer.objects.active=arm
bpy.ops.export_scene.gltf(filepath=str(OUT/"01_queuejack.glb"),export_format="GLB",use_selection=True,
                          export_animations=True,export_animation_mode="ACTIONS",export_apply=True)
print("QUEUEJACK_COMPLETE",len(bpy.data.actions),len(body.data.polygons),OUT)
