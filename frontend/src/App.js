import { useState, useCallback, useEffect, useRef } from 'react';
import AgentSelector from './components/AgentSelector';
import QueryPanel from './components/QueryPanel';
import ResultPanel from './components/ResultPanel';
import SchemaPanel from './components/SchemaPanel';
import EntityProfileModal from './components/EntityProfileModal';
import { useSchema } from './hooks/useSchema';
import { useQueryHistory } from './hooks/useQueryHistory';
import { queryAPI } from './utils/api';
import './App.css';

/* ── helpers ───────────────────────────────────────────── */
function useLiveClock() {
  const [t, setT] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setT(new Date()), 1000); return () => clearInterval(id); }, []);
  return t;
}

function useLS(key, init) {
  const [v, set] = useState(() => { try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : init; } catch { return init; } });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(v)); } catch {} }, [key, v]);
  return [v, set];
}

function mkSession() {
  return { id: crypto.randomUUID(), title: 'New Chat', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), messages: [], memory: {}, msgCount: 0 };
}

function useSessions() {
  const [sessions, setSessions] = useLS('artha_sess_v1', [mkSession()]);
  const [activeId, setActiveId] = useLS('artha_act_v1', sessions[0]?.id);
  const active = sessions.find(s => s.id === activeId) || sessions[0];

  const newSession = useCallback(() => {
    const s = mkSession(); setSessions(p => [s, ...p]); setActiveId(s.id);
  }, [setSessions, setActiveId]);

  const delSession = useCallback(id => {
    setSessions(p => {
      const n = p.filter(s => s.id !== id);
      if (!n.length) { const s = mkSession(); setActiveId(s.id); return [s]; }
      if (id === activeId) setActiveId(n[0].id);
      return n;
    });
  }, [activeId, setSessions, setActiveId]);

  const pushMsg = useCallback((sid, msg) => {
    setSessions(p => p.map(s => {
      if (s.id !== sid) return s;
      const msgs = [...s.messages, msg];
      const title = s.msgCount === 0 && msg.role === 'user' ? msg.content.slice(0, 52) + (msg.content.length > 52 ? '...' : '') : s.title;
      let mem = { ...s.memory };
      if (msg.role === 'assistant' && msg.result) {
        const r = msg.result;
        if (r.intent) mem.lastIntent = r.intent;
        if (r.sql) mem.lastSql = r.sql;
        if (r.entities?.commodity) mem.commodity = r.entities.commodity;
        if (r.total_rows !== undefined) mem.lastRows = r.total_rows;
        if (r.cost_tier) mem.costTier = r.cost_tier;
      }
      return { ...s, messages: msgs, title, memory: mem, updatedAt: new Date().toISOString(), msgCount: s.msgCount + 1 };
    }));
  }, [setSessions]);

  const patchLast = useCallback((sid, fn) => {
    setSessions(p => p.map(s => {
      if (s.id !== sid || !s.messages.length) return s;
      const msgs = [...s.messages]; msgs[msgs.length - 1] = fn(msgs[msgs.length - 1]);
      return { ...s, messages: msgs };
    }));
  }, [setSessions]);

  return { sessions, active, activeId, setActiveId, newSession, delSession, pushMsg, patchLast };
}

/* ── tiny components ───────────────────────────────────── */
function NumberTicker({ value }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let cur = 0; const step = Math.ceil(value / 40);
    const t = setInterval(() => { cur += step; if (cur >= value) { setN(value); clearInterval(t); } else setN(cur); }, 30);
    return () => clearInterval(t);
  }, [value]);
  return <span>{n.toLocaleString()}</span>;
}

function TextReveal({ text }) {
  return <span>{text.split(' ').map((w, i) => (
    <span key={i} style={{ display: 'inline-block', animation: `wordReveal 0.4s ease forwards`, animationDelay: `${i * 0.08}s`, opacity: 0 }}>{w}&nbsp;</span>
  ))}</span>;
}

function timeAgo(iso) {
  const m = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (m < 1) return 'just now'; if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function ConfidenceBlock({ c }) {
  const col = c.score >= 80 ? '#10b981' : c.score >= 55 ? '#f59e0b' : '#ef4444';
  return (
    <div style={{ marginTop: 8, padding: '10px 12px', borderRadius: 8, background: '#0A0C0F', border: '1px solid rgba(232,146,42,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: '#3A4F5E', fontWeight: 600 }}>Confidence</span>
        <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: col }}>{c.score}/100 &middot; {c.level}</span>
      </div>
      <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
        <div style={{ width: `${c.score}%`, height: '100%', background: `linear-gradient(90deg,${col}99,${col})`, borderRadius: 2, transition: 'width 0.6s ease' }} />
      </div>
      {c.explanations?.map((e, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, fontSize: 10, color: '#8FA4B2' }}>
          <div style={{ width: 4, height: 4, borderRadius: '50%', background: col, flexShrink: 0 }} />{e}
        </div>
      ))}
    </div>
  );
}

