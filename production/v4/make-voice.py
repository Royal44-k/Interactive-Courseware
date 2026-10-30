import sys,asyncio,json
from pathlib import Path
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'tools'/'voice-runtime'))
import edge_tts
OUT=HERE.parent.parent/'诗境重构版'/'assets'/'audio'
jobs=json.loads((HERE/'voice-jobs.json').read_text(encoding='utf8'))
sem=asyncio.Semaphore(2)
async def one(job):
 async with sem:
  text=job['text']
  # Polyphonic characters are disambiguated only in speech input, never on-screen.
  for a,b in [('噫吁嚱','一，嘘，西'),('扪参','门深'),('仰胁息','仰谐息'),('抚膺','抚英'),('喧豗','喧灰'),('砯崖','乒崖'),('咨嗟','资街'),('金樽清酒斗十千','金樽清酒，抖十千'),('早还家','早环家'),('悲鸟号古木','悲鸟豪古木')]:text=text.replace(a,b)
  for retry in range(3):
   try:
    await edge_tts.Communicate(text,voice='zh-CN-YunxiNeural',rate='-14%',volume='+0%').save(str(OUT/(job['name']+'.mp3')))
    print('Saved '+job['name'],flush=True);return
   except Exception as e:
    if retry==2:raise
    await asyncio.sleep(1)
async def main():await asyncio.gather(*(one(j) for j in jobs))
asyncio.run(main())
