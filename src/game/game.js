export const FREE = false; // false: qoida majburiy (mast bo'yicha yurish, kozir, aks holda istalgan karta)
export const S = ['♠', '♣', '♦', '♥'];
export const RK = ['9', 'J', 'Q', 'K', '10', 'A'];
export const PT = [0, 2, 3, 4, 10, 11];
export const MP = [40, 60, 80, 100];

export const SU = c => (c / 6) | 0;
export const RA = c => c % 6;
export const PC = c => PT[RA(c)];

export const beats = (a, b, t) => (SU(a) == SU(b) ? RA(a) > RA(b) : SU(a) == t);

export const win = (tr, t) => {
  let w = 0;
  for (let k = 1; k < tr.length; k++) {
    if (beats(tr[k].c, tr[w].c, t)) w = k;
  }
  return w;
};

export function legal(h, tr, t) {
  if (!tr.length) return h;
  const w = tr[win(tr, t)].c;
  const L = SU(tr[0].c);
  const sl = h.filter(c => SU(c) == L);
  if (sl.length) {
    const u = sl.filter(c => beats(c, w, t));
    return u.length ? u : sl;
  }
  const tk = h.filter(c => SU(c) == t);
  if (tk.length) {
    const u = tk.filter(c => beats(c, w, t));
    return u.length ? u : tk;
  }
  return h;
}

export const nm = (G, i) => G.players[i]?.name || '';
export const cn = c => RK[RA(c)] + S[SU(c)];
export const hasM = h => MP.map((_, s) => (h.includes(s * 6 + 2) && h.includes(s * 6 + 3) ? s : -1)).filter(s => s >= 0);

export function newRound(G) {
  const N = G.players.length;
  G.N = N;
  G.dealer = (G.dealer + 1) % N;
  G.act = [];
  for (let i = 0; i < N; i++) {
    if (!(N == 4 && i == G.dealer)) G.act.push(i);
  }
  const d = [...Array(24).keys()].sort(() => Math.random() - 0.5);
  G.hands = {};
  G.cap = {};
  G.mar = {};
  G.dcl = {};
  G.trump = -1;
  G.trick = [];
  G.out = [];
  G.cur = 0;
  G.who = -1;
  G.gv = [];
  G.dc = [];
  G.dm = '';
  G.dd = 0;

  for (let i = 0; i < N; i++) {
    G.hands[i] = [];
    G.cap[i] = [];
    G.mar[i] = 0;
  }
  G.act.forEach(i => (G.hands[i] = d.splice(0, 7)));

  if (G.act.length == 2) {
    G.t1 = d.splice(0, 2);
    G.t2 = d.splice(0, 2);
  } else {
    G.t1 = d.splice(0, 3);
    G.t2 = [];
  }

  G.ord = [];
  for (let k = 1; k <= N; k++) {
    const x = (G.dealer + k) % N;
    if (G.act.includes(x)) G.ord.push(x);
  }
  G.turn = G.ord[0];
  G.phase = 'bid';
  G.msg = 'Savdo boshlandi';
}

export function bidA(G, v) {
  const x = G.turn;
  if (v) {
    G.cur = v;
    G.who = x;
    G.msg = nm(G, x) + ': ' + v;
    if (v > 120) {
      const m = hasM(G.hands[x]);
      G.msg += ' (marj ' + m.map(s => S[s]).join('') + ' ko‘rsatdi)';
    }
  } else {
    G.out.push(x);
    G.msg = nm(G, x) + ': pas';
  }
  const live = G.ord.filter(y => !G.out.includes(y));
  if (live.length == 1) {
    if (G.who < 0) {
      G.who = live[0];
      G.cur = 40;
    }
    const w = G.who;
    G.turn = w;
    if (G.act.length == 2) {
      G.phase = 'pick';
      G.msg = nm(G, w) + ' savdoni yutdi: ' + G.cur;
    } else {
      if (G.players.length == 4) {
        const D = G.players[G.dealer];
        const rw = G.t1.reduce((a, c) => a + PC(c), 0) + Math.max(0, ...hasM(G.t1).map(s => MP[s]));
        const dp = Math.max(0, Math.floor(rw / 10) * 10);
        if (!D.barrel) D.score += dp;
        G.dd = dp;
        if (dp < 10) {
          D.z = (D.z || 0) + 1;
          if (D.z >= 3) {
            D.score -= (G.players.length == 2 ? 240 : 120);
            D.z = 0;
            D.barrel = false;
            D.bf = 0;
          }
        } else {
          D.z = 0;
        }
        G.dm = nm(G, G.dealer) + ' (dam): ' + rw + ' → +' + dp + (dp < 10 ? ' —' : '');
      }
      G.msg = nm(G, w) + ' (' + G.cur + ') talon ochildi: ' + G.t1.map(cn).join(' ') + (G.dm ? ' | ' + G.dm : '');
      G.phase = 'tal';
      G.turn = w;
    }
    return;
  }
  let i = G.ord.indexOf(x);
  do {
    i = (i + 1) % G.ord.length;
  } while (G.out.includes(G.ord[i]));
  G.turn = G.ord[i];
}

