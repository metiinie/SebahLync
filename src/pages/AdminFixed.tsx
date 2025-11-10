import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, 
  ShoppingBag, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle,
  Shield,
  BarChart3,
  Settings,
  Bell,
  RefreshCw
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { ListingsService } from '../services/listings';
import { TransactionsService } from '../services/transactions';
import { UsersService } from '../services/users';
import { Listing, User } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import AdminStatsSimple from '../components/AdminStatsSimple';
import UserManagement from '../components/UserManagement';
import ListingStatusManagement from '../components/ListingStatusManagement';
import VerifyListings from '../components/VerifyListings';
import AdminDebug from '../components/AdminDebug';
import EscrowManagement from '../components/EscrowManagement';
import CommissionTracking from '../components/CommissionTracking';

// Admin-specific interfaces - matches AdminStatsSimple interface
interface AdminStats {
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
}

const AdminFixed: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'dashboard');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats>({});
  const [users, setUsers] = useState<User[]>([]);
  const [pendingListings, setPendingListings] = useState<Listing[]>([]);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'verify-listings', label: 'Verify Listings', icon: ShoppingBag },
    { id: 'listing-status', label: 'Listing Status', icon: Shield },
    { id: 'manage-users', label: 'Manage Users', icon: Users },
    { id: 'debug', label: 'Debug', icon: AlertTriangle },
    { id: 'manage-escrow', label: 'Manage Escrow', icon: Shield },
    { id: 'commission-tracking', label: 'Commission Tracking', icon: DollarSign },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const loadData = useCallback(async () => {
    if (!user || user.role !== 'admin') return;

    try {
      setLoading(true);

      // Load basic data for all tabs
      await Promise.all([
        loadDashboardData(),
        loadPendingListings(),
        loadUsers()
      ]);
    } catch (error) {
      console.error('Error loading admin data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user?.role === 'admin') {
      loadData();
    }
  }, [activeTab, user, loadData]);

  // Listen for listing deletion events from other dashboards
  useEffect(() => {
    const handleListingDeleted = (event: CustomEvent) => {
      console.log('Admin dashboard received listing deletion event:', event.detail);
      // Refresh listings to remove the deleted item
      loadPendingListings();
    };

    window.addEventListener('listingDeleted', handleListingDeleted as EventListener);
    
    return () => {
      window.removeEventListener('listingDeleted', handleListingDeleted as EventListener);
    };
  }, []);

  const loadDashboardData = async () => {
    try {
      const [listingsStats, transactionsStats, usersStats] = await Promise.all([
        ListingsService.getListingStats().catch(() => ({ success: true, data: null })),
        TransactionsService.getTransactionStats().catch(() => ({ success: true, data: null })),
        UsersService.getUserStats().catch(() => ({ success: true, data: null })),
      ]);

      setStats({
        listings: listingsStats.success && listingsStats.data ? listingsStats.data as AdminStats['listings'] : undefined,
        transactions: transactionsStats.success && transactionsStats.data ? transactionsStats.data as AdminStats['transactions'] : undefined,
        users: usersStats.success && usersStats.data ? usersStats.data as AdminStats['users'] : undefined,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setStats({
        listings: undefined,
        transactions: undefined,
        users: undefined,
      });
    }
  };

  const loadPendingListings = async () => {
    try {
      // Get all listings for admin (including pending)
      const response = await ListingsService.getAllListingsForAdmin({ page: 1, limit: 100 });
      console.log('Admin listings response:', response);
      if (response.success) {
        // Set all listings for status management
        setPendingListings(response.data);
        console.log('Loaded listings:', response.data);
      } else {
        console.error('Failed to load listings:', response.message);
        setPendingListings([]);
      }
    } catch (error) {
      console.error('Error loading listings:', error);
      setPendingListings([]);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await UsersService.getAllUsers({ page: 1, limit: 50 });
      if (response.success) {
        setUsers(response.data);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers([]);
    }
  };

  const handleVerifyUser = async (userId: string) => {
    try {
      const response = await UsersService.verifyUser(userId);
      if (response.success) {
        toast.success('User verified successfully');
        await loadUsers();
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      toast.error('Failed to verify user');
      console.error('Error verifying user:', error);
    }
  };

  const handleSuspendUser = async (userId: string) => {
    try {
      const response = await UsersService.suspendUser(userId);
      if (response.success) {
        toast.success('User suspended successfully');
        await loadUsers();
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      toast.error('Failed to suspend user');
      console.error('Error suspending user:', error);
    }
  };

  const handleUpdateUser = async (userId: string, updates: Partial<User>) => {
    try {
      const response = await UsersService.updateUser(userId, updates);
      if (response.success) {
        toast.success('User updated successfully');
        await loadUsers();
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      toast.error('Failed to update user');
      console.error('Error updating user:', error);
    }
  };

  const handleApproveListing = async (listingId: string) => {
    try {
      const response = await ListingsService.updateListing(listingId, {
        status: 'approved',
        verified: true,
        is_active: true
      });
      if (response.success) {
        toast.success('Listing approved successfully');
        await loadPendingListings();
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      toast.error('Failed to approve listing');
      console.error('Error approving listing:', error);
    }
  };

  const handleRejectListing = async (listingId: string) => {
    try {
      const response = await ListingsService.updateListing(listingId, {
        status: 'rejected',
        verified: false,
        is_active: false
      });
      if (response.success) {
        toast.success('Listing rejected successfully');
        await loadPendingListings();
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      toast.error('Failed to reject listing');
      console.error('Error rejecting listing:', error);
    }
  };

  const handleActivateListing = async (listingId: string) => {
    try {
      const response = await ListingsService.updateListing(listingId, {
        is_active: true
      });
      if (response.success) {
        toast.success('Listing activated successfully');
        await loadPendingListings();
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      toast.error('Failed to activate listing');
      console.error('Error activating listing:', error);
    }
  };

  const handleDeactivateListing = async (listingId: string) => {
    try {
      const response = await ListingsService.updateListing(listingId, {
        is_active: false
      });
      if (response.success) {
        toast.success('Listing deactivated successfully');
        await loadPendingListings();
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      toast.error('Failed to deactivate listing');
      console.error('Error deactivating listing:', error);
    }
  };

  const handleUpdateListing = async (listingId: string, updates: Partial<Listing>) => {
    try {
      const response = await ListingsService.updateListing(listingId, updates);
      if (response.success) {
        toast.success('Listing updated successfully');
        await loadPendingListings();
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      toast.error('Failed to update listing');
      console.error('Error updating listing:', error);
    }
  };

  const handleDeleteListing = async (listingId: string) => {
    if (!confirm('Are you sure you want to delete this listing? This action cannot be undone.')) return;

    console.log('🗑️ Admin deleting listing:', listingId);
    console.log('📊 Current pending listings before delete:', pendingListings.length);

    try {
      const response = await ListingsService.deleteListing(listingId);
      console.log('📡 Admin delete response:', response);
      
      if (response.success) {
        console.log('✅ Admin delete successful, updating UI state');
        toast.success('Listing deleted successfully');
        
        // Update local state immediately for better UX
        const updatedListings = pendingListings.filter(listing => listing.id !== listingId);
        console.log('📈 Updated pending listings count:', updatedListings.length);
        
        setPendingListings(updatedListings);
        
        // Also reload from server to ensure consistency
        await loadPendingListings();
        
        console.log('🎉 Admin delete process completed successfully');
      } else {
        console.error('❌ Admin delete failed:', response.message);
        toast.error(response.message || 'Failed to delete listing');
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('💥 Error during admin delete process:', error);
      toast.error('Failed to delete listing. Please try again.');
      // Reload from server to ensure consistency
      await loadPendingListings();
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    await loadData();
    toast.success('Data refreshed');
  };

  // Helper function to get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'sold':
        return 'bg-blue-100 text-blue-800';
      case 'rented':
        return 'bg-purple-100 text-purple-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Helper function to capitalize and format status text
  const formatStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      <AdminStatsSimple stats={stats} loading={loading} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ShoppingBag className="h-5 w-5 mr-2" />
              Recent Listings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingListings.length > 0 ? (
                pendingListings.slice(0, 5).map((listing) => (
                  <div key={listing.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <img
                        src={listing.images?.[0]?.url || '/placeholder-image.jpg'}
                        alt={listing.title}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                      <div>
                        <p className="font-medium text-sm">{listing.title}</p>
                        <p className="text-xs text-gray-600">{listing.location?.city || 'Unknown'}</p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(listing.status)}>
                      {formatStatusText(listing.status)}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No pending listings</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Recent Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users.length > 0 ? (
                users.slice(0, 5).map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-gray-500" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{user.full_name}</p>
                        <p className="text-xs text-gray-600">{user.email}</p>
                      </div>
                    </div>
                    <Badge className={user.verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                      {user.verified ? 'Verified' : 'Pending'}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No users found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderVerifyListings = () => (
    <VerifyListings
      listings={pendingListings.filter(listing => listing.status === 'pending')}
      loading={loading}
      onApproveListing={handleApproveListing}
      onRejectListing={handleRejectListing}
      onDeleteListing={handleDeleteListing}
      onRefresh={handleRefresh}
    />
  );

  const renderListingStatus = () => (
    <ListingStatusManagement
      listings={pendingListings}
      loading={loading}
      onApproveListing={handleApproveListing}
      onRejectListing={handleRejectListing}
      onActivateListing={handleActivateListing}
      onDeactivateListing={handleDeactivateListing}
      onRefresh={handleRefresh}
      onUpdateListing={handleUpdateListing}
    />
  );

  const renderManageUsers = () => (
    <UserManagement
      users={users}
      loading={loading}
      onVerifyUser={handleVerifyUser}
      onSuspendUser={handleSuspendUser}
      onRefresh={handleRefresh}
      onUpdateUser={handleUpdateUser}
    />
  );

  const renderDebug = () => (
    <AdminDebug
      listings={pendingListings}
      users={users}
      stats={stats}
      loading={loading}
    />
  );

  const renderManageEscrow = () => (
    <EscrowManagement loading={loading} />
  );

  const renderCommissionTracking = () => (
    <CommissionTracking loading={loading} />
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboard();
      case 'verify-listings':
        return renderVerifyListings();
      case 'listing-status':
        return renderListingStatus();
      case 'manage-users':
        return renderManageUsers();
      case 'debug':
        return renderDebug();
      case 'manage-escrow':
        return renderManageEscrow();
      case 'commission-tracking':
        return renderCommissionTracking();
      default:
        return (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {tabs.find(t => t.id === activeTab)?.label}
            </h3>
            <p className="text-gray-600">This section is under development.</p>
          </div>
        );
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access the admin panel</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Panel</h1>
              <p className="text-gray-600">Manage your SebahLync platform</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" onClick={handleRefresh} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-[#0B132B] text-[#0B132B]'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {renderTabContent()}
        </motion.div>
      </div>
    </div>
  );
};

export default AdminFixed;
