import { Product } from './product.model';

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  active: boolean;
  created_at?: string;
  total_productos?: number;
  productos?: Product[];
}

export interface AdminProductPayload {
  id: string;
  name: string;
  price: number;
  base_price?: number;
  description?: string;
  category?: string;
  category_id?: number;
  audience?: string;
  active?: boolean;
  store_key?: string;
  material?: string;
  colors?: {
    nombre: string;
    hex: string;
    foto?: string | number;
    image_url?: string;
    photo_id?: number;
  }[];
}
