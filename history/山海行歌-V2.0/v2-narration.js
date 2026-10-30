/* V2.0 spoken reading: concise screen captions, fuller interpretation in the voice. */
(() => {
 'use strict';
 const openings = [
  ['李太白邀君同游。|诗吟蜀道之险峻，歌咏云海之壮丽。|且循一声长吟，从心中歧路，行向万里沧海。','Li Bai invites you to wander. | Hear the perilous road to Shu, and the splendour of a sea of clouds. | Follow the song, from the heart’s uncertain paths towards the open sea.'],
  ['门外是长安夜色，门内是一席灯火。|这一程，先从繁华深处，听一颗未得舒展的心。','Beyond the door lies Chang’an at night; within, a banquet glows. | Our journey begins amid splendour, with a heart that cannot find ease.'],
  ['清酒映灯，珍馐满席。|主人待客的盛意，都在这一案之间；而诗人的心，似乎另有所系。','Clear wine catches the lamplight; fine dishes fill the table. | The feast speaks of a host’s generosity, yet the poet’s thoughts are elsewhere.'],
  ['灯影未动，心绪已乱。|满席佳肴依旧，先前的从容，却渐渐留不住了。','The lamplight is still; the heart is restless. | The feast has not changed, but its guest can no longer feel at ease.'],
  ['满堂繁华，忽然退成寂静。|心中的不甘，还在寻找一个出口。','The splendour of the hall recedes into silence. | An unyielding spirit is still searching for a way forward.'],
  ['夜色四合，天地虽阔，去路未明。|且随这未定的目光，在远近高低之间，听一听心中的回声。','Night closes in. The world is vast, but the way ahead is unclear. | Follow the searching gaze, near and far, high and low, and hear the heart’s unanswered question.'],
  ['长河横亘，寒气迎面。|方才席间的心事，在想象中，化成了一条难渡的河。','A great river bars the way, and cold meets us head on. | The trouble felt at the banquet now takes shape as a river that cannot be crossed.'],
  ['太行苍茫，风雪无边。|河川之外，又一重高山立在前路。','The Taihang Mountains stretch into a boundless storm. | Beyond the river, another barrier rises on the road ahead.'],
  ['山路到了分岔处，远近皆是未卜之途。|越想向前，越觉脚下难以抉择。','The mountain path divides. Near or far, every road is uncertain. | The stronger the wish to go forward, the harder it is to choose a way.'],
  ['别却席间心事，迎面已是蜀山。|此刻，且换听《蜀道难》的声音：一声惊叹，便将天地撑开。','We leave the troubled banquet behind, and the mountains of Shu rise before us. | Now listen to The Hard Road to Shu: its opening cry expands the world before our eyes.'],
  ['古道藏在崖壁间，石色苍苍。|脚下的通途并非从来便有，诗人把它的开辟，写进了古老传说。','An ancient path clings to the grey cliff. | This passage did not always exist. The poet imagines its opening through an ancient legend.'],
  ['云端是日月，足下是江流。|山的高，水的险，即将在一仰一俯之间相逢。','Above the clouds, the sun; beneath our feet, the river. | Height and danger meet as our gaze turns from the sky towards the depths.'],
  ['青泥岭上，来路渐隐。|岩峦层层相叠，仿佛没有一段路，肯直直地通向远方。','On Qingni Ridge, the path behind us fades. | Rocky folds rise one beyond another; no stretch of road seems willing to run straight towards the distance.'],
  ['夜空低垂，万籁俱寂。|山势高到何处，且听诗人如何把人的身影，放到星辰之间。','The night sky hangs low, and every sound is stilled. | How high are these mountains? Listen as the poet places a human figure among the stars.'],
  ['林深处，枝影交错。|天色暗了，山中的声音，反而一声声清晰起来。','Deep in the forest, shadows of branches intertwine. | As the light fades, the sounds of the mountains grow strangely clear.'],
  ['一轮寒月，照着无人的山径。|且听，寂静里有什么声音，正从林间传来。','A cold moon lights a deserted mountain path. | Listen. Something is calling through the stillness of the trees.'],
  ['林声渐远，水气渐浓。|方才的幽静，被深谷里奔来的声浪，层层推开。','The forest sounds recede, and the air grows heavy with spray. | The hush gives way to a rising roar from the ravine.'],
  ['蜀门在此，万山收束成一线。|行至剑阁，山川的险峻，又添了一重关塞的森严。','Here stands the gateway to Shu, where mountains narrow to a single passage. | At Sword Gate, the peril of the landscape takes on the severity of a guarded frontier.'],
  ['锦城深处，烟火繁华。|然而一路的惊心尚未散去，眼前的热闹，也留不住那一份牵挂。','Deep in the Brocade City, daily life flourishes. | Yet the perils of the journey still weigh on the heart; even this bustle cannot silence its concern.'],
  ['千重山外，还有故园。|《蜀道难》的行吟将尽，诗人的目光，却仍向着远处。','Beyond a thousand mountain folds, home remains. | The Hard Road to Shu is drawing to its close, but the poet’s gaze still reaches into the distance.'],
  ['山声渐息，溪色转青。|让我们回到《行路难》，在迟疑之外，听见另一种可能。','The mountains fall quiet; the stream turns green. | We return to Hard Is the Road, and listen for a possibility beyond hesitation.'],
  ['一枕江声，浮生入梦。|清溪的等候未远，诗人的思绪，又随着一叶舟轻轻荡开。','With river sounds beside the pillow, life drifts into a dream. | The thought of waiting by a stream opens into another image: a boat upon the water.'],
  ['长夜将尽，风起沧海。|前路仍然辽阔，心中的声音，却已渐渐有了力量。','The long night is ending; wind rises over the sea. | The way ahead remains vast, but the voice within begins to gather strength.'],
  ['山海仍在，行歌未止。|《蜀道难》以长叹寄关切，《行路难》以云帆见信念。|两首诗，各有回声；愿君怀此心，行向自己的远方。','Mountains and seas remain; the song continues. | The Hard Road to Shu closes in a sigh of concern; Hard Is the Road finds faith in a rising sail. | Each poem keeps its own voice. Carry their echoes towards your own horizon.']
 ];
 // These are original teaching readings, not additional lines attributed to Li Bai.
 const readings = {
  '1-touch':['隔着一道门，尘世的喧声渐远，眼前的灯影渐近。','Beyond the threshold, the noise of the world recedes and the lamplight draws us in.'],
  '1-open':['随这一线渐开的光，走入诗人的心境；盛筵之中，也会有难言的孤独。','Follow the widening light into the poet’s state of mind. Even a splendid feast may hold an unspoken loneliness.'],
  '2-cup':['一个“金”字，先写器物的华美；酒价极言其贵，盛情也随之可见。','The golden vessel establishes the feast’s splendour. Its extravagant price magnifies the value of the wine and the generosity of the occasion.'],
  '2-taste':['珍羞，是珍贵的美味。“万钱”与“十千”相映，把筵席的丰盛推到眼前。','These are rare delicacies. The two immense prices echo each other, making the abundance of the banquet almost tangible.'],
  '2-swallow':['这一口浅尝，是我们入诗的铺垫。满席滋味，终究难解心中郁结。','This brief taste is our imagined prelude to the verse. The table offers every pleasure, yet the heart remains troubled.'],
  '3-hesitate':['杯在手中，却无心再饮。动作忽然顿住，繁华与愁绪，便隔在了这一停之间。','The cup is close at hand, but the wish to drink has gone. In this arrested gesture, outward splendour meets inward sorrow.'],
  '3-stop':['并非佳肴不美，而是心事难平。箸落案头，无须直说愁苦，愁苦已然可见。','The food has lost none of its richness. It is the troubled heart that cannot accept it. The fallen chopsticks give sorrow a visible form.'],
  '4-draw':['胸中的不平，化作这一拔。剑锋虽出，心中仍寻不到可以施展的方向。','The drawn blade gives shape to an agitated spirit. Yet resolve alone cannot reveal where that strength should be directed.'],
  '4-gaze':['举目四望，却无所适从。这一刻，有想要有所作为的力量，也有无路可行的迷惘。','The gaze searches every direction and finds no answer. The desire to act remains strong, but it cannot yet find a path.'],
  '5-left':['目光向左，只有层层廊影。四顾，是寻路，也是心中反复的追问。','To the left, corridor follows corridor. This searching gaze turns an outward movement into an inward question.'],
  '5-up':['天宇如此开阔，人的心却仍有阻隔。高处的光，并没有立刻回答眼前的迷惘。','The sky is open and immense, yet the heart still feels confined. Its light offers no immediate answer to the uncertainty below.'],
  '5-right':['万家灯色依然，自己的去向却未可知。眼前虽有繁华，心中还缺一个方向。','The city’s lights remain, but one traveller’s destination is unknown. There is splendour to see, and still no certain way to follow.'],
  '5-down':['脚下的路默然延伸。景色换了，未解的心事仍在；这便是我们对“心茫然”的回望。','The path extends silently below. The view has changed, but the question remains. This imagined passage dwells on the poem’s bewildered heart.'],
  '6-river':['“欲渡”，是心有所往；“冰塞”，却将这份愿望拦住。难渡的河，也是理想受阻的心境。','The wish to cross expresses purpose; the blocking ice frustrates it. This imagined river makes an inward obstacle visible.'],
  '7-snow':['“将登”，又一次向前；“雪满”，又一重阻隔。冰与雪相接，写尽进退维谷，却未写尽求索之心。','Again comes the wish to advance; again, a barrier. Ice and snow deepen the sense of frustration, while the desire to seek a way remains.'],
  '8-roads':['短句接连而来，像欲行又止的脚步。“今安在”，问路在何方，也问人生该向何处。','The brief cries break the rhythm like footsteps starting and stopping. The question asks where the road lies, and where a life may turn.'],
  '9-height':['还未细说山川，惊叹已经夺声而出。以登天来比蜀道，夸张的想象，让险峻扑面而来。','Before any measured description, astonishment bursts out. Comparing this road with climbing heaven makes its peril immediate and overwhelming.'],
  '10-path':['这是五丁开山的传说，不是实录。诗人借神话写开路之艰；抬眼再看，石栈才沿着崖壁相接。','This is the legend of the five strongmen, not a historical report. Myth evokes the terrible cost of opening a passage; the cliff paths emerge from that imagined upheaval.'],
  '11-high':['神话中的日车由六龙驾驭，到了这里，也仿佛要回转。山峰之高，已超出寻常尺度。','In myth, six dragons draw the sun’s chariot. Even they seem forced to turn here. The mountain’s height exceeds every ordinary measure.'],
  '11-low':['目光从天际落入深谷，回旋的激流与高峰相对。一个“上”，一个“下”，把蜀道的险写满天地。','Our gaze falls from the sky into the gorge. The turning torrent answers the towering peak: above and below, peril fills the landscape.'],
  '12-bends':['“九折”极写曲折，并非要我们数清弯道。山路缠绕岩峦，行人的步履，也被一次次牵回。','The many turns emphasise the path’s winding course, rather than give an exact count. Each bend draws the traveller back around another fold of rock.'],
  '13-stars':['参、井，是星宿之名。仿佛伸手可触，写山之高；仰头不敢呼吸，又把惊险写进了人的身体。','Shen and Jing are constellations. To seem close enough to touch them conveys immense height; the held breath makes that height a bodily fear.'],
  '13-sigh':['“膺”是胸口，“坐”在这里是徒然。手抚胸前，只能长叹；方才的浩瀚，终于落成一声人的叹息。','The hand returns to the chest. Here the Chinese word zuo means in vain, not sitting down. Beneath the vast sky, the traveller can only heave a long sigh.'],
  '14-light':['古木深深，鸟声凄切。一个“悲”字，让本来无情的山林，染上行人心中的愁。','Ancient trees surround a mournful call. The word sorrowing colours the forest with the traveller’s own unease.'],
  '14-distance':['鸟影成双，来回绕林；行人却置身陌生的山路。声音与身影，使这片幽深更添孤寂。','The birds move together among the trees, while the traveller faces an unfamiliar road. Their calls and circling forms deepen the sense of solitude.'],
  '15-moon':['子规，便是杜鹃。啼声传过山谷，越有回音，越觉空寂；诗人的愁，也随着这一声，落满空山。','Zigui is a cuckoo. Its call crosses the valley; the echo makes the emptiness more distinct. Through that sound, sorrow seems to fill the mountains.'],
  '16-torrent':['“争”，写水势奔涌；“雷”，写声响震谷。方才是鸟鸣衬静，此刻是万壑齐响，险境骤然逼近。','The torrents seem to compete in their rush, and their sound becomes thunder. Birdsong once made the stillness deeper; now the whole ravine resounds with danger.'],
  '17-far':['群峰夹峙，关隘高耸。剑阁之险，先落在这逼仄的地势之间。','The peaks close in around a towering pass. Its danger begins with the narrowness of the terrain itself.'],
  '17-near':['一人守住要隘，便仿佛扼住整条通路。此句着重写的，是关口易守难攻。','A single defender seems able to command the whole passage. The line stresses how readily the narrow pass can be held.'],
  '17-knock':['一与万，形成极强的对照。关门森然，也让诗意从山川之险，转向对人事的警惕。','One stands against ten thousand. This striking contrast shifts the poem from the dangers of the landscape towards concern about those who command it.'],
  '18-city':['锦城，指成都。不是不见它的繁华，而是牵挂胜过留恋；这一声劝归，含着对远行人的关切。','The Brocade City is Chengdu. The poem acknowledges its pleasures, yet concern outweighs their appeal. The counsel to return is also an expression of care.'],
  '19-home':['西望之间，惊叹已化作长叹。蜀道的雄奇与忧思，一同留在这未尽的声音里。','The westward gaze turns astonishment into a lingering sigh. The grandeur of Shu and the poem’s concern remain together in that unresolved sound.'],
  '20-fish':['此处用姜尚的典故：相传他在溪边垂钓，后来得到重用。诗人借前人的际遇，为未展的抱负，留住一线希望。','This recalls the story of Jiang Shang, who fished before being called to serve. His eventual recognition offers the poet hope that unfulfilled ambition may yet find its hour.'],
  '21-dream':['又用伊尹的典故：相传他受商汤任用前，曾梦见乘舟经过日旁。两个典故接续，低回的心境，渐渐转向期待。','Another allusion follows: before being called to serve Tang, Yi Yin was said to have dreamed of sailing beside the sun. These remembered possibilities turn hesitation towards expectation.'],
  '22-sail':['“会有时”，并非眼前已无风浪，而是相信终有施展抱负的一天。于是云帆高挂，漫长的求索，有了继续向前的勇气。','One day does not mean the waves have already vanished. It declares faith that ambition will find its moment. The rising sail carries the courage to continue.']
 };
 COURSE_STORY[13].en.title=COURSE_STORY[13].en.title.map(t=>t.replace('I sit and sigh','I can only sigh'));
 COURSE_STORY[13].cues[1].en='With a hand upon my chest, I can only sigh.';
 COURSE_STORY[13].explanation='扪参历井仰胁息，以手抚膺坐长叹。参、井是星宿名；扪是摸，膺是胸，坐在这里是徒然。诗人夸张地写山高近星，又以屏息、抚胸、长叹写行人的惊惧。伸向星空的手回到胸前，让浩瀚山川与人的感受相接。';
 COURSE_STORY[13].en.explanation='Reaching past the stars of Shen and Jing, I look up and hold my breath. With a hand upon my chest, I can only sigh. Shen and Jing are constellations. Seeming to touch them is an exaggeration of height; the held breath, hand on the chest and long sigh convey the traveller’s fear. Here zuo means in vain, not sitting down.';
 window.V2_VOICE_PREFIX='v2r';
 window.V2_VOICE_JOBS=[];
 COURSE_STORY.forEach((s,i)=>{
  s.spokenIntro={zh:openings[i][0],en:openings[i][1]};
  s.cues.forEach(c=>{const r=readings[`${i}-${c.key}`];if(!r)throw Error(`Missing reading ${i}-${c.key}`);c.reading={zh:r[0],en:r[1]};});
  for(const lang of ['zh','en']){
   const suffix=lang==='en'?'-en':'';
   V2_VOICE_JOBS.push({name:`v2r-intro-${i}${suffix}`,lang,parts:[{text:s.spokenIntro[lang],style:'prose'}]});
   for(const c of s.cues)V2_VOICE_JOBS.push({name:`v2r-cue-${i}-${c.key}${suffix}`,lang,cue:true,parts:[{text:c[lang],style:[1,5].includes(i)||c.key==='swallow'?'prose':'verse'},{text:c.reading[lang],style:'prose'}]});
  }
 });
 for(const lang of ['zh','en'])V2_VOICE_JOBS.push({name:`v2r-study-13${lang==='en'?'-en':''}`,lang,parts:[{text:lang==='zh'?COURSE_STORY[13].explanation:COURSE_STORY[13].en.explanation,style:'prose'}]});
 V2_VOICE_JOBS.push({name:'v2r-poem-shu-en',lang:'en',parts:EN_POEMS.shu.map(text=>({text,style:'verse'}))});
})();
