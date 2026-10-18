/* =====================================================================
   Servidor de la tienda · Angibell creaciones
   ---------------------------------------------------------------------
   - Sirve la tienda (los archivos de la carpeta superior).
   - GET  /api/catalogo     prendas, colores y stock desde PostgreSQL.
   - POST /api/pedidos      guarda el pedido web como cotizaciones (quotes).
   - POST /api/probador     viste la foto del cliente con la prenda elegida
                            con IA (Cloudflare Workers AI o Pollinations); la clave nunca
                            llega al navegador.
   - GET  /api/probador/cupo cuantas pruebas le quedan hoy a esta IP.

   Limite: PRUEBAS_POR_DIA (2) pruebas por IP y por dia, con la fecha de
   Lima. Solo se descuenta una prueba cuando la IA devuelve la imagen.

   Node 18+. Una vez: npm install (en server/).  ->  node server/server.js
   ===================================================================== */

'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { Pool } = require('pg');
const db = require('./db');
const { buildPrompt, zonaDe } = require('./prompt');

/* ---------- configuracion (.env junto a este archivo) ---------- */
require('./env').loadEnv();

const CFG = {
  port: Number(process.env.PORT) || 8080,
  // proveedor del probador: cloudflare (Workers AI) | pollinations
  provider: (process.env.IA_PROVEEDOR || 'cloudflare').toLowerCase(),
  cfAccount: process.env.CF_ACCOUNT_ID || '',
  cfToken: process.env.CF_API_TOKEN || '',
  // flux-2-klein-4b: el modelo de edicion mas liviano de Workers AI (~150 neuronas por imagen)
  cfModel: process.env.CF_MODEL || '@cf/black-forest-labs/flux-2-klein-4b',
  cfSteps: Number(process.env.CF_STEPS) || 0,        // 0 = el modelo decide (klein es destilado)
  pollKey: process.env.POLLINATIONS_API_KEY || '',
  pollModel: process.env.POLLINATIONS_MODEL || 'black-forest-labs/flux.2-klein-4b',
  quality: process.env.POLLINATIONS_QUALITY || 'high',
  perDay: Number(process.env.PRUEBAS_POR_DIA) || 2,
  timeZone: process.env.ZONA_HORARIA || 'America/Lima',
  // detras de un proxy (Render, Railway, Nginx...) la IP real viene en X-Forwarded-For
  trustProxy: process.env.TRUST_PROXY === '1',
  maxBytes: 8 * 1024 * 1024,
  timeoutMs: 120000
};

const ROOT = path.resolve(__dirname, '..');
const DATA_FILE = path.join(__dirname, 'data', 'cupos.json');
// *_API_BASE solo para pruebas locales (un servicio simulado); en produccion no se definen
const POLL_API = process.env.POLLINATIONS_API_BASE || 'https://gen.pollinations.ai';
const CF_API = process.env.CF_API_BASE || 'https://api.cloudflare.com/client/v4';
const IA_OK = () => (CFG.provider === 'pollinations' ? !!CFG.pollKey : !!(CFG.cfAccount && CFG.cfToken));
const IA_MODEL = () => (CFG.provider === 'pollinations' ? CFG.pollModel : CFG.cfModel);

/* ---------- PostgreSQL (DATABASE_URL); sin ella el catalogo responde 503 ---------- */
// DATABASE_URL=memoria: PostgreSQL en memoria (pg-mem) con ../db/schema.sql y seed.sql,
// para demos sin instalar Postgres. Los pedidos se pierden al reiniciar.
function memoryPool() {
  const { newDb } = require('pg-mem');
  const mem = newDb();
  for (const f of ['schema.sql', 'seed.sql']) mem.public.none(fs.readFileSync(path.join(__dirname, '..', 'db', f), 'utf8'));
  const { Pool: MemPool } = mem.adapters.createPg();
  console.log('Base de datos EN MEMORIA (demo): los pedidos se borran al reiniciar.');
  return new MemPool();
}
const pool = process.env.DATABASE_URL === 'memoria' ? memoryPool()
  : process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.PGSSL === '1' ? { rejectUnauthorized: false } : undefined,
      max: 5
    })
  : null;
