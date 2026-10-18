/* Lee server/.env o root .env (CLAVE=valor). Las variables ya definidas en el sistema ganan. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');

function parseAndSet(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) {
      process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
    }
  }
}

function loadEnv(file) {
  if (file) {
    parseAndSet(file);
    return;
  }
  // Cargar primero server/.env y luego complementar con root .env
  parseAndSet(path.join(__dirname, '.env'));
  parseAndSet(path.resolve(__dirname, '..', '.env'));
}

module.exports = { loadEnv };
