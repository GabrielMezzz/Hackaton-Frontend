import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { QuoteResponse } from '../models/product.model';

export interface ChatMessage {
  role: 'bot' | 'user';
  text: string;
  streaming?: boolean;
  quote?: {
    id: number | string;
    total: string;
    status: string;
    available: boolean;
  } | null;
  delegated?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class WebhookChatService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = '/api/webhook-order';

  readonly isOpen = signal(false);
  readonly isBusy = signal(false);
  readonly messages = signal<ChatMessage[]>([
    {
      role: 'bot',
      text: '¡Hola! 👋 Soy el asistente de Angibell Creaciones.\n\nPuedo ayudarte con:\n• Consultar disponibilidad y precios\n• Generar tu cotización al instante\n• Resolver tus dudas\n\n¿En qué te puedo ayudar hoy?'
    }
  ]);

  toggle(): void {
    this.isOpen.update(v => !v);
  }

  open(): void {
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }

  sendMessage(text: string): void {
    if (this.isBusy() || !text.trim()) return;

    this.messages.update(msgs => [...msgs, { role: 'user', text: text.trim() }]);
    this.isBusy.set(true);

    this.http.post<QuoteResponse>(this.endpoint, { message: text.trim() }).subscribe({
      next: (data) => {
        this.isBusy.set(false);
        const botText = data.summary || data.message || data.error || 'Gracias por tu consulta.';
        const botMsg: ChatMessage = {
          role: 'bot',
          text: botText,
          quote: data.quote_id ? {
            id: data.quote_id,
            total: data.total || '',
            status: data.status || 'pending',
            available: data.available !== false
          } : null,
          delegated: !!data.delegated
        };
        this.messages.update(msgs => [...msgs, botMsg]);
      },
      error: () => {
        this.isBusy.set(false);
        this.messages.update(msgs => [
          ...msgs,
          {
            role: 'bot',
            text: 'Lo sentimos, hubo un inconveniente al conectar con el asistente. Puedes escribirnos directamente a WhatsApp.'
          }
        ]);
      }
    });
  }

  quoteItem(name: string, color: string, size: string, sku: string, qty: number = 1): void {
    let msg = `Hola Angibell, quisiera consultar por ${name}`;
    if (color) msg += ` en color ${color}`;
    if (size) msg += `, talla ${size}`;
    if (sku) msg += ` (SKU ${sku})`;
    if (qty > 1) msg += ` cantidad ${qty}`;

    this.open();
    this.sendMessage(msg);
  }
}
