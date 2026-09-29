import bpy
import importlib
import math
import os
from mathutils import Vector

import villain_factory as vf
importlib.reload(vf)


SPECS = {
2: dict(name='Knickknack', slug='02-knickknack', height=1.55, width=.62, depth=.36, shoulder=.29,
        pelvis=.53, shoulder_z=1.10, head_z=1.34, head=(.34,.29,.31), head_kind='round', body='pear',
        colors=((.94,.48,.27),(.03,.48,.50),(.94,.86,.69)), outfit='vest-pocket', prop='souvenir-pouch',
        expression='offended', hand=1.0, shoe=1.0, posture=0.0),
3: dict(name='Mrs. Mute', slug='03-mrs-mute', height=1.72, width=.68, depth=.38, shoulder=.27,
        pelvis=.62, shoulder_z=1.23, head_z=1.52, head=(.25,.22,.27), head_kind='oval', body='bell',
        colors=((.34,.05,.30),(.34,.36,.39),(.95,.84,.18)), outfit='high-dress', prop='handbell',
        expression='raised-brow', hand=.85, shoe=.9, posture=0.0),
4: dict(name='Patchwork Pete', slug='04-patchwork-pete', height=1.78, width=.72, depth=.40, shoulder=.38,
        pelvis=.66, shoulder_z=1.28, head_z=1.54, head=(.31,.27,.29), head_kind='square', body='square',
        colors=((.04,.25,.72),(.93,.31,.06),(.89,.86,.77)), outfit='apron-panels', prop='stapler',
        expression='open-grin', hand=1.28, shoe=1.1, posture=0.0),
5: dict(name='Lady Backspace', slug='05-lady-backspace', height=2.16, width=.48, depth=.31, shoulder=.26,
        pelvis=.80, shoulder_z=1.58, head_z=1.91, head=(.24,.20,.31), head_kind='triangle', body='taper',
        colors=((.28,.025,.24),(.60,.91,.77),(.62,.66,.71)), outfit='coat-dress', prop='slate',
        expression='poised', hand=.78, shoe=.82, posture=0.0),
6: dict(name='Rubberneck', slug='06-rubberneck', height=2.02, width=.42, depth=.34, shoulder=.24,
        pelvis=.46, shoulder_z=.91, head_z=1.78, head=(.22,.19,.27), head_kind='egg', body='compact',
        colors=((.03,.65,.66),(.02,.08,.19),(.94,.26,.28)), outfit='turtleneck-shorts', prop='binoculars',
        expression='curious', hand=.78, shoe=1.30, posture=0.0, neck_curve=True),
7: dict(name='Puffet', slug='07-puffet', height=1.70, width=.60, depth=.42, shoulder=.25,
        pelvis=.50, shoulder_z=1.17, head_z=1.30, head=(.34,.25,.31), head_kind='bottle-face', body='bottle',
        colors=((.64,.38,.75),(.88,.30,.52),(.92,.88,.82)), outfit='label-wrap', prop='atomizer',
        expression='gleeful', hand=.88, shoe=.95, posture=0.0),
8: dict(name='Mr. Halfway', slug='08-mr-halfway', height=1.88, width=.68, depth=.35, shoulder=.38,
        pelvis=.67, shoulder_z=1.35, head_z=1.64, head=(.30,.24,.27), head_kind='broad', body='asymmetric',
        colors=((.38,.56,.37),(.025,.08,.18),(.88,.84,.70)), outfit='split-sweater', prop='belt-tape',
        expression='focused', hand=.90, shoe=1.0, posture=.02),
9: dict(name='Drape Escape', slug='09-drape-escape', height=2.08, width=.78, depth=.28, shoulder=.40,
        pelvis=.59, shoulder_z=1.51, head_z=1.85, head=(.24,.18,.28), head_kind='flat-oval', body='triangle',
        colors=((.42,.025,.07),(.78,.45,.07),(.055,.055,.065)), outfit='drape-coat', prop='curtain-ring',
        expression='worried', hand=.75, shoe=.86, posture=0.0),
10: dict(name='Clockwise Clyde', slug='10-clockwise-clyde', height=2.08, width=.49, depth=.32, shoulder=.28,
        pelvis=.91, shoulder_z=1.52, head_z=1.83, head=(.23,.21,.25), head_kind='round', body='thin',
        colors=((.78,.49,.08),(.055,.06,.07),(.93,.93,.90)), outfit='waistcoat', prop='wristwatch',
        expression='alarmed', hand=.82, shoe=.90, posture=-.10),
11: dict(name='Checkmate Charlie', slug='11-checkmate-charlie', height=1.70, width=.74, depth=.40, shoulder=.25,
        pelvis=.58, shoulder_z=1.16, head_z=1.48, head=(.27,.23,.25), head_kind='square', body='chess',
        colors=((.90,.86,.72),(.02,.22,.23),(.61,.27,.09)), outfit='checker-tunic', prop='chessboard',
        expression='calculating', hand=.92, shoe=1.0, posture=0.0),
12: dict(name='Wrongway', slug='12-wrongway', height=1.88, width=.55, depth=.34, shoulder=.33,
        pelvis=.69, shoulder_z=1.35, head_z=1.62, head=(.26,.22,.29), head_kind='arrow', body='zigzag',
        colors=((.92,.29,.03),(.02,.08,.18),(.95,.95,.92)), outfit='pullover', prop='marker',
        expression='squint', hand=.90, shoe=.90, posture=.10),
13: dict(name='Inky Dink', slug='13-inky-dink', height=1.47, width=.46, depth=.32, shoulder=.27,
        pelvis=.50, shoulder_z=.92, head_z=1.20, head=(.36,.29,.33), head_kind='round', body='tiny',
        colors=((.06,.07,.34),(.92,.86,.70),(.94,.55,.04)), outfit='smock', prop='blot-cloth',
        expression='guilty', hand=1.55, shoe=.95, posture=0.0),
14: dict(name='Pogo Gloom', slug='14-pogo-gloom', height=1.67, width=.75, depth=.44, shoulder=.32,
        pelvis=.54, shoulder_z=1.17, head_z=1.45, head=(.30,.27,.27), head_kind='round', body='pear-heavy',
        colors=((.07,.075,.08),(.34,.13,.48),(.48,.88,.08)), outfit='poncho', prop='quiet-placard',
        expression='droop', hand=.84, shoe=1.20, posture=0.0),
15: dict(name='Bravo Brio', slug='15-bravo-brio', height=2.12, width=.56, depth=.32, shoulder=.34,
        pelvis=.78, shoulder_z=1.55, head_z=1.86, head=(.27,.22,.31), head_kind='diamond', body='elegant',
        colors=((.03,.20,.70),(.008,.008,.012),(.80,.025,.035)), outfit='performance-jacket', prop='ticket',
        expression='proud', hand=.82, shoe=.88, posture=0.0),
16: dict(name='Mothball', slug='16-mothball', height=1.58, width=.62, depth=.39, shoulder=.28,
        pelvis=.49, shoulder_z=1.03, head_z=1.33, head=(.30,.26,.28), head_kind='round', body='moth-pear',
        colors=((.20,.34,.13),(.89,.84,.68),(.57,.20,.07)), outfit='vest', prop='sachet',
        expression='anxious', hand=.82, shoe=.95, posture=0.0, wings=True),
17: dict(name='Hiccup Hex', slug='17-hiccup-hex', height=1.78, width=.58, depth=.40, shoulder=.31,
        pelvis=.73, shoulder_z=1.30, head_z=1.55, head=(.29,.25,.27), head_kind='round', body='round-longlegs',
        colors=((.42,.49,.83),(.92,.31,.05),(.20,.24,.29)), outfit='tracksuit', prop='canteen',
        expression='hiccup', hand=.86, shoe=.92, posture=0.0),
18: dict(name='Captain Courtesy', slug='18-captain-courtesy', height=1.92, width=.60, depth=.34, shoulder=.38,
        pelvis=.71, shoulder_z=1.39, head_z=1.70, head=(.24,.21,.27), head_kind='rectangle', body='upright',
        colors=((.025,.26,.15),(.91,.86,.69),(.76,.46,.08)), outfit='dinner-jacket', prop='napkin',
        expression='assessing', hand=.88, shoe=.95, posture=0.0),
19: dict(name='The Tangle', slug='19-the-tangle', height=2.10, width=.52, depth=.34, shoulder=.33,
        pelvis=.76, shoulder_z=1.49, head_z=1.82, head=(.26,.23,.31), head_kind='oblong', body='hunched',
        colors=((.55,.25,.07),(.018,.035,.13),(.92,.78,.23)), outfit='coverall', prop='cable-coil',
        expression='tired', hand=.90, shoe=.88, posture=-.16, long_forearms=True),
20: dict(name='Plush Pummeler', slug='20-plush-pummeler', height=2.14, width=1.12, depth=.62, shoulder=.57,
        pelvis=.71, shoulder_z=1.51, head_z=1.89, head=(.24,.22,.23), head_kind='small-round', body='plush',
        colors=((.72,.38,.48),(.025,.07,.18),(.92,.84,.69)), outfit='robe', prop='rating-card',
        expression='hopeful', hand=1.55, shoe=1.35, posture=0.0),
21: dict(name='Tomorrow', slug='21-tomorrow', height=2.08, width=.72, depth=.43, shoulder=.34,
        pelvis=.45, shoulder_z=1.45, head_z=1.78, head=(.34,.27,.34), head_kind='forehead', body='oval-shortlegs',
        colors=((.30,.65,.87),(.38,.035,.09),(.91,.85,.68)), outfit='cardigan', prop='calendar',
        expression='up-worried', hand=.92, shoe=1.0, posture=0.0, long_arms=True),
22: dict(name='The Gap', slug='22-the-gap', height=1.86, width=.72, depth=.10, shoulder=.38,
        pelvis=.66, shoulder_z=1.34, head_z=1.62, head=(.31,.075,.29), head_kind='flat-oval', body='flat',
        colors=((.03,.25,.72),(.90,.86,.73),(.92,.30,.03)), outfit='pinstripe', prop='hook-tool',
        expression='startled', hand=.78, shoe=.78, posture=0.0),
23: dict(name='Airmail', slug='23-airmail', height=1.48, width=.94, depth=.24, shoulder=.47,
        pelvis=.46, shoulder_z=.98, head_z=1.23, head=(.28,.17,.25), head_kind='pointed', body='paper-plane',
        colors=((.90,.83,.66),(.78,.025,.035),(.02,.08,.18)), outfit='postal-sash', prop='mail-pouch',
        expression='worried', hand=.72, shoe=1.0, posture=0.0),
24: dict(name='Mister Replay', slug='24-mister-replay', height=1.86, width=.52, depth=.34, shoulder=.31,
        pelvis=.68, shoulder_z=1.32, head_z=1.62, head=(.28,.24,.28), head_kind='hex', body='narrow',
        colors=((.03,.62,.62),(.38,.035,.10),(.95,.95,.92)), outfit='two-tone-hoodie', prop='wristband',
        expression='blank', hand=1.25, shoe=.94, posture=0.0, long_forearms=True),
25: dict(name='Crateface', slug='25-crateface', height=1.56, width=.78, depth=.50, shoulder=.39,
        pelvis=.46, shoulder_z=1.06, head_z=1.15, head=(.36,.26,.34), head_kind='crate-face', body='crate',
        colors=((.46,.24,.08),(.025,.08,.17),(.89,.25,.20)), outfit='scarf', prop='shipping-tag',
        expression='offended', hand=1.0, shoe=1.12, posture=0.0),
26: dict(name='Nudge', slug='26-nudge', height=1.02, width=.42, depth=.30, shoulder=.22,
        pelvis=.32, shoulder_z=.62, head_z=.82, head=(.29,.22,.24), head_kind='triangle', body='wedge',
        colors=((.68,.23,.04),(.025,.08,.16),(.36,.82,.62)), outfit='utility-tunic', prop='tape-scepter',
        expression='angry', hand=.72, shoe=1.75, posture=0.0),
27: dict(name='Miss Encore', slug='27-miss-encore', height=2.46, width=.56, depth=.34, shoulder=.29,
        pelvis=.83, shoulder_z=1.72, head_z=2.04, head=(.25,.21,.34), head_kind='long-oval', body='column',
        colors=((.68,.035,.27),(.91,.84,.68),(.76,.46,.08)), outfit='long-robe', prop='name-card',
        expression='knowing', hand=.76, shoe=.80, posture=0.0, big_hair=True),
28: dict(name='Speed Bump', slug='28-speed-bump', height=1.36, width=.90, depth=.48, shoulder=.45,
        pelvis=.42, shoulder_z=.86, head_z=1.12, head=(.37,.28,.24), head_kind='flat-broad', body='low-wide',
        colors=((.94,.76,.03),(.18,.22,.26),(.95,.95,.92)), outfit='reflective-vest', prop='traffic-paddle',
        expression='toothy', hand=1.25, shoe=1.35, posture=0.0),
29: dict(name='Lattice', slug='29-lattice', height=2.16, width=.52, depth=.32, shoulder=.36,
        pelvis=.90, shoulder_z=1.58, head_z=1.88, head=(.24,.21,.25), head_kind='hex', body='stilt',
        colors=((.64,.22,.12),(.23,.35,.50),(.91,.84,.68)), outfit='belted-tunic', prop='floor-plan',
        expression='concentrated', hand=.82, shoe=.88, posture=0.0),
30: dict(name='Nightlight', slug='30-nightlight', height=1.30, width=.58, depth=.40, shoulder=.26,
        pelvis=.36, shoulder_z=.80, head_z=1.06, head=(.34,.21,.28), head_kind='face-panel', body='robot-pear',
        colors=((1.0,.62,.06),(.09,.05,.30),(.92,.87,.72)), outfit='hood-shell', prop='pull-switch',
        expression='worried', hand=.80, shoe=1.35, posture=0.0, robot=True),
}


