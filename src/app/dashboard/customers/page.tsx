'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import { useStore } from '@/store/useStore';
import { Customer } from '@/types';

export default function CustomersPage() {
  const customers = useStore((state) => state.customers);
  const updateCustomer = useStore((state) => state.updateCustomer);
  const deleteCustomer = useStore((state) => state.deleteCustomer);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'business' | 'individual'>('all');
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Customer | null>(null);

  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      (c.type === 'business' && c.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.type === 'individual' && c.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === 'all' || c.type === filterType;
    return matchesSearch && matchesType;
  });

  const businessCount = customers.filter((c) => c.type === 'business').length;
  const individualCount = customers.filter((c) => c.type === 'individual').length;

  return (
    <div className="min-h-screen">
      <Header title="Customers" />

      <div className="p-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="text-[#B0B3B8] mb-2">Total Customers</div>
            <div className="text-3xl font-bold text-white">{customers.length}</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="text-[#B0B3B8] mb-2">Business Customers</div>
            <div className="text-3xl font-bold text-[#4682B4]">{businessCount}</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="text-[#B0B3B8] mb-2">Individual Customers</div>
            <div className="text-3xl font-bold text-[#6FA3D8]">{individualCount}</div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4 mb-6">
          <input
            type="text"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#4682B4]"
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#4682B4]"
          >
            <option value="all">All Types</option>
            <option value="business">Business</option>
            <option value="individual">Individual</option>
          </select>
          <button className="gradient-button px-6 py-3 rounded-lg text-white font-medium">
            + Add Customer
          </button>
        </div>

        {/* Customers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((customer) => (
            <div
              key={customer.id}
              className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-[#4682B4] transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                    customer.type === 'business'
                      ? 'bg-[#4682B4]/20 text-white'
                      : 'bg-[#6FA3D8]/20 text-white'
                  }`}>
                    {customer.type === 'business' ? '⌂ Business' : '⚇ Individual'}
                  </span>
                </div>
              </div>

              <h3 className="text-white font-semibold text-lg mb-3">{customer.name}</h3>

              {customer.type === 'business' ? (
                <div className="space-y-2 text-sm">
                  <div className="text-[#B0B3B8]">
                    <span className="font-medium">Contact:</span> {customer.contactPersonName}
                  </div>
                  <div className="text-[#B0B3B8]">
                    <span className="font-medium">Phone:</span> {customer.contactPersonPhone}
                  </div>
                  <div className="text-[#B0B3B8] truncate">
                    <span className="font-medium">Email:</span> {customer.contactPersonEmail}
                  </div>
                  <div className="text-[#B0B3B8] text-xs mt-3">
                    📍 {customer.address}
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-sm">
                  <div className="text-[#B0B3B8]">
                    <span className="font-medium">Phone:</span> {customer.phone}
                  </div>
                  <div className="text-[#B0B3B8] truncate">
                    <span className="font-medium">Email:</span> {customer.email}
                  </div>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-white/10 flex gap-2">
                <button
                  onClick={() => setEditingCustomer(customer)}
                  className="flex-1 px-3 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => setDeleteConfirm(customer)}
                  className="flex-1 px-3 py-2 bg-white/5 hover:bg-red-500/20 text-white hover:text-red-400 rounded-lg transition-colors text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredCustomers.length === 0 && (
          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-12 text-center">
            <div className="text-4xl mb-3">⚇</div>
            <p className="text-[#B0B3B8]">No customers found matching your search.</p>
          </div>
        )}

        {/* Edit Customer Modal */}
        {editingCustomer && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#111439] rounded-xl p-6 w-full max-w-2xl border border-white/10">
              <h2 className="text-xl font-semibold text-white mb-4">Edit Customer</h2>

              {editingCustomer.type === 'business' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[#B0B3B8] mb-2">Business Name *</label>
                    <input
                      type="text"
                      value={editingCustomer.name}
                      onChange={(e) => setEditingCustomer({ ...editingCustomer, name: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#4682B4]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[#B0B3B8] mb-2">Contact Person *</label>
                      <input
                        type="text"
                        value={editingCustomer.contactPersonName}
                        onChange={(e) => setEditingCustomer({ ...editingCustomer, contactPersonName: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#4682B4]"
                      />
                    </div>
                    <div>
                      <label className="block text-[#B0B3B8] mb-2">Phone *</label>
                      <input
                        type="tel"
                        value={editingCustomer.contactPersonPhone}
                        onChange={(e) => setEditingCustomer({ ...editingCustomer, contactPersonPhone: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#4682B4]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#B0B3B8] mb-2">Email *</label>
                    <input
                      type="email"
                      value={editingCustomer.contactPersonEmail}
                      onChange={(e) => setEditingCustomer({ ...editingCustomer, contactPersonEmail: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#4682B4]"
                    />
                  </div>

                  <div>
                    <label className="block text-[#B0B3B8] mb-2">Address *</label>
                    <textarea
                      value={editingCustomer.address}
                      onChange={(e) => setEditingCustomer({ ...editingCustomer, address: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#4682B4]"
                      rows={3}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[#B0B3B8] mb-2">Full Name *</label>
                    <input
                      type="text"
                      value={editingCustomer.name}
                      onChange={(e) => setEditingCustomer({ ...editingCustomer, name: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#4682B4]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[#B0B3B8] mb-2">Phone *</label>
                      <input
                        type="tel"
                        value={editingCustomer.phone}
                        onChange={(e) => setEditingCustomer({ ...editingCustomer, phone: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#4682B4]"
                      />
                    </div>
                    <div>
                      <label className="block text-[#B0B3B8] mb-2">Email *</label>
                      <input
                        type="email"
                        value={editingCustomer.email}
                        onChange={(e) => setEditingCustomer({ ...editingCustomer, email: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#4682B4]"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setEditingCustomer(null)}
                  className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    updateCustomer(editingCustomer.id, editingCustomer);
                    setEditingCustomer(null);
                  }}
                  className="flex-1 gradient-button px-4 py-3 rounded-lg text-white"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#111439] rounded-xl p-6 w-full max-w-md border border-white/10">
              <h2 className="text-xl font-semibold text-white mb-4">Delete Customer</h2>

              <p className="text-[#B0B3B8] mb-6">
                Are you sure you want to delete <span className="text-white font-semibold">{deleteConfirm.name}</span>? This action cannot be undone.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    deleteCustomer(deleteConfirm.id);
                    setDeleteConfirm(null);
                  }}
                  className="flex-1 px-4 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
