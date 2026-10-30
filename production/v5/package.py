from pathlib import Path
import json,zipfile,hashlib
HERE=Path(__file__).resolve().parent
SRC=HERE.parents[1]/'山海行歌-双语精修版'
ZIP=HERE.parents[1]/'山海行歌-中英双语互动课件.zip'
CHECK=HERE/'离线解压验收'
files=sorted(p for p in SRC.rglob('*') if p.is_file() and p.name!='journey-app.js')
with zipfile.ZipFile(ZIP,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for p in files:z.write(p,p.relative_to(SRC).as_posix())
with zipfile.ZipFile(ZIP) as z:
 assert z.testzip() is None
 CHECK.mkdir(exist_ok=True)
 z.extractall(CHECK)
for p in files:
 assert hashlib.sha256(p.read_bytes()).digest()==hashlib.sha256((CHECK/p.relative_to(SRC)).read_bytes()).digest()
report={'files':len(files),'bytes':ZIP.stat().st_size,'sha256':hashlib.sha256(ZIP.read_bytes()).hexdigest(),'crc':'passed','extracted_files_sha256':'all matched','archive':str(ZIP),'extracted':str(CHECK)}
(HERE/'交付校验.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=False))