SKINS = [(.46,.22,.14),(.63,.35,.22),(.34,.17,.10),(.76,.48,.32),(.25,.12,.08),(.53,.28,.18)]


def mats_for(number, spec):
    p, s, a = spec['colors']
    prefix = spec['name'].replace(' ', '_')
    skin_color = SKINS[number % len(SKINS)]
    if spec.get('robot') or spec['body'] in {'bottle','crate','paper-plane'}:
        skin_color = a
    return {
        'primary': vf.material(prefix+'_Primary', p, .10, .38),
        'secondary': vf.material(prefix+'_Secondary', s, .16, .34),
        'accent': vf.material(prefix+'_Accent', a, .35, .28),
        'skin': vf.material(prefix+'_Skin', skin_color, 0, .68),
        'dark': vf.material(prefix+'_Features', (.009,.008,.014), .05, .38),
        'white': vf.material(prefix+'_Eyes', (.96,.94,.87), 0, .45),
        'glow': vf.material(prefix+'_Glow', p, .1, .18, p, 2.5),
    }


def add_triangle(name, location, scale, mat, rotation=(0,0,0)):
    bpy.ops.mesh.primitive_cone_add(vertices=3, radius1=1, radius2=0, depth=2,
                                    location=location, rotation=rotation)
    obj=bpy.context.object; obj.name=name; obj.scale=scale
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    obj.data.materials.append(mat); return vf.finish_mesh(obj,.035,True)


