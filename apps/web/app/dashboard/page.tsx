'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import {
  DollarSign,
  TrendingUp,
  Users,
  Briefcase,
  FileText,
  CheckCircle,
} from 'lucide-react';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const result = await api.getDashboard();
        setData(result);
      } catch (error) {
        console.error('Failed to load dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (loading) {
    return <div className="text-center py-12">Loading dashboard...</div>;
  }

  if (!data) {
    return <div className="text-center py-12">Failed to load dashboard</div>;
  }

  const stats = [
    {
      name: 'Total Revenue',
      value: formatCurrency(data.revenue.total || 0),
      icon: DollarSign,
      color: 'bg-green-500',
    },
    {
      name: 'Conversion Rate',
      value: `${data.conversionRate}%`,
      icon: TrendingUp,
      color: 'bg-[#00A8A8]',
    },
    {
      name: 'Active Leads',
      value: data.pipeline.new + data.pipeline.contacted + data.pipeline.qualified,
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      name: 'Active Jobs',
      value: data.jobs.inProgress + data.jobs.scheduled,
      icon: Briefcase,
      color: 'bg-purple-500',
    },
    {
      name: 'Pending Quotes',
      value: data.quotes.sent + data.quotes.viewed,
      icon: FileText,
      color: 'bg-orange-500',
    },
    {
      name: 'Completed Jobs',
      value: data.jobs.completed,
      icon: CheckCircle,
      color: 'bg-teal-500',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here's your business overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.name}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Pipeline Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Sales Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(data.pipeline).map(([status, count]: [string, any]) => (
                <div key={status} className="flex items-center justify-between">
                  <span className="text-sm font-medium capitalize">
                    {status.replace('_', ' ')}
                  </span>
                  <span className="text-lg font-bold">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recentActivity.slice(0, 5).map((activity: any) => (
                <div key={activity.id} className="flex items-start gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-[#00A8A8] mt-1.5" />
                  <div className="flex-1">
                    <p className="text-gray-900">
                      {activity.user?.name || 'System'} {activity.action}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {new Date(activity.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
