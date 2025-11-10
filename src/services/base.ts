import { supabase } from '../lib/supabase';

export interface ServiceResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: unknown;
}

export abstract class BaseService {
  protected static success<T>(data: T, message?: string): ServiceResponse<T> {
    return {
      success: true,
      data,
      message,
    };
  }

  protected static error(message: string, error?: unknown): ServiceResponse {
    return {
      success: false,
      message,
      error,
    };
  }

  protected static handleError(error: unknown, context: string): ServiceResponse {
    console.error(`Error in ${context}:`, error);
    
    let message = 'An unexpected error occurred';
    
    if (error && typeof error === 'object' && 'message' in error) {
      message = String(error.message);
    } else if (typeof error === 'string') {
      message = error;
    }
    
    return {
      success: false,
      message,
      error,
    };
  }

  protected static async executeQuery<T>(
    queryFn: () => Promise<{ data: T | null; error: unknown }>,
    context: string
  ): Promise<ServiceResponse<T | null>> {
    try {
      const { data, error } = await queryFn();
      
      if (error) {
        console.error(`Database error in ${context}:`, error);
        return this.error(error instanceof Error ? error.message : 'Database operation failed', error) as ServiceResponse<T | null>;
      }
      
      return this.success(data);
    } catch (error) {
      return this.handleError(error, context) as ServiceResponse<T | null>;
    }
  }

  protected static async executeParallelQueries<T>(
    queries: Array<() => Promise<ServiceResponse<T>>>,
    context: string
  ): Promise<ServiceResponse<T[]>> {
    try {
      const results = await Promise.allSettled(queries.map(query => query()));
      
      const successfulResults: T[] = [];
      const errors: string[] = [];
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.success) {
          if (result.value.data !== undefined) {
            successfulResults.push(result.value.data);
          }
        } else {
          const errorMessage = result.status === 'rejected' 
            ? `Query ${index + 1} failed: ${result.reason}`
            : `Query ${index + 1} failed: ${result.value.message}`;
          errors.push(errorMessage);
        }
      });
      
      if (errors.length > 0) {
        console.warn(`Some queries failed in ${context}:`, errors);
      }
      
      return this.success(successfulResults);
    } catch (error) {
      return this.handleError(error, context) as ServiceResponse<T[]>;
    }
  }

  protected static validateRequiredFields(
    data: Record<string, unknown>, 
    requiredFields: string[]
  ): string | null {
    for (const field of requiredFields) {
      if (data[field] === undefined || data[field] === null || data[field] === '') {
        return `Field '${field}' is required`;
      }
    }
    return null;
  }

  protected static sanitizeData<T extends Record<string, unknown>>(data: T): T {
    const sanitized = { ...data };
    
    // Remove undefined values
    Object.keys(sanitized).forEach(key => {
      if (sanitized[key] === undefined) {
        delete sanitized[key];
      }
    });
    
    return sanitized;
  }

  protected static async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      throw new Error('Failed to get current user');
    }
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    return user;
  }

  protected static async isAdmin(userId?: string): Promise<boolean> {
    try {
      const user = userId ? { id: userId } : await this.getCurrentUser();
      
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error('Error checking admin status:', error);
        return false;
      }
      
      return data?.role === 'admin';
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }
}