import bpy
import math
import os
from mathutils import Vector


ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BLEND_DIR = os.path.join(ROOT, "blend")
GLB_DIR = os.path.join(ROOT, "glb")
QA_DIR = os.path.join(ROOT, "qa")
for path in (BLEND_DIR, GLB_DIR, QA_DIR):
    os.makedirs(path, exist_ok=True)


def clear_scene():
    if bpy.context.object and bpy.context.object.mode != 'OBJECT':
        bpy.ops.object.mode_set(mode='OBJECT')
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    # Prevent animation clips from previously built characters leaking into later GLBs.
    for action in list(bpy.data.actions):
        bpy.data.actions.remove(action, do_unlink=True)
    for datablocks in (bpy.data.meshes, bpy.data.curves, bpy.data.armatures,
                       bpy.data.cameras, bpy.data.lights, bpy.data.materials):
        for block in list(datablocks):
            if block.users == 0:
                datablocks.remove(block)


def material(name, color, metallic=0.0, roughness=0.48, emission=None, strength=0.0):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1.0)
    mat.use_nodes = True
    bsdf = next(node for node in mat.node_tree.nodes if node.type == 'BSDF_PRINCIPLED')
    bsdf.inputs['Base Color'].default_value = (*color, 1.0)
    bsdf.inputs['Metallic'].default_value = metallic
    bsdf.inputs['Roughness'].default_value = roughness
    if emission:
        bsdf.inputs['Emission Color'].default_value = (*emission, 1.0)
        bsdf.inputs['Emission Strength'].default_value = strength
    return mat


def finish_mesh(obj, bevel=0.025, smooth=True):
    if bevel:
        mod = obj.modifiers.new('Edge Softening', 'BEVEL')
        mod.width = bevel
        mod.segments = 2
    if smooth:
        for poly in obj.data.polygons:
            poly.use_smooth = True
    return obj


def uv_part(name, location, scale, mat, segments=24, rings=16):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=rings, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat)
    return finish_mesh(obj, 0.0, True)


