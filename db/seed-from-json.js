/**
 * Ejecuta el seed directamente en la base de datos PostgreSQL conectada (DATABASE_URL).
 * Soporta actualizacion reactiva mediante UPSERT.
 * Uso: node db/seed-from-json.js  o  npm run seed
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { Pool } = require('pg');

// Cargar variables de entorno
const envHelperPath = path.join(__dirname, '..', 'server', 'env.js');
if (fs.existsSync(envHelperPath)) {
  require(envHelperPath).loadEnv();
}

const { generateSeedSql } = require('./generate-seed');

async function runSeed() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('ERROR: No se encontro la variable DATABASE_URL en el entorno o server/.env');
    process.exit(1);
  }

  const jsonPath = path.join(__dirname, 'products.json');
  if (!fs.existsSync(jsonPath)) {
    console.error('ERROR: No se encontro db/products.json');
    process.exit(1);
  }

  const products = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  console.log(`Generando SQL de seed para ${products.length} productos...`);
  const sql = generateSeedSql(products);

  // Asegurar que seed.sql este actualizado en disco
  fs.writeFileSync(path.join(__dirname, 'seed.sql'), sql, 'utf8');

  console.log(`Conectando a PostgreSQL...`);
  const pool = new Pool({
    connectionString: dbUrl,
    ssl: process.env.PGSSL === '1' ? { rejectUnauthorized: false } : undefined
  });

  try {
    console.log(`Aplicando seed con UPSERT...`);
    await pool.query(sql);
    console.log('Seed ejecutado con éxito.');

    // Verificaciones
    const [pRes, vRes, cRes] = await Promise.all([
      pool.query('SELECT count(*)::int AS count FROM products'),
      pool.query('SELECT count(*)::int AS count FROM product_variants'),
      pool.query('SELECT count(*)::int AS count FROM categories')
    ]);

    console.log('--- Resumen de Base de Datos ---');
    console.log(`Productos en DB:   ${pRes.rows[0].count}`);
    console.log(`Variantes en DB:   ${vRes.rows[0].count}`);
    console.log(`Categorías en DB:  ${cRes.rows[0].count}`);
    console.log('--------------------------------');
  } catch (err) {
    console.error('ERROR al ejecutar el seed en la base de datos:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  runSeed();
}

module.exports = { runSeed };
