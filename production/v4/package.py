from pathlib import Path
import json,shutil,zipfile,hashlib
h=Path(__file__).resolve().parent;root=h.parents[1];src=root/'诗境重构版';dst=root/'山海行歌';manifest=json.loads((h/'delivery-manifest.json').read_text(encoding='utf8'))
dst.mkdir(exist_ok=True)
for name in manifest['files']:
 target=dst/name;target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(src/name,target)
usage=(src/'使用说明.md').read_text(encoding='utf8');(dst/'开始使用.txt').write_text(usage,encoding='utf-8-sig')
target=root/'山海行歌-双诗沉浸互动课件.zip'
with zipfile.ZipFile(target,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for p in sorted(dst.rglob('*')):
  if p.is_file():z.write(p,p.relative_to(dst).as_posix())
with zipfile.ZipFile(target) as z:
 assert z.testzip() is None
 names=z.namelist();assert 'index.html' in names;assert all(n in names for n in manifest['files'])
 extracted=h/'交付解压检查';extracted.mkdir(exist_ok=True);z.extractall(extracted)
data={'zip':str(target),'folder':str(dst),'bytes':target.stat().st_size,'files':len(names),'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'crc':'passed','scenes':manifest['scenes'],'uniqueBackgrounds':len(manifest['backgrounds'])}
(h/'交付校验.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf8');print(json.dumps(data,ensure_ascii=False))
