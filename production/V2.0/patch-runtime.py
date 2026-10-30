from pathlib import Path
R=Path(__file__).resolve().parents[2]/'山海行歌-V2.0'
def edit(name,fn):
 p=R/name;p.write_text(fn(p.read_text(encoding='utf8')),encoding='utf8')
def audio(s):
 s=s.replace("shanhai-course-audio-v5","shanhai-course-audio-v2")
 s=s.replace('let current = null;','let current = null, suspended = null;')
 s=s.replace('playing: Boolean(active),','playing: Boolean(active), pending: Boolean(current), effectActive,')
 s=s.replace('previous.audio.pause();','previous.audio.pause();\n      previous.finish?.(false);')
 s=s.replace('    clearEffect();\n    state.started = true;','    state.started = true;')
 s=s.replace('const session = { audio, name, kind, label, automatic, id: ++serial };','let finish;const done=new Promise(resolve=>{finish=resolve;});\n    const session = { audio, name, kind, label, automatic, id: ++serial, done, finish };\n    if(kind===\'stage\'||kind===\'poem\')audio.playbackRate=.9;')
 s=s.replace('      current = null;\n      adjustVolumes();','      current = null;session.finish(true);\n      adjustVolumes();')
 s=s.replace("if (state.paused) { emit(`${label}已就绪，继续后播放`); return Promise.resolve(false); }","if (state.paused) { emit(`${label}已就绪，继续后播放`); return done; }")
 s=s.replace('return attemptPlay(audio, fail);','attemptPlay(audio, fail);return done;')
 s=s.replace('  function bird() {','  function bird(cuckoo=false) {\n    effect.src=cuckoo?\'assets/audio/cuckoo.ogg\':\'assets/audio/bird.mp3\';')
 s=s.replace('`cue-${index}-${key}', '`v2-cue-${index}-${key}')
 s=s.replace('  window.CourseAudio = {','  function playIntro(index,force=false){if(!state.narration&&!force)return Promise.resolve(false);return beginVoice(`v2-intro-${index}${state.voiceLang===\'en\'?\'-en\':\'\'}`,\'intro\',\'入境吟声\',false,true);}\n  function suspendStory(){if(suspended)return;suspended=current;current=null;adjustVolumes();}\n  function resumeStory(){clearVoice();if(suspended){current=suspended;suspended=null;}if(!state.paused)resume();}\n  function waitVoice(){return current?.done||Promise.resolve(true);}\n  window.CourseAudio = { playIntro,waitVoice,suspendStory,resumeStory,cuckoo:()=>bird(true),')
 return s
