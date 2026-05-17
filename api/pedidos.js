// api/pedidos.js
// Returns all product-sample orders stored in KV.

import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const raw = await kv.hgetall('pedidos');
  if (!raw) return res.status(200).json([]);

  const lista = Object.values(raw).map(v => {
    try { return typeof v === 'string' ? JSON.parse(v) : v; }
    catch { return null; }
  }).filter(Boolean);

  // Sort by delivery time ascending (soonest first)
  lista.sort((a, b) => new Date(a.franja) - new Date(b.franja));

  return res.status(200).json(lista);
}
