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

          {/* Station Selection */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10 mb-8">
            <h3 className="text-xl font-bold text-white mb-6">Select Your Station</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stations.map((station) => (
                <button
                  key={station.id}
                  onClick={() => setSelectedStation(station.id)}
                  className={`p-6 rounded-xl border-2 transition-all text-left ${
                    selectedStation === station.id
                      ? 'border-[#4682B4] bg-[#4682B4]/20'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-white font-semibold">{station.name}</h4>
                    <span className="text-2xl">⚙</span>
                  </div>
                  <p className="text-[#B0B3B8] text-sm">{station.description}</p>
                </button>
              ))}
            </div>
            {selectedStation && (
              <div className="mt-6">
                <button className="w-full gradient-button text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 hover:shadow-lg">
                  Start Shift at Selected Station →
                </button>
              </div>
            )}
          </div>

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
