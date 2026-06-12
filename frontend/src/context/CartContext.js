import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { token, user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // Helper to fetch cart from backend
  const fetchCart = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/store/cart', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCartItems(data.items || []);
      }
    } catch (err) {
      console.error('Failed to retrieve cart items:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Load cart on login or initial mount
  useEffect(() => {
    if (token) {
      // Sync guest cart if any existed before login
      const syncGuestCart = async () => {
        const guestCart = JSON.parse(localStorage.getItem('guest_cart') || '[]');
        if (guestCart.length > 0) {
          setLoading(true);
          try {
            for (const item of guestCart) {
              await fetch('/api/store/cart/add', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ productId: item.product_id, quantity: item.quantity })
              });
            }
            localStorage.removeItem('guest_cart');
          } catch (err) {
            console.error('Failed to sync guest cart to profile:', err);
          }
        }
        fetchCart();
      };
      syncGuestCart();
    } else {
      // Load guest cart from local storage
      const guestCart = JSON.parse(localStorage.getItem('guest_cart') || '[]');
      setCartItems(guestCart);
      setLoading(false);
    }
  }, [token, fetchCart]);

  // Add Item to Cart
  const addToCart = async (product, quantity = 1) => {
    if (token) {
      try {
        const res = await fetch('/api/store/cart/add', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ productId: product.id, quantity })
        });
        if (res.ok) {
          await fetchCart();
        } else {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to add item to cart');
        }
      } catch (err) {
        console.error('Cart add error:', err);
        throw err;
      }
    } else {
      // Guest local storage cart management
      setCartItems(prevItems => {
        const existingIndex = prevItems.findIndex(item => item.product_id === product.id);
        let updated;
        if (existingIndex > -1) {
          updated = prevItems.map((item, idx) => 
            idx === existingIndex ? { ...item, quantity: item.quantity + quantity } : item
          );
        } else {
          updated = [
            ...prevItems,
            {
              cart_item_id: 'guest_' + Date.now() + Math.random().toString(36).substr(2, 5),
              quantity,
              product_id: product.id,
              name: product.name,
              sku: product.sku,
              price: product.price,
              image_url: product.image_url,
              stock_quantity: product.stock_quantity,
              stock_type: product.stock_type
            }
          ];
        }
        localStorage.setItem('guest_cart', JSON.stringify(updated));
        return updated;
      });
    }
  };

  // Update Item Quantity
  const updateCartQuantity = async (cartItemId, quantity) => {
    if (token) {
      try {
        const res = await fetch('/api/store/cart/update', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ cartItemId, quantity })
        });
        if (res.ok) {
          await fetchCart();
        } else {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to update item quantity');
        }
      } catch (err) {
        console.error('Cart update error:', err);
        throw err;
      }
    } else {
      setCartItems(prevItems => {
        let updated;
        if (quantity <= 0) {
          updated = prevItems.filter(item => item.cart_item_id !== cartItemId);
        } else {
          updated = prevItems.map(item => 
            item.cart_item_id === cartItemId ? { ...item, quantity } : item
          );
        }
        localStorage.setItem('guest_cart', JSON.stringify(updated));
        return updated;
      });
    }
  };

  // Remove Item from Cart
  const removeFromCart = async (cartItemId) => {
    if (token) {
      try {
        const res = await fetch(`/api/store/cart/remove/${cartItemId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          await fetchCart();
        } else {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to remove item from cart');
        }
      } catch (err) {
        console.error('Cart delete error:', err);
        throw err;
      }
    } else {
      setCartItems(prevItems => {
        const updated = prevItems.filter(item => item.cart_item_id !== cartItemId);
        localStorage.setItem('guest_cart', JSON.stringify(updated));
        return updated;
      });
    }
  };

  // Clear Cart
  const clearCart = useCallback(async () => {
    setCartItems([]);
    if (token) {
      // Backend automatically clears cart on successful order checkout.
      // But we can pull the clean empty cart state.
      await fetchCart();
    } else {
      localStorage.removeItem('guest_cart');
    }
  }, [token, fetchCart]);

  // Calculations
  const getSubtotal = () => {
    return cartItems.reduce((acc, item) => acc + parseFloat(item.price) * item.quantity, 0);
  };

  const getCartCount = () => {
    return cartItems.reduce((acc, item) => acc + item.quantity, 0);
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      loading,
      addToCart,
      updateCartQuantity,
      removeFromCart,
      clearCart,
      fetchCart,
      getSubtotal,
      getCartCount
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
