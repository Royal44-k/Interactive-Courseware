const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),{pathToFileURL}=require('url');
const root=path.resolve(__dirname,'../../山海行歌-V2.0'),out=path.join(__dirname,'checks');fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true,args:['--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']});
 const p=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await p.goto(pathToFileURL(path.join(root,'index.html')).href);await p.waitForFunction(()=>window.Courseware?.getState().ready,null,{timeout:60000});
 await p.screenshot({path:path.join(out,'cover.png')});
 console.log('READY',await p.evaluate(()=>({state:Courseware.getState(),cloud:window.CloudSea?.getState()})));
 await p.waitForTimeout(3000);await p.screenshot({path:path.join(out,'cover-after.png')});
 for(const [w,h] of [[390,844],[375,667],[844,390],[1280,720]]){await p.setViewportSize({width:w,height:h});await p.screenshot({path:path.join(out,`cover-${w}.png`)});console.log('LAYOUT',w,await p.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,full:document.querySelector('#fullscreenButton').getBoundingClientRect().toJSON(),auto:document.querySelector('[data-action="auto-start"]').getBoundingClientRect().toJSON(),next:document.querySelector('#nextButton').getBoundingClientRect().toJSON()})));}
 await p.setViewportSize({width:1440,height:900});
 await p.evaluate(()=>{CourseAudio.setNarration(false);CourseAudio.setMuted(true);});
 for(const [i,marks] of [[5,[.23,.48,.71,.96]],[11,[.2,.9]],[15,[.1,.7]],[17,[.02,.34,.68,.75,.84,.99]],[23,[]]]){
  await p.evaluate(i=>Courseware.go(i),i);await p.screenshot({path:path.join(out,`scene-${i}.png`)});
  if(marks.length){await p.locator('#nextButton').click();for(const mark of marks){await p.waitForFunction(m=>CinemaEngine.getState().progress>=m,mark,{timeout:35000});await p.evaluate(()=>CinemaEngine.setPaused(true));await p.screenshot({path:path.join(out,`scene-${i}-${Math.round(mark*100)}.png`)});await p.evaluate(()=>CinemaEngine.setPaused(false));}await p.waitForFunction(()=>!Courseware.getState().busy,null,{timeout:15000});}
  console.log('SCENE',i);
 }
 fs.writeFileSync(path.join(out,'initial-report.json'),JSON.stringify({errors},null,2));console.log('ERRORS',errors);await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
