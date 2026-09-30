"""Build 03 Mrs Mute: a narrow guest with an oversized acoustic collar."""
from __future__ import annotations

import math
from pathlib import Path
import bpy
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"03_mrs_mute"
OUT.mkdir(exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(ROOT/"foundation"/"style-rig-animation-test.blend"))
scene=bpy.context.scene
arm=bpy.data.objects["STYLE_RIG"]
arm.name="MrsMute_Rig"

SX,SY,SZ=.79,.88,.96
for obj in list(scene.objects):
    if obj.type=="MESH" and obj.name.startswith("STYLE_"):
        for v in obj.data.vertices:
            v.co.x*=SX; v.co.y*=SY; v.co.z*=SZ
            if "HeadSculpt" in obj.name:
                v.co.x*=.90
                v.co.z*=1.025
            if "TorsoContinuous" in obj.name:
                v.co.x*=.9
        obj.name=obj.name.replace("STYLE_","MrsMute_")
bpy.context.view_layer.objects.active=arm
bpy.ops.object.mode_set(mode="EDIT")
for b in arm.data.edit_bones:
    for p in (b.head,b.tail):
        p.x*=SX; p.y*=SY; p.z*=SZ
b=arm.data.edit_bones.new("MUTE_COLLAR")
b.head=(0,0,1.36); b.tail=(0,0,1.50); b.parent=arm.data.edit_bones["NECK"]
bpy.ops.object.mode_set(mode="OBJECT")
for action in bpy.data.actions:
    for layer in action.layers:
        for strip in layer.strips:
            for bag in strip.channelbags:
                for fc in bag.fcurves:
                    if fc.data_path.endswith("location") and fc.array_index==1:
                        for k in fc.keyframe_points:
                            k.co.y*=SZ; k.handle_left.y*=SZ; k.handle_right.y*=SZ
for name,raise_by in (("Walk",.030),("FastWalk",.035)):
    action=bpy.data.actions[name]
    for layer in action.layers:
        for strip in layer.strips:
            for bag in strip.channelbags:
                for fc in bag.fcurves:
                    if fc.data_path=='pose.bones["ROOT"].location' and fc.array_index==1:
                        for k in fc.keyframe_points:
                            if k.co.y<0:
                                k.co.y+=raise_by
                                k.handle_left.y+=raise_by
                                k.handle_right.y+=raise_by

def recolor(name,rgb):
    m=bpy.data.materials[name]
    m.diffuse_color=(*rgb,1)
    m.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value=(*rgb,1)
    return m
PLUM=recolor("Style_Primary_Teal",(.29,.08,.34))
IVORY=recolor("Style_Secondary_Cream",(.92,.85,.73))
INK=recolor("Style_FaceAndShoe_Ink",(.055,.045,.075))
WHITE=recolor("Style_Eye_White",(.97,.95,.89))
CYAN=bpy.data.materials.new("MrsMute_SilentCyan")
CYAN.diffuse_color=(.035,.67,.76,1)
CYAN.use_nodes=True
CYAN.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value=CYAN.diffuse_color

def bind(obj,bone,mat):
    obj.data.materials.append(mat)
    obj.parent=arm
    obj.matrix_parent_inverse=arm.matrix_world.inverted()
    vg=obj.vertex_groups.new(name=bone)
    vg.add(list(range(len(obj.data.vertices))),1,"REPLACE")
    mod=obj.modifiers.new("ArmatureSkin","ARMATURE"); mod.object=arm
    return obj

def poly(name,verts,faces,bone,mat,smooth=False):
    mesh=bpy.data.meshes.new(name+"_Mesh")
    mesh.from_pydata(verts,[],faces); mesh.update()
    obj=bpy.data.objects.new(name,mesh); scene.collection.objects.link(obj)
    for f in mesh.polygons:f.use_smooth=smooth
    return bind(obj,bone,mat)

def sphere(name,center,size,bone,mat,segments=12,rings=8):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments,ring_count=rings,location=center)
    obj=bpy.context.object; obj.name=name; obj.scale=size
    bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
    for f in obj.data.polygons:f.use_smooth=True
    return bind(obj,bone,mat)

def bar(name,a,b,radius,bone,mat,sides=10):
    a,b=Vector(a),Vector(b)
    bpy.ops.mesh.primitive_cylinder_add(vertices=sides,radius=radius,depth=(b-a).length,location=(a+b)*.5)
    obj=bpy.context.object; obj.name=name
    obj.rotation_euler=(b-a).to_track_quat("Z","Y").to_euler()
    bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
    return bind(obj,bone,mat)

# Understated expression: low eyelids, one raised brow, tightly closed mouth.
for obj in scene.objects:
    if "Eye_HEAD" in obj.name and "Pupil" not in obj.name:
        c=sum((v.co for v in obj.data.vertices),Vector())/len(obj.data.vertices)
        for v in obj.data.vertices:v.co.z=c.z+(v.co.z-c.z)*.70
    if "CurvedSmile" in obj.name:
        for v in obj.data.vertices:v.co.z-=.004*(1-min(1,abs(v.co.x)/.06))
    if "L_Brow" in obj.name:
        for v in obj.data.vertices:v.co.z+=.018*(.5+v.co.x/.10)

