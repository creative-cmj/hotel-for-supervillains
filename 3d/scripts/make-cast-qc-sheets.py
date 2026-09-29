from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT=Path(__file__).resolve().parents[2]
SOURCE=ROOT/'3d'/'character-qc'/'production-final'
OUT=ROOT/'assets'/'villain-roster'/'qa'
OUT.mkdir(parents=True,exist_ok=True)
font=ImageFont.truetype('C:/Windows/Fonts/arialbd.ttf',16)
title_font=ImageFont.truetype('C:/Windows/Fonts/arialbd.ttf',26)
files=sorted(SOURCE.glob('*-front.png'))
characters=[(path.name.removesuffix('-front.png'),path.name.split('-',1)[1].removesuffix('-front.png').replace('-',' ').title()) for path in files]

def sheet(view):
    canvas=Image.new('RGB',(1560,1050),'#100b17');draw=ImageDraw.Draw(canvas)
    draw.text((18,12),f'All 30 villains · {view.replace("-"," ").title()} inspection',font=title_font,fill='#fff3e8')
    for index,(slug,name) in enumerate(characters):
        image=Image.open(SOURCE/f'{slug}-{view}.png').convert('RGB')
        image=image.crop((220,112,min(1225,image.width),min(748,image.height)))
        image=ImageOps.fit(image,(260,180),method=Image.Resampling.LANCZOS)
        x=(index%6)*260;y=60+(index//6)*198
        canvas.paste(image,(x,y+18));draw.rectangle((x,y,x+260,y+18),fill='#20152a');draw.text((x+7,y+1),f'{index+1:02d} · {name}',font=font,fill='#ffd07a')
    canvas.save(OUT/f'all-30-{view}.png',optimize=True)

for view in ['front','front-three-quarter','back','face','hands','neutral-gray','silhouette']:
    sheet(view)
print(f'Wrote 7 cast QA sheets to {OUT}')