def bevel_box(name, location, scale, mat, bevel=0.04, rotation=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(location=location, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat)
    return finish_mesh(obj, bevel, True)


def cylinder(name, location, radius, depth, mat, vertices=20, rotation=(0, 0, 0), radius2=None):
    if radius2 is None:
        bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth,
                                            location=location, rotation=rotation)
    else:
        bpy.ops.mesh.primitive_cone_add(vertices=vertices, radius1=radius, radius2=radius2,
                                        depth=depth, location=location, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(mat)
    return finish_mesh(obj, min(radius * 0.14, 0.025), True)


def limb_between(name, start, end, r0, r1, mat):
    a, b = Vector(start), Vector(end)
    delta = b - a
    mid = (a + b) * 0.5
    obj = cylinder(name, mid, r0, delta.length, mat, vertices=18, radius2=r1)
    obj.rotation_mode = 'QUATERNION'
    obj.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(delta.normalized())
    obj.rotation_mode = 'XYZ'
    uv_part(name + '_JOINT_A', a, (r0 * 1.04,) * 3, mat, 18, 12)
    uv_part(name + '_JOINT_B', b, (r1 * 1.04,) * 3, mat, 18, 12)
    return obj


def profile_mesh(name, rings, mat, sides=24):
    verts, faces = [], []
    for z, rx, ry, ox, oy in rings:
        for i in range(sides):
            angle = 2 * math.pi * i / sides
            verts.append((ox + rx * math.cos(angle), oy + ry * math.sin(angle), z))
    for r in range(len(rings) - 1):
        for i in range(sides):
            n = (i + 1) % sides
            a = r * sides + i
            b = r * sides + n
            c = (r + 1) * sides + n
            d = (r + 1) * sides + i
            faces.append((a, b, c, d))
    faces.append(tuple(reversed(range(sides))))
    top = (len(rings) - 1) * sides
    faces.append(tuple(top + i for i in range(sides)))
    mesh = bpy.data.meshes.new(name + '_MESH')
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(mat)
    return finish_mesh(obj, 0.025, True)


def curve_tube(name, points, bevel, mat, cyclic=False):
    curve = bpy.data.curves.new(name + '_CURVE', 'CURVE')
    curve.dimensions = '3D'
    curve.bevel_depth = bevel
    curve.bevel_resolution = 3
    spline = curve.splines.new('BEZIER')
    spline.bezier_points.add(len(points) - 1)
    for bp, point in zip(spline.bezier_points, points):
        bp.co = point
        bp.handle_left_type = 'AUTO'
        bp.handle_right_type = 'AUTO'
    spline.use_cyclic_u = cyclic
    obj = bpy.data.objects.new(name, curve)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(mat)
    return obj


def make_hand(prefix, wrist, side, skin, scale=1.0):
    x, y, z = wrist
    palm = bevel_box(prefix + '_PALM', (x, y - 0.015, z - 0.055),
                     (0.09 * scale, 0.055 * scale, 0.12 * scale), skin, 0.045 * scale)
    direction = 1 if side == 'L' else -1
    thumb_start = (x + direction * 0.065 * scale, y - 0.01, z - 0.045)
    thumb_end = (x + direction * 0.13 * scale, y - 0.055, z - 0.10)
    limb_between(prefix + '_THUMB', thumb_start, thumb_end, 0.035 * scale, 0.028 * scale, skin)
    for i, offset in enumerate((-0.045, 0.0, 0.045)):
        fx = x + direction * offset * scale
        limb_between(prefix + f'_FINGER_{i+1}', (fx, y - 0.03, z - 0.13),
                     (fx, y - 0.045, z - 0.22), 0.025 * scale, 0.018 * scale, skin)
    return palm


def make_shoe(prefix, location, mat, scale=(1, 1, 1)):
    x, y, z = location
    sx, sy, sz = scale
    bevel_box(prefix + '_SOLE', (x, y - 0.055 * sy, z),
              (0.13 * sx, 0.25 * sy, 0.055 * sz), mat, 0.055)
    uv_part(prefix + '_TOE', (x, y - 0.17 * sy, z + 0.075 * sz),
            (0.135 * sx, 0.18 * sy, 0.09 * sz), mat, 20, 12)
    bevel_box(prefix + '_HEEL', (x, y + 0.095 * sy, z + 0.075 * sz),
              (0.115 * sx, 0.10 * sy, 0.09 * sz), mat, 0.04)


def make_face(head_center, head_scale, mats, expression='smug'):
    x, y, z = head_center
    sx, sy, sz = head_scale
    front_y = y - sy * 0.93
    eye_z = z + sz * 0.16
    for side in (-1, 1):
        ex = x + side * sx * 0.28
        uv_part(f'FACE_EYE_{"L" if side < 0 else "R"}', (ex, front_y - 0.012, eye_z),
                (sx * 0.105, sy * 0.035, sz * 0.065), mats['cream'], 16, 10)
        uv_part(f'FACE_PUPIL_{"L" if side < 0 else "R"}', (ex + side * 0.01, front_y - 0.035, eye_z),
                (sx * 0.036, sy * 0.025, sz * 0.030), mats['dark'], 14, 8)
        brow_z = eye_z + sz * 0.13
        tilt = -0.025 if side < 0 else 0.02
        curve_tube(f'FACE_BROW_{side}', [(ex - sx * .09, front_y - .04, brow_z + tilt),
                                        (ex + sx * .09, front_y - .04, brow_z - tilt)],
                   0.012, mats['dark'])
    # A shallow, falsely apologetic smile with asymmetric corner.
    curve_tube('FACE_SMILE', [(x - sx * .25, front_y - .048, z - sz * .16),
                              (x, front_y - .065, z - sz * .23),
                              (x + sx * .27, front_y - .048, z - sz * .13)], 0.014, mats['dark'])
    uv_part('FACE_NOSE', (x, front_y - .035, z - sz * .01),
            (sx * .075, sy * .055, sz * .10), mats['skin'], 16, 10)


def make_armature_queuejack(parts):
    bpy.ops.object.armature_add(enter_editmode=True, location=(0, 0, 0))
    rig = bpy.context.object
    rig.name = 'RIG_QUEUEJACK'
    arm = rig.data
    arm.name = 'QUEUEJACK_ARMATURE'
    base = arm.edit_bones[0]
    base.name = 'root'
    base.head = (0, 0, 0)
    base.tail = (0, 0, .35)

    def bone(name, head, tail, parent=None, connected=False):
        b = arm.edit_bones.new(name)
        b.head, b.tail = head, tail
        b.parent = parent
        b.use_connect = connected
        return b

    pelvis = bone('pelvis', (0, 0, .9), (0, -.03, 1.18), base)
    spine = bone('spine', (0, -.03, 1.18), (0, -.12, 1.78), pelvis, True)
    neck = bone('neck', (0, -.12, 1.78), (0, -.20, 2.08), spine, True)
    head = bone('head', (0, -.20, 2.08), (0, -.29, 2.62), neck, True)
    for side, sign in [('L', -1), ('R', 1)]:
        upper = bone(f'upper_arm.{side}', (sign*.30, -.12, 1.75), (sign*.43, -.12, 1.35), spine)
        fore = bone(f'forearm.{side}', (sign*.43, -.12, 1.35), (sign*.50, -.16, .98), upper, True)
        bone(f'hand.{side}', (sign*.50, -.16, .98), (sign*.50, -.18, .76), fore, True)
        thigh = bone(f'thigh.{side}', (sign*.15, 0, 1.02), (sign*.17, 0, .54), pelvis)
        shin = bone(f'shin.{side}', (sign*.17, 0, .54), (sign*.16, 0, .13), thigh, True)
        bone(f'foot.{side}', (sign*.16, 0, .13), (sign*.16, -.28, .10), shin)
    bpy.ops.object.mode_set(mode='OBJECT')
    rig.show_in_front = True
    for obj, bone_name in parts:
        world_matrix = obj.matrix_world.copy()
        obj.parent = rig
        obj.parent_type = 'BONE'
        obj.parent_bone = bone_name
        obj.matrix_world = world_matrix
    # Two small rig actions prove head/shoulder and arm movement survive export.
    bpy.context.view_layer.objects.active = rig
    idle = bpy.data.actions.new('Idle')
    rig.animation_data_create()
    rig.animation_data.action = idle
    pb = rig.pose.bones['spine']
    pb.rotation_mode = 'XYZ'
    for frame, angle in ((1, -.025), (20, .025), (40, -.025)):
        pb.rotation_euler.y = angle
        pb.keyframe_insert('rotation_euler', frame=frame)
    gesture = bpy.data.actions.new('Gesture')
    rig.animation_data.action = gesture
    hand = rig.pose.bones['forearm.L']
    hand.rotation_mode = 'XYZ'
    for frame, angle in ((1, 0), (15, -.42), (30, 0)):
        hand.rotation_euler.x = angle
        hand.keyframe_insert('rotation_euler', frame=frame)
    rig.animation_data.action = idle
    for action in (idle, gesture):
        strip = rig.animation_data.nla_tracks.new().strips.new(action.name, 1, action)
        strip.mute = True
    return rig


def setup_qa_stage(height=2.7):
    stage = bpy.data.collections.new('QA_STAGE')
    bpy.context.scene.collection.children.link(stage)
    active = bpy.context.collection
    bpy.ops.mesh.primitive_cylinder_add(vertices=64, radius=1.15, depth=.08, location=(0, 0, -.04))
    podium = bpy.context.object
    podium.name = 'QA_PODIUM'
    podium.data.materials.append(material('QA_Gold', (.18, .055, .22), .5, .28))
    # Soft studio cyclorama.
    floor = bevel_box('QA_FLOOR', (0, .45, -.12), (3.5, 3.5, .05), material('QA_Floor', (.045, .035, .075), 0, .72), .03)
    for obj in (podium, floor):
        for col in list(obj.users_collection):
            col.objects.unlink(obj)
        stage.objects.link(obj)
    world = bpy.context.scene.world or bpy.data.worlds.new('QA_WORLD')
    bpy.context.scene.world = world
    world.use_nodes = True
    bg = next(node for node in world.node_tree.nodes if node.type == 'BACKGROUND')
    bg.inputs['Color'].default_value = (.018, .012, .035, 1)
    bg.inputs['Strength'].default_value = .28
    for name, loc, energy, color, size in (
        ('KEY', (3.4, -4.0, 4.4), 1050, (1.0, .62, .82), 3.0),
        ('FILL', (-3.8, -2.2, 2.7), 760, (.30, .72, 1.0), 2.5),
        ('RIM', (1.0, 2.7, 3.5), 900, (.96, .52, .18), 2.0),
    ):
        data = bpy.data.lights.new(name, 'AREA')
        data.energy, data.color, data.shape, data.size = energy, color, 'DISK', size
        obj = bpy.data.objects.new(name, data)
        stage.objects.link(obj)
        obj.location = loc
        look_at(obj, (0, 0, height * .52))


def look_at(obj, target):
    direction = Vector(target) - obj.location
    obj.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()


def setup_camera(height=2.7):
    data = bpy.data.cameras.new('QA_CAMERA')
    camera = bpy.data.objects.new('QA_CAMERA', data)
    bpy.context.scene.collection.objects.link(camera)
    bpy.context.scene.camera = camera
    data.lens = 58
    data.sensor_width = 36
    camera.location = (3.4, -6.2, height * .58)
    look_at(camera, (0, 0, height * .52))
    return camera


def render_views(slug, camera, height):
    scene = bpy.context.scene
    try:
        scene.render.engine = 'BLENDER_EEVEE_NEXT'
    except TypeError:
        pass
    scene.render.resolution_x = 520
    scene.render.resolution_y = 720
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'PNG'
    scene.render.film_transparent = False
    views = {
        'front': (0, -6.6, height * .54),
        'three-quarter': (4.0, -5.2, height * .58),
        'side': (6.4, 0, height * .54),
        'back': (0, 6.6, height * .54),
    }
    for label, location in views.items():
        camera.location = location
        look_at(camera, (0, 0, height * .50))
        scene.render.filepath = os.path.join(QA_DIR, f'{slug}-{label}.png')
        bpy.ops.render.render(write_still=True)
    camera.location = views['three-quarter']
    look_at(camera, (0, 0, height * .50))


def export_character(filepath, rig):
    bpy.ops.object.select_all(action='DESELECT')
    rig.select_set(True)
    for obj in bpy.context.scene.objects:
        if obj.parent == rig or (obj.parent and obj.parent.parent == rig):
            obj.select_set(True)
    bpy.context.view_layer.objects.active = rig
    bpy.ops.export_scene.gltf(filepath=filepath, export_format='GLB', use_selection=True,
                              export_animations=True, export_apply=False)


def build_queuejack():
    clear_scene()
    mats = {
        'ink': material('Queuejack_InkBlue', (.025, .075, .18), .12, .34),
        'cream': material('Queuejack_Cream', (.88, .78, .61), 0, .58),
        'brass': material('Queuejack_Brass', (.72, .39, .08), .72, .22),
        'pants': material('Queuejack_Pants', (.018, .025, .05), .05, .56),
        'skin': material('Queuejack_Skin', (.58, .28, .19), 0, .66),
        'dark': material('Queuejack_Features', (.008, .006, .012), .05, .4),
    }
    parts = []
    def track(obj, bone):
        parts.append((obj, bone))
        return obj

    # Custom body-following overcoat with a deliberate forward question-mark lean.
    track(profile_mesh('COAT_BODY', [
        (.88, .24, .15, 0, 0), (1.06, .27, .17, 0, -.01),
        (1.46, .25, .16, 0, -.07), (1.75, .31, .18, 0, -.13),
        (1.90, .19, .13, 0, -.16)], mats['ink']), 'spine')
    # Coat tails overlap the hips and move with the pelvis.
    track(bevel_box('COAT_TAIL_L', (-.14, -.03, .82), (.13, .13, .34), mats['ink'], .055,
                    rotation=(0, .05, -.025)), 'pelvis')
    track(bevel_box('COAT_TAIL_R', (.14, -.03, .82), (.13, .13, .34), mats['ink'], .055,
                    rotation=(0, -.05, .025)), 'pelvis')
    # Cream stripes hug the front of the overcoat rather than floating away.
    for i, x in enumerate((-.17, 0, .17)):
        track(bevel_box(f'COAT_STRIPE_{i+1}', (x, -.177, 1.43), (.028, .014, .36),
                        mats['cream'], .018, rotation=(.01, 0, x*.08)), 'spine')
    # Narrow plain trousers and readable dress shoes.
    for side, sign in [('L', -1), ('R', 1)]:
        track(limb_between(f'THIGH_{side}', (sign*.14, 0, 1.02), (sign*.16, 0, .55),
                           .105, .085, mats['pants']), f'thigh.{side}')
        track(limb_between(f'SHIN_{side}', (sign*.16, 0, .55), (sign*.16, 0, .15),
                           .085, .07, mats['pants']), f'shin.{side}')
        make_shoe(f'SHOE_{side}', (sign*.16, -.035, .07), mats['ink'], (1, 1.08, 1))

    # Shoulder caps make the coat-to-arm transition intentional.
    for side, sign in [('L', -1), ('R', 1)]:
        shoulder = uv_part(f'SHOULDER_{side}', (sign*.285, -.13, 1.73), (.14, .15, .17), mats['ink'])
        track(shoulder, 'spine')
        elbow = (sign*.43, -.12, 1.35)
        wrist = (sign*.50, -.16, .98)
        track(limb_between(f'UPPER_ARM_{side}', (sign*.30, -.13, 1.70), elbow,
                           .11, .085, mats['ink']), f'upper_arm.{side}')
        track(limb_between(f'FOREARM_{side}', elbow, wrist, .085, .068, mats['cream']), f'forearm.{side}')
        make_hand(f'HAND_{side}', wrist, side, mats['skin'], .86)

    track(cylinder('NECK', (0, -.18, 2.00), .092, .27, mats['skin'], 20,
                   rotation=(math.radians(10), 0, 0)), 'neck')
    head_center = (0, -.255, 2.34)
    track(uv_part('HEAD', head_center, (.22, .19, .40), mats['skin'], 32, 24), 'head')
    track(uv_part('SLICK_HAIR', (0, -.205, 2.57), (.225, .185, .20), mats['ink'], 28, 18), 'head')
    make_face(head_center, (.22, .19, .40), mats, 'smug')

    # Collapsible queue-post baton sits in the right grip with nested sections.
    track(cylinder('BATON_GRIP', (.50, -.22, 1.05), .045, .34, mats['ink'], 20), 'hand.R')
    track(cylinder('BATON_SHAFT_LOWER', (.50, -.22, .66), .038, .52, mats['brass'], 20), 'hand.R')
    track(cylinder('BATON_SHAFT_UPPER', (.50, -.22, 1.48), .03, .55, mats['brass'], 20), 'hand.R')
    track(uv_part('BATON_CAP', (.50, -.22, 1.78), (.07, .07, .07), mats['brass'], 18, 12), 'hand.R')
    track(cylinder('BATON_FOOT', (.50, -.22, .35), .12, .035, mats['ink'], 24), 'hand.R')

    # Attach every secondary modeled component to the same bones as its parent form.
    assigned = {obj.name for obj, _ in parts}
    attachment_prefixes = (
        ('FACE_', 'head'), ('HAND_L', 'hand.L'), ('HAND_R', 'hand.R'),
        ('SHOE_L', 'foot.L'), ('SHOE_R', 'foot.R'),
        ('THIGH_L', 'thigh.L'), ('THIGH_R', 'thigh.R'),
        ('SHIN_L', 'shin.L'), ('SHIN_R', 'shin.R'),
        ('UPPER_ARM_L', 'upper_arm.L'), ('UPPER_ARM_R', 'upper_arm.R'),
        ('FOREARM_L', 'forearm.L'), ('FOREARM_R', 'forearm.R'),
    )
    for obj in list(bpy.context.scene.objects):
        if obj.name in assigned or obj.type not in {'MESH', 'CURVE'}:
            continue
        for prefix, bone_name in attachment_prefixes:
            if obj.name.startswith(prefix):
                parts.append((obj, bone_name))
                assigned.add(obj.name)
                break

    rig = make_armature_queuejack(parts)
    rig['character_number'] = 1
    rig['character_name'] = 'Queuejack'
    rig['height_m'] = 2.74
    rig['source'] = 'SOURCE_ROSTER.md Character 01'
    rig['qa_status'] = 'READY_FOR_VISUAL_INSPECTION'
    setup_qa_stage(2.74)
    camera = setup_camera(2.74)
    scene = bpy.context.scene
    scene.unit_settings.system = 'METRIC'
    scene.unit_settings.scale_length = 1.0
    scene.frame_start, scene.frame_end = 1, 40
    scene['production_character'] = '01 Queuejack'
    scene['protected_baseline'] = 'f857bcc'
    blend_path = os.path.join(BLEND_DIR, '01-queuejack.blend')
    glb_path = os.path.join(GLB_DIR, '01-queuejack.glb')
    bpy.ops.wm.save_as_mainfile(filepath=blend_path)
    export_character(glb_path, rig)
    render_views('01-queuejack', camera, 2.74)
    bpy.ops.wm.save_as_mainfile(filepath=blend_path)
    return {'blend': blend_path, 'glb': glb_path, 'objects': len(scene.objects)}


BUILDERS = {1: build_queuejack}


def build_character(number):
    if number not in BUILDERS:
        raise ValueError(f'Character {number:02d} does not have a completed builder yet')
    return BUILDERS[number]()
