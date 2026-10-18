import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="min-h-screen bg-paper text-ink flex font-sans">
      <!-- Sidebar -->
      <aside class="w-64 bg-sand flex flex-col shrink-0 border-r border-ink">
        <!-- Brand -->
        <div class="p-5 border-b border-ink flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-full bg-ink flex items-center justify-center text-paper font-semibold text-lg">
              A
            </div>
            <div>
              <h1 class="text-sm font-semibold text-ink tracking-wide">ANGIBELL</h1>
              <p class="pw-eyebrow">Panel Administrador</p>
            </div>
          </div>
        </div>

        <!-- Navigation Links -->
        <nav class="flex-1 px-5 py-6 space-y-4">
          <a
            routerLink="/admin/categorias"
            routerLinkActive="is-active"
            class="pw-nav-link flex items-center gap-3 text-[15px]"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
            </svg>
            <span>CRUD Categorías</span>
          </a>

          <a
            routerLink="/admin/productos"
            routerLinkActive="is-active"
            class="pw-nav-link flex items-center gap-3 text-[15px]"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
            </svg>
            <span>Gestión de Productos</span>
          </a>
        </nav>

        <!-- Footer / Return to Store -->
        <div class="p-4 border-t border-ink">
          <a
            routerLink="/"
            class="pw-btn pw-btn--secondary pw-btn--block py-2 px-4 text-sm inline-flex items-center justify-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
            </svg>
            <span>Volver a la Tienda</span>
          </a>
        </div>
      </aside>

      <!-- Main Content Area -->
      <div class="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <!-- Top header bar -->
        <header class="h-16 bg-paper border-b border-ink px-8 flex items-center justify-between sticky top-0 z-10">
          <div class="flex items-center gap-2 text-xs text-ink-muted">
            <span class="text-ink-subtle">Admin</span>
            <span>/</span>
            <span class="font-medium text-ink">Gestión de Catálogo & Cloudinary</span>
          </div>

          <div class="flex items-center gap-3">
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-sand text-ink border border-sand-border">
              <span class="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></span>
              PostgreSQL Conectado
            </span>
          </div>
        </header>

        <!-- Content Subpage Outlet -->
        <main class="flex-1 p-8">
          <router-outlet />
        </main>
      </div>
    </div>
  `
})
export class AdminLayoutComponent {}
