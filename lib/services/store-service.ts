import { createClient } from "@/lib/supabase/client";
import type {
  Store,
  Category,
  Product,
  ProductDraft,
} from "@/lib/types/database";

const DEFAULT_SLUG = process.env.NEXT_PUBLIC_STORE_SLUG || "verde-limon";

/**
 * Obtiene la configuración de una tienda por su slug único.
 */
export async function getStoreBySlug(
  slug: string = DEFAULT_SLUG,
  customClient?: any
): Promise<{ data: Store | null; error: string | null }> {
  try {
    const supabase = customClient || createClient();
    const { data, error } = await supabase
      .from("stores")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as Store, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || "Error al consultar la tienda" };
  }
}

/**
 * Obtiene las categorías de una tienda ordenadas por display_order.
 */
export async function getCategoriesByStore(
  storeId: string,
  customClient?: any
): Promise<{ data: Category[]; error: string | null }> {
  try {
    const supabase = customClient || createClient();
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("store_id", storeId)
      .eq("active", true)
      .order("display_order", { ascending: true });

    if (error) {
      return { data: [], error: error.message };
    }

    return { data: (data as Category[]) || [], error: null };
  } catch (err: any) {
    return { data: [], error: err.message || "Error al consultar categorías" };
  }
}

/**
 * Obtiene los productos activos para el catálogo público de la tienda.
 */
export async function getActiveProductsByStore(
  storeId: string,
  customClient?: any
): Promise<{ data: Product[]; error: string | null }> {
  try {
    const supabase = customClient || createClient();
    const { data, error } = await supabase
      .from("products")
      .select("*, category:categories(*)")
      .eq("store_id", storeId)
      .eq("active", true)
      .order("display_order", { ascending: true });

    if (error) {
      return { data: [], error: error.message };
    }

    return { data: (data as Product[]) || [], error: null };
  } catch (err: any) {
    return { data: [], error: err.message || "Error al consultar productos" };
  }
}

/**
 * Obtiene todos los productos (activos e inactivos) para el panel de administración.
 */
export async function getAllProductsAdmin(
  storeId: string
): Promise<{ data: Product[]; error: string | null }> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("products")
      .select("*, category:categories(*)")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false });

    if (error) {
      return { data: [], error: error.message };
    }

    return { data: (data as Product[]) || [], error: null };
  } catch (err: any) {
    return { data: [], error: err.message || "Error al consultar productos de administración" };
  }
}

/**
 * Crea un nuevo producto en la tienda.
 */
export async function createProduct(
  storeId: string,
  draft: ProductDraft
): Promise<{ data: Product | null; error: string | null }> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("products")
      .insert({
        store_id: storeId,
        name: draft.name,
        description: draft.description || null,
        price: draft.price,
        category_id: draft.category_id || null,
        image_url: draft.image_url || null,
        badge: draft.badge || null,
        unit: draft.unit || null,
        active: draft.active,
        is_featured: draft.is_featured || false,
        display_order: 0,
      })
      .select("*, category:categories(*)")
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as Product, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || "Error al crear producto" };
  }
}

/**
 * Actualiza un producto existente.
 */
export async function updateProduct(
  productId: string,
  draft: Partial<ProductDraft>
): Promise<{ data: Product | null; error: string | null }> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("products")
      .update({
        ...draft,
        updated_at: new Date().toISOString(),
      })
      .eq("id", productId)
      .select("*, category:categories(*)")
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as Product, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || "Error al actualizar producto" };
  }
}

/**
 * Alterna el estado activo/pausado de un producto.
 */
export async function toggleProductActive(
  productId: string,
  active: boolean
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from("products")
      .update({ active, updated_at: new Date().toISOString() })
      .eq("id", productId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message || "Error al cambiar estado del producto" };
  }
}

/**
 * Elimina un producto.
 */
export async function deleteProduct(
  productId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", productId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message || "Error al eliminar producto" };
  }
}

/**
 * Actualiza la configuración de la tienda.
 */
export async function updateStoreSettings(
  storeId: string,
  settings: Partial<Omit<Store, "id" | "slug" | "created_at">>
): Promise<{ data: Store | null; error: string | null }> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("stores")
      .update({
        ...settings,
        updated_at: new Date().toISOString(),
      })
      .eq("id", storeId)
      .select("*")
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as Store, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || "Error al actualizar configuración" };
  }
}

/**
 * Crea una nueva categoría para la tienda.
 */
export async function createCategory(
  storeId: string,
  name: string
): Promise<{ data: Category | null; error: string | null }> {
  try {
    const supabase = createClient();
    const slug = name
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "") || `cat-${Date.now()}`;

    const { data, error } = await supabase
      .from("categories")
      .insert({
        store_id: storeId,
        name: name.trim(),
        slug,
        active: true,
        display_order: 0,
      })
      .select("*")
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as Category, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || "Error al crear categoría" };
  }
}

/**
 * Actualiza el nombre de una categoría existente.
 */
export async function updateCategory(
  categoryId: string,
  name: string
): Promise<{ data: Category | null; error: string | null }> {
  try {
    const supabase = createClient();
    const slug = name
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "") || `cat-${Date.now()}`;

    const { data, error } = await supabase
      .from("categories")
      .update({
        name: name.trim(),
        slug,
      })
      .eq("id", categoryId)
      .select("*")
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as Category, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || "Error al actualizar categoría" };
  }
}

/**
 * Elimina una categoría existente.
 */
export async function deleteCategory(
  categoryId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", categoryId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message || "Error al eliminar categoría" };
  }
}

