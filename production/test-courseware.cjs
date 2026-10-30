/* Independent offline browser audit; does not modify courseware source. */
const fs = require('node:fs');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const {chromium} = require('playwright');

const root = path.resolve(__dirname, '..');
const output = process.env.COURSEWARE_AUDIT_DIR || path.join(__dirname, '验收');
const entry = process.env.COURSEWARE_ENTRY || path.join(root, '课件', 'index.html');
fs.mkdirSync(output, {recursive:true});
const report = {createdAt:new Date().toISOString(),entry,environment:{browser:'Microsoft Edge / Playwright',offline:true},checks:[],geometry:[],screenshots:[],pageErrors:[],consoleErrors:[],requestFailures:[],journey:[],audioEvidence:[]};
let browser, context, page;
const fail = (message, details) => { const error=new Error(message);error.details=details;throw error; };
const assert = (condition,message,details) => { if(!condition)fail(message,details); };
const courseState = () => page.evaluate(()=>window.Courseware.getState());
const audioState = () => page.evaluate(()=>window.CourseAudio.getState());
async function snap(name){const filename='audit-'+name+'.png';await page.screenshot({path:path.join(output,filename),fullPage:false});report.screenshots.push(filename);return filename;}
async function check(name,fn){const started=Date.now();try{const detail=await fn();report.checks.push({name,pass:true,durationMs:Date.now()-started,...(detail?{detail}: {})});console.log('PASS '+name);}catch(error){report.checks.push({name,pass:false,durationMs:Date.now()-started,error:error.message,details:error.details});console.log('FAIL '+name+': '+error.message);try{await snap('failure-'+report.checks.length);}catch{}}}
async function close(){if(await page.locator('#modalLayer').isVisible())await page.locator('#dialog > .close').click();}
async function open(name){await close();await page.locator('.tools [data-modal="'+name+'"]').click();await page.waitForTimeout(100);}
async function range(selector,value){await page.locator(selector).evaluate((element,value)=>{element.value=String(value);element.dispatchEvent(new Event('input',{bubbles:true}));},value);}
async function goChapter(chapter){await close();await page.locator('#chapterNav [data-chapter="'+chapter+'"]').click();}

async function geometry(label){
  const data=await page.evaluate(()=>{
    const modal=document.querySelector('#dialog');const view={left:0,top:0,right:innerWidth,bottom:innerHeight};
    const rect=e=>{const r=e.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
    const bounds=rect(modal);const clip={left:Math.max(0,bounds.left),top:Math.max(0,bounds.top),right:Math.min(innerWidth,bounds.right),bottom:Math.min(innerHeight,bounds.bottom)};
    const visible=e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return !e.hidden&&s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0&&!e.closest('[hidden]');};
    const wanted='#modalTitle,.dialog-kicker,.quote,.quote span,.gloss-item,.word-row,.word-row b,.word-row small,.word-row p,.detail-tabs,.study-detail,.study-detail>p,.insight,.insight p,.page-numbers button,.tabbar button,.verse-picker,.panel-footer,.panel-footer button,.practice-title,.practice-hint,.input-label,#answerInput,.answer-toggle,#referenceAnswer,.poem-page p,.audio-setting,.audio-buttons,.audio-help,.audio-credit,.sigh,.sigh p,.sigh h3,.source-links,.study-text,.ps-info,.ps-verse,.ps-observation,.ps-control,.ps-button,.ps-note,.ps-heading,.ps-tabs,.ps-scene-heading,.ps-stage-footer';
    const nodes=[...modal.querySelectorAll(wanted)].filter(visible).filter(e=>!e.classList.contains('space-sr-only'));
    const elements=nodes.map(e=>({tag:e.tagName,selector:e.id?'#'+e.id:'.'+[...e.classList].join('.'),text:e.textContent.trim().replace(/\s+/g,' ').slice(0,90),rect:rect(e)}));
    const overflow=elements.filter(e=>e.rect.left<clip.left-1||e.rect.top<clip.top-1||e.rect.right>clip.right+1||e.rect.bottom>clip.bottom+1);
    const outsideView=elements.filter(e=>e.rect.left<view.left-1||e.rect.top<view.top-1||e.rect.right>view.right+1||e.rect.bottom>view.bottom+1);
    const textOverflow=[];
    for(const e of nodes){if(e.children.length||!e.textContent.trim()||['INPUT','TEXTAREA','BUTTON'].includes(e.tagName))continue;const r=document.createRange();r.selectNodeContents(e);const box=r.getBoundingClientRect();const own=e.getBoundingClientRect();if(box.left<clip.left-1||box.top<clip.top-1||box.right>clip.right+1||box.bottom>clip.bottom+1)textOverflow.push({selector:e.id?'#'+e.id:'.'+[...e.classList].join('.'),text:e.textContent.trim().slice(0,70),rect:{left:box.left,top:box.top,right:box.right,bottom:box.bottom},own:rect(e)});}
    const footer=modal.querySelector('.panel-footer');const overlaps=[];
    if(footer&&visible(footer)){const f=footer.getBoundingClientRect();for(const e of nodes){if(e===footer||footer.contains(e)||e.contains(footer))continue;const r=e.getBoundingClientRect();if(r.top<f.bottom-2&&r.bottom>f.top+2&&r.left<f.right-2&&r.right>f.left+2)overlaps.push({text:e.textContent.trim().slice(0,70),selector:e.id?'#'+e.id:'.'+[...e.classList].join('.'),bottom:r.bottom,footerTop:f.top});}}
    return {viewport:{width:innerWidth,height:innerHeight},dialog:bounds,overflow,outsideView,textOverflow,footerOverlaps:overlaps,elementCount:elements.length};
  });
  report.geometry.push({label,...data});
  return data;
}

