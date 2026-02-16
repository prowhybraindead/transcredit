'use client';

import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { clientDb } from '@/lib/firebase-client';
import AmountInput from '@/components/AmountInput';
import QRDisplay from '@/components/QRDisplay';
import OrderStatus from '@/components/OrderStatus';
import type { Order } from '@/lib/types';

type Stage = 'input' | 'qr' | 'completed' | 'failed';

export default function MerchantPOS() {
  const [stage, setStage] = useState<Stage>('input');
  const [isLoading, setIsLoading] = useState(false);
  const [orderId, setOrderId] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);
  const [error, setError] = useState<string>('');

  // ── Real-time listener for order status ──────────────────
  useEffect(() => {
    if (!orderId || stage !== 'qr') return;

    const unsubscribe = onSnapshot(
      doc(clientDb, 'orders', orderId),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as Order;
          if (data.status === 'COMPLETED') {
            setStage('completed');
          } else if (data.status === 'FAILED') {
            setStage('failed');
          }
        }
      },
      (err) => {
        console.error('Firestore listener error:', err);
      }
    );

    return () => unsubscribe();
  }, [orderId, stage]);

  // ── Create order handler ─────────────────────────────────
  const handleCreateOrder = async (inputAmount: number) => {
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId: 'merchant-001',
          amount: inputAmount,
          type: 'payment',
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to create order');
      }

      const data = await res.json();
      setOrderId(data.orderId);
      setAmount(inputAmount);
      setStage('qr');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Reset to start new transaction ───────────────────────
  const handleNewTransaction = () => {
    setStage('input');
    setOrderId('');
    setAmount(0);
    setError('');
  };

  return (
    <main className="merchant-app">
      {/* Header */}
      <header className="merchant-header">
        <div className="logo">
          <div className="logo-icon">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="8" fill="url(#logo-grad)" />
              <path d="M8 14l4 4 8-8" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <defs>
                <linearGradient id="logo-grad" x1="0" y1="0" x2="28" y2="28">
                  <stop stopColor="#6366f1" />
                  <stop offset="1" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="logo-text">TransCredit</span>
        </div>
        <div className="merchant-badge">
          <span className="badge-dot" />
          POS Terminal
        </div>
      </header>

      {/* Content */}
      <section className="merchant-content">
        {stage === 'input' && (
          <div className="card fade-in">
            <h1 className="card-title">New Payment</h1>
            <p className="card-subtitle">Enter the amount to charge the customer</p>
            {error && <div className="error-banner">{error}</div>}
            <AmountInput onSubmit={handleCreateOrder} isLoading={isLoading} />
          </div>
        )}

        {stage === 'qr' && (
          <div className="card fade-in">
            <QRDisplay orderId={orderId} amount={amount} />
            <button className="cancel-btn" onClick={handleNewTransaction}>
              Cancel & Start Over
            </button>
          </div>
        )}

        {(stage === 'completed' || stage === 'failed') && (
          <div className="card fade-in">
            <OrderStatus
              status={stage === 'completed' ? 'COMPLETED' : 'FAILED'}
              amount={amount}
            />
            <button className="new-transaction-btn" onClick={handleNewTransaction}>
              New Transaction
            </button>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="merchant-footer">
        <p>TransCredit Payment Gateway v1.0 — Internal Simulation</p>
      </footer>
    </main>
  );
}
