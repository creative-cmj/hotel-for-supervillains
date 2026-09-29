import bpy, math, os, json
from mathutils import Vector

ROOT = r"C:\Users\Caleb Johnson\Downloads\New folder\hotel-for-supervillains"
OUT = os.path.join(ROOT, "assets", "new_villain_roster", "refined")
BD, GD, RD = [os.path.join(OUT, x) for x in ("blend", "glb", "renders")]
for p in (BD, GD, RD): os.makedirs(p, exist_ok=True)

if bpy.context.object and bpy.context.object.mode != 'OBJECT': bpy.ops.object.mode_set(mode='OBJECT')
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)

def material(name, rgb, metal=0, rough=.45, glow=None):
    m=bpy.data.materials.get(name) or bpy.data.materials.new(name); m.use_nodes=True
    bs=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
    bs.inputs['Base Color'].default_value=(*rgb,1); bs.inputs['Metallic'].default_value=metal; bs.inputs['Roughness'].default_value=rough
    if glow: bs.inputs['Emission Color'].default_value=(*glow,1); bs.inputs['Emission Strength'].default_value=3
    return m

INK=material('QJ_InkBlue',(.018,.055,.16),.15,.28); BLUE=material('QJ_BlueHighlight',(.035,.14,.34),.1,.30)
CREAM=material('QJ_Cream',(.92,.76,.48),0,.48); BRASS=material('QJ_Brass',(.82,.43,.08),.74,.20)
SKIN=material('QJ_Skin',(.48,.20,.12),0,.58); SKIN2=material('QJ_SkinHighlight',(.69,.34,.20),0,.52)
DARK=material('QJ_Features',(.006,.008,.018),.1,.30); WHITE=material('QJ_EyeWhite',(.96,.90,.78),0,.38)
MOUTH=material('QJ_Mouth',(.42,.035,.07),0,.48); PANTS=material('QJ_Pants',(.012,.018,.045),.05,.48)
SOLE=material('QJ_Sole',(.005,.006,.012),0,.64); GLOW=material('QJ_BatonGlow',(.08,.72,.95),.2,.18,(.04,.65,1))
char=bpy.data.collections.new('CHARACTER_01_QUEUEJACK_REFINED'); bpy.context.scene.collection.children.link(char)

def relink(o, col=char):
    for c in list(o.users_collection): c.objects.unlink(o)
    col.objects.link(o); return o

def mesh(name, vs, fs, mat, bevel=0, smooth=True):
    me=bpy.data.meshes.new(name+'_MESH'); me.from_pydata(vs,[],fs); me.update(); o=bpy.data.objects.new(name,me); char.objects.link(o)
    o.data.materials.append(mat)
    for f in me.polygons: f.use_smooth=smooth
    if bevel: b=o.modifiers.new('EdgeSoftness','BEVEL'); b.width=bevel; b.segments=2
    return o

def rings(name, data, mat, seg=16, phase=0, bevel=.004):
    vs=[]; fs=[]
    for x,y,z,rx,ry in data:
        for i in range(seg):
            a=phase+2*math.pi*i/seg; vs.append((x+rx*math.cos(a),y+ry*math.sin(a),z))
    for r in range(len(data)-1):
        for i in range(seg): fs.append((r*seg+i,r*seg+(i+1)%seg,(r+1)*seg+(i+1)%seg,(r+1)*seg+i))
    fs += [tuple(reversed(range(seg))),tuple((len(data)-1)*seg+i for i in range(seg))]
    return mesh(name,vs,fs,mat,bevel)

def tube(name, pts, rs, mat, seg=12):
    vs=[]; fs=[]
    for j,co in enumerate(pts):
        p=Vector(co); t=(Vector(pts[min(j+1,len(pts)-1)])-Vector(pts[max(j-1,0)])).normalized()
        ref=Vector((0,0,1)) if abs(t.z)<.88 else Vector((0,1,0)); u=t.cross(ref).normalized(); v=t.cross(u).normalized()
        for i in range(seg):
            a=2*math.pi*i/seg; q=p+(u*math.cos(a)+v*math.sin(a))*rs[j]; vs.append(tuple(q))
    for j in range(len(pts)-1):
        for i in range(seg): fs.append((j*seg+i,j*seg+(i+1)%seg,(j+1)*seg+(i+1)%seg,(j+1)*seg+i))
    fs += [tuple(reversed(range(seg))),tuple((len(pts)-1)*seg+i for i in range(seg))]
    return mesh(name,vs,fs,mat,.005)

def box(name,loc,scale,mat,bevel=.02,rot=(0,0,0)):
    bpy.ops.mesh.primitive_cube_add(location=loc,rotation=rot); o=relink(bpy.context.object); o.name=name; o.scale=scale
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True); o.data.materials.append(mat)
    b=o.modifiers.new('TailoredEdges','BEVEL'); b.width=bevel; b.segments=3; return o

