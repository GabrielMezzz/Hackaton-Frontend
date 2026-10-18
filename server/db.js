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
  const [prods, cols, vars, cloudImgs, cats] = await Promise.all([
    pool.query(`
      SELECT p.id, p.name, p.base_price, p.store_key, p.category, p.audience,
             c.id AS category_id, c.slug AS category_slug, COALESCE(c.name, p.category) AS category_name
        FROM products p
        LEFT JOIN category_products cp ON cp.product_id = p.id
        LEFT JOIN categories c ON c.id = cp.category_id
       WHERE p.active AND p.store_key IS NOT NULL
    `),
    pool.query(`SELECT product_id, color, hex, photo_id, position FROM product_colors ORDER BY product_id, position`),
    pool.query(`SELECT product_id, size, color, price, stock FROM product_variants`),
    pool.query(`SELECT product_id, color, url FROM product_color_images`).catch(() => ({ rows: [] })),
    pool.query(`SELECT id, name, slug, description, image_url FROM categories WHERE active ORDER BY name ASC`).catch(() => ({ rows: [] }))
  ]);

  const imgMap = new Map();
  for (const ci of (cloudImgs && cloudImgs.rows ? cloudImgs.rows : [])) {
    imgMap.set(`${ci.product_id}|${ci.color}`, ci.url);
  }

  const items = {}, byId = {};
  for (const p of prods.rows) {
    const it = {
      sku: p.id, nombre: p.name, precio: Number(p.base_price),
      tipo: p.category_slug || p.category,
      categoria: p.category_name || p.category,
      categoria_id: p.category_id,
      categoria_slug: p.category_slug,
      publico: p.audience,
      colores: [], stock: {}, sizes: {}, precios: {}
    };
    items[p.store_key] = it;
    byId[p.id] = it;
  }
  for (const c of cols.rows) {
    const it = byId[c.product_id];
    const cloudUrl = imgMap.get(`${c.product_id}|${c.color}`);
    if (it) it.colores.push({ nombre: c.color, hex: c.hex, foto: cloudUrl || Number(c.photo_id) });
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
    for (const s of [...(sizes[id] || [])].sort(sizeOrder)) {
      it.sizes[s] = Object.values(it.stock[s]).reduce((a, n) => a + n, 0);
    }
  }
  return {
    items,
    categorias: cats.rows || [],
    actualizado: new Date().toISOString()
  };
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

/* =====================================================================
   Administración de Categorías, Segregación y Productos
   ===================================================================== */

async function listarCategorias(pool) {
  const r = await pool.query(`
    SELECT c.id, c.name, c.slug, c.description, c.image_url, c.active, c.created_at,
           COUNT(cp.product_id)::int AS total_productos
      FROM categories c
      LEFT JOIN category_products cp ON cp.category_id = c.id
     GROUP BY c.id
     ORDER BY c.name ASC
  `);
  return r.rows;
}

async function obtenerCategoria(pool, idOrSlug) {
  const isNum = !isNaN(Number(idOrSlug));
  const r = await pool.query(
    `SELECT id, name, slug, description, image_url, active, created_at
       FROM categories
      WHERE ${isNum ? 'id = $1' : 'slug = $1'}`,
    [isNum ? Number(idOrSlug) : String(idOrSlug)]
  );
  if (!r.rows.length) return null;
  const cat = r.rows[0];
  const prods = await pool.query(
    `SELECT p.id, p.name, p.base_price, p.category, p.audience, p.active, p.store_key,
            (SELECT json_agg(json_build_object(
               'color', pc.color, 'hex', pc.hex, 'photo_id', pc.photo_id,
               'foto', COALESCE(pci.url, pc.photo_id::text)
             ))
               FROM product_colors pc
               LEFT JOIN product_color_images pci ON pci.product_id = pc.product_id AND pci.color = pc.color
              WHERE pc.product_id = p.id) AS colores
       FROM products p
       JOIN category_products cp ON cp.product_id = p.id
      WHERE cp.category_id = $1
      ORDER BY p.name ASC`,
    [cat.id]
  );
  cat.productos = prods.rows;
  return cat;
}

