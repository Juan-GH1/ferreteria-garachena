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

  /**
   * Agrega una cantidad específica de una sola vez (ej. "3 galones" desde la
   * Calculadora de Pintura). No usar `add()` en un loop para esto: como
   * `add()` cierra sobre el `items` de su render, llamarlo N veces seguidas
   * en el mismo ciclo de evento solo agrega 1 unidad (cada llamada parte del
   * mismo `items` desactualizado). Esta función calcula la cantidad final en
   * un solo `setItems`.
   */
  const addMany = useCallback(
    (product, quantity) => {
      if (!quantity || quantity <= 0) return;
      if (product.stock <= 0) {
        showToast(`"${product.name}" está agotado en ambas sucursales.`);
        return;
      }

      const existing = items.find((item) => item.id === product.id);
      const currentQty = existing ? existing.qty : 0;
      const desiredQty = Math.min(currentQty + quantity, product.stock);
      const added = desiredQty - currentQty;

      if (added <= 0) {
        showToast(`Solo hay ${product.stock} unidades disponibles de "${product.name}".`);
        return;
      }

      if (existing) {
        setItems(items.map((item) => (item.id === product.id ? { ...item, qty: desiredQty } : item)));
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
            qty: desiredQty,
          },
        ]);
      }

      const suffix = added < quantity ? ` (stock disponible: ${product.stock})` : '';
      showToast(`${added} unidad${added === 1 ? '' : 'es'} de "${product.name}" agregada${added === 1 ? '' : 's'} al carrito${suffix}.`);
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

  return { items, totalQty, totalPrice, add, addMany, changeQty, remove, clear };
}
