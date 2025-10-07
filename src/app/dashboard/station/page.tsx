'use client';

import { useState } from 'react';
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

  const handleScanWorkOrder = () => {
    const trimmedInput = workOrderNumber.trim();
    const wo = workOrders.find(w =>
      w.id === trimmedInput ||
      w.orderNumber === trimmedInput ||
      w.id.includes(trimmedInput) ||
      w.orderNumber.includes(trimmedInput)
    );

    if (wo) {
      // Only allow scanning work orders that are approved or in progress
      if (wo.status === 'approved' || wo.status === 'in_progress') {
        setCurrentWorkOrder(wo);
      } else {
        alert(`Work Order ${wo.orderNumber} is not approved yet. Current status: ${wo.status}`);
      }
    } else {
      alert(`Work Order "${trimmedInput}" not found. Please check the order number.`);
    }
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
          <label className="block text-[#B0B3B8] mb-2">Select Your Station</label>
          <select
            value={currentStation}
            onChange={(e) => setCurrentStation(e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#4682B4]"
          >
            <option value="">-- Select Station --</option>
            {stations.map(s => (
              <option key={s.id} value={s.id}>{s.name} - {s.description}</option>
            ))}
          </select>
        </div>

        {!currentWorkOrder ? (
          /* Work Order Scanner */
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10" data-tour="scan-work-order">
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
