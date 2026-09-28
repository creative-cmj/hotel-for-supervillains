import bpy
import json
import math
import os
from mathutils import Vector


ROOT = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(ROOT, "..", ".."))
BASE_GLB = os.path.join(REPO, "assets", "floor1_public_wing", "grand_disaster_stage1_hotel.glb")
PACK_BLEND = os.path.join(ROOT, "grand_disaster_final_interior_pack.blend")
PACK_GLB = os.path.join(ROOT, "grand_disaster_final_interior_pack.glb")
FULL_BLEND = os.path.join(ROOT, "grand_disaster_complete_asset_hotel.blend")
FULL_GLB = os.path.join(ROOT, "grand_disaster_complete_asset_hotel.glb")
MANAGER_BLEND = os.path.join(ROOT, "grand_disaster_manager.blend")
MANAGER_GLB = os.path.join(ROOT, "grand_disaster_manager.glb")
DRIZZLE_BLEND = os.path.join(ROOT, "doctor_drizzle.blend")
DRIZZLE_GLB = os.path.join(ROOT, "doctor_drizzle.glb")
REPORT = os.path.join(ROOT, "verification.json")
PREVIEWS = os.path.join(ROOT, "previews")


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for child in list(bpy.context.scene.collection.children):
        bpy.context.scene.collection.children.unlink(child)


def collection(name):
    col = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(col)
    return col


def material(name, color, metallic=0.0, roughness=0.5, emission=None, strength=0.0):
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, 1)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    if emission:
        bsdf.inputs["Emission Color"].default_value = (*emission, 1)
        bsdf.inputs["Emission Strength"].default_value = strength
    return mat


def materials(prefix="FINAL"):
    return {
        "purple": material(prefix + "_DeepPurple", (0.13, 0.025, 0.22), 0.12, 0.38),
        "plum": material(prefix + "_RoyalPlum", (0.42, 0.035, 0.28), 0.08, 0.42),
        "black": material(prefix + "_BlackLacquer", (0.012, 0.017, 0.028), 0.32, 0.24),
        "gold": material(prefix + "_WarmGold", (0.88, 0.50, 0.10), 0.78, 0.22),
        "cyan": material(prefix + "_NeonCyan", (0.015, 0.52, 0.74), 0.10, 0.22, (0.02, 0.84, 1.0), 2.2),
        "pink": material(prefix + "_HotPink", (0.90, 0.02, 0.34), 0.05, 0.28, (1.0, 0.015, 0.28), 1.2),
        "ivory": material(prefix + "_WarmIvory", (0.92, 0.78, 0.65), 0.0, 0.65),
        "silver": material(prefix + "_Steel", (0.24, 0.31, 0.39), 0.72, 0.28),
        "ice": material(prefix + "_IceBlue", (0.40, 0.82, 1.0), 0.15, 0.18, (0.12, 0.55, 1.0), 1.3),
        "green": material(prefix + "_BotanicalGreen", (0.05, 0.40, 0.16), 0.0, 0.70),
        "orange": material(prefix + "_HazardOrange", (0.92, 0.24, 0.03), 0.05, 0.40, (1.0, 0.08, 0.01), 0.5),
        "skin": material(prefix + "_Skin", (0.58, 0.30, 0.20), 0.0, 0.72),
        "white": material(prefix + "_White", (0.88, 0.91, 0.96), 0.0, 0.55),
        "storm": material(prefix + "_StormBlue", (0.10, 0.18, 0.35), 0.18, 0.42),
    }


def move_to(obj, col):
    for old in list(obj.users_collection):
        old.objects.unlink(obj)
    col.objects.link(obj)


def empty(name, col, parent=None, location=(0, 0, 0)):
    obj = bpy.data.objects.new(name, None)
    obj.location = location
    col.objects.link(obj)
    obj.parent = parent
    return obj


