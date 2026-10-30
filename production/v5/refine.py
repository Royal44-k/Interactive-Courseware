from pathlib import Path
import base64
root=Path(__file__).resolve().parents[2]/'山海行歌-双语精修版'
f=root/'cinema.js';s=f.read_text(encoding='utf-8')
s=s.replace('waterQuad,waterTexture,seaTexture;','waterQuad,waterTexture,seaTexture,fallDetailTexture,streamDetailTexture;')
s=s.replace("seaTexture.colorSpace=T.SRGBColorSpace;delete window.SEA_PLATE_DATA;", "seaTexture.colorSpace=T.SRGBColorSpace;delete window.SEA_PLATE_DATA;\n  fallDetailTexture=await new Promise((r,j)=>new T.TextureLoader().load(window.DETAIL_PLATES.fall,r,undefined,j));fallDetailTexture.colorSpace=T.SRGBColorSpace;\n  streamDetailTexture=await new Promise((r,j)=>new T.TextureLoader().load(window.DETAIL_PLATES.stream,r,undefined,j));streamDetailTexture.colorSpace=T.SRGBColorSpace;delete window.DETAIL_PLATES;")
s=s.replace("isSea:{value:0},aspect:","isSea:{value:0},detailPlate:{value:fallDetailTexture},detailMix:{value:0},isStream:{value:0},aspect:")
s=s.replace("uniform sampler2D plate;uniform float t,strength,aspect,isSea;", "uniform sampler2D plate,detailPlate;uniform float t,strength,aspect,isSea,detailMix,isStream;")
s=s.replace("vec3 color=texture2D(plate,flow).rgb;gl_FragColor=vec4(color,m);", "vec3 color=texture2D(plate,flow).rgb;\n     if(detailMix>0.0){float dm=smoothstep(.49,.7,uv.x);if(isStream>.5)dm=smoothstep(.26,.42,uv.x)*(1.0-smoothstep(.83,.96,uv.x))*smoothstep(.2,.4,uv.y)*smoothstep(.008,.025,abs(uv.x-(.57+(.83-uv.y)*.36)));\n     vec2 d=uv;d.x+=dm*sin(uv.y*94.0+t*2.6+uv.x*14.0)*.0016;d.y+=dm*sin(uv.x*55.0-t*2.4)*.0012;vec3 dc=texture2D(detailPlate,d).rgb;float am=mix(m,dm,detailMix);color=(color*m*(1.0-detailMix)+dc*dm*detailMix)/max(am,.0001);m=am;}gl_FragColor=vec4(color,m);")
s=s.replace("panel.querySelector('.water-layer').style.opacity=['waterfall','sea'].includes(worldName)?'1':'0';", "panel.querySelector('.water-layer').style.opacity=worldName==='stream'?String(vista):['waterfall','sea'].includes(worldName)?'1':'0';\n  if(waterRenderer){waterQuad.material.uniforms.detailMix.value=['waterfall','stream'].includes(worldName)?vista:0;waterQuad.material.uniforms.isStream.value=worldName==='stream'?1:0;}")
s=s.replace("if(['waterfall','sea'].includes(worldName)&&waterRenderer)","if(['waterfall','sea','stream'].includes(worldName)&&waterRenderer)")
s=s.replace("waterQuad.material.uniforms.isSea.value=worldName==='sea'?1:0;}","waterQuad.material.uniforms.isSea.value=worldName==='sea'?1:0;waterQuad.material.uniforms.detailPlate.value=worldName==='stream'?streamDetailTexture:fallDetailTexture;}")
s=s.replace("['waterfall','sea'].includes(worldName)||['waterfall','sea'].includes(cut?.oldWorldName)","['waterfall','sea','stream'].includes(worldName)||['waterfall','sea','stream'].includes(cut?.oldWorldName)")
s=s.replace("seaTexture?.dispose();", "seaTexture?.dispose();fallDetailTexture?.dispose();streamDetailTexture?.dispose();")
s=s.replace('(1-sword)*33-swordHigh*14','(1-sword)*33+swordHigh*25')
s=s.replace('(1-food)*16-foodNear*12','(1-food)*48-foodNear*12')
s=s.replace("animate(action,4.8,p=>{push=", "animate(action,6.4,p=>{push=")
f.write_text(s,encoding='utf-8')
f=root/'index.html';s=f.read_text(encoding='utf-8').replace('<script src="cinema.js">','<script src="assets/detail-textures.js"></script><script src="cinema.js">');f.write_text(s,encoding='utf-8')
data={}
for key,name in [('fall','waterfall-detail'),('stream','stream-detail')]:data[key]='data:image/png;base64,'+base64.b64encode((root/'assets'/f'{name}.png').read_bytes()).decode()
import json
(root/'assets'/'detail-textures.js').write_text('window.DETAIL_PLATES='+json.dumps(data)+';',encoding='utf-8')
f=root/'effects.js';s=f.read_text(encoding='utf-8').replace('function ripples(t,alpha)', 'function ripples(t,alpha,vista=0)').replace('w*.73,h*.7,w*.075*p,h*.016*p','w*(.73-.19*vista),h*(.7-.31*vista),w*.06*p,h*.014*p').replace("ripples(t,weight(now,'stream'))", "ripples(t,weight(now,'stream'),s.vista)");f.write_text(s,encoding='utf-8')
f=root/'edition.css'
with f.open('a',encoding='utf-8') as out:out.write('''
.course.acting .story-copy{opacity:.28!important;transition:opacity .45s!important}
#lanternHand{bottom:4vh}
.water-layer{z-index:2}.vista-layer{z-index:1}
body[data-language="en"] .cover-invitation{letter-spacing:0;font-family:Georgia,serif}
@media(max-width:760px){.topbar{flex-direction:row;align-items:center;justify-content:space-between;min-height:106px}.tools{max-width:100%;flex-shrink:1;min-width:0;overflow:visible}.brand{flex-shrink:1;max-width:58%;font-size:9px}.brand .slash,.brand>span:nth-child(2){display:none}.language-switch{margin:0}.scene-guide{display:flex}#lanternHand{bottom:17vh}}
@media(max-height:500px) and (min-width:650px){.course{min-height:0;height:100dvh}.topbar{min-height:0}.subtitle{bottom:29%;left:15%;right:15%;font-size:12px;line-height:1.35}.subtitle .en{font-size:11px;line-height:1.3;margin-top:3px}.action-row{bottom:17%}.sound-status{bottom:8.5%;font-size:9px}.sound-status button{min-height:24px}.journey{min-height:31px;height:8%}.journey nav button,.journey .back{min-height:30px}.story-copy{top:22%}.cover .story-copy h1{font-size:48px}body[data-language="en"] .cover .story-copy h1{font-size:42px;max-width:600px}.cover .cover-invitation{font-size:15px}.cover .cover-note{font-size:12px;line-height:1.4}.cover .scene-sub{margin:7px 0}.cover #titleTranslation{font-size:14px;margin-top:7px}}
''')
print('Visual QA refinements saved')
