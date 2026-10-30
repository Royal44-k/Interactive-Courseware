/* One clock for camera, foreground, scenery and shot dissolves. */
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
 let waterRenderer,waterScene,waterCamera,waterQuad,waterTexture;
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
 function cloudTexture(){const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d');for(let i=0;i<28;i++){let x=40+(i*97%180),y=50+(i*61%160),r=25+(i*37%65);let g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'rgba(190,211,210,.12)');g.addColorStop(1,'rgba(190,211,210,0)');ctx.fillStyle=g;ctx.fillRect(0,0,256,256);}return new T.CanvasTexture(c);}
 function makeClouds(){const group=new T.Group(),tex=cloudTexture();for(let i=0;i<30;i++){const mat=new T.MeshBasicMaterial({map:tex,transparent:true,opacity:.2,depthWrite:false,side:T.DoubleSide,color:0xa5bfc0});const m=new T.Mesh(new T.PlaneGeometry(26+i%5*8,7+i%3*3),mat);m.position.set((i*17%70)-35,-1+(i%6)*1.3,-12-(i*11%65));m.userData={x:m.position.x,y:m.position.y,phase:i*1.7};group.add(m);}return group;}
 function makeStars(){const p=new Float32Array(450*3);for(let i=0;i<450;i++){p[i*3]=(Math.sin(i*47.17)*.5)*160;p[i*3+1]=6+(i*37%180)/3;p[i*3+2]=-35-(i*13%70);}const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(p,3));const mat=new T.PointsMaterial({color:0xf5e5b7,size:.12,sizeAttenuation:true,transparent:true,opacity:0,depthWrite:false});return new T.Points(geo,mat);}
 function makeRocks(){const g=new T.Group();for(let i=0;i<10;i++){const m=new T.Mesh(new T.DodecahedronGeometry(.12+(i%3)*.08,1),new T.MeshStandardMaterial({color:0x3f514e,roughness:1}));m.position.set(3.2+(i%3)*.4,5+i*.65,-7-(i%4));m.userData.start=m.position.clone();g.add(m);}return g;}
 function fit(){
  if(!renderer)return;renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
  const size=new T.Vector2();renderer.getDrawingBufferSize(size);
  for(const target of [oldTarget,newTarget,spareTarget])target?.setSize(size.x,size.y);
  if(waterRenderer){waterRenderer.setSize(Math.ceil(innerWidth*1.04),Math.ceil(innerHeight*1.04),false);waterQuad.material.uniforms.aspect.value=innerWidth/innerHeight;}
 }
 async function prepareWater(){
  waterTexture=await new Promise((resolve,reject)=>new T.TextureLoader().load(window.WATER_PLATE_DATA,resolve,undefined,reject));waterTexture.colorSpace=T.SRGBColorSpace;delete window.WATER_PLATE_DATA;
  waterRenderer=new T.WebGLRenderer({alpha:true,antialias:false,powerPreference:'high-performance'});waterRenderer.setPixelRatio(Math.min(devicePixelRatio,1.25));waterRenderer.setClearColor(0,0);waterRenderer.outputColorSpace=T.SRGBColorSpace;
  waterRenderer.domElement.className='water-motion-canvas';waterScene=new T.Scene();waterCamera=new T.OrthographicCamera(-1,1,1,-1,0,1);
  waterQuad=new T.Mesh(new T.PlaneGeometry(2,2),new T.ShaderMaterial({depthTest:false,depthWrite:false,toneMapped:false,uniforms:{plate:{value:waterTexture},t:{value:0},strength:{value:.45},aspect:{value:innerWidth/innerHeight}},
   vertexShader:'varying vec2 uvScreen;void main(){uvScreen=uv;gl_Position=vec4(position.xy,0.0,1.0);}',
   fragmentShader:`uniform sampler2D plate;uniform float t,strength,aspect;varying vec2 uvScreen;
    void main(){vec2 uv=uvScreen;float ratio=(1672.0/941.0)/aspect;if(ratio>1.0)uv.x=(uv.x-.5)/ratio+.5;else uv.y=(uv.y-.5)*ratio+.5;
     float m=smoothstep(.54,.66,uv.x)*(1.0-smoothstep(.91,1.0,uv.x));vec2 flow=uv;
     float wave=sin(uv.y*83.0+t*2.6+sin(uv.x*41.0+t*.4));float fine=sin(uv.y*157.0+t*4.2+uv.x*80.0);
     flow.x+=m*(wave*.0011+fine*.00045)*(.65+strength*.45);flow.y+=m*sin(uv.y*57.0+t*2.1+uv.x*18.0)*.0015;
     vec3 color=texture2D(plate,flow).rgb;gl_FragColor=vec4(color,m);
     #include <colorspace_fragment>
     gl_FragColor.rgb*=gl_FragColor.a;
    }`}));waterScene.add(waterQuad);fit();await waterRenderer.compileAsync(waterScene,waterCamera);waterRenderer.render(waterScene,waterCamera);
 }
 function makeCompositor(){
  const options={type:T.HalfFloatType,depthBuffer:true,stencilBuffer:false,samples:2};
  oldTarget=new T.WebGLRenderTarget(1,1,options);newTarget=new T.WebGLRenderTarget(1,1,options);spareTarget=new T.WebGLRenderTarget(1,1,options);
  compositor=new T.Scene();screenCamera=new T.OrthographicCamera(-1,1,1,-1,0,1);
  const material=new T.ShaderMaterial({depthTest:false,depthWrite:false,uniforms:{before:{value:oldTarget.texture},after:{value:newTarget.texture},blend:{value:0}},
   vertexShader:'varying vec2 uvScreen;void main(){uvScreen=uv;gl_Position=vec4(position.xy,0.0,1.0);}',
   fragmentShader:`uniform sampler2D before;uniform sampler2D after;uniform float blend;varying vec2 uvScreen;
    void main(){vec4 a=texture2D(before,uvScreen),b=texture2D(after,uvScreen);float opacity=mix(a.a,b.a,blend);
    vec3 rgb=mix(a.rgb,b.rgb,blend)/max(opacity,0.00001);gl_FragColor=vec4(rgb,opacity);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    gl_FragColor.rgb*=gl_FragColor.a;
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
  addEventListener('resize',fit);
  const images=['mountains','cliff-clean','stars-bg','moon','waterfall-bg','pass','hand-reach','lantern-hand'];
  await Promise.all(images.map(name=>{const img=new Image();img.src=`assets/${name}.png`;return img.decode();}));
  await prepareWater();
  // Upload every texture and compile both direct and dissolve programs before the first click.
  [gate,bridge,forest,falls].forEach(o=>o.group.visible=true);
  await renderer.compileAsync(world,camera);
  renderer.setRenderTarget(newTarget);await renderer.compileAsync(world,camera);renderer.render(world,camera);
  renderer.setRenderTarget(oldTarget);renderer.render(world,camera);
  renderer.setRenderTarget(spareTarget);await renderer.compileAsync(compositor,screenCamera);renderer.render(compositor,screenCamera);
  renderer.setRenderTarget(null);await renderer.compileAsync(compositor,screenCamera);renderer.render(compositor,screenCamera);
  setScene(0,false);renderScene();last=performance.now();ready=true;document.body.classList.add('scene-ready');raf=requestAnimationFrame(frame);
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
  const copies=[];
  for(const bank of [asset('outgoingForeground'),asset('foreground')]){
   const alpha=+getComputedStyle(bank).opacity;if(alpha<.002)continue;
   for(const el of bank.querySelectorAll('img')){const s=getComputedStyle(el),opacity=+s.opacity*alpha;if(opacity<.002)continue;const copy=el.cloneNode(false);copy.removeAttribute('id');for(const key of ['width','height','right','bottom','filter','transform','transformOrigin'])copy.style[key]=s[key];copy.style.opacity=String(opacity);copies.push(copy);}
  }
  asset('outgoingForeground').replaceChildren(...copies);asset('outgoingForeground').style.opacity='1';
 }
 function snapshotInterruptedMatte(){
  let freeze=asset('matteFreeze');
  if(!freeze){freeze=document.createElement('div');freeze.id='matteFreeze';asset('scenery').appendChild(freeze);}
  const layers=[];
  if(freeze.children.length&&+getComputedStyle(freeze).opacity>.002){const copy=freeze.firstElementChild.cloneNode(true);copy.style.zIndex='0';layers.push(copy);}
  const ordered=panels().slice().sort((a,b)=>(+a.style.zIndex||0)-(+b.style.zIndex||0));
  for(const el of ordered){if(+getComputedStyle(el).opacity<.002)continue;const copy=el.cloneNode(true);copy.removeAttribute('id');copy.style.zIndex=String(layers.length+1);layers.push(copy);}
  const group=document.createElement('div');group.className='frozen-matte-group';group.append(...layers);freeze.replaceChildren(group);freeze.style.opacity='1';freeze.style.zIndex='2';panels().forEach(el=>el.style.opacity='0');return freeze;
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
  const oldNight=nightShade,oldFog=cloudPulse,oldLamp=lamp,oldWorldName=worldName;
  const interrupted=!!cut?.visual;
  if(visual){captureWorld();snapshotForeground();}
  const frozen=visual&&interrupted?snapshotInterruptedMatte():null;
  cancel();const prevPanel=panels()[activePanel];const previousTransform=prevPanel.style.transform;
  const previousSky=prevPanel.querySelector('.sky-layer').style.opacity;
  const previousWater=prevPanel.querySelector('.water-layer').style.opacity;
  if(visual){activePanel=1-activePanel;const incoming=panels()[activePanel];incoming.style.backgroundImage=`url("assets/${COURSE_STORY[i].bg}.png")`;incoming.style.opacity='0';incoming.style.zIndex=frozen?'3':'1';prevPanel.style.zIndex='0';prevPanel.style.opacity=frozen?'0':'1';}
  setScene(i,continuous);if(worldName==='waterfall'&&waterRenderer)panels()[activePanel].querySelector('.water-layer').appendChild(waterRenderer.domElement);drawMatte();
  if(visual){prevPanel.style.transform=previousTransform;prevPanel.querySelector('.sky-layer').style.opacity=previousSky;prevPanel.querySelector('.water-layer').style.opacity=previousWater;asset('foreground').style.opacity='0';screenQuad.material.uniforms.before.value=oldTarget.texture;screenQuad.material.uniforms.after.value=newTarget.texture;screenQuad.material.uniforms.blend.value=0;}
  const duration=reduced?.28:visual?.68:.38;
  stats.action=visual?'scene-dissolve':'text-settle';stats.progress=0;
  return new Promise(resolve=>{cut={visual,elapsed:0,duration,resolve,onSwap,swapped:false,from:frozen||prevPanel,to:panels()[activePanel],oldNight,newNight:nightShade,oldFog,newFog:cloudPulse,oldLamp,oldWorldName};});
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
  if(falls.group.visible)falls.update(time,water);
  if(waterRenderer&&(worldName==='waterfall'||cut?.oldWorldName==='waterfall')){waterQuad.material.uniforms.t.value=time;waterQuad.material.uniforms.strength.value=water;waterRenderer.render(waterScene,waterCamera);}
  lanternLight.position.set(view.x+1.5,view.y-.1,view.z-2);lanternLight.intensity=lamp*6*(1+.045*Math.sin(time*7));
 }
 function renderHands(){
  const breath=reduced?0:Math.sin(time*1.15)*.16;
  asset('reachHand').style.opacity=String(ease(hand/.12));
  asset('reachHand').style.transform=`translate3d(${(1-hand)*23}%,${(1-hand)*108+breath*hand}%,0) rotate(${handTurn*24+breath*hand}deg) scale(${.97+.03*hand})`;
  asset('lanternHand').style.opacity=String(ease(lamp/.16));
  asset('lanternHand').style.transform=`translate3d(${(1-lamp)*10}%,${(1-lamp)*62+breath*1.5}%,0) rotate(${lerp(2.1,-.35,lamp)+breath*.6}deg)`;
  const glowLamp=cut&&cut.visual?lerp(cut.oldLamp,lamp,ease(cut.elapsed/cut.duration)):lamp;
  asset('lampGlow').style.opacity=String(glowLamp*glowLamp*.33);asset('lampGlow').style.transform=`translateY(${(1-glowLamp)*22}%)`;
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
    if(a.visual){a.to.style.opacity=String(e);nightShade=lerp(a.oldNight,a.newNight,e);cloudPulse=lerp(a.oldFog,a.newFog,e);screenQuad.material.uniforms.blend.value=e;asset('outgoingForeground').style.opacity=String(1-e);asset('foreground').style.opacity=String(e);}
    if(p===1){if(a.visual){a.from.style.opacity='0';if(a.from.id==='matteFreeze')a.from.replaceChildren();}cut=null;stats.transitions++;stats.action='';stats.progress=0;asset('course').style.setProperty('--copy-opacity','1');asset('outgoingForeground').style.opacity='0';asset('foreground').style.opacity='1';a.resolve(true);}
   }
   updateObjects(dt);renderScene();
  }
  stats.frames++;
 }
 let context,fxGain;
 window.addEventListener('course-audio',e=>{if(fxGain&&context)fxGain.gain.setTargetAtTime(e.detail.muted?0:.8,context.currentTime,.035);});
 function sound(kind){
  if(window.CourseAudio?.getState().muted)return;
  try{
   if(!context){context=new (window.AudioContext||window.webkitAudioContext)();fxGain=context.createGain();fxGain.gain.value=.8;fxGain.connect(context.destination);}context.resume();const length=kind==='water'?3.3:kind==='wood'?2:kind==='birds'?1.4:.6;
   if(kind==='birds'){window.CourseAudio?.bird();return;}
   const buffer=context.createBuffer(1,Math.ceil(context.sampleRate*length),context.sampleRate),a=buffer.getChannelData(0);let previous=0;
   for(let i=0;i<a.length;i++){const t=i/context.sampleRate;previous=(previous+(Math.random()*2-1)*.025)/1.025;const envelope=Math.min(1,t*40)*Math.pow(1-t/length,kind==='water'?.4:2);a[i]=(kind==='water'?previous*3:kind==='wood'||kind==='creak'?Math.sin(t*(125+60*Math.sin(t*7))*6.28)*.28+previous:previous*5)*envelope;}
   const source=context.createBufferSource();source.buffer=buffer;const gain=context.createGain();gain.gain.value=kind==='water'?.3:.22;source.connect(gain).connect(fxGain);source.start();
  }catch(_){/* Media soundtrack remains available. */}
 }

 function setPaused(value){paused=!!value;last=performance.now();if(context){if(paused)context.suspend();else context.resume();}}
 window.CinemaEngine={init,travel,perform,cancel,setPaused,getState:()=>({ready,sceneIndex,worldName,time,paused,busy:!!tween||!!cut,transition:cut?{progress:cut.elapsed/cut.duration,visual:cut.visual}:null,view:{...view},hand,lamp,handTurn,walks,flight,water,celestial,bob,gate:gate?{left:gate.left.rotation.y,right:gate.right.rotation.y}:null,...stats}),destroy(){cancelAnimationFrame(raf);cancel();renderer?.dispose();waterRenderer?.dispose();waterTexture?.dispose();[oldTarget,newTarget,spareTarget].forEach(x=>x?.dispose());context?.close();}};
})();
