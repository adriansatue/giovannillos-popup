// api/pedidos.js
// Returns all product-sample orders stored in KV.

import { kv } from '@vercel/kv';

function checkSession(req) {
  const tok = req.headers['x-session'];
  return tok && process.env.ADMIN_PW_HASH && tok === process.env.ADMIN_PW_HASH;
}

// hgetall fails when the hash exceeds Upstash's 10 MB per-request limit.
// hscan fetches in pages of 200 fields and is safe for any size.
async function hgetallPaginated(key) {
  let cursor = 0;
  const result = {};
  do {
    const [next, entries] = await kv.hscan(key, cursor, { count: 200 });
    if (entries && typeof entries === 'object') Object.assign(result, entries);
    cursor = next;
  } while (cursor !== 0);
  return Object.keys(result).length > 0 ? result : null;
}

export default async function handler(req, res) {
  if (!checkSession(req)) return res.status(401).json({ error: 'No autorizado' });

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const raw = await hgetallPaginated('pedidos');
  if (!raw) return res.status(200).json([]);

  const lista = Object.values(raw).map(v => {
    try { return typeof v === 'string' ? JSON.parse(v) : v; }
    catch { return null; }
  }).filter(Boolean);

  // Sort by delivery time ascending (soonest first)
  lista.sort((a, b) => new Date(a.franja) - new Date(b.franja));

  return res.status(200).json(lista);
}