def box(name, loc, dims, mat, col, parent=None, bevel=0.025, rotation=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(location=loc, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = dims
    obj.data.materials.append(mat)
    move_to(obj, col)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        mod = obj.modifiers.new("Soft_Edges", "BEVEL")
        mod.width = bevel
        mod.segments = 1
        mod.limit_method = "ANGLE"
        bpy.ops.object.modifier_apply(modifier=mod.name)
    obj.parent = parent
    obj.select_set(False)
    return obj


def cylinder(name, loc, radius, depth, mat, col, parent=None, vertices=12, rotation=(0, 0, 0)):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=loc, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(mat)
    move_to(obj, col)
    obj.parent = parent
    obj.select_set(False)
    return obj


def sphere(name, loc, scale, mat, col, parent=None, subdivisions=1):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=subdivisions, radius=1, location=loc)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    obj.data.materials.append(mat)
    move_to(obj, col)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.parent = parent
    obj.select_set(False)
    return obj


def torus(name, loc, major, minor, mat, col, parent=None, rotation=(0, 0, 0)):
    bpy.ops.mesh.primitive_torus_add(major_radius=major, minor_radius=minor, major_segments=16, minor_segments=6, location=loc, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(mat)
    move_to(obj, col)
    obj.parent = parent
    return obj


def room_root(number, identity, col, parent):
    root = empty(f"ROOM_{number}_{identity.upper()}_MODULE", col, parent)
    root["room_number"] = number
    root["identity"] = identity
    root["gameplay_socket"] = True
    return root


def wall_panel(root, col, mats, side, y, z, mat="cyan", width=1.1):
    x = side * 7.72
    box("Wall_Panel_Frame", (x, y, z + 2.15), (0.12, width + 0.16, 1.42), mats["gold"], col, root, 0.025)
    box("Wall_Panel_Core", (x - side * 0.07, y, z + 2.15), (0.035, width, 1.20), mats[mat], col, root, 0.01)


def add_room_modules(col, root, mats):
    level = 9.0
    centers = {-8: (301, 302), -4: (303, 304), 0: (305, 306), 4: (307, 308), 8: (309, 310)}
    # 301: cold suite.
    r = room_root(301, "cold_climate", col, root)
    wall_panel(r, col, mats, 1, -8.0, level, "ice", 1.5)
    for i, yy in enumerate((-9.35, -8.95, -8.55)):
        cylinder("Ice_Crystal", (5.25 + i * 0.38, yy, level + 0.55 + i * 0.15), 0.16, 1.1 + i * 0.25, mats["ice"], col, r, 6)
    box("Thawing_Vent", (6.55, -6.42, level + 0.30), (1.35, 0.18, 0.55), mats["silver"], col, r, 0.04)

    # 302: technology suite.
    r = room_root(302, "technology", col, root)
    wall_panel(r, col, mats, -1, -8.35, level, "cyan", 1.6)
    box("Tech_Rack", (-7.35, -7.05, level + 1.15), (0.55, 1.15, 2.30), mats["black"], col, r, 0.05)
    for zz in (level + 0.55, level + 1.05, level + 1.55, level + 2.05):
        box("Tech_Rack_Status", (-7.05, -7.05, zz), (0.035, 0.75, 0.10), mats["cyan"], col, r, 0.005)
    box("Network_Console", (-5.55, -9.38, level + 0.78), (1.5, 0.55, 0.16), mats["gold"], col, r, 0.05)

    # 303: botanical suite.
    r = room_root(303, "botanical", col, root)
    box("Sealed_Planter", (6.45, -5.38, level + 0.40), (2.1, 0.62, 0.80), mats["gold"], col, r, 0.08)
    for i, xx in enumerate((5.8, 6.45, 7.1)):
        cylinder("Planter_Stem", (xx, -5.38, level + 1.22), 0.06, 1.05, mats["green"], col, r, 8)
        for a in (0, math.pi):
            sphere("Planter_Leaf", (xx + math.cos(a) * 0.22, -5.38, level + 1.35 + i * 0.1), (0.30, 0.10, 0.18), mats["green"], col, r)
    box("Irrigation_Controller", (7.70, -3.15, level + 1.25), (0.10, 0.90, 0.70), mats["cyan"], col, r, 0.03)

    # 304: luxury flexible suite.
    r = room_root(304, "luxury_flexible", col, root)
    cylinder("Luxury_Pedestal", (-6.55, -5.25, level + 0.55), 0.48, 1.1, mats["black"], col, r, 16)
    torus("Luxury_Kinetic_Sculpture_A", (-6.55, -5.25, level + 1.55), 0.48, 0.07, mats["gold"], col, r, rotation=(math.pi / 2, 0, 0))
    torus("Luxury_Kinetic_Sculpture_B", (-6.55, -5.25, level + 1.55), 0.33, 0.06, mats["pink"], col, r, rotation=(0, math.pi / 2, 0))
    box("Amenity_Console", (-7.52, -2.75, level + 1.0), (0.28, 1.25, 1.35), mats["plum"], col, r, 0.06)

    # 305: reinforced hazard suite.
    r = room_root(305, "reinforced", col, root)
    for yy in (-1.20, 0, 1.20):
        wall_panel(r, col, mats, 1, yy, level, "orange", 0.82)
    box("Replaceable_Hazard_Floor", (5.95, 0, level + 0.035), (2.65, 2.1, 0.07), mats["silver"], col, r, 0.025)
    for yy in (-0.72, 0, 0.72):
        box("Hazard_Stripe", (5.95, yy, level + 0.078), (2.4, 0.15, 0.025), mats["orange"], col, r, 0.005)

    # 306: acoustic and illusion suite.
    r = room_root(306, "acoustic_illusion", col, root)
    for yy in (-1.30, -0.43, 0.43, 1.30):
        wall_panel(r, col, mats, -1, yy, level, "plum", 0.64)
    for yy in (-1.25, 1.25):
        box("Acoustic_Speaker", (-6.65, yy, level + 0.9), (0.58, 0.50, 1.8), mats["black"], col, r, 0.07)
        cylinder("Speaker_Glow", (-6.35, yy, level + 0.9), 0.18, 0.035, mats["pink"], col, r, 14, (0, math.pi / 2, 0))

    # 307: preserve the machine and add weather instruments.
    r = room_root(307, "weather_instruments", col, root)
    r["preserves_existing_mission"] = True
    for yy, radius in ((2.85, 0.30), (3.55, 0.24), (4.25, 0.34)):
        torus("Pressure_Gauge_Frame", (7.70, yy, level + 2.15), radius, 0.045, mats["gold"], col, r, rotation=(0, math.pi / 2, 0))
        cylinder("Pressure_Gauge_Face", (7.63, yy, level + 2.15), radius * 0.82, 0.035, mats["cyan"], col, r, 16, (0, math.pi / 2, 0))
    box("Drizzle_Luggage", (5.05, 2.65, level + 0.42), (0.72, 0.48, 0.84), mats["storm"], col, r, 0.08)

    # 308: containment-ready suite.
    r = room_root(308, "containment", col, root)
    box("Observation_Frame", (-7.68, 4.0, level + 2.05), (0.18, 2.2, 1.75), mats["gold"], col, r, 0.04)
    box("Observation_Glass", (-7.56, 4.0, level + 2.05), (0.035, 1.95, 1.48), mats["cyan"], col, r, 0.01)
    box("Airlock_Console", (-5.2, 5.35, level + 0.78), (1.0, 0.40, 1.25), mats["black"], col, r, 0.05)
    box("Airlock_Status", (-5.2, 5.13, level + 0.92), (0.68, 0.025, 0.46), mats["cyan"], col, r, 0.01)

    # 309: gravity and cosmic suite.
    r = room_root(309, "gravity_cosmic", col, root)
    cylinder("Gravity_Anchor", (6.35, 8.0, level + 0.10), 0.82, 0.20, mats["gold"], col, r, 16)
    cylinder("Gravity_Field", (6.35, 8.0, level + 0.22), 0.62, 0.05, mats["cyan"], col, r, 16)
    for i, (dx, dy, dz) in enumerate(((-0.5, 0.2, 1.1), (0.35, -0.35, 1.55), (0.15, 0.5, 2.05))):
        sphere("Cosmic_Sensor", (6.35 + dx, 8.0 + dy, level + dz), (0.18 + i * 0.04,) * 3, mats[("pink", "cyan", "gold")[i]], col, r)
    for yy in (6.55, 9.45):
        box("Furniture_Anchor_Rail", (5.5, yy, level + 0.10), (2.4, 0.12, 0.20), mats["silver"], col, r, 0.025)

    # 310: high-security adaptable suite.
    r = room_root(310, "high_security", col, root)
    box("Security_Scanner", (-5.15, 6.55, level + 1.25), (0.42, 0.42, 2.5), mats["black"], col, r, 0.07)
    box("Security_Scanner_Glow", (-4.92, 6.55, level + 1.45), (0.035, 0.25, 1.55), mats["cyan"], col, r, 0.01)
    box("Secure_Amenity_Case", (-6.75, 9.35, level + 0.42), (1.45, 0.70, 0.84), mats["silver"], col, r, 0.08)
    for yy in (9.10, 9.35, 9.60):
        box("Case_Lock", (-6.00, yy, level + 0.48), (0.035, 0.12, 0.22), mats["pink"], col, r, 0.005)


def add_service_and_shared(col, root, mats):
    service = empty("FLOOR2_SERVICE_EQUIPMENT", col, root)
    service["floor"] = 2
    # Linen and cleaning-cart recess equipment.
    cart = empty("CLEANING_CART_MOVABLE", col, service)
    cart["interaction"] = "Push cleaning cart"
    box("CleaningCart_Base", (-5.8, 11.65, 4.75), (1.35, 0.62, 0.32), mats["silver"], col, cart, 0.06)
    box("CleaningCart_Handle", (-6.35, 11.65, 5.45), (0.10, 0.58, 1.35), mats["gold"], col, cart, 0.03)
    for x in (-6.25, -5.35):
        cylinder("CleaningCart_Wheel", (x, 11.34, 4.63), 0.14, 0.10, mats["black"], col, cart, 12, (math.pi / 2, 0, 0))
    for i, yy in enumerate((11.45, 11.85)):
        box("Amenity_Bin", (-5.72, yy, 5.18), (0.62, 0.28, 0.38), mats[("purple", "plum")[i]], col, cart, 0.04)
    box("Linen_Shelf", (6.6, 11.7, 5.35), (1.6, 0.52, 1.65), mats["black"], col, service, 0.05)
    for z in (4.95, 5.45, 5.95):
        box("Folded_Linen", (6.6, 11.4, z), (1.22, 0.32, 0.16), mats["ivory"], col, service, 0.035)
    box("Staff_Station", (-3.7, 12.6, 5.28), (1.7, 0.55, 0.16), mats["gold"], col, service, 0.05)
    box("Staff_Tablet", (-3.7, 12.28, 5.52), (0.72, 0.05, 0.48), mats["cyan"], col, service, 0.025, (math.radians(20), 0, 0))
    box("Maintenance_Panel", (4.8, 12.15, 5.65), (1.45, 0.18, 1.65), mats["silver"], col, service, 0.04)
    for x in (4.42, 4.8, 5.18):
        cylinder("Maintenance_Status", (x, 12.04, 5.85), 0.10, 0.035, mats["cyan"], col, service, 12, (math.pi / 2, 0, 0))

    shared = empty("FLOOR3_SECURITY_AND_SUPPORT", col, root)
    shared["floor"] = 3
    box("Observation_Desk", (-3.8, 12.6, 9.82), (2.2, 0.72, 0.18), mats["black"], col, shared, 0.08)
    for x in (-4.35, -3.8, -3.25):
        box("Security_Monitor", (x, 12.28, 10.45), (0.48, 0.08, 0.38), mats["cyan"], col, shared, 0.025, (math.radians(8), 0, 0))
    box("Containment_Supply_Cabinet", (5.9, 12.2, 10.15), (1.5, 0.65, 2.3), mats["silver"], col, shared, 0.08)
    box("Cabinet_Hazard_Band", (5.9, 11.85, 10.3), (1.25, 0.035, 0.22), mats["orange"], col, shared, 0.01)
    case = empty("MAINTENANCE_CASE_MOVABLE", col, shared)
    case["interaction"] = "Carry maintenance case"
    box("Maintenance_Case", (3.8, 12.5, 9.35), (0.9, 0.45, 0.52), mats["purple"], col, case, 0.08)
    torus("Maintenance_Case_Handle", (3.8, 12.5, 9.72), 0.22, 0.04, mats["gold"], col, case, rotation=(math.pi / 2, 0, 0))

    ambience = empty("HOTEL_AMBIENT_PROPS", col, root)
    box("Reception_Key_Rack", (-2.5, 17.45, 1.95), (1.4, 0.12, 1.05), mats["black"], col, ambience, 0.04)
    for ix in range(4):
        for iz in range(2):
            box("Room_Key_Tag", (-2.98 + ix * 0.32, 17.36, 1.70 + iz * 0.42), (0.18, 0.035, 0.12), mats[("gold", "cyan")[iz]], col, ambience, 0.015)
    box("Request_Ticket_Tray", (1.2, 16.5, 1.30), (0.72, 0.34, 0.08), mats["gold"], col, ambience, 0.025)
    for i in range(3):
        box("Request_Ticket", (1.2, 16.48, 1.36 + i * 0.018), (0.56, 0.24, 0.012), mats["ivory"], col, ambience, 0.005, (0, 0, 0.05 * i))


def join_descendants(root, name):
    pending = list(root.children)
    meshes = []
    while pending:
        obj = pending.pop()
        pending.extend(obj.children)
        if obj.type == "MESH":
            meshes.append(obj)
    if not meshes:
        return
    for obj in meshes:
        world = obj.matrix_world.copy()
        obj.parent = None
        obj.matrix_world = world
    bpy.ops.object.select_all(action="DESELECT")
    for obj in meshes:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = meshes[0]
    bpy.ops.object.join()
    joined = meshes[0]
    joined.name = name
    world = joined.matrix_world.copy()
    joined.parent = root
    joined.matrix_world = world
    bpy.context.view_layer.objects.active = joined
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)


def export_glb(path, objects):
    bpy.ops.object.select_all(action="DESELECT")
    selected = [obj for obj in objects if obj.type in {"MESH", "EMPTY"}]
    for obj in selected:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = selected[0]
    bpy.ops.export_scene.gltf(filepath=path, export_format="GLB", use_selection=True, export_apply=True, export_yup=True, export_materials="EXPORT", export_cameras=False, export_lights=False)


def model_stats(path):
    clear_scene()
    bpy.ops.import_scene.gltf(filepath=path)
    objects = list(bpy.context.scene.objects)
    meshes = [o for o in objects if o.type == "MESH"]
    points = [o.matrix_world @ Vector(c) for o in meshes for c in o.bound_box]
    low = [min(p[i] for p in points) for i in range(3)]
    high = [max(p[i] for p in points) for i in range(3)]
    names = [o.name for o in objects]
    return {
        "file": os.path.basename(path),
        "bytes": os.path.getsize(path),
        "dimensions_xyz_m": [round(high[i] - low[i], 3) for i in range(3)],
        "mesh_objects": len(meshes),
        "vertices": sum(len(o.data.vertices) for o in meshes),
        "triangles": sum(len(p.vertices) - 2 for o in meshes for p in o.data.polygons),
        "room_theme_modules": len([n for n in names if n.startswith("ROOM_3") and n.endswith("_MODULE")]),
        "all_meshes_materialed": all(o.material_slots for o in meshes),
        "all_mesh_scales_applied": all(all(abs(v - 1) < 0.0001 for v in o.scale) for o in meshes),
    }


def point_at(obj, target):
    obj.rotation_euler = (target - obj.location).to_track_quat("-Z", "Y").to_euler()


def setup_render(glb):
    clear_scene()
    bpy.ops.import_scene.gltf(filepath=glb)
    scene = bpy.context.scene
    world = scene.world or bpy.data.worlds.new("FinalPreviewWorld")
    scene.world = world
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.018, 0.008, 0.03, 1)
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.8
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 1280
    scene.render.resolution_y = 800
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.view_settings.look = "AgX - Medium High Contrast"
    return scene


