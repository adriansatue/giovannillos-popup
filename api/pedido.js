// api/pedido.js
// Saves a product-sample order to KV and fires web push notifications.
//
// Required Vercel env vars:
//   VAPID_PUBLIC_KEY  — generate with: npx web-push generate-vapid-keys
//   VAPID_PRIVATE_KEY — (same command)
//   VAPID_SUBJECT     — mailto:you@yourdomain.com  (optional, defaults below)

import { kv } from '@vercel/kv';
import webpush from 'web-push';

const DIAS  = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MESES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];

function formatFranja(isoStart) {
  const d = new Date(isoStart);
  return `${DIAS[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()]} · ${d.getHours()}:00–${d.getHours() + 2}:00`;
}

function getPushClient() {
  const pub  = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return null;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:hola@giovannillos.com',
    pub,
    priv
  );
  return webpush;
}

export default async function handler(req, res) {
  try {
    return await _handler(req, res);
  } catch (err) {
    console.error('[/api/pedido] Unhandled error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function _handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { clave, nombre, calle, poblacion, cp, telefono, email, franja, carbonara, seisquesos } = req.body || {};

  // Code check disabled — contraseñas desactivadas temporalmente
  const claveKey = (clave && typeof clave === 'string') ? clave.trim().toUpperCase() : null;
  const claveRecord = null;

  // Required fields
  if (!nombre || !calle || !poblacion || !cp || !franja) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }
  if (nombre.trim().split(' ').filter(Boolean).length < 2) {
    return res.status(400).json({ error: 'Nombre completo requerido' });
  }
  if (!calle.trim() || !poblacion.trim()) {
    return res.status(400).json({ error: 'Dirección requerida' });
  }
  if (!/^\d{5}$/.test(cp.trim())) {
    return res.status(400).json({ error: 'Código postal inválido' });
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({ error: 'Email inválido' });
  }

  // Pizza quantities
  const c = Math.round(Number(carbonara)) || 0;
  const q = Math.round(Number(seisquesos)) || 0;
  const total = c + q;
  if (c < 0 || q < 0 || total < 1 || total > 6) {
    return res.status(400).json({ error: 'Cantidad inválida (mínimo 1, máximo 6 en total)' });
  }

  // Validate franja: must be a valid ISO date at least 24 h in the future
  let startTime;
  try {
    startTime = new Date(franja);
    if (isNaN(startTime.getTime())) throw new Error();
  } catch {
    return res.status(400).json({ error: 'Franja horaria inválida' });
  }
  // Allow 60 s tolerance for clock skew
  const minStart = new Date(Date.now() + 24 * 60 * 60 * 1000 - 60_000);
  const maxStart = new Date(2026, 5, 6, 23, 59, 59); // 6 junio 2026
  if (startTime < minStart) {
    return res.status(400).json({ error: 'La entrega debe solicitarse con al menos 24 h de antelación' });
  }
  if (startTime > maxStart) {
    return res.status(400).json({ error: 'El plazo de pedidos cierra el 6 de junio de 2026' });
  }

  // Persist order
  const id = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
  const pedido = {
    id,
    clave_id:   claveKey,
    nombre:    nombre.trim(),
    calle:     calle.trim(),
    poblacion: poblacion.trim(),
    cp:        cp.trim(),
    telefono:  (telefono || '').trim(),
    email:     (email || '').trim(),
    franja,
    carbonara: c,
    seisquesos: q,
    total,
    ts:     new Date().toISOString(),
    estado: 'pendiente'
  };
  await kv.hset('pedidos', { [id]: JSON.stringify(pedido) });

  // Update code usage stats — skipped (disabled)
  // if (claveKey && claveRecord) { ... }

  // Fire push notifications (best-effort, never fail the request)
  const push = getPushClient();
  if (push) {
    try {
      const rawSubs = await kv.hgetall('push_subs');
      if (rawSubs) {
        const subs = Object.values(rawSubs)
          .map(v => { try { return typeof v === 'string' ? JSON.parse(v) : v; } catch { return null; } })
          .filter(Boolean);

        const payload = JSON.stringify({
          title: '🍕 Nuevo pedido de muestra',
          body: `${pedido.nombre} · ${total} pizza${total > 1 ? 's' : ''} · ${formatFranja(franja)}`
        });

        await Promise.allSettled(
          subs.map(sub =>
            push.sendNotification(sub, payload).catch(async err => {
              // Clean up expired subscriptions automatically
              if (err.statusCode === 410 || err.statusCode === 404) {
                const key = sub.endpoint.slice(-64);
                await kv.hdel('push_subs', key).catch(() => {});
              }
            })
          )
        );
      }
    } catch (err) {
      console.error('Push error:', err);
    }
  }

  return res.status(200).json({ ok: true, id });
}