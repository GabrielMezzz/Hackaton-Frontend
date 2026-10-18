/* Servidor local de la tienda Angibell: arranca el manejador de app.js.
   La logica (catalogo, pedidos, probador IA y cupo por IP) esta en app.js,
   que tambien usa la funcion de Vercel (../api/index.js).
   Node 18+. Una vez: npm install (en server/).  ->  node server/server.js */
'use strict';
require('./app').startLocal();
