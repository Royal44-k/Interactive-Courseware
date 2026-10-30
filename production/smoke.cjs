const {chromium}=require('playwright');
const path=require('node:path');const fs=require('node:fs');const {pathToFileURL}=require('node:url');
(async()=>{
 const root=path.resolve(__dirname,'../课件');const out=path.resolve(__dirname,'验收');fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({channel:'msedge',headless:true});const context=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1,offline:true});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto(pathToFileURL(path.join(root,'index.html')).href);await page.waitForTimeout(1600);
 await page.screenshot({path:path.join(out,'01-封面.png')});
 console.log(JSON.stringify({title:await page.title(),errors,initial:await page.evaluate(()=>window.Courseware?.getState()),audio:await page.evaluate(()=>window.CourseAudio?.getState())},null,2));
 await page.click('#nextButton');await page.waitForTimeout(1700);await page.screenshot({path:path.join(out,'02-入境.png')});
 await page.click('[data-modal="study"]');await page.waitForTimeout(250);await page.screenshot({path:path.join(out,'03-研习.png')});
 await page.click('[data-study-tab="lines"]');await page.screenshot({path:path.join(out,'04-精读.png')});await page.click('[data-action="close"]');
 await page.click('[data-modal="space"]');await page.waitForTimeout(700);await page.screenshot({path:path.join(out,'05-意象空间.png')});
 console.log(JSON.stringify({errors,spaceCanvases:await page.locator('canvas').count()},null,2));await browser.close();
})().catch(e=>{console.error(e);process.exitCode=1;});
