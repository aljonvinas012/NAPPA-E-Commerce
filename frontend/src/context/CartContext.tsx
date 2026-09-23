import { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import type { ICart } from '../types';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { useResultModal } from './ResultModalContext';

interface CartContextType {
  cart: ICart | null;
  itemCount: number;
  refreshCart: () => Promise<void>;
  addToCart: (productId: string, quantity?: number) => Promise<boolean>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { showResult } = useResultModal();
  const navigate = useNavigate();
  const [cart, setCart] = useState<ICart | null>(null);

  const refreshCart = useCallback(async () => {
    if (!user) {
      setCart(null);
      return;
    }
    try {
      const { data } = await api.get('/cart');
      setCart(data);
    } catch {
      // silent
    }
  }, [user]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addToCart = async (productId: string, quantity = 1) => {
    try {
      const { data } = await api.post('/cart', { productId, quantity });
      setCart(data);
      showResult({
        type: 'success',
        title: 'Added to Cart',
        message: 'This item is now in your shopping cart.',
        actionLabel: 'Keep Shopping',
        secondaryLabel: 'View Cart',
        onSecondary: () => navigate('/shop/cart'),
      });
      return true;
    } catch (err: any) {
      showResult({
        type: 'error',
        title: 'Could Not Add to Cart',
        message: err.response?.data?.message || 'Something went wrong while adding this item. Please try again.',
        actionLabel: 'Try Again',
      });
      return false;
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    try {
      const { data } = await api.put(`/cart/${productId}`, { quantity });
      setCart(data);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Could not update quantity.', 'error');
    }
  };

  const removeItem = async (productId: string) => {
    try {
      const { data } = await api.delete(`/cart/${productId}`);
      setCart(data);
      showToast('Item removed from cart.', 'success');
    } catch {
      showToast('Could not remove item.', 'error');
    }
  };

  const itemCount = cart?.items.reduce((sum, i) => sum + i.quantity, 0) || 0;

  return (
    <CartContext.Provider value={{ cart, itemCount, refreshCart, addToCart, updateQuantity, removeItem }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
