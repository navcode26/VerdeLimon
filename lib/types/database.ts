export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Store {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  logo_url: string | null;
  hero_image_url: string | null;
  hero_title: string | null;
  hero_subtitle: string | null;
  whatsapp_number: string;
  free_shipping_threshold: number;
  currency_symbol: string;
  address_text: string | null;
  opening_hours_weekdays: string | null;
  opening_hours_weekends: string | null;
  closed_days_text: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type StoreInsert = {
  id?: string;
  slug: string;
  name: string;
  tagline?: string | null;
  description?: string | null;
  logo_url?: string | null;
  hero_image_url?: string | null;
  hero_title?: string | null;
  hero_subtitle?: string | null;
  whatsapp_number: string;
  free_shipping_threshold?: number;
  currency_symbol?: string;
  address_text?: string | null;
  opening_hours_weekdays?: string | null;
  opening_hours_weekends?: string | null;
  closed_days_text?: string | null;
  instagram_url?: string | null;
  facebook_url?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type StoreUpdate = Partial<StoreInsert>;

export interface Category {
  id: string;
  store_id: string;
  name: string;
  slug: string;
  display_order: number;
  active: boolean;
  created_at: string;
}

export type CategoryInsert = {
  id?: string;
  store_id: string;
  name: string;
  slug: string;
  display_order?: number;
  active?: boolean;
  created_at?: string;
};

export type CategoryUpdate = Partial<CategoryInsert>;

export interface Product {
  id: string;
  store_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  badge: string | null;
  unit: string | null;
  active: boolean;
  is_featured: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  category?: Category | null;
}

export type ProductInsert = {
  id?: string;
  store_id: string;
  category_id?: string | null;
  name: string;
  description?: string | null;
  price: number;
  image_url?: string | null;
  badge?: string | null;
  unit?: string | null;
  active?: boolean;
  is_featured?: boolean;
  display_order?: number;
  created_at?: string;
  updated_at?: string;
};

export type ProductUpdate = Partial<ProductInsert>;

export type ProductDraft = {
  name: string;
  description?: string | null;
  price: number;
  category_id?: string | null;
  image_url?: string | null;
  badge?: string | null;
  unit?: string | null;
  active: boolean;
  is_featured?: boolean;
};

export interface Database {
  public: {
    Tables: {
      stores: {
        Row: Store;
        Insert: StoreInsert;
        Update: StoreUpdate;
        Relationships: [];
      };
      categories: {
        Row: Category;
        Insert: CategoryInsert;
        Update: CategoryUpdate;
        Relationships: [
          {
            foreignKeyName: "categories_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: false;
            referencedRelation: "stores";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: Product;
        Insert: ProductInsert;
        Update: ProductUpdate;
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "products_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: false;
            referencedRelation: "stores";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
