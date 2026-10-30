const{chromium}=require('playwright'),fs=require('fs'),path=require('path'),assert=require('assert'),{pathToFileURL}=require('url');
const pkg=JSON.parse(fs.readFileSync(path.join(__dirname,'package-report.json'),'utf8')),root=pkg.extracted,out=path.join(__dirname,'checks');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true,args:['--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']});
 const p=await browser.newPage({viewport:{width:375,height:667},offline:true}),errors=[],layouts=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await p.goto(pathToFileURL(path.join(root,'index.html')).href);await p.waitForFunction(()=>window.Courseware?.getState().ready,null,{timeout:60000});
 for(const lang of ['zh','bi','en']){
  await p.evaluate(lang=>Courseware.setLanguage(lang),lang);
  for(const [w,h]of[[375,667],[390,844],[844,390],[1280,720],[1920,1080]]){
   await p.setViewportSize({width:w,height:h});await p.waitForTimeout(70);
   const r=await p.evaluate(()=>{const b=s=>document.querySelector(s).getBoundingClientRect().toJSON();return{w:innerWidth,h:innerHeight,scroll:document.documentElement.scrollWidth,brand:b('.brand'),full:b('#fullscreenButton'),auto:b('[data-action="auto-start"]'),copy:b('#sceneExtra'),next:b('#nextButton')};});
   assert(r.scroll<=w+1);assert(r.brand.top>=0);assert(r.full.top>=0&&r.full.right<=w);assert(r.copy.bottom+5<=r.auto.top,`cover collision ${lang} ${w}: ${JSON.stringify(r)}`);assert(r.next.right<=w&&r.next.bottom<=h);layouts.push({lang,...r});
   await p.screenshot({path:path.join(out,`delivery-${lang}-${w}.png`)});
  }
 }
 const audioFiles=pkg.assets.filter(x=>/\.(mp3|ogg)$/.test(x)).map(x=>x.replaceAll('\\','/'));
 const audio=await p.evaluate(async files=>{const rows=[];for(let i=0;i<files.length;i+=10){rows.push(...await Promise.all(files.slice(i,i+10).map(src=>new Promise(r=>{const a=new Audio(src);a.onloadedmetadata=()=>r({src,duration:a.duration});a.onerror=()=>r({src,error:a.error?.message});}))));}return rows;},audioFiles);assert(audio.every(x=>x.duration>0&&!x.error));
 await p.setViewportSize({width:1440,height:900});await p.evaluate(()=>{Courseware.setLanguage('bi');CourseAudio.setNarration(false);});await p.waitForTimeout(1500);await p.screenshot({path:path.join(out,'final-cloud-start.png')});
 const cloudPerformance=await p.evaluate(()=>new Promise(resolve=>{let last=performance.now(),start=last;const frames=[];const tick=t=>{frames.push(t-last);last=t;if(t-start<8000)requestAnimationFrame(tick);else{frames.sort((a,b)=>a-b);resolve({frames:frames.length,p95:frames[Math.floor(frames.length*.95)],max:frames.at(-1),over34:frames.filter(x=>x>34).length});}};requestAnimationFrame(tick);}));await p.screenshot({path:path.join(out,'final-cloud-end.png')});
 await p.evaluate(()=>Courseware.go(17));assert(await p.evaluate(()=>[...document.querySelectorAll('.cover-cloud-layer')].every(c=>+getComputedStyle(c.parentElement).opacity<.01)));await p.screenshot({path:path.join(out,'delivery-fortress-far.png')});
 await p.evaluate(()=>Courseware.go(15));await p.locator('#nextButton').click();await p.waitForFunction(()=>CourseAudio.getState().effectActive);await p.screenshot({path:path.join(out,'delivery-cuckoo.png')});await p.evaluate(()=>Courseware.go(23));await p.screenshot({path:path.join(out,'delivery-ending.png')});
 await p.evaluate(()=>Courseware.go(18));await p.evaluate(()=>Courseware.openModal('explain'));await p.locator('[data-stage-voice="18"]').click();await p.waitForFunction(()=>CourseAudio.getState().playing);assert.match(await p.evaluate(()=>CourseAudio.getState().track),/^v2-study-18/);await p.evaluate(()=>Courseware.closeModal());
 fs.writeFileSync(path.join(out,'delivery-report.json'),JSON.stringify({errors,layouts,audio,cloudPerformance,packageSha256:pkg.sha256},null,2));assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:true,audioFiles:audio.length,layouts:layouts.length,cloudPerformance,errors}));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
