const {chromium}=require('playwright');
const fs=require('fs'),path=require('path'),crypto=require('crypto'),{pathToFileURL}=require('url');
const product=path.resolve(__dirname,'../../../视频复刻版'),report={started:new Date().toISOString(),offline:true,results:[],errors:[],sources:{}};
for(const f of ['app.js','cinema.js','props.js','index.html','cinema.css'])report.sources[f]=crypto.createHash('sha256').update(fs.readFileSync(path.join(product,f))).digest('hex');
const save=()=>fs.writeFileSync(path.join(__dirname,'supplemental-results.json'),JSON.stringify(report,null,2));
const check=(v,m)=>{if(!v)throw Error(m)};
const state=p=>p.evaluate(()=>Courseware.getState());
const frozen=s=>JSON.stringify({time:s.motion.time,progress:s.motion.progress,view:s.motion.view,hand:s.motion.hand,gate:s.motion.gate});
async function test(label,name,fn){try{report.results.push({viewport:label,name,pass:true,detail:await fn()});console.log('PASS',label,name);}catch(e){report.results.push({viewport:label,name,pass:false,error:e.stack});console.log('FAIL',label,name,e.message);}save();}
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true,args:['--enable-unsafe-swiftshader']});
 for(const viewport of [{width:1440,height:900},{width:1280,height:720}]){
  const label=viewport.width+'x'+viewport.height,context=await browser.newContext({viewport,offline:true}),p=await context.newPage();
  p.on('pageerror',e=>report.errors.push({viewport:label,type:'pageerror',message:e.message}));p.on('console',m=>{if(m.type()==='error')report.errors.push({viewport:label,type:'console',message:m.text()});});
  await p.goto(pathToFileURL(path.join(product,'index.html')).href);await p.waitForFunction(()=>window.Courseware&&Courseware.getState().motion.frames>2);
  await test(label,'real blank-scene pointer click advances',async()=>{
   await p.evaluate(()=>Courseware.go(0));await p.waitForTimeout(300);const x=viewport.width*.7,y=viewport.height*.5;
   const hit=await p.evaluate(({x,y})=>({id:document.elementFromPoint(x,y)?.id,tag:document.elementFromPoint(x,y)?.tagName}),{x,y});check(hit.id==='cinemaCanvas','Blank coordinate is covered: '+JSON.stringify(hit));
   await p.mouse.click(x,y);await p.waitForFunction(()=>Courseware.getState().busy);await p.waitForFunction(()=>!Courseware.getState().busy,null,{timeout:30000});check((await state(p)).index===1,'Blank scene click did not advance');return{hit,after:await state(p)};
  });
  await test(label,'real door-board pointer click opens gate',async()=>{
   await p.evaluate(()=>Courseware.go(1));await p.waitForTimeout(1000);await p.screenshot({path:path.join(__dirname,label+'-supp-door-before.png')});
   const x=viewport.width*.61,y=viewport.height*.48;const hit=await p.evaluate(({x,y})=>({id:document.elementFromPoint(x,y)?.id,tag:document.elementFromPoint(x,y)?.tagName}),{x,y});check(hit.id==='cinemaCanvas','Door is covered: '+JSON.stringify(hit));
   await p.mouse.click(x,y);await p.waitForFunction(()=>Courseware.getState().motion.progress>.12);const moving=await state(p);check(moving.motion.gate.left<0&&moving.motion.gate.right>0,'Door leaves are not opening');await p.waitForFunction(()=>!Courseware.getState().busy,null,{timeout:30000});check((await state(p)).index===2,'Door click did not complete');return{hit,moving,after:await state(p)};
  });
  await test(label,'Space starts action and P freezes/resumes',async()=>{
   await p.evaluate(()=>{Courseware.go(1);document.activeElement?.blur();});await p.keyboard.press('Space');await p.waitForFunction(()=>Courseware.getState().motion.progress>.1);
   await p.keyboard.press('p');await p.waitForTimeout(100);const a=await state(p);await p.keyboard.press('Space');await p.waitForTimeout(600);const b=await state(p);check(a.paused&&a.motion.paused,'P did not pause');check(frozen(a)===frozen(b)&&b.index===1,'Space or time progressed a paused action');
   await p.keyboard.press('p');await p.waitForFunction(()=>!Courseware.getState().busy,null,{timeout:30000});check((await state(p)).index===2,'P resume did not complete');return{paused:a,stillPaused:b,after:await state(p)};
  });
  await test(label,'latest modal freeze and chapter cancellation',async()=>{
   await p.evaluate(()=>Courseware.go(1));await p.click('#nextButton');await p.waitForFunction(()=>Courseware.getState().motion.progress>.1);await p.locator('.topbar [data-modal="poem"]').click();await p.waitForTimeout(100);const a=await state(p);await p.waitForTimeout(450);check(frozen(a)===frozen(await state(p)),'Latest engine changed during modal');await p.keyboard.press('Escape');await p.waitForFunction(t=>Courseware.getState().motion.time>t,a.motion.time);
   await p.locator('#chapterNav [data-chapter="3"]').click();await p.waitForTimeout(1200);const s=await state(p);check(s.index===9&&!s.busy&&!s.motion.busy,'Latest engine failed chapter cancellation');return s;
  });
  await test(label,'visible controls not clipped or covered',async()=>{
   const snapshots=[];
   for(const i of [0,1,4,9,12,13,17]){await p.evaluate(i=>Courseware.go(i),i);await p.waitForTimeout(180);const result=await p.evaluate(()=>{
    const selectors='.topbar button,#pauseButton,#readLine,#nextButton,#chapterNav button,.journey .back';const controls=[...document.querySelectorAll(selectors)].filter(e=>{const s=getComputedStyle(e);return s.display!=='none'&&s.visibility!=='hidden'&&e.getClientRects().length;});
    return controls.map(e=>{const b=e.getBoundingClientRect(),hit=document.elementFromPoint(b.x+b.width/2,b.y+b.height/2);return{text:e.textContent.trim(),outside:b.x<-.5||b.y<-.5||b.right>innerWidth+.5||b.bottom>innerHeight+.5,covered:!(hit===e||e.contains(hit)),hit:hit?.id||hit?.className,rect:{x:b.x,y:b.y,w:b.width,h:b.height}};});
   });const bad=result.filter(r=>r.outside||r.covered);check(!bad.length,'State '+i+' blocked controls '+JSON.stringify(bad));snapshots.push({index:i,checked:result.length});}
   return snapshots;
  });
  await test(label,'waterfall stays visible for 2s with valid shader/SVG animation',async()=>{
   await p.evaluate(()=>Courseware.go(12));await p.waitForTimeout(1000);const a=await p.locator('#waterFlow').getAttribute('dy');await p.waitForTimeout(2100);const b=await p.locator('#waterFlow').getAttribute('dy');
   const visual=await p.locator('#waterSurface').evaluate(e=>({opacity:getComputedStyle(e).opacity,filter:getComputedStyle(e).filter,width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height}));check(a!==b,'SVG turbulence offset is static');check(+visual.opacity>0&&visual.width>0,'Water surface overlay is hidden');
   await p.screenshot({path:path.join(__dirname,label+'-supp-waterfall-held-2s.png')});check(report.errors.filter(e=>e.viewport===label).length===0,'Browser reports errors: '+JSON.stringify(report.errors));return{offsetBefore:a,offsetAfter:b,visual,state:await state(p)};
  });
  await context.close();
 }
 await browser.close();report.finished=new Date().toISOString();report.summary={passed:report.results.filter(r=>r.pass).length,failed:report.results.filter(r=>!r.pass).length};report.sourcesUnchanged=Object.entries(report.sources).every(([f,h])=>crypto.createHash('sha256').update(fs.readFileSync(path.join(product,f))).digest('hex')===h);save();
 const text=['','## 最新版本补测','',`时间：${report.started} → ${report.finished}。通过 ${report.summary.passed}，失败 ${report.summary.failed}。`,`测试结束时源文件是否与开始一致：${report.sourcesUnchanged}。`,'',...report.results.map(r=>`- ${r.pass?'通过':'失败'} · ${r.viewport} · ${r.name}${r.error?' · '+r.error.split('\n')[0]:''}`),'','补测详情见 supplemental-results.json；飞瀑停留截图见 *-supp-waterfall-held-2s.png。','首次全回归出现的两条请求中断均为关闭浏览器上下文时的 music.mp3 / ERR_ABORTED，无缺失资源错误。'];fs.appendFileSync(path.join(__dirname,'回归报告.md'),text.join('\n'));
 console.log('SUMMARY',JSON.stringify(report.summary),'sourcesUnchanged',report.sourcesUnchanged);if(report.summary.failed)process.exitCode=1;
})().catch(e=>{report.fatal=e.stack;save();console.error(e);process.exitCode=1;});