def triangle_prism(name, location, scale, mat):
    x,y,z=location; sx,sy,sz=scale
    verts=[]
    for fy in (-sy,sy):
        verts.extend([(x-sx,y+fy,z-sz),(x+sx,y+fy,z-sz),(x,y+fy,z+sz)])
    faces=[(0,1,2),(5,4,3),(0,3,4,1),(1,4,5,2),(2,5,3,0)]
    mesh=bpy.data.meshes.new(name+'_MESH'); mesh.from_pydata(verts,[],faces); mesh.update()
    obj=bpy.data.objects.new(name,mesh); bpy.context.collection.objects.link(obj); obj.data.materials.append(mat)
    return vf.finish_mesh(obj,.035,True)


def add_ring(name, location, major, minor, mat, rotation=(math.pi/2,0,0)):
    bpy.ops.mesh.primitive_torus_add(major_radius=major, minor_radius=minor,
                                    major_segments=32, minor_segments=10,
                                    location=location, rotation=rotation)
    obj=bpy.context.object; obj.name=name; obj.data.materials.append(mat)
    return vf.finish_mesh(obj,0,True)


def face_parts(spec, center, scale, mats):
    # Sink separate face geometry slightly into the head so side views never read as floating.
    x,y,z=center; sx,sy,sz=scale; objs=[]; front=y-sy*.98
    expr=spec['expression']
    eye_scale=.11 if expr not in {'blank','curious','guilty','startled','anxious'} else .16
    if expr in {'droop','tired','knowing','assessing'}: eye_scale=.10
    for side in (-1,1):
        ex=x+side*sx*.30
        ez=z+sz*(.15 if expr!='up-worried' else .25)
        white=vf.uv_part(f'FACE_EYE_{side}',(ex,front-.008,ez),(sx*eye_scale,sy*.035,sz*.095),mats['white'],18,10); objs.append(white)
        pupil=vf.uv_part(f'FACE_PUPIL_{side}',(ex+(side*.012 if expr in {'squint','calculating'} else 0),front-.03,ez),(sx*.045,sy*.027,sz*.043),mats['dark'],14,8); objs.append(pupil)
        brow_tilt = .05 * (1 if (expr in {'angry','calculating','offended'} and side<0) else -1 if expr in {'angry','calculating','offended'} else side)
        brow_raise = sz*.11 if expr=='raised-brow' and side<0 else 0
        brow=vf.curve_tube(f'FACE_BROW_{side}',[(ex-sx*.11,front-.04,ez+sz*.15+brow_tilt+brow_raise),(ex+sx*.11,front-.04,ez+sz*.15-brow_tilt+brow_raise)],.011,mats['dark']); objs.append(brow)
    mouth_z=z-sz*.18
    if expr in {'open-grin','proud','hopeful','toothy','gleeful'}:
        mouth=vf.bevel_box('FACE_MOUTH',(x,front-.035,mouth_z),(sx*.27,sy*.025,sz*.09),mats['dark'],.04); objs.append(mouth)
        teeth=vf.bevel_box('FACE_TEETH',(x,front-.055,mouth_z+sz*.025),(sx*.20,sy*.018,sz*.035),mats['white'],.018); objs.append(teeth)
    else:
        droop = -.07 if expr in {'worried','anxious','hiccup','up-worried','offended'} else 0 if expr=='raised-brow' else .04
        mouth=vf.curve_tube('FACE_MOUTH',[(x-sx*.23,front-.045,mouth_z+droop),(x,front-.055,mouth_z-droop*.25),(x+sx*.23,front-.045,mouth_z+droop)],.014,mats['dark']); objs.append(mouth)
    if spec['head_kind'] not in {'face-panel','crate-face','bottle-face','pointed'}:
        nose=vf.uv_part('FACE_NOSE',(x,front-.035,z-sz*.01),(sx*.065,sy*.05,sz*.085),mats['skin'],14,8); objs.append(nose)
    return objs


