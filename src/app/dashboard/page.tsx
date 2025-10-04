'use client';

import Header from '@/components/Header';
import { useStore } from '@/store/useStore';
import Link from 'next/link';

export default function Dashboard() {
  const currentUser = useStore((state) => state.currentUser);
  const workOrders = useStore((state) => state.workOrders);
  const materials = useStore((state) => state.materials);
  const customers = useStore((state) => state.customers);

  const stats = [
    { label: 'Active Work Orders', value: workOrders.filter(wo => wo.status === 'in_progress').length, icon: '▤', color: '#4682B4' },
    { label: 'Total Customers', value: customers.length, icon: '◉', color: '#6FA3D8' },
    { label: 'Inventory Items', value: materials.length, icon: '▢', color: '#2E5A8A' },
    { label: 'Pending Approvals', value: workOrders.filter(wo => wo.status === 'requested').length, icon: '◇', color: '#4682B4' },
  ];

  const quickActions = [
    { name: 'View Inventory', path: '/dashboard/inventory', icon: '▢', description: 'Manage materials and stock levels' },
    { name: 'Work Orders', path: '/dashboard/work-orders', icon: '▤', description: 'Create and manage work orders' },
    { name: 'Customers', path: '/dashboard/customers', icon: '◉', description: 'Manage customer information' },
    { name: 'Insights', path: '/dashboard/insights', icon: '▣', description: 'View analytics and reports' },
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
              <div className="text-4xl mb-3">▣</div>
              <p>Start creating work orders and managing inventory to see activity here.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
