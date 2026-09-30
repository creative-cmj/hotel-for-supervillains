"""Render silhouette, neutral-gray and hotel-scale checks without changing asset."""
from pathlib import Path
import bpy
from mathutils import Vector

root=Path(__file__).resolve().parents[1]
out=root/"01_queuejack"
bpy.ops.wm.open_mainfile(filepath=str(out/"01_queuejack.blend"))
scene=bpy.context.scene
body=bpy.data.objects["Queuejack_SkinnedMesh"]
arm=bpy.data.objects["Queuejack_Rig"]
action=bpy.data.actions["Idle"]
arm.animation_data.action=action
arm.animation_data.action_slot=action.slots[0]
scene.frame_set(1)
camera=scene.camera
scene.render.film_transparent=False

def mat(name,color):
    m=bpy.data.materials.new(name)
    m.diffuse_color=(*color,1)
    m.use_nodes=True
    m.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value=(*color,1)
    m.node_tree.nodes["Principled BSDF"].inputs["Roughness"].default_value=1
    return m

back=mat("QA_Backdrop",(.67,.65,.70))
gray=mat("QA_NeutralGray",(.45,.45,.45))
black=mat("QA_BlackSilhouette",(.005,.005,.005))
bpy.ops.mesh.primitive_cube_add(size=1,location=(0,2.0,1.5))
wall=bpy.context.object
wall.name="QA_ContrastBackdrop"
wall.dimensions=(6,.03,4)
bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
wall.data.materials.append(back)
original=[body.data.materials[i] for i in range(len(body.data.materials))]

def render(name,position,scale=3.45):
    camera.data.ortho_scale=scale
    camera.location=position
    camera.rotation_euler=(Vector((0,0,1.25))-camera.location).to_track_quat("-Z","Y").to_euler()
    scene.render.filepath=str(out/f"queuejack-{name}.png")
    bpy.ops.render.render(write_still=True)

for i in range(len(original)): body.data.materials[i]=black
render("silhouette-front",(0,-6,1.8))
render("silhouette-three-quarter",(4,-5,1.8))
for i in range(len(original)): body.data.materials[i]=gray
render("neutral-gray",(4,-5,1.8))
for i,m in enumerate(original): body.data.materials[i]=m

# Hotel comparison at the same metric scale as the asset. The comparison
# geometry is QA-only and does not appear in the saved .blend or exported GLB.
door=mat("QA_DoorReference",(.14,.09,.23))
manager=mat("QA_PlayerHeightReference",(.08,.55,.59))
chair=mat("QA_ChairReference",(.65,.34,.43))
def block(name,center,dimensions,m):
    bpy.ops.mesh.primitive_cube_add(size=1,location=center)
    obj=bpy.context.object
    obj.name=name
    obj.dimensions=dimensions
    bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
    obj.data.materials.append(m)
    return obj

block("QA_DoorFrame_Left",(-.73,.85,1.38),(.10,.22,2.76),door)
block("QA_DoorFrame_Right",(.73,.85,1.38),(.10,.22,2.76),door)
block("QA_DoorFrame_Top",(0,.85,2.72),(1.55,.22,.10),door)
block("QA_Manager_2point2m",(-1.45,0,1.1),(.28,.28,2.2),manager)
block("QA_ChairSeat_0point45m",(1.43,-.10,.225),(.54,.55,.45),chair)
render("hotel-scale",(4,-7,2.0),4.6)
print("QUEUEJACK_QA_RENDERS_COMPLETE",out)
