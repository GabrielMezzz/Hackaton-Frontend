/* Lee server/.env (CLAVE=valor). Las variables ya definidas en el sistema ganan. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');

function loadEnv(file) {
  file = file || path.join(__dirname, '.env');
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
}
module.exports = { loadEnv };
