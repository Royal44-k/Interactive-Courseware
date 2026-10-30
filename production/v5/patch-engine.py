from pathlib import Path
p=Path(__file__).resolve().parents[2]/'山海行歌-双语精修版'
f=p/'cinema.js'
s=f.read_text(encoding='utf-8')
s=s.replace("let cup=0,sword=0,chop=0,sail=0", "let push=0,food=0,foodNear=0,foodEaten=0,swallow=0,cupNear=0,armSweep=0,swordHigh=0,fade=0,sceneAge=0,pan=0;\n let cup=0,sword=0,chop=0,sail=0")
s=s.replace("return `scale(${1.12*shotZoom}) translate(${-pointer.sx*.32+x}%,${pointer.sy*.18+y}%)`;", "const sweep=currentShot().pan?pan:0;\n  return `scale(${(currentShot().pan?1.32:1.12)*shotZoom}) translate(${-pointer.sx*.32+x+sweep*7.2}%,${pointer.sy*.18+y+swallow*.35}%)`;")
s=s.replace("asset('nightShade').style.opacity=String(nightShade);", "asset('nightShade').style.opacity=String(nightShade);\n  asset('motionShade').style.opacity=String(fade);\n  asset('breathShade').style.opacity=String(Math.abs(swallow)*.19);")
s=s.replace("'sail-cloth','stars-bg'", "'sail-cloth','stars-bg','food-hand','empty-hand'")
s=s.replace("const shot=COURSE_STORY[i];window.dropSoundPlayed=false;", "const shot=COURSE_STORY[i];window.dropSoundPlayed=false;push=food=foodNear=foodEaten=swallow=cupNear=armSweep=swordHigh=0;sceneAge=0;pan=shot.pan?-1:0;")
s=s.replace("chop=i>=4&&i<=5?1:0;", "chop=0;")
s=s.replace("asset('outgoingForeground').replaceChildren(...copies);", "copies.forEach(el=>{el.style.transition='none';});asset('outgoingForeground').replaceChildren(...copies);")
s=s.replace("oldWorldName=worldName;", "oldWorldName=worldName,oldFade=fade;")
s=s.replace("oldLamp,oldWorldName};", "oldLamp,oldWorldName,oldFade};")
s=s.replace("const f={...view},h=hand", "let cueKey='';const cue=(key,zh,en)=>{if(key===cueKey)return;cueKey=key;window.dispatchEvent(new CustomEvent('cinema-cue',{detail:{zh,en}}));};\n  const f={...view},h=hand")
a=s.index("  if(action==='open-gate'){")
b=s.index("  if(action==='look-up')",a)
s=s[:a]+'''  if(action==='open-gate'){
   sound('wood');const left=gate.left.rotation.y,right=gate.right.rotation.y;
   return animate(action,4.8,p=>{push=pulse(p,0,.23,.68,1);hand=0;armSweep=phase(p,.24,.76);const opening=phase(p,.25,.82);gate.left.rotation.y=lerp(left,-1.48,opening);gate.right.rotation.y=lerp(right,1.48,opening);cameraTo({z:-2.2},phase(p,.48,1));bob=reduced?0:Math.sin(p*Math.PI*4)*.012*pulse(p,.5,.6,.85,1);cue(p<.25?'touch':'open',p<.25?'双手抵门，灯影初开。':'缓缓推开，入席听心。',p<.25?'Both hands meet the doors.':'Push gently; enter the light.');},.35);
  }
''' +s[b:]
a=s.index("  if(action==='walk'){")
b=s.index("  if(['turn-vista'",a)
s=s[:a]+'''  if(action==='walk'){
   walks++;sound('step');return animate(action,4.8,p=>{vista=phase(p,.19,.69);shotZoom=1+.018*Math.sin(p*Math.PI);pan=lerp(-1,.65,ease(p));bob=reduced?0:Math.sin(p*Math.PI*6)*.018*Math.sin(p*Math.PI)**2;},.7);
  }
  if(action==='cup')return animate(action,16,p=>{
   cup=pulse(p,.015,.105,.255,.335);cupNear=pulse(p,.11,.18,.215,.285);
   food=pulse(p,.365,.49,.875,.98);foodNear=pulse(p,.51,.675,.745,.875);foodEaten=phase(p,.682,.70);
   swallow=reduced?0:Math.sin(phase(p,.70,.79)*Math.PI*2)*pulse(p,.70,.72,.77,.79);
   if(p<.34)cue('cup','举樽浅酌，轻轻放下。','Raise the cup, sip, and lower it gently.');
   else if(p<.67)cue('taste','取一箸珍馐，缓缓送近。','Lift a morsel and bring it closer.');
   else if(p<.80)cue('swallow','浅尝，咽下；心事仍未散。','A taste, a swallow; the heart remains restless.');
   else cue('lower','空箸退回，轻落案边。','The empty chopsticks withdraw and settle.');
  },.4);
  if(action==='drop')return animate(action,6.5,p=>{
   cup=0;food=pulse(p,.03,.28,.65,.93);foodNear=.12*pulse(p,.15,.38,.53,.68);foodEaten=0;chop=phase(p,.76,.94);
   if(p>.82&&!window.dropSoundPlayed){window.dropSoundPlayed=true;sound('wood');}
   cue(p<.54?'hesitate':'stop',p<.54?'欲食又止，箸停半途。':'投箸落案，不能食。',p<.54?'The hand hesitates, short of the mouth.':'Chopsticks fall. I cannot eat.');
  },.65);
  if(action==='sword'){
   sound('steel');food=cup=0;return animate(action,10.8,p=>{sword=phase(p,.035,.28);swordHigh=phase(p,.48,.73);cameraTo({tx:-5},pulse(p,.2,.36,.47,.64));view.tx+=4.8*pulse(p,.5,.66,.76,.89);fade=phase(p,.87,1);cue(p<.3?'draw':p<.75?'gaze':'dark',p<.3?'拔剑出鞘。':p<.75?'四顾茫茫，去路何方？':'灯火渐远，心入苍茫。',p<.3?'The blade leaves its sheath.':p<.75?'Looking all around—where is the way?':'The lamplight fades into distance.');},0);
  }
  if(action==='survey')return animate(action,4.5,p=>{pan=lerp(-1,1,ease(p));},.6);
''' +s[b:]
s=s.replace("if(action==='ice-step')return animate(action,1.8,p=>{shotZoom=1+ease(p)*.045;cameraTo({ty:1.7},ease(p));},.55);", "if(action==='ice-step')return animate(action,3.8,p=>{vista=phase(p,.21,.79);cameraTo({ty:-1.8},ease(p));},.7);")
s=s.replace("if(action==='reach-breathe')return animate(action,4.5,p=>{hand=.86*pulse(p,.04,.35,.62,.96);handTurn=-.12*phase(p,.05,.38)+.27*phase(p,.64,.95);cameraTo({ty:8.5},pulse(p,0,.4,.66,1));},.55);", "if(action==='reach-breathe')return animate(action,7,p=>{hand=pulse(p,.02,.3,.71,1);handTurn=-.25*phase(p,.05,.35)+1.3*phase(p,.65,.96);armSweep=pulse(p,.08,.4,.72,1);cameraTo({ty:12},pulse(p,0,.4,.65,1));swallow=reduced?0:-.8*pulse(p,.73,.82,.9,1);cue(p<.64?'stars':'sigh',p<.64?'仰胁息，伸手向星河。':'以手抚膺，坐而长叹。',p<.64?'Hold your breath; reach into the stars.':'Hand towards the chest; breathe a long sigh.');},.6);")
s=s.replace("if(action==='fish')return animate(action,1.8,p=>{shotZoom=1+.04*ease(p);cameraTo({ty:1.5},ease(p));},.5);", "if(action==='fish')return animate(action,4.2,p=>{vista=phase(p,.16,.8);cameraTo({ty:-2},ease(p));},.7);")
a=s.index("  if(action==='lantern'){");b=s.index("  if(action==='listen')",a)
s=s[:a]+'''  if(action==='lantern'){
   let triggered=false;return animate(action,6.5,p=>{lamp=lerp(l,1,phase(p,0,.27));armSweep=pulse(p,.24,.55,.72,1);vista=phase(p,.38,.86);pan=lerp(-1,1,phase(p,.3,1));if(p>.32&&!triggered){triggered=true;flight=.001;sound('birds');}cue(p<.38?'light':'distance',p<.38?'提灯，照见古木。':'循声远望，山谷在月色中展开。',p<.38?'Lift the lantern towards the ancient tree.':'Follow the call into the moonlit valley.');},.7);
  }
''' +s[b:]
s=s.replace("water=lerp(w,1.3,ease(p));cameraTo({z:6.2,tx:3.4},ease(p));shake=Math.sin(p*52)*.012*pulse(p,.2,.5,.75,1);", "water=lerp(w,1.3,ease(p));vista=phase(p,.2,.86);cameraTo({z:6.2,tx:3.4},ease(p));shake=reduced?0:Math.sin(p*52)*.006*pulse(p,.2,.5,.75,1);")
s=s.replace("animate(action,1.8,p=>{water=", "animate(action,3.8,p=>{water=")
s=s.replace("hand=lerp(h,.76,phase(p,0,.34))*(1-phase(p,.62,1));", "hand=0;push=pulse(p,.02,.3,.7,1);armSweep=.06;")
s=s.replace("animate(action,1.65,p=>{hand=0;push=", "animate(action,3.6,p=>{hand=0;push=")
a=s.index("  asset('cupHand').style.transform=");b=s.index("  const glowLamp=",a)
s=s[:a]+'''  asset('cupHand').style.transform=`translate3d(${(1-cup)*-8+cupNear*34}%,${(1-cup)*85-cupNear*17+breath}%,0) rotate(${-5+cup*5+cupNear*11}deg) scale(${1+cupNear*.2})`;
  asset('swordHand').style.opacity=String(ease(sword/.06));
  asset('swordHand').style.transform=`translate3d(${(1-sword)*24-swordHigh*7}%,${(1-sword)*105-swordHigh*13+breath}%,0) rotate(${(1-sword)*33-swordHigh*14}deg)`;
  const sticks=asset('chopsticks');sticks.style.opacity=String(chop);sticks.style.transform=`translateY(${(1-chop)*-50}px) rotate(${12+chop*9}deg)`;
  const foodTransform=`translate3d(${(1-food)*16-foodNear*12}%,${(1-food)*100+foodNear*78}%,0) rotate(${(1-food)*7-foodNear*4}deg) scale(${1+foodNear*.32})`;
  asset('foodHand').style.transform=foodTransform;asset('emptyHand').style.transform=foodTransform;
  asset('foodHand').style.opacity=String(ease(food/.08)*(1-foodEaten));asset('emptyHand').style.opacity=String(ease(food/.08)*foodEaten);
  asset('reachHand').style.opacity=String(ease(hand/.12));
  asset('reachHand').style.transform=`translate3d(${(1-hand)*22-armSweep*14}%,${(1-hand)*110-armSweep*18+breath*hand}%,0) rotate(${handTurn*24}deg)`;
  for(const [id,direction] of [['pushLeft',-1],['pushRight',1]]){const el=asset(id);el.style.opacity=String(ease(push/.12));el.style.transform=`translate3d(${direction*armSweep*30}%,${(1-push)*105}%,0) rotate(${direction*armSweep*9}deg) scaleX(${direction})`;}
  asset('lanternHand').style.opacity=String(ease(lamp/.16));
  asset('lanternHand').style.transform=`translate3d(${(1-lamp)*12-armSweep*44}%,${(1-lamp)*82+Math.sin(armSweep*Math.PI)*-5+breath}%,0) rotate(${2-lamp*2-armSweep*5}deg)`;
''' +s[b:]
s=s.replace("time+=dt;const decay=", "time+=dt;sceneAge+=dt;if(!tween&&currentShot().pan&&!reduced)pan=Math.min(1,pan+dt*.07);const decay=")
s=s.replace("if(cut){const a=cut;a.elapsed+=dt;", "if(cut){const a=cut;a.elapsed+=dt;")
s=s.replace("e=ease(p);stats.progress=p;", "e=ease(p);stats.progress=p;fade=a.oldFade*(1-e);")
s=s.replace("hand,lamp,handTurn,walks", "push,food,foodNear,foodEaten,swallow,cupNear,armSweep,swordHigh,fade,pan,hand,lamp,handTurn,walks")
f.write_text(s,encoding='utf-8')

