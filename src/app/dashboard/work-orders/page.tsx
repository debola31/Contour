'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import { useStore } from '@/store/useStore';

export default function WorkOrdersPage() {
  const workOrders = useStore((state) => state.workOrders);
  const customers = useStore((state) => state.customers);
  const templates = useStore((state) => state.templates);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredOrders = filterStatus === 'all'
    ? workOrders
    : workOrders.filter((wo) => wo.status === filterStatus);

  const statusCounts = {
    requested: workOrders.filter((wo) => wo.status === 'requested').length,
    approved: workOrders.filter((wo) => wo.status === 'approved').length,
    in_progress: workOrders.filter((wo) => wo.status === 'in_progress').length,
    finished: workOrders.filter((wo) => wo.status === 'finished').length,
    rejected: workOrders.filter((wo) => wo.status === 'rejected').length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'requested': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'approved': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'in_progress': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'finished': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-white/5 text-white/60 border-white/10';
    }
  };

  return (
    <div className="min-h-screen">
      <Header title="Work Orders" />

      <div className="p-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <div className="text-yellow-400 text-sm mb-1">Requested</div>
            <div className="text-2xl font-bold text-white">{statusCounts.requested}</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <div className="text-blue-400 text-sm mb-1">Approved</div>
            <div className="text-2xl font-bold text-white">{statusCounts.approved}</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <div className="text-purple-400 text-sm mb-1">In Progress</div>
            <div className="text-2xl font-bold text-white">{statusCounts.in_progress}</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <div className="text-green-400 text-sm mb-1">Finished</div>
            <div className="text-2xl font-bold text-white">{statusCounts.finished}</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <div className="text-red-400 text-sm mb-1">Rejected</div>
            <div className="text-2xl font-bold text-white">{statusCounts.rejected}</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 mb-6">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#4682B4]"
          >
            <option value="all">All Statuses</option>
            <option value="requested">Requested</option>
            <option value="approved">Approved</option>
            <option value="in_progress">In Progress</option>
            <option value="finished">Finished</option>
            <option value="rejected">Rejected</option>
          </select>
          <button className="gradient-button px-6 py-3 rounded-lg text-white font-medium ml-auto">
            + Create Work Order
          </button>
        </div>

        {/* Work Orders List */}
        {workOrders.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-12 text-center">
            <div className="text-4xl mb-3">📋</div>
            <h3 className="text-white font-semibold mb-2">No Work Orders Yet</h3>
            <p className="text-[#B0B3B8] mb-6">
              Create your first work order to get started with production management.
            </p>
            <button className="gradient-button px-6 py-3 rounded-lg text-white font-medium">
              + Create Work Order
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const customer = customers.find((c) => c.id === order.customerId);
              const template = templates.find((t) => t.id === order.templateId);

              return (
                <div
                  key={order.id}
                  className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-[#4682B4] transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-white font-semibold text-lg mb-1">
                        Order #{order.orderNumber}
                      </h3>
                      <p className="text-[#B0B3B8] text-sm">
                        {customer?.type === 'business' ? customer.name : customer?.name || 'Unknown Customer'}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                      {order.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm mb-4">
                    <div>
                      <div className="text-[#B0B3B8] mb-1">Template</div>
                      <div className="text-white font-medium">{template?.name || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-[#B0B3B8] mb-1">Estimated Price</div>
                      <div className="text-white font-medium">${order.estimatedPrice.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-[#B0B3B8] mb-1">Requested</div>
                      <div className="text-white font-medium">
                        {new Date(order.requestedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-[#B0B3B8] mb-1">Current Station</div>
                      <div className="text-white font-medium">
                        {order.currentStations.length > 0 ? `${order.currentStations.length} active` : 'None'}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors text-sm">
                      View Details
                    </button>
                    {order.status === 'requested' && (
                      <>
                        <button className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors text-sm">
                          Approve
                        </button>
                        <button className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors text-sm">
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