async function auditLayout(width,height){
 await page.setViewportSize({width,height});const size=width+'x'+height;
 await goChapter(2);await open('study');await page.locator('.tabbar [data-study-tab="lines"]').click();
 for(const chapter of [0,1,2,3,4,5]){
  await page.locator('.page-numbers [data-study-page="'+chapter+'"]').click();
  await page.locator('[data-study-detail="reading"]').click();
  const count=await page.locator('[data-study-line]').count();
  for(let line=0;line<count;line++){
   await page.locator('[data-study-line="'+line+'"]').click();await page.waitForTimeout(60);
   await geometry(size+' study chapter '+(chapter+1)+' lines '+(line+1));
   if(line===count-1&&[2,4].includes(chapter))await snap(size+'-study-'+(chapter+1));
  }
  for(const detail of ['words','meaning']){
   await page.locator('[data-study-detail="'+detail+'"]').click();
   await geometry(size+' study chapter '+(chapter+1)+' '+detail);
   if([2,4].includes(chapter))await snap(size+'-study-'+(chapter+1)+'-'+detail);
  }
 }
 for(const tab of ['about','emotion','sources']){await page.locator('.tabbar [data-study-tab="'+tab+'"]').click();await geometry(size+' study '+tab);if(tab==='emotion')await snap(size+'-sighs');}
 await open('practice');
 for(let i=0;i<6;i++){await page.locator('.page-numbers [data-practice-page="'+i+'"]').click();await page.locator('[data-action="answer"]').click();await geometry(size+' practice answer '+(i+1));if(i===4)await snap(size+'-practice-answer');}
 await goChapter(4);await open('classroom');await geometry(size+' classroom chapter 5');await snap(size+'-classroom');
 await open('poem');await page.locator('[data-poem-part="0"]').click();for(let i=0;i<5;i++){await geometry(size+' poem '+(i+1));if(i<4)await page.locator('.pager button').last().click();}
 await open('audio');await geometry(size+' audio');
 await open('space');for(const mode of ['mountain','walkway','pass']){await page.locator('.ps-tab[data-mode="'+mode+'"]').click();await page.waitForTimeout(160);await geometry(size+' 3D '+mode);if(width<500)await snap(size+'-3d-'+mode);}await snap(size+'-3d');
 await close();await snap(size+'-scene');
 const results=report.geometry.filter(g=>g.label.startsWith(size));const failures=results.filter(g=>g.overflow.length||g.outsideView.length||g.textOverflow.length||g.footerOverlaps.length);
 assert(!failures.length,failures.length+' screens have clipping or footer overlap',failures.map(g=>({label:g.label,overflow:g.overflow,textOverflow:g.textOverflow,footerOverlaps:g.footerOverlaps})));
 return {screens:results.length};
}

