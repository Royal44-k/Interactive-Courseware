from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import json,re,subprocess
HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[1]/'山海行歌-V2.0'
FF=HERE.parent/'tools'/'imageio_ffmpeg'/'binaries'/'ffmpeg-win-x86_64-v7.1.exe'
jobs=json.loads((HERE/'voice-jobs.json').read_text(encoding='utf8'))
def scan(job):
 p=ROOT/'assets'/'audio'/(job['name']+'.mp3')
 r=subprocess.run([str(FF),'-hide_banner','-i',str(p),'-af','silencedetect=noise=-45dB:d=1.5','-f','null','-'],capture_output=True,text=True,encoding='utf8',errors='replace')
 return {'name':job['name'],'decodeOk':r.returncode==0,'silenceOver1_5s':[float(v) for v in re.findall(r'silence_duration: ([0-9.]+)',r.stderr)]}
with ThreadPoolExecutor(max_workers=2) as pool:result=list(pool.map(scan,jobs))
assert all(r['decodeOk'] for r in result)
(HERE/'audio-check.json').write_text(json.dumps(result,indent=2),encoding='utf8')
old=json.loads((HERE.parent/'V2.0'/'voice-durations.json').read_text(encoding='utf8'));new=json.loads((HERE/'voice-durations.json').read_text(encoding='utf8'))
stats={}
for lang in ['zh','en']:
 select=lambda k:('-en' in k)==(lang=='en') and ('intro-' in k or 'cue-' in k)
 stats[lang]={'previousSpokenSeconds':round(sum(v for k,v in old.items() if select(k)),2),'revisedSpokenSeconds':round(sum(v for k,v in new.items() if select(k)),2)}
print(json.dumps({'decoded':len(result),'longSilences':[r for r in result if r['silenceOver1_5s']],'timing':stats},ensure_ascii=False))