def uv(name,loc,scale,mat,rot=(0,0,0)):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=20,ring_count=10,location=loc,rotation=rot); o=relink(bpy.context.object); o.name=name; o.scale=scale
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True); o.data.materials.append(mat)
    for f in o.data.polygons: f.use_smooth=True
    return o

def cyl(name,loc,r,d,mat,rot=(0,0,0),col=char):
    bpy.ops.mesh.primitive_cylinder_add(vertices=18,radius=r,depth=d,location=loc,rotation=rot); o=relink(bpy.context.object,col); o.name=name; o.data.materials.append(mat)
    for f in o.data.polygons: f.use_smooth=True
    b=o.modifiers.new('RimSoftness','BEVEL'); b.width=.008; b.segments=2; return o

def curve(name,pts,mat,thick=.01,col=char):
    cu=bpy.data.curves.new(name+'_CURVE','CURVE'); cu.dimensions='3D'; cu.resolution_u=3; cu.bevel_resolution=3; cu.bevel_depth=thick
    sp=cu.splines.new('BEZIER'); sp.bezier_points.add(len(pts)-1)
    for p,co in zip(sp.bezier_points,pts): p.co=co; p.handle_left_type='AUTO'; p.handle_right_type='AUTO'
    o=bpy.data.objects.new(name,cu); col.objects.link(o); o.data.materials.append(mat); return o

# Continuous legs, shoes, tailored coat, and sleeves replace the blockout's joint balls.
tube('QJ_Leg_L',[(-.13,.02,.94),(-.14,.01,.57),(-.15,0,.17)],[.11,.09,.075],PANTS,14)
tube('QJ_Leg_R',[(.13,-.01,.94),(.155,-.06,.57),(.17,-.10,.17)],[.11,.092,.076],PANTS,14)
rings('QJ_Shoe_L',[(-.15,.00,.08,.11,.12),(-.15,-.18,.08,.125,.17),(-.15,-.39,.07,.105,.13)],INK,14)
rings('QJ_Shoe_R',[(.17,-.10,.08,.11,.12),(.17,-.29,.08,.125,.17),(.17,-.50,.07,.105,.13)],INK,14)
box('QJ_Sole_L',(-.15,-.20,.035),(.13,.25,.025),SOLE,.015); box('QJ_Sole_R',(.17,-.30,.035),(.13,.25,.025),SOLE,.015)
coat=rings('QJ_CoatTailored',[(0,0,.70,.28,.17),(0,-.02,.94,.32,.19),(0,-.05,1.20,.30,.185),(.01,-.08,1.45,.275,.17),(.02,-.12,1.67,.32,.19),(.03,-.16,1.82,.24,.145)],INK,18,math.pi/18,.008)
box('QJ_CoatTail_L',(-.145,.035,.68),(.135,.14,.28),INK,.05,(-.02,.05,-.03)); box('QJ_CoatTail_R',(.145,.02,.68),(.135,.14,.28),INK,.05,(-.02,-.05,.03))
mesh('QJ_Lapel_L',[(-.235,-.285,1.72),(-.045,-.285,1.73),(-.02,-.245,1.28),(-.17,-.244,1.44)],[(0,1,2,3)],CREAM,.012,False)
mesh('QJ_Lapel_R',[(.235,-.285,1.72),(.045,-.285,1.73),(.02,-.245,1.28),(.17,-.244,1.44)],[(0,3,2,1)],CREAM,.012,False)
for x,z,h in [(-.19,1.14,.40),(0,1.08,.46),(.19,1.14,.40)]: box('QJ_CoatStripe_'+str(x),(x,-.231,z),(.025,.012,h),CREAM,.012,(0,0,x*.1))
for z in (1.13,1.37,1.59): uv('QJ_Button_'+str(z),(0,-.258,z),(.035,.018,.035),BRASS)
box('QJ_Collar_L',(-.105,-.205,1.82),(.11,.075,.075),BLUE,.025,(.10,.15,-.18)); box('QJ_Collar_R',(.105,-.205,1.82),(.11,.075,.075),BLUE,.025,(.10,-.15,.18))
rings('QJ_Neck',[(.02,-.14,1.76,.11,.095),(.035,-.18,1.98,.12,.10)],SKIN,14)
tube('QJ_Arm_L',[(-.24,-.12,1.70),(-.34,-.11,1.58),(-.42,-.08,1.31),(-.47,-.13,1.04)],[.145,.13,.105,.085],INK,14)
tube('QJ_Arm_R',[(.24,-.13,1.69),(.35,-.16,1.57),(.44,-.22,1.37),(.36,-.31,1.13),(.31,-.34,.96)],[.145,.13,.105,.09,.078],INK,14)
cyl('QJ_Cuff_L',(-.47,-.13,1.025),.097,.095,CREAM,(0.08,0,0)); cyl('QJ_Cuff_R',(.31,-.34,.95),.092,.09,CREAM,(.15,0,-.15))
rings('QJ_Hand_L',[(-.47,-.13,1.01,.085,.07),(-.48,-.145,.88,.074,.06),(-.48,-.155,.80,.052,.05)],SKIN,12)
rings('QJ_Hand_R',[(.31,-.34,.94,.083,.072),(.32,-.355,.84,.075,.062),(.32,-.36,.77,.052,.05)],SKIN,12)
uv('QJ_Thumb_L',(-.535,-.18,.91),(.045,.055,.085),SKIN2,(.2,0,-.35)); uv('QJ_Thumb_R',(.375,-.40,.86),(.045,.055,.085),SKIN2,(.2,0,.35))

