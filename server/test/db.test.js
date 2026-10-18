/* Prueba el esquema, el catalogo y los pedidos contra un PostgreSQL en
   memoria (pg-mem), sin necesitar un servidor de base de datos.  ->  npm test */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { newDb } = require('pg-mem');
const db = require('../db');

(async () => {
  const mem = newDb();
  const sql = (f) => fs.readFileSync(path.join(__dirname, '..', '..', 'db', f), 'utf8');
  mem.public.none(sql('schema.sql'));
  mem.public.none(sql('seed.sql'));
  mem.public.none(sql('seed.sql'));                         // idempotente: dos veces no duplica
  const { Pool } = mem.adapters.createPg();
  const pool = new Pool();

  const cat = await db.catalogo(pool);
  const keys = Object.keys(cat.items);
  assert.equal(keys.length, 18, '18 prendas');
  const terno = cat.items['FL-63E73D38'];
  assert.equal(terno.sku, 'TER-001');
  assert.equal(terno.precio, 250);
  assert.deepEqual(terno.colores.map((c) => c.nombre), ['Azul', 'Negro']);
  assert.equal(terno.colores[0].foto, 34796127);
  assert.deepEqual(Object.keys(terno.sizes), ['0', '2', '4', '6', '8', '10', '12', '14'], 'tallas en orden');
  assert.equal(terno.sizes['4'], 5, 'stock total de la talla 4');
  assert.deepEqual(terno.stock['4'], { Azul: 3, Negro: 2 }, 'stock por color');
  assert.equal(terno.sizes['14'], 0, 'talla agotada');
  assert.ok(keys.every((k) => cat.items[k].colores.length === 2), 'dos colores por prenda');
  console.log('OK catalogo:', keys.length, 'prendas');

  const cliente = { nombre: 'Cliente Prueba', telefono: '987 654 321', entrega: 'recojo', pago: 'Yape / Plin' };
  const r = await db.registrarPedido(pool, {
    pedido_id: 'PED-TEST1', cliente,
    prendas: [
      { sku: 'TER-001', talla: '4', color: 'Azul', cantidad: 1, precio_unitario: 1 },   // precio falso: se ignora
      { sku: 'VES-002', talla: '2', color: 'Rojo', cantidad: 1 },
      { sku: 'ACC-003', talla: 'Unica', color: 'Rosa', cantidad: 1 }
    ]
  });
  assert.equal(r.subtotal, 360, 'precios de la base');           // 250 + 95 + 15
  assert.equal(r.descuento, 15, '3x2: la mas barata gratis');
  assert.equal(r.total, 345);
  assert.equal(r.cotizaciones.length, 3);
  const q = (await pool.query("SELECT * FROM quotes WHERE channel = 'web' ORDER BY id")).rows;
  assert.equal(q.length, 3);
  assert.equal(q[0].status, 'pending_advisor');
  assert.equal(q[0].customer_id, '987654321');
  assert.equal(Number(q[0].unit_price), 250);
  assert.ok(q[0].summary.includes('PED-TEST1') && q[0].summary.includes('Recojo en tienda'));
  console.log('OK pedido:', r.pedido_id, 'total S/', r.total);

  const sinStock = await db.registrarPedido(pool, { cliente, prendas: [{ sku: 'TER-001', talla: '14', color: 'Azul', cantidad: 1 }] });
  assert.equal(sinStock.disponible, false, 'marca la falta de stock para el asesor');

  await assert.rejects(db.registrarPedido(pool, { cliente, prendas: [{ sku: 'NO-EXISTE', talla: '4', color: 'Azul', cantidad: 1 }] }), /ya no existe/);
  await assert.rejects(db.registrarPedido(pool, { cliente: { nombre: 'X' }, prendas: [{ sku: 'TER-001', talla: '4', color: 'Azul', cantidad: 1 }] }), /datos del cliente/);
  assert.equal((await pool.query("SELECT count(*)::int AS n FROM quotes")).rows[0].n, 4, 'los pedidos rechazados no dejan filas');
  console.log('OK validaciones');
  console.log('TODO OK');
})().catch((e) => { console.error('FALLO:', e.message); process.exit(1); });
