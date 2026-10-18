import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AdminProductPayload } from '../models/category.model';

export interface AdminProduct {
  id: string;
  name: string;
  description?: string;
  base_price: number;
  category: string;
  category_id?: number;
  category_name?: string;
  audience: string;
  active: boolean;
  store_key?: string;
  material?: string;
  total_stock: number;
  colores: {
    color: string;
    hex: string;
    photo_id?: number;
    foto?: string;
  }[];
  variantes?: {
    size: string;
    color: string;
    price: number | null;
    stock: number;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class AdminProductService {
  private readonly http = inject(HttpClient);

  readonly products = signal<AdminProduct[]>([]);
  readonly currentProduct = signal<AdminProduct | null>(null);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  loadProducts(filters: { categoryId?: string | number; search?: string } = {}): Observable<AdminProduct[]> {
    this.loading.set(true);
    this.error.set(null);

    let params = new HttpParams();
    if (filters.categoryId) params = params.set('categoryId', String(filters.categoryId));
    if (filters.search) params = params.set('search', filters.search);

    return this.http.get<AdminProduct[]>('/api/admin/products', { params }).pipe(
      tap({
        next: (items) => {
          this.products.set(items);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err?.error?.error || 'Error al cargar productos');
          this.loading.set(false);
        }
      })
    );
  }

  getProduct(id: string): Observable<AdminProduct> {
    this.loading.set(true);
    this.error.set(null);
    return this.http.get<AdminProduct>(`/api/admin/products/${encodeURIComponent(id)}`).pipe(
      tap({
        next: (item) => {
          this.currentProduct.set(item);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err?.error?.error || 'Error al obtener producto');
          this.loading.set(false);
        }
      })
    );
  }

  saveProduct(product: AdminProductPayload): Observable<{ id: string; guardado: boolean }> {
    this.loading.set(true);
    this.error.set(null);
    const isEdit = !!product.id && this.products().some(p => p.id === product.id);
    const req$ = isEdit
      ? this.http.put<{ id: string; guardado: boolean }>(`/api/admin/products/${encodeURIComponent(product.id)}`, product)
      : this.http.post<{ id: string; guardado: boolean }>('/api/admin/products', product);

    return req$.pipe(
      tap({
        next: () => {
          this.loadProducts().subscribe();
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err?.error?.error || 'Error al guardar el producto');
          this.loading.set(false);
        }
      })
    );
  }
}
