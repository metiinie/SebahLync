import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Home, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search, 
  Download, 
  RefreshCw,
  Eye,
  MapPin,
  Calendar,
  Image as ImageIcon,
  User,
  Phone,
  Mail,
  Bed,
  Bath,
  Square,
  Building,
  Factory
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { formatRelativeTime, formatPrice } from '../lib/utils';
import { toast } from 'sonner';
import { Listing } from '../types';

interface VerifyListingsProps {
  listings: Listing[];
  loading?: boolean;
  onApproveListing: (listingId: string) => void;
  onRejectListing: (listingId: string) => void;
  onDeleteListing?: (listingId: string) => void;
  onRefresh: () => void;
  onViewListing?: (listingId: string) => void;
}

const VerifyListings: React.FC<VerifyListingsProps> = ({
  listings,
  loading = false,
  onApproveListing,
  onRejectListing,
  onDeleteListing,
  onRefresh,
  onViewListing
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedListings, setSelectedListings] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showListingDetails, setShowListingDetails] = useState(false);

  const filteredListings = listings
    .filter(listing => {
      const matchesSearch = searchTerm === '' || 
        listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.location?.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.owner?.full_name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = filterType === 'all' || listing.type === filterType;
      const matchesCategory = filterCategory === 'all' || listing.category === filterCategory;
      
      return matchesSearch && matchesType && matchesCategory;
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
      onApproveListing(listingId);
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

  const handleExport = () => {
    const csvData = filteredListings.map(listing => 
      `${listing.title},${listing.type},${listing.category},${listing.price},${listing.status},${listing.verified},${listing.is_active},${listing.owner?.full_name || ''},${listing.location?.city || ''}`
    ).join('\n');
    
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pending-listings.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Listings exported successfully');
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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'residential':
        return <Home className="h-4 w-4" />;
      case 'commercial':
        return <Building className="h-4 w-4" />;
      case 'land':
        return <MapPin className="h-4 w-4" />;
      case 'industrial':
        return <Factory className="h-4 w-4" />;
      default:
        return <Home className="h-4 w-4" />;
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
          <h2 className="text-2xl font-bold text-gray-900">Verify Listings</h2>
          <p className="text-gray-600">Review and approve pending property listings</p>
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
                  <div className="flex items-start space-x-6">
                    <input
                      type="checkbox"
                      checked={selectedListings.includes(listing.id)}
                      onChange={() => handleSelectListing(listing.id)}
                      className="mt-1"
                    />
                    
                    <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                      {listing.images?.[0]?.url ? (
                        <img
                          src={listing.images[0].url}
                          alt={listing.title}
                          className="w-32 h-32 object-cover"
                        />
                      ) : (
                        <ImageIcon className="h-12 w-12 text-gray-500" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-xl font-semibold text-gray-900">{listing.title}</h3>
                            <Badge className={getTypeColor(listing.type)}>
                              {listing.type}
                            </Badge>
                            <Badge variant="outline" className="flex items-center gap-1">
                              {getCategoryIcon(listing.category)}
                              {listing.category}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center text-gray-600 mb-2">
                            <MapPin className="h-4 w-4 mr-1" />
                            <span>{listing.location?.city || 'Unknown'}, {listing.location?.subcity || 'Unknown'}</span>
                          </div>
                          
                          <div className="flex items-center text-gray-600 mb-2">
                            <Calendar className="h-4 w-4 mr-1" />
                            <span>Posted {formatRelativeTime(listing.created_at)}</span>
                          </div>

                          {listing.owner && (
                            <div className="flex items-center text-gray-600 mb-2">
                              <User className="h-4 w-4 mr-1" />
                              <span>Owner: {listing.owner.full_name}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="text-right">
                          <div className="text-2xl font-bold text-[#0B132B] mb-2">
                            {formatPrice(listing.price, listing.currency)}
                          </div>
                          <Badge className="bg-yellow-100 text-yellow-800">
                            Pending Verification
                          </Badge>
                        </div>
                      </div>

                      <p className="text-gray-700 mb-4 line-clamp-2">{listing.description}</p>

                      {/* Property Details */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        {listing.bedrooms && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Bed className="h-4 w-4 mr-1" />
                            <span>{listing.bedrooms} bed{listing.bedrooms > 1 ? 's' : ''}</span>
                          </div>
                        )}
                        {listing.bathrooms && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Bath className="h-4 w-4 mr-1" />
                            <span>{listing.bathrooms} bath{listing.bathrooms > 1 ? 's' : ''}</span>
                          </div>
                        )}
                        {listing.area && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Square className="h-4 w-4 mr-1" />
                            <span>{listing.area} sqft</span>
                          </div>
                        )}
                        {listing.year_built && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="h-4 w-4 mr-1" />
                            <span>Built {listing.year_built}</span>
                          </div>
                        )}
                      </div>

                      {/* Features */}
                      {listing.features && listing.features.length > 0 && (
                        <div className="mb-4">
                          <div className="flex flex-wrap gap-2">
                            {listing.features.slice(0, 6).map((feature, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                            {listing.features.length > 6 && (
                              <Badge variant="outline" className="text-xs">
                                +{listing.features.length - 6} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center text-sm text-gray-500">
                            <Eye className="h-4 w-4 mr-1" />
                            <span>{listing.views || 0} views</span>
                          </div>
                          {listing.owner?.phone && (
                            <div className="flex items-center text-sm text-gray-500">
                              <Phone className="h-4 w-4 mr-1" />
                              <span>{listing.owner.phone}</span>
                            </div>
                          )}
                          {listing.owner?.email && (
                            <div className="flex items-center text-sm text-gray-500">
                              <Mail className="h-4 w-4 mr-1" />
                              <span>{listing.owner.email}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex space-x-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedListing(listing);
                              setShowListingDetails(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onRejectListing(listing.id)}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => onApproveListing(listing.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          {onDeleteListing && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onDeleteListing(listing.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          )}
                        </div>
                      </div>
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

export default VerifyListings;
