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
 let waterRenderer,waterScene,waterCamera,waterQuad,waterTexture,seaTexture,fallDetailTexture,streamDetailTexture;
 let time=0,last=0,paused=false,tween=null,cut=null,worldName='',sceneIndex=0,walks=0,flight=0,water=.45;
 let hand=0,lamp=0,handTurn=0,shake=0,bob=0,cloudPulse=0,celestial=0,nightShade=0,waterPhase=0,raf;
 let activePanel=0,ready=false,starOpacity=0;
 const view={x:0,y:2.45,z:9,tx:0,ty:2.7,tz:-25,fov:54};
 const pointer={x:0,y:0,sx:0,sy:0};
 const stats={frames:0,action:'',progress:0,completed:0,transitions:0,frameGaps:0,maxFrameMs:0};
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const panels=()=>[asset('backdropA'),asset('backdropB')];
 const mode=i=>COURSE_STORY[i].world;
 let lookProgress=0,knock=0,knockTap=0;
 let push=0,food=0,foodNear=0,foodEaten=0,swallow=0,cupNear=0,armSweep=0,swordHigh=0,fade=0,sceneAge=0,pan=0;
 let cup=0,sword=0,chop=0,sail=0,daylight=0,vista=0,vistaName='',shotZoom=1;
 const currentShot=()=>COURSE_STORY[sceneIndex];
 const panelStyle=new Map();
 function matteTransform(v){
  if(sceneIndex===0)return "scale(1.02)";
  const pitch=Math.atan2(v.ty-v.y,Math.abs(v.tz-v.z));
  const yaw=Math.atan2(v.tx-v.x,Math.abs(v.tz-v.z));
  const x=Math.max(-5.8,Math.min(5.8,-yaw*22)),y=Math.max(-6.6,Math.min(8.4,pitch*21));
  const sweep=currentShot().pan?pan:0;
  return `scale(${(currentShot().pan?1.32:1.12)*shotZoom}) translate(${-pointer.sx*.32+x+sweep*7.2}%,${pointer.sy*.18+y+swallow*.35}%)`;
 }
 function drawMatte(){
  const panel=panels()[activePanel];if(!panel)return;
  panel.style.transform=matteTransform(view)+(worldName==='sea'?` rotate(${Math.sin(time*.65)*.1}deg) translateY(${Math.sin(time*.75)*.12}%)`:'');
  panel.querySelector('.sky-layer').style.opacity=String(celestial);
  const v=panel.querySelector('.vista-layer');v.style.opacity=String(vista);
  if(vistaName)v.style.backgroundImage=`url("assets/${vistaName}.png")`;
  panel.style.filter=worldName==='sea'?`brightness(${.62+daylight*.38})`:'none';
  panel.querySelector('.water-layer').style.opacity=worldName==='stream'?String(vista):worldName==='waterfall'||(worldName==='sea'&&currentShot().bg==='dawn-sea')?'1':'0';
  const look=panel.querySelector('.look-layer'),sequence=currentShot().views;
  if(sequence){const frames=[currentShot().bg,...sequence],q=clamp(lookProgress)*(frames.length-1),k=Math.min(frames.length-2,Math.floor(q));v.style.backgroundImage=`url("assets/${frames[k]}.png")`;v.style.opacity='1';look.style.backgroundImage=`url("assets/${frames[k+1]}.png")`;look.style.opacity=String(ease(q-k));}else look.style.opacity='0';
  if(waterRenderer){waterQuad.material.uniforms.detailMix.value=['waterfall','stream'].includes(worldName)?vista:0;waterQuad.material.uniforms.isStream.value=worldName==='stream'?1:0;}
  asset('nightShade').style.opacity=String(nightShade);
  asset('motionShade').style.opacity=String(fade);
  asset('breathShade').style.opacity=String(Math.abs(swallow)*.19);
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
  seaTexture=await new Promise((resolve,reject)=>new T.TextureLoader().load(window.SEA_PLATE_DATA,resolve,undefined,reject));seaTexture.colorSpace=T.SRGBColorSpace;delete window.SEA_PLATE_DATA;
  fallDetailTexture=await new Promise((r,j)=>new T.TextureLoader().load(window.DETAIL_PLATES.fall,r,undefined,j));fallDetailTexture.colorSpace=T.SRGBColorSpace;
  streamDetailTexture=await new Promise((r,j)=>new T.TextureLoader().load(window.DETAIL_PLATES.stream,r,undefined,j));streamDetailTexture.colorSpace=T.SRGBColorSpace;delete window.DETAIL_PLATES;
  waterRenderer=new T.WebGLRenderer({alpha:true,antialias:false,powerPreference:'high-performance'});waterRenderer.setPixelRatio(Math.min(devicePixelRatio,1.25));waterRenderer.setClearColor(0,0);waterRenderer.outputColorSpace=T.SRGBColorSpace;
  waterRenderer.domElement.className='water-motion-canvas';waterScene=new T.Scene();waterCamera=new T.OrthographicCamera(-1,1,1,-1,0,1);
  waterQuad=new T.Mesh(new T.PlaneGeometry(2,2),new T.ShaderMaterial({depthTest:false,depthWrite:false,toneMapped:false,uniforms:{plate:{value:waterTexture},t:{value:0},strength:{value:.45},isSea:{value:0},detailPlate:{value:fallDetailTexture},detailMix:{value:0},isStream:{value:0},aspect:{value:innerWidth/innerHeight}},
   vertexShader:'varying vec2 uvScreen;void main(){uvScreen=uv;gl_Position=vec4(position.xy,0.0,1.0);}',
   fragmentShader:`uniform sampler2D plate,detailPlate;uniform float t,strength,aspect,isSea,detailMix,isStream;varying vec2 uvScreen;
    void main(){vec2 uv=uvScreen;float ratio=(1672.0/941.0)/aspect;if(ratio>1.0)uv.x=(uv.x-.5)/ratio+.5;else uv.y=(uv.y-.5)*ratio+.5;
     float m=smoothstep(.54,.66,uv.x)*(1.0-smoothstep(.91,1.0,uv.x));if(isSea>.5)m=(1.0-smoothstep(.49,.55,uv.y))*(1.0-smoothstep(.54,.76,uv.x));vec2 flow=uv;
     if(isStream>.5)m=0.;float wave=sin(uv.y*83.0+t*2.6+sin(uv.x*41.0+t*.4));float fine=sin(uv.y*157.0+t*4.2+uv.x*80.0);
     flow.x+=m*(wave*.0011+fine*.00045)*(.65+strength*.45);flow.y+=m*sin(uv.y*57.0+t*2.1+uv.x*18.0)*.0015;
     if(isSea>.5){flow=uv;flow.x+=m*sin(uv.y*110.0+t*1.8+uv.x*15.0)*.002;flow.y+=m*sin(uv.y*69.0-t*1.4+uv.x*17.0)*.0018;}vec3 color=texture2D(plate,flow).rgb;
     if(detailMix>0.0){float dm=smoothstep(.49,.7,uv.x);if(isStream>.5)dm=smoothstep(.26,.42,uv.x)*(1.0-smoothstep(.83,.96,uv.x))*smoothstep(.2,.4,uv.y)*smoothstep(.008,.025,abs(uv.x-(.57+(.83-uv.y)*.36)));
     if(isStream>.5){vec2 a=vec2(.566,.834),b=vec2(.538,.601),ab=b-a;float q=clamp(dot(uv-a,ab)/dot(ab,ab),0.,1.);float lineDistance=length(uv-a-ab*q);dm*=smoothstep(.004,.013,lineDistance);}
     vec2 d=uv;d.x+=dm*sin(uv.y*94.0+t*2.6+uv.x*14.0)*.0016;d.y+=dm*sin(uv.x*55.0-t*2.4)*.0012;vec3 dc=texture2D(detailPlate,d).rgb;float am=mix(m,dm,detailMix);color=(color*m*(1.0-detailMix)+dc*dm*detailMix)/max(am,.0001);m=am;}gl_FragColor=vec4(color,m);
     #include <colorspace_fragment>
     gl_FragColor.rgb*=gl_FragColor.a;
    }`}));waterScene.add(waterQuad);fit();await waterRenderer.compileAsync(waterScene,waterCamera);waterRenderer.render(waterScene,waterCamera);waterQuad.material.uniforms.plate.value=seaTexture;waterQuad.material.uniforms.isSea.value=1;waterRenderer.render(waterScene,waterCamera);waterQuad.material.uniforms.plate.value=waterTexture;waterQuad.material.uniforms.isSea.value=0;
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
  const birdGroups=new Set(forest.birds.map(b=>b.group));forest.group.children.forEach(o=>{if(!birdGroups.has(o))o.visible=false;});
  [gate,bridge,forest,falls].forEach(o=>world.add(o.group));clouds=makeClouds();stars=makeStars();rocks=makeRocks();rocks.visible=false;world.add(clouds,stars,rocks);
  panels().forEach(el=>{el.innerHTML='<div class="sky-layer"></div><div class="water-layer"></div><div class="vista-layer"></div><div class="look-layer"></div>';el.style.opacity='0';});
  makeCompositor();fit();setScene(0,false);panels()[0].style.opacity='1';panels()[0].style.backgroundImage='url("assets/mountains.png")';renderScene();
  document.addEventListener('pointermove',e=>{pointer.x=e.clientX/innerWidth*2-1;pointer.y=e.clientY/innerHeight*2-1;});
  let down;asset('world').addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY};});asset('world').addEventListener('pointerup',e=>{if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<8&&!paused&&!tween&&!cut)document.dispatchEvent(new CustomEvent('cinema-object-action'));down=null;});
  addEventListener('resize',fit);
  JourneyEffects.init();
  const images=[...new Set([...COURSE_STORY.flatMap(s=>[s.bg,s.vista,...(s.views||[])]).filter(Boolean),'hand-reach','lantern-hand','cup-hand','sword-hand','sail-cloth','stars-bg','food-hand','empty-hand','v2-knock-hand'])];
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
  const shot=COURSE_STORY[i];window.dropSoundPlayed=false;push=food=foodNear=foodEaten=swallow=cupNear=armSweep=swordHigh=0;sceneAge=0;pan=shot.pan?-1:0;lookProgress=knock=knockTap=0;cup=shot.initialCup||0;sword=shot.initialSword||0;chop=0;sail=shot.initialSail||0;daylight=i>=22?1:0;vista=0;vistaName=shot.vista||'';shotZoom=1;
  clouds.visible=i!==0&&!['banquet','sea','gate','stream','ice','snow'].includes(name);
  gate.group.visible=name==='gate';bridge.group.visible=false;forest.group.visible=name==='forest';falls.group.visible=name==='waterfall';
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
  if(name==='stars'){starOpacity=.65;view.ty=4;}
  if(name==='forest')lamp=shot.initialLamp??.23;
  if(name!=='stars')starOpacity=0;
  if(name==='trail'){view.ty=2.7;view.z=9;view.x=0;view.tx=0;}
  gate.group.traverse(m=>{if(m.material){m.material.transparent=true;m.material.opacity=1;}});
  nightShade=name==='forest'?.12:0;
  document.body.dataset.environment=name;document.body.dataset.scene=i;
 }
 function snapshotForeground(){
  const copies=[];
  for(const bank of [asset('outgoingForeground'),asset('foreground')]){
   const alpha=+getComputedStyle(bank).opacity;if(alpha<.002)continue;
   for(const el of bank.querySelectorAll('img')){const s=getComputedStyle(el),opacity=+s.opacity*alpha;if(opacity<.002)continue;const copy=el.cloneNode(false);copy.removeAttribute('id');for(const key of ['width','height','right','left','top','bottom','filter','transform','transformOrigin','objectFit'])copy.style[key]=s[key];copy.style.opacity=String(opacity);copies.push(copy);}
  }
  copies.forEach(el=>{el.style.transition='none';});asset('outgoingForeground').replaceChildren(...copies);asset('outgoingForeground').style.opacity='1';
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
  const same=continuous&&mode(i)===worldName&&COURSE_STORY[i].bg===currentShot().bg&&vista===0,visual=!same;
  const oldNight=nightShade,oldFog=cloudPulse,oldLamp=lamp,oldWorldName=worldName,oldFade=fade;
  const interrupted=!!cut?.visual;
  if(visual){captureWorld();snapshotForeground();JourneyEffects.capture();}
  const frozen=visual&&interrupted?snapshotInterruptedMatte():null;
  cancel();const prevPanel=panels()[activePanel];const previousTransform=prevPanel.style.transform;
  const previousSky=prevPanel.querySelector('.sky-layer').style.opacity;
  const previousWater=prevPanel.querySelector('.water-layer').style.opacity;
  const previousVista=prevPanel.querySelector('.vista-layer').style.cssText,previousFilter=prevPanel.style.filter;
  if(visual){activePanel=1-activePanel;const incoming=panels()[activePanel];incoming.style.backgroundImage=`url("assets/${COURSE_STORY[i].bg}.png")`;incoming.style.opacity='0';incoming.style.zIndex=frozen?'3':'1';prevPanel.style.zIndex='0';prevPanel.style.opacity=frozen?'0':'1';}
  setScene(i,continuous);if(['waterfall','sea','stream'].includes(worldName)&&waterRenderer){panels()[activePanel].querySelector('.water-layer').appendChild(waterRenderer.domElement);waterQuad.material.uniforms.plate.value=worldName==='sea'?seaTexture:waterTexture;waterQuad.material.uniforms.isSea.value=worldName==='sea'?1:0;waterQuad.material.uniforms.detailPlate.value=worldName==='stream'?streamDetailTexture:fallDetailTexture;}drawMatte();
  if(visual){prevPanel.style.transform=previousTransform;prevPanel.querySelector('.sky-layer').style.opacity=previousSky;prevPanel.querySelector('.water-layer').style.opacity=previousWater;prevPanel.querySelector('.vista-layer').style.cssText=previousVista;prevPanel.style.filter=previousFilter;asset('foreground').style.opacity='0';screenQuad.material.uniforms.before.value=oldTarget.texture;screenQuad.material.uniforms.after.value=newTarget.texture;screenQuad.material.uniforms.blend.value=0;}
  const duration=reduced?.28:visual?.68:.38;
  stats.action=visual?'scene-dissolve':'text-settle';stats.progress=0;
  return new Promise(resolve=>{cut={visual,elapsed:0,duration,resolve,onSwap,swapped:false,from:frozen||prevPanel,to:panels()[activePanel],oldNight,newNight:nightShade,oldFog,newFog:cloudPulse,oldLamp,oldWorldName,oldFade};});
 }
 function animate(name,duration,update,hold=.7){
  cancel();stats.action=name;stats.progress=0;
  const shot=currentShot(),cues=shot.cues||[],lang=window.CourseAudio?.getState().voiceLang==='en'?'-en':'';
  duration=Math.max(duration,shot.baseDuration||0);
  // Each spoken beat owns its own interval. A long reading must not stretch
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
  // Monotone Hermite slopes preserve velocity across spoken-beat boundaries.
  const slopes=segments.map(s=>(s.to-s.from)/(s.end-s.start));
  segments.forEach((s,k)=>{const rate=slopes[k];s.v0=k?2*slopes[k-1]*rate/(slopes[k-1]+rate):0;s.v1=k<slopes.length-1?2*rate*slopes[k+1]/(rate+slopes[k+1]):0;});
  const scheduled=cues.map((c,k)=>({...c,start:segments[k+1].start}));
  duration=end;hold=Math.min(hold,.45);
  return new Promise(resolve=>{tween={name,duration,hold,elapsed:0,update,resolve,cues:scheduled,cueIndex:0,segments};update(0);});
 }
 function perform(action){
  const cue=()=>{};
  if(sceneIndex===15)window.CourseAudio?.cuckoo();
  const f={...view},h=hand,r=handTurn,l=lamp,w=water,c=celestial;
  const cameraTo=(goal,p)=>{for(const k of Object.keys(goal))view[k]=lerp(f[k],goal[k],p);};
  if(action==='enter')return animate(action,.55,p=>{cloudPulse=.16*pulse(p,0,.4,.6,1);},.08);
  if(action==='open-gate'){
   sound('wood');const left=gate.left.rotation.y,right=gate.right.rotation.y;
   return animate(action,6.4,p=>{push=pulse(p,0,.23,.68,1);hand=0;armSweep=phase(p,.24,.76);const opening=phase(p,.25,.82);gate.left.rotation.y=lerp(left,-1.48,opening);gate.right.rotation.y=lerp(right,1.48,opening);cameraTo({z:-2.2},phase(p,.48,1));bob=reduced?0:Math.sin(p*Math.PI*4)*.012*pulse(p,.5,.6,.85,1);cue(p<.36?'touch':'open',p<.36?'双手抵门，灯影初开。':'缓缓推开，入席听心。',p<.36?'Both hands meet the doors.':'Push gently; enter the light.');},.35);
  }
  if(action==='look-up')return animate(action,1.5,p=>{cameraTo({ty:12.2,fov:57},ease(p));},.32);
  if(action==='cross-cloud')return animate(action,1.7,p=>{cameraTo({z:f.z-2.8},ease(p));cloudPulse=.5*pulse(p,0,.52,.7,1);lamp=lerp(l,l*.8,ease(p));bob=Math.sin(p*Math.PI*4)*.017*Math.sin(Math.PI*p)**2;},.2);
  if(action==='walk'){
   walks++;sound('step');return animate(action,4.8,p=>{vista=phase(p,.19,.69);shotZoom=1+.018*Math.sin(p*Math.PI);pan=lerp(-1,.65,ease(p));bob=reduced?0:Math.sin(p*Math.PI*6)*.018*Math.sin(p*Math.PI)**2;},.7);
  }
  if(action==='cup')return animate(action,16,p=>{
   cup=pulse(p,.015,.105,.255,.335);cupNear=pulse(p,.11,.18,.215,.285);
   food=pulse(p,.365,.49,.875,.98);foodNear=pulse(p,.51,.675,.745,.875);foodEaten=phase(p,.682,.70);
   swallow=reduced?0:Math.sin(phase(p,.70,.79)*Math.PI*2)*pulse(p,.70,.72,.77,.79);
   if(p<.34)cue('cup','举樽浅酌，轻轻放下。','Raise the cup, sip, and lower it gently.');
   else if(p<.67)cue('taste','取一箸珍馐，缓缓送近。','Lift a morsel and bring it closer.');
   else if(p<.82)cue('swallow','浅尝，咽下；心事仍未散。','A taste, a swallow; the heart remains restless.');
   else cue('lower','空箸退回，轻落案边。','The empty chopsticks withdraw and settle.');
  },.4);
  if(action==='drop')return animate(action,6.5,p=>{
   cup=pulse(p,.01,.12,.18,.30);cupNear=.16*pulse(p,.04,.12,.18,.30);food=pulse(p,.32,.48,.65,.93);foodNear=.12*pulse(p,.38,.51,.56,.68);foodEaten=0;chop=phase(p,.76,.94);
   if(p>.82&&!window.dropSoundPlayed){window.dropSoundPlayed=true;sound('wood');}
   cue(p<.54?'hesitate':'stop',p<.54?'欲食又止，箸停半途。':'投箸落案，不能食。',p<.54?'The hand hesitates, short of the mouth.':'Chopsticks fall. I cannot eat.');
  },.65);
  if(action==='sword'){
   sound('steel');food=cup=0;return animate(action,10.8,p=>{sword=phase(p,.035,.28);swordHigh=phase(p,.48,.73);cameraTo({tx:-5},pulse(p,.2,.36,.47,.64));view.tx+=4.8*pulse(p,.5,.66,.76,.89);fade=phase(p,.87,1);cue(p<.3?'draw':p<.75?'gaze':'dark',p<.3?'拔剑出鞘。':p<.75?'四顾茫茫，去路何方？':'灯火渐远，心入苍茫。',p<.3?'The blade leaves its sheath.':p<.75?'Looking all around—where is the way?':'The lamplight fades into distance.');},0);
  }
  if(action==='four-views')return animate(action,25,p=>{
   lookProgress=(phase(p,0,.15)+phase(p,.24,.39)+phase(p,.49,.64)+phase(p,.74,.89))/4;const points=[[0,2.7],[-7,2.8],[-1,12],[7,4],[0,-5]],q=lookProgress*4,k=Math.min(3,Math.floor(q)),e=ease(q-k);view.tx=lerp(points[k][0],points[k+1][0],e);view.ty=lerp(points[k][1],points[k+1][1],e);shotZoom=1+.015*Math.sin(p*Math.PI);
  },1.4);
  if(action==='sun-river')return animate(action,20,p=>{vista=phase(p,.43,.76);view.ty=lerp(lerp(f.ty,10,phase(p,0,.15)),-4,phase(p,.40,.84));},1.5);
  if(action==='fortress'){
   let tapped=-1;return animate(action,23,p=>{lookProgress=.5*phase(p,.10,.34)+.5*phase(p,.39,.62);knock=pulse(p,.62,.70,.88,.98);knockTap=0;
    for(let i=0;i<3;i++){const a=.72+i*.055;knockTap+=pulse(p,a,a+.012,a+.022,a+.044);if(p>=a+.016&&tapped<i){tapped=i;sound('impact');}}
    view.tx=lerp(0,1.8,pulse(p,.10,.30,.42,.62));shotZoom=1+.018*phase(p,.62,.9);
   },1.4);
  }
  if(action==='survey')return animate(action,4.5,p=>{pan=lerp(-1,1,ease(p));},.6);
  if(['turn-vista','up-vista','down-vista','moon-vista','back-vista'].includes(action)){
   const goal=action==='down-vista'?{ty:-3.2}:action==='turn-vista'||action==='back-vista'?{tx:7.2}:{ty:10.5};
   return animate(action,2.1,p=>{cameraTo(goal,ease(p));vista=phase(p,sceneIndex===15?.62:.18,sceneIndex===15?.98:.83);sword=1-phase(p,.05,.75);if(action!=='turn-vista')sword=0;lamp=lerp(l,0,phase(p,.02,.67));
    if(worldName==='pass')gate.group.traverse(m=>{if(m.material)m.material.opacity=1-vista;});
   },.7);
  }
  if(action==='ice-step')return animate(action,3.8,p=>{vista=phase(p,.21,.79);cameraTo({ty:-1.8},ease(p));},.7);
  if(action==='snow-look')return animate(action,2,p=>{cameraTo({ty:11,fov:57},ease(p));vista=phase(p,.18,.85);shotZoom=1+.02*ease(p);},.65);
  if(action==='reach-breathe')return animate(action,7,p=>{hand=pulse(p,.02,.3,.71,1);handTurn=-.25*phase(p,.05,.35)+1.3*phase(p,.65,.96);armSweep=pulse(p,.08,.4,.72,1);cameraTo({ty:12},pulse(p,0,.4,.65,1));swallow=reduced?0:-.8*pulse(p,.73,.82,.9,1);cue(p<.64?'stars':'sigh',p<.64?'仰胁息，伸手向星河。':'以手抚膺，徒然长叹。',p<.64?'Hold your breath; reach into the stars.':'Hand towards the chest; breathe a long sigh.');},1.25);
  if(action==='fish')return animate(action,4.2,p=>{vista=phase(p,.16,.8);cameraTo({ty:-2},ease(p));},.7);
  if(action==='dawn'){const d0=daylight;return animate(action,3.6,p=>{daylight=lerp(d0,1,ease(p));cameraTo({ty:5},ease(p));},.8);}
  if(action==='sail'){sound('wind');return animate(action,3.8,p=>{sail=phase(p,.45,.88);daylight=1;},1);}
  if(action==='reach')return animate(action,1.5,p=>{cameraTo({ty:15,fov:58},phase(p,0,.92));hand=lerp(h,.96,phase(p,.09,.73));handTurn=lerp(r,-.08,phase(p,.14,.87));celestial=lerp(c,1,phase(p,.08,.84));starOpacity=celestial*.65;},.55);
  if(action==='breathe')return animate(action,1.65,p=>{hand=lerp(h,0,phase(p,0,.83));handTurn=lerp(r,.3,phase(p,0,.8));cameraTo({ty:1.5,y:f.y-.32,fov:55},phase(p,.17,1));},.5);
  if(action==='lantern'){
   let triggered=false;return animate(action,6.5,p=>{lamp=lerp(l,1,phase(p,0,.27));armSweep=pulse(p,.24,.55,.72,1);vista=phase(p,.38,.86);pan=lerp(-1,1,phase(p,.3,1));if(p>.32&&!triggered){triggered=true;flight=.001;sound('birds');}cue(p<.42?'light':'distance',p<.42?'提灯，照见古木。':'循声远望，山谷在月色中展开。',p<.42?'Lift the lantern towards the ancient tree.':'Follow the call into the moonlit valley.');},.7);
  }
  if(action==='listen')return animate(action,1.15,p=>{lamp=lerp(l,.38,ease(p));cameraTo({tx:1.1,ty:4.6},ease(p));},.45);
  if(action==='torrent'){
   sound('water');return animate(action,3.8,p=>{water=lerp(w,1.3,ease(p));vista=phase(p,.2,.86);cameraTo({z:6.2,tx:3.4},ease(p));shake=reduced?0:Math.sin(p*52)*.006*pulse(p,.2,.5,.75,1);},.6);
  }
  if(action==='blocked-gate'){
   sound('impact');return animate(action,3.6,p=>{hand=0;push=pulse(p,.02,.3,.7,1);armSweep=.06;cameraTo({z:f.z-.6},phase(p,.12,.75));const strain=Math.sin(p*25)*.012*pulse(p,.28,.4,.65,.83);gate.left.rotation.y=-Math.abs(strain);gate.right.rotation.y=Math.abs(strain);shake=strain*.28;},.42);
  }
  if(action==='turn-back')return animate(action,1.8,p=>{cameraTo({tx:-8,x:-.85,fov:57},ease(p));},.28);
  if(action==='look-west')return animate(action,1.6,p=>{cameraTo({tx:6.2,ty:4.5,x:-.65},ease(p));},.4);
  if(action==='settle')return animate(action,1.2,p=>{cameraTo({tx:2,fov:54},ease(p));},.4);
  return Promise.resolve(true);
 }
 function updateObjects(dt){
  const night=worldName==='forest'||worldName==='stars';light.intensity=night?.7:3.2;light.color.set(night?0xa6c6de:0xffd7a0);
  clouds.children.forEach((m,i)=>{m.position.x=m.userData.x+Math.sin(time*.03+i)*5;m.position.y=m.userData.y+Math.sin(time*.08+i)*.3;m.material.opacity=(night?.13:.17)+cloudPulse*.08;m.lookAt(camera.position.x,camera.position.y,m.position.z+30);});
  stars.material.opacity=starOpacity;stars.rotation.z=Math.sin(time*.04)*.008;
  if(forest.group.visible){
   if(flight>0)flight+=dt;
   forest.birds.forEach((b,i)=>{const f=flight>0?Math.max(0,flight-i*.12):0,launch=phase(f,0,.45),distance=f*f/(f+.45);
    if(f>0){b.group.position.set(b.origin.x+Math.sin(i*3)*distance*.9,b.origin.y+distance*.65,b.origin.z-distance*3);b.group.rotation.y=lerp(-.25+i*.19,-.3+i*.11,launch);}
    b.group.visible=f>0;b.group.traverse(m=>{if(m.material){m.material.transparent=true;m.material.opacity=launch*(1-vista);}});
    const wing=lerp(Math.sin(time*2+i)*.05,Math.sin(f*13+i)*.66,launch);b.leftWing.rotation.z=wing;b.rightWing.rotation.z=-wing;
   });
  }
  if(falls.group.visible)falls.update(time,water);
  if(waterRenderer&&(['waterfall','sea','stream'].includes(worldName)||['waterfall','sea','stream'].includes(cut?.oldWorldName))){waterQuad.material.uniforms.t.value=time;waterQuad.material.uniforms.strength.value=water;waterRenderer.render(waterScene,waterCamera);}
  lanternLight.position.set(view.x+1.5,view.y-.1,view.z-2);lanternLight.intensity=lamp*6*(1+.045*Math.sin(time*7));
 }
 function renderHands(){
  const kh=asset('knockHand');kh.style.opacity=String(ease(knock/.1));kh.style.transform=`translate3d(${(1-knock)*20-knockTap*1.3}%,${(1-knock)*105-knockTap*2.2}%,0) rotate(${-knockTap*2.5}deg) scale(${1-knockTap*.018})`;
  const breath=reduced?0:Math.sin(time*1.15)*.1;
  asset('cupHand').style.opacity=String(ease(cup/.08));
  asset('cupHand').style.transform=`translate3d(${(1-cup)*-8+cupNear*34}%,${(1-cup)*85-cupNear*17+breath}%,0) rotate(${-5+cup*5+cupNear*11}deg) scale(${1+cupNear*.2})`;
  asset('swordHand').style.opacity=String(ease(sword/.06));
  asset('swordHand').style.transform=`translate3d(${(1-sword)*24-swordHigh*7}%,${(1-sword)*105-swordHigh*13+breath}%,0) rotate(${(1-sword)*33+swordHigh*25}deg)`;
  const sticks=asset('chopsticks');sticks.style.opacity=String(chop);sticks.style.transform=`translateY(${(1-chop)*-50}px) rotate(${12+chop*9}deg)`;
  const foodTransform=`translate3d(${(1-food)*48-foodNear*12}%,${(1-food)*100+foodNear*78}%,0) rotate(${(1-food)*7-foodNear*4}deg) scale(${1+foodNear*.32})`;
  asset('foodHand').style.transform=foodTransform;asset('emptyHand').style.transform=foodTransform;
  asset('foodHand').style.opacity=String(ease(food/.08)*(1-foodEaten));asset('emptyHand').style.opacity=String(ease(food/.08)*foodEaten);
  asset('reachHand').style.opacity=String(ease(hand/.12));
  asset('reachHand').style.transform=`translate3d(${(1-hand)*22-armSweep*14}%,${(1-hand)*110-armSweep*18+breath*hand}%,0) rotate(${handTurn*24}deg)`;
  for(const [id,direction] of [['pushLeft',-1],['pushRight',1]]){const el=asset(id);el.style.opacity=String(ease(push/.12));el.style.transform=`translate3d(${direction*armSweep*30}%,${(1-push)*105}%,0) rotate(${direction*armSweep*9}deg) scaleX(${direction})`;}
  asset('lanternHand').style.opacity=String(ease(lamp/.16));
  asset('lanternHand').style.transform=`translate3d(${(1-lamp)*12-armSweep*14}%,${(1-lamp)*82+Math.sin(armSweep*Math.PI)*-5+breath}%,0) rotate(${2-lamp*2-armSweep*5}deg)`;
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
   time+=dt;sceneAge+=dt;if(!tween&&currentShot().pan&&!reduced)pan=Math.min(1,pan+dt*.07);const decay=1-Math.exp(-dt/0.22);pointer.sx+=(pointer.x-pointer.sx)*decay;pointer.sy+=(pointer.y-pointer.sy)*decay;
   if(tween){const a=tween,nextCue=a.cues[a.cueIndex],due=nextCue&&(a.elapsed+dt)>=nextCue.start;
    const blocked=due&&window.CourseAudio?.getState().pending;
    if(!blocked){a.elapsed+=dt;if(due){a.cueIndex++;window.dispatchEvent(new CustomEvent('cinema-cue',{detail:{...nextCue,zh:nextCue.zh.replaceAll('|',''),en:nextCue.en.replaceAll('|',''),scene:sceneIndex}}));}}
    const part=a.segments.find(s=>a.elapsed<s.end)||a.segments.at(-1);
    const u=part?clamp((a.elapsed-part.start)/(part.end-part.start)):1,u2=u*u,u3=u2*u;
    const p=part?(2*u3-3*u2+1)*part.from+(u3-2*u2+u)*(part.end-part.start)*part.v0+(-2*u3+3*u2)*part.to+(u3-u2)*(part.end-part.start)*part.v1:1;
    stats.progress=p;a.update(p);
    if(a.elapsed>=a.duration+a.hold&&!window.CourseAudio?.getState().pending){tween=null;stats.completed++;stats.action='';stats.progress=0;a.resolve(true);}
   }
   if(cut){const a=cut;a.elapsed+=dt;const p=clamp(a.elapsed/a.duration),e=ease(p);stats.progress=p;fade=a.oldFade*(1-e);
    if(!a.swapped&&p>=.34){a.swapped=true;a.onSwap?.();}
    asset('course').style.setProperty('--copy-opacity',String(p<.34?1-phase(p,0,.3):phase(p,.39,1)));
    if(a.visual){a.to.style.opacity=String(e);nightShade=lerp(a.oldNight,a.newNight,e);cloudPulse=lerp(a.oldFog,a.newFog,e);screenQuad.material.uniforms.blend.value=e;asset('outgoingForeground').style.opacity=String(1-e);asset('foreground').style.opacity=String(e);}
    if(p===1){if(a.visual){a.from.style.opacity='0';if(a.from.id==='matteFreeze')a.from.replaceChildren();}cut=null;stats.transitions++;stats.action='';stats.progress=0;asset('course').style.setProperty('--copy-opacity','1');asset('outgoingForeground').style.opacity='0';asset('foreground').style.opacity='1';a.resolve(true);}
   }
   updateObjects(dt);renderScene();JourneyEffects.update(dt,time,{world:worldName,sceneIndex,vista,sail,daylight,cut:cut?{old:cut.oldWorldName,p:ease(cut.elapsed/cut.duration)}:null,view:{...view},shotZoom});
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
 window.CinemaEngine={init,travel,perform,cancel,setPaused,getState:()=>({ready,sceneIndex,worldName,time,paused,busy:!!tween||!!cut,transition:cut?{progress:cut.elapsed/cut.duration,visual:cut.visual}:null,view:{...view},lookProgress,knock,knockTap,push,food,foodNear,foodEaten,swallow,cupNear,armSweep,swordHigh,fade,pan,hand,lamp,handTurn,walks,flight,water,celestial,bob,cup,sword,chop,sail,daylight,vista,vistaName,shotZoom,gate:gate?{left:gate.left.rotation.y,right:gate.right.rotation.y}:null,...stats}),destroy(){cancelAnimationFrame(raf);cancel();renderer?.dispose();waterRenderer?.dispose();waterTexture?.dispose();seaTexture?.dispose();fallDetailTexture?.dispose();streamDetailTexture?.dispose();[oldTarget,newTarget,spareTarget].forEach(x=>x?.dispose());context?.close();}};
})();

