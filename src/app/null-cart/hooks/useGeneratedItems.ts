'use client';

import { useLocalStorage, useMounted } from '@mantine/hooks';
import type { Item } from '../types';

export const GENERATED_ITEMS_STORAGE_KEY = 'null-cart-generated-items';

export const useGeneratedItems = () => {
  const mounted = useMounted();
  const [items, setItems, removeItems] = useLocalStorage<Item[]>({
    key: GENERATED_ITEMS_STORAGE_KEY,
    defaultValue: [],
    getInitialValueInEffect: true
  });

  return {
    items: mounted ? items : [],
    isReady: mounted,
    hasItems: mounted && items.length > 0,
    setItems,
    clearItems: removeItems
  };
};
