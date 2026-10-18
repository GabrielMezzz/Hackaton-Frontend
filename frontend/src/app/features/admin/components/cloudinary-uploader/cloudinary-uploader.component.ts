import { Component, inject, input, output, signal } from '@angular/core';
import { CloudinaryService } from '../../../../core/services/cloudinary.service';

@Component({
  selector: 'app-cloudinary-uploader',
  standalone: true,
  imports: [],
  template: `
    <div class="space-y-2 font-sans text-ink">
      @if (label()) {
        <label class="block text-sm font-medium text-ink">
          {{ label() }}
        </label>
      }

      <div class="flex items-start gap-4">
        <!-- Thumbnail Preview -->
        <div class="relative w-24 h-24 rounded-md border border-ink bg-sand flex items-center justify-center overflow-hidden shrink-0 group">
          @if (currentUrl()) {
            <img [src]="currentUrl()" alt="Preview" class="w-full h-full object-cover transition duration-300 group-hover:scale-105" />
            <button
              type="button"
              (click)="removeImage()"
              class="absolute top-1 right-1 bg-paper text-ink border border-ink p-1 rounded-full opacity-0 group-hover:opacity-100 transition hover:bg-ink hover:text-paper"
              title="Quitar imagen"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          } @else {
            <div class="text-center p-2 text-ink-subtle">
              <svg class="w-7 h-7 mx-auto mb-1 stroke-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              <span class="text-[10px] block font-mono uppercase">Sin foto</span>
            </div>
          }

          <!-- Uploading overlay -->
          @if (uploading()) {
            <div class="absolute inset-0 bg-ink/70 flex flex-col items-center justify-center text-paper">
              <div class="w-5 h-5 border-2 border-paper border-t-transparent rounded-full animate-spin mb-1"></div>
              <span class="text-[9px] font-mono uppercase">Subiendo...</span>
            </div>
          }
        </div>

        <!-- Controls & Dropzone -->
        <div class="flex-1 space-y-2">
          <div
            (dragover)="onDragOver($event)"
            (dragleave)="onDragLeave($event)"
            (drop)="onDrop($event)"
            [class.border-ink]="isDragging()"
            [class.bg-sand-light]="isDragging()"
            class="pw-dropzone rounded-md p-4 transition"
            (click)="fileInput.click()"
          >
            <input
              #fileInput
              type="file"
              accept="image/*"
              class="hidden"
              (change)="onFileSelected($event)"
            />
            <div class="flex items-center justify-center gap-2 text-sm text-ink">
              <svg class="w-4 h-4 text-ink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
              </svg>
              <span>Subir a Cloudinary o arrastrar imagen aquí</span>
            </div>
            <p class="pw-meta text-xs mt-1">PNG, JPG, WEBP hasta 8MB</p>
          </div>

          <!-- URL direct input alternative -->
          <div class="flex items-center gap-2">
            <span class="pw-eyebrow shrink-0">o URL:</span>
            <input
              type="url"
              [value]="currentUrl()"
              (change)="onUrlChange($event)"
              placeholder="https://res.cloudinary.com/..."
              class="flex-1 text-sm text-ink bg-paper border border-ink rounded-md px-3 py-1.5 focus:outline-2 focus:outline-ink focus:outline-offset-1"
            />
          </div>

          @if (mockNotice()) {
            <p class="pw-note text-xs flex items-center gap-1">
              <span>⚠️</span> Preview local (Cloudinary no configurado en .env)
            </p>
          }
          @if (errorMessage()) {
            <p class="text-xs text-error">{{ errorMessage() }}</p>
          }
        </div>
      </div>
    </div>
  `
})
export class CloudinaryUploaderComponent {
  private readonly cloudinaryService = inject(CloudinaryService);

  readonly label = input<string>('Imagen');
  readonly currentUrl = input<string>('');
  readonly urlChange = output<string>();

  readonly uploading = signal<boolean>(false);
  readonly isDragging = signal<boolean>(false);
  readonly mockNotice = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.uploadFile(event.dataTransfer.files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.uploadFile(input.files[0]);
      input.value = '';
    }
  }

  onUrlChange(event: Event): void {
    const val = (event.target as HTMLInputElement).value.trim();
    this.urlChange.emit(val);
  }

  removeImage(): void {
    this.urlChange.emit('');
    this.mockNotice.set(false);
    this.errorMessage.set(null);
  }

  private uploadFile(file: File): void {
    if (!file.type.startsWith('image/')) {
      this.errorMessage.set('Solo se permiten archivos de imagen.');
      return;
    }

    this.uploading.set(true);
    this.errorMessage.set(null);
    this.mockNotice.set(false);

    this.cloudinaryService.uploadFile(file).subscribe({
      next: (res) => {
        this.uploading.set(false);
        if (res.mock) {
          this.mockNotice.set(true);
        }
        this.urlChange.emit(res.url);
      },
      error: (err) => {
        this.uploading.set(false);
        this.errorMessage.set(err?.error?.error || 'Error al subir la imagen.');
      }
    });
  }
}