def add_area(scene, name, loc, energy, color, size, target):
    data = bpy.data.lights.new(name, "AREA")
    data.energy = energy
    data.color = color
    data.shape = "DISK"
    data.size = size
    obj = bpy.data.objects.new(name, data)
    scene.collection.objects.link(obj)
    obj.location = loc
    point_at(obj, Vector(target))


def render_hotel_previews():
    scene = setup_render(FULL_GLB)
    add_area(scene, "WeatherBlue", (5.0, 2.5, 12.5), 1900, (0.18, 0.68, 1.0), 3, (6.2, 4.0, 10.5))
    data = bpy.data.cameras.new("FinalCamera")
    cam = bpy.data.objects.new("FinalCamera", data)
    scene.collection.objects.link(cam)
    scene.camera = cam
    cam.data.lens = 34
    shots = [("vip_weather_307.png", (2.55, 4.0, 10.70), (6.2, 4.0, 10.55))]
    for filename, location, target in shots:
        cam.location = location
        point_at(cam, Vector(target))
        scene.render.filepath = os.path.join(PREVIEWS, filename)
        bpy.ops.render.render(write_still=True)

    # Inspect add-on modules without the hotel walls or base furniture hiding them.
    scene = setup_render(PACK_GLB)
    add_area(scene, "PackKey", (1, 0, 15), 2600, (1.0, 0.62, 0.38), 6, (5, 0, 9))
    add_area(scene, "PackFill", (-8, 8, 12), 2100, (0.18, 0.66, 1.0), 5, (1, 4, 8))
    data = bpy.data.cameras.new("ServiceCamera")
    cam = bpy.data.objects.new("ServiceCamera", data)
    scene.collection.objects.link(cam)
    scene.camera = cam
    cam.data.lens = 48
    module_shots = [
        ("vip_botanical_303.png", (2.8, -7.5, 11.7), (6.35, -5.1, 10.35)),
        ("vip_gravity_309.png", (2.8, 5.8, 11.7), (6.30, 8.0, 10.45)),
        ("floor2_service_equipment.png", (-9.4, 16.2, 7.2), (-5.2, 11.8, 5.25)),
    ]
    for filename, location, target in module_shots:
        cam.location = location
        point_at(cam, Vector(target))
        scene.render.filepath = os.path.join(PREVIEWS, filename)
        bpy.ops.render.render(write_still=True)


