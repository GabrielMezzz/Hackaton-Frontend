import { Component, inject, signal, computed } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CatalogService } from '../../../../core/services/catalog.service';
import { ProductCardComponent } from '../../components/product-card/product-card.component';

@Component({
  selector: 'app-catalog-page',
  standalone: true,
  imports: [ProductCardComponent],
  template: `
    <!-- Hero Banner -->
    <section class="bg-gradient-to-b from-emerald-50/60 to-white py-12 md:py-16 border-b border-gray-100">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <span class="inline-block px-3 py-1 mb-3 text-xs font-semibold text-emerald-800 bg-emerald-100/80 rounded-full">
          Colección Exclusiva 2026
        </span>
        <h1 class="text-3xl md:text-5xl font-extrabold text-stone-900 tracking-tight mb-4">
          Moda Infantil & Alta Confección
        </h1>
        <p class="max-w-2xl mx-auto text-stone-600 text-sm md:text-base leading-relaxed mb-8">
          Prendas finas diseñadas con amor y atención a cada detalle. Pruébate cualquier prenda virtualmente con nuestro asistente de Inteligencia Artificial.
        </p>

        <!-- Category Pills -->
        <div class="flex items-center justify-center gap-2 flex-wrap">
          <button
            type="button"
            (click)="selectedCategory.set('todo')"
            [class.bg-emerald-700]="selectedCategory() === 'todo'"
            [class.text-white]="selectedCategory() === 'todo'"
            [class.bg-white]="selectedCategory() !== 'todo'"
            [class.text-stone-700]="selectedCategory() !== 'todo'"
            class="px-5 py-2 rounded-full text-xs font-semibold border border-stone-200 hover:border-emerald-500 shadow-2xs transition"
          >
            Todo el catálogo
          </button>
          <button
            type="button"
            (click)="selectedCategory.set('ninas')"
            [class.bg-emerald-700]="selectedCategory() === 'ninas'"
            [class.text-white]="selectedCategory() === 'ninas'"
            [class.bg-white]="selectedCategory() !== 'ninas'"
            [class.text-stone-700]="selectedCategory() !== 'ninas'"
            class="px-5 py-2 rounded-full text-xs font-semibold border border-stone-200 hover:border-emerald-500 shadow-2xs transition"
          >
            Niñas
          </button>
          <button
            type="button"
            (click)="selectedCategory.set('ninos')"
            [class.bg-emerald-700]="selectedCategory() === 'ninos'"
            [class.text-white]="selectedCategory() === 'ninos'"
            [class.bg-white]="selectedCategory() !== 'ninos'"
            [class.text-stone-700]="selectedCategory() !== 'ninos'"
            class="px-5 py-2 rounded-full text-xs font-semibold border border-stone-200 hover:border-emerald-500 shadow-2xs transition"
          >
            Niños
          </button>
          <button
            type="button"
            (click)="selectedCategory.set('personalizados')"
            [class.bg-emerald-700]="selectedCategory() === 'personalizados'"
            [class.text-white]="selectedCategory() === 'personalizados'"
            [class.bg-white]="selectedCategory() !== 'personalizados'"
            [class.text-stone-700]="selectedCategory() !== 'personalizados'"
            class="px-5 py-2 rounded-full text-xs font-semibold border border-stone-200 hover:border-emerald-500 shadow-2xs transition"
          >
            Personalizados
          </button>
        </div>
      </div>
    </section>

    <!-- Product Grid -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        @for (item of filteredProducts(); track item.key) {
          <app-product-card [product]="item" />
        }
      </div>
    </main>
  `
})
export class CatalogPageComponent {
  private readonly catalog = inject(CatalogService);
  private readonly route = inject(ActivatedRoute);

  readonly selectedCategory = signal<string>('todo');

  readonly filteredProducts = computed(() => {
    const cat = this.selectedCategory();
    const all = this.catalog.products();
    if (cat === 'todo') return all;
    return all.filter(p => p.tipo === cat);
  });

  constructor() {
    this.route.paramMap.subscribe(params => {
      const c = params.get('categoria');
      if (c) this.selectedCategory.set(c);
    });
  }
}
