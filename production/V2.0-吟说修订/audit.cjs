const{chromium}=require('playwright'),fs=require('fs'),path=require('path'),assert=require('assert'),{pathToFileURL}=require('url');
const root=path.resolve(__dirname,'../../山海行歌-V2.0'),out=path.join(__dirname,'checks');fs.mkdirSync(out,{recursive:true});
const lang=process.argv.includes('--en')?'en':'zh';
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true,args:['--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']});
 const p=await browser.newPage({viewport:{width:1120,height:700},offline:true}),errors=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await p.addInitScript(()=>{
  const raf=requestAnimationFrame.bind(window),now=performance.now.bind(performance);window.requestAnimationFrame=fn=>raf(t=>fn(t*4));performance.now=()=>now()*4;
  window.__media=[];window.__voiceLog=[];const Audio0=Audio;
  window.Audio=function(...args){const a=new Audio0(...args);window.__media.push(a);const play=a.play.bind(a);a.play=()=>{a.playbackRate=4;return play();};for(const event of ['playing','ended','pause','error'])a.addEventListener(event,()=>{if(/v2r-(intro|cue)/.test(a.src))window.__voiceLog.push({event,track:a.src.split('/').at(-1),t:CinemaEngine.getState().time,progress:CinemaEngine.getState().progress,scene:Courseware.getState().index});});return a;};
  window.__cues=[];addEventListener('cinema-cue',e=>__cues.push({scene:e.detail.scene,key:e.detail.key,t:CinemaEngine.getState().time}));
 });
 await p.goto(pathToFileURL(path.join(root,'index.html')).href);await p.waitForFunction(()=>window.Courseware?.getState().ready,null,{timeout:60000});
 await p.evaluate(lang=>Courseware.setLanguage(lang),lang);
 await p.locator('#fullscreenButton').click();assert(await p.evaluate(()=>!!document.fullscreenElement));await p.locator('#fullscreenButton').click();
 const readyStyle=await p.locator('#nextButton').evaluate(el=>({before:getComputedStyle(el,'::before').animationName,after:getComputedStyle(el,'::after').animationName}));assert.equal(readyStyle.before,'water-ring');assert.equal(readyStyle.after,'water-ring');
 await p.locator('[data-action="auto-start"]').click();await p.waitForFunction(()=>CourseAudio.getState().playing);
 await p.locator('#pauseButton').click();const held=await p.evaluate(()=>({t:CinemaEngine.getState().time,v:CourseAudio.getState().currentTime}));await p.waitForTimeout(550);assert.deepEqual(await p.evaluate(()=>({t:CinemaEngine.getState().time,v:CourseAudio.getState().currentTime})),held);await p.locator('#paused [data-action="pause"]').click();
 let last=-1;for(let n=0;n<850;n++){const s=await p.evaluate(()=>Courseware.getState());if(s.index!==last){last=s.index;console.log(lang,'scene',s.index,s.phase);}if(s.phase==='complete')break;await p.waitForTimeout(500);if(n===849)throw Error('Tour stalled '+JSON.stringify(s));}
 const result=await p.evaluate(()=>({state:Courseware.getState(),events:__voiceLog,cues:__cues,media:__media.filter(a=>/v2r-(intro|cue)/.test(a.src)).map(a=>({track:a.src.split('/').at(-1),ended:a.ended,error:a.error?.message,duration:a.duration}))}));
 assert.equal(result.state.index,23);assert.equal(result.state.auto,false);assert.equal(result.state.busy,false);assert.equal(result.media.length,59);assert(result.media.every(a=>a.ended&&!a.error));assert.equal(result.cues.length,35);assert.equal(new Set(result.cues.map(c=>c.scene+'-'+c.key)).size,35);
 const unfinished=new Set();for(const e of result.events){if(e.event==='playing')unfinished.add(e.track);if(e.event==='ended')unfinished.delete(e.track);assert(unfinished.size<=1,'overlapping narration '+[...unfinished]);}assert.equal(unfinished.size,0);
 const gaps=[];let end;for(const e of result.events){if(e.event==='ended')end=e;if(e.event==='playing'&&end&&e.track!==end.track){gaps.push({from:end.track,to:e.track,seconds:+(e.t-end.t).toFixed(3)});end=null;}}
 result.gaps=gaps;result.audioSeconds=result.media.reduce((s,a)=>s+a.duration,0);result.errors=errors;result.readyStyle=readyStyle;
 await p.screenshot({path:path.join(out,`complete-${lang}.png`)});fs.writeFileSync(path.join(out,`auto-${lang}.json`),JSON.stringify(result,null,2));assert.deepEqual(errors,[]);
 console.log('PASS',lang,JSON.stringify({tracks:59,cues:35,seconds:result.state.motion.time,audio:result.audioSeconds,longestGaps:gaps.sort((a,b)=>b.seconds-a.seconds).slice(0,5)}));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
