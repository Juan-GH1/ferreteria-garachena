import { useCallback, useEffect, useMemo, useState } from 'react';

const CART_STORAGE_KEY = 'garachena_cart';

function readInitialCart() {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Estado del carrito persistido en localStorage. El tope de unidades por
 * producto (`stock`) se captura al agregar el ítem y corresponde al stock
 * combinado de Providencia + Vitacura en ese momento.
 */
export function useCart(showToast) {
  const [items, setItems] = useState(readInitialCart);

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const totalQty = useMemo(() => items.reduce((sum, item) => sum + item.qty, 0), [items]);
  const totalPrice = useMemo(() => items.reduce((sum, item) => sum + item.qty * item.price, 0), [items]);

  const add = useCallback(
    (product) => {
      if (product.stock <= 0) {
        showToast(`"${product.name}" está agotado en ambas sucursales.`);
        return;
      }

      const existing = items.find((item) => item.id === product.id);
      if (existing) {
        if (existing.qty >= existing.stock) {
          showToast(`Solo hay ${existing.stock} unidades disponibles de "${existing.name}".`);
          return;
        }
        setItems(items.map((item) => (item.id === product.id ? { ...item, qty: item.qty + 1 } : item)));
      } else {
        setItems([
          ...items,
          {
            id: product.id,
            name: product.name,
            price: product.price,
            image_url: product.image_url,
            category: product.category,
            sku: product.sku,
            stock: product.stock,
            qty: 1,
          },
        ]);
      }
      showToast(`"${product.name}" agregado al carrito.`);
    },
    [items, showToast]
  );

  const changeQty = useCallback(
    (id, delta) => {
      const item = items.find((i) => i.id === id);
      if (!item) return;
      const nextQty = item.qty + delta;
      if (nextQty < 1) return;
      if (nextQty > item.stock) {
        showToast(`Solo hay ${item.stock} unidades disponibles de "${item.name}".`);
        return;
      }
      setItems(items.map((i) => (i.id === id ? { ...i, qty: nextQty } : i)));
    },
    [items, showToast]
  );

  const remove = useCallback((id) => setItems(items.filter((i) => i.id !== id)), [items]);

  const clear = useCallback(() => setItems([]), []);

  return { items, totalQty, totalPrice, add, changeQty, remove, clear };
}
