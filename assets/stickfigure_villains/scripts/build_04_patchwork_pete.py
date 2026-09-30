"""Build 04 Patchwork Pete, squat hotel handyman with one huge repaired torso."""
from __future__ import annotations
import math
from pathlib import Path
import bpy
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"04_patchwork_pete"; OUT.mkdir(exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(ROOT/"foundation"/"style-rig-animation-test.blend"))
scene=bpy.context.scene
arm=bpy.data.objects["STYLE_RIG"]; arm.name="PatchworkPete_Rig"
SX,SY,SZ=1.19,1.12,.89
for obj in list(scene.objects):
    if obj.type=="MESH" and obj.name.startswith("STYLE_"):
        for v in obj.data.vertices:
            v.co.x*=SX;v.co.y*=SY;v.co.z*=SZ
            if "TorsoContinuous" in obj.name:
                v.co.x*=1.05
                v.co.y*=1.04
            if "HeadSculpt" in obj.name:
                v.co.x*=1.06;v.co.z*=.91
        obj.name=obj.name.replace("STYLE_","PatchworkPete_")
bpy.context.view_layer.objects.active=arm;bpy.ops.object.mode_set(mode="EDIT")
for b in arm.data.edit_bones:
    for p in (b.head,b.tail):p.x*=SX;p.y*=SY;p.z*=SZ
b=arm.data.edit_bones.new("GIANT_PATCH")
b.head=(0,-.17,1.0);b.tail=(0,-.17,1.14);b.parent=arm.data.edit_bones["SPINE"]
bpy.ops.object.mode_set(mode="OBJECT")
for action in bpy.data.actions:
    for layer in action.layers:
        for strip in layer.strips:
            for bag in strip.channelbags:
                for fc in bag.fcurves:
                    if fc.data_path.endswith("location") and fc.array_index==1:
                        for k in fc.keyframe_points:
                            k.co.y*=SZ;k.handle_left.y*=SZ;k.handle_right.y*=SZ
for name,raise_by in (("Walk",.050),("FastWalk",.070)):
    for layer in bpy.data.actions[name].layers:
        for strip in layer.strips:
            for bag in strip.channelbags:
                for fc in bag.fcurves:
                    if fc.data_path=='pose.bones["ROOT"].location' and fc.array_index==1:
                        for k in fc.keyframe_points:
                            if k.co.y<0:
                                k.co.y+=raise_by;k.handle_left.y+=raise_by;k.handle_right.y+=raise_by

def recolor(name,rgb):
    m=bpy.data.materials[name];m.diffuse_color=(*rgb,1)
    m.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value=(*rgb,1)
    return m
COBALT=recolor("Style_Primary_Teal",(.065,.21,.70))
CREAM=recolor("Style_Secondary_Cream",(.96,.82,.62))
INK=recolor("Style_FaceAndShoe_Ink",(.07,.075,.13))
WHITE=recolor("Style_Eye_White",(.98,.96,.9))
ORANGE=bpy.data.materials.new("PatchworkPete_BigOrangeRepair")
ORANGE.diffuse_color=(.95,.34,.055,1);ORANGE.use_nodes=True
ORANGE.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value=ORANGE.diffuse_color

def bind(obj,bone,mat):
    obj.data.materials.append(mat);obj.parent=arm;obj.matrix_parent_inverse=arm.matrix_world.inverted()
    vg=obj.vertex_groups.new(name=bone);vg.add(list(range(len(obj.data.vertices))),1,"REPLACE")
    mod=obj.modifiers.new("ArmatureSkin","ARMATURE");mod.object=arm
    return obj
def poly(name,verts,faces,bone,mat,smooth=False):
    mesh=bpy.data.meshes.new(name+"_Mesh");mesh.from_pydata(verts,[],faces);mesh.update()
    obj=bpy.data.objects.new(name,mesh);scene.collection.objects.link(obj)
    for f in mesh.polygons:f.use_smooth=smooth
    return bind(obj,bone,mat)
def sphere(name,center,size,bone,mat,segments=12,rings=8):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments,ring_count=rings,location=center)
    obj=bpy.context.object;obj.name=name;obj.scale=size
    bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
    for f in obj.data.polygons:f.use_smooth=True
    return bind(obj,bone,mat)
def bar(name,a,b,radius,bone,mat,sides=10):
    a,b=Vector(a),Vector(b)
    bpy.ops.mesh.primitive_cylinder_add(vertices=sides,radius=radius,depth=(b-a).length,location=(a+b)*.5)
    obj=bpy.context.object;obj.name=name;obj.rotation_euler=(b-a).to_track_quat("Z","Y").to_euler()
    bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
    return bind(obj,bone,mat)

# An intentionally uneven, proud face: one eye and brow a little higher.
for obj in scene.objects:
    if "R_Eye" in obj.name or "R_Pupil" in obj.name:
        for v in obj.data.vertices:v.co.z+=.025
    if "R_Brow" in obj.name:
        for v in obj.data.vertices:v.co.z+=.040
    if "CurvedSmile" in obj.name:
        for v in obj.data.vertices:v.co.z-=.020*(1-min(1,abs(v.co.x)/.1))

