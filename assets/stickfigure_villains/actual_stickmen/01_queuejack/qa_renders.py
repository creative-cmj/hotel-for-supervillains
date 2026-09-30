"""Render neutral, silhouette, and hotel-scale checks from the saved source."""
from pathlib import Path
import bpy
from mathutils import Vector

out = Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(out / "queuejack-stick.blend"))
scene = bpy.context.scene
body = bpy.data.objects["Queuejack_StickMesh"]
camera = scene.camera
camera.location = (3, -4.5, 2.7)
camera.rotation_euler = (Vector((0, 0, 1.25)) - camera.location).to_track_quat("-Z", "Y").to_euler()
camera.data.ortho_scale = 3.3
scene.frame_set(1)
original = list(body.data.materials)

def material(name, rgba):
    item = bpy.data.materials.new(name)
    item.diffuse_color = rgba
    item.use_nodes = True
    item.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = rgba
    return item

def render(name):
    scene.render.filepath = str(out / name)
    bpy.ops.render.render(write_still=True)

gray = material("QA_NeutralGray", (.43, .43, .43, 1))
for i in range(len(body.data.materials)):
    body.data.materials[i] = gray
render("queuejack-neutral-gray.png")

black = material("QA_SilhouetteBlack", (.003, .003, .003, 1))
black.node_tree.nodes.clear()
output = black.node_tree.nodes.new("ShaderNodeOutputMaterial")
emission = black.node_tree.nodes.new("ShaderNodeEmission")
emission.inputs["Color"].default_value = (0, 0, 0, 1)
black.node_tree.links.new(emission.outputs[0], output.inputs[0])
for i in range(len(body.data.materials)):
    body.data.materials[i] = black
scene.world.use_nodes = True
scene.world.node_tree.nodes["Background"].inputs["Color"].default_value = (1, 1, 1, 1)
scene.render.film_transparent = False
scene.view_settings.view_transform = "Standard"
other_original = {}
white = material("QA_WhiteBackdrop", (1, 1, 1, 1))
for obj in scene.objects:
    if obj.type == "MESH" and obj != body:
        other_original[obj.name] = list(obj.data.materials)
        for i in range(len(obj.data.materials)):
            obj.data.materials[i] = white
render("queuejack-black-silhouette.png")

for i, mat in enumerate(original):
    body.data.materials[i] = mat
for name, materials in other_original.items():
    for i, mat in enumerate(materials):
        bpy.data.objects[name].data.materials[i] = mat
scene.world.node_tree.nodes["Background"].inputs["Color"].default_value = (.05, .05, .05, 1)
marker = bpy.data.objects.new("QA_ManagerHeight_2p2m", bpy.data.meshes.new("QA_ManagerHeightMesh"))
bpy.context.collection.objects.link(marker)
coords = [(-1.05,-.05,0),(-.98,-.05,0),(-.98,-.05,2.2),(-1.05,-.05,2.2),
          (-1.05,.05,0),(-.98,.05,0),(-.98,.05,2.2),(-1.05,.05,2.2)]
faces = [(0,1,2,3),(4,7,6,5),(0,4,5,1),(1,5,6,2),(2,6,7,3),(3,7,4,0)]
marker.data.from_pydata(coords, [], faces)
marker.data.materials.append(material("QA_ManagerHeightGold", (.9,.55,.06,1)))
render("queuejack-hotel-scale.png")
rig = bpy.data.objects["Queuejack_StickRig"]
bpy.data.objects.remove(marker, do_unlink=True)
for name in ("Angry", "Happy", "Impatient", "Talk", "GiveItem", "Turn"):
    action = bpy.data.actions[name]
    rig.animation_data.action = action
    rig.animation_data.action_slot = action.slots[0]
    scene.frame_set(round(sum(action.frame_range) / 2))
    render(f"qa-pose-{name.lower()}.png")
print("QUEUEJACK_QA_RENDERS_OK")
