import { Storefront } from "@/components/storefront/storefront";
import { createClient } from "@/lib/supabase/server";
import {
  getStoreBySlug,
  getCategoriesByStore,
  getActiveProductsByStore,
} from "@/lib/services/store-service";

export const revalidate = 0;

export default async function HomePage() {
  let initialStore = null;
  let initialCategories: any[] = [];
  let initialProducts: any[] = [];

  try {
    const supabase = await createClient();
    const storeRes = await getStoreBySlug(undefined, supabase);
    if (storeRes.data) {
      initialStore = storeRes.data;
      const [catRes, prodRes] = await Promise.all([
        getCategoriesByStore(storeRes.data.id, supabase),
        getActiveProductsByStore(storeRes.data.id, supabase),
      ]);
      initialCategories = catRes.data || [];
      initialProducts = prodRes.data || [];
    }
  } catch (error) {
    console.error("Error cargando datos en SSR para HomePage:", error);
  }

  return (
    <Storefront
      initialStore={initialStore}
      initialCategories={initialCategories}
      initialProducts={initialProducts}
    />
  );
}
