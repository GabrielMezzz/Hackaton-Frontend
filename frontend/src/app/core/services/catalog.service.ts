import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Product } from '../models/product.model';
import { Category } from '../models/category.model';

@Injectable({
  providedIn: 'root'
})
export class CatalogService {
  private readonly http = inject(HttpClient);

  // Estado reactivo: ZERO datos mock hardcodeados
  readonly products = signal<Product[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);

  constructor() {
    this.loadFromApi();
  }

  loadFromApi(): void {
    this.loading.set(true);
    this.error.set(null);
    this.fetchCatalog('/api/catalogo');
  }

  private fetchCatalog(apiUrl: string, isFallback = false): void {
    this.http.get<{ items?: Record<string, any>; prendas?: Product[]; categorias?: Category[] }>(apiUrl).subscribe({
      next: (data) => {
        // Carga dinámica de categorías desde PostgreSQL
        if (data && Array.isArray(data.categorias) && data.categorias.length > 0) {
          this.categories.set(data.categorias);
        } else {
          // Fallback a endpoint de categorías (mismo host, no localhost:
          // asi tambien funciona al abrir la app desde el celular en la red local)
          const catUrl = isFallback ? `${backendOrigin()}/api/categories` : '/api/categories';
          this.http.get<Category[]>(catUrl).subscribe({
            next: (cats) => {
              if (Array.isArray(cats)) this.categories.set(cats);
            },
            error: () => {}
          });
        }

        // Carga dinámica de productos desde PostgreSQL
        if (data && data.items && Object.keys(data.items).length > 0) {
          const formatted: Product[] = Object.entries(data.items).map(([storeKey, it]) => {
            const rawColors = Array.isArray(it.colores) ? it.colores : [];
            const colors = rawColors.map((c: any) => ({
              nombre: c.nombre || 'Único',
              hex: c.hex || '#333333',
              foto: typeof c.foto === 'string' && c.foto.startsWith('http')
                ? c.foto
                : (typeof c.foto === 'number'
                    ? `https://images.pexels.com/photos/${c.foto}/pexels-photo-${c.foto}.jpeg?auto=compress&cs=tinysrgb&w=800`
                    : (c.foto ? `https://images.pexels.com/photos/${c.foto}/pexels-photo-${c.foto}.jpeg?auto=compress&cs=tinysrgb&w=800` : 'https://images.pexels.com/photos/34796127/pexels-photo-34796127.jpeg?auto=compress&cs=tinysrgb&w=800'))
            }));

            const sizes = it.sizes && typeof it.sizes === 'object'
              ? Object.keys(it.sizes)
              : (Array.isArray(it.sizes) ? it.sizes : ['2', '4', '6', '8']);

            const sku = it.sku || storeKey;
            const categorySlug = it.categoria_slug || (typeof it.tipo === 'string' ? it.tipo.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'general');
            const categoryName = it.categoria || it.tipo || 'General';

            return {
              id: sku,
              sku: sku,
              key: storeKey || sku,
              name: it.nombre || 'Prenda Angibell',
              price: Number(it.precio) || 0,
              tipo: categorySlug,
              categoria: categoryName,
              category_id: it.categoria_id,
              category_slug: categorySlug,
              category_name: categoryName,
              publico: it.publico || categoryName,
              sizes: sizes,
              stock: (it.sizes && typeof it.sizes === 'object') ? it.sizes : {},
              colors: colors.length > 0 ? colors : [{
                nombre: 'Estándar',
                hex: '#333333',
                foto: 'https://images.pexels.com/photos/34796127/pexels-photo-34796127.jpeg?auto=compress&cs=tinysrgb&w=800'
              }],
              description: it.description || `Prenda de confección nacional ${it.nombre || ''}. Confeccionada con telas finas y acabados de alta costura infantil.`
            };
          });
          this.products.set(formatted);
          this.loading.set(false);
        } else if (data && Array.isArray(data.prendas)) {
          const formatted = data.prendas.map(p => ({
            ...p,
            id: p.sku || p.id || p.key,
            sku: p.sku || p.id || p.key,
            key: p.sku || p.id || p.key
          }));
          this.products.set(formatted);
          this.loading.set(false);
        } else {
          this.products.set([]);
          this.loading.set(false);
        }
      },
      error: (err) => {
        console.warn(`[CatalogService] Error en ${apiUrl}:`, err);
        // Si estamos en desarrollo en puerto 4200 y falló /api/catalogo, intentar directo al backend
        if (!isFallback && typeof window !== 'undefined' && window.location.port === '4200') {
          const directo = `${backendOrigin()}/api/catalogo`;
          console.info(`[CatalogService] Reintentando con backend directo ${directo}...`);
          this.fetchCatalog(directo, true);
          return;
        }

        const msg = err.status === 0
          ? 'No se pudo conectar con el backend (puerto 8080). Inicia el servidor con "npm start".'
          : (err.error?.error || err.message || 'Error al conectar con la base de datos PostgreSQL.');
        this.error.set(msg);
        this.loading.set(false);
      }
    });
  }

  getByKey(idOrSku: string): Product | undefined {
    return this.products().find(p =>
      p.id === idOrSku || p.sku === idOrSku || p.key === idOrSku
    );
  }
}

// Origen del backend (puerto 8080) usando el host desde el que se abrio la pagina,
// no "localhost": asi el celular en la red local tambien alcanza la API.
function backendOrigin(): string {
  if (typeof window === 'undefined') return 'http://localhost:8080';
  return `http://${window.location.hostname}:8080`;
}
