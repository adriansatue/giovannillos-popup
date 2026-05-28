// api/admin-pedidos.js
// Admin endpoint for listing and cleaning bot orders.
// Protected by x-admin-secret header.
//
// GET  /api/admin-pedidos              → lista todos los pedidos
// GET  /api/admin-pedidos?solo=bots    → lista solo los pedidos sin clave_id (bots)
// DELETE /api/admin-pedidos            → elimina TODOS los pedidos sin clave_id (bots)
// DELETE /api/admin-pedidos?ids=id1,id2 → elimina pedidos específicos por ID

import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  const secret = req.headers['x-admin-secret'];
  if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  const raw = await kv.hgetall('pedidos');
  const todos = raw
    ? Object.entries(raw).map(([id, v]) => {
        const p = typeof v === 'string' ? JSON.parse(v) : v;
        return { id, ...p };
      })
    : [];

  // ── GET ──────────────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    const { solo } = req.query;
    const lista = solo === 'bots'
      ? todos.filter(p => !p.clave_id)
      : todos;

    lista.sort((a, b) => new Date(a.ts) - new Date(b.ts));

    const resumen = lista.map(p => ({
      id:        p.id,
      ts:        p.ts,
      nombre:    p.nombre,
      email:     p.email    || null,
      telefono:  p.telefono || null,
      calle:     p.calle,
      cp:        p.cp,
      poblacion: p.poblacion,
      franja:    p.franja,
      carbonara: p.carbonara,
      seisquesos:p.seisquesos,
      total:     p.total,
      estado:    p.estado,
      clave_id:  p.clave_id || null,
    }));

    return res.status(200).json({
      total:  resumen.length,
      bots:   todos.filter(p => !p.clave_id).length,
      reales: todos.filter(p =>  p.clave_id).length,
      pedidos: resumen,
    });
  }

  // ── DELETE ───────────────────────────────────────────────────────────────
  if (req.method === 'DELETE') {
    const { ids } = req.query;

    let aEliminar;
    if (ids) {
      // Delete specific IDs
      aEliminar = ids.split(',').map(s => s.trim()).filter(Boolean);
    } else {
      // Delete all without clave_id (bots)
      aEliminar = todos.filter(p => !p.clave_id).map(p => p.id);
    }

    if (aEliminar.length === 0) {
      return res.status(200).json({ ok: true, eliminados: 0, mensaje: 'Nada que eliminar' });
    }

    await kv.hdel('pedidos', ...aEliminar);
    return res.status(200).json({ ok: true, eliminados: aEliminar.length });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
