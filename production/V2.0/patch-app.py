from pathlib import Path
R=Path(__file__).resolve().parents[2]/'山海行歌-V2.0'
p=R/'edition-app.js';s=p.read_text(encoding='utf8')
s=s.replace('shanhai-language-v5','shanhai-language-v2')
s=s.replace('const state={index:0,','const state={auto:false,phase:"opening",index:0,')
s=s.replace('let serial=0,timer,','let autoSerial=0,hiddenPause=false;\n let serial=0,timer,')
s=s.replace("  $('#pauseButton').textContent", "  $('#fullscreenButton').setAttribute('aria-label',t(document.fullscreenElement?'退出全屏':'展开全屏',document.fullscreenElement?'Exit full screen':'Full screen'));$('#fullscreenButton').title=$('#fullscreenButton').getAttribute('aria-label');\n  $('#autoControl').hidden=!state.auto;$('#autoControl').textContent=t('转为手动','Take control');\n  $('#pauseButton').textContent",1)
s=s.replace("  renderStatic();renderActions();audio()", "  const colors=x.palette;$('#course').style.setProperty('--gilt',colors[0]);$('#course').style.setProperty('--gilt-shadow',colors[1]);\n  renderStatic();renderActions();audio()")
s=s.replace("function renderActions(){const x=s();", "function renderActions(){const x=s();$('#nextButton').disabled=state.busy||!state.ready;$('#nextButton').classList.toggle('is-ready',state.ready&&!state.busy&&!state.paused);$('#readLine').disabled=state.busy;$('#autoControl').hidden=!state.auto;")
s=s.replace("x.type==='cover'?'':`${state.actionDone", "x.type==='cover'?`<button class=\"auto-start\" data-action=\"auto-start\" ${state.busy?'disabled':''}><span class=\"auto-mark\" aria-hidden=\"true\">▷</span> ${t('自动吟游','Guided journey')}<small>${t('随诗而行，静听山海','Follow the poem. Let the landscape unfold.')}</small></button>`:`${state.actionDone")
start=s.index(' async function go(');end=s.index(' function renderModal()',start)
s=s[:start]+''' function stopAuto(){state.auto=false;autoSerial++;$('#autoControl').hidden=true;}
 function waitTime(seconds,valid=()=>true){return new Promise(resolve=>{const began=CinemaEngine.getState().time;const tick=()=>{if(!valid()){resolve(false);return;}if(!state.paused&&!state.modal&&CinemaEngine.getState().time-began>=seconds){resolve(true);return;}requestAnimationFrame(tick);};tick();});}
 function setBusy(value,phase){state.busy=value;state.phase=phase;$('#course').classList.toggle('acting',value&&phase==='acting');renderActions();}
 async function go(index,continuous=false,internal=false){
  if(!state.ready)return false;if(!internal)stopAuto();if(state.modal)closeModal();const id=++serial;
  state.paused=false;state.actionDone=false;state.interaction=0;lastCue=null;setBusy(true,'opening');$('#paused').hidden=true;CinemaEngine.setPaused(false);audio().stopVoice();if(audio().getState().started)audio().resume();
  const target=Math.max(0,Math.min(story.length-1,index));
  const ok=await CinemaEngine.travel(target,continuous,()=>{if(id!==serial)return;state.index=target;render();});if(!ok||id!==serial)return false;
  setBusy(true,'listening');
  if(audio().getState().started){const started=CinemaEngine.getState().time;await audio().playIntro(target);if(id!==serial)return false;await waitTime(Math.max(0,2.4-(CinemaEngine.getState().time-started)),()=>id===serial);}
  if(id!==serial)return false;setBusy(false,'ready');return true;
 }
 async function next(fromAuto=false){
  fromAuto=fromAuto===true;if(!state.ready||state.busy||state.paused||state.modal)return false;if(!fromAuto)stopAuto();
  const x=s();audio().start();if(x.type==='ending'){await startAuto();return true;}if(state.actionDone)return go(state.index+1,true,true);
  setBusy(true,'acting');$('#actionLabel').textContent=action(x)+'…';const id=++serial;
  const ok=await CinemaEngine.perform(x.motion);if(!ok||id!==serial)return false;await audio().waitVoice();if(id!==serial)return false;
  if(x.type==='cover')return go(1,false,true);if(x.autoNext)return go(state.index+1,false,true);
  state.interaction++;state.actionDone=true;setBusy(false,'settled');return true;
 }
 async function startAuto(){
  stopAuto();state.auto=true;const token=++autoSerial,valid=()=>state.auto&&token===autoSerial;
  audio().start();$('#autoControl').hidden=false;
  if(!await go(0,false,true)||!valid())return;
  while(valid()){
   if(!await waitTime(state.actionDone?3.2:1.5,valid))return;
   if(state.index===story.length-1){await waitTime(4,valid);if(valid()){stopAuto();state.phase='complete';renderActions();}return;}
   if(state.busy)continue;
   await next(true);
  }
 }
 async function replay(){const i=state.index;await go(i,false);await next();}
 function pause(){state.paused=!state.paused;CinemaEngine.setPaused(state.paused||!!state.modal);state.paused?audio().pause():audio().resume();$('#paused').hidden=!state.paused;$('#pauseButton').textContent=state.paused?t('续行 ▷','Resume ▷'):t('暂歇 Ⅱ','Pause Ⅱ');$('#course').classList.toggle('is-paused',state.paused);renderActions();}
 async function readCurrent(){if(state.busy)return;audio().start();const id=serial;setBusy(true,'listening');await audio().playIntro(state.index,true);if(id===serial)setBusy(false,state.actionDone?'settled':'ready');}
 function setLanguage(lang){if(!['zh','bi','en'].includes(lang))return;stopAuto();state.language=lang;try{localStorage.setItem('shanhai-language-v2',lang);}catch{}audio().setVoiceLang(lang==='en'?'en':'zh');render();if(state.modal)renderModal();else if(state.ready&&audio().getState().started)go(state.index,false,true);}
 function openModal(name){if(!state.ready)return;if(state.modal)closeModal();state.modal=name;lastFocus=document.activeElement;CinemaEngine.setPaused(true);audio().pause();audio().suspendStory();$('#modalLayer').hidden=false;$('#course').inert=true;$('#dialog').className='dialog';if(name==='study')state.studyIndex=state.index;renderModal();$('#dialog').focus();}
 function closeModal(){if(!state.modal)return;state.modal=null;audio().pause();audio().resumeStory();$('#modalLayer').hidden=true;$('#course').inert=false;CinemaEngine.setPaused(state.paused);if(!state.paused&&audio().getState().started)audio().resume();lastFocus?.focus();}
''' +s[end:]
s=s.replace("const a=b.dataset.action;if(a==='next')", "const a=b.dataset.action;if(a==='auto-start'){startAuto();return;}if(a==='auto-stop'){stopAuto();renderActions();return;}if(a==='next')")
s=s.replace("if(a==='read'){audio().start();audio().playStage(state.index,true);}","if(a==='read')readCurrent();")
s=s.replace("getState:()=>({...state,", "startAuto,stopAuto,getState:()=>({...state,")
s=s.replace("  if(name==='help')html=", "  if(name==='help')html=")
s=s.replace("点画面或右下方行游按钮，完成此幕动作；动作停稳后，再点一次续行。拔剑一幕会随灯火渐暗，自动转入席外。", "入境吟声落定，行游按钮便漾起微光。点画面或按钮，让动作与诗句一同展开；再点一次续行。首页可选自动吟游，途中随时暂歇或转为手动。")
s=s.replace("Click the scene or the journey button to perform a gesture. Click again once it settles to continue. After the sword is raised, the lamplight fades and the next scene opens automatically.", "When the entrance voice ends, the journey button begins to glow. Click to unfold a gesture with its verse; click again to continue. Choose Guided journey on the opening page to travel automatically. Pause or take control at any time.")
s=s.replace("系统设为减少动态时，自动移镜停止，动作缩短。", "系统设为减少动态时，云海与装饰波纹停息，移镜与动作仍随吟声缓行。")
s=s.replace("With reduced motion enabled, automatic panning stops and gestures shorten.", "With reduced motion enabled, the clouds and decorative ripples rest; gestures retain the voice’s unhurried pacing.")
s=s.replace("<div class=\"help-links\">", "<p class=\"asset-credit\">${pair('子规鸟鸣：四声杜鹃实录，L. Shyamal，2008。原录音未剪辑。','Cuckoo recording: Indian cuckoo, L. Shyamal, 2008. Original recording, unedited.')} <a href=\"https://commons.wikimedia.org/wiki/File:IndianCuckoo.ogg\" target=\"_blank\" rel=\"noreferrer\">Wikimedia Commons</a> · <a href=\"https://creativecommons.org/licenses/by-sa/3.0/\" target=\"_blank\" rel=\"noreferrer\">CC BY-SA 3.0</a></p><div class=\"help-links\">")
s=s.replace("audio().setVoiceLang(en()?'en':'zh');render();", "document.addEventListener('fullscreenchange',renderStatic);\n document.addEventListener('visibilitychange',()=>{if(document.hidden&&!state.paused&&!state.modal&&state.ready){hiddenPause=true;pause();}else if(!document.hidden&&hiddenPause){hiddenPause=false;if(state.paused)pause();}});\n audio().setVoiceLang(en()?'en':'zh');render();")
p.write_text(s,encoding='utf8')
print('Patched V2 journey director')
