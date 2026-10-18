/* =====================================================================
   Base de datos de la tienda (PostgreSQL, esquema de ../db/schema.sql)
   ---------------------------------------------------------------------
   catalogo(pool)          productos + colores + stock por talla y color,
                           en el formato que usa la pagina.
   registrarPedido(pool,o) guarda un pedido web como cotizaciones (quotes):
                           una fila por prenda, en estado 'pending_advisor'
                           hasta que un asesor valide el pago.
   Los precios y el stock salen SIEMPRE de la base, nunca del navegador.
   ===================================================================== */

'use strict';

const PROMO_3X2 = true;   // "Compra 2 y lleva 3": la mas barata de cada grupo de tres es gratis

/* tallas en orden natural: 0, 2, 4 ... 14, luego S, M, Unica */
function sizeOrder(a, b) {
  const na = Number(a), nb = Number(b);
  if (!isNaN(na) && !isNaN(nb)) return na - nb;
  if (!isNaN(na)) return -1;
  if (!isNaN(nb)) return 1;
  const ord = ['XS', 'S', 'M', 'L', 'XL'];
  return (ord.indexOf(a) + 1 || 99) - (ord.indexOf(b) + 1 || 99) || String(a).localeCompare(b);
}

async function catalogo(pool) {
  const [prods, cols, vars] = await Promise.all([
    pool.query(`SELECT id, name, base_price, store_key, category, audience
                  FROM products WHERE active AND store_key IS NOT NULL`),
    pool.query(`SELECT product_id, color, hex, photo_id, position FROM product_colors ORDER BY product_id, position`),
    pool.query(`SELECT product_id, size, color, price, stock FROM product_variants`)
  ]);

  const items = {}, byId = {};
  for (const p of prods.rows) {
    const it = {
      sku: p.id, nombre: p.name, precio: Number(p.base_price),
      tipo: p.category, publico: p.audience,
      colores: [], stock: {}, sizes: {}, precios: {}
    };
    items[p.store_key] = it;
    byId[p.id] = it;
  }
  for (const c of cols.rows) {
    const it = byId[c.product_id];
    if (it) it.colores.push({ nombre: c.color, hex: c.hex, foto: Number(c.photo_id) });
  }
  const sizes = {};
  for (const v of vars.rows) {
    const it = byId[v.product_id];
    if (!it) continue;
    (sizes[v.product_id] = sizes[v.product_id] || new Set()).add(v.size);
    it.stock[v.size] = it.stock[v.size] || {};
    it.stock[v.size][v.color] = Number(v.stock);
    if (v.price != null) it.precios[v.size + '|' + v.color] = Number(v.price);
  }
  for (const id in byId) {
    const it = byId[id];
    // sizes = unidades por talla sumando los colores (para mostrar tallas agotadas)
    for (const s of [...(sizes[id] || [])].sort(sizeOrder)) {
      it.sizes[s] = Object.values(it.stock[s]).reduce((a, n) => a + n, 0);
    }
  }
  return { items, actualizado: new Date().toISOString() };
}

function httpError(status, message) { const e = new Error(message); e.status = status; return e; }

function promoDiscount(lines) {
  if (!PROMO_3X2) return 0;
  const units = [];
  lines.forEach((l) => { for (let k = 0; k < l.qty; k++) units.push(l.price); });
  units.sort((a, b) => a - b);
  return units.slice(0, Math.floor(units.length / 3)).reduce((a, x) => a + x, 0);
}
const round2 = (n) => Math.round(n * 100) / 100;

