// api/registros.js
// Vercel Serverless Function
// Returns all registrations — only accessible from /entrada.html (door team)

import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get all registrations from KV hash
  const raw = await kv.hgetall('registros');

  if (!raw) {
    return res.status(200).json([]);
  }

  // Parse each value (stored as JSON string)
  const lista = Object.values(raw).map(v => {
    try { return typeof v === 'string' ? JSON.parse(v) : v; }
    catch { return null; }
  }).filter(Boolean);

  // Sort: pending first, then by registration time desc
  lista.sort((a, b) => a.entrada - b.entrada || new Date(b.ts) - new Date(a.ts));

  return res.status(200).json(lista);
}
