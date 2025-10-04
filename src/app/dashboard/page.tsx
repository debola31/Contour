'use client';

import Header from '@/components/Header';
import { useStore } from '@/store/useStore';
import Link from 'next/link';
import { useState } from 'react';

export default function Dashboard() {
  const currentUser = useStore((state) => state.currentUser);
  const workOrders = useStore((state) => state.workOrders);
  const materials = useStore((state) => state.materials);
  const customers = useStore((state) => state.customers);
  const stations = useStore((state) => state.stations);
  const personnel = useStore((state) => state.personnel);
  const [selectedStation, setSelectedStation] = useState<string>('');
  const [stationCode, setStationCode] = useState<string>('');
  const [showConfirmTakeover, setShowConfirmTakeover] = useState(false);
  const [takeoverStation, setTakeoverStation] = useState<string>('');

  // Get operators currently at stations
  const getOperatorAtStation = (stationId: string) => {
    return personnel.find(p => p.role === 'operator' && (p as any).currentStation === stationId && (p as any).isLoggedIn);
  };

  // Handle station code scan/input
  const handleStationCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const station = stations.find(s => s.id === stationCode);
    if (station) {
      const occupyingOperator = getOperatorAtStation(stationCode);
      if (occupyingOperator && occupyingOperator.id !== currentUser?.id) {
        setTakeoverStation(stationCode);
        setShowConfirmTakeover(true);
      } else {
        setSelectedStation(stationCode);
      }
    }
  };

  // Operator View
  if (currentUser?.role === 'operator') {
    const operator = personnel.find(p => p.id === currentUser.id && p.role === 'operator') as any;

    return (
      <div className="min-h-screen">
        <Header title="Operator Station" />

        <div className="p-6 max-w-4xl mx-auto">
          {/* Operator Welcome */}
          <div className="mb-8 gradient-card rounded-2xl p-8 border border-white/10">
            <h2 className="text-3xl font-bold text-white mb-2">
              Welcome, {currentUser?.firstName}
            </h2>
            <p className="text-[#B0B3B8] text-lg">
              Select a station to begin your work shift
            </p>
          </div>

          {/* Performance Stats */}
          {operator?.stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <div className="text-[#B0B3B8] text-sm mb-1">Total Orders</div>
                <div className="text-3xl font-bold text-white">{operator.stats.totalOrders}</div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <div className="text-[#B0B3B8] text-sm mb-1">Accuracy</div>
                <div className="text-3xl font-bold text-green-400">{operator.stats.accuracy}%</div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <div className="text-[#B0B3B8] text-sm mb-1">Avg Time</div>
                <div className="text-3xl font-bold text-blue-400">{operator.stats.avgTimePerOrder}m</div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <div className="text-[#B0B3B8] text-sm mb-1">Streak</div>
                <div className="text-3xl font-bold text-orange-400">{operator.stats.currentStreak} ⚡</div>
              </div>
            </div>
          )}

          {/* Station Code Scanner */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10 mb-8">
            <h3 className="text-xl font-bold text-white mb-6">Scan Station Code</h3>
            <form onSubmit={handleStationCodeSubmit} className="mb-6">
              <div className="flex gap-4">
                <input
                  type="text"
                  value={stationCode}
                  onChange={(e) => setStationCode(e.target.value)}
                  className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#4682B4] text-center text-xl tracking-wider"
                  placeholder="st-0000"
                  autoFocus
                />
                <button
                  type="submit"
                  className="gradient-button px-8 py-3 rounded-lg text-white font-semibold"
                >
                  Connect
                </button>
              </div>
              <p className="text-[#B0B3B8] text-xs mt-2 text-center">
                Scan your station QR code or type the station ID
              </p>
            </form>

            <div className="text-center text-[#B0B3B8] text-sm mb-4">or select from list below</div>

            {/* Station Selection Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stations.map((station) => {
                const occupyingOperator = getOperatorAtStation(station.id) as any;
                const isOccupied = !!occupyingOperator;
                const isCurrentOperator = occupyingOperator?.id === currentUser?.id;

                return (
                  <button
                    key={station.id}
                    onClick={() => {
                      if (isOccupied && !isCurrentOperator) {
                        setTakeoverStation(station.id);
                        setShowConfirmTakeover(true);
                      } else {
                        setSelectedStation(station.id);
                      }
                    }}
                    className={`p-6 rounded-xl border-2 transition-all text-left relative ${
                      selectedStation === station.id
                        ? 'border-[#4682B4] bg-[#4682B4]/20'
                        : isOccupied && !isCurrentOperator
                        ? 'border-orange-500/30 bg-orange-500/10'
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    {isOccupied && (
                      <div className="absolute top-2 right-2 px-2 py-1 bg-orange-500/20 border border-orange-500/30 rounded text-xs text-orange-300">
                        {isCurrentOperator ? 'You' : `${occupyingOperator.firstName}`}
                      </div>
                    )}
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="text-white font-semibold">{station.name}</h4>
                        <p className="text-[#B0B3B8] text-xs mt-1">{station.id}</p>
                      </div>
                      <span className="text-2xl">⚙</span>
                    </div>
                    <p className="text-[#B0B3B8] text-sm">{station.description}</p>
                  </button>
                );
              })}
            </div>
            {selectedStation && (
              <div className="mt-6">
                <button className="w-full gradient-button text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 hover:shadow-lg">
                  Start Shift at Selected Station →
                </button>
              </div>
            )}
          </div>

          {/* Takeover Confirmation Modal */}
          {showConfirmTakeover && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-[#111439] rounded-2xl p-8 max-w-md w-full border border-white/20">
                <h3 className="text-2xl font-bold text-white mb-4">Station Already Occupied</h3>
                <p className="text-[#B0B3B8] mb-6">
                  This station is currently assigned to{' '}
                  <span className="text-white font-semibold">
                    {(getOperatorAtStation(takeoverStation) as any)?.firstName}{' '}
                    {(getOperatorAtStation(takeoverStation) as any)?.lastName}
                  </span>
                  . Do you want to take over this station?
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      setShowConfirmTakeover(false);
                      setTakeoverStation('');
                    }}
                    className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setSelectedStation(takeoverStation);
                      setShowConfirmTakeover(false);
                      setTakeoverStation('');
                    }}
                    className="flex-1 gradient-button px-6 py-3 rounded-lg text-white font-semibold"
                  >
                    Take Over Station
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Badges */}
          {operator?.stats?.badges && operator.stats.badges.length > 0 && (
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10">
              <h3 className="text-xl font-bold text-white mb-6">Your Achievements</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {operator.stats.badges.map((badge: any) => (
                  <div
                    key={badge.id}
                    className="bg-gradient-to-br from-[#4682B4]/20 to-[#2E5A8A]/20 rounded-xl p-4 border border-[#4682B4]/30 text-center"
                  >
                    <div className="text-4xl mb-2">{badge.icon}</div>
                    <div className="text-white font-semibold text-sm mb-1">{badge.name}</div>
                    <div className="text-[#B0B3B8] text-xs">{badge.description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Professional Staff View (Owner/Salesperson)
  const stats = [
    { label: 'Active Work Orders', value: workOrders.filter(wo => wo.status === 'in_progress').length, icon: '☰', color: '#4682B4' },
    { label: 'Total Customers', value: customers.length, icon: '⚇', color: '#6FA3D8' },
    { label: 'Inventory Items', value: materials.length, icon: '⊞', color: '#2E5A8A' },
    { label: 'Pending Approvals', value: workOrders.filter(wo => wo.status === 'requested').length, icon: '⧗', color: '#4682B4' },
  ];

  const quickActions = [
    { name: 'View Inventory', path: '/dashboard/inventory', icon: '⊞', description: 'Manage materials and stock levels' },
    { name: 'Work Orders', path: '/dashboard/work-orders', icon: '☰', description: 'Create and manage work orders' },
    { name: 'Customers', path: '/dashboard/customers', icon: '⚇', description: 'Manage customer information' },
    { name: 'Insights', path: '/dashboard/insights', icon: '☷', description: 'View analytics and reports' },
  ];

  return (
    <div className="min-h-screen">
      <Header title="Dashboard" />

      <div className="p-6">
        {/* Welcome Section */}
        <div className="mb-8 gradient-card rounded-2xl p-8 border border-white/10">
          <h2 className="text-3xl font-bold text-white mb-2">
            Welcome back, {currentUser?.firstName}
          </h2>
          <p className="text-[#B0B3B8] text-lg">
            {currentUser?.role === 'owner'
              ? "You have full access to all enterprise management tools."
              : currentUser?.role === 'salesperson'
              ? "Manage your customers and work orders efficiently."
              : "Access your station and track your performance."}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-white/20 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-3xl">{stat.icon}</span>
                <div className="text-3xl font-bold text-white">{stat.value}</div>
              </div>
              <div className="text-[#B0B3B8] font-medium">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-xl font-bold text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Link
                key={action.path}
                href={action.path}
                className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-[#4682B4] hover:bg-white/10 transition-all group"
              >
                <div className="text-4xl mb-3">{action.icon}</div>
                <h4 className="text-white font-semibold mb-1 group-hover:text-[#4682B4] transition-colors">
                  {action.name}
                </h4>
                <p className="text-[#B0B3B8] text-sm">{action.description}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8">
          <h3 className="text-xl font-bold text-white mb-4">Recent Activity</h3>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
            <div className="text-center text-[#B0B3B8] py-8">
              <div className="text-4xl mb-3">☷</div>
              <p>Start creating work orders and managing inventory to see activity here.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
