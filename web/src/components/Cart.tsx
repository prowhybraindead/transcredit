'use client';

import React from 'react';
import { CartItem } from '@/lib/types';

interface CartProps {
    items: CartItem[];
    onUpdateQuantity: (id: string, delta: number) => void;
    onRemoveItem: (id: string) => void;
    onClearCart: () => void;
    onCheckout: () => void;
    total: number;
    isLoading: boolean;
}

export default function Cart({
    items,
    onUpdateQuantity,
    onRemoveItem,
    onClearCart,
    onCheckout,
    total,
    isLoading,
}: CartProps) {
    return (
        <div className="flex flex-col h-full bg-[#111827] rounded-2xl border border-[#1e293b]">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e293b]">
                <div className="flex items-center gap-2">
                    <span className="text-lg">🧾</span>
                    <h2 className="text-lg font-semibold text-slate-200">Current Bill</h2>
                </div>
                {items.length > 0 && (
                    <button
                        onClick={onClearCart}
                        className="text-xs text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                    >
                        Clear all
                    </button>
                )}
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-5 py-3">
                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500">
                        <span className="text-4xl mb-3">🛒</span>
                        <p className="text-sm">No items yet</p>
                        <p className="text-xs text-slate-600 mt-1">Tap a product to add</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {items.map((item) => (
                            <div
                                key={item.id}
                                className="flex items-center gap-3 p-3 rounded-xl bg-[#0a0e17]/50
                                    border border-[#1e293b]/50 animate-fade-in-up"
                            >
                                <span className="text-xl">{item.emoji}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-200 truncate">
                                        {item.name}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        ₫{item.price.toLocaleString('vi-VN')} each
                                    </p>
                                </div>
                                {/* Quantity Controls */}
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() =>
                                            item.quantity === 1
                                                ? onRemoveItem(item.id)
                                                : onUpdateQuantity(item.id, -1)
                                        }
                                        className="w-7 h-7 rounded-lg bg-[#1e293b] text-slate-400
                                            hover:bg-red-500/20 hover:text-red-400 transition-colors
                                            flex items-center justify-center text-sm font-bold cursor-pointer"
                                    >
                                        {item.quantity === 1 ? '×' : '−'}
                                    </button>
                                    <span className="text-sm font-semibold text-slate-200 w-5 text-center">
                                        {item.quantity}
                                    </span>
                                    <button
                                        onClick={() => onUpdateQuantity(item.id, 1)}
                                        className="w-7 h-7 rounded-lg bg-[#1e293b] text-slate-400
                                            hover:bg-indigo-500/20 hover:text-indigo-400 transition-colors
                                            flex items-center justify-center text-sm font-bold cursor-pointer"
                                    >
                                        +
                                    </button>
                                </div>
                                {/* Line total */}
                                <span className="text-sm font-semibold text-indigo-400 w-20 text-right">
                                    ₫{(item.price * item.quantity).toLocaleString('vi-VN')}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Total & Checkout */}
            <div className="border-t border-[#1e293b] px-5 py-4 space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-sm">Total</span>
                    <span className="text-2xl font-bold text-slate-100">
                        ₫{total.toLocaleString('vi-VN')}
                    </span>
                </div>
                <button
                    onClick={onCheckout}
                    disabled={items.length === 0 || isLoading}
                    className={`w-full py-3.5 rounded-xl text-base font-semibold transition-all duration-200 cursor-pointer
                        ${items.length > 0 && !isLoading
                            ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white hover:from-indigo-600 hover:to-violet-600 shadow-lg shadow-indigo-500/25 active:scale-[0.98]'
                            : 'bg-[#1e293b] text-slate-600 cursor-not-allowed'
                        }`}
                >
                    {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Creating order...
                        </span>
                    ) : (
                        `💳 Charge ₫${total.toLocaleString('vi-VN')}`
                    )}
                </button>
            </div>
        </div>
    );
}
