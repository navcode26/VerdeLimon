"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  X,
  Search,
  Check,
  ArrowRight,
  Clock,
  MapPin,
  Sparkles,
  Truck,
  Heart,
  MessageCircle,
  SlidersHorizontal,
  Settings,
  ChevronRight,
} from "lucide-react";
import type { Store, Category, Product } from "@/lib/types/database";
import {
  formatMoney,
  FALLBACK_STORE,
  FALLBACK_CATEGORIES,
  FALLBACK_PRODUCTS,
} from "@/lib/products-data";
import {
  getStoreBySlug,
  getCategoriesByStore,
  getActiveProductsByStore,
} from "@/lib/services/store-service";

type CartItem = {
  product: Product;
  quantity: number;
};

interface StorefrontProps {
  initialStore?: Store | null;
  initialCategories?: Category[];
  initialProducts?: Product[];
}

export function Storefront({
  initialStore,
  initialCategories,
  initialProducts,
}: StorefrontProps) {
  const [store, setStore] = useState<Store>(initialStore || FALLBACK_STORE);
  const [categories, setCategories] = useState<Category[]>(
    initialCategories && initialCategories.length > 0
      ? initialCategories
      : FALLBACK_CATEGORIES
  );
  const [products, setProducts] = useState<Product[]>(
    initialProducts && initialProducts.length > 0
      ? initialProducts
      : FALLBACK_PRODUCTS
  );
  const [isLoading, setIsLoading] = useState<boolean>(!initialStore);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<
    "featured" | "price-asc" | "price-desc" | "name"
  >("featured");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [showToast, setShowToast] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [cartBump, setCartBump] = useState(false);

  // Formulario de Checkout
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<"delivery" | "pickup">(
    "delivery"
  );
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<
    "transfer" | "cash" | "mp"
  >("transfer");
  const [orderNotes, setOrderNotes] = useState("");

  // Detectar scroll para elevación del Header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Cargar datos dinámicos desde Supabase si no fueron provistos en SSR
  useEffect(() => {
    async function loadData() {
      if (initialStore && initialProducts && initialProducts.length > 0) {
        setIsLoading(false);
        return;
      }

      try {
        const storeRes = await getStoreBySlug();
        if (storeRes.data) {
          setStore(storeRes.data);
          const [catRes, prodRes] = await Promise.all([
            getCategoriesByStore(storeRes.data.id),
            getActiveProductsByStore(storeRes.data.id),
          ]);

          if (catRes.data && catRes.data.length > 0) {
            setCategories(catRes.data);
          }
          if (prodRes.data && prodRes.data.length > 0) {
            setProducts(prodRes.data);
          }
        }
      } catch (e) {
        console.error("Error al cargar datos de la tienda:", e);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [initialStore, initialProducts]);

  // Cargar carrito desde localStorage si existe
  useEffect(() => {
    try {
      const storageKey = `store_cart_${store.slug || "default"}`;
      const savedCart = localStorage.getItem(storageKey);
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    } catch {
      // Ignorar error de storage
    }
  }, [store.slug]);

  // Guardar carrito al cambiar
  useEffect(() => {
    try {
      const storageKey = `store_cart_${store.slug || "default"}`;
      localStorage.setItem(storageKey, JSON.stringify(cart));
    } catch {
      // Ignorar error de storage
    }
  }, [cart, store.slug]);

  // Cálculos de totales dinámicos
  const totalItemsCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const subtotal = useMemo(
    () =>
      cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [cart]
  );

  // Animación de pop en el badge del carrito al modificar cantidad
  useEffect(() => {
    if (totalItemsCount > 0) {
      setCartBump(true);
      const timer = setTimeout(() => setCartBump(false), 380);
      return () => clearTimeout(timer);
    }
  }, [totalItemsCount]);

  // Manejo de Carrito
  const addToCart = (product: Product, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });

    triggerToast(`Agregaste "${product.name}" al carrito`);
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null)
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const triggerToast = (msg: string) => {
    setShowToast(msg);
    setTimeout(() => {
      setShowToast((current) => (current === msg ? null : current));
    }, 2800);
  };

  const getItemQuantity = (productId: string) => {
    const item = cart.find((i) => i.product.id === productId);
    return item ? item.quantity : 0;
  };

  // Mapeo de categoría por ID
  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((cat) => map.set(cat.id, cat.name));
    return map;
  }, [categories]);

  // Filtrado y Ordenamiento dinámico
  const filteredProducts = useMemo(() => {
    let list = products.filter((p) => p.active);

    if (selectedCategoryId !== "all") {
      list = list.filter((p) => p.category_id === selectedCategoryId);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      list = list.filter((p) => {
        const categoryName = p.category_id
          ? categoryMap.get(p.category_id)?.toLowerCase() || ""
          : "";
        return (
          p.name.toLowerCase().includes(query) ||
          categoryName.includes(query) ||
          p.description?.toLowerCase().includes(query)
        );
      });
    }

    switch (sortBy) {
      case "price-asc":
        return [...list].sort((a, b) => a.price - b.price);
      case "price-desc":
        return [...list].sort((a, b) => b.price - a.price);
      case "name":
        return [...list].sort((a, b) => a.name.localeCompare(b.name));
      case "featured":
      default:
        return [...list].sort((a, b) => {
          if (a.is_featured === b.is_featured) {
            return (a.display_order || 0) - (b.display_order || 0);
          }
          return a.is_featured ? -1 : 1;
        });
    }
  }, [products, selectedCategoryId, searchQuery, sortBy, categoryMap]);

  // Producto destacado para el banner
  const heroFeaturedProduct = useMemo(() => {
    return products.find((p) => p.is_featured && p.active) || products[0];
  }, [products]);

  // Generar link de pedido por WhatsApp 100% dinámico
  const handleWhatsAppCheckout = () => {
    if (cart.length === 0) return;

    if (!customerName.trim()) {
      alert("Por favor ingresá tu nombre para preparar el pedido.");
      return;
    }

    if (deliveryMethod === "delivery" && !deliveryAddress.trim()) {
      alert("Por favor ingresá tu dirección para el envío.");
      return;
    }

    const itemsText = cart
      .map(
        (item, index) =>
          `${index + 1}. *${item.product.name}* x ${item.quantity} = ${formatMoney(
            item.product.price * item.quantity,
            store.currency_symbol
          )}`
      )
      .join("\n");

    const paymentLabel =
      paymentMethod === "transfer"
        ? "Transferencia bancaria"
        : paymentMethod === "cash"
          ? "Efectivo al recibir"
          : "Mercado Pago";

    const deliveryLabel =
      deliveryMethod === "delivery"
        ? `Envío a domicilio (Turno Mañana 08 a 10hs) - ${deliveryAddress}`
        : "Retiro por el local";

    const message =
      `🧁 *¡Hola ${store.name}! Quiero realizar este pedido:*\n\n` +
      `👤 *Cliente:* ${customerName.trim()}\n` +
      `📱 *Teléfono:* ${customerPhone.trim() || "No especificado"}\n` +
      `📦 *Entrega:* ${deliveryLabel}\n` +
      `💳 *Pago:* ${paymentLabel}\n` +
      (orderNotes.trim() ? `📝 *Notas:* ${orderNotes.trim()}\n` : "") +
      `\n🛒 *Detalle de productos:*\n${itemsText}\n\n` +
      `💰 *TOTAL ESTIMADO: ${formatMoney(subtotal, store.currency_symbol)}*\n\n` +
      `_¡Aguardamos su confirmación para coordinar el horario! Gracias._`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappCleanNumber = store.whatsapp_number.replace(/\D/g, "");
    const whatsappUrl = `https://wa.me/${whatsappCleanNumber}?text=${encodedMessage}`;

    window.open(whatsappUrl, "_blank");
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-accent/40 selection:text-foreground">
      {/* Toast Notification Flotante Minimalista */}
      {showToast && (
        <div className="fixed bottom-6 right-4 sm:right-6 z-50 overflow-hidden bg-primary text-primary-foreground px-4 py-3 rounded-2xl shadow-2xl border border-primary-foreground/15 animate-toast-in max-w-sm">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xs font-bold shrink-0 animate-in zoom-in duration-200">
              <Check className="h-3.5 w-3.5 stroke-[3]" />
            </div>
            <p className="text-sm font-medium pr-2">{showToast}</p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-accent/30">
            <div className="h-full bg-accent animate-toast-progress" />
          </div>
        </div>
      )}

      {/* Top Announcement Bar Dinámico */}
      <div className="bg-primary px-4 py-2 text-center text-xs font-medium text-primary-foreground/90 border-b border-primary-foreground/10 flex items-center justify-center gap-2 transition-colors">
        <Sparkles className="h-3.5 w-3.5 text-accent animate-pulse" />
        <span>Abierto Jueves a Domingo: Mañanas 08 a 10 hs (con Delivery) y Tardes 16 a 20 hs (Retiro en local).</span>
        {store.free_shipping_threshold > 0 && (
          <>
            <span className="hidden md:inline text-primary-foreground/50">|</span>
            <span className="hidden md:inline text-accent font-semibold">
              Envío gratis superando los {formatMoney(store.free_shipping_threshold, store.currency_symbol)}
            </span>
          </>
        )}
      </div>

      {/* Main Header / Navigation con elevación dinámica */}
      <header
        className={`sticky top-0 z-40 bg-card/90 backdrop-blur-md border-b transition-all duration-300 ${
          isScrolled
            ? "border-border shadow-md py-0 bg-card/95"
            : "border-border/60 shadow-none bg-card/85"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Brand Logo & Name Dinámico */}
          <Link href="/" className="flex items-center gap-3 group press-feedback">
            {store.logo_url ? (
              <img
                src={store.logo_url}
                alt={store.name}
                className="h-11 w-11 rounded-full object-cover shadow-sm ring-2 ring-primary/20 group-hover:scale-105 group-hover:ring-primary/40 transition-all duration-300"
              />
            ) : (
              <div className="h-11 w-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-serif font-bold text-lg shadow-sm group-hover:scale-105 transition-transform duration-300">
                {store.name.substring(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-2xl font-bold tracking-tight text-primary transition-colors group-hover:text-primary/90">
                  {store.name}
                </span>
                {store.tagline && (
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-accent/30 text-accent-foreground text-[10px] font-bold uppercase tracking-wider">
                    {store.tagline}
                  </span>
                )}
              </div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">
                {store.tagline || "Catálogo Oficial"}
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links con microinteracciones */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a
              href="#catalogo"
              className="text-primary hover:text-primary/70 transition-colors relative py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-primary after:rounded-full"
            >
              Catálogo
            </a>
            <a
              href="#destacados"
              className="text-muted-foreground hover:text-primary transition-colors py-1 hover:translate-y-[-1px]"
            >
              Especialidades
            </a>
            <a
              href="#como-pedir"
              className="text-muted-foreground hover:text-primary transition-colors py-1 hover:translate-y-[-1px]"
            >
              Cómo comprar
            </a>
            <a
              href="#contacto"
              className="text-muted-foreground hover:text-primary transition-colors py-1 hover:translate-y-[-1px]"
            >
              Contacto
            </a>
          </nav>

          {/* Actions: Cart Button con Badge Bump */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-2.5 bg-primary text-primary-foreground px-4 py-2.5 rounded-2xl font-semibold text-sm shadow-md hover:bg-primary/90 hover:shadow-lg transition-all duration-200 press-feedback"
              aria-label="Abrir carrito"
            >
              <ShoppingBag className="h-4 w-4 text-accent" />
              <span className="hidden xs:inline">Mi Pedido</span>
              {totalItemsCount > 0 ? (
                <span
                  className={`flex items-center justify-center px-2 py-0.5 rounded-full bg-accent text-accent-foreground text-xs font-extrabold shadow-sm transition-transform ${
                    cartBump ? "animate-badge-bump" : ""
                  }`}
                >
                  {totalItemsCount}
                </span>
              ) : (
                <span className="text-xs text-primary-foreground/70 font-normal">$0</span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Banner Dinámico con animaciones de entrada fluidas */}
      <section className="relative overflow-hidden bg-gradient-to-b from-secondary/60 via-secondary/30 to-background py-12 md:py-16 border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-card border border-border shadow-xs text-xs font-semibold text-primary animate-in fade-in slide-in-from-bottom-2 duration-300">
                <Heart className="h-3.5 w-3.5 text-accent-foreground fill-accent animate-pulse" />
                <span>Masa madre, manteca pura y amor por la cocina</span>
              </div>
              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-primary leading-[1.1] animate-in fade-in slide-in-from-bottom-3 duration-400 stagger-1">
                {store.hero_title || "Pastelería fresca horneada para alegrar tu día."}
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-500 stagger-2">
                {store.hero_subtitle ||
                  "Elegí tus favoritos de nuestro menú artesanal, armá tu pedido y recibilo fresco en tu casa o retiralo en el local."}
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2 animate-in fade-in slide-in-from-bottom-4 duration-500 stagger-3">
                <a
                  href="#catalogo"
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3.5 rounded-2xl font-bold text-sm shadow-lg shadow-primary/20 hover:opacity-95 hover:translate-y-[-2px] active:translate-y-[0px] transition-all press-feedback"
                >
                  <span>Explorar Menú</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </a>
                <a
                  href="#como-pedir"
                  className="inline-flex items-center gap-2 bg-card border border-border text-foreground px-5 py-3.5 rounded-2xl font-semibold text-sm hover:bg-secondary hover:border-border/80 transition-all press-feedback"
                >
                  <MessageCircle className="h-4 w-4 text-primary" />
                  <span>Pedidos por WhatsApp</span>
                </a>
              </div>

              {/* Feature Highlights */}
              <div className="grid grid-cols-3 gap-3 pt-6 border-t border-border/60 max-w-lg animate-in fade-in duration-500 stagger-4">
                <div className="flex items-center gap-2.5 group">
                  <div className="h-8 w-8 rounded-xl bg-accent/30 text-accent-foreground flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-200">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-primary">100% Artesanal</p>
                    <p className="text-muted-foreground text-[11px]">Sin conservantes</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 group">
                  <div className="h-8 w-8 rounded-xl bg-accent/30 text-accent-foreground flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-200">
                    <Truck className="h-4 w-4" />
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-primary">Delivery Mañanas</p>
                    <p className="text-muted-foreground text-[11px]">08:00 a 10:00 hs</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 group">
                  <div className="h-8 w-8 rounded-xl bg-accent/30 text-accent-foreground flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-200">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-primary">Jueves a Domingo</p>
                    <p className="text-muted-foreground text-[11px]">Mañana y tarde</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Hero Image Showcase con animación de elevación y shimmer */}
            <div id="destacados" className="lg:col-span-5 relative animate-in fade-in duration-500">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-card bg-card aspect-[4/3] sm:aspect-[16/11] group hover:shadow-primary/10 transition-all duration-500">
                <img
                  src={
                    store.hero_image_url ||
                    "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80"
                  }
                  alt={store.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
                {heroFeaturedProduct && (
                  <div
                    onClick={() => setQuickViewProduct(heroFeaturedProduct)}
                    className="cursor-pointer absolute bottom-4 left-4 right-4 p-4 rounded-2xl bg-card/95 backdrop-blur-md border border-border flex items-center justify-between shadow-lg transition-transform duration-300 hover:scale-[1.01]"
                  >
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-accent-foreground bg-accent/30 px-2 py-0.5 rounded-full">
                        {heroFeaturedProduct.badge || "Recomendado de hoy"}
                      </span>
                      <p className="font-serif text-lg font-bold text-primary mt-1">
                        {heroFeaturedProduct.name}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {heroFeaturedProduct.description || "Elaboración artesanal fresca"}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(heroFeaturedProduct);
                      }}
                      className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:scale-105 active:scale-90 transition-transform shadow-md shrink-0 ml-2 press-feedback"
                      title="Agregar al pedido"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Storefront & Catalog Section */}
      <main id="catalogo" className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Controls: Search, Categories & Sorting */}
        <div className="space-y-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-accent-foreground/80">
                Nuestro Menú
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl text-primary font-normal">
                Catálogo de Productos
              </h2>
            </div>

            {/* Search Input & Sort Selector */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative min-w-[240px]">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar productos..."
                  className="w-full rounded-xl border border-input bg-card pl-10 pr-9 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 shadow-xs"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground active:scale-90 transition-all p-0.5 rounded-full hover:bg-secondary"
                    aria-label="Limpiar búsqueda"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-muted-foreground hidden sm:inline" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="rounded-xl border border-input bg-card px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring text-foreground font-medium transition-shadow cursor-pointer"
                >
                  <option value="featured">Destacados</option>
                  <option value="price-asc">Menor precio</option>
                  <option value="price-desc">Mayor precio</option>
                  <option value="name">Alfabético (A-Z)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Category Tabs Dinámicos con touch feedback y momentum scroll */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none snap-x touch-pan-x">
            <button
              onClick={() => setSelectedCategoryId("all")}
              className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 flex items-center gap-2 press-feedback snap-start ${
                selectedCategoryId === "all"
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.02]"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <span>Todos</span>
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full transition-colors ${
                  selectedCategoryId === "all"
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {products.filter((p) => p.active).length}
              </span>
            </button>

            {categories.map((category) => {
              const isSelected = selectedCategoryId === category.id;
              const count = products.filter(
                (p) => p.active && p.category_id === category.id
              ).length;

              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategoryId(category.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 flex items-center gap-2 press-feedback snap-start ${
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.02]"
                      : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  <span>{category.name}</span>
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full transition-colors ${
                      isSelected
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Loading Skeleton Shimmer Grid */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in duration-300">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div
                key={n}
                className="rounded-2xl border border-border/70 bg-card overflow-hidden shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-[4/3] bg-secondary animate-shimmer overflow-hidden" />
                  <div className="p-4 space-y-2.5">
                    <div className="h-5 bg-secondary rounded-lg w-3/4 animate-shimmer" />
                    <div className="h-3 bg-secondary/80 rounded-md w-full animate-shimmer" />
                    <div className="h-3 bg-secondary/80 rounded-md w-1/2 animate-shimmer" />
                  </div>
                </div>
                <div className="p-4 pt-0 mt-2 border-t border-border/40 flex items-center justify-between gap-3">
                  <div className="h-6 w-20 bg-secondary rounded-md animate-shimmer" />
                  <div className="h-9 w-24 bg-secondary rounded-xl animate-shimmer" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Product Cards Grid Dinámico */}
        {!isLoading && filteredProducts.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-3xl border border-dashed border-border bg-card animate-in fade-in duration-300">
            <div className="h-14 w-14 rounded-2xl bg-secondary mx-auto flex items-center justify-center text-muted-foreground mb-4">
              <Search className="h-7 w-7" />
            </div>
            <h3 className="font-serif text-xl text-primary font-bold">No encontramos productos</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
              Probá cambiando los términos de búsqueda o seleccionando otra categoría.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategoryId("all");
              }}
              className="mt-4 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity press-feedback"
            >
              Ver todos los productos
            </button>
          </div>
        ) : (
          !isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => {
                const qtyInCart = getItemQuantity(product.id);
                const categoryName = product.category_id
                  ? categoryMap.get(product.category_id) || "General"
                  : "General";

                return (
                  <div
                    key={product.id}
                    onClick={() => setQuickViewProduct(product)}
                    className="group cursor-pointer rounded-2xl border border-border bg-card overflow-hidden shadow-xs hover:shadow-xl hover:border-primary/40 transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between press-feedback sm:hover:press-feedback-none"
                  >
                    <div>
                      {/* Product Image & Badges con Zoom suave */}
                      <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
                        <img
                          src={
                            product.image_url ||
                            "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80"
                          }
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                          loading="lazy"
                        />

                        {/* Badge / Category */}
                        <div className="absolute top-3 left-3 flex flex-col gap-1 items-start pointer-events-none">
                          {product.badge && (
                            <span className="px-2.5 py-0.5 rounded-full bg-accent text-accent-foreground text-[10px] font-bold uppercase tracking-wider shadow-sm animate-in fade-in duration-200">
                              {product.badge}
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded-full bg-card/90 backdrop-blur-xs text-foreground text-[10px] font-semibold shadow-xs">
                            {categoryName}
                          </span>
                        </div>

                        {/* Quick View trigger button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setQuickViewProduct(product);
                          }}
                          className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-card/95 backdrop-blur-md text-foreground opacity-0 group-hover:opacity-100 hover:bg-card transition-all duration-200 shadow-md text-xs font-semibold translate-y-2 group-hover:translate-y-0 press-feedback"
                          title="Ver detalles"
                        >
                          Ver detalle
                        </button>
                      </div>

                      {/* Product Info */}
                      <div className="p-4 space-y-1.5">
                        <div className="flex items-baseline justify-between gap-2">
                          <h3 className="font-serif text-lg font-bold text-primary group-hover:text-primary/85 transition-colors line-clamp-1">
                            {product.name}
                          </h3>
                        </div>

                        <p className="text-xs text-muted-foreground line-clamp-2 min-h-[32px]">
                          {product.description || "Elaboración artesanal fresca con los mejores ingredientes."}
                        </p>

                        {product.unit && (
                          <p className="text-[11px] font-medium text-accent-foreground/90 flex items-center gap-1">
                            <span>Presentación:</span>
                            <span className="font-semibold text-foreground">{product.unit}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Price & Add to Cart Controls con transición suave */}
                    <div className="p-4 pt-0 mt-2 border-t border-border/40 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                          Precio
                        </p>
                        <p className="text-xl font-bold text-primary">
                          {formatMoney(product.price, store.currency_symbol)}
                        </p>
                      </div>

                      {qtyInCart > 0 ? (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center rounded-xl bg-secondary border border-border/80 p-1 gap-1.5 shadow-xs animate-in zoom-in-95 duration-150"
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateQuantity(product.id, -1);
                            }}
                            className="h-7 w-7 rounded-lg bg-card text-foreground flex items-center justify-center hover:bg-muted active:scale-90 font-bold text-xs transition-transform shadow-xs"
                            aria-label="Restar una unidad"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="text-xs font-bold w-6 text-center text-primary tabular-nums">
                            {qtyInCart}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateQuantity(product.id, 1);
                            }}
                            className="h-7 w-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 active:scale-90 font-bold text-xs transition-transform shadow-xs"
                            aria-label="Sumar una unidad"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(product);
                          }}
                          className="flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-xs font-bold shadow-xs hover:bg-primary/90 hover:scale-[1.02] active:scale-95 transition-all press-feedback"
                        >
                          <Plus className="h-3.5 w-3.5 text-accent" />
                          <span>Agregar</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </main>

      {/* How to Order Info Section */}
      <section id="como-pedir" className="bg-secondary/40 border-y border-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <p className="text-xs font-bold uppercase tracking-widest text-accent-foreground/80">
              Simple y Rápido
            </p>
            <h2 className="font-serif text-3xl text-primary font-normal mt-1">
              ¿Cómo realizo mi pedido?
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              Seguí estos sencillos pasos para disfrutar de nuestros productos frescos en tu mesa.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card p-6 rounded-2xl border border-border shadow-xs space-y-3 transition-transform duration-300 hover:-translate-y-1">
              <div className="h-10 w-10 rounded-xl bg-accent text-accent-foreground font-serif font-bold text-lg flex items-center justify-center">
                1
              </div>
              <h3 className="font-serif text-lg font-bold text-primary">Elegí tus productos</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Navegá por las categorías, seleccioná las cantidades deseadas y agregalas a tu carrito de compras.
              </p>
            </div>

            <div className="bg-card p-6 rounded-2xl border border-border shadow-xs space-y-3 transition-transform duration-300 hover:-translate-y-1">
              <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground font-serif font-bold text-lg flex items-center justify-center">
                2
              </div>
              <h3 className="font-serif text-lg font-bold text-primary">Confirmá por WhatsApp</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Al finalizar, tu pedido se envía automáticamente con todos los detalles al WhatsApp oficial para agendar la preparación.
              </p>
            </div>

            <div className="bg-card p-6 rounded-2xl border border-border shadow-xs space-y-3 transition-transform duration-300 hover:-translate-y-1">
              <div className="h-10 w-10 rounded-xl bg-accent text-accent-foreground font-serif font-bold text-lg flex items-center justify-center">
                3
              </div>
              <h3 className="font-serif text-lg font-bold text-primary">Retirá o Recibí</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Coordinamos el horario exacto de entrega o te esperamos en el local con todo recién elaborado.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick View Modal & Mobile Bottom Sheet */}
      {quickViewProduct && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/50 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          onClick={() => setQuickViewProduct(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl bg-card rounded-t-3xl sm:rounded-3xl shadow-2xl border border-border overflow-hidden max-h-[88vh] sm:max-h-none overflow-y-auto animate-sheet-up sm:animate-in sm:zoom-in-95 sm:duration-200"
          >
            {/* Mobile handle indicator */}
            <div className="sm:hidden pt-3 pb-1 flex justify-center">
              <div className="w-12 h-1.5 rounded-full bg-muted-foreground/30" />
            </div>

            <div className="relative aspect-[16/10] sm:aspect-[16/9] bg-secondary">
              <img
                src={
                  quickViewProduct.image_url ||
                  "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80"
                }
                alt={quickViewProduct.name}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setQuickViewProduct(null)}
                className="absolute top-4 right-4 h-9 w-9 rounded-full bg-card/85 backdrop-blur-md text-foreground flex items-center justify-center hover:bg-card active:scale-90 transition-all shadow-md"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
              {quickViewProduct.badge && (
                <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-bold uppercase tracking-wider shadow-sm">
                  {quickViewProduct.badge}
                </span>
              )}
            </div>

            <div className="p-6 space-y-4">
              <div>
                <span className="text-xs font-semibold text-accent-foreground bg-accent/30 px-2.5 py-0.5 rounded-full">
                  {quickViewProduct.category_id
                    ? categoryMap.get(quickViewProduct.category_id) || "General"
                    : "General"}
                </span>
                <h3 className="font-serif text-2xl font-bold text-primary mt-2">
                  {quickViewProduct.name}
                </h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  {quickViewProduct.description}
                </p>
              </div>

              {quickViewProduct.unit && (
                <div className="p-3 rounded-xl bg-secondary/50 border border-border flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Porción / Presentación:</span>
                  <span className="font-bold text-primary">{quickViewProduct.unit}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-border gap-4">
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase font-semibold">Precio unitario</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatMoney(quickViewProduct.price, store.currency_symbol)}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      addToCart(quickViewProduct);
                      setQuickViewProduct(null);
                    }}
                    className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-2xl font-bold text-sm shadow-md hover:bg-primary/90 active:scale-95 transition-all press-feedback"
                  >
                    <Plus className="h-4 w-4 text-accent" />
                    <span>Agregar al Pedido</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shopping Cart Slide-Over Drawer con animaciones fluidas */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop con Fade suave */}
          <div
            className="fixed inset-0 bg-foreground/45 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsCartOpen(false)}
          />

          <div className="relative z-10 w-full sm:max-w-md h-full bg-card sm:border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            {/* Cart Drawer Header */}
            <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between bg-secondary/30">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-xs">
                  <ShoppingBag className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h2 className="font-serif text-lg font-bold text-primary">Tu Pedido</h2>
                  <p className="text-xs text-muted-foreground">
                    {totalItemsCount} {totalItemsCount === 1 ? "producto" : "productos"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary active:scale-90 transition-all"
                aria-label="Cerrar carrito"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

              {/* Free shipping progress con animación fluida */}
              {subtotal > 0 && store.free_shipping_threshold > 0 && (
                <div className="px-5 py-3 bg-accent/20 border-b border-accent/30 text-xs">
                  {subtotal >= store.free_shipping_threshold ? (
                    <div className="flex items-center gap-2 font-bold text-accent-foreground animate-in zoom-in-95 duration-200">
                      <Check className="h-4 w-4" />
                      <span>¡Felicitaciones! Tenés envío gratis en este pedido.</span>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[11px] text-accent-foreground font-semibold">
                        <span>
                          Sumá {formatMoney(store.free_shipping_threshold - subtotal, store.currency_symbol)} más para <strong>Envío Gratis</strong>
                        </span>
                      </div>
                      <div className="h-2 w-full bg-card rounded-full overflow-hidden border border-accent/40">
                        <div
                          className="h-full bg-primary transition-all duration-500 ease-out"
                          style={{
                            width: `${Math.min(100, (subtotal / store.free_shipping_threshold) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Cart Items List */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 overscroll-contain">
                {cart.length === 0 ? (
                  <div className="text-center py-16 space-y-4 animate-in fade-in duration-200">
                    <div className="h-16 w-16 rounded-full bg-secondary mx-auto flex items-center justify-center text-muted-foreground">
                      <ShoppingCart className="h-8 w-8 stroke-1" />
                    </div>
                    <div>
                      <h3 className="font-serif text-xl font-bold text-primary">El carrito está vacío</h3>
                      <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                        Agregá deliciosos productos artesanales para comenzar.
                      </p>
                    </div>
                    <button
                      onClick={() => setIsCartOpen(false)}
                      className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90 active:scale-95 transition-all press-feedback"
                    >
                      Explorar el catálogo
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      {cart.map((item) => (
                        <div
                          key={item.product.id}
                          className="flex items-center gap-3 p-3 rounded-2xl bg-secondary/40 border border-border transition-all duration-200 hover:border-primary/30"
                        >
                          <img
                            src={
                              item.product.image_url ||
                              "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80"
                            }
                            alt={item.product.name}
                            className="h-14 w-14 rounded-xl object-cover shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-xs text-primary truncate">
                              {item.product.name}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {formatMoney(item.product.price, store.currency_symbol)} c/u
                            </p>
                            <p className="text-xs font-bold text-primary mt-0.5">
                              Subtotal: {formatMoney(item.product.price * item.quantity, store.currency_symbol)}
                            </p>
                          </div>

                          {/* Stepper */}
                          <div className="flex items-center rounded-lg bg-card border border-border p-0.5 shadow-xs">
                            <button
                              onClick={() => updateQuantity(item.product.id, -1)}
                              className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary active:scale-90 text-xs transition-transform"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="text-xs font-bold w-5 text-center text-foreground tabular-nums">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.product.id, 1)}
                              className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary active:scale-90 text-xs transition-transform"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="p-1.5 text-muted-foreground hover:text-destructive active:scale-90 transition-all"
                            aria-label="Eliminar producto"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Customer Information & Checkout Form */}
                    <div className="pt-4 border-t border-border space-y-3">
                      <p className="text-xs font-bold uppercase tracking-wider text-primary">
                        Datos para coordinar el pedido
                      </p>

                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1">
                          Tu Nombre y Apellido *
                        </label>
                        <input
                          type="text"
                          required
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="Ej. Martín Gómez"
                          className="w-full rounded-xl border border-input bg-card px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-ring transition-shadow"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1">
                          WhatsApp / Teléfono
                        </label>
                        <input
                          type="tel"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          placeholder="Ej. 11 2345-6789"
                          className="w-full rounded-xl border border-input bg-card px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-ring transition-shadow"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setDeliveryMethod("delivery")}
                          className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all press-feedback ${
                            deliveryMethod === "delivery"
                              ? "bg-primary text-primary-foreground border-primary shadow-xs"
                              : "bg-card border-border text-muted-foreground hover:bg-secondary"
                          }`}
                        >
                          <Truck className="h-3.5 w-3.5" />
                          <span>Envío a domicilio</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeliveryMethod("pickup")}
                          className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all press-feedback ${
                            deliveryMethod === "pickup"
                              ? "bg-primary text-primary-foreground border-primary shadow-xs"
                              : "bg-card border-border text-muted-foreground hover:bg-secondary"
                          }`}
                        >
                          <MapPin className="h-3.5 w-3.5" />
                          <span>Retiro en local</span>
                        </button>
                      </div>

                      {deliveryMethod === "delivery" && (
                        <div className="animate-in fade-in duration-200 space-y-2">
                          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-accent/25 border border-accent/40 text-[11px] text-accent-foreground font-medium">
                            <Clock className="h-3.5 w-3.5 shrink-0 text-accent-foreground" />
                            <span>Delivery disponible únicamente en el <strong>turno mañana (08:00 a 10:00 hs)</strong>.</span>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-muted-foreground mb-1">
                              Dirección de Entrega *
                            </label>
                            <input
                              type="text"
                              value={deliveryAddress}
                              onChange={(e) => setDeliveryAddress(e.target.value)}
                              placeholder="Calle, número, piso/depto, barrio"
                              className="w-full rounded-xl border border-input bg-card px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-ring transition-shadow"
                            />
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1">
                          Notas especiales o aclaraciones
                        </label>
                        <textarea
                          rows={2}
                          value={orderNotes}
                          onChange={(e) => setOrderNotes(e.target.value)}
                          placeholder="Ej. Alérgicos a nueces, dedicatoria de cumpleaños..."
                          className="w-full rounded-xl border border-input bg-card px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-ring transition-shadow resize-none"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Cart Drawer Footer */}
              {cart.length > 0 && (
                <div className="p-4 sm:p-5 border-t border-border bg-card space-y-3.5 shadow-lg">
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal</span>
                      <span className="font-semibold text-foreground">
                        {formatMoney(subtotal, store.currency_symbol)}
                      </span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Entrega</span>
                      <span className="font-semibold text-foreground">
                        {deliveryMethod === "pickup"
                          ? "Gratis (Retiro en local)"
                          : store.free_shipping_threshold > 0 && subtotal >= store.free_shipping_threshold
                            ? "Gratis"
                            : "A coordinar"}
                      </span>
                    </div>
                    <div className="flex justify-between text-base font-bold text-primary pt-2 border-t border-border">
                      <span>Total estimado</span>
                      <span>{formatMoney(subtotal, store.currency_symbol)}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleWhatsAppCheckout}
                    className="w-full py-3.5 px-4 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#25D366]/25 transition-all hover:scale-[1.01] active:scale-98 animate-pulse-subtle press-feedback"
                  >
                    <MessageCircle className="h-5 w-5 fill-white" />
                    <span>Confirmar Pedido por WhatsApp</span>
                  </button>

                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                    <button
                      onClick={clearCart}
                      className="hover:text-destructive underline active:scale-95 transition-transform"
                    >
                      Vaciar carrito
                    </button>
                    <span>Sin pagos por adelantado online</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      {/* Mobile Floating Action Cart Bar (Acceso Rápido con una mano) */}
      {!isCartOpen && totalItemsCount > 0 && (
        <div className="fixed bottom-4 inset-x-4 z-40 md:hidden animate-toast-in">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-primary text-primary-foreground p-3.5 rounded-2xl shadow-2xl border border-primary-foreground/15 flex items-center justify-between press-feedback"
          >
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <ShoppingBag className="h-5 w-5 text-accent" />
                <span className="absolute -top-2 -right-2 h-5 min-w-5 px-1 rounded-full bg-accent text-accent-foreground text-[10px] font-extrabold flex items-center justify-center shadow-xs">
                  {totalItemsCount}
                </span>
              </div>
              <span className="font-bold text-sm">Ver Mi Pedido</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-base">
                {formatMoney(subtotal, store.currency_symbol)}
              </span>
              <ArrowRight className="h-4 w-4 text-accent" />
            </div>
          </button>
        </div>
      )}

      {/* Footer Dinámico */}
      <footer id="contacto" className="bg-primary text-primary-foreground mt-auto border-t border-primary-foreground/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand & Description */}
            <div className="space-y-3 md:col-span-2">
              <div className="flex items-center gap-3">
                {store.logo_url ? (
                  <img
                    src={store.logo_url}
                    alt={store.name}
                    className="h-10 w-10 rounded-full object-cover shadow-sm"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-bold text-sm">
                    {store.name.substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-serif text-xl font-bold">{store.name}</p>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-primary-foreground/60">
                    {store.tagline || "Bakery Artesanal"}
                  </p>
                </div>
              </div>
              <p className="text-xs text-primary-foreground/80 max-w-sm leading-relaxed">
                {store.description ||
                  "Elaboramos pastelería y panadería honesta, utilizando recetas clásicas combinadas con técnicas modernas y materia prima de máxima calidad."}
              </p>
              {store.address_text && (
                <p className="text-xs text-primary-foreground/70 flex items-center gap-1.5 pt-1">
                  <MapPin className="h-3.5 w-3.5 text-accent" />
                  <span>{store.address_text}</span>
                </p>
              )}
            </div>

            {/* Hours & Info */}
            <div className="space-y-2 text-xs">
              <p className="font-bold text-accent uppercase tracking-wider text-[11px]">
                Horarios de Atención
              </p>
              {store.opening_hours_weekdays && (
                <p className="text-primary-foreground/80">{store.opening_hours_weekdays}</p>
              )}
              {store.opening_hours_weekends && (
                <p className="text-primary-foreground/80">{store.opening_hours_weekends}</p>
              )}
              {store.closed_days_text && (
                <p className="text-primary-foreground/60 italic">{store.closed_days_text}</p>
              )}
            </div>

            {/* Quick Links & Admin */}
            <div className="space-y-2 text-xs">
              <p className="font-bold text-accent uppercase tracking-wider text-[11px]">
                Acceso & Enlaces
              </p>
              <ul className="space-y-1.5 text-primary-foreground/80">
                <li>
                  <a href="#catalogo" className="hover:underline">
                    Catálogo Online
                  </a>
                </li>
                {store.instagram_url && (
                  <li>
                    <a
                      href={store.instagram_url}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:underline"
                    >
                      Instagram Oficial
                    </a>
                  </li>
                )}
              </ul>
            </div>
          </div>

          <div className="pt-8 mt-8 border-t border-primary-foreground/10 text-center text-xs text-primary-foreground/60 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p>© {new Date().getFullYear()} {store.name}. Todos los derechos reservados.</p>
            <p className="text-[11px]">Hecho con pasión por el buen pan y los dulces.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

