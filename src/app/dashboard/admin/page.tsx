'use client';

import Header from '@/components/Header';
import { useStore } from '@/store/useStore';
import { Operator } from '@/types';

export default function AdminPage() {
  const personnel = useStore((state) => state.personnel);
  const stations = useStore((state) => state.stations);
  const workOrders = useStore((state) => state.workOrders);
  const materials = useStore((state) => state.materials);
  const invoices = useStore((state) => state.invoices);
  const shipments = useStore((state) => state.shipments);

  // Get active operators and their stations
  const operators = personnel.filter((p): p is Operator => p.role === 'operator');
  const activeOperators = operators.filter(op => op.isLoggedIn);

  // System stats
  const totalPersonnel = personnel.length;
  const activeWorkOrders = workOrders.filter(wo => wo.status === 'in_progress').length;
  const lowStockItems = materials.filter(m => m.minimumQuantity && m.quantityInStock <= m.minimumQuantity).length;
  const unpaidInvoices = invoices.filter(inv => inv.status === 'unpaid').length;
  const pendingShipments = shipments.filter(s => s.deliveryStatus !== 'delivered').length;

  return (
    <div className="min-h-screen">
      <Header title="Admin Dashboard" />

      <div className="p-6">
        {/* System Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6" data-tour="system-stats">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="text-[#B0B3B8] mb-2">Total Personnel</div>
            <div className="text-3xl font-bold text-white">{totalPersonnel}</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="text-[#B0B3B8] mb-2">Active Work Orders</div>
            <div className="text-3xl font-bold text-[#4682B4]">{activeWorkOrders}</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="text-[#B0B3B8] mb-2">Low Stock Items</div>
            <div className="text-3xl font-bold text-yellow-500">{lowStockItems}</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="text-[#B0B3B8] mb-2">Pending Actions</div>
            <div className="text-3xl font-bold text-red-400">{unpaidInvoices + pendingShipments}</div>
          </div>
        </div>

        {/* Live Station Monitor */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden" data-tour="live-stations">
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="8" />
              </svg>
              <div>
                <h2 className="text-xl font-semibold text-white">Live Station Monitor</h2>
                <p className="text-[#B0B3B8] text-sm mt-1">
                  {activeOperators.length} of {operators.length} operators active
                </p>
              </div>
            </div>
          </div>
          <div className="p-4 max-h-[600px] overflow-y-auto">
            <div className="space-y-3">
              {stations.map(station => {
                const operatorAtStation = activeOperators.find(
                  op => op.currentStation === station.id
                );

                return (
                  <div
                    key={station.id}
                    className={`p-4 rounded-lg border transition-all ${
                      operatorAtStation
                        ? 'bg-green-500/10 border-green-500/30'
                        : 'bg-white/5 border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-white font-medium">{station.name}</div>
                        <div className="text-[#B0B3B8] text-sm">{station.description}</div>
                      </div>
                      <div className="text-right">
                        {operatorAtStation ? (
                          <>
                            <div className="text-green-400 font-medium">
                              {operatorAtStation.firstName} {operatorAtStation.lastName}
                            </div>
                            <div className="flex items-center gap-2 justify-end mt-1">
                              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                              <span className="text-green-400 text-xs">Active</span>
                            </div>
                          </>
                        ) : (
                          <span className="text-white/50 text-sm">Unoccupied</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div className="mt-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6" data-tour="recent-orders">
          <div className="flex items-center gap-3 mb-4">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <h2 className="text-xl font-semibold text-white">System Alerts</h2>
          </div>
          <div className="space-y-2">
            {lowStockItems > 0 && (
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="text-white text-sm">{lowStockItems} materials low on stock</span>
                </div>
              </div>
            )}
            {unpaidInvoices > 0 && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="text-white text-sm">{unpaidInvoices} invoices unpaid</span>
                </div>
              </div>
            )}
            {pendingShipments > 0 && (
              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-white text-sm">{pendingShipments} shipments pending delivery</span>
                </div>
              </div>
            )}
            {lowStockItems === 0 && unpaidInvoices === 0 && pendingShipments === 0 && (
              <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-white text-sm">All systems operational</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
