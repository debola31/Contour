'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import { useStore } from '@/store/useStore';

export default function TransactionsPage() {
  const transactions = useStore((state) => state.transactions);
  const personnel = useStore((state) => state.personnel);

  const [searchTerm, setSearchTerm] = useState('');
  const [objectTypeFilter, setObjectTypeFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.objectId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (transaction.changes && transaction.changes.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesObjectType = objectTypeFilter === 'all' || transaction.objectType === objectTypeFilter;
    const matchesAction = actionFilter === 'all' || transaction.action === actionFilter;
    return matchesSearch && matchesObjectType && matchesAction;
  });

  const getPersonnel = (personnelId: string) => {
    return personnel.find(p => p.id === personnelId);
  };

  const objectTypes = Array.from(new Set(transactions.map(t => t.objectType)));
  const actions = Array.from(new Set(transactions.map(t => t.action)));

  const handleExportCSV = () => {
    const csvContent = [
      ['Timestamp', 'Object Type', 'Action', 'Object ID', 'User', 'Changes'].join(','),
      ...filteredTransactions.map(t => {
        const user = getPersonnel(t.userId);
        return [
          new Date(t.timestamp).toLocaleString(),
          t.objectType,
          t.action,
          t.objectId,
          user ? `${user.firstName} ${user.lastName}` : 'Unknown',
          `"${t.changes || ''}"`
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen">
      <Header title="Transaction Log" />

      <div className="p-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="text-[#B0B3B8] mb-2">Total Transactions</div>
            <div className="text-3xl font-bold text-white">{transactions.length}</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="text-[#B0B3B8] mb-2">Creates</div>
            <div className="text-3xl font-bold text-green-400">
              {transactions.filter(t => t.action === 'create').length}
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="text-[#B0B3B8] mb-2">Updates</div>
            <div className="text-3xl font-bold text-[#4682B4]">
              {transactions.filter(t => t.action === 'update').length}
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="text-[#B0B3B8] mb-2">Deletes</div>
            <div className="text-3xl font-bold text-red-400">
              {transactions.filter(t => t.action === 'delete').length}
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4 mb-6" data-tour="transaction-filter">
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#4682B4]"
          />
          <select
            value={objectTypeFilter}
            onChange={(e) => setObjectTypeFilter(e.target.value)}
            className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#4682B4]"
          >
            <option value="all">All Types</option>
            {objectTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#4682B4]"
          >
            <option value="all">All Actions</option>
            {actions.map(action => (
              <option key={action} value={action}>{action}</option>
            ))}
          </select>
          <button
            onClick={handleExportCSV}
            className="gradient-button px-6 py-3 rounded-lg text-white font-medium"
          >
            Export CSV
          </button>
        </div>

        {/* Transactions Table */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden" data-tour="transactions-log">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="text-left p-4 text-[#B0B3B8] font-medium">Timestamp</th>
                  <th className="text-left p-4 text-[#B0B3B8] font-medium">Object Type</th>
                  <th className="text-left p-4 text-[#B0B3B8] font-medium">Action</th>
                  <th className="text-left p-4 text-[#B0B3B8] font-medium">User</th>
                  <th className="text-left p-4 text-[#B0B3B8] font-medium">Changes</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.slice(0, 100).map((transaction) => {
                  const user = getPersonnel(transaction.userId);

                  return (
                    <tr
                      key={transaction.id}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="p-4 text-[#B0B3B8] text-sm">
                        {new Date(transaction.timestamp).toLocaleString()}
                      </td>
                      <td className="p-4">
                        <span className="inline-block px-2 py-1 rounded bg-white/10 text-white text-xs">
                          {transaction.objectType}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                          transaction.action === 'create'
                            ? 'bg-green-500/20 text-green-400'
                            : transaction.action === 'update'
                            ? 'bg-[#4682B4]/20 text-[#4682B4]'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {transaction.action}
                        </span>
                      </td>
                      <td className="p-4 text-[#B0B3B8]">
                        {user ? `${user.firstName} ${user.lastName}` : 'Unknown'}
                      </td>
                      <td className="p-4 text-[#B0B3B8] text-sm max-w-md truncate">
                        {typeof transaction.changes === 'string' ? transaction.changes : JSON.stringify(transaction.changes) || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {filteredTransactions.length > 100 && (
          <div className="mt-4 text-center text-[#B0B3B8] text-sm">
            Showing 100 of {filteredTransactions.length} transactions. Use filters to narrow results.
          </div>
        )}

        {filteredTransactions.length === 0 && (
          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-12 text-center mt-6">
            <div className="text-4xl mb-3">☲</div>
            <p className="text-[#B0B3B8]">No transactions found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
