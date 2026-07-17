import { useEffect, useState } from 'react';
import { fetchProductWithStock, fetchProducts, searchProducts } from '../api';
import { useToast } from '../hooks/useToast';
import { useCart } from '../hooks/useCart';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import Header from './Header';
import Sidebar from './Sidebar';
import PaintSimulator from './PaintSimulator';
import ProductGrid from './ProductGrid';
import Footer from './Footer';
import WhatsappButton from './WhatsappButton';
import CartDrawer from './CartDrawer';
import CheckoutModal from './CheckoutModal';
import SuccessModal from './SuccessModal';

export default function Catalog() {
  const showToast = useToast();
  const cart = useCart(showToast);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFiltered, setIsFiltered] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const debouncedQuery = useDebouncedValue(searchQuery, 250);

  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [successOrder, setSuccessOrder] = useState(null);

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
      .then((results) => {
        if (cancelled) return;
        setSearchResults(results);
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
    <div className="bg-brand-light text-slate-800 font-sans antialiased flex flex-col min-h-screen">
      <div className="bg-brand-blue text-white text-xs py-2 px-4 text-center font-bold tracking-wide">
        🚚 Despacho Express en Santiago y Retiro en tienda en Providencia y Vitacura
      </div>

      <Header
        cartCount={cart.totalQty}
        onOpenCart={() => setCartOpen(true)}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        searchResults={searchResults}
        searchOpen={searchOpen}
        onSelectResult={handleSelectSearchResult}
        onCloseSearch={() => setSearchOpen(false)}
      />

      <main className="max-w-7xl mx-auto px-4 py-8 flex-grow w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <Sidebar />
          <div className="lg:col-span-9 space-y-6">
            <PaintSimulator />
            <ProductGrid
              products={products}
              loading={loading}
              error={error}
              isFiltered={isFiltered}
              onClearFilter={handleClearFilter}
              onAdd={cart.add}
            />
          </div>
        </div>
      </main>

      <Footer />
      <WhatsappButton />

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} cart={cart} onCheckout={handleCheckout} />

      <CheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        cartItems={cart.items}
        onSuccess={handleCheckoutSuccess}
        onStockConflict={handleStockConflict}
      />

      <SuccessModal order={successOrder} onClose={() => setSuccessOrder(null)} />
    </div>
  );
}
