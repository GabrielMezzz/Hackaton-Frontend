import { Injectable, computed, signal } from '@angular/core';
import { CartItem, CartTotals } from '../models/cart.model';

const CART_KEY = 'angibell_carrito_v1';
const PROMO_3X2 = true;

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly _items = signal<CartItem[]>(this.loadFromStorage());

  readonly items = this._items.asReadonly();

  readonly totals = computed<CartTotals>(() => {
    const list = this._items();
    const unidades = list.reduce((acc, i) => acc + i.qty, 0);
    const subtotal = list.reduce((acc, i) => acc + (i.price * i.qty), 0);

    let descuento = 0;
    if (PROMO_3X2 && unidades >= 3) {
      // Expandir precios individuales de cada prenda para aplicar promo 3x2
      const unitPrices: number[] = [];
      list.forEach(i => {
        for (let q = 0; q < i.qty; q++) unitPrices.push(i.price);
      });
      unitPrices.sort((a, b) => a - b);
      const freeCount = Math.floor(unidades / 3);
      for (let k = 0; k < freeCount; k++) {
        descuento += unitPrices[k];
      }
    }

    const total = Math.max(0, subtotal - descuento);
    return {
      unidades,
      subtotal: Math.round(subtotal * 100) / 100,
      descuento: Math.round(descuento * 100) / 100,
      total: Math.round(total * 100) / 100
    };
  });

  readonly count = computed(() => this.totals().unidades);

  addItem(item: CartItem): void {
    this._items.update(current => {
      const existing = current.find(i => i.key === item.key);
      let updated: CartItem[];
      if (existing) {
        const newQty = Math.min(existing.available, existing.qty + item.qty);
        updated = current.map(i => i.key === item.key ? { ...i, qty: newQty } : i);
      } else {
        updated = [...current, item];
      }
      this.saveToStorage(updated);
      return updated;
    });
  }

  updateQty(key: string, qty: number): void {
    this._items.update(current => {
      const updated = current.map(i => {
        if (i.key === key) {
          const validQty = Math.max(1, Math.min(i.available || 99, qty));
          return { ...i, qty: validQty };
        }
        return i;
      });
      this.saveToStorage(updated);
      return updated;
    });
  }

  removeItem(key: string): void {
    this._items.update(current => {
      const updated = current.filter(i => i.key !== key);
      this.saveToStorage(updated);
      return updated;
    });
  }

  clear(): void {
    this._items.set([]);
    this.saveToStorage([]);
  }

  private loadFromStorage(): CartItem[] {
    try {
      const raw = localStorage.getItem(CART_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveToStorage(items: CartItem[]): void {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(items));
    } catch {}
  }
}
