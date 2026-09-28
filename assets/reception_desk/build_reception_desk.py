import bpy
import json
import math
import os
from mathutils import Vector


ROOT = os.path.dirname(os.path.abspath(__file__))
BLEND_PATH = os.path.join(ROOT, "grand_disaster_reception_desk.blend")
GLB_PATH = os.path.join(ROOT, "grand_disaster_reception_desk.glb")
REPORT_PATH = os.path.join(ROOT, "verification.json")


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for datablocks in (bpy.data.meshes, bpy.data.curves, bpy.data.materials, bpy.data.cameras, bpy.data.lights):
        for datablock in list(datablocks):
            if datablock.users == 0:
                datablocks.remove(datablock)


def material(name, color, metallic=0.0, roughness=0.5, emission=None, emission_strength=0.0):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1.0)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    if emission:
        bsdf.inputs["Emission Color"].default_value = (*emission, 1.0)
        bsdf.inputs["Emission Strength"].default_value = emission_strength
    return mat


def move_to_collection(obj, collection):
    for existing in list(obj.users_collection):
        existing.objects.unlink(obj)
    collection.objects.link(obj)


def apply_object(obj, bevel=0.0, segments=2):
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        modifier = obj.modifiers.new("Edge_Soften", "BEVEL")
        modifier.width = bevel
        modifier.segments = segments
        modifier.limit_method = "ANGLE"
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.modifier_apply(modifier=modifier.name)
    for polygon in obj.data.polygons:
        polygon.use_smooth = False
    obj.select_set(False)


