// api/claves.js
// Admin endpoint: lists all per-user codes and their usage stats.
// Protected by the ADMIN_SECRET env var (send as x-admin-secret header).
//
// Usage:
//   curl https://<your-domain>/api/claves \
//        -H "x-admin-secret: <ADMIN_SECRET>"

import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secret = req.headers['x-admin-secret'];
  if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  const raw = await kv.hgetall('claves');
  if (!raw) return res.status(200).json([]);

  const lista = Object.entries(raw).map(([codigo, v]) => {
    const data = typeof v === 'string' ? JSON.parse(v) : v;
    return { codigo, ...data };
  });

  // Sort by label
  lista.sort((a, b) => a.etiqueta.localeCompare(b.etiqueta));

  return res.status(200).json(lista);
}
