import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-claims-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="pw-container pt-8 pb-12">
      <nav class="pw-crumbs" aria-label="Migas de pan">
        <a routerLink="/">Inicio</a>
        <span aria-hidden="true">/</span>
        <span class="text-ink">Libro de Reclamaciones</span>
      </nav>

      <div class="max-w-3xl mx-auto">
        <p class="pw-eyebrow mb-2">Ley N° 29571 · INDECOPI</p>
        <h1 class="pw-title mb-2">Libro de Reclamaciones Virtual</h1>
        <p class="pw-note mb-8">
          Conforme a lo establecido en el Código de Protección y Defensa del Consumidor, ponemos a tu disposición nuestro Libro de Reclamaciones Virtual.
        </p>

        @if (ticket()) {
          <!-- Confirmation view -->
          <div class="border border-ink rounded-md bg-paper px-6 py-10 text-center">
            <div class="pw-success-icon" aria-hidden="true">✓</div>
            <p class="pw-eyebrow mb-2">Hoja de reclamación registrada</p>
            <h2 class="pw-title mb-2.5">Código: {{ ticket() }}</h2>
            <p class="max-w-md mx-auto mb-6 text-ink-muted">
              Conforme a ley, daremos respuesta a tu reclamo o queja en un plazo máximo de 15 días hábiles a través del correo electrónico registrado.
            </p>
            <a routerLink="/" class="pw-btn pw-btn--primary">Volver a la tienda</a>
          </div>
        } @else {
          <form (ngSubmit)="submitClaim()">
            <!-- 1. Consumer identification -->
            <fieldset class="border-0 p-0 m-0 mb-7">
              <legend class="pw-legend">1. Identificación del consumidor reclamante</legend>

              <div class="pw-field">
                <label for="cl-nombre">Nombre y Apellidos *</label>
                <input
                  id="cl-nombre"
                  type="text"
                  [(ngModel)]="claim.nombre"
                  name="nombre"
                  required
                  placeholder="Tu nombre completo"
                />
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-3.5">
                <div class="pw-field">
                  <label for="cl-documento">DNI / Carnet de Extranjería *</label>
                  <input
                    id="cl-documento"
                    type="text"
                    [(ngModel)]="claim.documento"
                    name="documento"
                    required
                    placeholder="Número de documento"
                  />
                </div>

                <div class="pw-field">
                  <label for="cl-telefono">Teléfono celular *</label>
                  <input
                    id="cl-telefono"
                    type="tel"
                    [(ngModel)]="claim.telefono"
                    name="telefono"
                    required
                    placeholder="987654321"
                  />
                </div>
              </div>

              <div class="pw-field">
                <label for="cl-correo">Correo Electrónico *</label>
                <input
                  id="cl-correo"
                  type="email"
                  [(ngModel)]="claim.correo"
                  name="correo"
                  required
                  placeholder="tu@email.com"
                />
              </div>

              <div class="pw-field">
                <label for="cl-domicilio">Domicilio *</label>
                <input
                  id="cl-domicilio"
                  type="text"
                  [(ngModel)]="claim.domicilio"
                  name="domicilio"
                  required
                  placeholder="Dirección, Distrito y Ciudad"
                />
              </div>
            </fieldset>

            <!-- 2. Claim type and detail -->
            <fieldset class="border-0 p-0 m-0 mb-7">
              <legend class="pw-legend">2. Detalle de la reclamación</legend>

              <p class="pw-caption mb-2.5">Tipo de reclamo *</p>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-3.5">
                <label class="pw-choice cursor-pointer" [class.is-active]="claim.tipo === 'reclamo'">
                  <input type="radio" [(ngModel)]="claim.tipo" name="tipo" value="reclamo" class="pw-checkbox shrink-0" />
                  <span><strong>Reclamo:</strong> Disconformidad con el producto o servicio</span>
                </label>

                <label class="pw-choice cursor-pointer" [class.is-active]="claim.tipo === 'queja'">
                  <input type="radio" [(ngModel)]="claim.tipo" name="tipo" value="queja" class="pw-checkbox shrink-0" />
                  <span><strong>Queja:</strong> Malestar respecto a la atención recibida</span>
                </label>
              </div>

              <div class="pw-field">
                <label for="cl-referencia">Código de Pedido o Prenda (opcional)</label>
                <input
                  id="cl-referencia"
                  type="text"
                  [(ngModel)]="claim.referencia"
                  name="referencia"
                  placeholder="Ej. PED-XXXX o SKU TER-001"
                />
              </div>

              <div class="pw-field">
                <label for="cl-detalle">Detalle del reclamo o queja *</label>
                <textarea
                  id="cl-detalle"
                  [(ngModel)]="claim.detalle"
                  name="detalle"
                  rows="4"
                  required
                  placeholder="Describe de manera detallada los hechos ocurridos..."
                  class="resize-none"
                ></textarea>
              </div>

              <div class="pw-field">
                <label for="cl-solucion">Pedido concreto del consumidor *</label>
                <textarea
                  id="cl-solucion"
                  [(ngModel)]="claim.solucion"
                  name="solucion"
                  rows="2"
                  required
                  placeholder="¿Cuál es la solución o pedido que solicitas?"
                  class="resize-none"
                ></textarea>
              </div>
            </fieldset>

            @if (error()) {
              <div class="pw-alert mb-4" role="alert">{{ error() }}</div>
            }

            <button type="submit" class="pw-btn pw-btn--primary pw-btn--block">
              Enviar hoja de reclamación
            </button>
          </form>
        }
      </div>
    </div>
  `
})
export class ClaimsPageComponent {
  readonly ticket = signal<string | null>(null);
  readonly error = signal('');

  claim = {
    nombre: '',
    documento: '',
    telefono: '',
    correo: '',
    domicilio: '',
    tipo: 'reclamo',
    referencia: '',
    detalle: '',
    solucion: ''
  };

  submitClaim(): void {
    if (!this.claim.nombre || !this.claim.documento || !this.claim.telefono || !this.claim.correo || !this.claim.detalle) {
      this.error.set('Por favor completa todos los campos requeridos (*)');
      return;
    }
    this.error.set('');
    const id = 'REC-2026-' + Math.floor(100000 + Math.random() * 900000);
    this.ticket.set(id);
  }
}
