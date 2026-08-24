import type { Store, Category, Product } from "@/lib/types/database";

export type { Store, Category, Product } from "@/lib/types/database";

export const formatMoney = (value: number, currencySymbol: string = "$"): string => {
  return `${currencySymbol}${value.toLocaleString("es-AR")}`;
};

/**
 * Plantilla de datos de respaldo (fallback) utilizada únicamente si aún no se han configurado
 * las variables de entorno de Supabase en el entorno local.
 */
export const FALLBACK_STORE: Store = {
  id: "store-verde-limon-001",
  slug: "verde-limon",
  name: "Verde Limón",
  tagline: "Bakery Artesanal",
  description: "Elaboramos pastelería y panadería honesta, utilizando recetas clásicas combinadas con técnicas modernas y materia prima de máxima calidad.",
  logo_url: "/logo-verde-limon.png",
  hero_image_url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80",
  hero_title: "Pastelería fresca horneada para alegrar tu día.",
  hero_subtitle: "Elegí tus favoritos de nuestro menú artesanal, armá tu caja dulce o panificados y recibilos frescos en la puerta de tu casa o retirálos en nuestro local.",
  whatsapp_number: "5491100000000",
  free_shipping_threshold: 30000,
  currency_symbol: "$",
  address_text: "Local céntrico, Ciudad de Buenos Aires",
  opening_hours_weekdays: "Jueves a Domingo — Mañana: 08:00 a 10:00 hs (Delivery y Retiro)",
  opening_hours_weekends: "Jueves a Domingo — Tarde: 16:00 a 20:00 hs (Solo Retiro en local)",
  closed_days_text: "Lunes a Miércoles: Cerrado por producción",
  instagram_url: "https://instagram.com",
  facebook_url: null,
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const FALLBACK_CATEGORIES: Category[] = [
  { id: "cat-1", store_id: "store-verde-limon-001", name: "Panificados", slug: "panificados", display_order: 1, active: true, created_at: new Date().toISOString() },
  { id: "cat-2", store_id: "store-verde-limon-001", name: "Pastelería", slug: "pasteleria", display_order: 2, active: true, created_at: new Date().toISOString() },
  { id: "cat-3", store_id: "store-verde-limon-001", name: "Dulce", slug: "dulce", display_order: 3, active: true, created_at: new Date().toISOString() },
];

export const FALLBACK_PRODUCTS: Product[] = [
  {
    id: "prod-1",
    store_id: "store-verde-limon-001",
    category_id: "cat-1",
    name: "Docena de Medialunas de Manteca",
    description: "Hojaldre 100% manteca, almíbar casero con toque cítrico de limón y horneado diario.",
    price: 8500,
    image_url: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80",
    badge: "Más Vendido",
    unit: "12 unidades",
    active: true,
    is_featured: true,
    display_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: FALLBACK_CATEGORIES[0],
  },
  {
    id: "prod-2",
    store_id: "store-verde-limon-001",
    category_id: "cat-2",
    name: "Tarta de Frutilla & Pastelera",
    description: "Masa sableé crocante, suave crema pastelera perfumada con vainilla y frutillas frescas de estación.",
    price: 12500,
    image_url: "https://images.unsplash.com/photo-1519915028121-7d3463d20b13?auto=format&fit=crop&w=600&q=80",
    badge: "Destacado",
    unit: "8 a 10 porciones",
    active: true,
    is_featured: true,
    display_order: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: FALLBACK_CATEGORIES[1],
  },
  {
    id: "prod-3",
    store_id: "store-verde-limon-001",
    category_id: "cat-3",
    name: "Alfajores de Maicena Artesanales",
    description: "Masa extra suave que se deshace en la boca, abundante dulce de leche repostero y coco rallado.",
    price: 7200,
    image_url: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80",
    badge: "Clásico",
    unit: "6 unidades",
    active: true,
    is_featured: false,
    display_order: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: FALLBACK_CATEGORIES[2],
  },
  {
    id: "prod-4",
    store_id: "store-verde-limon-001",
    category_id: "cat-2",
    name: "Lemon Pie Signature",
    description: "Nuestra especialidad: curd de limones frescos, masa crocante y merengue italiano flameado a la vista.",
    price: 13800,
    image_url: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=600&q=80",
    badge: "Especialidad",
    unit: "10 porciones",
    active: true,
    is_featured: true,
    display_order: 4,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: FALLBACK_CATEGORIES[1],
  },
  {
    id: "prod-5",
    store_id: "store-verde-limon-001",
    category_id: "cat-1",
    name: "Pan de Masa Madre Campesino",
    description: "Fermentación natural de 24 horas, corteza crujiente y miga aireada y húmeda.",
    price: 4900,
    image_url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80",
    badge: null,
    unit: "1 unidad (850g)",
    active: true,
    is_featured: false,
    display_order: 5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: FALLBACK_CATEGORIES[0],
  },
];