(async()=>{
 try{
  browser=await chromium.launch({channel:'msedge',headless:true});
  report.environment.version=browser.version();
  context=await browser.newContext({viewport:{width:1440,height:900},offline:true,reducedMotion:'reduce'});
  page=await context.newPage();page.setDefaultTimeout(6000);
  page.on('pageerror',error=>report.pageErrors.push(error.message));
  page.on('console',message=>{if(message.type()==='error')report.consoleErrors.push(message.text());});
  page.on('requestfailed',request=>report.requestFailures.push({url:request.url(),failure:request.failure()?.errorText}));
  await page.goto(pathToFileURL(entry).href,{waitUntil:'load'});
  await page.waitForFunction(()=>window.Courseware&&window.CourseAudio&&window.PoetrySpace);
  await check('offline entry and 18 scenes',async()=>{assert((await courseState()).index===0,'Entry does not show cover');assert(await page.evaluate(()=>COURSE_STORY.length)===18,'Expected 18 scenes');assert(await page.title()==='蜀道难 · 第一人称诗境','Wrong document title');});
  await check('all 18 scenes and required interactions via real controls',async()=>{
   let count=0;
   while(count++<18){
    const s=await courseState();assert(s.index===count-1,'Scene sequence broke',{expected:count-1,actual:s});
    const info=await page.evaluate(()=>({scene:COURSE_STORY[Courseware.getState().index],state:Courseware.getState()}));report.journey.push({index:s.index,title:info.scene.title,interaction:info.scene.interaction||null});
    if(info.scene.interaction==='path'){for(let n=0;n<3;n++){await page.locator('.path-node[data-node="'+n+'"]').click();assert((await courseState()).found===n+1,'Path node not registered');}await page.locator('.path-node[data-node="0"]').click();assert((await courseState()).found===3,'Duplicate path click altered count');}
    if(info.scene.interaction==='look'){await page.locator('[data-action="look-down"]').click();assert((await page.locator('#subtitle').textContent()).includes('俯看'),'Look-down feedback missing');await page.locator('[data-action="look-up"]').click();}
    if(info.scene.interaction==='walk'){for(let n=0;n<3;n++){await page.locator('#nextButton').click();assert((await courseState()).index===s.index,'Walk advanced too early');assert((await courseState()).interaction===n+1,'Walk step not registered');}assert(await page.locator('.footstep i.filled').count()===3,'Three footprints missing');}
    if(info.scene.interaction==='stars'){for(let n=0;n<2;n++){await page.locator('.star-node[data-node="'+n+'"]').click();assert((await courseState()).found===n+1,'Star not registered');}}
    if(info.scene.interaction==='bird'){await page.locator('.bird-hotspot').click();assert((await courseState()).interaction===1,'Bird not registered');assert(await page.locator('.bird-hotspot').getAttribute('aria-pressed')==='true','Bird aria feedback missing');}
    if(info.scene.interaction==='water'){await range('#waterForce',85);assert((await courseState()).water===85,'Water state not updated');assert(await page.locator('#waterValue').textContent()==='85%','Water output incorrect');assert((await page.locator('#subtitle').textContent()).includes('万壑雷'),'Strong-water feedback absent');}
    if(info.scene.interaction==='gate'){await page.locator('.gate-focus').click();assert((await courseState()).interaction===1,'Gate not registered');assert(await page.locator('.gate-focus').getAttribute('aria-pressed')==='true','Gate aria feedback missing');}
    await page.locator('#nextButton').click();
   }
   assert((await courseState()).modal==='poem','Ending next did not open full poem');return {visited:report.journey.length};
  });
  await check('pause blocks advancement, resume, chapter navigation and reset',async()=>{
   await goChapter(2);const before=await courseState();await page.locator('#pauseButton').click();await page.keyboard.press('ArrowRight');assert((await courseState()).index===before.index,'Paused experience advanced');assert((await courseState()).paused,'Pause state missing');await page.locator('#paused [data-action="pause"]').click();await page.locator('#nextButton').click();assert((await courseState()).index===before.index+1,'Resume did not advance');
   for(let i=0;i<6;i++){await goChapter(i);assert((await courseState()).chapter===i,'Chapter navigation wrong');}
   await page.locator('.brand').click();assert((await courseState()).index===0,'Home reset failed');
  });
  await check('study four tabs, six chapters, all original lines, 26 glosses and complete meanings',async()=>{
   await open('study');for(const tab of ['about','lines','emotion','sources']){await page.locator('.tabbar [data-study-tab="'+tab+'"]').click();assert(await page.locator('.tabbar [data-study-tab="'+tab+'"]').first().getAttribute('aria-pressed')==='true','Tab state incorrect '+tab);}
   await page.locator('.tabbar [data-study-tab="lines"]').click();let total=0,glossCount=0;
   for(let chapter=0;chapter<6;chapter++){
    await page.locator('.page-numbers [data-study-page="'+chapter+'"]').click();
    await page.locator('[data-study-detail="reading"]').click();
    const expected=await page.evaluate(i=>COURSE_CONTENT.chapters[i],chapter);
    const count=await page.locator('[data-study-line]').count();let found=[];
    for(let n=0;n<count;n++){await page.locator('[data-study-line="'+n+'"]').click();found.push(...await page.locator('.quote span').allTextContents());total++;}
    assert(JSON.stringify(expected.lines)===JSON.stringify(found),'Chapter text incomplete',{chapter,expected:expected.lines,found});
    assert((await page.locator('.study-detail').textContent()).includes(expected.intro),'Reading introduction incomplete');
    await page.locator('[data-study-detail="words"]').click();
    const words=await page.locator('.word-row').allTextContents();glossCount+=words.length;
    assert(words.length===expected.glosses.length,'Missing glossary rows',{chapter,expected:expected.glosses.length,actual:words.length});
    for(let i=0;i<words.length;i++)assert(words[i].includes(expected.glosses[i].word)&&words[i].includes(expected.glosses[i].meaning)&&words[i].includes(expected.glosses[i].pronunciation||''),'Glossary text incomplete',{chapter,index:i});
    await page.locator('[data-study-detail="meaning"]').click();const meaning=await page.locator('.study-detail').textContent();
    for(const field of ['insight','question','prompt'])assert(meaning.includes(expected[field]),'Meaning detail omits '+field,{chapter});
   }
   assert(glossCount===26,'Expected 26 glossary rows, found '+glossCount);return {linePages:total,glosses:glossCount,meaningPages:6};
  });
  await check('full poem has five pages and complete original text',async()=>{
   await open('poem');await page.locator('[data-poem-part="0"]').click();const expected=await page.evaluate(()=>COURSE_CONTENT.poem.join(''));let text='',count=0;
   while(count<10){text+=(await page.locator('.poem-page p').allTextContents()).join('');count++;const next=page.locator('.pager button').last();if(await next.isDisabled())break;await next.click();}
   assert(count===5,'Expected five pages; received '+count);assert(text.replace(/\s/g,'')===expected.replace(/\s/g,''),'Full poem text missing or reordered');return {pages:count,characters:text.length};
  });
  await check('six draft answers persist and reference answers toggle',async()=>{
   await open('practice');for(let i=0;i<6;i++){await page.locator('.page-numbers [data-practice-page="'+i+'"]').click();await page.locator('#answerInput').fill('独立验收：第'+(i+1)+'章，观察诗句中的高、险、忧。');assert((await page.locator('#saveStatus').textContent()).includes('已保存'),'Draft save indicator missing');await page.locator('[data-action="answer"]').click();assert(await page.locator('#referenceAnswer').isVisible(),'Reference answer did not show');assert(await page.locator('[data-action="answer"]').getAttribute('aria-expanded')==='true','Expanded state absent');await page.locator('[data-action="answer"]').click();assert(await page.locator('#referenceAnswer').isHidden(),'Reference answer did not hide');}
   await page.reload({waitUntil:'load'});await open('practice');for(let i=0;i<6;i++){await page.locator('.page-numbers [data-practice-page="'+i+'"]').click();assert((await page.locator('#answerInput').inputValue()).includes('第'+(i+1)+'章'),'Draft did not survive reload for '+i);}return {drafts:6,reloaded:true};
  });
  await check('3D modes, rotation, sliders, reset and exit',async()=>{
   await open('space');for(const mode of ['mountain','walkway','pass']){await page.locator('.ps-tab[data-mode="'+mode+'"]').click();assert(await page.locator('.ps-tab[data-mode="'+mode+'"]').getAttribute('aria-pressed')==='true','3D mode wrong');assert((await page.locator('.ps-verse').textContent()).length>6,'3D verse empty');}
   const compass=page.locator('.ps-compass-arrow');const initial=await compass.getAttribute('style');await page.locator('.ps-right').click();await page.waitForTimeout(80);assert(await compass.getAttribute('style')!==initial,'Rotate-right has no effect');await page.locator('.ps-left').click();
   const bounds=await page.locator('.ps-canvas').boundingBox();await page.mouse.move(bounds.x+bounds.width*.5,bounds.y+bounds.height*.55);await page.mouse.down();await page.mouse.move(bounds.x+bounds.width*.7,bounds.y+bounds.height*.6,{steps:5});await page.mouse.up();await page.waitForTimeout(80);assert(await compass.getAttribute('style')!==initial,'Drag has no effect');
   await range('.ps-zoom',135);await range('.ps-fog',80);assert(await page.locator('.ps-zoom-value').textContent()==='135%','3D zoom value wrong');assert(await page.locator('.ps-fog-value').textContent()==='80%','3D fog value wrong');await page.locator('.ps-reset').click();assert(await page.locator('.ps-zoom-value').textContent()==='100%','3D reset zoom failed');assert(await page.locator('.ps-fog-value').textContent()==='35%','3D reset fog failed');await close();assert(await page.locator('.ps-space').count()===0,'3D did not clean up on exit');
  });
  await check('audio start and track time grows',async()=>{await goChapter(0);await page.waitForTimeout(1100);const first=await audioState();report.audioEvidence.push({label:'scene initial',...first});assert(first.started&&first.track&&first.playing,'Stage audio did not start',first);await page.waitForTimeout(700);const second=await audioState();report.audioEvidence.push({label:'scene after 700ms',...second});assert(second.currentTime>first.currentTime+.2,'Audio time did not grow',{first,second});});
  await check('narration disabled still permits manual scene reading',async()=>{
   await close();if((await audioState()).narration)await page.locator('#narrationToggle').click();await page.locator('#readLine').click();await page.waitForTimeout(650);const s=await audioState();report.audioEvidence.push({label:'manual reading while automatic narration disabled',...s});assert(!s.narration&&s.track&&s.playing,'Manual scene reading failed when automatic narration off',s);
  });
  await check('audio mute, levels, music toggle, full poem, pause/resume',async()=>{
   if(!(await audioState()).muted)await page.locator('#muteButton').click();assert((await audioState()).muted,'Mute did not apply');await page.locator('#muteButton').click();assert(!(await audioState()).muted,'Unmute failed');
   await open('audio');await range('#musicVolume',31);await range('#voiceVolume',76);let a=await audioState();assert(a.musicVolume===.31&&a.voiceVolume===.76,'Volume did not update');const musicBefore=a.music;await page.locator('#panelMusic').click();assert((await audioState()).music!==musicBefore,'Music toggle failed');await page.locator('#panelMusic').click();
   await page.locator('.audio-buttons [data-action="play-full"]').click();await page.waitForTimeout(550);a=await audioState();assert(a.track==='full-poem'&&a.playing,'Full poem not playing',a);report.audioEvidence.push({label:'full poem',...a});await page.locator('[data-action="stop-voice"]').click();assert(!(await audioState()).track,'Stop voice left active track');await close();
   if(!(await audioState()).narration)await page.locator('#narrationToggle').click();await page.locator('#readLine').click();await page.waitForTimeout(550);await page.locator('#pauseButton').click();const before=await audioState();await page.waitForTimeout(650);const paused=await audioState();assert(paused.paused&&!paused.playing,'Audio did not pause',paused);assert(Math.abs(paused.currentTime-before.currentTime)<.08,'Paused audio time advanced',{before,paused});await page.locator('#paused [data-action="pause"]').click();await page.waitForTimeout(550);const resumed=await audioState();assert(!resumed.paused&&resumed.playing&&resumed.currentTime>paused.currentTime+.15,'Audio resume failed',{paused,resumed});report.audioEvidence.push({label:'resumed',...resumed});
  });
  for(const size of [[1440,900],[1280,720],[390,844]])await check('single-screen geometry '+size.join('x'),()=>auditLayout(...size));
  await check('no browser page errors',async()=>assert(report.pageErrors.length===0,'Page errors detected',report.pageErrors));
  await check('no browser console errors',async()=>assert(report.consoleErrors.length===0,'Console errors detected',report.consoleErrors));
 }catch(error){report.fatal={message:error.message,stack:error.stack};console.error('FATAL '+error.message);}
 finally{
  report.completedAt=new Date().toISOString();report.summary={passed:report.checks.filter(c=>c.pass).length,failed:report.checks.filter(c=>!c.pass).length,geometryScreens:report.geometry.length,screenshots:report.screenshots.length,pageErrors:report.pageErrors.length,consoleErrors:report.consoleErrors.length,requestFailures:report.requestFailures.length};
  fs.writeFileSync(path.join(output,'audit-summary.json'),JSON.stringify(report,null,2));
  if(browser)await browser.close();console.log('SUMMARY '+JSON.stringify(report.summary));
  if(report.fatal||report.summary.failed)process.exitCode=1;
 }
})();
