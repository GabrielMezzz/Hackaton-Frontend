import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CartService } from '../../../../core/services/cart.service';

interface OrderResponse {
  pedido_id: string;
  cotizaciones: number[];
  subtotal: number;
  descuento: number;
  total: number;
  disponible: boolean;
}

@Component({
  selector: 'app-checkout-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <nav class="text-xs text-stone-500 mb-6 flex items-center gap-2">
        <a routerLink="/" class="hover:text-emerald-700">Inicio</a>
        <span>/</span>
        <a routerLink="/carrito" class="hover:text-emerald-700">Carrito</a>
        <span>/</span>
        <span class="text-stone-800 font-semibold">Finalizar Compra</span>
      </nav>

      <h1 class="text-2xl sm:text-3xl font-extrabold text-stone-900 mb-2">Finalizar Compra</h1>
      <p class="text-stone-600 text-sm mb-8">
        Completa tus datos para registrar tu pedido. Un asesor humano coordinará la entrega y validará el pago.
      </p>

      @if (orderSuccess()) {
        <!-- Vista de confirmación exitosa -->
        <div class="bg-white rounded-3xl p-8 sm:p-10 border border-emerald-200 shadow-sm text-center">
          <div class="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center text-3xl mx-auto mb-5 shadow-xs">
            ✓
          </div>
          <span class="inline-block px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-full mb-3">
            Pedido Registrado con Éxito
          </span>
          <h2 class="text-2xl font-extrabold text-stone-900 mb-2">
            Código: <span class="text-emerald-700">{{ orderSuccess()?.pedido_id }}</span>
          </h2>
          <p class="text-stone-600 text-sm max-w-lg mx-auto mb-6">
            Hemos registrado tu pedido en nuestra base de datos. Se han generado {{ orderSuccess()?.cotizaciones?.length || 1 }} cotización(es) asociada(s).
          </p>

          <div class="bg-stone-50 rounded-2xl p-5 max-w-md mx-auto text-left text-xs text-stone-700 space-y-2 mb-8 border border-stone-200">
            <div class="flex justify-between">
              <span class="text-stone-500">Subtotal:</span>
              <span class="font-semibold">S/ {{ orderSuccess()?.subtotal?.toFixed(2) }}</span>
            </div>
            @if ((orderSuccess()?.descuento || 0) > 0) {
              <div class="flex justify-between text-emerald-700 font-semibold">
                <span>Descuento Promo 3x2:</span>
                <span>- S/ {{ orderSuccess()?.descuento?.toFixed(2) }}</span>
              </div>
            }
            <div class="flex justify-between text-sm font-extrabold text-stone-900 pt-2 border-t border-stone-200">
              <span>Total a pagar:</span>
              <span class="text-emerald-800">S/ {{ orderSuccess()?.total?.toFixed(2) }}</span>
            </div>
          </div>

          <div class="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              [href]="whatsappUrl()"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-full shadow-md transition"
            >
              💬 Coordinar entrega por WhatsApp
            </a>
            <a
              routerLink="/"
              class="inline-flex items-center justify-center px-6 py-3.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs rounded-full transition"
            >
              Volver a la tienda
            </a>
          </div>
        </div>
      } @else if (cart.items().length === 0) {
        <!-- Carrito vacío -->
        <div class="bg-white rounded-3xl p-10 border border-stone-200 text-center">
          <p class="text-stone-500 text-sm mb-4">No tienes prendas en tu carrito para finalizar la compra.</p>
          <a routerLink="/" class="inline-block px-6 py-3 bg-emerald-700 text-white font-semibold text-xs rounded-full hover:bg-emerald-800 transition">
            Ir al catálogo
          </a>
        </div>
      } @else {
        <!-- Formulario de Checkout -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          <div class="lg:col-span-2 bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-xs">
            <form (ngSubmit)="submitOrder()" class="space-y-6">
              
              <!-- Datos de Contacto -->
              <div>
                <h2 class="text-base font-bold text-stone-900 mb-4 pb-2 border-b border-stone-100 flex items-center gap-2">
                  <span class="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs">1</span>
                  Datos del Cliente
                </h2>
                
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs font-semibold text-stone-700 mb-1">Nombre completo *</label>
                    <input
                      type="text"
                      [(ngModel)]="cliente.nombre"
                      name="nombre"
                      required
                      minlength="3"
                      placeholder="Ej. María Flores"
                      class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>

                  <div>
                    <label class="block text-xs font-semibold text-stone-700 mb-1">Teléfono / WhatsApp *</label>
                    <input
                      type="tel"
                      [(ngModel)]="cliente.telefono"
                      name="telefono"
                      required
                      minlength="9"
                      placeholder="Ej. 987654321"
                      class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>

                  <div class="sm:col-span-2">
                    <label class="block text-xs font-semibold text-stone-700 mb-1">Correo electrónico (opcional)</label>
                    <input
                      type="email"
                      [(ngModel)]="cliente.correo"
                      name="correo"
                      placeholder="correo@ejemplo.com"
                      class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                </div>
              </div>

              <!-- Entrega -->
              <div>
                <h2 class="text-base font-bold text-stone-900 mb-4 pb-2 border-b border-stone-100 flex items-center gap-2">
                  <span class="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs">2</span>
                  Modalidad de Entrega
                </h2>

                <div class="grid grid-cols-2 gap-3 mb-4">
                  <button
                    type="button"
                    (click)="cliente.entrega = 'delivery'"
                    [class.border-emerald-600]="cliente.entrega === 'delivery'"
                    [class.bg-emerald-50]="cliente.entrega === 'delivery'"
                    class="p-3 text-left rounded-xl border border-stone-200 text-xs font-semibold transition"
                  >
                    🛵 Envío a domicilio
                  </button>

                  <button
                    type="button"
                    (click)="cliente.entrega = 'tienda'"
                    [class.border-emerald-600]="cliente.entrega === 'tienda'"
                    [class.bg-emerald-50]="cliente.entrega === 'tienda'"
                    class="p-3 text-left rounded-xl border border-stone-200 text-xs font-semibold transition"
                  >
                    🏪 Recojo en tienda
                  </button>
                </div>

                @if (cliente.entrega === 'delivery') {
                  <div class="space-y-3 pt-2">
                    <div>
                      <label class="block text-xs font-semibold text-stone-700 mb-1">Dirección de entrega *</label>
                      <input
                        type="text"
                        [(ngModel)]="cliente.direccion"
                        name="direccion"
                        placeholder="Av. Las Magnolias 450, Dpto 301"
                        class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>
                    <div>
                      <label class="block text-xs font-semibold text-stone-700 mb-1">Distrito / Ciudad *</label>
                      <input
                        type="text"
                        [(ngModel)]="cliente.ciudad"
                        name="ciudad"
                        placeholder="San Borja, Lima"
                        class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>
                  </div>
                }
              </div>

              <!-- Método de Pago -->
              <div>
                <h2 class="text-base font-bold text-stone-900 mb-4 pb-2 border-b border-stone-100 flex items-center gap-2">
                  <span class="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs">3</span>
                  Método de Pago
                </h2>

                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                  @for (metodo of ['Yape', 'Plin', 'Transferencia', 'Contraentrega']; track metodo) {
                    <button
                      type="button"
                      (click)="cliente.pago = metodo"
                      [class.border-emerald-600]="cliente.pago === metodo"
                      [class.bg-emerald-50]="cliente.pago === metodo"
                      [class.text-emerald-900]="cliente.pago === metodo"
                      class="py-2.5 px-3 text-center rounded-xl border border-stone-200 text-xs font-semibold transition"
                    >
                      {{ metodo }}
                    </button>
                  }
                </div>

                <div>
                  <label class="block text-xs font-semibold text-stone-700 mb-1">Notas especiales (opcional)</label>
                  <textarea
                    [(ngModel)]="cliente.notas"
                    name="notas"
                    rows="2"
                    placeholder="Referencias de entrega, detalles de talla, etc."
                    class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 resize-none"
                  ></textarea>
                </div>
              </div>

              @if (errorMessage()) {
                <div class="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                  {{ errorMessage() }}
                </div>
              }

              <button
                type="submit"
                [disabled]="isSubmitting()"
                class="w-full py-4 rounded-full font-bold text-xs bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white shadow-md transition flex items-center justify-center gap-2"
              >
                @if (isSubmitting()) {
                  <span>Procesando pedido...</span>
                } @else {
                  <span>Confirmar y Enviar Pedido (S/ {{ cart.totals().total.toFixed(2) }})</span>
                }
              </button>
            </form>
          </div>

          <!-- Resumen Lateral -->
          <div class="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs">
            <h3 class="text-sm font-bold text-stone-900 mb-4 pb-2 border-b border-stone-100">
              Resumen ({{ cart.totals().unidades }} prendas)
            </h3>

            <div class="space-y-3 max-h-80 overflow-y-auto mb-4 pr-1">
              @for (item of cart.items(); track item.key) {
                <div class="flex items-center gap-3 text-xs">
                  @if (item.foto) {
                    <img [src]="item.foto" [alt]="item.name" class="w-12 h-14 object-cover rounded-lg bg-stone-100 shrink-0" />
                  }
                  <div class="flex-1 min-w-0">
                    <p class="font-bold text-stone-900 truncate">{{ item.name }}</p>
                    <p class="text-stone-500">Talla {{ item.size }} · {{ item.color }} (x{{ item.qty }})</p>
                  </div>
                  <span class="font-semibold text-stone-900">S/ {{ (item.price * item.qty).toFixed(2) }}</span>
                </div>
              }
            </div>

            <div class="pt-3 border-t border-stone-100 space-y-2 text-xs text-stone-600">
              <div class="flex justify-between">
                <span>Subtotal:</span>
                <span>S/ {{ cart.totals().subtotal.toFixed(2) }}</span>
              </div>
              @if (cart.totals().descuento > 0) {
                <div class="flex justify-between text-emerald-700 font-semibold">
                  <span>Promo 3x2:</span>
                  <span>- S/ {{ cart.totals().descuento.toFixed(2) }}</span>
                </div>
              }
              <div class="flex justify-between text-sm font-extrabold text-stone-900 pt-2 border-t border-stone-100">
                <span>Total a pagar:</span>
                <span class="text-emerald-800">S/ {{ cart.totals().total.toFixed(2) }}</span>
              </div>
            </div>
          </div>

        </div>
      }
    </div>
  `
})
export class CheckoutPageComponent {
  readonly cart = inject(CartService);
  private readonly http = inject(HttpClient);

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal('');
  readonly orderSuccess = signal<OrderResponse | null>(null);

  cliente = {
    nombre: '',
    telefono: '',
    correo: '',
    entrega: 'delivery',
    direccion: '',
    ciudad: '',
    pago: 'Yape',
    notas: ''
  };

  whatsappUrl = signal('');

  submitOrder(): void {
    if (this.cliente.nombre.trim().length < 3) {
      this.errorMessage.set('Por favor ingresa tu nombre completo (mínimo 3 caracteres).');
      return;
    }
    if (this.cliente.telefono.trim().length < 9) {
      this.errorMessage.set('Por favor ingresa un número de teléfono válido (mínimo 9 dígitos).');
      return;
    }
    if (this.cliente.entrega === 'delivery' && !this.cliente.direccion.trim()) {
      this.errorMessage.set('Por favor ingresa la dirección para la entrega.');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const payload = {
      cliente: this.cliente,
      prendas: this.cart.items().map(it => ({
        sku: it.sku,
        talla: it.size,
        color: it.color || 'Estándar',
        cantidad: it.qty
      }))
    };

    this.http.post<OrderResponse>('/api/pedidos', payload).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        this.orderSuccess.set(res);
        const msg = encodeURIComponent(
          `¡Hola Angibell! Acabo de registrar el pedido web ${res.pedido_id} a nombre de ${this.cliente.nombre} por un total de S/ ${res.total.toFixed(2)}. Quisiera coordinar el pago y la entrega.`
        );
        this.whatsappUrl.set(`https://wa.me/51999999999?text=${msg}`);
        this.cart.clear();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(
          err.error?.error || 'Ocurrió un error al procesar tu pedido. Por favor intenta nuevamente.'
        );
      }
    });
  }
}
