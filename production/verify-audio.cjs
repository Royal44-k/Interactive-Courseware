const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert/strict');
const media = [];
const events = [];
const frames = new Map();
let frameId = 0;
class FakeAudio {
  constructor(src) { Object.assign(this, { src, paused: true, currentTime: 0, duration: 22, volume: 1, muted: false, plays: 0, handlers: {} }); media.push(this); }
  addEventListener(name, fn) { (this.handlers[name] ||= []).push(fn); }
  emit(name, value) { for (const fn of this.handlers[name] || []) fn(value); }
  play() { this.plays++; if (this.failNext) { this.failNext = false; return Promise.reject(new Error('test decode failure')); } this.paused = false; this.emit('playing'); return Promise.resolve(); }
  pause() { this.paused = true; }
}
const storage = {};
const context = {
  Audio: FakeAudio,
  localStorage: { getItem: k => storage[k], setItem: (k, v) => { storage[k] = v; } },
  CustomEvent: class { constructor(name, options) { this.type = name; this.detail = options.detail; } },
  window: { dispatchEvent: event => events.push(event) },
  performance: { now: () => 0 },
  requestAnimationFrame: fn => { frames.set(++frameId, fn); return frameId; },
  cancelAnimationFrame: id => frames.delete(id),
  console
};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', '课件', 'audio.js'), 'utf8'), context);
const api = context.window.CourseAudio;
const flushFades = () => { const pending = [...frames.values()]; frames.clear(); for (const fn of pending) fn(300); };
(async () => {
  await api.start();
  assert.equal(api.getState().started, true);
  api.setNarration(false);
  const count = media.length;
  assert.equal(await api.playStage(2), false);
  assert.equal(media.length, count, 'disabled automatic narration must not create a voice');
  await api.playStage(2, true);
  assert.equal(api.getState().track, 'stage-2', 'manual stage playback must work when narration is disabled');
  api.setNarration(false);
  assert.equal(api.getState().track, 'stage-2', 'narration preference must not stop a manually requested stage');
  api.pause();
  await api.playStage(3, true);
  assert.equal(api.getState().paused, true, 'manual stage playback still respects the experience pause state');
  assert.equal(api.getState().playing, false);
  await api.playPoem(0);
  assert.equal(api.getState().playing, true, 'explicit poem should work with narration disabled');
  assert.equal(api.getState().track, 'poem-0');
  flushFades();
  assert.ok(media[0].volume < api.getState().musicVolume * 0.3, 'music must duck while speech plays');
  let voice = media.at(-1);
  voice.currentTime = 7.5;
  api.pause();
  assert.equal(api.getState().playing, false);
  assert.equal(api.getState().currentTime, 7.5);
  api.resume();
  assert.equal(api.getState().currentTime, 7.5, 'resume must retain voice position');
  assert.equal(api.getState().playing, true);
  const voicePlays = voice.plays;
  api.stopVoice();
  api.pause();
  api.resume();
  assert.equal(voice.plays, voicePlays, 'stop then resume must not restart old speech');
  assert.equal(api.getState().track, null);
  flushFades();
  assert.equal(media[0].volume, api.getState().musicVolume, 'music must recover after speech');
  api.setNarration(true);
  await api.playStage(0);
  const oldVoice = media.at(-1);
  await api.playStage(1);
  oldVoice.emit('ended');
  assert.equal(api.getState().track, 'stage-1', 'stale ended events must not stop a new track');
  api.setNarration(false);
  assert.equal(api.getState().track, null, 'disabling narration stops an automatic voice');
  await api.playPoem(-1);
  api.setNarration(false);
  assert.equal(api.getState().track, 'full-poem', 'narration preference must not stop an explicit poem');
  api.setMuted(true);
  assert.equal(media.at(-1).muted, true);
  assert.equal(media[0].muted, true);
  api.setVoiceVolume(3);
  api.setMusicVolume(-1);
  assert.equal(api.getState().voiceVolume, 1);
  assert.equal(api.getState().musicVolume, 0);
  assert.ok(Object.keys(storage).length > 0);
  media.at(-1).emit('error', new Error('media failed'));
  assert.equal(api.getState().track, null);
  assert.match(api.getState().status, /重试/);
  await api.playPoem(2);
  assert.equal(api.getState().track, 'poem-2', 'a media failure must allow later retry');
  api.pause();
  await api.playPoem(1);
  assert.equal(api.getState().paused, false, 'explicit poem is a new playback action');
  assert.ok(events.every(event => event.type === 'course-audio' && typeof event.detail.status === 'string'));
  assert.equal(await api.playPoem(99), false);
  console.log('PASS: audio-state assertions; explicit playback, narration, pause/resume, stop, stale events, ducking, mute, clamping, persistence, recovery.');
})().catch(error => { console.error(error); process.exitCode = 1; });
