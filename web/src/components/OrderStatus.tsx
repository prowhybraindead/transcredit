'use client';

import React from 'react';

interface OrderStatusProps {
    status: 'COMPLETED' | 'FAILED';
    amount: number;
    onNewOrder: () => void;
}

export default function OrderStatus({ status, amount, onNewOrder }: OrderStatusProps) {
    const isSuccess = status === 'COMPLETED';

    return (
        <div className="flex flex-col items-center gap-6 p-10 rounded-3xl bg-[#111827] border border-[#1e293b] max-w-md w-full animate-fade-in-up">
            {/* Icon */}
            <div
                className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl
                    ${isSuccess ? 'bg-green-500/10 animate-success-glow' : 'bg-red-500/10'}`}
            >
                {isSuccess ? '✅' : '❌'}
            </div>

            {/* Text */}
            <div className="text-center">
                <h2 className={`text-2xl font-bold mb-2 ${isSuccess ? 'text-green-400' : 'text-red-400'}`}>
                    {isSuccess ? 'Payment Received!' : 'Payment Failed'}
                </h2>
                <p className="text-3xl font-bold text-slate-100">
                    ₫{amount.toLocaleString('vi-VN')}
                </p>
                {isSuccess && (
                    <p className="text-sm text-slate-500 mt-2">
                        Transaction completed successfully
                    </p>
                )}
            </div>

            {/* Confetti (success only) */}
            {isSuccess && (
                <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
                    {Array.from({ length: 30 }).map((_, i) => (
                        <div
                            key={i}
                            className="absolute w-2 h-2 rounded-full"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `-5%`,
                                background: ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#a855f7'][
                                    i % 5
                                ],
                                animation: `confetti-fall ${2 + Math.random() * 3}s linear ${Math.random() * 2}s forwards`,
                            }}
                        />
                    ))}
                </div>
            )}

            <button
                onClick={onNewOrder}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500
                    text-white font-semibold hover:from-indigo-600 hover:to-violet-600
                    shadow-lg shadow-indigo-500/25 transition-all active:scale-[0.98] cursor-pointer"
            >
                New Order
            </button>
        </div>
    );
}
