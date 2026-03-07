import { useState } from 'react';

const TYPE_COLORS = {
  DATE: '#7FC4D4', TEXT: '#8FA4B2', NUMERIC: '#E8922A', BIGINT: '#F4B84A',
};

export default function SchemaPanel({ schema, loading, collapsed, onToggle }) {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState({});

  const tables = Object.entries(schema || {}).filter(([name]) =>
    name.toLowerCase().includes(search.toLowerCase())
  );

  if (collapsed) {
    return (
      <aside data-testid="schema-panel-collapsed" style={{
        width: 48, background: '#0A0C0F', borderLeft: '1px solid rgba(232,146,42,0.08)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 16, gap: 12,
      }}>
        <button
          data-testid="schema-expand-btn"
          onClick={onToggle}
          style={{
            width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(232,146,42,0.1)',
            background: 'rgba(232,146,42,0.06)', color: '#E8922A', fontSize: 14,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          &laquo;
        </button>
        <div style={{ writingMode: 'vertical-rl', fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: '#3A4F5E', letterSpacing: '.12em', fontWeight: 700 }}>
          SCHEMA
        </div>
      </aside>
    );
  }

  return (
    <aside data-testid="schema-panel" style={{
      width: 280, background: '#0A0C0F', borderLeft: '1px solid rgba(232,146,42,0.08)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      <div style={{
        padding: '14px 16px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid rgba(232,146,42,0.06)',
      }}>
        <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, letterSpacing: '.16em', color: '#3A4F5E', textTransform: 'uppercase' }}>
          Schema Browser
        </span>
        <button
          data-testid="schema-collapse-btn"
          onClick={onToggle}
          style={{
            width: 24, height: 24, borderRadius: 6, border: '1px solid rgba(232,146,42,0.1)',
            background: 'transparent', color: '#3A4F5E', fontSize: 12, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          &raquo;
        </button>
      </div>

      <div style={{ padding: '10px 12px 6px' }}>
        <input
          data-testid="schema-search"
          type="text"
          placeholder="Filter tables..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%', padding: '6px 10px', borderRadius: 8,
            border: '1px solid rgba(232,146,42,0.1)', background: '#0F1318',
            color: '#EEE5D6', fontSize: 11, fontFamily: "'JetBrains Mono', monospace",
            outline: 'none',
          }}
        />
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '4px 12px 12px' }}>
        {loading ? (
          [1, 2].map(i => (
            <div key={i} style={{
              height: 40, borderRadius: 8, marginBottom: 6,
              background: 'linear-gradient(90deg, #141A22 25%, #1A2330 50%, #141A22 75%)',
              backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite',
            }} />
          ))
        ) : tables.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 20, color: '#3A4F5E', fontSize: 11 }}>No tables found</div>
        ) : (
          tables.map(([name, table]) => (
            <div key={name} style={{ marginBottom: 4 }}>
              <button
                data-testid={`schema-table-${name}`}
                onClick={() => setExpanded(p => ({ ...p, [name]: !p[name] }))}
                style={{
                  width: '100%', padding: '8px 10px', borderRadius: 8, border: 'none',
                  background: expanded[name] ? 'rgba(232,146,42,0.06)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  cursor: 'pointer', transition: 'background 0.15s',
                }}
              >
                <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", fontWeight: 500, color: expanded[name] ? '#E8922A' : '#EEE5D6' }}>
                  <span style={{ marginRight: 6, fontSize: 9, color: '#3A4F5E' }}>{expanded[name] ? '\u25BC' : '\u25B6'}</span>
                  {name}
                </span>
                <span style={{
                  fontSize: 9, fontFamily: "'JetBrains Mono', monospace", padding: '1px 6px', borderRadius: 4,
                  background: 'rgba(232,146,42,0.08)', color: '#8FA4B2',
                }}>
                  {(table.row_count || 0).toLocaleString()} rows
                </span>
              </button>

              {expanded[name] && (
                <div style={{ padding: '4px 0 8px 20px', animation: 'fadeIn 0.2s ease' }}>
                  {(table.columns || []).map((col, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '3px 8px', borderRadius: 4, fontSize: 10,
                      fontFamily: "'JetBrains Mono', monospace",
                      background: i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent',
                    }}>
                      <span style={{ color: col.is_primary_key ? '#F4B84A' : '#8FA4B2' }}>
                        {col.is_primary_key && <span style={{ marginRight: 4, fontSize: 8 }}>PK</span>}
                        {col.name}
                      </span>
                      <span style={{
                        fontSize: 8, padding: '1px 5px', borderRadius: 3, fontWeight: 600,
                        letterSpacing: '.04em',
                        background: (TYPE_COLORS[col.type] || '#8FA4B2') + '15',
                        color: TYPE_COLORS[col.type] || '#8FA4B2',
                      }}>
                        {col.type}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
