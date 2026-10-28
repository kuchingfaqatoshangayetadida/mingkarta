import * as THREE from 'three';

// Personajlar: Three.js, belidan yuqori qism, 3D animatsiya
export const CHARS = [
  { id: 'yigit', n: 'Yigit', ic: '🧑', k: 'h', skin: '#f0c29a', hair: '#2a1a10', st: 'short', shirt: '#2f6fd6' },
  { id: 'qiz', n: 'Qiz', ic: '👩', k: 'h', skin: '#f6d3b3', hair: '#1b1210', st: 'long', shirt: '#d6457f' },
  { id: 'chol', n: 'Cholim', ic: '👴', k: 'h', skin: '#e6b78f', hair: '#e8e8e8', st: 'beard', hat: '#161616', shirt: '#2f8a58' },
  { id: 'bola', n: 'Bola', ic: '🧒', k: 'h', skin: '#f3c9a0', hair: '#7a4a22', st: 'cap', cap: '#e05a2b', shirt: '#f0b429' },
  { id: 'mushuk', n: 'Mushuk', ic: '🐱', k: 'a', fur: '#e8a24f', belly: '#fff1d9', ear: 'cone', shirt: '#7a4ad6' },
  { id: 'ayiq', n: 'Ayiq', ic: '🐻', k: 'a', fur: '#8a5a3a', belly: '#d9b48f', ear: 'ball', shirt: '#d65a3a' },
  { id: 'quyon', n: 'Quyon', ic: '🐰', k: 'a', fur: '#f1f1f1', belly: '#ffe3ec', ear: 'long', shirt: '#3aa6a6' },
  { id: 'tulki', n: 'Tulki', ic: '🦊', k: 'a', fur: '#e0642a', belly: '#fff4e6', ear: 'cone', shirt: '#2a4a8a' }
];

export const LOOK = { front: [0, 0], left: [-.75, 0], right: [.75, 0], up: [0, -.4], down: [0, .38] };

const _hg = (() => {
  const s = new THREE.Shape();
  s.moveTo(0, -.5);
  s.bezierCurveTo(-.1, -.4, -.55, -.1, -.5, .17);
  s.bezierCurveTo(-.46, .42, -.1, .5, 0, .22);
  s.bezierCurveTo(.1, .5, .46, .42, .5, .17);
  s.bezierCurveTo(.55, -.1, .1, -.4, 0, -.5);
  const g = new THREE.ExtrudeGeometry(s, { depth: .2, bevelEnabled: false });
  g.translate(0, 0, -.1);
  return g;
})();

const _sg = (() => {
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? .22 : .5;
    i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: .2, bevelEnabled: false });
  g.translate(0, 0, -.1);
  return g;
})();

const _et = {};
export function emojiTex(ch) {
  if (_et[ch]) return _et[ch];
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = '92px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
  g.fillText(ch, 64, 70);
  return _et[ch] = new THREE.CanvasTexture(c);
}

