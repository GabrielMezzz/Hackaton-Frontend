import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  template: `
    <footer class="bg-paper text-ink border-t border-ink px-6 pt-12 pb-8">
      <div class="max-w-[1280px] mx-auto text-center">
        <span class="pw-logo">Angibell<small>creaciones</small></span>
        <h3 class="pw-section-title my-4">Angibell creaciones</h3>
        <p class="max-w-[560px] mx-auto mb-10">
          Ropa infantil única para el día a día y eventos especiales. Diseños personalizados, ajustables y con el
          encanto de haberlo hecho a mano, para que cada niño brille con su propio estilo.
        </p>
      </div>

      <nav class="max-w-[1280px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.1fr_1.3fr] gap-8 text-left">
        <section>
          <h4 class="pw-footer-heading">Categorías</h4>
          <a routerLink="/catalogo/ninas" class="pw-footer-link">Niñas</a>
          <a routerLink="/catalogo/ninos" class="pw-footer-link">Niños</a>
          <a routerLink="/catalogo/personalizados" class="pw-footer-link">Personalizados y Hecho a su estilo</a>
        </section>

        <section>
          <h4 class="pw-footer-heading">Legal</h4>
          <a routerLink="/reclamaciones" class="pw-footer-link">Libro de reclamaciones</a>
        </section>

        <section>
          <h4 class="pw-footer-heading">Ubícanos</h4>
          <p class="pw-footer-link">Calle Real Nº 666-Stand 117-118, Huancayo, Junín</p>
          <p class="pw-footer-link">Envíos a todo el país</p>
        </section>

        <section>
          <h4 class="pw-footer-heading">Contáctanos</h4>
          <a href="tel:51954862029" class="pw-footer-link">+51 954 862 029</a>
          <p class="pw-footer-link">Asesor virtual disponible 24/7 vía WhatsApp</p>
        </section>
      </nav>

      <hr class="pw-divider pw-divider--sand max-w-[1280px] mx-auto mt-10" />
      <p class="pw-caption text-center mt-6">
        © {{ currentYear }} Angibell Creaciones. Todos los derechos reservados.
      </p>
    </footer>
  `
})
export class FooterComponent {
  readonly currentYear = new Date().getFullYear();
}
