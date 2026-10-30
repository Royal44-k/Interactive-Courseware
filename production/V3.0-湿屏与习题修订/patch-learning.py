from pathlib import Path
p=Path('蜀道难课件/山海行歌-V3.0/v3-learning.js');s=p.read_text(encoding='utf-8-sig')
def replace(a,b):
 global s
 assert a in s,a[:90]
 s=s.replace(a,b)
def fn(name,body):
 global s
 start=s.index(' function '+name+'(');end=s.index('\n',start)
 s=s[:start]+body+s[end:]
replace("KEY='shanhai-v3-learning-1'","KEY='shanhai-v3-learning-2'")
replace("selectedLeft=null,selectedTile=null;", "selectedLeft=null,selectedTile=null;const W=D.weights,appreciation=D.essays.filter(q=>q.section==='appreciation'),reflections=D.essays.filter(q=>q.section==='reflection');let previousRecord=null;try{previousRecord=JSON.parse(localStorage.getItem('shanhai-v3-learning-1'));}catch{}")
replace('match:[null,null,null,null]','match:Array(D.matching.answers.length).fill(null)')
replace('puzzleTouched:false,poem:null','puzzleTouched:false,puzzleMoves:0,poem:null')
replace('rubric:{e1:[null,null,null],e2:[null,null,null],e3:[null,null,null,null]}','rubric:Object.fromEntries(D.essays.map(q=>[q.id,q.criteria.map(()=>null)]))')
replace('let state=fresh();try{','let state=fresh();if(previousRecord?.review)state.review={...previousRecord.review};try{')
replace('saved.match.length===4','saved.match.length===D.matching.answers.length')
replace("const refresh=focus=>{Courseware.refreshModal();requestAnimationFrame(()=>{drawLines();if(focus){document.querySelector('#modalTitle')?.focus();document.querySelector('.learning-scroll')?.scrollTo(0,0);}});};", "const refresh=focus=>{const top=document.querySelector('.learning-scroll')?.scrollTop||0;Courseware.refreshModal();requestAnimationFrame(()=>{const scroll=document.querySelector('.learning-scroll');if(scroll)scroll.scrollTop=focus?0:top;drawLines();if(focus)document.querySelector('#modalTitle')?.focus();});};")
replace("const stepNames=[['辨字','Read closely'],['补句','Complete'],['连意','Connect'],['拼境','Rebuild'],['赏析','Interpret'],['心得','Reflect']],stepPoints=[20,16,12,12,24,16];", "const stepNames=[['选择','Choice'],['默写','Completion'],['连线','Matching'],['拼图','Puzzle'],['赏析','Analysis'],['感悟','Response']],stepPoints=[D.choices.length*W.choice,D.fills.length*W.fill,D.matching.answers.length*W.matching,6*W.puzzlePiece+W.puzzlePoem+W.puzzleLine,appreciation.reduce((n,q)=>n+q.points,0),reflections.reduce((n,q)=>n+q.points,0)];")
replace('<small>5 ${txt(\'分\',\'pts\')}</small>', '<small>${q.points} ${txt(\'分\',\'pts\')}</small>')
fn('fills', ''' function fills(){return D.fills.map((q,i)=>`<section class="exam-question"><h3><span class="question-no">${i+D.choices.length+1}</span>${pp(q.prompt)} <small>${q.points} ${txt('分','pts')}</small></h3><label class="poem-completion"><span>${pp(q.before)}</span><input lang="zh-CN" autocomplete="off" spellcheck="false" aria-label="${esc(txt('第'+(i+D.choices.length+1)+'题诗句填空','Poem completion '+(i+D.choices.length+1)))}" data-exam-fill="${q.id}" value="${esc(state.fills[q.id]||'')}"><span>${pp(q.after)}</span></label>${q.hint[0]?`<p class="learning-note">${pp(q.hint)}</p>`:''}${q.rare.length?`<div class="rare-characters"><span>${pair('输入生字','Insert character')}</span>${q.rare.map(char=>`<button data-insert-char="${char}" data-field="${q.id}">${char}</button>`).join('')}</div>`:''}</section>`).join('');}''')
replace("'先选左侧诗句，再选右侧释意。再次选择即可改线，每组 3 分。','Choose a verse on the left, then its reading on the right. Select again to change a connection. Each pair is worth 3 points.'", "'将左列诗句与右列相应的赏析内容连线，每组 2 分。先点选诗句，再点选对应项；可重新选择。','Match each verse with its corresponding interpretation. Select the verse, then the interpretation. Each pair is worth 2 points.'")
replace('new Set(state.match).size===4','new Set(state.match).size===D.matching.answers.length')
replace("const qs=step===4?D.essays.slice(0,2):D.essays.slice(2)","const qs=step===4?appreciation:reflections")
replace("()=>D.essays.slice(0,2).map(essay).join(''),()=>essay(D.essays[2])", "()=>appreciation.map(essay).join(''),()=>reflections.map(essay).join('')")
replace("pair('以量规回看自己的表达','Review your response against the rubric')", "pair('自评参考','Self-assessment')")
replace("pair('上一程','Previous')","pair('上一部分','Previous')")
replace("pair('记下，继续','Save and continue')","pair('下一部分','Next')")
replace('这一程尚未写完。请完成所有作答；表达题还需达到基本篇幅并逐项自评。','本部分尚未完成。请补全答案，并完成表达题的自评。')
replace('请先完成这一程，再交卷。','请先完成本部分，再提交答卷。')
replace('把理解写在这里……','请在此作答。')
replace("title('把此心，带向远方','Carry this spirit onward'", "title('学习评价','Assessment results'")
replace("pair('带着诗意，回到首页','Return to the opening')","pair('回到首页','Return to the opening')")
fn('puzzle', ''' function puzzle(){return `<p class="learning-lead">${pair('将下面打乱的六块图片拼成一幅完整的山水图。可拖动一块到另一块上交换，也可依次点击两块交换。拼图 6 分，诗篇和诗句各 1 分。','Reassemble the six shuffled pieces into one complete landscape. Drag a piece onto another to swap, or select two pieces in turn. The puzzle earns 6 points; the poem and verse earn 1 point each.')}</p><details class="puzzle-reference"><summary>${pair('查看完整图','View the complete image')}</summary><img src="${D.puzzle.image}" alt="${txt('拼图的完整山水图','The complete landscape')}" draggable="false"></details><div class="scene-puzzle" role="group" aria-label="${txt('六块山水拼图','Six-piece landscape puzzle')}">${state.order.map((piece,i)=>`<button class="puzzle-tile ${selectedTile===i?'selected':''}" draggable="true" data-tile="${i}" aria-pressed="${selectedTile===i}" aria-label="${esc(txt('位置 '+(i+1)+'，'+D.puzzle.labels[piece][0],'Position '+(i+1)+', '+D.puzzle.labels[piece][1]))}"><img class="puzzle-fragment" src="${D.puzzle.image}" draggable="false" alt="" style="left:${-(piece%3)*100}%;top:${-Math.floor(piece/3)*100}%"><span class="tile-number">${i+1}</span></button>`).join('')}</div><p class="puzzle-status" id="puzzleStatus" role="status">${puzzleStatus()}</p><div class="puzzle-interpretation"><fieldset><legend>${pair('这幅图主要表现了哪首诗中的景象？','Which poem’s landscape is represented?')}</legend>${radio('puzzle-poem',D.puzzle.poems,state.poem)}</fieldset><fieldset><legend>${pair('下列诗句与图中景象最相符的一项是（　）','Which lines best correspond to the scene?')}</legend>${radio('puzzle-line',D.puzzle.lines,state.line)}</fieldset></div>`;}
 function puzzleStatus(){return state.order.every((n,i)=>n===i)?pair('拼图已复原。请继续完成下面两题。','The image is complete. Answer the two questions below.'):selectedTile!==null?pair('已选位置 '+(selectedTile+1)+'。请选择另一块交换。','Position '+(selectedTile+1)+' selected. Choose another piece to swap.'):pair('移动次数：'+(state.puzzleMoves||0)+'。请选择或拖动图块。','Moves: '+(state.puzzleMoves||0)+'. Select or drag a piece.');}
 function updatePuzzle(){document.querySelectorAll('[data-tile]').forEach((b,i)=>{const piece=state.order[i],im=b.querySelector('.puzzle-fragment');im.style.left=-(piece%3)*100+'%';im.style.top=-Math.floor(piece/3)*100+'%';b.classList.toggle('selected',selectedTile===i);b.setAttribute('aria-pressed',String(selectedTile===i));b.setAttribute('aria-label',txt('位置 '+(i+1)+'，'+D.puzzle.labels[piece][0],'Position '+(i+1)+', '+D.puzzle.labels[piece][1]));});const status=document.querySelector('#puzzleStatus');if(status)status.innerHTML=puzzleStatus();}''')
