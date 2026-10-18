import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminCategoryService } from '../../../../core/services/admin-category.service';
import { Category } from '../../../../core/models/category.model';
import { CloudinaryUploaderComponent } from '../../components/cloudinary-uploader/cloudinary-uploader.component';

@Component({
  selector: 'app-categories-list',
  standalone: true,
  imports: [RouterLink, FormsModule, CloudinaryUploaderComponent],
  template: `
    <div class="space-y-6 max-w-7xl mx-auto">
      <!-- Title & Action Bar -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 class="pw-title">Categorías del Catálogo</h2>
          <p class="pw-meta mt-1">Crea, edita y organiza las categorías de prendas de Angibell Creaciones</p>
        </div>

        <button
          type="button"
          (click)="openCreateModal()"
          class="pw-btn pw-btn--primary py-2.5 px-5 text-sm inline-flex items-center gap-2 cursor-pointer shrink-0"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          <span>Nueva Categoría</span>
        </button>
      </div>

      <!-- Search & Filters -->
      <div class="bg-paper p-4 rounded-md border border-ink flex items-center justify-between gap-4">
        <div class="relative flex-1 max-w-md">
          <svg class="w-4 h-4 text-ink-subtle absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            type="text"
            [ngModel]="searchQuery()"
            (ngModelChange)="searchQuery.set($event)"
            placeholder="Buscar categoría por nombre o slug..."
            class="w-full pl-10 pr-4 py-2 text-sm text-ink bg-paper border border-ink rounded-md focus:outline-2 focus:outline-ink focus:outline-offset-1"
          />
        </div>

        <div class="pw-meta">
          Total: <span class="font-semibold text-ink">{{ filteredCategories().length }}</span> categorías
        </div>
      </div>

      <!-- Categories Grid -->
      @if (categoryService.loading() && categoryService.categories().length === 0) {
        <div class="py-16 text-center text-ink-muted">
          <div class="pw-spinner mx-auto mb-3"></div>
          <p class="text-sm">Cargando categorías desde la base de datos...</p>
        </div>
      } @else if (filteredCategories().length === 0) {
        <div class="bg-sand rounded-md border border-ink p-12 text-center text-ink-muted">
          <svg class="w-12 h-12 mx-auto mb-3 text-ink-subtle stroke-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
          </svg>
          <p class="pw-subtitle text-ink">No se encontraron categorías</p>
          <p class="pw-meta mt-1">Crea una nueva categoría para comenzar a organizar tus prendas.</p>
        </div>
      } @else {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          @for (cat of filteredCategories(); track cat.id) {
            <div class="bg-paper rounded-md border border-ink p-5 hover:bg-sand-light transition flex flex-col justify-between group">
              <div>
                <!-- Header with status and actions -->
                <div class="flex items-start justify-between gap-3 mb-4">
                  <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-md bg-sand border border-sand-border flex items-center justify-center overflow-hidden shrink-0">
                      @if (cat.image_url) {
                        <img [src]="cat.image_url" [alt]="cat.name" class="w-full h-full object-cover" />
                      } @else {
                        <span class="text-ink font-semibold text-lg uppercase">{{ cat.name.slice(0, 1) }}</span>
                      }
                    </div>
                    <div>
                      <h3 class="font-medium text-ink group-hover:underline underline-offset-4">{{ cat.name }}</h3>
                      <span class="text-[11px] font-mono text-ink-subtle">/{{ cat.slug }}</span>
                    </div>
                  </div>

                  <span
                    [class]="cat.active ? 'bg-ink text-paper border-ink' : 'bg-sand text-ink-muted border-sand-border'"
                    class="text-xs px-2.5 py-0.5 rounded-full border"
                  >
                    {{ cat.active ? 'Activa' : 'Inactiva' }}
                  </span>
                </div>

                <p class="text-sm text-ink-muted line-clamp-2 mb-4">
                  {{ cat.description || 'Sin descripción ingresada.' }}
                </p>
              </div>

              <!-- Metrics & Bottom Toolbar -->
              <div class="pt-4 border-t border-sand flex items-center justify-between gap-2">
                <div class="flex items-center gap-1.5 text-sm text-ink-muted">
                  <svg class="w-4 h-4 text-ink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
                  </svg>
                  <span><b class="text-ink font-semibold">{{ cat.total_productos || 0 }}</b> prendas</span>
                </div>

                <div class="flex items-center gap-1.5">
                  <!-- Segregation link button -->
                  <a
                    [routerLink]="['/admin/categorias', cat.id]"
                    class="pw-btn pw-btn--secondary py-1.5 px-3 text-xs inline-flex items-center gap-1"
                    title="Segregar prendas de esta categoría"
                  >
                    <span>Segregar</span>
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                    </svg>
                  </a>

                  <!-- Edit button -->
                  <button
                    type="button"
                    (click)="openEditModal(cat)"
                    class="p-1.5 text-ink-subtle hover:text-ink hover:bg-sand rounded-full transition"
                    title="Editar datos de categoría"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                  </button>

                  <!-- Delete button -->
                  <button
                    type="button"
                    (click)="confirmDelete(cat)"
                    class="p-1.5 text-ink-subtle hover:text-error hover:bg-sand rounded-full transition"
                    title="Eliminar categoría"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          }
        </div>
      }

      <!-- Modal Crear / Editar Categoría -->
      @if (showModal()) {
        <div class="fixed inset-0 z-50 bg-ink/40 flex items-center justify-center p-4">
          <div class="bg-paper rounded-md max-w-lg w-full p-6 border border-ink animate-in fade-in zoom-in-95 duration-200">
            <div class="flex items-center justify-between pb-4 border-b border-ink">
              <h3 class="pw-subtitle">
                {{ editingCategory() ? 'Editar Categoría' : 'Nueva Categoría' }}
              </h3>
              <button
                type="button"
                (click)="closeModal()"
                class="text-ink-subtle hover:text-ink p-1 rounded-full"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <form (ngSubmit)="submitCategoryForm()" class="pt-4">
              <!-- Name -->
              <div class="pw-field">
                <label>Nombre *</label>
                <input
                  type="text"
                  [(ngModel)]="formData.name"
                  name="name"
                  required
                  placeholder="ej. Vestidos de Fiesta"
                />
              </div>

              <!-- Slug -->
              <div class="pw-field">
                <label>Slug (URL amigable)</label>
                <input
                  type="text"
                  [(ngModel)]="formData.slug"
                  name="slug"
                  placeholder="ej. vestidos-de-fiesta (opcional)"
                  class="font-mono"
                />
              </div>

              <!-- Description -->
              <div class="pw-field">
                <label>Descripción</label>
                <textarea
                  [(ngModel)]="formData.description"
                  name="description"
                  rows="2"
                  placeholder="Descripción de la categoría y tipos de prendas..."
                ></textarea>
              </div>

              <!-- Cloudinary Image Uploader -->
              <app-cloudinary-uploader
                label="Imagen de Categoría (Cloudinary)"
                [currentUrl]="formData.image_url || ''"
                (urlChange)="formData.image_url = $event"
              />

              <!-- Active Status -->
              <div class="flex items-center gap-2 pt-4">
                <input
                  type="checkbox"
                  id="catActive"
                  [(ngModel)]="formData.active"
                  name="active"
                  class="pw-checkbox"
                />
                <label for="catActive" class="text-sm text-ink">Categoría activa en catálogo público</label>
              </div>

              <!-- Buttons -->
              <div class="flex items-center justify-end gap-3 pt-4 mt-4 border-t border-sand">
                <button
                  type="button"
                  (click)="closeModal()"
                  class="pw-btn pw-btn--secondary py-2 px-4 text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  [disabled]="categoryService.loading() || !formData.name"
                  class="pw-btn pw-btn--primary py-2 px-5 text-sm"
                >
                  {{ categoryService.loading() ? 'Guardando...' : (editingCategory() ? 'Actualizar' : 'Crear') }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `
})
export class CategoriesListComponent implements OnInit {
  readonly categoryService = inject(AdminCategoryService);

