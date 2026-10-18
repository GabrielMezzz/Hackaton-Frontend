import { Component, inject, signal, computed, effect } from '@angular/core';
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
      <div class="pw-container pt-8 pb-12">
        <!-- Breadcrumbs -->
        <nav class="pw-crumbs" aria-label="Migas de pan">
          <a routerLink="/">Inicio</a>
          <span aria-hidden="true">/</span>
          <a [routerLink]="['/catalogo', p.tipo]" class="capitalize">{{ p.publico }}</a>
          <span aria-hidden="true">/</span>
          <span class="text-ink truncate">{{ p.name }}</span>
        </nav>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-14 items-start">
          <!-- Main Photo -->
          <div class="aspect-4/5 overflow-hidden bg-sand rounded md:sticky md:top-24">
            @if (activePhoto()) {
              <img [src]="activePhoto()" [alt]="p.name" class="w-full h-full object-cover object-[center_30%]" />
            }
          </div>

          <!-- Product Options & Actions -->
          <div class="flex flex-col">
            <p class="pw-eyebrow mb-2">{{ p.publico }} · SKU: {{ p.sku }}</p>
            <h1 class="text-[22px] xl:text-[30px] leading-tight tracking-[-0.02em] mb-3">{{ p.name }}</h1>
            <p class="pw-price mb-6">S/ {{ p.price.toFixed(2) }}</p>

            <p class="text-sm leading-relaxed text-ink-soft mb-6">{{ p.description }}</p>

            <!-- Color Options -->
            <div class="mb-6">
              <p class="pw-label">Color: <span>{{ p.colors[selectedColorIndex()]?.nombre }}</span></p>
              <div class="flex flex-wrap gap-2.5">
                @for (c of p.colors; track c.nombre; let i = $index) {
                  <button
                    type="button"
                    (click)="selectedColorIndex.set(i)"
                    [class.is-active]="selectedColorIndex() === i"
                    [attr.aria-pressed]="selectedColorIndex() === i"
                    [attr.aria-label]="'Color ' + c.nombre"
                    [title]="c.nombre"
                    class="pw-swatch"
                  >
                    <span [style.backgroundColor]="c.hex"></span>
                  </button>
                }
              </div>
            </div>

            <!-- Size Selector -->
            <div class="mb-2">
              <p class="pw-label">Talla: <span>{{ selectedSize() }}</span></p>
              <div class="flex flex-wrap gap-2">
                @for (s of p.sizes; track s) {
                  <button
                    type="button"
                    (click)="selectedSize.set(s)"
                    [class.is-active]="selectedSize() === s"
                    [attr.aria-pressed]="selectedSize() === s"
                    class="pw-size"
                  >
                    {{ s }}
                  </button>
                }
              </div>
            </div>

            <!-- Stock message -->
            <p class="text-[13px] text-ink-muted mb-6">Stock disponible para entrega inmediata.</p>

            <!-- Action Buttons -->
            <div class="flex flex-col gap-3">
              <button type="button" (click)="addToCart()" class="pw-btn pw-btn--primary pw-btn--block">
                Agregar al carrito
              </button>
              <button type="button" (click)="quoteWhatsApp()" class="pw-btn pw-btn--secondary pw-btn--block">
                Cotizar por WhatsApp
              </button>
            </div>

            <!-- Embedded Probador IA -->
            <app-probador-ia [prenda]="probadorPrenda()" />
          </div>
        </div>
      </div>
    } @else if (catalog.loading()) {
      <div class="pw-container py-24 text-center">
        <div class="pw-spinner mx-auto mb-3"></div>
        <p class="text-sm text-ink-muted">Cargando prenda desde la base de datos...</p>
      </div>
    } @else {
      <div class="pw-container py-20 text-center">
        <h2 class="pw-title mb-4">Prenda no encontrada</h2>
        <a routerLink="/" class="pw-link">Volver al catálogo</a>
      </div>
    }
  `
})
export class ProductPageComponent {
  readonly catalog = inject(CatalogService);
  private readonly cart = inject(CartService);
  private readonly chat = inject(WebhookChatService);
  private readonly route = inject(ActivatedRoute);

  readonly key = signal<string>('');
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
      const k = params.get('key');
      if (k) this.key.set(k);
    });

    // Reactive sync with PostgreSQL data arrival
    effect(() => {
      const prods = this.catalog.products();
      const k = this.key();
      if (k && prods.length > 0) {
        this.syncProduct();
      }
    });
  }

  private syncProduct(): void {
    const k = this.key();
    if (!k) return;
    const found = this.catalog.getByKey(k);
    if (found) {
      this.product.set(found);
      if (found.sizes?.length) {
        this.selectedSize.set(found.sizes[0]);
      }
    }
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
