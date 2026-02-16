'use client';

import { useState } from 'react';

interface AmountInputProps {
    onSubmit: (amount: number) => void;
    isLoading: boolean;
}

const QUICK_AMOUNTS = [20_000, 50_000, 100_000, 200_000, 500_000, 1_000_000];

export default function AmountInput({ onSubmit, isLoading }: AmountInputProps) {
    const [amount, setAmount] = useState<string>('');

    const formatVND = (value: number) =>
        value.toLocaleString('vi-VN');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/\D/g, '');
        setAmount(raw);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numericAmount = parseInt(amount, 10);
        if (numericAmount > 0) {
            onSubmit(numericAmount);
        }
    };

    const handleQuickAmount = (val: number) => {
        setAmount(val.toString());
        onSubmit(val);
    };

    const displayValue = amount ? parseInt(amount, 10).toLocaleString('vi-VN') : '';

    return (
        <form onSubmit={handleSubmit} className="amount-input-form">
            <div className="amount-input-wrapper">
                <span className="currency-prefix">₫</span>
                <input
                    type="text"
                    inputMode="numeric"
                    className="amount-input"
                    placeholder="0"
                    value={displayValue}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    autoFocus
                />
            </div>

            <div className="quick-amounts">
                {QUICK_AMOUNTS.map((val) => (
                    <button
                        key={val}
                        type="button"
                        className="quick-amount-btn"
                        onClick={() => handleQuickAmount(val)}
                        disabled={isLoading}
                    >
                        {formatVND(val)}
                    </button>
                ))}
            </div>

            <button
                type="submit"
                className="submit-btn"
                disabled={!amount || parseInt(amount, 10) <= 0 || isLoading}
            >
                {isLoading ? (
                    <span className="spinner" />
                ) : (
                    <>Generate QR Payment</>
                )}
            </button>
        </form>
    );
}
