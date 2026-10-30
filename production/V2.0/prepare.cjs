const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const base=path.resolve(__dirname,'../..'),root=path.join(base,'山海行歌-V2.0');
const ctx={window:{}};ctx.window=ctx;vm.createContext(ctx);
for(const file of ['content.js','journey.js','bilingual.js','v2-content.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx);
fs.writeFileSync(path.join(__dirname,'voice-jobs.json'),JSON.stringify(ctx.V2_VOICE_JOBS,null,2));
const walk=(dir,prefix='')=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(x=>x.isDirectory()?walk(path.join(dir,x.name),prefix+x.name+'/'):[{file:prefix+x.name,sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(dir,x.name))).digest('hex')}]);
const manifest=path.join(__dirname,'V1.0-sha256.json');if(!fs.existsSync(manifest))fs.writeFileSync(manifest,JSON.stringify(walk(path.join(base,'山海行歌-V1.0')),null,2));
console.log(JSON.stringify({voices:ctx.V2_VOICE_JOBS.length,scenes:ctx.COURSE_STORY.length}));
