import { CommonModule } from '@angular/common';
import { Component, ElementRef, Input, ViewChild } from '@angular/core';

export interface PrendaProbador {
  name: string;
  price?: string;
  img: string;
  sku?: string;
  eyebrow?: string;
}

@Component({
  selector: 'app-probador-ia',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="border border-ink rounded-md p-6 mt-8">
      <h3 class="pw-subtitle mb-1">Pruébate esta prenda con IA</h3>
      <p class="text-sm leading-relaxed text-ink-muted mb-5">
        Sube una foto de cuerpo entero, de frente y con buena luz, y compara el antes y el después.
      </p>

      <!-- Consent Box -->
      <div class="border border-sand-border rounded-md p-4 bg-sand-light">
        <label class="flex items-start gap-3 cursor-pointer select-none text-[15px] leading-normal">
          <input
            type="checkbox"
            [checked]="consent"
            (change)="onConsent($any($event.target).checked)"
            class="pw-checkbox mt-0.5 flex-none"
          />
          <span>
            Entiendo y acepto que las fotos que suba para probarme las prendas con IA <strong>no se utilizarán para ningún otro fin</strong>, no se compartirán con terceros ni se usarán para entrenar modelos.
          </span>
        </label>
      </div>

      <!-- Upload or Result Area -->
      @if (consent) {
        <div class="mt-5">
          @if (!showResult && !generating) {
            <div
              (dragover)="onDragOver($event)"
              (dragleave)="dragging = false"
              (drop)="onDrop($event)"
              (click)="fileInput.click()"
              class="pw-dropzone rounded-md transition"
              [class.border-ink]="dragging"
              [class.bg-sand-light]="dragging"
            >
              <div class="text-[28px]" aria-hidden="true">📷</div>
              <p class="text-sm mt-2">Arrastra tu foto aquí o haz clic para seleccionarla</p>
              <p class="pw-eyebrow mt-3.5 mb-0">JPG · PNG · WEBP · máx. {{ maxMb }} MB</p>
              <input #fileInput type="file" accept="image/jpeg,image/png,image/webp" (change)="onFileSelected($event)" class="hidden" />
            </div>
          }

          @if (generating) {
            <div class="p-8 text-center">
              <div class="pw-spinner mx-auto mb-3"></div>
              <p class="text-sm">Generando tu prueba con IA… esto puede tardar unos segundos.</p>
            </div>
          }

          @if (showResult && photo && result) {
            <div>
              <div
                #ba
                (pointerdown)="onPointerDown($event)"
                (pointermove)="onPointerMove($event)"
                (pointerup)="dragSlider = false"
                class="relative rounded-md overflow-hidden bg-sand select-none cursor-ew-resize w-full max-h-[72vh] aspect-[3/4] touch-pan-y"
              >
                <!-- After Image (Result) -->
                <img [src]="result" alt="Después IA" class="absolute inset-0 w-full h-full object-cover" />
                <span class="pw-tag absolute top-3 right-3 rounded-full z-[7]">Después · IA</span>

                <!-- Before Image (Original) with clip-path -->
                <div class="absolute inset-0 overflow-hidden z-[2]" [style.width.%]="sliderPos">
                  <img [src]="photo" alt="Foto Original" class="absolute inset-0 w-full h-full object-cover max-w-none [width:calc(100cqw)]" />
                  <span class="pw-tag absolute top-3 left-3 rounded-full">Antes</span>
                </div>

                <!-- Divider line -->
                <div
                  class="absolute top-0 bottom-0 w-[3px] -translate-x-1/2 bg-paper shadow-[0_0_0_1px_rgba(0,0,0,.15)] pointer-events-none z-[6]"
                  [style.left.%]="sliderPos"
                >
                  <div
                    class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-paper border border-ink text-ink text-lg flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,.18)]"
                    aria-hidden="true"
                  >
                    ↔
                  </div>
                </div>
              </div>

              <p class="pw-caption text-center mt-3.5">Arrastra el deslizador para comparar el antes y el después.</p>

              <div class="mt-4">
                <button type="button" (click)="reset(false)" class="pw-btn pw-btn--secondary pw-btn--block py-3 text-sm">
                  Cambiar foto
                </button>
              </div>
            </div>
          }

          @if (error) {
            <p class="text-[13px] text-error mt-2.5">{{ error }}</p>
          }
        </div>
      }
    </section>
  `
})
export class ProbadorIaComponent {
  @Input() imgBase = 'assets/prendas/';
  @Input() endpoint = '';
  @Input({ required: true }) prenda!: PrendaProbador;

  readonly maxMb = 10;
  consent = false;
  photo: string | null = null;
  result: string | null = null;
  fileName = '';
  error = '';
  generating = false;
  showResult = false;
  demo = false;
  dragging = false;
  dragSlider = false;
  sliderPos = 50;

  @ViewChild('ba') ba?: ElementRef<HTMLDivElement>;

  onConsent(checked: boolean): void {
    this.consent = checked;
    if (!checked) this.reset(false);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragging = true;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging = false;
    const file = event.dataTransfer?.files?.[0];
    if (file) this.handleFile(file);
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.handleFile(file);
  }

  private async handleFile(file: File): Promise<void> {
    this.error = '';
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      this.error = 'Sube una imagen JPG, PNG o WEBP.';
      return;
    }
    if (file.size > this.maxMb * 1024 * 1024) {
      this.error = `La foto pesa más de ${this.maxMb} MB.`;
      return;
    }
    this.fileName = file.name;
    this.generating = true;
    this.showResult = false;

    try {
      const dataUrl = await this.readAsDataUrl(file);
      this.photo = dataUrl;
      this.result = dataUrl; // Preview
      this.showResult = true;
    } catch {
      this.error = 'No se pudo leer la imagen.';
    } finally {
      this.generating = false;
    }
  }

  private readAsDataUrl(file: File): Promise<string> {
    return new Promise((ok, fail) => {
      const r = new FileReader();
      r.onload = () => ok(r.result as string);
      r.onerror = fail;
      r.readAsDataURL(file);
    });
  }

  reset(clearConsent = true): void {
    this.photo = null;
    this.result = null;
    this.fileName = '';
    this.error = '';
    this.generating = false;
    this.showResult = false;
    this.sliderPos = 50;
    if (clearConsent) this.consent = false;
  }

  onPointerDown(event: PointerEvent): void {
    this.dragSlider = true;
    this.moveSlider(event.clientX);
  }

  onPointerMove(event: PointerEvent): void {
    if (this.dragSlider) this.moveSlider(event.clientX);
  }

  private moveSlider(clientX: number): void {
    const rect = this.ba?.nativeElement.getBoundingClientRect();
    if (rect?.width) {
      const pos = ((clientX - rect.left) / rect.width) * 100;
      this.sliderPos = Math.max(0, Math.min(100, pos));
    }
  }
}
