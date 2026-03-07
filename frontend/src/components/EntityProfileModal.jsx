import { useState, useEffect } from 'react';
import { getEntityProfile } from '../utils/api';

function fmtMoney(n) {
  if (n === null || n === undefined) return '-';
  const v = Number(n);
  if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  return `$${v.toFixed(2)}`;
}

function Skeleton({ width, height }) {
  return (
    <div style={{
      width: width || '100%', height: height || 20, borderRadius: 6,
      background: 'linear-gradient(90deg, #141A22 25%, #1A2330 50%, #141A22 75%)',
      backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite',
    }} />
  );
}

function KpiCard({ label, value, sub, color }) {
  const [hov, setHov] = useState(false);
  return (
    <div data-testid={`kpi-${label.toLowerCase().replace(/\s/g, '-')}`}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        flex: 1, minWidth: 120, background: '#141A22', borderRadius: 10,
        border: `1px solid ${hov ? 'rgba(232,146,42,0.25)' : 'rgba(232,146,42,0.08)'}`,
        padding: '16px 14px', transition: 'all 0.2s', transform: hov ? 'translateY(-1px)' : 'none',
      }}>
      <div style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, letterSpacing: '.1em', color: '#3A4F5E', textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600, color: color || '#EEE5D6', lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: '#8FA4B2', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function OverviewTab({ data }) {
  if (!data) return <div style={{ padding: 40 }}><Skeleton height={200} /></div>;
  const ov = data.overview;
  const kpis = ov.kpis;
  const topCom = ov.top_commodity;
  const grades = topCom?.grades || [];
  const maxGrade = Math.max(...grades.map(g => g.value), 1);

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div style={{
        borderLeft: '3px solid #E8922A', background: 'rgba(232,146,42,0.04)',
        padding: '12px 16px', borderRadius: '0 10px 10px 0', marginBottom: 16,
        fontSize: 13, fontFamily: "'Barlow', sans-serif", color: '#8FA4B2', lineHeight: 1.7,
      }}>{ov.summary}</div>

      <div data-testid="kpi-cards" style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <KpiCard label="Shipments" value={kpis.total_shipments.toLocaleString()} sub="recorded" color="#EEE5D6" />
        <KpiCard label="Trade Value" value={fmtMoney(kpis.total_trade_value)} sub="total" color="#E8922A" />
        <KpiCard label="Avg Price" value={fmtMoney(kpis.avg_unit_price)} sub="per unit" color="#E8922A" />
        <KpiCard label="Countries" value={kpis.countries_served} sub="served" color="#7FC4D4" />
        <KpiCard label="Commodities" value={kpis.commodities_traded} sub="traded" color="#F4B84A" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ background: '#141A22', borderRadius: 10, padding: 16, border: '1px solid rgba(232,146,42,0.06)' }}>
          <div style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, letterSpacing: '.12em', color: '#3A4F5E', textTransform: 'uppercase', marginBottom: 10 }}>Best Selling Commodity</div>
          <div style={{ fontSize: 22, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600, color: '#E8922A', textTransform: 'uppercase', marginBottom: 8 }}>{topCom?.name || '-'}</div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 9, color: '#3A4F5E', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '.08em' }}>TRADE VALUE</div>
              <div style={{ fontSize: 16, fontFamily: "'Barlow Condensed', sans-serif", color: '#EEE5D6' }}>{fmtMoney(topCom?.trade_value)}</div>
            </div>
            <div>
              <div style={{ fontSize: 9, color: '#3A4F5E', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '.08em' }}>QUANTITY</div>
              <div style={{ fontSize: 16, fontFamily: "'Barlow Condensed', sans-serif", color: '#EEE5D6' }}>{(topCom?.quantity || 0).toLocaleString()}</div>
            </div>
          </div>
          {grades.length > 0 && (
            <>
              <div style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, letterSpacing: '.1em', color: '#3A4F5E', textTransform: 'uppercase', marginBottom: 8 }}>Top Grades</div>
              {grades.map((g, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: '#8FA4B2', minWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.name}</span>
                  <div style={{ flex: 1, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                    <div style={{ width: `${(g.value / maxGrade) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #C4601A, #E8922A)', borderRadius: 2 }} />
                  </div>
                  <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: '#E8922A', minWidth: 60, textAlign: 'right' }}>{fmtMoney(g.value)}</span>
                </div>
              ))}
            </>
          )}
        </div>

        <div style={{ background: '#141A22', borderRadius: 10, padding: 16, border: '1px solid rgba(232,146,42,0.06)' }}>
          <div style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, letterSpacing: '.12em', color: '#3A4F5E', textTransform: 'uppercase', marginBottom: 12 }}>Incoterms Used</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
            {(ov.incoterms || []).map((t, i) => (
              <span key={i} style={{
                padding: '4px 10px', borderRadius: 6, fontSize: 11,
                fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
                background: 'rgba(232,146,42,0.08)', color: '#E8922A',
                border: '1px solid rgba(232,146,42,0.15)',
              }}>{t.term} <span style={{ color: '#3A4F5E', fontWeight: 400 }}>({t.count})</span></span>
            ))}
          </div>

          {ov.why_choose && ov.why_choose.length > 0 && (
            <>
              <div style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, letterSpacing: '.12em', color: '#3A4F5E', textTransform: 'uppercase', marginBottom: 10 }}>Why Choose This Exporter</div>
              {ov.why_choose.map((reason, i) => (
                <div key={i} style={{
                  padding: '8px 12px', borderRadius: 8, marginBottom: 6,
                  background: '#0F1318', border: '1px solid rgba(232,146,42,0.06)',
                  fontSize: 11, fontFamily: "'Barlow', sans-serif", color: '#B8CDD8',
                }}>{reason}</div>
              ))}
            </>
          )}

          {(ov.countries || []).length > 0 && (
            <>
              <div style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, letterSpacing: '.12em', color: '#3A4F5E', textTransform: 'uppercase', marginTop: 16, marginBottom: 8 }}>Top Destinations</div>
              {(ov.countries || []).slice(0, 5).map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0', fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>
                  <span style={{ color: '#8FA4B2' }}>{c.country}</span>
                  <span style={{ color: '#E8922A' }}>{fmtMoney(c.trade_value)}</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StubTab({ name }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 60, animation: 'fadeIn 0.3s ease' }}>
      <div style={{
        width: 64, height: 64, borderRadius: 16, marginBottom: 16,
        background: 'rgba(232,146,42,0.06)', border: '1px solid rgba(232,146,42,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: '#3A4F5E', letterSpacing: '.08em', fontWeight: 700,
      }}>SOON</div>
      <div style={{ fontSize: 14, fontFamily: "'Barlow Condensed', sans-serif", color: '#8FA4B2', marginBottom: 6 }}>{name} data coming soon</div>
      <div style={{ fontSize: 11, color: '#3A4F5E', maxWidth: 280, textAlign: 'center', lineHeight: 1.5 }}>
        This tab will be powered by dedicated backend endpoints currently in development.
      </div>
    </div>
  );
}

const TABS = [
  { id: 'overview', label: 'OVERVIEW' },
  { id: 'logistics', label: 'LOGISTICS' },
  { id: 'pricing', label: 'PRICING' },
  { id: 'network', label: 'NETWORK' },
  { id: 'market', label: 'MARKET' },
];

export default function EntityProfileModal({ name, entityType, onClose }) {
  const [tab, setTab] = useState('overview');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true); setError(null);
    getEntityProfile(name, entityType)
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setError(String(e)); setLoading(false); });
  }, [name, entityType]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const monogram = (name || 'NA').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

  return (
    <div data-testid="entity-profile-modal"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(5,7,9,0.85)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'fadeIn 0.2s ease',
      }}>
      <div style={{
        width: 900, maxWidth: '95vw', maxHeight: '85vh', overflow: 'auto',
        background: 'linear-gradient(160deg, #0F1318 0%, #0A0C0F 100%)',
        border: '1px solid rgba(232,146,42,0.2)', borderRadius: 16,
        animation: 'scaleIn 0.25s ease',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px 16px', display: 'flex', alignItems: 'center', gap: 14,
          borderBottom: '1px solid rgba(232,146,42,0.08)',
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14, flexShrink: 0,
            background: 'linear-gradient(135deg, #C4601A, #E8922A)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, color: '#050709',
          }}>{monogram}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 24, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600, color: '#EEE5D6', textTransform: 'uppercase', lineHeight: 1.2 }}>{name}</div>
            <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, letterSpacing: '.1em', color: '#8FA4B2', marginTop: 2 }}>
              {entityType?.toUpperCase()} PROFILE
            </div>
          </div>
          <button data-testid="export-pdf-btn" onClick={() => window.print()}
            style={{
              padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(232,146,42,0.15)',
              background: 'transparent', color: '#8FA4B2', fontSize: 10,
              fontFamily: "'JetBrains Mono', monospace", cursor: 'pointer',
            }}>Export PDF</button>
          <button data-testid="close-modal-btn" onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(232,146,42,0.1)',
              background: 'transparent', color: '#8FA4B2', fontSize: 16,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>&times;</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, padding: '0 24px', borderBottom: '1px solid rgba(232,146,42,0.06)' }}>
          {TABS.map(t => (
            <button key={t.id} data-testid={`profile-tab-${t.id}`} onClick={() => setTab(t.id)}
              style={{
                padding: '12px 16px', border: 'none', background: 'transparent',
                color: tab === t.id ? '#E8922A' : '#3A4F5E',
                fontSize: 10, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700,
                letterSpacing: '.08em', cursor: 'pointer',
                borderBottom: tab === t.id ? '2px solid #E8922A' : '2px solid transparent',
                transition: 'all 0.15s',
              }}>{t.label}</button>
          ))}
        </div>

        {/* Content */}
        <div style={{ padding: '20px 24px 24px' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Skeleton height={80} /><Skeleton height={60} />
              <div style={{ display: 'flex', gap: 8 }}><Skeleton height={100} /><Skeleton height={100} /><Skeleton height={100} /></div>
            </div>
          ) : error ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#ef4444', fontSize: 13 }}>Failed to load profile: {error}</div>
          ) : tab === 'overview' ? (
            <OverviewTab data={data} />
          ) : (
            <StubTab name={TABS.find(t => t.id === tab)?.label} />
          )}
        </div>
      </div>
    </div>
  );
}