fn('score', ''' function score(){const choice=D.choices.reduce((n,q)=>n+(state.choices[q.id]===q.answer?W.choice:0),0),fill=D.fills.reduce((n,q)=>n+(q.answers.some(a=>normalize(a)===normalize(state.fills[q.id]))?W.fill:0),0),matching=state.match.reduce((n,v,i)=>n+(v===D.matching.answers[i]?W.matching:0),0),pieces=state.order.reduce((n,v,i)=>n+(v===i?W.puzzlePiece:0),0),puzzle=pieces+(state.poem===D.puzzle.poemAnswer?W.puzzlePoem:0)+(state.line===D.puzzle.lineAnswer?W.puzzleLine:0),sum=qs=>qs.reduce((n,q)=>n+state.rubric[q.id].reduce((a,b)=>a+b,0),0),appreciationPoints=sum(appreciation),reflection=sum(reflections),objective=choice+fill+matching+puzzle,self=appreciationPoints+reflection;return {choice,fill,matching,puzzle,appreciation:appreciationPoints,reflection,objective,self,total:objective+self};}''')
fn('swap', " function swap(a,b){if(a===b)return;[state.order[a],state.order[b]]=[state.order[b],state.order[a]];state.puzzleTouched=true;state.puzzleMoves=(state.puzzleMoves||0)+1;selectedTile=null;save();updatePuzzle();}")
replace("if(d.tile!==undefined){const i=+d.tile;if(selectedTile===null){selectedTile=i;refresh(false);}else if(selectedTile===i){selectedTile=null;refresh(false);}else swap(selectedTile,i);return true;}", "if(d.tile!==undefined){if(Date.now()<suppressClickUntil)return true;const i=+d.tile;if(selectedTile===null){selectedTile=i;updatePuzzle();}else if(selectedTile===i){selectedTile=null;updatePuzzle();}else swap(selectedTile,i);return true;}")
start=s.index(' let dragged=null;');end=s.index('\n window.LearningFlow',start)
s=s[:start]+''' let dragged=null,suppressClickUntil=0;const clearDrag=()=>document.querySelectorAll('.puzzle-tile').forEach(b=>b.classList.remove('drop-target','drag-source'));
 document.addEventListener('dragstart',e=>{const tile=e.target.closest('[data-tile]');if(!tile)return;dragged=+tile.dataset.tile;selectedTile=null;updatePuzzle();tile.classList.add('drag-source');e.dataTransfer.setData('text/plain',String(dragged));e.dataTransfer.effectAllowed='move';});
 document.addEventListener('dragover',e=>{const tile=e.target.closest('[data-tile]');if(tile&&dragged!==null){e.preventDefault();e.dataTransfer.dropEffect='move';document.querySelectorAll('.drop-target').forEach(b=>b.classList.remove('drop-target'));if(+tile.dataset.tile!==dragged)tile.classList.add('drop-target');}});
 document.addEventListener('drop',e=>{const tile=e.target.closest('[data-tile]');if(tile&&dragged!==null){e.preventDefault();swap(dragged,+tile.dataset.tile);suppressClickUntil=Date.now()+250;}clearDrag();dragged=null;});
 document.addEventListener('dragend',()=>{clearDrag();dragged=null;suppressClickUntil=Date.now()+250;});
''' +s[end:]
# Preserve the earlier answer sheet and provide an export entry without mixing old answers into new questions.
replace("<details class=\"source-notes\">", "${previousRecord?.started?`<p class=\"learning-note\">${pair('本轮题目已更新。原答卷保留，可另行导出。','The questions have been revised. Your previous answer sheet is retained and can be exported.')} <button data-previous-export>${pair('导出原答卷','Export previous answers')}</button></p>`:''}<details class=\"source-notes\">")
replace("function handleClick(b){const d=b.dataset;", "function handleClick(b){const d=b.dataset;if('previousExport'in d){const blob=new Blob([JSON.stringify({title:'山海行歌 V3.0 原版答卷',...previousRecord},null,2)],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='山海行歌-原版答卷.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);return true;}")
# Additional traditional forms occurring in the enlarged dictation section.
replace("[飛爭滿關萬當]", "[飛爭滿關萬當劍顧掛雲濟滄從繞間]")
replace("'當':'当'", "'當':'当','劍':'剑','顧':'顾','掛':'挂','雲':'云','濟':'济','滄':'沧','從':'从','繞':'绕','間':'间'")
# Cite each adapted multiple-choice and appreciation item in the review, rather than presenting it as an original examination question.
s=s.replace(" function sourceList(){", " function sourceFoot(i){const r=D.sources[i];return r?`<small class=\"question-source\">${pair('参考考点：','Study reference: ')}<a href=\"${esc(r.url)}\" target=\"_blank\" rel=\"noreferrer\">${esc(r.title)}</a></small>`:'';}\n function sourceList(){")
replace('${pp(q.why)}</small></p>', '${pp(q.why)}</small>${sourceFoot(q.source)}</p>')
replace('<p>${pp(q.guide)}</p><ul>', '<p>${pp(q.guide)}</p>${sourceFoot(q.source)}<ul>')
p.write_text(s,encoding='utf8')
print('learning runtime updated')
