export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function devLogin() {
  const res = await fetch(`${API_BASE}/auth/dev-login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({}) });
  const data = (await res.json()) as { token: string };
  return data.token;
}

export async function getLeads(token: string) {
  const res = await fetch(`${API_BASE}/leads`, { headers: { Authorization: `Bearer ${token}` } });
  return (await res.json()) as any[];
}

export async function createLead(token: string) {
  const res = await fetch(`${API_BASE}/leads`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ status: 'NEW' }),
  });
  return await res.json();
}

export async function createBid(token: string, leadId: string) {
  const res = await fetch(`${API_BASE}/ai/bid`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      leadId,
      sqft: 1200,
      rooms: 4,
      daysTarget: 7,
      tier: 'STANDARD',
    }),
  });
  return await res.json();
}