def head_object(spec, mats):
    center=(spec.get('head_x',0),spec.get('head_y',0),spec['head_z'])
    scale=spec['head']; kind=spec['head_kind']
    if kind in {'square','rectangle','hex','crate-face','face-panel','flat-broad'}:
        bevel=.06 if kind!='crate-face' else .025
        head=vf.bevel_box('HEAD',center,scale,mats['accent'] if kind in {'crate-face','face-panel'} else mats['skin'],bevel)
    elif kind in {'triangle','arrow','pointed','diamond'}:
        if kind=='diamond':
            bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2,radius=1,location=center)
            head=bpy.context.object; head.name='HEAD'; head.scale=scale; bpy.ops.object.transform_apply(location=False,rotation=False,scale=True); head.data.materials.append(mats['skin']); vf.finish_mesh(head,.02,True)
        else:
            head=triangle_prism('HEAD',center,scale,mats['skin'])
    else:
        head=vf.uv_part('HEAD',center,scale,mats['accent'] if kind=='bottle-face' else mats['skin'],28,20)
    return head,center,scale


def body_rings(spec):
    p=spec['pelvis']; s=spec['shoulder_z']; w=spec['width']/2; d=spec['depth']/2; shape=spec['body']; lean=spec.get('posture',0)
    if shape in {'pear','pear-heavy','moth-pear','robot-pear'}: widths=(w*.95,w*1.1,w*.75)
    elif shape in {'plush','low-wide'}: widths=(w*.88,w,w*.95)
    elif shape in {'triangle','wedge','paper-plane'}: widths=(w*.42,w*.72,w)
    elif shape in {'taper','elegant','column','stilt','thin','narrow','hunched'}: widths=(w*.72,w*.86,w)
    elif shape=='chess': widths=(w,w*.75,w*.48)
    elif shape=='bottle': widths=(w*.88,w,w*.48)
    elif shape=='bell': widths=(w,w*.82,w*.58)
    elif shape=='flat': widths=(w*.85,w,w*.88)
    else: widths=(w*.78,w,w*.92)
    return [(p*.84,widths[0],d*.94,0,0),(p,widths[0],d,0,0),
            (p+(s-p)*.48,widths[1],d,0,lean*.45),(s,widths[2],d*.92,0,lean)]


def make_generic_rig(spec, parts):
    h=spec['height']; p=spec['pelvis']; s=spec['shoulder_z']; hz=spec['head_z']; sh=spec['shoulder']; leg_bottom=.16
    arm_extra=.12 if spec.get('long_arms') or spec.get('long_forearms') else 0
    elbow_z=s-(s-p)*.48; wrist_z=p-.03-arm_extra
    bpy.ops.object.armature_add(enter_editmode=True,location=(0,0,0)); rig=bpy.context.object; rig.name='RIG_'+spec['name'].upper().replace(' ','_')
    arm=rig.data; root=arm.edit_bones[0]; root.name='root'; root.head=(0,0,0); root.tail=(0,0,.2)
    def b(name,head,tail,parent=None):
        bone=arm.edit_bones.new(name); bone.head=head; bone.tail=tail; bone.parent=parent; return bone
    pelvis=b('pelvis',(0,0,p*.82),(0,spec.get('posture',0)*.4,p),root)
    spine=b('spine',(0,0,p),(0,spec.get('posture',0),s),pelvis)
    neck=b('neck',(0,spec.get('posture',0),s),(0,spec.get('head_y',0),hz-spec['head'][2]),spine)
    head=b('head',(0,spec.get('head_y',0),hz-spec['head'][2]),(0,spec.get('head_y',0),hz+spec['head'][2]),neck)
    for side,sign in [('L',-1),('R',1)]:
        upper=b(f'upper_arm.{side}',(sign*sh,spec.get('posture',0),s),(sign*(sh+.08),0,elbow_z),spine)
        fore=b(f'forearm.{side}',(sign*(sh+.08),0,elbow_z),(sign*(sh+.12),-.02,wrist_z),upper)
        b(f'hand.{side}',(sign*(sh+.12),-.02,wrist_z),(sign*(sh+.12),-.03,wrist_z-.18),fore)
        thigh=b(f'thigh.{side}',(sign*spec['width']*.18,0,p),(sign*spec['width']*.20,0,(p+leg_bottom)*.52),pelvis)
        shin=b(f'shin.{side}',(sign*spec['width']*.20,0,(p+leg_bottom)*.52),(sign*spec['width']*.19,0,leg_bottom),thigh)
        b(f'foot.{side}',(sign*spec['width']*.19,0,leg_bottom),(sign*spec['width']*.19,-.22,.08),shin)
    bpy.ops.object.mode_set(mode='OBJECT'); rig.show_in_front=True
    for obj,bone_name in parts:
        wm=obj.matrix_world.copy(); obj.parent=rig; obj.parent_type='BONE'; obj.parent_bone=bone_name; obj.matrix_world=wm
    rig.animation_data_create(); idle=bpy.data.actions.new('Idle'); rig.animation_data.action=idle
    pb=rig.pose.bones['spine']; pb.rotation_mode='XYZ'
    for frame,ang in ((1,-.018),(20,.018),(40,-.018)):
        pb.rotation_euler.y=ang; pb.keyframe_insert('rotation_euler',frame=frame)
    gesture=bpy.data.actions.new('Gesture'); rig.animation_data.action=gesture; pb=rig.pose.bones['forearm.L']; pb.rotation_mode='XYZ'
    for frame,ang in ((1,0),(15,-.38),(30,0)):
        pb.rotation_euler.x=ang; pb.keyframe_insert('rotation_euler',frame=frame)
    rig.animation_data.action=idle
    for action in (idle,gesture):
        strip=rig.animation_data.nla_tracks.new().strips.new(action.name,1,action); strip.mute=True
    return rig


