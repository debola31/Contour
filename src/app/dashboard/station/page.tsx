'use client';

import { useState, useMemo } from 'react';
import Header from '@/components/Header';
import { useStore } from '@/store/useStore';
import { WorkOrder } from '@/types';

export default function StationWorkflowPage() {
  const currentUser = useStore((state) => state.currentUser);
  const workOrders = useStore((state) => state.workOrders);
  const stations = useStore((state) => state.stations);
  const materials = useStore((state) => state.materials);
  const templates = useStore((state) => state.templates);
  const startWorkOrderAtStation = useStore((state) => state.startWorkOrderAtStation);
  const completeStationWork = useStore((state) => state.completeStationWork);

  const [workOrderNumber, setWorkOrderNumber] = useState('');
  const [currentWorkOrder, setCurrentWorkOrder] = useState<WorkOrder | null>(null);
  const [currentStation, setCurrentStation] = useState<string>('');
  const [materialsUsed, setMaterialsUsed] = useState<Record<string, number>>({});
  const [stationSearch, setStationSearch] = useState('');

  // Filter stations based on search
  const filteredStations = useMemo(() => {
    if (!stationSearch) return stations;
    const search = stationSearch.toLowerCase();
    return stations.filter(s =>
      s.name.toLowerCase().includes(search) ||
      s.id.toLowerCase().includes(search) ||
      s.description?.toLowerCase().includes(search)
    );
  }, [stations, stationSearch]);

  // Check if current station is the next station for the work order
  const isNextStation = (wo: WorkOrder): boolean => {
    const template = templates.find(t => t.id === wo.templateId);
    if (!template) return false;

    // If work order is approved (not started), check if current station is a starting station
    if (wo.status === 'approved') {
      const startingNodes = template.flow.nodes.filter(node =>
        !template.flow.edges.some(edge => edge.target === node.id)
      );
      return startingNodes.some(node => node.stationId === currentStation);
    }

    // If work order is in progress, check if current station is in the currentStations array
    if (wo.status === 'in_progress') {
      // Check if this station is in the current active stations for this work order
      return wo.currentStations.includes(currentStation || '');
    }

    return false;
  };

  const handleScanWorkOrder = () => {
    if (!currentStation) {
      alert('Please select a station first before scanning a work order.');
      return;
    }

    const trimmedInput = workOrderNumber.trim();
    const wo = workOrders.find(w =>
      w.id === trimmedInput ||
      w.orderNumber === trimmedInput ||
      w.id.includes(trimmedInput) ||
      w.orderNumber.includes(trimmedInput)
    );

    if (!wo) {
      alert(`Work Order "${trimmedInput}" not found. Please check the order number.`);
      return;
    }

    // Check status
    if (wo.status !== 'approved' && wo.status !== 'in_progress') {
      alert(`Work Order ${wo.orderNumber} is not available for processing. Current status: ${wo.status}`);
      return;
    }

    // Check if current station is the next station in the workflow
    if (!isNextStation(wo)) {
      const template = templates.find(t => t.id === wo.templateId);
      const station = stations.find(s => s.id === currentStation);
      alert(`Station "${station?.name}" is not the next station in the workflow for Work Order ${wo.orderNumber}. Please check the workflow or select the correct station.`);
      return;
    }

    setCurrentWorkOrder(wo);
  };

  const getCurrentStep = () => {
    if (!currentWorkOrder || !currentStation) return null;
    const template = templates.find(t => t.id === currentWorkOrder.templateId);
    if (!template) return null;

    const node = template.flow.nodes.find(n => n.stationId === currentStation);
    return node;
  };

  const handleStartWork = () => {
    if (currentWorkOrder && currentStation && currentUser) {
      startWorkOrderAtStation(currentWorkOrder.id, currentStation, currentUser.id);
      setCurrentWorkOrder({ ...currentWorkOrder, status: 'in_progress' });
    }
  };

  const handleCompleteStep = () => {
    if (currentWorkOrder && currentStation) {
      completeStationWork(currentWorkOrder.id, currentStation, materialsUsed);
      setCurrentWorkOrder(null);
      setWorkOrderNumber('');
      setMaterialsUsed({});
    }
  };

  const currentStep = getCurrentStep();
  const station = stations.find(s => s.id === currentStation);

  if (currentUser?.role !== 'operator') {
    return (
      <div className="min-h-screen">
        <Header title="Station Workflow" />
        <div className="p-6">
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-12 text-center">
            <svg className="w-16 h-16 mx-auto mb-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-red-400 font-semibold mb-2">Access Denied</p>
            <p className="text-white/80">This page is only accessible to operators.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header title="Station Workflow" />

      <div className="p-6 max-w-6xl mx-auto">
        {/* Station Selection */}
        <div className="mb-6 bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10" data-tour="station-selector">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Select Your Station</h2>
            {currentStation && (
              <button
                onClick={() => {
                  setCurrentStation('');
                  setStationSearch('');
                }}
                className="text-sm px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded transition-colors"
              >
                Change Station
              </button>
            )}
          </div>

          {!currentStation ? (
            <>
              {/* Search Input */}
              <input
                type="text"
                value={stationSearch}
                onChange={(e) => setStationSearch(e.target.value)}
                placeholder="Search stations by name, ID, or description..."
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#4682B4] mb-4"
              />

              {/* Station Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                {filteredStations.map((station) => (
                  <button
                    key={station.id}
                    onClick={() => {
                      setCurrentStation(station.id);
                      setStationSearch('');
                    }}
                    className="p-4 rounded-lg border-2 border-white/10 bg-white/5 hover:border-[#4682B4] hover:bg-[#4682B4]/20 transition-all text-left group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-white font-semibold group-hover:text-[#4682B4] transition-colors">
                          {station.name}
                        </h3>
                        <p className="text-[#B0B3B8] text-xs mt-1">{station.id}</p>
                      </div>
                      <svg className="w-5 h-5 text-white/40 group-hover:text-[#4682B4] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </div>
                    <p className="text-[#B0B3B8] text-sm">{station.description}</p>
                  </button>
                ))}
                {filteredStations.length === 0 && (
                  <div className="col-span-full text-center py-8 text-[#B0B3B8]">
                    No stations found matching &quot;{stationSearch}&quot;
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-gradient-to-r from-[#4682B4]/20 to-purple-500/20 rounded-lg p-6 border border-[#4682B4]/30">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-[#4682B4] flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white mb-1">{stations.find(s => s.id === currentStation)?.name}</h3>
                  <p className="text-[#B0B3B8]">{stations.find(s => s.id === currentStation)?.description}</p>
                  <p className="text-[#B0B3B8] text-sm mt-1">Station ID: {currentStation}</p>
                </div>
                <div className="text-green-400">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          )}
        </div>

        {!currentWorkOrder ? (
          <>
            {/* Work Order Scanner */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10 mb-6" data-tour="scan-work-order">
              <h2 className="text-2xl font-bold text-white mb-6">Scan Work Order</h2>
              <div className="flex gap-4 mb-4">
                <input
                  type="text"
                  value={workOrderNumber}
                  onChange={(e) => setWorkOrderNumber(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleScanWorkOrder()}
                  className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#4682B4] text-center text-xl tracking-wider font-mono"
                  placeholder="WO-XXXX"
                  autoFocus
                  disabled={!currentStation}
                />
                <button
                  onClick={handleScanWorkOrder}
                  disabled={!currentStation || !workOrderNumber}
                  className="gradient-button px-8 py-3 rounded-lg text-white font-semibold disabled:opacity-50"
                >
                  Scan
                </button>
              </div>
              {!currentStation && (
                <p className="text-yellow-500 text-sm">Please select your station first</p>
              )}
              <p className="text-[#B0B3B8] text-sm text-center">
                Scan the work order QR code or enter the work order ID
              </p>
            </div>

            {/* Pending Orders at this station */}
            {currentStation && (() => {
              const pendingOrders = workOrders.filter(wo => {
                // Only show approved or in-progress orders (exclude finished, cancelled, etc.)
                if (wo.status !== 'approved' && wo.status !== 'in_progress') return false;
                return isNextStation(wo);
              });

              return (
                <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
                  <div className="p-6 border-b border-white/10 bg-gradient-to-r from-[#4682B4]/10 to-purple-500/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-1">Pending Orders at this station</h3>
                        <p className="text-[#B0B3B8] text-sm">Work orders pending at {station?.name}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-[#4682B4]">{pendingOrders.length}</div>
                        <div className="text-xs text-[#B0B3B8]">pending orders</div>
                      </div>
                    </div>
                  </div>

                  {pendingOrders.length > 0 ? (
                    <div className="p-6">
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {pendingOrders.map((order) => {
                          const template = templates.find(t => t.id === order.templateId);
                          const isStartingStation = order.status === 'approved';

                          return (
                            <div
                              key={order.id}
                              className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all cursor-pointer"
                              onClick={() => {
                                setWorkOrderNumber(order.orderNumber);
                              }}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                    isStartingStation
                                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                      : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                  }`}>
                                    {isStartingStation ? '🆕 Ready to Start' : '⏭️ Next Station'}
                                  </div>
                                  <span className="text-white font-mono font-semibold">{order.orderNumber}</span>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setWorkOrderNumber(order.orderNumber);
                                    handleScanWorkOrder();
                                  }}
                                  className="px-4 py-1 bg-[#4682B4] hover:bg-[#3a6a94] text-white rounded text-sm font-medium transition-colors"
                                >
                                  Start →
                                </button>
                              </div>
                              <div className="text-sm text-[#B0B3B8] mb-2">
                                {template?.name || 'Unknown Template'}
                              </div>
                              <div className="flex items-center gap-4 text-xs text-[#B0B3B8]">
                                <span>📅 Requested: {new Date(order.requestedAt).toLocaleDateString()}</span>
                                {order.approvedAt && (
                                  <span>✓ Approved: {new Date(order.approvedAt).toLocaleDateString()}</span>
                                )}
                                {order.stationHistory && order.stationHistory.length > 0 && (
                                  <span>🔧 {order.stationHistory.length} stations completed</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="p-12 text-center">
                      <div className="w-16 h-16 mx-auto mb-4 text-white/20">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-[#B0B3B8] text-lg mb-2">All caught up!</p>
                      <p className="text-[#B0B3B8] text-sm">No work orders pending at this station</p>
                    </div>
                  )}
                </div>
              );
            })()}
          </>
        ) : (
          /* Active Work Order */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Work Order Info */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">Work Order</h2>
                <button
                  onClick={() => {
                    setCurrentWorkOrder(null);
                    setWorkOrderNumber('');
                  }}
                  className="text-white/60 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-[#B0B3B8]">ID:</span>
                  <span className="text-white font-mono">{currentWorkOrder.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#B0B3B8]">Status:</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    currentWorkOrder.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                    currentWorkOrder.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-white/10 text-white'
                  }`}>
                    {currentWorkOrder.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#B0B3B8]">Current Station:</span>
                  <span className="text-white">{station?.name || 'Unknown'}</span>
                </div>
              </div>

              {currentWorkOrder.status === 'approved' && (
                <button
                  onClick={handleStartWork}
                  className="w-full gradient-button text-white font-semibold py-3 px-6 rounded-lg"
                >
                  Start Working
                </button>
              )}
            </div>

            {/* Station Instructions */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10" data-tour="current-step">
              <h2 className="text-xl font-bold text-white mb-4">Station Instructions</h2>

              {currentStep ? (
                <div className="space-y-4">
                  <div className="bg-[#4682B4]/10 border border-[#4682B4]/30 rounded-lg p-4">
                    <div className="text-[#4682B4] font-semibold mb-2">{currentStep.data.label}</div>
                    <div className="text-white text-sm">
                      Follow the standard procedure for this station
                    </div>
                  </div>

                  {currentStep.data.materials && currentStep.data.materials.length > 0 && (
                    <div>
                      <h3 className="text-white font-semibold mb-3">Required Materials</h3>
                      <div className="space-y-2">
                        {currentStep.data.materials.map((mat: any) => {
                          const material = materials.find(m => m.id === mat.materialId);
                          return (
                            <div key={mat.materialId} className="bg-white/5 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-white">{material?.partName || 'Unknown'}</span>
                                <span className="text-[#B0B3B8] text-sm">Required: {mat.quantity}</span>
                              </div>
                              <input
                                type="number"
                                value={materialsUsed[mat.materialId] || mat.quantity}
                                onChange={(e) => setMaterialsUsed({
                                  ...materialsUsed,
                                  [mat.materialId]: Number(e.target.value)
                                })}
                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white text-sm"
                                placeholder="Actual amount used"
                                min="0"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {currentWorkOrder.status === 'in_progress' && (
                    <div className="space-y-3 mt-6" data-tour="complete-step">
                      <button
                        onClick={handleCompleteStep}
                        className="w-full gradient-button text-white font-semibold py-3 px-6 rounded-lg"
                      >
                        Complete Step
                      </button>
                      <button
                        className="w-full px-4 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                      >
                        Report Quality Issue
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 mx-auto mb-3 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-[#B0B3B8]">
                    No instructions available for this station on this work order
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div className="mt-6 bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <h3 className="text-xl font-bold text-white mb-4">Today&apos;s Activity</h3>
          <div className="space-y-2">
            {workOrders
              .filter(wo => wo.status === 'in_progress')
              .slice(0, 5)
              .map(wo => (
                <div key={wo.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <span className="text-white font-mono text-sm">{wo.orderNumber}</span>
                  <span className="text-[#B0B3B8] text-sm">{wo.status}</span>
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">In Progress</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
