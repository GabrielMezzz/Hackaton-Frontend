// Test de verificación para administración de categorías, segregación y productos
'use strict';

const { Pool } = require('pg');
require('../env').loadEnv();
const db = require('../db');

const DB_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!DB_URL) {
  console.error('Falta DATABASE_URL');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DB_URL,
  ssl: process.env.PGSSL === '1' ? { rejectUnauthorized: false } : undefined,
  max: 2
});

async function run() {
  try {
    console.log('1. Listando categorías iniciales...');
    let cats = await db.listarCategorias(pool);
    console.log(`Categorías encontradas: ${cats.length}`);
    for (const c of cats) {
      console.log(` - ${c.name} (${c.slug}): ${c.total_productos} productos`);
    }

    console.log('2. Creando o actualizando categoría de prueba...');
    const catTest = await db.guardarCategoria(pool, {
      name: 'Vestidos de Gala Test',
      slug: 'vestidos-gala-test',
      description: 'Colección exclusiva de gala para ceremonias',
      image_url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg'
    });
    console.log('Categoría guardada:', catTest.name, 'ID:', catTest.id);

    console.log('3. Probando segregación: reasignando prenda VES-001 a la nueva categoría...');
    const resSeg = await db.reasignarProductosCategoria(pool, catTest.id, ['VES-001']);
    console.log('Resultado segregación:', resSeg);

    console.log('4. Obteniendo detalle de la categoría con sus productos...');
    const catDetalle = await db.obtenerCategoria(pool, catTest.id);
    console.log(`Productos en ${catDetalle.name}:`, catDetalle.productos.map(p => p.id));
    if (!catDetalle.productos.some(p => p.id === 'VES-001')) {
      throw new Error('VES-001 no fue encontrado en la categoría!');
    }

    console.log('5. Reasignando de regreso VES-001 a Vestido...');
    const catVestido = cats.find(c => c.name === 'Vestido');
    if (catVestido) {
      await db.reasignarProductosCategoria(pool, catVestido.id, ['VES-001']);
      console.log('VES-001 restaurado a Vestido.');
    }

    console.log('6. Limpiando categoría de prueba...');
    await db.eliminarCategoria(pool, catTest.id);
    console.log('Categoría de prueba eliminada con éxito.');

    console.log('TODO OK: Funciones de base de datos de administración validadas correctamente.');
    await pool.end();
  } catch (err) {
    console.error('ERROR en test:', err);
    await pool.end();
    process.exit(1);
  }
}

run();
