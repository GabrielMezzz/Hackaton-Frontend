import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartService } from '../../../../core/services/cart.service';
import { WebhookChatService } from '../../../../core/services/webhook-chat.service';
import { CartItem } from '../../../../core/models/cart.model';

@Component({
  selector: 'app-cart-page',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="pw-container pt-8 pb-12">
      <h1 class="pw-title mb-6">Tu carrito</h1>

      @if (cart.items().length === 0) {
        <div class="text-center py-14">
          <p class="text-lg mb-6">Tu carrito está vacío.</p>
          <a routerLink="/" class="pw-btn pw-btn--primary">Ver catálogo</a>
        </div>
      } @else {
        <div class="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-12 items-start">
          <!-- Item List -->
          <div class="border-t border-ink">
            @for (item of cart.items(); track item.key) {
              <div class="pw-cart-item max-sm:grid-cols-[72px_1fr] max-sm:gap-3">
                @if (item.foto) {
                  <img [src]="item.foto" [alt]="item.name" class="max-sm:w-[72px] max-sm:h-[72px]" />
                } @else {
                  <span class="block w-full aspect-square bg-sand"></span>
                }

                <div class="min-w-0">
                  <p class="mb-1 leading-normal truncate">{{ item.name }}</p>
                  <p class="pw-meta">Talla {{ item.size }} · {{ item.color }} · S/ {{ item.price.toFixed(2) }}</p>
                  <button type="button" (click)="quoteCartItem(item)" class="pw-remove px-0 mt-1">
                    Cotizar por WhatsApp
                  </button>
                </div>

                <!-- Quantity controls -->
                <div class="pw-qty max-sm:col-start-2 max-sm:justify-self-start">
                  <button
                    type="button"
                    (click)="cart.updateQty(item.key, item.qty - 1)"
                    [disabled]="item.qty <= 1"
                    aria-label="Quitar una unidad"
                  >−</button>
                  <span>{{ item.qty }}</span>
                  <button
                    type="button"
                    (click)="cart.updateQty(item.key, item.qty + 1)"
                    aria-label="Agregar una unidad"
                  >+</button>
                </div>

                <!-- Line subtotal -->
                <div class="text-right max-sm:col-start-2 max-sm:text-left">
                  <p class="font-semibold whitespace-nowrap">S/ {{ (item.price * item.qty).toFixed(2) }}</p>
                  <button type="button" (click)="cart.removeItem(item.key)" class="pw-remove px-0">Quitar</button>
                </div>
              </div>
            }
          </div>

          <!-- Order Summary -->
          <aside class="pw-summary lg:sticky lg:top-24">
            <h2 class="pw-subtitle mb-4">Resumen del pedido</h2>

            <div class="pw-summary__line">
              <span>Subtotal ({{ cart.totals().unidades }} prendas)</span>
              <span>S/ {{ cart.totals().subtotal.toFixed(2) }}</span>
            </div>

            @if (cart.totals().descuento > 0) {
              <div class="pw-summary__line pw-discount">
                <span class="text-inherit">Promoción 3x2</span>
                <span>- S/ {{ cart.totals().descuento.toFixed(2) }}</span>
              </div>
            }

            <div class="pw-total pt-4 pb-0">
              <span class="pw-total__label">Total</span>
              <span class="pw-total__value text-[22px]">S/ {{ cart.totals().total.toFixed(2) }}</span>
            </div>

            <div class="flex flex-col gap-3 mt-5">
              <a routerLink="/checkout" class="pw-btn pw-btn--primary pw-btn--block">Finalizar compra</a>
              <button type="button" (click)="quoteAllCart()" class="pw-btn pw-btn--secondary pw-btn--block">
                Cotizar carrito por WhatsApp
              </button>
            </div>
          </aside>
        </div>
      }
    </div>
  `
})
export class CartPageComponent {
  readonly cart = inject(CartService);
  private readonly chat = inject(WebhookChatService);

  quoteCartItem(item: CartItem): void {
    this.chat.quoteItem(item.name, item.color || 'Estándar', item.size, item.sku, item.qty);
  }

  quoteAllCart(): void {
    const items = this.cart.items();
    if (!items.length) return;
    this.quoteCartItem(items[0]);
  }
}
