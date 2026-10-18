/* Funcion serverless de Vercel para toda la API de la tienda.
   vercel.json reescribe /api/<ruta> -> /api/index?ruta=<ruta>; aqui se
   recupera la ruta original y se pasa al mismo manejador del servidor local
   (server/app.js): catalogo, pedidos, probador con IA y cupo por IP. */
'use strict';
const { handler } = require('../server/app');

module.exports = async (req, res) => {
  const u = new URL(req.url, 'http://x');
  const ruta = u.searchParams.get('ruta');
  if (ruta !== null) {
    u.searchParams.delete('ruta');
    const q = u.searchParams.toString();
    req.url = '/api/' + ruta.replace(/^\/+/, '') + (q ? '?' + q : '');
  }
  return handler(req, res);
};
