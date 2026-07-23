import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'garachena_delivery_pref';

export const PICKUP_BRANCHES = ['Providencia', 'Vitacura'];
export const DELIVERY_COMMUNES = ['Providencia', 'Vitacura', 'Las Condes', 'Lo Barnechea'];

const DEFAULT_PREFERENCE = { type: 'pickup', branch: 'Providencia', commune: 'Providencia' };

function readStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_PREFERENCE, ...JSON.parse(raw) } : DEFAULT_PREFERENCE;
  } catch {
    return DEFAULT_PREFERENCE;
  }
}

/**
 * Preferencia de logística (retiro en sucursal o despacho a una comuna del
 * sector oriente), persistida en localStorage y centralizada en Catalog.jsx
 * para que Header, CartDrawer y (como valor inicial) CheckoutModal muestren
 * siempre la misma selección.
 */
export function useDeliveryPreference() {
  const [preference, setPreference] = useState(readStored);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preference));
  }, [preference]);

  const setPickup = useCallback((branch) => {
    setPreference((prev) => ({ ...prev, type: 'pickup', branch }));
  }, []);

  const setDelivery = useCallback((commune) => {
    setPreference((prev) => ({ ...prev, type: 'delivery', commune }));
  }, []);

  return { preference, setPickup, setDelivery };
}
