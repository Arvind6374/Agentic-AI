# Arthashastra Intelligence — PRD

## Original Problem Statement
Complete frontend redesign of "Arthashastra Intelligence" — an AI-powered trade analytics platform for enterprise import/export companies. Three-panel layout, premium dark theme, inline styles, ECharts for charts.

## Architecture
- **Frontend**: React (CRA + craco), pure inline CSS-in-JS, echarts-for-react
- **Backend**: FastAPI + MongoDB (existing) + mock trade intelligence endpoints
- **Color System**: Dark base (#050709), amber (#E8922A), ocean (#4A7A9B), cyan (#7FC4D4), gold (#F4B84A)
- **Typography**: Barlow Condensed (display), Barlow (body), JetBrains Mono (mono)

## Core Requirements (Static)
- Three-panel layout: Left sidebar (240px) + Main panel (flex) + Right sidebar (280px, collapsible)
- Premium agent cards (4 agents, 1 live, 3 coming soon)
- Query input with mode buttons (New Query, Follow-up, Compare)
- Result display with tabs (Table, Chart, SQL, Info)
- Type-aware table formatting (amber for money, cyan for dates, gold for quantities)
- Entity profile modal with 5 tabs (Overview live, 4 stubs)
- Schema browser with search and expandable column lists
- Session management with localStorage persistence
- Skeleton loading states, micro-animations, keyboard shortcuts

## User Personas
- Fortune 500 trade company analysts
- Customs brokers
- Commodity traders
- Import/export data analysts

## What's Been Implemented (Jan 2026)
1. **App.js** — Full 3-panel shell with session management, hero state, chat bubbles, message history
2. **AgentSelector.jsx** — Premium agent card grid with hover effects, LIVE/COMING SOON badges
3. **QueryPanel.jsx** — Bottom-anchored input with agent icon, mode buttons, keyboard shortcuts
4. **ResultPanel.jsx** — Full result display with table/chart/SQL/info tabs, type-aware formatting, entity click handlers, data quality flags as inline pills, pagination
5. **SchemaPanel.jsx** — Collapsible schema browser with search, expandable tables, typed column badges
6. **EntityProfileModal.jsx** — Full overlay with Overview tab (KPIs, summary, grades, incoterms, why choose, destinations), 4 stub tabs
7. **Backend mock endpoints** — /api/schema, /api/query, /api/entity-profile with intelligent query pattern matching
8. **Foundation** — Google Fonts, CSS variables, animation keyframes, utils/api.js, hooks

## Testing Results
- Backend: 100% (26 API tests passed)
- Frontend: 98% (all core features working)
- Integration: 100%
- Overall: 99%

## Prioritized Backlog
### P0 (Critical)
- None remaining

### P1 (Important)
- Wire entity profile tabs 2-5 (Logistics, Pricing, Network, Market) to real backend endpoints
- Responsive breakpoints: Tablet (768-1280px) and Mobile (<768px)
- Connect to real PostgreSQL backend (replace mock endpoints)

### P2 (Enhancement)
- Word reveal animation refinement
- Count-up animation on first page load improvement
- Modal export to PDF with print stylesheet
- WebSocket real-time query progress
- Dark/light theme toggle
- Session export/import

## Next Tasks
1. Implement responsive layout (tablet: right panel collapses to icon strip, mobile: single panel)
2. Wire up real backend API endpoints when available
3. Build out entity profile tabs 2-5 with real backend endpoints
4. Add Cmd+Enter shortcut for running queries from anywhere
