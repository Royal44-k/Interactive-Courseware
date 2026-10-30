from pathlib import Path
import base64,json,hashlib,subprocess,array,math
H=Path(__file__).resolve().parent;R=H.parents[1]/'山海行歌-V3.0'
prior=H.parents[1]/'山海行歌-V2.0'
manifest=[{'file':str(p.relative_to(prior)),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in prior.rglob('*') if p.is_file()]
if not (H/'V2-files.json').exists():(H/'V2-files.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf8')
data={key:'data:image/png;base64,'+base64.b64encode((R/'assets'/name).read_bytes()).decode() for key,name in [('cloudMask','v3-cloud-mask.png'),('bird','v2-cuckoo.png')]}
(R/'assets'/'v3-textures.js').write_text('window.V3_PLATES='+json.dumps(data)+';',encoding='utf8')
ff=H.parent/'tools'/'imageio_ffmpeg'/'binaries'/'ffmpeg-win-x86_64-v7.1.exe'
raw=subprocess.run([str(ff),'-hide_banner','-loglevel','error','-i',str(R/'assets'/'audio'/'cuckoo.ogg'),'-af','highpass=f=1000,lowpass=f=1300','-f','s16le','-ar','8000','-ac','1','pipe:1'],stdout=subprocess.PIPE,check=True).stdout
pcm=array.array('h',raw);hop=160
env=[math.sqrt(sum(x*x for x in pcm[i:i+hop])/max(1,len(pcm[i:i+hop])))/32768 for i in range(0,len(pcm),hop)]
rank=sorted(env);floor=rank[int(len(rank)*.35)];peak=rank[int(len(rank)*.99)]
env=[round(max(0,min(1,(v-floor)/(peak-floor)))**.8,3) for v in env]
(R/'assets'/'cuckoo-envelope.js').write_text('window.CUCKOO_ENVELOPE='+json.dumps({'step':.02,'values':env})+';',encoding='utf8')
print('V2 manifest, offline textures and cuckoo call envelope saved.')
