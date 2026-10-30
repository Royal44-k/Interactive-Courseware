(() => {
 'use strict';
 const $ = s => document.querySelector(s);
 const story=window.COURSE_STORY,data=window.COURSE_CONTENT,audio=()=>window.CourseAudio;
 const chapterNames=['入山','开辟','攀行','夜行','剑阁','回望'],chapterMarks=['壹','贰','叁','肆','伍','陆'];
 const backgrounds=['mountains','cliff','cliff','moon','pass','mountains'];
 const chapterStarts=chapterNames.map((_,i)=>story.findIndex(s=>s.chapter===i));
 const state={index:0,paused:false,busy:false,modal:null,interaction:0,actionDone:false,ready:false,found:new Set(),visited:new Set(),studyTab:'about',studyPage:0,studyLine:0,studyDetail:'reading',practicePage:0,poemPage:0,poemPart:0,look:'up',water:30,lastFocus:null};
 let imageSide=0,currentBg='',toastTimer,audioTimer,transitionId=0;
 const scene=()=>story[state.index];
 const escape=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const cleanButton=(action,text,extra='')=>`<button data-action="${action}" ${extra}>${text}</button>`;
 function toast(message){$('#toast').textContent=message;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),3000);}
 function chapter(){return data.chapters[Math.min(5,Math.max(0,scene().chapter))];}
 function setCaption(text){$('#subtitle').textContent=text;}
 function activeBackdrop(){return $('.backdrop.active');}
 function background(name){if(currentBg===name)return;currentBg=name;imageSide=1-imageSide;const next=$('#backdrop'+(imageSide?'B':'A')),prev=$('#backdrop'+(imageSide?'A':'B'));next.style.backgroundImage=`url("assets/${name}.png")`;next.classList.add('active');prev.classList.remove('active');}
 function render(continuous=false){
  const s=scene();state.interaction=0;state.actionDone=false;state.found.clear();state.visited.add(s.chapter);audio()?.stopVoice();clearTimeout(audioTimer);
  $('#course').className=`course ${s.type||''}${state.paused?' is-paused':''}`;

  $('#location').textContent=s.label;$('#eyebrow').textContent=s.label;
  $('#sceneTitle').innerHTML=s.title.map(t=>`<span>${escape(t)}</span>`).join('');$('#sceneSub').textContent=s.sub;setCaption(s.caption);$('#actionLabel').textContent=s.action;
  $('#sceneExtra').innerHTML=s.type==='cover'?'<p class="cover-note">从山门，到绝壁。从惊叹，到长叹。<br>进入后开启配乐与旁白 · 可随时关闭</p>':'';
  $('#readLine').hidden=s.type==='cover';$('#sceneGuide').textContent=s.action.replace(/[，。]/g,' · ');
  const indices=story.map((x,i)=>x.chapter===s.chapter?i:-1).filter(i=>i>=0);
  $('#stepCount').textContent=s.chapter<0?'序 / 入境':s.chapter===6?'终 / 回望':`${chapterMarks[s.chapter]} / ${indices.indexOf(state.index)+1} · ${indices.length}`;
  $('#chapterNav').innerHTML=`<button data-chapter="-1" class="${s.chapter<0?'active':''}">序 · 入境</button>`+chapterNames.map((n,i)=>`<button data-chapter="${i}" aria-label="${n}章节" aria-current="${s.chapter===i?'step':'false'}" class="${s.chapter===i?'active':''} ${state.visited.has(i)?'visited':''}">${chapterMarks[i]} · ${n}</button>`).join('');
  $('#journeyProgress').style.width=`${state.index/(story.length-1)*100}%`;
  $('#paused').hidden=!state.paused;$('#pauseButton').innerHTML=state.paused?'继续体验 <span>▷</span>':'暂停体验 <span>Ⅱ</span>';
  $('#interaction').innerHTML='';$('#sceneActions').innerHTML=s.motion==='walk'?'<span class="walk-count">落脚 · <b id="walkCount">0</b> / 3</span>':'';
  if(s.type==='ending')$('#sceneActions').innerHTML=cleanButton('restart','从头，再走一次')+cleanButton('review-sighs','梳理三叹的回响 ↗');
  if(audio()?.getState().started&&!state.paused&&!state.modal)audioTimer=setTimeout(()=>audio()?.playStage(state.index),300);
 }
 async function go(index,continuous=false){
  if(!state.ready)return false;
  closeModal();const token=++transitionId;state.busy=true;$('#nextButton').disabled=true;$('#course').classList.remove('acting');clearTimeout(audioTimer);audio()?.stopVoice();state.paused=false;CinemaEngine.setPaused(false);audio()?.resume();
  const target=Math.max(0,Math.min(story.length-1,index));
  const completed=await CinemaEngine.travel(target,continuous,()=>{if(token!==transitionId)return;state.index=target;render(continuous);});
  if(!completed||token!==transitionId)return false;
  state.busy=false;$('#nextButton').disabled=false;return true;
 }
 async function next(){
  if(!state.ready||state.modal||state.paused||state.busy)return;
  const s=scene();audio()?.start();if(s.type==='ending'){openModal('poem');return;}
  if(state.actionDone){await go(state.index+1,true);return;}
  if(s.motion==='walk'&&state.interaction>=3){await go(state.index+1,true);return;}
  $('#actionLabel').textContent=({'open-gate':'山门正缓缓打开','lay-planks':'木板正在落位','walk':'脚下，就是下一步','reach':'伸手，仰望星辰','breathe':'放下手，缓一口气','lantern':'提起灯，照向古木','listen':'静听山中的回响','torrent':'飞瀑扑面而来','blocked-gate':'关门纹丝未动'}[s.motion]||'走进眼前的诗境')+'…';
  const id=++transitionId;state.busy=true;$('#nextButton').disabled=true;$('#course').classList.add('acting');clearTimeout(audioTimer);audio()?.stopVoice();
  const completed=await CinemaEngine.perform(s.motion);
  if(!completed||id!==transitionId)return;
  state.busy=false;$('#nextButton').disabled=false;$('#course').classList.remove('acting');
  if(s.motion==='walk'){
   state.interaction++;$('#walkCount').textContent=state.interaction;
   setCaption(['脚下的木板，承住了这一步。','木板忽然松动。我停住脚，稳住身形。','回头看，来路已悬在身后。'][state.interaction-1]);
   $('#actionLabel').textContent=state.interaction===3?'抬头，仰望星辰':'稳住，再向前一步';
   return;
  }
  if(['torrent','blocked-gate'].includes(s.motion)){state.actionDone=true;$('#actionLabel').textContent=s.motion==='torrent'?'离开飞瀑，走向剑阁':'收回手，再想一想';setCaption(s.motion==='torrent'?'飞湍扑面，雷声在深壑间回荡。':'关门纹丝未动。险要之地，也系于守关之人。');return;}
  await go(state.index+1,true);
 }
 function togglePause(){state.paused=!state.paused;$('#course').classList.toggle('is-paused',state.paused);$('#paused').hidden=!state.paused;$('#pauseButton').innerHTML=state.paused?'继续体验 <span>▷</span>':'暂停体验 <span>Ⅱ</span>';CinemaEngine.setPaused(state.paused);if(state.paused){clearTimeout(audioTimer);audio()?.pause();}else audio()?.resume();window.PoetrySpace?.setPaused(state.paused);}
 function bird(){next();}function gate(){next();}function touchNode(){next();}
 function modalHeading(kicker,title){return `<p class="dialog-kicker">${kicker}</p><h2 id="modalTitle">${title}</h2>`;}
 function tabs(items,active,attr){return `<div class="tabbar">${items.map(([id,label])=>`<button ${attr}="${id}" class="${active===id?'active':''}" aria-pressed="${active===id}">${label}</button>`).join('')}</div>`;}
 function pager(page,total,attr,label=''){return `<div class="panel-footer"><span>${label}</span><div class="pager"><button ${attr}="${page-1}" ${page<=0?'disabled':''}>← 上一页</button><span>${page+1} / ${total}</span><button ${attr}="${page+1}" ${page>=total-1?'disabled':''}>下一页 →</button></div></div>`;}
 function openModal(name){
  if(state.modal)closeModal();
  state.lastFocus=document.activeElement;state.modal=name;CinemaEngine.setPaused(true);audio()?.stopVoice();clearTimeout(audioTimer);
  $('#modalLayer').hidden=false;$('#course').inert=true;$('#dialog').className=`dialog ${name==='space'?'space-dialog':name==='audio'?'audio-dialog':name==='classroom'?'classroom-dialog':''}`;
  if(name==='study') {state.studyPage=Math.min(5,Math.max(0,scene().chapter));state.studyLine=0;state.studyDetail='reading';renderStudy();}
  if(name==='practice')renderPractice();
  if(name==='poem')renderPoem();
  if(name==='classroom')renderClassroom();
  if(name==='audio')renderAudio();
  if(name==='space'){$('#modalContent').innerHTML='<h2 id="modalTitle" class="space-sr-only" style="position:absolute;width:1px;height:1px;overflow:hidden">蜀道意象空间</h2><div id="spaceMount" style="height:100%;width:100%"></div>';window.PoetrySpace.mount($('#spaceMount'));}
  $('#dialog').focus();
 }
 function closeModal(){
  if(!state.modal)return;
  if(state.modal==='space')window.PoetrySpace.destroy();
  audio()?.stopVoice();if(state.paused)audio()?.pause();state.modal=null;CinemaEngine.setPaused(state.paused);$('#modalLayer').hidden=true;$('#course').inert=false;
  state.lastFocus?.focus();
 }
 function renderStudy(){
  const t=state.studyTab,c=data.chapters[state.studyPage];
  let html=modalHeading('从感受走向理解 · 教学研习','走近李白，读懂这一程')+tabs([['about','走近李白'],['lines','逐章理解'],['emotion','三叹回响'],['sources','文本依据']],t,'data-study-tab');
  if(t==='about')html+=`<div class="modal-body"><div class="study-grid"><div class="study-photo" style="background-image:url('assets/mountains.png')"><div class="photo-caption">笔落惊风雨 · 诗成泣鬼神</div></div><div class="study-text"><p class="gold">李白 · 唐代诗人</p><p>${escape(data.background)}</p><div class="insight"><div class="label">读诗的起点</div><p>《蜀道难》是乐府旧题。诗中兼有奇险山川、传说想象、行旅之愁与人事忧思；不要把全诗只读成一张地理说明图。</p></div></div></div><div class="panel-footer"><span>先经历诗境，再回到文本寻找依据。</span><button data-study-tab="lines">开始逐章研习 →</button></div></div>`;
  else if(t==='lines'){
   let detail='';
   if(state.studyDetail==='reading')detail=`<div class="verse-picker"><span>本章诗句</span>${Array.from({length:Math.ceil(c.lines.length/2)},(_,i)=>`<button data-study-line="${i}" class="${i===state.studyLine?'active':''}">${i+1}</button>`).join('')}</div><div class="quote">${c.lines.slice(state.studyLine*2,state.studyLine*2+2).map(l=>`<span>${escape(l)}</span>`).join('')}</div><div class="insight"><div class="label">进入这一段</div><p>${escape(c.intro)}</p></div>`;
   if(state.studyDetail==='words')detail=`<div class="word-list">${c.glosses.map(g=>`<div class="word-row"><b>${escape(g.word)}<small>${g.pronunciation?escape(g.pronunciation):''}</small></b><p>${escape(g.meaning)}</p></div>`).join('')}</div>`;
   if(state.studyDetail==='meaning')detail=`<div class="quote"><span>${escape(c.kicker)}</span></div><div class="insight"><div class="label">表达与情绪</div><p>${escape(c.insight)}</p></div><p class="gold">${escape(c.question)}</p><p>${escape(c.prompt)}</p>`;
   html+=`<div class="modal-body"><div class="page-numbers">${data.chapters.map((x,i)=>`<button data-study-page="${i}" class="${i===state.studyPage?'active':''}">${i+1} ${escape(x.title)}</button>`).join('')}</div><div class="detail-tabs">${[['reading','读原文'],['words','释字词'],['meaning','赏表达']].map(([id,label])=>`<button data-study-detail="${id}" class="${state.studyDetail===id?'active':''}">${label}</button>`).join('')}</div><div class="study-detail">${detail}</div>${pager(state.studyPage,6,'data-study-page','把感受，落到具体的字句上。')}</div>`;
  }else if(t==='emotion'){
   const sighs=[['高','第一叹 · 惊叹','噫吁嚱，危乎高哉！','以突兀的感叹开篇，远古传说与极度夸张共同托起蜀山之高。'],['险','第二叹 · 惊惧','使人听此凋朱颜！','攀行的身体感受、古木悲鸟与子规夜啼，让山路之险进入人的情绪。'],['忧','第三叹 · 忧思','侧身西望长咨嗟！','从剑阁的地势转入人事的危险，在劝归与长叹中留下关切和余意。']];
   html+=`<div class="modal-body"><div class="three-sighs">${sighs.map(([word,title,quote,body])=>`<article class="sigh"><div class="sigh-word">${word}</div><small>蜀道之难，难于上青天</small><h3>${title}</h3><p class="gold">${quote}</p><p>${body}</p></article>`).join('')}</div><div class="insight"><p>反复并非原地重复。相同的主旋律在不同语境中回响，情绪层层推进；“高、险、忧”是本课件的阅读线索，并非唯一阐释。</p></div><div class="panel-footer"><span>用三种不同的语气，再读同一句诗。</span><button data-modal="poem">回到全诗 →</button></div></div>`;
  }else{
   html+=`<div class="modal-body"><div class="quote"><span>以原文为根，以体验入诗。</span></div><p>本课件以统编高中语文教材所载《蜀道难》为文本基础，按三段分章研习。诗中的神话、夸张与象征表达，须与真实史地知识区分。</p><div class="insight"><div class="label">阅读边界</div><p>作者、诗题、重点字词据教材核对。创作背景与主旨历来存在不同说法，不把单一推测作为定论。课件的第一人称引导语是教学创作，不是李白自述或原诗。</p><p>山川背景为生成艺术图；意象空间为程序建立的三维结构示意，不按真实山峰、古栈道或剑门关复原。</p></div><div class="source-links">${data.sourceLinks.map(s=>`<p><a href="${escape(s.url)}" target="_blank" rel="noopener">${escape(s.label)} ↗</a></p>`).join('')}</div><div class="panel-footer"><span>阅读外部来源需要联网；课件主体可离线使用。</span><button data-action="close">返回诗境</button></div></div>`;
  }
  $('#modalContent').innerHTML=html;
 }
 function getDraft(i){try{return localStorage.getItem('shudao-draft-'+i)||'';}catch{return '';}}
 function renderPractice(){
  const i=state.practicePage,c=data.chapters[i];
  $('#modalContent').innerHTML=modalHeading('从诗境回到表达 · 开放探究','蜀道难 · 课后练习')+`<p class="practice-hint">先写下自己的思路，再展开参考赏析。答案不止一种，让观点有诗句作为依据。</p><div class="page-numbers">${data.chapters.map((c,j)=>`<button data-practice-page="${j}" class="${j===i?'active':''}">${j+1} ${escape(c.title)}</button>`).join('')}</div><div class="modal-body"><h3 class="practice-title">${escape(c.question)}</h3><p class="practice-hint">${escape(c.prompt)}</p><label class="input-label" for="answerInput"><span>我的思路</span><span id="saveStatus">仅保存在当前浏览器</span></label><textarea class="answer-input" id="answerInput" maxlength="2000" placeholder="从具体字句出发，写下你的发现……">${escape(getDraft(i))}</textarea><button class="answer-toggle" data-action="answer" aria-expanded="false">▸ 查看参考赏析</button><div id="referenceAnswer" class="reference-answer" hidden>${escape(c.answer)}</div>${pager(i,6,'data-practice-page','思考不设倒计时，按自己的节奏表达。')}</div>`;
 }
 function poemChunks(){
  const chunks=[];data.poem.forEach((part,pi)=>{
   const lines=part.split(/\n/).map(x=>x.trim()).filter(Boolean);
   let actual=lines.length>1?lines:part.match(/[^。！？；]+[。！？；]?/g)||[part];
   // Six short lines fit the reference's single-screen learning sheet at laptop sizes.
   for(let j=0;j<actual.length;j+=6)chunks.push({part:pi,lines:actual.slice(j,j+6)});
  });return chunks;
 }
 function renderPoem(){
  const chunks=poemChunks(),p=chunks[state.poemPage]||chunks[0];state.poemPart=p.part;
  $('#modalContent').innerHTML=modalHeading('李白 · 乐府旧题','蜀道难')+`<div class="page-numbers">${['一 · 开辟与攀行','二 · 山水之险','三 · 剑阁与劝归'].map((label,i)=>`<button data-poem-part="${i}" class="${i===p.part?'active':''}">${label}</button>`).join('')}<button data-action="play-poem-part">朗读本段 ♪</button><button data-action="play-full">朗读全诗 ♪</button></div><div class="modal-body"><div class="poem-page">${p.lines.map(l=>`<p class="${l.includes('蜀道之难')?'refrain':''}">${escape(l)}</p>`).join('')}</div>${pager(state.poemPage,chunks.length,'data-poem-page',`第 ${p.part+1} 段 · 文字按屏分页，原文完整保留`)}</div>`;
 }
 function renderClassroom(){
  const c=chapter(),bg=backgrounds[Math.min(5,Math.max(0,scene().chapter))];
  const normalize=t=>t.replace(/[，。！？、；“”\s]/g,'');
  const relevant=c.lines.filter(l=>scene().title.some(t=>normalize(l).includes(normalize(t))));
  const quotes=relevant.length?relevant.slice(0,2):c.lines.slice(-1);
  $('#modalContent').innerHTML=modalHeading('此刻 · 课堂解读',escape(c.title))+`<div class="classroom-image" style="background-image:url('assets/${bg}.png')"></div><div class="quote">${quotes.map(l=>`<span>${escape(l)}</span>`).join('')}</div><div class="insight"><div class="label">从刚才的体验出发</div><p>${escape(c.intro)}</p><p>${escape(c.insight)}</p></div><p class="gold">${escape(c.question)}</p><div class="panel-footer"><span>暂停行走，留一点思考的安静。</span><button data-modal="study">深入研习 ↗</button></div>`;
 }
 function renderAudio(){
  const a=audio()?.getState()||{music:true,narration:true,muted:false,musicVolume:.4,voiceVolume:.9};
  $('#modalContent').innerHTML=modalHeading('听见诗境的起伏','配乐与朗诵')+`<div class="audio-setting"><label for="musicVolume">背景配乐 <span id="musicPercent">${Math.round(a.musicVolume*100)}%</span></label><input id="musicVolume" type="range" min="0" max="100" value="${Math.round(a.musicVolume*100)}"></div><div class="audio-setting"><label for="voiceVolume">旁白与朗诵 <span id="voicePercent">${Math.round(a.voiceVolume*100)}%</span></label><input id="voiceVolume" type="range" min="0" max="100" value="${Math.round(a.voiceVolume*100)}"></div><div class="audio-buttons"><button data-action="music" id="panelMusic">配乐 ${a.music?'开':'关'}</button><button data-action="narration" id="panelNarration">旁白 ${a.narration?'开':'关'}</button><button data-action="play-full">朗诵全诗</button><button data-action="stop-voice">停止朗诵</button></div><p class="audio-help">每一幕由你手动推进。旁白播放时配乐自动减弱；切换场景会停止上一段，避免声音重叠。暂停体验会同时暂停声音。</p><p class="audio-credit">中文音频为本地合成语音，配乐为程序原创的五声音阶氛围音乐，均随课件保存。声音仅作辅助，字幕与诗句始终可见。</p>`;
 }
 function updateAudio(a){
  if(!a)a=audio()?.getState();if(!a)return;
  $('#muteButton').innerHTML=`静音 <span>${a.muted?'开':'关'}</span>`;$('#muteButton').setAttribute('aria-pressed',String(a.muted));
  $('#musicToggle').innerHTML=`<span class="equalizer"><i></i><i></i><i></i></span> 配乐 ${a.music?'开':'关'}`;
  $('#narrationToggle').textContent=`旁白 ${a.narration?'开':'关'}`;
  if(a.status)$('#audioStatus').textContent=a.status;
  if($('#panelMusic'))$('#panelMusic').textContent=`配乐 ${a.music?'开':'关'}`;
  if($('#panelNarration'))$('#panelNarration').textContent=`旁白 ${a.narration?'开':'关'}`;
 }
 async function fullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{toast('浏览器未进入全屏；课件仍可正常使用。');}}
 document.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b||b.disabled)return;
  if(b.dataset.modal){openModal(b.dataset.modal);return;}
  if(b.dataset.chapter!==undefined){const n=+b.dataset.chapter;audio()?.start();go(n<0?0:chapterStarts[n]);return;}
  if(b.dataset.node!==undefined){touchNode(+b.dataset.node);return;}
  if(b.dataset.studyTab){state.studyTab=b.dataset.studyTab;renderStudy();return;}
  if(b.dataset.studyPage!==undefined){state.studyPage=+b.dataset.studyPage;state.studyLine=0;state.studyTab='lines';renderStudy();return;}
  if(b.dataset.studyLine!==undefined){state.studyLine=+b.dataset.studyLine;renderStudy();return;}
  if(b.dataset.studyDetail){state.studyDetail=b.dataset.studyDetail;renderStudy();return;}
  if(b.dataset.practicePage!==undefined){state.practicePage=+b.dataset.practicePage;renderPractice();return;}
  if(b.dataset.poemPage!==undefined){state.poemPage=+b.dataset.poemPage;renderPoem();return;}
  if(b.dataset.poemPart!==undefined){state.poemPage=poemChunks().findIndex(p=>p.part===+b.dataset.poemPart);renderPoem();return;}
  switch(b.dataset.action){
   case 'next':next();break;
   case 'home':case 'restart':go(0);break;
   case 'back':if(!state.paused)go(state.index-1);break;
   case 'close':closeModal();break;
   case 'pause':togglePause();break;
   case 'read':audio()?.start();audio()?.playStage(state.index,true);break;
   case 'fullscreen':fullscreen();break;
   case 'review-sighs':state.studyTab='emotion';openModal('study');break;
   case 'bird':bird();break;
   case 'gate':gate();break;
   case 'look-up':case 'look-down':{
    state.look=b.dataset.action==='look-up'?'up':'down';activeBackdrop().style.transform=state.look==='up'?'scale(1.14) translateY(3%)':'scale(1.14) translateY(-4%)';
    setCaption(state.look==='up'?'仰望高标：高得仿佛令太阳的车驾也回转。':'俯看回川：急流冲击回旋，山路悬在深谷之上。');
    $('#sceneActions').querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===b));break;
   }
   case 'music':audio()?.start();audio()?.setMusic(!audio().getState().music);updateAudio();break;
   case 'narration':audio()?.setNarration(!audio().getState().narration);updateAudio();break;
   case 'mute':audio()?.setMuted(!audio().getState().muted);updateAudio();break;
   case 'play-full':audio()?.start();audio()?.playPoem(-1);toast('正在朗读全诗；可在声音设置中停止。');break;
   case 'play-poem-part':audio()?.start();audio()?.playPoem(state.poemPart);toast(`正在朗读第 ${state.poemPart+1} 段`);break;
   case 'stop-voice':audio()?.stopVoice();break;
   case 'answer':{const answer=$('#referenceAnswer');answer.hidden=!answer.hidden;b.setAttribute('aria-expanded',String(!answer.hidden));b.textContent=answer.hidden?'▸ 查看参考赏析':'▾ 收起参考赏析';break;}
  }
 });
 document.addEventListener('input',e=>{
  const el=e.target;
  if(el.id==='answerInput'){try{localStorage.setItem('shudao-draft-'+state.practicePage,el.value);$('#saveStatus').textContent='思路已保存到当前浏览器';}catch{$('#saveStatus').textContent='本浏览器不能保存，关闭前请自行复制。';}}
  if(el.id==='musicVolume'){audio()?.setMusicVolume(+el.value/100);$('#musicPercent').textContent=el.value+'%';}
  if(el.id==='voiceVolume'){audio()?.setVoiceVolume(+el.value/100);$('#voicePercent').textContent=el.value+'%';}
  if(el.id==='waterForce'){state.water=+el.value;$('#waterValue').textContent=el.value+'%';setCaption(state.water>60?'砯崖转石万壑雷——水声、石动，让险境迎面而来。':'由连峰、枯松的静景，转到飞湍、瀑流的动势。');}
 });
 $('#modalLayer').addEventListener('click',e=>{if(e.target===$('#modalLayer'))closeModal();});
 document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){if(state.modal)closeModal();else if(state.paused)togglePause();return;}
  if(state.modal){
   if(e.key==='Tab'){const els=[...$('#dialog').querySelectorAll('button:not(:disabled),input,textarea,a[href],[tabindex="0"]')].filter(el=>el.getClientRects().length);const first=els[0],last=els.at(-1);if(e.shiftKey&&(document.activeElement===first||document.activeElement===$('#dialog'))){e.preventDefault();last?.focus();}else if(!e.shiftKey&&(document.activeElement===last||document.activeElement===$('#dialog'))){e.preventDefault();first?.focus();}}
   return;
  }
  if(/INPUT|TEXTAREA/.test(e.target.tagName)||e.repeat)return;
  if(e.code==='Space'&&e.target.tagName!=='BUTTON'){e.preventDefault();next();}
  if(e.key==='ArrowRight'){e.preventDefault();next();}
  if(e.key==='ArrowLeft'){e.preventDefault();if(!state.paused)go(state.index-1);}
  if(e.key.toLowerCase()==='p')togglePause();
  if(e.key.toLowerCase()==='m'){audio()?.setMuted(!audio().getState().muted);updateAudio();}
  if(e.key.toLowerCase()==='f')fullscreen();
 });
 window.addEventListener('course-audio',e=>updateAudio(e.detail));
 document.addEventListener('visibilitychange',()=>{if(document.hidden){audio()?.pause();CinemaEngine.setPaused(true);window.PoetrySpace?.setPaused(true);}else{CinemaEngine.setPaused(state.paused||!!state.modal);if(!state.paused&&!state.modal)audio()?.resume();window.PoetrySpace?.setPaused(state.paused);}});

 document.addEventListener('cinema-object-action',()=>next());
 render();updateAudio();$('#nextButton').disabled=true;$('#actionLabel').textContent='正在铺开山川…';
 CinemaEngine.init().then(()=>{state.ready=true;$('#nextButton').disabled=false;$('#actionLabel').textContent=scene().action;}).catch(error=>{console.error(error);document.body.classList.add('webgl-unavailable');});
 window.Courseware={getState:()=>({ready:state.ready,index:state.index,chapter:scene().chapter,paused:state.paused,busy:state.busy,modal:state.modal,interaction:state.interaction,motion:CinemaEngine.getState()}),go,next};
})();