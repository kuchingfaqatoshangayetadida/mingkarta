import React from 'react';
import { S, PC } from '../game/game.js';

export function HUD({ G, meIdx, local }) {
  if (!G || !G.players || G.phase === 'lobby') return null;

  const m = local ? G.players.findIndex(p => p.id === 'me') : meIdx;
  const N = G.players.length;

  return (
    <>
      <div id="hud">
        {G.players.map((p, i) => {
          const isMe = i === m;
          const isTurn = G.turn === i && G.phase !== 'lobby';
          const capScore = G.cap && (G.phase === 'play' || G.phase === 'col')
            ? ((G.cap[i] || []).reduce((a, c) => a + PC(c), 0) + (G.mar[i] || 0))
            : null;
          const isWho = G.who === i && G.phase !== 'bid' && G.phase !== 'lobby';
          const isDealer = N === 4 && G.dealer === i && G.phase !== 'lobby';

          return (
            <span key={i} className={isMe ? 'me' : ''}>
              {isTurn ? '▶ ' : ''}
              {p.name}: {p.score}
              {capScore != null ? ` (+${capScore})` : ''}
              {p.barrel ? ' 🛢' : ''}
              {p.z ? ' ' + '—'.repeat(p.z) : ''}
              {isWho ? ` ⭐${G.cur}` : ''}
              {isDealer ? ' (dam)' : ''}
            </span>
          );
        })}
        {G.trump >= 0 && (
          <span>Kozir {S[G.trump]}</span>
        )}
      </div>

      <div id="msg">
        {G.msg || ''}
      </div>
    </>
  );
}
