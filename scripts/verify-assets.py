from pathlib import Path
import hashlib,json,sys
root=Path(__file__).resolve().parents[1]
manifest=json.loads((root/'catalog/asset-manifest.json').read_text(encoding='utf8'))
checked=set();errors=[]
for row in manifest['rows']:
 if row['kind'] not in ['file','duplicate'] or row['target'] in checked:continue
 checked.add(row['target']);p=root/row['target']
 if not p.is_file() or hashlib.sha256(p.read_bytes()).hexdigest()!=row['sha256']:errors.append(row['target'])
print(json.dumps({'checked':len(checked),'errors':errors},ensure_ascii=False,indent=2))
raise SystemExit(bool(errors))
