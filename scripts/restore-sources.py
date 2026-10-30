"""Reconstruct original logical folders from deduplicated files and downloaded release assets."""
from pathlib import Path
import argparse,json,shutil,hashlib
p=argparse.ArgumentParser();p.add_argument('--output',default='restored-sources');p.add_argument('--release-dir',default='downloaded-release-assets');args=p.parse_args()
root=Path(__file__).resolve().parents[1];out=Path(args.output).resolve();releases=Path(args.release_dir).resolve()
if out==root or root in out.parents and out.name not in ['restored-sources']:raise SystemExit('Choose a separate output folder or the default restored-sources folder.')
m=json.loads((root/'catalog/asset-manifest.json').read_text(encoding='utf8'));missing=[];restored=0
for r in m['rows']:
 src=(releases if r['kind'].startswith('release') else root)/r['target'];dst=out/r['source']
 if not src.is_file():missing.append(r['source']);continue
 if hashlib.sha256(src.read_bytes()).hexdigest()!=r['sha256']:raise SystemExit('Checksum mismatch: '+r['source'])
 if dst.exists() and hashlib.sha256(dst.read_bytes()).hexdigest()!=r['sha256']:raise SystemExit('Will not overwrite differing file: '+str(dst))
 dst.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(src,dst);restored+=1
print(json.dumps({'restored':restored,'missingReleaseAssets':missing,'excludedDependencies':len(m['excluded'])},ensure_ascii=False,indent=2))
