import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { WebhookChatService } from '../../core/services/webhook-chat.service';

@Component({
  selector: 'app-whatsapp-chat',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <!-- Floating Wrapper -->
    <div class="fixed right-5 bottom-5 z-50 flex flex-col items-end font-sans">
      
      <!-- Chat Frame Container -->
      @if (chat.isOpen()) {
        <div class="w-96 max-w-[calc(100vw-32px)] h-[520px] max-h-[calc(100vh-100px)] bg-[#efeae2] rounded-2xl shadow-2xl border border-black/10 flex flex-col overflow-hidden mb-3 animate-in fade-in slide-in-from-bottom-5 duration-200">
          
          <!-- Header -->
          <div class="bg-emerald-800 text-white px-4 py-3 flex items-center justify-between shadow-md">
            <div class="flex items-center gap-3 min-w-0">
              <div class="relative w-10 h-10 rounded-full bg-emerald-500 text-white font-bold flex items-center justify-center shrink-0 shadow-inner">
                A
                <span class="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-emerald-800 rounded-full"></span>
              </div>
              <div class="min-w-0">
                <h3 class="font-semibold text-sm leading-tight truncate">Angibell Creaciones</h3>
                <p class="text-xs text-emerald-200 flex items-center gap-1">
                  <span class="inline-block w-1.5 h-1.5 rounded-full bg-green-400"></span> En línea (Asistente IA)
                </p>
              </div>
            </div>

            <div class="flex items-center gap-1">
              <button
                type="button"
                (click)="chat.close()"
                class="w-8 h-8 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition"
                aria-label="Cerrar chat"
              >
                ✕
              </button>
            </div>
          </div>

          <!-- Messages Body -->
          <div class="flex-1 overflow-y-auto p-4 space-y-3 bg-[#efeae2] bg-[radial-gradient(#d3cbbd_0.8px,transparent_0.8px)] [background-size:16px_16px]">
            <div class="text-center">
              <span class="bg-white/90 text-stone-600 text-[11px] font-medium px-3 py-1 rounded-md shadow-xs">Hoy</span>
            </div>

            @for (msg of chat.messages(); track $index) {
              <div class="flex flex-col max-w-[85%]" [class.self-end]="msg.role === 'user'" [class.self-start]="msg.role === 'bot'">
                <div
                  class="rounded-lg px-3 py-2 text-xs leading-relaxed shadow-xs word-break"
                  [class.bg-[#d9fdd3]]="msg.role === 'user'"
                  [class.text-stone-900]="msg.role === 'user'"
                  [class.rounded-tr-none]="msg.role === 'user'"
                  [class.bg-white]="msg.role === 'bot'"
                  [class.rounded-tl-none]="msg.role === 'bot'"
                >
                  <p class="whitespace-pre-wrap">{{ msg.text }}</p>

                  <!-- Quote Card if available -->
                  @if (msg.quote) {
                    <div class="mt-2.5 p-2.5 bg-emerald-50 border-l-4 border-emerald-600 rounded-md text-emerald-950">
                      <div class="flex items-center justify-between gap-2 mb-1.5 font-bold text-xs">
                        <span>Cotización #{{ msg.quote.id }}</span>
                        @if (msg.quote.total) {
                          <span class="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[11px]">S/ {{ msg.quote.total }}</span>
                        }
                      </div>
                      <div class="flex gap-2 flex-wrap mt-2">
                        <a
                          routerLink="/carrito"
                          (click)="chat.close()"
                          class="inline-flex items-center justify-center px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-700 text-white hover:bg-emerald-800 transition"
                        >
                          🛒 Ver Carrito
                        </a>
                        <a
                          [href]="realWaQuoteUrl(msg.quote.id, msg.quote.total)"
                          target="_blank"
                          rel="noopener"
                          class="inline-flex items-center justify-center px-3 py-1 rounded-full text-[11px] font-semibold bg-[#25d366] text-white hover:bg-emerald-600 transition"
                        >
                          📲 Asesor Humano
                        </a>
                      </div>
                    </div>
                  }

                  <span class="text-[10px] text-stone-500 float-right mt-1 ml-2">
                    {{ currentTime }}
                    @if (msg.role === 'user') {
                      <span class="text-sky-500 font-bold ml-1">✓✓</span>
                    }
                  </span>
                </div>
              </div>
            }

            @if (chat.isBusy()) {
              <div class="self-start max-w-[85%]">
                <div class="bg-white rounded-lg rounded-tl-none px-4 py-2.5 shadow-xs flex items-center gap-1.5 text-stone-500">
                  <span class="w-1.5 h-1.5 rounded-full bg-stone-400 animate-bounce"></span>
                  <span class="w-1.5 h-1.5 rounded-full bg-stone-400 animate-bounce [animation-delay:-0.15s]"></span>
                  <span class="w-1.5 h-1.5 rounded-full bg-stone-400 animate-bounce [animation-delay:-0.3s]"></span>
                </div>
              </div>
            }
          </div>

          <!-- Quick Chips -->
          <div class="bg-stone-100 px-3 py-2 border-t border-stone-200 flex gap-2 overflow-x-auto no-scrollbar">
            <button
              type="button"
              (click)="sendQuick('Hola Angibell, quisiera consultar disponibilidad y precios')"
              class="shrink-0 bg-white border border-emerald-200 text-emerald-800 text-xs px-3 py-1 rounded-full hover:bg-emerald-50 transition"
            >
              💰 Cotizar
            </button>
            <button
              type="button"
              (click)="sendQuick('Hola Angibell, ¿tienen disponibilidad de stock?')"
              class="shrink-0 bg-white border border-emerald-200 text-emerald-800 text-xs px-3 py-1 rounded-full hover:bg-emerald-50 transition"
            >
              📦 Disponibilidad
            </button>
            <button
              type="button"
              (click)="sendQuick('Hola Angibell, ¿cómo coordinan los envíos a domicilio?')"
              class="shrink-0 bg-white border border-emerald-200 text-emerald-800 text-xs px-3 py-1 rounded-full hover:bg-emerald-50 transition"
            >
              🚚 Envíos
            </button>
          </div>

          <!-- Input Footer -->
          <div class="bg-stone-100 p-2.5 border-t border-stone-200 flex items-center gap-2">
            <input
              type="text"
              [(ngModel)]="userInput"
              (keydown.enter)="handleSend()"
              placeholder="Escribe un mensaje..."
              class="flex-1 bg-white border border-stone-200 rounded-full px-4 py-2 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 shadow-xs"
            />
            <button
              type="button"
              (click)="handleSend()"
              [disabled]="chat.isBusy() || !userInput.trim()"
              class="w-9 h-9 rounded-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white flex items-center justify-center transition shadow-xs shrink-0"
              aria-label="Enviar mensaje"
            >
              <svg class="w-4 h-4 rotate-90" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </button>
          </div>
        </div>
      }

      <!-- Floating Action Button -->
      <button
        type="button"
        (click)="chat.toggle()"
        class="relative w-14 h-14 rounded-full bg-[#25d366] hover:bg-emerald-600 text-white flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition cursor-pointer"
        aria-label="Abrir chat de WhatsApp"
      >
        @if (!chat.isOpen()) {
          <span class="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-red-600 text-white font-bold text-xs rounded-full flex items-center justify-center animate-pulse">
            1
          </span>
          <svg class="w-7 h-7 fill-current" viewBox="0 0 24 24">
            <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.5-.3z"/>
          </svg>
        } @else {
          <svg class="w-6 h-6 stroke-current" fill="none" viewBox="0 0 24 24" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        }
      </button>

    </div>
  `
})
export class FloatingWhatsappComponent {
  readonly chat = inject(WebhookChatService);
  userInput = '';

  get currentTime(): string {
    const d = new Date();
    return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  handleSend(): void {
    if (!this.userInput.trim()) return;
    const text = this.userInput;
    this.userInput = '';
    this.chat.sendMessage(text);
  }

  sendQuick(msg: string): void {
    this.chat.sendMessage(msg);
  }

  realWaQuoteUrl(quoteId: number | string, total: string): string {
    const msg = encodeURIComponent(`Hola Angibell, sobre mi cotización #${quoteId} por S/ ${total}, quisiera coordinar el pago y entrega.`);
    return `https://wa.me/51950275811?text=${msg}`;
  }
}
