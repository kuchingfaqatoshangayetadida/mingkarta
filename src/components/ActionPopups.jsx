import React, { useState, useEffect } from 'react';
import { nm, cn, hasM } from '../game/game.js';

export function ActionPopups({ G, meIdx, local, selCards, setSelCards, onAction }) {
  if (!G || !G.players || G.phase === 'lobby') return null;

  const m = local ? G.players.findIndex(p => p.id === 'me') : meIdx;
  const isMyTurn = G.turn === m;

  const [pv, setPv] = useState(40);
  const [pvT, setPvT] = useState(0);

  useEffect(() => {
    if (G.phase === 'bid' && isMyTurn) {
      const mn = G.cur ? G.cur + 20 : 40;
      if (pvT !== G.v) {
        setPvT(G.v);
        setPv(mn);
      }
    } else if (G.phase === 'final' && isMyTurn) {
      if (pvT !== -G.v) {
        setPvT(-G.v);
        setPv(G.cur);
      }
    }
  }, [G.phase, G.v, G.cur, isMyTurn]);

  let content = null;

  if (G.phase === 'bid') {
    if (isMyTurn) {
      const mn = G.cur ? G.cur + 20 : 40;
      const ok = pv <= 120 || hasM(G.hands[m] || []).length > 0;
      content = (
        <>
          <div>Savdo</div>
          <div className="big">{pv}</div>
          <div className="r">
            <button className="s" onClick={() => setPv(Math.max(mn, pv - 20))}>−</button>
            <button onClick={() => setPv(Math.min(300, pv + 20))}>+ 20</button>
          </div>
          <div className="r">
            <button className="s" onClick={() => onAction('bidA', 0)}>Pas</button>
            <button disabled={!ok} onClick={() => onAction('bidA', pv)}>Olish</button>
          </div>
          {!ok && (
            <div style={{ fontSize: '12px', marginTop: '6px' }}>
              120 dan keyin qo‘lda marj (K+Q) kerak
            </div>
          )}
        </>
      );
    } else {
      content = (
        <>
          <div>{nm(G, G.turn)} savdolashmoqda…</div>
          {G.cur ? <div className="big">{G.cur}</div> : null}
        </>
      );
    }
  } else if (G.phase === 'pick') {
    content = isMyTurn ? (
      <>
        <div>Talonni tanlang</div>
        <div className="r">
          <button onClick={() => onAction('pickA', 0)}>1-talon</button>
          <button onClick={() => onAction('pickA', 1)}>2-talon</button>
        </div>
      </>
    ) : (
      <div>{nm(G, G.who)} talon tanlamoqda…</div>
    );
  } else if (G.phase === 'give') {
    if (isMyTurn) {
      const gv = G.gv || [];
      const hasTarget = gv[0] && gv[0].to != null;
      const myHand = G.hands[m] || [];

      // Kartani bosganda tanlash yoki bekor qilish funksiyasi
      const toggleCard = (c) => {
        if (!setSelCards) return;
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
      };

      const handleSend = () => {
        if (selCards.length !== 2) return;
        onAction('giveB', selCards[0], selCards[1]);
        if (setSelCards) setSelCards([]);
      };

      content = (
        <>
          <div style={{ fontWeight: 700, fontSize: '16px', color: '#e8b84a' }}>
            {hasTarget ? '2 ta kartani bering' : 'Ortiqcha 2 ta kartani tashlang'}
          </div>

          {[0, 1].map(k => (
            <div key={k} style={{ fontSize: '14px', margin: '4px 0' }}>
              {k + 1}-karta{gv[k] && gv[k].to != null ? ' → ' + nm(G, gv[k].to) : ''}:{' '}
              <b style={{ color: selCards[k] != null ? '#ffd700' : '#888', fontSize: '16px' }}>
                {selCards[k] != null ? cn(selCards[k]) : '— tanlanmagan'}
              </b>
            </div>
          ))}

          {/* Qo'ldagi kartalarni to'g'ridan-to'g'ri bitta bosish bilan tanlash (Telefonda 100% qulay) */}
          <div style={{ fontSize: '12px', marginTop: '6px', color: '#aaa' }}>
            Qo‘lingizdagi kartalardan 2 tasini bosing:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'center', margin: '8px 0', maxWidth: '300px' }}>
            {myHand.map(c => {
              const isSelected = selCards.includes(c);
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleCard(c)}
                  style={{
                    padding: '6px 8px',
                    fontSize: '13px',
                    borderRadius: '8px',
                    background: isSelected ? '#ffd700' : '#1e382b',
                    color: isSelected ? '#111' : '#fff',
                    border: isSelected ? '2px solid #fff' : '1px solid #e8b84a66',
                    cursor: 'pointer',
                    minWidth: '42px',
                    fontWeight: isSelected ? 800 : 600
                  }}
                >
                  {cn(c)}
                </button>
              );
            })}
          </div>

          <div className="r" style={{ marginTop: '8px' }}>
            <button
              disabled={selCards.length !== 2}
              style={{
                fontSize: '17px',
                padding: '12px 24px',
                background: selCards.length === 2 ? '#e8b84a' : '#555',
                color: selCards.length === 2 ? '#111' : '#aaa'
              }}
              onClick={handleSend}
            >
              Yuborish ({selCards.length}/2)
            </button>
          </div>
        </>
      );
    } else {
      content = <div>{nm(G, G.turn)} karta tanlamoqda…</div>;
    }
  } else if (G.phase === 'final') {
    if (isMyTurn) {
      content = (
        <>
          <div>Siz aytgan ochko</div>
          {G.dc && G.dc.length > 0 && (
            <div style={{ fontSize: '13px' }}>
              Tashlangan: {G.dc.map(cn).join(' ')}
            </div>
          )}
          <div className="big">{pv}</div>
          <div className="r">
            <button className="s" onClick={() => setPv(Math.max(G.cur, pv - 10))}>−</button>
            <button onClick={() => setPv(Math.min(300, pv + 10))}>+ 10</button>
          </div>
          <div className="r">
            <button onClick={() => onAction('finalA', pv)}>O‘ynash</button>
            <button className="s" onClick={() => onAction('splitA')}>Bo‘lib yuborish</button>
          </div>
          <div style={{ fontSize: '12px', marginTop: '6px' }}>
            Bo‘lib yuborsangiz: sizga −120, qolganlarga +60
          </div>
        </>
      );
    } else {
      content = <div>{nm(G, G.who)} ochko tanlamoqda…</div>;
    }
  } else if (G.phase === 'end' || G.phase === 'over') {
    content = (
      <>
        {G.phase === 'over' && <div className="big">🏆</div>}
        {G.phase === 'end' && (
          <div>Raund tugadi — natija tepada, keyingisi o‘zi boshlanadi…</div>
        )}
      </>
    );
  }

  if (!content) return null;

  return (
    <div id="pop" style={{ display: 'block' }}>
      {content}
    </div>
  );
}
