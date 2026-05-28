// api/check-clave.js
// Validates the order-page password. Returns 200 on success, 401 on failure.
// Does NOT reveal the password in the response.

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { clave } = req.body || {};

  const expected = process.env.ORDER_PASSWORD;
  if (!expected) {
    // If the env var is missing, fail closed — no orders allowed
    return res.status(503).json({ error: 'Servicio no disponible' });
  }

  if (!clave || clave !== expected) {
    return res.status(401).json({ error: 'Contraseña incorrecta' });
  }

  return res.status(200).json({ ok: true });
}
