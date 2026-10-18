import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './layout/header/header.component';
import { FooterComponent } from './layout/footer/footer.component';
import { FloatingWhatsappComponent } from './layout/whatsapp-chat/whatsapp-chat.component';
import { CatalogService } from './core/services/catalog.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent, FloatingWhatsappComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  private readonly catalog = inject(CatalogService);

  ngOnInit(): void {
    this.catalog.loadFromApi();
  }
}
