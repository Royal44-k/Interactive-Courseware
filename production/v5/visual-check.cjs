const{chromium}=require('playwright'),fs=require('fs'),path=require('path'),{pathToFileURL}=require('url');
(async()=>{
 const out=path.join(__dirname,'visual');fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({channel:'msedge',headless:true,args:['--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']});
 const context=await browser.newContext({viewport:{width:1440,height:900},offline:true});const p=await context.newPage(),errors=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await p.goto(pathToFileURL(path.resolve(__dirname,'../../山海行歌-双语精修版/index.html')).href);await p.waitForFunction(()=>window.Courseware?.getState().ready,null,{timeout:60000});
 await p.evaluate(()=>{CourseAudio.setNarration(false);CourseAudio.setMuted(true)});await p.mouse.move(720,450);await p.screenshot({path:path.join(out,'cover-bi.png')});
 const result=[];
 for(const [index,points] of [[1,[.23,.52,.83]],[2,[.15,.31,.48,.65,.72,.85,.98]],[3,[.35,.7,.98]],[4,[.29,.7]],[13,[.35,.72]],[14,[.3,.6,.95]]]){
  await p.evaluate(i=>Courseware.go(i),index);await p.locator('#nextButton').click();
  for(const progress of points){await p.waitForFunction(q=>CinemaEngine.getState().progress>=q,null===progress?null:progress,{timeout:25000});await p.evaluate(()=>CinemaEngine.setPaused(true));await p.screenshot({path:path.join(out,`action-${index}-${Math.round(progress*100)}.png`)});result.push(await p.evaluate(()=>CinemaEngine.getState()));await p.evaluate(()=>CinemaEngine.setPaused(false));}
  await p.waitForFunction(()=>!Courseware.getState().busy,null,{timeout:20000});console.log('ACTION',index);
 }
 for(const i of [6,8,10,12,16,20]){await p.evaluate(i=>Courseware.go(i),i);await p.locator('#nextButton').click();await p.waitForFunction(()=>!Courseware.getState().busy,null,{timeout:16000});await p.screenshot({path:path.join(out,`vista-${i}.png`)});console.log('VISTA',i);}
 await p.evaluate(()=>{Courseware.setLanguage('en')});await p.evaluate(()=>Courseware.go(22));await p.screenshot({path:path.join(out,'english.png')});
 for(const [name,w,h] of [['mobile',390,844],['landscape',844,390],['desktop',1280,720]]){await p.setViewportSize({width:w,height:h});await p.evaluate(()=>Courseware.go(0));await p.screenshot({path:path.join(out,`${name}-cover.png`)});await p.evaluate(()=>Courseware.go(11));await p.screenshot({path:path.join(out,`${name}-scene.png`)});}
 fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({errors,result},null,2));console.log('ERRORS',JSON.stringify(errors));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
