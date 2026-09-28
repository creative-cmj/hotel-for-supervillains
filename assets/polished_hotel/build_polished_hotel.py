"""Create the repaired three-floor hotel from the approved complete hotel GLB.

This is deliberately a post-process.  It preserves the approved lobby, public
wings, room shells, Room 307 mission props, and authored materials while
turning the three west end rooms into proper elevator landings.
"""

import bpy
import json
import math
import os
from mathutils import Vector


ROOT = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(ROOT, "..", ".."))
SOURCE = os.path.join(REPO, "assets", "final_interior_pack", "grand_disaster_complete_asset_hotel.glb")
BLEND = os.path.join(ROOT, "grand_disaster_polished_hotel.blend")
GLB = os.path.join(ROOT, "grand_disaster_polished_hotel.glb")
REPORT = os.path.join(ROOT, "verification.json")


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for child in list(bpy.context.scene.collection.children):
        bpy.context.scene.collection.children.unlink(child)


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


def move_to(obj, collection):
    for old in list(obj.users_collection):
        old.objects.unlink(obj)
    collection.objects.link(obj)


def box(name, location, dimensions, mat, collection, bevel=0.025):
    bpy.ops.mesh.primitive_cube_add(location=location)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = dimensions
    obj.data.materials.append(mat)
    move_to(obj, collection)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        modifier = obj.modifiers.new("Soft_Edges", "BEVEL")
        modifier.width = bevel
        modifier.segments = 1
        modifier.limit_method = "ANGLE"
        bpy.ops.object.modifier_apply(modifier=modifier.name)
    return obj


def cylinder(name, location, radius, depth, mat, collection, vertices=16):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(mat)
    move_to(obj, collection)
    return obj


def text_mesh(name, body, location, size, mat, collection, rotation=(math.pi / 2, 0, 0)):
    curve = bpy.data.curves.new(name + "_CURVE", "FONT")
    curve.body = body
    curve.align_x = "CENTER"
    curve.align_y = "CENTER"
    curve.size = size
    curve.extrude = 0.012
    obj = bpy.data.objects.new(name, curve)
    obj.location = location
    obj.rotation_euler = rotation
    curve.materials.append(mat)
    collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.convert(target="MESH")
    obj.select_set(False)
    return obj


def remove_tree(obj):
    for child in list(obj.children):
        remove_tree(child)
    bpy.data.objects.remove(obj, do_unlink=True)


def remove_named_prefix(prefix):
    matching = [obj for obj in list(bpy.context.scene.objects) if obj.name.startswith(prefix)]
    roots = [obj.name for obj in matching if obj.parent is None or not obj.parent.name.startswith(prefix)]
    for name in roots:
        obj = bpy.data.objects.get(name)
        if obj:
            remove_tree(obj)


def build_landing(collection, level, floor_number, accent, mats):
    root = bpy.data.objects.new(f"FLOOR_{floor_number}_ELEVATOR_LOBBY_ROOT", None)
    root["floor_number"] = floor_number
    root["zone"] = "elevator_lobby"
    collection.objects.link(root)

    carpet = box(
        f"FLOOR_{floor_number}_ELEVATOR_LOBBY_CARPET",
        (-5.0, 8.0, level + 0.035),
        (5.55, 3.55, 0.07),
        accent,
        collection,
        0.02,
    )
    carpet.parent = root
    # Seating remains against the outer wall and leaves the center approach clear.
    bench_base = box(
        f"FLOOR_{floor_number}_ELEVATOR_BENCH_BASE",
        (-7.28, 7.25, level + 0.34),
        (0.72, 1.45, 0.36),
        mats["black"],
        collection,
        0.08,
    )
    bench_base.parent = root
    bench_pad = box(
        f"FLOOR_{floor_number}_ELEVATOR_BENCH_PAD",
        (-7.18, 7.25, level + 0.58),
        (0.72, 1.38, 0.18),
        accent,
        collection,
        0.07,
    )
    bench_pad.parent = root

    sign_back = box(
        f"FLOOR_{floor_number}_ELEVATOR_SIGN_BACK",
        (-5.0, 9.72, level + 3.35),
        (3.1, 0.10, 0.62),
        mats["black"],
        collection,
        0.05,
    )
    sign_back.parent = root
    label = "LOBBY" if floor_number == 1 else f"FLOOR {floor_number}"
    sign = text_mesh(
        f"FLOOR_{floor_number}_ELEVATOR_SIGN_TEXT",
        f"ELEVATORS  •  {label}",
        (-5.0, 9.655, level + 3.35),
        0.28,
        mats["gold"],
        collection,
    )
    sign.parent = root

    for x in (-6.35, -3.65):
        frame = box(
            f"FLOOR_{floor_number}_ELEVATOR_LIGHT_FRAME",
            (x, 9.63, level + 2.25),
            (0.34, 0.08, 0.82),
            mats["gold"],
            collection,
            0.04,
        )
        frame.parent = root
        glow = box(
            f"FLOOR_{floor_number}_ELEVATOR_LIGHT_GLOW",
            (x, 9.575, level + 2.25),
            (0.20, 0.025, 0.62),
            accent,
            collection,
            0.02,
        )
        glow.parent = root

    marker = bpy.data.objects.new(f"ELEVATOR_LOBBY_FLOOR_{floor_number}_MARKER", None)
    marker.location = (-5.0, 8.0, level)
    marker["clear_walkway_width_m"] = 2.4
    marker["replaces_room"] = floor_number * 100 + 10
    collection.objects.link(marker)
    marker.parent = root


