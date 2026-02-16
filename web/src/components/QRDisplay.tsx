'use client';

import { QRCodeSVG } from 'qrcode.react';
import { QRPayload } from '@/lib/types';

interface QRDisplayProps {
    orderId: string;
    amount: number;
}

export default function QRDisplay({ orderId, amount }: QRDisplayProps) {
    const payload: QRPayload = {
        orderId,
        action: 'pay',
    };

    return (
        <div className="qr-display">
            <div className="qr-glow-ring">
                <div className="qr-inner">
                    <QRCodeSVG
                        value={JSON.stringify(payload)}
                        size={220}
                        bgColor="transparent"
                        fgColor="#ffffff"
                        level="H"
                        includeMargin={false}
                    />
                </div>
            </div>

            <div className="qr-details">
                <p className="qr-label">Scan to Pay</p>
                <p className="qr-amount">
                    ₫{amount.toLocaleString('vi-VN')}
                </p>
                <p className="qr-order-id">
                    Order: {orderId.slice(0, 8)}...
                </p>
            </div>

            <div className="qr-pulse-hint">
                <span className="pulse-dot" />
                Waiting for payment...
            </div>
        </div>
    );
}
