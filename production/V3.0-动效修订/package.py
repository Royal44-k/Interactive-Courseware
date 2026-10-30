from pathlib import Path
import json,hashlib,zipfile
HERE=Path(__file__).resolve().parent;BASE=HERE.parents[1];ROOT=BASE/'山海行歌-V3.0'
read=lambda p:json.loads(p.read_text(encoding='utf-8-sig'))
hash_file=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
scenes=read(HERE.parent/'V3.0'/'scene-manifest.json')
scene_images={x for s in scenes for x in [s.get('bg'),s.get('vista'),*(s.get('views') or [])] if x}
images=scene_images|{'cup-hand','sword-hand','hand-reach','lantern-hand','food-hand','empty-hand','sail-cloth','v2-knock-hand','stars-bg','v3-cloud-mask','v3-exam-gorge','v2-cuckoo'}
prior=read(HERE.parent/'V2.0-吟说修订'/'package-report.json')
voices={Path(p.replace('\\','/')).name for p in prior['assets'] if p.endswith(('.mp3','.ogg'))}
voices-= {'v2r-intro-23.mp3','v2r-intro-23-en.mp3'}
voices|={'v3-intro-23.mp3','v3-intro-23-en.mp3'}
def keep(p):
 r=p.relative_to(ROOT).as_posix()
 if r in {'journey-app.js','v2-clouds.js','preview.pid'}:return False
 if r.startswith('assets/audio/'):return p.name in voices
 if r.startswith('assets/') and p.suffix=='.png':return p.stem in images
 return True
files=[p for p in ROOT.rglob('*') if p.is_file() and keep(p)]
assert {p.name for p in files if p.parent.name=='audio'}==voices
assert len(voices)==176
assert all((ROOT/'assets'/(name+'.png')).exists() for name in images)
v1=read(HERE.parent/'V2.0'/'V1.0-sha256.json');v2=read(HERE.parent/'V3.0'/'V2-files.json')
for label,rows in [('V1.0',v1),('V2.0',v2)]:
 for row in rows:assert hash_file(BASE/('山海行歌-'+label)/row['file'])==row['sha256'],(label,row['file'])
assert hash_file(BASE/'山海行歌-V2.0.zip')==read(HERE.parent/'V3.0'/'V2-preserved.json')['Hash'].lower()
assert hash_file(BASE/'山海行歌-V1.0.zip')==hash_file(BASE/'山海行歌-中英双语互动课件.zip')
archive=BASE/'山海行歌-V3.0.zip'
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for p in files:z.write(p,Path('山海行歌-V3.0')/p.relative_to(ROOT))
with zipfile.ZipFile(archive) as z:
 assert z.testzip() is None
 extracted=HERE/'离线交付验收';extracted.mkdir(exist_ok=True);z.extractall(extracted)
for p in files:assert hash_file(p)==hash_file(extracted/'山海行歌-V3.0'/p.relative_to(ROOT))
manifest={'version':'3.0','revision':'2026-10-30 motion-r3','files':len(files),'bytes':archive.stat().st_size,'sha256':hash_file(archive),'sceneImages':len(scene_images),'audioFiles':len(voices),'newAudioTracks':2,'newImages':3,'V1PreservedFiles':len(v1),'V2PreservedFiles':len(v2),'V1ArchiveIdentical':True,'V2ArchiveIdentical':True,'V2ArchiveSha256':hash_file(BASE/'山海行歌-V2.0.zip'),'extracted':str(extracted/'山海行歌-V3.0'),'assets':[p.relative_to(ROOT).as_posix() for p in files if p.relative_to(ROOT).as_posix().startswith('assets')],'fileHashes':[{'file':p.relative_to(ROOT).as_posix(),'sha256':hash_file(p)} for p in files]}
(HERE/'package-report.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps({k:v for k,v in manifest.items() if k not in ['assets','fileHashes']},ensure_ascii=False))
