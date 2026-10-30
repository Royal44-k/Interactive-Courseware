from pathlib import Path
p=Path(__file__).parents[2]/'逐镜修订版'
old=(p/'cinema.js').read_text(encoding='utf8')
helpers=old[old.index(' function cloudTexture'):old.index(' function fit()')]
sound=old[old.index(' let context,fxGain;'):old.index(' function setPaused(value)')]
engine=r'''/* One clock for camera, foreground, scenery and shot dissolves. */
(() => {
 'use strict';
 const T=window.THREE,asset=id=>document.getElementById(id);
 const clamp=x=>Math.max(0,Math.min(1,x));
 const ease=x=>{x=clamp(x);return x*x*x*(x*(x*6-15)+10);};
 const phase=(p,a,b)=>ease((p-a)/(b-a));
 const lerp=(a,b,t)=>a+(b-a)*t;
 const pulse=(p,a,b,c,d)=>phase(p,a,b)*(1-phase(p,c,d));
 let renderer,world,camera,gate,bridge,forest,falls,clouds,stars,rocks,light,lanternLight;
 let compositor,screenCamera,screenQuad,oldTarget,newTarget,spareTarget;
 let time=0,last=0,paused=false,tween=null,cut=null,worldName='',sceneIndex=0,walks=0,flight=0,water=.45;
 let hand=0,lamp=0,handTurn=0,shake=0,bob=0,cloudPulse=0,celestial=0,nightShade=0,waterPhase=0,raf;
 let activePanel=0,ready=false,starOpacity=0;
 const view={x:0,y:2.45,z:9,tx:0,ty:2.7,tz:-25,fov:54};
 const pointer={x:0,y:0,sx:0,sy:0};
 const stats={frames:0,action:'',progress:0,completed:0,transitions:0,frameGaps:0,maxFrameMs:0};
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const panels=()=>[asset('backdropA'),asset('backdropB')];
 const mode=i=>i===1?'gate':i>=4&&i<=8?'bridge':i>=9&&i<=11?'forest':i===12?'waterfall':i===13||i===14?'pass':'mountain';
 const panelStyle=new Map();
 function matteTransform(v){
  const pitch=Math.atan2(v.ty-v.y,Math.abs(v.tz-v.z));
  const yaw=Math.atan2(v.tx-v.x,Math.abs(v.tz-v.z));
  const x=Math.max(-5.8,Math.min(5.8,-yaw*22)),y=Math.max(-6.6,Math.min(8.4,pitch*21));
  return `scale(1.22) translate(${-pointer.sx*.32+x}%,${pointer.sy*.18+y}%)`;
 }
 function drawMatte(){
  const panel=panels()[activePanel];if(!panel)return;
  panel.style.transform=matteTransform(view);
  panel.querySelector('.sky-layer').style.opacity=String(celestial);
  panel.querySelector('.water-layer').style.opacity=worldName==='waterfall'?'1':'0';
  asset('nightShade').style.opacity=String(nightShade);
  asset('fogCurtain').style.opacity=String(Math.min(.75,cloudPulse*.48));
 }
 function fit(){
  if(!renderer)return;renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
  const size=new T.Vector2();renderer.getDrawingBufferSize(size);
  for(const target of [oldTarget,newTarget,spareTarget])target?.setSize(size.x,size.y);
 }
 function makeCompositor(){
  const options={type:T.HalfFloatType,depthBuffer:true,stencilBuffer:false,samples:2};
  oldTarget=new T.WebGLRenderTarget(1,1,options);newTarget=new T.WebGLRenderTarget(1,1,options);spareTarget=new T.WebGLRenderTarget(1,1,options);
  compositor=new T.Scene();screenCamera=new T.OrthographicCamera(-1,1,1,-1,0,1);
  const material=new T.ShaderMaterial({depthTest:false,depthWrite:false,uniforms:{before:{value:oldTarget.texture},after:{value:newTarget.texture},blend:{value:0}},
   vertexShader:'varying vec2 uvScreen;void main(){uvScreen=uv;gl_Position=vec4(position.xy,0.0,1.0);}',
   fragmentShader:`uniform sampler2D before;uniform sampler2D after;uniform float blend;varying vec2 uvScreen;
    void main(){vec4 a=texture2D(before,uvScreen),b=texture2D(after,uvScreen);float opacity=mix(a.a,b.a,blend);
    vec3 rgb=mix(a.rgb*a.a,b.rgb*b.a,blend)/max(opacity,0.00001);gl_FragColor=vec4(rgb,opacity);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    }`});
  screenQuad=new T.Mesh(new T.PlaneGeometry(2,2),material);compositor.add(screenQuad);
 }
 async function init(){
  renderer=new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setClearColor(0,0);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
  renderer.domElement.id='cinemaCanvas';renderer.domElement.setAttribute('aria-label','移动视线、点击行动的蜀道场景');asset('world').appendChild(renderer.domElement);
  world=new T.Scene();world.fog=new T.FogExp2(0x102c33,.015);camera=new T.PerspectiveCamera(54,innerWidth/innerHeight,.08,200);
  world.add(new T.HemisphereLight(0xb6ced7,0x1c211d,2.7));light=new T.DirectionalLight(0xffd7a0,3.2);light.position.set(8,14,7);world.add(light,new T.AmbientLight(0x294654,.6));lanternLight=new T.PointLight(0xffa74f,0,18,1.5);world.add(lanternLight);
  gate=CinemaProps.gate();bridge=CinemaProps.walkway();forest=CinemaProps.forest();falls=CinemaProps.waterfall();
  [gate,bridge,forest,falls].forEach(o=>world.add(o.group));clouds=makeClouds();stars=makeStars();rocks=makeRocks();rocks.visible=false;world.add(clouds,stars,rocks);
  panels().forEach(el=>{el.innerHTML='<div class="sky-layer"></div><div class="water-layer"></div>';el.style.opacity='0';});
  makeCompositor();fit();setScene(0,false);panels()[0].style.opacity='1';panels()[0].style.backgroundImage='url("assets/mountains.png")';renderScene();
  document.addEventListener('pointermove',e=>{pointer.x=e.clientX/innerWidth*2-1;pointer.y=e.clientY/innerHeight*2-1;});
  let down;asset('world').addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY};});asset('world').addEventListener('pointerup',e=>{if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<8&&!paused&&!tween&&!cut)document.dispatchEvent(new CustomEvent('cinema-object-action'));down=null;});
  addEventListener('resize',fit);last=performance.now();raf=requestAnimationFrame(frame);
  const images=['mountains','cliff-clean','stars-bg','moon','waterfall-bg','pass','hand-reach','lantern-hand'];
  await Promise.all(images.map(name=>{const img=new Image();img.src=`assets/${name}.png`;return img.decode();}));ready=true;document.body.classList.add('scene-ready');
 }
 function setScene(i,continuous){
  const previous=worldName,name=mode(i),same=name===previous;sceneIndex=i;worldName=name;
  gate.group.visible=name==='gate'||name==='pass';bridge.group.visible=name==='bridge';forest.group.visible=name==='forest';falls.group.visible=name==='waterfall';
  if(!continuous||!same){
   const keepCamera=continuous&&name==='mountain'&&previous==='gate';
   if(!keepCamera)Object.assign(view,{x:0,y:2.45,z:9,tx:0,ty:2.7,tz:-25,fov:54});
   celestial=0;hand=0;handTurn=0;lamp=name==='forest'?.38:0;walks=0;flight=0;water=.45;shake=0;bob=0;cloudPulse=0;starOpacity=0;
   if(name==='gate'){gate.reset();gate.group.position.set(.1,-1.8,0);gate.group.scale.setScalar(1.65);view.z=6.2;view.tx=.1;view.ty=2.8;}
   if(name==='bridge'){bridge.reset();view.x=-.15;view.z=9;view.y=2.05;view.tx=1.6;view.ty=.8;bridge.planks[0].visible=i!==4;}
   if(name==='forest'){forest.reset();view.z=9;view.y=2.5;view.tx=1.1;view.ty=3.2;}
   if(name==='waterfall'){falls.reset();view.x=-.4;view.y=2.8;view.tx=2.8;view.ty=3.8;}
   if(name==='pass'){gate.reset();gate.group.position.set(1.8,-2.2,-1);gate.group.scale.setScalar(1.65);view.x=.1;view.y=2.7;view.z=7.4;view.tx=1.5;view.ty=3;}
  }
  if(i===7&&!continuous){view.z=2.2;view.ty=2.5;}
  if(i===8&&!continuous){view.z=2.2;view.ty=15;hand=.96;handTurn=-.08;celestial=1;starOpacity=.65;}
  if(i===10&&!continuous){lamp=.95;flight=5;}
  if(i===11&&!continuous){lamp=.38;flight=8;}
  nightShade=name==='forest'?.12:0;
  document.body.dataset.environment=name;document.body.dataset.scene=i;
 }
 function snapshotForeground(){
  [['reachHand','outgoingHand'],['lanternHand','outgoingLamp']].forEach(([from,to])=>{const el=asset(from),copy=asset(to),s=getComputedStyle(el);for(const key of ['width','height','right','bottom','filter','transform','transformOrigin','opacity'])copy.style[key]=s[key];});
  asset('outgoingForeground').style.opacity='1';
 }
 function captureWorld(){
  renderer.setRenderTarget(spareTarget);
  if(cut&&cut.visual)renderer.render(compositor,screenCamera);else renderer.render(world,camera);
  renderer.setRenderTarget(null);const temp=oldTarget;oldTarget=spareTarget;spareTarget=temp;
 }
 function cancel(){
  if(tween){const old=tween;tween=null;old.resolve(false);}
  if(cut){const old=cut;cut=null;old.resolve(false);}
  stats.action='';stats.progress=0;
 }
 function travel(i,continuous,onSwap){
  const same=continuous&&mode(i)===worldName,visual=!same;
  if(visual){captureWorld();snapshotForeground();}
  cancel();const prevPanel=panels()[activePanel];const previousTransform=prevPanel.style.transform;
  const previousSky=prevPanel.querySelector('.sky-layer').style.opacity;
  const previousWater=prevPanel.querySelector('.water-layer').style.opacity;
  if(visual){activePanel=1-activePanel;const incoming=panels()[activePanel];incoming.style.backgroundImage=`url("assets/${COURSE_STORY[i].bg}.png")`;incoming.style.opacity='0';prevPanel.style.opacity='1';}
  setScene(i,continuous);drawMatte();
  if(visual){prevPanel.style.transform=previousTransform;prevPanel.querySelector('.sky-layer').style.opacity=previousSky;prevPanel.querySelector('.water-layer').style.opacity=previousWater;asset('foreground').style.opacity='0';screenQuad.material.uniforms.before.value=oldTarget.texture;screenQuad.material.uniforms.after.value=newTarget.texture;screenQuad.material.uniforms.blend.value=0;}
  const duration=reduced?.28:visual?.68:.38;
  stats.action=visual?'scene-dissolve':'text-settle';stats.progress=0;
  return new Promise(resolve=>{cut={visual,elapsed:0,duration,resolve,onSwap,swapped:false,from:prevPanel,to:panels()[activePanel]};});
 }
 function animate(name,duration,update,hold=.26){
  cancel();stats.action=name;stats.progress=0;
  return new Promise(resolve=>{tween={name,duration:reduced?Math.min(duration,.65):duration,hold:reduced?.1:hold,elapsed:0,update,resolve};update(0);});
 }
 function perform(action){
  const f={...view},h=hand,r=handTurn,l=lamp,w=water,c=celestial;
  const cameraTo=(goal,p)=>{for(const k of Object.keys(goal))view[k]=lerp(f[k],goal[k],p);};
  if(action==='enter')return animate(action,.55,p=>{cloudPulse=.16*pulse(p,0,.4,.6,1);},.08);
  if(action==='open-gate'){
   sound('wood');const left=gate.left.rotation.y,right=gate.right.rotation.y;
   return animate(action,2.5,p=>{const push=phase(p,.12,.86);hand=lerp(h,.8,phase(p,0,.27))*(1-phase(p,.56,.96));handTurn=lerp(r,-.11,phase(p,0,.5));gate.left.rotation.y=lerp(left,-1.48,push);gate.right.rotation.y=lerp(right,1.48,push);cameraTo({z:-2.2},phase(p,.45,1));bob=Math.sin(p*Math.PI*4)*.018*pulse(p,.4,.6,.84,1);},.32);
  }
  if(action==='look-up')return animate(action,1.5,p=>{cameraTo({ty:12.2,fov:57},ease(p));},.32);
  if(action==='cross-cloud')return animate(action,1.7,p=>{cameraTo({z:f.z-2.8},ease(p));cloudPulse=.5*pulse(p,0,.52,.7,1);lamp=lerp(l,l*.8,ease(p));bob=Math.sin(p*Math.PI*4)*.017*Math.sin(Math.PI*p)**2;},.2);
  if(action==='lay-planks'){
   const plank=bridge.planks[0];plank.visible=true;plank.position.x=5.8;plank.position.y=.6;plank.rotation.z=-.13;sound('wood');
   return animate(action,1.55,p=>{const a=phase(p,.05,.81);hand=lerp(h,.66,phase(p,0,.35))*(1-phase(p,.68,1));plank.position.x=lerp(5.8,1.4,a);plank.position.y=lerp(.6,0,a);plank.rotation.z=lerp(-.13,0,a);plank.rotation.x=Math.sin(a*Math.PI)*.08;cameraTo({z:7.3},phase(p,.28,1));},.38);
  }
  if(action==='look-down')return animate(action,1.45,p=>{cameraTo({ty:-3.2,x:-.55,fov:57},ease(p));hand=lerp(h,.24,phase(p,0,.35))*(1-phase(p,.55,1));},.32);
  if(action==='walk'){
   walks++;sound(walks===2?'creak':'step');const plank=bridge.planks[bridge.brokenIndex],by=plank.position.y,br=plank.rotation.x;
   return animate(action,1.02,p=>{cameraTo({z:f.z-2.1,ty:.65,fov:54,x:.4},ease(p));bob=Math.sin(Math.PI*p)**2*.075;hand=lerp(h,.09,phase(p,0,.42))*(1-phase(p,.5,1));if(walks===2){const q=phase(p,.2,1);plank.rotation.x=br-q*1.5;plank.position.y=by-q*q*5;shake=Math.sin(p*31)*.012*pulse(p,.25,.4,.66,1);}},.18);
  }
  if(action==='reach')return animate(action,1.5,p=>{cameraTo({ty:15,fov:58},phase(p,0,.92));hand=lerp(h,.96,phase(p,.09,.73));handTurn=lerp(r,-.08,phase(p,.14,.87));celestial=lerp(c,1,phase(p,.08,.84));starOpacity=celestial*.65;},.55);
  if(action==='breathe')return animate(action,1.65,p=>{hand=lerp(h,0,phase(p,0,.83));handTurn=lerp(r,.3,phase(p,0,.8));cameraTo({ty:1.5,y:f.y-.32,fov:55},phase(p,.17,1));},.5);
  if(action==='lantern'){
   let triggered=false;
   return animate(action,1.3,p=>{lamp=lerp(l,.95,phase(p,0,.77));cameraTo({tx:2.6,ty:3.85},phase(p,.16,1));if(p>.43&&!triggered){triggered=true;flight=.001;sound('birds');}},.6);
  }
  if(action==='listen')return animate(action,1.15,p=>{lamp=lerp(l,.38,ease(p));cameraTo({tx:1.1,ty:4.6},ease(p));},.45);
  if(action==='torrent'){
   sound('water');return animate(action,1.8,p=>{water=lerp(w,1.3,ease(p));cameraTo({z:6.2,tx:3.4},ease(p));shake=Math.sin(p*52)*.012*pulse(p,.2,.5,.75,1);},.6);
  }
  if(action==='blocked-gate'){
   sound('impact');return animate(action,1.65,p=>{hand=lerp(h,.76,phase(p,0,.34))*(1-phase(p,.62,1));cameraTo({z:f.z-.6},phase(p,.12,.75));const strain=Math.sin(p*25)*.012*pulse(p,.28,.4,.65,.83);gate.left.rotation.y=-Math.abs(strain);gate.right.rotation.y=Math.abs(strain);shake=strain*.28;},.42);
  }
  if(action==='turn-back')return animate(action,1.8,p=>{cameraTo({tx:-8,x:-.85,fov:57},ease(p));},.28);
  if(action==='look-west')return animate(action,1.6,p=>{cameraTo({tx:6.2,ty:4.5,x:-.65},ease(p));},.4);
  if(action==='settle')return animate(action,1.2,p=>{cameraTo({tx:2,fov:54},ease(p));},.4);
  return Promise.resolve(true);
 }
 function updateObjects(dt){
  const night=worldName==='forest';light.intensity=night?.7:3.2;light.color.set(night?0xa6c6de:0xffd7a0);
  clouds.children.forEach((m,i)=>{m.position.x=m.userData.x+Math.sin(time*.03+i)*5;m.position.y=m.userData.y+Math.sin(time*.08+i)*.3;m.material.opacity=(night?.13:.17)+cloudPulse*.08;m.lookAt(camera.position.x,camera.position.y,m.position.z+30);});
  stars.material.opacity=starOpacity;stars.rotation.z=Math.sin(time*.04)*.008;
  if(forest.group.visible){
   if(flight>0)flight+=dt;
   forest.birds.forEach((b,i)=>{const f=flight>0?Math.max(0,flight-i*.12):0,launch=phase(f,0,.45),distance=f*f/(f+.45);
    if(f>0){b.group.position.set(b.origin.x+Math.sin(i*3)*distance*.9,b.origin.y+distance*.65,b.origin.z-distance*3);b.group.rotation.y=lerp(-.25+i*.19,-.3+i*.11,launch);}
    const wing=lerp(Math.sin(time*2+i)*.05,Math.sin(f*13+i)*.66,launch);b.leftWing.rotation.z=wing;b.rightWing.rotation.z=-wing;
   });
  }
  if(falls.group.visible){falls.update(time,water);waterPhase+=dt*(18+water*14);asset('waterFlow').setAttribute('dy',String(72*Math.sin(waterPhase*.012)));asset('waterDisplacement').setAttribute('scale',String(7+water*7));}
  lanternLight.position.set(view.x+1.5,view.y-.1,view.z-2);lanternLight.intensity=lamp*6*(1+.045*Math.sin(time*7));
 }
 function renderHands(){
  const breath=reduced?0:Math.sin(time*1.15)*.16;
  asset('reachHand').style.opacity=String(ease(hand/.12));
  asset('reachHand').style.transform=`translate3d(${(1-hand)*23}%,${(1-hand)*108+breath*hand}%,0) rotate(${handTurn*24+breath*hand}deg) scale(${.97+.03*hand})`;
  asset('lanternHand').style.opacity=String(ease(lamp/.16));
  asset('lanternHand').style.transform=`translate3d(${(1-lamp)*10}%,${(1-lamp)*62+breath*1.5}%,0) rotate(${lerp(2.1,-.35,lamp)+breath*.6}deg)`;
  asset('lampGlow').style.opacity=String(lamp*lamp*.33*(cut?ease(cut.elapsed/cut.duration):1));asset('lampGlow').style.transform=`translateY(${(1-lamp)*22}%)`;
 }
 function cameraPose(){
  const drift=reduced?0:Math.sin(time*.3)*.008;
  camera.position.set(view.x+pointer.sx*.12+shake,view.y+pointer.sy*.045+bob,view.z);
  camera.fov=view.fov;camera.lookAt(view.tx+pointer.sx*.36,view.ty-pointer.sy*.2+drift,view.tz);camera.updateProjectionMatrix();
 }
 function renderScene(){
  cameraPose();renderHands();drawMatte();
  if(cut&&cut.visual){renderer.setRenderTarget(newTarget);renderer.render(world,camera);renderer.setRenderTarget(null);renderer.render(compositor,screenCamera);}
  else{renderer.setRenderTarget(null);renderer.render(world,camera);}
 }
 function frame(now){
  raf=requestAnimationFrame(frame);const ms=last?now-last:16.67;last=now;const dt=Math.min(.1,ms/1000);
  if(!paused){
   if(ready){stats.maxFrameMs=Math.max(stats.maxFrameMs,ms);if(ms>34)stats.frameGaps++;}
   time+=dt;const decay=1-Math.exp(-dt/0.22);pointer.sx+=(pointer.x-pointer.sx)*decay;pointer.sy+=(pointer.y-pointer.sy)*decay;
   if(tween){const a=tween;a.elapsed+=dt;const p=clamp(a.elapsed/a.duration);stats.progress=p;a.update(p);asset('course').style.setProperty('--action-progress',`${p*100}%`);if(a.elapsed>=a.duration+a.hold){tween=null;stats.completed++;stats.action='';stats.progress=0;a.resolve(true);}}
   if(cut){const a=cut;a.elapsed+=dt;const p=clamp(a.elapsed/a.duration),e=ease(p);stats.progress=p;
    if(!a.swapped&&p>=.34){a.swapped=true;a.onSwap?.();}
    asset('course').style.setProperty('--copy-opacity',String(p<.34?1-phase(p,0,.3):phase(p,.39,1)));
    if(a.visual){a.from.style.opacity=String(1-e);a.to.style.opacity=String(e);screenQuad.material.uniforms.blend.value=e;asset('outgoingForeground').style.opacity=String(1-e);asset('foreground').style.opacity=String(e);}
    if(p===1){cut=null;stats.transitions++;stats.action='';stats.progress=0;asset('course').style.setProperty('--copy-opacity','1');asset('outgoingForeground').style.opacity='0';asset('foreground').style.opacity='1';a.resolve(true);}
   }
   updateObjects(dt);renderScene();
  }
  stats.frames++;
 }
'''
end=r'''
 function setPaused(value){paused=!!value;last=performance.now();if(context){if(paused)context.suspend();else context.resume();}}
 window.CinemaEngine={init,travel,perform,cancel,setPaused,getState:()=>({ready,sceneIndex,worldName,time,paused,busy:!!tween||!!cut,transition:cut?{progress:cut.elapsed/cut.duration,visual:cut.visual}:null,view:{...view},hand,lamp,handTurn,walks,flight,water,celestial,bob,gate:gate?{left:gate.left.rotation.y,right:gate.right.rotation.y}:null,...stats}),destroy(){cancelAnimationFrame(raf);cancel();renderer?.dispose();[oldTarget,newTarget,spareTarget].forEach(x=>x?.dispose());context?.close();}};
})();
'''
(p/'cinema.js').write_text(engine.replace(' function fit(){',helpers+' function fit(){',1)+sound+end,encoding='utf8')
# HTML foreground banks and matte layers are driven from the same RAF clock.
h=(p/'index.html').read_text(encoding='utf8').replace('<div id="starSky"></div><div id="waterSurface"></div>','')
h=h.replace('<div class="night-shade" aria-hidden="true">','<div class="night-shade" id="nightShade" aria-hidden="true">')
h=h.replace('<div class="foreground" aria-hidden="true">','<div class="foreground" id="foreground" aria-hidden="true">')
h=h.replace('<div id="fogCurtain"','<div class="foreground" id="outgoingForeground" aria-hidden="true"><img id="outgoingHand" src="assets/hand-reach.png" alt=""><img id="outgoingLamp" src="assets/lantern-hand.png" alt=""></div><div id="fogCurtain"')
h=h.replace('<link rel="stylesheet" href="cinema.css">','<link rel="stylesheet" href="cinema.css"><link rel="stylesheet" href="motion.css">')
(p/'index.html').write_text(h,encoding='utf8')
css=r'''
/* Shot rhythm: the RAF clock owns transition opacity and all foreground poses. */
:root{--copy-opacity:1}
.scenery{transform:none!important;inset:-2%;will-change:auto}
.backdrop{transition:none!important;will-change:transform,opacity;transform-origin:center;background-size:cover}
.sky-layer,.water-layer{position:absolute;inset:0;pointer-events:none;background-size:cover;background-position:center;opacity:0}
.sky-layer{background-image:url(assets/stars-bg.png)}
.water-layer{background-image:url(assets/waterfall-bg.png);filter:url(#waterMotion);mask-image:linear-gradient(90deg,transparent 53%,#000 66%,#000 90%,transparent 99%)}
.night-shade,#fogCurtain{transition:none}
.foreground{opacity:1;will-change:opacity}#outgoingForeground{opacity:0;z-index:1}
.foreground img{backface-visibility:hidden;transform-style:preserve-3d;transition:none!important}
.story-copy,.subtitle{opacity:var(--copy-opacity)!important;transition:none!important}
.story-copy.reveal{animation:none!important}.story-copy.reveal>*{animation:none!important}
.story-copy h1,.scene-sub,.eyebrow,.read-line{transition:none}
.acting .story-copy{opacity:var(--copy-opacity)!important}.acting .primary{opacity:.82}
.scene-guide{background:none;text-shadow:0 1px 5px #000,0 0 10px #000}
.journey-progress{transition:width .5s ease}
body:not(.scene-ready) .primary{pointer-events:none;opacity:.4}
@media(prefers-reduced-motion:reduce){.film-grain{display:none}}
'''
(p/'motion.css').write_text(css,encoding='utf8')
# Preserve lesson tools; replace only orchestration, not the verified poem content.
a=(p/'app.js').read_text(encoding='utf8')
a=a.replace('actionDone:false,found:', 'actionDone:false,ready:false,found:')
a=a.replace('  background(s.bg);CinemaEngine.enter(state.index,continuous);','')
a=a.replace("$('#journeyProgress').style.width=`${state.index/(story.length-1)*100}%`;$('#storyCopy').classList.remove('reveal');void $('#storyCopy').offsetWidth;$('#storyCopy').classList.add('reveal');", "$('#journeyProgress').style.width=`${state.index/(story.length-1)*100}%`;")
start=a.index(' function go(index,continuous=false)');end=a.index(' async function next()',start)
a=a[:start]+''' async function go(index,continuous=false){
  if(!state.ready)return false;
  closeModal();const token=++transitionId;state.busy=true;$('#nextButton').disabled=true;$('#course').classList.remove('acting');clearTimeout(audioTimer);audio()?.stopVoice();state.paused=false;CinemaEngine.setPaused(false);audio()?.resume();
  const target=Math.max(0,Math.min(story.length-1,index));
  const completed=await CinemaEngine.travel(target,continuous,()=>{if(token!==transitionId)return;state.index=target;render(continuous);});
  if(!completed||token!==transitionId)return false;
  state.busy=false;$('#nextButton').disabled=false;return true;
 }
'''+a[end:]
a=a.replace('if(state.modal||state.paused||state.busy)return;', 'if(!state.ready||state.modal||state.paused||state.busy)return;')
a=a.replace("if(state.actionDone){go(state.index+1,true);return;}","if(state.actionDone){await go(state.index+1,true);return;}")
a=a.replace("if(s.motion==='walk'&&state.interaction>=3){go(state.index+1,true);return;}","if(s.motion==='walk'&&state.interaction>=3){await go(state.index+1,true);return;}")
a=a.replace('  go(state.index+1,true);\n }','  await go(state.index+1,true);\n }')
a=a.replace(' CinemaEngine.init();render();updateAudio();', ''' render();updateAudio();
 CinemaEngine.init().then(()=>{state.ready=true;}).catch(error=>{console.error(error);document.body.classList.add('webgl-unavailable');});''')
a=a.replace('getState:()=>({index:state.index,','getState:()=>({ready:state.ready,index:state.index,')
(p/'app.js').write_text(a,encoding='utf8')
print('Rebuilt synchronized motion, compositor and orchestration')
