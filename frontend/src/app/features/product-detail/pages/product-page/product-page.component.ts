import { Component, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CatalogService } from '../../../../core/services/catalog.service';
import { CartService } from '../../../../core/services/cart.service';
import { WebhookChatService } from '../../../../core/services/webhook-chat.service';
import { ProbadorIaComponent } from '../../components/probador-ia/probador-ia.component';
import { Product } from '../../../../core/models/product.model';

@Component({
  selector: 'app-product-page',
  standalone: true,
  imports: [RouterLink, ProbadorIaComponent],
  template: `
    @if (product(); as p) {
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <!-- Breadcrumbs -->
        <nav class="flex items-center gap-2 text-xs text-stone-500 mb-8">
          <a routerLink="/" class="hover:text-emerald-700">Inicio</a>
          <span>/</span>
          <a [routerLink]="['/catalogo', p.tipo]" class="hover:text-emerald-700 capitalize">{{ p.publico }}</a>
          <span>/</span>
          <span class="text-stone-900 font-medium truncate">{{ p.name }}</span>
        </nav>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          <!-- Main Photo -->
          <div class="aspect-3/4 rounded-2xl overflow-hidden bg-stone-100 shadow-md">
            @if (activePhoto()) {
              <img [src]="activePhoto()" [alt]="p.name" class="w-full h-full object-cover" />
            }
          </div>

          <!-- Product Options & Actions -->
          <div class="flex flex-col">
            <span class="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">{{ p.publico }} · SKU: {{ p.sku }}</span>
            <h1 class="text-2xl md:text-3xl font-extrabold text-stone-900 mb-3">{{ p.name }}</h1>
            <p class="text-2xl font-bold text-emerald-900 mb-6">S/ {{ p.price.toFixed(2) }}</p>

            <p class="text-sm text-stone-600 leading-relaxed mb-6">{{ p.description }}</p>

            <!-- Color Options -->
            <div class="mb-6">
              <label class="block text-xs font-bold text-stone-900 uppercase tracking-wider mb-2">
                Color: <span class="font-normal text-stone-600">{{ p.colors[selectedColorIndex()]?.nombre }}</span>
              </label>
              <div class="flex items-center gap-2">
                @for (c of p.colors; track c.nombre; let i = $index) {
                  <button
                    type="button"
                    (click)="selectedColorIndex.set(i)"
                    [class.ring-2]="selectedColorIndex() === i"
                    [class.ring-emerald-700]="selectedColorIndex() === i"
                    class="w-8 h-8 rounded-full border-2 border-white shadow-md hover:scale-105 transition"
                    [style.backgroundColor]="c.hex"
                    [title]="c.nombre"
                  ></button>
                }
              </div>
            </div>

            <!-- Size Selector -->
            <div class="mb-6">
              <label class="block text-xs font-bold text-stone-900 uppercase tracking-wider mb-2">Talla</label>
              <div class="flex items-center gap-2 flex-wrap">
                @for (s of p.sizes; track s) {
                  <button
                    type="button"
                    (click)="selectedSize.set(s)"
                    [class.bg-emerald-800]="selectedSize() === s"
                    [class.text-white]="selectedSize() === s"
                    [class.bg-white]="selectedSize() !== s"
                    [class.text-stone-800]="selectedSize() !== s"
                    class="px-4 py-2 rounded-xl text-xs font-bold border border-stone-300 hover:border-emerald-600 transition"
                  >
                    Talla {{ s }}
                  </button>
                }
              </div>
            </div>

            <!-- Stock message -->
            <p class="text-xs text-stone-500 mb-6 flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-emerald-500"></span> Stock disponible para entrega inmediata.
            </p>

            <!-- Action Buttons -->
            <div class="flex flex-col sm:flex-row gap-3 mb-8">
              <button
                type="button"
                (click)="addToCart()"
                class="flex-1 py-3.5 px-6 rounded-full font-bold text-sm bg-emerald-700 hover:bg-emerald-800 text-white shadow-md hover:shadow-lg transition text-center"
              >
                Agregar al carrito
              </button>
              <button
                type="button"
                (click)="quoteWhatsApp()"
                class="flex-1 py-3.5 px-6 rounded-full font-bold text-sm bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 transition text-center inline-flex items-center justify-center gap-2"
              >
                💬 Cotizar por WhatsApp
              </button>
            </div>

            <!-- Embedded Probador IA -->
            <app-probador-ia [prenda]="probadorPrenda()" />
          </div>
        </div>
      </div>
    } @else {
      <div class="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 class="text-2xl font-bold text-stone-800 mb-4">Prenda no encontrada</h2>
        <a routerLink="/" class="text-emerald-700 font-semibold underline">Volver al catálogo</a>
      </div>
    }
  `
})
export class ProductPageComponent {
  private readonly catalog = inject(CatalogService);
  private readonly cart = inject(CartService);
  private readonly chat = inject(WebhookChatService);
  private readonly route = inject(ActivatedRoute);

  readonly product = signal<Product | undefined>(undefined);
  readonly selectedColorIndex = signal(0);
  readonly selectedSize = signal('0');

  readonly activePhoto = computed(() => {
    const p = this.product();
    if (!p || !p.colors) return '';
    return p.colors[this.selectedColorIndex()]?.foto || '';
  });

  readonly probadorPrenda = computed(() => {
    const p = this.product();
    return {
      name: p?.name || '',
      price: p ? `S/ ${p.price.toFixed(2)}` : '',
      img: this.activePhoto(),
      sku: p?.sku || ''
    };
  });

  constructor() {
    this.route.paramMap.subscribe(params => {
      const key = params.get('key');
      if (key) {
        const found = this.catalog.getByKey(key);
        this.product.set(found);
        if (found?.sizes?.length) {
          this.selectedSize.set(found.sizes[0]);
        }
      }
    });
  }

  addToCart(): void {
    const p = this.product();
    if (!p) return;
    const col = p.colors[this.selectedColorIndex()];
    this.cart.addItem({
      key: `${p.sku}|${this.selectedSize()}|${this.selectedColorIndex()}`,
      pkey: p.key,
      sku: p.sku,
      name: p.name,
      price: p.price,
      foto: col?.foto,
      colorIdx: this.selectedColorIndex(),
      color: col?.nombre || 'Estándar',
      colorHex: col?.hex || '#000000',
      size: this.selectedSize(),
      qty: 1,
      available: 10,
      tipo: p.tipo,
      publico: p.publico
    });
  }

  quoteWhatsApp(): void {
    const p = this.product();
    if (!p) return;
    const col = p.colors[this.selectedColorIndex()]?.nombre || 'Estándar';
    this.chat.quoteItem(p.name, col, this.selectedSize(), p.sku, 1);
  }
}
