from pathlib import Path
p=Path(__file__).resolve().parents[2]/'诗境重构版'
s=(p/'cinema.js').read_text(encoding='utf8')
s=s.replace("const mode=i=>i===1?'gate':i>=4&&i<=8?'bridge':i>=9&&i<=11?'forest':i===12?'waterfall':i===13||i===14?'pass':'mountain';","const mode=i=>COURSE_STORY[i].world;\n let cup=0,sword=0,chop=0,sail=0,daylight=0,vista=0,vistaName='',shotZoom=1;\n const currentShot=()=>COURSE_STORY[sceneIndex];")
s=s.replace('scale(1.22) translate(', 'scale(${1.12*shotZoom}) translate(')
s=s.replace("panel.querySelector('.sky-layer').style.opacity=String(celestial);", "panel.querySelector('.sky-layer').style.opacity=String(celestial);\n  const v=panel.querySelector('.vista-layer');v.style.opacity=String(vista);\n  if(vistaName)v.style.backgroundImage=`url(\"assets/${vistaName}.png\")`;\n  panel.style.filter=worldName==='sea'?`brightness(${.62+daylight*.38})`:'none';")
s=s.replace("el.innerHTML='<div class=\"sky-layer\"></div><div class=\"water-layer\"></div>'", "el.innerHTML='<div class=\"sky-layer\"></div><div class=\"water-layer\"></div><div class=\"vista-layer\"></div>'")
s=s.replace("const images=['mountains','cliff-clean','stars-bg','moon','waterfall-bg','pass','hand-reach','lantern-hand'];", "const images=[...new Set([...COURSE_STORY.flatMap(s=>[s.bg,s.vista]).filter(Boolean),'hand-reach','lantern-hand','cup-hand','sword-hand','stars-bg'])];")
s=s.replace("bridge.group.visible=name==='bridge'", "bridge.group.visible=false")
s=s.replace("const previous=worldName,name=mode(i),same=name===previous;sceneIndex=i;worldName=name;", "const previous=worldName,name=mode(i),same=name===previous;sceneIndex=i;worldName=name;\n  const shot=COURSE_STORY[i];cup=shot.initialCup||0;sword=shot.initialSword||0;chop=i>=4&&i<=5?1:0;sail=shot.initialSail||0;daylight=i>=22?1:0;vista=0;vistaName=shot.vista||'';shotZoom=1;\n  clouds.visible=!['banquet','sea','gate','stream','ice','snow'].includes(name);")
s=s.replace("if(i===7&&!continuous){view.z=2.2;view.ty=2.5;}\n  if(i===8&&!continuous){view.z=2.2;view.ty=15;hand=.96;handTurn=-.08;celestial=1;starOpacity=.65;}\n  if(i===10&&!continuous){lamp=.95;flight=5;}\n  if(i===11&&!continuous){lamp=.38;flight=8;}","if(name==='stars'){starOpacity=.65;view.ty=4;}\n  if(name==='forest')lamp=shot.initialLamp||.23;\n  if(name!=='stars')starOpacity=0;\n  if(name==='trail'){view.ty=2.7;view.z=9;view.x=0;view.tx=0;}\n  gate.group.traverse(m=>{if(m.material){m.material.transparent=true;m.material.opacity=1;}});")
s=s.replace("const same=continuous&&mode(i)===worldName,visual=!same;", "const same=continuous&&mode(i)===worldName&&COURSE_STORY[i].bg===currentShot().bg&&vista===0,visual=!same;")
s=s.replace("'right','bottom','filter','transform','transformOrigin'", "'right','left','top','bottom','filter','transform','transformOrigin','objectFit'")
s=s.replace("const previousWater=prevPanel.querySelector('.water-layer').style.opacity;", "const previousWater=prevPanel.querySelector('.water-layer').style.opacity;\n  const previousVista=prevPanel.querySelector('.vista-layer').style.cssText,previousFilter=prevPanel.style.filter;")
s=s.replace("prevPanel.querySelector('.water-layer').style.opacity=previousWater;", "prevPanel.querySelector('.water-layer').style.opacity=previousWater;prevPanel.querySelector('.vista-layer').style.cssText=previousVista;prevPanel.style.filter=previousFilter;")
start=s.index("  if(action==='lay-planks'){")
end=s.index("  if(action==='reach')",start)
s=s[:start]+"""  if(action==='walk'){
   walks++;sound('step');const z=shotZoom;
   return animate(action,1.25,p=>{shotZoom=lerp(z,z+.025,ease(p));bob=Math.sin(Math.PI*p)**2*.025;},.35);
  }
  if(action==='cup'){const c0=cup;return animate(action,1.65,p=>{cup=lerp(c0,1,phase(p,.04,.91));},.65);}
  if(action==='drop'){const c0=cup;return animate(action,1.9,p=>{cup=lerp(c0,0,phase(p,0,.66));chop=phase(p,.55,.91);if(p>.82&&!window.dropSoundPlayed){window.dropSoundPlayed=true;sound('wood');}},.5);}
  if(action==='sword'){const s0=sword;sound('steel');return animate(action,1.6,p=>{sword=lerp(s0,1,phase(p,.06,.91));},.7);}
  if(['turn-vista','up-vista','down-vista','moon-vista','back-vista'].includes(action)){
   const goal=action==='down-vista'?{ty:-3.2}:action==='turn-vista'||action==='back-vista'?{tx:7.2}:{ty:10.5};
   return animate(action,2.1,p=>{cameraTo(goal,ease(p));vista=phase(p,.18,.83);sword=1-phase(p,.05,.75);if(action!=='turn-vista')sword=0;lamp=lerp(l,0,phase(p,.02,.67));
    if(worldName==='pass')gate.group.traverse(m=>{if(m.material)m.material.opacity=1-vista;});
   },.7);
  }
  if(action==='ice-step')return animate(action,1.8,p=>{shotZoom=1+ease(p)*.045;cameraTo({ty:1.7},ease(p));},.55);
  if(action==='snow-look')return animate(action,2,p=>{cameraTo({ty:11,fov:57},ease(p));shotZoom=1+.02*ease(p);},.65);
  if(action==='reach-breathe')return animate(action,4.5,p=>{hand=.86*pulse(p,.04,.35,.62,.96);handTurn=-.12*phase(p,.05,.38)+.27*phase(p,.64,.95);cameraTo({ty:8.5},pulse(p,0,.4,.66,1));},.55);
  if(action==='fish')return animate(action,1.8,p=>{shotZoom=1+.04*ease(p);cameraTo({ty:1.5},ease(p));},.5);
  if(action==='dawn'){const d0=daylight;return animate(action,3.6,p=>{daylight=lerp(d0,1,ease(p));cameraTo({ty:5},ease(p));},.8);}
  if(action==='sail'){sound('wind');return animate(action,3.8,p=>{sail=ease(p);daylight=1;},1);}
"""+s[end:]
s=s.replace("const night=worldName==='forest';", "const night=worldName==='forest'||worldName==='stars';")
s=s.replace("const breath=reduced?0:Math.sin(time*1.15)*.16;", "const breath=reduced?0:Math.sin(time*1.15)*.1;\n  asset('cupHand').style.opacity=String(ease(cup/.08));\n  asset('cupHand').style.transform=`translate3d(${(1-cup)*8}%,${(1-cup)*72+Math.sin(cup*Math.PI)*-4+breath}%,0) rotate(${(1-cup)*-7+breath}deg)`;\n  asset('swordHand').style.opacity=String(ease(sword/.06));\n  asset('swordHand').style.transform=`translate3d(${(1-sword)*21}%,${(1-sword)*93+breath}%,0) rotate(${(1-sword)*32+breath}deg)`;\n  const sticks=asset('chopsticks');sticks.style.opacity=worldName==='banquet'&&sceneIndex>=3?String(sceneIndex===3?1:0):'0';sticks.style.transform=`translate3d(${chop*20}px,${chop*45}px,0) rotate(${18+chop*15}deg)`;")
s=s.replace("updateObjects(dt);renderScene();", "updateObjects(dt);renderScene();JourneyEffects.update(dt,time,{world:worldName,sceneIndex,vista,sail,daylight,cut:cut?{old:cut.oldWorldName,p:ease(cut.elapsed/cut.duration)}:null,view:{...view},shotZoom});")
s=s.replace("flight,water,celestial,bob,gate:", "flight,water,celestial,bob,cup,sword,chop,sail,daylight,vista,vistaName,shotZoom,gate:")
s=s.replace("window.dropSoundPlayed=true;", "window.dropSoundPlayed=true;")
s=s.replace("const shot=COURSE_STORY[i];", "const shot=COURSE_STORY[i];window.dropSoundPlayed=false;")
s=s.replace("const images=[...new Set", "JourneyEffects.init();\n  const images=[...new Set")
(p/'cinema.js').write_text(s,encoding='utf8')
h=(p/'index.html').read_text(encoding='utf8').replace('蜀道难 · 第一人称诗境','山海行歌 · 李白双诗沉浸课').replace('蜀道难互动课件','山海行歌双诗互动课件').replace('<span>蜀道难</span>','<span>山海行歌</span>').replace('走入蜀道','走入山海').replace('意象空间','诗境地图').replace('读诗研习','双诗研习').replace('全诗</button>','两首原诗</button>')
h=h.replace('<div id="world"></div>','<div id="world"></div><canvas id="weatherCanvas" aria-hidden="true"></canvas>')
h=h.replace('<img id="reachHand"', '<img id="cupHand" src="assets/cup-hand.png" alt=""><img id="swordHand" src="assets/sword-hand.png" alt=""><div id="chopsticks"><i></i><i></i></div><img id="reachHand"')
h=h.replace('<link rel="stylesheet" href="motion.css">','<link rel="stylesheet" href="motion.css"><link rel="stylesheet" href="journey.css">')
h=h.replace('<script src="story.js"></script>','<script src="journey.js"></script><script src="effects.js"></script>')
h=h.replace('<script src="space.js"></script>','')
(p/'index.html').write_text(h,encoding='utf8')
