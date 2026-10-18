/* Escribe src/environments/environment.prod.ts con la URL publica de la API.
   GitHub Actions lo llama antes de compilar:
     node scripts/set-api-base.mjs "https://tu-proyecto.vercel.app"
   Si la URL no viene o no es http(s), falla: es preferible que el build se caiga
   a que se publique una web que apunte a un origen equivocado. */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const destino = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'environments', 'environment.prod.ts');

const bruto = (process.argv[2] ?? '').trim();
if (!bruto) {
  console.error('Falta la URL de la API. Uso: node scripts/set-api-base.mjs "https://tu-proyecto.vercel.app"');
  process.exit(1);
}

let url;
try {
  url = new URL(bruto);
} catch {
  console.error(`URL invalida: "${bruto}". Debe ser algo como https://tu-proyecto.vercel.app`);
  process.exit(1);
}
if (url.protocol !== 'http:' && url.protocol !== 'https:') {
  console.error(`Protocolo no permitido: "${url.protocol}". Usa http o https.`);
  process.exit(1);
}

const apiBase = url.origin;
writeFileSync(
  destino,
  `/* Generado por scripts/set-api-base.mjs durante el deploy. No editar a mano. */\nexport const environment = {\n  apiBase: '${apiBase}',\n};\n`,
  'utf8'
);
console.log(`API de produccion: ${apiBase}`);