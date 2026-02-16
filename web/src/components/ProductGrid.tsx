'use client';

import React, { useState } from 'react';
import { Product, CartItem } from '@/lib/types';

interface ProductGridProps {
    products: Product[];
    onAddToCart: (product: Product) => void;
    activeCategory: string;
    onCategoryChange: (category: string) => void;
}

export default function ProductGrid({
    products,
    onAddToCart,
    activeCategory,
    onCategoryChange,
}: ProductGridProps) {
    const categories = ['All', ...new Set(products.map((p) => p.category))];
    const filtered =
        activeCategory === 'All'
            ? products
            : products.filter((p) => p.category === activeCategory);

    return (
        <div className="flex flex-col h-full">
            {/* Category Tabs */}
            <div className="flex gap-2 mb-4 px-1 overflow-x-auto pb-1">
                {categories.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => onCategoryChange(cat)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 cursor-pointer
                            ${activeCategory === cat
                                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                                : 'bg-[#1e293b] text-slate-400 hover:bg-[#2a3548] hover:text-slate-200'
                            }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-3 gap-3 overflow-y-auto flex-1 pr-1">
                {filtered.map((product) => (
                    <button
                        key={product.id}
                        onClick={() => onAddToCart(product)}
                        className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl
                            bg-[#111827] border border-[#1e293b] hover:border-indigo-500/50
                            hover:bg-[#1a2332] transition-all duration-200
                            active:scale-95 cursor-pointer group"
                    >
                        <span className="text-3xl group-hover:scale-110 transition-transform duration-200">
                            {product.emoji}
                        </span>
                        <span className="text-sm font-medium text-slate-200 text-center leading-tight">
                            {product.name}
                        </span>
                        <span className="text-xs font-semibold text-indigo-400">
                            ₫{product.price.toLocaleString('vi-VN')}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}
