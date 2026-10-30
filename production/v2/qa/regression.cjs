const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const crypto = require('node:crypto');
const out = __dirname;
const product = path.resolve(__dirname, '../../../视频复刻版');
const report = { started: new Date().toISOString(), protocol: 'file:', offline: true, browser: 'Microsoft Edge headless', results: [], pageErrors: [], consoleErrors: [], failedRequests: [], sourceHashes: {} };
for (const file of ['app.js', 'cinema.js', 'props.js', 'story.js']) report.sourceHashes[file] = crypto.createHash('sha256').update(fs.readFileSync(path.join(product, file))).digest('hex');
const save = () => fs.writeFileSync(path.join(out, 'regression-results.json'), JSON.stringify(report, null, 2));
function check(value, message) { if (!value) throw new Error(message); }
const state = p => p.evaluate(() => Courseware.getState());
const freeze = s => JSON.stringify({ time:s.motion.time, progress:s.motion.progress, view:s.motion.view, hand:s.motion.hand, lamp:s.motion.lamp, flight:s.motion.flight, water:s.motion.water, gate:s.motion.gate });
const ready = p => p.waitForFunction(() => window.Courseware && window.CinemaEngine && Courseware.getState().motion.frames > 2, null, {timeout:30000});
const idle = p => p.waitForFunction(() => !Courseware.getState().busy, null, {timeout:45000});
async function runCase(viewport, name, fn) {
  const started = Date.now();
  try { const detail = await fn(); report.results.push({viewport,name,pass:true,elapsedMs:Date.now()-started,detail}); console.log('PASS',viewport,name); }
  catch(error) { report.results.push({viewport,name,pass:false,elapsedMs:Date.now()-started,error:error.stack}); console.log('FAIL',viewport,name,error.message); }
  save();
}
async function main() {
  fs.mkdirSync(out,{recursive:true});
  const browser = await chromium.launch({channel:'msedge',headless:true,args:['--enable-unsafe-swiftshader']});
  report.browserVersion=browser.version(); save();
  for (const viewport of [{width:1440,height:900},{width:1280,height:720}]) {
    const label = viewport.width+'x'+viewport.height;
    const context = await browser.newContext({viewport,offline:true});
    const page = await context.newPage(); page.setDefaultTimeout(10000);
    page.on('pageerror',error=>{report.pageErrors.push({viewport:label,message:error.message,stack:error.stack});save();});
    page.on('console',msg=>{if(msg.type()==='error'){report.consoleErrors.push({viewport:label,text:msg.text()});save();}});
    page.on('requestfailed',req=>{report.failedRequests.push({viewport:label,url:req.url(),error:req.failure()?.errorText});save();});
    await page.goto(pathToFileURL(path.join(product,'index.html')).href); await ready(page);
    const scenes=await page.evaluate(()=>COURSE_STORY.map((s,i)=>({index:i,motion:s.motion,title:s.title.join('')})));
    check(scenes.length===18,'Expected 18 story states');
    for (const scene of scenes) {
      await runCase(label,'state '+scene.index+' '+scene.motion,async()=>{
        if((await state(page)).index!==scene.index) await page.evaluate(i=>Courseware.go(i),scene.index);
        await page.waitForTimeout(120);
        check(await page.locator('#nextButton').isVisible(),'Main action not visible');
        const layout = await page.evaluate(()=>({scroll:document.documentElement.scrollWidth, viewport:innerWidth, title:document.querySelector('#sceneTitle').textContent, next:document.querySelector('#nextButton').getBoundingClientRect().toJSON()}));
        check(layout.title.trim().length>0,'Empty scene title'); check(layout.scroll<=layout.viewport+1,'Horizontal overflow');
        check(layout.next.x>=0 && layout.next.y>=0 && layout.next.right<=viewport.width+1 && layout.next.bottom<=viewport.height+1,'Main action is outside viewport');
        if([0,4,9,12,13,17].includes(scene.index)) await page.screenshot({path:path.join(out,label+'-state-'+String(scene.index).padStart(2,'0')+'.png')});
        if(scene.index===6){
          for(let step=1;step<=3;step++) {await page.click('#nextButton');await idle(page); const s=await state(page);check(s.index===6&&s.interaction===step,'Walk should remain at state 6 with step '+step);}
          await page.click('#nextButton'); check((await state(page)).index===7,'Fourth walk click should advance');
        }else if(scene.index===12||scene.index===13){
          await page.click('#nextButton'); await page.waitForFunction(()=>Courseware.getState().busy,null,{timeout:5000}); await idle(page);
          const held=await state(page), text=await page.locator('#actionLabel').innerText(); check(held.index===scene.index,'Completed action should remain until a second click');
          check(text===(scene.index===12?'离开飞瀑，走向剑阁':'收回手，再想一想'),'Missing actionDone continuation label: '+text);
          await page.waitForTimeout(400);check((await state(page)).index===scene.index,'Held action advanced on its own');
          await page.screenshot({path:path.join(out,label+'-state-'+scene.index+'-action-done.png')});
          await page.click('#nextButton');check((await state(page)).index===scene.index+1,'Second click did not advance');
        }else if(scene.index===17){
          await page.click('#nextButton');check((await state(page)).modal==='poem','Ending action should open full poem');await page.keyboard.press('Escape');
        }else{
          await page.click('#nextButton');await idle(page);check((await state(page)).index===scene.index+1,'Action did not advance to expected state');
        }
        return {scene,after:await state(page),layout};
      });
    }
    await runCase(label,'pause freezes active motion and resumes',async()=>{
      await page.evaluate(()=>Courseware.go(1));await page.click('#nextButton');await page.waitForFunction(()=>Courseware.getState().motion.progress>.12);
      await page.click('#pauseButton');await page.waitForTimeout(120); const a=await state(page);await page.waitForTimeout(700);const b=await state(page);
      check(a.paused&&a.motion.paused&&a.busy,'Action did not enter paused state');check(freeze(a)===freeze(b),'Motion changed during pause');
      await page.screenshot({path:path.join(out,label+'-paused.png')});await page.locator('#paused [data-action="pause"]').click();
      await page.waitForFunction(t=>Courseware.getState().motion.time>t,null===a?0:a.motion.time);await idle(page);check((await state(page)).index===2,'Resumed action did not complete');
      return {before:a,afterFrozen:b,afterResumed:await state(page)};
    });
    await runCase(label,'modal freezes active motion and resumes',async()=>{
      await page.evaluate(()=>Courseware.go(1));await page.click('#nextButton');await page.waitForFunction(()=>Courseware.getState().motion.progress>.12);
      await page.locator('.topbar [data-modal="poem"]').click();await page.waitForTimeout(100);const a=await state(page);await page.waitForTimeout(700);const b=await state(page);
      check(a.modal==='poem'&&a.motion.paused&&a.busy,'Modal did not pause active action');check(freeze(a)===freeze(b),'Motion changed while modal was open');
      await page.keyboard.press('Escape');await page.waitForFunction(t=>Courseware.getState().motion.time>t,a.motion.time);await idle(page);check((await state(page)).index===2,'Closing modal did not resume action');
      return {before:a,afterFrozen:b,afterResumed:await state(page)};
    });
    await runCase(label,'chapter jump cancels active action',async()=>{
      await page.evaluate(()=>Courseware.go(1));await page.click('#nextButton');await page.waitForFunction(()=>Courseware.getState().motion.progress>.1);
      await page.locator('#chapterNav [data-chapter="3"]').click();const s=await state(page);check(s.index===9&&!s.busy&&!s.motion.busy,'Chapter jump did not cancel action and enter night scene');
      await page.waitForTimeout(3800);check((await state(page)).index===9,'Canceled action later advanced the chapter');check(await page.locator('#nextButton').isEnabled(),'Main action stayed disabled after cancellation');return {after:s,settled:await state(page)};
    });
    for(const modal of ['poem','study','practice','space','classroom','audio']) await runCase(label,'modal '+modal,async()=>{
      await page.keyboard.press('Escape');await page.locator('.topbar [data-modal="'+modal+'"]').click();check((await state(page)).modal===modal,'Modal state mismatch');check(await page.locator('#dialog').isVisible(),'Dialog invisible');
      check((await page.locator('#modalTitle').textContent()).trim().length>0,'Dialog title empty');
      if(modal==='poem'){await page.locator('[data-poem-part="2"]').click();check((await page.locator('.poem-page').textContent()).includes('剑阁'),'Full-poem third section missing');}
      if(modal==='study'){await page.locator('[data-study-tab="lines"]').first().click();await page.locator('[data-study-detail="words"]').click();check(await page.locator('.word-row').count()>0,'Word explanations missing');await page.locator('[data-study-detail="meaning"]').click();}
      if(modal==='practice'){await page.locator('#answerInput').fill('离线回归：用具体诗句分析山势与情绪。');await page.locator('[data-action="answer"]').click();check(await page.locator('#referenceAnswer').isVisible(),'Practice reference did not open');}
      if(modal==='space'){await page.locator('.ps-tab[data-mode="walkway"]').click();await page.locator('.ps-right').click();await page.locator('.ps-tab[data-mode="pass"]').click();check(await page.locator('.ps-tab[data-mode="pass"]').getAttribute('aria-pressed')==='true','Space tab failed');const canvas=await page.locator('.ps-canvas').boundingBox();check(canvas?.width>100&&canvas?.height>100,'Space canvas has no usable size');}
      await page.screenshot({path:path.join(out,label+'-modal-'+modal+'.png')});
      await page.keyboard.press('Escape');check((await state(page)).modal===null,'Escape did not close modal');check(!(await state(page)).motion.paused,'Scene did not resume after closing modal');
    });
    await runCase(label,'no runtime JavaScript or WebGL errors',async()=>{
      const errors=report.pageErrors.filter(e=>e.viewport===label);const consoleErrors=report.consoleErrors.filter(e=>e.viewport===label);check(errors.length===0,JSON.stringify(errors));check(consoleErrors.length===0,JSON.stringify(consoleErrors));
      const missing=report.failedRequests.filter(e=>e.viewport===label && !e.error.includes('ERR_ABORTED'));check(missing.length===0,JSON.stringify(missing));return {pageErrors:errors,consoleErrors,failedRequests:missing};
    });
    await context.close();
  }
  await browser.close();report.finished=new Date().toISOString();report.summary={passed:report.results.filter(r=>r.pass).length,failed:report.results.filter(r=>!r.pass).length};save();
  const lines=['# 视频复刻版离线功能回归','',`测试时间：${report.started} → ${report.finished}`,`环境：Edge ${report.browserVersion}；file://；offline=true；1440×900 / 1280×720。`,'',`通过 ${report.summary.passed} 项；失败 ${report.summary.failed} 项。`,'','## 失败项',''];
  const failures=report.results.filter(r=>!r.pass);lines.push(...(failures.length?failures.map(r=>`- ${r.viewport} / ${r.name}: ${r.error.split('\n')[0]}`):['无。']));
  lines.push('','## 覆盖','',...report.results.map(r=>`- ${r.pass?'通过':'失败'} · ${r.viewport} · ${r.name}`),'','完整状态、源文件 SHA-256 和错误信息见 regression-results.json。截图保存于同目录。');fs.writeFileSync(path.join(out,'回归报告.md'),lines.join('\n'));
  console.log('SUMMARY',JSON.stringify(report.summary));if(report.summary.failed)process.exitCode=1;
}
main().catch(error=>{report.fatal=error.stack;save();console.error(error);process.exitCode=1;});
