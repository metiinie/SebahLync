import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Search,
  Filter,
  TrendingDown,
  Wallet,
  CreditCard,
  Smartphone,
  Building2,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  BarChart3,
  Target
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { TransactionsService } from '../services/transactions';
import { Transaction } from '../types';
import { toast } from 'sonner';
import { formatCurrency } from '../lib/supabase';

interface CommissionTrackingProps {
  loading?: boolean;
}

interface FilterState {
  status: string;
  paymentMethod: string;
  dateRange: string;
  search: string;
}

interface CommissionStats {
  totalCommissions: number;
  collectedCommissions: number;
  pendingCommissions: number;
  refundedCommissions: number;
  averageCommission: number;
  commissionRate: number;
  monthlyRevenue: number;
}

const CommissionTracking: React.FC<CommissionTrackingProps> = ({ loading: initialLoading = false }) => {
  const [loading, setLoading] = useState(initialLoading);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<CommissionStats>({
    totalCommissions: 0,
    collectedCommissions: 0,
    pendingCommissions: 0,
    refundedCommissions: 0,
    averageCommission: 0,
    commissionRate: 5,
    monthlyRevenue: 0,
  });
  const [filters, setFilters] = useState<FilterState>({
    status: 'all',
    paymentMethod: 'all',
    dateRange: 'all',
    search: '',
  });
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadTransactions();
  }, []);

  useEffect(() => {
    filterTransactions();
  }, [transactions, filters]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadTransactions = async () => {
    try {
      setLoading(true);
      // Load all transactions with commissions
      const response = await TransactionsService.getTransactionsByStatus('all', { page: 1, limit: 1000 });
      
      if (response.success && response.data) {
        const allTransactions = response.data;
        setTransactions(allTransactions);
        
        // Calculate commission stats
        const totalCommissions = allTransactions.reduce((sum, t) => sum + (t.commission?.amount || 0), 0);
        const collectedCommissions = allTransactions
          .filter(t => ['released', 'paid'].includes(t.status))
          .reduce((sum, t) => sum + (t.commission?.amount || 0), 0);
        const pendingCommissions = allTransactions
          .filter(t => ['escrowed', 'payment_completed'].includes(t.status))
          .reduce((sum, t) => sum + (t.commission?.amount || 0), 0);
        const refundedCommissions = allTransactions
          .filter(t => t.status === 'refunded')
          .reduce((sum, t) => sum + (t.commission?.amount || 0), 0);
        
        const avgCommission = allTransactions.length > 0 
          ? totalCommissions / allTransactions.length 
          : 0;
        
        // Calculate monthly revenue (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const monthlyRevenue = allTransactions
          .filter(t => new Date(t.created_at) >= thirtyDaysAgo)
          .reduce((sum, t) => sum + (t.commission?.amount || 0), 0);
        
        setStats({
          totalCommissions,
          collectedCommissions,
          pendingCommissions,
          refundedCommissions,
          averageCommission: avgCommission,
          commissionRate: allTransactions[0]?.commission?.rate || 5,
          monthlyRevenue,
        });
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
      toast.error('Failed to load commission data');
    } finally {
      setLoading(false);
    }
  };

  const filterTransactions = () => {
    let filtered = [...transactions];

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(t => t.status === filters.status);
    }

    // Payment method filter
    if (filters.paymentMethod !== 'all') {
      filtered = filtered.filter(t => t.payment_method === filters.paymentMethod);
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(t => 
        t.buyer?.full_name?.toLowerCase().includes(searchLower) ||
        t.seller?.full_name?.toLowerCase().includes(searchLower) ||
        t.listing?.title?.toLowerCase().includes(searchLower) ||
        t.id.toLowerCase().includes(searchLower)
      );
    }

    setFilteredTransactions(filtered);
  };

  const toggleRowExpansion = (transactionId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(transactionId)) {
      newExpanded.delete(transactionId);
    } else {
      newExpanded.add(transactionId);
    }
    setExpandedRows(newExpanded);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      released: { label: 'Collected', color: 'bg-green-500 text-white', icon: CheckCircle },
      paid: { label: 'Paid', color: 'bg-green-500 text-white', icon: CheckCircle },
      escrowed: { label: 'Pending', color: 'bg-yellow-500 text-white', icon: Clock },
      payment_completed: { label: 'Pending', color: 'bg-yellow-500 text-white', icon: Clock },
      refunded: { label: 'Refunded', color: 'bg-red-500 text-white', icon: AlertCircle },
      pending: { label: 'Pending', color: 'bg-yellow-500 text-white', icon: Clock },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, color: 'bg-gray-500 text-white', icon: Clock };
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getPaymentMethodIcon = (method: string) => {
    const methodConfig = {
      telebirr: { icon: Smartphone, color: 'text-green-600' },
      chapa: { icon: Building2, color: 'text-blue-600' },
      bibit: { icon: Smartphone, color: 'text-red-600' },
    };

    const config = methodConfig[method as keyof typeof methodConfig] || { icon: CreditCard, color: 'text-gray-600' };
    const Icon = config.icon;

    return <Icon className={`h-5 w-5 ${config.color}`} />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ET', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Pagination
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  if (loading && transactions.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Total Commissions</p>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(stats.totalCommissions)}</p>
                  <p className="text-green-100 text-sm mt-1">Rate: {stats.commissionRate}%</p>
                </div>
                <DollarSign className="h-12 w-12 text-green-200" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Collected</p>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(stats.collectedCommissions)}</p>
                  <p className="text-blue-100 text-sm mt-1">
                    {stats.totalCommissions > 0 
                      ? `${((stats.collectedCommissions / stats.totalCommissions) * 100).toFixed(1)}%` 
                      : '0%'}
                  </p>
                </div>
                <TrendingUp className="h-12 w-12 text-blue-200" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm font-medium">Pending</p>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(stats.pendingCommissions)}</p>
                  <p className="text-yellow-100 text-sm mt-1">
                    {stats.totalCommissions > 0 
                      ? `${((stats.pendingCommissions / stats.totalCommissions) * 100).toFixed(1)}%` 
                      : '0%'}
                  </p>
                </div>
                <Clock className="h-12 w-12 text-yellow-200" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Monthly Revenue</p>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(stats.monthlyRevenue)}</p>
                  <p className="text-purple-100 text-sm mt-1">Last 30 days</p>
                </div>
                <BarChart3 className="h-12 w-12 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Average Commission</p>
                <p className="text-3xl font-bold mt-2 text-gray-900">{formatCurrency(stats.averageCommission)}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Target className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Refunded Commissions</p>
                <p className="text-3xl font-bold mt-2 text-red-600">{formatCurrency(stats.refundedCommissions)}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <TrendingDown className="h-8 w-8 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search transactions..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="released">Collected</option>
              <option value="escrowed">Pending</option>
              <option value="refunded">Refunded</option>
            </select>

            {/* Payment Method Filter */}
            <select
              value={filters.paymentMethod}
              onChange={(e) => setFilters({ ...filters, paymentMethod: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Payment Methods</option>
              <option value="telebirr">Telebirr</option>
              <option value="chapa">Chapa</option>
              <option value="bibit">Bibit</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Commission Transactions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Commission Transactions</CardTitle>
              <CardDescription>
                {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''} found
              </CardDescription>
            </div>
            <Button onClick={loadTransactions} variant="outline" size="sm">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Transaction</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Buyer/Seller</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Transaction Amount</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Commission</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Payment</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Date</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTransactions.length > 0 ? (
                  paginatedTransactions.map((transaction) => (
                    <React.Fragment key={transaction.id}>
                      <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => toggleRowExpansion(transaction.id)}
                              className="p-1 hover:bg-gray-200 rounded"
                            >
                              {expandedRows.has(transaction.id) ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </button>
                            <div>
                              <div className="font-medium text-sm">{transaction.listing?.title || 'N/A'}</div>
                              <div className="text-xs text-gray-500">{transaction.id.slice(0, 8)}...</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div>
                            <div className="text-sm font-medium">{transaction.buyer?.full_name || 'N/A'}</div>
                            <div className="text-xs text-gray-500">{transaction.seller?.full_name || 'N/A'}</div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-semibold">{formatCurrency(transaction.amount, transaction.currency)}</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-semibold text-green-600">
                            {formatCurrency(transaction.commission?.amount || 0, transaction.currency)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {transaction.commission?.rate || 0}% rate
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            {getPaymentMethodIcon(transaction.payment_method)}
                            <span className="text-sm capitalize">{transaction.payment_method}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          {getStatusBadge(transaction.status)}
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm">{formatDate(transaction.created_at)}</div>
                        </td>
                      </tr>

                      {/* Expanded Row */}
                      {expandedRows.has(transaction.id) && (
                        <tr>
                          <td colSpan={7} className="bg-gray-50 p-4">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                              <div>
                                <h4 className="font-semibold text-sm mb-2">Commission Details</h4>
                                <div className="space-y-1 text-sm">
                                  <div>
                                    <span className="text-gray-600">Amount:</span>{' '}
                                    <span className="font-semibold">{formatCurrency(transaction.commission?.amount || 0, transaction.currency)}</span>
                                  </div>
                                  <div><span className="text-gray-600">Rate:</span> {transaction.commission?.rate || 0}%</div>
                                  <div>
                                    <span className="text-gray-600">Net Amount:</span>{' '}
                                    {formatCurrency(transaction.amount - (transaction.commission?.amount || 0), transaction.currency)}
                                  </div>
                                </div>
                              </div>

                              <div>
                                <h4 className="font-semibold text-sm mb-2">Transaction Info</h4>
                                <div className="space-y-1 text-sm">
                                  <div><span className="text-gray-600">ID:</span> {transaction.id}</div>
                                  <div><span className="text-gray-600">Reference:</span> {transaction.payment_details?.reference || 'N/A'}</div>
                                  <div><span className="text-gray-600">Date:</span> {formatDate(transaction.created_at)}</div>
                                </div>
                              </div>

                              <div>
                                <h4 className="font-semibold text-sm mb-2">Contact</h4>
                                <div className="space-y-1 text-sm">
                                  <div><span className="text-gray-600">Buyer:</span> {transaction.buyer?.email || 'N/A'}</div>
                                  <div><span className="text-gray-600">Phone:</span> {transaction.buyer?.phone || 'N/A'}</div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-12">
                      <div className="flex flex-col items-center">
                        <DollarSign className="h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-gray-500">No commission transactions found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-600">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredTransactions.length)} of {filteredTransactions.length} results
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <div className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CommissionTracking;