# One padded, very large asymmetrical repair is the visual joke. It follows
# the torso bone, has real thickness, and its stitched perimeter is readable.
outline=[(-.225,.86),(-.29,.98),(-.24,1.15),(-.12,1.24),(.14,1.25),(.26,1.13),(.24,.91),(.07,.83)]
front=[(x,-.295,z) for x,z in outline]
back=[(x,-.245,z) for x,z in outline]
verts=front+back;n=len(outline)
faces=[tuple(range(n)),tuple(range(n,2*n))]
for i in range(n):faces.append((i,(i+1)%n,(i+1)%n+n,i+n))
poly("PatchworkPete_GiantPaddedRepair",verts,faces,"GIANT_PATCH",ORANGE)
for i in range(n):
    j=(i+1)%n
    a=Vector((outline[i][0],-.305,outline[i][1]));b=Vector((outline[j][0],-.305,outline[j][1]))
    bar(f"PatchworkPete_Seam_{i:02d}",a,b,.007,"GIANT_PATCH",CREAM,6)
    mid=(a+b)*.5
    # Oversized stitches are functional graphic marks, not tiny texture noise.
    direction=(b-a).normalized();perp=Vector((-direction.z,0,direction.x))*.018
    bar(f"PatchworkPete_Stitch_{i:02d}",mid-perp,mid+perp,.007,"GIANT_PATCH",INK,6)

# The tiny needle is a secondary prop held between his left mitten and thumb.
bar("PatchworkPete_Needle",(-.53,-.04,.58),(-.47,-.04,.73),.006,"L_HAND",CREAM,6)
sphere("PatchworkPete_NeedleHead",(-.47,-.04,.73),(.018,.012,.018),"L_HAND",ORANGE,10,6)

special=bpy.data.actions.new("PatchworkPete_SlapPatch")
special.use_fake_user=True;arm.animation_data.action=special
for frame,pitch,patch_scale,head_tilt in ((1,0,1,0),(9,-.35,1,0),(17,-.88,1.08,.12),(25,-.70,1.04,-.10),(37,0,1,0)):
    scene.frame_set(frame)
    hand=arm.pose.bones["R_UPPER_ARM"];hand.rotation_mode="XYZ";hand.rotation_euler=(pitch,0,-.18)
    hand.keyframe_insert(data_path="rotation_euler",frame=frame,group=hand.name)
    patch_bone=arm.pose.bones["GIANT_PATCH"];patch_bone.scale=(patch_scale,patch_scale,patch_scale)
    patch_bone.keyframe_insert(data_path="scale",frame=frame,group=patch_bone.name)
    head=arm.pose.bones["HEAD"];head.rotation_mode="XYZ";head.rotation_euler=(head_tilt,0,0)
    head.keyframe_insert(data_path="rotation_euler",frame=frame,group=head.name)
special["loop"]=False;special["frames"]=(1,37)

meshes=[o for o in scene.objects if o.type=="MESH" and o.parent==arm]
bpy.ops.object.select_all(action="DESELECT")
for o in meshes:o.select_set(True)
bpy.context.view_layer.objects.active=meshes[0];bpy.ops.object.join()
body=bpy.context.object;body.name="PatchworkPete_SkinnedMesh"
assert any(m.type=="ARMATURE" for m in body.modifiers)
def reset(action_name="Idle"):
    arm.animation_data.action=None
    for pb in arm.pose.bones:pb.rotation_mode="XYZ";pb.rotation_euler=(0,0,0);pb.location=(0,0,0);pb.scale=(1,1,1)
    a=bpy.data.actions[action_name];arm.animation_data.action=a;arm.animation_data.action_slot=a.slots[0]
camera=scene.camera;camera.data.ortho_scale=2.65
def render(name,position,action="Idle",frame=1):
    reset(action);scene.frame_set(frame);camera.location=position
    camera.rotation_euler=(Vector((0,0,.87))-camera.location).to_track_quat("-Z","Y").to_euler()
    scene.render.filepath=str(OUT/f"patchwork-pete-{name}.png");bpy.ops.render.render(write_still=True)
render("front",(0,-4,1.8));render("three-quarter",(2.4,-3.3,1.8))
render("side",(4,0,1.8));render("back",(0,4,1.8))
render("walk",(2.4,-3.3,1.8),"Walk",1)
render("sit",(4,0,1.8),"SitDown",25)
render("slap-patch",(2.4,-3.3,1.8),"PatchworkPete_SlapPatch",17)
reset("Idle");scene.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/"04_patchwork_pete.blend"))
bpy.ops.object.select_all(action="DESELECT")
arm.select_set(True);body.select_set(True);bpy.context.view_layer.objects.active=arm
bpy.ops.export_scene.gltf(filepath=str(OUT/"04_patchwork_pete.glb"),export_format="GLB",use_selection=True,
                          export_animations=True,export_animation_mode="ACTIONS",export_apply=True)
print("PATCHWORK_PETE_COMPLETE",len(bpy.data.actions),len(body.data.polygons),OUT)
