import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminProductService } from '../../../../core/services/admin-product.service';
import { AdminCategoryService } from '../../../../core/services/admin-category.service';
import { CloudinaryUploaderComponent } from '../../components/cloudinary-uploader/cloudinary-uploader.component';
import { AdminProductPayload } from '../../../../core/models/category.model';

interface ColorRow {
  nombre: string;
  hex: string;
  foto: string;
}

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [RouterLink, FormsModule, CloudinaryUploaderComponent],
  template: `
    <div class="space-y-8 max-w-4xl mx-auto font-sans text-ink">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <a
            routerLink="/admin/productos"
            class="inline-flex items-center justify-center w-10 h-10 rounded-full border border-ink bg-paper text-ink hover:bg-sand transition"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
            </svg>
          </a>
          <div>
            <p class="pw-eyebrow">Catálogo</p>
            <h2 class="pw-title">
              {{ isEditMode() ? 'Editar Prenda' : 'Nueva Prenda' }}
            </h2>
            <p class="pw-meta mt-1">Define los detalles de confección, categoría y fotos en Cloudinary</p>
          </div>
        </div>
      </div>

      <!-- Main Form Card -->
      <form (ngSubmit)="saveProduct()" class="bg-paper border border-ink rounded-md p-6 md:p-8 space-y-6">
        <!-- Basic Info Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-5">
          <!-- SKU / ID -->
          <div class="pw-field">
            <label>SKU / Código *</label>
            <input
              type="text"
              [(ngModel)]="formData.id"
              name="id"
              [disabled]="isEditMode()"
              required
              placeholder="ej. VES-005"
              class="font-mono disabled:bg-sand disabled:text-ink-muted"
            />
          </div>

          <!-- Name -->
          <div class="pw-field">
            <label>Nombre de la Prenda *</label>
            <input
              type="text"
              [(ngModel)]="formData.name"
              name="name"
              required
              placeholder="ej. Vestido de Fiesta en Seda"
            />
          </div>

          <!-- Price -->
          <div class="pw-field">
            <label>Precio Base (S/) *</label>
            <input
              type="number"
              step="0.01"
              [(ngModel)]="formData.price"
              name="price"
              required
              placeholder="250.00"
            />
          </div>

          <!-- Category Selector -->
          <div class="pw-field">
            <label>Categoría Segregada *</label>
            <select
              [(ngModel)]="formData.category_id"
              name="category_id"
            >
              <option [ngValue]="null">Seleccionar Categoría</option>
              @for (cat of categoryService.categories(); track cat.id) {
                <option [ngValue]="cat.id">{{ cat.name }}</option>
              }
            </select>
          </div>

          <!-- Audience -->
          <div class="pw-field">
            <label>Público Destino</label>
            <select
              [(ngModel)]="formData.audience"
              name="audience"
            >
              <option value="ninos">Niños</option>
              <option value="ninas">Niñas</option>
              <option value="bebes">Bebés</option>
              <option value="personalizados">Personalizados</option>
            </select>
          </div>

          <!-- Material -->
          <div class="pw-field">
            <label>Material y Textura</label>
            <input
              type="text"
              [(ngModel)]="formData.material"
              name="material"
              placeholder="ej. Gasa de seda con forro de algodón"
            />
          </div>
        </div>

        <!-- Description -->
        <div class="pw-field">
          <label>Descripción</label>
          <textarea
            [(ngModel)]="formData.description"
            name="description"
            rows="3"
            placeholder="Detalles sobre confección, ocasiones recomendadas y tela..."
          ></textarea>
        </div>

        <!-- Colors & Cloudinary Photos Section -->
        <div class="pt-6 border-t border-sand space-y-4">
          <div class="flex items-center justify-between gap-4">
            <div>
              <h3 class="pw-legend mb-1">Variantes de Color & Fotos (Cloudinary)</h3>
              <p class="pw-meta">Cada color puede tener su propia fotografía alojada en Cloudinary</p>
            </div>

            <button
              type="button"
              (click)="addColorRow()"
              class="pw-btn pw-btn--secondary py-2 px-4 text-sm shrink-0"
            >
              + Agregar Color
            </button>
          </div>

          <div class="space-y-4">
            @for (c of colorsList(); track $index) {
              <div class="p-4 bg-sand-light border border-sand-border rounded-md space-y-3">
                <div class="flex items-center justify-between gap-4">
                  <div class="flex items-center gap-3 flex-1">
                    <input
                      type="color"
                      [(ngModel)]="c.hex"
                      [name]="'hex_' + $index"
                      class="w-10 h-10 rounded-md border border-ink bg-paper p-0.5 cursor-pointer shrink-0"
                    />
                    <input
                      type="text"
                      [(ngModel)]="c.nombre"
                      [name]="'colName_' + $index"
                      placeholder="Nombre del color (ej. Azul Noche)"
                      class="text-sm text-ink border border-ink rounded-md px-3 py-2 bg-paper flex-1 focus:outline-2 focus:outline-ink focus:outline-offset-1"
                    />
                  </div>

                  <button
                    type="button"
                    (click)="removeColorRow($index)"
                    class="pw-remove inline-flex items-center gap-1 hover:text-error"
                    title="Eliminar este color"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                    <span>Eliminar</span>
                  </button>
                </div>

                <!-- Cloudinary Uploader for this specific color -->
                <app-cloudinary-uploader
                  [label]="'Foto para ' + (c.nombre || 'este color')"
                  [currentUrl]="c.foto"
                  (urlChange)="c.foto = $event"
                />
              </div>
            }
          </div>
        </div>

        <!-- Submit Button Toolbar -->
        <div class="flex items-center justify-end gap-3 pt-6 border-t border-sand">
          <a
            routerLink="/admin/productos"
            class="pw-btn pw-btn--secondary py-3 px-6 text-sm"
          >
            Cancelar
          </a>
          <button
            type="submit"
            [disabled]="productService.loading() || !formData.id || !formData.name"
            class="pw-btn pw-btn--primary py-3 px-6 text-sm cursor-pointer"
          >
            {{ productService.loading() ? 'Guardando...' : (isEditMode() ? 'Actualizar Prenda' : 'Guardar Prenda') }}
          </button>
        </div>
      </form>
    </div>
  `
})
export class ProductFormComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly productService = inject(AdminProductService);
  readonly categoryService = inject(AdminCategoryService);

  readonly isEditMode = signal<boolean>(false);
  readonly colorsList = signal<ColorRow[]>([]);

  formData: {
    id: string;
    name: string;
    price: number | null;
    category_id: number | null;
    audience: string;
    material: string;
    description: string;
  } = {
    id: '',
    name: '',
    price: null,
    category_id: null,
    audience: 'ninos',
    material: '',
    description: ''
  };

  ngOnInit(): void {
    this.categoryService.loadCategories().subscribe();

    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'nuevo') {
      this.isEditMode.set(true);
      this.productService.getProduct(id).subscribe({
        next: (p) => {
          this.formData = {
            id: p.id,
            name: p.name,
            price: Number(p.base_price),
            category_id: p.category_id || null,
            audience: p.audience || 'ninos',
            material: p.material || '',
            description: p.description || ''
          };

          const cols: ColorRow[] = (p.colores || []).map(c => ({
            nombre: c.color,
            hex: c.hex,
            foto: c.foto ? String(c.foto) : ''
          }));
          this.colorsList.set(cols.length > 0 ? cols : [{ nombre: 'Estándar', hex: '#1c1c1c', foto: '' }]);
        }
      });
    } else {
      this.colorsList.set([
        { nombre: 'Principal', hex: '#2c4a8c', foto: '' }
      ]);
    }
  }

  addColorRow(): void {
    this.colorsList.update(current => [
      ...current,
      { nombre: '', hex: '#1c1c1c', foto: '' }
    ]);
  }

  removeColorRow(index: number): void {
    this.colorsList.update(current => current.filter((_, i) => i !== index));
  }

  saveProduct(): void {
    if (!this.formData.id || !this.formData.name || this.formData.price == null) return;

    const payload: AdminProductPayload = {
      id: this.formData.id,
      name: this.formData.name,
      price: this.formData.price,
      category_id: this.formData.category_id || undefined,
      audience: this.formData.audience,
      material: this.formData.material,
      description: this.formData.description,
      colors: this.colorsList().map(c => ({
        nombre: c.nombre,
        hex: c.hex,
        foto: c.foto
      }))
    };

    this.productService.saveProduct(payload).subscribe({
      next: () => {
        this.router.navigate(['/admin/productos']);
      }
    });
  }
}
