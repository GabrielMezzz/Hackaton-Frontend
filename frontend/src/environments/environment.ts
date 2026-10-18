/* URL base de la API.
   - Desarrollo: '' = mismo origen, el proxy de ng serve (/api -> localhost:8080).
   - Produccion (GitHub Pages): la API vive en Vercel, en otro dominio. Ese valor
     lo genera frontend/scripts/set-api-base.mjs durante el deploy. */
export const environment = {
  apiBase: '',
};