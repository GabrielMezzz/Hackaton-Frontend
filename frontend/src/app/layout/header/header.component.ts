import { Component, inject, computed } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { CatalogService } from '../../core/services/catalog.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <!-- Announcement bar -->
    <div class="pw-announcement">
      Vestimos sueños, sonrisas y recuerdos:
      <a routerLink="/catalogo/todo">Descubre</a>
    </div>

    <header class="sticky top-0 z-40 bg-paper border-b border-ink">
      <div class="grid grid-cols-[auto_1fr] md:grid-cols-[1fr_auto_1fr] items-center gap-x-8 px-4 py-3 md:px-10 md:py-3.5">
        <!-- Nav Menu (100% Dinámico desde PostgreSQL) -->
        <nav class="hidden md:flex items-center gap-8 justify-self-start">
          <a
            routerLink="/"
            routerLinkActive="is-active"
            [routerLinkActiveOptions]="{ exact: true }"
            class="pw-nav-link"
          >Inicio</a>
          @for (cat of topCategories(); track cat.id) {
            <a [routerLink]="['/catalogo', cat.slug]" routerLinkActive="is-active" class="pw-nav-link capitalize">
              {{ cat.name }}
            </a>
          }
        </nav>

        <!-- Logo -->
        <a
          routerLink="/"
          class="justify-self-start md:justify-self-center rounded-lg px-2 py-1 focus:outline-none focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2"
          aria-label="Angibell creaciones, ir al inicio"
        >
          <span class="pw-logo">Angibell<small>creaciones</small></span>
        </a>

        <!-- Admin + Cart -->
        <div class="flex items-center gap-4 justify-self-end">
          <a routerLink="/admin/categorias" class="hidden md:inline pw-nav-link text-sm">Admin</a>
          <a routerLink="/carrito" class="relative inline-block pt-1.5 pr-2">
            <span class="pw-btn pw-btn--secondary inline-flex items-center gap-2 h-10 py-0 px-5 text-sm">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              Carrito
            </span>
            @if (cart.count() > 0) {
              <span class="pw-badge absolute top-0 right-0">{{ cart.count() }}</span>
            }
          </a>
        </div>
      </div>
    </header>
  `
})
export class HeaderComponent {
  readonly cart = inject(CartService);
  readonly catalog = inject(CatalogService);

  readonly topCategories = computed(() => {
    return this.catalog.categories().slice(0, 5);
  });
}
