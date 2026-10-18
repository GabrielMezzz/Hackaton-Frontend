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
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 class="text-3xl font-extrabold text-stone-900 mb-8">Tu Carrito de Compras</h1>

      @if (cart.items().length === 0) {
        <div class="bg-white rounded-2xl p-12 text-center border border-stone-200 max-w-lg mx-auto shadow-xs">
          <div class="text-5xl mb-4">🛒</div>
          <h2 class="text-xl font-bold text-stone-800 mb-2">Tu carrito está vacío</h2>
          <p class="text-sm text-stone-500 mb-6">Explora nuestra colección y encuentra las mejores prendas infantiles.</p>
          <a routerLink="/" class="inline-block px-6 py-3 bg-emerald-700 text-white font-semibold text-xs rounded-full hover:bg-emerald-800 transition">
            Ver catálogo
          </a>
        </div>
      } @else {
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
          
          <!-- Item List -->
          <div class="lg:col-span-2 space-y-4">
            @for (item of cart.items(); track item.key) {
              <div class="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs flex items-center gap-4">
                @if (item.foto) {
                  <img [src]="item.foto" [alt]="item.name" class="w-20 h-24 object-cover rounded-xl bg-stone-100 shrink-0" />
                }
                
                <div class="flex-1 min-w-0">
                  <h3 class="font-bold text-stone-900 text-sm truncate">{{ item.name }}</h3>
                  <p class="text-xs text-stone-500 mt-0.5">
                    Talla {{ item.size }} · Color {{ item.color }} · SKU: {{ item.sku }}
                  </p>
                  <p class="text-sm font-semibold text-emerald-800 mt-1">S/ {{ item.price.toFixed(2) }}</p>

                  <button
                    type="button"
                    (click)="quoteCartItem(item)"
                    class="text-xs font-semibold text-emerald-700 hover:text-emerald-800 underline mt-2 block"
                  >
                    💬 Cotizar esta prenda por WhatsApp
                  </button>
                </div>

                <!-- Quantity controls -->
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    (click)="cart.updateQty(item.key, item.qty - 1)"
                    [disabled]="item.qty <= 1"
                    class="w-7 h-7 rounded-full border border-stone-300 flex items-center justify-center font-bold text-xs hover:bg-stone-100 disabled:opacity-40 transition"
                  >
                    -
                  </button>
                  <span class="w-6 text-center font-bold text-xs">{{ item.qty }}</span>
                  <button
                    type="button"
                    (click)="cart.updateQty(item.key, item.qty + 1)"
                    class="w-7 h-7 rounded-full border border-stone-300 flex items-center justify-center font-bold text-xs hover:bg-stone-100 transition"
                  >
                    +
                  </button>
                </div>

                <!-- Line subtotal -->
                <div class="text-right shrink-0">
                  <p class="font-bold text-sm text-stone-900">S/ {{ (item.price * item.qty).toFixed(2) }}</p>
                  <button
                    type="button"
                    (click)="cart.removeItem(item.key)"
                    class="text-xs text-red-500 hover:text-red-700 mt-2 block ml-auto"
                  >
                    Quitar
                  </button>
                </div>
              </div>
            }
          </div>

          <!-- Order Summary -->
          <div class="bg-white p-6 rounded-2xl border border-stone-200 shadow-md">
            <h2 class="text-lg font-bold text-stone-900 mb-4 pb-3 border-b border-stone-100">Resumen del Pedido</h2>

            <div class="space-y-3 text-sm text-stone-600 mb-6">
              <div class="flex justify-between">
                <span>Subtotal ({{ cart.totals().unidades }} prendas)</span>
                <span>S/ {{ cart.totals().subtotal.toFixed(2) }}</span>
              </div>

              @if (cart.totals().descuento > 0) {
                <div class="flex justify-between text-emerald-700 font-medium">
                  <span>Promoción 3x2</span>
                  <span>- S/ {{ cart.totals().descuento.toFixed(2) }}</span>
                </div>
              }

              <div class="flex justify-between text-base font-extrabold text-stone-900 pt-3 border-t border-stone-100">
                <span>Total a pagar</span>
                <span>S/ {{ cart.totals().total.toFixed(2) }}</span>
              </div>
            </div>

            <div class="space-y-3">
              <button
                type="button"
                (click)="quoteAllCart()"
                class="w-full py-3 px-4 rounded-full font-bold text-xs bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 transition text-center flex items-center justify-center gap-2"
              >
                💬 Cotizar carrito por WhatsApp
              </button>
              
              <a
                routerLink="/checkout"
                class="block w-full py-3.5 px-4 rounded-full font-bold text-xs bg-emerald-700 hover:bg-emerald-800 text-white shadow-md transition text-center"
              >
                Finalizar Compra
              </a>
            </div>
          </div>

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
