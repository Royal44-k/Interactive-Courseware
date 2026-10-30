from pathlib import Path
R=Path(__file__).resolve().parents[2]/'山海行歌-V3.0'
def edit(f,a,b):
 p=R/f;s=p.read_text(encoding='utf-8-sig');assert a in s,(f,a[:70]);p.write_text(s.replace(a,b),encoding='utf8')
edit('index.html','山海行歌 V2.0','山海行歌 V3.0')
edit('index.html','<link rel="stylesheet" href="v2.css">','<link rel="stylesheet" href="v2.css"><link rel="stylesheet" href="v3.css">')
edit('index.html','<script src="v2-narration.js"></script>','<script src="v2-narration.js"></script><script src="v3-content.js"></script>')
edit('index.html','<script src="v2-clouds.js"></script>','<script src="assets/v3-textures.js"></script><script src="assets/cuckoo-envelope.js"></script><script src="v3-clouds.js"></script><script src="v3-effects.js"></script><script src="v3-assessment-data.js"></script><script src="v3-learning.js"></script>')
edit('index.html','<script src="edition-app.js"></script>','<script src="edition-app.js"></script><script src="v3-progress.js"></script>')
edit('audio.js',"shanhai-course-audio-v2","shanhai-course-audio-v3")
edit('audio.js','playing: Boolean(active), pending: Boolean(current), effectActive,',"playing: Boolean(active), pending: Boolean(current), effectActive, effectTime:effect.currentTime||0, effectSource:effect.src.split('/').at(-1),")
edit('cinema.js',' function matteTransform(v){',' function matteTransform(v){\n  if(sceneIndex===0)return "scale(1.02)";')
edit('cinema.js','float wave=sin(uv.y*83.0', 'if(isStream>.5)m=0.;float wave=sin(uv.y*83.0')
edit('cinema.js','vec2 d=uv;d.x+=dm', '''if(isStream>.5){vec2 a=vec2(.566,.834),b=vec2(.538,.601),ab=b-a;float q=clamp(dot(uv-a,ab)/dot(ab,ab),0.,1.);float lineDistance=length(uv-a-ab*q);dm*=smoothstep(.004,.013,lineDistance);}
     vec2 d=uv;d.x+=dm''')
edit('cinema.js',"sceneIndex===15?.42:.18,sceneIndex===15?.92:.83","sceneIndex===15?.62:.18,sceneIndex===15?.98:.83")
edit('edition-app.js','shanhai-language-v2','shanhai-language-v3')
edit('edition-app.js','>V2.0<','>V3.0<')
edit('edition-app.js',"practice:['字句之间','Reflect']","practice:['字句赏析','Explore the verse']")
edit('edition-app.js',"$('#autoControl').hidden=!state.auto;$('#autoControl').textContent=t('转为手动','Take control');","syncAutoControl();")
edit('edition-app.js',"$('#autoControl').hidden=!state.auto;$('#sceneActions')","syncAutoControl();$('#sceneActions')")
edit('edition-app.js',"if(x.type==='ending')$('#actionLabel').textContent=action(x);", "if(x.type==='ending')$('#actionLabel').textContent=action(x);if(state.index===16)$('#sceneActions').insertAdjacentHTML('beforeend',`<button data-wipe-water>${t('拂去水珠','Wipe the spray')}</button>`);")
edit('edition-app.js',"function stopAuto(){state.auto=false;autoSerial++;$('#autoControl').hidden=true;}","""function syncAutoControl(){const b=$('#autoControl');b.hidden=false;b.dataset.action='auto-toggle';b.setAttribute('aria-pressed',String(state.auto));b.textContent=state.index===23?t('行后研习','After the journey'):state.auto?(state.paused?t('继续自动吟游','Resume guided journey'):t('转为手动','Take control')):t('自动吟游','Guided journey');}
 function stopAuto(){state.auto=false;autoSerial++;syncAutoControl();}""")
edit('edition-app.js',"if(x.type==='ending'){await startAuto();return true;}","if(x.type==='ending'){openModal('learning');return true;}")
a=""" async function startAuto(){
  stopAuto();state.auto=true;const token=++autoSerial,valid=()=>state.auto&&token===autoSerial;
  audio().start();$('#autoControl').hidden=false;
  if(!await go(0,false,true)||!valid())return;
  while(valid()){
   if(!await waitTime(state.actionDone?(state.index===15?1.25:.85):.65,valid))return;
   if(state.index===story.length-1){await waitTime(1.8,valid);if(valid()){stopAuto();state.phase='complete';renderActions();}return;}
   if(state.busy)continue;
   await next(true);
  }
 }"""
b=""" async function startAuto(fromOpening=false){
  if(state.index===23){openModal('learning');return;}
  if(state.auto){if(state.paused)pause();return;}
  state.auto=true;const token=++autoSerial,valid=()=>state.auto&&token===autoSerial;
  audio().start();if(state.paused)pause();syncAutoControl();renderActions();
  if(fromOpening&&state.index===0&&!state.busy){if(!await go(0,false,true)||!valid())return;}
  const waitReady=()=>new Promise(resolve=>{const tick=()=>{if(!valid())return resolve(false);if(!state.busy&&!state.paused&&!state.modal)return resolve(true);requestAnimationFrame(tick);};tick();});
  while(valid()){
   if(!await waitReady())return;
   if(!await waitTime(state.actionDone?(state.index===15?1.25:.85):.65,valid))return;
   if(state.busy||state.paused||state.modal)continue;
   if(state.index===story.length-1){await waitTime(1.8,valid);if(valid()){stopAuto();state.phase='complete';renderActions();openModal('learning');}return;}
   await next(true);
  }
 }"""
edit('edition-app.js',a,b)
edit('edition-app.js',"$('#paused').hidden=!state.paused;$('#pauseButton')", "$('#paused').hidden=!state.paused;$('#paused').querySelector('button').textContent=state.auto?t('继续自动吟游 ▷','Resume guided journey ▷'):t('继续这一程 ▷','Continue the journey ▷');$('#pauseButton')")
edit('edition-app.js',"if(a==='auto-start'){startAuto();return;}","if(a==='auto-start'){startAuto(true);return;}if(a==='auto-toggle'){if(state.index===23)openModal('learning');else if(state.auto&&!state.paused){stopAuto();renderActions();}else startAuto(false);return;}")
edit('edition-app.js',"e.preventDefault();next();}if(e.key==='ArrowLeft')", "e.preventDefault();if(state.paused)pause();else next();}if(e.key==='ArrowLeft')")
edit('edition-app.js',"function openModal(name){if(!state.ready)return;", "function openModal(name){if(!state.ready)return;LearningFlow.enter(name,state.index,state.language);")
edit('edition-app.js',"function renderModal(){let html='';const name=state.modal;", "function renderModal(){let html='';const name=state.modal;if(LearningFlow.handles(name)){$('#dialog').classList.add('learning-dialog');$('#modalContent').innerHTML=LearningFlow.render(name,state.language);return;}")
edit('edition-app.js',"$('#modalContent').innerHTML=html;", "$('#modalContent').innerHTML=html+LearningFlow.reviewFooter(name,state.language);")
edit('edition-app.js',"document.addEventListener('click',async e=>{const b=e.target.closest('button');if(!b)return;", "document.addEventListener('click',async e=>{const b=e.target.closest('button');if(!b)return;if(LearningFlow.handleClick(b))return;")
edit('edition-app.js',"window.Courseware={go,next,replay,", "window.Courseware={refreshModal:renderModal,go,next,replay,")
print('V3 edition, transport, learning hooks and stable fishing line patched.')
