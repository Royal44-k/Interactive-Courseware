/* One scrollable rail: opening plus six chapters, without legacy marker lines. */
(() => {
 'use strict';
 const footer=document.querySelector('.journey'),track=footer.querySelector('.journey-track'),nav=document.querySelector('#chapterNav');
 const canvas=document.createElement('canvas');canvas.className='liquid-progress';canvas.setAttribute('aria-hidden','true');track.appendChild(canvas);const ctx=canvas.getContext('2d');
 const starts=[0,...JOURNEY_CHAPTERS.map((_,i)=>COURSE_STORY.findIndex(s=>s.chapter===i))],colors=['#e7cc8b',...CHAPTER_PALETTES];
 let nodes=[],buttons=[],positions=[],width=0,last=-1,key='',shown=0,lastChapter=-2;
 function layout(a){buttons=[...nav.querySelectorAll('button')];nodes=buttons.map((b,i)=>{let n=b.querySelector('.chapter-node');if(!n){n=document.createElement('span');n.className='chapter-node';n.setAttribute('aria-hidden','true');b.appendChild(n);}b.style.setProperty('--chapter-color',colors[i]);return n;});
  width=nav.scrollWidth;const d=Math.min(devicePixelRatio,2);canvas.width=Math.ceil(width*d);canvas.height=26*d;canvas.style.width=width+'px';ctx.setTransform(d,0,0,d,0,0);positions=buttons.map(b=>b.offsetLeft+b.offsetWidth/2);
  const current=Math.max(0,starts.findLastIndex(i=>i<=a.index));if(current!==lastChapter){lastChapter=current;track.scrollTo({left:Math.max(0,Math.min(width-track.clientWidth,positions[current]-track.clientWidth/2)),behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}
 }
 function tick(){requestAnimationFrame(tick);const s=window.CinemaEngine?.getState(),a=window.Courseware?.getState();if(!s?.ready)return;const nextKey=a.index+':'+a.language+':'+track.clientWidth,changed=nextKey!==key||buttons[0]!==nav.firstElementChild;if(changed){key=nextKey;layout(a);}
  if(s.time===last&&!changed)return;const dt=last<0?0:Math.min(.1,s.time-last);last=s.time;const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,t=reduced?0:s.time;
  const start=positions[0],finish=Math.min(width-12,positions.at(-1)+buttons.at(-1).offsetWidth*.35),step=Math.min(23,a.index+(a.actionDone?.88:s.action&&s.action!=='scene-dissolve'&&!s.transition?s.progress*.88:0));
  const knots=starts.map((i,k)=>({i,p:positions[k]})).concat({i:23,p:finish}),k=Math.max(0,knots.findLastIndex(x=>x.i<=step)),l=knots[k],r=knots[k+1]||l,target=l===r?l.p:l.p+(r.p-l.p)*(step-l.i)/(r.i-l.i);
  if(!shown)shown=start;shown=reduced?target:shown+(target-shown)*(1-Math.exp(-dt/0.2));if(Math.abs(target-shown)<.05)shown=target;const end=Math.max(start,Math.min(finish,shown));ctx.clearRect(0,0,width,26);
  ctx.lineCap='round';ctx.strokeStyle='#a8bdbe39';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(start,13);ctx.lineTo(finish,13);ctx.stroke();
  if(end>start+.1){const g=ctx.createLinearGradient(start,0,finish,0);colors.forEach((col,i)=>g.addColorStop((positions[i]-start)/(finish-start),col));ctx.fillStyle=g;ctx.shadowColor=colors[Math.max(0,starts.findLastIndex(i=>i<=a.index))];ctx.shadowBlur=4;ctx.beginPath();ctx.moveTo(start,10.9);for(let x=start;x<end;x+=2)ctx.lineTo(x,10.9+Math.sin((x-start)*.027-t*1.4)*.28+Math.sin(x*.053+t*.8)*.12);ctx.lineTo(end,11);ctx.quadraticCurveTo(end+2.2,13,end,15.1);for(let x=end;x>start;x-=2)ctx.lineTo(x,15.1+Math.sin((x-start)*.027-t*1.4+.6)*.25);ctx.quadraticCurveTo(start-2.2,13,start,10.9);ctx.closePath();ctx.fill();ctx.shadowBlur=0;}
  nodes.forEach((n,i)=>{const lit=a.index>=starts[i],active=i===Math.max(0,starts.findLastIndex(j=>j<=a.index)),pulse=.65+.35*Math.sin(t*1.25+i*.81)**2;n.classList.toggle('is-lit',lit);buttons[i].setAttribute('aria-current',active?'step':'false');n.style.background=lit?colors[i]:'#17313a';n.style.borderColor=lit?colors[i]:'#849c9e';n.style.boxShadow=lit?`0 0 ${7+pulse*5}px ${colors[i]}8c,0 0 ${2+pulse*3}px ${colors[i]}66`:'none';n.style.transform=`translateX(-50%) scale(${lit?1+pulse*.08:1})`;});
 }
 addEventListener('resize',()=>key='');tick();window.ChapterFlow={getState:()=>({nodes:nodes.length,lit:nodes.filter(n=>n.classList.contains('is-lit')).length,positions:[...positions],start:positions[0],shown,width})};
})();
