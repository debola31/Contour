'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import { useStore } from '@/store/useStore';

export default function InvoicesPage() {
  const invoices = useStore((state) => state.invoices);
  const workOrders = useStore((state) => state.workOrders);
  const customers = useStore((state) => state.customers);
  const updateInvoice = useStore((state) => state.updateInvoice);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'unpaid'>('all');

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch = invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'paid' && invoice.status === 'paid') ||
      (statusFilter === 'unpaid' && invoice.status === 'unpaid');
    return matchesSearch && matchesStatus;
  });

  const getWorkOrder = (workOrderId: string) => {
    return workOrders.find(wo => wo.id === workOrderId);
  };

  const getCustomer = (customerId: string) => {
    return customers.find(c => c.id === customerId);
  };

  const getDaysUnpaid = (invoice: typeof invoices[0]) => {
    if (invoice.status === 'paid') return 0;
    const dueDate = new Date(invoice.dueDate);
    const today = new Date();
    const diffTime = today.getTime() - dueDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const handleMarkPaid = (invoiceId: string) => {
    updateInvoice(invoiceId, {
      status: 'paid',
      paidAt: new Date().toISOString(),
    });
  };

  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const paidRevenue = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0);
  const unpaidRevenue = invoices.filter(inv => inv.status === 'unpaid').reduce((sum, inv) => sum + inv.amount, 0);
  const overdueCount = invoices.filter(inv => inv.status === 'unpaid' && getDaysUnpaid(inv) > 0).length;

  return (
    <div className="min-h-screen">
      <Header title="Invoices" />

      <div className="p-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="text-[#B0B3B8] mb-2">Total Revenue</div>
            <div className="text-3xl font-bold text-white">${totalRevenue.toLocaleString()}</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="text-[#B0B3B8] mb-2">Paid</div>
            <div className="text-3xl font-bold text-green-400">${paidRevenue.toLocaleString()}</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="text-[#B0B3B8] mb-2">Unpaid</div>
            <div className="text-3xl font-bold text-yellow-500">${unpaidRevenue.toLocaleString()}</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="text-[#B0B3B8] mb-2">Overdue</div>
            <div className="text-3xl font-bold text-red-400">{overdueCount}</div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4 mb-6">
          <input
            type="text"
            placeholder="Search by invoice number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#4682B4]"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#4682B4]"
          >
            <option value="all">All Status</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
          </select>
        </div>

        {/* Invoices Table */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="text-left p-4 text-[#B0B3B8] font-medium">Invoice #</th>
                  <th className="text-left p-4 text-[#B0B3B8] font-medium">Customer</th>
                  <th className="text-left p-4 text-[#B0B3B8] font-medium">Work Order</th>
                  <th className="text-left p-4 text-[#B0B3B8] font-medium">Amount</th>
                  <th className="text-left p-4 text-[#B0B3B8] font-medium">Status</th>
                  <th className="text-left p-4 text-[#B0B3B8] font-medium">Issued</th>
                  <th className="text-left p-4 text-[#B0B3B8] font-medium">Due Date</th>
                  <th className="text-left p-4 text-[#B0B3B8] font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((invoice) => {
                  const workOrder = getWorkOrder(invoice.workOrderId);
                  const customer = getCustomer(invoice.customerId);
                  const daysUnpaid = getDaysUnpaid(invoice);
                  const isOverdue = invoice.status === 'unpaid' && daysUnpaid > 0;

                  return (
                    <tr
                      key={invoice.id}
                      className={`border-b border-white/5 hover:bg-white/5 transition-colors ${
                        isOverdue ? 'bg-red-500/5' : ''
                      }`}
                    >
                      <td className="p-4">
                        <span className="text-white font-medium">{invoice.invoiceNumber}</span>
                      </td>
                      <td className="p-4 text-[#B0B3B8]">{customer?.name || 'Unknown'}</td>
                      <td className="p-4 text-[#B0B3B8]">{workOrder?.orderNumber || 'N/A'}</td>
                      <td className="p-4">
                        <span className="text-white font-semibold">${invoice.amount.toLocaleString()}</span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                          invoice.status === 'paid'
                            ? 'bg-green-500/20 text-green-400'
                            : isOverdue
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {invoice.status === 'paid' ? 'Paid' : isOverdue ? `Overdue (${daysUnpaid}d)` : 'Unpaid'}
                        </span>
                      </td>
                      <td className="p-4 text-[#B0B3B8]">
                        {new Date(invoice.issuedAt).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-[#B0B3B8]">
                        {new Date(invoice.dueDate).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              // PDF download functionality placeholder
                              alert('PDF generation coming soon!');
                            }}
                            className="px-3 py-1 bg-white/5 hover:bg-white/10 text-white rounded transition-colors text-sm"
                          >
                            PDF
                          </button>
                          {invoice.status === 'unpaid' && (
                            <button
                              onClick={() => handleMarkPaid(invoice.id)}
                              className="px-3 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded transition-colors text-sm"
                            >
                              Mark Paid
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {filteredInvoices.length === 0 && (
          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-12 text-center mt-6">
            <div className="text-4xl mb-3">⚖</div>
            <p className="text-[#B0B3B8]">No invoices found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