const SQL_KW = /\b(SELECT|FROM|WHERE|GROUP BY|ORDER BY|LIMIT|JOIN|ON|AND|OR|NOT|IN|LIKE|ILIKE|IS|NULL|AS|DISTINCT|WITH|HAVING|LEFT|UNION|ALL|BY|ASC|DESC|CASE|WHEN|THEN|ELSE|END|SUM|AVG|COUNT|MIN|MAX|ROUND|DATE_TRUNC|UPPER|COALESCE)\b/gi;
function hlSQL(s) {
  return s.replace(/('.*?')/g, '<span style="color:#7FC4D4">$1</span>').replace(SQL_KW, '<span style="color:#E8922A;font-weight:600">$&</span>');
}

function SQLToggle({ sql }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  if (!sql) return null;
  return (
    <div style={{ marginTop: 8 }}>
      <button data-testid="sql-toggle" onClick={() => setOpen(o => !o)}
        style={{ background: 'none', border: 'none', color: '#3A4F5E', fontSize: 10, fontFamily: "'JetBrains Mono', monospace", cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ display: 'inline-block', transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>{'\u25B6'}</span> View SQL
      </button>
      {open && (
        <div style={{ borderRadius: 8, border: '1px solid rgba(232,146,42,0.06)', overflow: 'hidden', marginTop: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: '#0A0C0F', borderBottom: '1px solid rgba(232,146,42,0.06)' }}>
            <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: '#3A4F5E', letterSpacing: '.1em' }}>SQL</span>
            <button onClick={() => { navigator.clipboard.writeText(sql); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
              style={{ padding: '2px 8px', borderRadius: 4, border: '1px solid rgba(232,146,42,0.12)', background: 'transparent', color: copied ? '#10b981' : '#8FA4B2', fontSize: 9, fontFamily: "'JetBrains Mono', monospace", cursor: 'pointer' }}>
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <pre style={{ padding: '10px 12px', margin: 0, background: '#0F1318', overflow: 'auto', fontSize: 10, lineHeight: 1.7, fontFamily: "'JetBrains Mono', monospace", color: '#B8CDD8' }}
            dangerouslySetInnerHTML={{ __html: hlSQL(sql) }} />
        </div>
      )}
    </div>
  );
}

/* ── loading skeleton ──────────────────────────────────── */
function LoadingSkeleton() {
  const bar = (w, h = 14) => ({ width: w, height: h, borderRadius: 6, background: 'linear-gradient(90deg,#141A22 25%,#1A2330 50%,#141A22 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', marginBottom: 8 });
  return (
    <div style={{ padding: '4px 0' }}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        <div style={bar('60px', 20)} /><div style={bar('80px', 20)} /><div style={bar('70px', 20)} />
      </div>
      {[...Array(5)].map((_, i) => <div key={i} style={bar(`${100 - i * 8}%`, 28)} />)}
    </div>
  );
}

/* ── CHIPS ─────────────────────────────────────────────── */
const CHIPS = [
  { t: 'Top 5 coffee exporters by trade value', i: '\u{1F3C6}' },
  { t: 'Month-wise rice trade trend in 2024', i: '\u{1F4C5}' },
  { t: 'Source me 1121 Basmati rice suppliers', i: '\u{1F50D}' },
  { t: 'Compare India and Vietnam coffee exports', i: '\u{2696}\u{FE0F}' },
  { t: 'Average unit price of glass by grade', i: '\u{1F4B0}' },
  { t: 'Top importers from India in 2024', i: '\u{1F30D}' },
];

/* ── Hero ──────────────────────────────────────────────── */
function HeroEmpty({ onSend }) {
  const [chipHov, setChipHov] = useState(null);
  return (
    <div data-testid="hero-empty" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '40px 20px', position: 'relative' }}>
      {/* Grid bg */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', opacity: 0.3, pointerEvents: 'none' }}>
        <div style={{
          position: 'absolute', inset: -30, backgroundImage: 'linear-gradient(rgba(232,146,42,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(232,146,42,0.04) 1px, transparent 1px)',
          backgroundSize: '60px 60px', animation: 'gridMove 20s linear infinite',
        }} />
        <div style={{ position: 'absolute', top: '20%', left: '30%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(232,146,42,0.06), transparent 70%)' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 640 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 14px', borderRadius: 20, background: 'rgba(232,146,42,0.06)', border: '1px solid rgba(232,146,42,0.12)', marginBottom: 24 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: '#8FA4B2', fontWeight: 500 }}>Live &middot; shipment_records</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #C4601A, #E8922A)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, color: '#050709' }}>A</div>
          <span style={{ fontSize: 14, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: '#3A4F5E', letterSpacing: '.08em' }}>ARTHASHASTRA INTELLIGENCE</span>
        </div>

        <h1 data-testid="hero-headline" style={{ fontSize: 36, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600, color: '#E8922A', lineHeight: 1.15, marginBottom: 12, letterSpacing: '-0.01em' }}>
          <TextReveal text="Trade Intelligence, Redefined" />
        </h1>
        <p style={{ fontSize: 14, fontFamily: "'Barlow', sans-serif", color: '#8FA4B2', lineHeight: 1.6, marginBottom: 28 }}>
          Ask anything about your shipment data in plain English
        </p>

        <div data-testid="hero-stats" style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 36 }}>
          {[{ label: 'ROWS', value: 303000 }, { label: 'TABLES', value: 2 }, { label: 'COLS', value: 46 }].map(s => (
            <div key={s.label} style={{ padding: '10px 20px', borderRadius: 10, background: '#0F1318', border: '1px solid rgba(232,146,42,0.08)', minWidth: 100 }}>
              <div style={{ fontSize: 22, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600, color: '#EEE5D6', lineHeight: 1 }}>
                <NumberTicker value={s.value} />
              </div>
              <div style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: '#3A4F5E', letterSpacing: '.12em', fontWeight: 700, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div data-testid="hero-chips" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {CHIPS.map((c, i) => (
            <button key={i} data-testid={`chip-${i}`}
              onClick={() => onSend(c.t, 'new')}
              onMouseEnter={() => setChipHov(i)} onMouseLeave={() => setChipHov(null)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
                borderRadius: 10, border: `1px solid ${chipHov === i ? 'rgba(232,146,42,0.3)' : 'rgba(232,146,42,0.12)'}`,
                background: chipHov === i ? 'rgba(232,146,42,0.06)' : 'transparent',
                color: chipHov === i ? '#E8922A' : '#8FA4B2', fontSize: 12,
                fontFamily: "'Barlow', sans-serif", cursor: 'pointer', transition: 'all 0.2s',
                textAlign: 'left', animation: 'fadeInUp 0.4s ease', animationDelay: `${i * 0.07}s`,
                animationFillMode: 'backwards',
              }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{c.i}</span>{c.t}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── AI Bubble ─────────────────────────────────────────── */
function AiBubble({ r, onFollowup, onEntityClick }) {
  const isClarify = r.clarification || r.zero_results;
  const isError = r.success === false && !isClarify;
  return (
    <div>
      {isClarify && (
        <div style={{ padding: '10px 14px', borderRadius: 10, background: '#0F1318', border: '1px solid rgba(232,146,42,0.08)', fontSize: 12, color: '#B8CDD8', lineHeight: 1.6 }}
          dangerouslySetInnerHTML={{ __html: (r.message || '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') }} />
      )}
      {isError && (
        <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', fontSize: 12, color: '#ef4444' }}>
          {r.error || 'Unknown error'}
        </div>
      )}
      {(r.data?.length > 0 || r.formatted_output?.data?.length > 0) && (
        <ResultPanel result={r} onEntityClick={onEntityClick} onFollowup={onFollowup} />
      )}
      {r.confidence && <ConfidenceBlock c={r.confidence} />}
      <SQLToggle sql={r.sql} />
    </div>
  );
}

/* ── Message Bubble ────────────────────────────────────── */
function MessageBubble({ msg, onFollowup, onEntityClick }) {
  const isUser = msg.role === 'user';
  const time = new Date(msg.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  return (
    <div data-testid={`msg-${isUser ? 'user' : 'ai'}`} style={{ marginBottom: 20, animation: 'fadeInUp 0.3s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <div style={{
          width: 26, height: 26, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace",
          background: isUser ? 'rgba(74,122,155,0.15)' : 'linear-gradient(135deg, #C4601A, #E8922A)',
          color: isUser ? '#4A7A9B' : '#050709',
        }}>{isUser ? 'U' : 'AI'}</div>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#EEE5D6', fontFamily: "'Barlow', sans-serif" }}>{isUser ? 'You' : 'Arthashastra Intelligence'}</span>
        <span style={{ fontSize: 10, color: '#3A4F5E', fontFamily: "'JetBrains Mono', monospace" }}>{time}</span>
      </div>
      {isUser ? (
        <div style={{ padding: '10px 14px', borderRadius: '2px 10px 10px 10px', background: '#0F1318', border: '1px solid rgba(74,122,155,0.1)', fontSize: 13, color: '#EEE5D6', fontFamily: "'Barlow', sans-serif", lineHeight: 1.6, marginLeft: 34 }}>
          {msg.content}
        </div>
      ) : msg.loading ? (
        <div style={{ marginLeft: 34 }}><LoadingSkeleton /></div>
      ) : (
        <div style={{ marginLeft: 34 }}>
          {msg.result?.summary && (
            <div style={{ fontSize: 13, color: '#B8CDD8', fontFamily: "'Barlow', sans-serif", lineHeight: 1.6, marginBottom: 8 }}
              dangerouslySetInnerHTML={{ __html: (msg.result.summary || '').replace(/\*\*(.*?)\*\*/g, '<strong style="color:#EEE5D6">$1</strong>') }} />
          )}
          <AiBubble r={msg.result || {}} onFollowup={onFollowup} onEntityClick={onEntityClick} />
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ */
/* ── ROOT APP ──────────────────────────────────────────── */
/* ═══════════════════════════════════════════════════════════ */
export default function App() {
  const { schema, loading: schemaLoading } = useSchema();
  const clock = useLiveClock();
  const { sessions, active, activeId, setActiveId, newSession, delSession, pushMsg, patchLast } = useSessions();
  const { addToHistory } = useQueryHistory();
  const [activeAgent, setActiveAgent] = useState('shipment');
  const [isLoading, setIsLoading] = useState(false);
  const [schemaCollapsed, setSchemaCollapsed] = useState(false);
  const [sidebarHov, setSidebarHov] = useState(null);
  const [profileModal, setProfileModal] = useState(null);
  const chatEndRef = useRef(null);

  const messages = active?.messages || [];
  const memory = active?.memory || {};

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleEntityClick = useCallback((name, type) => {
    if (type === '__followup__') return; // followups handled by onFollowup
    setProfileModal({ name, type });
  }, []);

  const handleSend = useCallback(async (question, contextMode) => {
    if (!question.trim() || isLoading) return;
    pushMsg(activeId, { id: crypto.randomUUID(), role: 'user', content: question, timestamp: new Date().toISOString() });
    pushMsg(activeId, { id: crypto.randomUUID(), role: 'assistant', loading: true, timestamp: new Date().toISOString() });
    setIsLoading(true);
    try {
      const result = await queryAPI(question, activeId);
      addToHistory(result);
      patchLast(activeId, m => ({ ...m, loading: false, content: result.summary || result.message || 'Done.', result }));
    } catch (err) {
      patchLast(activeId, m => ({ ...m, loading: false, content: 'Failed.', result: { success: false, error: String(err) } }));
    } finally { setIsLoading(false); }
  }, [activeId, isLoading, pushMsg, patchLast, addToHistory]);

  const handleFollowup = useCallback(q => handleSend(q, 'followup'), [handleSend]);
  const tableCount = Object.keys(schema || {}).length;
  const totalCols = Object.values(schema || {}).reduce((sum, t) => sum + (t.columns?.length || 0), 0);
  const fmt = d => d.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div data-testid="app-root" style={{ display: 'flex', height: '100vh', width: '100vw', background: '#050709', overflow: 'hidden' }}>
      {/* ── LEFT SIDEBAR ── */}
      <aside data-testid="left-sidebar" style={{ width: 240, background: '#0A0C0F', borderRight: '1px solid rgba(232,146,42,0.08)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        {/* Logo */}
        <div style={{ padding: '16px 14px 12px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid rgba(232,146,42,0.06)' }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg, #C4601A, #E8922A)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, color: '#050709', flexShrink: 0 }}>A</div>
          <div>
            <div style={{ fontSize: 11, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600, color: '#EEE5D6', letterSpacing: '.04em', lineHeight: 1.1 }}>ARTHASHASTRA<span style={{ color: '#E8922A' }}> Intelligence</span></div>
            <div style={{ fontSize: 8, fontFamily: "'JetBrains Mono', monospace", color: '#3A4F5E', letterSpacing: '.16em', fontWeight: 700 }}>ANALYTICS ENGINE</div>
          </div>
        </div>

        {/* New Chat btn */}
        <div style={{ padding: '10px 12px 6px' }}>
          <button data-testid="new-chat-btn" onClick={newSession}
            style={{
              width: '100%', padding: '8px 0', borderRadius: 8,
              border: '1px solid rgba(232,146,42,0.2)', background: 'rgba(232,146,42,0.06)',
              color: '#E8922A', fontSize: 11, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.15s', letterSpacing: '.04em',
            }}>+ New Chat</button>
        </div>

        {/* Agent Selector */}
        <AgentSelector activeAgent={activeAgent} onAgentChange={setActiveAgent} />

        {/* Session list */}
        <div style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, letterSpacing: '.16em', color: '#3A4F5E', textTransform: 'uppercase', padding: '16px 16px 6px' }}>
          Sessions &middot; {sessions.length}
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '0 8px 12px' }}>
          {sessions.map(s => {
            const isActive = s.id === activeId;
            const isHov = sidebarHov === s.id;
            return (
              <div key={s.id} data-testid={`session-${s.id}`}
                onClick={() => setActiveId(s.id)}
                onMouseEnter={() => setSidebarHov(s.id)} onMouseLeave={() => setSidebarHov(null)}
                style={{
                  padding: '8px 10px', borderRadius: 8, marginBottom: 2, cursor: 'pointer',
                  background: isActive ? 'rgba(232,146,42,0.06)' : isHov ? 'rgba(232,146,42,0.03)' : 'transparent',
                  borderLeft: isActive ? '3px solid #E8922A' : '3px solid transparent',
                  transition: 'all 0.12s',
                }}>
                <div style={{ fontSize: 11, fontFamily: "'Barlow', sans-serif", color: isActive ? '#EEE5D6' : '#8FA4B2', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.3 }}>
                  {s.title}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                  <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: '#3A4F5E' }}>{timeAgo(s.updatedAt)}</span>
                  {s.msgCount > 0 && <span style={{ fontSize: 8, fontFamily: "'JetBrains Mono', monospace", padding: '1px 5px', borderRadius: 8, background: 'rgba(232,146,42,0.12)', color: '#E8922A', fontWeight: 700 }}>{s.msgCount}</span>}
                  {(isHov || isActive) && (
                    <button data-testid={`del-session-${s.id}`}
                      onClick={e => { e.stopPropagation(); delSession(s.id); }}
                      style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#3A4F5E', fontSize: 12, cursor: 'pointer', padding: 0, lineHeight: 1 }}>&times;</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ padding: '10px 14px', borderTop: '1px solid rgba(232,146,42,0.06)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: '#3A4F5E' }}>shipment_records &middot; 303K rows</span>
        </div>
      </aside>

      {/* ── MAIN PANEL ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top Bar */}
        <div data-testid="top-bar" style={{
          height: 48, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 20px',
          background: '#0A0C0F', borderBottom: '1px solid rgba(232,146,42,0.08)',
        }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600, color: '#EEE5D6', textTransform: 'uppercase' }}>
              {active?.title || 'New Chat'}
            </span>
            {memory.commodity && <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", padding: '2px 8px', borderRadius: 4, background: 'rgba(232,146,42,0.08)', color: '#E8922A' }}>{memory.commodity}</span>}
            {memory.lastIntent && <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", padding: '2px 8px', borderRadius: 4, background: 'rgba(74,122,155,0.1)', color: '#4A7A9B' }}>{memory.lastIntent}</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: '#3A4F5E' }}>
              303K rows &middot; {tableCount} tables &middot; {totalCols} cols
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: schemaLoading ? '#f59e0b' : '#10b981' }} />
              <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: '#8FA4B2', fontVariantNumeric: 'tabular-nums' }}>{fmt(clock)}</span>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div data-testid="chat-area" style={{ flex: 1, overflow: 'auto', padding: '0 24px' }}>
          {messages.length === 0 ? (
            <HeroEmpty onSend={handleSend} />
          ) : (
            <div style={{ maxWidth: 880, margin: '0 auto', padding: '20px 0' }}>
              {messages.map(msg => (
                <MessageBubble key={msg.id} msg={msg} onFollowup={handleFollowup} onEntityClick={handleEntityClick} />
              ))}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* Query Panel */}
        <QueryPanel onSend={handleSend} loading={isLoading} memory={memory} activeAgent={activeAgent} />
      </div>

      {/* ── RIGHT SIDEBAR ── */}
      <SchemaPanel schema={schema} loading={schemaLoading} collapsed={schemaCollapsed} onToggle={() => setSchemaCollapsed(c => !c)} />

      {/* ── Entity Profile Modal ── */}
      {profileModal && (
        <EntityProfileModal name={profileModal.name} entityType={profileModal.type} onClose={() => setProfileModal(null)} />
      )}
    </div>
  );
}
