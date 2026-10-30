from pathlib import Path
R=Path(__file__).resolve().parents[2]/'山海行歌-V2.0'
def edit(name,old,new):
 p=R/name;s=p.read_text(encoding='utf8');assert old in s,(name,old[:80]);p.write_text(s.replace(old,new),encoding='utf8')
edit('index.html','<script src="v2-content.js"></script>','<script src="v2-content.js"></script><script src="v2-narration.js"></script>')
edit('bilingual.js','I sit and sigh','I can only sigh')
edit('v2-content.js','I sit and sigh','I can only sigh')
edit('v2-content.js','const durations=[4,','const durations=[.8,')
edit('cinema.css','--action-progress:0%;','')
edit('cinema.css',".primary:before{content:'';position:absolute;bottom:0;left:0;width:var(--action-progress);height:2px;background:#e6d2a0;opacity:0}", '')
edit('cinema.css','.acting .primary:before{opacity:1}', '')
edit('audio.js',"state.musicVolume * (duck ? 0.22 : 1)","state.musicVolume * (duck ? 0.32 : 1)")
edit('audio.js','(now - began) / 260','(now - began) / (duck ? 420 : 950)')
edit('audio.js',"`${index===18?'v2-study':'stage'}-${index}","`${index===13?'v2r-study':index===18?'v2-study':'stage'}-${index}")
edit('audio.js','`poem-${index}',"`${index==='shu'&&state.voiceLang==='en'?'v2r-':''}poem-${index}")
edit('audio.js','`v2-cue-${index}','`${window.V2_VOICE_PREFIX}-cue-${index}')
edit('audio.js','`v2-intro-${index}','`${window.V2_VOICE_PREFIX}-intro-${index}')
edit('cinema.js',"  for(let k=0;k<cues.length;k++){const c=cues[k],next=cues[k+1]?.at??1;const length=window.V2_VOICE_TIMING?.[`v2-cue-${sceneIndex}-${c.key}${lang}`]||0;duration=Math.max(duration,(length+.65)/(next-c.at));}\n  return new Promise(resolve=>{tween={name,duration,hold,elapsed:0,update,resolve,cues,cueIndex:0};update(0);});", """  // Each spoken beat owns its own interval. A long reading must not stretch
  // every other gesture or leave a short line stranded in an empty interval.
  const voiced=window.CourseAudio?.getState().narration,base=duration,segments=[];
  let end=0;
  const points=[0,...cues.map(c=>c.at),1];
  for(let k=0;k<points.length-1;k++){
   const from=points[k],to=points[k+1],c=cues[k-1];
   const length=c&&voiced?(window.V2_VOICE_TIMING?.[`${window.V2_VOICE_PREFIX}-cue-${sceneIndex}-${c.key}${lang}`]||0):0;
   const natural=base*(to-from);
   const span=length?Math.max(natural*.72,length+.38):natural;
   segments.push({from,to,start:end,end:end+span});end+=span;
  }
  const scheduled=cues.map((c,k)=>({...c,start:segments[k+1].start}));
  duration=end;hold=Math.min(hold,.45);
  return new Promise(resolve=>{tween={name,duration,hold,elapsed:0,update,resolve,cues:scheduled,cueIndex:0,segments};update(0);});""")
edit('cinema.js',"if(tween){const a=tween,nextCue=a.cues[a.cueIndex],due=nextCue&&(a.elapsed+dt)/a.duration>=nextCue.at;", "if(tween){const a=tween,nextCue=a.cues[a.cueIndex],due=nextCue&&(a.elapsed+dt)>=nextCue.start;")
edit('cinema.js',"const p=clamp(a.elapsed/a.duration);stats.progress=p;a.update(p);asset('course').style.setProperty('--action-progress',`${p*100}%`);", """const part=a.segments.find(s=>a.elapsed<s.end)||a.segments.at(-1);
    const p=part?lerp(part.from,part.to,clamp((a.elapsed-part.start)/(part.end-part.start))):1;
    stats.progress=p;a.update(p);""")
edit('edition-app.js',"const x=s();audio().start();if(x.type==='ending')", "const x=s(),firstEntry=x.type==='cover'&&!audio().getState().started;audio().start();if(x.type==='ending')")
edit('edition-app.js',"const ok=await CinemaEngine.perform(x.motion);", "if(firstEntry){setBusy(true,'listening');await audio().playIntro(0);if(id!==serial)return false;setBusy(true,'acting');}\n  const ok=await CinemaEngine.perform(x.motion);")
edit('edition-app.js',"waitTime(state.actionDone?3.2:1.5,valid)","waitTime(state.actionDone?(state.index===15?1.25:.85):.65,valid)")
edit('edition-app.js',"await waitTime(4,valid)","await waitTime(1.8,valid)")
print('Updated narration routing, per-beat timing, music fades and button style.')
