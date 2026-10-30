from pathlib import Path
import subprocess, numpy as np, json, csv
from PIL import Image, ImageDraw, ImageFont
ROOT=Path(__file__).parent
FF=ROOT.parent/'tools/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe'
SOURCE=Path(r'C:\Users\lenovo\Videos\屏幕录制\屏幕录制 2026-10-28 095249.mp4')
out=ROOT/'reference';out.mkdir(exist_ok=True)
font=ImageFont.truetype('C:/Windows/Fonts/consola.ttf',14)
# Every source frame is decoded; samples below are only the visual contact sheets.
cmd=[str(FF),'-v','error','-i',str(SOURCE),'-vf','crop=1088:530:80:106,scale=384:188','-f','rawvideo','-pix_fmt','rgb24','-']
p=subprocess.Popen(cmd,stdout=subprocess.PIPE)
previous=None;rows=[];sheets={}
segments=[('01-gates',6,12.7),('02-dissolve-cup',12.5,18),('03-drop-sword-turn',17.8,22.2),('04-ice-snow',22,30.8),('05-fog-boat-sail',30.7,41.3),('06-space-open-close',45.8,52.4),('07-tools',52.3,103.7)]
index=0
while True:
 raw=p.stdout.read(384*188*3)
 if len(raw)!=384*188*3:break
 frame=np.frombuffer(raw,dtype=np.uint8).reshape(188,384,3)
 if previous is not None:
  d=np.abs(frame.astype(np.int16)-previous.astype(np.int16));rows.append({'frame':index,'seconds':round(index/30,5),'meanDelta':round(float(d.mean()),4),'sceneDelta':round(float(d[18:155,100:350].mean()),4),'foregroundDelta':round(float(d[85:178,20:370].mean()),4)})
 previous=frame.copy();t=index/30
 for label,a,b in segments:
  stride=6 if b-a<10 else 45
  if a<=t<=b and index%stride==0:
   im=Image.fromarray(frame.copy()).resize((384,188));tile=Image.new('RGB',(384,212),'#0c1720');tile.paste(im,(0,24));ImageDraw.Draw(tile).text((8,4),f'{t:06.3f}s  frame {index}',font=font,fill='#e7d8ad');sheets.setdefault(label,[]).append(tile)
 index+=1
p.wait()
with (out/'every-frame.csv').open('w',newline='',encoding='utf8') as f:
 w=csv.DictWriter(f,fieldnames=list(rows[0]));w.writeheader();w.writerows(rows)
for label,tiles in sheets.items():
 for page in range(0,len(tiles),24):
  selected=tiles[page:page+24];sheet=Image.new('RGB',(1536,212*((len(selected)+3)//4)),'#0c1720')
  for j,tile in enumerate(selected):sheet.paste(tile,((j%4)*384,(j//4)*212))
  sheet.save(out/f'{label}-{page//24+1}.jpg',quality=90)
(out/'metadata.json').write_text(json.dumps({'framesDecoded':index,'fps':30,'source':str(SOURCE),'sheets':{k:len(v) for k,v in sheets.items()},'largestSceneChanges':sorted(rows,key=lambda r:r['sceneDelta'],reverse=True)[:30]},ensure_ascii=False,indent=2),encoding='utf8')
print('Decoded',index,'frames;',len(rows),'adjacent-frame measurements')