def prop_for(spec,mats,hand_r,hand_l):
    prop=spec['prop']; objs=[]; x,y,z=hand_r
    def add(obj,bone='hand.R'):
        obj['attach_bone']=bone
        objs.append(obj)
        return obj
    if prop=='souvenir-pouch':
        add(vf.bevel_box('PROP_POUCH',(spec['width']*.55,-.12,spec['pelvis']*.92),(.20,.10,.24),mats['secondary'],.07),'pelvis'); add(vf.curve_tube('PROP_POUCH_STRAP',[(-.16,-.13,spec['shoulder_z']*.98),(spec['width']*.55,-.13,spec['pelvis'])],.025,mats['accent']),'spine')
    elif prop=='handbell':
        bpy.ops.mesh.primitive_cone_add(vertices=24,radius1=.12,radius2=.055,depth=.18,location=(x,y,z-.16))
        bell=bpy.context.object; bell.name='PROP_BELL'; bell.data.materials.append(mats['accent']); vf.finish_mesh(bell,.018,True); add(bell)
        add(vf.cylinder('PROP_BELL_HANDLE',(x,y,z-.01),.025,.16,mats['secondary']))
    elif prop=='stapler': add(vf.bevel_box('PROP_STAPLER',(x,y-.05,z-.10),(.15,.07,.05),mats['secondary'],.035,rotation=(0,.18,0)))
    elif prop=='slate': add(vf.bevel_box('PROP_SLATE',(x,y-.07,z-.08),(.17,.035,.23),mats['secondary'],.035))
    elif prop=='binoculars':
        for sx in (-.07,.07): add(vf.cylinder(f'PROP_BINOCULAR_{sx}',(sx,-spec['depth']*.62,spec['shoulder_z']-.08),.07,.18,mats['secondary'],rotation=(math.pi/2,0,0)),'spine')
        add(vf.curve_tube('PROP_BINOCULAR_STRAP',[(-.12,-.16,spec['shoulder_z']+.05),(0,-.18,spec['pelvis']),(.12,-.16,spec['shoulder_z']+.05)],.014,mats['accent']),'spine')
    elif prop=='atomizer':
        add(vf.cylinder('PROP_ATOMIZER',(0,0,spec['height']-.03),.07,.22,mats['accent']),'head'); add(vf.uv_part('PROP_ATOMIZER_BULB',(.12,0,spec['height']+.05),(.13,.11,.11),mats['secondary'],20,12),'head')
    elif prop=='belt-tape': add(vf.bevel_box('PROP_TAPE',(spec['width']*.45,-.12,spec['pelvis']+.02),(.09,.06,.10),mats['accent'],.035),'pelvis')
    elif prop=='curtain-ring': add(add_ring('PROP_CURTAIN_RING',(0,-spec['depth']*.57,spec['shoulder_z']+.05),.10,.025,mats['accent']),'spine')
    elif prop=='wristwatch': add(vf.cylinder('PROP_WATCH',(hand_l[0],hand_l[1]-.055,hand_l[2]+.08),.13,.06,mats['accent'],rotation=(math.pi/2,0,0)),'hand.L')
    elif prop=='chessboard':
        board=add(vf.bevel_box('PROP_CHESSBOARD',(x,y-.04,z-.08),(.22,.045,.22),mats['accent'],.025,rotation=(0,.15,0)))
        for i in (-.09,.09): add(vf.bevel_box('PROP_CHESS_TILE',(x+i,y-.09,z-.08),(.04,.012,.18),mats['secondary'],.008))
    elif prop=='marker': add(vf.cylinder('PROP_MARKER',(spec['width']*.5,-.12,spec['pelvis']+.03),.035,.32,mats['accent']),'pelvis')
    elif prop=='blot-cloth': add(vf.bevel_box('PROP_BLOT_CLOTH',(hand_l[0],hand_l[1]-.05,hand_l[2]-.05),(.13,.025,.15),mats['accent'],.035,rotation=(0,.2,.15)))
    elif prop=='quiet-placard':
        add(vf.bevel_box('PROP_QUIET_SIGN',(0,-spec['depth']*.57,spec['shoulder_z']-.18),(.24,.025,.13),mats['accent'],.02),'spine'); add(vf.curve_tube('PROP_SIGN_Q',[(-.08,-spec['depth']*.60,spec['shoulder_z']-.18),(.08,-spec['depth']*.60,spec['shoulder_z']-.18)],.014,mats['dark']),'spine')
    elif prop=='ticket': add(vf.bevel_box('PROP_TICKET',(x,y-.06,z-.10),(.12,.018,.06),mats['accent'],.012,rotation=(0,.2,.1)))
    elif prop=='sachet':
        add(vf.bevel_box('PROP_SACHET',(0,-spec['depth']*.60,spec['shoulder_z']-.18),(.18,.06,.22),mats['accent'],.06),'spine'); add(vf.curve_tube('PROP_SACHET_TIE',[(-.08,-spec['depth']*.66,spec['shoulder_z']+.02),(0,-spec['depth']*.68,spec['shoulder_z']+.10),(.08,-spec['depth']*.66,spec['shoulder_z']+.02)],.012,mats['secondary']),'spine')
    elif prop=='canteen':
        add(vf.uv_part('PROP_CANTEEN',(spec['width']*.42,-spec['depth']*.52,spec['pelvis']+.16),(.16,.08,.22),mats['secondary'],22,14),'spine'); add(vf.cylinder('PROP_CANTEEN_SPOUT',(spec['width']*.42,-spec['depth']*.52,spec['pelvis']+.40),.035,.12,mats['accent']),'spine')
    elif prop=='napkin': add(vf.bevel_box('PROP_NAPKIN',(-.14,-spec['depth']*.57,spec['shoulder_z']-.08),(.07,.018,.10),mats['accent'],.012,rotation=(0,0,.15)),'spine')
    elif prop=='cable-coil': add(add_ring('PROP_CABLE_COIL',(spec['width']*.40,-.02,spec['shoulder_z']-.10),.22,.035,mats['accent'],rotation=(0,math.pi/2,0)),'spine')
    elif prop=='rating-card': add(vf.bevel_box('PROP_RATING_CARD',(x,y-.08,z-.12),(.09,.015,.12),mats['accent'],.018))
    elif prop=='calendar':
        add(vf.bevel_box('PROP_CALENDAR',(x,y-.07,z-.10),(.20,.025,.18),mats['accent'],.025)); add(add_ring('PROP_CALENDAR_RING',(x,y-.10,z+.08),.06,.012,mats['secondary']))
    elif prop=='hook-tool':
        add(vf.cylinder('PROP_HOOK_SHAFT',(x,y,z-.18),.035,.45,mats['accent'])); add(vf.curve_tube('PROP_HOOK_CURVE',[(x,y,z+.03),(x+.14,y,z+.13),(x+.22,y,z+.03)],.035,mats['accent']))
    elif prop=='mail-pouch':
        add(vf.bevel_box('PROP_MAIL_POUCH',(spec['width']*.25,-spec['depth']*.58,spec['pelvis']+.16),(.19,.07,.14),mats['secondary'],.04),'spine'); add(vf.curve_tube('PROP_MAIL_STRAP',[(-spec['width']*.32,-.15,spec['shoulder_z']), (spec['width']*.25,-.16,spec['pelvis']+.1)],.022,mats['accent']),'spine')
    elif prop=='wristband': add(vf.cylinder('PROP_WRISTBAND',(hand_l[0],hand_l[1],hand_l[2]+.08),.11,.06,mats['accent'],rotation=(math.pi/2,0,0)),'hand.L')
    elif prop=='shipping-tag':
        add(vf.bevel_box('PROP_SHIPPING_TAG',(spec['width']*.55,-spec['depth']*.45,spec['pelvis']+.15),(.12,.025,.19),mats['accent'],.018,rotation=(0,.1,-.1)),'spine'); add(vf.curve_tube('PROP_TAG_CORD',[(spec['width']*.40,-.12,spec['shoulder_z']), (spec['width']*.55,-.12,spec['pelvis']+.32)],.012,mats['secondary']),'spine')
    elif prop=='tape-scepter':
        add(vf.cylinder('PROP_TAPE_SCEPTER',(x,y,z-.10),.025,.42,mats['accent'])); add(vf.bevel_box('PROP_TAPE_CASE',(x,y,z+.12),(.09,.055,.09),mats['secondary'],.035))
    elif prop=='name-card': add(vf.bevel_box('PROP_NAME_CARD',(0,-spec['depth']*.57,spec['shoulder_z']+.02),(.12,.018,.07),mats['accent'],.015),'spine')
    elif prop=='traffic-paddle':
        add(vf.cylinder('PROP_PADDLE_HANDLE',(x,y,z-.18),.035,.50,mats['secondary'])); add(vf.cylinder('PROP_PADDLE',(x,y,z+.14),.20,.035,mats['accent'],vertices=32,rotation=(math.pi/2,0,0)))
    elif prop=='floor-plan':
        add(vf.bevel_box('PROP_FLOOR_PLAN',(spec['width']*.48,-.10,spec['pelvis']+.06),(.22,.025,.16),mats['accent'],.02,rotation=(0,.05,-.15)),'pelvis'); add(vf.curve_tube('PROP_PLAN_LINES',[(spec['width']*.34,-.135,spec['pelvis']+.02),(spec['width']*.58,-.135,spec['pelvis']+.02)],.008,mats['dark']),'pelvis')
    elif prop=='pull-switch':
        add(vf.curve_tube('PROP_PULL_CORD',[(0,spec['depth']*.55,spec['head_z']+.08),(0,spec['depth']*.62,spec['head_z']-.22)],.012,mats['accent']),'head'); add(vf.uv_part('PROP_PULL_KNOB',(0,spec['depth']*.62,spec['head_z']-.27),(.055,.055,.07),mats['accent'],16,10),'head')
    return objs