if (pool) pool.on('error', (e) => console.error('[db]', e.message));

/* ===================== cupo diario por IP ===================== */
/* { "2026-10-17": { "203.0.113.5": 1 } } — solo se guarda el dia actual. */
let cupos = {};
try { cupos = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch (e) { cupos = {}; }
const pending = new Map();   // pruebas en curso por IP: cuentan para no pasar el limite en paralelo

function today() {
  return new Date().toLocaleDateString('en-CA', { timeZone: CFG.timeZone });   // AAAA-MM-DD
}
function saveCupos() {
  const d = today();
  cupos = { [d]: cupos[d] || {} };
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(cupos));
}
function used(ip) { return (cupos[today()] || {})[ip] || 0; }
function remaining(ip) { return Math.max(0, CFG.perDay - used(ip) - (pending.get(ip) || 0)); }
function consume(ip) {
  const d = today();
  cupos[d] = cupos[d] || {};
  cupos[d][ip] = (cupos[d][ip] || 0) + 1;
  saveCupos();
}
/* hora (en la zona de la tienda) en que vuelve el cupo: la medianoche siguiente */
function resetInfo() {
  return { reinicia: 'mañana a las 00:00 (hora de Lima)', fecha: today() };
}

function clientIp(req) {
  let ip = req.socket.remoteAddress || '';
  if (CFG.trustProxy && req.headers['x-forwarded-for']) {
    ip = String(req.headers['x-forwarded-for']).split(',')[0].trim();
  }
  return ip.replace(/^::ffff:/, '');
}

/* ===================== Pollinations ===================== */
/* Edicion de imagen compatible con OpenAI: POST /v1/images/edits con JSON
   { model, prompt, image: [{ image_url }, ...], size, response_format }.
   image 1 = la foto del cliente (data URI: no se aloja en ningun lado),
   image 2 = la foto de la prenda en el color elegido (URL de Pexels).
   Requiere una clave secreta sk_ (https://enter.pollinations.ai/keys). */
const PEXELS_ID = /^\d{3,12}$/;
const OUT_LONG = 1024;     // lado mayor de la imagen generada

/* Foto de la prenda para la IA, recortada SIN la cara del modelo: si la IA ve
   una cara grande en la referencia, la copia en lugar de la del cliente. Pexels
   (imgix) recorta con crop=focalpoint; fp-y = altura del centro del recorte. */
function garmentUrl(id, zona) {
  const base = `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb`;
  if (zona === 'cabeza') return base + '&w=512&h=512&fit=max';                                    // la vincha va en la cabeza
  if (zona === 'calzado') return base + '&w=512&h=384&fit=crop&crop=focalpoint&fp-y=0.9';          // solo los pies
  if (zona === 'piernas') return base + '&w=512&h=448&fit=crop&crop=focalpoint&fp-y=0.82';         // piernas
  return base + '&w=512&h=448&fit=crop&crop=focalpoint&fp-y=0.72';                                // del cuello hacia abajo
}

// el prompt (papel de cada imagen, complexion, pose, color, material) vive en prompt.js

/* tamano de salida con la forma de la foto del cliente, en multiplos de 16 */
function outputSize(w, h) {
  w = Number(w) || 3; h = Number(h) || 4;
  const sc = OUT_LONG / Math.max(w, h);
  const r16 = (n) => Math.max(256, Math.round((n * sc) / 16) * 16);
  return { width: r16(w), height: r16(h) };
}

function mimeOf(b64) {
  return b64.startsWith('iVBOR') ? 'image/png' : b64.startsWith('UklGR') ? 'image/webp' : 'image/jpeg';
}