def box(name, location, dimensions, mat, collection, bevel=0.025, rotation=(0.0, 0.0, 0.0)):
    bpy.ops.mesh.primitive_cube_add(location=location, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = dimensions
    obj.data.materials.append(mat)
    move_to_collection(obj, collection)
    apply_object(obj, bevel)
    return obj


def cylinder(name, location, radius, depth, mat, collection, vertices=12, rotation=(0.0, 0.0, 0.0), bevel=0.015):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=location, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(mat)
    move_to_collection(obj, collection)
    apply_object(obj, bevel)
    return obj


def polygon_prism(name, points, y_front, depth, mat, collection):
    vertices = []
    for y in (y_front, y_front + depth):
        vertices.extend((x, y, z) for x, z in points)
    count = len(points)
    faces = [tuple(range(count)), tuple(range(count, count * 2))[::-1]]
    for index in range(count):
        nxt = (index + 1) % count
        faces.append((index, nxt, count + nxt, count + index))
    mesh = bpy.data.meshes.new(f"{name}_Mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    collection.objects.link(obj)
    obj.data.materials.append(mat)
    apply_object(obj, bevel=0.012, segments=1)
    return obj


def add_asset():
    asset = bpy.data.collections.new("ASSET_ReceptionDesk")
    bpy.context.scene.collection.children.link(asset)

    root = bpy.data.objects.new("ReceptionDesk_ROOT", None)
    root.empty_display_type = "PLAIN_AXES"
    root["units"] = "meters"
    root["glb_up_axis"] = "+Y"
    root["glb_front_axis"] = "+Z"
    root["placement_origin"] = "base center"
    asset.objects.link(root)

    purple = material("MAT_DeepPurple_Velvet", (0.16, 0.035, 0.24), roughness=0.48)
    plum = material("MAT_Plum_Lacquer", (0.28, 0.075, 0.34), metallic=0.1, roughness=0.3)
    black = material("MAT_Black_Lacquer", (0.012, 0.016, 0.026), metallic=0.22, roughness=0.24)
    gold = material("MAT_WarmGold", (0.83, 0.47, 0.13), metallic=0.76, roughness=0.25)
    cyan = material("MAT_NeonCyan", (0.03, 0.52, 0.68), metallic=0.1, roughness=0.25, emission=(0.02, 0.75, 1.0), emission_strength=2.4)
    pink = material("MAT_HotPink_Accent", (0.82, 0.06, 0.35), metallic=0.05, roughness=0.34, emission=(1.0, 0.04, 0.32), emission_strength=0.7)
    stone = material("MAT_PurpleStone_Counter", (0.27, 0.17, 0.34), metallic=0.12, roughness=0.28)

    parts = []
    parts.append(box("Desk_MainCarcass", (0.0, -0.13, 0.50), (7.0, 1.38, 0.94), purple, asset, 0.055))
    parts.append(box("Desk_RearKick_Recess", (0.0, 0.61, 0.30), (6.45, 0.10, 0.45), black, asset, 0.02))
    parts.append(box("Desk_Countertop", (0.0, -0.02, 1.085), (7.2, 1.65, 0.15), stone, asset, 0.045))
    parts.append(box("Trim_CounterFront", (0.0, -0.855, 1.06), (7.08, 0.055, 0.12), gold, asset, 0.012))
    parts.append(box("Trim_BaseFront", (0.0, -0.802, 0.095), (6.86, 0.07, 0.12), gold, asset, 0.012))
    parts.append(box("Trim_LeftCap", (-3.49, -0.13, 0.51), (0.10, 1.38, 0.95), gold, asset, 0.018))
    parts.append(box("Trim_RightCap", (3.49, -0.13, 0.51), (0.10, 1.38, 0.95), gold, asset, 0.018))

    panel_x = (-2.75, -1.65, -0.55, 0.55, 1.65, 2.75)
    panel_mats = (plum, black, plum, plum, black, plum)
    for index, (x, panel_mat) in enumerate(zip(panel_x, panel_mats), start=1):
        angle = math.radians(4.0 if index % 2 else -4.0)
        parts.append(box(f"Front_Facet_{index:02d}", (x, -0.815, 0.55), (0.92, 0.075, 0.66), panel_mat, asset, 0.025, rotation=(0.0, angle, 0.0)))
        parts.append(box(f"Front_GoldDivider_{index:02d}", (x + 0.51, -0.842, 0.55), (0.035, 0.04, 0.71), gold, asset, 0.008))

    parts.append(cylinder("Crest_GoldOctagon", (0.0, -0.875, 0.58), 0.37, 0.07, gold, asset, vertices=8, rotation=(math.pi / 2, 0.0, 0.0), bevel=0.012))
    parts.append(cylinder("Crest_CyanGem", (0.0, -0.915, 0.58), 0.275, 0.045, cyan, asset, vertices=8, rotation=(math.pi / 2, 0.0, 0.0), bevel=0.009))
    lightning = [(-0.05, 0.82), (0.13, 0.82), (0.035, 0.61), (0.18, 0.61), (-0.08, 0.32), (-0.015, 0.54), (-0.16, 0.54)]
    parts.append(polygon_prism("Crest_PinkLightning", lightning, -0.952, 0.025, pink, asset))

    parts.append(box("Computer_Bay_Inlay", (1.75, 0.16, 1.164), (1.60, 0.62, 0.012), cyan, asset, 0.006))
    parts.append(box("Phone_Bay_Inlay", (-2.35, 0.17, 1.164), (0.66, 0.58, 0.012), pink, asset, 0.006))
    parts.append(box("Cable_Channel", (0.0, 0.58, 1.17), (5.9, 0.10, 0.045), black, asset, 0.012))
    for x in (-2.95, 2.95):
        parts.append(cylinder(f"Cable_Grommet_{'L' if x < 0 else 'R'}", (x, 0.34, 1.173), 0.075, 0.02, black, asset, vertices=16, bevel=0.005))

    for obj in parts:
        obj.location.z -= 0.03
        obj.parent = root
    return asset, root


def setup_preview(asset):
    preview = bpy.data.collections.new("PREVIEW_ONLY")
    bpy.context.scene.collection.children.link(preview)
    floor_mat = material("PREVIEW_Floor", (0.055, 0.035, 0.08), roughness=0.62)
    floor = box("PREVIEW_Floor", (0.0, 0.0, -0.06), (12.0, 9.0, 0.1), floor_mat, preview, 0.0)
    floor.is_shadow_catcher = False

    world = bpy.context.scene.world or bpy.data.worlds.new("PREVIEW_World")
    bpy.context.scene.world = world
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.018, 0.012, 0.03, 1.0)
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.32

    def area(name, location, energy, color, size):
        data = bpy.data.lights.new(name, "AREA")
        data.energy = energy
        data.color = color
        data.shape = "DISK"
        data.size = size
        obj = bpy.data.objects.new(name, data)
        preview.objects.link(obj)
        obj.location = location
        point_camera(obj, Vector((0.0, 0.0, 0.55)))
        return obj

    area("PREVIEW_Key", (-4.0, -4.5, 5.5), 1050, (1.0, 0.67, 0.42), 4.0)
    area("PREVIEW_Fill", (4.5, -1.5, 3.2), 850, (0.32, 0.72, 1.0), 3.2)
    area("PREVIEW_Rim", (0.0, 4.5, 4.0), 950, (0.95, 0.22, 0.60), 2.8)

    camera_data = bpy.data.cameras.new("PREVIEW_Camera")
    camera = bpy.data.objects.new("PREVIEW_Camera", camera_data)
    preview.objects.link(camera)
    camera.data.lens = 52
    bpy.context.scene.camera = camera
    return preview, camera


def point_camera(camera, target):
    camera.rotation_euler = (target - camera.location).to_track_quat("-Z", "Y").to_euler()


def render_views(camera):
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 960
    scene.render.resolution_y = 640
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = False
    scene.view_settings.look = "AgX - Medium High Contrast"
    views = {
        "preview_front.png": ((0.0, -11.4, 2.8), (0.0, 0.0, 0.56)),
        "preview_rear.png": ((0.0, 10.8, 3.0), (0.0, 0.0, 0.70)),
        "preview_three_quarter.png": ((7.2, -6.7, 3.45), (0.0, 0.0, 0.60)),
    }
    for filename, (location, target) in views.items():
        camera.location = location
        point_camera(camera, Vector(target))
        scene.render.filepath = os.path.join(ROOT, filename)
        bpy.ops.render.render(write_still=True)


def export_asset(asset):
    bpy.ops.object.select_all(action="DESELECT")
    for obj in asset.all_objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = bpy.data.objects.get("ReceptionDesk_ROOT")
    bpy.ops.export_scene.gltf(
        filepath=GLB_PATH,
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_yup=True,
        export_materials="EXPORT",
        export_cameras=False,
        export_lights=False,
    )


def mesh_stats(objects):
    triangles = 0
    vertices = 0
    materials = set()
    for obj in objects:
        if obj.type != "MESH":
            continue
        obj.data.calc_loop_triangles()
        triangles += len(obj.data.loop_triangles)
        vertices += len(obj.data.vertices)
        materials.update(slot.material.name for slot in obj.material_slots if slot.material)
    return triangles, vertices, sorted(materials)


def world_bounds(objects):
    points = []
    for obj in objects:
        if obj.type == "MESH":
            points.extend(obj.matrix_world @ Vector(corner) for corner in obj.bound_box)
    minimum = Vector((min(point.x for point in points), min(point.y for point in points), min(point.z for point in points)))
    maximum = Vector((max(point.x for point in points), max(point.y for point in points), max(point.z for point in points)))
    return minimum, maximum, maximum - minimum


def verify_export(source_triangles):
    clear_scene()
    bpy.ops.import_scene.gltf(filepath=GLB_PATH)
    imported = list(bpy.context.scene.objects)
    meshes = [obj for obj in imported if obj.type == "MESH"]
    minimum, maximum, dimensions = world_bounds(meshes)
    triangles, vertices, materials = mesh_stats(meshes)
    roots = [obj for obj in imported if obj.type == "EMPTY" and obj.name.startswith("ReceptionDesk_ROOT")]
    report = {
        "asset": "Grand Disaster Reception Desk",
        "source_blend": os.path.basename(BLEND_PATH),
        "export_glb": os.path.basename(GLB_PATH),
        "verified_by": "Blender 5.1 GLB clean-scene re-import",
        "coordinate_system": {"glb_up": "+Y", "glb_front": "+Z", "origin": "base center"},
        "bounds_after_reimport_m": {
            "min_blender_xyz": [round(value, 4) for value in minimum],
            "max_blender_xyz": [round(value, 4) for value in maximum],
            "dimensions_xyz": [round(value, 4) for value in dimensions],
        },
        "mesh_objects": len(meshes),
        "vertices": vertices,
        "triangles": triangles,
        "source_triangles": source_triangles,
        "materials": materials,
        "material_count": len(materials),
        "textures": [],
        "glb_bytes": os.path.getsize(GLB_PATH),
        "root_at_origin": bool(roots and roots[0].location.length < 0.0001),
        "all_mesh_scales_applied": all(all(abs(scale - 1.0) < 0.0001 for scale in obj.scale) for obj in meshes),
        "all_meshes_have_material": all(len(obj.material_slots) > 0 for obj in meshes),
        "triangle_count_matches_source": triangles == source_triangles,
    }
    with open(REPORT_PATH, "w", encoding="utf-8") as handle:
        json.dump(report, handle, indent=2)
    assert 7.15 <= dimensions.x <= 7.25
    assert 1.72 <= dimensions.y <= 1.80
    assert 1.15 <= dimensions.z <= 1.20
    assert -0.005 <= minimum.z <= 0.005
    assert report["root_at_origin"]
    assert report["all_mesh_scales_applied"]
    assert report["all_meshes_have_material"]
    assert report["triangle_count_matches_source"]
    return report


def main():
    clear_scene()
    scene = bpy.context.scene
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.scale_length = 1.0
    asset, root = add_asset()
    source_meshes = [obj for obj in asset.all_objects if obj.type == "MESH"]
    source_triangles, _, _ = mesh_stats(source_meshes)
    export_asset(asset)
    preview, camera = setup_preview(asset)
    render_views(camera)
    bpy.ops.wm.save_as_mainfile(filepath=BLEND_PATH)
    report = verify_export(source_triangles)
    print("RECEPTION_DESK_VERIFIED", json.dumps(report, sort_keys=True))


if __name__ == "__main__":
    main()
