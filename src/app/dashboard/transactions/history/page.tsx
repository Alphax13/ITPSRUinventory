// src/app/dashboard/transactions/history/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface Transaction {
  id: string;
  quantity: number;
  type: 'IN' | 'OUT' | 'TRANSFER';
  reason: string | null;
  createdAt: string;
  user: {
    name: string;
    department: string | null;
  };
  material: {
    name: string;
    code: string;
    unit: string;
  };
}

export default function TransactionHistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const res = await fetch('/api/transactions');
      if (res.ok) {
        const data = await res.json();
        setTransactions(data);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-4 text-center">Loading transaction history...</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Transaction History</h1>
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="w-full table-auto border-collapse">
          <thead>
            <tr className="bg-gray-200 text-left text-sm font-semibold text-gray-700">
              <th className="p-3 border-b">Date</th>
              <th className="p-3 border-b">Type</th>
              <th className="p-3 border-b">Material</th>
              <th className="p-3 border-b">Quantity</th>
              <th className="p-3 border-b">User</th>
              <th className="p-3 border-b">Reason</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length > 0 ? (
              transactions.map((tx) => (
                <tr key={tx.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 text-sm">{format(new Date(tx.createdAt), 'MMM d, yyyy HH:mm')}</td>
                  <td className="p-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      tx.type === 'OUT' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {tx.type === 'OUT' ? 'OUT' : 'IN'}
                    </span>
                  </td>
                  <td className="p-3 text-sm">{tx.material.name} ({tx.material.code})</td>
                  <td className="p-3 text-sm font-bold">{tx.quantity} {tx.material.unit}</td>
                  <td className="p-3 text-sm">{tx.user.name}</td>
                  <td className="p-3 text-sm">{tx.reason || '-'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="p-4 text-center text-gray-500">No transaction history found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}