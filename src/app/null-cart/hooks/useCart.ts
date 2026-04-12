'use client';

import { useLocalStorage, useMounted } from '@mantine/hooks';
import type { CartItem } from '../types';

export const useCart = () => {
  const mounted = useMounted();
  const [cartItems, setCartItems] = useLocalStorage<CartItem[]>({
    key: 'null-cart-items',
    defaultValue: [],
    getInitialValueInEffect: true
  });

  const addToCart = (productId: string, quantity = 1) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.productId === productId);
      if (existing) {
        return prev.map((item) =>
          item.productId === productId ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prev, { productId, quantity }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems((prev) => prev.map((item) => (item.productId === productId ? { ...item, quantity } : item)));
  };

  const clearCart = () => setCartItems([]);

  const resolvedCartItems = mounted ? cartItems : [];
  const totalItems = resolvedCartItems.reduce((sum, item) => sum + item.quantity, 0);

  return {
    cartItems: resolvedCartItems,
    isReady: mounted,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalItems
  };
};
