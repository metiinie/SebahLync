import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Shield, 
  Star, 
  MessageCircle, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';

interface UserContactCardProps {
  user: {
    id: string;
    full_name: string;
    email: string;
    phone?: string;
    avatar_url?: string;
    verified: boolean;
    rating?: {
      average: number;
      count: number;
    };
    location?: {
      city: string;
      subcity: string;
    };
    member_since?: string;
    response_time?: string;
    listings_count?: number;
  };
  listingId?: string;
  listingTitle?: string;
  onContact?: (type: 'message' | 'call' | 'email', user: any) => void;
  className?: string;
}

const UserContactCard: React.FC<UserContactCardProps> = ({
  user,
  listingId,
  listingTitle,
  onContact,
  className = ''
}) => {
  const { user: currentUser } = useAuth();
  const [isContacting, setIsContacting] = useState(false);
  const [contactType, setContactType] = useState<'message' | 'call' | 'email' | null>(null);

  const handleContact = async (type: 'message' | 'call' | 'email') => {
    if (!currentUser) {
      toast.error('Please login to contact the owner');
      return;
    }

    if (currentUser.id === user.id) {
      toast.error('You cannot contact yourself');
      return;
    }

    setIsContacting(true);
    setContactType(type);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      switch (type) {
        case 'message':
          // Open message modal or navigate to messaging
          toast.success('Opening message conversation...');
          // TODO: Implement messaging functionality
          break;
        
        case 'call':
          // Enhanced phone call functionality
          if (user.phone) {
            // Check if device supports phone calls
            if (navigator.userAgent.includes('Mobile') || navigator.userAgent.includes('Android') || navigator.userAgent.includes('iPhone')) {
              // Mobile device - initiate call
              window.location.href = `tel:${user.phone}`;
              toast.success('Initiating phone call...');
            } else {
              // Desktop - show call options
              const callOptions = [
                `Call ${user.phone}`,
                `Copy phone number`,
                `Send SMS to ${user.phone}`,
                `Add to contacts`
              ];
              
              const choice = await showCallOptions(callOptions);
              await handleCallChoice(choice, user.phone);
            }
          } else {
            toast.error('Phone number not available');
          }
          break;
        
        case 'email':
          // Enhanced email functionality
          if (user.email) {
            const emailOptions = [
              `Send email to ${user.email}`,
              `Copy email address`,
              `Add to contacts`,
              `Schedule follow-up`
            ];
            
            const choice = await showEmailOptions(emailOptions);
            await handleEmailChoice(choice, user.email, user.full_name);
          } else {
            toast.error('Email not available');
          }
          break;
      }

      // Call custom handler if provided
      onContact?.(type, user);

    } catch (error) {
      console.error('Error contacting user:', error);
      toast.error('Failed to contact owner. Please try again.');
    } finally {
      setIsContacting(false);
      setContactType(null);
    }
  };

  const showCallOptions = async (options: string[]): Promise<string> => {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      modal.innerHTML = `
        <div class="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
          <h3 class="text-lg font-semibold mb-4">Call Options</h3>
          <div class="space-y-2">
            ${options.map((option, index) => `
              <button class="w-full text-left p-3 rounded-md hover:bg-gray-100 border border-gray-200" data-choice="${option}">
                ${option}
              </button>
            `).join('')}
            <button class="w-full text-left p-3 rounded-md hover:bg-gray-100 text-gray-500" data-choice="cancel">
              Cancel
            </button>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      modal.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const choice = target.getAttribute('data-choice');
        if (choice) {
          document.body.removeChild(modal);
          resolve(choice);
        }
      });
    });
  };

  const showEmailOptions = async (options: string[]): Promise<string> => {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      modal.innerHTML = `
        <div class="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
          <h3 class="text-lg font-semibold mb-4">Email Options</h3>
          <div class="space-y-2">
            ${options.map((option, index) => `
              <button class="w-full text-left p-3 rounded-md hover:bg-gray-100 border border-gray-200" data-choice="${option}">
                ${option}
              </button>
            `).join('')}
            <button class="w-full text-left p-3 rounded-md hover:bg-gray-100 text-gray-500" data-choice="cancel">
              Cancel
            </button>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      modal.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const choice = target.getAttribute('data-choice');
        if (choice) {
          document.body.removeChild(modal);
          resolve(choice);
        }
      });
    });
  };

  const handleCallChoice = async (choice: string, phone: string) => {
    switch (choice) {
      case `Call ${phone}`:
        // Try to initiate call via WebRTC or show call interface
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
            toast.success('Call interface ready. Use your phone to call.');
            // In a real app, you'd integrate with WebRTC or VoIP service
          } catch (error) {
            toast.error('Microphone access denied. Please use your phone.');
          }
        } else {
          toast.info('Please use your phone to call this number');
        }
        break;
        
      case 'Copy phone number':
        await navigator.clipboard.writeText(phone);
        toast.success('Phone number copied to clipboard');
        break;
        
      case `Send SMS to ${phone}`:
        if (navigator.userAgent.includes('Mobile')) {
          window.location.href = `sms:${phone}`;
        } else {
          await navigator.clipboard.writeText(phone);
          toast.success('Phone number copied. Use your messaging app to send SMS.');
        }
        break;
        
      case 'Add to contacts':
        // Generate vCard for contact
        const vCard = `BEGIN:VCARD
VERSION:3.0
FN:${user.full_name}
TEL:${phone}
EMAIL:${user.email}
END:VCARD`;
        
        const blob = new Blob([vCard], { type: 'text/vcard' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${user.full_name}.vcf`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success('Contact file downloaded');
        break;
    }
  };

  const handleEmailChoice = async (choice: string, email: string, name: string) => {
    switch (choice) {
      case `Send email to ${email}`:
        const subject = listingTitle ? `Regarding: ${listingTitle}` : 'Property Inquiry';
        const body = `Hello ${name},\n\nI'm interested in your property listing${listingTitle ? ` "${listingTitle}"` : ''}.\n\nPlease provide more information about:\n- Availability\n- Viewing schedule\n- Additional details\n\nBest regards,\n${currentUser.user_metadata?.full_name || currentUser.email}`;
        
        const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.open(mailtoLink, '_blank');
        toast.success('Opening email client...');
        break;
        
      case 'Copy email address':
        await navigator.clipboard.writeText(email);
        toast.success('Email address copied to clipboard');
        break;
        
      case 'Add to contacts':
        // Generate vCard for contact
        const vCard = `BEGIN:VCARD
VERSION:3.0
FN:${name}
EMAIL:${email}
TEL:${user.phone || ''}
END:VCARD`;
        
        const blob = new Blob([vCard], { type: 'text/vcard' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${name}.vcf`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success('Contact file downloaded');
        break;
        
      case 'Schedule follow-up':
        // Open calendar with pre-filled event
        const eventTitle = `Follow up: ${listingTitle || 'Property Inquiry'}`;
        const eventDetails = `Follow up with ${name} about property inquiry`;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() + 1);
        startDate.setHours(10, 0, 0, 0);
        
        const endDate = new Date(startDate);
        endDate.setHours(11, 0, 0, 0);
        
        const calendarLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventTitle)}&details=${encodeURIComponent(eventDetails)}&dates=${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`;
        
        window.open(calendarLink, '_blank');
        toast.success('Opening calendar to schedule follow-up...');
        break;
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-500';
    if (rating >= 3.5) return 'text-yellow-500';
    if (rating >= 2.5) return 'text-orange-500';
    return 'text-red-500';
  };

  const formatMemberSince = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`p-6 pt-0 ${className}`}
    >
      <Card className="border-0 shadow-none bg-transparent">
        <CardContent className="p-0">
          {/* User Profile Section */}
          <div className="flex items-center gap-3 mb-4">
            <div className="relative">
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                {user.avatar_url ? (
                  <img 
                    src={user.avatar_url} 
                    alt={user.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-6 h-6 text-gray-500" />
                )}
              </div>
              {user.verified && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">{user.full_name}</h4>
              <div className="flex items-center gap-2 mt-1">
                {/* Verification Badge */}
                <Badge 
                  variant={user.verified ? "default" : "secondary"}
                  className={`text-xs flex items-center gap-1 ${
                    user.verified 
                      ? 'bg-green-100 text-green-800 hover:bg-green-100' 
                      : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
                  }`}
                >
                  <Shield className="w-3 h-3" />
                  {user.verified ? 'Verified' : 'Unverified'}
                </Badge>
                
                {/* Rating */}
                {user.rating && (
                  <div className={`flex items-center gap-1 ${getRatingColor(user.rating.average)}`}>
                    <Star className="w-4 h-4 fill-current" />
                    <span className="text-sm font-medium">
                      {user.rating.average.toFixed(1)}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({user.rating.count})
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* User Stats */}
          <div className="grid grid-cols-2 gap-3 mb-4 text-sm text-gray-600">
            {user.location && (
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{user.location.city}, {user.location.subcity}</span>
              </div>
            )}
            
            {user.member_since && (
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>Member since {formatMemberSince(user.member_since)}</span>
              </div>
            )}
            
            {user.response_time && (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>Responds within {user.response_time}</span>
              </div>
            )}
            
            {user.listings_count !== undefined && (
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                <span>{user.listings_count} listings</span>
              </div>
            )}
          </div>

          {/* Contact Actions */}
          <div className="space-y-3">
            {/* Primary Contact Button */}
            <Button
              onClick={() => handleContact('message')}
              disabled={isContacting && contactType === 'message'}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isContacting && contactType === 'message' ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Opening...
                </>
              ) : (
                <>
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Contact Owner
                </>
              )}
            </Button>

            {/* Secondary Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => handleContact('call')}
                disabled={isContacting && contactType === 'call' || !user.phone}
                className="flex-1"
              >
                {isContacting && contactType === 'call' ? (
                  <div className="w-4 h-4 mr-2 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Phone className="w-4 h-4 mr-2" />
                )}
                Call
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleContact('email')}
                disabled={isContacting && contactType === 'email'}
                className="flex-1"
              >
                {isContacting && contactType === 'email' ? (
                  <div className="w-4 h-4 mr-2 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Mail className="w-4 h-4 mr-2" />
                )}
                Email
              </Button>
            </div>

            {/* Additional Info */}
            {!user.phone && (
              <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-2 rounded-md">
                <AlertCircle className="w-4 h-4" />
                <span>Phone number not available</span>
              </div>
            )}

            {!user.verified && (
              <div className="flex items-center gap-2 text-sm text-yellow-600 bg-yellow-50 p-2 rounded-md">
                <AlertCircle className="w-4 h-4" />
                <span>This user is not verified</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default UserContactCard;
