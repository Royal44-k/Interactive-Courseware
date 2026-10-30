/* Local audio only. Sources and reproducible synthesis scripts are in ../制作记录/. */
(() => {
  'use strict';
  const STORAGE_KEY = 'shanhai-course-audio-v3';
  const defaults = { voiceLang: 'zh', music: true, narration: true, muted: false, musicVolume: 0.23, voiceVolume: 0.92 };
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') || {}; } catch (_) { /* Private or file browsers may deny storage. */ }
  const clamp = (value, fallback) => Number.isFinite(Number(value)) ? Math.max(0, Math.min(1, Number(value))) : fallback;
  const state = { ...defaults, started: false, paused: false };
  if(saved.voiceLang==='en')state.voiceLang='en';
  for (const key of ['music', 'narration', 'muted']) if (typeof saved[key] === 'boolean') state[key] = saved[key];
  for (const key of ['musicVolume', 'voiceVolume']) state[key] = clamp(saved[key], defaults[key]);

  const music = new Audio('assets/audio/music.mp3');
  music.loop = true;
  music.preload = 'metadata';
  music.volume = 0;
  const effect = new Audio('assets/audio/bird.mp3');
  effect.preload = 'metadata';
  let current = null, suspended = null;
  let effectActive = false;
  let musicFade = 0;
  let status = '声音尚未开启';
  let serial = 0;
  const ambience = [new Audio(), new Audio()];
  ambience.forEach(a => { a.loop = true; a.preload = 'auto'; a.volume = 0; });
  let ambientSide = 0, ambientName = '', ambientMix = [0,0], ambientFade = 0;
  function applyAmbient() {
    const speaking = current && !state.paused;
    ambience.forEach((a,i) => { a.muted=state.muted; a.volume=state.music ? state.musicVolume*.55*ambientMix[i]*(speaking?.4:1) : 0; });
  }
  function playAmbience() {
    if (!musicWanted()) return;
    ambience.forEach((a,i) => { if (a.getAttribute('src') && (ambientMix[i]>.001 || i===ambientSide)) attemptPlay(a,()=>{}); });
  }
  function setEnvironment(world) {
    const name=['waterfall','stream'].includes(world)?'river':world==='sea'?'sea':['gate','banquet'].includes(world)?'':'wind';
    if(name===ambientName)return;
    ambientName=name;const old=ambientSide;ambientSide=1-ambientSide;
    const incoming=ambience[ambientSide];incoming.pause();incoming.volume=0;
    if(name){incoming.src=`assets/audio/amb-${name}.mp3`;incoming.load();}
    else incoming.removeAttribute('src');
    const from=ambientMix.slice(),start=performance.now();cancelAnimationFrame(ambientFade);playAmbience();
    const tick=now=>{const p=Math.min(1,(now-start)/900),e=p*p*(3-2*p);ambientMix[old]=from[old]*(1-e);ambientMix[ambientSide]=name?e:0;applyAmbient();if(p<1)ambientFade=requestAnimationFrame(tick);else ambience[old].pause();};ambientFade=requestAnimationFrame(tick);
  }

  function getState() {
    const active = current && !current.audio.paused && !state.paused;
    return {
      ...state,
      playing: Boolean(active), pending: Boolean(current), effectActive, effectTime:effect.currentTime||0, effectSource:effect.src.split('/').at(-1),
      musicPlaying: !music.paused && state.music && !state.paused,
      ambientTrack: ambientName,
      ambientPlaying: ambience.some(a=>!a.paused),
      track: current ? current.name : null,
      kind: current ? current.kind : null,
      currentTime: current ? current.audio.currentTime || 0 : 0,
      duration: current && Number.isFinite(current.audio.duration) ? current.audio.duration : 0,
      status
    };
  }

  function emit(message) {
    if (message) status = message;
    window.dispatchEvent(new CustomEvent('course-audio', { detail: getState() }));
  }

  function persist() {
    const preferences = {};
    for (const key of Object.keys(defaults)) preferences[key] = state[key];
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences)); } catch (_) { /* Audio works without persistence. */ }
  }

  function adjustVolumes(immediate = false) {
    applyAmbient();
    const speaking = current && !state.paused;
    const duck = speaking || (effectActive && !effect.paused && !state.paused);
    const target = state.music && !state.muted ? state.musicVolume * (duck ? 0.32 : 1) : 0;
    music.muted = state.muted;
    effect.muted = state.muted;
    effect.volume = state.voiceVolume * 0.55;
    if (current) {
      current.audio.muted = state.muted;
      current.audio.volume = state.voiceVolume;
    }
    cancelAnimationFrame(musicFade);
    if (immediate) { music.volume = target; return; }
    const from = music.volume;
    const began = performance.now();
    const tick = now => {
      const progress = Math.min(1, (now - began) / (duck ? 420 : 950));
      music.volume = clamp(from + (target - from) * progress, target);
      if (progress < 1) musicFade = requestAnimationFrame(tick);
    };
    musicFade = requestAnimationFrame(tick);
  }

  function attemptPlay(element, onError) {
    try {
      const result = element.play();
      return Promise.resolve(result).then(() => true).catch(error => { onError(error); return false; });
    } catch (error) {
      onError(error);
      return Promise.resolve(false);
    }
  }

  function musicWanted() { return state.started && state.music && !state.paused; }

  function playMusic() {
    if (!musicWanted()) return Promise.resolve(false);
    playAmbience();
    return attemptPlay(music, () => {
      if (musicWanted()) emit('配乐暂未播放，可再次点击音乐开关重试');
    });
  }

  function clearVoice(reset = true) {
    if (current) {
      const previous = current;
      current = null;
      previous.audio.pause();
      previous.finish?.(false);
      if (reset) { try { previous.audio.currentTime = 0; } catch (_) {} }
    }
    adjustVolumes();
  }

  function clearEffect() {
    effectActive = false;
    effect.pause();
    try { effect.currentTime = 0; } catch (_) {}
    adjustVolumes();
  }

  function start() {
    state.started = true;
    adjustVolumes();
    emit(state.muted ? '已开启声音，当前为静音' : '声音已就绪');
    return playMusic();
  }

  function beginVoice(name, kind, label, explicit, automatic = kind === 'stage') {
    clearVoice();
    state.started = true;
    // A deliberate poem play is a fresh user action; automatic stages respect pause.
    if (explicit) state.paused = false;
    const audio = new Audio(`assets/audio/${name}.mp3`);
    audio.preload = 'auto';
    let finish;const done=new Promise(resolve=>{finish=resolve;});
    const session = { audio, name, kind, label, automatic, id: ++serial, done, finish };
    if((kind==='stage'||kind==='poem')&&!name.startsWith('v2r-'))audio.playbackRate=.9;
    current = session;
    adjustVolumes();
    audio.addEventListener('playing', () => {
      if (current !== session) { audio.pause(); return; }
      if (state.paused) { audio.pause(); return; }
      adjustVolumes();
      emit(`正在播放${label}`);
    });
    audio.addEventListener('ended', () => {
      if (current !== session) return;
      current = null;session.finish(true);
      adjustVolumes();
      emit(`${label}播放完毕`);
    });
    const fail = error => {
      if (current !== session || state.paused || (error && error.name === 'AbortError')) return;
      clearVoice();
      emit(`${label}暂未播放，可再次点击重试`);
    };
    audio.addEventListener('error', fail);
    playMusic();
    if (state.paused) { emit(`${label}已就绪，继续后播放`); return done; }
    emit(`正在准备${label}`);
    attemptPlay(audio, fail);return done;
  }

  function playStage(index, force = false) {
    clearVoice();
    clearEffect();
    if (!Number.isInteger(index) || index < 0 || index >= window.COURSE_STORY.length) { emit('场景音频索引无效'); return Promise.resolve(false); }
    if (!state.narration && !force) { emit('自动旁白已关闭'); return Promise.resolve(false); }
    return beginVoice(`${index===13?'v2r-study':index===18?'v2-study':'stage'}-${index}${state.voiceLang==='en'?'-en':''}`, 'stage', '场景旁白', false, !force);
  }

  function playPoem(index = 'xing') {
    if (!['xing','shu'].includes(index)) { emit('诗歌音频索引无效'); return Promise.resolve(false); }
    return beginVoice(`${index==='shu'&&state.voiceLang==='en'?'v2r-':''}poem-${index}${state.voiceLang==='en'?'-en':''}`, 'poem', index === 'xing' ? '《行路难·其一》' : '《蜀道难》', true);
  }

  function stopVoice() {
    clearVoice();
    clearEffect();
    emit('朗读已停止');
  }

  function pause() {
    state.paused = true;
    if (current) current.audio.pause();
    music.pause();
    ambience.forEach(a=>a.pause());
    effect.pause();
    adjustVolumes();
    emit('已暂停，保留播放位置');
  }

  function resume() {
    state.started = true;
    state.paused = false;
    playMusic();
    if (current) {
      const session = current;
      attemptPlay(session.audio, () => {
        if (current === session && !state.paused) { clearVoice(); emit('朗读暂未恢复，可再次点播'); }
      });
    }
    if (effectActive) attemptPlay(effect, () => { effectActive = false; adjustVolumes(); });
    adjustVolumes();
    emit(current ? '继续朗读' : '已继续');
  }

  function setMusic(enabled) {
    state.music = Boolean(enabled);
    if (state.music) playMusic(); else {music.pause();ambience.forEach(a=>a.pause());}
    adjustVolumes();
    persist();
    emit(state.music ? '背景音乐已开启' : '背景音乐已关闭');
  }

  function setNarration(enabled) {
    state.narration = Boolean(enabled);
    if(!state.narration&&suspended?.automatic){suspended.audio.pause();suspended.finish(false);suspended=null;}
    if (!state.narration && current && current.automatic) clearVoice();
    persist();
    emit(state.narration ? '自动旁白已开启' : '自动旁白已关闭，仍可点播诗歌');
  }

  function setMuted(enabled) {
    state.muted = Boolean(enabled);
    adjustVolumes(true);
    persist();
    emit(state.muted ? '全部声音已静音' : '已取消静音');
  }

  function setMusicVolume(value) {
    state.musicVolume = clamp(value, state.musicVolume);
    adjustVolumes();
    persist();
    emit(`配乐音量 ${Math.round(state.musicVolume * 100)}%`);
  }

  function setVoiceVolume(value) {
    state.voiceVolume = clamp(value, state.voiceVolume);
    adjustVolumes(true);
    persist();
    emit(`朗读音量 ${Math.round(state.voiceVolume * 100)}%`);
  }

  function bird(cuckoo=false) {
    effect.src=cuckoo?'assets/audio/cuckoo.ogg':'assets/audio/bird.mp3';
    state.started = true;
    effectActive = true;
    try { effect.currentTime = 0; } catch (_) {}
    adjustVolumes();
    if (state.paused) { emit('鸟鸣已就绪，继续后播放'); return Promise.resolve(false); }
    playMusic();
    return attemptPlay(effect, () => {
      effectActive = false;
      adjustVolumes();
      emit('鸟鸣暂未播放，可再次点击重试');
    });
  }

  effect.addEventListener('playing', () => { adjustVolumes(); emit('林间鸟鸣'); });
  effect.addEventListener('ended', () => { effectActive = false; adjustVolumes(); emit('鸟鸣已结束'); });
  effect.addEventListener('error', () => { effectActive = false; adjustVolumes(); emit('鸟鸣暂不可用，可再次点击重试'); });
  music.addEventListener('error', () => { if (musicWanted()) emit('背景音乐暂不可用，可再次点击音乐开关重试'); });
  function setVoiceLang(lang){clearVoice();state.voiceLang=lang==='en'?'en':'zh';persist();emit(state.voiceLang==='en'?'English voice selected':'中文声音已选');}
  function playCue(index,key){if(!state.narration)return Promise.resolve(false);return beginVoice(`${window.V2_VOICE_PREFIX}-cue-${index}-${key}${state.voiceLang==="en"?"-en":""}`,"cue","动作吟声",false,true);}
  function playIntro(index,force=false){if(!state.narration&&!force)return Promise.resolve(false);return beginVoice(`${index===23?'v3':window.V2_VOICE_PREFIX}-intro-${index}${state.voiceLang==='en'?'-en':''}`,'intro','入境吟声',false,true);}
  function suspendStory(){if(suspended)return;suspended=current;current=null;adjustVolumes();}
  function resumeStory(){clearVoice();if(suspended){current=suspended;suspended=null;}if(!state.paused)resume();}
  function waitVoice(){return current?.done||Promise.resolve(true);}
  window.CourseAudio = { playIntro,waitVoice,suspendStory,resumeStory,cuckoo:()=>bird(true), playCue, setVoiceLang, start, playStage, playPoem, stopVoice, pause, resume, setMusic, setNarration, setMuted, setMusicVolume, setVoiceVolume, bird, setEnvironment, getState };
})();