def humanoid(col, root, mats, drizzle=False):
    # Original stylized proportions; static and unrigged by design.
    body = mats["storm"] if drizzle else mats["purple"]
    accent = mats["cyan"] if drizzle else mats["gold"]
    box("Character_Torso", (0, 0, 1.35), (0.72, 0.42, 0.86), body, col, root, 0.14)
    sphere("Character_Head", (0, 0, 2.02), (0.34, 0.31, 0.36), mats["skin"], col, root, 2)
    for side in (-1, 1):
        x = side * 0.27
        cylinder("Character_Leg", (x, 0, 0.52), 0.11, 0.92, mats["black"], col, root, 10)
        box("Character_Shoe", (x, -0.06, 0.09), (0.28, 0.42, 0.16), mats["black"], col, root, 0.07)
        cylinder("Character_Arm", (side * 0.49, 0, 1.38), 0.09, 0.82, body, col, root, 10)
        sphere("Character_Hand", (side * 0.49, 0, 0.96), (0.12, 0.11, 0.13), mats["skin"], col, root)
    box("Character_Collar", (0, -0.235, 1.68), (0.52, 0.07, 0.18), accent, col, root, 0.04)
    if drizzle:
        # Cloud backpack and antenna cane establish Doctor Drizzle's silhouette.
        pack = empty("DRIZZLE_CLOUD_PACK", col, root)
        for dx, dz, size in ((0, 0, 0.30), (-0.25, 0.05, 0.23), (0.25, 0.08, 0.25)):
            sphere("Cloud_Pack_Lobe", (dx, 0.30, 1.45 + dz), (size, 0.20, size * 0.75), mats["white"], col, pack)
        cylinder("Antenna_Cane", (0.65, 0, 1.0), 0.035, 1.75, mats["gold"], col, root, 8)
        sphere("Antenna_Node", (0.65, 0, 1.90), (0.12, 0.12, 0.12), mats["cyan"], col, root)
        for side in (-1, 1):
            box("Drizzle_Coat_Tail", (side * 0.20, 0.16, 0.88), (0.30, 0.18, 0.78), body, col, root, 0.08, (0, side * 0.12, 0))
        torus("Drizzle_Goggle_Rim_L", (-0.13, -0.30, 2.08), 0.10, 0.025, mats["gold"], col, root, rotation=(math.pi / 2, 0, 0))
        torus("Drizzle_Goggle_Rim_R", (0.13, -0.30, 2.08), 0.10, 0.025, mats["gold"], col, root, rotation=(math.pi / 2, 0, 0))
    else:
        box("Manager_Jacket_Front", (0, -0.225, 1.34), (0.48, 0.045, 0.62), mats["black"], col, root, 0.04)
        box("Manager_Lapel_L", (-0.14, -0.258, 1.55), (0.12, 0.025, 0.38), mats["gold"], col, root, 0.02, (0, 0, -0.30))
        box("Manager_Lapel_R", (0.14, -0.258, 1.55), (0.12, 0.025, 0.38), mats["gold"], col, root, 0.02, (0, 0, 0.30))
        torus("Manager_Key_Ring", (0.43, -0.24, 1.05), 0.12, 0.025, mats["gold"], col, root, rotation=(math.pi / 2, 0, 0))
        box("Manager_Hair", (0, 0.04, 2.28), (0.62, 0.42, 0.18), mats["black"], col, root, 0.09)