edit('audio.js',audio)
def engine(s):
 s=s.replace('let push=0,','let lookProgress=0,knock=0,knockTap=0;\n let push=0,')
 s=s.replace("panel.querySelector('.water-layer').style.opacity=worldName==='stream'?String(vista):['waterfall','sea'].includes(worldName)?'1':'0';", "panel.querySelector('.water-layer').style.opacity=worldName==='stream'?String(vista):worldName==='waterfall'||(worldName==='sea'&&currentShot().bg==='dawn-sea')?'1':'0';\n  const look=panel.querySelector('.look-layer'),sequence=currentShot().views;\n  if(sequence){const frames=[currentShot().bg,...sequence],q=clamp(lookProgress)*(frames.length-1),k=Math.min(frames.length-2,Math.floor(q));v.style.backgroundImage=`url(\"assets/${frames[k]}.png\")`;v.style.opacity='1';look.style.backgroundImage=`url(\"assets/${frames[k+1]}.png\")`;look.style.opacity=String(ease(q-k));}else look.style.opacity='0';")
 s=s.replace('<div class="vista-layer"></div>', '<div class="vista-layer"></div><div class="look-layer"></div>')
 s=s.replace('s.bg,s.vista]', 's.bg,s.vista,...(s.views||[])]')
 s=s.replace("'empty-hand'])]", "'empty-hand','v2-knock-hand'])]")
 s=s.replace("pan=shot.pan?-1:0;", "pan=shot.pan?-1:0;lookProgress=knock=knockTap=0;")
 s=s.replace("clouds.visible=!['banquet'", "clouds.visible=i!==0&&!['banquet'")
 s=s.replace("gate.group.visible=name==='gate'||name==='pass'", "gate.group.visible=name==='gate'")
 # Per-scene schedules replace the old duplicated gesture descriptions.
 start=s.index('  let cueKey=');end=s.index('  const f=',start)
 s=s[:start]+"  const cue=()=>{};\n  if(sceneIndex===15)window.CourseAudio?.cuckoo();\n"+s[end:]
 start=s.index(' function animate(');end=s.index(' function perform(',start)
 s=s[:start]+''' function animate(name,duration,update,hold=.7){
  cancel();stats.action=name;stats.progress=0;
  const shot=currentShot(),cues=shot.cues||[],lang=window.CourseAudio?.getState().voiceLang==='en'?'-en':'';
  duration=Math.max(duration,shot.baseDuration||0);
  for(let k=0;k<cues.length;k++){const c=cues[k],next=cues[k+1]?.at??1;const length=window.V2_VOICE_TIMING?.[`v2-cue-${sceneIndex}-${c.key}${lang}`]||0;duration=Math.max(duration,(length+.65)/(next-c.at));}
  return new Promise(resolve=>{tween={name,duration,hold,elapsed:0,update,resolve,cues,cueIndex:0};update(0);});
 }
''' +s[end:]
 # New wide-angle shot sequences use discrete unique plates, not a tiny zoom.
 before="  if(action==='survey')"
 addition='''  if(action==='four-views')return animate(action,25,p=>{
   lookProgress=phase(p,0,.95);const points=[[0,2.7],[-7,2.8],[-1,12],[7,4],[0,-5]],q=lookProgress*4,k=Math.min(3,Math.floor(q)),e=ease(q-k);view.tx=lerp(points[k][0],points[k+1][0],e);view.ty=lerp(points[k][1],points[k+1][1],e);shotZoom=1+.015*Math.sin(p*Math.PI);
  },1.4);
  if(action==='sun-river')return animate(action,20,p=>{vista=phase(p,.43,.76);view.ty=lerp(10,-4,phase(p,.40,.84));},1.5);
  if(action==='fortress'){
   let tapped=-1;return animate(action,23,p=>{lookProgress=.5*phase(p,.10,.34)+.5*phase(p,.39,.62);knock=pulse(p,.62,.70,.88,.98);knockTap=0;
    for(let i=0;i<3;i++){const a=.72+i*.055;knockTap+=pulse(p,a,a+.012,a+.022,a+.044);if(p>=a+.016&&tapped<i){tapped=i;sound('impact');}}
    view.tx=lerp(0,1.8,pulse(p,.10,.30,.42,.62));shotZoom=1+.018*phase(p,.62,.9);
   },1.4);
  }
'''
 s=s.replace(before,addition+before)
 s=s.replace("vista=phase(p,.18,.83);sword", "vista=phase(p,sceneIndex===15?.42:.18,sceneIndex===15?.92:.83);sword")
 s=s.replace('sail=ease(p);daylight=1;', 'sail=phase(p,.45,.88);daylight=1;')
 # New hand approaches a separate military door; it never pushes the palace door.
 s=s.replace("  const breath=reduced?0:", "  const kh=asset('knockHand');kh.style.opacity=String(ease(knock/.1));kh.style.transform=`translate3d(${(1-knock)*20-knockTap*1.3}%,${(1-knock)*105-knockTap*2.2}%,0) rotate(${-knockTap*2.5}deg) scale(${1-knockTap*.018})`;\n  const breath=reduced?0:")
 old="   if(tween){const a=tween;a.elapsed+=dt;const p=clamp(a.elapsed/a.duration);stats.progress=p;a.update(p);asset('course').style.setProperty('--action-progress',`${p*100}%`);if(a.elapsed>=a.duration+a.hold){tween=null;stats.completed++;stats.action='';stats.progress=0;a.resolve(true);}}"
 new="""   if(tween){const a=tween,nextCue=a.cues[a.cueIndex],due=nextCue&&(a.elapsed+dt)/a.duration>=nextCue.at;
    const blocked=due&&window.CourseAudio?.getState().pending;
    if(!blocked){a.elapsed+=dt;if(due){a.cueIndex++;window.dispatchEvent(new CustomEvent('cinema-cue',{detail:{...nextCue,zh:nextCue.zh.replaceAll('|',''),en:nextCue.en.replaceAll('|',''),scene:sceneIndex}}));}}
    const p=clamp(a.elapsed/a.duration);stats.progress=p;a.update(p);asset('course').style.setProperty('--action-progress',`${p*100}%`);
    if(a.elapsed>=a.duration+a.hold&&!window.CourseAudio?.getState().pending){tween=null;stats.completed++;stats.action='';stats.progress=0;a.resolve(true);}
   }"""
 assert old in s;s=s.replace(old,new)
 s=s.replace('view:{...view},push,','view:{...view},lookProgress,knock,knockTap,push,')
 return s
edit('cinema.js',engine)
def index(s):
 s=s.replace('山海行歌 · 中英双语诗境','山海行歌 V2.0 · 中英双语诗境')
 s=s.replace('<link rel="stylesheet" href="edition.css">','<link rel="stylesheet" href="edition.css"><link rel="stylesheet" href="v2.css">')
 s=s.replace('<img id="cupHand"','<img id="knockHand" src="assets/v2-knock-hand.png" alt=""><img id="cupHand"')
 s=s.replace('</header>','<button id="fullscreenButton" class="fullscreen-button" data-action="fullscreen" aria-label="展开全屏" title="展开全屏"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/></svg></button></header>')
 s=s.replace('<span id="sceneGuide"></span>', '<span id="sceneGuide"></span><button id="autoControl" data-action="auto-stop" hidden>转为手动</button>')
 s=s.replace('<script src="effects.js">','<script src="v2-content.js"></script><script src="v2-voice-timing.js"></script><script src="effects.js">')
 s=s.replace('<script src="edition-app.js">','<script src="assets/cover-texture.js"></script><script src="v2-clouds.js"></script><script src="edition-app.js">')
 return s
edit('index.html',index)
print('Patched audio, engine and entry point')
