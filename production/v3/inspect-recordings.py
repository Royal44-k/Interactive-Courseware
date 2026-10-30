from pathlib import Path
import subprocess,json,csv,numpy as np
from PIL import Image,ImageDraw,ImageFont
root=Path(__file__).parent
ff=root.parent/'tools/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe'
font=ImageFont.truetype('C:/Windows/Fonts/consola.ttf',14)
report={}
for name in ['视频复刻版','逐镜修订版']:
 folder=root/'continuity'/name;vid=folder/'continuity.webm'
 p=subprocess.Popen([str(ff),'-v','error','-i',str(vid),'-vf','fps=25,crop=1200:570:40:65,scale=384:182','-f','rawvideo','-pix_fmt','rgb24','-'],stdout=subprocess.PIPE)
 prev=None;rows=[];frames=[];i=0
 while True:
  raw=p.stdout.read(384*182*3)
  if len(raw)!=384*182*3:break
  im=np.frombuffer(raw,np.uint8).reshape(182,384,3).copy()
  if prev is not None and i>=150:
   d=np.abs(im.astype(np.int16)-prev.astype(np.int16))
   rows.append({'frame':i,'t':i/25,'meanChange':float(d.mean())})
  frames.append(im);prev=im;i+=1
 p.wait()
 with (folder/'visual-frame-delta.csv').open('w',encoding='utf8',newline='') as f:
  w=csv.DictWriter(f,fieldnames=['frame','t','meanChange']);w.writeheader();w.writerows(rows)
 peaks=sorted(rows,key=lambda x:x['meanChange'],reverse=True);chosen=[]
 for peak in peaks:
  if all(abs(peak['t']-x['t'])>.6 for x in chosen):chosen.append(peak)
  if len(chosen)>=4:break
 sheet=Image.new('RGB',(1536,212*len(chosen)),'#0a1820')
 for row,pk in enumerate(chosen):
  for col,off in enumerate([-2,-1,0,1]):
   n=max(0,min(len(frames)-1,pk['frame']+off));tile=Image.new('RGB',(384,212),'#0a1820');tile.paste(Image.fromarray(frames[n]),(0,30));ImageDraw.Draw(tile).text((8,5),f'{n/25:.3f}s  frame {n}',font=font,fill='#dfcfab');sheet.paste(tile,(col*384,row*212))
 sheet.save(folder/'largest-changes.jpg',quality=92)
 report[name]={'frames':i,'excludeFirstSeconds':6,'maxMeanPixelChange':max(r['meanChange'] for r in rows),'p95MeanPixelChange':float(np.percentile([r['meanChange'] for r in rows],95)),'largestWindows':chosen}
(root/'continuity/pixel-comparison.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps(report,ensure_ascii=True,indent=2))