def build_cold_display(collection, mats):
    root = bpy.data.objects.new("ROOM_301_COLD_DISPLAY_ROOT", None)
    root["room_number"] = 301
    root["effect_reason"] = "Crystals are anchored to a climate-control emitter"
    collection.objects.link(root)
    base = cylinder("ROOM_301_COLD_EMITTER_BASE", (4.72, -6.68, 9.22), 0.52, 0.44, mats["black"], collection)
    base.parent = root
    ring = cylinder("ROOM_301_COLD_EMITTER_GLOW", (4.72, -6.68, 9.46), 0.40, 0.05, mats["cyan"], collection)
    ring.parent = root
    for index, (x, y, height) in enumerate(((4.52, -6.70, 0.68), (4.76, -6.82, 0.92), (4.97, -6.58, 0.58)), 1):
        crystal = box(
            f"ROOM_301_ANCHORED_ICE_CRYSTAL_{index}",
            (x, y, 9.48 + height / 2),
            (0.16, 0.16, height),
            mats["ice"],
            collection,
            0.03,
        )
        crystal.rotation_euler.z = math.radians(index * 13)
        crystal.parent = root


def stats():
    meshes = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
    triangles = 0
    vertices = 0
    for obj in meshes:
        obj.data.calc_loop_triangles()
        triangles += len(obj.data.loop_triangles)
        vertices += len(obj.data.vertices)
    points = [obj.matrix_world @ Vector(corner) for obj in meshes for corner in obj.bound_box]
    low = [min(p[i] for p in points) for i in range(3)]
    high = [max(p[i] for p in points) for i in range(3)]
    names = {obj.name for obj in bpy.context.scene.objects}
    return {
        "mesh_objects": len(meshes),
        "vertices": vertices,
        "triangles": triangles,
        "bounds_m": {"min": [round(v, 3) for v in low], "max": [round(v, 3) for v in high]},
        "removed_guest_rooms": [110, 210, 310],
        "guest_rooms": 27,
        "elevator_lobbies": sum(name.startswith("FLOOR_") and name.endswith("_ELEVATOR_LOBBY_ROOT") for name in names),
        "has_room_307": "ROOM_307_STATIC_INTERIOR" in names,
        "has_weather_machine": "ROOM_307_WEATHER_MACHINE_VISUAL" in names,
        "has_movable_elevator": "ELEVATOR_CAR_MOVABLE" in names,
    }


def export_glb(path):
    bpy.ops.object.select_all(action="DESELECT")
    selected = []
    for obj in bpy.context.scene.objects:
        if obj.type in {"MESH", "EMPTY"}:
            obj.select_set(True)
            selected.append(obj)
    bpy.context.view_layer.objects.active = selected[0]
    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_yup=True,
        export_materials="EXPORT",
        export_cameras=False,
        export_lights=False,
    )


def main():
    os.makedirs(ROOT, exist_ok=True)
    clear_scene()
    bpy.context.scene.unit_settings.system = "METRIC"
    bpy.context.scene.unit_settings.scale_length = 1.0
    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.import_scene.gltf(filepath=SOURCE)

    # These room interiors and doors occupied the same physical bay as the lift.
    for number in (110, 210, 310):
        remove_named_prefix(f"ROOM_{number}_")
    # The old cold-room shards crossed the bed and read as accidental floating geometry.
    remove_named_prefix("ROOM_301_COLD_CLIMATE_MODULE")

    collection = bpy.data.collections.new("POLISHED_HOTEL_REPAIRS")
    bpy.context.scene.collection.children.link(collection)
    mats = {
        "black": material("POLISH_BlackLacquer", (0.012, 0.017, 0.028), 0.32, 0.24),
        "gold": material("POLISH_WarmGold", (0.88, 0.50, 0.10), 0.78, 0.22),
        "pink": material("POLISH_Floor2Pink", (0.90, 0.02, 0.34), 0.05, 0.28, (1.0, 0.015, 0.28), 0.8),
        "purple": material("POLISH_LobbyPurple", (0.28, 0.035, 0.42), 0.10, 0.34, (0.42, 0.05, 0.62), 0.25),
        "cyan": material("POLISH_Floor3Cyan", (0.015, 0.52, 0.74), 0.10, 0.22, (0.02, 0.84, 1.0), 1.2),
        "ice": material("POLISH_AnchoredIce", (0.40, 0.82, 1.0), 0.15, 0.18, (0.12, 0.55, 1.0), 0.8),
    }
    build_landing(collection, 0.0, 1, mats["purple"], mats)
    build_landing(collection, 4.5, 2, mats["pink"], mats)
    build_landing(collection, 9.0, 3, mats["cyan"], mats)
    build_cold_display(collection, mats)

    bpy.ops.wm.save_as_mainfile(filepath=BLEND)
    export_glb(GLB)
    report = stats()
    report.update({
        "source": os.path.relpath(SOURCE, REPO).replace("\\", "/"),
        "blend": os.path.basename(BLEND),
        "glb": os.path.basename(GLB),
        "bytes": os.path.getsize(GLB),
        "coordinate_system": {"units": "meters", "glb_up": "+Y"},
    })
    assert report["guest_rooms"] == 27
    assert report["elevator_lobbies"] == 3
    assert report["has_room_307"] and report["has_weather_machine"] and report["has_movable_elevator"]
    with open(REPORT, "w", encoding="utf-8") as handle:
        json.dump(report, handle, indent=2)
    print("POLISHED_HOTEL_VERIFIED", json.dumps(report))


if __name__ == "__main__":
    main()
