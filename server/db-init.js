/* Crea las tablas (../db/schema.sql) y carga el catalogo (../db/seed.sql)
   en la base de DATABASE_URL. Se puede correr varias veces: no duplica ni
   pisa cambios de precio o stock.            ->  npm run db:init */

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { Pool } = require('pg');
require('./env').loadEnv();

(async () => {
  if (!process.env.DATABASE_URL) {
    console.error('Falta DATABASE_URL en server/.env (ej. postgres://usuario:clave@localhost:5432/mipyme)');
    process.exit(1);
  }
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.PGSSL === '1' ? { rejectUnauthorized: false } : undefined
  });
  try {
    for (const f of ['schema.sql', 'seed.sql']) {
      await pool.query(fs.readFileSync(path.join(__dirname, '..', 'db', f), 'utf8'));
      console.log('OK', f);
    }
    const r = await pool.query('SELECT count(*)::int AS n FROM products WHERE store_key IS NOT NULL');
    console.log(`Listo: ${r.rows[0].n} prendas de la tienda en la base.`);
  } catch (e) {
    console.error('Error:', e.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
