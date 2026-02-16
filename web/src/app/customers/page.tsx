'use client';

import React, { useEffect, useState } from 'react';

interface Customer {
    uid: string;
    displayName: string;
    email: string;
    phoneNumber: string;
    bankName: string;
    accountNumber: string;
    balance: number;
    points: number;
    createdAt: string;
}

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetch('/api/customers')
            .then((res) => res.json())
            .then((data) => {
                setCustomers(data.customers || []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const filtered = customers.filter(
        (c) =>
            c.displayName.toLowerCase().includes(search.toLowerCase()) ||
            c.phoneNumber.includes(search) ||
            c.accountNumber.includes(search)
    );

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
                        <p className="text-xs text-slate-500">Customer Management</p>
                    </div>
                </div>
                <nav className="flex items-center gap-1">
                    <a href="/" className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-300 hover:bg-[#1e293b] transition-colors">
                        POS
                    </a>
                    <a href="/customers" className="px-3 py-1.5 rounded-lg text-sm font-medium text-indigo-400 bg-indigo-500/10">
                        Customers
                    </a>
                </nav>
            </header>

            {/* Content */}
            <main className="flex-1 overflow-auto p-6">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-slate-100">All Customers</h2>
                            <p className="text-sm text-slate-500">{customers.length} registered users</p>
                        </div>
                        {/* Search */}
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search name, phone, account..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-72 pl-10 pr-4 py-2.5 rounded-xl bg-[#111827] border border-[#1e293b]
                                    text-sm text-slate-200 placeholder-slate-600
                                    focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20
                                    transition-colors"
                            />
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="rounded-2xl overflow-hidden border border-[#1e293b] bg-[#111827]">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-[#1e293b]">
                                    <th className="px-5 py-3.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Customer</th>
                                    <th className="px-5 py-3.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Phone</th>
                                    <th className="px-5 py-3.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Bank</th>
                                    <th className="px-5 py-3.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Account No.</th>
                                    <th className="px-5 py-3.5 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Balance</th>
                                    <th className="px-5 py-3.5 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Points</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-5 py-16 text-center text-slate-500">
                                            <svg className="animate-spin h-6 w-6 mx-auto mb-2 text-indigo-400" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                            Loading customers...
                                        </td>
                                    </tr>
                                ) : filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-5 py-16 text-center text-slate-500">
                                            No customers found
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map((customer) => (
                                        <tr
                                            key={customer.uid}
                                            className="border-b border-[#1e293b]/50 hover:bg-[#1a2332] transition-colors"
                                        >
                                            <td className="px-5 py-4">
                                                <div>
                                                    <p className="text-sm font-medium text-slate-200">
                                                        {customer.displayName}
                                                    </p>
                                                    <p className="text-xs text-slate-600 font-mono">
                                                        {customer.uid.slice(0, 12)}...
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-sm text-slate-400">
                                                {customer.phoneNumber}
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-xs font-medium text-indigo-400">
                                                    {customer.bankName}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-sm text-slate-400 font-mono">
                                                {customer.accountNumber}
                                            </td>
                                            <td className="px-5 py-4 text-sm text-right font-semibold text-green-400">
                                                ₫{customer.balance.toLocaleString('vi-VN')}
                                            </td>
                                            <td className="px-5 py-4 text-sm text-right text-amber-400">
                                                {customer.points}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}
