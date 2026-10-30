const fs=require('fs'),vm=require('vm'),path=require('path');
const root=path.resolve(__dirname,'../../山海行歌-双语精修版'),ctx={window:{}};ctx.window=ctx;vm.createContext(ctx);
for(const f of ['content.js','journey.js','bilingual.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx);
const jobs=ctx.COURSE_STORY.map((s,i)=>({name:`stage-${i}-en`,text:s.en.narration,lang:'en'}));
for(const i of [0,2,3,4])jobs.push({name:`stage-${i}`,text:ctx.COURSE_STORY[i].narration,lang:'zh'});
jobs.push({name:'poem-xing-en',text:ctx.EN_POEMS.xing.join('\n\n'),lang:'en'},{name:'poem-shu-en',text:ctx.EN_POEMS.shu.join('\n\n'),lang:'en'});
const cues=[
 [1,'touch','双手抵门。','Hands to the doors.'],[1,'open','缓缓推开，入席听心。','Push gently. Enter the light.'],
 [2,'cup','举樽，浅酌，轻轻放下。','Raise the cup, sip, then lower it.'],[2,'taste','取一箸珍馐，缓缓送近。','Lift a morsel. Bring it closer.'],[2,'swallow','浅尝，咽下。','Taste, and swallow.'],[2,'lower','空箸退回，轻落案边。','Lower the empty chopsticks.'],
 [3,'hesitate','欲食又止，箸停半途。','The hand hesitates.'],[3,'stop','投箸落案，不能食。','I cannot eat.'],
 [4,'draw','拔剑出鞘。','Draw the sword.'],[4,'gaze','四顾茫茫，去路何方？','Look all around. Where is the way?'],[4,'dark','灯火渐远。','The lamplight fades.'],
 [13,'stars','扪参历井，仰胁息。','Reach for the stars, breath held.'],[13,'sigh','以手抚膺，坐长叹。','Hand to the chest. A long sigh.'],
 [14,'light','提灯，照见古木。','Lift the lantern.'],[14,'distance','循声远望，月照空山。','Look afar, into the moonlit valley.']
];
for(const [i,key,zh,en] of cues){jobs.push({name:`cue-${i}-${key}`,text:zh,lang:'zh',cue:true},{name:`cue-${i}-${key}-en`,text:en,lang:'en',cue:true});}
fs.writeFileSync(path.join(__dirname,'voice-jobs.json'),JSON.stringify(jobs,null,2));console.log(`${jobs.length} voice files queued`);
