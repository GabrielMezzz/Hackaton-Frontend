import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-claims-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <nav class="text-xs text-stone-500 mb-6 flex items-center gap-2">
        <a routerLink="/" class="hover:text-emerald-700">Inicio</a>
        <span>/</span>
        <span class="text-stone-800 font-semibold">Libro de Reclamaciones</span>
      </nav>

      <div class="text-center mb-8">
        <span class="inline-block px-3 py-1 bg-amber-100 text-amber-900 text-xs font-bold rounded-full mb-3">
          Ley N° 29571 · INDECOPI
        </span>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-stone-900 mb-2">Libro de Reclamaciones Virtual</h1>
        <p class="text-stone-600 text-xs sm:text-sm max-w-xl mx-auto">
          Conforme a lo establecido en el Código de Protección y Defensa del Consumidor, ponemos a tu disposición nuestro Libro de Reclamaciones Virtual.
        </p>
      </div>

      @if (ticket()) {
        <div class="bg-white rounded-3xl p-8 sm:p-10 border border-stone-200 shadow-sm text-center">
          <div class="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
            ✓
          </div>
          <h2 class="text-xl font-bold text-stone-900 mb-2">Hoja de Reclamación Registrada</h2>
          <p class="text-xs text-stone-500 mb-4">
            Tu código de constancia es: <span class="font-bold text-stone-800">{{ ticket() }}</span>
          </p>
          <p class="text-xs text-stone-600 max-w-md mx-auto mb-6">
            Conforme a ley, daremos respuesta a tu reclamo o queja en un plazo máximo de 15 días hábiles a través del correo electrónico registrado.
          </p>
          <a
            routerLink="/"
            class="inline-block px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-full transition"
          >
            Volver a la tienda
          </a>
        </div>
      } @else {
        <form (ngSubmit)="submitClaim()" class="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-xs space-y-6">
          <!-- 1. Identificación del consumidor -->
          <div>
            <h2 class="text-sm font-bold text-stone-900 mb-4 pb-2 border-b border-stone-100">
              1. Identificación del Consumidor Reclamante
            </h2>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="sm:col-span-2">
                <label class="block text-xs font-semibold text-stone-700 mb-1">Nombre y Apellidos *</label>
                <input
                  type="text"
                  [(ngModel)]="claim.nombre"
                  name="nombre"
                  required
                  placeholder="Tu nombre completo"
                  class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold text-stone-700 mb-1">DNI / Carnet de Extranjería *</label>
                <input
                  type="text"
                  [(ngModel)]="claim.documento"
                  name="documento"
                  required
                  placeholder="Número de documento"
                  class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold text-stone-700 mb-1">Teléfono celular *</label>
                <input
                  type="tel"
                  [(ngModel)]="claim.telefono"
                  name="telefono"
                  required
                  placeholder="987654321"
                  class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div class="sm:col-span-2">
                <label class="block text-xs font-semibold text-stone-700 mb-1">Correo Electrónico *</label>
                <input
                  type="email"
                  [(ngModel)]="claim.correo"
                  name="correo"
                  required
                  placeholder="tu@email.com"
                  class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div class="sm:col-span-2">
                <label class="block text-xs font-semibold text-stone-700 mb-1">Domicilio *</label>
                <input
                  type="text"
                  [(ngModel)]="claim.domicilio"
                  name="domicilio"
                  required
                  placeholder="Dirección, Distrito y Ciudad"
                  class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            </div>
          </div>

          <!-- 2. Tipo y Detalle -->
          <div>
            <h2 class="text-sm font-bold text-stone-900 mb-4 pb-2 border-b border-stone-100">
              2. Detalle de la Reclamación
            </h2>

            <div class="space-y-4">
              <div>
                <label class="block text-xs font-semibold text-stone-700 mb-2">Tipo de reclamo *</label>
                <div class="grid grid-cols-2 gap-3">
                  <label
                    class="flex items-center gap-2 p-3 rounded-xl border cursor-pointer text-xs"
                    [class.border-emerald-600]="claim.tipo === 'reclamo'"
                    [class.bg-emerald-50]="claim.tipo === 'reclamo'"
                  >
                    <input type="radio" [(ngModel)]="claim.tipo" name="tipo" value="reclamo" class="text-emerald-700" />
                    <span><strong>Reclamo:</strong> Disconformidad con el producto o servicio</span>
                  </label>

                  <label
                    class="flex items-center gap-2 p-3 rounded-xl border cursor-pointer text-xs"
                    [class.border-emerald-600]="claim.tipo === 'queja'"
                    [class.bg-emerald-50]="claim.tipo === 'queja'"
                  >
                    <input type="radio" [(ngModel)]="claim.tipo" name="tipo" value="queja" class="text-emerald-700" />
                    <span><strong>Queja:</strong> Malestar respecto a la atención recibida</span>
                  </label>
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold text-stone-700 mb-1">Código de Pedido o Prenda (opcional)</label>
                <input
                  type="text"
                  [(ngModel)]="claim.referencia"
                  name="referencia"
                  placeholder="Ej. PED-XXXX o SKU TER-001"
                  class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold text-stone-700 mb-1">Detalle del reclamo o queja *</label>
                <textarea
                  [(ngModel)]="claim.detalle"
                  name="detalle"
                  rows="4"
                  required
                  placeholder="Describe de manera detallada los hechos ocurridos..."
                  class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 resize-none"
                ></textarea>
              </div>

              <div>
                <label class="block text-xs font-semibold text-stone-700 mb-1">Pedido concreto del consumidor *</label>
                <textarea
                  [(ngModel)]="claim.solucion"
                  name="solucion"
                  rows="2"
                  required
                  placeholder="¿Cuál es la solución o pedido que solicitas?"
                  class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 resize-none"
                ></textarea>
              </div>
            </div>
          </div>

          @if (error()) {
            <div class="p-3 bg-red-50 text-red-700 rounded-xl text-xs border border-red-200">
              {{ error() }}
            </div>
          }

          <button
            type="submit"
            class="w-full py-4 rounded-full font-bold text-xs bg-emerald-700 hover:bg-emerald-800 text-white shadow-md transition"
          >
            Enviar Hoja de Reclamación
          </button>
        </form>
      }
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
