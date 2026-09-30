"""Build 02 Knickknack: tiny defensive souvenir hoarder, one enormous loot sack."""
from __future__ import annotations

import math
from pathlib import Path
import bpy
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"02_knickknack"
OUT.mkdir(exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(ROOT/"foundation"/"style-rig-animation-test.blend"))
scene=bpy.context.scene
arm=bpy.data.objects["STYLE_RIG"]
arm.name="Knickknack_Rig"

SX,SY,SZ=.81,.79,.52
for obj in list(scene.objects):
    if obj.type=="MESH" and obj.name.startswith("STYLE_"):
        for v in obj.data.vertices:
            v.co.x*=SX; v.co.y*=SY; v.co.z*=SZ
            if "TorsoContinuous" in obj.name:
                # Pear-shaped coat: a heavier lower belly and tiny shoulders.
                f=max(0,min(1,(v.co.z-.46)/.27))
                v.co.x*=1.2-.3*f
                v.co.y*=1.2-.3*f
        obj.name=obj.name.replace("STYLE_","Knickknack_")
bpy.context.view_layer.objects.active=arm
bpy.ops.object.mode_set(mode="EDIT")
for b in arm.data.edit_bones:
    for p in (b.head,b.tail):
        p.x*=SX; p.y*=SY; p.z*=SZ

def extra_bone(name,head,tail,parent):
    b=arm.data.edit_bones.new(name)
    b.head=head; b.tail=tail; b.parent=arm.data.edit_bones[parent]
extra_bone("LOOT_SACK",(.47,.05,.22),(.47,.05,.63),"ROOT")
extra_bone("SACK_MOUTH",(.47,.05,.65),(.47,.05,.81),"LOOT_SACK")
extra_bone("HOTEL_PEN",(.47,.05,.55),(.47,.05,.72),"LOOT_SACK")
bpy.ops.object.mode_set(mode="OBJECT")

# Keep animation translation in metres after the small rest-rig scale.
for action in bpy.data.actions:
    for layer in action.layers:
        for strip in layer.strips:
            for bag in strip.channelbags:
                for fc in bag.fcurves:
                    if fc.data_path.endswith("location") and fc.array_index==1:
                        for k in fc.keyframe_points:
                            k.co.y*=SZ; k.handle_left.y*=SZ; k.handle_right.y*=SZ

# Very short legs need a different contact height from the standard rig;
# retaining the full-size contact dip would push his shoes through the floor.
for name,raise_by in (("Walk",.040),("FastWalk",.060)):
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
TEAL=recolor("Style_Primary_Teal",(.03,.51,.48))
CREAM=recolor("Style_Secondary_Cream",(.95,.82,.55))
CHARCOAL=recolor("Style_FaceAndShoe_Ink",(.07,.075,.10))
WHITE=recolor("Style_Eye_White",(.97,.94,.80))
GOLD=bpy.data.materials.new("Knickknack_SouvenirGold")
GOLD.diffuse_color=(.9,.55,.075,1)
GOLD.use_nodes=True
GOLD.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value=(.9,.55,.075,1)

def bind(obj,bone,mat):
    obj.data.materials.append(mat)
    obj.parent=arm
    obj.matrix_parent_inverse=arm.matrix_world.inverted()
    vg=obj.vertex_groups.new(name=bone)
    vg.add(list(range(len(obj.data.vertices))),1,"REPLACE")
    mod=obj.modifiers.new("ArmatureSkin","ARMATURE")
    mod.object=arm
    return obj

def poly(name,verts,faces,bone,mat,smooth=False):
    mesh=bpy.data.meshes.new(name+"_Mesh")
    mesh.from_pydata(verts,[],faces)
    mesh.update()
    obj=bpy.data.objects.new(name,mesh)
    scene.collection.objects.link(obj)
    for f in mesh.polygons: f.use_smooth=smooth
    return bind(obj,bone,mat)

def sphere(name,center,size,bone,mat,segments=12,rings=8):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments,ring_count=rings,location=center)
    obj=bpy.context.object; obj.name=name; obj.scale=size
    bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
    for f in obj.data.polygons: f.use_smooth=True
    return bind(obj,bone,mat)

