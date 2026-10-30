from pathlib import Path
import json
import numpy as np
from PIL import Image
H=Path(__file__).resolve().parent/'checks'
result={}
for prefix in ['cloud-verified','fish-raw']:
 a=np.array(Image.open(H/(prefix+'-a.png')).convert('RGBA')).astype(float);b=np.array(Image.open(H/(prefix+'-b.png')).convert('RGBA')).astype(float)
 assert a.shape==b.shape
 d=np.abs(a-b);height,width=a.shape[:2]
 row={'size':[width,height],'meanDifference':float(d.mean()),'changedFraction':float((d.max(axis=2)>1).mean())}
 if prefix=='cloud-verified':
  rock=d[int(height*.35):int(height*.50),int(width*.05):int(width*.15)]
  cloud=d[int(height*.55):int(height*.62),int(width*.75):int(width*.81)]
  row.update(rockDifference=float(rock.mean()),cloudDifference=float(cloud.mean()))
 result[prefix]=row
 if prefix=='fish-raw':
  samples=[]
  for t in np.linspace(.12,.85,60):
   x=int((.566-.028*t)*width);y=int((.166+.233*t)*height)
   samples.append(d[y-1:y+2,x-1:x+2].mean())
  row['protectedLineDifference']=float(np.mean(samples))
  assert row['protectedLineDifference']<.1,row
  assert row['meanDifference']>.2,row
 else:
  assert row['rockDifference']==0 and row['cloudDifference']>.2,row
(H/'pixel-report.json').write_text(json.dumps(result,indent=2),encoding='utf8')
print(json.dumps(result))
