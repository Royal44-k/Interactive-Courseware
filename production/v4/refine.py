from pathlib import Path
p=Path(__file__).resolve().parents[2]/'诗境重构版'
s=(p/'effects.js').read_text(encoding='utf8')
s=s.replace('let canvas,c,w,h,dpr=1;',"let canvas,c,w,h,dpr=1,sailTex,frozen,fc;")
s=s.replace("c=canvas.getContext('2d',{alpha:true});fit();", "c=canvas.getContext('2d',{alpha:true});sailTex=new Image();sailTex.src='assets/sail-cloth.png';frozen=document.createElement('canvas');fc=frozen.getContext('2d');fit();")
start=s.index(' function cloth(t,lift){')
end=s.index(' function ripples(',start)
s=s[:start]+''' function cloth(t,lift){
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
''' +s[end:]
start=s.index(' function update(dt,t,s){')
s=s[:start]+''' function capture(){if(!c)return;frozen.width=canvas.width;frozen.height=canvas.height;fc.drawImage(canvas,0,0);}
 function update(dt,t,s){if(!c)return;c.clearRect(0,0,w,h);
  if(s.cut){c.save();c.globalAlpha=1-s.cut.p;c.drawImage(frozen,0,0,w,h);c.restore();c.save();c.globalAlpha=s.cut.p;}
  const now={...s,cut:null};flakes(dt,t,weight(now,'snow')+weight(now,'ice')*.12);sea(t,now,weight(now,'sea'));ripples(t,weight(now,'stream'));
  if(s.cut)c.restore();canvas.dataset.particles=s.world==='snow'?'370':'0';canvas.dataset.sail=s.sail.toFixed(3);
 }
 window.JourneyEffects={init,update,capture};
})();
'''
(p/'effects.js').write_text(s,encoding='utf8')
s=(p/'cinema.js').read_text(encoding='utf8')
s=s.replace("if(visual){captureWorld();snapshotForeground();}","if(visual){captureWorld();snapshotForeground();JourneyEffects.capture();}")
s=s.replace("'sword-hand','stars-bg'", "'sword-hand','sail-cloth','stars-bg'")
s=s.replace("cameraTo({ty:11,fov:57},ease(p));shotZoom=1+.02*ease(p);", "cameraTo({ty:11,fov:57},ease(p));vista=phase(p,.18,.85);shotZoom=1+.02*ease(p);")
s=s.replace("String(sceneIndex===3?1:0)", "String(1)")
(p/'cinema.js').write_text(s,encoding='utf8')
'''
Unused stale scene scripts are excluded from the final package; preserve them in this working copy.
'''
