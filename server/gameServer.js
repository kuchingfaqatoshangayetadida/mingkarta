import { WebSocketServer } from 'ws';
import * as g from '../src/game/game.js';
import { EM } from '../src/game/emojis.js';

const CHARS = ['yigit', 'qiz', 'chol', 'bola', 'mushuk', 'ayiq', 'quyon', 'tulki'];
const EMO = ['laugh', 'cry', 'wink', 'heart'];

export function setupWebSocketServer(target) {
  const options = typeof target === 'number' ? { port: target } : { server: target };
  const wss = new WebSocketServer(options);

  wss.on('error', (err) => {
    console.warn('WSS server error (ignored):', err.message);
  });

  const rooms = {};

  const clean = (s, n) => String(s == null ? '' : s).replace(/[<>&"'`]/g, '').trim().slice(0, n);
  const code4 = () => {
    let c;
    do {
      c = Math.random().toString(36).slice(2, 6).toUpperCase();
    } while (rooms[c] || c.length < 4);
    return c;
  };

  const player = (name, pr) => {
    pr = pr || {};
    const fn = clean(pr.fn || name, 12) || 'O‘yinchi';
    return { name: fn, fn, ln: clean(pr.ln, 16), av: CHARS.includes(pr.av) ? pr.av : 'yigit', score: 0, barrel: false, bf: 0 };
  };

  const err = (ws, m) => {
    try {
      if (ws.readyState === 1) ws.send(JSON.stringify({ t: 'err', m }));
    } catch (e) {}
  };

  function bc(R) {
    R.socks.forEach((s, i) => {
      try {
        if (s && s.readyState === 1) s.send(JSON.stringify({ t: 'state', G: R.G, me: i }));
      } catch (e) {}
    });
  }

  function after(R) {
    clearTimeout(R.timer);
    const G = R.G;
    if (G.phase === 'col') {
      R.timer = setTimeout(() => {
        if (G.phase !== 'col') return;
        g.colA(G);
        G.v++;
        bc(R);
        after(R);
      }, 1400);
    } else if (G.phase === 'tal') {
      R.timer = setTimeout(() => {
        if (G.phase !== 'tal') return;
        g.talA(G);
        G.v++;
        bc(R);
      }, 3500);
    } else if (G.phase === 'end') {
      R.timer = setTimeout(() => {
        if (G.phase !== 'end') return;
        g.newRound(G);
        G.v++;
        bc(R);
      }, 5000);
    }
  }

  wss.on('connection', (ws) => {
    ws.on('error', (e) => {
      console.warn('WS socket error:', e.message);
    });

    ws.on('message', (raw) => {
      let m;
      try {
        m = JSON.parse(raw);
      } catch (e) {
        return;
      }

      // HOST: komanda ochish
      if (m.t === 'create') {
        const code = code4();
        const max = Math.min(4, Math.max(1, Math.floor(+m.max) || 4));
        const team = clean(m.team, 20) || 'Komanda';
        const R = rooms[code] = {
          G: { code, v: 1, phase: 'lobby', dealer: -1, msg: '', team, max, players: [player(m.name, m.prof)] },
          pids: [String(m.pid)],
          socks: [ws],
          timer: null
        };
        ws.room = R;
        ws.idx = 0;
        bc(R);
        return;
      }

      // JOIN: ochiq komandalar ro'yxati
      if (m.t === 'list') {
        const list = Object.values(rooms)
          .filter(R => R.G.phase === 'lobby' && R.socks[0] && R.socks[0].readyState === 1 && R.G.players.length < R.G.max)
          .map(R => ({ code: R.G.code, team: R.G.team, host: R.G.players[0].name, n: R.G.players.length, max: R.G.max }));
        try {
          if (ws.readyState === 1) ws.send(JSON.stringify({ t: 'rooms', rooms: list }));
        } catch (e) {}
        return;
      }

      // JOIN: kod orqali yoki ro'yxatdan komandaga qo'shilish
      if (m.t === 'join') {
        const R = rooms[String(m.code || '').toUpperCase()];
        if (!R) return err(ws, 'Komanda topilmadi');
        let i = R.pids.indexOf(String(m.pid));
        if (i < 0) {
          if (R.G.phase !== 'lobby') return err(ws, 'O‘yin allaqachon boshlangan');
          if (R.G.players.length >= (R.G.max || 4)) return err(ws, 'Komanda to‘lgan');
          i = R.pids.push(String(m.pid)) - 1;
          R.G.players.push(player(m.name, m.prof));
          R.G.v++;
        }
        R.socks[i] = ws;
        ws.room = R;
        ws.idx = i;
        bc(R);
        R.socks.forEach((s2, k) => {
          try {
            if (k !== i && s2 && s2.readyState === 1) s2.send(JSON.stringify({ t: 'peer', i }));
          } catch (e) {}
        });
        return;
      }

      // Smaylik / reaksiya
      if (m.t === 'emo' && ws.room && ((Number.isInteger(m.e) && m.e >= 0 && m.e < EM.length) || EMO.includes(m.e))) {
        const now = Date.now();
        if (now - (ws.lastEmo || 0) < 350) return;
        ws.lastEmo = now;
        const R = ws.room;
        R.socks.forEach(s => {
          try {
            if (s && s.readyState === 1) s.send(JSON.stringify({ t: 'emo', i: ws.idx, e: m.e }));
          } catch (e) {}
        });
        return;
      }

      // Matnli chat
      if (m.t === 'chat' && ws.room) {
        const msg = clean(m.m, 200);
        if (!msg) return;
        const now = Date.now();
        if (now - (ws.lastChat || 0) < 250) return;
        ws.lastChat = now;
        const R = ws.room;
        R.socks.forEach(s => {
          try {
            if (s && s.readyState === 1) s.send(JSON.stringify({ t: 'chat', i: ws.idx, m: msg }));
          } catch (e) {}
        });
        return;
      }

      // WebRTC signalizatsiya
      if (m.t === 'sig' && ws.room) {
        const R = ws.room, to = Math.floor(+m.to), s = R.socks[to];
        if (!s || to === ws.idx || s.readyState !== 1 || !['offer', 'answer', 'ice', 'bye'].includes(m.k)) return;
        if (JSON.stringify(m.d || '').length > 12000) return;
        try {
          s.send(JSON.stringify({ t: 'sig', from: ws.idx, k: m.k, f: m.f === 'rx' ? 'rx' : 'tx', d: m.d }));
        } catch (e) {}
        return;
      }

      // O'yin yurishi (action)
      if (m.t === 'a' && ws.room) {
        const R = ws.room;
        if (!g.applyAct(R.G, ws.idx, m.n, m.a)) return;
        R.G.v++;
        bc(R);
        after(R);
      }
    });

    ws.on('close', () => {
      const R = ws.room;
      if (!R) return;
      if (R.socks[ws.idx] === ws) R.socks[ws.idx] = null;
      if (R.G.phase === 'lobby' && ws.idx > 0 && !R.socks[ws.idx]) {
        R.pids.splice(ws.idx, 1);
        R.socks.splice(ws.idx, 1);
        R.G.players.splice(ws.idx, 1);
        R.socks.forEach((s, i) => {
          if (s) s.idx = i;
        });
        R.G.v++;
        bc(R);
      }
      if (R.socks.every(s => !s)) {
        setTimeout(() => {
          if (R.socks.every(s => !s)) {
            clearTimeout(R.timer);
            delete rooms[R.G.code];
          }
        }, 30 * 60 * 1000);
      }
    });
  });

  return wss;
}
