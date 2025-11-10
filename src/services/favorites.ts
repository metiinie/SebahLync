import { supabase } from '../lib/supabase';
import { Favorite } from '../types';

export class FavoritesService {
  // Add listing to favorites
  static async addToFavorites(userId: string, listingId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const { error } = await supabase
        .from('favorites')
        .insert({
          user_id: userId,
          listing_id: listingId,
        });

      if (error) throw error;

      return {
        success: true,
      };
    } catch (error) {
      console.error('Error adding to favorites:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to add to favorites',
      };
    }
  }

  // Remove listing from favorites
  static async removeFromFavorites(userId: string, listingId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('listing_id', listingId);

      if (error) throw error;

      return {
        success: true,
      };
    } catch (error) {
      console.error('Error removing from favorites:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to remove from favorites',
      };
    }
  }

  // Check if listing is favorited by user
  static async isFavorited(userId: string, listingId: string): Promise<{ success: boolean; isFavorited: boolean; message?: string }> {
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('listing_id', listingId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return {
        success: true,
        isFavorited: !!data,
      };
    } catch (error) {
      console.error('Error checking favorite status:', error);
      return {
        success: false,
        isFavorited: false,
        message: error instanceof Error ? error.message : 'Failed to check favorite status',
      };
    }
  }

  // Get user's favorites
  static async getUserFavorites(
    userId: string,
    pagination: { page: number; limit: number } = { page: 1, limit: 12 }
  ): Promise<{ success: boolean; data: Favorite[]; total: number; message?: string }> {
    try {
      const { page, limit } = pagination;
      const offset = (page - 1) * limit;

      const { data, error, count } = await supabase
        .from('favorites')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return {
        success: true,
        data: data || [],
        total: count || 0,
      };
    } catch (error) {
      console.error('Error fetching user favorites:', error);
      return {
        success: false,
        data: [],
        total: 0,
        message: error instanceof Error ? error.message : 'Failed to fetch favorites',
      };
    }
  }

  // Toggle favorite status
  static async toggleFavorite(userId: string, listingId: string): Promise<{ success: boolean; isFavorited: boolean; message?: string }> {
    try {
      // Check if already favorited
      const checkResult = await this.isFavorited(userId, listingId);
      
      if (!checkResult.success) {
        return {
          success: false,
          isFavorited: false,
          message: checkResult.message,
        };
      }

      if (checkResult.isFavorited) {
        // Remove from favorites
        const removeResult = await this.removeFromFavorites(userId, listingId);
        return {
          success: removeResult.success,
          isFavorited: false,
          message: removeResult.message,
        };
      } else {
        // Add to favorites
        const addResult = await this.addToFavorites(userId, listingId);
        return {
          success: addResult.success,
          isFavorited: true,
          message: addResult.message,
        };
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      return {
        success: false,
        isFavorited: false,
        message: error instanceof Error ? error.message : 'Failed to toggle favorite',
      };
    }
  }
}

