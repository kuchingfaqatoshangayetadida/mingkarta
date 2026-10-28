import React, { useRef, useEffect } from 'react';
import { STY, drawFace } from '../game/cardStyles.js';
import {
  setMusicEnabled,
  setMusicVolume,
  setSoundEnabled,
  setSoundVolume,
  playCardSound
} from '../game/audio.js';

export function SettingsModal({
  isOpen,
  onClose,
  cardStyle,
  setCardStyle,
  backColor,
  setBackColor,
  audioSettings,
  setAudioSettings
}) {
  if (!isOpen) return null;

  return (
    <div className="pn" id="sp" style={{ right: '6px', display: 'block' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <b style={{ color: '#e8b84a' }}>Sozlamalar</b>
        <button className="s" style={{ padding: '2px 8px', fontSize: '12px' }} onClick={onClose}>✕</button>
      </div>

      <div>Karta uslubi (faqat sizda o‘zgaradi)</div>
      <div id="stl" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxWidth: '250px', margin: '4px 0 8px' }}>
        {STY.map((st, i) => (
          <StylePreviewButton
            key={i}
            st={st}
            index={i}
            isSelected={cardStyle === i}
            onSelect={() => setCardStyle(i)}
          />
        ))}
      </div>

      <div>Karta orqasi rangi</div>
      <div style={{ display: 'flex', gap: '4px', margin: '4px 0 8px' }}>
        {['#7a1f2b', '#1f3f7a', '#1f6a3a', '#222222', '#6a2a8a'].map(col => (
          <button
            key={col}
            className="sw"
            style={{
              background: col,
              borderColor: backColor === col ? '#ffffff' : '#e8b84a'
            }}
            onClick={() => setBackColor(col)}
          />
        ))}
      </div>

      <div style={{ marginTop: '8px' }}>
        <label>
          <input
            type="checkbox"
            checked={audioSettings.mOn}
            onChange={e => {
              const val = e.target.checked;
              setAudioSettings(prev => ({ ...prev, mOn: val }));
              setMusicEnabled(val);
            }}
          />{' '}
          Musiqa
        </label>
        <br />
        <input
          type="range"
          min="0"
          max="1"
          step=".05"
          value={audioSettings.mV}
          onInput={e => {
            const val = +e.target.value;
            setAudioSettings(prev => ({ ...prev, mV: val }));
            setMusicVolume(val);
          }}
        />
      </div>

      <div style={{ marginTop: '8px' }}>
        <label>
          <input
            type="checkbox"
            checked={audioSettings.sOn}
            onChange={e => {
              const val = e.target.checked;
              setAudioSettings(prev => ({ ...prev, sOn: val }));
              setSoundEnabled(val);
            }}
          />{' '}
          Karta tovushi
        </label>
        <br />
        <input
          type="range"
          min="0"
          max="1"
          step=".05"
          value={audioSettings.sV}
          onInput={e => {
            const val = +e.target.value;
            setAudioSettings(prev => ({ ...prev, sV: val }));
            setSoundVolume(val);
            playCardSound();
          }}
        />
      </div>
    </div>
  );
}

function StylePreviewButton({ st, index, isSelected, onSelect }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current) {
      const g = canvasRef.current.getContext('2d');
      drawFace(g, 3, 5, st);
    }
  }, [st]);

  return (
    <button
      title={st.n}
      style={{
        width: '44px',
        height: '58px',
        padding: '2px',
        border: '2px solid ' + (isSelected ? '#fff' : '#e8b84a'),
        background: '#10261b',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer'
      }}
      onClick={onSelect}
    >
      <canvas
        ref={canvasRef}
        width={128}
        height={180}
        style={{ width: '36px', height: '50px', display: 'block', borderRadius: '3px' }}
      />
    </button>
  );
}