async function callPollinations(photoDataUri, garmentHref, prompt, size) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), CFG.timeoutMs);
  try {
    const r = await fetch(`${POLL_API}/v1/images/edits`, {
      method: 'POST',
      signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${CFG.pollKey}` },
      body: JSON.stringify({
        model: CFG.pollModel,
        prompt,
        image: [{ image_url: photoDataUri }, { image_url: garmentHref }],
        size: `${size.width}x${size.height}`,
        quality: CFG.quality,
        n: 1,
        response_format: 'b64_json'
      })
    });
    const body = await r.json().catch(() => ({}));
    if (!r.ok) {
      const err = body.error || {};
      const msg = (typeof err === 'string' ? err : err.message) || body.message || `HTTP ${r.status}`;
      console.error('[pollinations]', r.status, String(msg).slice(0, 300));
      if (r.status === 401 || r.status === 403) {
        console.error('[pollinations] Revisa POLLINATIONS_API_KEY (clave secreta sk_) en server/.env');
        throw httpError(503, 'El probador con IA no está disponible en este momento. Intenta más tarde.');
      }
      if (r.status === 402 || r.status === 429) {
        console.error('[pollinations] Sin saldo (pollen) o limite de uso de la cuenta: revisa https://enter.pollinations.ai');
        throw httpError(503, 'El probador con IA no está disponible en este momento. Intenta más tarde.');
      }
      throw httpError(502, 'El servicio de IA no pudo generar la imagen. Intenta con otra foto.');
    }
    const item = (body.data || [])[0] || {};
    let b64 = typeof item.b64_json === 'string' ? item.b64_json : null;
    if (!b64 && item.url) {
      // por si el modelo devuelve una URL guardada en vez de base64
      const ir = await fetch(item.url, { signal: ctrl.signal });
      if (ir.ok) b64 = Buffer.from(await ir.arrayBuffer()).toString('base64');
    }
    if (!b64 || b64.length < 100) {
      console.error('[pollinations] respuesta sin imagen:', JSON.stringify(body).slice(0, 300));
      throw httpError(422, 'La IA no devolvió una imagen para esta foto. Prueba con otra foto de cuerpo entero.');
    }
    return { mime: item.media_type || mimeOf(b64), data: b64 };
  } catch (e) {
    if (e.name === 'AbortError') throw httpError(504, 'La IA tardó demasiado. Intenta de nuevo.');
    if (!e.status) {
      console.error('[pollinations] sin conexion:', e.cause ? e.cause.message : e.message);
      throw httpError(502, 'No pudimos conectar con el servicio de IA. Intenta en unos minutos.');
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

/* ===================== Cloudflare Workers AI ===================== */
/* FLUX.2 por la API REST: POST /accounts/{id}/ai/run/{modelo} con
   multipart/form-data: prompt, input_image_0 (cliente), input_image_1 (prenda),
   width, height. La salida llega en result.image (base64). */
async function callWorkersAI(photoDataUri, garmentHref, prompt, size) {
  const m = /^data:([^;]+);base64,(.*)$/.exec(photoDataUri);
  const photo = new Blob([Buffer.from(m[2], 'base64')], { type: m[1] });
  const gr = await fetch(garmentHref);   // ya viene a 512 px y sin la cara del modelo
  if (!gr.ok) throw httpError(502, 'No se pudo obtener la foto de la prenda.');
  const garment = new Blob([await gr.arrayBuffer()], { type: 'image/jpeg' });

  const form = new FormData();
  form.append('prompt', prompt);
  form.append('input_image_0', photo, 'cliente.jpg');
  form.append('input_image_1', garment, 'prenda.jpg');
  form.append('width', String(size.width));
  form.append('height', String(size.height));
  if (CFG.cfSteps) form.append('steps', String(CFG.cfSteps));

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), CFG.timeoutMs);
  try {
    const r = await fetch(`${CF_API}/accounts/${CFG.cfAccount}/ai/run/${CFG.cfModel}`, {
      method: 'POST', signal: ctrl.signal,
      headers: { Authorization: `Bearer ${CFG.cfToken}` },
      body: form
    });
    const body = await r.json().catch(() => ({}));
    if (!r.ok || body.success === false) {
      const err = (body.errors && body.errors[0]) || {};
      const msg = err.message || `HTTP ${r.status}`;
      console.error('[workers-ai]', r.status, err.code || '', msg);
      // 3030 = el filtro de seguridad de Cloudflare bloqueo la imagen generada
      if (err.code === 3030 || /flagged/i.test(msg)) {
        const e = httpError(422, 'Los filtros de seguridad de la IA bloquearon esta imagen. Prueba con otra foto: ' +
          'de frente, de cuerpo entero, con ropa puesta, buena luz y sin otras personas.');
        e.flagged = true;
        throw e;
      }
      if (r.status === 401 || r.status === 403) {
        console.error('[workers-ai] Revisa CF_ACCOUNT_ID y CF_API_TOKEN (permiso "Workers AI" de esa cuenta) en server/.env');
        throw httpError(503, 'El probador con IA no está disponible en este momento. Intenta más tarde.');
      }
      if (r.status === 429 || /daily|allocation|neurons/i.test(msg)) {
        console.error('[workers-ai] Se agoto la cuota diaria de Workers AI (plan gratuito: 10 000 neuronas al dia).');
        throw httpError(503, 'El probador con IA no está disponible en este momento. Intenta más tarde.');
      }
      throw httpError(502, 'El servicio de IA no pudo generar la imagen. Intenta con otra foto.');
    }
    const result = body.result || body;
    const b64 = typeof result.image === 'string' ? result.image : null;
    if (!b64 || b64.length < 100) {
      console.error('[workers-ai] respuesta sin imagen:', JSON.stringify(body).slice(0, 300));
      throw httpError(422, 'La IA no devolvió una imagen para esta foto. Prueba con otra foto de cuerpo entero.');
    }
    return { mime: mimeOf(b64), data: b64 };
  } catch (e) {
    if (e.name === 'AbortError') throw httpError(504, 'La IA tardó demasiado. Intenta de nuevo.');
    if (!e.status) {
      console.error('[workers-ai] sin conexion:', e.cause ? e.cause.message : e.message);
      throw httpError(502, 'No pudimos conectar con el servicio de IA. Intenta en unos minutos.');
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

/* ===================== HTTP ===================== */
function httpError(status, message) { const e = new Error(message); e.status = status; return e; }

function send(res, status, obj, extra) {
  res.writeHead(status, Object.assign({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }, extra));
  res.end(JSON.stringify(obj));
}

function readJson(req) {
  return new Promise((ok, fail) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > CFG.maxBytes * 1.4) { fail(httpError(413, 'La foto es demasiado grande.')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      try { ok(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); }
      catch (e) { fail(httpError(400, 'Solicitud inválida.')); }
    });
    req.on('error', fail);
  });
}

async function handleTryOn(req, res) {
  const ip = clientIp(req);
  if (!IA_OK()) return send(res, 503, { error: 'Falta configurar el proveedor de IA en el servidor.' });
  if (remaining(ip) <= 0) {
    return send(res, 429, Object.assign({
      error: `Ya usaste tus ${CFG.perDay} pruebas con IA de hoy. Vuelve mañana para probar más prendas.`,
      limite: CFG.perDay, restantes: 0
    }, resetInfo()));
  }

  const b = await readJson(req);
  const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(b.foto || '');
  if (!m) throw httpError(400, 'Sube una foto JPG, PNG o WEBP.');
  if (m[2].length * 0.75 > CFG.maxBytes) throw httpError(413, 'La foto es demasiado grande.');
  if (!PEXELS_ID.test(String(b.prendaFoto || ''))) throw httpError(400, 'Prenda no válida.');

  pending.set(ip, (pending.get(ip) || 0) + 1);      // reserva el cupo mientras se genera
  try {
    // prenda, color (hex), tipo y material salen de la base; sin base, de lo que mando la pagina
    let info = null;
    if (pool) {
      info = await db.prendaParaPrueba(pool, b.prendaFoto);
      if (!info) throw httpError(400, 'Prenda no válida.');
    } else {
      info = {
        prenda: String(b.prenda || '').slice(0, 120),
        color: String(b.color || '').slice(0, 40),
        tipo: String(b.tipo || '').slice(0, 30)
      };
    }
    const generar = CFG.provider === 'pollinations' ? callPollinations : callWorkersAI;
    const args = [b.foto, garmentUrl(b.prendaFoto, zonaDe(info.tipo, info.prenda)), buildPrompt(info), outputSize(b.ancho, b.alto)];
    let img;
    try {
      img = await generar(...args);
    } catch (e) {
      // si el filtro de seguridad bloqueo el resultado se intenta una vez mas: cada
      // generacion sale distinta y la segunda suele pasar (cuesta ~150 neuronas)
      if (!e.flagged) throw e;
      console.warn(`[probador] bloqueado por el filtro de seguridad (${info.prenda} · ${info.color || '-'} · zona ${zonaDe(info.tipo, info.prenda)}); reintentando una vez`);
      img = await generar(...args);
    }
    consume(ip);                                       // solo cuenta si hubo imagen
    send(res, 200, {
      imagen: `data:${img.mime};base64,${img.data}`,
      limite: CFG.perDay,
      restantes: Math.max(0, CFG.perDay - used(ip) - ((pending.get(ip) || 1) - 1))
    });
  } finally {
    const n = (pending.get(ip) || 1) - 1;
    if (n > 0) pending.set(ip, n); else pending.delete(ip);
  }
}

/* ---------- archivos de la tienda ---------- */
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp',
  '.woff2': 'font/woff2', '.md': 'text/plain; charset=utf-8'
};

function serveStatic(req, res) {
  let rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (rel === '/') rel = '/Angibellcreaciones.html';
  const file = path.resolve(ROOT, '.' + rel);
  // nada fuera de la tienda, ni el servidor (su .env y los cupos), ni archivos ocultos
  if (!file.startsWith(ROOT + path.sep) || file.startsWith(__dirname + path.sep) || /(^|[\\/])\./.test(path.relative(ROOT, file))) {
    res.writeHead(404); return res.end('No encontrado');
  }
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404); return res.end('No encontrado'); }
    const ext = path.extname(file).toLowerCase();
    // los CSS guardados de la tienda no tienen extension (css, css(1))
    const type = TYPES[ext] || (/[\\/]css(\(\d\))?$/.test(file) ? 'text/css; charset=utf-8' : 'application/octet-stream');
    res.writeHead(200, { 'Content-Type': type, 'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=300' });
    fs.createReadStream(file).pipe(res);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://x');
    if (url.pathname === '/api/probador/cupo' && req.method === 'GET') {
      const ip = clientIp(req);
      return send(res, 200, Object.assign({ limite: CFG.perDay, restantes: remaining(ip), ia: IA_OK() }, resetInfo()));
    }
    if (url.pathname === '/api/probador' && req.method === 'POST') return await handleTryOn(req, res);
    if (url.pathname === '/api/catalogo' && req.method === 'GET') {
      if (!pool) return send(res, 503, { error: 'Falta configurar DATABASE_URL en el servidor.' });
      return send(res, 200, await db.catalogo(pool), { 'Cache-Control': 'no-cache' });
    }
    if (url.pathname === '/api/pedidos' && req.method === 'POST') {
      if (!pool) return send(res, 503, { error: 'Falta configurar DATABASE_URL en el servidor.' });
      return send(res, 201, await db.registrarPedido(pool, await readJson(req)));
    }
    if (url.pathname.startsWith('/api/')) return send(res, 404, { error: 'No encontrado' });
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end(); }
    serveStatic(req, res);
  } catch (e) {
    if (!e.status) console.error(e);
    if (!res.headersSent) send(res, e.status || 500, { error: e.status ? e.message : 'Error interno del servidor.' });
  }
});

server.listen(CFG.port, () => {
  console.log(`Angibell · tienda y probador IA en http://localhost:${CFG.port}`);
  console.log(`IA: ${CFG.provider} · modelo ${IA_MODEL()} · ${CFG.perDay} pruebas por IP al día · zona ${CFG.timeZone}`);
  if (!IA_OK()) console.warn(CFG.provider === 'pollinations'
    ? 'AVISO: falta POLLINATIONS_API_KEY en server/.env; el probador responderá 503.'
    : 'AVISO: faltan CF_ACCOUNT_ID / CF_API_TOKEN en server/.env; el probador responderá 503.');
  if (!pool) console.warn('AVISO: falta DATABASE_URL en server/.env; el catálogo y los pedidos responderán 503.');
  else pool.query('SELECT count(*)::int AS n FROM products WHERE store_key IS NOT NULL')
    .then((r) => console.log(`Base de datos: ${r.rows[0].n} prendas de la tienda.`))
    .catch((e) => console.error('[db] no se pudo conectar:', e.message, '— ¿corriste npm run db:init?'));
});
