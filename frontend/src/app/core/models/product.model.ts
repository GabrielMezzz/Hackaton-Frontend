export interface ProductColor {
  nombre: string;
  hex: string;
  foto: string;
}

export interface Product {
  id: string;          // 'TER-001'
  sku: string;         // 'TER-001'
  key: string;         // 'TER-001'
  name: string;
  price: number;
  tipo: string;
  categoria?: string;
  category_id?: number;
  category_slug?: string;
  category_name?: string;
  publico: string;
  sizes: string[];
  stock: Record<string, number>;
  colors: ProductColor[];
  description?: string;
}

export interface QuoteResponse {
  quote_id?: number;
  status?: string;
  available?: boolean;
  total?: string;
  summary?: string;
  delegated?: boolean;
  message?: string;
  catalog_url?: string;
  error?: string;
}
