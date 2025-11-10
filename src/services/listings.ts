import { supabase } from '../lib/supabase';
import { BaseService, ServiceResponse } from './base';
import { Listing, SearchFilters, CreateListingData, UpdateListingData } from '../types';

export class ListingsService extends BaseService {
  // Get all listings with filters and pagination
  static async getListings(
    filters: SearchFilters = {},
    pagination: { page: number; limit: number } = { page: 1, limit: 12 }
  ): Promise<{ success: boolean; data: Listing[]; total: number; message?: string }> {
    try {
      const { page, limit } = pagination;
      const offset = (page - 1) * limit;

      // Build query filters
      const queryFilters: Record<string, unknown> = {
        status: 'approved',
        verified: true,
      };

      if (filters.category) {
        queryFilters.category = filters.category;
      }

      if (filters.type) {
        queryFilters.type = filters.type;
      }

      if (filters.verified !== undefined) {
        queryFilters.verified = filters.verified;
      }

      if (filters.minPrice !== undefined) {
        queryFilters.price_gte = filters.minPrice;
      }

      if (filters.maxPrice !== undefined) {
        queryFilters.price_lte = filters.maxPrice;
      }

      if (filters.city) {
        queryFilters.location_city = filters.city;
      }

      // Build order by
      let orderBy = { column: 'created_at', ascending: false };
      if (filters.sortBy) {
        switch (filters.sortBy) {
          case 'price_asc':
            orderBy = { column: 'price', ascending: true };
            break;
          case 'price_desc':
            orderBy = { column: 'price', ascending: false };
            break;
          case 'views_desc':
            orderBy = { column: 'views', ascending: false };
            break;
          case 'date_desc':
          default:
            orderBy = { column: 'created_at', ascending: false };
            break;
        }
      }

      // Get listings with owner information
      let query = supabase
        .from('listings')
        .select(`
          *,
          owner:users!listings_owner_id_fkey(
            id,
            full_name,
            email,
            phone,
            verified,
            avatar_url,
            rating
          )
        `)
        .eq('status', 'approved')
        .eq('verified', true)
        .order(orderBy.column, { ascending: orderBy.ascending })
        .range(offset, offset + limit - 1);

      // Apply filters
      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      if (filters.type) {
        query = query.eq('type', filters.type);
      }

      if (filters.minPrice !== undefined) {
        query = query.gte('price', filters.minPrice);
      }

      if (filters.maxPrice !== undefined) {
        query = query.lte('price', filters.maxPrice);
      }

      if (filters.city) {
        query = query.eq('location->>city', filters.city);
      }

      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,location->>city.ilike.%${filters.search}%`);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        success: true,
        data: data || [],
        total: count || 0,
      };
    } catch (error) {
      console.error('Error fetching listings:', error);
      return {
        success: false,
        data: [],
        total: 0,
        message: error instanceof Error ? error.message : 'Failed to fetch listings',
      };
    }
  }

  // Get a single listing by ID
  static async getListingById(id: string): Promise<{ success: boolean; data: Listing | null; message?: string }> {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select(`
          *,
          owner:users!listings_owner_id_fkey(
            id,
            full_name,
            email,
            phone,
            verified,
            avatar_url,
            rating
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('Error fetching listing:', error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Failed to fetch listing',
      };
    }
  }

  // Get user's own listings
  static async getUserListings(
    userId: string,
    pagination: { page: number; limit: number } = { page: 1, limit: 12 }
  ): Promise<{ success: boolean; data: Listing[]; total: number; message?: string }> {
    try {
      const { page, limit } = pagination;
      const offset = (page - 1) * limit;

      const { data, error, count } = await supabase
        .from('listings')
        .select('*', { count: 'exact' })
        .eq('owner_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return {
        success: true,
        data: data || [],
        total: count || 0,
      };
    } catch (error) {
      console.error('Error fetching user listings:', error);
      return {
        success: false,
        data: [],
        total: 0,
        message: error instanceof Error ? error.message : 'Failed to fetch user listings',
      };
    }
  }

  // Create a new listing
  static async createListing(listingData: CreateListingData): Promise<{ success: boolean; data: Listing | null; message?: string }> {
    try {
      const { data, error } = await supabase
        .from('listings')
        .insert(listingData)
        .select(`
          *,
          owner:users!listings_owner_id_fkey(
            id,
            full_name,
            email,
            phone,
            verified,
            avatar_url,
            rating
          )
        `)
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('Error creating listing:', error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Failed to create listing',
      };
    }
  }

  // Update a listing
  static async updateListing(
    id: string,
    updates: UpdateListingData
  ): Promise<{ success: boolean; data: Listing | null; message?: string }> {
    try {
      const { data, error } = await supabase
        .from('listings')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          owner:users!listings_owner_id_fkey(
            id,
            full_name,
            email,
            phone,
            verified,
            avatar_url,
            rating
          )
        `)
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('Error updating listing:', error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Failed to update listing',
      };
    }
  }

  // Delete a listing
  static async deleteListing(id: string): Promise<ServiceResponse> {
    try {
      console.log('Attempting to delete listing with ID:', id);
      
      // First, verify the listing exists and get current user
      const currentUser = await this.getCurrentUser();

      // Check if listing exists and user has permission to delete it
      const { data: listing, error: fetchError } = await supabase
        .from('listings')
        .select('id, owner_id, title')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('Error fetching listing for deletion:', fetchError);
        return this.error('Listing not found or access denied');
      }

      // Check if user owns the listing or is admin
      const isOwner = listing.owner_id === currentUser.id;
      const isAdmin = await this.isAdmin();

      if (!isOwner && !isAdmin) {
        return this.error('You do not have permission to delete this listing');
      }

      console.log('Permission check passed. Deleting listing:', listing.title);
      
      // Delete the listing using BaseService method
      const result = await supabase.from('listings').delete().eq('id', id);
      
      if (result.error) {
        console.error('Database delete error:', result.error);
        return this.error('Failed to delete listing', result.error);
      }
      
      console.log('Listing deleted successfully from database');
      return this.success(null, 'Listing deleted successfully');
    } catch (error) {
      return this.handleError(error, 'deleteListing');
    }
  }

  // Increment view count
  static async incrementViews(id: string): Promise<{ success: boolean; message?: string }> {
    try {
      const { error } = await supabase.rpc('increment_listing_views', {
        listing_id: id,
      });

      if (error) throw error;

      return {
        success: true,
      };
    } catch (error) {
      console.error('Error incrementing views:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to increment views',
      };
    }
  }

  // Get featured listings
  static async getFeaturedListings(limit: number = 6): Promise<{ success: boolean; data: Listing[]; message?: string }> {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select(`
          *,
          owner:users!listings_owner_id_fkey(
            id,
            full_name,
            email,
            phone,
            verified,
            avatar_url,
            rating
          )
        `)
        .eq('status', 'approved')
        .eq('verified', true)
        .order('views', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return {
        success: true,
        data: data || [],
      };
    } catch (error) {
      console.error('Error fetching featured listings:', error);
      return {
        success: false,
        data: [],
        message: error instanceof Error ? error.message : 'Failed to fetch featured listings',
      };
    }
  }

  // Get listings by category
  static async getListingsByCategory(
    category: string,
    limit: number = 12
  ): Promise<{ success: boolean; data: Listing[]; message?: string }> {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select(`
          *,
          owner:users!listings_owner_id_fkey(
            id,
            full_name,
            email,
            phone,
            verified,
            avatar_url,
            rating
          )
        `)
        .eq('category', category)
        .eq('status', 'approved')
        .eq('verified', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return {
        success: true,
        data: data || [],
      };
    } catch (error) {
      console.error('Error fetching listings by category:', error);
      return {
        success: false,
        data: [],
        message: error instanceof Error ? error.message : 'Failed to fetch listings by category',
      };
    }
  }

  // Search listings
  static async searchListings(
    searchTerm: string,
    filters: Omit<SearchFilters, 'search'> = {},
    pagination: { page: number; limit: number } = { page: 1, limit: 12 }
  ): Promise<{ success: boolean; data: Listing[]; total: number; message?: string }> {
    try {
      const searchFilters = { ...filters, search: searchTerm };
      return await this.getListings(searchFilters, pagination);
    } catch (error) {
      console.error('Error searching listings:', error);
      return {
        success: false,
        data: [],
        total: 0,
        message: error instanceof Error ? error.message : 'Failed to search listings',
      };
    }
  }

  // Get similar listings
  static async getSimilarListings(
    listingId: string,
    limit: number = 4
  ): Promise<{ success: boolean; data: Listing[]; message?: string }> {
    try {
      // First get the current listing to find similar ones
      const currentListing = await this.getListingById(listingId);
      if (!currentListing.success || !currentListing.data) {
        return {
          success: false,
          data: [],
          message: 'Listing not found',
        };
      }

      const { category, type, price } = currentListing.data;
      const priceRange = price * 0.3; // 30% price range

      const { data, error } = await supabase
        .from('listings')
        .select(`
          *,
          owner:users!listings_owner_id_fkey(
            id,
            full_name,
            email,
            phone,
            verified,
            avatar_url,
            rating
          )
        `)
        .eq('category', category)
        .eq('type', type)
        .neq('id', listingId)
        .eq('status', 'approved')
        .eq('verified', true)
        .gte('price', price - priceRange)
        .lte('price', price + priceRange)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return {
        success: true,
        data: data || [],
      };
    } catch (error) {
      console.error('Error fetching similar listings:', error);
      return {
        success: false,
        data: [],
        message: error instanceof Error ? error.message : 'Failed to fetch similar listings',
      };
    }
  }

  // Get all listings for admin (including pending)
  static async getAllListingsForAdmin(
    pagination: { page: number; limit: number } = { page: 1, limit: 100 }
  ): Promise<{ success: boolean; data: Listing[]; total: number; message?: string }> {
    try {
      const { page, limit } = pagination;
      const offset = (page - 1) * limit;

      const { data, error, count } = await supabase
        .from('listings')
        .select(`
          *,
          owner:users!listings_owner_id_fkey(
            id,
            full_name,
            email,
            phone,
            verified,
            avatar_url,
            rating
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return {
        success: true,
        data: data || [],
        total: count || 0,
      };
    } catch (error) {
      console.error('Error fetching all listings for admin:', error);
      return {
        success: false,
        data: [],
        total: 0,
        message: error instanceof Error ? error.message : 'Failed to fetch listings',
      };
    }
  }

  // Get listing statistics
  static async getListingStats(): Promise<{ success: boolean; data: unknown; message?: string }> {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('category, type, status, price')
        .eq('status', 'approved');

      if (error) throw error;

      const stats = {
        total: data?.length || 0,
        byCategory: {} as Record<string, number>,
        byType: {} as Record<string, number>,
        averagePrice: 0,
        priceRange: { min: 0, max: 0 },
      };

      if (data && data.length > 0) {
        // Calculate category distribution
        data.forEach((listing) => {
          stats.byCategory[listing.category] = (stats.byCategory[listing.category] || 0) + 1;
          stats.byType[listing.type] = (stats.byType[listing.type] || 0) + 1;
        });

        // Calculate price statistics
        const prices = data.map((listing) => listing.price);
        stats.averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
        stats.priceRange.min = Math.min(...prices);
        stats.priceRange.max = Math.max(...prices);
      }

      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      console.error('Error fetching listing stats:', error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Failed to fetch listing statistics',
      };
    }
  }
}