export function talA(G) {
  const w = G.who;
  G.hands[w].push(...G.t1);
  G.t1 = [];
  G.gv = G.act.filter(y => y != w).map(y => ({ f: w, to: y }));
  G.phase = 'give';
  G.turn = w;
  G.msg = nm(G, w) + ' talonni oldi — 2 ta kartani bering';
}

export function splitA(G) {
  const w = G.who;
  const b0 = G.players.map(p => p.score);
  const p = G.players[w];
  if (p.barrel) {
    p.bf++;
    if (p.bf >= 3) {
      p.score = 680;
      p.barrel = false;
      p.bf = 0;
    }
  } else {
    p.score -= 120;
  }
  G.act.filter(y => y != w).forEach(y => {
    const q = G.players[y];
    if (!q.barrel) q.score += 60;
  });
  G.players.forEach(q => {
    if (!q.barrel && q.score >= 800 && q.score < 1000) {
      q.score = 800;
      q.barrel = true;
      q.bf = 0;
    }
  });
  (G.hist = G.hist || []).push(G.players.map((q, i) => q.score - b0[i] + (i == G.dealer ? (G.dd || 0) : 0)));
  const W = G.players.find(q => q.score >= 1000);
  G.phase = W ? 'over' : 'end';
  G.msg = nm(G, w) + ' bo‘lib yubordi: −120, qolganlarga +60' + (W ? ' | ' + W.name + ' G‘ALABA!' : '');
}

export function pickA(G, k) {
  const w = G.who;
  const a = k ? G.t2 : G.t1;
  const b = k ? G.t1 : G.t2;
  G.hands[w].push(...a);
  G.t1 = [...b];
  G.t2 = [];
  G.gv = [{ f: w }, { f: w }];
  G.phase = 'give';
  G.turn = w;
  G.msg = nm(G, w) + ' talonni oldi — 2 ta ortiqcha kartani tashlang';
}

export function giveA(G, c) {
  const g = G.gv.shift();
  G.hands[g.f] = G.hands[g.f].filter(x => x != c);
  if (g.to != null) {
    G.hands[g.to].push(c);
    G.msg = nm(G, g.f) + ' → ' + nm(G, g.to);
  } else {
    G.t1.push(c);
    (G.dc = G.dc || []).push(c);
  }
  if (G.gv.length) {
    G.turn = G.gv[0].f;
  } else {
    G.phase = 'final';
    G.turn = G.who;
    G.msg = nm(G, G.who) + ' ochko tanlamoqda';
  }
}

export function giveB(G, x, y) {
  giveA(G, x);
  giveA(G, y);
}

export function playA(G, c) {
  const p = G.turn;
  const h = G.hands[p];
  G.hands[p] = h.filter(x => x != c);
  if ((RA(c) == 2 || RA(c) == 3) && !G.dcl[SU(c)] && h.includes(SU(c) * 6 + 5 - RA(c)) && G.cap[p].length) {
    const s = SU(c);
    G.dcl[s] = 1;
    G.mar[p] += G.players[p].barrel ? 0 : MP[s];
    G.trump = s;
    G.msg = nm(G, p) + ': MARJ ' + S[s] + ' +' + (G.players[p].barrel ? 0 : MP[s]) + ' — kozir ' + S[s];
  } else {
    G.msg = '';
  }
  G.trick.push({ p, c });
  if (G.trick.length == G.act.length) {
    G.phase = 'col';
    G.tw = G.trick[win(G.trick, G.trump)].p;
    G.msg += ' ' + nm(G, G.tw) + ' oldi';
  } else {
    const i = G.act.indexOf(p);
    G.turn = G.act[(i + 1) % G.act.length];
  }
}

