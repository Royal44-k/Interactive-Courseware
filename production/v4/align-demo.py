from pathlib import Path
import subprocess,numpy as np,json
from PIL import Image
here=Path(__file__).resolve().parent;encoder=here.parent/'tools/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe'
ids=[2,4,7,10,11,15,22];ref=[]
for i in ids:
 a=np.array(Image.open(here/'checks'/f'{i:02d}-before.png').convert('RGB').crop((80,210,600,350)).resize((260,70))).astype(float)
 colors=np.array([[242,238,224],[227,211,165]])
 mask=np.min(np.linalg.norm(a[:,:,None,:]-colors[None,None,:,:],axis=3),axis=2)<25
 ref.append(mask)
args=[str(encoder),'-hide_banner','-loglevel','error','-i',str(here/'demo/demo.webm'),'-vf','fps=5,crop=520:140:80:210,scale=260:70','-f','rawvideo','-pix_fmt','rgb24','-']
r=subprocess.run(args,stdout=subprocess.PIPE,check=True).stdout
frames=np.frombuffer(r,dtype=np.uint8).reshape(-1,70,260,3).astype(float)
records=[]
for k,a in enumerate(frames):
 match=np.min(np.linalg.norm(a[:,:,None,:]-colors[None,None,:,:],axis=3),axis=2)<42
 scores=[np.mean(match[m]) for m in ref];idx=int(np.argmax(scores));records.append({'t':k/5,'id':ids[idx] if scores[idx]>.52 else -1,'score':round(scores[idx],3)})
starts={}
for k,x in enumerate(records[:-3]):
 if x['id'] in ids and x['id'] not in starts and all(y['id']==x['id'] for y in records[k:k+3]):starts[x['id']]=x['t']
(here/'demo/alignment.json').write_text(json.dumps({'starts':starts,'records':records},indent=2),encoding='utf8')
print(starts)
