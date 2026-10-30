/* V2 director: the entrance evokes a setting; the poem is spoken with its gesture. */
(() => {
 const intros=[
 ['李太白邀君同游。|诗吟蜀道之险峻，歌咏云海之壮丽。','Li Bai invites you to wander. | Hear the perilous road to Shu, and the splendour of a sea of clouds.'],
 ['门外是长安夜色。|门内，一席灯火正盛。','Beyond the door lies Chang’an at night. | Within, the lamplight glows.'],
 ['清酒映灯，珍馐满席。|眼前的丰盛，照不亮心底的阴影。','Clear wine catches the lamplight; fine dishes fill the table. | Yet abundance cannot dispel the shadow in the heart.'],
 ['灯影未动，心绪已乱。','The lamplight is still. | The heart is restless.'],
 ['满堂繁华，忽然退成寂静。','The splendour of the hall recedes into silence.'],
 ['夜色四合。|天地虽阔，去路未明。','Night closes in. | The world is vast, but the way ahead is unclear.'],
 ['长河横亘，寒气迎面。','A great river bars the way. | The cold meets us head on.'],
 ['太行苍茫，风雪无边。','The Taihang Mountains stretch into a boundless storm.'],
 ['山路到了分岔处。|远近，皆是未卜之途。','The mountain path divides. | Near or far, every road is uncertain.'],
 ['别却席间心事，迎面已是蜀山。','We leave the troubled banquet behind. | The mountains of Shu rise before us.'],
 ['古道藏在崖壁间，石色记着开山的往事。','An ancient path clings to the cliff. | Its stones remember the opening of the mountains.'],
 ['云端是日月，足下是江流。','Above the clouds, the sun and moon. | Beneath our feet, the river.'],
 ['青泥岭上，来路渐隐。','On Qingni Ridge, the path behind us fades from sight.'],
 ['夜空低垂，万籁俱寂。','The night sky hangs low. | Every sound is stilled.'],
 ['林深处，枝影交错。','Deep in the forest, shadows of branches intertwine.'],
 ['一轮寒月，照着无人的山径。','A cold moon shines upon a deserted mountain path.'],
 ['林声渐远，水气渐浓。','The forest sounds recede. | The air grows heavy with spray.'],
 ['蜀门在此。|万山收束成一线。','Here stands the gateway to Shu. | A thousand mountains narrow to a single passage.'],
 ['锦城深处，烟火繁华。','Deep in the Brocade City, daily life flourishes.'],
 ['千重山外，还有故园。','Beyond a thousand mountain folds, home remains.'],
 ['山声渐息，溪色转青。','The mountains fall quiet. | The stream turns clear and green.'],
 ['一枕江声，浮生入梦。','With river sounds beside the pillow, life drifts into a dream.'],
 ['长夜将尽，风起沧海。','The long night is ending. | Wind rises over the open sea.'],
 ['山海仍在，行歌未止。|愿君怀此心，行向自己的远方。','Mountains and seas remain; the song continues. | Carry this spirit towards your own horizon.']
 ];
 // [progress, key, Chinese clauses, English clauses]
 const cues=[[],
 [[.02,'touch','门扉微凉。','The door is cool to the touch.'],[.43,'open','灯火深处，且入诗中。','Beyond the lamplight, let us enter the poem.']],
 [[.02,'cup','金樽清酒，斗十千。','Clear wine in golden cups, ten thousand coins a measure.'],[.37,'taste','玉盘珍羞，直万钱。','Fine delicacies on jade plates, worth ten thousand more.'],[.70,'swallow','珍馐入口，心事难消。','A taste of fine food. | Yet the troubled heart finds no ease.']],
 [[.03,'hesitate','停杯。','I set down my cup.'],[.54,'stop','投箸，不能食。','I cast aside my chopsticks. | I cannot eat.']],
 [[.04,'draw','拔剑。','I draw my sword.'],[.42,'gaze','四顾。|心茫然。','I look about me. | My heart is lost.']],
 [[.03,'left','廊下无人。','No one in the corridor.'],[.26,'up','抬眼，是一庭清月。','Looking up, I find a courtyard filled with moonlight.'],[.51,'right','回首，灯火已远。','Looking back, the lamplight seems far away.'],[.76,'down','俯看，归路仍空。','Looking down, the way home is still empty.']],
 [[.06,'river','欲渡黄河。|冰塞川。','I would cross the Yellow River. | Ice blocks its course.']],
 [[.06,'snow','将登太行。|雪满山。','I would climb the Taihang Mountains. | Snow fills their heights.']],
 [[.07,'roads','行路难！|行路难！|多歧路，今安在？','Hard is the road! | Hard is the road! | So many paths. Where is my way now?']],
 [[.05,'height','噫吁嚱！|危乎高哉！|蜀道之难，难于上青天。','Ah! | So perilous, so high! | The road to Shu is harder than climbing the blue heavens.']],
 [[.06,'path','地崩山摧壮士死。|然后，天梯石栈相钩连。','Earth split, mountains crumbled, and the brave men died. | Only then did skyward ladders and cliff paths link the way.']],
 [[.04,'high','上有六龙回日之高标。','Above, a peak so high that the sun’s six dragons turn their chariot back.'],[.52,'low','下有冲波逆折之回川。','Below, a river turns back upon itself in surging waves.']],
 [[.06,'bends','青泥何盘盘。|百步九折萦岩峦。','How Qingni twists and winds! | In a hundred paces, nine turns coil around the rocky peaks.']],
 [[.02,'stars','扪参历井，仰胁息。','Reaching past the stars of Shen and Jing, I look up and hold my breath.'],[.64,'sigh','以手抚膺，坐长叹。','With a hand upon my chest, I sit and sigh.']],
 [[.03,'light','但见悲鸟，号古木。','Only sorrowing birds cry among ancient trees.'],[.46,'distance','雄飞雌从，绕林间。','The male flies; the female follows, circling through the woods.']],
 [[.18,'moon','又闻子规，啼夜月。|愁，空山。','And the cuckoo calls beneath the moon. | Sorrow fills the empty mountains.']],
 [[.07,'torrent','飞湍瀑流争喧豗。|砯崖转石，万壑雷。','Rapids and waterfalls roar together. | They strike the cliffs and tumble stones: thunder in ten thousand ravines.']],
 [[.03,'far','剑阁峥嵘而崔嵬。','Sword Gate rises, sheer and towering.'],[.44,'near','一夫当关。','One man guards the pass.'],[.72,'knock','万夫，莫开。','Ten thousand cannot break through.']],
 [[.07,'city','锦城虽云乐。|不如，早还家。','Though the Brocade City is a place of pleasure, | better to return home soon.']],
 [[.07,'home','侧身西望。|长咨嗟。','I turn and gaze westward. | A long, deep sigh.']],
 [[.06,'fish','闲来垂钓，碧溪上。','At leisure, I fish beside a clear green stream.']],
 [[.06,'dream','忽复乘舟，梦日边。','Then, in a dream, I sail in a boat beside the sun.']],
 [[.06,'sail','长风破浪，会有时。|直挂云帆，济沧海。','One day I shall ride the long wind and break the waves. | I shall raise my cloud-high sail and cross the vast blue sea.']],[]
 ];
 const durations=[4,12,24,11,14,25,10,10,14,16,17,20,14,19,18,18,16,23,13,11,11,12,17,1];
 const overrides={
 1:{bg:'v2-entry-courtyard'},3:{bg:'v2-banquet-table'},4:{bg:'v2-sword-hall'},
 5:{motion:'four-views',pan:0,views:['v2-empty-corridor','v2-night-eaves','v2-city-east','v2-stone-courtyard']},
 9:{bg:'v2-ascent-cleft'},11:{bg:'v2-sun-chariot',motion:'sun-river'},
 15:{bg:'v2-cuckoo',initialLamp:0},
 17:{bg:'v2-fortress-far',vista:null,motion:'fortress',views:['v2-fortress-flank','v2-gate-close'],action:'望关塞，叩城门'},
 18:{bg:'v2-jincheng',vista:'v2-home-bamboo',world:'mountain'},
 19:{vista:'v2-westward-road',motion:'back-vista'},
 21:{bg:'v2-sun-dream'},23:{bg:'v2-sail-distance',initialSail:0}
 };
 COURSE_STORY.forEach((s,i)=>{
  Object.assign(s,overrides[i]||{});
  s.intro={zh:intros[i][0],en:intros[i][1]};
  s.cues=cues[i].map(([at,key,zh,en])=>({at,key,zh,en}));
  s.baseDuration=durations[i];
  s.caption=intros[i][0].replaceAll('|','');s.en.caption=intros[i][1].replaceAll('|','');
  s.palette= i<=4?['#e8be73','#b76e51']:i===7||i===6?['#a7e6ed','#b6c9e7']:i===13?['#c5b6ff','#edda99']:i===14||i===15?['#c7dcff','#83bcb2']:i===11||i>=21?['#f8d797','#98d9d4']:i===17?['#d7af7b','#a6b6b5']:['#bed0b0','#dfc089'];
 });
 COURSE_STORY[17].en.action='Survey the pass; knock at the gate';
 COURSE_STORY[5].action='四顾天地';COURSE_STORY[5].en.action='Look in every direction';
 COURSE_STORY[18].explanation='锦城虽云乐，不如早还家。从锦城的繁华转向竹溪村舍，画面让“乐”与“还家”的取舍可见。《蜀道难》的劝归和长叹，包含对远行者的关切，也留下人事忧思。';
 COURSE_STORY[18].en.explanation='Though the Brocade City is a place of pleasure, better to return home soon. The view turns from the busy city towards a quiet village beside a bamboo-lined stream. The contrast makes the choice between pleasure and home visible. The poem’s counsel and final sigh retain both care for the traveller and concern about human affairs.';
 COURSE_STORY[21].action='乘舟，近梦中之日';COURSE_STORY[21].en.action='Drift towards the dream-sun';
 COURSE_STORY[23].action='重启自动吟游';COURSE_STORY[23].en.action='Wander again';
 window.V2_VOICE_JOBS=COURSE_STORY.flatMap((s,i)=>['zh','en'].flatMap(lang=>[
  {name:`v2-intro-${i}${lang==='en'?'-en':''}`,lang,text:s.intro[lang]},
  ...s.cues.map(c=>({name:`v2-cue-${i}-${c.key}${lang==='en'?'-en':''}`,lang,text:c[lang],cue:true}))
 ]));
 V2_VOICE_JOBS.push({name:'v2-study-18',lang:'zh',text:COURSE_STORY[18].explanation},{name:'v2-study-18-en',lang:'en',text:COURSE_STORY[18].en.explanation});
})();
