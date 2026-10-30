from pathlib import Path
import json,hashlib,zipfile
HERE=Path(__file__).resolve().parent;BASE=HERE.parents[1];ROOT=BASE/'山海行歌-V2.0'
scenes=json.loads((HERE.parent/'V2.0'/'scene-manifest.json').read_text(encoding='utf8'))
images={x for s in scenes for x in [s.get('bg'),s.get('vista'),*(s.get('views') or [])] if x}
images.update(['cup-hand','sword-hand','hand-reach','lantern-hand','food-hand','empty-hand','sail-cloth','v2-knock-hand'])
voices={j['name']+'.mp3' for j in json.loads((HERE/'voice-jobs.json').read_text(encoding='utf8'))}
voices.update(['music.mp3','bird.mp3','cuckoo.ogg','amb-wind.mp3','amb-sea.mp3','amb-river.mp3','v2-study-18.mp3','v2-study-18-en.mp3','poem-xing.mp3','poem-xing-en.mp3','poem-shu.mp3'])
voices.update(f'stage-{i}{lang}.mp3' for i in range(24) if i not in [13,18] for lang in ['', '-en'])
def keep(p):
 r=p.relative_to(ROOT).as_posix()
 if r=='journey-app.js':return False
 if r.startswith('assets/audio/'):return p.name in voices
 if r.startswith('assets/') and p.suffix=='.png':return p.stem in images
 return True
timing=ROOT/'v2-voice-timing.js';d=json.loads(timing.read_text(encoding='utf8').split('=',1)[1].rstrip(';\n'))
timing.write_text('window.V2_VOICE_TIMING='+json.dumps({k:v for k,v in d.items() if k+'.mp3' in voices})+';',encoding='utf8')
files=[p for p in ROOT.rglob('*') if p.is_file() and keep(p)]
assert {p.name for p in files if p.parent.name=='audio'}==voices
hash_file=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
v1=json.loads((HERE.parent/'V2.0'/'V1.0-sha256.json').read_text(encoding='utf8'))
for row in v1:assert hash_file(BASE/'山海行歌-V1.0'/row['file'])==row['sha256'],row['file']
assert hash_file(BASE/'山海行歌-V1.0.zip')==hash_file(BASE/'山海行歌-中英双语互动课件.zip')
archive=BASE/'山海行歌-V2.0.zip'
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for p in files:z.write(p,Path('山海行歌-V2.0')/p.relative_to(ROOT))
with zipfile.ZipFile(archive) as z:
 assert z.testzip() is None
 extracted=HERE/'离线交付验收';extracted.mkdir(exist_ok=True);z.extractall(extracted)
for p in files:assert hash_file(p)==hash_file(extracted/'山海行歌-V2.0'/p.relative_to(ROOT))
manifest={'version':'2.0','revision':'2026-10-30 narration','files':len(files),'bytes':archive.stat().st_size,'sha256':hash_file(archive),'sceneImages':len(images)-8,'audioFiles':len(voices),'updatedTracks':121,'V1PreservedFiles':len(v1),'V1ArchiveIdentical':True,'previousV2ArchiveSha256':hash_file(HERE/'山海行歌-V2.0-修订前留档.zip'),'extracted':str(extracted/'山海行歌-V2.0'),'assets':[str(p.relative_to(ROOT)) for p in files if str(p.relative_to(ROOT)).startswith('assets')]}
(HERE/'package-report.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps({k:v for k,v in manifest.items() if k!='assets'},ensure_ascii=False))