export function colA(G) {
  G.cap[G.tw].push(...G.trick.map(t => t.c));
  G.trick = [];
  if (G.hands[G.act[0]].length) {
    G.phase = 'play';
    G.turn = G.tw;
    return;
  }
  let m = '';
  const dz = {};
  const bh = {};
  const b0 = G.players.map(p => p.score);
  for (const i of G.act) {
    const p = G.players[i];
    const tp = G.cap[i].reduce((a, c) => a + PC(c), 0) + G.mar[i] + (i == G.who ? (G.t1 || []).reduce((a, c) => a + PC(c), 0) : 0);
    if (i == G.who) {
      p.z = 0;
      const ok = tp >= G.cur;
      if (!ok && !p.barrel) {
        const sh = Math.round(G.cur / (G.players.length - 1) / 5) * 5;
        G.players.forEach((q, j) => {
          if (j != i && !q.barrel) q.score += sh;
        });
        m += '(har biriga +' + sh + ') ';
      }
      if (p.barrel) {
        if (ok) p.score = 1000;
        else {
          p.bf++;
          if (p.bf >= 3) {
            p.score = 680;
            p.barrel = false;
            p.bf = 0;
          }
        }
      } else {
        p.score += ok ? G.cur : -G.cur;
      }
      m += `${p.name}: ${tp}/${G.cur} ${ok ? '✓' : '✗'}  `;
    } else {
      if (tp < 10) {
        dz[i] = 1;
        p.z = (p.z || 0) + 1;
        m += p.name + ': ' + tp + ' (<10) —' + p.z + '  ';
        if (p.z >= 3) {
          p.score -= (G.players.length == 2 ? 240 : 120);
          p.z = 0;
          p.barrel = false;
          p.bf = 0;
          m += '(−' + (G.players.length == 2 ? 240 : 120) + ') ';
        }
      } else {
        p.z = 0;
      }
      if (p.barrel) bh[i] = tp < 10 ? 0 : Math.floor(tp / 10) * 10;
      else p.score += tp < 10 ? 0 : Math.floor(tp / 10) * 10;
    }
    if (!p.barrel && p.score >= 800 && p.score < 1000) {
      p.score = 800;
      p.barrel = true;
      p.bf = 0;
    }
  }
  G.players.forEach(p => {
    if (!p.barrel && p.score >= 800 && p.score < 1000) {
      p.score = 800;
      p.barrel = true;
      p.bf = 0;
    }
  });
  (G.hist = G.hist || []).push(
    G.players.map((p, i) => {
      const d = p.score - b0[i] + (i == G.dealer ? (G.dd || 0) : 0);
      return dz[i] && !d ? '—' : bh[i] != null && !d ? '(' + bh[i] + ')' : d;
    })
  );
  G.msg = m;
  const W = G.players.find(p => p.score >= 1000);
  G.phase = W ? 'over' : 'end';
  if (W) G.msg = W.name + ' 1000 ochkoga yetdi — G‘ALABA! ' + m;
}

export function finalA(G, c) {
  G.cur = c;
  G.phase = 'play';
  G.turn = G.who;
  G.msg = 'O‘yin boshlandi';
}

export function applyAct(G, i, n, a) {
  a = a || [];
  if (n == 'start') {
    if (i != 0 || G.phase != 'lobby' || G.players.length < 2) return false;
    G.dealer = -1;
    newRound(G);
    return true;
  }
  if (G.turn !== i) return false;
  if (n == 'bidA' && G.phase == 'bid') {
    const v = Math.floor(+a[0]) || 0;
    if (v) {
      const mn = G.cur ? G.cur + 20 : 40;
      if (v < mn || v > 300 || v % 10) return false;
      if (v > 120 && !hasM(G.hands[i]).length) return false;
    }
    bidA(G, v);
    return true;
  }
  if (n == 'pickA' && G.phase == 'pick') {
    const k = a[0] ? 1 : 0;
    pickA(G, k);
    return true;
  }
  if (n == 'giveB' && G.phase == 'give') {
    const x = a[0], y = a[1];
    if (x == null || y == null || x == y) return false;
    const h = G.hands[i];
    if (!h.includes(x) || !h.includes(y)) return false;
    giveB(G, x, y);
    return true;
  }
  if (n == 'finalA' && G.phase == 'final') {
    const v = Math.floor(+a[0]) || G.cur;
    if (v < G.cur || v > 300 || v % 10) return false;
    finalA(G, v);
    return true;
  }
  if (n == 'splitA' && G.phase == 'final') {
    splitA(G);
    return true;
  }
  if (n == 'playA' && G.phase == 'play') {
    const c = a[0];
    if (!G.hands[i].includes(c)) return false;
    if (!FREE) {
      const L = legal(G.hands[i], G.trick, G.trump);
      if (!L.includes(c)) return false;
    }
    playA(G, c);
    return true;
  }
  return false;
}
