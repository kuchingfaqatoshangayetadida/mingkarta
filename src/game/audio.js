let AC = null, mg = null, sg = null;
let mOn = true, sOn = true, mV = 0.4, sV = 0.6;
let st = 0, nt = 0, NB = null;

const CH = [
  [261.6, 329.6, 392, 493.9],
  [220, 261.6, 329.6, 392],
  [293.7, 349.2, 440, 523.3],
  [196, 246.9, 293.7, 349.2]
];
const BS = [65.4, 55, 73.4, 49];
const SC = [523.3, 587.3, 659.3, 784, 880, 987.8];

export function getAudioContext() {
  return AC;
}

export function initAudio() {
  if (!AC) {
    try {
      AC = new (window.AudioContext || window.webkitAudioContext)();
      mg = AC.createGain();
      sg = AC.createGain();
      mg.connect(AC.destination);
      sg.connect(AC.destination);
      updateVolume();
      nt = AC.currentTime + 0.2;
      setInterval(mus, 100);
    } catch (e) {
      console.warn('AudioContext not supported:', e);
    }
  }
  if (AC && AC.state === 'suspended') {
    AC.resume();
  }
}

function nte(f, t, d, v, ty) {
  if (!AC || !mg) return;
  const o = AC.createOscillator(), g = AC.createGain();
  o.type = ty;
  o.frequency.value = f;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(v, t + .012);
  g.gain.exponentialRampToValueAtTime(.001, t + d);
  o.connect(g);
  g.connect(mg);
  o.start(t);
  o.stop(t + d + .05);
}

function nz(t, f, ty, v, d) {
  if (!AC || !mg) return;
  if (!NB) {
    NB = AC.createBuffer(1, 22050, 44100);
    const x = NB.getChannelData(0);
    for (let i = 0; i < x.length; i++) x[i] = Math.random() * 2 - 1;
  }
  const s = AC.createBufferSource(), fl = AC.createBiquadFilter(), g = AC.createGain();
  s.buffer = NB;
  fl.type = ty;
  fl.frequency.value = f;
  g.gain.setValueAtTime(v, t);
  g.gain.exponentialRampToValueAtTime(.001, t + d);
  s.connect(fl);
  fl.connect(g);
  g.connect(mg);
  s.start(t);
  s.stop(t + d + .02);
}

function step(t, s) {
  const bar = (s >> 3) % 4, p = s & 7, c = CH[bar];
  if (p === 0) c.forEach(f => { nte(f, t, 2.2, .07, 'sine'); nte(f * 2, t, 1.2, .025, 'triangle'); });
  if (p === 4 || p === 7) c.slice(1).forEach(f => nte(f, t, .7, .04, 'triangle'));
  if (p === 0 || p === 4) nte(BS[bar], t, .7, .4, 'sine');
  if (p === 2 || p === 6) nte(BS[bar] * (p === 2 ? 1.5 : 2), t, .4, .22, 'sine');
  if (p === 0 || p === 4) {
    const o = AC.createOscillator(), g = AC.createGain();
    o.frequency.setValueAtTime(120, t);
    o.frequency.exponentialRampToValueAtTime(45, t + .15);
    g.gain.setValueAtTime(.35, t);
    g.gain.exponentialRampToValueAtTime(.001, t + .25);
    o.connect(g);
    g.connect(mg);
    o.start(t);
    o.stop(t + .3);
  }
  if (p === 2 || p === 6) nz(t, 1500, 'bandpass', .12, .12);
  nz(t, 7000, 'highpass', p % 2 ? .05 : .03, .05);
  if ([0, 2, 3, 4, 6, 7].includes(p) && Math.random() < .6) {
    const f = Math.random() < .5 ? c[(Math.random() * 4) | 0] * 2 : SC[(Math.random() * SC.length) | 0];
    nte(f, t, .55, .09, 'triangle');
  }
}

function mus() {
  if (!AC || !mOn || AC.state !== 'running') {
    if (AC) nt = Math.max(nt, AC.currentTime + .1);
    return;
  }
  while (nt < AC.currentTime + .4) {
    step(nt, st);
    nt += .3125 * (st % 2 ? .8 : 1.2);
    st++;
  }
}

export function updateVolume() {
  if (!AC) return;
  if (mg) mg.gain.value = mOn ? mV * .6 : 0;
  if (sg) sg.gain.value = sOn ? sV : 0;
}

export function playCardSound() {
  if (!AC || !sOn || !sg) return;
  const b = AC.createBuffer(1, 2205, 44100), d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / 350);
  const n = AC.createBufferSource(), f = AC.createBiquadFilter();
  n.buffer = b;
  f.type = 'bandpass';
  f.frequency.value = 1800;
  n.connect(f);
  f.connect(sg);
  n.start();
}

export function setMusicEnabled(enabled) {
  mOn = enabled;
  initAudio();
  updateVolume();
}

export function setMusicVolume(val) {
  mV = val;
  initAudio();
  updateVolume();
}

export function setSoundEnabled(enabled) {
  sOn = enabled;
  initAudio();
  updateVolume();
}

export function setSoundVolume(val) {
  sV = val;
  initAudio();
  updateVolume();
}

export function getAudioSettings() {
  return { mOn, sOn, mV, sV };
}
