import sys,asyncio,json,subprocess,hashlib,re
from pathlib import Path
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'tools'/'voice-runtime'))
import edge_tts
ROOT=HERE.parents[1]/'山海行歌-V3.0';OUT=ROOT/'assets'/'audio'
FF=HERE.parent/'tools'/'imageio_ffmpeg'/'binaries'/'ffmpeg-win-x86_64-v7.1.exe'
TEMP=HERE/'voice-parts';TEMP.mkdir(exist_ok=True)
jobs=json.loads((HERE/'voice-jobs.json').read_text(encoding='utf8'))
sem=asyncio.Semaphore(3);durations={};completed=0
def run(args,data=None):
 return subprocess.run([str(FF),'-hide_banner','-loglevel','error',*args],input=data,stdout=subprocess.PIPE,check=True).stdout
async def one(job):
 global completed
 async with sem:
  target=OUT/(job['name']+'.mp3')
  if not target.exists():
   chunks=[]
   for part_index,part in enumerate(job['parts']):
    clauses=[s.strip() for s in re.split(r'[|\n]',part['text']) if s.strip()]
    for i,text in enumerate(clauses):
     if job['lang']=='zh':
      for a,b in [('噫吁嚱','一，嘘，西'),('扪参','门深'),('参、井','深、井'),('仰胁息','仰谐息'),('抚膺','抚英'),('喧豗','喧灰'),('砯崖','乒崖'),('咨嗟','资街'),('斗十千','抖十千'),('早还家','早环家'),('号古木','豪古木')]:text=text.replace(a,b)
     verse=part['style']=='verse';rate=('-15%' if verse else '-9%') if job['lang']=='en' else ('-19%' if verse else '-12%')
     digest=hashlib.sha256((text+rate).encode()).hexdigest()[:10]
     source=TEMP/f"{job['name']}-{part_index}-{i}-{digest}.mp3"
     if not source.exists():
      for retry in range(5):
       try:
        await edge_tts.Communicate(text,voice='en-GB-RyanNeural' if job['lang']=='en' else 'zh-CN-YunxiNeural',rate=rate).save(str(source));break
       except Exception:
        if retry==4:raise
        await asyncio.sleep(2+retry*2)
     pcm=run(['-i',str(source),'-af','silenceremove=start_periods=1:start_duration=0.03:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_duration=0.03:start_threshold=-50dB,areverse','-f','s16le','-ar','24000','-ac','1','pipe:1'])
     if chunks:chunks.append(b'\0'*int(48000*(.54 if i==0 and part_index else .44)))
     chunks.append(pcm)
   pcm=b'\0'*5760+b''.join(chunks)+b'\0'*10560
   run(['-y','-f','s16le','-ar','24000','-ac','1','-i','pipe:0','-af','loudnorm=I=-18:TP=-1.5:LRA=8','-ar','24000','-codec:a','libmp3lame','-b:a','96k',str(target)],pcm)
  raw=run(['-i',str(target),'-f','s16le','-ar','24000','-ac','1','pipe:1'])
  durations[job['name']]=round(len(raw)/48000,3);completed+=1
  print(f"{completed}/{len(jobs)} {job['name']} {durations[job['name']]}s",flush=True)
async def main():
 await asyncio.gather(*(one(j) for j in jobs))
 old=json.loads((ROOT/'v2-voice-timing.js').read_text(encoding='utf8').split('=',1)[1].rstrip(';\n'))
 old.update(durations)
 (ROOT/'v2-voice-timing.js').write_text('window.V2_VOICE_TIMING='+json.dumps(old)+';',encoding='utf8')
 (HERE/'voice-durations.json').write_text(json.dumps(durations,indent=2),encoding='utf8')
 print('VOICE BUILD COMPLETE',flush=True)
asyncio.run(main())

