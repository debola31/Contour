'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import { useStore } from '@/store/useStore';

export default function WorkOrdersPage() {
  const currentUser = useStore((state) => state.currentUser);
  const workOrders = useStore((state) => state.workOrders);
  const customers = useStore((state) => state.customers);
  const templates = useStore((state) => state.templates);
  const personnel = useStore((state) => state.personnel);
  const approveWorkOrder = useStore((state) => state.approveWorkOrder);
  const rejectWorkOrder = useStore((state) => state.rejectWorkOrder);
  const addWorkOrder = useStore((state) => state.addWorkOrder);

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [rejectionReason, setRejectionReason] = useState('');

  const [newOrder, setNewOrder] = useState({
    templateId: '',
    customerId: '',
    estimatedPrice: 0,
  });

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

  const handleApprove = (orderId: string) => {
    if (currentUser?.role === 'owner') {
      approveWorkOrder(orderId, currentUser.id);
    }
  };

  const handleReject = () => {
    if (currentUser?.role === 'owner' && selectedOrderId) {
      rejectWorkOrder(selectedOrderId, currentUser.id, rejectionReason);
      setShowRejectModal(false);
      setSelectedOrderId('');
      setRejectionReason('');
    }
  };

  const handleCreateWorkOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser && newOrder.templateId && newOrder.customerId) {
      const template = templates.find(t => t.id === newOrder.templateId);
      const orderNumber = `WO-${new Date().getFullYear()}-${String(workOrders.length + 1).padStart(5, '0')}`;

      addWorkOrder({
        id: `wo-${Date.now()}`,
        orderNumber,
        templateId: newOrder.templateId,
        customerId: newOrder.customerId,
        salesPersonId: currentUser.id,
        status: 'requested',
        currentStations: [],
        stationHistory: [],
        estimatedPrice: newOrder.estimatedPrice || template?.estimatedCost || 0,
        requestedAt: new Date().toISOString(),
        activeFlowPositions: [],
      });

      setShowCreateModal(false);
      setNewOrder({ templateId: '', customerId: '', estimatedPrice: 0 });
    }
  };

  return (
    <div className="min-h-screen">
      <Header title="Work Orders" />

      <div className="p-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
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
          <button
            onClick={() => setShowCreateModal(true)}
            className="gradient-button px-6 py-3 rounded-lg text-white font-medium ml-auto"
          >
            + Create Work Order
          </button>
        </div>

        {/* Work Orders List */}
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const customer = customers.find((c) => c.id === order.customerId);
            const template = templates.find((t) => t.id === order.templateId);
            const salesPerson = personnel.find((p) => p.id === order.salesPersonId);

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
                    <div className="text-[#B0B3B8] mb-1">Sales Person</div>
                    <div className="text-white font-medium">{salesPerson?.firstName} {salesPerson?.lastName}</div>
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
                </div>

                {order.rejectionReason && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <div className="text-red-400 text-sm font-medium mb-1">Rejection Reason:</div>
                    <div className="text-white/80 text-sm">{order.rejectionReason}</div>
                  </div>
                )}

                <div className="flex gap-2">
                  {order.status === 'requested' && currentUser?.role === 'owner' && (
                    <>
                      <button
                        onClick={() => handleApprove(order.id)}
                        className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors text-sm font-medium"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          setSelectedOrderId(order.id);
                          setShowRejectModal(true);
                        }}
                        className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors text-sm font-medium"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  <button className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors text-sm font-medium">
                    View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredOrders.length === 0 && (
          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-12 text-center">
            <div className="text-4xl mb-3">☰</div>
            <p className="text-[#B0B3B8]">No work orders found.</p>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111439] rounded-2xl p-8 max-w-md w-full border border-white/20 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-white mb-6">Create Work Order</h3>
            <form onSubmit={handleCreateWorkOrder} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#B0B3B8] mb-2">Template</label>
                <select
                  value={newOrder.templateId}
                  onChange={(e) => setNewOrder({...newOrder, templateId: e.target.value})}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#4682B4]"
                  required
                >
                  <option value="">Select Template</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#B0B3B8] mb-2">Customer</label>
                <select
                  value={newOrder.customerId}
                  onChange={(e) => setNewOrder({...newOrder, customerId: e.target.value})}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#4682B4]"
                  required
                >
                  <option value="">Select Customer</option>
                  {customers.slice(0, 20).map(c => (
                    <option key={c.id} value={c.id}>
                      {c.type === 'business' ? c.name : c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#B0B3B8] mb-2">Estimated Price (optional)</label>
                <input
                  type="number"
                  value={newOrder.estimatedPrice || ''}
                  onChange={(e) => setNewOrder({...newOrder, estimatedPrice: parseFloat(e.target.value)})}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#4682B4]"
                  placeholder="Leave blank to use template default"
                />
              </div>
              <div className="flex gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 gradient-button px-6 py-3 rounded-lg text-white font-semibold"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111439] rounded-2xl p-8 max-w-md w-full border border-white/20">
            <h3 className="text-2xl font-bold text-white mb-6">Reject Work Order</h3>
            <div className="mb-6">
              <label className="block text-sm font-medium text-[#B0B3B8] mb-2">Reason (optional)</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#4682B4]"
                rows={4}
                placeholder="Enter reason for rejection..."
              />
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedOrderId('');
                  setRejectionReason('');
                }}
                className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="flex-1 bg-red-500/20 hover:bg-red-500/30 px-6 py-3 rounded-lg text-red-400 font-semibold transition-colors"
              >
                Reject Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