async function guardarCategoria(pool, data) {
  const name = String(data.name || '').trim();
  if (!name) throw httpError(400, 'El nombre de la categoría es obligatorio.');
  const slug = String(data.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')).trim();
  const desc = data.description ? String(data.description).trim() : null;
  const img = data.image_url ? String(data.image_url).trim() : null;
  const active = data.active !== false;

  if (data.id) {
    const r = await pool.query(
      `UPDATE categories
          SET name = $1, slug = $2, description = $3, image_url = $4, active = $5
        WHERE id = $6
        RETURNING *`,
      [name, slug, desc, img, active, Number(data.id)]
    );
    if (!r.rows.length) throw httpError(404, 'Categoría no encontrada.');
    return r.rows[0];
  } else {
    const r = await pool.query(
      `INSERT INTO categories (name, slug, description, image_url, active)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (name) DO UPDATE SET slug = EXCLUDED.slug, description = EXCLUDED.description, image_url = COALESCE(EXCLUDED.image_url, categories.image_url), active = EXCLUDED.active
       RETURNING *`,
      [name, slug, desc, img, active]
    );
    return r.rows[0];
  }
}

async function eliminarCategoria(pool, id) {
  const catId = Number(id);
  await pool.query(`DELETE FROM category_products WHERE category_id = $1`, [catId]);
  const r = await pool.query(`DELETE FROM categories WHERE id = $1 RETURNING id`, [catId]);
  if (!r.rows.length) throw httpError(404, 'Categoría no encontrada.');
  return { id: catId, eliminada: true };
}

async function reasignarProductosCategoria(pool, categoryId, productIds) {
  const catId = Number(categoryId);
  const cat = await pool.query(`SELECT id, name FROM categories WHERE id = $1`, [catId]);
  if (!cat.rows.length) throw httpError(404, 'Categoría no encontrada.');
  const catName = cat.rows[0].name;

  const ids = Array.isArray(productIds) ? productIds.map(String) : [];
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (ids.length > 0) {
      await client.query(`DELETE FROM category_products WHERE product_id = ANY($1::text[])`, [ids]);
      for (const pid of ids) {
        await client.query(
          `INSERT INTO category_products (category_id, product_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [catId, pid]
        );
      }
      await client.query(`UPDATE products SET category = $1 WHERE id = ANY($2::text[])`, [catName, ids]);
    }
    await client.query('COMMIT');
    return { categoryId: catId, actualizados: ids.length };
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}

async function listarProductosAdmin(pool, { categoryId, search } = {}) {
  let query = `
    SELECT p.id, p.name, p.description, p.base_price, p.category,
           p.audience, p.active, p.store_key, p.material,
           c.id AS category_id,
           COALESCE(c.name, p.category) AS category_name,
           (SELECT COALESCE(SUM(v.stock), 0) FROM product_variants v WHERE v.product_id = p.id)::int AS total_stock,
           (SELECT json_agg(json_build_object(
              'color', pc.color, 'hex', pc.hex, 'photo_id', pc.photo_id,
              'foto', COALESCE(pci.url, pc.photo_id::text)
            ))
              FROM product_colors pc
              LEFT JOIN product_color_images pci ON pci.product_id = pc.product_id AND pci.color = pc.color
             WHERE pc.product_id = p.id) AS colores
      FROM products p
      LEFT JOIN category_products cp ON cp.product_id = p.id
      LEFT JOIN categories c ON c.id = cp.category_id
     WHERE 1=1
  `;
  const params = [];
  if (categoryId) {
    params.push(Number(categoryId));
    query += ` AND c.id = $${params.length}`;
  }
  if (search) {
    params.push(`%${search.trim().toLowerCase()}%`);
    query += ` AND (LOWER(p.name) LIKE $${params.length} OR LOWER(p.id) LIKE $${params.length})`;
  }
  query += ` ORDER BY p.name ASC`;
  const r = await pool.query(query, params);
  return r.rows;
}

async function obtenerProductoAdmin(pool, id) {
  const r = await pool.query(
    `SELECT p.id, p.name, p.description, p.base_price, p.category,
            p.audience, p.active, p.store_key, p.material,
            c.id AS category_id,
            COALESCE(c.name, p.category) AS category_name,
            (SELECT json_agg(json_build_object(
               'color', pc.color, 'hex', pc.hex, 'photo_id', pc.photo_id,
               'foto', COALESCE(pci.url, pc.photo_id::text)
             ))
               FROM product_colors pc
               LEFT JOIN product_color_images pci ON pci.product_id = pc.product_id AND pci.color = pc.color
              WHERE pc.product_id = p.id) AS colores,
            (SELECT json_agg(json_build_object('size', pv.size, 'color', pv.color, 'price', pv.price, 'stock', pv.stock))
               FROM product_variants pv WHERE pv.product_id = p.id) AS variantes
       FROM products p
       LEFT JOIN category_products cp ON cp.product_id = p.id
       LEFT JOIN categories c ON c.id = cp.category_id
      WHERE p.id = $1`,
    [String(id)]
  );
  return r.rows[0] || null;
}

async function guardarProductoAdmin(pool, data) {
  const id = String(data.id || '').trim();
  const name = String(data.name || '').trim();
  const price = Number(data.price != null ? data.price : data.base_price);
  if (!id || !name || isNaN(price)) throw httpError(400, 'Faltan datos obligatorios del producto (id, nombre, precio).');

  let categoryId = data.category_id ? Number(data.category_id) : null;
  let categoryName = data.category ? String(data.category).trim() : null;
  if (categoryId && !categoryName) {
    const c = await pool.query('SELECT name FROM categories WHERE id = $1', [categoryId]);
    if (c.rows.length) categoryName = c.rows[0].name;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `INSERT INTO products (id, name, description, base_price, active, store_key, category, audience, material)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          base_price = EXCLUDED.base_price,
          active = EXCLUDED.active,
          category = COALESCE(EXCLUDED.category, products.category),
          audience = COALESCE(EXCLUDED.audience, products.audience),
          material = COALESCE(EXCLUDED.material, products.material)`,
      [
        id, name, data.description || null, price, data.active !== false,
        data.store_key || id, categoryName, data.audience || 'ninos', data.material || null
      ]
    );

    if (categoryId) {
      await client.query(`DELETE FROM category_products WHERE product_id = $1`, [id]);
      await client.query(
        `INSERT INTO category_products (category_id, product_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [categoryId, id]
      );
    }

    if (Array.isArray(data.colors)) {
      for (let pos = 0; pos < data.colors.length; pos++) {
        const c = data.colors[pos];
        const colorName = String(c.nombre || c.color || '').trim();
        if (!colorName) continue;
        const hex = String(c.hex || '#1c1c1c').trim();
        const photoId = Number(c.photo_id || (typeof c.foto === 'number' ? c.foto : 0)) || 0;
        const imageUrl = typeof c.foto === 'string' && c.foto.startsWith('http') ? c.foto : (c.image_url || null);

        await client.query(
          `INSERT INTO product_colors (product_id, color, hex, photo_id, position)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (product_id, color) DO UPDATE SET
              hex = EXCLUDED.hex,
              photo_id = CASE WHEN EXCLUDED.photo_id > 0 THEN EXCLUDED.photo_id ELSE product_colors.photo_id END,
              position = EXCLUDED.position`,
          [id, colorName, hex, photoId, pos]
        );

        if (imageUrl) {
          await client.query(
            `INSERT INTO product_color_images (product_id, color, url)
             VALUES ($1, $2, $3)
             ON CONFLICT (product_id, color) DO UPDATE SET url = EXCLUDED.url`,
            [id, colorName, imageUrl]
          );
        }
      }
    }

    await client.query('COMMIT');
    return { id, guardado: true };
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}

module.exports = {
  catalogo,
  registrarPedido,
  prendaParaPrueba,
  sizeOrder,
  listarCategorias,
  obtenerCategoria,
  guardarCategoria,
  eliminarCategoria,
  reasignarProductosCategoria,
  listarProductosAdmin,
  obtenerProductoAdmin,
  guardarProductoAdmin
};

