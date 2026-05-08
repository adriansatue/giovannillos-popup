// api/validar.js
// Vercel Serverless Function
// Marks a registration as checked-in (entrada: true)

import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body || {};

  if (!email) {
    return res.status(400).json({ error: 'Email requerido' });
  }

  const emailKey = email.toLowerCase().trim();
  const raw = await kv.hget('registros', emailKey);

  if (!raw) {
    return res.status(404).json({ error: 'Registro no encontrado' });
  }

  const registro = typeof raw === 'string' ? JSON.parse(raw) : raw;

  if (registro.entrada) {
    // Already validated — idempotent
    return res.status(200).json({ ok: true, yaValidado: true });
  }

  registro.entrada = true;
  registro.ts_entrada = new Date().toISOString();

  await kv.hset('registros', { [emailKey]: JSON.stringify(registro) });

  return res.status(200).json({ ok: true });
}
