import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Shield, 
  Star, 
  Edit,
  Save,
  User,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { formatRelativeTime } from '../lib/utils';
import { toast } from 'sonner';

interface User {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: 'buyer' | 'seller' | 'admin';
  verified: boolean;
  is_active: boolean;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  location?: {
    city: string;
    subcity: string;
  };
  rating?: {
    average: number;
    count: number;
  };
  preferences?: {
    notifications: boolean;
    marketing: boolean;
  };
}

interface UserDetailsModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onUpdateUser: (userId: string, updates: Partial<User>) => void;
}

const UserDetailsModal: React.FC<UserDetailsModalProps> = ({
  user,
  isOpen,
  onClose,
  onUpdateUser
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState(user);

  const handleSave = () => {
    onUpdateUser(user.id, editedUser);
    setIsEditing(false);
    toast.success('User updated successfully');
  };

  const handleCancel = () => {
    setEditedUser(user);
    setIsEditing(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                User Details
              </CardTitle>
              <div className="flex items-center space-x-2">
                {isEditing ? (
                  <>
                    <Button variant="outline" size="sm" onClick={handleCancel}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSave}>
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* User Info */}
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.full_name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <User className="h-8 w-8 text-gray-500" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900">
                  {isEditing ? (
                    <Input
                      value={editedUser.full_name}
                      onChange={(e) => setEditedUser({...editedUser, full_name: e.target.value})}
                      className="text-xl font-semibold"
                    />
                  ) : (
                    user.full_name
                  )}
                </h3>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge className={user.verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                    {user.verified ? 'Verified' : 'Pending'}
                  </Badge>
                  <Badge className={user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {user.is_active ? 'Active' : 'Suspended'}
                  </Badge>
                  <Badge variant="outline">
                    {user.role}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                {isEditing ? (
                  <Input
                    value={editedUser.email}
                    onChange={(e) => setEditedUser({...editedUser, email: e.target.value})}
                  />
                ) : (
                  <div className="flex items-center text-gray-900">
                    <Mail className="h-4 w-4 mr-2" />
                    {user.email}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                {isEditing ? (
                  <Input
                    value={editedUser.phone || ''}
                    onChange={(e) => setEditedUser({...editedUser, phone: e.target.value})}
                  />
                ) : (
                  <div className="flex items-center text-gray-900">
                    <Phone className="h-4 w-4 mr-2" />
                    {user.phone || 'Not provided'}
                  </div>
                )}
              </div>
            </div>

            {/* Location */}
            {user.location && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <div className="flex items-center text-gray-900">
                  <MapPin className="h-4 w-4 mr-2" />
                  {user.location.city}, {user.location.subcity}
                </div>
              </div>
            )}

            {/* Role Management */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              {isEditing ? (
                <select
                  value={editedUser.role}
                  onChange={(e) => setEditedUser({...editedUser, role: e.target.value as 'buyer' | 'seller' | 'admin'})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="buyer">Buyer</option>
                  <option value="seller">Seller</option>
                  <option value="admin">Admin</option>
                </select>
              ) : (
                <div className="flex items-center text-gray-900">
                  <Shield className="h-4 w-4 mr-2" />
                  {user.role}
                </div>
              )}
            </div>

            {/* Account Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Verification Status</label>
                {isEditing ? (
                  <select
                    value={editedUser.verified ? 'verified' : 'pending'}
                    onChange={(e) => setEditedUser({...editedUser, verified: e.target.value === 'verified'})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="pending">Pending</option>
                    <option value="verified">Verified</option>
                  </select>
                ) : (
                  <div className="flex items-center text-gray-900">
                    {user.verified ? (
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                    ) : (
                      <Clock className="h-4 w-4 mr-2 text-yellow-500" />
                    )}
                    {user.verified ? 'Verified' : 'Pending Verification'}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Status</label>
                {isEditing ? (
                  <select
                    value={editedUser.is_active ? 'active' : 'suspended'}
                    onChange={(e) => setEditedUser({...editedUser, is_active: e.target.value === 'active'})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                ) : (
                  <div className="flex items-center text-gray-900">
                    {user.is_active ? (
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
                    )}
                    {user.is_active ? 'Active' : 'Suspended'}
                  </div>
                )}
              </div>
            </div>

            {/* Rating */}
            {user.rating && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                <div className="flex items-center text-gray-900">
                  <Star className="h-4 w-4 mr-2" />
                  {user.rating.average.toFixed(1)} ({user.rating.count} reviews)
                </div>
              </div>
            )}

            {/* Timestamps */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Joined</label>
                <div className="flex items-center text-gray-900">
                  <Calendar className="h-4 w-4 mr-2" />
                  {formatRelativeTime(user.created_at)}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
                <div className="flex items-center text-gray-900">
                  <Clock className="h-4 w-4 mr-2" />
                  {formatRelativeTime(user.updated_at)}
                </div>
              </div>
            </div>

            {/* Preferences */}
            {user.preferences && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Preferences</label>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={user.preferences.notifications}
                      disabled={!isEditing}
                      className="mr-2"
                    />
                    <span className="text-sm">Email notifications</span>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={user.preferences.marketing}
                      disabled={!isEditing}
                      className="mr-2"
                    />
                    <span className="text-sm">Marketing emails</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default UserDetailsModal;
