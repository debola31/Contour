'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import { useStore } from '@/store/useStore';

export default function ShippingPage() {
  const shipments = useStore((state) => state.shipments);
  const workOrders = useStore((state) => state.workOrders);
  const customers = useStore((state) => state.customers);
  const updateShipment = useStore((state) => state.updateShipment);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'label_created' | 'shipped' | 'delivered'>('all');

  const filteredShipments = shipments.filter((shipment) => {
    const matchesSearch = shipment.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || shipment.deliveryStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getWorkOrder = (workOrderId: string) => {
    return workOrders.find(wo => wo.id === workOrderId);
  };

  const getCustomer = (customerId: string) => {
    return customers.find(c => c.id === customerId);
  };

  const handleUpdateStatus = (shipmentId: string, status: 'label_created' | 'shipped' | 'delivered') => {
    updateShipment(shipmentId, { deliveryStatus: status });
  };

  const labelCreatedCount = shipments.filter(s => s.deliveryStatus === 'label_created').length;
  const shippedCount = shipments.filter(s => s.deliveryStatus === 'shipped').length;
  const deliveredCount = shipments.filter(s => s.deliveryStatus === 'delivered').length;

  return (
    <div className="min-h-screen">
      <Header title="Shipping & Delivery" />

      <div className="p-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="text-[#B0B3B8] mb-2">Total Shipments</div>
            <div className="text-3xl font-bold text-white">{shipments.length}</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="text-[#B0B3B8] mb-2">Label Created</div>
            <div className="text-3xl font-bold text-yellow-500">{labelCreatedCount}</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="text-[#B0B3B8] mb-2">In Transit</div>
            <div className="text-3xl font-bold text-[#4682B4]">{shippedCount}</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="text-[#B0B3B8] mb-2">Delivered</div>
            <div className="text-3xl font-bold text-green-400">{deliveredCount}</div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4 mb-6" data-tour="shipment-filter">
          <input
            type="text"
            placeholder="Search by tracking number..."
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
            <option value="label_created">Label Created</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
          </select>
        </div>

        {/* Shipments Table */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden" data-tour="shipments-table">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="text-left p-4 text-[#B0B3B8] font-medium">Tracking #</th>
                  <th className="text-left p-4 text-[#B0B3B8] font-medium">Customer</th>
                  <th className="text-left p-4 text-[#B0B3B8] font-medium">Work Order</th>
                  <th className="text-left p-4 text-[#B0B3B8] font-medium">Shipping Address</th>
                  <th className="text-left p-4 text-[#B0B3B8] font-medium">Status</th>
                  <th className="text-left p-4 text-[#B0B3B8] font-medium">Shipped Date</th>
                  <th className="text-left p-4 text-[#B0B3B8] font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredShipments.map((shipment) => {
                  const workOrder = getWorkOrder(shipment.workOrderId);
                  const customer = getCustomer(shipment.customerId);

                  return (
                    <tr
                      key={shipment.id}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="p-4">
                        <span className="text-white font-medium">{shipment.trackingNumber}</span>
                      </td>
                      <td className="p-4 text-[#B0B3B8]">{customer?.name || 'Unknown'}</td>
                      <td className="p-4 text-[#B0B3B8]">{workOrder?.orderNumber || 'N/A'}</td>
                      <td className="p-4 text-[#B0B3B8] max-w-xs truncate">
                        {shipment.shippingAddress}
                      </td>
                      <td className="p-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                          shipment.deliveryStatus === 'delivered'
                            ? 'bg-green-500/20 text-green-400'
                            : shipment.deliveryStatus === 'shipped'
                            ? 'bg-[#4682B4]/20 text-[#4682B4]'
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {shipment.deliveryStatus === 'label_created' ? 'Label Created' : shipment.deliveryStatus === 'shipped' ? 'In Transit' : 'Delivered'}
                        </span>
                      </td>
                      <td className="p-4 text-[#B0B3B8]">
                        {shipment.shippedAt ? new Date(shipment.shippedAt).toLocaleDateString() : '-'}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              // Label generation placeholder
                              alert('Shipping label PDF generation coming soon!');
                            }}
                            className="px-3 py-1 bg-white/5 hover:bg-white/10 text-white rounded transition-colors text-sm"
                          >
                            Label
                          </button>
                          {shipment.deliveryStatus === 'label_created' && (
                            <button
                              onClick={() => handleUpdateStatus(shipment.id, 'shipped')}
                              className="px-3 py-1 bg-[#4682B4]/20 hover:bg-[#4682B4]/30 text-[#4682B4] rounded transition-colors text-sm"
                            >
                              Mark Shipped
                            </button>
                          )}
                          {shipment.deliveryStatus === 'shipped' && (
                            <button
                              onClick={() => handleUpdateStatus(shipment.id, 'delivered')}
                              className="px-3 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded transition-colors text-sm"
                            >
                              Mark Delivered
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

        {filteredShipments.length === 0 && (
          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-12 text-center mt-6">
            <div className="text-4xl mb-3">⛟</div>
            <p className="text-[#B0B3B8]">No shipments found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
