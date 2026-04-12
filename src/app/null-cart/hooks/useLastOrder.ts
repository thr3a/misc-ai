'use client';

import { useLocalStorage, useMounted } from '@mantine/hooks';
import type { NullCartOrderSummary } from '../types';

export const LAST_ORDER_STORAGE_KEY = 'null-cart-last-order';

const emptyOrderSummary: NullCartOrderSummary = {
  totalPrice: 0,
  totalItems: 0
};

export const useLastOrder = () => {
  const mounted = useMounted();
  const [lastOrder, setLastOrder, removeLastOrder] = useLocalStorage<NullCartOrderSummary>({
    key: LAST_ORDER_STORAGE_KEY,
    defaultValue: emptyOrderSummary,
    getInitialValueInEffect: true
  });

  return {
    lastOrder: mounted ? lastOrder : emptyOrderSummary,
    isReady: mounted,
    setLastOrder,
    clearLastOrder: removeLastOrder
  };
};