def build_character(label, blend_path, glb_path, drizzle=False):
    clear_scene()
    bpy.context.scene.unit_settings.system = "METRIC"
    bpy.context.scene.unit_settings.scale_length = 1.0
    col = collection(label.upper())
    root = empty(label.upper() + "_ROOT", col)
    root["rig_status"] = "static_unrigged"
    root["height_m"] = 2.35 if drizzle else 2.32
    mats = materials(label.upper())
    humanoid(col, root, mats, drizzle)
    bpy.ops.wm.save_as_mainfile(filepath=blend_path)
    join_descendants(root, label.upper() + "_VISUAL")
    export_glb(glb_path, list(col.all_objects))


def render_character(glb, filename, key_color):
    scene = setup_render(glb)
    add_area(scene, "CharKey", (3, -4, 4), 1100, key_color, 3, (0, 0, 1.2))
    add_area(scene, "CharRim", (-3, 1, 3), 900, (0.16, 0.66, 1.0), 2, (0, 0, 1.2))
    data = bpy.data.cameras.new("CharacterCamera")
    cam = bpy.data.objects.new("CharacterCamera", data)
    scene.collection.objects.link(cam)
    scene.camera = cam
    cam.data.lens = 56
    cam.location = (3.2, -5.2, 2.6)
    point_at(cam, Vector((0, 0, 1.2)))
    scene.render.filepath = os.path.join(PREVIEWS, filename)
    bpy.ops.render.render(write_still=True)