const _ab = Math.abs, _sn = Math.sin, _cs = Math.cos;
const _PRE = {
  smile: u => ({ ey: 'happy', mo: 'smile', ms: 1.05, rz: _sn(u * 2) * .05, rx: -.05 }),
  grin: u => ({ ey: 'happy', mo: 'op', ms: 1.1, msy: .55, rz: _sn(u * 3) * .07, by: _ab(_sn(u * 6)) * .05, A: [[.35, 0], [.35, 0]] }),
  laugh: u => ({ ey: 'happy', mo: 'op', ms: 1, msy: .7 + .3 * _ab(_sn(u * 16)), rx: -.15 + _sn(u * 18) * .12, by: _ab(_sn(u * 14)) * .07, k: .3, A: [[.1 + _ab(_sn(u * 14)) * .35, 0], [.1 + _ab(_sn(u * 14)) * .35, 0]] }),
  wink: u => ({ ey: 'open', wk: 0, mo: 'smile', ms: 1.1, rz: .17, ry: .2, k: .3 }),
  blush: u => ({ ey: 'happy', mo: 'smile', ms: .9, rx: .18, rz: _sn(u * 2) * .1, k: .3, A: [[-.8, -2.1], [-.8, -2.1]] }),
  heart: u => ({ ey: 'heart', mo: 'smile', ms: 1.1, rx: -.22, rz: _sn(u * 2.2) * .12, tz: _sn(u * 2.6) * .1, by: _sn(u * 5) * .03, k: .2, fx: 'hearts', A: [[.1, -1.1], [.1, -1.1]] }),
  love: u => ({ ey: 'heart', mo: 'smile', ms: 1.05, rz: _sn(u * 2) * .15, tz: _sn(u * 2) * .12, by: _ab(_sn(u * 4)) * .04, k: .2, fx: 'hearts', A: [[-.9, -1.35], [-.9, -1.35]] }),
  kiss: u => ({ ey: 'happy', mo: 'op', ms: .35, msy: .9 + .15 * _sn(u * 6), rx: -.12, tz: _sn(u * 2.5) * .05, k: .3, fx: 'hearts', A: [[.1, 0], [-.8, -2.1 + _sn(u * 3) * .3]] }),
  tongue: u => ({ ey: 'open', mo: 'tongue', ms: 1.1, rz: _sn(u * 4) * .08, by: _ab(_sn(u * 5)) * .03 }),
  tongueWink: u => ({ ey: 'open', wk: 0, mo: 'tongue', ms: 1.1, rz: .15 + _sn(u * 4) * .08, k: .3 }),
  yum: u => ({ ey: 'happy', mo: 'tongue', ms: 1.1, rz: _sn(u * 3) * .14, tz: _sn(u * 3) * .05, by: _ab(_sn(u * 3)) * .03 }),
  crazy: u => ({ ey: 'wide', mo: 'tongue', ms: 1.2, rx: _sn(u * 9) * .2, rz: _sn(u * 7) * .25, ry: _sn(u * 5) * .4, k: 0, tz: _sn(u * 8) * .1, by: _ab(_sn(u * 9)) * .05, A: [[.1 + _ab(_sn(u * 8)) * .9, 0], [.1 + _ab(_sn(u * 8 + 1)) * .9, 0]] }),
  silly: u => ({ ey: 'wide', mo: 'smile', ms: 1.2, rz: _sn(u * 3) * .5, tz: _sn(u * 3) * .2, by: _ab(_sn(u * 6)) * .05, k: .3, A: [[.1 + _ab(_sn(u * 6)) * .5, 0], [.1 + _ab(_sn(u * 6 + 2)) * .5, 0]] }),
  money: u => ({ ey: 'star', mo: 'op', ms: .9, msy: .6, by: _ab(_sn(u * 6)) * .08, rz: _sn(u * 3) * .08, fx: 'spark', A: [[.5, -.8 + _sn(u * 8) * .2], [.5, -.8 + _sn(u * 8 + 1) * .2]] }),
  hug: u => ({ ey: 'happy', mo: 'smile', ms: 1.1, rz: _sn(u * 2) * .12, tz: _sn(u * 2) * .1, by: _ab(_sn(u * 3)) * .03, fx: 'hearts', A: [[-1.0 - .15 * _sn(u * 4), -1.1], [-1.0 - .15 * _sn(u * 4), -1.1]] }),
  giggle: u => ({ ey: 'happy', mo: 'smile', ms: 1, rx: _sn(u * 14) * .06, rz: _sn(u * 14) * .05, by: _ab(_sn(u * 14)) * .04, k: .3, A: [[.1, 0], [-.85, -2.1]] }),
  shh: u => ({ ey: 'wide', mo: 'flat', ms: .6, rx: .05, k: .4, A: [[.1, 0], [-.85, -2.1]] }),
  think: u => ({ ey: 'open', mo: 'flat', ms: .7, rz: .18, ry: .35, rx: -.25, k: 0, A: [[.1, 0], [-.85, -2.0]] }),
  deadpan: u => ({ ey: 'open', mo: 'flat', ms: .9, k: .1 }),
  smirk: u => ({ ey: 'open', mo: 'smile', ms: .6, rz: .12, ry: .15, rx: -.05, k: .2, br: { a: .25 } }),
  sideeye: u => ({ ey: 'open', mo: 'flat', ms: .9, ry: .5, k: 0, rz: .05, br: { a: .3 } }),
  eyeroll: u => ({ ey: 'open', mo: 'flat', ms: .8, k: 0, rx: -.35, ry: _sn(u * 3) * .5, rz: _sn(u * 3) * .08 }),
  awkward: u => ({ ey: 'wide', mo: 'flat', ms: 1.3, tz: _sn(u * 30) * .015, rz: _sn(u * 2) * .05, k: .3, fx: 'sweat' }),
  confused: u => ({ ey: 'open', mo: 'frown', ms: .7, rz: .25, ry: _sn(u * 1.2) * .4, rx: .05, k: 0, br: { a: -.3 } }),
  shock: u => ({ ey: 'wide', mo: 'flat', ms: .8, k: 0, rx: -.05, tz: _sn(u * 40) * .008, by: -.02, br: { a: -.1, h: .08 } }),
  surprised: u => ({ ey: 'wide', mo: 'op', ms: 1, msy: .9, rx: -.12, k: 0, by: (u < .6 ? _ab(_sn(u * 5)) * .05 : 0) + (u < .3 ? .1 : 0), br: { a: -.1, h: .1 }, A: [[.6, 0], [.6, 0]] }),
  scream: u => ({ ey: 'wide', mo: 'op', ms: 1.5, msy: 1.1 + .2 * _sn(u * 20), rx: -.2, k: 0, tz: _sn(u * 34) * .03, by: _sn(u * 30) * .015, br: { a: -.3, h: .1 }, A: [[-.8, -2.1], [-.8, -2.1]] }),
  fear: u => ({ ey: 'wide', mo: 'frown', ms: 1, tz: _sn(u * 28) * .03, rz: _sn(u * 26) * .03, k: .2, fx: 'sweat', A: [[-.9, -1.4], [-.9, -1.4]] }),
  sweat: u => ({ ey: 'open', mo: 'flat', ms: .9, rz: _sn(u * 2) * .05, k: .3, ry: .25, fx: 'sweat', tz: _sn(u * 18) * .01 }),
  cry: u => ({ ey: 'closed', mo: 'op', ms: .7, msy: .45 + .2 * _ab(_sn(u * 9)), rx: .28, k: .2, tz: _sn(u * 26) * .035, fx: 'tears' }),
  sob: u => ({ ey: 'closed', mo: 'op', ms: .9, msy: .6 + .3 * _ab(_sn(u * 8)), rx: .35, k: 0, tz: _sn(u * 22) * .05, tx: .15 + _sn(u * 10) * .05, by: _sn(u * 20) * .03, fx: 'tears', A: [[-.7, -2.1], [-.7, -2.1]] }),
  sad: u => ({ ey: 'open', mo: 'frown', ms: 1, rx: .3, k: .2, tx: .1, br: { a: -.35 } }),
  angry: u => ({ ey: 'open', mo: 'frown', ms: .9, rx: .08, k: 0, tz: _sn(u * 30) * .02, br: { a: .5 }, A: [[.2, -.35], [.2, -.35]] }),
  rage: u => ({ ey: 'open', mo: 'op', ms: 1.2, msy: .5 + .1 * _sn(u * 25), rx: .05, k: 0, tz: _sn(u * 34) * .04, rz: _sn(u * 30) * .04, by: _ab(_sn(u * 16)) * .05, br: { a: .6 }, A: [[1.0 + _sn(u * 14) * .3, -.5], [1.0 + _sn(u * 14 + 1) * .3, -.5]] }),
  weary: u => ({ ey: 'closed', mo: 'op', ms: 1.1, msy: .8, rx: -.3, k: 0, tx: -.12, tz: _sn(u * 2) * .03, br: { a: -.4 } }),
  evil: u => ({ ey: 'open', mo: 'smile', ms: 1.4, rz: _sn(u * 2) * .05, k: .2, br: { a: .5 }, A: [[-.55, -1.5 + _sn(u * 5) * .12], [-.55, -1.5 - _sn(u * 5) * .12]] }),
  dead: u => ({ ey: 'x', mo: 'op', ms: .7, msy: .5, rx: u < .5 ? .1 : .55, k: 0, tx: u < .5 ? 0 : .35, tz: u < .5 ? 0 : .1 }),
  boo: u => ({ ey: 'wide', mo: 'op', ms: 1.4, msy: 1 + .1 * _sn(u * 20), rx: -.1, k: 0, tz: _sn(u * 8) * .1, by: _ab(_sn(u * 7)) * .08, A: [[1.9 + _sn(u * 10) * .3, -.2], [1.9 + _sn(u * 10 + 2) * .3, -.2]] }),
  robot: u => { const q = Math.round(_sn(u * 2.5)); return { ey: 'open', mo: 'flat', ms: 1.2, k: 0, ry: q * .5, A: [[.1, q * .7], [.1, -q * .7]] }; },
  thumbs: u => ({ ey: 'happy', mo: 'smile', ms: 1.1, rx: _sn(u * 6) * .1, k: .2, A: [[.1, 0], [-.35, -1.9 + _sn(u * 8) * .1]] }),
  no: u => ({ ey: 'open', mo: 'frown', ms: .9, ry: _sn(u * 9) * .5, k: 0, br: { a: .3 }, A: [[.1, 0], [-.35, -1.6]] }),
  yes: u => ({ ey: 'open', mo: 'smile', ms: 1, rx: _sn(u * 7) * .22, k: .1 }),
  peace: u => ({ ey: 'happy', mo: 'smile', ms: 1.1, rz: .1, k: .3, A: [[.1, 0], [2.0 + _sn(u * 5) * .1, -.2]] }),
  stop: u => ({ ey: 'open', mo: 'flat', ms: .9, k: .2, br: { a: .2 }, A: [[.1, 0], [-.15, -1.55 + _sn(u * 10) * .05]] }),
  salute: u => ({ ey: 'open', mo: 'smile', ms: .8, rx: -.05, k: 0, A: [[.1, 0], [-.3, -2.6]] }),
  bow: u => { const f = u < 1.3 ? Math.min(1, u * 2.5) : Math.max(0, 1 - (u - 1.3) * 1.5); return { ey: 'closed', mo: 'smile', ms: .8, k: 0, tx: .75 * f, rx: .3 * f, A: [[.1, .2], [.1, .2]] }; },
  wave: u => ({ ey: 'happy', mo: 'smile', ms: 1.1, k: .4, rz: _sn(u * 3) * .05, A: [[.1, 0], [2.2 + _sn(u * 9) * .45, 0]] }),
  clap: u => ({ ey: 'happy', mo: 'op', ms: 1, msy: .5, by: _ab(_sn(u * 8)) * .04, A: [[-.9 + _ab(_sn(u * 8)) * .45, -1.4], [-.9 + _ab(_sn(u * 8)) * .45, -1.4]] }),
  hooray: u => ({ ey: 'happy', mo: 'op', ms: 1.2, msy: .8, by: _ab(_sn(u * 7)) * .12, rx: -.15, k: .2, A: [[2.7 + _sn(u * 9) * .2, 0], [2.7 + _sn(u * 9 + 1) * .2, 0]] }),
  party: u => ({ ey: 'happy', mo: 'op', ms: 1.2, msy: .8, by: _ab(_sn(u * 8)) * .15, tz: _sn(u * 5) * .12, rx: -.15, k: .2, fx: 'spark', A: [[2.5 + _sn(u * 9) * .3, 0], [2.5 + _sn(u * 9 + 1.5) * .3, 0]] }),
  hype: u => ({ ey: 'happy', mo: 'op', ms: 1.1, msy: .7, by: _ab(_sn(u * 10)) * .14, tz: _sn(u * 8) * .1, k: .2, fx: 'spark', A: [[1.9 + _sn(u * 10) * .5, -.3], [1.9 - _sn(u * 10) * .5, -.3]] }),
  flex: u => ({ ey: 'happy', mo: 'smile', ms: 1.2, sc: .03 * _sn(u * 6), k: .2, rx: -.1, A: [[1.9, -.35 + _sn(u * 6) * .08], [1.9, -.35 + _sn(u * 6) * .08]] }),
  pray: u => ({ ey: 'closed', mo: 'smile', ms: .8, rx: .2, k: 0, A: [[-.9, -1.4], [-.9, -1.4]] }),
  dance: u => ({ ey: 'happy', mo: 'op', ms: 1, msy: .5, tz: _sn(u * 6) * .15, by: _ab(_sn(u * 6)) * .1, rz: _sn(u * 6) * .15, k: .2, A: [[1.6 + 1.4 * _sn(u * 6), 0], [1.6 - 1.4 * _sn(u * 6), 0]] }),
  sparkle: u => ({ ey: 'star', mo: 'op', ms: 1, msy: .6, rz: _sn(u * 2) * .1, by: _ab(_sn(u * 4)) * .04, fx: 'spark', A: [[.3, -.5], [.3, -.5]] }),
  calm: u => ({ ey: 'closed', mo: 'smile', ms: .9, rx: -.08, tz: _sn(u * 1.2) * .05, k: .1 }),
  sleep: u => ({ ey: 'closed', mo: 'op', ms: .5, msy: .3 + .25 * (_sn(u * 1.6) * .5 + .5), rx: .3 + _sn(u * 1.6) * .08, k: 0, tz: _sn(u * 1.2) * .05, tx: .12 }),
  sick: u => ({ ey: 'closed', mo: 'frown', ms: .9, rx: .25, k: 0, tz: _sn(u * 6) * .03, tx: .1, A: [[.05, 0], [-.85, -2.1]] }),
  hot: u => ({ ey: 'open', mo: 'tongue', ms: 1.3, rx: -.1, k: 0, by: _ab(_sn(u * 8)) * .02, fx: 'sweat', A: [[.2, -.8 + _sn(u * 14) * .35], [.2, -.8 + _sn(u * 14 + 2) * .35]] }),
  cold: u => ({ ey: 'closed', mo: 'frown', ms: 1, tz: _sn(u * 40) * .03, rz: _sn(u * 36) * .03, by: _sn(u * 44) * .012, k: .1, A: [[-1.2, -1.1], [-1.2, -1.1]] }),
  dizzy: u => ({ ey: 'x', mo: 'tongue', ms: 1, rx: _sn(u * 4) * .25, rz: _cs(u * 4) * .3, tz: _sn(u * 4) * .1, k: 0 }),
  mind: u => ({ ey: 'wide', mo: 'op', ms: 1.2, msy: 1, rx: -.25 + _sn(u * 20) * .03, k: 0, tz: _sn(u * 24) * .03, by: u < .4 ? .15 * _sn(u * 8) : _ab(_sn(u * 12)) * .02, fx: 'spark', A: [[-.12, -2.57], [-.12, -2.57]] }),
  cool: u => ({ ey: 'shades', mo: 'smile', ms: .7, rz: .1 + _sn(u * 2) * .04, ry: .15, rx: -.05, k: .2 })
};
_PRE.joy = u => ({ ..._PRE.laugh(u), fx: 'tears' });
_PRE.rofl = u => ({ ..._PRE.laugh(u), tz: _sn(u * 9) * .45, rz: _sn(u * 9) * .35, by: _ab(_sn(u * 12)) * .12, tx: -.1 + _sn(u * 10) * .1, fx: 'tears' });