# Padded acoustic ruff: a continuous annular mesh with broad sculpted lobes.
N=20
loops=[(.11,1.34),(.36,1.32),(.49,1.405),(.47,1.51),(.14,1.465)]
verts=[]
for li,(radius,z) in enumerate(loops):
    for i in range(N):
        a=2*math.pi*i/N
        r=radius*(1+.045*math.cos(10*a) if li in (2,3) else 1)
        verts.append((r*math.cos(a),r*.78*math.sin(a),z))
faces=[]
for li in range(len(loops)):
    nxt=(li+1)%len(loops)
    for i in range(N):
        j=(i+1)%N
        faces.append((li*N+i,li*N+j,nxt*N+j,nxt*N+i))
poly("MrsMute_AcousticCollar",verts,faces,"MUTE_COLLAR",PLUM,True)
for i in range(10):
    a=2*math.pi*(i+.5)/10
    r=.46
    sphere(f"MrsMute_CollarAbsorber_{i:02d}",(r*math.cos(a),r*.78*math.sin(a),1.455),(.075,.070,.11),"MUTE_COLLAR",IVORY,10,6)

# Cyan inner line makes the opening and head/neck connection readable.
for i in range(N):
    a=2*math.pi*i/N; b=2*math.pi*(i+1)/N
    bar(f"MrsMute_InnerCyan_{i:02d}",(.155*math.cos(a),.121*math.sin(a),1.477),(.155*math.cos(b),.121*math.sin(b),1.477),.012,"MUTE_COLLAR",CYAN,6)

# A small hotel bell hangs from the right mitten, not from an isolated prop pose.
sphere("MrsMute_BellBody",(.355,-.035,.62),(.058,.05,.055),"R_HAND",CYAN)
bar("MrsMute_BellHandle",(.355,-.035,.665),(.355,-.035,.738),.012,"R_HAND",IVORY)
sphere("MrsMute_BellButton",(.355,-.035,.749),(.027,.027,.018),"R_HAND",INK)
sphere("MrsMute_BellClapper",(.355,-.035,.574),(.016,.016,.02),"R_HAND",INK,10,6)

special=bpy.data.actions.new("MrsMute_RingAndIgnore")
special.use_fake_user=True
arm.animation_data.action=special
for frame,arm_pitch,head_tilt,collar_tilt in ((1,0,0,0),(8,-.42,0,0),(17,-.82,.12,.08),(26,-.82,-.13,-.05),(37,0,0,0)):
    scene.frame_set(frame)
    for name,angle in (("R_UPPER_ARM",arm_pitch),("R_FOREARM",-.20 if frame in (17,26) else 0)):
        pb=arm.pose.bones[name]; pb.rotation_mode="XYZ"; pb.rotation_euler=(angle,0,-.12 if frame in (17,26) else 0)
        pb.keyframe_insert(data_path="rotation_euler",frame=frame,group=name)
    head=arm.pose.bones["HEAD"]; head.rotation_mode="XYZ"; head.rotation_euler=(head_tilt,0,0)
    head.keyframe_insert(data_path="rotation_euler",frame=frame,group="HEAD")
    collar=arm.pose.bones["MUTE_COLLAR"]; collar.rotation_mode="XYZ"; collar.rotation_euler=(0,0,collar_tilt)
    collar.keyframe_insert(data_path="rotation_euler",frame=frame,group="MUTE_COLLAR")
special["loop"]=False; special["frames"]=(1,37)

meshes=[o for o in scene.objects if o.type=="MESH" and o.parent==arm]
bpy.ops.object.select_all(action="DESELECT")
for o in meshes:o.select_set(True)
bpy.context.view_layer.objects.active=meshes[0]; bpy.ops.object.join()
body=bpy.context.object; body.name="MrsMute_SkinnedMesh"
assert any(m.type=="ARMATURE" for m in body.modifiers)

def reset(action_name="Idle"):
    arm.animation_data.action=None
    for pb in arm.pose.bones:
        pb.rotation_mode="XYZ"; pb.rotation_euler=(0,0,0); pb.location=(0,0,0)
    action=bpy.data.actions[action_name]; arm.animation_data.action=action
    arm.animation_data.action_slot=action.slots[0]

camera=scene.camera; camera.data.ortho_scale=2.75
def render(name,position,action="Idle",frame=1):
    reset(action); scene.frame_set(frame)
    camera.location=position
    camera.rotation_euler=(Vector((0,0,.91))-camera.location).to_track_quat("-Z","Y").to_euler()
    scene.render.filepath=str(OUT/f"mrs-mute-{name}.png")
    bpy.ops.render.render(write_still=True)

render("front",(0,-4,1.8))
render("three-quarter",(2.4,-3.3,1.8))
render("side",(4,0,1.8))
render("back",(0,4,1.8))
render("walk",(2.4,-3.3,1.8),"Walk",1)
render("sit",(4,0,1.8),"SitDown",25)
render("ring-ignore",(2.4,-3.3,1.8),"MrsMute_RingAndIgnore",17)
reset("Idle");scene.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/"03_mrs_mute.blend"))
bpy.ops.object.select_all(action="DESELECT")
arm.select_set(True);body.select_set(True);bpy.context.view_layer.objects.active=arm
bpy.ops.export_scene.gltf(filepath=str(OUT/"03_mrs_mute.glb"),export_format="GLB",use_selection=True,
                          export_animations=True,export_animation_mode="ACTIONS",export_apply=True)
print("MRS_MUTE_COMPLETE",len(bpy.data.actions),len(body.data.polygons),OUT)
