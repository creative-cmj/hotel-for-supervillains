import bpy, os, math
from mathutils import Vector

ROOT = r"C:\Users\Caleb Johnson\Downloads\New folder\hotel-for-supervillains\assets\new_villain_roster"
GLB = os.path.join(ROOT, "glb")
BLEND = os.path.join(ROOT, "blend")
QA = os.path.join(ROOT, "qa")

def clear():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for block in (bpy.data.materials, bpy.data.curves, bpy.data.meshes, bpy.data.cameras, bpy.data.lights):
        pass

def mat(name, color, metallic=0.0, rough=.55):
    m=bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.diffuse_color=(*color,1)
    m.use_nodes=True
    bs=m.node_tree.nodes.get('Principled BSDF')
    bs.inputs['Base Color'].default_value=(*color,1)
    bs.inputs['Metallic'].default_value=metallic
    bs.inputs['Roughness'].default_value=rough
    return m

def cube(name, loc, scale, material):
    bpy.ops.mesh.primitive_cube_add(location=loc)
    o=bpy.context.object; o.name=name; o.scale=scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    o.data.materials.append(material)
    return o

def look_at(obj, point):
    obj.rotation_euler=(Vector(point)-obj.location).to_track_quat('-Z','Y').to_euler()

def bbox_world(objects):
    pts=[]
    for o in objects:
        if o.type=='MESH': pts += [o.matrix_world @ Vector(c) for c in o.bound_box]
    if not pts: return Vector((0,0,0)),Vector((0,0,0))
    return Vector(tuple(min(p[i] for p in pts) for i in range(3))), Vector(tuple(max(p[i] for p in pts) for i in range(3)))

clear()
files=sorted(f for f in os.listdir(GLB) if f.endswith('.glb'))
for idx,f in enumerate(files):
    before=set(bpy.context.scene.objects)
    bpy.ops.import_scene.gltf(filepath=os.path.join(GLB,f), import_shading='NORMALS')
    imported=[o for o in bpy.context.scene.objects if o not in before]
    for o in list(imported):
        if o.type in {'CAMERA','LIGHT'}:
            bpy.data.objects.remove(o,do_unlink=True); imported.remove(o)
    mn,mx=bbox_world(imported); center=(mn+mx)*.5
    col=idx%10; row=idx//10
    target=Vector(((col-4.5)*2.35,row*2.55,0))
    shift=Vector((target.x-center.x,target.y-center.y,-mn.z))
    roots=[o for o in imported if o.parent is None]
    for o in roots: o.location += shift

gold=mat('QA_Gold',(0.72,.35,.05),.65,.28)
purple=mat('QA_Purple',(.10,.018,.18),0,.7)
blue=mat('QA_Player',(.02,.38,.72),.1,.4)
floor=cube('QA_Floor',(0,2.55,-.08),(12.8,4.25,.08),purple)
# Hotel/player scale references at the far left.
cube('QA_Door_Left',(-12.1,-.3,1.25),(.09,.18,1.25),gold)
cube('QA_Door_Right',(-11.0,-.3,1.25),(.09,.18,1.25),gold)
cube('QA_Door_Top',(-11.55,-.3,2.45),(.64,.18,.09),gold)
cube('QA_Player_2_2m',(-12.5,1.1,1.1),(.22,.22,1.1),blue)

bpy.ops.object.camera_add(location=(0,-31,10.5)); cam=bpy.context.object; cam.name='QA_Master_Camera'; look_at(cam,(0,2.6,1.0)); cam.data.type='ORTHO'; cam.data.ortho_scale=28; bpy.context.scene.camera=cam
for name,loc,energy,size,color in [
 ('Key',(-8,-12,15),2600,8,(1.0,.65,.5)),('Fill',(9,-5,11),2100,7,(.45,.65,1.0)),('Rim',(0,12,13),2400,6,(1.0,.12,.55))]:
    bpy.ops.object.light_add(type='AREA',location=loc); l=bpy.context.object; l.name=name; l.data.energy=energy; l.data.shape='DISK'; l.data.size=size; l.data.color=color; look_at(l,(0,2.5,1))
scene=bpy.context.scene
scene.render.engine='BLENDER_EEVEE'; scene.render.resolution_x=1800; scene.render.resolution_y=900; scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'; scene.render.film_transparent=False
scene.world.color=(.008,.004,.015)
scene['roster_count']=len(files); scene['player_reference_m']=2.2; scene['door_reference_m']=2.5; scene['source']='SOURCE_ROSTER.md'
scene.render.filepath=os.path.join(QA,'all-30-material-lineup.png'); bpy.ops.render.render(write_still=True)

# Neutral material pass.
original=[]; gray=mat('QA_Neutral_Gray',(.38,.38,.40),0,.62)
for o in scene.objects:
    if o.type=='MESH' and not o.name.startswith('QA_'):
        original.append((o,[m for m in o.data.materials])); o.data.materials.clear(); o.data.materials.append(gray)
scene.render.filepath=os.path.join(QA,'all-30-neutral-gray.png'); bpy.ops.render.render(write_still=True)

# Silhouette pass.
black=mat('QA_Silhouette',(0.002,.002,.002),0,1)
for o,_ in original: o.data.materials.clear(); o.data.materials.append(black)
scene.world.color=(1,1,1)
floor.hide_render=True
scene.render.filepath=os.path.join(QA,'all-30-silhouette.png'); bpy.ops.render.render(write_still=True)

# Restore editable materials and save the master scene.
scene.world.color=(.008,.004,.015); floor.hide_render=False
for o,mats in original:
    o.data.materials.clear()
    for m in mats:
        if m: o.data.materials.append(m)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(BLEND,'all-30-villains-master.blend'))
print(f'MASTER_COMPLETE characters={len(files)}')
