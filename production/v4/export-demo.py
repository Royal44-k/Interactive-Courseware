from pathlib import Path
import subprocess,json,re
h=Path(__file__).resolve().parent;root=h.parents[1];app=root/'诗境重构版';ff=h.parent/'tools/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe'
def duration(p):
 r=subprocess.run([str(ff),'-hide_banner','-i',str(p)],stderr=subprocess.PIPE,stdout=subprocess.DEVNULL).stderr.decode('utf8','replace')
 m=re.search(r'Duration: (\d+):(\d+):(\d+\.\d+)',r);return int(m[1])*3600+int(m[2])*60+float(m[3])
video=h/'demo/demo.webm';total=duration(video);starts=json.loads((h/'demo/alignment.json').read_text())['starts'];ids=[2,4,7,10,11,15,22];trim=3.0;length=total-trim
args=[str(ff),'-hide_banner','-loglevel','error','-y','-i',str(video),'-stream_loop','-1','-i',str(app/'assets/audio/music.mp3')];filters=[f'[0:v]trim=start={trim},setpts=PTS-STARTPTS[v]',f'[1:a]atrim=duration={length},asetpts=PTS-STARTPTS,volume=0.065,afade=t=in:d=1,afade=t=out:st={length-1}:d=1[music]'];labels=['music'];rates=[];inputid=2
for j,i in enumerate(ids):
 p=app/'assets/audio'/f'stage-{i}.mp3';start=starts[str(i)];end=starts[str(ids[j+1])] if j+1<len(ids) else total;d=duration(p);available=end-start-.4;rate=max(1,d/available);delay=max(0,round((start-trim+.12)*1000));args+=['-i',str(p)];name=f'voice{i}';filters.append(f'[{inputid}:a]atempo={rate:.6f},volume=0.95,adelay={delay}:all=1[{name}]');inputid+=1;labels.append(name);rates.append({'scene':i,'videoStart':start-trim,'speechRate':rate,'duration':d})
for name,start,end in [('wind',starts['7'],starts['22']),('sea',starts['22'],total)]:
 args+=['-stream_loop','-1','-i',str(app/'assets/audio'/f'amb-{name}.mp3')];d=end-start;label='amb'+name;filters.append(f'[{inputid}:a]atrim=duration={d},asetpts=PTS-STARTPTS,volume=0.045,afade=t=in:d=0.8,afade=t=out:st={max(0,d-.8)}:d=0.8,adelay={round((start-trim)*1000)}:all=1[{label}]');inputid+=1;labels.append(label)
filters.append(''.join('['+n+']' for n in labels)+f'amix=inputs={len(labels)}:duration=longest:normalize=0,alimiter=limit=.95,atrim=duration={length}[a]')
out=root/'山海行歌-新增场景有声演示.mp4';args+=['-filter_complex',';'.join(filters),'-map','[v]','-map','[a]','-c:v','libx264','-crf','21','-preset','fast','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-movflags','+faststart','-t',str(length),str(out)]
subprocess.run(args,check=True);(h/'demo/export.json').write_text(json.dumps({'output':str(out),'duration':length,'rates':rates,'note':'视频动作未变速；同源旁白按录屏段落对齐，配乐与环境声重新混音。'},ensure_ascii=False,indent=2),encoding='utf8');print(out)
