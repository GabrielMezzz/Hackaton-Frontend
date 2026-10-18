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
    <div class="fixed right-5 bottom-5 max-[600px]:right-3 max-[600px]:bottom-3 z-[9500] flex flex-col items-end font-sans">
      
      <!-- Chat Frame Container -->
      @if (chat.isOpen()) {
        <div class="wa-slide-up w-[380px] max-w-[calc(100vw-32px)] h-[520px] max-h-[calc(100vh-100px)] bg-[#efeae2] rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,.28)] border border-black/[.08] flex flex-col overflow-hidden mb-3 max-[600px]:fixed max-[600px]:inset-0 max-[600px]:w-screen max-[600px]:max-w-[100vw] max-[600px]:h-screen max-[600px]:max-h-screen max-[600px]:rounded-none max-[600px]:mb-0 max-[600px]:z-[10000]">

          <!-- Header -->
          <div class="relative z-[2] bg-whatsapp-dark text-white px-3.5 py-3 flex items-center gap-2.5 shadow-[0_2px_4px_rgba(0,0,0,.15)]">
            <div class="flex flex-1 items-center gap-2.5 min-w-0">
              <div class="relative w-10 h-10 rounded-full bg-whatsapp text-white text-lg font-bold flex items-center justify-center shrink-0 shadow-[inset_0_0_0_1px_rgba(255,255,255,.3)]">
                A
                <span class="absolute bottom-0 right-0 w-[11px] h-[11px] bg-whatsapp border-2 border-whatsapp-dark rounded-full"></span>
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="font-semibold text-[15px] leading-[1.2] text-white truncate">Angibell Creaciones</h3>
                <p class="text-[11.5px] text-[#d1f4cc] flex items-center gap-1">
                  <span class="inline-block w-1.5 h-1.5 rounded-full bg-whatsapp"></span> En línea (Asistente IA)
                </p>
              </div>
            </div>

            <div class="flex items-center gap-1">
              <button
                type="button"
                (click)="chat.close()"
                class="w-8 h-8 rounded-full flex items-center justify-center text-white opacity-85 hover:opacity-100 hover:bg-white/15 transition cursor-pointer"
                aria-label="Cerrar chat"
              >
                ✕
              </button>
            </div>
          </div>

          <!-- Messages Body -->
          <div class="flex-1 overflow-y-auto px-3 py-3.5 flex flex-col gap-2 scroll-smooth bg-[#efeae2] bg-[radial-gradient(#d3cbbd_0.8px,transparent_0.8px)] [background-size:16px_16px]">
            <span class="self-center bg-white/[.92] text-[#54656f] text-[11px] font-medium px-3 py-1 rounded-lg mt-1 mb-2 shadow-[0_1px_1px_rgba(11,20,26,.08)]">Hoy</span>

            @for (msg of chat.messages(); track $index) {
              <div class="wa-msg-in flex flex-col max-w-[86%]" [class.self-end]="msg.role === 'user'" [class.self-start]="msg.role === 'bot'">
                <div
                  class="relative rounded-lg px-2.5 pt-2 pb-1.5 text-[13.5px] leading-[1.45] text-[#111b21] shadow-[0_1px_1px_rgba(11,20,26,.12)] break-words"
                  [class.bg-[#d9fdd3]]="msg.role === 'user'"
                  [class.rounded-tr-[2px]]="msg.role === 'user'"
                  [class.bg-white]="msg.role === 'bot'"
                  [class.rounded-tl-[2px]]="msg.role === 'bot'"
                >
                  <p class="whitespace-pre-wrap">{{ msg.text }}</p>

                  <!-- Quote Card if available -->
                  @if (msg.quote) {
                    <div class="mt-2 px-3 py-2.5 bg-[#f0fdf4] border-l-4 border-whatsapp-hover rounded-md text-[13px] leading-[1.4] text-[#1e3a2f] shadow-[0_1px_2px_rgba(0,0,0,.05)]">
                      <div class="flex items-center justify-between gap-2 mb-1.5 font-bold text-[#0f5132]">
                        <span>Cotización #{{ msg.quote.id }}</span>
                        @if (msg.quote.total) {
                          <span class="bg-success-light text-whatsapp-dark px-2 py-0.5 rounded-full text-[11px] font-semibold">S/ {{ msg.quote.total }}</span>
                        }
                      </div>
                      <div class="flex gap-2 flex-wrap items-center">
                        <a
                          routerLink="/carrito"
                          (click)="chat.close()"
                          class="inline-flex items-center gap-1 py-1 text-[12.5px] font-semibold text-whatsapp-dark underline underline-offset-2 hover:text-[#075e54] transition-colors"
                        >
                          🛒 Ver Carrito
                        </a>
                        <a
                          [href]="realWaQuoteUrl(msg.quote.id, msg.quote.total)"
                          target="_blank"
                          rel="noopener"
                          class="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-[20px] text-[12.5px] font-semibold bg-whatsapp text-white no-underline shadow-[0_2px_4px_rgba(37,211,102,.3)] hover:bg-[#20ba59] hover:-translate-y-px transition"
                        >
                          📲 Asesor Humano
                        </a>
                      </div>
                    </div>
                  }

                  <span class="flex items-center justify-end gap-1 text-[10.5px] text-[#667781] float-right mt-[3px] ml-2">
                    {{ currentTime }}
                    @if (msg.role === 'user') {
                      <span class="text-xs leading-none font-bold text-[#53bdeb]">✓✓</span>
                    }
                  </span>
                </div>
              </div>
            }

            @if (chat.isBusy()) {
              <div class="wa-msg-in self-start max-w-[86%]">
                <div class="bg-white text-[#111b21] rounded-lg rounded-tl-[2px] px-2.5 pt-2 pb-1.5 shadow-[0_1px_1px_rgba(11,20,26,.12)]">
                  <span class="inline-flex items-center gap-1 px-1.5 py-1">
                    <span class="wa-typing-dot w-1.5 h-1.5 rounded-full bg-[#667781] wa-typing-dot--1"></span>
                    <span class="wa-typing-dot w-1.5 h-1.5 rounded-full bg-[#667781] wa-typing-dot--2"></span>
                    <span class="wa-typing-dot w-1.5 h-1.5 rounded-full bg-[#667781]"></span>
                  </span>
                </div>
              </div>
            }
          </div>

          <!-- Quick Chips -->
          <div class="bg-[#f0f2f5] px-2.5 py-1.5 border-t border-[#e9edef] flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              type="button"
              (click)="sendQuick('Hola Angibell, quisiera consultar disponibilidad y precios')"
              class="shrink-0 inline-flex items-center gap-1 whitespace-nowrap bg-white border border-[#cce5df] text-whatsapp-dark text-xs font-medium px-[11px] py-[5px] rounded-2xl cursor-pointer hover:bg-[#e7f7f4] hover:border-whatsapp-dark hover:-translate-y-px transition"
            >
              💰 Cotizar
            </button>
            <button
              type="button"
              (click)="sendQuick('Hola Angibell, ¿tienen disponibilidad de stock?')"
              class="shrink-0 inline-flex items-center gap-1 whitespace-nowrap bg-white border border-[#cce5df] text-whatsapp-dark text-xs font-medium px-[11px] py-[5px] rounded-2xl cursor-pointer hover:bg-[#e7f7f4] hover:border-whatsapp-dark hover:-translate-y-px transition"
            >
              📦 Disponibilidad
            </button>
            <button
              type="button"
              (click)="sendQuick('Hola Angibell, ¿cómo coordinan los envíos a domicilio?')"
              class="shrink-0 inline-flex items-center gap-1 whitespace-nowrap bg-white border border-[#cce5df] text-whatsapp-dark text-xs font-medium px-[11px] py-[5px] rounded-2xl cursor-pointer hover:bg-[#e7f7f4] hover:border-whatsapp-dark hover:-translate-y-px transition"
            >
              🚚 Envíos
            </button>
          </div>

          <!-- Input Footer -->
          <div class="bg-[#f0f2f5] px-2.5 py-2 border-t border-[#e9edef] flex items-center gap-2">
            <input
              type="text"
              [(ngModel)]="userInput"
              (keydown.enter)="handleSend()"
              placeholder="Escribe un mensaje..."
              class="flex-1 min-w-0 bg-white border-0 outline-none rounded-[20px] px-3.5 py-[9px] text-[13.5px] text-[#111b21] placeholder:text-[#8696a0] shadow-[0_1px_1px_rgba(0,0,0,.06)] focus:outline-none"
            />
            <button
              type="button"
              (click)="handleSend()"
              [disabled]="chat.isBusy() || !userInput.trim()"
              class="w-[38px] h-[38px] p-0 border-0 rounded-full bg-whatsapp-hover hover:bg-[#008f6f] hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 text-white flex items-center justify-center cursor-pointer transition shrink-0"
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
        [attr.data-open]="chat.isOpen()"
        class="relative w-14 h-14 max-[900px]:w-[52px] max-[900px]:h-[52px] p-0 border-0 outline-none rounded-full bg-whatsapp data-[open=true]:bg-[#075e54] text-white flex items-center justify-center shadow-[0_4px_16px_rgba(0,0,0,.25)] hover:scale-[1.06] transition-[scale,background-color] duration-150 cursor-pointer"
        aria-label="Abrir chat de WhatsApp"
      >
        @if (!chat.isOpen()) {
          <span class="wa-badge-pulse absolute -top-[3px] -right-[3px] block min-w-[18px] h-[18px] px-1 bg-[#e53935] text-white text-[11px] font-bold leading-[18px] text-center rounded-[10px] shadow-[0_2px_4px_rgba(0,0,0,.2)]">
            1
          </span>
          <svg class="w-[30px] h-[30px] fill-current" viewBox="0 0 24 24">
            <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.5-.3z"/>
          </svg>
        } @else {
          <svg class="w-6 h-6 stroke-current" fill="none" viewBox="0 0 24 24" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        }
      </button>

    </div>
  `,
  styles: [`
    /* Keyframe animations from the original chat frame (component-scoped) */
    .wa-slide-up { animation: pwacSlideUp .25s cubic-bezier(.2, .9, .3, 1); }
    .wa-msg-in { animation: pwacMsgIn .15s ease-out; }
    .wa-badge-pulse { animation: pwacPulse 2s infinite; }
    .wa-typing-dot { animation: pwacBlink 1.4s infinite ease-in-out both; }
    .wa-typing-dot--1 { animation-delay: -0.32s; }
    .wa-typing-dot--2 { animation-delay: -0.16s; }

    @keyframes pwacSlideUp {
      from { opacity: 0; transform: translateY(20px) scale(.96); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes pwacMsgIn {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes pwacPulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.18); }
      100% { transform: scale(1); }
    }
    @keyframes pwacBlink {
      0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
      40% { transform: scale(1.1); opacity: 1; }
    }
  `]
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
