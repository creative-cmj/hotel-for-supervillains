"""Create the user's clean white stick-person reference as a reusable Blender rig.

Run with Blender in background mode; this never touches the running game or UI.
"""
from __future__ import annotations

import math
from pathlib import Path

import bpy
from mathutils import Vector

OUT = Path(__file__).resolve().parent
OUT.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

def mat(name, color, roughness=0.68):
    item = bpy.data.materials.new(name)
    item.diffuse_color = (*color, 1)
    item.use_nodes = True
    bsdf = item.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, 1)
    bsdf.inputs["Roughness"].default_value = roughness
    return item

WHITE = mat("StickPerson_WarmPorcelain", (.93, .91, .90))
INK = mat("StickPerson_FaceInk", (.018, .018, .025))
FLOOR = mat("QA_DarkFloor_NotExported", (.065, .073, .105), .8)

# Reference ratio: head one, torso one, legs two. This scales to a 2.2 m
# hotel person while keeping a generous expressive face and short oval shoes.
arm_data = bpy.data.armatures.new("StickPerson_RigData")
rig = bpy.data.objects.new("StickPerson_Rig", arm_data)
scene.collection.objects.link(rig)
bpy.context.view_layer.objects.active = rig
rig.select_set(True)
bpy.ops.object.mode_set(mode="EDIT")

def bone(name, head, tail, parent=None):
    item = arm_data.edit_bones.new(name)
    item.head = head
    item.tail = tail
    if parent:
        item.parent = arm_data.edit_bones[parent]
    return item

bone("ROOT", (0,0,0), (0,0,.14))
bone("PELVIS", (0,0,1.04), (0,0,1.12), "ROOT")
bone("TORSO", (0,0,1.12), (0,0,1.54), "PELVIS")
bone("NECK", (0,0,1.54), (0,0,1.66), "TORSO")
bone("HEAD", (0,0,1.66), (0,0,1.93), "NECK")
for side, sign in (("L",-1),("R",1)):
    bone(f"{side}_UPPER_ARM", (sign*.09,0,1.49), (sign*.215,0,1.17), "TORSO")
    bone(f"{side}_FOREARM", (sign*.215,0,1.17), (sign*.34,0,.90), f"{side}_UPPER_ARM")
    bone(f"{side}_HAND", (sign*.34,0,.90), (sign*.35,0,.84), f"{side}_FOREARM")
    bone(f"{side}_THIGH", (sign*.075,0,1.055), (sign*.12,0,.58), "PELVIS")
    bone(f"{side}_SHIN", (sign*.12,0,.58), (sign*.17,0,.13), f"{side}_THIGH")
    bone(f"{side}_FOOT", (sign*.17,0,.13), (sign*.17,-.16,.08), f"{side}_SHIN")
bpy.ops.object.mode_set(mode="OBJECT")

body_objects = []

def bind(obj, weights, material, include_body=True):
    obj.data.materials.append(material)
    obj.parent = rig
    obj.matrix_parent_inverse = rig.matrix_world.inverted()
    for name, indices, weight in weights:
        group = obj.vertex_groups.get(name) or obj.vertex_groups.new(name=name)
        group.add(indices, weight, "REPLACE")
    modifier = obj.modifiers.new("SkinToSimpleRig", "ARMATURE")
    modifier.object = rig
    if include_body:
        body_objects.append(obj)
    return obj

def sphere(name, center, scale, bone_name, material=WHITE, segments=24, rings=12):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=rings, location=center)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    for poly in obj.data.polygons:
        poly.use_smooth = True
    indices = list(range(len(obj.data.vertices)))
    return bind(obj, ((bone_name,indices,1),), material)

