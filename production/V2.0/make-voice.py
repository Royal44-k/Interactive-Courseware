import sys,asyncio,json,subprocess
from pathlib import Path
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'tools'/'voice-runtime'))
import edge_tts
OUT=HERE.parent.parent/'山海行歌-V2.0'/'assets'/'audio'
FF=HERE.parent/'tools'/'imageio_ffmpeg'/'binaries'/'ffmpeg-win-x86_64-v7.1.exe'
TEMP=HERE/'voice-parts';TEMP.mkdir(exist_ok=True)
jobs=json.loads((HERE/'voice-jobs.json').read_text(encoding='utf8'))
sem=asyncio.Semaphore(3)
durations={}
def run(args,data=None):
 return subprocess.run([str(FF),'-hide_banner','-loglevel','error',*args],input=data,stdout=subprocess.PIPE,check=True).stdout
async def one(job):
 async with sem:
  target=OUT/(job['name']+'.mp3')
  if not target.exists():
   chunks=[]
   for i,clause in enumerate(job['text'].split('|')):
    text=clause.strip()
    if job['lang']=='zh':
     for a,b in [('噫吁嚱','一，嘘，西'),('扪参','门深'),('仰胁息','仰谐息'),('抚膺','抚英'),('喧豗','喧灰'),('砯崖','乒崖'),('咨嗟','资街'),('斗十千','抖十千'),('早还家','早环家'),('号古木','豪古木')]:text=text.replace(a,b)
    part=TEMP/(job['name']+f'-{i}.mp3')
    if not part.exists():
     for retry in range(4):
      try:
       await edge_tts.Communicate(text,voice='en-GB-RyanNeural' if job['lang']=='en' else 'zh-CN-YunxiNeural',rate=('-17%' if job['lang']=='en' else '-22%') if job.get('cue') else '-15%',volume='+0%').save(str(part));break
      except Exception:
       if retry==3:raise
       await asyncio.sleep(retry+2)
    chunks.append(run(['-i',str(part),'-f','s16le','-ar','24000','-ac','1','pipe:1']))
   pcm=b'\0'*4800+(b'\0'*int(48000*.72)).join(chunks)+b'\0'*14400
   run(['-y','-f','s16le','-ar','24000','-ac','1','-i','pipe:0','-codec:a','libmp3lame','-b:a','96k',str(target)],pcm)
  raw=run(['-i',str(target),'-f','s16le','-ar','24000','-ac','1','pipe:1'])
  durations[job['name']]=round(len(raw)/48000,3)
  print('Saved '+job['name']+' '+str(durations[job['name']]),flush=True)
async def main():
 await asyncio.gather(*(one(j) for j in jobs))
 (OUT.parent.parent/'v2-voice-timing.js').write_text('window.V2_VOICE_TIMING='+json.dumps(durations)+';',encoding='utf8')
 (HERE/'voice-durations.json').write_text(json.dumps(durations,indent=2),encoding='utf8')
asyncio.run(main())
