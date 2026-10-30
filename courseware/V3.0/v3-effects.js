/* Local bird articulation and water on the lens share the pausable scene clock. */
(() => {
 'use strict';const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const NS='http://www.w3.org/2000/svg';let bird,head,jaw,body,tail,lid,last=-1,scene=-1,blinkAt=3+Math.random()*5,blinkStart=-10,call=0;
 function makeBird(){
  bird=document.createElementNS(NS,'svg');bird.setAttribute('viewBox','0 0 1672 941');bird.setAttribute('preserveAspectRatio','xMidYMid slice');bird.classList.add('cuckoo-rig');bird.setAttribute('aria-hidden','true');
  bird.innerHTML=`<defs>
   <clipPath id="cuckoo-body"><path d="M1090 279 Q1113 265 1166 269 Q1201 284 1232 316 Q1319 376 1351 515 L1270 495 Q1194 485 1150 469 L1101 483 L1103 454 Q1071 392 1067 337 Z"/></clipPath>
   <clipPath id="cuckoo-tail"><path d="M1248 624 L1306 634 Q1351 724 1376 839 Q1377 874 1352 860 Q1310 837 1290 780 Z"/></clipPath>
   <clipPath id="cuckoo-head"><path clip-rule="evenodd" d="M1024 215 Q1056 204 1086 218 Q1114 204 1149 219 Q1183 231 1194 267 L1199 297 Q1155 302 1108 323 L1080 286 L1086 254 L1021 239 L1022 232 L1079 231 Z M1015 231 L1098 243 L1101 257 L1070 247 L1015 241 Z"/></clipPath>
   <clipPath id="cuckoo-jaw"><path d="M1021 235 Q1056 228 1089 244 L1101 254 Q1062 245 1021 239 Z"/></clipPath>
  </defs>
  <g class="bird-tail"><image width="1672" height="941" clip-path="url(#cuckoo-tail)"/></g>
  <g class="bird-body"><image width="1672" height="941" clip-path="url(#cuckoo-body)"/></g>
  <g class="bird-head"><image width="1672" height="941" clip-path="url(#cuckoo-head)"/><g class="bird-jaw"><image width="1672" height="941" clip-path="url(#cuckoo-jaw)"/></g><ellipse class="bird-lid" cx="1108" cy="236" rx="8" ry="7" fill="#8a969f" opacity="0"/><path d="M1101 237 Q1108 240 1116 236" stroke="#253841" stroke-width="1.4" fill="none" class="bird-lid-line" opacity="0"/></g>`;
  bird.querySelectorAll('image').forEach(el=>el.setAttribute('href',V3_PLATES.bird));head=bird.querySelector('.bird-head');jaw=bird.querySelector('.bird-jaw');body=bird.querySelector('.bird-body');tail=bird.querySelector('.bird-tail');lid=bird.querySelector('.bird-lid');
 }
 const wet=document.createElement('canvas');wet.id='wetGlass';wet.setAttribute('aria-hidden','true');document.querySelector('#course').appendChild(wet);const c=wet.getContext('2d');let w,h,scale,drops=[],spray=[],streaks=[],wetAlpha=0,lastBurst=-1,splashCount=0,wiped=0,surfaceRect=null,sheets=[],secondImpact=false,previousAction="",impactTotal=0;
 const background=new Image(),detail=new Image(),surface=document.createElement('canvas'),surfaceCtx=surface.getContext('2d'),waveFilm=document.createElement('canvas'),waveCtx=waveFilm.getContext('2d');background.src='assets/waterfall-bg.png';detail.src='assets/waterfall-detail.png';
 function fit(){w=innerWidth;h=innerHeight;scale=Math.min(devicePixelRatio,1.25);wet.width=w*scale;wet.height=h*scale;wet.style.width=w+'px';wet.style.height=h+'px';c.setTransform(scale,0,0,scale,0,0);}fit();addEventListener('resize',fit);
 function deposit(x,y,r){drops.push({x,y,r,v:0,age:0,wait:.18+Math.random()*1.7,life:7+Math.random()*5,phase:Math.random()*20,trail:null});}
 function burst(power=1,impact=false){splashCount++;if(reduced){for(let i=0;i<8;i++)deposit(w*(.35+Math.random()*.6),h*(.2+Math.random()*.55),2+Math.random()*4);return;}
  if(impact){impactTotal++;sheets.push({age:0,life:1.65,power,phase:Math.random()*8});}
  // Perspective spray travels from the torrent towards the viewer, then wets the lens.
  for(let i=0;i<Math.round((impact?58:30)*power);i++)spray.push({sx:w*(.73+Math.random()*.13),sy:h*(.55+Math.random()*.18),tx:w*(.14+Math.random()*.84),ty:h*(.10+Math.random()*.80),age:0,life:.22+Math.random()*.56,r:(impact?3:1.8)+Math.random()*6,arc:h*(.015+Math.random()*.10),land:Math.random()<.84});
 }
 function sheetPath(sheet,ctx=c){const t=sheet.age,reach=1-Math.pow(1-Math.min(1,t/.32),3),drain=Math.max(0,Math.min(1,(t-.24)/1.4)),x=w*(1.12-.91*reach+.18*drain),y=h*(.64-.83*reach+1.15*drain),deep=h*(.10+1.30*reach),wide=w-x;
  ctx.moveTo(w*1.14,y);for(let j=0;j<=180;j++){const q=j/180,edge=x+w*(.1*Math.sin(q*8+sheet.phase)+.045*Math.sin(q*25+sheet.phase*.7)+.012*Math.sin(q*59+sheet.phase)+.16*(.5-q));ctx.lineTo(edge,y+q*deep);}ctx.lineTo(w*1.14,y+deep);ctx.closePath();return {x,y,wide,deep};
 }
 function drawSheets(img){if(!sheets.length)return;if(waveFilm.width!==Math.ceil(w*.5)||waveFilm.height!==Math.ceil(h*.5)){waveFilm.width=Math.ceil(w*.5);waveFilm.height=Math.ceil(h*.5);}waveCtx.setTransform(waveFilm.width/w,0,0,waveFilm.height/h,0,0);waveCtx.clearRect(0,0,w,h);for(const sh of sheets){const attack=Math.min(1,sh.age/.12),fade=Math.max(0,1-sh.age/sh.life),alpha=wetAlpha*attack*fade*sh.power;waveCtx.save();waveCtx.beginPath();const r=sheetPath(sh,waveCtx);waveCtx.clip();
   waveCtx.globalAlpha=alpha*.30;waveCtx.drawImage(surface,-12*fade,8*fade,w,h);const g=waveCtx.createLinearGradient(r.x,r.y,r.x+r.wide,r.y+r.deep);g.addColorStop(0,'#b7dedf18');g.addColorStop(.32,'#a8d4dc08');g.addColorStop(.72,'#416c7808');g.addColorStop(1,'#dbf3ee10');waveCtx.globalAlpha=alpha;waveCtx.fillStyle=g;waveCtx.fillRect(0,0,w,h);waveCtx.restore();
   // Fine, irregular mist around the impact; no closed outline around the water sheet.
   c.save();c.globalAlpha=alpha*.17;const mist=c.createRadialGradient(w*.76,h*.61,8,w*.76,h*.61,w*.39);mist.addColorStop(0,'#d8f3ed');mist.addColorStop(.25,'#c5e5e066');mist.addColorStop(1,'#bddbd900');c.fillStyle=mist;c.fillRect(0,0,w,h);c.restore();
  }c.save();c.filter='blur(7px)';c.drawImage(waveFilm,0,0,w,h);c.restore();}
 function wipe(x=w*.5,y=h*.5,r=Math.max(w,h)){drops=drops.filter(d=>Math.hypot(d.x-x,d.y-y)>r);streaks=streaks.filter(d=>!d.points.some(p=>Math.hypot(p.x-x,p.y-y)<r));for(const d of drops)if(d.trail&&!streaks.includes(d.trail))d.trail=null;if(r>=Math.max(w,h))sheets=[];wiped++;}
 document.addEventListener('pointermove',e=>{if(e.buttons===1&&CinemaEngine.getState().sceneIndex===16&&!Courseware.getState().modal&&!e.target.closest('button,input,textarea,select'))wipe(e.clientX,e.clientY,65);});
 document.addEventListener('click',e=>{if(e.target.closest('[data-wipe-water]'))wipe();});
 function prepareSurface(s,panel){if(surface.width!==Math.ceil(w*.7)||surface.height!==Math.ceil(h*.7)){surface.width=Math.ceil(w*.7);surface.height=Math.ceil(h*.7);}const ctx=surfaceCtx;ctx.setTransform(surface.width/w,0,0,surface.height/h,0,0);ctx.clearRect(0,0,w,h);const paint=(img,r,alpha)=>{if(!img.complete||!img.naturalWidth||!r)return;const k=Math.max(r.width/img.naturalWidth,r.height/img.naturalHeight);ctx.globalAlpha=alpha;ctx.drawImage(img,r.x+(r.width-img.naturalWidth*k)/2,r.y+(r.height-img.naturalHeight*k)/2,img.naturalWidth*k,img.naturalHeight*k);};paint(background,panel?.getBoundingClientRect(),1);paint(detail,panel?.querySelector('.vista-layer')?.getBoundingClientRect(),s.vista);ctx.globalAlpha=1;
  // Match the scene's vignette before refraction, so wet tracks stay transparent.
  const side=ctx.createLinearGradient(0,0,w,0);side.addColorStop(0,'rgba(3,14,21,.77)');side.addColorStop(.28,'rgba(3,14,21,.35)');side.addColorStop(.58,'rgba(3,14,21,0)');ctx.fillStyle=side;ctx.fillRect(0,0,w,h);const shade=ctx.createLinearGradient(0,h,0,0);shade.addColorStop(0,'rgba(2,12,19,.96)');shade.addColorStop(.14,'rgba(2,12,19,.46)');shade.addColorStop(.34,'rgba(2,12,19,0)');shade.addColorStop(.80,'rgba(2,12,19,0)');shade.addColorStop(1,'rgba(2,12,19,.38)');ctx.fillStyle=shade;ctx.fillRect(0,0,w,h);
 }
 function sampleSurface(img,dx=0,dy=0){c.drawImage(surface,dx,dy,w,h);}
 function pathFor(d){const points=d.points;for(let side=0;side<2;side++){for(let j=0;j<points.length;j++){const i=side?points.length-1-j:j,p=points[i],t=i/Math.max(1,points.length-1),radius=d.r*(.16+.84*Math.min(1,t*4))*(.82+.18*Math.sin(i*.67+d.phase)),x=p.x+(side?1:-1)*radius;if(!side&&!j)c.moveTo(x,p.y);else c.lineTo(x,p.y);}}c.closePath();}
 function drawFilm(img){if(!streaks.length)return;
  // A refracting strip stays on the glass after the leading bead has passed.
  for(let band=0;band<4;band++){const group=streaks.filter(d=>Math.min(3,Math.floor(d.age/2.125))===band);if(!group.length)continue;c.save();c.beginPath();group.forEach(pathFor);c.clip();c.globalAlpha=wetAlpha*.34*(1-band/4);sampleSurface(img,-5,1.5);c.fillStyle='#bdd5d806';c.fillRect(0,0,w,h);c.restore();}
  for(const d of streaks){const fade=Math.exp(-d.age/5.5)*wetAlpha,p=d.points;if(p.length<2)continue;c.lineJoin='round';c.lineCap='round';
   for(const side of [-1,1]){c.beginPath();p.forEach((pt,i)=>{const t=i/(p.length-1),radius=d.r*(.16+.84*Math.min(1,t*4))*(.82+.18*Math.sin(i*.67+d.phase)),x=pt.x+side*radius;i?c.lineTo(x,pt.y):c.moveTo(x,pt.y);});c.strokeStyle=side<0?`rgba(222,241,240,${.15*fade})`:`rgba(8,34,43,${.18*fade})`;c.lineWidth=side<0?.65:.8;c.stroke();}
   c.beginPath();p.forEach((pt,i)=>i?c.lineTo(pt.x,pt.y):c.moveTo(pt.x,pt.y));c.lineWidth=Math.max(.6,d.r*.8);c.strokeStyle=`rgba(173,208,212,${.09*fade})`;c.stroke();
  }
 }
 function lens(d,alpha,img){const r=d.r,running=d.v>6,rx=running?r*.43:r*.76,ry=running?r*1.28:r*.83;c.save();c.globalAlpha=alpha;c.beginPath();
  // A narrow neck feeds an elongated, asymmetrical front. It is never a falling circle.
  c.moveTo(d.x-rx*.16,d.y-ry*1.6);c.bezierCurveTo(d.x-rx*.48,d.y-ry*.55,d.x-rx*1.2,d.y+ry*.15,d.x-rx*.65,d.y+ry*.75);c.bezierCurveTo(d.x-rx*.2,d.y+ry*1.07,d.x+rx*.9,d.y+ry*.72,d.x+rx,d.y+ry*.2);c.bezierCurveTo(d.x+rx,d.y-ry*.32,d.x+rx*.2,d.y-ry*.9,d.x+rx*.12,d.y-ry*1.6);c.closePath();c.clip();c.globalAlpha=alpha*(running?.43:.52);sampleSurface(img,-1.9,1);const g=c.createLinearGradient(d.x-rx,d.y,d.x+rx,d.y);g.addColorStop(0,'#d6eceb60');g.addColorStop(.3,'#b1ced212');g.addColorStop(.8,'#10313b14');g.addColorStop(1,'#0a263666');c.fillStyle=g;c.fillRect(d.x-rx*1.3,d.y-ry*1.6,rx*2.6,ry*2.8);c.restore();
 }
 function water(dt,s){const active=s.sceneIndex===16,target=active?1:0;wetAlpha+=(target-wetAlpha)*(1-Math.exp(-dt/(active?.2:.38)));
  if(active&&s.action==='torrent'&&previousAction!=='torrent'){lastBurst=-1;secondImpact=false;}
  previousAction=s.action;
  if(active&&s.action==='torrent'&&s.progress>.28){if(lastBurst<0){burst(1.20,true);lastBurst=s.time;}else if(s.progress>.52&&!secondImpact){burst(.82,true);secondImpact=true;lastBurst=s.time;}else if(s.progress<.78&&s.time-lastBurst>1.4){burst(.32,false);lastBurst=s.time;}}
  c.clearRect(0,0,w,h);if(wetAlpha<.003){drops=[];spray=[];streaks=[];sheets=[];return;}const img=s.vista>.45?detail:background,panel=[...document.querySelectorAll('.backdrop')].sort((a,b)=>(+b.style.zIndex||0)-(+a.style.zIndex||0))[0];prepareSurface(s,panel);
  for(const sh of sheets)sh.age+=dt;sheets=sheets.filter(sh=>sh.age<sh.life);drawSheets(img);
  for(const d of streaks)d.age+=dt;
  for(const d of drops){d.age+=dt;if(d.age>d.wait&&!reduced){if(!d.trail){d.trail={r:Math.max(.65,d.r*.45),age:0,phase:d.phase,points:[{x:d.x,y:d.y}]};streaks.push(d.trail);}d.v=Math.min(115+d.r*3,d.v+dt*(16+d.r*4));d.x+=Math.sin(d.y*.031+d.phase)*d.v*dt*.10;d.y+=d.v*dt;const points=d.trail.points,prev=points.at(-1);if(d.y-prev.y>3.5)points.push({x:d.x,y:d.y});d.trail.age=0;}}
  // Nearby beads can join; their existing wet tracks remain behind on the glass.
  for(let i=0;i<drops.length;i++){const a=drops[i];if(a.joined||a.v<6)continue;for(let j=i+1;j<drops.length;j++){const b=drops[j];if(b.joined||Math.abs(a.y-b.y)>6)continue;if(Math.hypot(a.x-b.x,a.y-b.y)<(a.r+b.r)*.45){a.r=Math.min(10.5,Math.sqrt(a.r*a.r+b.r*b.r));a.v=Math.max(a.v,b.v);b.joined=true;}}}
  drawFilm(img);for(const d of drops){if(d.joined)continue;const fade=Math.min(1,d.age*7,Math.max(0,(d.life-d.age)*1.2));lens(d,wetAlpha*fade,img);}drops=drops.filter(d=>!d.joined&&d.y<h+20&&d.age<d.life).slice(-105);streaks=streaks.filter(d=>d.age<8.5).slice(-130);
  for(const p of spray){p.age+=dt;const u=Math.min(1,p.age/p.life),q=u*.45+u*u*.55,x=p.sx+(p.tx-p.sx)*q,y=p.sy+(p.ty-p.sy)*q-Math.sin(Math.PI*u)*p.arc,r=.4+p.r*u*u,angle=Math.atan2(p.ty-p.sy,p.tx-p.sx);c.save();c.translate(x,y);c.rotate(angle);c.globalAlpha=wetAlpha*(.18+u*.50);const g=c.createRadialGradient(-r*.2,-r*.2,0,0,0,r*1.8);g.addColorStop(0,'#f0fffaad');g.addColorStop(.45,'#cceae65c');g.addColorStop(1,'#80b8c100');c.fillStyle=g;c.beginPath();c.ellipse(0,0,r*(1.2+u*.8),r*.65,0,0,Math.PI*2);c.fill();c.restore();if(u===1&&p.land)deposit(p.tx,p.ty,p.r);}
  spray=spray.filter(p=>p.age<p.life);
 }
 function tick(){requestAnimationFrame(tick);const s=window.CinemaEngine?.getState();if(!s?.ready||s.time===last)return;const dt=last<0?0:Math.min(.1,s.time-last);last=s.time;if(s.sceneIndex!==scene){scene=s.sceneIndex;lastBurst=-1;}
  if(s.sceneIndex===15){if(!bird)makeBird();const panel=[...document.querySelectorAll('.backdrop')].sort((a,b)=>(+b.style.zIndex||0)-(+a.style.zIndex||0))[0];if(bird.parentElement!==panel)panel.appendChild(bird);bird.style.opacity=String(1-s.vista);
   const a=CourseAudio.getState(),env=CUCKOO_ENVELOPE,level=a.effectActive&&a.effectSource==='cuckoo.ogg'?env.values[Math.min(env.values.length-1,Math.floor(a.effectTime/env.step))]||0:0;
   call+=(level-call)*(1-Math.exp(-dt/.045));const tilt=reduced?0:(Math.sin(s.time*.41)*.65+Math.sin(s.time*.137+1)*.7-call*.65);
   head.setAttribute('transform',`rotate(${tilt} 1153 290)`);jaw.setAttribute('transform',`rotate(${16*(1-call)} 1093 250)`);body.setAttribute('transform',`translate(1120 468) scale(1 ${1+(reduced?0:Math.sin(s.time*1.1)*.0025+call*.005)}) translate(-1120 -468)`);tail.setAttribute('transform',`rotate(${reduced?0:Math.sin(s.time*.73)*.28} 1280 635)`);
   if(s.time>blinkAt){blinkStart=s.time;blinkAt=s.time+3+Math.random()*6;}const blink=Math.max(0,1-Math.abs(s.time-blinkStart-.10)/.10);lid.setAttribute('opacity',String(blink));bird.querySelector('.bird-lid-line').setAttribute('opacity',String(blink));
  }else if(bird?.parentElement&&!bird.parentElement.style.backgroundImage.includes('v3-cuckoo-forest'))bird.remove();
  water(dt,s);
 }tick();window.SceneLife={wipe,getState:()=>({scene,time:last,call,beakAngle:16*(1-call),drops:drops.length,streaks:streaks.length,splashCount,wiped,wetAlpha,running:drops.filter(d=>d.v>6).length,longestTrail:Math.max(0,...streaks.map(d=>d.points.at(-1).y-d.points[0].y)),runningHeadAspect:.43/1.28,spray:spray.length,sheets:sheets.length,impactTotal})};
})();
