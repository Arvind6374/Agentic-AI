import { useState } from 'react';

const AGENTS = [
  { id: 'shipment', name: 'SHIPMENT AGENT', icon: '\u{1F6A2}', color: '#4A7A9B', desc: 'Track cargo, routes & trade flows', status: 'LIVE' },
  { id: 'sales', name: 'SALES AGENT', icon: '\u{1F4C8}', color: '#E8922A', desc: 'Revenue analytics & buyer intelligence', status: 'COMING SOON' },
  { id: 'payment', name: 'PAYMENT AGENT', icon: '\u{1F4B3}', color: '#7FC4D4', desc: 'Invoice tracking & payment reconciliation', status: 'COMING SOON' },
  { id: 'reconciliation', name: 'RECONCILIATION AGENT', icon: '\u{2696}\u{FE0F}', color: '#F4B84A', desc: 'Match shipments, invoices & payments', status: 'COMING SOON' },
];

export default function AgentSelector({ activeAgent, onAgentChange }) {
  const [hov, setHov] = useState(null);

  return (
    <div data-testid="agent-selector" style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '0 12px' }}>
      <div style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, letterSpacing: '.16em', color: '#3A4F5E', textTransform: 'uppercase', padding: '14px 4px 6px' }}>
        Agents
      </div>
      {AGENTS.map(a => {
        const active = a.id === activeAgent;
        const hover = hov === a.id;
        const disabled = a.status === 'COMING SOON';
        return (
          <div
            key={a.id}
            data-testid={`agent-card-${a.id}`}
            onClick={() => !disabled && onAgentChange(a.id)}
            onMouseEnter={() => setHov(a.id)}
            onMouseLeave={() => setHov(null)}
            style={{
              position: 'relative', padding: '12px 14px', borderRadius: 12, cursor: disabled ? 'not-allowed' : 'pointer',
              border: `1px solid ${active ? a.color + '44' : hover && !disabled ? 'rgba(232,146,42,0.15)' : 'rgba(232,146,42,0.06)'}`,
              background: active ? a.color + '14' : hover && !disabled ? 'rgba(232,146,42,0.04)' : 'transparent',
              opacity: disabled ? 0.4 : 1,
              transform: hover && !disabled ? 'translateY(-2px)' : 'none',
              transition: 'all 0.2s ease',
              boxShadow: hover && !disabled ? `0 4px 20px ${a.color}18` : 'none',
            }}
          >
            <div style={{
              position: 'absolute', top: 8, right: 8, fontSize: 7.5, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700,
              letterSpacing: '.08em', padding: '2px 6px', borderRadius: 4,
              background: a.status === 'LIVE' ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.04)',
              color: a.status === 'LIVE' ? '#10b981' : '#3A4F5E',
              border: `1px solid ${a.status === 'LIVE' ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.06)'}`,
            }}>
              {a.status}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 22, lineHeight: 1 }}>{a.icon}</span>
              <div>
                <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: active ? a.color : '#EEE5D6', lineHeight: 1.3 }}>
                  {a.name}
                </div>
                <div style={{ fontSize: 10, color: '#3A4F5E', fontFamily: "'Barlow', sans-serif", marginTop: 3 }}>
                  {a.desc}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
