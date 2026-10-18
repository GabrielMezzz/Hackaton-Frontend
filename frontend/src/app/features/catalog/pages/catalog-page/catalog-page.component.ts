import { Component, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CatalogService } from '../../../../core/services/catalog.service';
import { ProductCardComponent } from '../../components/product-card/product-card.component';

@Component({
  selector: 'app-catalog-page',
  standalone: true,
  imports: [ProductCardComponent],
  template: `
    <!-- Hero Banner -->
    <section class="bg-sand px-6 py-16 md:py-20">
      <div class="max-w-[720px] mx-auto bg-paper rounded-md px-7 py-10 text-center">
        <p class="pw-eyebrow mb-3">Colección Exclusiva 2026</p>
        <h1 class="pw-display mb-4">Moda Infantil &amp; Alta Confección</h1>
        <p class="text-lg mb-0">
          Prendas finas confeccionadas a mano. Pruébate cualquier prenda virtualmente con nuestro probador con Inteligencia Artificial.
        </p>
      </div>
    </section>

    <main class="pw-container py-12">
      <!-- Category Chips (100% Dinámicas desde PostgreSQL) -->
      <div class="flex items-center justify-center gap-2 flex-wrap mb-10">
        <button
          type="button"
          (click)="selectCategory('todo')"
          [class.is-active]="selectedCategory() === 'todo'"
          class="pw-chip"
        >
          Todo el catálogo
        </button>

        @for (cat of catalog.categories(); track cat.id) {
          <button
            type="button"
            (click)="selectCategory(cat.slug)"
            [class.is-active]="selectedCategory() === cat.slug"
            class="pw-chip"
          >
            {{ cat.name }}
          </button>
        }
      </div>

      <!-- Skeleton Loading State (Zero Hardcode Flash) -->
      @if (catalog.loading()) {
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-8">
          @for (placeholder of [1, 2, 3, 4, 5, 6, 7, 8]; track placeholder) {
            <div class="text-center">
              <div class="pw-skeleton aspect-3/4 rounded w-full"></div>
              <div class="pw-skeleton h-3.5 rounded w-3/4 mx-auto mt-3.5"></div>
              <div class="pw-skeleton h-3.5 rounded w-1/4 mx-auto mt-2"></div>
            </div>
          }
        </div>
      } @else if (catalog.error()) {
        <div class="bg-red-50 border border-red-200 text-red-900 rounded-xl px-6 py-10 text-center max-w-xl mx-auto shadow-sm">
          <div class="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>
          <p class="text-lg font-bold mb-1">No se pudo cargar el catálogo de la base de datos</p>
          <p class="text-xs text-red-700 mb-6 font-mono bg-red-100/50 p-2.5 rounded-lg border border-red-200">{{ catalog.error() }}</p>
          <button type="button" (click)="catalog.loadFromApi()" class="pw-btn pw-btn--primary">
            🔄 Reintentar conexión
          </button>
        </div>
      } @else if (filteredProducts().length === 0) {
        <div class="pw-section--sand rounded-md px-6 py-12 text-center max-w-xl mx-auto">
          <p class="pw-subtitle mb-1">No hay prendas disponibles en esta categoría</p>
          <p class="text-sm text-ink-muted mb-6">Explora otras categorías o regresa a todo el catálogo.</p>
          <button type="button" (click)="selectCategory('todo')" class="pw-btn pw-btn--primary">
            Ver todo el catálogo
          </button>
        </div>
      } @else {
        <!-- Real PostgreSQL Product Cards -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-8">
          @for (item of filteredProducts(); track item.key) {
            <app-product-card [product]="item" />
          }
        </div>
      }
    </main>
  `
})
export class CatalogPageComponent {
  readonly catalog = inject(CatalogService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly selectedCategory = signal<string>('todo');

  readonly filteredProducts = computed(() => {
    const normalize = (s: string) =>
      (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ñ/g, 'n').trim();

    const cat = normalize(this.selectedCategory());
    const all = this.catalog.products();
    if (cat === 'todo' || !cat) return all;

    return all.filter(p => {
      const pTipo = normalize(p.tipo);
      const pSlug = normalize(p.category_slug || '');
      const pName = normalize(p.categoria || p.category_name || '');
      const pPublico = normalize(p.publico || '');

      return pTipo === cat || pSlug === cat || pName === cat || pPublico === cat;
    });
  });

  constructor() {
    this.route.paramMap.subscribe(params => {
      const c = params.get('categoria');
      if (c) {
        this.selectedCategory.set(c);
      } else {
        this.selectedCategory.set('todo');
      }
    });
  }

  selectCategory(slug: string): void {
    this.selectedCategory.set(slug);
    if (slug === 'todo') {
      this.router.navigate(['/']);
    } else {
      this.router.navigate(['/catalogo', slug]);
    }
  }
}