def bar(name,a,b,radius,bone,mat,sides=10):
    a,b=Vector(a),Vector(b)
    bpy.ops.mesh.primitive_cylinder_add(vertices=sides,radius=radius,depth=(b-a).length,location=(a+b)*.5)
    obj=bpy.context.object; obj.name=name
    obj.rotation_euler=(b-a).to_track_quat("Z","Y").to_euler()
    bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
    return bind(obj,bone,mat)

# Face and coat differ from the shared test figure.  He has delighted big eyes
# but an anxious frown, plus a rounded bottom-heavy torso.
for obj in scene.objects:
    if "Eye_HEAD" in obj.name and "Pupil" not in obj.name:
        c=sum((v.co for v in obj.data.vertices),Vector())/len(obj.data.vertices)
        for v in obj.data.vertices:
            v.co.x=c.x+(v.co.x-c.x)*1.22
            v.co.z=c.z+(v.co.z-c.z)*1.10
    if "CurvedSmile" in obj.name:
        for v in obj.data.vertices:
            v.co.z+=.030*(1-min(1,abs(v.co.x)/.07))

# Asymmetric pouch-shaped sack, almost as tall as he is.  Custom ring mesh
# leaves the top open; the bag is one solid animated feature, not a sphere.
CX,CY=.48,.07
levels=[(.01,.045),(.12,.23),(.29,.30),(.48,.285),(.65,.20),(.75,.105)]
sides=14
verts=[]
for ring,(z,rad) in enumerate(levels):
    for i in range(sides):
        a=2*math.pi*i/sides
        wobble=1+.045*math.sin(i*2.5+ring*.7)
        verts.append((CX+math.cos(a)*rad*wobble,CY+math.sin(a)*rad*.86*wobble,z))
faces=[tuple(reversed(range(sides)))]
for ring in range(len(levels)-1):
    for i in range(sides):
        j=(i+1)%sides
        faces.append((ring*sides+i,ring*sides+j,(ring+1)*sides+j,(ring+1)*sides+i))
poly("Knickknack_OversizedLootSack",verts,faces,"LOOT_SACK",TEAL,True)
sphere("Knickknack_DarkOpenTop",(CX,CY,.746),(.103,.088,.014),"LOOT_SACK",CHARCOAL)
sphere("Knickknack_GatheredLip",(CX,CY,.77),(.14,.095,.047),"SACK_MOUTH",CREAM)
sphere("Knickknack_TieKnot",(CX+.06,CY,.81),(.07,.045,.05),"SACK_MOUTH",GOLD)

# A slung shoulder strap makes the huge bag's weight feel intentional, while
# his mitten guards its near edge.  It arcs above the right shoulder.
bar("Knickknack_Strap_1",(.25,.03,.69),(.34,.10,.83),.020,"LOOT_SACK",GOLD)
bar("Knickknack_Strap_2",(.34,.10,.83),(.46,.10,.84),.020,"LOOT_SACK",GOLD)
bar("Knickknack_Strap_3",(.46,.10,.84),(.51,.07,.78),.020,"LOOT_SACK",GOLD)

# A broad stamped hotel souvenir mark on the front of the sack.
poly("Knickknack_StampedLogo",[
    (CX-.10,CY-.255,.44),(CX+.10,CY-.255,.44),
    (CX+.07,CY-.270,.30),(CX-.07,CY-.270,.30)],[(0,1,2,3)],"LOOT_SACK",GOLD)
# A bold K stamp reads more clearly than tiny lettering or a texture.
bar("Knickknack_Stamp_KStem",(CX-.045,CY-.285,.325),(CX-.045,CY-.272,.420),.008,"LOOT_SACK",CHARCOAL,8)
bar("Knickknack_Stamp_KUpper",(CX-.04,CY-.282,.371),(CX+.025,CY-.276,.418),.008,"LOOT_SACK",CHARCOAL,8)
bar("Knickknack_Stamp_KLower",(CX-.04,CY-.282,.371),(CX+.025,CY-.286,.325),.008,"LOOT_SACK",CHARCOAL,8)
bar("Knickknack_SouvenirPen",(CX,CY-.02,.43),(CX,CY-.02,.76),.014,"HOTEL_PEN",GOLD)
sphere("Knickknack_PenTip",(CX,CY-.02,.44),(.017,.017,.021),"HOTEL_PEN",CHARCOAL,10,6)

