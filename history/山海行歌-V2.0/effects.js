/* All particles and sail vertices use the scene clock: pause and cuts stay in sync. */
(() => {
 'use strict';
 let canvas,c,w,h,dpr=1,sailTex,frozen,fc;
 const snow=Array.from({length:370},(_,i)=>({x:(i*.61803398875)%1,y:(i*.41421356237)%1,z:i%3,phase:i*2.31}));
 function fit(){w=innerWidth;h=innerHeight;dpr=Math.min(devicePixelRatio,1.25);canvas.width=w*dpr;canvas.height=h*dpr;canvas.style.width=w+'px';canvas.style.height=h+'px';c.setTransform(dpr,0,0,dpr,0,0);}
 function init(){canvas=document.getElementById('weatherCanvas');c=canvas.getContext('2d',{alpha:true});sailTex=new Image();sailTex.src='assets/sail-cloth.png';frozen=document.createElement('canvas');fc=frozen.getContext('2d');fit();addEventListener('resize',fit);}
 const weight=(s,n)=>s.cut?((s.cut.old===n?1:0)*(1-s.cut.p)+(s.world===n?1:0)*s.cut.p):(s.world===n?1:0);
 function flakes(dt,t,alpha){
  if(alpha<=0)return;c.save();c.lineCap='round';
  for(const p of snow){const z=p.z,v=.025+z*.026;p.x-=(.025+z*.028+Math.sin(t*.37+p.phase)*.009)*dt;p.y+=v*dt;if(p.x<-.02){p.x=1.02;p.y=(p.y+.37)%1;}if(p.y>1.02)p.y=-.02;
   const x=p.x*w+Math.sin(t*.8+p.phase)*3,y=p.y*h,r=.55+z*.72;c.strokeStyle=`rgba(229,240,244,${alpha*(.22+z*.2)})`;c.lineWidth=r;c.beginPath();c.moveTo(x,y);c.lineTo(x-2-z*2,y+1+z*1.6);c.stroke();
  }c.restore();
 }
 function sea(t,s,alpha){
  if(alpha<=0)return;c.save();c.globalAlpha=alpha;
  // Moving glints remain below the horizon; long highlights dissolve at both ends.
  for(let i=0;i<65;i++){const z=(i*.618)%1,y=h*(.51+z*.45),x=w*(.18+((i*.381+t*.002*(1+z))% .68));const len=7+z*z*65,fade=(Math.sin(t*(.5+z*.4)+i*1.9)+1)*.035;
   c.strokeStyle=`rgba(247,217,157,${fade*(.3+s.daylight*.7)})`;c.lineWidth=.5+z*1.2;c.beginPath();c.moveTo(x,y+Math.sin(t*.8+i)*z*2);c.quadraticCurveTo(x+len*.5,y+2*z,x+len,y);c.stroke();
  }
  if(s.sail>0)cloth(t,s.sail);
  c.restore();
 }
 function cloth(t,lift){
  if(!sailTex?.complete||!sailTex.naturalWidth)return;
  // Cloth texture is segmented only for small wind deformation; the luff remains fixed to the mast.
  const right=w*.957,base=h*.65,height=h*(.035+.55*lift),width=w*(.22+.055*lift),top=base-height,rows=42;
  c.save();c.globalAlpha*=Math.min(1,lift*9);
  for(let i=0;i<rows;i++){const f=i/rows,sh=sailTex.naturalHeight/rows,y=top+height*f;
   const billow=Math.sin(f*Math.PI)*Math.sin(t*.9+f*4)*w*.0018*lift;
   c.drawImage(sailTex,0,i*sh,sailTex.naturalWidth,sh+.8,right-width-billow,y,width+billow,height/rows+.7);
  }
  c.strokeStyle='#b19a6a';c.lineWidth=1;c.beginPath();c.moveTo(right-w*.008,top+height*.03);c.lineTo(right,h*.84);c.moveTo(right-width*.88,base-height*.06);c.lineTo(w*.79,h*.87);c.stroke();c.restore();
 }
 function ripples(t,alpha,vista=0){if(!alpha)return;c.save();for(let j=0;j<4;j++){const p=(t*.16+j*.25)%1;c.strokeStyle=`rgba(211,230,208,${(1-p)*.22*alpha})`;c.lineWidth=1;c.beginPath();c.ellipse(w*(.73-.19*vista),h*(.7-.31*vista),w*.06*p,h*.014*p,0,0,Math.PI*2);c.stroke();}c.restore();}
 function capture(){if(!c)return;frozen.width=canvas.width;frozen.height=canvas.height;fc.drawImage(canvas,0,0);}
 function update(dt,t,s){if(!c)return;c.clearRect(0,0,w,h);canvas.style.transform=s.world==='sea'?`rotate(${Math.sin(t*.65)*.1}deg) translateY(${Math.sin(t*.75)*.12}%)`:'';
  if(s.cut){c.save();c.globalAlpha=1-s.cut.p;c.drawImage(frozen,0,0,w,h);c.restore();c.save();c.globalAlpha=s.cut.p;}
  const now={...s,cut:null};flakes(dt,t,weight(now,'snow')+weight(now,'ice')*.12);sea(t,now,weight(now,'sea'));ripples(t,weight(now,'stream'),s.vista);
  if(s.cut)c.restore();canvas.dataset.particles=s.world==='snow'?'370':'0';canvas.dataset.sail=s.sail.toFixed(3);
 }
 window.JourneyEffects={init,update,capture};
})();
