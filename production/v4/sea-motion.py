from pathlib import Path
import base64
p=Path(__file__).resolve().parents[2]/'诗境重构版'
(p/'assets'/'sea-texture.js').write_text('window.SEA_PLATE_DATA="data:image/png;base64,'+base64.b64encode((p/'assets'/'dawn-sea.png').read_bytes()).decode()+'";',encoding='utf8')
h=(p/'index.html').read_text(encoding='utf8').replace('<script src="assets/water-texture.js"></script>','<script src="assets/water-texture.js"></script><script src="assets/sea-texture.js"></script>')
(p/'index.html').write_text(h,encoding='utf8')
s=(p/'cinema.js').read_text(encoding='utf8').replace('waterQuad,waterTexture;','waterQuad,waterTexture,seaTexture;')
s=s.replace("panel.style.transform=matteTransform(view);","panel.style.transform=matteTransform(view)+(worldName==='sea'?` rotate(${Math.sin(time*.65)*.1}deg) translateY(${Math.sin(time*.75)*.12}%)`:'');")
s=s.replace("worldName==='waterfall'?'1':'0'", "['waterfall','sea'].includes(worldName)?'1':'0'")
needle='waterRenderer=new T.WebGLRenderer('
s=s.replace(needle,"seaTexture=await new Promise((resolve,reject)=>new T.TextureLoader().load(window.SEA_PLATE_DATA,resolve,undefined,reject));seaTexture.colorSpace=T.SRGBColorSpace;delete window.SEA_PLATE_DATA;\n  "+needle)
s=s.replace("strength:{value:.45},aspect:","strength:{value:.45},isSea:{value:0},aspect:")
s=s.replace('uniform float t,strength,aspect;', 'uniform float t,strength,aspect,isSea;')
s=s.replace('vec2 flow=uv;', 'if(isSea>.5)m=(1.0-smoothstep(.49,.55,uv.y))*(1.0-smoothstep(.54,.76,uv.x));vec2 flow=uv;')
s=s.replace('vec3 color=texture2D(plate,flow).rgb;', 'if(isSea>.5){flow=uv;flow.x+=m*sin(uv.y*110.0+t*1.8+uv.x*15.0)*.002;flow.y+=m*sin(uv.y*69.0-t*1.4+uv.x*17.0)*.0018;}vec3 color=texture2D(plate,flow).rgb;')
s=s.replace('fit();await waterRenderer.compileAsync(waterScene,waterCamera);waterRenderer.render(waterScene,waterCamera);','fit();await waterRenderer.compileAsync(waterScene,waterCamera);waterRenderer.render(waterScene,waterCamera);waterQuad.material.uniforms.plate.value=seaTexture;waterQuad.material.uniforms.isSea.value=1;waterRenderer.render(waterScene,waterCamera);waterQuad.material.uniforms.plate.value=waterTexture;waterQuad.material.uniforms.isSea.value=0;')
s=s.replace("if(worldName==='waterfall'&&waterRenderer)panels()[activePanel].querySelector('.water-layer').appendChild(waterRenderer.domElement);", "if(['waterfall','sea'].includes(worldName)&&waterRenderer){panels()[activePanel].querySelector('.water-layer').appendChild(waterRenderer.domElement);waterQuad.material.uniforms.plate.value=worldName==='sea'?seaTexture:waterTexture;waterQuad.material.uniforms.isSea.value=worldName==='sea'?1:0;}")
s=s.replace("(worldName==='waterfall'||cut?.oldWorldName==='waterfall')", "(['waterfall','sea'].includes(worldName)||['waterfall','sea'].includes(cut?.oldWorldName))")
s=s.replace('waterTexture?.dispose();','waterTexture?.dispose();seaTexture?.dispose();')
(p/'cinema.js').write_text(s,encoding='utf8')
s=(p/'effects.js').read_text(encoding='utf8').replace("if(!c)return;c.clearRect(0,0,w,h);", "if(!c)return;c.clearRect(0,0,w,h);canvas.style.transform=s.world==='sea'?`rotate(${Math.sin(t*.65)*.1}deg) translateY(${Math.sin(t*.75)*.12}%)`:'';")
(p/'effects.js').write_text(s,encoding='utf8')
