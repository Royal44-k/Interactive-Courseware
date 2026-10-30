const{chromium}=require('playwright'),fs=require('fs'),path=require('path'),assert=require('assert'),{pathToFileURL}=require('url');
const root=path.resolve(__dirname,'../../山海行歌-V2.0'),out=path.join(__dirname,'checks');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true,args:['--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']});
 const p=await browser.newPage({viewport:{width:1280,height:720},offline:true}),errors=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await p.addInitScript(()=>{
  const raf=requestAnimationFrame.bind(window),now=performance.now.bind(performance);window.requestAnimationFrame=fn=>raf(t=>fn(t*4));performance.now=()=>now()*4;
  window.__media=[];const Audio0=Audio;window.Audio=function(...args){const a=new Audio0(...args);window.__media.push(a);const play=a.play.bind(a);a.play=()=>{a.playbackRate=4;return play();};return a;};
  window.__events=[];addEventListener('course-audio',e=>{if(e.detail.track&&e.detail.kind!=='stage')window.__events.push({scene:window.Courseware?.getState().index,time:now(),...e.detail});});
 });
 await p.goto(pathToFileURL(path.join(root,'index.html')).href);await p.waitForFunction(()=>window.Courseware?.getState().ready,null,{timeout:60000});
 if(process.argv.includes('--en-only'))await p.evaluate(()=>Courseware.setLanguage('en'));
 const unique=await p.evaluate(()=>{const map={};COURSE_STORY.forEach((s,i)=>[...new Set([s.bg,s.vista,...(s.views||[])].filter(Boolean))].forEach(x=>(map[x]??=[]).push(i)));return Object.entries(map).filter(([,v])=>v.length>1);});assert.deepEqual(unique,[],'scene imagery is reused');
 await p.locator('#fullscreenButton').click();assert(await p.evaluate(()=>!!document.fullscreenElement),'fullscreen entry');await p.locator('#fullscreenButton').click();
 await p.locator('[data-action="auto-start"]').click();await p.waitForFunction(()=>CourseAudio.getState().playing);
 await p.locator('#pauseButton').click();const paused=await p.evaluate(()=>({time:CinemaEngine.getState().time,voice:CourseAudio.getState().currentTime}));await p.waitForTimeout(600);const held=await p.evaluate(()=>({time:CinemaEngine.getState().time,voice:CourseAudio.getState().currentTime}));assert(Math.abs(paused.time-held.time)<.01);assert(Math.abs(paused.voice-held.voice)<.12);await p.locator('#paused [data-action="pause"]').click();
 let last=-1;for(let n=0;n<600;n++){
  const s=await p.evaluate(()=>Courseware.getState());if(s.index!==last){last=s.index;console.log('AUTO',s.index,s.phase);}
  if(s.phase==='complete')break;await p.waitForTimeout(500);if(n===599)throw Error('Automatic journey failed to finish: '+JSON.stringify(s));
 }
 const completed=await p.evaluate(()=>({state:Courseware.getState(),events:window.__events,media:window.__media.map(a=>({src:a.src,ended:a.ended,duration:a.duration,error:a.error?.message}))}));
 assert.equal(completed.state.index,23);assert.equal(completed.state.auto,false);assert.equal(completed.state.busy,false);assert.equal(completed.state.modal,null);
 const intros=new Set(completed.events.filter(e=>e.kind==='intro').map(e=>e.track)),cues=new Set(completed.events.filter(e=>e.kind==='cue').map(e=>e.track));assert.equal(intros.size,24);assert.equal(cues.size,35);
 const stopped=completed.media.filter(a=>/v2-(intro|cue)/.test(a.src)&&!a.ended);assert.equal(stopped.length,0,'uncompleted narration');assert.equal(completed.media.filter(a=>a.error).length,0);
 await p.screenshot({path:path.join(out,'auto-complete.png')});
 if(process.argv.includes('--en-only')){fs.writeFileSync(path.join(out,'english-auto-report.json'),JSON.stringify({errors,introCount:intros.size,cueCount:cues.size,completed},null,2));assert.deepEqual(errors,[]);console.log('ENGLISH AUTOMATIC JOURNEY PASSED');await browser.close();return;}
 await p.evaluate(()=>Courseware.go(17));await p.locator('#nextButton').click();await p.waitForFunction(()=>CinemaEngine.getState().progress>.76);await p.evaluate(()=>Courseware.togglePause());await p.screenshot({path:path.join(out,'fortress-final.png')});await p.evaluate(()=>Courseware.togglePause());await p.waitForFunction(()=>!Courseware.getState().busy);
 await p.evaluate(()=>Courseware.go(2));await p.locator('#nextButton').click();await p.waitForFunction(()=>CinemaEngine.getState().progress>.12);await p.evaluate(()=>Courseware.openModal('help'));const frozen=await p.evaluate(()=>CinemaEngine.getState().time);await p.waitForTimeout(500);assert.equal(await p.evaluate(()=>CinemaEngine.getState().time),frozen);await p.evaluate(()=>Courseware.closeModal());await p.waitForFunction(()=>!Courseware.getState().busy,null,{timeout:25000});
 await p.evaluate(()=>Courseware.setLanguage('en'));await p.evaluate(()=>Courseware.go(4));await p.locator('#nextButton').click();await p.waitForFunction(()=>Courseware.getState().index===5&&!Courseware.getState().busy,null,{timeout:25000});assert.equal(await p.evaluate(()=>CourseAudio.getState().voiceLang),'en');
 for(const name of ['space','study','poem','practice','help','classroom','audio']){await p.evaluate(name=>Courseware.openModal(name),name);assert(await p.locator('#dialog').isVisible());await p.evaluate(()=>Courseware.closeModal());}
 for(const lang of ['zh','bi','en']){await p.evaluate(lang=>Courseware.setLanguage(lang),lang);await p.evaluate(()=>CourseAudio.setNarration(false));await p.evaluate(()=>Courseware.go(0));for(const [w,h]of[[375,667],[390,844],[844,390],[1280,720],[1920,1080]]){await p.setViewportSize({width:w,height:h});const layout=await p.evaluate(()=>{const auto=document.querySelector('[data-action="auto-start"]').getBoundingClientRect(),fs=document.querySelector('#fullscreenButton').getBoundingClientRect();return{scroll:document.documentElement.scrollWidth,w:innerWidth,h:innerHeight,auto: auto.toJSON(),fs:fs.toJSON()};});assert(layout.scroll<=layout.w+1);assert(layout.fs.right<=w&&layout.fs.top>=0);assert(layout.auto.bottom<=h);await p.screenshot({path:path.join(out,`final-${lang}-${w}.png`)});}}
 fs.writeFileSync(path.join(out,'audit-report.json'),JSON.stringify({errors,unique,auto:completed,introCount:intros.size,cueCount:cues.size,checks:['fullscreen','pause-resume','24-scene automatic journey','all 59 voice tracks ended','modal mid-action resume','English sword action','seven dialogs','15 viewport/language combinations']},null,2));assert.deepEqual(errors,[]);console.log('AUDIT PASSED');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
