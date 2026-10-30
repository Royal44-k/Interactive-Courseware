/* Continuous first-person scene, not slide transforms. All geometries run locally. */
(() => {
 'use strict';
 const T=window.THREE;
 let renderer,world,camera,gate,bridge,forest,falls,clouds,stars,rocks,light,lanternLight;
 let time=0,last=0,paused=false,tween=null,worldName='',sceneIndex=0,walks=0,flight=0,water=0.45;
 let hand=0,lamp=0,handTurn=0,shake=0,bob=0,cloudPulse=0,celestial=0,raf;
 const view={x:0,y:2.4,z:9,tx:0,ty:2.4,tz:-20,fov:54};
 const pointer={x:0,y:0,sx:0,sy:0},stats={frames:0,action:'',progress:0,completed:0};
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const ease=p=>p<.5?4*p*p*p:1-Math.pow(-2*p+2,3)/2;
 const lerp=(a,b,t)=>a+(b-a)*t;
 const asset = id=>document.getElementById(id);
 function cloudTexture(){const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d');for(let i=0;i<28;i++){let x=40+(i*97%180),y=50+(i*61%160),r=25+(i*37%65);let g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'rgba(190,211,210,.12)');g.addColorStop(1,'rgba(190,211,210,0)');ctx.fillStyle=g;ctx.fillRect(0,0,256,256);}return new T.CanvasTexture(c);}
 function makeClouds(){const group=new T.Group(),tex=cloudTexture();for(let i=0;i<30;i++){const mat=new T.MeshBasicMaterial({map:tex,transparent:true,opacity:.2,depthWrite:false,side:T.DoubleSide,color:0xa5bfc0});const m=new T.Mesh(new T.PlaneGeometry(26+i%5*8,7+i%3*3),mat);m.position.set((i*17%70)-35,-1+(i%6)*1.3,-12-(i*11%65));m.userData={x:m.position.x,y:m.position.y,phase:i*1.7};group.add(m);}return group;}
 function makeStars(){const p=new Float32Array(450*3);for(let i=0;i<450;i++){p[i*3]=(Math.sin(i*47.17)*.5)*160;p[i*3+1]=6+(i*37%180)/3;p[i*3+2]=-35-(i*13%70);}const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(p,3));const mat=new T.PointsMaterial({color:0xf5e5b7,size:.12,sizeAttenuation:true,transparent:true,opacity:0,depthWrite:false});return new T.Points(geo,mat);}
 function makeRocks(){const g=new T.Group();for(let i=0;i<10;i++){const m=new T.Mesh(new T.DodecahedronGeometry(.12+(i%3)*.08,1),new T.MeshStandardMaterial({color:0x3f514e,roughness:1}));m.position.set(3.2+(i%3)*.4,5+i*.65,-7-(i%4));m.userData.start=m.position.clone();g.add(m);}return g;}
 function fit(){if(!renderer)return;const w=innerWidth,h=innerHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
 function init(){
  try{renderer=new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:'high-performance'});}catch(e){document.body.classList.add('webgl-unavailable');throw new Error('此浏览器无法创建三维场景，请用支持WebGL的Edge或Chrome打开。');}
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.65));renderer.setClearColor(0x000000,0);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
  renderer.domElement.id='cinemaCanvas';renderer.domElement.setAttribute('aria-label','移动指针观察、点击行动的蜀道场景');asset('world').appendChild(renderer.domElement);
  world=new T.Scene();world.fog=new T.FogExp2(0x102c33,.015);camera=new T.PerspectiveCamera(54,innerWidth/innerHeight,.08,200);
  world.add(new T.HemisphereLight(0xb6ced7,0x1c211d,2.7));light=new T.DirectionalLight(0xffd7a0,3.5);light.position.set(8,14,7);world.add(light);
  world.add(new T.AmbientLight(0x294654,.6));lanternLight=new T.PointLight(0xffa74f,0,18,1.5);world.add(lanternLight);
  gate=CinemaProps.gate();bridge=CinemaProps.walkway();forest=CinemaProps.forest();falls=CinemaProps.waterfall();
  for(const obj of [gate,bridge,forest,falls])world.add(obj.group);
  clouds=makeClouds();stars=makeStars();rocks=makeRocks();world.add(clouds,stars,rocks);
  document.addEventListener('pointermove',e=>{pointer.x=e.clientX/innerWidth*2-1;pointer.y=e.clientY/innerHeight*2-1;});
  let down=null;
  asset('world').addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY};});
  asset('world').addEventListener('pointerup',e=>{if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<8&&!paused&&!tween)document.dispatchEvent(new CustomEvent('cinema-object-action'));down=null;});
  addEventListener('resize',fit);fit();enter(0,false);raf=requestAnimationFrame(frame);
 }
 function environment(i){if(i===1)return'gate';if(i>=4&&i<=8)return'bridge';if(i>=9&&i<=11)return'forest';if(i===12)return'waterfall';if(i===13||i===14)return'pass';return'mountain';}
 function enter(i,continuous=false){
  cancel();sceneIndex=i;const name=environment(i),same=name===worldName;worldName=name;
  gate.group.visible=name==='gate'||name==='pass';bridge.group.visible=name==='bridge';forest.group.visible=name==='forest';falls.group.visible=name==='waterfall';rocks.visible=false;
  if(!continuous||!same){
   celestial=0;
   hand=0;handTurn=0;lamp=name==='forest'?.45:0;walks=0;flight=0;water=.45;shake=0;bob=0;
   Object.assign(view,{x:0,y:2.45,z:9,tx:0,ty:2.7,tz:-25,fov:54});
   if(name==='gate'){gate.reset();gate.group.position.set(.1,-1.8,0);gate.group.scale.setScalar(1.65);view.x=0;view.z=6.2;view.tx=.1;view.ty=2.8;}
   if(name==='bridge'){bridge.reset();view.x=-.15;view.z=9;view.y=2.05;view.tx=1.6;view.ty=.8;bridge.planks[0].visible=i!==4;}
   if(name==='forest'){forest.reset();view.z=9;view.y=2.5;view.tx=1.1;view.ty=3.2;}
   if(name==='waterfall'){falls.reset();rocks.children.forEach(m=>m.position.copy(m.userData.start));view.x=-.4;view.y=2.8;view.tx=2.8;view.ty=3.8;}
   if(name==='pass'){gate.reset();gate.group.position.set(1.8,-2.2,-1);gate.group.scale.setScalar(1.65);view.x=.1;view.y=2.7;view.z=7.4;view.tx=1.5;view.ty=3;}
  }
  if(name!=='bridge')stars.material.opacity=0;
  if(i===7&&!continuous){view.z=2.2;view.ty=6.5;stars.material.opacity=.6;}
  if(i===8&&!continuous){view.z=2.2;view.ty=11;hand=.93;celestial=1;stars.material.opacity=.85;}
  if(i===10&&!continuous){lamp=.92;flight=6;}
  if(i===11&&!continuous){lamp=.42;flight=9;}
  document.documentElement.style.setProperty('--night-shade',String(i>=9&&i<=11?.12:0));
  asset('starSky').style.opacity=String(celestial);
  document.body.dataset.environment=name;document.body.dataset.scene=i;stats.action='';stats.progress=0;
 }
 function animate(name,duration,update){cancel();stats.action=name;stats.progress=0;return new Promise(resolve=>{tween={name,duration,elapsed:0,update,resolve};});}
 function cancel(){if(tween){const old=tween;tween=null;old.resolve(false);}stats.action='';stats.progress=0;cloudPulse=0;}
 async function perform(action){
  const from={...view};
  if(action==='enter')return animate(action,1.2,p=>{cloudPulse=Math.sin(p*Math.PI)*.6;view.z=lerp(from.z,5.8,ease(p));});
  if(action==='open-gate'){
   sound('wood');return animate(action,3.5,p=>{
    const push=ease(Math.min(1,p/.62));hand=Math.sin(Math.min(1,p/.8)*Math.PI)*.82;handTurn=-.13*push;
    gate.left.rotation.y=-1.48*push;gate.right.rotation.y=1.48*push;
    view.z=lerp(from.z,-2.4,ease(Math.max(0,(p-.4)/.6)));view.tx=.1;view.ty=2.8;bob=Math.sin(p*Math.PI*8)*.025;
   });
  }
  if(action==='look-up')return animate(action,2.3,p=>{view.ty=lerp(from.ty,14,ease(p));view.fov=lerp(54,61,ease(p));cloudPulse=.1*Math.sin(p*Math.PI);});
  if(action==='cross-cloud')return animate(action,2.6,p=>{view.z=from.z-p*5;cloudPulse=Math.sin(p*Math.PI)*1.5;lamp=lamp*(1-p*.035);bob=Math.sin(p*22)*.04;});
  if(action==='lay-planks'){
   sound('wood');const plank=bridge.planks[0];plank.visible=true;
   return animate(action,2.8,p=>{const a=ease(Math.min(1,p/.78));hand=Math.sin(p*Math.PI)*.66;plank.position.x=lerp(5.6,1.4,a);plank.position.y=lerp(.8,0,a);plank.rotation.z=lerp(-.15,0,a);plank.rotation.x=Math.sin(a*Math.PI)*.12;view.z=lerp(from.z,7.3,ease(p));});
  }
  if(action==='look-down')return animate(action,2.7,p=>{hand=Math.sin(p*Math.PI)*.45;view.ty=lerp(from.ty,-4.5,ease(p));view.x=lerp(from.x,-.75,ease(p));view.fov=lerp(from.fov,64,ease(p));});
  if(action==='walk'){
   walks++;sound(walks===2?'creak':'step');return animate(action,1.45,p=>{
    view.z=lerp(from.z,from.z-2.1,ease(p));view.ty=lerp(from.ty,.6,ease(Math.min(1,p*2)));view.fov=lerp(from.fov,54,p);view.x=lerp(from.x,.4,ease(p));
    bob=Math.sin(p*Math.PI)*.13;view.y=2.05+bob;hand=Math.sin(p*Math.PI)*.14;
    if(walks===2){const plank=bridge.planks[bridge.brokenIndex];plank.rotation.x=-p*1.5;plank.position.y=-p*p*5;shake=Math.sin(p*45)*.035*(1-p);}
   });
  }
  if(action==='reach')return animate(action,3.1,p=>{view.ty=lerp(from.ty,18,ease(p));view.fov=lerp(from.fov,66,ease(p));hand=lerp(0,.93,ease(Math.min(1,p*1.3)));handTurn=-.1;celestial=ease(p);asset('starSky').style.opacity=String(celestial);stars.material.opacity=ease(p)*.7;});
  if(action==='breathe')return animate(action,2.6,p=>{hand=lerp(.93,.18,ease(p));handTurn=lerp(-.1,.6,ease(p));view.ty=lerp(from.ty,1.4,ease(p));view.y=lerp(from.y,1.4,ease(p));bob=Math.sin(p*12)*.03;});
  if(action==='lantern'){
   sound('birds');return animate(action,2.6,p=>{lamp=lerp(.45,1,ease(p));view.tx=lerp(from.tx,3.3,ease(p));view.ty=lerp(from.ty,4.1,ease(p));if(p>.3)flight+=(1/60);});
  }
  if(action==='listen')return animate(action,2.1,p=>{lamp=lerp(1,.45,ease(p));view.tx=lerp(from.tx,1.1,ease(p));view.ty=lerp(from.ty,5.5,ease(p));});
  if(action==='torrent'){
   sound('water');return animate(action,3.3,p=>{water=lerp(.45,1.3,ease(p));view.z=lerp(from.z,4.8,ease(p));view.tx=lerp(from.tx,4,ease(p));shake=(p>.4?Math.sin(p*95)*.035:0);rocks.children.forEach((m,i)=>{const q=Math.max(0,p-i*.035);m.position.y=m.userData.start.y-q*q*13;m.position.x=m.userData.start.x+q*.7;m.rotation.x=q*5;m.rotation.z=q*3;});});
  }
  if(action==='blocked-gate'){
   sound('impact');return animate(action,2.8,p=>{hand=Math.sin(p*Math.PI)*.9;view.z=lerp(from.z,from.z-1.2,ease(Math.min(1,p*2)));const strain=Math.sin(p*Math.PI)*Math.sin(p*35)*.025;gate.left.rotation.y=-Math.abs(strain);gate.right.rotation.y=Math.abs(strain);shake=strain*.2;});
  }
  if(action==='turn-back')return animate(action,2.8,p=>{view.tx=lerp(from.tx,-11,ease(p));view.x=lerp(from.x,-1.4,ease(p));view.fov=lerp(from.fov,64,ease(p));cloudPulse=Math.sin(p*Math.PI)*.8;});
  if(action==='look-west')return animate(action,2.8,p=>{view.tx=lerp(from.tx,8,ease(p));view.ty=lerp(from.ty,5,ease(p));view.x=lerp(from.x,-1,ease(p));});
  if(action==='settle')return animate(action,2.2,p=>{view.tx=lerp(from.tx,2,ease(p));view.fov=lerp(from.fov,52,ease(p));});
  return true;
 }
 function updateObjects(dt){
  const night=worldName==='forest';light.intensity=night?.7:3.2;light.color.set(night?0xa6c6de:0xffd7a0);
  clouds.children.forEach((m,i)=>{m.position.x=m.userData.x+Math.sin(time*.03+i)*5;m.position.y=m.userData.y+Math.sin(time*.08+i)*.3;m.material.opacity=(night?.13:.17)+cloudPulse*.11;m.lookAt(camera.position.x,camera.position.y,m.position.z+30);});
  stars.rotation.z=Math.sin(time*.04)*.008;
  if(forest.group.visible){if(flight>0)flight+=dt;forest.birds.forEach((b,i)=>{const f=flight>0?Math.max(0,flight-i*.17):0;if(f>0){b.group.position.set(b.origin.x+Math.sin(i*3)*f*1.1,b.origin.y+f*.8,b.origin.z-f*3);b.group.rotation.y=-.3+i*.11;}b.leftWing.rotation.z=Math.sin(time*(f?13:2)+i)* (f?.7:.08);b.rightWing.rotation.z=-b.leftWing.rotation.z;});}
  if(falls.group.visible){falls.update(time,water);asset('waterFlow').setAttribute('dy',String((time*(18+water*14))%160));asset('waterDisplacement').setAttribute('scale',String(7+water*7));}
  lanternLight.position.set(view.x+1.5,view.y-.1,view.z-2);lanternLight.intensity=lamp*6*(1+.08*Math.sin(time*11));
  if(!tween)bob*=.92;
 }
 function renderHands(){
  const reach=asset('reachHand'),lantern=asset('lanternHand');
  if(reach){reach.style.opacity=hand>.015?'1':'0';reach.style.transform=`translate(${(1-hand)*23}%,${(1-hand)*92}%) rotate(${handTurn*35+Math.sin(time*1.7)*.3}deg)`;}
  if(lantern){lantern.style.opacity=lamp>.01?'1':'0';lantern.style.transform=`translate(${(1-lamp)*12}%,${(1-lamp)*65+Math.sin(time*1.9)*1.1}%) rotate(${Math.sin(time*1.7)*1.3}deg)`;}
  asset('lampGlow').style.opacity=String(lamp*lamp*.33);asset('lampGlow').style.transform=`translateY(${(1-lamp)*22}%)`;
 }
 function frame(now){
  raf=requestAnimationFrame(frame);const dt=Math.min(.04,(now-last)/1000||.016);last=now;
  if(!paused){
   time+=dt;pointer.sx+=(pointer.x-pointer.sx)*.04;pointer.sy+=(pointer.y-pointer.sy)*.04;
   if(tween){const active=tween;active.elapsed+=dt;const p=Math.min(1,active.elapsed/active.duration);stats.progress=p;active.update(p);document.documentElement.style.setProperty('--action-progress',`${p*100}%`);if(p===1){tween=null;stats.completed++;stats.action='';stats.progress=0;shake=0;bob=0;cloudPulse=0;active.resolve(true);}}
   updateObjects(dt);renderHands();
   const drift=reduced?0:Math.sin(time*.3)*.012;camera.position.set(view.x+pointer.sx*.18+shake,view.y+pointer.sy*.07+bob,view.z);camera.fov=view.fov;camera.lookAt(view.tx+pointer.sx*.6,view.ty-pointer.sy*.3+drift,view.tz);camera.updateProjectionMatrix();
   const bg=asset('scenery');if(bg){const py=Math.max(-7,Math.min(9,(view.ty-3)*.62));const px=Math.max(-6,Math.min(6,(view.tx-2)*-.38));bg.style.transform=`scale(1.22) translate(${-pointer.sx*.5+px}%,${pointer.sy*.28+py}%)`;}
   asset('fogCurtain').style.opacity=String(Math.min(.91,cloudPulse*.6));
  }
  renderer.render(world,camera);stats.frames++;
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
 function setPaused(value){paused=!!value;if(context){if(paused)context.suspend();else context.resume();}}
 window.CinemaEngine={init,enter,perform,cancel,setPaused,getState:()=>({sceneIndex,worldName,time,paused,busy:!!tween,view:{...view},hand,lamp,walks,flight,water,gate:gate?{left:gate.left.rotation.y,right:gate.right.rotation.y}:null,...stats}),destroy(){cancelAnimationFrame(raf);cancel();renderer?.dispose();context?.close();}};
})();
