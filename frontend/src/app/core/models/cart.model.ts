export interface CartItem {
  key: string;
  pkey: string;
  sku: string;
  name: string;
  price: number;
  foto?: string | null;
  colorIdx: number;
  color?: string | null;
  colorHex?: string | null;
  size: string;
  qty: number;
  available: number;
  tipo: string;
  publico: string;
}

export interface CartTotals {
  unidades: number;
  subtotal: number;
  descuento: number;
  total: number;
}