def outfit_details(spec,mats):
    objs=[]; outfit=spec['outfit']; z=spec['shoulder_z']; p=spec['pelvis']; d=spec['depth']/2
    def add(o): objs.append(o); return o
    if outfit in {'vest-pocket','waistcoat','vest','reflective-vest'}:
        add(vf.bevel_box('OUTFIT_VEST_FRONT',(0,-d*.98,(z+p)*.5),(spec['width']*.32,.018,(z-p)*.38),mats['secondary'],.03))
        if outfit=='vest-pocket': add(vf.bevel_box('OUTFIT_POCKET',(-.12,-d*1.08,p+.18),(.11,.018,.10),mats['accent'],.02))
    elif outfit=='apron-panels':
        for i,x in enumerate((-.20,0,.20)): add(vf.bevel_box(f'OUTFIT_PANEL_{i}',(x,-d*1.02,(z+p)*.48),(.09,.02,(z-p)*.42),[mats['primary'],mats['accent'],mats['secondary']][i],.025))
    elif outfit in {'coat-dress','long-robe','robe','cardigan','drape-coat','poncho','high-dress'}:
        bottom=.20 if outfit=='long-robe' else p*.55
        rings=[(bottom,spec['width']*.42,d*.95,0,0),(p,spec['width']*.44,d,0,0),(z,spec['width']*.47,d*.95,0,spec.get('posture',0))]
        if outfit in {'poncho','drape-coat'}: rings=[(bottom,spec['width']*.46,d,0,0),(z-.10,spec['width']*.60,d*1.05,0,0),(z,spec['width']*.40,d,0,0)]
        add(vf.profile_mesh('OUTFIT_MAIN',rings,mats['primary'],24))
        if outfit=='high-dress': add(vf.cylinder('OUTFIT_HIGH_COLLAR',(0,0,z+.05),spec['width']*.22,.20,mats['primary'],vertices=28))
    elif outfit in {'dinner-jacket','performance-jacket'}:
        for side in (-1,1): add(vf.bevel_box(f'OUTFIT_LAPEL_{side}',(side*.11,-d*1.04,z-.20),(.08,.018,.26),mats['accent'],.018,rotation=(0,side*.10,side*.16)))
        for row in (z-.22,z-.38):
            for side in (-1,1): add(vf.uv_part(f'OUTFIT_BUTTON_{side}_{row}',(side*.09,-d*1.10,row),(.025,.015,.025),mats['accent'],12,8))
    elif outfit in {'split-sweater','two-tone-hoodie'}:
        add(vf.bevel_box('OUTFIT_SPLIT',(spec['width']*.22,-d*1.02,(z+p)*.50),(spec['width']*.21,.018,(z-p)*.42),mats['secondary'],.025))
        if outfit=='two-tone-hoodie': add(add_ring('OUTFIT_HOOD',(0,.04,z+.04),spec['width']*.27,.035,mats['accent'],rotation=(0,0,0)))
    elif outfit in {'pullover','tracksuit','coverall','turtleneck-shorts','smock','utility-tunic','belted-tunic'}:
        add(vf.cylinder('OUTFIT_BELT',(0,0,p+.08),spec['width']*.39,.06,mats['accent'],vertices=24))
    elif outfit=='checker-tunic':
        for i,x in enumerate((-.24,-.08,.08,.24)): add(vf.bevel_box(f'OUTFIT_CHECK_{i}',(x,-d*1.03,p+.08),(.06,.018,.06),mats['secondary'] if i%2 else mats['accent'],.01))
    elif outfit=='postal-sash': add(vf.bevel_box('OUTFIT_SASH',(0,-d*1.03,(z+p)*.53),(.08,.018,(z-p)*.56),mats['secondary'],.018,rotation=(0,0,-.35)))
    elif outfit=='pinstripe':
        for x in (-.22,0,.22): add(vf.bevel_box('OUTFIT_PINSTRIPE',(x,-d*1.08,(z+p)*.5),(.018,.012,(z-p)*.43),mats['accent'],.008))
    elif outfit=='scarf': add(vf.curve_tube('OUTFIT_SCARF',[(-.20,-.14,z+.02),(0,-.22,z-.10),(.20,-.14,z+.02)],.055,mats['secondary']))
    elif outfit=='hood-shell': add(add_ring('OUTFIT_HOOD',(0,.01,spec['head_z']),spec['head'][0]*1.02,.045,mats['secondary'],rotation=(0,0,0)))
    elif outfit=='label-wrap': add(vf.cylinder('OUTFIT_LABEL',(0,0,p+.20),spec['width']*.43,.28,mats['secondary'],vertices=32))
    return objs


