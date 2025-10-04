'use client';

import Header from '@/components/Header';
import { useStore } from '@/store/useStore';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function InsightsPage() {
  const workOrders = useStore((state) => state.workOrders);
  const materials = useStore((state) => state.materials);
  const invoices = useStore((state) => state.invoices);

  // Sample data for charts
  const workOrderData = [
    { name: 'Jan', orders: 12 },
    { name: 'Feb', orders: 19 },
    { name: 'Mar', orders: 15 },
    { name: 'Apr', orders: 25 },
    { name: 'May', orders: 22 },
    { name: 'Jun', orders: 30 },
  ];

  const statusData = [
    { name: 'Requested', value: workOrders.filter(wo => wo.status === 'requested').length, color: '#F59E0B' },
    { name: 'Approved', value: workOrders.filter(wo => wo.status === 'approved').length, color: '#3B82F6' },
    { name: 'In Progress', value: workOrders.filter(wo => wo.status === 'in_progress').length, color: '#8B5CF6' },
    { name: 'Finished', value: workOrders.filter(wo => wo.status === 'finished').length, color: '#10B981' },
  ];

  const inventoryData = materials.slice(0, 10).map(m => ({
    name: m.partName.length > 20 ? m.partName.substring(0, 20) + '...' : m.partName,
    stock: m.quantityInStock,
    minimum: m.minimumQuantity || 0,
  }));

  const aiInsights = [
    {
      type: 'warning',
      title: 'Low Inventory Alert',
      description: `${materials.filter(m => m.minimumQuantity && m.quantityInStock <= m.minimumQuantity).length} materials are running low on stock and may need replenishment soon.`,
      severity: 'high',
    },
    {
      type: 'insight',
      title: 'Production Trend',
      description: 'Work order completion rate has increased by 15% compared to last month.',
      severity: 'low',
    },
    {
      type: 'recommendation',
      title: 'Optimize Material Orders',
      description: 'Based on consumption patterns, consider bulk ordering brass casings to reduce costs by an estimated 12%.',
      severity: 'medium',
    },
  ];

  const promptSuggestions = [
    'Show me the top performing operators this month',
    'What is the average work order completion time?',
    'Which materials have the highest consumption rate?',
    'Analyze invoice payment trends',
    'Compare work order volumes by customer type',
  ];

  return (
    <div className="min-h-screen">
      <Header title="Insights & Analytics" />

      <div className="p-6">
        {/* AI Insights Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">AI-Powered Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {aiInsights.map((insight, index) => (
              <div
                key={index}
                className={`rounded-xl p-6 border ${
                  insight.severity === 'high'
                    ? 'bg-red-500/10 border-red-500/30'
                    : insight.severity === 'medium'
                    ? 'bg-yellow-500/10 border-yellow-500/30'
                    : 'bg-blue-500/10 border-blue-500/30'
                }`}
              >
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-2xl">
                    {insight.type === 'warning' ? '⚠️' : insight.type === 'recommendation' ? '💡' : '📈'}
                  </span>
                  <div>
                    <h3 className="text-white font-semibold mb-1">{insight.title}</h3>
                    <p className="text-white/80 text-sm">{insight.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Ask AI Section */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <h3 className="text-white font-semibold mb-4">Ask Questions</h3>
            <div className="flex gap-3 mb-4">
              <input
                type="text"
                placeholder="Ask anything about your business data..."
                className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#4682B4]"
              />
              <button className="gradient-button px-6 py-3 rounded-lg text-white font-medium">
                Ask AI
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {promptSuggestions.map((prompt, index) => (
                <button
                  key={index}
                  className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/70 hover:text-white text-sm transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">Analytics Dashboard</h2>
            <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-sm transition-colors">
              + Create Custom Chart
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Work Orders Trend */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h3 className="text-white font-semibold mb-4">Work Orders Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={workOrderData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                  <XAxis dataKey="name" stroke="#B0B3B8" />
                  <YAxis stroke="#B0B3B8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#111439',
                      border: '1px solid #ffffff20',
                      borderRadius: '8px',
                    }}
                  />
                  <Line type="monotone" dataKey="orders" stroke="#4682B4" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Work Order Status Distribution */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h3 className="text-white font-semibold mb-4">Work Order Status Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#111439',
                      border: '1px solid #ffffff20',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Inventory Levels */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 lg:col-span-2">
              <h3 className="text-white font-semibold mb-4">Top 10 Inventory Items</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={inventoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                  <XAxis dataKey="name" stroke="#B0B3B8" angle={-45} textAnchor="end" height={100} />
                  <YAxis stroke="#B0B3B8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#111439',
                      border: '1px solid #ffffff20',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="stock" fill="#4682B4" name="Current Stock" />
                  <Bar dataKey="minimum" fill="#F59E0B" name="Minimum Level" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
