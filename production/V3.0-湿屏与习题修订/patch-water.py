from pathlib import Path
p=Path('蜀道难课件/山海行歌-V3.0/v3-effects.js');s=p.read_text(encoding='utf-8-sig')
s=s.replace('wiped=0,surfaceRect=null;','wiped=0,surfaceRect=null,sheets=[],secondImpact=false,previousAction="",impactTotal=0;')
a=s.index(' function burst(');b=s.index(' function wipe(',a)
s=s[:a]+''' function deposit(x,y,r){drops.push({x,y,r,v:0,age:0,wait:.18+Math.random()*1.7,life:7+Math.random()*5,phase:Math.random()*20,trail:null});}
 function burst(power=1,impact=false){splashCount++;if(reduced){for(let i=0;i<8;i++)deposit(w*(.35+Math.random()*.6),h*(.2+Math.random()*.55),2+Math.random()*4);return;}
  if(impact){impactTotal++;sheets.push({age:0,life:1.65,power,phase:Math.random()*8});}
  // Perspective spray travels from the torrent towards the viewer, then wets the lens.
  for(let i=0;i<Math.round((impact?58:30)*power);i++)spray.push({sx:w*(.73+Math.random()*.13),sy:h*(.55+Math.random()*.18),tx:w*(.14+Math.random()*.84),ty:h*(.10+Math.random()*.80),age:0,life:.22+Math.random()*.56,r:(impact?3:1.8)+Math.random()*6,arc:h*(.015+Math.random()*.10),land:Math.random()<.84});
 }
 function sheetPath(sheet){const t=sheet.age,reach=1-Math.pow(1-Math.min(1,t/.26),3),drain=Math.max(0,Math.min(1,(t-.30)/1.25));const x=w*(.98-.62*reach+.12*drain),y=h*(.69-.43*reach+.65*drain),wide=w*(.1+.67*reach),deep=h*(.12+.38*reach)*(1-drain*.74),ripple=Math.sin(t*7+sheet.phase)*h*.022;
  c.moveTo(w*1.08,y+deep*.5);c.bezierCurveTo(x+wide*.74,y-deep*.28,x+wide*.5,y+deep*.15+ripple,x+wide*.26,y);c.bezierCurveTo(x+wide*.15,y-deep*.07,x-wide*.025,y+deep*.13,x+wide*.08,y+deep*.35);c.bezierCurveTo(x+wide*.16,y+deep*.48,x+wide*.26,y+deep*.75,x+wide*.40,y+deep*.79);c.bezierCurveTo(x+wide*.56,y+deep*.92,x+wide*.83,y+deep*.73,w*1.08,y+deep*1.25);c.closePath();return {x,y,wide,deep};
 }
 function drawSheets(img){for(const sh of sheets){const attack=Math.min(1,sh.age/.12),fade=Math.max(0,1-sh.age/sh.life),alpha=wetAlpha*attack*fade*sh.power;c.save();c.beginPath();const r=sheetPath(sh);c.clip();
   c.globalAlpha=alpha*.46;sampleSurface(img,-12*fade,6*fade);const g=c.createLinearGradient(r.x,r.y,r.x+r.wide,r.y+r.deep);g.addColorStop(0,'#d9f2ee55');g.addColorStop(.32,'#a8d4dc12');g.addColorStop(.72,'#416c7828');g.addColorStop(1,'#dbf3ee28');c.globalAlpha=alpha;c.fillStyle=g;c.fillRect(0,0,w,h);
   for(let j=0;j<9;j++){c.beginPath();const y=r.y+r.deep*(j/11+.08);c.moveTo(r.x+r.wide*.12,y);c.bezierCurveTo(r.x+r.wide*.38,y-r.deep*.06,r.x+r.wide*.7,y+r.deep*.16,w*1.06,y+r.deep*.14);c.strokeStyle=`rgba(221,242,239,${alpha*(j%3===0?.09:.035)})`;c.lineWidth=1.4+j*.15;c.stroke();}c.restore();
   c.save();c.beginPath();sheetPath(sh);c.strokeStyle=`rgba(222,244,240,${alpha*.20})`;c.lineWidth=1.3;c.stroke();c.restore();
  }}
''' +s[b:]
s=s.replace('for(const d of drops)if(d.trail&&!streaks.includes(d.trail))d.trail=null;wiped++;', 'for(const d of drops)if(d.trail&&!streaks.includes(d.trail))d.trail=null;if(r>=Math.max(w,h))sheets=[];wiped++;')
s=s.replace("c.save();c.beginPath();streaks.forEach(pathFor);c.clip();c.globalAlpha=wetAlpha*.30;sampleSurface(img,-3,1.5);c.fillStyle='#bdd5d80d';c.fillRect(0,0,w,h);c.restore();", "for(let band=0;band<4;band++){const group=streaks.filter(d=>Math.min(3,Math.floor(d.age/2.125))===band);if(!group.length)continue;c.save();c.beginPath();group.forEach(pathFor);c.clip();c.globalAlpha=wetAlpha*.30*(1-band/4);sampleSurface(img,-3,1.5);c.fillStyle='#bdd5d80d';c.fillRect(0,0,w,h);c.restore();}")
a=s.index(' function water(');b=s.index(' function tick(',a)
s=s[:a]+''' function water(dt,s){const active=s.sceneIndex===16,target=active?1:0;wetAlpha+=(target-wetAlpha)*(1-Math.exp(-dt/(active?.2:.38)));
  if(active&&s.action==='torrent'&&previousAction!=='torrent'){lastBurst=-1;secondImpact=false;}
  previousAction=s.action;
  if(active&&s.action==='torrent'&&s.progress>.28){if(lastBurst<0){burst(1.20,true);lastBurst=s.time;}else if(s.progress>.52&&!secondImpact){burst(.82,true);secondImpact=true;lastBurst=s.time;}else if(s.progress<.78&&s.time-lastBurst>1.4){burst(.32,false);lastBurst=s.time;}}
  c.clearRect(0,0,w,h);if(wetAlpha<.003){drops=[];spray=[];streaks=[];sheets=[];return;}const img=s.vista>.45?detail:background,panel=[...document.querySelectorAll('.backdrop')].sort((a,b)=>(+b.style.zIndex||0)-(+a.style.zIndex||0))[0];surfaceRect=(s.vista>.45?panel?.querySelector('.vista-layer'):panel)?.getBoundingClientRect();
  for(const sh of sheets)sh.age+=dt;sheets=sheets.filter(sh=>sh.age<sh.life);drawSheets(img);
  for(const d of streaks)d.age+=dt;
  for(const d of drops){d.age+=dt;if(d.age>d.wait&&!reduced){if(!d.trail){d.trail={r:Math.max(.65,d.r*.45),age:0,phase:d.phase,points:[{x:d.x,y:d.y}]};streaks.push(d.trail);}d.v=Math.min(115+d.r*3,d.v+dt*(16+d.r*4));d.x+=Math.sin(d.y*.031+d.phase)*d.v*dt*.10;d.y+=d.v*dt;const points=d.trail.points,prev=points.at(-1);if(d.y-prev.y>3.5)points.push({x:d.x,y:d.y});d.trail.age=0;}}
  // Nearby beads can join; their existing wet tracks remain behind on the glass.
  for(let i=0;i<drops.length;i++){const a=drops[i];if(a.joined||a.v<6)continue;for(let j=i+1;j<drops.length;j++){const b=drops[j];if(b.joined||Math.abs(a.y-b.y)>6)continue;if(Math.hypot(a.x-b.x,a.y-b.y)<(a.r+b.r)*.45){a.r=Math.min(10.5,Math.sqrt(a.r*a.r+b.r*b.r));a.v=Math.max(a.v,b.v);b.joined=true;}}}
  drawFilm(img);for(const d of drops){if(d.joined)continue;const fade=Math.min(1,d.age*7,Math.max(0,(d.life-d.age)*1.2));lens(d,wetAlpha*fade,img);}drops=drops.filter(d=>!d.joined&&d.y<h+20&&d.age<d.life).slice(-105);streaks=streaks.filter(d=>d.age<8.5).slice(-130);
  for(const p of spray){p.age+=dt;const u=Math.min(1,p.age/p.life),q=u*.45+u*u*.55,x=p.sx+(p.tx-p.sx)*q,y=p.sy+(p.ty-p.sy)*q-Math.sin(Math.PI*u)*p.arc,r=.4+p.r*u*u,angle=Math.atan2(p.ty-p.sy,p.tx-p.sx);c.save();c.translate(x,y);c.rotate(angle);c.globalAlpha=wetAlpha*(.18+u*.50);const g=c.createRadialGradient(-r*.2,-r*.2,0,0,0,r*1.8);g.addColorStop(0,'#f0fffaad');g.addColorStop(.45,'#cceae65c');g.addColorStop(1,'#80b8c100');c.fillStyle=g;c.beginPath();c.ellipse(0,0,r*(1.2+u*.8),r*.65,0,0,Math.PI*2);c.fill();c.restore();if(u===1&&p.land)deposit(p.tx,p.ty,p.r);}
  spray=spray.filter(p=>p.age<p.life);
 }
''' +s[b:]
s=s.replace('runningHeadAspect:.43/1.28})','runningHeadAspect:.43/1.28,spray:spray.length,sheets:sheets.length,impactTotal})')
p.write_text(s,encoding='utf8')
print('sheet impact + perspective spray + attached runoff')
