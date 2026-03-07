import { useState, useRef, useEffect } from 'react';

const MODES = [
  { k: 'new', l: 'New Query' },
  { k: 'followup', l: 'Follow-up' },
  { k: 'compare', l: 'Compare' },
];

export default function QueryPanel({ onSend, loading, memory, activeAgent }) {
  const [text, setText] = useState('');
  const [mode, setMode] = useState('new');
  const ref = useRef(null);
  const [sendHov, setSendHov] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); ref.current?.focus(); }
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); doSend(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  const doSend = () => {
    if (!text.trim() || loading) return;
    onSend(text.trim(), mode);
    setText('');
    if (ref.current) ref.current.style.height = '24px';
  };

  const agentColors = { shipment: '#4A7A9B', sales: '#E8922A', payment: '#7FC4D4', reconciliation: '#F4B84A' };
  const agentColor = agentColors[activeAgent] || '#E8922A';

  return (
    <div data-testid="query-panel" style={{
      position: 'relative', padding: '12px 20px 14px', borderTop: '1px solid rgba(232,146,42,0.08)',
      background: 'linear-gradient(180deg, #0A0C0F 0%, #050709 100%)',
    }}>
      <div style={{
        display: 'flex', alignItems: 'flex-end', gap: 10,
        background: '#0F1318', border: '1px solid rgba(232,146,42,0.12)', borderRadius: 14,
        padding: '10px 14px', transition: 'border-color 0.2s',
      }}>
        <div data-testid="agent-icon-indicator" style={{
          width: 32, height: 32, borderRadius: 10, flexShrink: 0,
          background: agentColor + '18', border: `1px solid ${agentColor}33`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 9, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700,
          color: agentColor, letterSpacing: '.04em',
        }}>
          {(activeAgent || 'SHP').slice(0, 3).toUpperCase()}
        </div>

        <textarea
          ref={ref}
          data-testid="query-input"
          value={text}
          disabled={loading}
          rows={1}
          placeholder="Ask a question about your shipment data..."
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none', resize: 'none',
            color: '#EEE5D6', fontFamily: "'Barlow', sans-serif", fontSize: 14, lineHeight: '22px',
            minHeight: 24, maxHeight: 110,
          }}
          onChange={e => {
            setText(e.target.value);
            e.target.style.height = '24px';
            e.target.style.height = Math.min(e.target.scrollHeight, 110) + 'px';
          }}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doSend(); }
          }}
        />

        <button
          data-testid="run-query-button"
          onClick={doSend}
          disabled={!text.trim() || loading}
          onMouseEnter={() => setSendHov(true)}
          onMouseLeave={() => setSendHov(false)}
          style={{
            flexShrink: 0, height: 34, padding: '0 18px', borderRadius: 10,
            border: loading ? '1px solid rgba(232,146,42,0.2)' : '1px solid #E8922A',
            background: (!text.trim() || loading) ? 'transparent' : sendHov ? '#E8922A' : 'rgba(232,146,42,0.1)',
            color: (!text.trim() || loading) ? '#3A4F5E' : sendHov ? '#050709' : '#E8922A',
            fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600,
            cursor: (!text.trim() || loading) ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', gap: 6,
            letterSpacing: '.04em',
          }}
        >
          {loading ? (
            <>
              <span style={{ width: 14, height: 14, border: '2px solid rgba(232,146,42,0.3)', borderTopColor: '#E8922A', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
              Analyzing...
            </>
          ) : (
            <>Run <span style={{ fontSize: 14 }}>&rarr;</span></>
          )}
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, padding: '0 4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 10, color: '#3A4F5E', fontFamily: "'JetBrains Mono', monospace" }}>
          <span><kbd style={{ padding: '1px 5px', borderRadius: 3, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', fontSize: 9 }}>Enter</kbd> send</span>
          <span><kbd style={{ padding: '1px 5px', borderRadius: 3, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', fontSize: 9 }}>Shift+Enter</kbd> newline</span>
          <span><kbd style={{ padding: '1px 5px', borderRadius: 3, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', fontSize: 9 }}>{navigator.platform?.includes('Mac') ? '\u2318' : 'Ctrl'}+K</kbd> focus</span>
          {memory?.commodity && <span style={{ color: '#E8922A' }}>{memory.commodity} in context</span>}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {MODES.map(m => (
            <button
              key={m.k}
              data-testid={`mode-btn-${m.k}`}
              onClick={() => setMode(m.k)}
              style={{
                padding: '3px 10px', borderRadius: 6, border: 'none',
                background: mode === m.k ? 'rgba(232,146,42,0.12)' : 'transparent',
                color: mode === m.k ? '#E8922A' : '#3A4F5E',
                fontSize: 10, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.15s', letterSpacing: '.02em',
              }}
            >
              {m.l}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
