from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parents[2]
QC = ROOT / "3d" / "character-qc"
OUT = ROOT / "assets" / "villain-redesign-qc"
OUT.mkdir(parents=True, exist_ok=True)

CHARACTERS = [
    ("09-mister-monday", "Mister Monday", "preview-redesign-mister-monday-hotel.png"),
    ("10-the-landlord", "The Landlord", "preview-redesign-landlord-hotel.png"),
    ("13-the-auditor", "The Auditor", "preview-redesign-auditor-hotel.png"),
    ("20-doctor-oops", "Doctor Oops", "preview-redesign-doctor-oops-hotel.png"),
    ("29-agent-awkward", "Agent Awkward", "preview-redesign-agent-awkward-hotel.png"),
]

FONT_PATH = Path("C:/Windows/Fonts/arialbd.ttf")
font = ImageFont.truetype(str(FONT_PATH), 24)
small = ImageFont.truetype(str(FONT_PATH), 19)


def tile(path: Path, label: str, size=(460, 300), hotel=False):
    image = Image.open(path).convert("RGB")
    if hotel:
        image = image.crop((0, 0, min(1320, image.width), image.height))
    else:
        image = image.crop((0, 112, min(1225, image.width), min(748, image.height)))
    image = ImageOps.fit(image, (size[0], size[1] - 36), method=Image.Resampling.LANCZOS)
    result = Image.new("RGB", size, "#18101f")
    result.paste(image, (0, 36))
    draw = ImageDraw.Draw(result)
    draw.text((12, 5), label, fill="#ffd07a", font=small)
    return result


for slug, name, hotel_file in CHARACTERS:
    sources = [
        (QC / "before" / f"{slug}-front.png", "BEFORE · FRONT", False),
        (QC / "after-final" / f"{slug}-front.png", "AFTER · FRONT", False),
        (QC / "after-final" / f"{slug}-right.png", "AFTER · RIGHT", False),
        (QC / "after-final" / f"{slug}-back.png", "AFTER · BACK", False),
        (QC / "after-final" / f"{slug}-left.png", "AFTER · LEFT", False),
        (QC / "after-final" / f"{slug}-face.png", "FACE CLOSE-UP", False),
        (QC / "after-final" / f"{slug}-hands.png", "HANDS CLOSE-UP", False),
        (QC / "after-final" / f"{slug}-silhouette.png", "BLACK SILHOUETTE", False),
        (ROOT / "3d" / hotel_file, "IN THE HOTEL", True),
    ]
    sheet = Image.new("RGB", (1380, 950), "#100b17")
    draw = ImageDraw.Draw(sheet)
    draw.text((24, 12), f"{name} · redesign inspection", fill="#fff3e8", font=font)
    for index, source in enumerate(sources):
        item = tile(source[0], source[1], hotel=source[2])
        sheet.paste(item, ((index % 3) * 460, 50 + (index // 3) * 300))
    sheet.save(OUT / f"{slug}-comparison.png", optimize=True)

overview = Image.new("RGB", (1500, 700), "#100b17")
draw = ImageDraw.Draw(overview)
draw.text((24, 12), "First five villain redesigns · before / after", fill="#fff3e8", font=font)
for index, (slug, name, _) in enumerate(CHARACTERS):
    before = tile(QC / "before" / f"{slug}-front.png", f"BEFORE · {name}", (300, 320))
    after = tile(QC / "after-final" / f"{slug}-front.png", f"AFTER · {name}", (300, 320))
    overview.paste(before, (index * 300, 50))
    overview.paste(after, (index * 300, 370))
overview.save(OUT / "first-five-overview.png", optimize=True)

print(f"Wrote {len(CHARACTERS) + 1} QA sheets to {OUT}")
