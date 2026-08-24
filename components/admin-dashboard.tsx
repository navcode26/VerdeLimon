"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Edit3,
  Eye,
  Grid2X2,
  LogOut,
  Menu,
  Package,
  Plus,
  Search,
  Settings,
  Tag,
  Trash2,
  X,
  Loader2,
  Check,
  Phone,
  Clock,
  MapPin,
  Truck,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import type {
  Product,
  Category,
  Store,
  ProductDraft,
} from "@/lib/types/database";
import {
  formatMoney,
  FALLBACK_STORE,
  FALLBACK_CATEGORIES,
  FALLBACK_PRODUCTS,
} from "@/lib/products-data";
import { createClient } from "@/lib/supabase/client";
import {
  getStoreBySlug,
  getCategoriesByStore,
  getAllProductsAdmin,
  createProduct,
  updateProduct,
  toggleProductActive,
  deleteProduct,
  createCategory,
  updateCategory,
  deleteCategory,
  updateStoreSettings,
} from "@/lib/services/store-service";

type AdminSection = "products" | "categories" | "settings";

function Sidebar({
  currentSection,
  onSelectSection,
  open,
  onClose,
  store,
  onLogout,
}: {
  currentSection: AdminSection;
  onSelectSection: (section: AdminSection) => void;
  open: boolean;
  onClose: () => void;
  store: Store;
  onLogout: () => void;
}) {
  const navItems: { id: AdminSection; label: string; icon: typeof Package }[] = [
    { id: "products", label: "Productos", icon: Package },
    { id: "categories", label: "Categorías", icon: Tag },
    { id: "settings", label: "Configuración", icon: Settings },
  ];

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-foreground/30 lg:hidden ${open ? "block" : "hidden"}`}
        onClick={onClose}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-primary px-4 py-5 text-primary-foreground transition-transform lg:static lg:translate-x-0 ${open ? "translate-x-0" : "hidden"
          } lg:flex`}
      >
        <div className="mb-10 flex items-center justify-between px-3">
          <div className="flex items-center gap-3">
            {store.logo_url ? (
              <img
                src={store.logo_url}
                alt={store.name}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-bold font-serif text-sm">
                {store.name.substring(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-serif text-lg leading-none">{store.name}</p>
              <p className="mt-1 text-[9px] uppercase tracking-[.18em] text-primary-foreground/60">
                {store.tagline || "Panel Admin"}
              </p>
            </div>
          </div>
          <button
            className="lg:hidden"
            onClick={onClose}
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="space-y-1 text-sm">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[.2em] text-primary-foreground/45">
            Administración
          </p>
          {navItems.map(({ id, label, icon: Icon }) => {
            const isActive = currentSection === id;
            return (
              <button
                key={id}
                onClick={() => {
                  onSelectSection(id);
                  onClose();
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors ${isActive
                  ? "bg-primary-foreground/15 font-semibold text-primary-foreground"
                  : "text-primary-foreground/65 hover:bg-primary-foreground/8 hover:text-primary-foreground"
                  }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-accent" : ""}`} />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>

        <div className="mt-auto space-y-1 border-t border-primary-foreground/10 pt-4 text-sm">
          <Link
            href="/"
            target="_blank"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-primary-foreground/65 hover:bg-primary-foreground/8 hover:text-primary-foreground transition-colors"
          >
            <Eye className="h-4 w-4" />
            <span>Ver tienda online</span>
            <ExternalLink className="h-3 w-3 ml-auto opacity-50" />
          </Link>
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-destructive-foreground/80 hover:bg-destructive/20 transition-colors text-left"
          >
            <LogOut className="h-4 w-4" />
            <span>Cerrar sesión</span>
          </button>

          <div className="mt-4 flex items-center gap-3 rounded-xl bg-primary-foreground/8 p-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent font-serif font-bold text-accent-foreground">
              AD
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold">Administrador</p>
              <p className="truncate text-[10px] text-primary-foreground/50">
                {store.name}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

function ProductModal({
  product,
  categories,
  onClose,
  onSave,
  isSaving,
}: {
  product: Product | null;
  categories: Category[];
  onClose: () => void;
  onSave: (draft: ProductDraft) => void;
  isSaving: boolean;
}) {
  const [draft, setDraft] = useState<ProductDraft>(
    product
      ? {
        name: product.name,
        description: product.description || "",
        price: product.price,
        category_id: product.category_id || categories[0]?.id || "",
        image_url: product.image_url || "",
        badge: product.badge || "",
        unit: product.unit || "",
        active: product.active,
        is_featured: product.is_featured || false,
      }
      : {
        name: "",
        description: "",
        price: 0,
        category_id: categories[0]?.id || "",
        image_url: "",
        badge: "",
        unit: "",
        active: true,
        is_featured: false,
      }
  );

  const update = (
    key: keyof ProductDraft,
    value: string | number | boolean | null
  ) => setDraft((current) => ({ ...current, [key]: value }));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/45 p-4 animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="w-full max-w-lg rounded-2xl bg-card shadow-2xl border border-border overflow-hidden">
        <div className="flex items-center justify-between border-b border-border p-5">
          <div>
            <h2 id="modal-title" className="font-serif text-2xl text-primary">
              {product ? "Editar producto" : "Nuevo producto"}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Completá los datos del catálogo en Supabase.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar modal"
            className="rounded-full p-2 text-muted-foreground hover:bg-secondary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form
          className="space-y-4 p-5 max-h-[80vh] overflow-y-auto"
          onSubmit={(event) => {
            event.preventDefault();
            if (draft.name.trim() && draft.price > 0) {
              onSave({ ...draft, name: draft.name.trim() });
            }
          }}
        >
          <div>
            <label
              htmlFor="product-name"
              className="mb-1.5 block text-xs font-semibold text-primary"
            >
              Nombre del producto *
            </label>
            <input
              id="product-name"
              required
              value={draft.name}
              onChange={(e) => update("name", e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
              placeholder="Ej. Docena de medialunas"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="product-price"
                className="mb-1.5 block text-xs font-semibold text-primary"
              >
                Precio *
              </label>
              <input
                id="product-price"
                required
                min="1"
                type="number"
                value={draft.price || ""}
                onChange={(e) => update("price", Number(e.target.value))}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label
                htmlFor="product-category"
                className="mb-1.5 block text-xs font-semibold text-primary"
              >
                Categoría
              </label>
              <select
                id="product-category"
                value={draft.category_id || ""}
                onChange={(e) => update("category_id", e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring text-foreground"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="product-description"
              className="mb-1.5 block text-xs font-semibold text-primary"
            >
              Descripción
            </label>
            <textarea
              id="product-description"
              rows={2}
              value={draft.description || ""}
              onChange={(e) => update("description", e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              placeholder="Detalles sobre ingredientes, elaboración..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="product-badge"
                className="mb-1.5 block text-xs font-semibold text-primary"
              >
                Etiqueta / Badge (Opcional)
              </label>
              <input
                id="product-badge"
                value={draft.badge || ""}
                onChange={(e) => update("badge", e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                placeholder="Ej. Más Vendido, Destacado"
              />
            </div>
            <div>
              <label
                htmlFor="product-unit"
                className="mb-1.5 block text-xs font-semibold text-primary"
              >
                Presentación / Porción
              </label>
              <input
                id="product-unit"
                value={draft.unit || ""}
                onChange={(e) => update("unit", e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                placeholder="Ej. 12 unidades, 8 porciones"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="product-image"
              className="mb-1.5 block text-xs font-semibold text-primary"
            >
              URL de imagen
            </label>
            <input
              id="product-image"
              value={draft.image_url || ""}
              onChange={(e) => update("image_url", e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
              placeholder="https://..."
            />
          </div>

          <div className="space-y-2 pt-1">
            <label className="flex cursor-pointer items-center gap-3 rounded-lg bg-secondary p-3 text-sm font-medium text-primary">
              <input
                type="checkbox"
                checked={draft.active}
                onChange={(e) => update("active", e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
              Producto visible en la tienda (Activo)
            </label>

            <label className="flex cursor-pointer items-center gap-3 rounded-lg bg-secondary p-3 text-sm font-medium text-primary">
              <input
                type="checkbox"
                checked={draft.is_featured}
                onChange={(e) => update("is_featured", e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
              Destacar en la portada principal
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-lg px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-secondary disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{isSaving ? "Guardando..." : "Guardar producto"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function AdminDashboard() {
  const router = useRouter();
  const [currentSection, setCurrentSection] = useState<AdminSection>("products");
  const [store, setStore] = useState<Store>(FALLBACK_STORE);
  const [categories, setCategories] = useState<Category[]>(FALLBACK_CATEGORIES);
  const [products, setProducts] = useState<Product[]>(FALLBACK_PRODUCTS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Filtros y modal de Productos
  const [query, setQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all");
  const [modal, setModal] = useState<Product | null | undefined>(undefined);
  const [menuOpen, setMenuOpen] = useState(false);

  // Estado para gestión de Categorías
  const [newCatName, setNewCatName] = useState("");
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState("");
  const [isCatProcessing, setIsCatProcessing] = useState(false);

  // Estado para Configuración de Tienda
  const [settingsForm, setSettingsForm] = useState({
    name: "",
    tagline: "",
    whatsapp_number: "",
    address_text: "",
    opening_hours_weekdays: "",
    opening_hours_weekends: "",
    closed_days_text: "",
    free_shipping_threshold: 0,
    currency_symbol: "$",
    hero_title: "",
    hero_subtitle: "",
    instagram_url: "",
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSavedSuccess, setSettingsSavedSuccess] = useState(false);

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/admin/login");
      router.refresh();
    } catch (e) {
      console.error("Error al cerrar sesión:", e);
    }
  };

  // Cargar datos reales desde Supabase
  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const storeRes = await getStoreBySlug();
      if (storeRes.data) {
        setStore(storeRes.data);
        setSettingsForm({
          name: storeRes.data.name || "",
          tagline: storeRes.data.tagline || "",
          whatsapp_number: storeRes.data.whatsapp_number || "",
          address_text: storeRes.data.address_text || "",
          opening_hours_weekdays: storeRes.data.opening_hours_weekdays || "",
          opening_hours_weekends: storeRes.data.opening_hours_weekends || "",
          closed_days_text: storeRes.data.closed_days_text || "",
          free_shipping_threshold: storeRes.data.free_shipping_threshold || 0,
          currency_symbol: storeRes.data.currency_symbol || "$",
          hero_title: storeRes.data.hero_title || "",
          hero_subtitle: storeRes.data.hero_subtitle || "",
          instagram_url: storeRes.data.instagram_url || "",
        });

        const [catRes, prodRes] = await Promise.all([
          getCategoriesByStore(storeRes.data.id),
          getAllProductsAdmin(storeRes.data.id),
        ]);

        if (catRes.data && catRes.data.length > 0) {
          setCategories(catRes.data);
        }
        if (prodRes.data && prodRes.data.length > 0) {
          setProducts(prodRes.data);
        }
      }
    } catch (e) {
      console.error("Error al cargar dashboard:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [categories]);

  const filtered = useMemo(() => {
    return products.filter((product) => {
      const matchesQuery = product.name
        .toLowerCase()
        .includes(query.toLowerCase());
      const matchesCategory =
        selectedCategoryFilter === "all" ||
        product.category_id === selectedCategoryFilter;
      return matchesQuery && matchesCategory;
    });
  }, [products, query, selectedCategoryFilter]);

  // Manejadores de Productos
  const handleSaveProduct = async (draft: ProductDraft) => {
    try {
      setIsSaving(true);
      if (modal) {
        const res = await updateProduct(modal.id, draft);
        if (res.data) {
          setProducts((current) =>
            current.map((item) => (item.id === modal.id ? res.data! : item))
          );
        } else {
          setProducts((current) =>
            current.map((item) =>
              item.id === modal.id
                ? {
                  ...item,
                  ...draft,
                  description: draft.description || null,
                  badge: draft.badge || null,
                  unit: draft.unit || null,
                  image_url: draft.image_url || null,
                  category_id: draft.category_id || null,
                  is_featured: draft.is_featured || false,
                  updated_at: new Date().toISOString(),
                }
                : item
            )
          );
        }
      } else {
        const res = await createProduct(store.id, draft);
        if (res.data) {
          setProducts((current) => [res.data!, ...current]);
        } else {
          const newProd: Product = {
            id: `prod-${Date.now()}`,
            store_id: store.id,
            name: draft.name,
            description: draft.description || null,
            price: draft.price,
            category_id: draft.category_id || null,
            image_url: draft.image_url || null,
            badge: draft.badge || null,
            unit: draft.unit || null,
            active: draft.active,
            is_featured: draft.is_featured || false,
            display_order: products.length + 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          setProducts((current) => [newProd, ...current]);
        }
      }
      setModal(undefined);
    } catch (e) {
      console.error("Error al guardar producto:", e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    const nextState = !currentActive;
    setProducts((current) =>
      current.map((item) =>
        item.id === id ? { ...item, active: nextState } : item
      )
    );
    await toggleProductActive(id, nextState);
  };

  const handleRemoveProduct = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de eliminar "${name}" del catálogo?`)) return;
    setProducts((current) => current.filter((item) => item.id !== id));
    await deleteProduct(id);
  };

  // Manejadores de Categorías
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      setIsCatProcessing(true);
      const res = await createCategory(store.id, newCatName.trim());
      if (res.data) {
        setCategories((prev) => [...prev, res.data!]);
      } else {
        const fallbackCat: Category = {
          id: `cat-${Date.now()}`,
          store_id: store.id,
          name: newCatName.trim(),
          slug: newCatName.toLowerCase().replace(/\s+/g, "-"),
          display_order: categories.length,
          active: true,
          created_at: new Date().toISOString(),
        };
        setCategories((prev) => [...prev, fallbackCat]);
      }
      setNewCatName("");
    } catch (e) {
      console.error("Error al crear categoría:", e);
    } finally {
      setIsCatProcessing(false);
    }
  };

  const handleUpdateCategory = async (id: string) => {
    if (!editingCatName.trim()) return;
    try {
      setIsCatProcessing(true);
      const res = await updateCategory(id, editingCatName.trim());
      if (res.data) {
        setCategories((prev) =>
          prev.map((c) => (c.id === id ? res.data! : c))
        );
      } else {
        setCategories((prev) =>
          prev.map((c) =>
            c.id === id ? { ...c, name: editingCatName.trim() } : c
          )
        );
      }
      setEditingCatId(null);
      setEditingCatName("");
    } catch (e) {
      console.error("Error al actualizar categoría:", e);
    } finally {
      setIsCatProcessing(false);
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    const prodsInCat = products.filter((p) => p.category_id === id);
    const msg =
      prodsInCat.length > 0
        ? `La categoría "${name}" tiene ${prodsInCat.length} producto(s). Si la eliminás, quedarán sin categoría asignada. ¿Deseás continuar?`
        : `¿Estás seguro de eliminar la categoría "${name}"?`;

    if (!confirm(msg)) return;

    try {
      setIsCatProcessing(true);
      await deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      // Desasociar productos localmente
      setProducts((prev) =>
        prev.map((p) => (p.category_id === id ? { ...p, category_id: null } : p))
      );
    } catch (e) {
      console.error("Error al eliminar categoría:", e);
    } finally {
      setIsCatProcessing(false);
    }
  };

  // Manejador de Configuración de Tienda
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingSettings(true);
      setSettingsSavedSuccess(false);
      const res = await updateStoreSettings(store.id, settingsForm);
      if (res.data) {
        setStore(res.data);
      }
      setSettingsSavedSuccess(true);
      setTimeout(() => setSettingsSavedSuccess(false), 4000);
    } catch (e) {
      console.error("Error al guardar configuración:", e);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const sectionTitles: Record<AdminSection, string> = {
    products: "Productos",
    categories: "Categorías",
    settings: "Configuración de Tienda",
  };

  return (
    <div className="flex min-h-screen bg-secondary/50">
      <Sidebar
        currentSection={currentSection}
        onSelectSection={setCurrentSection}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        store={store}
        onLogout={handleLogout}
      />

      <main className="min-w-0 flex-1 flex flex-col">
        {/* Top Header */}
        <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 md:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenuOpen(true)}
              className="rounded-lg p-2 text-primary lg:hidden"
              aria-label="Abrir menú"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <p className="text-xs text-muted-foreground">
                Panel de administración
              </p>
              <h1 className="font-serif text-xl text-primary">
                {sectionTitles[currentSection]}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              target="_blank"
              className="rounded-lg p-2 text-muted-foreground hover:bg-secondary flex items-center gap-1.5 text-xs font-semibold transition-colors"
              aria-label="Ver tienda online"
            >
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Ver tienda</span>
            </Link>
          </div>
        </header>

        {/* Dynamic Views */}
        <div className="p-4 md:p-8 flex-1">
          {/* ================= SECTION 1: PRODUCTOS ================= */}
          {currentSection === "products" && (
            <div>
              <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                  <p className="mb-1 text-xs font-bold uppercase tracking-[.16em] text-accent-foreground/70">
                    Catálogo
                  </p>
                  <h2 className="font-serif text-4xl text-primary">
                    Tus productos
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Gestioná precios, fotos y disponibilidad en tiempo real.
                  </p>
                </div>
                <button
                  onClick={() => setModal(null)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-sm hover:opacity-90 transition-opacity"
                >
                  <Plus className="h-4 w-4" />
                  Agregar producto
                </button>
              </div>

              {/* Metrics Cards */}
              <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
                  <p className="text-xs text-muted-foreground">Total productos</p>
                  <p className="mt-2 text-2xl font-bold text-primary">
                    {products.length}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
                  <p className="text-xs text-muted-foreground">Activos</p>
                  <p className="mt-2 text-2xl font-bold text-primary">
                    {products.filter((p) => p.active).length}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
                  <p className="text-xs text-muted-foreground">Pausados</p>
                  <p className="mt-2 text-2xl font-bold text-primary">
                    {products.filter((p) => !p.active).length}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
                  <p className="text-xs text-muted-foreground">Categorías</p>
                  <p className="mt-2 text-2xl font-bold text-primary">
                    {categories.length}
                  </p>
                </div>
              </div>

              {/* Products Table Container */}
              <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
                <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="relative max-w-sm flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Buscar producto..."
                      className="w-full rounded-lg border border-input bg-background py-2.5 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  {/* Selector de Categorías */}
                  <div className="flex items-center gap-2">
                    <Grid2X2 className="h-4 w-4 text-muted-foreground hidden sm:inline" />
                    <select
                      value={selectedCategoryFilter}
                      onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                      className="rounded-lg border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground outline-none"
                    >
                      <option value="all">Todas las categorías</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {isLoading ? (
                  <div className="flex items-center justify-center py-20 gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Cargando catálogo...</p>
                  </div>
                ) : (
                  <>
                    <div className="hidden overflow-x-auto md:block">
                      <table className="w-full text-left">
                        <thead className="bg-secondary/60 text-[10px] uppercase tracking-wider text-muted-foreground">
                          <tr>
                            <th className="px-5 py-3 font-bold">Producto</th>
                            <th className="px-5 py-3 font-bold">Categoría</th>
                            <th className="px-5 py-3 font-bold">Precio</th>
                            <th className="px-5 py-3 font-bold">Estado</th>
                            <th className="px-5 py-3 text-right font-bold">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {filtered.map((product) => {
                            const catName = product.category_id
                              ? categoryMap.get(product.category_id) || "Sin categoría"
                              : "Sin categoría";

                            return (
                              <tr key={product.id} className="text-sm hover:bg-secondary/20 transition-colors">
                                <td className="px-5 py-3">
                                  <div className="flex items-center gap-3">
                                    <img
                                      src={
                                        product.image_url ||
                                        "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=160&q=80"
                                      }
                                      alt=""
                                      className="h-11 w-11 rounded-lg object-cover bg-secondary"
                                    />
                                    <div>
                                      <span className="font-semibold text-primary block">
                                        {product.name}
                                      </span>
                                      {product.badge && (
                                        <span className="text-[10px] font-bold text-accent-foreground bg-accent/30 px-2 py-0.5 rounded-full">
                                          {product.badge}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-5 py-3 text-muted-foreground">
                                  {catName}
                                </td>
                                <td className="px-5 py-3 font-semibold text-primary">
                                  {formatMoney(product.price, store.currency_symbol)}
                                </td>
                                <td className="px-5 py-3">
                                  <button
                                    onClick={() =>
                                      handleToggleActive(product.id, product.active)
                                    }
                                    className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition-all ${product.active
                                      ? "bg-accent/35 text-accent-foreground"
                                      : "bg-muted text-muted-foreground"
                                      }`}
                                  >
                                    {product.active ? "Activo" : "Pausado"}
                                  </button>
                                </td>
                                <td className="px-5 py-3">
                                  <div className="flex justify-end gap-1">
                                    <button
                                      onClick={() => setModal(product)}
                                      aria-label={`Editar ${product.name}`}
                                      className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-primary transition-colors"
                                    >
                                      <Edit3 className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleRemoveProduct(product.id, product.name)
                                      }
                                      aria-label={`Eliminar ${product.name}`}
                                      className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Products View */}
                    <div className="divide-y divide-border md:hidden">
                      {filtered.map((product) => (
                        <div key={product.id} className="flex items-center gap-3 p-4">
                          <img
                            src={
                              product.image_url ||
                              "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=160&q=80"
                            }
                            alt=""
                            className="h-14 w-14 rounded-lg object-cover bg-secondary"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-primary">
                              {product.name}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {product.category_id
                                ? categoryMap.get(product.category_id) || "General"
                                : "General"}{" "}
                              · {formatMoney(product.price, store.currency_symbol)}
                            </p>
                            <button
                              onClick={() =>
                                handleToggleActive(product.id, product.active)
                              }
                              className={`mt-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${product.active
                                ? "bg-accent/35 text-accent-foreground"
                                : "bg-muted text-muted-foreground"
                                }`}
                            >
                              {product.active ? "Activo" : "Pausado"}
                            </button>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setModal(product)}
                              aria-label={`Editar ${product.name}`}
                              className="rounded-lg p-2 text-muted-foreground"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() =>
                                handleRemoveProduct(product.id, product.name)
                              }
                              aria-label={`Eliminar ${product.name}`}
                              className="rounded-lg p-2 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {filtered.length === 0 && (
                      <p className="p-8 text-center text-sm text-muted-foreground">
                        No encontramos productos.
                      </p>
                    )}
                  </>
                )}
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Mostrando {filtered.length} de {products.length} productos
              </p>
            </div>
          )}

          {/* ================= SECTION 2: CATEGORÍAS ================= */}
          {currentSection === "categories" && (
            <div className="max-w-4xl">
              <div className="mb-7">
                <p className="mb-1 text-xs font-bold uppercase tracking-[.16em] text-accent-foreground/70">
                  Organización
                </p>
                <h2 className="font-serif text-4xl text-primary">
                  Categorías
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Crea y organiza las secciones de tu menú para que tus clientes encuentren rápido lo que buscan.
                </p>
              </div>

              {/* Agregar Categoría */}
              <div className="mb-6 rounded-2xl border border-border bg-card p-5 shadow-xs">
                <h3 className="text-sm font-bold text-primary mb-3">
                  Crear nueva categoría
                </h3>
                <form onSubmit={handleAddCategory} className="flex gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Ej. Tartas Dulces, Cafetería, Sandwiches..."
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="flex-1 rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                  <button
                    type="submit"
                    disabled={isCatProcessing || !newCatName.trim()}
                    className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
                  >
                    {isCatProcessing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    <span>Agregar</span>
                  </button>
                </form>
              </div>

              {/* Lista de Categorías */}
              <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
                <div className="border-b border-border bg-secondary/30 px-5 py-3.5">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Categorías registradas ({categories.length})
                  </p>
                </div>

                <div className="divide-y divide-border">
                  {categories.map((cat) => {
                    const count = products.filter(
                      (p) => p.category_id === cat.id
                    ).length;
                    const isEditing = editingCatId === cat.id;

                    return (
                      <div
                        key={cat.id}
                        className="flex items-center justify-between p-4 hover:bg-secondary/15 transition-colors gap-3"
                      >
                        <div className="flex-1 min-w-0">
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={editingCatName}
                                onChange={(e) =>
                                  setEditingCatName(e.target.value)
                                }
                                className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm font-semibold text-primary outline-none focus:ring-2 focus:ring-ring"
                                autoFocus
                              />
                              <button
                                onClick={() => handleUpdateCategory(cat.id)}
                                disabled={isCatProcessing}
                                className="rounded-lg bg-primary p-2 text-primary-foreground hover:opacity-90"
                                title="Guardar cambios"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingCatId(null);
                                  setEditingCatName("");
                                }}
                                className="rounded-lg p-2 text-muted-foreground hover:bg-secondary"
                                title="Cancelar"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-lg bg-accent/20 flex items-center justify-center text-accent-foreground font-bold">
                                <Tag className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="font-semibold text-sm text-primary">
                                  {cat.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {count} {count === 1 ? "producto" : "productos"} asignados
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        {!isEditing && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setEditingCatId(cat.id);
                                setEditingCatName(cat.name);
                              }}
                              aria-label={`Editar ${cat.name}`}
                              className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-primary transition-colors"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteCategory(cat.id, cat.name)
                              }
                              aria-label={`Eliminar ${cat.name}`}
                              className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {categories.length === 0 && (
                    <div className="p-8 text-center text-sm text-muted-foreground">
                      No hay categorías creadas aún. Creá la primera arriba.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ================= SECTION 3: CONFIGURACIÓN DE TIENDA ================= */}
          {currentSection === "settings" && (
            <div className="max-w-3xl">
              <div className="mb-7">
                <p className="mb-1 text-xs font-bold uppercase tracking-[.16em] text-accent-foreground/70">
                  Ajustes Generales
                </p>
                <h2 className="font-serif text-4xl text-primary">
                  Configuración de la tienda
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Modificá la información de contacto, WhatsApp para recibir pedidos, horarios y redes sociales.
                </p>
              </div>

              {settingsSavedSuccess && (
                <div className="mb-6 flex items-center gap-3 rounded-xl bg-accent/30 border border-accent p-4 text-sm font-semibold text-accent-foreground animate-in fade-in">
                  <Check className="h-5 w-5 shrink-0" />
                  <span>¡Los datos de la tienda se actualizaron exitosamente!</span>
                </div>
              )}

              <form onSubmit={handleSaveSettings} className="space-y-6">
                {/* 1. Datos Principales */}
                <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
                  <h3 className="font-serif text-lg text-primary flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-accent" />
                    Identidad del Negocio
                  </h3>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-primary">
                        Nombre de la tienda *
                      </label>
                      <input
                        required
                        value={settingsForm.name}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, name: e.target.value })
                        }
                        className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-primary">
                        Lema / Eslogan
                      </label>
                      <input
                        value={settingsForm.tagline}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, tagline: e.target.value })
                        }
                        placeholder="Ej. Panadería & Pastelería Artesanal"
                        className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Contacto & Pedidos */}
                <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
                  <h3 className="font-serif text-lg text-primary flex items-center gap-2">
                    <Phone className="h-4 w-4 text-accent" />
                    Contacto y Pedidos por WhatsApp
                  </h3>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-primary">
                      Número de WhatsApp (con código de país) *
                    </label>
                    <input
                      required
                      value={settingsForm.whatsapp_number}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          whatsapp_number: e.target.value,
                        })
                      }
                      placeholder="Ej. 5493412345678"
                      className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      A este número se enviarán automáticamente los pedidos de los clientes.
                    </p>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-primary">
                      Dirección del local
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        value={settingsForm.address_text}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            address_text: e.target.value,
                          })
                        }
                        placeholder="Ej. Av. Pellegrini 1234, Rosario"
                        className="w-full rounded-xl border border-input bg-background py-2.5 pl-10 pr-3.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Horarios */}
                <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
                  <h3 className="font-serif text-lg text-primary flex items-center gap-2">
                    <Clock className="h-4 w-4 text-accent" />
                    Horarios de Atención y Delivery
                  </h3>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-primary">
                        Turno Mañana (Delivery y Retiro)
                      </label>
                      <input
                        value={settingsForm.opening_hours_weekdays}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            opening_hours_weekdays: e.target.value,
                          })
                        }
                        placeholder="Ej. Jueves a Domingo: 08:00 a 10:00 hs (Delivery y Retiro)"
                        className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                      />
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        Envíos a domicilio disponibles únicamente en este turno.
                      </p>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-primary">
                        Turno Tarde (Solo Retiro en Local)
                      </label>
                      <input
                        value={settingsForm.opening_hours_weekends}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            opening_hours_weekends: e.target.value,
                          })
                        }
                        placeholder="Ej. Jueves a Domingo: 16:00 a 20:00 hs (Solo Retiro en local)"
                        className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                      />
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        Atención directa en el local.
                      </p>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="mb-1.5 block text-xs font-semibold text-primary">
                        Días Cerrados / Producción
                      </label>
                      <input
                        value={settingsForm.closed_days_text}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            closed_days_text: e.target.value,
                          })
                        }
                        placeholder="Ej. Lunes a Miércoles: Cerrado por producción"
                        className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Envíos y Moneda */}
                <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
                  <h3 className="font-serif text-lg text-primary flex items-center gap-2">
                    <Truck className="h-4 w-4 text-accent" />
                    Envíos y Moneda
                  </h3>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-primary">
                        Monto para Envío Gratis
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={settingsForm.free_shipping_threshold}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            free_shipping_threshold: Number(e.target.value),
                          })
                        }
                        placeholder="0 para desactivar"
                        className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-primary">
                        Símbolo de moneda
                      </label>
                      <input
                        value={settingsForm.currency_symbol}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            currency_symbol: e.target.value,
                          })
                        }
                        placeholder="$"
                        className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  </div>
                </div>

                {/* 5. Redes Sociales */}
                <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
                  <h3 className="font-serif text-lg text-primary">
                    Redes Sociales
                  </h3>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-primary">
                      Perfil de Instagram (URL completa)
                    </label>
                    <input
                      value={settingsForm.instagram_url}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          instagram_url: e.target.value,
                        })
                      }
                      placeholder="https://instagram.com/tu_cuenta"
                      className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isSavingSettings}
                    className="flex items-center gap-2 rounded-xl bg-primary px-7 py-3 text-sm font-bold text-primary-foreground shadow-md hover:opacity-90 disabled:opacity-50 transition-opacity"
                  >
                    {isSavingSettings && <Loader2 className="h-4 w-4 animate-spin" />}
                    <span>{isSavingSettings ? "Guardando..." : "Guardar cambios"}</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>

      {/* Modal de Crear / Editar Producto */}
      {modal !== undefined && (
        <ProductModal
          product={modal}
          categories={categories}
          onClose={() => setModal(undefined)}
          onSave={handleSaveProduct}
          isSaving={isSaving}
        />
      )}
    </div>
  );
}
