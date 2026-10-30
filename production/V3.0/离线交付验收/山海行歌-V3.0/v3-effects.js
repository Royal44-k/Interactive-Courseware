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
 const wet=document.createElement('canvas');wet.id='wetGlass';wet.setAttribute('aria-hidden','true');document.querySelector('#course').appendChild(wet);const c=wet.getContext('2d');let w,h,scale,drops=[],spray=[],streaks=[],wetAlpha=0,lastBurst=-1,splashCount=0,wiped=0;
 const background=new Image(),detail=new Image();background.src='assets/waterfall-bg.png';detail.src='assets/waterfall-detail.png';
 function fit(){w=innerWidth;h=innerHeight;scale=Math.min(devicePixelRatio,1.25);wet.width=w*scale;wet.height=h*scale;wet.style.width=w+'px';wet.style.height=h+'px';c.setTransform(scale,0,0,scale,0,0);}fit();addEventListener('resize',fit);
 function burst(power=1){splashCount++;for(let i=0;i<(reduced?8:36)*power;i++){const x=w*(.34+Math.random()*.62),y=h*(.18+Math.random()*.58),r=2+Math.random()*7;drops.push({x,y,r,v:0,age:0,wait:Math.random()*2.4+.3,life:5+Math.random()*6,slip:0});}if(!reduced)for(let i=0;i<48;i++)spray.push({x:w*.77,y:h*.66,vx:(Math.random()-.65)*w*.6,vy:-h*(.15+Math.random()*.6),age:0,life:.35+Math.random()*.55,r:1+Math.random()*3});}
 function wipe(x=w*.5,y=h*.5,r=Math.max(w,h)){drops=drops.filter(d=>Math.hypot(d.x-x,d.y-y)>r);streaks=streaks.filter(d=>Math.hypot(d.x-x,d.y-y)>r);wiped++;}
 document.addEventListener('pointermove',e=>{if(e.buttons===1&&CinemaEngine.getState().sceneIndex===16&&!Courseware.getState().modal&&!e.target.closest('button,input,textarea,select'))wipe(e.clientX,e.clientY,65);});
 document.addEventListener('click',e=>{if(e.target.closest('[data-wipe-water]'))wipe();});
 function lens(d,alpha,img){const r=d.r,elong=1+Math.min(.6,d.v/300);c.save();c.globalAlpha=alpha;c.beginPath();c.ellipse(d.x,d.y,r,r*elong,0,0,Math.PI*2);c.clip();
  if(img.complete&&img.naturalWidth){const k=Math.max(w/img.naturalWidth,h/img.naturalHeight),ox=(w-img.naturalWidth*k)/2,oy=(h-img.naturalHeight*k)/2;c.filter='brightness(1.16) contrast(1.10)';c.drawImage(img,(d.x-ox-r*1.8)/k,(d.y-oy-r*1.8)/k,r*3.6/k,r*3.6/k,d.x-r,d.y-r*elong,r*2,r*2*elong);c.filter='none';}
  const g=c.createRadialGradient(d.x-r*.3,d.y-r*.4,0,d.x,d.y,r*1.3);g.addColorStop(0,'#c8e6e52b');g.addColorStop(.7,'#719da112');g.addColorStop(1,'#06212985');c.fillStyle=g;c.fillRect(d.x-r,d.y-r*elong,r*2,r*2*elong);c.restore();c.save();c.globalAlpha=alpha*.58;c.strokeStyle='#daf4f0';c.lineWidth=.7;c.beginPath();c.ellipse(d.x-r*.08,d.y-r*.1,r*.78,r*elong*.78,0,Math.PI*1.07,Math.PI*1.64);c.stroke();c.restore();
 }
 function water(dt,s){const active=s.sceneIndex===16,target=active?1:0;wetAlpha+=(target-wetAlpha)*(1-Math.exp(-dt/(active?.2:.32)));if(active&&s.action==='torrent'&&s.progress>.28){if(lastBurst<0){burst(1.6);lastBurst=s.time;}else if(s.progress<.78&&s.time-lastBurst>1.2+Math.random()*.6){burst(.35);lastBurst=s.time;}}
  c.clearRect(0,0,w,h);if(wetAlpha<.003){drops=[];spray=[];streaks=[];return;}
  const image=s.vista>.45?detail:background;
  for(const d of drops){d.age+=dt;if(d.age>d.wait&&!reduced){const prevY=d.y;d.v=Math.min(145, d.v+dt*(22+d.r*5));d.y+=d.v*dt;d.slip+=dt;d.x+=Math.sin(d.slip*2+d.r)*dt*.7;streaks.push({x:d.x,y:prevY,end:d.y,r:Math.max(.6,d.r*.22),age:0});}const fade=Math.min(1,d.age*7,Math.max(0,(d.life-d.age)*1.2));lens(d,wetAlpha*fade*.85,image);}
  drops=drops.filter(d=>d.y<h+20&&d.age<d.life).slice(-110);
  for(const d of streaks){d.age+=dt;c.strokeStyle=`rgba(180,218,220,${wetAlpha*.10*Math.exp(-d.age*2.2)})`;c.lineWidth=d.r;c.lineCap='round';c.beginPath();c.moveTo(d.x,d.y);c.lineTo(d.x,d.end);c.stroke();}streaks=streaks.filter(d=>d.age<1.2).slice(-900);
  for(const p of spray){p.age+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=h*.8*dt;c.fillStyle=`rgba(223,246,246,${wetAlpha*.4*(1-p.age/p.life)})`;c.beginPath();c.ellipse(p.x,p.y,p.r,p.r*1.6,0,0,Math.PI*2);c.fill();}spray=spray.filter(p=>p.age<p.life);
 }
 function tick(){requestAnimationFrame(tick);const s=window.CinemaEngine?.getState();if(!s?.ready||s.time===last)return;const dt=last<0?0:Math.min(.1,s.time-last);last=s.time;if(s.sceneIndex!==scene){scene=s.sceneIndex;lastBurst=-1;}
  if(s.sceneIndex===15){if(!bird)makeBird();const panel=[...document.querySelectorAll('.backdrop')].sort((a,b)=>(+b.style.zIndex||0)-(+a.style.zIndex||0))[0];if(bird.parentElement!==panel)panel.appendChild(bird);bird.style.opacity=String(1-s.vista);
   const a=CourseAudio.getState(),env=CUCKOO_ENVELOPE,level=a.effectActive&&a.effectSource==='cuckoo.ogg'?env.values[Math.min(env.values.length-1,Math.floor(a.effectTime/env.step))]||0:0;
   call+=(level-call)*(1-Math.exp(-dt/.045));const tilt=reduced?0:(Math.sin(s.time*.41)*.65+Math.sin(s.time*.137+1)*.7-call*.65);
   head.setAttribute('transform',`rotate(${tilt} 1153 290)`);jaw.setAttribute('transform',`rotate(${16*(1-call)} 1093 250)`);body.setAttribute('transform',`translate(1120 468) scale(1 ${1+(reduced?0:Math.sin(s.time*1.1)*.0025+call*.005)}) translate(-1120 -468)`);tail.setAttribute('transform',`rotate(${reduced?0:Math.sin(s.time*.73)*.28} 1280 635)`);
   if(s.time>blinkAt){blinkStart=s.time;blinkAt=s.time+3+Math.random()*6;}const blink=Math.max(0,1-Math.abs(s.time-blinkStart-.10)/.10);lid.setAttribute('opacity',String(blink));bird.querySelector('.bird-lid-line').setAttribute('opacity',String(blink));
  }else if(bird?.parentElement&&!bird.parentElement.style.backgroundImage.includes('v3-cuckoo-forest'))bird.remove();
  water(dt,s);
 }tick();window.SceneLife={wipe,getState:()=>({scene,time:last,call,beakAngle:16*(1-call),drops:drops.length,streaks:streaks.length,splashCount,wiped,wetAlpha})};
})();
