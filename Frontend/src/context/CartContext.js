import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ce_cart')) || []; } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('ce_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(i => i.productId === product._id);
      if (existing) return prev.map(i => i.productId === product._id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, {
        productId: product._id,
        name: product.name,
        price: product.price,
        image: product.image,
        sellerId: product.seller?._id || product.seller,
        sellerName: product.seller?.restaurantName || product.seller?.name || '',
        qty: 1
      }];
    });
  };

  const removeFromCart = (productId) => setCart(prev => prev.filter(i => i.productId !== productId));

  const changeQty = (productId, delta) => {
    setCart(prev => {
      const updated = prev.map(i => i.productId === productId ? { ...i, qty: i.qty + delta } : i);
      return updated.filter(i => i.qty > 0);
    });
  };

  const clearCart = () => setCart([]);

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const deliveryFee = subtotal > 300 ? 0 : 30;
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + deliveryFee + tax;

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, changeQty, clearCart, cartCount, subtotal, deliveryFee, tax, total }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
