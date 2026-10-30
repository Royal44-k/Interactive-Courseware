const fs=require('fs'),vm=require('vm'),path=require('path');
const root=path.resolve(__dirname,'../../诗境重构版'),ctx={window:{}};ctx.window=ctx;vm.createContext(ctx);
for(const f of ['content.js','journey.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx);
const jobs=ctx.COURSE_STORY.map((s,i)=>({name:`stage-${i}`,text:s.narration}));
jobs.push({name:'poem-xing',text:ctx.XING_POEM.join('。')},{name:'poem-shu',text:ctx.COURSE_CONTENT.poem.join('。')});
fs.writeFileSync(path.join(__dirname,'voice-jobs.json'),JSON.stringify(jobs,null,2));
