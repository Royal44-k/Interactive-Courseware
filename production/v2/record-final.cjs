const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
(async()=>{
 const out=path.resolve(__dirname,'最终实录');fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({channel:'msedge',headless:true,args:['--enable-unsafe-swiftshader']});
 const context=await browser.newContext({viewport:{width:1440,height:810},recordVideo:{dir:out,size:{width:1440,height:810}},offline:true});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(path.resolve(__dirname,'../../视频复刻版/index.html')).href);
 await page.waitForTimeout(1500);await page.mouse.move(720,400);
 let count=0;
 while(count++<24){
  const before=await page.evaluate(()=>Courseware.getState());
  if(before.index===17)break;
  const name=String(before.index).padStart(2,'0')+'-'+before.interaction;
  await page.screenshot({path:path.join(out,name+'-before.png')});
  await page.click('#nextButton');await page.mouse.move(720,410);
  await page.waitForTimeout(600);
  if([1,4,7,9,12].includes(before.index))await page.screenshot({path:path.join(out,name+'-moving.png')});
  await page.waitForFunction(()=>!Courseware.getState().busy,{},{timeout:15000});
  await page.waitForTimeout([1,7,9,12,13].includes(before.index)?1800:850);
  const after=await page.evaluate(()=>Courseware.getState());console.log(JSON.stringify({from:before.index,to:after.index,interaction:after.interaction,frames:after.motion.frames,time:after.motion.time}));
 }
 await page.waitForTimeout(1800);await page.screenshot({path:path.join(out,'17-ending.png')});
 await page.evaluate(()=>Courseware.go(7));await page.waitForTimeout(300);await page.click('#nextButton');await page.waitForFunction(()=>!Courseware.getState().busy,{},{timeout:15000});await page.waitForTimeout(500);
 await page.screenshot({path:path.join(out,'星辰-终态.png')});
 await page.evaluate(()=>Courseware.go(9));await page.waitForTimeout(400);await page.click('#nextButton');await page.waitForFunction(()=>!Courseware.getState().busy,{},{timeout:15000});await page.waitForTimeout(500);
 await page.screenshot({path:path.join(out,'提灯-终态.png')});
 const state=await page.evaluate(()=>Courseware.getState());fs.writeFileSync(path.join(out,'record-report.json'),JSON.stringify({errors,state},null,2));
 const videoPath=await page.video().path();await context.close();await browser.close();fs.copyFileSync(videoPath,path.join(out,'完整操作.webm'));console.log({errors,videoPath});
})().catch(e=>{console.error(e);process.exit(1);});
