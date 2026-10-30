from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import hashlib, json, datetime

base = Path(__file__).resolve().parent.parent
source = base / '课件'
archive = base / '蜀道难互动课件.zip'
extracted = base / '制作记录' / ('解压验收-' + datetime.datetime.now().strftime('%Y%m%d-%H%M%S'))
files = sorted(p for p in source.rglob('*') if p.is_file())
assert (source / 'index.html').is_file()
with ZipFile(archive, 'w', ZIP_DEFLATED, compresslevel=6) as z:
    for p in files:
        z.write(p, p.relative_to(source).as_posix())
with ZipFile(archive) as z:
    assert 'index.html' in z.namelist()
    assert all(not n.startswith(('/', '..')) for n in z.namelist())
    z.extractall(extracted)
hashes = []
for p in files:
    rel = p.relative_to(source)
    digest = hashlib.sha256(p.read_bytes()).hexdigest()
    assert hashlib.sha256((extracted / rel).read_bytes()).hexdigest() == digest
    hashes.append({'file': rel.as_posix(), 'bytes': p.stat().st_size, 'sha256': digest})
report = {'archive': str(archive), 'archive_bytes': archive.stat().st_size, 'entry': str(extracted / 'index.html'), 'file_count': len(files), 'all_extracted_hashes_match': True, 'files': hashes}
(base / '制作记录' / '最终打包校验.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps({k: v for k, v in report.items() if k != 'files'}, ensure_ascii=False))
