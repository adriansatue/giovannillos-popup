// scripts/listar-pedidos.mjs
// Lists all orders from KV and optionally deletes them by ID.
//
// Usage:
//   node scripts/listar-pedidos.mjs          → list all
//   node scripts/listar-pedidos.mjs --delete id1 id2 id3
//   node scripts/listar-pedidos.mjs --purge-all    ← ⚠ deletes EVERYTHING

import { createClient } from '@vercel/kv';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// ── Load .env.local manually ─────────────────────────────────────────────────
const __dir = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dir, '../.env.local');
for (const line of readFileSync(envPath, 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)="?([^"]*)"?$/);
  if (m) process.env[m[1]] = m[2];
}

const kv = createClient({
  url:   process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

// ── Helpers ──────────────────────────────────────────────────────────────────
const DIAS  = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
const MESES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
function fmt(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${DIAS[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()]}  ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

// ── Main ─────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);

const raw = await kv.hgetall('pedidos');
if (!raw || Object.keys(raw).length === 0) {
  console.log('No hay pedidos en la base de datos.');
  process.exit(0);
}

const pedidos = Object.entries(raw).map(([id, v]) => {
  const p = typeof v === 'string' ? JSON.parse(v) : v;
  return { id, ...p };
}).sort((a, b) => new Date(a.ts) - new Date(b.ts));

// ── DELETE mode ──────────────────────────────────────────────────────────────
if (args.includes('--purge-all')) {
  const ids = pedidos.map(p => p.id);
  await kv.hdel('pedidos', ...ids);
  console.log(`🗑  Eliminados ${ids.length} pedidos.`);
  process.exit(0);
}

if (args.includes('--delete')) {
  const ids = args.slice(args.indexOf('--delete') + 1);
  if (ids.length === 0) { console.error('Especifica los IDs a eliminar.'); process.exit(1); }
  await kv.hdel('pedidos', ...ids);
  console.log(`🗑  Eliminados: ${ids.join(', ')}`);
  process.exit(0);
}

// ── LIST mode ────────────────────────────────────────────────────────────────
const W = 22;
const line = '─'.repeat(100);
console.log('\n📋  PEDIDOS EN BASE DE DATOS\n' + line);
console.log(
  'ID'.padEnd(18) +
  'FECHA'.padEnd(20) +
  'NOMBRE'.padEnd(28) +
  'DIRECCIÓN'.padEnd(30) +
  'PIZZAS  CLAVE'
);
console.log(line);

for (const p of pedidos) {
  const pizzas = [
    p.carbonara  > 0 ? `${p.carbonara}C`  : '',
    p.seisquesos > 0 ? `${p.seisquesos}Q` : '',
  ].filter(Boolean).join('+') || '?';

  console.log(
    p.id.padEnd(18).slice(0,18) +
    fmt(p.ts).padEnd(20) +
    (p.nombre || '').padEnd(28).slice(0,28) +
    `${p.calle || ''}, ${p.cp || ''} ${p.poblacion || ''}`.padEnd(30).slice(0,30) +
    pizzas.padEnd(8) +
    (p.clave_id || 'sin clave')
  );
}

console.log(line);
console.log(`Total: ${pedidos.length} pedidos\n`);
console.log('Para eliminar uno o varios:');
console.log('  node scripts/listar-pedidos.mjs --delete <id1> <id2> ...\n');