  readonly searchQuery = signal<string>('');
  readonly showModal = signal<boolean>(false);
  readonly editingCategory = signal<Category | null>(null);

  formData: {
    id?: number;
    name: string;
    slug: string;
    description: string;
    image_url: string;
    active: boolean;
  } = {
    name: '',
    slug: '',
    description: '',
    image_url: '',
    active: true
  };

  ngOnInit(): void {
    this.categoryService.loadCategories().subscribe();
  }

  filteredCategories(): Category[] {
    const q = this.searchQuery().trim().toLowerCase();
    const all = this.categoryService.categories();
    if (!q) return all;
    return all.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.slug.toLowerCase().includes(q) ||
      (c.description && c.description.toLowerCase().includes(q))
    );
  }

  openCreateModal(): void {
    this.editingCategory.set(null);
    this.formData = {
      name: '',
      slug: '',
      description: '',
      image_url: '',
      active: true
    };
    this.showModal.set(true);
  }

  openEditModal(cat: Category): void {
    this.editingCategory.set(cat);
    this.formData = {
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      image_url: cat.image_url || '',
      active: cat.active
    };
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingCategory.set(null);
  }

  submitCategoryForm(): void {
    if (!this.formData.name.trim()) return;

    this.categoryService.saveCategory(this.formData).subscribe({
      next: () => {
        this.closeModal();
      }
    });
  }

  confirmDelete(cat: Category): void {
    if (confirm(`¿Estás seguro de eliminar la categoría "${cat.name}"? Los productos asignados pasarán a no tener categoría.`)) {
      this.categoryService.deleteCategory(cat.id).subscribe();
    }
  }
}
