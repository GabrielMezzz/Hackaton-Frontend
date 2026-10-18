/**
 * Genera db/seed.sql a partir de db/products.json con soporte de UPSERT
 * (INSERT ... ON CONFLICT DO UPDATE) para sincronizar en caliente
 * productos, categorias, colores, variantes y materiales.
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');

function escapeSql(str) {
  if (str === null || str === undefined) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
}

function numOrNull(val) {
  if (val === null || val === undefined || isNaN(val)) return 'NULL';
  return Number(val).toFixed(2);
}

function generateSeedSql(products) {
  const lines = [
    '-- Catalogo de la tienda web Angibell creaciones generado desde db/products.json.',
    '-- Idempotente y reactivo: actualiza precios, stock, materiales y categorias si cambian en el JSON.',
    '-- Ejecutable de forma segura multiples veces.',
    '',
    'BEGIN;',
    ''
  ];

  // 1. Extraer categorias unicas
  const categoryNames = [...new Set(products.map(p => p.category).filter(Boolean))];
  lines.push('-- 1. CATEGORIAS');
  lines.push('INSERT INTO categories (name, slug, description, active) VALUES');
  const catValues = categoryNames.map(cat => {
    const slug = cat.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-');
    const desc = `Prendas y accesorios en la categoría ${cat}`;
    return `    (${escapeSql(cat)}, ${escapeSql(slug)}, ${escapeSql(desc)}, true)`;
  });
  lines.push(catValues.join(',\n') + '\nON CONFLICT (name) DO UPDATE SET');
  lines.push('    slug = EXCLUDED.slug,');
  lines.push('    description = EXCLUDED.description,');
  lines.push('    active = EXCLUDED.active;');
  lines.push('');

  // 2. PRODUCTOS
  lines.push('-- 2. PRODUCTOS (con store_key, audience y material)');
  lines.push('INSERT INTO products (id, name, description, base_price, store_key, category, audience, material) VALUES');
  const prodValues = products.map(p => {
    return `    (${escapeSql(p.id)}, ${escapeSql(p.name)}, ${escapeSql(p.description)}, ${numOrNull(p.base_price)}, ${escapeSql(p.store_key)}, ${escapeSql(p.category)}, ${escapeSql(p.audience)}, ${escapeSql(p.material)})`;
  });
  lines.push(prodValues.join(',\n') + '\nON CONFLICT (id) DO UPDATE SET');
  lines.push('    name = EXCLUDED.name,');
  lines.push('    description = EXCLUDED.description,');
  lines.push('    base_price = EXCLUDED.base_price,');
  lines.push('    store_key = EXCLUDED.store_key,');
  lines.push('    category = EXCLUDED.category,');
  lines.push('    audience = EXCLUDED.audience,');
  lines.push('    material = EXCLUDED.material;');
  lines.push('');

  // 3. SEGREGACION (category_products)
  lines.push('-- 3. ASOCIACION PRODUCTOS - CATEGORIAS');
  lines.push('INSERT INTO category_products (category_id, product_id)');
  lines.push('SELECT c.id, p.id');
  lines.push('FROM products p');
  lines.push('JOIN categories c ON c.name = p.category');
  lines.push('ON CONFLICT (category_id, product_id) DO NOTHING;');
  lines.push('');

function normalizeColor(c) {
  if (!c) return '';
  return c.charAt(0).toUpperCase() + c.slice(1);
}

  // 4. COLORES DE PRODUCTOS
  lines.push('-- 4. COLORES DE PRODUCTOS');
  lines.push('INSERT INTO product_colors (product_id, color, hex, photo_id, position) VALUES');
  const colorValues = [];
  products.forEach(p => {
    (p.colors || []).forEach(c => {
      const col = normalizeColor(c.color);
      colorValues.push(`    (${escapeSql(p.id)}, ${escapeSql(col)}, ${escapeSql(c.hex)}, ${c.photo_id}, ${c.position || 0})`);
    });
  });
  lines.push(colorValues.join(',\n') + '\nON CONFLICT (product_id, color) DO UPDATE SET');
  lines.push('    hex = EXCLUDED.hex,');
  lines.push('    photo_id = EXCLUDED.photo_id,');
  lines.push('    position = EXCLUDED.position;');
  lines.push('');

  // 5. VARIANTES Y STOCK
  lines.push('-- 5. VARIANTES (Tallas, precios especificos y stock)');
  lines.push('INSERT INTO product_variants (product_id, size, color, price, stock) VALUES');
  const variantValues = [];
  products.forEach(p => {
    (p.variants || []).forEach(v => {
      const col = normalizeColor(v.color);
      variantValues.push(`    (${escapeSql(p.id)}, ${escapeSql(v.size)}, ${escapeSql(col)}, ${numOrNull(v.price)}, ${Number(v.stock) || 0})`);
    });
  });
  lines.push(variantValues.join(',\n') + '\nON CONFLICT (product_id, size, color) DO UPDATE SET');
  lines.push('    price = EXCLUDED.price,');
  lines.push('    stock = EXCLUDED.stock;');
  lines.push('');

  lines.push('COMMIT;');
  lines.push('');

  return lines.join('\n');
}

function main() {
  const jsonPath = path.join(__dirname, 'products.json');
  if (!fs.existsSync(jsonPath)) {
    console.error('No se encontro products.json en:', jsonPath);
    process.exit(1);
  }

  const raw = fs.readFileSync(jsonPath, 'utf8');
  const products = JSON.parse(raw);
  console.log(`Leyendo ${products.length} productos desde products.json...`);

  const sqlContent = generateSeedSql(products);
  const targetSeedPath = path.join(__dirname, 'seed.sql');
  fs.writeFileSync(targetSeedPath, sqlContent, 'utf8');
  console.log(`Generado exitosamente: ${targetSeedPath} (${sqlContent.length} bytes)`);

  // Sincronizar tambien a mipyme-hackathon/db/seed.sql si existe
  const mipymeSeedPath = path.resolve(__dirname, '..', '..', 'mipyme-hackathon', 'db', 'seed.sql');
  if (fs.existsSync(path.dirname(mipymeSeedPath))) {
    fs.writeFileSync(mipymeSeedPath, sqlContent, 'utf8');
    console.log(`Sincronizado con mipyme-hackathon: ${mipymeSeedPath}`);
  }
}

if (require.main === module) {
  main();
}

module.exports = { generateSeedSql };