f=p/'index.html';s=f.read_text(encoding='utf-8')
s=s.replace('<link rel="stylesheet" href="journey.css">','<link rel="stylesheet" href="journey.css"><link rel="stylesheet" href="edition.css">')
s=s.replace('<div id="chopsticks">','<img id="foodHand" src="assets/food-hand.png" alt=""><img id="emptyHand" src="assets/empty-hand.png" alt=""><img id="pushLeft" src="assets/hand-reach.png" alt=""><img id="pushRight" src="assets/hand-reach.png" alt=""><div id="chopsticks">')
s=s.replace('<header class="topbar">','<div id="motionShade" aria-hidden="true"></div><div id="breathShade" aria-hidden="true"></div><header class="topbar">')
s=s.replace('<p id="sceneSub"', '<p id="titleTranslation" lang="en"></p><p id="sceneSub"')
a=s.index('   <nav class="tools"');b=s.index('  </header>',a)
s=s[:a]+'''   <nav class="tools" aria-label="Learning tools">
    <button data-modal="space">诗境地图</button><button data-modal="study">双诗研习</button><button data-modal="poem">两首原诗</button><button data-modal="practice">字句之间</button><button data-modal="help">行游小记</button>
   </nav><div class="language-switch" role="group" aria-label="Reading language"><button data-lang="zh" lang="zh-CN">中</button><button data-lang="bi">中 / EN</button><button data-lang="en" lang="en">EN</button></div>
''' +s[b:]
s=s.replace('<span class="art-note">第一人称诗境</span>', '<span class="art-note">李白 · 双诗行游</span>')
a=s.index('  <aside class="scene-guide">');b=s.index('</aside>',a)+8
s=s[:a]+'''  <aside class="scene-guide"><span id="sceneGuide"></span><button data-action="pause" id="pauseButton">暂歇 Ⅱ</button></aside>'''+s[b:]
s=s.replace('进入后开启声音 · 随时可关闭','')
s=s.replace('<script src="effects.js">','<script src="bilingual.js"></script><script src="effects.js">')
s=s.replace('山海行歌 · 李白双诗沉浸课','山海行歌 · 中英双语诗境')
f.write_text(s,encoding='utf-8')

f=p/'audio.js';s=f.read_text(encoding='utf-8').replace("shanhai-course-audio-v4","shanhai-course-audio-v5")
s=s.replace("music: true, narration:","voiceLang: 'zh', music: true, narration:")
s=s.replace("const state = { ...defaults, started: false, paused: false };", "const state = { ...defaults, started: false, paused: false };\n  if(saved.voiceLang==='en')state.voiceLang='en';")
s=s.replace("beginVoice(`stage-${index}`", "beginVoice(`stage-${index}${state.voiceLang==='en'?'-en':''}`")
s=s.replace("beginVoice(`poem-${index}`", "beginVoice(`poem-${index}${state.voiceLang==='en'?'-en':''}`")
s=s.replace("window.CourseAudio = { start,", "function setVoiceLang(lang){clearVoice();state.voiceLang=lang==='en'?'en':'zh';persist();emit(state.voiceLang==='en'?'English voice selected':'中文声音已选');}\n  window.CourseAudio = { setVoiceLang, start,")
f.write_text(s,encoding='utf-8')
print('V5 engine, markup and audio language patched')
