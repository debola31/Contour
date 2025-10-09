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

    // Get all operators with stats for leaderboard
    const allOperators = personnel
      .filter(p => p.role === 'operator' && (p as any).stats)
      .map(p => p as any)
      .sort((a, b) => (b.stats.totalOrders || 0) - (a.stats.totalOrders || 0));

    const currentRank = allOperators.findIndex(op => op.id === currentUser.id) + 1;

    return (
      <div className="min-h-screen">
        <Header title="Operator Dashboard" />

        <div className="p-6 max-w-7xl mx-auto">
          {/* Welcome Header with Rank */}
          <div className="mb-8 gradient-card rounded-2xl p-8 border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  Welcome back, {currentUser?.firstName}!
                </h2>
                <p className="text-[#B0B3B8] text-lg">
                  {operator?.stats ? `You're ranked #${currentRank} on today's leaderboard` : 'Complete your first order to join the leaderboard'}
                </p>
              </div>
              <div className="text-center">
                <div className="text-6xl mb-2">
                  {currentRank === 1 ? '🥇' : currentRank === 2 ? '🥈' : currentRank === 3 ? '🥉' : '🏅'}
                </div>
                <div className="text-2xl font-bold text-white">#{currentRank}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Leaderboard */}
            <div className="lg:col-span-2 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
              <div className="p-6 border-b border-white/10 bg-gradient-to-r from-[#4682B4]/20 to-purple-500/20">
                <div className="flex items-center gap-3">
                  <svg className="w-8 h-8 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                  </svg>
                  <h3 className="text-2xl font-bold text-white">Today's Leaderboard</h3>
                </div>
                <p className="text-[#B0B3B8] text-sm mt-2">Top performers of the current shift</p>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {allOperators.slice(0, 10).map((op, index) => {
                    const isCurrentUser = op.id === currentUser.id;
                    const rankEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';

                    return (
                      <div
                        key={op.id}
                        className={`p-4 rounded-lg border transition-all ${
                          isCurrentUser
                            ? 'bg-[#4682B4]/30 border-[#4682B4] shadow-lg shadow-[#4682B4]/20'
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="text-2xl font-bold text-white w-8 text-center">
                            {rankEmoji || `#${index + 1}`}
                          </div>
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#4682B4] to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                            {op.firstName[0]}{op.lastName[0]}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <div className="text-white font-semibold">
                                {op.firstName} {op.lastName}
                                {isCurrentUser && <span className="text-xs ml-2 text-[#4682B4]">(You)</span>}
                              </div>
                              {op.stats.badges && op.stats.badges.length > 0 && (
                                <div className="flex gap-1">
                                  {op.stats.badges.slice(0, 3).map((badge: any, i: number) => (
                                    <span key={i} className="text-sm" title={badge.name}>{badge.icon}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="flex gap-4 mt-1 text-xs text-[#B0B3B8]">
                              <span>📦 {op.stats.totalOrders} orders</span>
                              <span>✓ {op.stats.accuracy}% accuracy</span>
                              <span>⚡ {op.stats.avgTimePerOrder}m avg</span>
                              <span>🔥 {op.stats.currentStreak} streak</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-white">{op.stats.totalOrders || 0}</div>
                            <div className="text-xs text-[#B0B3B8]">completed</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Personal Stats & Achievements */}
            <div className="space-y-6">
              {/* Personal Stats */}
              {operator?.stats && (
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                  <h3 className="text-xl font-bold text-white mb-4">Your Stats</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-[#B0B3B8]">Total Orders</div>
                      <div className="text-2xl font-bold text-white">{operator.stats.totalOrders}</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-[#B0B3B8]">Accuracy</div>
                      <div className="text-2xl font-bold text-green-400">{operator.stats.accuracy}%</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-[#B0B3B8]">Avg Time</div>
                      <div className="text-2xl font-bold text-blue-400">{operator.stats.avgTimePerOrder}m</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-[#B0B3B8]">Current Streak</div>
                      <div className="text-2xl font-bold text-orange-400">🔥 {operator.stats.currentStreak}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Achievements/Badges */}
              {operator?.stats?.badges && operator.stats.badges.length > 0 && (
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                  <h3 className="text-xl font-bold text-white mb-4">Recent Achievements</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {operator.stats.badges.slice(0, 4).map((badge: any) => (
                      <div
                        key={badge.id}
                        className="bg-gradient-to-br from-[#4682B4]/20 to-purple-500/20 rounded-xl p-3 border border-[#4682B4]/30 text-center"
                      >
                        <div className="text-3xl mb-1">{badge.icon}</div>
                        <div className="text-white font-semibold text-xs mb-1">{badge.name}</div>
                        <div className="text-[#B0B3B8] text-[10px]">{badge.description}</div>
                      </div>
                    ))}
                  </div>
                  {operator.stats.badges.length > 4 && (
                    <div className="text-center mt-3 text-[#B0B3B8] text-sm">
                      +{operator.stats.badges.length - 4} more achievements
                    </div>
                  )}
                </div>
              )}

              {/* Quick Action */}
              <Link
                href="/dashboard/station"
                className="block w-full gradient-button text-white font-semibold py-4 px-6 rounded-xl text-center transition-all duration-200 hover:shadow-lg"
              >
                🚀 Start Working
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Professional Staff View (Owner/Salesperson)
  const stats = [
    { label: 'Active Work Orders', value: workOrders.filter(wo => wo.status === 'in_progress').length, icon: 'list', color: '#4682B4' },
    { label: 'Pending Approvals', value: workOrders.filter(wo => wo.status === 'requested').length, icon: 'clock', color: '#4682B4' },
  ];

  const quickActions = [
    { name: 'View Inventory', path: '/dashboard/inventory', icon: 'box', description: 'Manage materials and stock levels' },
    { name: 'Work Orders', path: '/dashboard/work-orders', icon: 'list', description: 'Create and manage work orders' },
    { name: 'Insights', path: '/dashboard/insights', icon: 'chart', description: 'View analytics and reports' },
  ];

  const iconMap: Record<string, React.ReactElement> = {
    list: (
      <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    ),
    users: (
      <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    box: (
      <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    clock: (
      <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    chart: (
      <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  };

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-white/20 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 text-white">
                  {iconMap[stat.icon]}
                </div>
                <div className="text-3xl font-bold text-white">{stat.value}</div>
              </div>
              <div className="text-[#B0B3B8] font-medium">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-xl font-bold text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action) => (
              <Link
                key={action.path}
                href={action.path}
                className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-[#4682B4] hover:bg-white/10 transition-all group"
              >
                <div className="w-10 h-10 text-white mb-3">
                  {iconMap[action.icon]}
                </div>
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
              <div className="w-12 h-12 mx-auto mb-3 text-white/20">
                {iconMap['chart']}
              </div>
              <p>Start creating work orders and managing inventory to see activity here.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