export class Avatar {
  constructor(d) {
    const M = (c, o) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: .65 }, o || {})),
      Sp = (r, m, sx = 1, sy = 1, sz = 1) => { const x = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), m); x.scale.set(sx, sy, sz); return x; },
      add = (p, o, x = 0, y = 0, z = 0) => { o.position.set(x, y, z); p.add(o); return o; };
    const hum = d.k == 'h', skin = M(hum ? d.skin : d.fur), shirt = M(d.shirt), dark = M('#16161d', { roughness: .3 }), white = M('#ffffff', { roughness: .3 });
    const g = this.g = new THREE.Group(), tor = this.tor = new THREE.Group(), head = this.head = new THREE.Group();
    g.add(tor);
    // tana (belidan yuqori)
    add(tor, new THREE.Mesh(new THREE.CylinderGeometry(.74, .88, 1.3, 28), shirt), 0, .65, 0);
    add(tor, Sp(.8, shirt, 1.1, .38, .75), 0, 1.28, 0);
    add(tor, new THREE.Mesh(new THREE.CylinderGeometry(.17, .2, .35, 16), skin), 0, 1.5, 0);
    this.arm = [-1, 1].map(s => {
      const a = new THREE.Group();
      a.position.set(s * .98, 1.22, 0);
      tor.add(a);
      add(a, new THREE.Mesh(new THREE.CylinderGeometry(.15, .13, .85, 14), shirt), 0, -.42, 0);
      add(a, Sp(.16, skin), 0, -.9, 0);
      a.rotation.z = s * .1;
      a._z = s * .1;
      a._s = s;
      return a;
    });
    // bosh
    add(tor, head, 0, 2.0, 0);
    add(head, Sp(.62, skin));
    // ko'zlar
    this.ey = [-1, 1].map(s => {
      const e = new THREE.Group();
      add(head, e, s * .22, .1, .56);
      const o = new THREE.Group();
      add(o, Sp(.085, dark, 1, 1.15, .6));
      add(o, Sp(.03, white), .025, .035, .045);
      e.add(o);
      const h = new THREE.Mesh(new THREE.TorusGeometry(.075, .022, 8, 16, Math.PI), dark);
      const c = new THREE.Mesh(new THREE.BoxGeometry(.17, .03, .03), dark);
      const ht = new THREE.Mesh(_hg, M('#ff2d55', { emissive: '#a00020', roughness: .4 }));
      ht.scale.setScalar(.3);
      const stz = new THREE.Mesh(_sg, M('#ffd23f', { emissive: '#ff9d00', roughness: .4 }));
      stz.scale.setScalar(.2);
      stz.position.z = .03;
      const xx = new THREE.Group();
      [.785, -.785].forEach(a => {
        const b = new THREE.Mesh(new THREE.BoxGeometry(.19, .035, .03), dark);
        b.rotation.z = a;
        xx.add(b);
      });
      const br = new THREE.Mesh(new THREE.BoxGeometry(.22, .04, .03), dark);
      br.position.set(0, .19, -.05);
      e.add(h, c, ht, stz, xx, br);
      e.o = o; e.h = h; e.c = c; e.ht = ht; e.stz = stz; e.xx = xx; e.br = br;
      return e;
    });
    // quyosh ko'zoynagi
    this.sg = new THREE.Mesh(new THREE.BoxGeometry(.66, .17, .08), M('#0b0b10', { roughness: .15 }));
    add(head, this.sg, 0, .1, .64);
    this.sg.visible = false;
    // yuzdagi qizillik
    [-1, 1].forEach(s => add(head, Sp(.1, M('#ff8fa3', { transparent: true, opacity: .55 }), 1, .7, .3), s * .4, -.08, .45));
    // og'iz
    const m = this.mo = new THREE.Group();
    add(head, m, 0, hum ? -.24 : -.25, hum ? .57 : .69);
    const sm = new THREE.Mesh(new THREE.TorusGeometry(.15, .025, 8, 20, Math.PI), dark);
    sm.rotation.z = Math.PI;
    sm.position.y = .05;
    const op = new THREE.Group();
    add(op, Sp(.15, M('#4a0d1c', { roughness: .5 }), 1, .85, .5));
    add(op, Sp(.08, M('#e8607a'), 1, .5, .5), 0, -.07, .02);
    op.position.y = -.03;
    const fr = new THREE.Mesh(new THREE.TorusGeometry(.15, .025, 8, 20, Math.PI), dark);
    fr.position.y = -.1;
    const fl = new THREE.Mesh(new THREE.BoxGeometry(.26, .035, .03), dark);
    fl.position.y = -.02;
    const tg = Sp(.085, M('#e8607a'), 1, 1.25, .45);
    tg.position.set(0, -.13, .04);
    m.add(sm, op, fr, fl, tg);
    this.mm = { sm, op, fr, fl, tg };
    if (hum) {
      [-1, 1].forEach(s => add(head, Sp(.12, skin, .6, 1, 1), s * .61, 0, 0));
      add(head, Sp(.065, skin), 0, -.04, .6);
      const hm = M(d.hair, { roughness: .9 });
      const cap = (mat) => {
        const c = new THREE.Mesh(new THREE.SphereGeometry(.655, 24, 12, 0, Math.PI * 2, 0, Math.PI * .46), mat);
        c.rotation.x = -.3;
        head.add(c);
      };
      if (d.st == 'short') cap(hm);
      if (d.st == 'long') {
        cap(hm);
        add(head, Sp(.7, hm, 1, 1.1, .62), 0, -.2, -.28);
        [-1, 1].forEach(s => add(head, new THREE.Mesh(new THREE.CylinderGeometry(.13, .1, .9, 12), hm), s * .56, -.3, 0));
      }
      if (d.st == 'cap') {
        const cm = M(d.cap, { roughness: .8 });
        cap(cm);
        const v = add(head, new THREE.Mesh(new THREE.BoxGeometry(.7, .05, .4), cm), 0, .3, .68);
        v.rotation.x = .2;
      }
      if (d.st == 'beard') {
        add(head, new THREE.Mesh(new THREE.CylinderGeometry(.46, .6, .34, 28), M(d.hat)), 0, .52, 0);
        const b = add(head, new THREE.Mesh(new THREE.TorusGeometry(.53, .02, 6, 32), white), 0, .5, 0);
        b.rotation.x = Math.PI / 2;
        [-1, 1].forEach(s => add(head, Sp(.16, hm, .6, 1.4, .8), s * .58, -.02, -.05));
        add(head, Sp(.42, hm, 1, .7, .65), 0, -.5, .24);
        add(head, Sp(.1, hm, 2.2, .5, .6), 0, -.1, .58);
      }
    } else {
      add(head, Sp(.27, M(d.belly), 1, .72, .8), 0, -.16, .46);
      add(head, Sp(.065, dark, 1.2, .8, .8), 0, -.07, .71);
      const pink = M('#ffb3c0');
      if (d.ear == 'cone') {
        [-1, 1].forEach(s => {
          const e = add(head, new THREE.Mesh(new THREE.ConeGeometry(.22, .5, 4), skin), s * .38, .62, 0);
          e.rotation.z = -s * .35;
          const i = add(head, new THREE.Mesh(new THREE.ConeGeometry(.12, .3, 4), pink), s * .37, .6, .07);
          i.rotation.z = -s * .35;
        });
      }
      if (d.ear == 'ball') {
        [-1, 1].forEach(s => {
          add(head, Sp(.22, skin), s * .46, .5, -.02);
          add(head, Sp(.12, M(d.belly), 1, 1, .5), s * .46, .5, .12);
        });
      }
      if (d.ear == 'long') {
        [-1, 1].forEach(s => {
          const e = add(head, Sp(.17, skin, 1, 3.2, .55), s * .24, 1.0, -.05);
          e.rotation.z = -s * .12;
          const i = add(head, Sp(.09, pink, 1, 2.8, .4), s * .24, .98, .06);
          i.rotation.z = -s * .12;
        });
      }
    }
    // ko'z yoshlari
    this.tr = [0, 1, 2, 3].map(() => {
      const t = Sp(.05, M('#6ec6ff', { emissive: '#2a7ab0' }), .8, 1.3, .8);
      t.visible = false;
      head.add(t);
      return t;
    });
    // uchib chiqadigan yuraklar
    this.hf = [0, 1, 2, 3, 4].map(() => {
      const h = new THREE.Mesh(_hg, M('#ff4d7a', { emissive: '#b0002a' }));
      h.visible = false;
      g.add(h);
      return h;
    });
    this.spr = [0, 1, 2, 3, 4, 5].map(() => {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthTest: false, depthWrite: false }));
      sp.visible = false;
      sp.renderOrder = 10;
      g.add(sp);
      return sp;
    });
    this.spk = [0, 1, 2, 3, 4, 5].map(() => {
      const m = Sp(.06, M('#ffe066', { emissive: '#ffb300', roughness: .3 }));
      m.visible = false;
      g.add(m);
      return m;
    });
    this.t0 = 0;
    this.ch = null;
    this.st = 'idle';
    this.until = 0;
    this._t = 0;
    this.lk = LOOK.front;
    this.nl = 0;
    this.lkFix = null;
    this.lkT = 0;
    this.nb = 1 + Math.random() * 3;
    this.be = 0;
    this.ph = Math.random() * 6;
  }

  look(dir, dur = 2.5) {
    this.lkFix = dir;
    this.lkT = this._t + dur;
  }

  play(s, dur = 2.4, ch) {
    this.st = s;
    this.t0 = this._t;
    this.until = this._t + dur;
    this.ch = ch || null;
    if (ch) {
      const tx = emojiTex(ch);
      this.spr.forEach(sp => {
        sp.material.map = tx;
        sp.material.needsUpdate = true;
      });
    }
  }

  update(t, dt) {
    this._t = t;
    const ph = this.ph, head = this.head, tor = this.tor;
    if (this.st != 'idle' && t > this.until) {
      this.st = 'idle';
      this.ch = null;
    }
    if (this.lkFix && t > this.lkT) this.lkFix = null;
    if (!this.lkFix && t > this.nl) {
      this.lk = LOOK[['front', 'front', 'left', 'right', 'up', 'down'][Math.random() * 6 | 0]];
      this.nl = t + 1.6 + Math.random() * 2.4;
    }
    const u = Math.max(0, t - this.t0),
      P = this.st != 'idle' && _PRE[this.st] ? _PRE[this.st](u) : null,
      k = Math.min(1, dt * (P ? 18 : 8)),
      L = this.lkFix ? LOOK[this.lkFix] : this.lk,
      lk = P && P.k != null ? P.k : 1;

    let ry = L[0] * lk + (P && P.ry || 0),
      rx = L[1] * lk + (P && P.rx || 0),
      rz = P && P.rz || 0,
      tbz = P && P.tz != null ? P.tz : Math.sin(t * 1.1 + ph) * .02,
      tbx = P && P.tx || 0,
      by = P && P.by || 0,
      eyes = P && P.ey || 'open',
      mouth = P && P.mo || 'smile',
      ms = P && P.ms != null ? P.ms : .75,
      msy = P && P.msy != null ? P.msy : 1,
      wk = P && P.wk != null ? P.wk : -1;

    if (t > this.nb) {
      this.be = t + .12;
      this.nb = t + 2 + Math.random() * 3.5;
    }
    if (t < this.be && eyes == 'open') eyes = 'closed';

    if (this.talk && !P) {
      mouth = 'op';
      ms = .6;
      msy = .12 + .62 * Math.abs(Math.sin(t * 9.5) * Math.sin(t * 4.1 + 1));
      rx += Math.sin(t * 5.2) * .04;
      rz += Math.sin(t * 2.7) * .03;
      by = Math.abs(Math.sin(t * 9.5)) * .012;
    }

    head.rotation.y += (ry - head.rotation.y) * k;
    head.rotation.x += (rx - head.rotation.x) * k;
    head.rotation.z += (rz - head.rotation.z) * k;

    tor.rotation.z += (tbz - tor.rotation.z) * k;
    tor.rotation.x += (tbx - tor.rotation.x) * k;
    tor.position.y = by;
    tor.scale.y = 1 + Math.sin(t * 2 + ph) * .012 + (P && P.sc || 0);

    this.sg.visible = eyes == 'shades';
    this.ey.forEach((e, i) => {
      const m = wk == i ? 'closed' : eyes, sd = i ? 1 : -1;
      e.o.visible = m == 'open' || m == 'wide';
      e.o.scale.setScalar(m == 'wide' ? 1.45 : 1);
      e.h.visible = m == 'happy';
      e.c.visible = m == 'closed';
      e.ht.visible = m == 'heart';
      if (m == 'heart') e.ht.scale.setScalar(.3 + .06 * Math.sin(t * 9));
      e.stz.visible = m == 'star';
      if (m == 'star') {
        e.stz.rotation.z = t * 2;
        e.stz.scale.setScalar(.2 + .04 * Math.sin(t * 10));
      }
      e.xx.visible = m == 'x';
      const bw = P && P.br;
      e.br.visible = !!bw;
      if (bw) {
        e.br.rotation.z = sd * bw.a;
        e.br.position.y = .19 + (bw.h || 0);
      }
    });

    const mm = this.mm;
    mm.sm.visible = mouth == 'smile' || mouth == 'tongue';
    mm.op.visible = mouth == 'op';
    mm.fr.visible = mouth == 'frown';
    mm.fl.visible = mouth == 'flat';
    mm.tg.visible = mouth == 'tongue';
    if (mouth == 'tongue') mm.tg.position.y = -.13 - .025 * Math.sin(t * 10);
    this.mo.scale.set(ms, mouth == 'op' ? msy : 1, 1);

    const AP = P && P.A;
    this.arm.forEach((a, i) => {
      const p = AP && AP[i],
        tz = a._s * (p ? p[0] : .1),
        tx = p ? p[1] : Math.sin(t * 1.4 + i) * .04;
      a.rotation.z += (tz - a.rotation.z) * k;
      a.rotation.x += (tx - a.rotation.x) * k;
    });

    const fx = P && P.fx;
    this.tr.forEach((tr, i) => {
      const f = (t * 1.3 + i * .27) % 1, sd = i % 2 ? 1 : -1;
      if (fx == 'tears') {
        tr.visible = true;
        tr.position.set(sd * (.22 + .03 * f), .05 - f * .65, .52 + f * .05);
        tr.scale.setScalar(1 - f * .4);
      } else if (fx == 'sweat' && i < 2) {
        const g2 = (u * .8 + i * .5) % 1;
        tr.visible = true;
        tr.position.set(sd * .42, .42 - g2 * .6, .42);
        tr.scale.setScalar(1 - g2 * .35);
      } else {
        tr.visible = false;
      }
    });

    this.hf.forEach((h, i) => {
      if (fx == 'hearts') {
        const f = (t * .7 + i * .2) % 1;
        h.visible = true;
        h.position.set(Math.sin(i * 2.3 + t) * .7, 2.8 + f * 1.3, .4);
        h.scale.setScalar(Math.sin(f * Math.PI) * .4 + .02);
        h.rotation.y = Math.sin(t * 3 + i) * .5;
      } else {
        h.visible = false;
      }
    });

    this.spk.forEach((m, i) => {
      if (fx == 'spark') {
        const a = u * 3 + i * 1.05, r = .95 + .2 * Math.sin(u * 2 + i);
        m.visible = true;
        m.position.set(Math.cos(a) * r, 2.1 + Math.sin(u * 3 + i * 1.7) * .55, Math.sin(a) * r * .5 + .35);
        m.scale.setScalar(.6 + .5 * Math.abs(Math.sin(u * 6 + i)));
      } else {
        m.visible = false;
      }
    });

    const on = !!this.ch && this.st != 'idle', tail = Math.max(0, Math.min(1, (this.until - t) / .45));
    this.spr.forEach((sp, j) => {
      if (!on) {
        sp.visible = false;
        return;
      }
      if (j == 0) {
        const pop = (1 - Math.exp(-u * 14)) * (1 + .18 * Math.sin(u * 14) * Math.exp(-u * 2.5));
        sp.visible = true;
        sp.position.set(0, 3.4 + Math.sin(t * 4) * .05, .3);
        sp.scale.setScalar(pop * (.4 + .6 * tail));
        sp.material.opacity = tail;
      } else {
        const d0 = u - j * .12;
        if (d0 < 0) {
          sp.visible = false;
          return;
        }
        const f = (d0 * .55) % 1;
        sp.visible = true;
        sp.position.set((j - 3) * .36 + Math.sin(u * 3 + j * 2) * .12, 2.95 + f * 1.1, .35);
        sp.scale.setScalar((.1 + .3 * Math.sin(f * Math.PI)) * tail);
        sp.material.opacity = Math.sin(f * Math.PI) * tail;
      }
    });
  }
}
