import { Component, Input, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Product } from '../../../../core/models/product.model';
import { WebhookChatService } from '../../../../core/services/webhook-chat.service';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="group flex flex-col bg-white rounded-2xl overflow-hidden border border-stone-100 hover:border-emerald-200 shadow-xs hover:shadow-xl transition-all duration-300">
      <!-- Image box -->
      <a [routerLink]="['/prenda', product.id]" class="relative aspect-3/4 overflow-hidden bg-stone-100 block">
        @if (product.colors && product.colors[0]?.foto) {
          <img
            [src]="product.colors[0].foto"
            [alt]="product.name"
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        } @else {
          <div class="w-full h-full flex items-center justify-center text-stone-400 font-medium text-sm">
            {{ product.name }}
          </div>
        }
        <span class="absolute top-3 left-3 bg-white/90 backdrop-blur-xs text-emerald-950 font-bold text-xs px-2.5 py-1 rounded-full shadow-xs">
          {{ product.publico }}
        </span>
      </a>

      <!-- Content -->
      <div class="p-4 flex flex-col flex-1">
        <div class="flex items-center gap-1.5 mb-2">
          @for (c of product.colors; track c.nombre) {
            <span
              class="w-3.5 h-3.5 rounded-full border border-black/10 inline-block shadow-2xs"
              [style.backgroundColor]="c.hex"
              [title]="c.nombre"
            ></span>
          }
        </div>

        <h3 class="font-semibold text-stone-900 text-sm leading-snug line-clamp-2 mb-2 group-hover:text-emerald-700 transition">
          <a [routerLink]="['/prenda', product.id]">{{ product.name }}</a>
        </h3>

        <div class="mt-auto flex items-center justify-between pt-3 border-t border-stone-100">
          <span class="font-bold text-base text-stone-900">S/ {{ product.price.toFixed(2) }}</span>

          <button
            type="button"
            (click)="quoteProduct()"
            class="text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition inline-flex items-center gap-1"
            title="Cotizar esta prenda por WhatsApp"
          >
            💬 Cotizar
          </button>
        </div>
      </div>
    </div>
  `
})
export class ProductCardComponent {
  @Input({ required: true }) product!: Product;
  private readonly chat = inject(WebhookChatService);

  quoteProduct(): void {
    const col = this.product.colors?.[0]?.nombre || 'Estándar';
    const sz = this.product.sizes?.[0] || '0';
    this.chat.quoteItem(this.product.name, col, sz, this.product.sku, 1);
  }
}
