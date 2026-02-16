'use client';

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface QRDisplayProps {
    orderId: string;
    amount: number;
    onCancel: () => void;
}

export default function QRDisplay({ orderId, amount, onCancel }: QRDisplayProps) {
    const qrData = JSON.stringify({ orderId, action: 'pay' });

    return (
        <div className="flex flex-col items-center gap-6 p-8 rounded-3xl bg-[#111827] border border-[#1e293b] max-w-md w-full">
            <div className="text-center">
                <p className="text-sm text-slate-500 mb-1">Total Amount</p>
                <p className="text-3xl font-bold text-slate-100">
                    ₫{amount.toLocaleString('vi-VN')}
                </p>
            </div>

            {/* QR Code with glow ring */}
            <div className="relative">
                <div className="absolute inset-0 rounded-3xl animate-pulse-glow" />
                <div className="relative bg-white p-5 rounded-2xl">
                    <QRCodeSVG value={qrData} size={220} level="H" />
                </div>
            </div>

            <div className="text-center">
                <p className="text-sm text-slate-400">Scan with TransCredit App</p>
                <p className="text-xs text-slate-600 mt-1 font-mono">
                    Order: {orderId.slice(0, 8)}...
                </p>
            </div>

            {/* Waiting animation */}
            <div className="flex items-center gap-2 text-sm text-indigo-400">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Waiting for payment...
            </div>

            <button
                onClick={onCancel}
                className="text-sm text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
            >
                Cancel & Return to POS
            </button>
        </div>
    );
}