def build():
    os.makedirs(PREVIEWS, exist_ok=True)
    clear_scene()
    scene = bpy.context.scene
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.scale_length = 1.0
    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.import_scene.gltf(filepath=BASE_GLB)
    col = collection("FINAL_INTERIOR_ASSETS")
    root = empty("FINAL_INTERIOR_PACK_ROOT", col)
    root["units"] = "meters"
    root["glb_up_axis"] = "+Y"
    root["glb_front_axis"] = "+Z"
    root["rigging_included"] = False
    mats = materials()
    add_room_modules(col, root, mats)
    add_service_and_shared(col, root, mats)
    bpy.ops.wm.save_as_mainfile(filepath=FULL_BLEND)
    for child in list(scene.collection.children):
        if child != col:
            scene.collection.children.unlink(child)
    bpy.ops.wm.save_as_mainfile(filepath=PACK_BLEND)
    bpy.ops.wm.open_mainfile(filepath=FULL_BLEND)
    col = bpy.data.collections["FINAL_INTERIOR_ASSETS"]
    protected = {"CLEANING_CART_MOVABLE", "MAINTENANCE_CASE_MOVABLE"}
    for child in list(bpy.data.objects["FINAL_INTERIOR_PACK_ROOT"].children):
        if child.name not in protected:
            join_descendants(child, child.name + "_VISUAL")
    for name in protected:
        obj = bpy.data.objects.get(name)
        if obj:
            join_descendants(obj, name + "_VISUAL")
    export_glb(PACK_GLB, list(col.all_objects))
    export_glb(FULL_GLB, list(bpy.context.scene.objects))
    pack_stats = model_stats(PACK_GLB)
    full_stats = model_stats(FULL_GLB)
    assert pack_stats["room_theme_modules"] == 10
    assert pack_stats["all_meshes_materialed"] and pack_stats["all_mesh_scales_applied"]
    assert full_stats["all_meshes_materialed"] and full_stats["all_mesh_scales_applied"]
    build_character("GRAND_DISASTER_MANAGER", MANAGER_BLEND, MANAGER_GLB, False)
    manager_stats = model_stats(MANAGER_GLB)
    build_character("DOCTOR_DRIZZLE", DRIZZLE_BLEND, DRIZZLE_GLB, True)
    drizzle_stats = model_stats(DRIZZLE_GLB)
    assert manager_stats["all_meshes_materialed"] and drizzle_stats["all_meshes_materialed"]
    report = {
        "asset": "Grand Disaster final interior and character asset handoff",
        "coordinate_system": {"glb_up": "+Y", "glb_front": "+Z", "units": "meters"},
        "interior_pack": pack_stats,
        "complete_hotel": full_stats,
        "manager": manager_stats,
        "doctor_drizzle": drizzle_stats,
        "room_identities": {"301": "cold climate", "302": "technology", "303": "botanical", "304": "luxury flexible", "305": "reinforced", "306": "acoustic illusion", "307": "weather instruments", "308": "containment", "309": "gravity cosmic", "310": "high security"},
        "textures": [],
        "third_party_assets": [],
        "rigging": "Static character models only; rig and animation requirements remain pending integration agreement."
    }
    with open(REPORT, "w", encoding="utf-8") as handle:
        json.dump(report, handle, indent=2)
    render_hotel_previews()
    render_character(MANAGER_GLB, "manager_character.png", (1.0, 0.55, 0.30))
    render_character(DRIZZLE_GLB, "doctor_drizzle_character.png", (0.42, 0.68, 1.0))
    print("FINAL_ASSET_PACK_VERIFIED", json.dumps({"pack_triangles": pack_stats["triangles"], "hotel_triangles": full_stats["triangles"], "room_modules": pack_stats["room_theme_modules"]}))


if __name__ == "__main__":
    build()
