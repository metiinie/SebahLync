// Database Types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>;
      };
      listings: {
        Row: Listing;
        Insert: Omit<Listing, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Listing, 'id' | 'created_at' | 'updated_at'>>;
      };
      transactions: {
        Row: Transaction;
        Insert: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Transaction, 'id' | 'created_at' | 'updated_at'>>;
      };
      notifications: {
        Row: Notification;
        Insert: Omit<Notification, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Notification, 'id' | 'created_at' | 'updated_at'>>;
      };
      admin_commissions: {
        Row: AdminCommission;
        Insert: Omit<AdminCommission, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<AdminCommission, 'id' | 'created_at' | 'updated_at'>>;
      };
      favorites: {
        Row: Favorite;
        Insert: Omit<Favorite, 'id' | 'created_at'>;
        Update: Partial<Omit<Favorite, 'id' | 'created_at'>>;
      };
      inquiries: {
        Row: Inquiry;
        Insert: Omit<Inquiry, 'id' | 'created_at'>;
        Update: Partial<Omit<Inquiry, 'id' | 'created_at'>>;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      increment_listing_views: {
        Args: {
          listing_id: string;
        };
        Returns: void;
      };
      handle_escrow_release: {
        Args: {
          p_transaction_id: string;
          p_admin_id: string;
        };
        Returns: void;
      };
      create_user_profile: {
        Args: {
          p_user_id: string;
          p_email: string;
          p_full_name?: string;
          p_phone?: string;
          p_role?: string;
        };
        Returns: {
          success: boolean;
          message: string;
          user_id: string;
          error?: string;
        };
      };
      update_updated_at_column: {
        Args: Record<PropertyKey, never>;
        Returns: any;
      };
    };
    Enums: {
      user_role: 'buyer' | 'seller' | 'admin';
      listing_category: 'car' | 'house' | 'land' | 'commercial' | 'other';
      listing_type: 'sale' | 'rent';
      listing_status: 'pending' | 'approved' | 'rejected' | 'sold' | 'rented' | 'inactive';
      transaction_status: 'pending' | 'payment_initiated' | 'payment_completed' | 'escrowed' | 'released' | 'refunded' | 'cancelled' | 'disputed' | 'paid';
      payment_method: 'telebirr' | 'chapa' | 'bibit';
      notification_type: 'listing_approved' | 'listing_rejected' | 'payment_received' | 'escrow_released' | 'user_verified' | 'user_rejected' | 'transaction_completed' | 'transaction_cancelled' | 'dispute_initiated' | 'system_announcement' | 'system_message';
      notification_priority: 'low' | 'medium' | 'high' | 'urgent';
    };
  };
}

