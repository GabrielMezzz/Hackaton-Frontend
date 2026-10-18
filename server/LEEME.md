# Servidor de la tienda

Sirve la tienda, lee el catálogo y guarda los pedidos en **PostgreSQL**
(esquema en `../db/`), y viste la foto del cliente con la prenda elegida usando
Gemini (Nano Banana). Las claves quedan en el servidor: nunca llegan al navegador.

## Arrancar

Requiere Node 18 o superior.

1. Instala las dependencias (una sola vez), dentro de `server/`:

   ```bash
   npm install
   ```

2. Copia `server/.env.example` como `server/.env` y completa:
   - `GEMINI_API_KEY`: tu clave de [Google AI Studio](https://aistudio.google.com/apikey).
   - `DATABASE_URL`: la base PostgreSQL, por ejemplo
     `postgres://postgres:tu_clave@localhost:5432/mipyme`.
     Para una demo **sin instalar Postgres** usa `DATABASE_URL=memoria`
     (base en memoria con el mismo esquema y catálogo; los pedidos se borran al reiniciar).
3. Crea las tablas y carga el catálogo (no hace falta con `memoria`):

   ```bash
   npm run db:init
   ```

4. Arranca, desde la carpeta del proyecto:

   ```bash
   node server/server.js
   ```

5. Abre http://localhost:8080 (la tienda y la API salen del mismo servidor).

## Base de datos (`../db/`)

| Archivo | Contenido |
|---|---|
| `schema.sql` | tablas `products`, `product_variants`, `quotes`, `trend_reports` y, para la tienda web, las columnas `store_key`, `category`, `audience` y la tabla `product_colors` |
| `seed.sql` | las 18 prendas: producto, 2 colores con su foto de Pexels y stock por talla y color |

Ambos se pueden correr varias veces sin duplicar ni pisar cambios.

- **Catálogo** (`GET /api/catalogo`): la página lo pide al cargar. Precio, nombre,
  colores y stock salen de la base; para cambiar el stock de una talla en un
  color se edita `product_variants`.
- **Pedidos** (`POST /api/pedidos`): cada prenda del pedido se guarda como una
  fila de `quotes` (`channel = 'web'`, `status = 'pending_advisor'`) con el
  nombre y celular del cliente, entrega, pago y notas en `summary`. El precio y
  la promo 3x2 se calculan con los datos de la base, no con lo que mande el
  navegador. Si no hay stock suficiente, `available = false` para que el asesor
  lo vea. El stock no se descuenta solo: lo hace el asesor al validar el pago.
- `npm test` prueba el esquema, el catálogo y los pedidos contra un Postgres en memoria.

Si abres `Angibellcreaciones.html` como archivo o con otro servidor, el
probador muestra una **simulación** marcada como tal, porque no encuentra la API.

## Cómo funciona

| Ruta | Qué hace |
|---|---|
| `GET /api/catalogo` | catálogo desde PostgreSQL |
| `POST /api/pedidos` | guarda el pedido como cotizaciones (`quotes`) |
| `GET /api/probador/cupo` | `{ limite, restantes, ia }` para la IP que pregunta |
| `POST /api/probador` | Recibe `{ foto, prendaFoto, prenda, color, tipo }` y devuelve `{ imagen, restantes }` |

- `foto`: la foto del cliente como data URL (el navegador la reduce a 1280 px).
- `prendaFoto`: id de Pexels de la foto de la prenda **en el color elegido**. El
  servidor solo acepta un id numérico y arma la URL de `images.pexels.com`, así
  no se le puede pedir que descargue otras direcciones.
- A Gemini se le envían las dos imágenes con una instrucción de *virtual try-on*:
  vestir a la persona de la foto 1 con la prenda de la foto 2, sin cambiar su
  cara, cuerpo, postura ni fondo. Se envía con `store: false` para que Google no
  guarde la foto, como promete el aviso de consentimiento.
- El servidor no guarda las fotos en disco.

## Límite de 2 pruebas por IP al día

- Se cuenta por IP y por fecha de `ZONA_HORARIA` (Lima): vuelve a 2 a medianoche.
- Solo se descuenta cuando Gemini devuelve la imagen. Si falla, no se pierde la prueba.
- Mientras una prueba se genera ya cuenta como usada, para que no se puedan
  lanzar varias a la vez y pasar el límite.
- La 3.ª prueba del día responde `429` con un mensaje para el cliente.
- Los contadores se guardan en `server/data/cupos.json` (solo el día actual), así
  un reinicio del servidor no devuelve las pruebas.
- Detrás de un proxy (Render, Railway, Nginx, Cloudflare) pon `TRUST_PROXY=1`
  para leer la IP real de `X-Forwarded-For`. Sin proxy déjalo en `0`, si no
  cualquiera podría falsear su IP con esa cabecera.

Límite conocido: la IP la comparten todas las personas de una misma red (una
casa, una oficina, algunos datos móviles), así que también comparten las 2 pruebas.

## Variables (`server/.env`)

| Variable | Por defecto | |
|---|---|---|
| `GEMINI_API_KEY` | — | obligatoria para el probador |
| `DATABASE_URL` | — | obligatoria para catálogo y pedidos (`memoria` = demo) |
| `PGSSL` | `0` | `1` si el proveedor exige SSL (Supabase, Neon, Render) |
| `GEMINI_MODEL` | `gemini-nano-banana-2.1` | modelo de imágenes |
| `PRUEBAS_POR_DIA` | `2` | |
| `ZONA_HORARIA` | `America/Lima` | define cuándo empieza el día |
| `PORT` | `8080` | |
| `TRUST_PROXY` | `0` | `1` detrás de un proxy |

`server/.env`, `server/data/` y `server/node_modules/` están en `.gitignore`.
