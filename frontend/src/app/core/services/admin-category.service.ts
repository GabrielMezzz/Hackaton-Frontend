import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Category } from '../models/category.model';
import { Product } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class AdminCategoryService {
  private readonly http = inject(HttpClient);

  readonly categories = signal<Category[]>([]);
  readonly currentCategory = signal<Category | null>(null);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  loadCategories(): Observable<Category[]> {
    this.loading.set(true);
    this.error.set(null);
    return this.http.get<Category[]>('/api/admin/categories').pipe(
      tap({
        next: (cats) => {
          this.categories.set(cats);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err?.error?.error || 'Error al cargar las categorías');
          this.loading.set(false);
        }
      })
    );
  }

  getCategory(idOrSlug: string | number): Observable<Category> {
    this.loading.set(true);
    this.error.set(null);
    return this.http.get<Category>(`/api/admin/categories/${idOrSlug}`).pipe(
      tap({
        next: (cat) => {
          this.currentCategory.set(cat);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err?.error?.error || 'Error al cargar el detalle de la categoría');
          this.loading.set(false);
        }
      })
    );
  }

  saveCategory(category: Partial<Category>): Observable<Category> {
    this.loading.set(true);
    this.error.set(null);
    const req$ = category.id
      ? this.http.put<Category>(`/api/admin/categories/${category.id}`, category)
      : this.http.post<Category>('/api/admin/categories', category);

    return req$.pipe(
      tap({
        next: (saved) => {
          this.categories.update(current => {
            const index = current.findIndex(c => c.id === saved.id);
            if (index >= 0) {
              const updated = [...current];
              updated[index] = { ...updated[index], ...saved };
              return updated;
            }
            return [...current, saved];
          });
          if (this.currentCategory()?.id === saved.id) {
            this.currentCategory.update(c => c ? { ...c, ...saved } : saved);
          }
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err?.error?.error || 'Error al guardar la categoría');
          this.loading.set(false);
        }
      })
    );
  }

  deleteCategory(id: number): Observable<{ id: number; eliminada: boolean }> {
    this.loading.set(true);
    return this.http.delete<{ id: number; eliminada: boolean }>(`/api/admin/categories/${id}`).pipe(
      tap({
        next: () => {
          this.categories.update(current => current.filter(c => c.id !== id));
          if (this.currentCategory()?.id === id) {
            this.currentCategory.set(null);
          }
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err?.error?.error || 'Error al eliminar la categoría');
          this.loading.set(false);
        }
      })
    );
  }

  reassignProducts(categoryId: number, productIds: string[]): Observable<{ categoryId: number; actualizados: number }> {
    this.loading.set(true);
    return this.http.post<{ categoryId: number; actualizados: number }>(
      `/api/admin/categories/${categoryId}/products`,
      { productIds }
    ).pipe(
      tap({
        next: () => {
          // Refrescar detalle de categoría para actualizar prendas segregadas
          this.getCategory(categoryId).subscribe();
          this.loadCategories().subscribe();
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err?.error?.error || 'Error al reasignar prendas');
          this.loading.set(false);
        }
      })
    );
  }
}