def skinned_tube(name, points, radii, groups, material=WHITE, side_count=12):
    """A smooth continuous tube with explicit ring weights for bending."""
    verts, faces = [], []
    points = [Vector(p) for p in points]
    for i, (point, radius) in enumerate(zip(points,radii)):
        tangent = (points[min(i+1,len(points)-1)]-points[max(0,i-1)]).normalized()
        u = tangent.cross(Vector((0,1,0))).normalized()
        v = tangent.cross(u).normalized()
        for j in range(side_count):
            theta = math.tau*j/side_count
            verts.append(point + radius*(math.cos(theta)*u + math.sin(theta)*v))
        if i:
            for j in range(side_count):
                k = (j+1)%side_count
                faces.append(((i-1)*side_count+j,(i-1)*side_count+k,i*side_count+k,i*side_count+j))
    faces.extend((tuple(reversed(range(side_count))),
                  tuple((len(points)-1)*side_count+j for j in range(side_count))))
    mesh = bpy.data.meshes.new(name+"Mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name,mesh)
    scene.collection.objects.link(obj)
    for poly in mesh.polygons:
        poly.use_smooth = len(poly.vertices)==4
    weights = []
    for ring_index, ring_weights in enumerate(groups):
        ids = list(range(ring_index*side_count,(ring_index+1)*side_count))
        for bone_name, weight in ring_weights:
            if weight > .0001:
                weights.append((bone_name,ids,weight))
    return bind(obj, weights, material)

skinned_tube("StickPerson_ContinuousTorso",
    [(0,0,1.045),(0,0,1.09),(0,0,1.15),(0,0,1.3),(0,0,1.46),
     (0,0,1.53),(0,0,1.59),(0,0,1.64)],
    [.045,.064,.075,.068,.062,.052,.038,.032],
    [[("PELVIS",1)],[ ("PELVIS",1) ],[("PELVIS",.4),("TORSO",.6)],
     [("TORSO",1)],[("TORSO",1)],[("TORSO",.7),("NECK",.3)],
     [("NECK",1)],[("NECK",1)]])
sphere("StickPerson_SoftPelvisJoint",(0,0,1.055),(.085,.067,.058),
       "PELVIS",segments=16,rings=10)

# Large almost spherical head, with the neck tucked under its lower pole.
sphere("StickPerson_RoundHead", (0,0,1.91), (.302,.287,.303), "HEAD", segments=32, rings=18)

for side, sign in (("L",-1),("R",1)):
    arm_start = Vector((sign*.055,0,1.49))
    elbow = Vector((sign*.215,0,1.17))
    wrist = Vector((sign*.34,0,.90))
    skinned_tube(f"StickPerson_{side}_SmoothArm",
        [arm_start,arm_start.lerp(elbow,.09),arm_start.lerp(elbow,.55),
         arm_start.lerp(elbow,.92),elbow,elbow.lerp(wrist,.08),
         elbow.lerp(wrist,.55),elbow.lerp(wrist,.94),wrist],
        [.039,.048,.046,.042,.041,.040,.037,.034,.032],
        [[(f"{side}_UPPER_ARM",1)] for _ in range(3)] +
        [[(f"{side}_UPPER_ARM",.75),(f"{side}_FOREARM",.25)],
         [(f"{side}_UPPER_ARM",.5),(f"{side}_FOREARM",.5)],
         [(f"{side}_UPPER_ARM",.25),(f"{side}_FOREARM",.75)]] +
        [[(f"{side}_FOREARM",1)] for _ in range(3)])
    sphere(f"StickPerson_{side}_SoftShoulder",(sign*.087,0,1.49),
           (.044,.043,.047),f"{side}_UPPER_ARM",segments=14,rings=8)
    sphere(f"StickPerson_{side}_RoundHand",(sign*.35,0,.845),
           (.088,.079,.088),f"{side}_HAND",segments=16,rings=10)
    hip = Vector((sign*.075,0,1.055))
    knee = Vector((sign*.12,0,.58))
    ankle = Vector((sign*.17,0,.13))
    skinned_tube(f"StickPerson_{side}_SmoothLeg",
        [hip,hip.lerp(knee,.10),hip.lerp(knee,.55),hip.lerp(knee,.92),
         knee,knee.lerp(ankle,.08),knee.lerp(ankle,.55),
         knee.lerp(ankle,.94),ankle],
        [.058,.061,.057,.051,.049,.048,.043,.040,.038],
        [[(f"{side}_THIGH",1)] for _ in range(3)] +
        [[(f"{side}_THIGH",.75),(f"{side}_SHIN",.25)],
         [(f"{side}_THIGH",.5),(f"{side}_SHIN",.5)],
         [(f"{side}_THIGH",.25),(f"{side}_SHIN",.75)]] +
        [[(f"{side}_SHIN",1)] for _ in range(3)])
    sphere(f"StickPerson_{side}_SoftFoot",(sign*.17,-.105,.085),
           (.153,.226,.085),f"{side}_FOOT",segments=20,rings=12)

# The facial mesh is a separate skinned glTF primitive. Its named morph
# targets let the game blend six expressions without swapping head models.
HEAD_Z, HEAD_RX, HEAD_RY, HEAD_RZ = 1.91, .302, .287, .303
def face_y(x,z):
    on_surface=HEAD_RY*math.sqrt(max(.01,1-(x/HEAD_RX)**2-((z-HEAD_Z)/HEAD_RZ)**2))
    return -on_surface-.004

def expression_geometry(expression):
    verts, faces = [], []
    def add_eye(x, z, width, height):
        start = len(verts)
        rings, sides = 8, 12
        center_y = face_y(x,z)-.003
        for i in range(rings+1):
            phi = math.pi*i/rings
            for j in range(sides):
                theta = math.tau*j/sides
                vx = x + width*math.sin(phi)*math.cos(theta)
                vz = z + height*math.cos(phi)
                vy = center_y-.012*math.sin(phi)*math.sin(theta)
                verts.append((vx,vy,vz))
        for i in range(rings):
            for j in range(sides):
                k=(j+1)%sides
                faces.append((start+i*sides+j,start+i*sides+k,
                              start+(i+1)*sides+k,start+(i+1)*sides+j))
    def add_stroke(path, radius=.009):
        start=len(verts)
        for i,(x,z) in enumerate(path):
            for j in range(6):
                theta=math.tau*j/6
                verts.append((x+radius*math.cos(theta),face_y(x,z)-.006-radius*math.sin(theta),z))
            if i:
                for j in range(6):
                    k=(j+1)%6
                    faces.append((start+(i-1)*6+j,start+(i-1)*6+k,
                                  start+i*6+k,start+i*6+j))
    for sign in (-1,1):
        if expression=="Happy":
            add_eye(sign*.104,1.955,.045,.013)
        elif expression=="Surprised":
            add_eye(sign*.104,1.955,.026,.064)
        else:
            add_eye(sign*.104,1.955,.027,.066)
    for sign in (-1,1):
        base_z = 2.047 + (.021 if expression=="Surprised" else 0)
        if expression=="Angry":
            slope=-.040*sign
        elif expression=="Sad":
            slope=.038*sign
        elif expression=="Confused":
            slope=.018 if sign<0 else -.034
        else:
            slope=0
        path=[]
        for i in range(7):
            t=i/6-.5
            x=sign*.104+t*.080
            z=base_z+slope*(i/6)+.010*(1-4*t*t)
            path.append((x,z))
        add_stroke(path,.0085)
    if expression=="Surprised":
        mouth=[(.039*math.cos(math.tau*i/11),1.82+.051*math.sin(math.tau*i/11)) for i in range(12)]
    elif expression=="Happy":
        mouth=[(-.092+.184*i/11,1.85-.079*math.sin(math.pi*i/11)) for i in range(12)]
    else:
        mouth=[]
        for i in range(12):
            x=-.075+.150*i/11
            t=x/.075
            if expression=="Angry": z=1.808-.023*t*t
            elif expression=="Sad": z=1.810-.031*t*t
            elif expression=="Confused": z=1.812+.004*t
            else: z=1.816+.018*t*t
            mouth.append((x,z))
    add_stroke(mouth,.0085 if expression!="Happy" else .011)
    return verts,faces

NEUTRAL_VERTS, FACE_POLYGONS = expression_geometry("Neutral")
face_mesh = bpy.data.meshes.new("StickPerson_ExpressionFaceMesh")
face_mesh.from_pydata(NEUTRAL_VERTS, [], FACE_POLYGONS)
face_mesh.update()
face = bpy.data.objects.new("StickPerson_ExpressionFace",face_mesh)
scene.collection.objects.link(face)
face.data.materials.append(INK)
for poly in face.data.polygons:
    poly.use_smooth=True
face.parent=rig
face.matrix_parent_inverse=rig.matrix_world.inverted()
face.vertex_groups.new(name="HEAD").add(list(range(len(face_mesh.vertices))),1,"REPLACE")
skin=face.modifiers.new("FaceFollowsHead","ARMATURE")
skin.object=rig
face.shape_key_add(name="Basis")
for name in ("Happy","Angry","Surprised","Confused","Sad"):
    vertices,_=expression_geometry(name)
    assert len(vertices)==len(NEUTRAL_VERTS)
    key=face.shape_key_add(name=name)
    for i,co in enumerate(vertices):
        key.data[i].co=co

# Join only white body meshes; the facial morph mesh remains separate.
bpy.ops.object.select_all(action="DESELECT")
for obj in body_objects:
    obj.select_set(True)
bpy.context.view_layer.objects.active=body_objects[0]
bpy.ops.object.join()
body=bpy.context.object
body.name="StickPerson_WhiteBody"

# Small studio stage, excluded from the GLB.
bpy.ops.mesh.primitive_cube_add(size=1, location=(0,0,-.045))
stage=bpy.context.object
stage.name="QA_Stage_NotExported"
stage.dimensions=(4.5,4.5,.09)
bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
stage.data.materials.append(FLOOR)
for energy,location,size,color in ((260,(-3,-4,5),4.0,(.75,.83,1)),
                                   (180,(3,-2,3),3.0,(1,.78,.66)),
                                   (140,(1,3,4),3.0,(.75,.75,1))):
    data=bpy.data.lights.new("QA_Softbox_NotExported","AREA")
    data.energy=energy
    data.shape="DISK"
    data.size=size
    data.color=color
    obj=bpy.data.objects.new("QA_Softbox_NotExported",data)
    scene.collection.objects.link(obj)
    obj.location=location
    obj.rotation_euler=(Vector((0,0,1.1))-obj.location).to_track_quat("-Z","Y").to_euler()

cam_data=bpy.data.cameras.new("QA_Camera_NotExported")
camera=bpy.data.objects.new("QA_Camera_NotExported",cam_data)
scene.collection.objects.link(camera)
scene.camera=camera
camera.data.type="ORTHO"
scene.render.engine="CYCLES"
scene.cycles.samples=32
scene.render.resolution_x=700
scene.render.resolution_y=700
scene.render.resolution_percentage=100
scene.render.image_settings.file_format="PNG"
scene.world=bpy.data.worlds.new("QA_DarkStudio_NotExported")
scene.world.color=(.025,.029,.046)
scene.view_settings.view_transform="Standard"

def render(name,position,target=(0,0,1.1),scale=2.75,expression=None):
    for key in face.data.shape_keys.key_blocks:
        if key.name!="Basis": key.value=1 if key.name==expression else 0
    camera.location=position
    camera.rotation_euler=(Vector(target)-camera.location).to_track_quat("-Z","Y").to_euler()
    camera.data.ortho_scale=scale
    scene.render.filepath=str(OUT/name)
    bpy.ops.render.render(write_still=True)

render("base-front.png",(0,-4,2.0))
render("base-three-quarter.png",(2.4,-3.4,2.0))
render("base-side.png",(4.2,0,2.0))
render("base-three-quarter-back.png",(2.4,3.4,2.0))
render("base-back.png",(0,4.2,2.0))
for expression in ("Neutral","Happy","Angry","Surprised","Confused","Sad"):
    render(f"expression-{expression.lower()}.png",(0,-2.0,1.97),
           target=(0,0,1.92),scale=.82,expression=expression)
for key in face.data.shape_keys.key_blocks:
    if key.name!="Basis": key.value=0

scene.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/"base-white-stickman.blend"))
bpy.ops.object.select_all(action="DESELECT")
for obj in (rig,body,face): obj.select_set(True)
bpy.context.view_layer.objects.active=rig
bpy.ops.export_scene.gltf(filepath=str(OUT/"base-white-stickman.glb"),
                          export_format="GLB",use_selection=True,
                          export_animations=False,export_morph=True,
                          export_apply=False)
print("WHITE_STICKMAN_BUILD_OK",len(body.data.polygons),len(face.data.polygons))
