import React from 'react';
import { 
  Users, 
  ShoppingBag, 
  CreditCard, 
  DollarSign, 
  TrendingUp,
  CheckCircle
} from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { formatPrice } from '../lib/utils';

interface AdminStatsSimpleProps {
  stats: {
    users?: {
      total: number;
      verified: number;
      active: number;
    };
    listings?: {
      total: number;
      averagePrice: number;
    };
    transactions?: {
      total: number;
      totalVolume: number;
      totalCommissions: number;
    };
  };
  loading?: boolean;
}

const AdminStatsSimple: React.FC<AdminStatsSimpleProps> = ({ stats, loading = false }) => {
  const statCards = [
    {
      title: 'Total Users',
      value: stats?.users?.total || 0,
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Active Listings',
      value: stats?.listings?.total || 0,
      icon: ShoppingBag,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Total Transactions',
      value: stats?.transactions?.total || 0,
      icon: CreditCard,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Total Revenue',
      value: formatPrice(stats?.transactions?.totalVolume || 0, 'ETB'),
      icon: DollarSign,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50',
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gray-200 rounded-lg mr-4"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default AdminStatsSimple;