def extras_for(spec,mats):
    objs=[]
    if spec.get('wings'):
        for side in (-1,1): objs.append(add_triangle(f'WING_{side}',(side*.28,.18,spec['shoulder_z']-.15),(.30,.06,.48),mats['secondary'],rotation=(math.pi/2,0,-side*.35)))
        for side in (-1,1): objs.append(vf.curve_tube(f'ANTENNA_{side}',[(side*.08,0,spec['head_z']+spec['head'][2]*.78),(side*.14,0,spec['height'])],.018,mats['accent']))
    if spec.get('big_hair'):
        objs.append(vf.uv_part('HAIR_MASS',(0,.02,spec['head_z']+spec['head'][2]*.52),(spec['head'][0]*1.85,spec['head'][1]*1.35,spec['head'][2]*.62),mats['secondary'],32,20))
    if spec['body']=='paper-plane':
        for side in (-1,1): objs.append(add_triangle(f'PAPER_WING_{side}',(side*.34,.05,spec['shoulder_z']-.08),(.55,.08,.34),mats['primary'],rotation=(math.pi/2,0,-side*math.pi/2)))
    if spec['body']=='crate':
        for z in (spec['pelvis']*.72,spec['shoulder_z']*.96): objs.append(vf.bevel_box('CRATE_SLAT',(0,-spec['depth']*.53,z),(spec['width']*.45,.022,.035),mats['accent'],.012))
    if spec['head_kind']=='face-panel':
        objs.append(vf.bevel_box('FACE_GLOW_PANEL',(0,-spec['head'][1]*1.02,spec['head_z']),(.26,.022,.20),mats['glow'],.055))
    return objs


def render_views(spec,camera):
    scene=bpy.context.scene
    try: scene.render.engine='BLENDER_EEVEE_NEXT'
    except TypeError: pass
    scene.render.resolution_x=520; scene.render.resolution_y=720; scene.render.resolution_percentage=100; scene.render.image_settings.file_format='PNG'
    dist=max(3.2,spec['height']*2.35,spec['width']*3.8); target=(0,0,spec['height']*.5)
    views={'front':(0,-dist,spec['height']*.55),'three-quarter':(dist*.58,-dist*.78,spec['height']*.58),'side':(dist,0,spec['height']*.55),'back':(0,dist,spec['height']*.55)}
    for label,loc in views.items():
        camera.location=loc; vf.look_at(camera,target); scene.render.filepath=os.path.join(vf.QA_DIR,f"{spec['slug']}-{label}.png"); bpy.ops.render.render(write_still=True)
    camera.location=views['three-quarter']; vf.look_at(camera,target)


