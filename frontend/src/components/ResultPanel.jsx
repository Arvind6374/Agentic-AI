import { useState } from 'react';
import ReactECharts from 'echarts-for-react';

function fmtVal(val, colName) {
  if (val === null || val === undefined) return '-';
  const name = (colName || '').toLowerCase();
  const num = Number(val);
  if (name.includes('value') || name.includes('price') || name.includes('_usd')) {
    if (!isNaN(num)) {
      if (Math.abs(num) >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
      if (Math.abs(num) >= 1e6) return `$${(num / 1e6).toFixed(1)}M`;
      if (Math.abs(num) >= 1e3) return `$${num.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
      return `$${num.toFixed(2)}`;
    }
  }
  if (name.includes('quantity') || name.includes('count') || name.includes('weight') || name === 'shipments') {
    if (!isNaN(num)) return num.toLocaleString();
  }
  if (name.includes('date') || name === 'month' || name === 'eta' || name === 'etd') {
    if (/^\d{4}-\d{2}$/.test(String(val))) {
      const [y, m] = String(val).split('-');
      return new Date(y, m - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }
    if (/^\d{4}-\d{2}-\d{2}/.test(String(val))) {
      return new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  }
  if (name.includes('pct') || name.includes('percent') || name.includes('share')) {
    if (!isNaN(num)) return `${num.toFixed(1)}%`;
  }
  return String(val);
}

function getColColor(colName) {
  const n = (colName || '').toLowerCase();
  if (n.includes('value') || n.includes('price') || n.includes('_usd')) return '#E8922A';
  if (n.includes('date') || n === 'month' || n === 'eta' || n === 'etd') return '#7FC4D4';
  if (n.includes('quantity') || n.includes('count') || n.includes('weight')) return '#F4B84A';
  if (n.includes('pct') || n.includes('percent')) return '#10b981';
  return '#EEE5D6';
}

function isEntityCol(colName) {
  return colName === 'exporter_name' || colName === 'importer_name';
}

const KW = /\b(SELECT|FROM|WHERE|GROUP BY|ORDER BY|LIMIT|JOIN|ON|AND|OR|NOT|IN|LIKE|ILIKE|IS|NULL|AS|DISTINCT|WITH|HAVING|LEFT|UNION|ALL|BY|ASC|DESC|CASE|WHEN|THEN|ELSE|END|SUM|AVG|COUNT|MIN|MAX|ROUND|DATE_TRUNC|UPPER|COALESCE)\b/gi;

function hlSQL(s) {
  return s
    .replace(/('.*?')/g, '<span style="color:#7FC4D4">$1</span>')
    .replace(KW, '<span style="color:#E8922A;font-weight:600">$&</span>')
    .replace(/--.*/g, '<span style="color:#3A4F5E">$&</span>');
}

export default function ResultPanel({ result, onEntityClick, onFollowup }) {
  const [tab, setTab] = useState('table');
  const [hovRow, setHovRow] = useState(null);
  const [hovCol, setHovCol] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showAllFlags, setShowAllFlags] = useState(false);

  if (!result) return null;
  const r = result;
  const data = r.data || r.formatted_output?.data || [];
  const cols = data.length > 0 ? Object.keys(data[0]) : [];
  const flags = r.data_quality_flags || [];
  const insights = r.analytical_insights || [];
  const followups = r.followup_questions || [];

  const TABS = [
    { id: 'table', label: 'Table', icon: '\u229E' },
    { id: 'chart', label: 'Chart', icon: '\u25C8' },
    { id: 'sql', label: 'SQL', icon: '</>' },
    { id: 'info', label: 'Info', icon: '\u24D8' },
  ];

  const getChartOption = () => {
    if (!r.chart_data) return null;
    const cd = r.chart_data;
    const labels = cd.data.map(d => {
      const v = d[cd.label_key];
      if (/^\d{4}-\d{2}$/.test(String(v))) return new Date(v + '-01').toLocaleDateString('en-US', { month: 'short' });
      if (typeof v === 'string' && v.length > 18) return v.slice(0, 16) + '...';
      return v;
    });
    const series = cd.value_keys.map((vk, i) => ({
      name: vk.replace(/_/g, ' ').replace(/usd/gi, '').trim(),
      type: cd.type === 'bar' ? 'bar' : 'line',
      data: cd.data.map(d => d[vk]),
      itemStyle: { color: ['#E8922A', '#4A7A9B', '#F4B84A', '#7FC4D4'][i % 4] },
      lineStyle: { width: 2.5 },
      smooth: true,
      areaStyle: cd.type === 'line' ? { opacity: 0.08 } : undefined,
      barMaxWidth: 36,
      barBorderRadius: [4, 4, 0, 0],
    }));
    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis', backgroundColor: '#0F1318', borderColor: 'rgba(232,146,42,0.2)', borderWidth: 1,
        textStyle: { color: '#EEE5D6', fontFamily: "'JetBrains Mono', monospace", fontSize: 11 },
        formatter: (params) => {
          let s = `<div style="font-size:10px;color:#8FA4B2;margin-bottom:4px">${params[0].axisValue}</div>`;
          params.forEach(p => {
            const v = Number(p.value);
            const fv = v >= 1e9 ? `$${(v/1e9).toFixed(2)}B` : v >= 1e6 ? `$${(v/1e6).toFixed(1)}M` : `$${v.toLocaleString()}`;
            s += `<div style="display:flex;align-items:center;gap:6px"><span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${p.color}"></span>${p.seriesName}: <b style="color:#EEE5D6">${fv}</b></div>`;
          });
          return s;
        },
      },
      grid: { left: 60, right: 20, top: 30, bottom: 50 },
      xAxis: {
        type: 'category', data: labels, axisLine: { lineStyle: { color: '#1A2330' } },
        axisLabel: { color: '#3A4F5E', fontFamily: "'JetBrains Mono', monospace", fontSize: 10, rotate: labels.some(l => String(l).length > 10) ? 30 : 0 },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value', splitLine: { lineStyle: { color: '#141A22' } },
        axisLine: { show: false }, axisTick: { show: false },
        axisLabel: {
          color: '#3A4F5E', fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
          formatter: (v) => v >= 1e9 ? `$${(v/1e9).toFixed(1)}B` : v >= 1e6 ? `$${(v/1e6).toFixed(0)}M` : v >= 1e3 ? `${(v/1e3).toFixed(0)}K` : v,
        },
      },
      dataZoom: [{ type: 'slider', bottom: 8, height: 18, borderColor: '#1A2330', backgroundColor: '#0A0C0F', fillerColor: 'rgba(232,146,42,0.08)', handleStyle: { color: '#E8922A' }, textStyle: { color: '#3A4F5E', fontSize: 9 } }],
      series,
      legend: series.length > 1 ? { top: 4, right: 0, textStyle: { color: '#8FA4B2', fontFamily: "'JetBrains Mono', monospace", fontSize: 10 } } : undefined,
    };
  };

  return (
    <div data-testid="result-panel" style={{ animation: 'fadeInUp 0.4s ease', margin: '4px 0' }}>
      {/* Header badges */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {r.total_rows !== undefined && (
          <span data-testid="result-row-count" style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", padding: '2px 8px', borderRadius: 4, background: 'rgba(232,146,42,0.08)', color: '#E8922A', fontWeight: 600 }}>
            {r.total_rows} rows
          </span>
        )}
        {r.intent && (
          <span data-testid="result-intent" style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", padding: '2px 8px', borderRadius: 4, background: 'rgba(74,122,155,0.12)', color: '#4A7A9B', fontWeight: 500 }}>
            {r.intent}
          </span>
        )}
        {r.cost_tier && (
          <span data-testid="result-cost-tier" style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", padding: '2px 8px', borderRadius: 4, background: 'rgba(244,184,74,0.1)', color: '#F4B84A', fontWeight: 500 }}>
            {r.cost_tier}
          </span>
        )}
        {r.elapsed_ms && (
          <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", padding: '2px 8px', borderRadius: 4, background: 'rgba(127,196,212,0.08)', color: '#7FC4D4' }}>
            {r.elapsed_ms.toFixed(0)}ms
          </span>
        )}
        <div style={{ flex: 1 }} />
        <div data-testid="result-tabs" style={{ display: 'flex', gap: 2, background: '#0A0C0F', borderRadius: 8, padding: 2 }}>
          {TABS.map(t => (
            <button key={t.id} data-testid={`tab-${t.id}`} onClick={() => setTab(t.id)}
              style={{
                padding: '4px 10px', borderRadius: 6, border: 'none',
                background: tab === t.id ? 'rgba(232,146,42,0.1)' : 'transparent',
                color: tab === t.id ? '#E8922A' : '#3A4F5E',
                fontSize: 10, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.15s',
              }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Data quality flags as inline pills */}
      {flags.length > 0 && (
        <div data-testid="data-quality-flags" style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
          {(showAllFlags ? flags : flags.slice(0, 2)).map((f, i) => (
            <span key={i} style={{
              fontSize: 9, fontFamily: "'JetBrains Mono', monospace", padding: '2px 8px', borderRadius: 10,
              background: 'rgba(232,146,42,0.08)', color: '#E8922A',
              border: '1px solid rgba(232,146,42,0.12)',
            }}>
              {f}
            </span>
          ))}
          {flags.length > 2 && !showAllFlags && (
            <button onClick={() => setShowAllFlags(true)} style={{
              fontSize: 9, padding: '2px 8px', borderRadius: 10, border: '1px solid rgba(232,146,42,0.1)',
              background: 'transparent', color: '#3A4F5E', cursor: 'pointer',
            }}>
              +{flags.length - 2} more
            </button>
          )}
        </div>
      )}

      {/* Analytical insight bar */}
      {insights.length > 0 && (
        <div data-testid="insight-bar" style={{
          borderLeft: '3px solid #E8922A', background: 'rgba(232,146,42,0.04)',
          padding: '8px 12px', borderRadius: '0 8px 8px 0', marginBottom: 10,
          fontSize: 12, fontFamily: "'Barlow', sans-serif", color: '#B8CDD8', lineHeight: 1.6,
        }}>
          {insights.map((ins, i) => (
            <div key={i} dangerouslySetInnerHTML={{ __html: ins.replace(/\*\*(.*?)\*\*/g, '<strong style="color:#EEE5D6">$1</strong>') }} />
          ))}
        </div>
      )}

      {/* TABLE VIEW */}
      {tab === 'table' && data.length > 0 && (
        <div data-testid="table-view" style={{ overflow: 'auto', maxHeight: 400, borderRadius: 10, border: '1px solid rgba(232,146,42,0.06)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>
            <thead>
              <tr>
                {cols.map(col => (
                  <th key={col} style={{
                    position: 'sticky', top: 0, zIndex: 2, padding: '8px 10px', textAlign: 'left',
                    fontWeight: 600, fontSize: 9, letterSpacing: '.08em', textTransform: 'uppercase',
                    background: '#0F1318', color: '#3A4F5E', borderBottom: '1px solid rgba(232,146,42,0.1)',
                    whiteSpace: 'nowrap',
                  }}>
                    {col.replace(/_/g, ' ')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, ri) => (
                <tr key={ri}
                  onMouseEnter={() => setHovRow(ri)} onMouseLeave={() => setHovRow(null)}
                  style={{
                    background: hovRow === ri ? 'rgba(232,146,42,0.04)' : ri % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent',
                    transition: 'background 0.1s',
                  }}>
                  {cols.map(col => {
                    const val = row[col];
                    const entity = isEntityCol(col);
                    const color = getColColor(col);
                    const formatted = fmtVal(val, col);
                    const isLong = String(val || '').length > 40;
                    return (
                      <td key={col}
                        onMouseEnter={() => setHovCol(`${ri}-${col}`)} onMouseLeave={() => setHovCol(null)}
                        title={isLong ? String(val) : undefined}
                        style={{
                          padding: '6px 10px', color, whiteSpace: 'nowrap',
                          maxWidth: isLong ? 320 : 'auto', overflow: 'hidden', textOverflow: 'ellipsis',
                          borderBottom: '1px solid rgba(255,255,255,0.02)',
                          cursor: entity ? 'pointer' : 'default',
                        }}
                        onClick={() => {
                          if (entity && val && onEntityClick) {
                            onEntityClick(val, col === 'exporter_name' ? 'exporter' : 'importer');
                          }
                        }}>
                        {entity && val ? (
                          <span style={{ color: '#E8922A', borderBottom: '1px dashed rgba(232,146,42,0.3)' }}>
                            {formatted}
                            <span style={{
                              marginLeft: 4, fontSize: 8, padding: '1px 4px', borderRadius: 3,
                              background: 'rgba(232,146,42,0.08)', color: '#E8922A',
                              opacity: hovCol === `${ri}-${col}` ? 1 : 0, transition: 'opacity 0.15s',
                            }}>Profile</span>
                          </span>
                        ) : formatted}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CHART VIEW */}
      {tab === 'chart' && (
        <div data-testid="chart-view" style={{ borderRadius: 10, border: '1px solid rgba(232,146,42,0.06)', overflow: 'hidden', background: '#0A0C0F' }}>
          {r.chart_data ? (
            <ReactECharts option={getChartOption()} style={{ height: 340 }} opts={{ renderer: 'canvas' }} />
          ) : (
            <div style={{ padding: 40, textAlign: 'center', color: '#3A4F5E', fontSize: 12 }}>No chart data available</div>
          )}
        </div>
      )}

      {/* SQL VIEW */}
      {tab === 'sql' && (
        <div data-testid="sql-view" style={{ borderRadius: 10, border: '1px solid rgba(232,146,42,0.06)', overflow: 'hidden' }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '8px 12px', background: '#0A0C0F', borderBottom: '1px solid rgba(232,146,42,0.06)',
          }}>
            <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, letterSpacing: '.12em', color: '#3A4F5E' }}>GENERATED SQL</span>
            <button data-testid="copy-sql-btn"
              onClick={() => { navigator.clipboard.writeText(r.sql || ''); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
              style={{
                padding: '3px 10px', borderRadius: 5, border: '1px solid rgba(232,146,42,0.15)',
                background: copied ? 'rgba(16,185,129,0.1)' : 'transparent',
                color: copied ? '#10b981' : '#8FA4B2', fontSize: 10,
                fontFamily: "'JetBrains Mono', monospace", cursor: 'pointer',
              }}>
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <pre style={{
            padding: '12px 16px', margin: 0, background: '#0F1318', overflow: 'auto',
            fontSize: 11, lineHeight: 1.7, fontFamily: "'JetBrains Mono', monospace", color: '#B8CDD8',
          }} dangerouslySetInnerHTML={{ __html: hlSQL(r.sql || '') }} />
        </div>
      )}

      {/* INFO VIEW */}
      {tab === 'info' && (
        <div data-testid="info-view" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: 4 }}>
          {[
            { l: 'Total Rows', v: r.total_rows?.toLocaleString() || '-' },
            { l: 'Query Time', v: r.elapsed_ms ? `${r.elapsed_ms.toFixed(0)}ms` : '-' },
            { l: 'Intent', v: r.intent || '-' },
            { l: 'Cost Tier', v: r.cost_tier || '-' },
            { l: 'Tables Used', v: (r.tables_used || []).join(', ') || '-' },
            { l: 'Columns', v: cols.length ? cols.length.toString() : '-' },
            { l: 'Confidence', v: r.confidence ? `${r.confidence.score}/100` : '-' },
            { l: 'Commodity', v: r.entities?.commodity || '-' },
          ].map((item, i) => (
            <div key={i} style={{ padding: '10px 12px', borderRadius: 8, background: '#0F1318', border: '1px solid rgba(232,146,42,0.06)' }}>
              <div style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: '#3A4F5E', letterSpacing: '.1em', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>{item.l}</div>
              <div style={{ fontSize: 13, fontFamily: "'Barlow Condensed', sans-serif", color: '#EEE5D6', fontWeight: 500 }}>{item.v}</div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination info */}
      {tab === 'table' && data.length > 0 && r.total_rows > data.length && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, padding: '0 4px' }}>
          <div style={{ flex: 1, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
            <div style={{ width: `${(data.length / r.total_rows) * 100}%`, height: '100%', background: '#E8922A', borderRadius: 2 }} />
          </div>
          <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: '#3A4F5E', whiteSpace: 'nowrap' }}>
            Showing {data.length} of {r.total_rows.toLocaleString()}
          </span>
        </div>
      )}

      {/* Follow-up suggestions */}
      {followups.length > 0 && (
        <div data-testid="followup-questions" style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
          {followups.map((q, i) => (
            <button key={i} data-testid={`followup-${i}`}
              onClick={() => onFollowup && onFollowup(q)}
              style={{
                padding: '5px 12px', borderRadius: 20, border: '1px solid rgba(232,146,42,0.15)',
                background: 'transparent', color: '#8FA4B2', fontSize: 11,
                fontFamily: "'Barlow', sans-serif", cursor: 'pointer', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.target.style.background = 'rgba(232,146,42,0.06)'; e.target.style.color = '#E8922A'; e.target.style.borderColor = 'rgba(232,146,42,0.3)'; }}
              onMouseLeave={e => { e.target.style.background = 'transparent'; e.target.style.color = '#8FA4B2'; e.target.style.borderColor = 'rgba(232,146,42,0.15)'; }}>
              &darr; {q}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
