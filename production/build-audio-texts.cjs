const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');
const context = { window: {} };
vm.createContext(context);
for (const name of ['story.js', 'content.js']) vm.runInContext(fs.readFileSync(path.join(root, '课件', name), 'utf8'), context);
// Only the speech input is adjusted; the visible poem remains unchanged.
const replacements = [
  ['噫吁嚱', '一，嘘，西'], ['鱼凫', '鱼服'], ['秦塞', '秦赛'],
  ['猿猱', '猿挠'], ['扪参', '门深'], ['仰胁息', '仰谐息'],
  ['抚膺', '抚英'], ['巉岩', '馋岩'], ['悲鸟号', '悲鸟豪'],
  ['喧豗', '喧灰'], ['砯崖', '乒崖'], ['崔嵬', '崔围'],
  ['咨嗟', '资街'], ['早还家', '早环家'], ['何时还', '何时环']
];
const spoken = text => replacements.reduce((value, [from, to]) => value.split(from).join(to), text);
const story = context.window.COURSE_STORY;
const poem = context.window.COURSE_CONTENT.poem;
if (story.length !== 18 || poem.length !== 3 || !poem.every(text => typeof text === 'string')) throw new Error('Unexpected teaching content structure');
const jobs = story.map((stage, index) => ({ name: `stage-${index}`, original: stage.voice || stage.caption, text: spoken(stage.voice || stage.caption) }));
poem.forEach((text, index) => jobs.push({ name: `poem-${index}`, original: text, text: spoken(text) }));
jobs.push({ name: 'full-poem', original: '蜀道难。李白。' + poem.join('\n\n'), text: spoken('蜀道难。李白。' + poem.join('\n\n')) });
fs.writeFileSync(path.join(__dirname, 'audio-texts.json'), JSON.stringify({ engine: 'Microsoft Huihui Desktop / OneCore via SAPI', rate: -2, replacements, jobs }, null, 2));
console.log(`Prepared ${jobs.length} speech tracks`);