# His right mitten presses into the sack's side at rest, as if guarding it.
arm.pose.bones["R_UPPER_ARM"].rotation_mode="XYZ"
arm.pose.bones["R_UPPER_ARM"].rotation_euler=(-.18,0,-.16)

special=bpy.data.actions.new("Knickknack_DisplayHotelPen")
special.use_fake_user=True
arm.animation_data.action=special
for frame,lift,open_angle in ((1,0,0),(9,.06,.18),(17,.27,.37),(26,.27,.37),(37,0,0)):
    scene.frame_set(frame)
    pen=arm.pose.bones["HOTEL_PEN"]
    pen.rotation_mode="XYZ"; pen.location.y=lift
    pen.keyframe_insert(data_path="location",frame=frame,group=pen.name)
    mouth=arm.pose.bones["SACK_MOUTH"]
    mouth.rotation_mode="XYZ"; mouth.rotation_euler=(open_angle,0,0)
    mouth.keyframe_insert(data_path="rotation_euler",frame=frame,group=mouth.name)
    sack=arm.pose.bones["LOOT_SACK"]
    sack.rotation_mode="XYZ"; sack.rotation_euler=(0,0,.07*math.sin(frame*.2))
    sack.keyframe_insert(data_path="rotation_euler",frame=frame,group=sack.name)
special["loop"]=False
special["frames"]=(1,37)

# Pack all skinned islands as one mesh with few material primitives.
meshes=[o for o in scene.objects if o.type=="MESH" and o.parent==arm]
bpy.ops.object.select_all(action="DESELECT")
for o in meshes:o.select_set(True)
bpy.context.view_layer.objects.active=meshes[0]
bpy.ops.object.join()
body=bpy.context.object
body.name="Knickknack_SkinnedMesh"
assert any(m.type=="ARMATURE" for m in body.modifiers)

def reset(action_name="Idle"):
    arm.animation_data.action=None
    for pb in arm.pose.bones:
        pb.rotation_mode="XYZ"; pb.rotation_euler=(0,0,0); pb.location=(0,0,0)
    action=bpy.data.actions[action_name]
    arm.animation_data.action=action
    arm.animation_data.action_slot=action.slots[0]

camera=scene.camera
camera.data.ortho_scale=1.85
def render(name,position,action="Idle",frame=1):
    reset(action); scene.frame_set(frame)
    camera.location=position
    camera.rotation_euler=(Vector((.24,0,.49))-camera.location).to_track_quat("-Z","Y").to_euler()
    scene.render.filepath=str(OUT/f"knickknack-{name}.png")
    bpy.ops.render.render(write_still=True)

render("front",(.24,-3.3,1.1))
render("three-quarter",(2.3,-2.7,1.1))
render("side",(3.3,0,1.1))
render("back",(.24,3.3,1.1))
render("walk",(2.3,-2.7,1.1),"Walk",1)
render("sit",(3.3,0,1.1),"SitDown",25)
render("pen-display",(2.3,-2.7,1.1),"Knickknack_DisplayHotelPen",17)
reset("Idle"); scene.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/"02_knickknack.blend"))
bpy.ops.object.select_all(action="DESELECT")
arm.select_set(True); body.select_set(True)
bpy.context.view_layer.objects.active=arm
bpy.ops.export_scene.gltf(filepath=str(OUT/"02_knickknack.glb"),export_format="GLB",use_selection=True,
                          export_animations=True,export_animation_mode="ACTIONS",export_apply=True)
print("KNICKKNACK_COMPLETE",len(bpy.data.actions),len(body.data.polygons),OUT)
