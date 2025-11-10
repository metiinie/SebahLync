import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  ArrowUpCircle,
  ArrowDownCircle,
  Wallet,
  CreditCard,
  Smartphone,
  Building2,
  FileText,
  RefreshCw,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { TransactionsService } from '../services/transactions';
import { Transaction } from '../types';
import { toast } from 'sonner';
import { formatCurrency } from '../lib/supabase';

interface EscrowManagementProps {
  loading?: boolean;
}

interface FilterState {
  status: string;
  paymentMethod: string;
  dateRange: string;
  search: string;
}

interface EscrowStats {
  totalEscrow: number;
  totalValue: number;
  pendingRelease: number;
  pendingValue: number;
  completedToday: number;
  disputesOpen: number;
}



const EscrowManagement: React.FC<EscrowManagementProps> = ({ loading: initialLoading = false }) => {
  const [loading, setLoading] = useState(initialLoading);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<EscrowStats>({
    totalEscrow: 0,
    totalValue: 0,
    pendingRelease: 0,
    pendingValue: 0,
    completedToday: 0,
    disputesOpen: 0,
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
      const response = await TransactionsService.getTransactionsByStatus('escrowed', { page: 1, limit: 1000 });
      
      if (response.success && response.data) {
        setTransactions(response.data);
        
        // Calculate stats
        const totalValue = response.data.reduce((sum, t) => sum + t.amount, 0);
        const pending = response.data.filter(t => t.status === 'escrowed').length;
        const pendingValue = response.data
          .filter(t => t.status === 'escrowed')
          .reduce((sum, t) => sum + t.amount, 0);
        const disputes = response.data.filter(t => t.status === 'disputed').length;
        
        setStats({
          totalEscrow: response.data.length,
          totalValue,
          pendingRelease: pending,
          pendingValue,
          completedToday: 0,
          disputesOpen: disputes,
        });
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
      toast.error('Failed to load escrow transactions');
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

  const handleReleaseEscrow = async (transactionId: string) => {
    if (!confirm('Are you sure you want to release escrow funds to the seller?')) return;

    try {
      setLoading(true);
      const response = await TransactionsService.releaseEscrow(transactionId, 'admin-id');
      
      if (response.success) {
        toast.success('Escrow funds released successfully');
        await loadTransactions();
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      toast.error('Failed to release escrow funds');
      console.error('Error releasing escrow:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async (transactionId: string) => {
    if (!confirm('Are you sure you want to refund this transaction?')) return;

    try {
      setLoading(true);
      const response = await TransactionsService.refundTransaction(transactionId, 'admin-id', 'Refunded by admin');
      
      if (response.success) {
        toast.success('Transaction refunded successfully');
        await loadTransactions();
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      toast.error('Failed to refund transaction');
      console.error('Error refunding transaction:', error);
    } finally {
      setLoading(false);
    }
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
      escrowed: { label: 'In Escrow', color: 'bg-blue-500 text-white', icon: Shield },
      released: { label: 'Released', color: 'bg-green-500 text-white', icon: CheckCircle },
      refunded: { label: 'Refunded', color: 'bg-red-500 text-white', icon: XCircle },
      disputed: { label: 'Disputed', color: 'bg-orange-500 text-white', icon: AlertCircle },
      pending: { label: 'Pending', color: 'bg-yellow-500 text-white', icon: Clock },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
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
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Escrow</p>
                  <p className="text-2xl font-bold mt-1">{stats.totalEscrow}</p>
                  <p className="text-blue-100 text-sm mt-1">{formatCurrency(stats.totalValue)}</p>
                </div>
                <Shield className="h-12 w-12 text-blue-200" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm font-medium">Pending Release</p>
                  <p className="text-2xl font-bold mt-1">{stats.pendingRelease}</p>
                  <p className="text-yellow-100 text-sm mt-1">{formatCurrency(stats.pendingValue)}</p>
                </div>
                <Clock className="h-12 w-12 text-yellow-200" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Completed Today</p>
                  <p className="text-2xl font-bold mt-1">{stats.completedToday}</p>
                </div>
                <CheckCircle className="h-12 w-12 text-green-200" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Open Disputes</p>
                  <p className="text-2xl font-bold mt-1">{stats.disputesOpen}</p>
                </div>
                <AlertCircle className="h-12 w-12 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
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
              <option value="escrowed">In Escrow</option>
              <option value="released">Released</option>
              <option value="refunded">Refunded</option>
              <option value="disputed">Disputed</option>
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

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Escrow Transactions</CardTitle>
              <CardDescription>
                {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''} found
              </CardDescription>
            </div>
            <Button onClick={loadTransactions} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
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
                  <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Amount</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Payment</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Actions</th>
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
                          {transaction.commission && (
                            <div className="text-xs text-gray-500">
                              Fee: {formatCurrency(transaction.commission.amount, transaction.currency)}
                            </div>
                          )}
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
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            {transaction.status === 'escrowed' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleReleaseEscrow(transaction.id)}
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <ArrowUpCircle className="h-4 w-4 mr-1" />
                                  Release
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRefund(transaction.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <ArrowDownCircle className="h-4 w-4 mr-1" />
                                  Refund
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Row */}
                      {expandedRows.has(transaction.id) && (
                        <tr>
                          <td colSpan={7} className="bg-gray-50 p-4">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                              <div>
                                <h4 className="font-semibold text-sm mb-2">Transaction Details</h4>
                                <div className="space-y-1 text-sm">
                                  <div><span className="text-gray-600">ID:</span> {transaction.id}</div>
                                  <div><span className="text-gray-600">Reference:</span> {transaction.payment_details?.reference || 'N/A'}</div>
                                  <div><span className="text-gray-600">Commission:</span> {transaction.commission?.rate || 0}%</div>
                                </div>
                              </div>

                              <div>
                                <h4 className="font-semibold text-sm mb-2">Escrow Info</h4>
                                <div className="space-y-1 text-sm">
                                  <div><span className="text-gray-600">Escrowed:</span> {transaction.escrow?.is_escrowed ? 'Yes' : 'No'}</div>
                                  {transaction.escrow?.escrow_date && (
                                    <div><span className="text-gray-600">Date:</span> {formatDate(transaction.escrow.escrow_date)}</div>
                                  )}
                                  {transaction.escrow?.release_date && (
                                    <div><span className="text-gray-600">Release:</span> {formatDate(transaction.escrow.release_date)}</div>
                                  )}
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
                        <Shield className="h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-gray-500">No transactions found</p>
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

export default EscrowManagement;
