const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export async function queryAPI(question, sessionId) {
  const res = await fetch(`${API}/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, session_id: sessionId }),
  });
  if (!res.ok) throw new Error(`Query failed: ${res.status}`);
  return res.json();
}

export async function fetchAllRows(sql, sessionId) {
  const res = await fetch(`${API}/query/all`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sql, session_id: sessionId }),
  });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  return res.json();
}

export async function getSchema() {
  const res = await fetch(`${API}/schema`);
  if (!res.ok) throw new Error(`Schema failed: ${res.status}`);
  return res.json();
}

export async function getEntityProfile(name, type) {
  const params = new URLSearchParams({ name, type });
  const res = await fetch(`${API}/entity-profile?${params}`);
  if (!res.ok) throw new Error(`Profile failed: ${res.status}`);
  return res.json();
}
