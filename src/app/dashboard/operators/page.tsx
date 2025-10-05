'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import { useStore } from '@/store/useStore';

export default function OperatorsPage() {
  const personnel = useStore((state) => state.personnel);
  const stations = useStore((state) => state.stations);

  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'accuracy' | 'speed' | 'orders'>('accuracy');

  // Get all operators
  const operators = personnel.filter(p => p.role === 'operator');

  // Filter and sort operators
  const filteredOperators = operators
    .filter(op => {
      const fullName = `${op.firstName} ${op.lastName}`.toLowerCase();
      return fullName.includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => {
      const aStats = (a as any).stats;
      const bStats = (b as any).stats;

      switch (sortBy) {
        case 'accuracy':
          return (bStats?.accuracyPercentage || 0) - (aStats?.accuracyPercentage || 0);
        case 'speed':
          return (aStats?.averageTimePerOrder || 999) - (bStats?.averageTimePerOrder || 999);
        case 'orders':
          return (bStats?.totalOrders || 0) - (aStats?.totalOrders || 0);
        case 'name':
          return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
        default:
          return 0;
      }
    });

  // Calculate overall stats
  const totalOperators = operators.length;
  const activeOperators = operators.filter(op => (op as any).isLoggedIn).length;
  const avgAccuracy = operators.reduce((sum, op) => sum + ((op as any).stats?.accuracyPercentage || 0), 0) / operators.length;
  const avgSpeed = operators.reduce((sum, op) => sum + ((op as any).stats?.averageTimePerOrder || 0), 0) / operators.length;

  const getStationName = (stationId: string) => {
    return stations.find(s => s.id === stationId)?.name || 'Unknown';
  };

  const getBadgeEmoji = (badge: string) => {
    const badgeMap: any = {
      'Speed Demon': '⚡',
      'Perfectionist': '⭐',
      'Century Club': '💯',
      'Marathon Runner': '▶',
      'Quality King': '♔',
      'Consistency Champion': '◎',
      'Early Bird': '☀',
      'Night Owl': '☾',
    };
    return badgeMap[badge] || '♕';
  };

  return (
    <div className="min-h-screen">
      <Header title="Operator Performance" />

      <div className="p-6">
        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="text-[#B0B3B8] mb-2">Total Operators</div>
            <div className="text-3xl font-bold text-white">{totalOperators}</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="text-[#B0B3B8] mb-2">Currently Active</div>
            <div className="text-3xl font-bold text-green-400">{activeOperators}</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="text-[#B0B3B8] mb-2">Avg Accuracy</div>
            <div className="text-3xl font-bold text-[#4682B4]">{avgAccuracy.toFixed(1)}%</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="text-[#B0B3B8] mb-2">Avg Speed</div>
            <div className="text-3xl font-bold text-white">{avgSpeed.toFixed(0)} min</div>
          </div>
        </div>

        {/* Search and Sort */}
        <div className="flex gap-4 mb-6">
          <input
            type="text"
            placeholder="Search operators..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#4682B4]"
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#4682B4]"
          >
            <option value="accuracy">Sort by Accuracy</option>
            <option value="speed">Sort by Speed</option>
            <option value="orders">Sort by Orders</option>
            <option value="name">Sort by Name</option>
          </select>
        </div>

        {/* Leaderboard */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden mb-6">
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
              <h2 className="text-xl font-semibold text-white">Leaderboard</h2>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="text-left p-4 text-[#B0B3B8] font-medium">Rank</th>
                  <th className="text-left p-4 text-[#B0B3B8] font-medium">Operator</th>
                  <th className="text-left p-4 text-[#B0B3B8] font-medium">Status</th>
                  <th className="text-left p-4 text-[#B0B3B8] font-medium">Station</th>
                  <th className="text-left p-4 text-[#B0B3B8] font-medium">Orders</th>
                  <th className="text-left p-4 text-[#B0B3B8] font-medium">Accuracy</th>
                  <th className="text-left p-4 text-[#B0B3B8] font-medium">Avg Time</th>
                  <th className="text-left p-4 text-[#B0B3B8] font-medium">Streak</th>
                  <th className="text-left p-4 text-[#B0B3B8] font-medium">Badges</th>
                </tr>
              </thead>
              <tbody>
                {filteredOperators.map((operator, index) => {
                  const stats = (operator as any).stats;
                  const isLoggedIn = (operator as any).isLoggedIn;
                  const currentStation = (operator as any).currentStation;
                  const badges = (operator as any).badges || [];

                  return (
                    <tr
                      key={operator.id}
                      className={`border-b border-white/5 hover:bg-white/5 transition-colors ${
                        index < 3 ? 'bg-[#4682B4]/10' : ''
                      }`}
                    >
                      <td className="p-4">
                        <span className={`text-xl font-bold ${
                          index === 0 ? 'text-yellow-400' :
                          index === 1 ? 'text-gray-300' :
                          index === 2 ? 'text-orange-400' :
                          'text-white/50'
                        }`}>
                          {index === 0 ? '①' : index === 1 ? '②' : index === 2 ? '③' : `#${index + 1}`}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="text-white font-medium">
                          {operator.firstName} {operator.lastName}
                        </div>
                        <div className="text-[#B0B3B8] text-xs">{operator.qrCode}</div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                          isLoggedIn
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-white/10 text-white/50'
                        }`}>
                          {isLoggedIn ? 'Active' : 'Offline'}
                        </span>
                      </td>
                      <td className="p-4 text-[#B0B3B8]">
                        {isLoggedIn && currentStation ? getStationName(currentStation) : '-'}
                      </td>
                      <td className="p-4 text-white font-semibold">{stats?.totalOrders || 0}</td>
                      <td className="p-4">
                        <span className={`font-semibold ${
                          (stats?.accuracyPercentage || 0) >= 95 ? 'text-green-400' :
                          (stats?.accuracyPercentage || 0) >= 85 ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                          {(stats?.accuracyPercentage || 0).toFixed(1)}%
                        </span>
                      </td>
                      <td className="p-4 text-white">{stats?.averageTimePerOrder || 0} min</td>
                      <td className="p-4">
                        <span className={`font-semibold ${
                          (stats?.currentStreak || 0) >= 10 ? 'text-orange-400' :
                          (stats?.currentStreak || 0) >= 5 ? 'text-yellow-400' :
                          'text-white'
                        }`}>
                          {stats?.currentStreak || 0}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-1">
                          {badges.slice(0, 3).map((badge: string, i: number) => (
                            <span key={i} className="text-lg" title={badge}>
                              {getBadgeEmoji(badge)}
                            </span>
                          ))}
                          {badges.length > 3 && (
                            <span className="text-xs text-[#B0B3B8]">+{badges.length - 3}</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {filteredOperators.length === 0 && (
          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-12 text-center">
            <svg className="w-16 h-16 mx-auto mb-3 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-[#B0B3B8]">No operators found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
