import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { CHARS, Avatar } from '../game/avatars.js';

export function Menu({
  isOpen,
  scr,
  setScr,
  prof,
  setProf,
  G,
  meIdx,
  roomList,
  onRefreshRooms,
  onCreateRoom,
  onJoinRoom,
  onStartGame,
  onStartBots,
  errorMsg,
  setErrorMsg
}) {
  const [teamName, setTeamName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [hostMax, setHostMax] = useState(4);

  // Profile form
  const [pci, setPci] = useState(0);
  const [fn, setFn] = useState('');
  const [ln, setLn] = useState('');
  const pAvRef = useRef(null);
  const pRenRef = useRef(null);
  const pScRef = useRef(null);
  const pCamRef = useRef(null);
  const pcCanvasRef = useRef(null);

  useEffect(() => {
    if (prof) {
      setFn(prof.fn || '');
      setLn(prof.ln || '');
      const idx = CHARS.findIndex(c => c.id === prof.ch);
      setPci(idx >= 0 ? idx : 0);
    }
  }, [prof]);

  // Three.js Profile preview
  useEffect(() => {
    if (scr !== 'sProfile' || !isOpen || !pcCanvasRef.current) return;

    if (!pRenRef.current) {
      const ren = new THREE.WebGLRenderer({ canvas: pcCanvasRef.current, alpha: true, antialias: true });
      ren.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      ren.setSize(220, 220, false);
      const sc = new THREE.Scene();
      sc.add(new THREE.AmbientLight(0xffffff, 0.8));
      const dl = new THREE.DirectionalLight(0xfff0d0, 0.9);
      dl.position.set(2, 4, 5);
      sc.add(dl);
      const cam = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
      cam.position.set(0, 1.7, 7.2);
      cam.lookAt(0, 1.35, 0);

      pRenRef.current = ren;
      pScRef.current = sc;
      pCamRef.current = cam;
    }

    const sc = pScRef.current;
    if (pAvRef.current) {
      sc.remove(pAvRef.current.g);
    }
    const av = new Avatar(CHARS[pci]);
    sc.add(av.g);
    pAvRef.current = av;

    let animId;
    let lastT = performance.now() / 1000;
    const loop = () => {
      animId = requestAnimationFrame(loop);
      const t = performance.now() / 1000;
      const dt = Math.min(0.05, t - lastT);
      lastT = t;
      if (pAvRef.current) {
        pAvRef.current.update(t, dt);
      }
      pRenRef.current.render(pScRef.current, pCamRef.current);
    };
    loop();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [scr, isOpen, pci]);

  if (!isOpen) return null;

  const currentCh = CHARS[pci] || CHARS[0];

  const handleSaveProfile = () => {
    const f = fn.trim();
    const l = ln.trim();
    if (!f) {
      setErrorMsg('Ismingizni yozing');
      return;
    }
    if (!l) {
      setErrorMsg('Familiyangizni yozing');
      return;
    }
    const newProf = { fn: f.slice(0, 12), ln: l.slice(0, 16), ch: currentCh.id };
    setProf(newProf);
    try {
      localStorage.setItem('prof', JSON.stringify(newProf));
    } catch (e) {}
    setErrorMsg('');
    setScr('sMain');
  };

  const chOf = id => CHARS.find(c => c.id === id) || CHARS[0];

  return (
    <div id="menu">
      {/* Top Left Profile Chip */}
      <button className="chip" id="chip" onClick={() => { setErrorMsg(''); setScr('sProfile'); }}>
        <span style={{ fontSize: '22px' }}>{chOf(prof?.ch).ic}</span>{' '}
        {prof?.fn ? `${prof.fn} ${prof.ln || ''}` : 'Profil'}
      </button>

      {/* Main Screen */}
      {scr === 'sMain' && (
        <div className="scr" id="sMain">
          <h1>♠ MING ♥</h1>
          <div>1000 liq karta · online · 1–4 kishi</div>
          <button
            className="big"
            onClick={() => {
              if (!prof?.fn) {
                setScr('sProfile');
                setErrorMsg('Avval ism va familiyangizni kiriting');
                return;
              }
              setErrorMsg('');
              setScr('sMulti');
            }}
          >
            🌐 Multiplayer
          </button>
          <div style={{ marginTop: '10px' }}>
            Botlar bilan:{' '}
            <button className="s" onClick={() => onStartBots(2)}>2</button>{' '}
            <button className="s" onClick={() => onStartBots(3)}>3</button>{' '}
            <button className="s" onClick={() => onStartBots(4)}>4</button>
          </div>
        </div>
      )}

      {/* Multiplayer Choice */}
      {scr === 'sMulti' && (
        <div className="scr" id="sMulti">
          <h2>Multiplayer</h2>
          <button className="big" onClick={() => { setErrorMsg(''); setScr('sHost'); }}>🏠 Host</button>
          <button className="big" onClick={() => { setErrorMsg(''); onRefreshRooms(); setScr('sJoin'); }}>🚪 Join</button>
          <button className="s" onClick={() => { setErrorMsg(''); setScr('sMain'); }}>← Orqaga</button>
        </div>
      )}

      {/* Host Screen */}
      {scr === 'sHost' && (
        <div className="scr" id="sHost">
          <h2>Host</h2>
          <div>Komanda nomi</div>
          <input
            id="tm"
            placeholder="Komanda nomi"
            maxLength={20}
            value={teamName}
            onChange={e => setTeamName(e.target.value)}
          />
          <div style={{ marginTop: '8px' }}>Nechta odam o‘ynaydi?</div>
          <div className="row" id="mx">
            {[1, 2, 3, 4].map(k => (
              <button
                key={k}
                className={k === hostMax ? '' : 's'}
                onClick={() => setHostMax(k)}
              >
                {k}
              </button>
            ))}
          </div>
          <button
            className="big"
            style={{ marginTop: '12px' }}
            onClick={() => {
              const tn = teamName.trim();
              if (!tn) {
                setErrorMsg('Komanda nomini yozing');
                return;
              }
              onCreateRoom(tn, hostMax);
            }}
          >
            Komanda ochish
          </button>
          <button className="s" onClick={() => { setErrorMsg(''); setScr('sMulti'); }}>← Orqaga</button>
        </div>
      )}

      {/* Join Screen */}
      {scr === 'sJoin' && (
        <div className="scr" id="sJoin">
          <h2>Join</h2>
          <div>Ochiq komandalar</div>
          <div id="rl">
            {roomList && roomList.length > 0 ? (
              roomList.map(r => (
                <div key={r.code} className="rm">
                  <div>
                    <b>{r.team}</b>
                    <br />
                    <small>{r.host} · {r.n}/{r.max}</small>
                  </div>
                  <button onClick={() => onJoinRoom(r.code)}>Komandaga qo‘shilish</button>
                </div>
              ))
            ) : (
              <div style={{ opacity: 0.7 }}>Hozircha ochiq komanda yo‘q…</div>
            )}
          </div>
          <div style={{ marginTop: '8px' }}>yoki kod bilan kiring</div>
          <div className="row">
            <input
              id="cd"
              placeholder="Kod"
              maxLength={4}
              style={{ textTransform: 'uppercase', width: '110px' }}
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
            />
            <button className="s" onClick={() => onJoinRoom(joinCode)}>Kirish</button>
          </div>
          <button className="s" onClick={() => { setErrorMsg(''); setScr('sMulti'); }}>← Orqaga</button>
        </div>
      )}

      {/* Profile Screen */}
      {scr === 'sProfile' && (
        <div className="scr" id="sProfile">
          <h2>Profil</h2>
          <canvas id="pc" ref={pcCanvasRef} width="220" height="220" />
          <div className="row">
            <button className="s" onClick={() => setPci(prev => (prev - 1 + CHARS.length) % CHARS.length)}>◀</button>
            <b id="pcn" style={{ minWidth: '90px' }}>{currentCh.n}</b>
            <button className="s" onClick={() => setPci(prev => (prev + 1) % CHARS.length)}>▶</button>
          </div>
          <div className="row">
            <button className="s" onClick={() => pAvRef.current?.look('left', 2.5)}>⬅️</button>
            <button className="s" onClick={() => pAvRef.current?.look('up', 2.5)}>⬆️</button>
            <button className="s" onClick={() => pAvRef.current?.look('down', 2.5)}>⬇️</button>
            <button className="s" onClick={() => pAvRef.current?.look('right', 2.5)}>➡️</button>
          </div>
          <div className="row">
            <button className="s" onClick={() => pAvRef.current?.play('laugh', 2.6)}>😄</button>
            <button className="s" onClick={() => pAvRef.current?.play('cry', 2.6)}>😢</button>
            <button className="s" onClick={() => pAvRef.current?.play('wink', 2.2)}>😉</button>
            <button className="s" onClick={() => pAvRef.current?.play('heart', 3)}>❤️</button>
          </div>
          <input
            id="fn"
            placeholder="Ism"
            maxLength={12}
            value={fn}
            onChange={e => setFn(e.target.value)}
          />
          <input
            id="ln"
            placeholder="Familiya"
            maxLength={16}
            value={ln}
            onChange={e => setLn(e.target.value)}
          />
          <button className="big" onClick={handleSaveProfile}>Saqlash</button>
          <button className="s" onClick={() => { setErrorMsg(''); setScr('sMain'); }}>← Orqaga</button>
        </div>
      )}

      {/* Lobby Screen */}
      {scr === 'sLobby' && G && (
        <div className="scr" id="sLobby">
          <h2>{G.team || 'Komanda'}</h2>
          <div>
            Kod: <b className="code">{G.code}</b>
          </div>
          <div style={{ fontSize: '12px', opacity: 0.7 }}>
            Kod bilan ham, ro‘yxatdan ham kirish mumkin
          </div>
          <div id="lcount">
            {G.players.length} / {G.max || 4} kishi
          </div>
          <div id="lp">
            {G.players.map((p, i) => (
              <div key={i} className="pr">
                {chOf(p.av).ic} <b>{p.fn || p.name} {p.ln || ''}</b>
                {i === 0 ? ' 👑' : ''}
                {i === meIdx ? ' (siz)' : ''}
              </div>
            ))}
            {Array.from({ length: Math.max(0, (G.max || 4) - G.players.length) }).map((_, i) => (
              <div key={i} className="pr em">⏳ Kutilmoqda…</div>
            ))}
          </div>
          <div id="lb" style={{ marginTop: '10px' }}>
            {meIdx === 0 ? (
              <button className="big" onClick={onStartGame}>▶ Boshlash</button>
            ) : (
              <div>Boshlovchi kutilmoqda…</div>
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      <div id="er" style={{ color: '#f88', minHeight: '18px' }}>
        {errorMsg}
      </div>
    </div>
  );
}
