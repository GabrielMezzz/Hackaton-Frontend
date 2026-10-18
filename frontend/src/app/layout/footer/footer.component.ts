import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  template: `
    <footer class="bg-stone-900 text-stone-300 py-12 border-t border-stone-800 text-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h3 class="text-white font-bold text-base mb-3">Angibell Creaciones</h3>
          <p class="text-stone-400 text-xs leading-relaxed max-w-sm">
            Prendas de alta calidad para niñas y niños. Confección cuidadosa, diseños exclusivos y probador interactivo con Inteligencia Artificial.
          </p>
        </div>

        <div>
          <h4 class="text-white font-semibold text-sm mb-3">Navegación</h4>
          <ul class="space-y-2 text-xs text-stone-400">
            <li><a routerLink="/" class="hover:text-white transition">Inicio</a></li>
            <li><a routerLink="/catalogo/ninas" class="hover:text-white transition">Catálogo Niñas</a></li>
            <li><a routerLink="/catalogo/ninos" class="hover:text-white transition">Catálogo Niños</a></li>
            <li><a routerLink="/reclamaciones" class="hover:text-white transition">Libro de Reclamaciones</a></li>
          </ul>
        </div>

        <div>
          <h4 class="text-white font-semibold text-sm mb-3">Atención al Cliente</h4>
          <p class="text-xs text-stone-400 mb-2">Lima, Perú · Envíos a todo el país</p>
          <p class="text-xs text-emerald-400 font-medium">Asesor virtual disponible 24/7 vía WhatsApp</p>
        </div>
      </div>
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pt-6 border-t border-stone-800/60 text-center text-xs text-stone-500">
        © {{ currentYear }} Angibell Creaciones. Todos los derechos reservados.
      </div>
    </footer>
  `
})
export class FooterComponent {
  readonly currentYear = new Date().getFullYear();
}
