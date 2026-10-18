/* GitHub Pages sirve solo archivos estaticos: no hay /api en ese dominio.
   Las peticiones relativas ('/api/catalogo', '/api/pedidos'...) se redirigen aqui
   a la API real en Vercel, que ya responde con Access-Control-Allow-Origin: *.
   En desarrollo apiBase va vacio y las rutas relativas siguen funcionando igual
   a traves del proxy de ng serve. */
import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../environments/environment';

export const apiBaseInterceptor: HttpInterceptorFn = (req, next) => {
  const base = environment.apiBase;
  if (!base || !req.url.startsWith('/api/')) return next(req);
  return next(req.clone({ url: base.replace(/\/+$/, '') + req.url }));
};