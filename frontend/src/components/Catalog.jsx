import { useEffect, useMemo, useRef, useState } from 'react';
import { fetchProductWithStock, fetchProducts, searchProducts } from '../api';
import { totalStockOf } from '../utils/format';
import { useToast } from '../hooks/useToast';
import { useCart } from '../hooks/useCart';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useDeliveryPreference } from '../hooks/useDeliveryPreference';
import { useMeta } from '../hooks/useMeta';
import { EMPTY_FILTERS, hasActiveFilters } from '../utils/filters';
import Header from './Header';
import Hero from './Hero';
import QuickToolsHub from './QuickToolsHub';
import TrustBadges from './TrustBadges';
import CategoryGrid from './CategoryGrid';
import Sidebar from './Sidebar';
import PaintSimulator from './PaintSimulator';
import ProductGrid from './ProductGrid';
import Footer from './Footer';
import WhatsappButton from './WhatsappButton';
import CartDrawer from './CartDrawer';
import CheckoutModal from './CheckoutModal';
import SuccessModal from './SuccessModal';
import PaintCalculatorModal from './PaintCalculatorModal';
import B2BQuoteModal from './B2BQuoteModal';

const PAGE_SIZE = 48;

export default function Catalog() {
  const showToast = useToast();
  const cart = useCart(showToast);
  const { preference: deliveryPreference, setPickup, setDelivery } = useDeliveryPreference();

  useMeta({
    title: 'Ferretería Garachena - Catálogo Profesional de Pinturas y Herramientas',
    description:
      'Ferretería Garachena: pinturas con tintometría digital, herramientas y despacho express en Santiago. Retiro en tienda en Providencia y Vitacura.',
    url: typeof window !== 'undefined' ? window.location.origin : undefined,
  });

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFiltered, setIsFiltered] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchApproximate, setSearchApproximate] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const debouncedQuery = useDebouncedValue(searchQuery, 250);

  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [successOrder, setSuccessOrder] = useState(null);
  const [homeCalculatorOpen, setHomeCalculatorOpen] = useState(false);
  const [homeQuoteOpen, setHomeQuoteOpen] = useState(false);

  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const catalogRef = useRef(null);

  function scrollToCatalog() {
    catalogRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function handleCategoryShortcut(categoryValues) {
    setFilters({ ...EMPTY_FILTERS, categories: categoryValues });
    setSearchQuery('');
    requestAnimationFrame(scrollToCatalog);
  }

  // Facetas dinámicas: categorías/marcas con conteos y rango de precios,
  // derivadas del catálogo real (no listas hardcodeadas).
  const facets = useMemo(() => {
    const countBy = (key) => {
      const counts = new Map();
      for (const product of products) {
        const value = product[key];
        if (!value) continue;
        counts.set(value, (counts.get(value) || 0) + 1);
      }
      return [...counts.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name, 'es'));
    };

    const prices = products.map((p) => p.price);
    return {
      categories: countBy('category'),
      brands: countBy('brand'),
      priceRange: prices.length ? { min: Math.min(...prices), max: Math.max(...prices) } : null,
    };
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (filters.categories.length && !filters.categories.includes(product.category)) return false;
      if (filters.brands.length && !filters.brands.includes(product.brand)) return false;

      const min = filters.minPrice === '' ? null : Number(filters.minPrice);
      const max = filters.maxPrice === '' ? null : Number(filters.maxPrice);
      if (min !== null && Number.isFinite(min) && product.price < min) return false;
      if (max !== null && Number.isFinite(max) && product.price > max) return false;

      const stock = product.stock || {};
      if (filters.availability === 'in_stock' && totalStockOf(product) <= 0) return false;
      if (filters.availability === 'providencia' && (stock.Providencia ?? 0) <= 0) return false;
      if (filters.availability === 'vitacura' && (stock.Vitacura ?? 0) <= 0) return false;

      return true;
    });
  }, [products, filters]);

  // Con el catálogo real (1000+ productos), renderizar todas las tarjetas
  // animadas de una vez congela el navegador. Se renderizan por tandas y el
  // contador se resetea al cambiar los filtros.
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [filters, products]);

  const visibleProducts = useMemo(() => filteredProducts.slice(0, visibleCount), [filteredProducts, visibleCount]);

  async function loadCatalog() {
    setLoading(true);
    setError(null);
    setIsFiltered(false);
    try {
      const data = await fetchProducts();
      setProducts(data);
    } catch {
      setError('No se pudo conectar con el servidor. Verifica que el backend esté corriendo.');
    } finally {
      setLoading(false);
    }
  }

  async function loadSingleProduct(id) {
    setLoading(true);
    setError(null);
    try {
      const product = await fetchProductWithStock(id);
      setProducts([product]);
      setIsFiltered(true);
    } catch {
      setError('No se pudo cargar el producto seleccionado.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCatalog();
  }, []);

  useEffect(() => {
    const query = debouncedQuery.trim();
    if (!query) {
      setSearchResults([]);
      setSearchOpen(false);
      return;
    }
    let cancelled = false;
    searchProducts(query)
      .then(({ products: results, approximate }) => {
        if (cancelled) return;
        setSearchResults(results);
        setSearchApproximate(approximate);
        setSearchOpen(true);
      })
      .catch(() => {
        if (!cancelled) setSearchOpen(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  function handleSelectSearchResult(product) {
    setSearchQuery(product.name);
    setSearchOpen(false);
    loadSingleProduct(product.id);
  }

  function handleClearFilter() {
    setSearchQuery('');
    loadCatalog();
  }

  function handleCheckout() {
    setCartOpen(false);
    setCheckoutOpen(true);
  }

  function handleCheckoutSuccess(order) {
    cart.clear();
    setSuccessOrder(order);
    loadCatalog();
  }

  function handleStockConflict() {
    // El backend rechazó la orden por falta de stock: refrescamos el
    // catálogo para que la UI vuelva a reflejar la realidad de la BD.
    loadCatalog();
  }

  return (
    <div className="bg-surface-50 text-neutral-800 font-sans antialiased flex flex-col min-h-screen">
      <div className="bg-ink-950 text-white/80 text-[11px] py-2 px-4 text-center font-medium tracking-wide">
        🚚 Despacho Express en Santiago · Retiro en tienda en Providencia y Vitacura
      </div>

      <Header
        cartCount={cart.totalQty}
        onOpenCart={() => setCartOpen(true)}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        searchResults={searchResults}
        searchApproximate={searchApproximate}
        searchOpen={searchOpen}
        onSelectResult={handleSelectSearchResult}
        onCloseSearch={() => setSearchOpen(false)}
        deliveryPreference={deliveryPreference}
        onSetPickup={setPickup}
        onSetDelivery={setDelivery}
      />

      <Hero
        onViewCatalog={scrollToCatalog}
        onBrowseTools={() => handleCategoryShortcut(['Herramientas Manuales'])}
        onOpenQuote={() => setHomeQuoteOpen(true)}
        products={products}
      />

      <div className="max-w-7xl mx-auto px-4 -mt-14 relative z-10 space-y-8">
        <QuickToolsHub onOpenCalculator={() => setHomeCalculatorOpen(true)} onOpenQuote={() => setHomeQuoteOpen(true)} />
        <TrustBadges />
        <CategoryGrid onSelect={handleCategoryShortcut} categoryCounts={facets.categories} />
      </div>

      <main ref={catalogRef} className="max-w-7xl mx-auto px-4 py-12 flex-grow w-full scroll-mt-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <Sidebar facets={facets} filters={filters} onFiltersChange={setFilters} />
          <div className="lg:col-span-9 space-y-6">
            <ProductGrid
              products={visibleProducts}
              matchCount={filteredProducts.length}
              totalCount={products.length}
              loading={loading}
              error={error}
              isFiltered={isFiltered}
              filtersActive={hasActiveFilters(filters)}
              onClearFilters={() => setFilters(EMPTY_FILTERS)}
              onClearFilter={handleClearFilter}
              onShowMore={() => setVisibleCount((count) => count + PAGE_SIZE)}
              onAdd={cart.add}
            />
          </div>
        </div>
      </main>

      <section className="max-w-7xl mx-auto px-4 pb-16">
        <PaintSimulator cart={cart} />
      </section>

      <Footer />
      <WhatsappButton />

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        onCheckout={handleCheckout}
        deliveryPreference={deliveryPreference}
        onSetPickup={setPickup}
        onSetDelivery={setDelivery}
      />

      <CheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        cartItems={cart.items}
        onSuccess={handleCheckoutSuccess}
        onStockConflict={handleStockConflict}
        deliveryPreference={deliveryPreference}
      />

      <SuccessModal order={successOrder} onClose={() => setSuccessOrder(null)} />

      <PaintCalculatorModal open={homeCalculatorOpen} onClose={() => setHomeCalculatorOpen(false)} product={null} onAdd={cart.addMany} />
      <B2BQuoteModal open={homeQuoteOpen} onClose={() => setHomeQuoteOpen(false)} items={cart.items} />
    </div>
  );
}
