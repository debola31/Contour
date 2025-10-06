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
  const stations = useStore((state) => state.stations);
  const approveWorkOrder = useStore((state) => state.approveWorkOrder);
  const rejectWorkOrder = useStore((state) => state.rejectWorkOrder);
  const addWorkOrder = useStore((state) => state.addWorkOrder);

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [detailsView, setDetailsView] = useState<'list' | 'diagram'>('list');

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
                  <button
                    onClick={() => {
                      setSelectedOrderId(order.id);
                      setShowDetailsModal(true);
                      setDetailsView('list');
                    }}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors text-sm font-medium"
                  >
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

      {/* Details Modal */}
      {showDetailsModal && selectedOrderId && (() => {
        const order = workOrders.find(wo => wo.id === selectedOrderId);
        if (!order) return null;

        const customer = customers.find(c => c.id === order.customerId);
        const template = templates.find(t => t.id === order.templateId);
        const salesPerson = personnel.find(p => p.id === order.salesPersonId);
        const approver = order.approvedBy ? personnel.find(p => p.id === order.approvedBy) : null;

        return (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-[#1a1f3a] rounded-xl border border-white/10 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#1a1f3a] z-10">
                <div>
                  <h2 className="text-2xl font-semibold text-white">Order #{order.orderNumber}</h2>
                  <p className="text-[#B0B3B8] text-sm mt-1">
                    {customer?.type === 'business' ? customer.name : customer?.name || 'Unknown Customer'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedOrderId('');
                  }}
                  className="text-white/60 hover:text-white transition-colors text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* View Toggle Tabs */}
                <div className="flex items-center gap-4 border-b border-white/10 pb-4">
                  <button
                    onClick={() => setDetailsView('list')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      detailsView === 'list'
                        ? 'bg-[#4682B4] text-white'
                        : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                      List View
                    </span>
                  </button>
                  <button
                    onClick={() => setDetailsView('diagram')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      detailsView === 'diagram'
                        ? 'bg-[#4682B4] text-white'
                        : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                      Flow Diagram
                    </span>
                  </button>
                </div>

                {detailsView === 'list' ? (
                  <>
                    {/* Status Badge */}
                    <div className="flex items-center gap-3">
                      <span className={`px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(order.status)}`}>
                        {order.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>

                {/* Order Information */}
                <div className="bg-white/5 rounded-lg p-5 space-y-4">
                  <h3 className="text-white font-semibold text-lg mb-3">Order Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-[#B0B3B8] text-sm mb-1">Template</div>
                      <div className="text-white font-medium">{template?.name || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-[#B0B3B8] text-sm mb-1">Sales Person</div>
                      <div className="text-white font-medium">
                        {salesPerson?.firstName} {salesPerson?.lastName}
                      </div>
                    </div>
                    <div>
                      <div className="text-[#B0B3B8] text-sm mb-1">Estimated Price</div>
                      <div className="text-white font-medium">${order.estimatedPrice.toLocaleString()}</div>
                    </div>
                    {order.actualPrice && (
                      <div>
                        <div className="text-[#B0B3B8] text-sm mb-1">Actual Price</div>
                        <div className="text-white font-medium">${order.actualPrice.toLocaleString()}</div>
                      </div>
                    )}
                    <div>
                      <div className="text-[#B0B3B8] text-sm mb-1">Requested</div>
                      <div className="text-white font-medium">
                        {new Date(order.requestedAt).toLocaleString()}
                      </div>
                    </div>
                    {order.approvedAt && approver && (
                      <div>
                        <div className="text-[#B0B3B8] text-sm mb-1">Approved By</div>
                        <div className="text-white font-medium">
                          {approver.firstName} {approver.lastName}
                          <div className="text-xs text-[#B0B3B8] mt-0.5">
                            {new Date(order.approvedAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    )}
                    {order.finishedAt && (
                      <div>
                        <div className="text-[#B0B3B8] text-sm mb-1">Finished</div>
                        <div className="text-white font-medium">
                          {new Date(order.finishedAt).toLocaleString()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Workflow Progress - All Stations from Template */}
                {template && (
                  <div className="bg-white/5 rounded-lg p-5">
                    <h3 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                      Workflow Progress
                    </h3>
                    <div className="space-y-2">
                      {template.flow.nodes
                        .filter(node => node.type === 'station' && node.stationId)
                        .map((node) => {
                          const stationId = node.stationId!;
                          const station = stations.find(s => s.id === stationId);
                          const isCompleted = order.stationHistory?.some(h => h.stationId === stationId && h.completedAt);
                          const isInProgress = order.currentStations?.includes(stationId);
                          const isPending = !isCompleted && !isInProgress;

                          const completedHistory = order.stationHistory?.find(h => h.stationId === stationId && h.completedAt);
                          const operator = completedHistory ? personnel.find(p => p.id === completedHistory.operatorId) : null;

                          return (
                            <div
                              key={node.id}
                              className={`rounded-lg p-4 border-l-4 ${
                                isCompleted
                                  ? 'bg-green-500/10 border-green-500'
                                  : isInProgress
                                  ? 'bg-purple-500/10 border-purple-500'
                                  : 'bg-white/5 border-gray-500/30'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                {isCompleted && (
                                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </div>
                                )}
                                {isInProgress && (
                                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse flex-shrink-0"></div>
                                )}
                                {isPending && (
                                  <div className="w-6 h-6 rounded-full border-2 border-gray-500/30 flex-shrink-0"></div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <div className={`font-medium ${
                                      isCompleted ? 'text-green-400' : isInProgress ? 'text-purple-400' : 'text-gray-400'
                                    }`}>
                                      {station?.name || node.data.label}
                                    </div>
                                    {isCompleted && (
                                      <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded">
                                        Completed
                                      </span>
                                    )}
                                    {isInProgress && (
                                      <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded animate-pulse">
                                        In Progress
                                      </span>
                                    )}
                                    {isPending && (
                                      <span className="text-xs px-2 py-0.5 bg-gray-500/20 text-gray-400 rounded">
                                        Pending
                                      </span>
                                    )}
                                  </div>
                                  {station?.description && (
                                    <div className="text-[#B0B3B8] text-sm mt-1">{station.description}</div>
                                  )}
                                  {isCompleted && operator && (
                                    <div className="text-xs text-[#B0B3B8] mt-1">
                                      Completed by {operator.firstName} {operator.lastName}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Station History */}
                {order.stationHistory && order.stationHistory.length > 0 && (
                  <div className="bg-white/5 rounded-lg p-5">
                    <h3 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Station History
                    </h3>
                    <div className="space-y-3">
                      {order.stationHistory.map((history, index) => {
                        const station = stations.find(s => s.id === history.stationId);
                        const operator = personnel.find(p => p.id === history.operatorId);
                        const duration = history.completedAt
                          ? Math.round((new Date(history.completedAt).getTime() - new Date(history.startedAt).getTime()) / 1000 / 60)
                          : null;

                        return (
                          <div key={index} className="bg-white/5 rounded-lg p-4 border-l-4 border-green-500">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <div className="text-white font-medium">{station?.name || history.stationId}</div>
                                <div className="text-[#B0B3B8] text-sm">
                                  Operator: {operator?.firstName} {operator?.lastName}
                                </div>
                              </div>
                              {history.completedAt && duration !== null && (
                                <div className="text-green-400 text-sm font-medium">
                                  ✓ {duration} min
                                </div>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-xs">
                              <div>
                                <div className="text-[#B0B3B8]">Started</div>
                                <div className="text-white">{new Date(history.startedAt).toLocaleString()}</div>
                              </div>
                              {history.completedAt && (
                                <div>
                                  <div className="text-[#B0B3B8]">Completed</div>
                                  <div className="text-white">{new Date(history.completedAt).toLocaleString()}</div>
                                </div>
                              )}
                            </div>
                            {history.materialsUsed && history.materialsUsed.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-white/10">
                                <div className="text-[#B0B3B8] text-xs mb-1">Materials Used:</div>
                                <div className="flex flex-wrap gap-2">
                                  {history.materialsUsed.map((mat, i) => (
                                    <span key={i} className="text-xs bg-white/10 px-2 py-1 rounded text-white">
                                      {mat.materialId} × {mat.quantity}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Rejection Reason */}
                {order.rejectionReason && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-5">
                    <h3 className="text-red-400 font-semibold text-lg mb-2">Rejection Reason</h3>
                    <p className="text-white/80">{order.rejectionReason}</p>
                    {order.rejectedAt && (
                      <p className="text-[#B0B3B8] text-sm mt-2">
                        Rejected on {new Date(order.rejectedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}
                  </>
                ) : (
                  /* Flow Diagram View */
                  <div className="bg-white/5 rounded-lg p-6">
                    <h3 className="text-white font-semibold text-lg mb-6">Workflow Flow Diagram</h3>
                    {template && template.flow.nodes.length > 0 ? (
                      <div className="relative bg-[#111439] rounded-lg p-8" style={{ minHeight: '500px' }}>
                        {/* Draw edges first (so they appear behind nodes) */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none">
                          {template.flow.edges.map(edge => {
                            const sourceNode = template.flow.nodes.find(n => n.id === edge.source);
                            const targetNode = template.flow.nodes.find(n => n.id === edge.target);
                            if (!sourceNode || !targetNode) return null;

                            const x1 = sourceNode.position.x + 60;
                            const y1 = sourceNode.position.y + 40;
                            const x2 = targetNode.position.x + 60;
                            const y2 = targetNode.position.y + 40;

                            // Check if this edge is in the current progress path
                            const isCompleted = order.stationHistory?.some(h =>
                              h.stationId === sourceNode.stationId && h.completedAt
                            );

                            return (
                              <line
                                key={edge.id}
                                x1={x1}
                                y1={y1}
                                x2={x2}
                                y2={y2}
                                stroke={isCompleted ? '#10b981' : '#4682B4'}
                                strokeWidth="2"
                                markerEnd="url(#arrowhead-detail)"
                              />
                            );
                          })}
                          <defs>
                            <marker
                              id="arrowhead-detail"
                              markerWidth="10"
                              markerHeight="10"
                              refX="9"
                              refY="3"
                              orient="auto"
                            >
                              <polygon points="0 0, 10 3, 0 6" fill="#4682B4" />
                            </marker>
                          </defs>
                        </svg>

                        {/* Draw nodes */}
                        {template.flow.nodes.map(node => {
                          const station = stations.find(s => s.id === node.stationId);
                          const isCompleted = order.stationHistory?.some(h => h.stationId === node.stationId && h.completedAt);
                          const isInProgress = order.currentStations?.includes(node.stationId || '');
                          const isPending = !isCompleted && !isInProgress;

                          return (
                            <div
                              key={node.id}
                              className={`absolute rounded-lg p-3 text-center transition-all border-2 ${
                                isCompleted
                                  ? 'bg-green-500 text-white border-green-600'
                                  : isInProgress
                                  ? 'bg-purple-500 text-white border-purple-600 animate-pulse'
                                  : 'bg-blue-500 text-white border-blue-600 opacity-50'
                              }`}
                              style={{
                                left: node.position.x,
                                top: node.position.y,
                                width: '120px'
                              }}
                            >
                              <div className="text-xs font-bold">
                                {station?.name || node.data.label}
                              </div>
                              {isCompleted && (
                                <div className="text-xs mt-1">✓ Complete</div>
                              )}
                              {isInProgress && (
                                <div className="text-xs mt-1">● In Progress</div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-[#B0B3B8]">
                        No workflow diagram available for this template
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-white/10 sticky bottom-0 bg-[#1a1f3a]">
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedOrderId('');
                  }}
                  className="w-full px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
