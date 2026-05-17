// api/vapid-key.js
// Returns the VAPID public key from env vars (safe to expose — it is a public key)

export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const key = process.env.VAPID_PUBLIC_KEY || '';
  return res.status(200).json({ publicKey: key });
}
