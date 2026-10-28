import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { CHARS, Avatar } from '../game/avatars.js';
import { STY, drawFace, drawBack, createTexture } from '../game/cardStyles.js';
import { SU, RA, PC, legal, FREE } from '../game/game.js';
import { playCardSound } from '../game/audio.js';

export function GameCanvas({
  G,
  meIdx,
  local,
  cardStyle,
  backColor,
  selCards,
  onCardClick,
  speakers,
  chatBubbles,
  isMenuOpen
}) {
  const mountRef = useRef(null);
  const labelsContainerRef = useRef(null);

  // References to keep Three.js state across renders
  const stateRef = useRef({
    ren: null,
    sc: null,
    cam: null,
    cards: [],
    dust: null,
    pl: null,
    bm: null,
    sm: null,
    avatars: {},
    animId: null,
    hov: null,
    lg: new Set(),
    hl: new Set(),
    lastT: 0,
    lastT2: 0,
    KX: 1,
    clk: new THREE.Clock()
  });

  const propsRef = useRef({ G, meIdx, local, cardStyle, backColor, selCards, onCardClick, speakers, chatBubbles, isMenuOpen });
  propsRef.current = { G, meIdx, local, cardStyle, backColor, selCards, onCardClick, speakers, chatBubbles, isMenuOpen };

  // Init Three.js scene once
  useEffect(() => {
    const ren = new THREE.WebGLRenderer({ antialias: true });
    ren.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    ren.setSize(window.innerWidth, window.innerHeight);
    ren.domElement.className = 'game-canvas';
    mountRef.current.appendChild(ren.domElement);

    const sc = new THREE.Scene();
    sc.background = new THREE.Color(0x0b1a13);
    sc.fog = new THREE.Fog(0x0b1a13, 16, 34);

    const cam = new THREE.PerspectiveCamera(50, 1, 0.1, 60);
    const rs = () => {
      ren.setSize(window.innerWidth, window.innerHeight);
      cam.aspect = window.innerWidth / window.innerHeight;
      cam.updateProjectionMatrix();
      const k = Math.max(1 / cam.aspect - 1, 0);
      cam.base = [0, 9 + k * 5, 10.5 + k * 6];
    };
    window.addEventListener('resize', rs);
    rs();

    sc.add(new THREE.AmbientLight(0xffffff, 0.65));
    const pl = new THREE.PointLight(0xffe2a0, 0.9, 40);
    pl.position.set(0, 9, 2);
    sc.add(pl);

    const tb = new THREE.Mesh(
      new THREE.CylinderGeometry(7.5, 7.5, 0.3, 64),
      new THREE.MeshStandardMaterial({ color: 0x14573a, roughness: 0.9 })
    );
    tb.position.y = -0.15;
    sc.add(tb);

    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(7.5, 0.3, 12, 64),
      new THREE.MeshStandardMaterial({ color: 0x4a2a12 })
    );
    rim.rotation.x = Math.PI / 2;
    sc.add(rim);

    const dust = new THREE.Points(
      new THREE.BufferGeometry().setAttribute(
        'position',
        new THREE.BufferAttribute(
          new Float32Array(Array.from({ length: 240 }, (_, i) => (i % 3 === 1 ? Math.random() * 8 + 1 : (Math.random() - 0.5) * 20))),
          3
        )
      ),
      new THREE.PointsMaterial({ color: 0xe8b84a, size: 0.06 })
    );
    sc.add(dust);

    const bm = new THREE.MeshStandardMaterial({
      map: createTexture(g => drawBack(g, propsRef.current.backColor, STY[propsRef.current.cardStyle]))
    });
    const sm = new THREE.MeshStandardMaterial({ color: 0xeeeeee });

    const cards = [];
    for (let s = 0; s < 4; s++) {
      for (let r = 0; r < 6; r++) {
        const faceMat = new THREE.MeshStandardMaterial({
          map: createTexture(g => drawFace(g, s, r, STY[propsRef.current.cardStyle]))
        });
        const m = new THREE.Mesh(new THREE.BoxGeometry(1, 0.03, 1.4), [sm, sm, faceMat, bm, sm, sm]);
        m.rotation.order = 'YXZ';
        m.position.set(0, 3, 0);
        m.visible = false;
        sc.add(m);
        const cardObj = {
          s,
          r,
          m,
          t: { p: new THREE.Vector3(), q: new THREE.Quaternion(), s: 1 }
        };
        m.userData.c = cardObj;
        cards.push(cardObj);
      }
    }

    stateRef.current = {
      ...stateRef.current,
      ren,
      sc,
      cam,
      cards,
      dust,
      pl,
      bm,
      sm
    };

    // Main animation loop
    const E = new THREE.Euler(0, 0, 0, 'YXZ');
    const pv3 = new THREE.Vector3();

    const loop = () => {
      stateRef.current.animId = requestAnimationFrame(loop);
      const t = stateRef.current.clk.getElapsedTime();

      // Card animation lerp
      cards.forEach(c => {
        c.m.position.lerp(c.t.p, 0.13);
        c.m.quaternion.slerp(c.t.q, 0.13);
        const k = c.m.scale.x + (c.t.s - c.m.scale.x) * 0.13;
        c.m.scale.setScalar(k);
      });

      // Dust & camera
      dust.rotation.y = t * 0.03;
      cam.position.set(
        cam.base[0] + Math.sin(t * 0.3) * 0.5,
        cam.base[1] + Math.sin(t * 0.5) * 0.15,
        cam.base[2]
      );
      cam.lookAt(0, 0, 2.4);
      pl.intensity = 0.9 + Math.sin(t * 2) * 0.08;

      // Update avatars
      const curProps = propsRef.current;
      const tSec = performance.now() / 1000;
      const dt = Math.min(0.05, tSec - stateRef.current.lastT2);
      stateRef.current.lastT2 = tSec;

      const { G: game, meIdx: mIdx, local: isLocal, isMenuOpen: menuOpen } = curProps;
      const me = () => (game ? (isLocal ? game.players.findIndex(p => p.id === 'me') : mIdx) : -1);
      const m = me();
      const inGame = game && game.players && game.phase !== 'lobby' && !menuOpen && m >= 0;

      const avs = stateRef.current.avatars;
      Object.keys(avs).forEach(k => {
        if (!inGame || !game.players[k] || avs[k].id !== game.players[k].av) {
          sc.remove(avs[k].a.g);
          delete avs[k];
        }
      });

      if (inGame) {
        const N = game.players.length;
        game.players.forEach((p, i) => {
          let o = avs[i];
          if (!o) {
            const ch = CHARS.find(c => c.id === p.av) || CHARS[0];
            const a = new Avatar(ch);
            sc.add(a.g);
            o = avs[i] = { a, id: p.av };
          }
          const th = -(((i - m + N) % N) * 2 * Math.PI) / N;
          const mine = i === m;
          const x = mine ? -5.2 * stateRef.current.KX : Math.sin(th) * 7.1 * stateRef.current.KX;
          const z = mine ? 7.3 : Math.cos(th) * 7.1;
          o.a.g.position.set(x, 0, z);
          o.a.g.rotation.y = Math.atan2(-x, -z);
          o.a.g.scale.setScalar(mine ? 0.9 : 1.15);
          o.a.talk = !!curProps.speakers[i];
          o.a.update(tSec, dt);
        });
      }

      // Render Three.js
      ren.render(sc, cam);

      // 3D Player Labels update
      const lbCont = labelsContainerRef.current;
      if (lbCont) {
        if (!inGame) {
          lbCont.style.display = 'none';
        } else {
          lbCont.style.display = 'block';
          const N = game.players.length;
          const ST = { bid: 'savdolashmoqda', pick: 'talon tanlamoqda', give: 'karta bermoqda', final: 'ochko tanlamoqda', play: 'yurmoqda' };

          game.players.forEach((p, i) => {
            let el = lbCont.children[i];
            if (!el) {
              el = document.createElement('div');
              lbCont.appendChild(el);
            }
            const o = avs[i];
            if (!o) {
              el.style.display = 'none';
              return;
            }
            const q = o.a.g.position;
            pv3.set(q.x, q.y + 2.95 * o.a.g.scale.y, q.z).project(cam);
            const turn = game.turn === i && ST[game.phase];
            el.style.display = 'block';
            el.style.left = ((pv3.x + 1) / 2) * window.innerWidth + 'px';
            el.style.top = ((1 - pv3.y) / 2) * window.innerHeight + 'px';
            el.className = 'lbl' + (turn ? ' on' : '');

            const tStr =
              p.name +
              (N === 4 && game.dealer === i ? ' (dam)' : '') +
              (game.who === i && game.cur && game.phase !== 'bid' ? ` ⭐${game.cur}` : '') +
              (turn ? ` <span class="y">${ST[game.phase]}<b class="dt"></b></span>` : (game.phase === 'bid' && game.out && game.out.includes(i) ? ' <span class="y">pas</span>' : ''));

            const cb = curProps.chatBubbles[i];
            const hasBubble = cb && performance.now() < cb.u;
            const spk = curProps.speakers[i];

            const hh =
              tStr +
              (spk ? ' 🎤' : '') +
              (hasBubble ? `<br><span class="bub">${cb.m.length > 40 ? cb.m.slice(0, 40) + '…' : cb.m}</span>` : '');

            if (el.innerHTML !== hh) el.innerHTML = hh;
          });
        }
      }
    };

    loop();

    // Raycasting & Pointer events
    const rc = new THREE.Raycaster();
    const mv = new THREE.Vector2();

    const getRayCard = (e) => {
      const cur = propsRef.current;
      const g = cur.G;
      if (!g || !g.hands) return null;
      const mIdx = cur.local ? g.players.findIndex(p => p.id === 'me') : cur.meIdx;
      if (mIdx < 0) return null;

      mv.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
      rc.setFromCamera(mv, cam);
      const handCards = (g.hands[mIdx] || []).map(c => cards[c].m);
      const hits = rc.intersectObjects(handCards);
      return hits.length ? cards.indexOf(hits[0].object.userData.c) : null;
    };

    const handlePointerMove = (e) => {
      if (e.target.tagName !== 'CANVAS') return;
      const c = getRayCard(e);
      if (c !== stateRef.current.hov) {
        stateRef.current.hov = c;
        updateCardPositions();
      }
    };

    const handlePointerDown = (e) => {
      if (e.target.tagName !== 'CANVAS') return;
      const c = getRayCard(e);
      const cur = propsRef.current;
      const g = cur.G;
      if (c == null || !g) return;
      const mIdx = cur.local ? g.players.findIndex(p => p.id === 'me') : cur.meIdx;
      if (g.turn !== mIdx || !stateRef.current.lg.has(c)) return;

      stateRef.current.hov = null;
      cur.onCardClick(c);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerdown', handlePointerDown);

    return () => {
      window.removeEventListener('resize', rs);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      cancelAnimationFrame(stateRef.current.animId);
      if (ren.domElement && ren.domElement.parentNode) {
        ren.domElement.parentNode.removeChild(ren.domElement);
      }
      ren.dispose();
    };
  }, []);

  // Update card textures when cardStyle or backColor changes
  useEffect(() => {
    const { cards, bm } = stateRef.current;
    if (!cards || !cards.length || !bm) return;

    cards.forEach(o => {
      const faceMat = o.m.material[2];
      if (faceMat && faceMat.map && faceMat.map.image) {
        drawFace(faceMat.map.image.getContext('2d'), o.s, o.r, STY[cardStyle]);
        faceMat.map.needsUpdate = true;
      }
    });

    if (bm.map && bm.map.image) {
      drawBack(bm.map.image.getContext('2d'), backColor, STY[cardStyle]);
      bm.map.needsUpdate = true;
    }
  }, [cardStyle, backColor]);

  // Update 3D card layout according to Game State G
  const updateCardPositions = () => {
    const { cards, cam } = stateRef.current;
    if (!cards || !cards.length || !cam) return;
    const { G, meIdx, local, selCards } = propsRef.current;
    if (!G) return;

    const N = G.players.length;
    const m = local ? G.players.findIndex(p => p.id === 'me') : meIdx;

    const lg = new Set();
    const hl = new Set();
    stateRef.current.lg = lg;
    stateRef.current.hl = hl;

    if (G.hands && G.phase !== 'lobby') {
      let wait = 0;
      const VW = 2 * Math.hypot(cam.base[1] - 0.8, cam.base[2] - 5.4) * 0.466 * cam.aspect * 0.86;
      const placed = new Set();
      stateRef.current.KX = Math.min(1, (VW * 0.4) / 5.6);
      const KX = stateRef.current.KX;

      const E = new THREE.Euler(0, 0, 0, 'YXZ');
      const put = (cObj, x, y, z, rx, ry, s = 1) => {
        cObj.t.p.set(x, y, z);
        E.set(rx, ry, 0);
        cObj.t.q.setFromEuler(E);
        cObj.t.s = s;
        cObj.m.visible = true;
      };

      const pl = (c, d, ...a) => {
        const o = cards[c];
        const now = performance.now();
        if (!o.m.visible) {
          o.m.position.set(0, 3, 0);
          o.m.scale.setScalar(0.4);
          o.m.visible = true;
          o.until = now + d * 90 + 60;
        }
        placed.add(c);
        if (o.until > now) {
          wait = 1;
          return;
        }
        put(o, ...a);
      };

      const T = i => -(((i - m + N) % N) * 2 * Math.PI) / N;

      if (G.turn === m) {
        if (G.phase === 'play') {
          const L = FREE ? G.hands[m] : legal(G.hands[m], G.trick, G.trump);
          L.forEach(c => lg.add(c));
          if (L.length < (G.hands[m] || []).length) {
            L.forEach(c => hl.add(c));
          }
        }
        if (G.phase === 'give') {
          (G.hands[m] || []).forEach(c => lg.add(c));
          selCards.forEach(c => hl.add(c));
        }
      }

      // Hands
      for (let i = 0; i < N; i++) {
        const th = T(i);
        const dx = Math.sin(th), dz = Math.cos(th), px = Math.cos(th), pz = -Math.sin(th);
        const h = (G.hands[i] || []).slice().sort((a, b) => (i === m ? SU(b) - SU(a) || RA(b) - RA(a) : 0));
        const n = h.length;
        const me_ = i === m;
        const sp = me_ ? Math.min(1.05, (VW - 1.5) / Math.max(n - 1, 1)) : 0.32;

        h.forEach((c, k) => {
          const o = (k - (n - 1) / 2) * sp;
          const e = me_ && hl.has(c)
            ? c === stateRef.current.hov
              ? 0.7
              : G.phase === 'play'
              ? 0
              : G.phase === 'give'
              ? 0.8
              : 0.3
            : 0;
          const R = me_ ? 5.4 : 5.6;
          pl(
            c,
            k * N + ((i - m + N) % N),
            dx * R * KX + px * o,
            0.8 + k * 0.012 + e,
            dz * R + pz * o - e * 0.5,
            me_ ? 0.7 : Math.PI - 0.7,
            th,
            me_ ? 1.5 : 0.8
          );
        });

        // Tricks won (Cap)
        (G.cap[i] || []).forEach((c, k) => {
          pl(c, 0, dx * 8.6 * KX + (k % 4) * 0.05, 0.2 + k * 0.03, dz * 8.6, Math.PI, th, 0.7);
        });
      }

      // Talons
      const FU = (N === 2 && G.phase === 'pick') || G.phase === 'tal';
      (G.t1 || []).forEach((c, k, a) => {
        FU
          ? pl(c, k, (N === 2 ? -1.7 : 0) + (k - (a.length - 1) / 2) * 1.15, 0.2 + k * 0.03, N === 2 ? -0.3 : 0.3, 0, 0, 1.15)
          : pl(c, k, -1.3 + k * 0.12, 0.2 + k * 0.04, -0.3, Math.PI, 0);
      });
      (G.t2 || []).forEach((c, k, a) => {
        FU
          ? pl(c, k, 1.7 + (k - (a.length - 1) / 2) * 1.15, 0.2 + k * 0.03, -0.3, 0, 0, 1.15)
          : pl(c, k, 1.3 + k * 0.12, 0.2 + k * 0.04, -0.3, Math.PI, 0);
      });

      // Trick on table
      (G.trick || []).forEach((t, k, a) => {
        pl(t.c, 0, (k - (a.length - 1) / 2) * 0.95, 0.15 + k * 0.03, 1.3, 0, (k - 1) * 0.1, 1.3);
      });

      cards.forEach((c, i) => {
        if (!placed.has(i)) c.m.visible = false;
      });

      if (wait) {
        setTimeout(updateCardPositions, 100);
      }
    }
  };

  useEffect(() => {
    updateCardPositions();
  }, [G, meIdx, local, selCards]);

  return (
    <>
      <div ref={mountRef} />
      <div ref={labelsContainerRef} />
    </>
  );
}
