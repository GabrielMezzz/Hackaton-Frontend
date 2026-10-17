import { CommonModule } from '@angular/common';
import { Component, ElementRef, Input, ViewChild } from '@angular/core';

/** Datos mínimos de la prenda que se está probando. */
export interface PrendaProbador {
  name: string;
  price?: string;
  img: string;
  sku?: string;
  /** Etiqueta de la sección (opcional): "Novedades", "Niñas", ... */
  eyebrow?: string;
}

/**
 * Bloque reutilizable del probador con IA.
 * NO es una página: se incrusta dentro del detalle de producto.
 *
 *   <app-probador-ia [prenda]="prendaSeleccionada"></app-probador-ia>
 *
 * Flujo: consentimiento -> subir foto -> recuadro antes/después con deslizador.
 * Con [endpoint] la foto se envía a tu backend (que llama a Gemini) y su imagen
 * es el "después". Sin endpoint se arma una vista previa simulada (ver LEEME.md).
 */
@Component({
  selector: 'app-probador-ia',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './probador-ia.component.html',
  styleUrls: ['./probador-ia.component.css'],
})
export class ProbadorIaComponent {
  /** Rutas de las fotos, p. ej. 'assets/prendas/'. */
  @Input() imgBase = 'assets/prendas/';

  /** URL del backend que genera la imagen. Vacío = simulación local. */
  @Input() endpoint = '';

  /** La prenda que el usuario está probando. */
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
  ratio = '3 / 4';

  private job = 0;

  @ViewChild('ba') ba?: ElementRef<HTMLDivElement>;

  onConsent(checked: boolean): void {
    this.consent = checked;
    if (!checked) this.reset(false);          // sin consentimiento no se guarda la foto
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
      this.error = `La foto pesa más de ${this.maxMb} MB. Prueba con una más liviana.`;
      return;
    }
    const my = ++this.job;
    this.fileName = file.name;
    this.generating = true;
    this.showResult = false;
    try {
      const dataUrl = await readAsDataUrl(file);
      const photo = await loadImage(dataUrl);
      const started = Date.now();
      let out: { src: string; demo: boolean };
      try {
        out = this.endpoint
          ? { src: await this.remote(file), demo: false }
          : { src: await simulate(photo, this.imgBase + this.prenda.img), demo: true };
      } catch {
        out = { src: await simulate(photo, this.imgBase + this.prenda.img), demo: true };
      }
      await new Promise((ok) => setTimeout(ok, Math.max(0, 1200 - (Date.now() - started))));
      if (my !== this.job) return;            // cambió la foto o retiró el consentimiento
      this.photo = dataUrl;
      this.result = out.src;
      this.demo = out.demo;
      this.ratio = String(Math.max(0.6, Math.min(1.4, photo.naturalWidth / photo.naturalHeight)));
      this.sliderPos = 50;
      this.showResult = true;
    } catch {
      if (my === this.job) this.error = 'No pudimos leer esa imagen. Prueba con otra foto.';
    } finally {
      if (my === this.job) this.generating = false;
    }
  }

  private async remote(file: File): Promise<string> {
    const fd = new FormData();
    fd.append('foto', file);
    fd.append('prenda', new URL(this.imgBase + this.prenda.img, location.href).href);
    if (this.prenda.sku) fd.append('sku', this.prenda.sku);
    const resp = await fetch(this.endpoint, { method: 'POST', body: fd });
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    return URL.createObjectURL(await resp.blob());
  }

  reset(clearConsent = true): void {
    this.job++;
    this.photo = null;
    this.result = null;
    this.fileName = '';
    this.error = '';
    this.generating = false;
    this.showResult = false;
    this.sliderPos = 50;
    if (clearConsent) this.consent = false;
  }

  /* ---------- Deslizador antes / después ---------- */
  onPointerDown(event: PointerEvent): void {
    this.dragSlider = true;
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
    this.moveSlider(event.clientX);
  }
  onPointerMove(event: PointerEvent): void {
    if (this.dragSlider) this.moveSlider(event.clientX);
  }
  onKnobKey(event: KeyboardEvent): void {
    const step = event.shiftKey ? 10 : 4;
    const map: Record<string, number> = {
      ArrowLeft: this.sliderPos - step, ArrowDown: this.sliderPos - step,
      ArrowRight: this.sliderPos + step, ArrowUp: this.sliderPos + step,
      Home: 0, End: 100,
    };
    if (!(event.key in map)) return;
    event.preventDefault();
    this.sliderPos = clamp(map[event.key]);
  }
  private moveSlider(clientX: number): void {
    const rect = this.ba?.nativeElement.getBoundingClientRect();
    if (rect?.width) this.sliderPos = clamp(((clientX - rect.left) / rect.width) * 100);
  }
}

/* ---------- utilidades ---------- */
function clamp(n: number): number {
  return Math.max(0, Math.min(100, n));
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((ok, fail) => {
    const r = new FileReader();
    r.onload = () => ok(r.result as string);
    r.onerror = fail;
    r.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((ok, fail) => {
    const im = new Image();
    im.onload = () => ok(im);
    im.onerror = fail;
    im.src = src;
  });
}

/** Vista previa simulada: la prenda sobre el torso con bordes difuminados. */
async function simulate(photo: HTMLImageElement, garmentSrc: string): Promise<string> {
  const s = Math.min(1, 1100 / Math.max(photo.naturalWidth, photo.naturalHeight));
  const W = Math.round(photo.naturalWidth * s);
  const H = Math.round(photo.naturalHeight * s);
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d')!;
  ctx.drawImage(photo, 0, 0, W, H);
  try {
    const g = await loadImage(garmentSrc);
    const off = document.createElement('canvas');
    off.width = W;
    off.height = H;
    const o = off.getContext('2d')!;
    const rw = W * 0.66, rh = H * 0.72, rx = (W - rw) / 2, ry = H * 0.25;
    const sc = Math.max(rw / g.naturalWidth, rh / g.naturalHeight);
    const dw = g.naturalWidth * sc, dh = g.naturalHeight * sc;
    o.drawImage(g, rx + (rw - dw) / 2, ry + (rh - dh) / 2, dw, dh);
    const R = Math.max(rw, rh) / 2;
    o.globalCompositeOperation = 'destination-in';
    o.translate(W / 2, ry + rh / 2);
    o.scale(rw / (2 * R), rh / (2 * R));
    const grad = o.createRadialGradient(0, 0, 0, 0, 0, R);
    grad.addColorStop(0, 'rgba(0,0,0,1)');
    grad.addColorStop(0.62, 'rgba(0,0,0,.96)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    o.fillStyle = grad;
    o.fillRect(-3 * R, -3 * R, 6 * R, 6 * R);
    ctx.globalAlpha = 0.94;
    ctx.drawImage(off, 0, 0);
  } catch {
    /* sin la foto de la prenda queda solo la foto original */
  }
  return c.toDataURL('image/png');
}
