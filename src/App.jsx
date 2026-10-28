import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameCanvas } from './components/GameCanvas.jsx';
import { HUD } from './components/HUD.jsx';
import { ActionPopups } from './components/ActionPopups.jsx';
import { Menu } from './components/Menu.jsx';
import { ScoreNotebookModal } from './components/ScoreNotebookModal.jsx';
import { SettingsModal } from './components/SettingsModal.jsx';
import { ChatAndEmoji } from './components/ChatAndEmoji.jsx';

import {
  newRound,
  bidA,
  pickA,
  giveA,
  giveB,
  playA,
  colA,
  finalA,
  splitA,
  talA,
  hasM,
  legal,
  win,
  PC,
  RA,
  SU,
  MP,
  FREE
} from './game/game.js';
import { CHARS } from './game/avatars.js';
import { EM } from './game/emojis.js';
import { initAudio, playCardSound, getAudioSettings } from './game/audio.js';

const RD = { bidA, pickA, giveA, giveB, playA, finalA, splitA, talA, colA, newRound };
const low = h => h.slice().sort((a, b) => PC(a) - PC(b) || RA(a) - RA(b));

export function App() {
  const [G, setG] = useState(null);
  const [meIdx, setMeIdx] = useState(-1);
  const [local, setLocal] = useState(0);

  // Profile
  const [prof, setProf] = useState(() => {
    try {
      const q = JSON.parse(localStorage.getItem('prof') || 'null');
      if (q && q.ch) return q;
    } catch (e) {}
    return { fn: '', ln: '', ch: 'yigit' };
  });

  // UI state
  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const [scr, setScr] = useState('sMain');
  const [errorMsg, setErrorMsg] = useState('');
  const [isNotebookOpen, setIsNotebookOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const toastTimerRef = useRef(null);

  // Cards & Visual settings
  const [cardStyle, setCardStyle] = useState(() => {
    try {
      const q = +localStorage.getItem('cs');
      if (q >= 0 && q < 8) return q;
    } catch (e) {}
    return 0;
  });

  const [backColor, setBackColor] = useState(() => {
    try {
      const k = localStorage.getItem('bk');
      if (k) return k;
    } catch (e) {}
    return '#7a1f2b';
  });

  const [audioSettings, setAudioSettings] = useState(getAudioSettings());
  const [selCards, setSelCards] = useState([]);

  // Chat, Emoji and Avatar triggers
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatBubbles, setChatBubbles] = useState({});
  const [speakers, setSpeakers] = useState({});
  const [emojiTrigger, setEmojiTrigger] = useState(null);

  // WebRTC mic
  const [micState, setMicState] = useState({ active: false, enabled: false });
  const micStreamRef = useRef(null);

  // Rooms
  const [roomList, setRoomList] = useState([]);

  // Sockets & Timers
  const wsRef = useRef(null);
  const pidRef = useRef('');
  const timerRef = useRef(null);
  const botTimerRef = useRef(null);
  const pingIntervalRef = useRef(null);

  const GRef = useRef(G);
  GRef.current = G;

  const localRef = useRef(local);
  localRef.current = local;

  const meIdxRef = useRef(meIdx);
  meIdxRef.current = meIdx;

  // Initialize PID
  useEffect(() => {
    try {
      let p = localStorage.getItem('pid');
      if (!p) {
        p = Math.random().toString(36).slice(2) + Date.now().toString(36);
        localStorage.setItem('pid', p);
      }
      pidRef.current = p;
    } catch (e) {
      pidRef.current = Math.random().toString(36).slice(2);
    }
  }, []);

  const toast = msg => {
    setToastMsg(msg);
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastMsg(''), 2800);
  };

  const me = useCallback(() => {
    const curG = GRef.current;
    if (!curG) return -1;
    return localRef.current ? curG.players.findIndex(p => p.id === 'me') : meIdxRef.current;
  }, []);

  // Dispatch game action (local or multiplayer)
  const act = useCallback((fn) => {
    setG(prevG => {
      if (!prevG) return prevG;
      const ns = JSON.parse(JSON.stringify(prevG));
      fn(ns);
      ns.v = (ns.v || 0) + 1;
      return ns;
    });
  }, []);

  const send = useCallback((obj) => {
    if (wsRef.current && wsRef.current.readyState === 1) {
      try {
        wsRef.current.send(JSON.stringify(obj));
      } catch (e) {}
    }
  }, []);

  const dx = useCallback((n, ...a) => {
    if (localRef.current) {
      act(g => (n === 'start' ? 0 : RD[n](g, ...a)));
    } else {
      send({ t: 'a', n, a });
    }
  }, [act, send]);

  // Clean selected cards when phase changes away from 'give'
  useEffect(() => {
    if (G && G.phase !== 'give') {
      setSelCards([]);
    }
  }, [G?.phase]);

  // Connect WebSocket
  const conn = useCallback((cb) => {
    if (wsRef.current && wsRef.current.readyState === 1) {
      if (cb) cb();
      return;
    }
    const proto = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
    const wsUrl = proto + window.location.host + '/ws';
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      // Start ping heartbeat to keep Render and mobile connections alive
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = setInterval(() => {
        if (ws.readyState === 1) {
          try { ws.send(JSON.stringify({ t: 'ping' })); } catch (e) {}
        }
      }, 20000);

      if (cb) cb();
    };

    ws.onmessage = e => {
      let m;
      try {
        m = JSON.parse(e.data);
      } catch (err) {
        return;
      }

      if (m.t === 'pong') {
        return;
      }
      if (m.t === 'err') {
        setErrorMsg(m.m);
        return;
      }
      if (m.t === 'chat') {
        onChatReceived(m.i, m.m);
        return;
      }
      if (m.t === 'rooms') {
        setRoomList(m.rooms || []);
        return;
      }
      if (m.t === 'emo') {
        onEmojiReceived(m.i, m.e);
        return;
      }
      if (m.t === 'state') {
        setG(m.G);
        setMeIdx(m.me);
        if (m.G.phase === 'lobby') {
          setIsMenuOpen(true);
          setScr('sLobby');
        } else {
          setIsMenuOpen(false);
        }
      }
    };

    ws.onerror = () => {
      setErrorMsg('Serverga ulanib bo‘lmadi');
    };

    ws.onclose = () => {
      clearInterval(pingIntervalRef.current);
      if (!localRef.current && GRef.current && GRef.current.code) {
        toast('Aloqa yangilanmoqda…');
        setTimeout(() => {
          conn(() => {
            send({
              t: 'join',
              code: GRef.current.code,
              name: prof.fn,
              prof: { fn: prof.fn, ln: prof.ln, av: prof.ch },
              pid: pidRef.current
            });
          });
        }, 1200);
      }
    };
  }, [prof, send]);

  // Bot logic & step for offline mode
  const botStep = useCallback(() => {
    clearTimeout(botTimerRef.current);
    if (!localRef.current || !GRef.current) return;
    const curG = GRef.current;
    const t = curG.turn;
    const p = curG.players[t];
    if (!p || !p.bot || !['bid', 'pick', 'give', 'final', 'play'].includes(curG.phase)) return;
    const v = curG.v;

    botTimerRef.current = setTimeout(() => {
      if (!GRef.current || GRef.current.v !== v) return;
      const gNow = GRef.current;
      const h = gNow.hands[t] || [];
      const ph = gNow.phase;

      if (ph === 'bid') {
        const mArr = hasM(h);
        const e = Math.floor((h.reduce((a, c) => a + PC(c), 0) + 15 + Math.max(0, ...mArr.map(s => MP[s])) * 0.6) / 20) * 20;
        const mn = gNow.cur ? gNow.cur + 20 : 40;
        act(g => bidA(g, e >= mn && (mn <= 120 || mArr.length) ? mn : 0));
      } else if (ph === 'pick') {
        act(g => pickA(g, Math.random() < 0.5 ? 0 : 1));
      } else if (ph === 'give') {
        const c = low(h)[0];
        act(g => giveA(g, c));
      } else if (ph === 'final') {
        act(g => {
          g.phase = 'play';
          g.turn = g.who;
          g.msg = 'O‘yin boshlandi';
        });
      } else {
        const L = legal(h, gNow.trick, gNow.trump);
        let c;
        if (!gNow.trick.length) {
          c = h.find(x => (RA(x) === 2 || RA(x) === 3) && !gNow.dcl[SU(x)] && h.includes(SU(x) * 6 + 5 - RA(x)) && gNow.cap[t].length);
          if (!c) {
            const a = h.filter(x => RA(x) === 5 && SU(x) !== gNow.trump);
            c = a.length ? a[0] : low(h)[0];
          }
        } else {
          const w = low(L).filter(x => win([...gNow.trick, { p: t, c: x }], gNow.trump) === gNow.trick.length);
          c = w.length ? w[0] : low(L)[0];
        }
        act(g => playA(g, c));
      }
    }, curG.phase === 'play' ? 900 : 1100);
  }, [act]);

  // Round schedule timers
  useEffect(() => {
    clearTimeout(timerRef.current);
    if (!G) return;

    if (local) {
      if (G.phase === 'tal') {
        const v = G.v;
        timerRef.current = setTimeout(() => {
          if (GRef.current && GRef.current.v === v && GRef.current.phase === 'tal') act(talA);
        }, 3500);
      }
      if (G.phase === 'end') {
        const v = G.v;
        timerRef.current = setTimeout(() => {
          if (GRef.current && GRef.current.v === v && GRef.current.phase === 'end') act(newRound);
        }, 5000);
      }
      if (G.phase === 'col') {
        const v = G.v;
        timerRef.current = setTimeout(() => {
          if (GRef.current && GRef.current.v === v && GRef.current.phase === 'col') act(colA);
        }, 1400);
      }
      botStep();
    }
  }, [G, local, act, botStep]);

  // Card click handler (PC mouse or Mobile touch)
  const handleCardClick = c => {
    if (!G) return;
    const m = me();
    if (G.turn !== m) {
      toast('Hozir sizning navbatingiz emas');
      return;
    }

    if (G.phase === 'play') {
      playCardSound();
      dx('playA', c);
    } else if (G.phase === 'give') {
      playCardSound();
      setSelCards(prev => {
        const idx = prev.indexOf(c);
        if (idx >= 0) {
          return prev.filter(x => x !== c);
        } else if (prev.length < 2) {
          return [...prev, c];
        } else {
          return [prev[0], c];
        }
      });
    }
  };

  // Start Bots Game
  const handleStartBots = n => {
    initAudio();
    setLocal(1);
    setIsMenuOpen(false);
    const bn = ['Anvar', 'Dilya', 'Sardor', 'Malika', 'Jasur', 'Nodira'];
    const ids = CHARS.map(c => c.id).filter(x => x !== prof.ch).sort(() => Math.random() - 0.5);

    const newG = {
      code: 'BOT',
      v: 1,
      phase: 'lobby',
      dealer: -1,
      msg: '',
      players: Array.from({ length: n }, (_, i) => ({
        id: i ? 'bot' + i : 'me',
        name: i ? bn[i - 1] : prof.fn || 'Siz',
        av: i ? ids[i - 1] : prof.ch,
        bot: i > 0,
        score: 0,
        barrel: false,
        bf: 0
      }))
    };
    newRound(newG);
    setG(newG);
    setSelCards([]);
  };

  // Multiplayer Actions
  const handleCreateRoom = (team, max) => {
    initAudio();
    setLocal(0);
    conn(() => {
      send({
        t: 'create',
        name: prof.fn,
        prof: { fn: prof.fn, ln: prof.ln, av: prof.ch },
        team,
        max,
        pid: pidRef.current
      });
    });
  };

  const handleJoinRoom = code => {
    if (!code) return;
    initAudio();
    setLocal(0);
    conn(() => {
      send({
        t: 'join',
        code,
        name: prof.fn,
        prof: { fn: prof.fn, ln: prof.ln, av: prof.ch },
        pid: pidRef.current
      });
    });
  };

  const handleStartMultiGame = () => {
    if (!G) return;
    if (G.players.length < 2) {
      const n = Math.max(2, G.max || 4);
      if (wsRef.current) {
        try { wsRef.current.close(); } catch (e) {}
        wsRef.current = null;
      }
      handleStartBots(n);
      return;
    }
    dx('start');
  };

  const handleRefreshRooms = () => {
    conn(() => send({ t: 'list' }));
  };

  // Chat & Emoji handlers
  const handleSendMessage = msg => {
    if (!G) return;
    if (local) {
      onChatReceived(me(), msg);
    } else {
      send({ t: 'chat', m: msg });
    }
  };

  const onChatReceived = (playerIdx, msg) => {
    const curG = GRef.current;
    const p = curG && curG.players[playerIdx];
    const name = p ? p.name : 'O‘yinchi';
    setMessages(prev => [...prev, { name, text: msg }]);
    setChatBubbles(prev => ({
      ...prev,
      [playerIdx]: { m: msg, u: performance.now() + 5000 }
    }));
    if (playerIdx !== me()) {
      setUnreadCount(prev => prev + 1);
    }
  };

  const handleSendEmoji = emoIdx => {
    if (!G) return;
    const m = me();
    if (local) {
      onEmojiReceived(m, emoIdx);
    } else {
      send({ t: 'emo', e: emoIdx });
      onEmojiReceived(m, emoIdx);
    }
  };

  const onEmojiReceived = (playerIdx, emoIdx) => {
    // 3D avatarda animatsiyani ishga tushirish!
    setEmojiTrigger({ playerIdx, emoIdx, time: Date.now() });
  };

  // Botlar vaqti-vaqti bilan smaylik yuborib turadi
  useEffect(() => {
    const intv = setInterval(() => {
      if (localRef.current && GRef.current && GRef.current.players && GRef.current.players.length > 1 && Math.random() < 0.45) {
        const randBot = 1 + Math.floor(Math.random() * (GRef.current.players.length - 1));
        const randEmo = Math.floor(Math.random() * EM.length);
        onEmojiReceived(randBot, randEmo);
      }
    }, 6500);
    return () => clearInterval(intv);
  }, []);

  // Mic toggle
  const handleToggleMic = async () => {
    if (local || !G || !wsRef.current) {
      toast('Ovozli suhbat faqat multiplayerda ishlaydi');
      return;
    }
    if (!micStreamRef.current) {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast('Mikrofon uchun yangi brauzer kerak');
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
        });
        micStreamRef.current = stream;
        setMicState({ active: true, enabled: true });
        toast('Mikrofon yoqildi');
      } catch (e) {
        toast('Mikrofonga ruxsat berilmadi');
      }
      return;
    }
    const nextEnabled = !micState.enabled;
    micStreamRef.current.getAudioTracks().forEach(t => (t.enabled = nextEnabled));
    setMicState(prev => ({ ...prev, enabled: nextEnabled }));
    toast(nextEnabled ? 'Mikrofon yoqildi' : 'Mikrofon o‘chirildi');
  };

  return (
    <div onClick={() => initAudio()} style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {/* 3D Three.js canvas: 4 burchakli stol, avatarlar va qo'ldagi kartalar */}
      <GameCanvas
        G={G}
        meIdx={meIdx}
        local={local}
        cardStyle={cardStyle}
        backColor={backColor}
        selCards={selCards}
        onCardClick={handleCardClick}
        speakers={speakers}
        chatBubbles={chatBubbles}
        isMenuOpen={isMenuOpen}
        emojiTrigger={emojiTrigger}
      />

      {/* Top HUD (Scores, trump, messages) */}
      <HUD G={G} meIdx={meIdx} local={local} />

      {/* Action Popups (Bidding, Talons, Give cards, Final score) */}
      <ActionPopups
        G={G}
        meIdx={meIdx}
        local={local}
        selCards={selCards}
        setSelCards={setSelCards}
        onAction={dx}
      />

      {/* Top Bar Buttons: Notebook (Daftar) and Settings (Sozlamalar) */}
      {!isMenuOpen && (
        <>
          <button
            className="ib"
            id="bk"
            style={{ left: '6px' }}
            onClick={() => {
              setIsNotebookOpen(prev => !prev);
              setIsSettingsOpen(false);
            }}
          >
            📒
          </button>
          <button
            className="ib"
            style={{ right: '6px' }}
            onClick={() => {
              setIsSettingsOpen(prev => !prev);
              setIsNotebookOpen(false);
            }}
          >
            ⚙️
          </button>
        </>
      )}

      {/* Notebook Modal */}
      <ScoreNotebookModal
        G={G}
        isOpen={isNotebookOpen}
        onClose={() => setIsNotebookOpen(false)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        cardStyle={cardStyle}
        setCardStyle={val => {
          setCardStyle(val);
          try { localStorage.setItem('cs', String(val)); } catch (e) {}
        }}
        backColor={backColor}
        setBackColor={val => {
          setBackColor(val);
          try { localStorage.setItem('bk', val); } catch (e) {}
        }}
        audioSettings={audioSettings}
        setAudioSettings={setAudioSettings}
      />

      {/* Bottom Bar: Mic, Chat, Emoji */}
      <ChatAndEmoji
        inGame={!isMenuOpen && G != null && G.phase !== 'lobby'}
        messages={messages}
        unreadCount={unreadCount}
        onSendMessage={handleSendMessage}
        onSendEmoji={handleSendEmoji}
        micState={micState}
        onToggleMic={handleToggleMic}
      />

      {/* Menu overlays */}
      <Menu
        isOpen={isMenuOpen}
        scr={scr}
        setScr={setScr}
        prof={prof}
        setProf={setProf}
        G={G}
        meIdx={meIdx}
        roomList={roomList}
        onRefreshRooms={handleRefreshRooms}
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        onStartGame={handleStartMultiGame}
        onStartBots={handleStartBots}
        errorMsg={errorMsg}
        setErrorMsg={setErrorMsg}
      />

      {/* Toast notifications */}
      {toastMsg && (
        <div id="nt">
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}
export default App;