// Core Types
export interface User {
  id: string;
  email: string;
  full_name: string;
  name?: string; // Alias for full_name for backward compatibility
  phone: string;
  role: 'buyer' | 'seller' | 'admin';
  verified: boolean;
  avatar_url?: string;
  address?: {
    city: string;
    subcity: string;
    woreda?: string;
    house_number?: string;
  };
  bank_details?: {
    bank_name: string;
    account_number: string;
    account_holder_name: string;
  };
  rating: {
    average: number;
    count: number;
  };
  is_active: boolean;
  last_login?: string;
  preferences: {
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
    language: 'en' | 'am';
    dark_mode: boolean;
  };
  created_at: string;
  updated_at: string;
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  category: 'car' | 'house' | 'land' | 'commercial' | 'other';
  subcategory?: string;
  price: number;
  currency: 'ETB' | 'USD';
  type: 'sale' | 'rent';
  rent_period?: 'monthly' | 'yearly' | 'daily';
  location: {
    city: string;
    subcity: string;
    woreda?: string;
    specific_location?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  images: Array<{
    url: string;
    public_id: string;
    caption?: string;
    is_primary: boolean;
  }>;
  documents: Array<{
    name: string;
    url: string;
    type: 'ownership' | 'registration' | 'insurance' | 'inspection' | 'other';
    public_id: string;
  }>;
  features: {
    // Car specific
    make?: string;
    model?: string;
    year?: number;
    mileage?: number;
    fuel_type?: 'petrol' | 'diesel' | 'hybrid' | 'electric';
    transmission?: 'manual' | 'automatic';
    color?: string;
    condition?: 'excellent' | 'good' | 'fair' | 'poor';
    
    // House specific
    bedrooms?: number;
    bathrooms?: number;
    area?: number;
    floors?: number;
    parking?: boolean;
    garden?: boolean;
    furnished?: boolean;
    air_conditioning?: boolean;
    security?: boolean;
    
    // General
    utilities?: string[];
    amenities?: string[];
  };
  owner_id: string;
  owner?: User;
  status: 'pending' | 'approved' | 'rejected' | 'sold' | 'rented' | 'inactive';
  verified: boolean;
  verification_notes?: string;
  views: number;
  tags: string[];
  is_active: boolean;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  listing?: Listing;
  buyer?: User;
  seller?: User;
  amount: number;
  currency: 'ETB' | 'USD';
  commission: {
    amount: number;
    rate: number;
  };
  payment_method: 'telebirr' | 'chapa' | 'bibit';
  payment_details: {
    transaction_id?: string;
    reference?: string;
    gateway_response?: any;
    processed_at?: string;
    tx_ref?: string;
    order_id?: string;
    bibit_reference?: string;
    gateway?: string;
    checkout_url?: string;
    webhook_response?: any;
    webhook_received_at?: string;
  };
  status: 'pending' | 'payment_initiated' | 'payment_completed' | 'escrowed' | 'released' | 'refunded' | 'cancelled' | 'disputed' | 'paid';
  escrow: {
    is_escrowed: boolean;
    escrow_date?: string;
    release_date?: string;
    release_reason?: string;
    release_notes?: string;
    released_by?: string;
  };
  contract: {
    terms?: string;
    duration?: number;
    start_date?: string;
    end_date?: string;
    signed_by: {
      buyer?: string;
      seller?: string;
    };
    signed_at: {
      buyer?: string;
      seller?: string;
    };
  };
  delivery: {
    method?: 'pickup' | 'delivery' | 'meetup';
    address?: {
      city: string;
      subcity: string;
      specific_location: string;
      coordinates?: {
        lat: number;
        lng: number;
      };
    };
    scheduled_date?: string;
    completed_date?: string;
    notes?: string;
    proof_of_delivery?: string[];
  };
  dispute: {
    is_disputed: boolean;
    reason?: string;
    description?: string;
    evidence?: string[];
    resolution?: string;
    resolved_by?: string;
    resolved_at?: string;
  };
  refund: {
    amount?: number;
    reason?: string;
    processed_at?: string;
    processed_by?: string;
    refund_method?: string;
    refund_reference?: string;
  };
  timeline: Array<{
    status: string;
    timestamp: string;
    notes?: string;
    updated_by?: string;
  }>;
  metadata: {
    ip_address?: string;
    user_agent?: string;
    device_info?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'listing_approved' | 'listing_rejected' | 'payment_received' | 'escrow_released' | 'user_verified' | 'user_rejected' | 'transaction_completed' | 'transaction_cancelled' | 'dispute_initiated' | 'system_announcement';
  title: string;
  message: string;
  data?: {
    listing_id?: string;
    transaction_id?: string;
    amount?: number;
    currency?: string;
    url?: string;
    metadata?: any;
  };
  priority: 'low' | 'medium' | 'high' | 'urgent';
  channels: {
    in_app: boolean;
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  read: boolean;
  read_at?: string;
  sent_at?: string;
  delivered_at?: string;
  expires_at: string;
  metadata: {
    ip_address?: string;
    user_agent?: string;
    device_info?: string;
    retry_count: number;
    last_retry_at?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface AdminCommission {
  id: string;
  transaction_id: string;
  amount: number;
  rate: number;
  currency: 'ETB' | 'USD';
  status: 'pending' | 'collected' | 'distributed' | 'refunded';
  collected_at?: string;
  distributed_at?: string;
  distribution: {
    platform: {
      amount: number;
      percentage: number;
    };
    admin: {
      amount: number;
      percentage: number;
    };
  };
  notes?: string;
  metadata: {
    transaction_amount: number;
    transaction_currency: string;
    payment_method: string;
    processed_by?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  listing_id: string;
  created_at: string;
}

export interface Inquiry {
  id: string;
  listing_id: string;
  user_id: string;
  message: string;
  contact?: string;
  created_at: string;
}

// UI Types
export interface SearchFilters {
  category?: string;
  type?: 'sale' | 'rent';
  minPrice?: number;
  maxPrice?: number;
  city?: string;
  subcity?: string;
  verified?: boolean;
  search?: string;
  sortBy?: 'price_asc' | 'price_desc' | 'date_desc' | 'views_desc';
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface ApiResponse<T> {
  data: T;
  count?: number;
  total?: number;
  page?: number;
  pages?: number;
  success: boolean;
  message?: string;
}

export interface PaymentGateway {
  id: string;
  name: string;
  description: string;
  icon: string;
  supported_currencies: string[];
  min_amount: number;
  max_amount: number;
  fees: {
    percentage: number;
    fixed: number;
  };
}

export interface PaymentData {
  amount: number;
  currency: string;
  method: string;
  reference: string;
  description: string;
  callback_url: string;
  return_url: string;
  metadata?: any;
}

// Service Types
export interface CreateListingData {
  title: string;
  description: string;
  category: 'car' | 'house' | 'land' | 'commercial' | 'other';
  subcategory?: string;
  price: number;
  currency: 'ETB' | 'USD';
  type: 'sale' | 'rent';
  rent_period?: 'monthly' | 'yearly' | 'daily';
  location: {
    city: string;
    subcity: string;
    woreda?: string;
    specific_location?: string;
  };
  features?: any;
  images: File[];
  documents: File[];
}

export interface UpdateListingData {
  title?: string;
  description?: string;
  category?: 'car' | 'house' | 'land' | 'commercial' | 'other';
  subcategory?: string;
  price?: number;
  currency?: 'ETB' | 'USD';
  type?: 'sale' | 'rent';
  rent_period?: 'monthly' | 'yearly' | 'daily';
  location?: {
    city: string;
    subcity: string;
    woreda?: string;
    specific_location?: string;
  };
  features?: any;
  status?: 'pending' | 'approved' | 'rejected' | 'sold' | 'rented' | 'inactive';
  verified?: boolean;
  verification_notes?: string;
  is_active?: boolean;
  expires_at?: string;
}

export interface CreateTransactionData {
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  amount: number;
  currency: 'ETB' | 'USD';
  payment_method: 'telebirr' | 'chapa' | 'bibit';
  payment_details?: {
    transaction_id?: string;
    reference?: string;
    gateway_response?: any;
    processed_at?: string;
    tx_ref?: string;
    order_id?: string;
    bibit_reference?: string;
    gateway?: string;
    checkout_url?: string;
    webhook_response?: any;
    webhook_received_at?: string;
  };
  contract?: {
    terms?: string;
    duration?: number;
    start_date?: string;
    end_date?: string;
  };
  delivery?: {
    method?: 'pickup' | 'delivery' | 'meetup';
    address?: {
      city: string;
      subcity: string;
      specific_location: string;
      coordinates?: {
        lat: number;
        lng: number;
      };
    };
    scheduled_date?: string;
    notes?: string;
  };
}

export interface UpdateTransactionData {
  status?: 'pending' | 'payment_initiated' | 'payment_completed' | 'escrowed' | 'released' | 'refunded' | 'cancelled' | 'disputed';
  payment_details?: {
    transaction_id?: string;
    reference?: string;
    gateway_response?: any;
    processed_at?: string;
  };
  escrow?: {
    is_escrowed?: boolean;
    escrow_date?: string;
    release_date?: string;
    release_reason?: string;
    release_notes?: string;
    released_by?: string;
  };
  contract?: {
    terms?: string;
    duration?: number;
    start_date?: string;
    end_date?: string;
    signed_by?: {
      buyer?: string;
      seller?: string;
    };
    signed_at?: {
      buyer?: string;
      seller?: string;
    };
  };
  delivery?: {
    method?: 'pickup' | 'delivery' | 'meetup';
    address?: {
      city: string;
      subcity: string;
      specific_location: string;
      coordinates?: {
        lat: number;
        lng: number;
      };
    };
    scheduled_date?: string;
    completed_date?: string;
    notes?: string;
    proof_of_delivery?: string[];
  };
  dispute?: {
    is_disputed?: boolean;
    reason?: string;
    description?: string;
    evidence?: string[];
    resolution?: string;
    resolved_by?: string;
    resolved_at?: string;
  };
  refund?: {
    amount?: number;
    reason?: string;
    processed_at?: string;
    processed_by?: string;
    refund_method?: string;
    refund_reference?: string;
  };
  timeline?: Array<{
    status: string;
    timestamp: string;
    notes?: string;
    updated_by?: string;
  }>;
}

export interface CreateNotificationData {
  user_id: string;
  type: 'listing_approved' | 'listing_rejected' | 'payment_received' | 'escrow_released' | 'user_verified' | 'user_rejected' | 'transaction_completed' | 'transaction_cancelled' | 'dispute_initiated' | 'system_announcement' | 'system_message';
  title: string;
  message: string;
  data?: {
    listing_id?: string;
    transaction_id?: string;
    amount?: number;
    currency?: string;
    url?: string;
    metadata?: any;
  };
  priority: 'low' | 'medium' | 'high' | 'urgent';
  channels: {
    in_app: boolean;
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  expires_at: string;
  link?: string;
}

export interface UpdateUserData {
  full_name?: string;
  phone?: string;
  avatar_url?: string | null;
  address?: {
    city: string;
    subcity: string;
    woreda?: string;
    house_number?: string;
  };
  bank_details?: {
    bank_name: string;
    account_number: string;
    account_holder_name: string;
  };
  rating?: {
    average: number;
    count: number;
  };
  is_active?: boolean;
  last_login?: string;
  preferences?: {
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
    language: 'en' | 'am';
    dark_mode: boolean;
  };
}

// Form Types
export interface LoginFormData {
  email: string;
  password: string;
  remember?: boolean;
}

export interface RegisterFormData {
  full_name: string;
  email: string;
  phone: string;
  password: string;
  confirm_password: string;
  role: 'buyer' | 'seller';
  agree_terms: boolean;
}

export interface ListingFormData {
  title: string;
  description: string;
  category: 'car' | 'house' | 'land' | 'commercial' | 'other';
  subcategory?: string;
  price: number;
  currency: 'ETB' | 'USD';
  type: 'sale' | 'rent';
  rent_period?: 'monthly' | 'yearly' | 'daily';
  location: {
    city: string;
    subcity: string;
    woreda?: string;
    specific_location?: string;
  };
  features: any;
  images: File[];
  documents: File[];
}

export interface ProfileFormData {
  full_name: string;
  phone: string;
  address?: {
    city: string;
    subcity: string;
    woreda?: string;
    house_number?: string;
  };
  bank_details?: {
    bank_name: string;
    account_number: string;
    account_holder_name: string;
  };
  preferences: {
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
    language: 'en' | 'am';
    dark_mode: boolean;
  };
}

// Component Props Types
export interface ListingCardProps {
  listing: Listing;
  onFavorite?: (listingId: string) => void;
  onInquiry?: (listingId: string) => void;
  isFavorite?: boolean;
}

export interface FilterProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

// Context Types
export interface AuthContextType {
  user: User | null;
  session: any;
  loading: boolean;
  isAuthenticated?: boolean;
  signUp: (data: RegisterFormData) => Promise<void>;
  signIn: (data: LoginFormData) => Promise<void>;
  login: (data: LoginFormData) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<ProfileFormData>) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  resendVerification?: () => Promise<void>;
  refreshUser?: () => Promise<void>;
}

export interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  updatePreferences: (preferences: any) => Promise<void>;
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
