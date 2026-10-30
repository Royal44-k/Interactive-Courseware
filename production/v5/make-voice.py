import sys,asyncio,json
from pathlib import Path
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'tools'/'voice-runtime'))
import edge_tts
OUT=HERE.parent.parent/'山海行歌-双语精修版'/'assets'/'audio'
jobs=json.loads((HERE/'voice-jobs.json').read_text(encoding='utf8'))
sem=asyncio.Semaphore(3)
async def one(job):
 async with sem:
  target=OUT/(job['name']+'.mp3')
  if target.exists() and target.stat().st_size>1500 and job['lang']=='en':return
  text=job['text']
  if job['lang']=='zh':
   for a,b in [('扪参','门深'),('仰胁息','仰谐息'),('抚膺','抚英'),('金樽清酒斗十千','金樽清酒，抖十千')]:text=text.replace(a,b)
  for retry in range(4):
   try:
    await edge_tts.Communicate(text,voice='en-GB-RyanNeural' if job['lang']=='en' else 'zh-CN-YunxiNeural',rate=('+4%' if job.get('cue') else '-8%'),volume='+0%').save(str(target))
    print('Saved '+job['name'],flush=True);return
   except Exception as e:
    if retry==3:raise
    await asyncio.sleep(1+retry)
async def main():await asyncio.gather(*(one(j) for j in jobs))
asyncio.run(main())
