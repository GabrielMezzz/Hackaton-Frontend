import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminCategoryService } from '../../../../core/services/admin-category.service';
import { AdminProductService, AdminProduct } from '../../../../core/services/admin-product.service';
import { Category } from '../../../../core/models/category.model';

@Component({
  selector: 'app-category-detail',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="space-y-8 max-w-7xl mx-auto">
      <!-- Breadcrumb & Back -->
      <div class="flex items-center gap-3">
        <a
          routerLink="/admin/categorias"
          class="p-2 rounded-full bg-paper border border-ink text-ink hover:bg-sand transition"
          title="Volver al listado de categorías"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
          </svg>
        </a>
        <div>
          <h2 class="pw-title flex items-center gap-2.5">
            <span>Segregación: {{ currentCategory()?.name || 'Cargando...' }}</span>
            @if (currentCategory()?.active) {
              <span class="text-xs font-normal px-2.5 py-0.5 rounded-full bg-ink text-paper">Activa</span>
            }
          </h2>
          <p class="pw-meta mt-0.5">Organiza y segrega qué prendas pertenecen exclusivamente a esta categoría</p>
        </div>
      </div>

      <!-- Category Info / Quick Edit Card -->
      @if (currentCategory(); as cat) {
        <div class="pw-summary bg-paper grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <!-- Thumbnail & Identity -->
          <div class="flex items-center gap-4 md:col-span-1">
            <div class="w-20 h-20 rounded-md bg-sand border border-sand-border flex items-center justify-center overflow-hidden shrink-0">
              @if (cat.image_url) {
                <img [src]="cat.image_url" [alt]="cat.name" class="w-full h-full object-cover" />
              } @else {
                <span class="text-ink font-semibold text-2xl uppercase">{{ cat.name.slice(0, 1) }}</span>
              }
            </div>
            <div>
              <span class="pw-eyebrow">Categoría</span>
              <h3 class="pw-subtitle">{{ cat.name }}</h3>
              <p class="text-xs font-mono text-ink-subtle">Slug: /{{ cat.slug }}</p>
            </div>
          </div>

          <!-- Description & Stats -->
          <div class="md:col-span-2 flex flex-col justify-between h-full space-y-3">
            <p class="text-sm text-ink-muted">
              {{ cat.description || 'Sin descripción detallada.' }}
            </p>
            <div class="flex items-center gap-6 pt-3 border-t border-sand text-sm">
              <div class="flex items-center gap-2">
                <span class="text-ink-subtle">Prendas asignadas:</span>
                <span class="font-semibold text-ink">{{ assignedProducts().length }}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-ink-subtle">Stock total acumulado:</span>
                <span class="font-semibold text-ink">{{ totalStock() }} unidades</span>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Segregation Layout: Two columns (Assigned vs Available) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <!-- Column 1: Assigned Products (Current Category) -->
        <div class="lg:col-span-7 space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-base font-medium text-ink flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-ink"></span>
              <span>Prendas en esta categoría ({{ assignedProducts().length }})</span>
            </h3>
            <span class="pw-eyebrow">Segregadas actualmente</span>
          </div>

          @if (assignedProducts().length === 0) {
            <div class="bg-sand rounded-md border border-dashed border-ink p-10 text-center text-ink-muted">
              <svg class="w-10 h-10 mx-auto mb-2 text-ink-subtle stroke-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
              </svg>
              <p class="text-sm font-medium text-ink">No hay prendas asignadas a esta categoría</p>
              <p class="pw-meta mt-1">Selecciona productos de la lista de la derecha para agregarlos a esta categoría.</p>
            </div>
          } @else {
            <div class="bg-paper rounded-md border border-ink overflow-hidden divide-y divide-sand">
              @for (prod of assignedProducts(); track prod.id) {
                <div class="p-4 flex items-center justify-between gap-4 hover:bg-sand-light transition">
                  <div class="flex items-center gap-3 min-w-0">
                    <!-- Photo -->
                    <div class="w-12 h-12 rounded-md bg-sand overflow-hidden shrink-0 border border-sand-border">
                      @if (prod.colores && prod.colores.length > 0 && prod.colores[0].foto) {
                        <img [src]="getPhotoUrl(prod.colores[0].foto)" [alt]="prod.name" class="w-full h-full object-cover" />
                      } @else {
                        <div class="w-full h-full flex items-center justify-center text-ink-subtle text-xs">Foto</div>
                      }
                    </div>

                    <!-- Details -->
                    <div class="min-w-0">
                      <div class="flex items-center gap-2">
                        <span class="text-[11px] font-mono text-ink bg-sand px-1.5 py-0.5 rounded-sm">{{ prod.id }}</span>
                        <h4 class="text-sm font-medium text-ink truncate">{{ prod.name }}</h4>
                      </div>
                      <div class="flex items-center gap-3 text-xs text-ink-muted mt-1">
                        <span>Precio: <b class="font-semibold text-ink">S/ {{ prod.base_price }}</b></span>
                        <span>·</span>
                        <span>Público: {{ prod.audience }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Action: Remove from category -->
                  <div class="flex items-center gap-3 shrink-0">
                    <a
                      [routerLink]="['/admin/productos', prod.id]"
                      class="p-1.5 text-ink-subtle hover:text-ink hover:bg-sand rounded-full transition"
                      title="Editar prenda"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                      </svg>
                    </a>

                    <button
                      type="button"
                      (click)="removeProductFromCategory(prod.id)"
                      class="pw-remove text-error text-xs inline-flex items-center gap-1"
                      title="Desvincular de esta categoría"
                    >
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                      <span>Desvincular</span>
                    </button>
                  </div>
                </div>
              }
            </div>
          }
        </div>

        <!-- Column 2: Available Products in Store to Assign -->
        <div class="lg:col-span-5 space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-base font-medium text-ink flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full border border-ink bg-sand"></span>
              <span>Otras prendas de la tienda</span>
            </h3>
            <span class="pw-eyebrow">Disponibles para agregar</span>
          </div>

          <!-- Search filter for available products -->
          <div class="bg-sand p-3 rounded-md border border-ink">
            <input
              type="text"
              [ngModel]="otherSearch()"
              (ngModelChange)="otherSearch.set($event)"
              placeholder="Filtrar por SKU o prenda..."
              class="w-full text-sm text-ink bg-paper border border-ink rounded-md px-3 py-2 focus:outline-2 focus:outline-ink focus:outline-offset-1"
            />
          </div>

          <!-- List of unassigned/other products -->
          <div class="bg-paper rounded-md border border-ink max-h-[500px] overflow-y-auto divide-y divide-sand">
            @for (prod of filteredOtherProducts(); track prod.id) {
              <div class="p-3 flex items-center justify-between gap-3 hover:bg-sand-light transition">
                <div class="min-w-0">
                  <div class="flex items-center gap-1.5">
                    <span class="text-[10px] font-mono text-ink-muted bg-sand px-1 rounded-sm">{{ prod.id }}</span>
                    <h5 class="text-sm font-medium text-ink truncate">{{ prod.name }}</h5>
                  </div>
                  <p class="text-xs text-ink-subtle mt-0.5">Cat. actual: {{ prod.category_name || prod.category || 'Sin categoría' }}</p>
                </div>

                <button
                  type="button"
                  (click)="assignProductToCategory(prod.id)"
                  class="pw-btn pw-btn--primary py-1.5 px-3 text-xs shrink-0"
                >
                  + Asignar
                </button>
              </div>
            } @empty {
              <div class="p-8 text-center pw-meta">
                No hay otras prendas disponibles para vincular.
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `
})
export class CategoryDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  readonly categoryService = inject(AdminCategoryService);
  readonly productService = inject(AdminProductService);

  readonly categoryId = signal<string>('');
  readonly otherSearch = signal<string>('');

  currentCategory = this.categoryService.currentCategory;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.categoryId.set(id);
      this.categoryService.getCategory(id).subscribe();
      this.productService.loadProducts().subscribe();
    }
  }

  assignedProducts(): any[] {
    const cat = this.currentCategory();
    return (cat && cat.productos) ? cat.productos : [];
  }

  totalStock(): number {
    return this.assignedProducts().length * 15; // Estimación basada en variantes
  }

  filteredOtherProducts(): AdminProduct[] {
    const assignedIds = new Set(this.assignedProducts().map(p => p.id));
    const all = this.productService.products();
    const q = this.otherSearch().trim().toLowerCase();

    return all.filter(p => {
      if (assignedIds.has(p.id)) return false;
      if (!q) return true;
      return p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q);
    });
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

  assignProductToCategory(productId: string): void {
    const cat = this.currentCategory();
    if (!cat) return;

    const currentIds = this.assignedProducts().map(p => p.id);
    const updatedIds = Array.from(new Set([...currentIds, productId]));

    this.categoryService.reassignProducts(cat.id, updatedIds).subscribe();
  }

  removeProductFromCategory(productId: string): void {
    const cat = this.currentCategory();
    if (!cat) return;

    const currentIds = this.assignedProducts().map(p => p.id);
    const updatedIds = currentIds.filter(id => id !== productId);

    this.categoryService.reassignProducts(cat.id, updatedIds).subscribe();
  }
}