# Long face built from custom rings, with features seated into its front plane.
rings('QJ_HeadSculpt',[(.02,-.18,1.93,.105,.10),(.035,-.22,2.06,.16,.135),(.05,-.265,2.26,.19,.155),(.045,-.285,2.48,.175,.155),(.025,-.27,2.64,.145,.13),(0,-.235,2.72,.075,.075)],SKIN,20,math.pi/20)
uv('QJ_Ear_L',(-.145,-.255,2.35),(.055,.04,.095),SKIN2); uv('QJ_Ear_R',(.235,-.255,2.35),(.055,.04,.095),SKIN2)
rings('QJ_HairCap',[(.02,-.24,2.48,.18,.145),(.015,-.235,2.66,.15,.125),(-.015,-.22,2.76,.085,.07)],BLUE,18)
curve('QJ_HairSweep',[(-.12,-.34,2.66),(-.02,-.365,2.76),(.12,-.34,2.69)],BLUE,.055)
for s in (-1,1):
    x=.045+s*.075; tag='L' if s<0 else 'R'; uv('QJ_EyeWhite_'+tag,(x,-.418,2.43),(.055,.022,.033),WHITE); uv('QJ_Pupil_'+tag,(x+s*.008,-.440,2.425),(.017,.01,.016),DARK)
    curve('QJ_Brow_'+tag,[(x-s*.052,-.438,2.49),(x,-.451,2.505),(x+s*.045,-.437,2.495)],DARK,.01)
mesh('QJ_Nose',[(.02,-.42,2.40),(.075,-.43,2.25),(.02,-.49,2.25),(-.015,-.43,2.25),(.02,-.40,2.18)],[(0,1,2),(0,2,3),(1,4,2),(2,4,3),(3,4,1)],SKIN2,.006)
curve('QJ_SmugSmile',[(-.07,-.432,2.15),(.015,-.465,2.125),(.11,-.437,2.18)],MOUTH,.012); curve('QJ_SmileCrease',[(.09,-.428,2.18),(.125,-.415,2.21)],DARK,.008)

# Queue-post baton, hand grip, and ticket-pocket story detail.
cyl('QJ_BatonRod',(.32,-.41,1.20),.035,.92,BRASS); uv('QJ_BatonTop',(.32,-.41,1.67),(.105,.065,.105),BRASS); uv('QJ_BatonLens',(.32,-.472,1.67),(.055,.018,.055),GLOW); cyl('QJ_BatonGrip',(.32,-.41,.83),.052,.22,DARK)
box('QJ_TicketPocket',(-.19,-.236,1.03),(.085,.016,.12),BLUE,.018,(0,0,-.05)); box('QJ_ClaimTicket',(-.19,-.258,1.15),(.06,.008,.095),CREAM,.01,(0,0,-.05))
curve('QJ_TicketMark',[(-.215,-.271,1.17),(-.19,-.277,1.20),(-.165,-.271,1.17),(-.19,-.277,1.14),(-.215,-.271,1.17)],DARK,.006)