/* order = el JSON que arma la pagina (buildOrder): { pedido_id, cliente, prendas[] } */
async function registrarPedido(pool, order) {
  const prendas = Array.isArray(order && order.prendas) ? order.prendas.slice(0, 50) : [];
  const c = (order && order.cliente) || {};
  const nombre = String(c.nombre || '').trim().slice(0, 120);
  const telefono = String(c.telefono || '').replace(/[^\d+]/g, '').slice(0, 20);
  if (!prendas.length) throw httpError(400, 'El pedido no tiene prendas.');
  if (nombre.length < 3 || telefono.length < 9) throw httpError(400, 'Faltan los datos del cliente.');
  const pedidoId = /^PED-[A-Z0-9]{4,20}$/.test(order.pedido_id || '') ? order.pedido_id : 'PED-' + Date.now().toString(36).toUpperCase();

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const lines = [];
    for (const it of prendas) {
      const sku = String(it.sku || ''), size = String(it.talla || ''), color = String(it.color || '');
      const qty = Math.floor(Number(it.cantidad));
      if (!(qty > 0 && qty <= 99)) throw httpError(400, 'Cantidad no válida.');
      const r = await client.query(
        `SELECT p.name, p.base_price, v.price, v.stock
           FROM product_variants v JOIN products p ON p.id = v.product_id
          WHERE v.product_id = $1 AND v.size = $2 AND v.color = $3 AND p.active`,
        [sku, size, color]
      );
      if (!r.rows.length) throw httpError(400, `La prenda ${sku} talla ${size} ${color} ya no existe en el catálogo.`);
      const row = r.rows[0];
      const price = Number(row.price != null ? row.price : row.base_price);
      lines.push({ sku, size, color, qty, price, name: row.name, available: Number(row.stock) >= qty });
    }

    const subtotal = round2(lines.reduce((a, l) => a + l.price * l.qty, 0));
    const descuento = round2(promoDiscount(lines));
    const total = round2(subtotal - descuento);
    const entrega = c.entrega === 'delivery'
      ? `Delivery a ${String(c.direccion || '').slice(0, 160)}, ${String(c.ciudad || '').slice(0, 60)}`
      : 'Recojo en tienda';
    const comun = [
      `Pedido web ${pedidoId}`,
      `${entrega}`,
      `Pago: ${String(c.pago || '').slice(0, 40)}`,
      c.correo ? `Correo: ${String(c.correo).slice(0, 120)}` : '',
      descuento ? `Promo 3x2 en el pedido: -S/ ${descuento.toFixed(2)} (total pedido S/ ${total.toFixed(2)})` : `Total pedido S/ ${total.toFixed(2)}`,
      c.notas ? `Notas: ${String(c.notas).slice(0, 500)}` : ''
    ].filter(Boolean).join(' · ');

    const ids = [];
    for (const l of lines) {
      const summary = `${l.qty} x ${l.name} · talla ${l.size} · ${l.color}` +
        (l.available ? '' : ' · SIN STOCK SUFICIENTE') + ' · ' + comun;
      const r = await client.query(
        `INSERT INTO quotes (channel, customer_id, customer_name, product_id, size, color,
                             quantity, unit_price, total, available, summary)
         VALUES ('web', $1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
        [telefono, nombre, l.sku, l.size, l.color, l.qty, l.price, round2(l.price * l.qty), l.available, summary]
      );
      ids.push(r.rows[0].id);
    }
    await client.query('COMMIT');
    return { pedido_id: pedidoId, cotizaciones: ids, subtotal, descuento, total, disponible: lines.every((l) => l.available) };
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}

/* Prenda y color para el probador, a partir del id de su foto de Pexels.
   Asi el color (hex), el tipo y el material salen de la base y solo se
   pueden probar fotos que son del catalogo. */
async function prendaParaPrueba(pool, photoId) {
  const r = await pool.query(
    `SELECT p.name, p.category, p.material, c.color, c.hex
       FROM product_colors c JOIN products p ON p.id = c.product_id
      WHERE c.photo_id = $1 AND p.active`,
    [Number(photoId)]
  );
  if (!r.rows.length) return null;
  const x = r.rows[0];
  return { prenda: x.name, tipo: x.category, material: x.material, color: x.color, hex: x.hex };
}

module.exports = { catalogo, registrarPedido, prendaParaPrueba, sizeOrder };
