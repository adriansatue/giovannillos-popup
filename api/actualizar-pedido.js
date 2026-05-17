// api/actualizar-pedido.js
// PATCH the estado of an existing pedido in KV.

import { kv } from '@vercel/kv';

const ESTADOS = ['pendiente', 'confirmado', 'entregado'];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id, estado } = req.body || {};
  if (!id || !estado) return res.status(400).json({ error: 'Missing id or estado' });
  if (!ESTADOS.includes(estado)) return res.status(400).json({ error: 'Invalid estado' });

  const raw = await kv.hget('pedidos', id);
  if (!raw) return res.status(404).json({ error: 'Pedido not found' });

  const pedido = typeof raw === 'string' ? JSON.parse(raw) : raw;
  pedido.estado = estado;
  await kv.hset('pedidos', { [id]: JSON.stringify(pedido) });

  return res.status(200).json({ ok: true });
}
