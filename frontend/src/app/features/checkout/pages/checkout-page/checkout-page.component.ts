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
    <div class="pw-container pt-8 pb-12">
      <nav class="pw-crumbs" aria-label="Migas de pan">
        <a routerLink="/">Inicio</a>
        <span aria-hidden="true">/</span>
        <a routerLink="/carrito">Carrito</a>
        <span aria-hidden="true">/</span>
        <span class="text-ink">Finalizar compra</span>
      </nav>

      <h1 class="pw-title mb-2">Finalizar compra</h1>
      <p class="text-[15px] text-ink-muted mb-8">
        Completa tus datos para registrar tu pedido. Un asesor humano coordinará la entrega y validará el pago.
      </p>

      @if (orderSuccess()) {
        <!-- Vista de confirmación exitosa -->
        <div class="border border-ink rounded-md bg-paper px-6 py-10 text-center max-w-2xl mx-auto">
          <div class="pw-success-icon" aria-hidden="true">✓</div>
          <p class="pw-eyebrow mb-2">Pedido registrado con éxito</p>
          <h2 class="pw-title mb-2.5">Código: {{ orderSuccess()?.pedido_id }}</h2>
          <p class="max-w-[460px] mx-auto mb-6">
            Hemos registrado tu pedido en nuestra base de datos. Se han generado {{ orderSuccess()?.cotizaciones?.length || 1 }} cotización(es) asociada(s).
          </p>

          <div class="max-w-md mx-auto text-left mb-8">
            <div class="pw-summary__line">
              <span>Subtotal</span>
              <span>S/ {{ orderSuccess()?.subtotal?.toFixed(2) }}</span>
            </div>
            @if ((orderSuccess()?.descuento || 0) > 0) {
              <div class="pw-summary__line pw-discount">
                <span class="text-inherit">Descuento promo 3x2</span>
                <span>- S/ {{ orderSuccess()?.descuento?.toFixed(2) }}</span>
              </div>
            }
            <div class="pw-total pt-4 pb-0">
              <span class="pw-total__label">Total a pagar</span>
              <span class="pw-total__value text-[22px]">S/ {{ orderSuccess()?.total?.toFixed(2) }}</span>
            </div>
          </div>

          <div class="flex flex-col sm:flex-row gap-3 justify-center">
            <a [href]="whatsappUrl()" target="_blank" rel="noopener noreferrer" class="pw-btn pw-btn--primary">
              Coordinar entrega por WhatsApp
            </a>
            <a routerLink="/" class="pw-btn pw-btn--secondary">Volver a la tienda</a>
          </div>
        </div>
      } @else if (cart.items().length === 0) {
        <!-- Carrito vacío -->
        <div class="text-center py-14">
          <p class="text-lg mb-6">No tienes prendas en tu carrito para finalizar la compra.</p>
          <a routerLink="/" class="pw-btn pw-btn--primary">Ir al catálogo</a>
        </div>
      } @else {
        <!-- Formulario de Checkout -->
        <div class="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-12 items-start">
          <form (ngSubmit)="submitOrder()">
            <!-- Datos de Contacto -->
            <fieldset class="border-0 p-0 m-0 mb-7">
              <legend class="pw-legend">1. Datos del cliente</legend>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-3.5">
                <div class="pw-field">
                  <label for="co-nombre">Nombre completo *</label>
                  <input
                    id="co-nombre"
                    type="text"
                    [(ngModel)]="cliente.nombre"
                    name="nombre"
                    required
                    minlength="3"
                    placeholder="Ej. María Flores"
                  />
                </div>

                <div class="pw-field">
                  <label for="co-telefono">Teléfono / WhatsApp *</label>
                  <input
                    id="co-telefono"
                    type="tel"
                    [(ngModel)]="cliente.telefono"
                    name="telefono"
                    required
                    minlength="9"
                    placeholder="Ej. 987654321"
                  />
                </div>
              </div>

              <div class="pw-field">
                <label for="co-correo">Correo electrónico (opcional)</label>
                <input
                  id="co-correo"
                  type="email"
                  [(ngModel)]="cliente.correo"
                  name="correo"
                  placeholder="correo@ejemplo.com"
                />
              </div>
            </fieldset>

            <!-- Entrega -->
            <fieldset class="border-0 p-0 m-0 mb-7">
              <legend class="pw-legend">2. Modalidad de entrega</legend>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-3.5">
                <button
                  type="button"
                  (click)="cliente.entrega = 'delivery'"
                  [class.is-active]="cliente.entrega === 'delivery'"
                  [attr.aria-pressed]="cliente.entrega === 'delivery'"
                  class="pw-choice"
                >
                  Envío a domicilio
                </button>
                <button
                  type="button"
                  (click)="cliente.entrega = 'tienda'"
                  [class.is-active]="cliente.entrega === 'tienda'"
                  [attr.aria-pressed]="cliente.entrega === 'tienda'"
                  class="pw-choice"
                >
                  Recojo en tienda
                </button>
              </div>

              @if (cliente.entrega === 'delivery') {
                <div class="pw-field">
                  <label for="co-direccion">Dirección de entrega *</label>
                  <input
                    id="co-direccion"
                    type="text"
                    [(ngModel)]="cliente.direccion"
                    name="direccion"
                    placeholder="Av. Las Magnolias 450, Dpto 301"
                  />
                </div>
                <div class="pw-field">
                  <label for="co-ciudad">Distrito / Ciudad *</label>
                  <input
                    id="co-ciudad"
                    type="text"
                    [(ngModel)]="cliente.ciudad"
                    name="ciudad"
                    placeholder="San Borja, Lima"
                  />
                </div>
              }
            </fieldset>

            <!-- Método de Pago -->
            <fieldset class="border-0 p-0 m-0 mb-7">
              <legend class="pw-legend">3. Método de pago</legend>

              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3.5">
                @for (metodo of ['Yape', 'Plin', 'Transferencia', 'Contraentrega']; track metodo) {
                  <button
                    type="button"
                    (click)="cliente.pago = metodo"
                    [class.is-active]="cliente.pago === metodo"
                    [attr.aria-pressed]="cliente.pago === metodo"
                    class="pw-choice justify-center text-center"
                  >
                    {{ metodo }}
                  </button>
                }
              </div>

              <div class="pw-field">
                <label for="co-notas">Notas especiales (opcional)</label>
                <textarea
                  id="co-notas"
                  [(ngModel)]="cliente.notas"
                  name="notas"
                  rows="3"
                  placeholder="Referencias de entrega, detalles de talla, etc."
                ></textarea>
              </div>
            </fieldset>

            @if (errorMessage()) {
              <div class="pw-alert mb-4" role="alert">{{ errorMessage() }}</div>
            }

            <button type="submit" [disabled]="isSubmitting()" class="pw-btn pw-btn--primary pw-btn--block">
              @if (isSubmitting()) {
                Procesando pedido...
              } @else {
                Confirmar y enviar pedido (S/ {{ cart.totals().total.toFixed(2) }})
              }
            </button>
          </form>

          <!-- Resumen Lateral -->
          <aside class="pw-summary lg:sticky lg:top-24">
            <h3 class="pw-subtitle mb-4">Resumen ({{ cart.totals().unidades }} prendas)</h3>

            <div class="max-h-80 overflow-y-auto mb-2 pr-1">
              @for (item of cart.items(); track item.key) {
                <div class="flex items-center gap-3 py-2.5 border-b border-sand">
                  @if (item.foto) {
                    <img [src]="item.foto" [alt]="item.name" class="w-12 h-14 object-cover object-[center_25%] bg-sand shrink-0" />
                  }
                  <div class="flex-1 min-w-0">
                    <p class="text-sm truncate">{{ item.name }}</p>
                    <p class="pw-meta">Talla {{ item.size }} · {{ item.color }} (x{{ item.qty }})</p>
                  </div>
                  <span class="text-sm font-semibold whitespace-nowrap">S/ {{ (item.price * item.qty).toFixed(2) }}</span>
                </div>
              }
            </div>

            <div class="pw-summary__line">
              <span>Subtotal</span>
              <span>S/ {{ cart.totals().subtotal.toFixed(2) }}</span>
            </div>
            @if (cart.totals().descuento > 0) {
              <div class="pw-summary__line pw-discount">
                <span class="text-inherit">Promo 3x2</span>
                <span>- S/ {{ cart.totals().descuento.toFixed(2) }}</span>
              </div>
            }
            <div class="pw-total pt-4 pb-0">
              <span class="pw-total__label">Total a pagar</span>
              <span class="pw-total__value text-[22px]">S/ {{ cart.totals().total.toFixed(2) }}</span>
            </div>
          </aside>
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
