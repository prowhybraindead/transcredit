'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Product, CartItem, Order } from '@/lib/types';
import { products } from '@/lib/products';
import ProductGrid from '@/components/ProductGrid';
import Cart from '@/components/Cart';
import QRDisplay from '@/components/QRDisplay';
import OrderStatus from '@/components/OrderStatus';
import { doc, onSnapshot } from 'firebase/firestore';
import { clientDb } from '@/lib/firebase-client';

type Stage = 'pos' | 'qr' | 'completed' | 'failed';

export default function POSPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [stage, setStage] = useState<Stage>('pos');
  const [orderId, setOrderId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dingAudioRef = useRef<HTMLAudioElement | null>(null);

  // Preload ding audio
  useEffect(() => {
    dingAudioRef.current = new Audio('/sounds/ding.mp3');
    dingAudioRef.current.volume = 0.7;
  }, []);

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // ── Cart actions ──────────────────────────────────────
  const addToCart = useCallback((product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  }, []);

  const updateQuantity = useCallback((id: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: item.quantity + delta } : item
      ).filter((item) => item.quantity > 0)
    );
  }, []);

  const removeItem = useCallback((id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  // ── Checkout ──────────────────────────────────────────
  const handleCheckout = async () => {
    if (total <= 0) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId: 'merchant-001',
          amount: total,
          type: 'payment',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create order');
      setOrderId(data.orderId);
      setStage('qr');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error creating order');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Firestore listener for order status ───────────────
  useEffect(() => {
    if (!orderId || stage !== 'qr') return;
    const unsubscribe = onSnapshot(
      doc(clientDb, 'orders', orderId),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as Order;
          if (data.status === 'COMPLETED') {
            // Play ding sound
            dingAudioRef.current?.play().catch(() => { });
            setStage('completed');
          } else if (data.status === 'FAILED') {
            setStage('failed');
          }
        }
      },
      (err) => console.error('Snapshot error:', err)
    );
    return () => unsubscribe();
  }, [orderId, stage]);

  // ── Reset ─────────────────────────────────────────────
  const handleNewOrder = () => {
    setCart([]);
    setOrderId(null);
    setError(null);
    setStage('pos');
  };

  return (
    <div className="h-screen flex flex-col bg-[#0a0e17]">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-[#1e293b] bg-[#0a0e17]/80 backdrop-blur-lg">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-sm font-bold">
            TC
          </div>
          <div>
            <h1 className="text-base font-semibold text-slate-100">TransCredit Coffee</h1>
            <p className="text-xs text-slate-500">POS Terminal</p>
          </div>
        </div>
        <nav className="flex items-center gap-1">
          <a href="/" className="px-3 py-1.5 rounded-lg text-sm font-medium text-indigo-400 bg-indigo-500/10">
            POS
          </a>
          <a href="/customers" className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-300 hover:bg-[#1e293b] transition-colors">
            Customers
          </a>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {stage === 'pos' && (
          <>
            {/* Product Grid — Left */}
            <div className="flex-1 p-4 overflow-hidden">
              <ProductGrid
                products={products}
                onAddToCart={addToCart}
                activeCategory={activeCategory}
                onCategoryChange={setActiveCategory}
              />
            </div>
            {/* Cart — Right */}
            <div className="w-[380px] p-4 pl-0">
              <Cart
                items={cart}
                onUpdateQuantity={updateQuantity}
                onRemoveItem={removeItem}
                onClearCart={clearCart}
                onCheckout={handleCheckout}
                total={total}
                isLoading={isLoading}
              />
              {error && (
                <p className="mt-2 text-xs text-red-400 text-center">{error}</p>
              )}
            </div>
          </>
        )}

        {stage === 'qr' && orderId && (
          <div className="flex-1 flex items-center justify-center animate-fade-in-up">
            <QRDisplay orderId={orderId} amount={total} onCancel={handleNewOrder} />
          </div>
        )}

        {(stage === 'completed' || stage === 'failed') && (
          <div className="flex-1 flex items-center justify-center animate-fade-in-up">
            <OrderStatus
              status={stage === 'completed' ? 'COMPLETED' : 'FAILED'}
              amount={total}
              onNewOrder={handleNewOrder}
            />
          </div>
        )}
      </main>
    </div>
  );
}
