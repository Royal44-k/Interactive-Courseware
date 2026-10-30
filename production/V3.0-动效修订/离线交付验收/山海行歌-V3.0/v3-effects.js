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
 const wet=document.createElement('canvas');wet.id='wetGlass';wet.setAttribute('aria-hidden','true');document.querySelector('#course').appendChild(wet);const c=wet.getContext('2d');let w,h,scale,drops=[],spray=[],streaks=[],wetAlpha=0,lastBurst=-1,splashCount=0,wiped=0,surfaceRect=null;
 const background=new Image(),detail=new Image();background.src='assets/waterfall-bg.png';detail.src='assets/waterfall-detail.png';
 function fit(){w=innerWidth;h=innerHeight;scale=Math.min(devicePixelRatio,1.25);wet.width=w*scale;wet.height=h*scale;wet.style.width=w+'px';wet.style.height=h+'px';c.setTransform(scale,0,0,scale,0,0);}fit();addEventListener('resize',fit);
 function burst(power=1){splashCount++;for(let i=0;i<(reduced?8:31)*power;i++){const x=w*(.30+Math.random()*.66),y=h*(.12+Math.random()*.62),r=2+Math.random()*6;drops.push({x,y,r,v:0,age:0,wait:.25+Math.random()*1.9,life:7+Math.random()*5,phase:Math.random()*20,trail:null});}if(!reduced)for(let i=0;i<44;i++)spray.push({x:w*.77,y:h*.66,vx:(Math.random()-.65)*w*.6,vy:-h*(.15+Math.random()*.6),age:0,life:.35+Math.random()*.55,r:.7+Math.random()*2});}
 function wipe(x=w*.5,y=h*.5,r=Math.max(w,h)){drops=drops.filter(d=>Math.hypot(d.x-x,d.y-y)>r);streaks=streaks.filter(d=>!d.points.some(p=>Math.hypot(p.x-x,p.y-y)<r));for(const d of drops)if(d.trail&&!streaks.includes(d.trail))d.trail=null;wiped++;}
 document.addEventListener('pointermove',e=>{if(e.buttons===1&&CinemaEngine.getState().sceneIndex===16&&!Courseware.getState().modal&&!e.target.closest('button,input,textarea,select'))wipe(e.clientX,e.clientY,65);});
 document.addEventListener('click',e=>{if(e.target.closest('[data-wipe-water]'))wipe();});
 function sampleSurface(img,dx=0,dy=0){if(!img.complete||!img.naturalWidth)return;const r=surfaceRect||{x:0,y:0,width:w,height:h},k=Math.max(r.width/img.naturalWidth,r.height/img.naturalHeight);c.drawImage(img,r.x+(r.width-img.naturalWidth*k)/2+dx,r.y+(r.height-img.naturalHeight*k)/2+dy,img.naturalWidth*k,img.naturalHeight*k);}
 function pathFor(d){const points=d.points;for(let side=0;side<2;side++){for(let j=0;j<points.length;j++){const i=side?points.length-1-j:j,p=points[i],t=i/Math.max(1,points.length-1),radius=d.r*(.16+.84*Math.min(1,t*4))*(.82+.18*Math.sin(i*.67+d.phase)),x=p.x+(side?1:-1)*radius;if(!side&&!j)c.moveTo(x,p.y);else c.lineTo(x,p.y);}}c.closePath();}
 function drawFilm(img){if(!streaks.length)return;
  // A refracting strip stays on the glass after the leading bead has passed.
  c.save();c.beginPath();streaks.forEach(pathFor);c.clip();c.globalAlpha=wetAlpha*.30;sampleSurface(img,-3,1.5);c.fillStyle='#bdd5d80d';c.fillRect(0,0,w,h);c.restore();
  for(const d of streaks){const fade=Math.exp(-d.age/5.5)*wetAlpha,p=d.points;if(p.length<2)continue;c.lineJoin='round';c.lineCap='round';
   for(const side of [-1,1]){c.beginPath();p.forEach((pt,i)=>{const t=i/(p.length-1),radius=d.r*(.16+.84*Math.min(1,t*4))*(.82+.18*Math.sin(i*.67+d.phase)),x=pt.x+side*radius;i?c.lineTo(x,pt.y):c.moveTo(x,pt.y);});c.strokeStyle=side<0?`rgba(222,241,240,${.19*fade})`:`rgba(8,34,43,${.13*fade})`;c.lineWidth=side<0?.65:.6;c.stroke();}
   c.beginPath();p.forEach((pt,i)=>i?c.lineTo(pt.x,pt.y):c.moveTo(pt.x,pt.y));c.lineWidth=Math.max(.6,d.r*.8);c.strokeStyle=`rgba(173,208,212,${.09*fade})`;c.stroke();
  }
 }
 function lens(d,alpha,img){const r=d.r,running=d.v>6,rx=running?r*.43:r*.76,ry=running?r*1.28:r*.83;c.save();c.globalAlpha=alpha;c.beginPath();
  // A narrow neck feeds an elongated, asymmetrical front. It is never a falling circle.
  c.moveTo(d.x-rx*.16,d.y-ry*1.6);c.bezierCurveTo(d.x-rx*.48,d.y-ry*.55,d.x-rx*1.2,d.y+ry*.15,d.x-rx*.65,d.y+ry*.75);c.bezierCurveTo(d.x-rx*.2,d.y+ry*1.07,d.x+rx*.9,d.y+ry*.72,d.x+rx,d.y+ry*.2);c.bezierCurveTo(d.x+rx,d.y-ry*.32,d.x+rx*.2,d.y-ry*.9,d.x+rx*.12,d.y-ry*1.6);c.closePath();c.clip();c.globalAlpha=alpha*(running?.43:.52);sampleSurface(img,-1.9,1);const g=c.createLinearGradient(d.x-rx,d.y,d.x+rx,d.y);g.addColorStop(0,'#d6eceb60');g.addColorStop(.3,'#b1ced212');g.addColorStop(.8,'#10313b14');g.addColorStop(1,'#0a263666');c.fillStyle=g;c.fillRect(d.x-rx*1.3,d.y-ry*1.6,rx*2.6,ry*2.8);c.restore();
 }
 function water(dt,s){const active=s.sceneIndex===16,target=active?1:0;wetAlpha+=(target-wetAlpha)*(1-Math.exp(-dt/(active?.2:.38)));if(active&&s.action==='torrent'&&s.progress>.28){if(lastBurst<0){burst(1.6);lastBurst=s.time;}else if(s.progress<.78&&s.time-lastBurst>1.4){burst(.30);lastBurst=s.time;}}
  c.clearRect(0,0,w,h);if(wetAlpha<.003){drops=[];spray=[];streaks=[];return;}const img=s.vista>.45?detail:background,panel=[...document.querySelectorAll('.backdrop')].sort((a,b)=>(+b.style.zIndex||0)-(+a.style.zIndex||0))[0];surfaceRect=(s.vista>.45?panel?.querySelector('.vista-layer'):panel)?.getBoundingClientRect();
  for(const d of streaks)d.age+=dt;
  for(const d of drops){d.age+=dt;if(d.age>d.wait&&!reduced){if(!d.trail){d.trail={r:Math.max(.65,d.r*.45),age:0,phase:d.phase,points:[{x:d.x,y:d.y}]};streaks.push(d.trail);}d.v=Math.min(115+d.r*3,d.v+dt*(16+d.r*4));d.x+=Math.sin(d.y*.031+d.phase)*d.v*dt*.10;d.y+=d.v*dt;const points=d.trail.points,prev=points.at(-1);if(d.y-prev.y>3.5)points.push({x:d.x,y:d.y});d.trail.age=0;}}
  drawFilm(img);
  for(const d of drops){const fade=Math.min(1,d.age*7,Math.max(0,(d.life-d.age)*1.2));lens(d,wetAlpha*fade,img);}drops=drops.filter(d=>d.y<h+20&&d.age<d.life).slice(-90);streaks=streaks.filter(d=>d.age<8.5).slice(-110);
  for(const p of spray){p.age+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=h*.8*dt;c.fillStyle=`rgba(223,246,246,${wetAlpha*.3*(1-p.age/p.life)})`;c.beginPath();c.ellipse(p.x,p.y,p.r,p.r*1.6,0,0,Math.PI*2);c.fill();}spray=spray.filter(p=>p.age<p.life);
 }
 function tick(){requestAnimationFrame(tick);const s=window.CinemaEngine?.getState();if(!s?.ready||s.time===last)return;const dt=last<0?0:Math.min(.1,s.time-last);last=s.time;if(s.sceneIndex!==scene){scene=s.sceneIndex;lastBurst=-1;}
  if(s.sceneIndex===15){if(!bird)makeBird();const panel=[...document.querySelectorAll('.backdrop')].sort((a,b)=>(+b.style.zIndex||0)-(+a.style.zIndex||0))[0];if(bird.parentElement!==panel)panel.appendChild(bird);bird.style.opacity=String(1-s.vista);
   const a=CourseAudio.getState(),env=CUCKOO_ENVELOPE,level=a.effectActive&&a.effectSource==='cuckoo.ogg'?env.values[Math.min(env.values.length-1,Math.floor(a.effectTime/env.step))]||0:0;
   call+=(level-call)*(1-Math.exp(-dt/.045));const tilt=reduced?0:(Math.sin(s.time*.41)*.65+Math.sin(s.time*.137+1)*.7-call*.65);
   head.setAttribute('transform',`rotate(${tilt} 1153 290)`);jaw.setAttribute('transform',`rotate(${16*(1-call)} 1093 250)`);body.setAttribute('transform',`translate(1120 468) scale(1 ${1+(reduced?0:Math.sin(s.time*1.1)*.0025+call*.005)}) translate(-1120 -468)`);tail.setAttribute('transform',`rotate(${reduced?0:Math.sin(s.time*.73)*.28} 1280 635)`);
   if(s.time>blinkAt){blinkStart=s.time;blinkAt=s.time+3+Math.random()*6;}const blink=Math.max(0,1-Math.abs(s.time-blinkStart-.10)/.10);lid.setAttribute('opacity',String(blink));bird.querySelector('.bird-lid-line').setAttribute('opacity',String(blink));
  }else if(bird?.parentElement&&!bird.parentElement.style.backgroundImage.includes('v3-cuckoo-forest'))bird.remove();
  water(dt,s);
 }tick();window.SceneLife={wipe,getState:()=>({scene,time:last,call,beakAngle:16*(1-call),drops:drops.length,streaks:streaks.length,splashCount,wiped,wetAlpha,running:drops.filter(d=>d.v>6).length,longestTrail:Math.max(0,...streaks.map(d=>d.points.at(-1).y-d.points[0].y)),runningHeadAspect:.43/1.28})};
})();
