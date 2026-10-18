import { Component, Input, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Product } from '../../../../core/models/product.model';
import { WebhookChatService } from '../../../../core/services/webhook-chat.service';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [RouterLink],
  template: `
    <article class="pw-card">
      <!-- Image box -->
      <a [routerLink]="['/prenda', product.id]" class="pw-card__pic">
        @if (product.colors && product.colors[0]?.foto) {
          <img [src]="product.colors[0].foto" [alt]="product.name" loading="lazy" />
        } @else {
          <span class="w-full h-full flex items-center justify-center px-4 text-sm text-ink-subtle">
            {{ product.name }}
          </span>
        }
        @if (product.publico) {
          <span class="pw-tag absolute top-3 left-3">{{ product.publico }}</span>
        }
      </a>

      <!-- Content -->
      <a [routerLink]="['/prenda', product.id]" class="pw-card__name line-clamp-2">{{ product.name }}</a>
      <span class="pw-card__price">S/ {{ product.price.toFixed(2) }}</span>

      @if (product.colors?.length) {
        <div class="pw-card__dots">
          @for (c of product.colors; track c.nombre) {
            <i [style.backgroundColor]="c.hex" [title]="c.nombre"></i>
          }
        </div>
      }

      <button
        type="button"
        (click)="quoteProduct()"
        class="pw-link text-sm mt-1"
        title="Cotizar esta prenda por WhatsApp"
      >
        Cotizar por WhatsApp
      </button>
    </article>
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