def build_generic(number):
    spec=SPECS[number]; vf.clear_scene(); mats=mats_for(number,spec); parts=[]
    def track(obj,bone): parts.append((obj,bone)); return obj
    p,s=spec['pelvis'],spec['shoulder_z']; w=spec['width']; d=spec['depth']; sh=spec['shoulder']
    track(vf.profile_mesh('BODY',body_rings(spec),mats['primary'],24),'spine')
    # Legs, purposeful footwear, shoulders, arms and modeled hands.
    knee=(p+.16)*.52
    for side,sign in [('L',-1),('R',1)]:
        hip_x=sign*w*.18; foot_x=sign*w*.20
        track(vf.limb_between(f'THIGH_{side}',(hip_x,0,p),(foot_x,0,knee),w*.115,w*.09,mats['secondary']),f'thigh.{side}')
        track(vf.limb_between(f'SHIN_{side}',(foot_x,0,knee),(foot_x,0,.16),w*.09,w*.075,mats['secondary']),f'shin.{side}')
        vf.make_shoe(f'SHOE_{side}',(foot_x,-.02,.075),mats['secondary'],(spec['shoe'],spec['shoe'],spec['shoe']))
        shoulder_y=spec.get('posture',0); shoulder_x=sign*sh
        if spec['body']=='asymmetric': shoulder_x*=1.18 if side=='L' else .80
        elbow=(sign*(sh+.08),0,s-(s-p)*.48)
        if spec.get('long_forearms'): elbow=(sign*(sh+.12),-.01,s-(s-p)*.40)
        wrist=(sign*(sh+.12),-.02,p-.03-(.12 if spec.get('long_arms') or spec.get('long_forearms') else 0))
        track(vf.uv_part(f'SHOULDER_{side}',(shoulder_x,shoulder_y,s),(.13*(1.2 if spec['body']=='asymmetric' and side=='L' else 1),d*.44,.15),mats['primary'],20,12),'spine')
        track(vf.limb_between(f'UPPER_ARM_{side}',(shoulder_x,shoulder_y,s-.03),elbow,w*.12,w*.09,mats['primary']),f'upper_arm.{side}')
        track(vf.limb_between(f'FOREARM_{side}',elbow,wrist,w*.09,w*.072,mats['skin']),f'forearm.{side}')
        vf.make_hand(f'HAND_{side}',wrist,side,mats['skin'],spec['hand'])
    # Neck and character-specific head.
    neck_base=s+.02; neck_top=spec['head_z']-spec['head'][2]*.78
    if spec.get('neck_curve'):
        neck=vf.curve_tube('NECK_CURVE',[(0,0,neck_base),(-.10,-.05,(neck_base+neck_top)*.5),(0,-.12,neck_top)],w*.10,mats['skin']); track(neck,'neck'); spec['head_y']=-.12
    else: track(vf.limb_between('NECK',(0,spec.get('posture',0),neck_base),(0,spec.get('head_y',0),neck_top),w*.10,w*.09,mats['skin']),'neck')
    head,center,hscale=head_object(spec,mats); track(head,'head')
    face=face_parts(spec,center,hscale,mats)
    details=outfit_details(spec,mats); extras=extras_for(spec,mats)
    wrist_r=(sh+.12,-.02,p-.03-(.12 if spec.get('long_arms') or spec.get('long_forearms') else 0)); wrist_l=(-wrist_r[0],wrist_r[1],wrist_r[2])
    props=prop_for(spec,mats,wrist_r,wrist_l)
    assigned={obj.name for obj,_ in parts}
    prefix_map=(('FACE_','head'),('HAIR_','head'),('ANTENNA_','head'),('OUTFIT_HOOD','head'),('PROP_PULL','head'),('HAND_L','hand.L'),('HAND_R','hand.R'),('SHOE_L','foot.L'),('SHOE_R','foot.R'),('THIGH_L','thigh.L'),('THIGH_R','thigh.R'),('SHIN_L','shin.L'),('SHIN_R','shin.R'),('UPPER_ARM_L','upper_arm.L'),('UPPER_ARM_R','upper_arm.R'),('FOREARM_L','forearm.L'),('FOREARM_R','forearm.R'),('WING_','spine'),('PAPER_WING_','spine'),('OUTFIT_','spine'),('CRATE_','spine'),('PROP_','hand.R'))
    for obj in list(bpy.context.scene.objects):
        if obj.name in assigned or obj.type not in {'MESH','CURVE'}: continue
        if 'attach_bone' in obj:
            parts.append((obj,obj['attach_bone'])); assigned.add(obj.name); continue
        for prefix,bone in prefix_map:
            if obj.name.startswith(prefix): parts.append((obj,bone)); assigned.add(obj.name); break
    rig=make_generic_rig(spec,parts); rig['character_number']=number; rig['character_name']=spec['name']; rig['height_m']=spec['height']; rig['source']=f'SOURCE_ROSTER.md Character {number:02d}'; rig['qa_status']='READY_FOR_VISUAL_INSPECTION'
    vf.setup_qa_stage(spec['height']); camera=vf.setup_camera(spec['height']); scene=bpy.context.scene; scene.unit_settings.system='METRIC'; scene.unit_settings.scale_length=1; scene.frame_start=1; scene.frame_end=40; scene['production_character']=f"{number:02d} {spec['name']}"; scene['protected_baseline']='f857bcc'
    blend=os.path.join(vf.BLEND_DIR,spec['slug']+'.blend'); glb=os.path.join(vf.GLB_DIR,spec['slug']+'.glb'); bpy.ops.wm.save_as_mainfile(filepath=blend); vf.export_character(glb,rig); render_views(spec,camera); bpy.ops.wm.save_as_mainfile(filepath=blend)
    return {'number':number,'name':spec['name'],'blend':blend,'glb':glb,'objects':len(scene.objects)}


def build_character(number):
    if number==1: return vf.build_queuejack()
    return build_generic(number)
