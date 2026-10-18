/* Entorno de produccion: lo reemplaza frontend/scripts/set-api-base.mjs al compilar
   para GitHub Pages, con la URL publica de la API en Vercel (GitHub Pages es estatico
   y no puede servir /api). El valor de abajo es el fallback para builds locales. */
export const environment = {
  apiBase: '',
};