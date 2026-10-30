/* Local audio only. Sources and reproducible synthesis scripts are in ../制作记录/. */
(() => {
  'use strict';
  const STORAGE_KEY = 'shudao-course-audio-v1';
  const defaults = { music: true, narration: true, muted: false, musicVolume: 0.23, voiceVolume: 0.92 };
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') || {}; } catch (_) { /* Private or file browsers may deny storage. */ }
  const clamp = (value, fallback) => Number.isFinite(Number(value)) ? Math.max(0, Math.min(1, Number(value))) : fallback;
  const state = { ...defaults, started: false, paused: false };
  for (const key of ['music', 'narration', 'muted']) if (typeof saved[key] === 'boolean') state[key] = saved[key];
  for (const key of ['musicVolume', 'voiceVolume']) state[key] = clamp(saved[key], defaults[key]);

  const music = new Audio('assets/audio/music.mp3');
  music.loop = true;
  music.preload = 'metadata';
  music.volume = 0;
  const effect = new Audio('assets/audio/bird.mp3');
  effect.preload = 'metadata';
  let current = null;
  let effectActive = false;
  let musicFade = 0;
  let status = '声音尚未开启';
  let serial = 0;

  function getState() {
    const active = current && !current.audio.paused && !state.paused;
    return {
      ...state,
      playing: Boolean(active),
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
    const speaking = current && !current.audio.paused && !state.paused;
    const duck = speaking || (effectActive && !effect.paused && !state.paused);
    const target = state.music && !state.muted ? state.musicVolume * (duck ? 0.22 : 1) : 0;
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
      const progress = Math.min(1, (now - began) / 260);
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
    return attemptPlay(music, () => {
      if (musicWanted()) emit('配乐暂未播放，可再次点击音乐开关重试');
    });
  }

  function clearVoice(reset = true) {
    if (current) {
      const previous = current;
      current = null;
      previous.audio.pause();
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
    clearEffect();
    state.started = true;
    // A deliberate poem play is a fresh user action; automatic stages respect pause.
    if (explicit) state.paused = false;
    const audio = new Audio(`assets/audio/${name}.mp3`);
    audio.preload = 'auto';
    const session = { audio, name, kind, label, automatic, id: ++serial };
    current = session;
    adjustVolumes(true);
    audio.addEventListener('playing', () => {
      if (current !== session) { audio.pause(); return; }
      if (state.paused) { audio.pause(); return; }
      adjustVolumes();
      emit(`正在播放${label}`);
    });
    audio.addEventListener('ended', () => {
      if (current !== session) return;
      current = null;
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
    if (state.paused) { emit(`${label}已就绪，继续后播放`); return Promise.resolve(false); }
    emit(`正在准备${label}`);
    return attemptPlay(audio, fail);
  }

  function playStage(index, force = false) {
    clearVoice();
    clearEffect();
    if (!Number.isInteger(index) || index < 0 || index > 17) { emit('场景音频索引无效'); return Promise.resolve(false); }
    if (!state.narration && !force) { emit('自动旁白已关闭'); return Promise.resolve(false); }
    return beginVoice(`stage-${index}`, 'stage', '场景旁白', false, !force);
  }

  function playPoem(index = -1) {
    if (!Number.isInteger(index) || index < -1 || index > 2) { emit('诗歌音频索引无效'); return Promise.resolve(false); }
    return beginVoice(index === -1 ? 'full-poem' : `poem-${index}`, 'poem', index === -1 ? '全诗朗读' : `第${index + 1}段朗读`, true);
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
    if (state.music) playMusic(); else music.pause();
    adjustVolumes();
    persist();
    emit(state.music ? '背景音乐已开启' : '背景音乐已关闭');
  }

  function setNarration(enabled) {
    state.narration = Boolean(enabled);
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

  function bird() {
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
  window.CourseAudio = { start, playStage, playPoem, stopVoice, pause, resume, setMusic, setNarration, setMuted, setMusicVolume, setVoiceVolume, bird, getState };
})();
