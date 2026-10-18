import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Product } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class CatalogService {
  private readonly http = inject(HttpClient);

  readonly products = signal<Product[]>([
    {
      id: 'TER-001',
      sku: 'TER-001',
      key: 'TER-001',
      name: 'Terno para niños',
      price: 250,
      tipo: 'ninos',
      publico: 'Niños',
      sizes: ['0', '2', '4', '6', '8'],
      stock: { '0': 5, '2': 4, '4': 2, '6': 1, '8': 3 },
      colors: [
        { nombre: 'Azul', hex: '#2c4a8c', foto: 'https://images.pexels.com/photos/34796127/pexels-photo-34796127.jpeg?auto=compress&cs=tinysrgb&w=800' },
        { nombre: 'Negro', hex: '#1c1c1c', foto: 'https://images.pexels.com/photos/36909807/pexels-photo-36909807.jpeg?auto=compress&cs=tinysrgb&w=800' }
      ],
      description: 'Elegante terno para ocasiones especiales y bautizos, confeccionado con telas finas y suaves.'
    },
    {
      id: 'TER-002',
      sku: 'TER-002',
      key: 'TER-002',
      name: 'Terno de gala para niño',
      price: 250,
      tipo: 'ninos',
      publico: 'Niños',
      sizes: ['2', '4', '6', '8'],
      stock: { '2': 3, '4': 5, '6': 2, '8': 1 },
      colors: [
        { nombre: 'Gris', hex: '#8a8f98', foto: 'https://images.pexels.com/photos/30720574/pexels-photo-30720574.jpeg?auto=compress&cs=tinysrgb&w=800' },
        { nombre: 'Blanco', hex: '#f4f1ea', foto: 'https://images.pexels.com/photos/37472678/pexels-photo-37472678.jpeg?auto=compress&cs=tinysrgb&w=800' }
      ],
      description: 'Terno de etiqueta formal para ceremonias infantiles y eventos de gala.'
    },
    {
      id: 'BLA-001',
      sku: 'BLA-001',
      key: 'BLA-001',
      name: 'Blaser para niños',
      price: 95,
      tipo: 'ninos',
      publico: 'Niños',
      sizes: ['2', '4', '6'],
      stock: { '2': 4, '4': 2, '6': 3 },
      colors: [
        { nombre: 'Negro', hex: '#1c1c1c', foto: 'https://images.pexels.com/photos/30690925/pexels-photo-30690925.jpeg?auto=compress&cs=tinysrgb&w=800' },
        { nombre: 'Plateado', hex: '#b9bcc2', foto: 'https://images.pexels.com/photos/30522779/pexels-photo-30522779.jpeg?auto=compress&cs=tinysrgb&w=800' }
      ],
      description: 'Blazer moderno y cómodo, perfecto para combinar con pantalones de vestir o jean.'
    },
    {
      id: 'CON-001',
      sku: 'CON-001',
      key: 'CON-001',
      name: 'Conjunto Jean para niños',
      price: 155,
      tipo: 'ninos',
      publico: 'Niños',
      sizes: ['2', '4', '6'],
      stock: { '2': 5, '4': 3, '6': 2 },
      colors: [
        { nombre: 'Jean claro', hex: '#8fb3d9', foto: 'https://images.pexels.com/photos/4127424/pexels-photo-4127424.jpeg?auto=compress&cs=tinysrgb&w=800' },
        { nombre: 'Jean azul', hex: '#3b6ea8', foto: 'https://images.pexels.com/photos/11202657/pexels-photo-11202657.jpeg?auto=compress&cs=tinysrgb&w=800' }
      ],
      description: 'Conjunto urbano casual confeccionado en tela denim resistente y suave.'
    },
    {
      id: 'VES-001',
      sku: 'VES-001',
      key: 'VES-001',
      name: 'Vestido para niñas en gasa francesa color blanco',
      price: 250,
      tipo: 'ninas',
      publico: 'Niñas',
      sizes: ['2', '4', '6', '8'],
      stock: { '2': 4, '4': 6, '6': 3, '8': 2 },
      colors: [
        { nombre: 'Blanco', hex: '#f7f3ea', foto: 'https://images.pexels.com/photos/38870218/pexels-photo-38870218.jpeg?auto=compress&cs=tinysrgb&w=800' },
        { nombre: 'Rosa', hex: '#f2b5c6', foto: 'https://images.pexels.com/photos/36893911/pexels-photo-36893911.jpeg?auto=compress&cs=tinysrgb&w=800' }
      ],
      description: 'Delicado vestido de primera comunión o fiesta con acabados en gasa francesa de alta calidad.'
    },
    {
      id: 'VES-002',
      sku: 'VES-002',
      key: 'VES-002',
      name: 'Vestido Floreado rojo para niña',
      price: 95,
      tipo: 'ninas',
      publico: 'Niñas',
      sizes: ['2', '4', '6'],
      stock: { '2': 5, '4': 4, '6': 2 },
      colors: [
        { nombre: 'Rojo', hex: '#c8102e', foto: 'https://images.pexels.com/photos/2995309/pexels-photo-2995309.jpeg?auto=compress&cs=tinysrgb&w=800' },
        { nombre: 'Fucsia', hex: '#d63384', foto: 'https://images.pexels.com/photos/29169257/pexels-photo-29169257.jpeg?auto=compress&cs=tinysrgb&w=800' }
      ],
      description: 'Vestido fresco y alegre con estampado floral primaveral.'
    },
    {
      id: 'VES-003',
      sku: 'VES-003',
      key: 'VES-003',
      name: 'Vestido de niña en gasa de seda',
      price: 260,
      tipo: 'ninas',
      publico: 'Niñas',
      sizes: ['4', '6', '8'],
      stock: { '4': 2, '6': 3, '8': 1 },
      colors: [
        { nombre: 'Celeste', hex: '#7fb6e6', foto: 'https://images.pexels.com/photos/34351470/pexels-photo-34351470.jpeg?auto=compress&cs=tinysrgb&w=800' },
        { nombre: 'Champagne', hex: '#e6d3ad', foto: 'https://images.pexels.com/photos/14213044/pexels-photo-14213044.jpeg?auto=compress&cs=tinysrgb&w=800' }
      ],
      description: 'Vestido exclusivo para ocasiones especiales confeccionado en gasa de seda importada.'
    },
    {
      id: 'CON-002',
      sku: 'CON-002',
      key: 'CON-002',
      name: 'Conjunto de niña: pantalón cargo y polo',
      price: 125,
      tipo: 'ninas',
      publico: 'Niñas',
      sizes: ['4', '6', '8'],
      stock: { '4': 4, '6': 5, '8': 2 },
      colors: [
        { nombre: 'Rosa', hex: '#e88aa8', foto: 'https://images.pexels.com/photos/29242786/pexels-photo-29242786.jpeg?auto=compress&cs=tinysrgb&w=800' },
        { nombre: 'Jean y blanco', hex: '#5b7fb0', foto: 'https://images.pexels.com/photos/8576208/pexels-photo-8576208.jpeg?auto=compress&cs=tinysrgb&w=800' }
      ],
      description: 'Conjunto moderno de tendencia cargo con tejido ultra suave para mayor comodidad.'
    },
    {
      id: 'CON-003',
      sku: 'CON-003',
      key: 'CON-003',
      name: 'Conjunto para niña: pantalón y polo',
      price: 125,
      tipo: 'personalizados',
      publico: 'Personalizados',
      sizes: ['2', '4', '6'],
      stock: { '2': 3, '4': 3, '6': 4 },
      colors: [
        { nombre: 'Verde', hex: '#5f6b3a', foto: 'https://images.pexels.com/photos/1620808/pexels-photo-1620808.jpeg?auto=compress&cs=tinysrgb&w=800' },
        { nombre: 'Mostaza', hex: '#d9a730', foto: 'https://images.pexels.com/photos/20433625/pexels-photo-20433625.jpeg?auto=compress&cs=tinysrgb&w=800' }
      ],
      description: 'Conjunto personalizado confeccionado a medida en colores vivos y textura suave.'
    }
  ]);

  loadFromApi(): void {
    this.http.get<{ items?: Record<string, any>; prendas?: Product[] }>('/api/catalogo').subscribe({
      next: (data) => {
        if (data && data.items && Object.keys(data.items).length > 0) {
          const formatted: Product[] = Object.entries(data.items).map(([storeKey, it]) => {
            const rawColors = Array.isArray(it.colores) ? it.colores : [];
            const colors = rawColors.map((c: any) => ({
              nombre: c.nombre || 'Único',
              hex: c.hex || '#333333',
              foto: typeof c.foto === 'number'
                ? `https://images.pexels.com/photos/${c.foto}/pexels-photo-${c.foto}.jpeg?auto=compress&cs=tinysrgb&w=800`
                : (typeof c.foto === 'string' && c.foto.startsWith('http')
                  ? c.foto
                  : `https://images.pexels.com/photos/${c.foto}/pexels-photo-${c.foto}.jpeg?auto=compress&cs=tinysrgb&w=800`)
            }));

            const sizes = it.sizes && typeof it.sizes === 'object'
              ? Object.keys(it.sizes)
              : (Array.isArray(it.sizes) ? it.sizes : ['2', '4', '6', '8']);

            const sku = it.sku || storeKey;

            return {
              id: sku,
              sku: sku,
              key: storeKey || sku,
              name: it.nombre || 'Prenda Angibell',
              price: Number(it.precio) || 0,
              tipo: (it.tipo === 'ninas' || it.tipo === 'ninos' || it.tipo === 'personalizados') ? it.tipo : 'ninos',
              publico: it.publico || (it.tipo === 'ninas' ? 'Niñas' : 'Niños'),
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
        } else if (data && Array.isArray(data.prendas) && data.prendas.length > 0) {
          const formatted = data.prendas.map(p => ({
            ...p,
            id: p.sku || p.id || p.key,
            sku: p.sku || p.id || p.key,
            key: p.sku || p.id || p.key
          }));
          this.products.set(formatted);
        }
      },
      error: () => {
        // Fallback to database seeds
      }
    });
  }

  getByKey(idOrSku: string): Product | undefined {
    return this.products().find(p =>
      p.id === idOrSku || p.sku === idOrSku || p.key === idOrSku
    );
  }
}
