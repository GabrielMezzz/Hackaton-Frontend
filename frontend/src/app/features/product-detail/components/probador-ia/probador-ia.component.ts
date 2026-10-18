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
    <div class="bg-stone-50 border border-stone-200 rounded-2xl p-6 my-8 shadow-xs">
      <h3 class="text-xl font-bold text-emerald-950 mb-1">Pruébate esta prenda con IA</h3>
      <p class="text-sm text-stone-600 mb-5">Sube una foto de cuerpo entero, de frente y con buena luz, y compara el antes y el después.</p>

      <!-- Consent Box -->
      <div class="bg-white border border-stone-200 rounded-xl p-4 mb-5">
        <label class="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            [checked]="consent"
            (change)="onConsent($any($event.target).checked)"
            class="mt-1 w-4 h-4 text-emerald-600 rounded-sm focus:ring-emerald-500 border-stone-300"
          />
          <span class="text-xs text-stone-700 leading-relaxed">
            Entiendo y acepto que las fotos que suba para probarme las prendas con IA <strong>no se utilizarán para ningún otro fin</strong>, no se compartirán con terceros ni se usarán para entrenar modelos.
          </span>
        </label>
      </div>

      <!-- Upload or Result Area -->
      @if (consent) {
        <div>
          @if (!showResult && !generating) {
            <div
              (dragover)="onDragOver($event)"
              (dragleave)="dragging = false"
              (drop)="onDrop($event)"
              (click)="fileInput.click()"
              class="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition"
              [class.border-emerald-500]="dragging"
              [class.bg-emerald-50]="dragging"
              [class.border-stone-300]="!dragging"
              [class.bg-white]="!dragging"
            >
              <div class="text-3xl mb-2">📷</div>
              <p class="text-sm font-semibold text-stone-800">Arrastra tu foto aquí o haz clic para seleccionarla</p>
              <p class="text-xs text-stone-500 mt-1">JPG · PNG · WEBP · máx. {{ maxMb }} MB</p>
              <input #fileInput type="file" accept="image/jpeg,image/png,image/webp" (change)="onFileSelected($event)" class="hidden" />
            </div>
          }

          @if (generating) {
            <div class="bg-white rounded-xl p-8 text-center border border-stone-200 flex flex-col items-center justify-center gap-3">
              <div class="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
              <p class="text-sm font-medium text-stone-700">Generando tu prueba con IA… esto puede tardar unos segundos.</p>
            </div>
          }

          @if (showResult && photo && result) {
            <div>
              <div
                #ba
                (pointerdown)="onPointerDown($event)"
                (pointermove)="onPointerMove($event)"
                (pointerup)="dragSlider = false"
                class="relative rounded-xl overflow-hidden shadow-lg select-none cursor-ew-resize max-w-md mx-auto aspect-[3/4]"
              >
                <!-- After Image (Result) -->
                <img [src]="result" alt="Después IA" class="absolute inset-0 w-full h-full object-cover" />
                <span class="absolute top-3 right-3 bg-emerald-600/90 text-white text-[11px] font-bold px-2.5 py-1 rounded-md shadow-xs">Después · IA</span>

                <!-- Before Image (Original) with clip-path -->
                <div class="absolute inset-0 overflow-hidden" [style.width.%]="sliderPos">
                  <img [src]="photo" alt="Foto Original" class="absolute inset-0 w-full h-full object-cover max-w-none [width:calc(100cqw)]" />
                  <span class="absolute top-3 left-3 bg-stone-900/80 text-white text-[11px] font-bold px-2.5 py-1 rounded-md shadow-xs">Antes</span>
                </div>

                <!-- Divider line -->
                <div class="absolute top-0 bottom-0 w-0.5 bg-white shadow-md" [style.left.%]="sliderPos">
                  <div class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-emerald-800 font-bold flex items-center justify-center shadow-md text-xs">
                    ↔
                  </div>
                </div>
              </div>

              <div class="flex items-center justify-center gap-3 mt-4">
                <button
                  type="button"
                  (click)="reset(false)"
                  class="px-4 py-2 text-xs font-semibold rounded-full border border-stone-300 text-stone-700 bg-white hover:bg-stone-50 transition"
                >
                  Cambiar foto
                </button>
              </div>
            </div>
          }

          @if (error) {
            <p class="text-xs text-red-600 mt-2 font-medium">{{ error }}</p>
          }
        </div>
      }
    </div>
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
