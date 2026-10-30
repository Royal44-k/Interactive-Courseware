const{chromium}=require('playwright'),fs=require('fs'),path=require('path'),assert=require('assert'),{pathToFileURL}=require('url');
const root=path.resolve(__dirname,'../../山海行歌-V2.0'),out=path.join(__dirname,'checks');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true,args:['--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']});
 const p=await browser.newPage({viewport:{width:1440,height:900},offline:true}),errors=[],shots=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await p.goto(pathToFileURL(path.join(root,'index.html')).href);await p.waitForFunction(()=>window.Courseware?.getState().ready,null,{timeout:60000});
 await p.waitForTimeout(2000);await p.mouse.move(720,450);await p.screenshot({path:path.join(out,'cloud-start.png')});
 const perf=await p.evaluate(()=>new Promise(resolve=>{const gaps=[],begin=performance.now();let last=begin;function tick(t){gaps.push(t-last);last=t;if(t-begin<8000)requestAnimationFrame(tick);else{gaps.sort((a,b)=>a-b);resolve({frames:gaps.length,p50:gaps[Math.floor(gaps.length*.5)],p95:gaps[Math.floor(gaps.length*.95)],max:gaps.at(-1),over34:gaps.filter(x=>x>34).length,cloud:CloudSea.getState()});}}requestAnimationFrame(tick);}));
 await p.screenshot({path:path.join(out,'cloud-end.png')});console.log('PERF',perf);
 for(const [i,marks] of [[3,[.15,.29,.5,.8]],[4,[.25,.67]],[5,[.16,.40,.65,.90]],[17,[.35,.65,.74,.81,.99]]]){
  await p.evaluate(i=>Courseware.go(i),i);await p.locator('#nextButton').click();
  for(const mark of marks){await p.waitForFunction(m=>CinemaEngine.getState().progress>=m,mark,{timeout:40000});await p.evaluate(()=>{CinemaEngine.setPaused(true);CourseAudio.pause();});shots.push(await p.evaluate(()=>({motion:CinemaEngine.getState(),audio:CourseAudio.getState()})));await p.screenshot({path:path.join(out,`verified-${i}-${Math.round(mark*100)}.png`)});await p.evaluate(()=>{CinemaEngine.setPaused(false);CourseAudio.resume();});}
  await p.waitForFunction(()=>!Courseware.getState().busy,null,{timeout:40000});console.log('VERIFIED',i);
 }
 const durations=await p.evaluate(async()=>{const files=Object.keys(V2_VOICE_TIMING).map(k=>'assets/audio/'+k+'.mp3');files.push('assets/audio/cuckoo.ogg');const result=[];for(let i=0;i<files.length;i+=8){result.push(...await Promise.all(files.slice(i,i+8).map(src=>new Promise(resolve=>{const a=new Audio(src);a.onloadedmetadata=()=>resolve({src,duration:a.duration});a.onerror=()=>resolve({src,error:a.error?.message});}))));}return result;});assert.equal(durations.length,119);assert(durations.every(x=>x.duration>0&&!x.error));
 const reduced=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});await reduced.goto(pathToFileURL(path.join(root,'index.html')).href);await reduced.waitForFunction(()=>window.Courseware?.getState().ready);assert.equal(await reduced.locator('.cover-cloud-layer').count(),0);assert.equal(await reduced.locator('#nextButton').evaluate(el=>getComputedStyle(el).animationName),'none');await reduced.close();
 fs.writeFileSync(path.join(out,'final-report.json'),JSON.stringify({errors,perf,shots,durations},null,2));assert.deepEqual(errors,[]);console.log('FINAL CHECK PASSED');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
