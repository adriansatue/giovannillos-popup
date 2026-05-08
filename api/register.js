// api/register.js
// Vercel Serverless Function
// Uses Vercel KV (Redis) as the database — zero config needed after linking KV store

import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { nombre, cp, email } = req.body || {};

  // Basic validation
  if (!nombre || !cp || !email) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }
  if (nombre.trim().split(' ').filter(Boolean).length < 2) {
    return res.status(400).json({ error: 'Nombre completo requerido' });
  }
  if (!/^\d{5}$/.test(cp)) {
    return res.status(400).json({ error: 'Código postal inválido' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Email inválido' });
  }

  const emailKey = email.toLowerCase().trim();

  // Check if already registered
  const exists = await kv.hget('registros', emailKey);
  if (exists) {
    // Return OK silently (idempotent) — same person scanning twice
    return res.status(200).json({ ok: true, nuevo: false });
  }

  // Save registration
  const registro = {
    nombre: nombre.trim(),
    cp: cp.trim(),
    email: emailKey,
    ts: new Date().toISOString(),
    entrada: false,
    ts_entrada: null
  };

  await kv.hset('registros', { [emailKey]: JSON.stringify(registro) });

  return res.status(200).json({ ok: true, nuevo: true });
}
