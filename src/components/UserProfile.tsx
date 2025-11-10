import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Star, 
  Eye, 
  Edit, 
  Camera, 
  CheckCircle, 
  XCircle,
  TrendingUp,
  Award,
  MessageCircle,
  Share2,
  Upload,
  X,
  Trash2,
  MoreVertical
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { toast } from 'sonner';
import { ListingsService } from '../services/listings';
import { UploadService } from '../services/upload';
import { UsersService } from '../services/users';
import { Listing } from '../types';

interface UserProfileProps {
  userId?: string;
  isOwnProfile?: boolean;
  showEditButton?: boolean;
}

const UserProfile: React.FC<UserProfileProps> = ({ 
  userId, 
  isOwnProfile = false, 
  showEditButton = true 
}) => {
  const { user, isAuthenticated, refreshUser } = useAuth();
  const [profileUser, setProfileUser] = useState(user);
  const [listings, setListings] = useState<Listing[]>([]);
  const [stats, setStats] = useState({
    totalListings: 0,
    activeListings: 0,
    totalViews: 0,
    averageRating: 0,
    totalSales: 0
  });
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    full_name: '',
    phone: '',
    address: ''
  });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (userId && userId !== user?.id) {
      // Load other user's profile
      loadUserProfile(userId);
    } else {
      // Always sync with the latest user from context
      if (user) {
        setProfileUser(user);
      }
      loadUserStats();
    }
    // Reset avatar error when profile user changes
    setAvatarError(false);
  }, [userId, user]);

  // Close avatar menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(event.target as Node)) {
        setShowAvatarMenu(false);
      }
    };

    if (showAvatarMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAvatarMenu]);

  const loadUserProfile = async (targetUserId: string) => {
    try {
      setLoading(true);
      // TODO: Implement user profile loading from API
      // const response = await UsersService.getUserProfile(targetUserId);
      // setProfileUser(response.data);
    } catch (error) {
      console.error('Error loading user profile:', error);
      toast.error('Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  const loadUserStats = async () => {
    try {
      if (!user?.id) return;

      const response = await ListingsService.getUserListings(user.id);
      if (response.success) {
        const userListings = response.data;
        setListings(userListings);
        
        const totalListings = userListings.length;
        const activeListings = userListings.filter(l => l.status === 'approved').length;
        const totalViews = userListings.reduce((sum, l) => sum + (l.views || 0), 0);
        const totalSales = userListings.filter(l => l.status === 'sold').length;
        
        setStats({
          totalListings,
          activeListings,
          totalViews,
          averageRating: 4.5, // TODO: Calculate from reviews
          totalSales
        });
      }
    } catch (error) {
      console.error('Error loading user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (!profileUser) return;
    
    setEditData({
      full_name: profileUser.full_name || '',
      phone: profileUser.phone || '',
      address: profileUser.address ? JSON.stringify(profileUser.address) : ''
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      // TODO: Implement profile update
      // await UsersService.updateProfile(editData);
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({
      full_name: '',
      phone: '',
      address: ''
    });
  };

  const handlePhotoClick = () => {
    if (isOwnProfile && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    try {
      setUploadingPhoto(true);

      // Compress image before upload
      const compressedFile = await UploadService.compressImage(file, 800, 0.8);

      // Upload to Supabase Storage
      const { url } = await UploadService.uploadUserAvatar(compressedFile, user.id);
      
      console.log('Avatar uploaded, URL:', url);

      // Update user profile with new avatar URL
      const updateResult = await UsersService.updateUser(user.id, {
        avatar_url: url
      });

      console.log('Update result:', updateResult);

      if (updateResult.success && updateResult.data) {
        console.log('Updated user data:', updateResult.data);
        console.log('Avatar URL in updated data:', updateResult.data.avatar_url);
        
        // Update local state immediately with the returned data
        setProfileUser(updateResult.data);
        setAvatarError(false);
        
        // Refresh auth context to sync with database
        if (refreshUser) {
          await refreshUser();
        }
        
        toast.success('Profile photo updated successfully');
      } else {
        console.error('Update failed:', updateResult);
        toast.error(updateResult.message || 'Failed to update profile photo');
      }
    } catch (error: any) {
      console.error('Error uploading profile photo:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to upload profile photo. Please try again.';
      
      if (error?.message) {
        if (error.message.includes('Bucket not found') || error.message.includes('The resource was not found')) {
          errorMessage = 'Storage bucket not found. Please create the "user-avatars" bucket in Supabase Dashboard > Storage.';
        } else if (error.message.includes('new row violates row-level security') || 
                   error.message.includes('permission denied') ||
                   error.message.includes('row-level security')) {
          errorMessage = 'Permission denied. Please run the SETUP_USER_AVATARS_BUCKET.sql script in your Supabase SQL Editor to set up storage policies.';
        } else if (error.message.includes('JWT') || error.message.includes('token')) {
          errorMessage = 'Authentication error. Please log out and log back in.';
        } else {
          errorMessage = `Upload failed: ${error.message}`;
        }
      } else if (error?.error) {
        errorMessage = `Upload failed: ${error.error}`;
      }
      
      toast.error(errorMessage);
    } finally {
      setUploadingPhoto(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePhoto = async () => {
    if (!user?.id || !profileUser?.avatar_url) return;

    try {
      setUploadingPhoto(true);

      // Update user profile to remove avatar URL
      const updateResult = await UsersService.updateUser(user.id, {
        avatar_url: null
      });

      if (updateResult.success && updateResult.data) {
        setProfileUser(updateResult.data);
        setAvatarError(false);
        // Refresh auth context
        if (refreshUser) {
          await refreshUser();
        }
        toast.success('Profile photo removed successfully');
      } else {
        toast.error(updateResult.message || 'Failed to remove profile photo');
      }
    } catch (error) {
      console.error('Error removing profile photo:', error);
      toast.error('Failed to remove profile photo. Please try again.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const getVerificationBadge = () => {
    if (!profileUser?.verified) return null;
    
    return (
      <Badge className="bg-green-100 text-green-800 flex items-center">
        <CheckCircle className="w-3 h-3 mr-1" />
        Verified
      </Badge>
    );
  };

  const getMemberSince = () => {
    if (!profileUser?.created_at) return 'Unknown';
    return new Date(profileUser.created_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="text-center py-12">
        <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">User not found</h3>
        <p className="text-gray-600">The user profile you're looking for doesn't exist.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
            {/* Avatar */}
            <div className="relative group" ref={avatarMenuRef}>
              <div 
                className={`w-24 h-24 rounded-full flex items-center justify-center overflow-hidden ${
                  profileUser.avatar_url && !avatarError
                    ? 'bg-gray-100' 
                    : 'bg-gradient-to-br from-blue-500 to-blue-600'
                } ${isOwnProfile ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`}
                onClick={isOwnProfile ? () => setShowAvatarMenu(!showAvatarMenu) : undefined}
              >
                {profileUser.avatar_url && !avatarError ? (
                  <img 
                    src={profileUser.avatar_url} 
                    alt={profileUser.full_name || 'User'} 
                    className="w-full h-full object-cover"
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <span className="text-white font-bold text-2xl">
                    {profileUser.full_name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                )}
                
                {/* Hover overlay for own profile */}
                {isOwnProfile && (
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 rounded-full flex items-center justify-center">
                    <Camera className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                )}
              </div>
              
              {/* Hidden file input */}
              {isOwnProfile && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                  
                  {/* Avatar menu dropdown */}
                  <AnimatePresence>
                    {showAvatarMenu && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden"
                      >
                        <button
                          onClick={() => {
                            setShowAvatarMenu(false);
                            handlePhotoClick();
                          }}
                          disabled={uploadingPhoto}
                          className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {uploadingPhoto ? (
                            <>
                              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                              <span className="text-sm text-gray-700">Uploading...</span>
                            </>
                          ) : (
                            <>
                              <Camera className="w-4 h-4 text-gray-600" />
                              <span className="text-sm text-gray-700">Change Photo</span>
                            </>
                          )}
                        </button>
                        
                        {profileUser.avatar_url && (
                          <>
                            <div className="border-t border-gray-200" />
                            <button
                              onClick={() => {
                                setShowAvatarMenu(false);
                                if (confirm('Are you sure you want to remove your profile photo?')) {
                                  handleRemovePhoto();
                                }
                              }}
                              disabled={uploadingPhoto}
                              className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                              <span className="text-sm text-red-600">Remove Photo</span>
                            </button>
                          </>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <h1 className="text-2xl font-bold text-gray-900">
                      {profileUser.full_name || 'Anonymous User'}
                    </h1>
                    {getVerificationBadge()}
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                    <span className="flex items-center">
                      <Mail className="w-4 h-4 mr-1" />
                      {profileUser.email}
                    </span>
                    {profileUser.phone && (
                      <span className="flex items-center">
                        <Phone className="w-4 h-4 mr-1" />
                        {profileUser.phone}
                      </span>
                    )}
                    <span className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      Member since {getMemberSince()}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="capitalize">
                      {profileUser.role}
                    </Badge>
                    {profileUser.is_active && (
                      <Badge className="bg-green-100 text-green-800">
                        Active
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-3 mt-4 md:mt-0">
                  {isOwnProfile && showEditButton && (
                    <Button
                      variant="outline"
                      onClick={handleEdit}
                      className="flex items-center"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  )}
                  
                  {!isOwnProfile && isAuthenticated && (
                    <>
                      <Button variant="outline" className="flex items-center">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Message
                      </Button>
                      <Button variant="outline" className="flex items-center">
                        <Share2 className="w-4 h-4 mr-2" />
                        Share
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.totalListings}</div>
            <div className="text-sm text-gray-600">Total Listings</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.activeListings}</div>
            <div className="text-sm text-gray-600">Active</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.totalViews}</div>
            <div className="text-sm text-gray-600">Total Views</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600 flex items-center justify-center">
              <Star className="w-5 h-5 mr-1" />
              {stats.averageRating}
            </div>
            <div className="text-sm text-gray-600">Rating</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.totalSales}</div>
            <div className="text-sm text-gray-600">Sales</div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <Card>
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <Input
                value={editData.full_name}
                onChange={(e) => setEditData(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <Input
                value={editData.phone}
                onChange={(e) => setEditData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Enter your phone number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <Input
                value={editData.address}
                onChange={(e) => setEditData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Enter your address"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Listings */}
      {listings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Recent Listings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {listings.slice(0, 6).map((listing) => (
                <motion.div
                  key={listing.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                >
                  {listing.images && listing.images.length > 0 && (
                    <div className="w-full h-32 bg-gray-200 rounded-lg mb-3 overflow-hidden">
                      <img
                        src={listing.images[0]?.url}
                        alt={listing.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
                    {listing.title}
                  </h3>
                  
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {listing.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-green-600">
                      {listing.currency} {listing.price?.toLocaleString()}
                    </span>
                    <div className="flex items-center text-sm text-gray-500">
                      <Eye className="w-4 h-4 mr-1" />
                      {listing.views || 0}
                    </div>
                  </div>
                  
                  <div className="mt-2">
                    <Badge 
                      className={
                        listing.status === 'approved' 
                          ? 'bg-green-100 text-green-800' 
                          : listing.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }
                    >
                      {listing.status}
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UserProfile;
