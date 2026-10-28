import * as THREE from 'three';
import { S, RK } from './game.js';

export const FC = ['#15151a', '#15151a', '#c4222d', '#c4222d'];

export const STY = [
  { n: 'Klassik', bg: '#fbf8ee', col: s => FC[s], bd: null, f: 'sans-serif', acc: '#e8b84a', back: 'spade' },
  { n: 'Oq', bg: '#ffffff', col: s => s > 1 ? '#d32f2f' : '#212121', bd: '#bdbdbd', bw: 2, f: 'Arial,sans-serif', acc: '#ffffff', back: 'lattice' },
  { n: 'Oltin', bg: '#14213d', col: s => s > 1 ? '#ff7b7b' : '#f3d98b', bd: '#e8b84a', bw: 3, f: 'Georgia,serif', acc: '#e8b84a', back: 'stars' },
  { n: 'Tun', bg: '#1c1c24', col: s => s > 1 ? '#ff5d73' : '#f2f2f2', bd: '#555566', bw: 2, f: 'sans-serif', acc: '#9aa0ff', back: 'circles' },
  { n: 'Qadimiy', bg: '#e9dab0', col: s => s > 1 ? '#8b1e1e' : '#3b2a14', bd: '#8a6a35', bw: 3, f: 'Georgia,serif', acc: '#5a3b12', back: 'diamonds' },
  { n: 'Zumrad', bg: '#e5f3e6', col: s => s > 1 ? '#b71c3c' : '#1b5e20', bd: '#2e7d32', bw: 3, f: 'sans-serif', acc: '#c8e6c9', back: 'stripes' },
  { n: '4 rang', bg: '#fbf8ee', col: s => ['#15151a', '#1b7f3a', '#1565c0', '#c4222d'][s], bd: '#cfc8b0', bw: 2, f: 'sans-serif', acc: '#ffe082', back: 'dots' },
  { n: 'Katta', bg: '#fff6c9', col: s => s > 1 ? '#d50000' : '#000000', bd: '#000000', bw: 3, f: 'Arial,sans-serif', acc: '#ffd54f', back: 'hearts', big: 1 }
];

export function drawFace(g, s, r, st) {
  const W = 128, H = 180, k = st.big ? 1 : 0;
  g.clearRect(0, 0, W, H);
  g.fillStyle = st.bg;
  g.fillRect(0, 0, W, H);
  if (st.bd) {
    g.strokeStyle = st.bd;
    g.lineWidth = st.bw || 2;
    g.strokeRect(4, 4, W - 8, H - 8);
  }
  g.fillStyle = st.col(s);
  g.textAlign = 'center';
  g.font = 'bold ' + (k ? 44 : 34) + 'px ' + st.f;
  g.fillText(RK[r], k ? 28 : 26, k ? 46 : 40);
  g.font = (k ? 34 : 30) + 'px serif';
  g.fillText(S[s], k ? 28 : 26, k ? 82 : 72);
  g.font = (k ? 84 : 70) + 'px serif';
  g.fillText(S[s], k ? 70 : 64, k ? 128 : 118);
  g.font = 'bold ' + (k ? 34 : 30) + 'px ' + st.f;
  g.fillText(RK[r], 64, k ? 168 : 160);
}

export function drawBack(g, c, st) {
  const W = 128, H = 180;
  g.clearRect(0, 0, W, H);
  g.fillStyle = c;
  g.fillRect(0, 0, W, H);
  const a = st.acc;
  g.strokeStyle = a;
  g.fillStyle = a;
  g.lineWidth = 4;
  g.strokeRect(8, 8, 112, 164);
  g.save();
  g.beginPath();
  g.rect(12, 12, 104, 156);
  g.clip();
  g.lineWidth = 2;
  g.textAlign = 'center';
  const b = st.back;
  if (b === 'spade') {
    g.font = '54px serif';
    g.fillText('♠', 64, 100);
  } else if (b === 'lattice') {
    g.globalAlpha = .55;
    for (let i = -180; i < 260; i += 16) {
      g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 180, 180); g.stroke();
      g.beginPath(); g.moveTo(i + 180, 0); g.lineTo(i, 180); g.stroke();
    }
  } else if (b === 'stars') {
    g.font = '64px serif';
    g.fillText('✦', 64, 108);
    g.font = '22px serif';
    [[28, 38], [100, 38], [28, 158], [100, 158]].forEach(q => g.fillText('✦', q[0], q[1]));
  } else if (b === 'circles') {
    g.globalAlpha = .7;
    [44, 32, 20, 8].forEach(R => {
      g.beginPath(); g.arc(64, 90, R, 0, 7); g.stroke();
    });
  } else if (b === 'diamonds') {
    g.font = '26px serif';
    g.globalAlpha = .75;
    for (let y = 34; y < 170; y += 34) {
      for (let x = 26; x < 120; x += 34) g.fillText('◆', x, y);
    }
  } else if (b === 'stripes') {
    g.globalAlpha = .6;
    g.lineWidth = 6;
    for (let x = 20; x < 120; x += 16) {
      g.beginPath(); g.moveTo(x, 12); g.lineTo(x, 168); g.stroke();
    }
  } else if (b === 'dots') {
    g.globalAlpha = .8;
    for (let y = 26; y < 170; y += 22) {
      for (let x = 26; x < 120; x += 22) {
        g.beginPath(); g.arc(x, y, 5, 0, 7); g.fill();
      }
    }
  } else if (b === 'hearts') {
    g.font = '34px serif';
    g.globalAlpha = .85;
    for (let y = 44; y < 170; y += 40) {
      for (let x = 34; x < 120; x += 44) g.fillText('♥', x + (((y / 40 | 0) % 2) ? -12 : 0), y);
    }
  }
  g.restore();
}

export function createTexture(drawFn) {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 180;
  const g = c.getContext('2d');
  drawFn(g);
  return new THREE.CanvasTexture(c);
}
