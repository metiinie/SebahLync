import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Home, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search, 
  Filter, 
  Download, 
  RefreshCw,
  Eye,
  Edit,
  Shield,
  MapPin,
  Calendar,
  Star,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Ban,
  HomeIcon,
  TrendingUp,
  DollarSign,
  Users,
  Image as ImageIcon
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { formatRelativeTime, formatPrice } from '../lib/utils';
import { toast } from 'sonner';
import { Listing } from '../types';

interface ListingStatusManagementProps {
  listings: Listing[];
  loading?: boolean;
  onApproveListing: (listingId: string) => void;
  onRejectListing: (listingId: string) => void;
  onActivateListing: (listingId: string) => void;
  onDeactivateListing: (listingId: string) => void;
  onRefresh: () => void;
  onUpdateListing?: (listingId: string, updates: Partial<Listing>) => void;
}

const ListingStatusManagement: React.FC<ListingStatusManagementProps> = ({
  listings,
  loading = false,
  onApproveListing,
  onRejectListing,
  onActivateListing,
  onDeactivateListing,
  onRefresh,
  onUpdateListing
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedListings, setSelectedListings] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  const filteredListings = listings
    .filter(listing => {
      const matchesSearch = searchTerm === '' || 
        listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.location?.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.owner?.full_name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === 'all' || listing.status === filterStatus;
      const matchesType = filterType === 'all' || listing.type === filterType;
      const matchesCategory = filterCategory === 'all' || listing.category === filterCategory;
      
      return matchesSearch && matchesStatus && matchesType && matchesCategory;
    })
    .sort((a, b) => {
      const aValue = a[sortBy as keyof Listing];
      const bValue = b[sortBy as keyof Listing];
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const handleSelectListing = (listingId: string) => {
    setSelectedListings(prev => 
      prev.includes(listingId) 
        ? prev.filter(id => id !== listingId)
        : [...prev, listingId]
    );
  };

  const handleSelectAll = () => {
    if (selectedListings.length === filteredListings.length) {
      setSelectedListings([]);
    } else {
      setSelectedListings(filteredListings.map(listing => listing.id));
    }
  };

  const handleBulkApprove = () => {
    selectedListings.forEach(listingId => {
      const listing = listings.find(l => l.id === listingId);
      if (listing && listing.status === 'pending') {
        onApproveListing(listingId);
      }
    });
    setSelectedListings([]);
    toast.success(`Approved ${selectedListings.length} listings`);
  };

  const handleBulkReject = () => {
    selectedListings.forEach(listingId => {
      onRejectListing(listingId);
    });
    setSelectedListings([]);
    toast.success(`Rejected ${selectedListings.length} listings`);
  };

  const handleBulkActivate = () => {
    selectedListings.forEach(listingId => {
      const listing = listings.find(l => l.id === listingId);
      if (listing && !listing.is_active) {
        onActivateListing(listingId);
      }
    });
    setSelectedListings([]);
    toast.success(`Activated ${selectedListings.length} listings`);
  };

  const handleBulkDeactivate = () => {
    selectedListings.forEach(listingId => {
      onDeactivateListing(listingId);
    });
    setSelectedListings([]);
    toast.success(`Deactivated ${selectedListings.length} listings`);
  };

  const handleExport = () => {
    const csvData = filteredListings.map(listing => 
      `${listing.title},${listing.type},${listing.category},${listing.price},${listing.status},${listing.verified},${listing.is_active},${listing.owner?.full_name || ''},${listing.location?.city || ''}`
    ).join('\n');
    
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'listings.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Listings exported successfully');
  };

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      case 'sold':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'rented':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'inactive':
        return <Ban className="h-4 w-4" />;
      default:
        return <Clock3 className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'sale':
        return 'bg-green-100 text-green-800';
      case 'rent':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse"></div>
          <div className="flex space-x-3">
            <div className="h-8 bg-gray-200 rounded w-24 animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded w-24 animate-pulse"></div>
          </div>
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-20"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Listing Status Management</h2>
          <p className="text-gray-600">Manage listing status, approval, and visibility</p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge className="bg-blue-100 text-blue-800">
            {listings.length} Total Listings
          </Badge>
          <Badge className="bg-yellow-100 text-yellow-800">
            {listings.filter(l => l.status === 'pending').length} Pending
          </Badge>
          <Badge className="bg-green-100 text-green-800">
            {listings.filter(l => l.status === 'approved').length} Approved
          </Badge>
          <Button variant="outline" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search listings by title, description, location, or owner..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="sold">Sold</option>
            <option value="rented">Rented</option>
            <option value="inactive">Inactive</option>
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="all">All Types</option>
            <option value="sale">Sale</option>
            <option value="rent">Rent</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="all">All Categories</option>
            <option value="residential">Residential</option>
            <option value="commercial">Commercial</option>
            <option value="land">Land</option>
            <option value="industrial">Industrial</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="created_at">Sort by Date</option>
            <option value="title">Sort by Title</option>
            <option value="price">Sort by Price</option>
            <option value="status">Sort by Status</option>
          </select>

          <Button
            variant="outline"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </Button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedListings.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium">
              {selectedListings.length} listing(s) selected
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkApprove}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve Selected
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkReject}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject Selected
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkActivate}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Activate Selected
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkDeactivate}
            >
              <Ban className="h-4 w-4 mr-2" />
              Deactivate Selected
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedListings([])}
          >
            Clear Selection
          </Button>
        </div>
      )}

      {/* Export Button */}
      <div className="flex justify-end">
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export Listings
        </Button>
      </div>

      {/* Listings List */}
      <div className="space-y-4">
        {filteredListings.length === 0 ? (
          <div className="text-center py-12">
            <Home className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No listings found</h3>
            <p className="text-gray-600">No listings match your search criteria</p>
          </div>
        ) : (
          filteredListings.map((listing, index) => (
            <motion.div
              key={listing.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`${selectedListings.includes(listing.id) ? 'ring-2 ring-blue-500' : ''}`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <input
                        type="checkbox"
                        checked={selectedListings.includes(listing.id)}
                        onChange={() => handleSelectListing(listing.id)}
                        className="mt-1"
                      />
                      
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                        {listing.images?.[0]?.url ? (
                          <img
                            src={listing.images[0].url}
                            alt={listing.title}
                            className="w-16 h-16 object-cover"
                          />
                        ) : (
                          <ImageIcon className="h-8 w-8 text-gray-500" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-medium text-gray-900">{listing.title}</h3>
                          <Badge className={getStatusColor(listing.status)}>
                            {getStatusIcon(listing.status)}
                            <span className="ml-1">{listing.status}</span>
                          </Badge>
                          <Badge className={getTypeColor(listing.type)}>
                            {listing.type}
                          </Badge>
                          {listing.verified && (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                          {!listing.is_active && (
                            <Badge className="bg-red-100 text-red-800">
                              <Ban className="h-3 w-3 mr-1" />
                              Inactive
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                          <div className="flex items-center">
                            <DollarSign className="h-4 w-4 mr-1" />
                            {formatPrice(listing.price)} {listing.currency}
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {listing.location?.city || 'Unknown Location'}
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {formatRelativeTime(listing.created_at)}
                          </div>
                        </div>

                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Home className="h-4 w-4 mr-1" />
                            {listing.category}
                          </span>
                          {listing.bedrooms && (
                            <span className="flex items-center">
                              <Users className="h-4 w-4 mr-1" />
                              {listing.bedrooms} bed
                            </span>
                          )}
                          {listing.bathrooms && (
                            <span className="flex items-center">
                              <Users className="h-4 w-4 mr-1" />
                              {listing.bathrooms} bath
                            </span>
                          )}
                          {listing.area && (
                            <span className="flex items-center">
                              <TrendingUp className="h-4 w-4 mr-1" />
                              {listing.area} sqft
                            </span>
                          )}
                        </div>

                        {listing.owner && (
                          <div className="text-sm text-gray-500 mt-1">
                            Owner: {listing.owner.full_name} ({listing.owner.email})
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {listing.status === 'pending' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onApproveListing(listing.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                      )}
                      {listing.status === 'pending' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onRejectListing(listing.id)}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      )}
                      {listing.is_active ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDeactivateListing(listing.id)}
                        >
                          <Ban className="h-4 w-4 mr-1" />
                          Deactivate
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onActivateListing(listing.id)}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Activate
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          toast.info(`Viewing details for ${listing.title}`);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Pagination Info */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <div>
          Showing {filteredListings.length} of {listings.length} listings
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
          >
            {selectedListings.length === filteredListings.length ? 'Deselect All' : 'Select All'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ListingStatusManagement;
