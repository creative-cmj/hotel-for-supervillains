"""Inspect Knickknack in neutral gray, silhouette, and hotel scale."""
from pathlib import Path
import bpy
from mathutils import Vector

root=Path(__file__).resolve().parents[1]
out=root/"02_knickknack"
bpy.ops.wm.open_mainfile(filepath=str(out/"02_knickknack.blend"))
scene=bpy.context.scene
body=bpy.data.objects["Knickknack_SkinnedMesh"]
arm=bpy.data.objects["Knickknack_Rig"]
idle=bpy.data.actions["Idle"]
arm.animation_data.action=idle
arm.animation_data.action_slot=idle.slots[0]
scene.frame_set(1)
camera=scene.camera
scene.render.film_transparent=False

def material(name,color):
    m=bpy.data.materials.new(name)
    m.diffuse_color=(*color,1)
    m.use_nodes=True
    m.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value=(*color,1)
    m.node_tree.nodes["Principled BSDF"].inputs["Roughness"].default_value=1
    return m

gray=material("QA_Gray",(.42,.42,.42))
black=material("QA_Black",(.004,.004,.004))
back=material("QA_Backdrop",(.67,.65,.70))
bpy.ops.mesh.primitive_cube_add(size=1,location=(0,1.6,1.3))
wall=bpy.context.object; wall.name="QA_Backdrop"
wall.dimensions=(5,.03,3)
bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
wall.data.materials.append(back)
original=[body.data.materials[i] for i in range(len(body.data.materials))]

def render(name,position,scale):
    camera.data.ortho_scale=scale
    camera.location=position
    camera.rotation_euler=(Vector((.25,0,.5))-camera.location).to_track_quat("-Z","Y").to_euler()
    scene.render.filepath=str(out/f"knickknack-{name}.png")
    bpy.ops.render.render(write_still=True)

for i in range(len(original)): body.data.materials[i]=black
render("silhouette-front",(.24,-3.3,1.1),1.85)
render("silhouette-three-quarter",(2.3,-2.7,1.1),1.85)
for i in range(len(original)): body.data.materials[i]=gray
render("neutral-gray",(2.3,-2.7,1.1),1.85)
for i,m in enumerate(original): body.data.materials[i]=m

door=material("QA_Door",(.14,.09,.23))
manager=material("QA_Manager",(.08,.55,.59))
chair=material("QA_Chair",(.65,.34,.43))
def block(name,center,size,mat):
    bpy.ops.mesh.primitive_cube_add(size=1,location=center)
    obj=bpy.context.object; obj.name=name; obj.dimensions=size
    bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
    obj.data.materials.append(mat)

block("QA_DoorLeft",(-.75,.85,1.38),(.10,.22,2.76),door)
block("QA_DoorRight",(.75,.85,1.38),(.10,.22,2.76),door)
block("QA_DoorTop",(0,.85,2.72),(1.6,.22,.1),door)
block("QA_Manager_2point2m",(-1.35,0,1.1),(.28,.28,2.2),manager)
block("QA_Chair_0point45m",(1.32,-.10,.225),(.54,.55,.45),chair)
render("hotel-scale",(3.3,-6,2.0),4.2)
print("KNICKKNACK_QA_COMPLETE",out)
