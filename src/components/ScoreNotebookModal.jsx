import React from 'react';

export function ScoreNotebookModal({ G, isOpen, onClose }) {
  if (!isOpen) return null;

  const H = (G && G.hist) || [];
  const Q = G ? G.players : [];

  return (
    <div className="pn" id="dp" style={{ left: '6px', display: 'block' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <b style={{ color: '#e8b84a' }}>Ochkolar daftari</b>
        <button className="s" style={{ padding: '2px 8px', fontSize: '12px' }} onClick={onClose}>✕</button>
      </div>

      {!Q.length ? (
        <div>Daftar bo‘sh</div>
      ) : (
        <table style={{ borderCollapse: 'collapse', textAlign: 'center', width: '100%' }}>
          <thead>
            <tr>
              <th style={{ padding: '2px 4px' }}>#</th>
              {Q.map((p, i) => (
                <th key={i} style={{ padding: '2px 8px' }}>{p.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {H.map((r, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                {r.map((v, j) => (
                  <td key={j} style={{ color: typeof v === 'number' && v < 0 ? '#f88' : '#9f9' }}>
                    {typeof v === 'number' && v > 0 ? '+' : ''}{v}
                  </td>
                ))}
              </tr>
            ))}
            <tr style={{ borderTop: '1px solid #e8b84a' }}>
              <td>∑</td>
              {Q.map((p, i) => (
                <td key={i}><b>{p.score}</b></td>
              ))}
            </tr>
          </tbody>
        </table>
      )}

      {H.length === 0 && Q.length > 0 && (
        <div style={{ marginTop: '6px', opacity: 0.7 }}>Hali raund tugamagan</div>
      )}
    </div>
  );
}
