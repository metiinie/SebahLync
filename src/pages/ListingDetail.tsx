import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  MapPin, 
  Eye, 
  Heart, 
  Share2, 
  Star, 
  DollarSign,
  Car,
  Home,
  Building,
  TreePine,
  Package,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { ListingsService } from '../services/listings';
import { FavoritesService } from '../services/favorites';
import { Listing } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const ListingDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    if (id) {
      loadListing();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadListing = async () => {
    try {
      setLoading(true);
      const response = await ListingsService.getListingById(id!);
      if (response.success && response.data) {
        setListing(response.data);
        // Increment view count
        await ListingsService.incrementViews(id!);
        
        // Check if listing is favorited
        if (user) {
          const favoriteResult = await FavoritesService.isFavorited(user.id, id!);
          if (favoriteResult.success) {
            setIsFavorite(favoriteResult.isFavorited);
          }
        }
      } else {
        toast.error('Listing not found');
        navigate('/listings');
      }
    } catch (error) {
      console.error('Error loading listing:', error);
      toast.error('Failed to load listing');
      navigate('/listings');
    } finally {
      setLoading(false);
    }
  };

  const handleBuyNow = async () => {
    if (!user) {
      toast.error('Please login to proceed with purchase');
      navigate('/login', { state: { from: `/listing/${id}` } });
      return;
    }

    if (!listing) {
      toast.error('Listing information not available');
      return;
    }

    try {
      setProcessingPayment(true);

      // Navigate to payment page
      navigate(`/payment/${listing.id}`);
    } catch (error) {
      console.error('Error initiating purchase:', error);
      toast.error('Failed to initiate purchase');
    } finally {
      setProcessingPayment(false);
    }
  };

  const toggleFavorite = async () => {
    if (!user) {
      toast.error('Please login to add favorites');
      navigate('/login', { state: { from: `/listing/${id}` } });
      return;
    }

    if (!id) return;

    try {
      const result = await FavoritesService.toggleFavorite(user.id, id);
      if (result.success) {
        setIsFavorite(result.isFavorited);
        toast.success(result.isFavorited ? 'Added to favorites' : 'Removed from favorites');
      } else {
        toast.error(result.message || 'Failed to update favorites');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update favorites');
    }
  };

  const handleShare = async () => {
    if (!listing) return;

    const shareData = {
      title: listing.title,
      text: `${listing.title} - ${formatPrice(listing.price, listing.currency, listing.type, listing.rent_period)}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast.success('Listing shared successfully');
      } catch (error) {
        // User cancelled the share dialog
        if ((error as Error).name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard');
      } catch (error) {
        console.error('Error copying to clipboard:', error);
        toast.error('Failed to share listing');
      }
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'car': return <Car className="w-6 h-6" />;
      case 'house': return <Home className="w-6 h-6" />;
      case 'commercial': return <Building className="w-6 h-6" />;
      case 'land': return <TreePine className="w-6 h-6" />;
      default: return <Package className="w-6 h-6" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'car': return 'bg-blue-100 text-blue-800';
      case 'house': return 'bg-green-100 text-green-800';
      case 'commercial': return 'bg-purple-100 text-purple-800';
      case 'land': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatPrice = (price: number, currency: string, type: string, rentPeriod?: string) => {
    const formattedPrice = price.toLocaleString();
    if (type === 'rent' && rentPeriod) {
      return `${currency} ${formattedPrice} / ${rentPeriod}`;
    }
    return `${currency} ${formattedPrice}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 flex items-center gap-1"><CheckCircle className="w-3 h-3" />Active</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1"><Clock className="w-3 h-3" />Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 flex items-center gap-1"><XCircle className="w-3 h-3" />Rejected</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Listing not found</h3>
          <Button onClick={() => navigate('/buy')}>Back to Buy</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
        <Button
          variant="outline"
              onClick={() => navigate('/listings')}
              className="flex items-center gap-2"
        >
              <ArrowLeft className="w-4 h-4" />
              Back to Listings
        </Button>

            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleBuyNow} disabled={processingPayment}>
                <DollarSign className="w-4 h-4" />
                {listing?.type === 'rent' ? 'Rent' : 'Buy'}
              </Button>
              <Button variant="outline" onClick={toggleFavorite}>
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                {isFavorite ? 'Saved' : 'Save'}
              </Button>
              <Button variant="outline" onClick={handleShare}>
                <Share2 className="w-4 h-4" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <Card>
              <CardContent className="p-0">
                <div className="relative">
                  {listing.images && listing.images.length > 0 ? (
                    <>
                      <div className="relative h-96 bg-gray-100">
                  <img
                          src={listing.images[currentImageIndex].url}
                    alt={listing.title}
                          className="w-full h-full object-cover"
                  />
                  
                  {listing.images.length > 1 && (
                    <>
                      <button
                              onClick={() => setCurrentImageIndex(prev => 
                                prev === 0 ? listing.images.length - 1 : prev - 1
                              )}
                              className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
                            >
                              <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                              onClick={() => setCurrentImageIndex(prev => 
                                prev === listing.images.length - 1 ? 0 : prev + 1
                              )}
                              className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
                            >
                              <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}
                    </div>

                  {listing.images.length > 1 && (
                        <div className="p-4">
                          <div className="flex gap-2 overflow-x-auto">
                            {listing.images.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                                className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 ${
                                  index === currentImageIndex ? 'border-blue-500' : 'border-gray-200'
                          }`}
                        >
                          <img
                            src={image.url}
                                  alt={`${listing.title} ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="h-96 bg-gray-100 flex items-center justify-center">
                      <Package className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Listing Details */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={`${getCategoryColor(listing.category)} flex items-center gap-1`}>
                        {getCategoryIcon(listing.category)}
                        {listing.category}
                      </Badge>
                      <Badge className={listing.type === 'rent' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}>
                        {listing.type === 'rent' ? 'For Rent' : 'For Sale'}
                      </Badge>
                      {getStatusBadge(listing.status)}
                    </div>
                    <CardTitle className="text-2xl">{listing.title}</CardTitle>
                    </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-green-600">
                      {formatPrice(listing.price, listing.currency, listing.type, listing.rent_period)}
                  </div>
                    <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
                      <Eye className="w-4 h-4" />
                      <span>{listing.views || 0} views</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Description</h3>
                    <p className="text-gray-700 leading-relaxed">{listing.description}</p>
                  </div>

                {/* Location */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Location</h3>
                  <div className="flex items-center gap-2 text-gray-700">
                    <MapPin className="w-5 h-5 text-gray-500" />
                    <span>{listing.location.city}, {listing.location.subcity}</span>
                    {listing.location.woreda && <span>• {listing.location.woreda}</span>}
                  </div>
                  </div>

                  {/* Features */}
                  {listing.features && Object.keys(listing.features).length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Features</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {Object.entries(listing.features).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="capitalize">{key.replace(/_/g, ' ')}: {value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Documents */}
                {listing.documents && listing.documents.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Documents</h3>
                    <div className="space-y-2">
                      {listing.documents.map((doc, index) => (
                        <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                          <Package className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">{doc.name}</span>
                          <Button size="sm" variant="outline" asChild>
                            <a href={doc.url} target="_blank" rel="noopener noreferrer">
                              View
                            </a>
                          </Button>
                      </div>
                      ))}
                      </div>
                    </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                  <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={handleBuyNow}
                  disabled={processingPayment || listing.status !== 'approved'}
                >
                  {processingPayment ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <DollarSign className="w-4 h-4 mr-2" />
                      {listing.type === 'rent' ? 'Rent Now' : 'Buy Now'}
                    </>
                  )}
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={toggleFavorite}
                >
                  <Heart className={`w-4 h-4 mr-2 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                  {isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleShare}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Listing
                </Button>
              </CardContent>
            </Card>

            {/* Listing Info */}
            <Card>
              <CardHeader>
                <CardTitle>Listing Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Listed on:</span>
                  <span>{new Date(listing.created_at).toLocaleDateString()}</span>
                  </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Category:</span>
                  <span className="capitalize">{listing.category}</span>
                  </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span>{listing.type === 'rent' ? 'For Rent' : 'For Sale'}</span>
                  </div>
                {listing.rent_period && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rental Period:</span>
                    <span className="capitalize">{listing.rent_period}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  {getStatusBadge(listing.status)}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingDetail;