import React, { useState, useRef, useEffect } from 'react';
import { EM } from '../game/emojis.js';

export function ChatAndEmoji({
  inGame,
  messages,
  unreadCount,
  onSendMessage,
  onSendEmoji,
  micState,
  onToggleMic
}) {
  const [showChat, setShowChat] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [text, setText] = useState('');
  const chatListRef = useRef(null);
  const chatInputRef = useRef(null);

  useEffect(() => {
    if (chatListRef.current) {
      chatListRef.current.scrollTop = chatListRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (showChat && chatInputRef.current) {
      chatInputRef.current.focus();
    }
  }, [showChat]);

  if (!inGame) return null;

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSendMessage(trimmed);
    setText('');
  };

  return (
    <>
      {/* Bottom control bar: Mic, Chat, Emoji */}
      <div id="eb">
        <button
          id="mic"
          className={micState.active && micState.enabled ? 'on' : ''}
          onClick={onToggleMic}
        >
          {!micState.active ? '🎤' : micState.enabled ? '🎙️' : '🔇'}
        </button>

        <button
          onClick={() => {
            setShowChat(prev => !prev);
            setShowEmoji(false);
          }}
        >
          💬
          <i id="cbd">{!showChat && unreadCount > 0 ? unreadCount : ''}</i>
        </button>

        <button
          onClick={() => {
            setShowEmoji(prev => !prev);
            setShowChat(false);
          }}
        >
          😀
        </button>
      </div>

      {/* Emoji picker popup */}
      {showEmoji && (
        <div id="sm" style={{ display: 'flex' }}>
          {EM.map((x, i) => (
            <button
              key={i}
              onClick={() => {
                onSendEmoji(i);
                setShowEmoji(false);
              }}
            >
              {x[0]}
            </button>
          ))}
        </div>
      )}

      {/* Chat panel */}
      {showChat && (
        <div id="chp" style={{ display: 'flex' }}>
          <div id="chl" ref={chatListRef}>
            {messages.map((m, idx) => (
              <div key={idx}>
                <b className="y">{m.name}:</b> {m.text}
              </div>
            ))}
          </div>
          <div className="row" style={{ flexWrap: 'nowrap' }}>
            <input
              id="chi"
              ref={chatInputRef}
              placeholder="Xabar yozing…"
              maxLength={200}
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleSend();
              }}
            />
            <button onClick={handleSend}>➤</button>
          </div>
        </div>
      )}
    </>
  );
}
