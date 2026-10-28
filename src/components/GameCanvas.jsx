import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { CHARS, Avatar } from '../game/avatars.js';
import { STY, drawFace, drawBack, createTexture } from '../game/cardStyles.js';
import { SU, RA, PC, legal, FREE } from '../game/game.js';
import { EM } from '../game/emojis.js';

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
  isMenuOpen,
  emojiTrigger
}) {
  const mountRef = useRef(null);
  const labelsContainerRef = useRef(null);

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
    lastT2: 0,
    lastTapTime: 0,
    KX: 1,
    clk: new THREE.Clock()
  });

  const propsRef = useRef({ G, meIdx, local, cardStyle, backColor, selCards, onCardClick, speakers, chatBubbles, isMenuOpen });
  propsRef.current = { G, meIdx, local, cardStyle, backColor, selCards, onCardClick, speakers, chatBubbles, isMenuOpen };

  // Trigger emoji animations on avatars
  useEffect(() => {
    if (!emojiTrigger) return;
    const { playerIdx, emoIdx } = emojiTrigger;
    const avObj = stateRef.current.avatars[playerIdx];
    if (avObj && avObj.a) {
      const x = typeof emoIdx === 'number' ? EM[emoIdx] : [{ laugh: '😄', cry: '😢', wink: '😉', heart: '❤️' }[emoIdx], emoIdx];
      if (x) {
        avObj.a.play(x[1], x[1] === 'sleep' ? 3.5 : 2.8, x[0]);
      }
    }
  }, [emojiTrigger]);

  // Init Three.js scene once
  useEffect(() => {
    const ren = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    ren.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    ren.setSize(window.innerWidth, window.innerHeight);
    ren.domElement.className = 'game-canvas';
    ren.domElement.style.touchAction = 'none';
    mountRef.current.appendChild(ren.domElement);

    const sc = new THREE.Scene();
    sc.background = new THREE.Color(0x0a1610);
    sc.fog = new THREE.Fog(0x0a1610, 18, 38);

    const cam = new THREE.PerspectiveCamera(50, 1, 0.1, 70);
    const rs = () => {
      const isMobile = window.innerWidth < 768;
      ren.setSize(window.innerWidth, window.innerHeight);
      cam.aspect = window.innerWidth / window.innerHeight;
      cam.updateProjectionMatrix();

      if (isMobile) {
        const k = Math.max(1 / cam.aspect - 1, 0);
        cam.base = [0, 10.5 + k * 4.2, 10.8 + k * 5.0];
      } else {
        const k = Math.max(1 / cam.aspect - 1, 0);
        cam.base = [0, 9.2 + k * 4.5, 10.2 + k * 5.5];
      }
    };
    window.addEventListener('resize', rs);
    rs();

    // Lighting
    sc.add(new THREE.AmbientLight(0xffffff, 0.8));
    const pl = new THREE.PointLight(0xffe6b0, 1.0, 45);
    pl.position.set(0, 9.5, 2);
    sc.add(pl);

    const dirLight = new THREE.DirectionalLight(0xfff5e6, 0.45);
    dirLight.position.set(3, 12, 6);
    sc.add(dirLight);

    // ==========================================
    // 4 BURCHAKLI STOL (To'rtburchak Karta Stoli)
    // ==========================================
    const tableGroup = new THREE.Group();
    sc.add(tableGroup);

    // 1. Tashqi quyuq yog'och ramka (Wood Rim - 4 burchak)
    const rimWidth = 15.6, rimDepth = 12.6, rimHeight = 0.35;
    const woodRim = new THREE.Mesh(
      new THREE.BoxGeometry(rimWidth, rimHeight, rimDepth),
      new THREE.MeshStandardMaterial({
        color: 0x3d1c08,
        roughness: 0.45,
        metalness: 0.15
      })
    );
    woodRim.position.y = -0.18;
    tableGroup.add(woodRim);

    // 2. Ichki nafis oltin bezak chizig'i (Gold Trim)
    const goldTrim = new THREE.Mesh(
      new THREE.BoxGeometry(14.7, 0.04, 11.7),
      new THREE.MeshStandardMaterial({
        color: 0xd4af37,
        roughness: 0.3,
        metalness: 0.85
      })
    );
    goldTrim.position.y = 0.005;
    tableGroup.add(goldTrim);

    // 3. To'rtburchak yashil kazino fetr matosi (Green Felt Top)
    const tableFelt = new THREE.Mesh(
      new THREE.BoxGeometry(14.4, 0.34, 11.4),
      new THREE.MeshStandardMaterial({
        color: 0x125235,
        roughness: 0.85,
        metalness: 0.05
      })
    );
    tableFelt.position.y = -0.16;
    tableGroup.add(tableFelt);

    // Chang va yulduz zarrachalari
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
    const sm = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.5 });

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
        c.m.position.lerp(c.t.p, 0.14);
        c.m.quaternion.slerp(c.t.q, 0.14);
        const k = c.m.scale.x + (c.t.s - c.m.scale.x) * 0.14;
        c.m.scale.setScalar(k);
      });

      // Dust & camera sway
      dust.rotation.y = t * 0.03;
      cam.position.set(
        cam.base[0] + Math.sin(t * 0.3) * 0.3,
        cam.base[1] + Math.sin(t * 0.5) * 0.1,
        cam.base[2]
      );
      cam.lookAt(0, 0, 1.8);
      pl.intensity = 0.95 + Math.sin(t * 2) * 0.08;

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

        // O'yinchilar stolning 4 tomonining o'rtasida o'tirishi (Davrada):
        // 0: Men (Pastki o'rta)
        // 1, 2, 3: Qolgan o'yinchilar
        game.players.forEach((p, i) => {
          let o = avs[i];
          if (!o) {
            const ch = CHARS.find(c => c.id === p.av) || CHARS[0];
            const a = new Avatar(ch);
            sc.add(a.g);
            o = avs[i] = { a, id: p.av };
          }

          const relIdx = (i - m + N) % N;
          let posX = 0, posZ = 0, rotY = 0;

          if (relIdx === 0) {
            // Men: Pastki tomonning qoq o'rtasida
            posX = -4.5 * stateRef.current.KX;
            posZ = 6.8;
            rotY = 0.35;
          } else if (N === 2) {
            // 2 kishi bo'lsa: Raqib ro'paramizda (Yuqori tomonning o'rtasida)
            posX = 0;
            posZ = -6.2;
            rotY = Math.PI;
          } else if (N === 3) {
            // 3 kishi bo'lsa: 1-raqib Chap tomon o'rtasida, 2-raqib O'ng tomon o'rtasida
            if (relIdx === 1) {
              posX = -7.2 * stateRef.current.KX;
              posZ = -1.2;
              rotY = Math.PI * 0.45;
            } else {
              posX = 7.2 * stateRef.current.KX;
              posZ = -1.2;
              rotY = -Math.PI * 0.45;
            }
          } else {
            // 4 kishi bo'lsa: Aniq 4 tomonning o'rtasida
            if (relIdx === 1) {
              // Chap tomon o'rtasi
              posX = -7.4 * stateRef.current.KX;
              posZ = 0;
              rotY = Math.PI * 0.5;
            } else if (relIdx === 2) {
              // Qarshi (Yuqori) tomon o'rtasi
              posX = 0;
              posZ = -6.4;
              rotY = Math.PI;
            } else if (relIdx === 3) {
              // O'ng tomon o'rtasi
              posX = 7.4 * stateRef.current.KX;
              posZ = 0;
              rotY = -Math.PI * 0.5;
            }
          }

          o.a.g.position.set(posX, 0, posZ);
          o.a.g.rotation.y = rotY;
          o.a.g.scale.setScalar(relIdx === 0 ? 0.92 : 1.15);
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

    // Raycasting & Touch/Click handling with Debounce (solves mobile double-tap bug)
    const rc = new THREE.Raycaster();
    const mv = new THREE.Vector2();

    const getRayCard = (clientX, clientY) => {
      const cur = propsRef.current;
      const g = cur.G;
      if (!g || !g.hands) return null;
      const mIdx = cur.local ? g.players.findIndex(p => p.id === 'me') : cur.meIdx;
      if (mIdx < 0) return null;

      mv.set((clientX / window.innerWidth) * 2 - 1, -(clientY / window.innerHeight) * 2 + 1);
      rc.setFromCamera(mv, cam);
      const handCards = (g.hands[mIdx] || []).map(c => cards[c].m);
      const hits = rc.intersectObjects(handCards);
      return hits.length ? cards.indexOf(hits[0].object.userData.c) : null;
    };

    const handlePointerMove = (e) => {
      const c = getRayCard(e.clientX, e.clientY);
      if (c !== stateRef.current.hov) {
        stateRef.current.hov = c;
        updateCardPositions();
      }
    };

    const handleTapOrClick = (clientX, clientY) => {
      const now = performance.now();
      // Debounce: 250ms dan kam vaqtda kelgan takroriy touch/mouse eventlarni bekor qilish
      if (now - stateRef.current.lastTapTime < 250) {
        return;
      }
      stateRef.current.lastTapTime = now;

      const c = getRayCard(clientX, clientY);
      const cur = propsRef.current;
      const g = cur.G;
      if (c == null || !g) return;
      const mIdx = cur.local ? g.players.findIndex(p => p.id === 'me') : cur.meIdx;
      if (g.turn !== mIdx || !stateRef.current.lg.has(c)) return;

      stateRef.current.hov = null;
      cur.onCardClick(c);
    };

    const onPointerDown = (e) => {
      if (e.pointerType === 'touch') return; // Touchstart handles touch devices
      handleTapOrClick(e.clientX, e.clientY);
    };

    const onTouchStart = (e) => {
      if (e.touches && e.touches.length > 0) {
        const touch = e.touches[0];
        handleTapOrClick(touch.clientX, touch.clientY);
      }
    };

    const domEl = ren.domElement;
    domEl.addEventListener('pointermove', handlePointerMove, { passive: true });
    domEl.addEventListener('pointerdown', onPointerDown);
    domEl.addEventListener('touchstart', onTouchStart, { passive: true });

    return () => {
      window.removeEventListener('resize', rs);
      domEl.removeEventListener('pointermove', handlePointerMove);
      domEl.removeEventListener('pointerdown', onPointerDown);
      domEl.removeEventListener('touchstart', onTouchStart);
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
    const isMobile = window.innerWidth < 768;

    const lg = new Set();
    const hl = new Set();
    stateRef.current.lg = lg;
    stateRef.current.hl = hl;

    if (G.hands && G.phase !== 'lobby') {
      let wait = 0;
      const VW = 2 * Math.hypot(cam.base[1] - 0.8, cam.base[2] - 5.4) * 0.466 * cam.aspect * 0.86;
      const placed = new Set();
      stateRef.current.KX = Math.min(1, (VW * 0.4) / 5.6);

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

      if (G.turn === m) {
        if (G.phase === 'play') {
          const L = FREE ? G.hands[m] : legal(G.hands[m], G.trick, G.trump);
          (L || []).forEach(c => lg.add(c));
          if (L && L.length < (G.hands[m] || []).length) {
            L.forEach(c => hl.add(c));
          }
        }
        if (G.phase === 'give') {
          (G.hands[m] || []).forEach(c => lg.add(c));
          (selCards || []).forEach(c => hl.add(c));
        }
      }

      // ========================================================
      // O'YINCHILARNING KARTALARINI QO'LDA USHLAB TURISH (HANDS)
      // Stol tomonlarining markazida
      // ========================================================
      for (let i = 0; i < N; i++) {
        const relIdx = (i - m + N) % N;
        const h = (G.hands[i] || []).slice().sort((a, b) => (i === m ? SU(b) - SU(a) || RA(b) - RA(a) : 0));
        const n = h.length;

        if (relIdx === 0) {
          // O'ZIMIZNING QO'LIMIZDAGI KARTALAR:
          // Pastda xuddi qo'lda ushlangandek qulay, mobil rejimda ixcham va aniq
          const cardScale = isMobile ? 1.25 : 1.45;
          const maxSpread = isMobile ? Math.min(0.68, (VW - 0.8) / Math.max(n - 1, 1)) : Math.min(0.85, (VW - 1.0) / Math.max(n - 1, 1));

          h.forEach((c, k) => {
            const offset = (k - (n - 1) / 2) * maxSpread;
            const isHovered = c === stateRef.current.hov;
            const isHighlighted = hl.has(c);
            const lift = isHighlighted ? (isHovered ? 0.65 : 0.4) : (isHovered ? 0.25 : 0);
            const fanAngle = -(k - (n - 1) / 2) * (isMobile ? 0.035 : 0.045);

            pl(
              c,
              k * N,
              offset,
              (isMobile ? 0.9 : 1.0) + k * 0.015 + lift,
              (isMobile ? 6.2 : 6.4) - Math.abs(offset) * 0.08 - lift * 0.3,
              0.55,
              fanAngle,
              cardScale
            );
          });
        } else {
          // RAQIBLARNING KARTALARI:
          // Raqib avatari qo'lida (stol tomoni o'rtasida tikka fan shaklida ushlab turiladi)
          let handBaseX = 0, handBaseZ = 0, handRotY = 0;
          let px = 1, pz = 0;

          if (N === 2) {
            handBaseX = 0;
            handBaseZ = -5.0;
            handRotY = Math.PI;
            px = 1; pz = 0;
          } else if (N === 3) {
            if (relIdx === 1) {
              handBaseX = -5.8;
              handBaseZ = -1.2;
              handRotY = Math.PI * 0.45;
              px = 0.4; pz = 0.9;
            } else {
              handBaseX = 5.8;
              handBaseZ = -1.2;
              handRotY = -Math.PI * 0.45;
              px = 0.4; pz = -0.9;
            }
          } else {
            if (relIdx === 1) {
              handBaseX = -6.0;
              handBaseZ = 0;
              handRotY = Math.PI * 0.5;
              px = 0; pz = 1;
            } else if (relIdx === 2) {
              handBaseX = 0;
              handBaseZ = -5.2;
              handRotY = Math.PI;
              px = 1; pz = 0;
            } else if (relIdx === 3) {
              handBaseX = 6.0;
              handBaseZ = 0;
              handRotY = -Math.PI * 0.5;
              px = 0; pz = -1;
            }
          }

          const oppSp = 0.22;
          h.forEach((c, k) => {
            const offset = (k - (n - 1) / 2) * oppSp;
            const fanRotZ = (k - (n - 1) / 2) * 0.07;
            pl(
              c,
              k * N + relIdx,
              handBaseX + px * offset,
              1.25 + k * 0.016,
              handBaseZ + pz * offset,
              Math.PI * 0.52,
              handRotY + fanRotZ,
              0.88
            );
          });
        }

        // Qabul qilingan kartalar (Cap / Tricks) - Stol chetida
        let capBaseX = 0, capBaseZ = 0;
        if (relIdx === 0) { capBaseX = -5.8; capBaseZ = 4.2; }
        else if (relIdx === 1 && N === 2) { capBaseX = 5.2; capBaseZ = -4.5; }
        else if (relIdx === 1) { capBaseX = -5.8; capBaseZ = -2.8; }
        else if (relIdx === 2) { capBaseX = 5.2; capBaseZ = -4.5; }
        else if (relIdx === 3) { capBaseX = 5.8; capBaseZ = -1.5; }

        (G.cap[i] || []).forEach((c, k) => {
          pl(c, 0, capBaseX + (k % 4) * 0.04, 0.18 + k * 0.025, capBaseZ, Math.PI, 0, 0.6);
        });
      }

      // Talonda turgan kartalar (Stol markazida)
      const FU = (N === 2 && G.phase === 'pick') || G.phase === 'tal';
      (G.t1 || []).forEach((c, k, a) => {
        FU
          ? pl(c, k, (N === 2 ? -1.6 : 0) + (k - (a.length - 1) / 2) * 1.15, 0.22 + k * 0.03, N === 2 ? -0.3 : 0.3, 0, 0, 1.2)
          : pl(c, k, -1.2 + k * 0.12, 0.22 + k * 0.04, -0.3, Math.PI, 0);
      });
      (G.t2 || []).forEach((c, k, a) => {
        FU
          ? pl(c, k, 1.6 + (k - (a.length - 1) / 2) * 1.15, 0.22 + k * 0.03, -0.3, 0, 0, 1.2)
          : pl(c, k, 1.2 + k * 0.12, 0.22 + k * 0.04, -0.3, Math.PI, 0);
      });

      // Stol o'rtasida o'ynalgan raund kartalari (Trick on table)
      (G.trick || []).forEach((t, k, a) => {
        pl(t.c, 0, (k - (a.length - 1) / 2) * 0.95, 0.2 + k * 0.03, 1.4, 0, (k - 1) * 0.1, 1.3);
      });

      cards.forEach((c, i) => {
        if (!placed.has(i)) c.m.visible = false;
      });

      if (wait) {
        setTimeout(updateCardPositions, 90);
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
