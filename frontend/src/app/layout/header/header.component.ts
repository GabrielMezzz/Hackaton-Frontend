import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink],
  template: `
    <header class="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-xs">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16 gap-4">
          <!-- Logo -->
          <a routerLink="/" class="flex items-center gap-2 font-bold text-xl tracking-tight text-emerald-950">
            <span class="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center text-sm font-black shadow-sm">A</span>
            <span>Angibell <span class="text-emerald-700 font-normal">Creaciones</span></span>
          </a>

          <!-- Nav Menu -->
          <nav class="hidden md:flex items-center gap-6 text-sm font-medium text-gray-700">
            <a routerLink="/" class="hover:text-emerald-700 transition">Inicio</a>
            <a routerLink="/catalogo/ninas" class="hover:text-emerald-700 transition">Niñas</a>
            <a routerLink="/catalogo/ninos" class="hover:text-emerald-700 transition">Niños</a>
            <a routerLink="/catalogo/personalizados" class="hover:text-emerald-700 transition">Personalizados</a>
          </nav>

          <!-- Cart Action -->
          <div class="flex items-center gap-3">
            <a
              routerLink="/carrito"
              class="relative inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition shadow-xs"
            >
              <svg class="w-5 h-5 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span>Carrito</span>
              @if (cart.count() > 0) {
                <span class="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-emerald-600 rounded-full animate-pulse">
                  {{ cart.count() }}
                </span>
              }
            </a>
          </div>
        </div>
      </div>
    </header>
  `
})
export class HeaderComponent {
  readonly cart = inject(CartService);
}
