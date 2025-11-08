/**
 * Dashboard Page
 * Main dashboard with system overview
 * 
 * Created: 2025-01-11
 * Purpose: Real-time monitoring dashboard
 */

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, Zap, Power, TrendingUp } from 'lucide-react';
import { api } from '../utils/api';
import { useSocket } from '../hooks/useSocket';
import StatsCard from '../components/StatsCard';
import MetricsChart from '../components/MetricsChart';

export default function Dashboard() {
  const [realTimeStats, setRealTimeStats] = useState(null);
  const socket = useSocket();

  // Fetch dashboard data
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/dashboard/overview'),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Socket.IO real-time updates
  useEffect(() => {
    if (!socket) return;

    socket.on('simulation:update', (data) => {
      setRealTimeStats(data);
    });

    socket.emit('subscribe:simulation', {});

    return () => {
      socket.off('simulation:update');
    };
  }, [socket]);

  const stats = realTimeStats || dashboardData?.data || {};

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2 text-green-600">
            <Activity className="w-5 h-5 animate-pulse" />
            <span className="text-sm font-medium">Connected</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Stations"
          value={stats.totalStations || 0}
          icon={Activity}
          color="purple"
        />
        <StatsCard
          title="Online"
          value={stats.onlineStations || 0}
          icon={Zap}
          color="green"
        />
        <StatsCard
          title="Active Sessions"
          value={stats.activeSessions || 0}
          icon={TrendingUp}
          color="yellow"
        />
        <StatsCard
          title="Total Power"
          value={`${(stats.totalPower || 0).toFixed(1)} kW`}
          icon={Power}
          color="blue"
        />
      </div>

      {/* Metrics Chart */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Real-time Metrics
        </h2>
        <MetricsChart />
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Recent Activity
        </h2>
        <div className="space-y-2">
          <p className="text-gray-600 dark:text-gray-400">
            No recent activity
          </p>
        </div>
      </div>
    </div>
  );
}

