'use client';

interface OrderStatusProps {
    status: 'PENDING' | 'COMPLETED' | 'FAILED';
    amount?: number;
    merchantName?: string;
}

export default function OrderStatus({ status, amount, merchantName }: OrderStatusProps) {
    return (
        <div className={`order-status status-${status.toLowerCase()}`}>
            {status === 'COMPLETED' && (
                <div className="success-container">
                    <div className="success-checkmark">
                        <svg viewBox="0 0 52 52" className="checkmark-svg">
                            <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none" />
                            <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
                        </svg>
                    </div>
                    <h2 className="success-title">Payment Received!</h2>
                    {amount && (
                        <p className="success-amount">₫{amount.toLocaleString('vi-VN')}</p>
                    )}
                    <p className="success-subtitle">Transaction completed successfully</p>
                    <div className="confetti-container">
                        {Array.from({ length: 20 }).map((_, i) => (
                            <div key={i} className={`confetti confetti-${i % 5}`} style={{
                                left: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 0.5}s`,
                                animationDuration: `${1 + Math.random() * 1}s`,
                            }} />
                        ))}
                    </div>
                </div>
            )}

            {status === 'FAILED' && (
                <div className="failure-container">
                    <div className="failure-icon">✕</div>
                    <h2 className="failure-title">Payment Failed</h2>
                    <p className="failure-subtitle">The transaction could not be completed</p>
                </div>
            )}

            {status === 'PENDING' && (
                <div className="pending-badge">
                    <span className="pending-dot" />
                    PENDING
                </div>
            )}
        </div>
    );
}
