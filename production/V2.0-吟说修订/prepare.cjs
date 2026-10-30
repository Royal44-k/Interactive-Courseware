const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'../../山海行歌-V2.0'),ctx={};ctx.window=ctx;vm.createContext(ctx);
for(const f of ['content.js','journey.js','bilingual.js','v2-content.js','v2-narration.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx);
fs.writeFileSync(path.join(__dirname,'voice-jobs.json'),JSON.stringify(ctx.V2_VOICE_JOBS,null,2));
fs.writeFileSync(path.join(__dirname,'scene-readings.json'),JSON.stringify(ctx.COURSE_STORY.map((s,i)=>({scene:i,title:s.title,intro:s.spokenIntro,cues:s.cues})),null,2));
console.log(JSON.stringify({scenes:ctx.COURSE_STORY.length,tracks:ctx.V2_VOICE_JOBS.length,spokenCharacters:ctx.V2_VOICE_JOBS.filter(j=>j.lang==='zh'&& !j.name.includes('study')).reduce((n,j)=>n+j.parts.reduce((n,p)=>n+p.text.length,0),0)}));
