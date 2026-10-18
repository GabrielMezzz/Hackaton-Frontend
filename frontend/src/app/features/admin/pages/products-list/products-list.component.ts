import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminProductService, AdminProduct } from '../../../../core/services/admin-product.service';
import { AdminCategoryService } from '../../../../core/services/admin-category.service';

@Component({
  selector: 'app-products-list',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="space-y-6 max-w-7xl mx-auto font-sans text-ink">
      <!-- Title & Action Bar -->
      <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p class="pw-eyebrow">Catálogo</p>
          <h2 class="pw-title">Gestión de Prendas & Productos</h2>
          <p class="pw-meta mt-1">Administra el inventario, precios, colores y fotos asociadas en Cloudinary</p>
        </div>

        <a
          routerLink="/admin/productos/nuevo"
          class="pw-btn pw-btn--primary inline-flex items-center gap-2 py-3 px-5 text-sm cursor-pointer shrink-0"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          <span>Nueva Prenda</span>
        </a>
      </div>

      <!-- Filters Bar -->
      <div class="bg-paper p-4 rounded-md border border-ink grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        <!-- Search -->
        <div class="relative md:col-span-6">
          <svg class="w-4 h-4 text-ink-subtle absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            type="text"
            [ngModel]="searchTerm()"
            (ngModelChange)="onSearchChange($event)"
            placeholder="Buscar por SKU o nombre de prenda..."
            class="w-full pl-10 pr-4 py-2.5 text-sm text-ink bg-paper border border-ink rounded-md focus:outline-2 focus:outline-ink focus:outline-offset-1"
          />
        </div>

        <!-- Category Dropdown Filter -->
        <div class="md:col-span-4">
          <select
            [ngModel]="selectedCategoryFilter()"
            (ngModelChange)="onCategoryFilterChange($event)"
            class="w-full py-2.5 px-3 text-sm text-ink bg-paper border border-ink rounded-md focus:outline-2 focus:outline-ink focus:outline-offset-1"
          >
            <option value="">Todas las Categorías</option>
            @for (cat of categoryService.categories(); track cat.id) {
              <option [value]="cat.id">{{ cat.name }} ({{ cat.total_productos || 0 }})</option>
            }
          </select>
        </div>

        <!-- Count -->
        <div class="md:col-span-2 text-right pw-meta">
          Prendas: <span class="font-medium text-ink">{{ productService.products().length }}</span>
        </div>
      </div>

      <!-- Table of Products -->
      @if (productService.loading()) {
        <div class="py-16 text-center text-ink-muted">
          <div class="pw-spinner mx-auto mb-3"></div>
          <p class="text-sm">Cargando inventario de prendas...</p>
        </div>
      } @else if (productService.products().length === 0) {
        <div class="bg-sand rounded-md p-12 text-center">
          <p class="text-sm font-medium text-ink">No se encontraron prendas con esos filtros</p>
        </div>
      } @else {
        <div class="bg-paper rounded-md border border-ink overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="font-mono text-[11px] text-ink uppercase tracking-wider border-b border-ink">
                  <th class="py-3 px-5 font-light">Prenda</th>
                  <th class="py-3 px-4 font-light">SKU / Clave</th>
                  <th class="py-3 px-4 font-light">Categoría</th>
                  <th class="py-3 px-4 font-light">Precio</th>
                  <th class="py-3 px-4 font-light">Colores</th>
                  <th class="py-3 px-4 font-light">Stock Total</th>
                  <th class="py-3 px-4 font-light text-right">Acciones</th>
                </tr>
              </thead>
              <tbody class="text-sm">
                @for (prod of productService.products(); track prod.id) {
                  <tr class="border-b border-sand last:border-b-0 hover:bg-sand-light transition group">
                    <!-- Photo & Name -->
                    <td class="py-3 px-5">
                      <div class="flex items-center gap-3">
                        <div class="w-12 h-12 rounded-md bg-sand overflow-hidden shrink-0">
                          @if (prod.colores && prod.colores.length > 0 && prod.colores[0].foto) {
                            <img [src]="getPhotoUrl(prod.colores[0].foto)" [alt]="prod.name" class="w-full h-full object-cover" />
                          } @else {
                            <div class="w-full h-full flex items-center justify-center text-ink-subtle text-[10px]">Sin foto</div>
                          }
                        </div>
                        <div class="min-w-0">
                          <p class="font-medium text-ink group-hover:underline truncate max-w-xs">{{ prod.name }}</p>
                          <p class="pw-meta text-xs mt-0.5">{{ prod.audience }}</p>
                        </div>
                      </div>
                    </td>

                    <!-- SKU -->
                    <td class="py-3 px-4 font-mono text-ink-soft">
                      {{ prod.id }}
                    </td>

                    <!-- Category -->
                    <td class="py-3 px-4">
                      @if (prod.category_id) {
                        <a
                          [routerLink]="['/admin/categorias', prod.category_id]"
                          class="inline-block px-3 py-1 rounded-full text-xs bg-sand text-ink border border-sand-border hover:border-ink transition"
                        >
                          {{ prod.category_name || prod.category }}
                        </a>
                      } @else {
                        <span class="inline-block px-3 py-1 rounded-full text-xs bg-sand-light text-ink-muted">
                          {{ prod.category || 'Sin categoría' }}
                        </span>
                      }
                    </td>

                    <!-- Price -->
                    <td class="py-3 px-4 font-medium text-ink">
                      S/ {{ prod.base_price }}
                    </td>

                    <!-- Colors -->
                    <td class="py-3 px-4">
                      <div class="flex items-center gap-1.5">
                        @for (col of prod.colores; track col.color) {
                          <span
                            class="w-4 h-4 rounded-full border border-ink shrink-0"
                            [style.background-color]="col.hex"
                            [title]="col.color"
                          ></span>
                        }
                      </div>
                    </td>

                    <!-- Total Stock -->
                    <td class="py-3 px-4 text-ink-soft">
                      {{ prod.total_stock || 0 }} uds.
                    </td>

                    <!-- Actions -->
                    <td class="py-3 px-4 text-right">
                      <a
                        [routerLink]="['/admin/productos', prod.id]"
                        class="pw-btn pw-btn--secondary inline-flex items-center gap-1 py-2 px-4 text-sm"
                      >
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                        </svg>
                        <span>Editar</span>
                      </a>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>
  `
})
export class ProductsListComponent implements OnInit {
  readonly productService = inject(AdminProductService);
  readonly categoryService = inject(AdminCategoryService);

  readonly searchTerm = signal<string>('');
  readonly selectedCategoryFilter = signal<string>('');

  ngOnInit(): void {
    this.productService.loadProducts().subscribe();
    this.categoryService.loadCategories().subscribe();
  }

  onSearchChange(term: string): void {
    this.searchTerm.set(term);
    this.reload();
  }

  onCategoryFilterChange(catId: string): void {
    this.selectedCategoryFilter.set(catId);
    this.reload();
  }

  private reload(): void {
    this.productService.loadProducts({
      categoryId: this.selectedCategoryFilter(),
      search: this.searchTerm()
    }).subscribe();
  }

  getPhotoUrl(photo: any): string {
    if (typeof photo === 'string') {
      if (photo.startsWith('http')) return photo;
      return `https://images.pexels.com/photos/${photo}/pexels-photo-${photo}.jpeg?auto=compress&cs=tinysrgb&w=800`;
    }
    if (typeof photo === 'number') {
      return `https://images.pexels.com/photos/${photo}/pexels-photo-${photo}.jpeg?auto=compress&cs=tinysrgb&w=800`;
    }
    return 'https://images.pexels.com/photos/34796127/pexels-photo-34796127.jpeg?auto=compress&cs=tinysrgb&w=800';
  }
}