# Simple export skeleton. Geometry stays editable and transform-clean.
bpy.ops.object.armature_add(enter_editmode=True,location=(0,0,0)); rig=relink(bpy.context.object); rig.name='RIG_QUEUEJACK_REFINED'; rig.data.name='QUEUEJACK_REFINED_SKELETON'
root=rig.data.edit_bones[0]; root.name='root'; root.head=(0,0,0); root.tail=(0,0,.25)
def bone(n,h,t,p): b=rig.data.edit_bones.new(n); b.head=h; b.tail=t; b.parent=p; return b
pel=bone('pelvis',(0,0,.72),(0,-.04,1.02),root); sp=bone('spine',(0,-.04,1.02),(.025,-.16,1.82),pel); ne=bone('neck',(.025,-.16,1.82),(.035,-.20,1.98),sp); bone('head',(.035,-.20,1.98),(.02,-.24,2.72),ne)
la=bone('upper_arm.L',(-.24,-.12,1.7),(-.42,-.08,1.31),sp); bone('forearm.L',(-.42,-.08,1.31),(-.48,-.15,.80),la)
ra=bone('upper_arm.R',(.24,-.13,1.69),(.44,-.22,1.37),sp); bone('forearm.R',(.44,-.22,1.37),(.32,-.36,.77),ra)
lt=bone('thigh.L',(-.13,0,.92),(-.14,.01,.57),pel); bone('shin.L',(-.14,.01,.57),(-.15,0,.17),lt)
rt=bone('thigh.R',(.13,-.01,.92),(.155,-.06,.57),pel); bone('shin.R',(.155,-.06,.57),(.17,-.1,.17),rt)
bpy.ops.object.mode_set(mode='OBJECT'); rig.show_in_front=True
for o in list(char.objects):
    if o!=rig: o.parent=rig
rig['character_number']=1; rig['character_name']='Queuejack'; rig['pass']='second-pass-refined'; rig['height_m']=2.78; rig['license']='Original work; no third-party assets'

# QA stage and four-view render setup.
stage=bpy.data.collections.new('QA_STAGE'); bpy.context.scene.collection.children.link(stage)
floor_mat=material('QA_FloorMat',(.035,.018,.065),0,.72)
bpy.ops.mesh.primitive_cylinder_add(vertices=48,radius=1.05,depth=.08,location=(0,0,-.04)); ped=relink(bpy.context.object,stage); ped.name='QA_Pedestal'; ped.data.materials.append(INK)
bpy.ops.mesh.primitive_plane_add(size=20,location=(0,0,-.085)); floor=relink(bpy.context.object,stage); floor.name='QA_Floor'; floor.data.materials.append(floor_mat)
def look(o,t): o.rotation_euler=(Vector(t)-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(4.15,-6.25,2.05)); cam=relink(bpy.context.object,stage); cam.name='QA_CAMERA'; cam.data.lens=62; look(cam,(0,-.1,1.38)); bpy.context.scene.camera=cam
for name,loc,energy,color,size in [('QA_Key',(3,-4,4.3),1050,(1,.63,.4),3),('QA_Fill',(-3,-2.2,2.7),800,(.3,.48,1),2.5),('QA_Rim',(1.5,2.5,3.8),1100,(.72,.18,1),2.4)]:
    bpy.ops.object.light_add(type='AREA',location=loc); l=relink(bpy.context.object,stage); l.name=name; l.data.energy=energy; l.data.color=color; l.data.shape='DISK'; l.data.size=size; look(l,(0,0,1.35))
bpy.ops.object.light_add(type='POINT',location=(0,-1.5,1.1)); l=relink(bpy.context.object,stage); l.data.energy=180; l.data.color=(1,.32,.55)
sc=bpy.context.scene; sc.unit_settings.system='METRIC'; sc.render.engine='BLENDER_EEVEE'; sc.render.resolution_x=720; sc.render.resolution_y=900; sc.render.resolution_percentage=100; sc.render.image_settings.file_format='PNG'; sc.world.color=(.008,.004,.018)
try: sc.view_settings.look='AgX - Medium High Contrast'
except: pass

blend=os.path.join(BD,'01-queuejack-refined.blend'); bpy.ops.wm.save_as_mainfile(filepath=blend)
bpy.ops.object.select_all(action='DESELECT')
for o in char.objects: o.select_set(True)
bpy.context.view_layer.objects.active=rig
glb=os.path.join(GD,'01-queuejack-refined.glb'); bpy.ops.export_scene.gltf(filepath=glb,export_format='GLB',use_selection=True,export_apply=True,export_animations=False)
views={'front':((0,-6.8,1.48),(0,-.12,1.42),62),'left':((-5.4,-.2,1.52),(0,-.1,1.4),68),'right':((5.4,-.2,1.52),(0,-.1,1.4),68),'back':((0,5.8,1.5),(0,-.02,1.4),66),'hero':((4.15,-6.25,2.05),(0,-.1,1.38),62)}
for name,(loc,tgt,lens) in views.items():
    cam.location=loc; cam.data.lens=lens; look(cam,tgt); sc.render.filepath=os.path.join(RD,'01-queuejack-refined-'+name+'.png'); bpy.ops.render.render(write_still=True)
cam.location=views['hero'][0]; cam.data.lens=62; look(cam,views['hero'][1])
bpy.ops.object.select_all(action='DESELECT'); coat.select_set(True); bpy.context.view_layer.objects.active=coat; bpy.ops.wm.save_as_mainfile(filepath=blend)
print(json.dumps({'blend':blend,'glb':glb,'character_objects':len(char.objects),'height_m':2.78}))
