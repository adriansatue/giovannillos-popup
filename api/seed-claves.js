// api/seed-claves.js
// ONE-TIME endpoint: loads the 30 per-user codes into KV.
// Protected by the ADMIN_SECRET env var (send as x-admin-secret header).
//
// Usage:
//   curl -X POST https://<your-domain>/api/seed-claves \
//        -H "x-admin-secret: <ADMIN_SECRET>"
//
// Each code has an 'etiqueta' (label) you can rename to the real user's name
// by calling this endpoint again or editing directly in the Vercel KV dashboard.

import { kv } from '@vercel/kv';

const CLAVES = [
  { codigo: 'GVLL-2AKR', etiqueta: 'Usuario 01' },
  { codigo: 'GVLL-3BLS', etiqueta: 'Usuario 02' },
  { codigo: 'GVLL-4CMT', etiqueta: 'Usuario 03' },
  { codigo: 'GVLL-5DNU', etiqueta: 'Usuario 04' },
  { codigo: 'GVLL-6EPV', etiqueta: 'Usuario 05' },
  { codigo: 'GVLL-7FQW', etiqueta: 'Usuario 06' },
  { codigo: 'GVLL-8GRX', etiqueta: 'Usuario 07' },
  { codigo: 'GVLL-9HSY', etiqueta: 'Usuario 08' },
  { codigo: 'GVLL-AJTZ', etiqueta: 'Usuario 09' },
  { codigo: 'GVLL-BKUA', etiqueta: 'Usuario 10' },
  { codigo: 'GVLL-CLVB', etiqueta: 'Usuario 11' },
  { codigo: 'GVLL-DMWC', etiqueta: 'Usuario 12' },
  { codigo: 'GVLL-ENXD', etiqueta: 'Usuario 13' },
  { codigo: 'GVLL-FPYE', etiqueta: 'Usuario 14' },
  { codigo: 'GVLL-GQZF', etiqueta: 'Usuario 15' },
  { codigo: 'GVLL-HR2G', etiqueta: 'Usuario 16' },
  { codigo: 'GVLL-JS3H', etiqueta: 'Usuario 17' },
  { codigo: 'GVLL-KT4J', etiqueta: 'Usuario 18' },
  { codigo: 'GVLL-LU5K', etiqueta: 'Usuario 19' },
  { codigo: 'GVLL-MV6L', etiqueta: 'Usuario 20' },
  { codigo: 'GVLL-NW7M', etiqueta: 'Usuario 21' },
  { codigo: 'GVLL-PX8N', etiqueta: 'Usuario 22' },
  { codigo: 'GVLL-QY9P', etiqueta: 'Usuario 23' },
  { codigo: 'GVLL-RZAQ', etiqueta: 'Usuario 24' },
  { codigo: 'GVLL-S2BR', etiqueta: 'Usuario 25' },
  { codigo: 'GVLL-T3CS', etiqueta: 'Usuario 26' },
  { codigo: 'GVLL-U4DT', etiqueta: 'Usuario 27' },
  { codigo: 'GVLL-V5EU', etiqueta: 'Usuario 28' },
  { codigo: 'GVLL-W6FV', etiqueta: 'Usuario 29' },
  { codigo: 'GVLL-X7GW', etiqueta: 'Usuario 30' },
];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secret = req.headers['x-admin-secret'];
  if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  const entries = {};
  for (const { codigo, etiqueta } of CLAVES) {
    // Only seed codes that don't exist yet (preserves existing usage data)
    const existing = await kv.hget('claves', codigo);
    if (!existing) {
      entries[codigo] = JSON.stringify({
        etiqueta,
        usos:          0,
        primer_uso:    null,
        primer_nombre: null,
      });
    }
  }

  if (Object.keys(entries).length > 0) {
    await kv.hset('claves', entries);
  }

  return res.status(200).json({
    ok:      true,
    seeded:  Object.keys(entries).length,
    skipped: CLAVES.length - Object.keys(entries).length,
  });
}
