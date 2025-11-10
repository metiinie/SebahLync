import { supabase } from '../lib/supabase';
import { User, UpdateUserData } from '../types';

export class UsersService {
  // Get user by ID
  static async getUserById(id: string): Promise<{ success: boolean; data: User | null; message?: string }> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('Error fetching user:', error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Failed to fetch user',
      };
    }
  }

  // Get user by email
  static async getUserByEmail(email: string): Promise<{ success: boolean; data: User | null; message?: string }> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 means no rows found

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('Error fetching user by email:', error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Failed to fetch user by email',
      };
    }
  }

  // Update user profile
  static async updateUser(
    id: string,
    updates: UpdateUserData
  ): Promise<{ success: boolean; data: User | null; message?: string }> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('Error updating user:', error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Failed to update user',
      };
    }
  }

  // Get all users (admin only)
  static async getAllUsers(
    pagination: { page: number; limit: number } = { page: 1, limit: 12 },
    filters: { role?: string; verified?: boolean; is_active?: boolean } = {}
  ): Promise<{ success: boolean; data: User[]; total: number; message?: string }> {
    try {
      const { page, limit } = pagination;
      const offset = (page - 1) * limit;

      let query = supabase
        .from('users')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      // Apply filters
      if (filters.role) {
        query = query.eq('role', filters.role);
      }

      if (filters.verified !== undefined) {
        query = query.eq('verified', filters.verified);
      }

      if (filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        success: true,
        data: data || [],
        total: count || 0,
      };
    } catch (error) {
      console.error('Error fetching all users:', error);
      return {
        success: false,
        data: [],
        total: 0,
        message: error instanceof Error ? error.message : 'Failed to fetch users',
      };
    }
  }

  // Verify user
  static async verifyUser(id: string): Promise<{ success: boolean; data: User | null; message?: string }> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          verified: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('Error verifying user:', error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Failed to verify user',
      };
    }
  }

  // Suspend user
  static async suspendUser(id: string, reason?: string): Promise<{ success: boolean; data: User | null; message?: string }> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('Error suspending user:', error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Failed to suspend user',
      };
    }
  }

  // Activate user
  static async activateUser(id: string): Promise<{ success: boolean; data: User | null; message?: string }> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('Error activating user:', error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Failed to activate user',
      };
    }
  }

  // Update user role
  static async updateUserRole(
    id: string,
    role: 'buyer' | 'seller' | 'admin'
  ): Promise<{ success: boolean; data: User | null; message?: string }> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          role,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('Error updating user role:', error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Failed to update user role',
      };
    }
  }

  // Update user rating
  static async updateUserRating(
    id: string,
    rating: { average: number; count: number }
  ): Promise<{ success: boolean; data: User | null; message?: string }> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          rating,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('Error updating user rating:', error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Failed to update user rating',
      };
    }
  }

  // Update user preferences
  static async updateUserPreferences(
    id: string,
    preferences: User['preferences']
  ): Promise<{ success: boolean; data: User | null; message?: string }> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          preferences,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('Error updating user preferences:', error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Failed to update user preferences',
      };
    }
  }

  // Get user statistics
  static async getUserStats(): Promise<{ success: boolean; data: any; message?: string }> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role, verified, is_active, created_at');

      if (error) throw error;

      const stats = {
        total: data?.length || 0,
        byRole: {} as Record<string, number>,
        verified: 0,
        active: 0,
        monthlyStats: {} as Record<string, number>,
      };

      if (data && data.length > 0) {
        data.forEach((user) => {
          stats.byRole[user.role] = (stats.byRole[user.role] || 0) + 1;
          
          if (user.verified) {
            stats.verified += 1;
          }
          
          if (user.is_active) {
            stats.active += 1;
          }

          // Monthly statistics
          const month = new Date(user.created_at).toISOString().substring(0, 7); // YYYY-MM
          stats.monthlyStats[month] = (stats.monthlyStats[month] || 0) + 1;
        });
      }

      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      console.error('Error fetching user stats:', error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Failed to fetch user statistics',
      };
    }
  }

  // Search users
  static async searchUsers(
    searchTerm: string,
    pagination: { page: number; limit: number } = { page: 1, limit: 12 }
  ): Promise<{ success: boolean; data: User[]; total: number; message?: string }> {
    try {
      const { page, limit } = pagination;
      const offset = (page - 1) * limit;

      const { data, error, count } = await supabase
        .from('users')
        .select('*', { count: 'exact' })
        .or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return {
        success: true,
        data: data || [],
        total: count || 0,
      };
    } catch (error) {
      console.error('Error searching users:', error);
      return {
        success: false,
        data: [],
        total: 0,
        message: error instanceof Error ? error.message : 'Failed to search users',
      };
    }
  }

  // Get users by role
  static async getUsersByRole(
    role: 'buyer' | 'seller' | 'admin',
    pagination: { page: number; limit: number } = { page: 1, limit: 12 }
  ): Promise<{ success: boolean; data: User[]; total: number; message?: string }> {
    try {
      const { page, limit } = pagination;
      const offset = (page - 1) * limit;

      const { data, error, count } = await supabase
        .from('users')
        .select('*', { count: 'exact' })
        .eq('role', role)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return {
        success: true,
        data: data || [],
        total: count || 0,
      };
    } catch (error) {
      console.error('Error fetching users by role:', error);
      return {
        success: false,
        data: [],
        total: 0,
        message: error instanceof Error ? error.message : 'Failed to fetch users by role',
      };
    }
  }

  // Get pending verification users
  static async getPendingVerificationUsers(
    pagination: { page: number; limit: number } = { page: 1, limit: 12 }
  ): Promise<{ success: boolean; data: User[]; total: number; message?: string }> {
    try {
      const { page, limit } = pagination;
      const offset = (page - 1) * limit;

      const { data, error, count } = await supabase
        .from('users')
        .select('*', { count: 'exact' })
        .eq('verified', false)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return {
        success: true,
        data: data || [],
        total: count || 0,
      };
    } catch (error) {
      console.error('Error fetching pending verification users:', error);
      return {
        success: false,
        data: [],
        total: 0,
        message: error instanceof Error ? error.message : 'Failed to fetch pending verification users',
      };
    }
  }

  // Get suspended users
  static async getSuspendedUsers(
    pagination: { page: number; limit: number } = { page: 1, limit: 12 }
  ): Promise<{ success: boolean; data: User[]; total: number; message?: string }> {
    try {
      const { page, limit } = pagination;
      const offset = (page - 1) * limit;

      const { data, error, count } = await supabase
        .from('users')
        .select('*', { count: 'exact' })
        .eq('is_active', false)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return {
        success: true,
        data: data || [],
        total: count || 0,
      };
    } catch (error) {
      console.error('Error fetching suspended users:', error);
      return {
        success: false,
        data: [],
        total: 0,
        message: error instanceof Error ? error.message : 'Failed to fetch suspended users',
      };
    }
  }
}