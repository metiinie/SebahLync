import { supabase } from '../lib/supabase';
import { User, RegisterFormData, LoginFormData, UpdateUserData } from '../types';
import { BaseService } from './base';

export class AuthService extends BaseService {
  static async signUp(data: RegisterFormData): Promise<{ success: boolean; user?: User; message?: string }> {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.full_name,
            phone: data.phone,
            role: data.role,
          },
        },
      });

      if (authError) {
        return this.handleError(authError, 'signUp');
      }

      if (!authData.user) {
        return this.handleError('User creation failed. Please try again.', 'signUp');
      }

      const userProfile = await this.createUserProfileDirectly(
        authData.user.id,
        data.email,
        data.full_name,
        data.phone,
        data.role
      );

      if (userProfile) {
        return this.success(userProfile, 'Registration successful! Please check your email to verify your account.');
      }

      const functionResult = await this.createUserProfileViaFunction(
        authData.user.id,
        data.email,
        data.full_name,
        data.phone,
        data.role
      );

      if (functionResult) {
        return this.success(functionResult, 'Registration successful! Please check your email to verify your account.');
      }

      return this.success(
        {
          id: authData.user.id,
          email: data.email,
          full_name: data.full_name,
          phone: data.phone,
          role: data.role,
          verified: false,
          rating: { average: 0, count: 0 },
          is_active: true,
          preferences: {
            notifications: { email: true, sms: true, push: true },
            language: 'en',
            dark_mode: false
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as User,
        'Registration successful! Please check your email to verify your account. Note: Some profile features may not be available until you log in again.'
      );
    } catch (error: unknown) {
      return this.handleError(error, 'signUp');
    }
  }

  private static async createUserProfileDirectly(
    userId: string,
    email: string,
    fullName: string,
    phone: string,
    role: string
  ): Promise<User | null> {
    try {
      const { data: newProfile, error } = await supabase
        .from('users')
        .insert({
          id: userId,
          email,
          full_name: fullName,
          phone,
          role,
          verified: false,
          rating: { average: 0, count: 0 },
          is_active: true,
          preferences: {
            notifications: { email: true, sms: true, push: true },
            language: 'en',
            dark_mode: false
          }
        })
        .select()
        .single();

      if (!error && newProfile) {
        return newProfile as User;
      }
      return null;
    } catch (error) {
      console.error('Direct profile creation failed:', error);
      return null;
    }
  }

  private static async createUserProfileViaFunction(
    userId: string,
    email: string,
    fullName: string,
    phone: string,
    role: string
  ): Promise<User | null> {
    try {
      const { data: result, error: functionError } = await supabase.rpc('create_user_profile', {
        p_user_id: userId,
        p_email: email,
        p_full_name: fullName,
        p_phone: phone,
        p_role: role
      });

      if (!functionError && result && typeof result === 'object' && 'success' in result && result.success) {
        const { data: newProfile, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();

        if (!fetchError && newProfile) {
          return newProfile as User;
        }
      }
    } catch (error) {
      console.error('Database function failed:', error);
    }

    return null;
  }

  private static async getUserProfile(userId: string): Promise<User | null> {
    try {
      const { data: userProfile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      // Ensure all required fields have defaults if missing
      return {
        ...userProfile,
        rating: userProfile.rating || { average: 0, count: 0 },
        preferences: userProfile.preferences || {
          notifications: { email: true, sms: true, push: true },
          language: 'en',
          dark_mode: false
        },
        avatar_url: userProfile.avatar_url || undefined,
      } as User;
    } catch (error: unknown) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  static async signIn(data: LoginFormData): Promise<{ success: boolean; user?: User; message?: string }> {
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        return this.handleError(error, 'signIn');
      }

      if (!authData.user) {
        return this.handleError('Login failed. Please check your credentials.', 'signIn');
      }

      const userProfile = await this.getUserProfile(authData.user.id);
      
      if (userProfile) {
        return this.success(userProfile, 'Login successful!');
      }

      const fallbackProfile = await this.createUserProfileFromAuth(authData.user);
      
      if (fallbackProfile) {
        return this.success(fallbackProfile, 'Login successful!');
      }

      const minimalProfile: User = {
        id: authData.user.id,
        email: authData.user.email || '',
        full_name: authData.user.user_metadata?.full_name || 'User',
        phone: authData.user.user_metadata?.phone || '+251000000000',
        role: authData.user.user_metadata?.role || 'buyer',
        verified: !!authData.user.email_confirmed_at,
        rating: { average: 0, count: 0 },
        is_active: true,
        preferences: {
          notifications: { email: true, sms: true, push: true },
          language: 'en',
          dark_mode: false
        },
        created_at: authData.user.created_at,
        updated_at: new Date().toISOString()
      };

      return this.success(minimalProfile, 'Login successful!');
    } catch (error: unknown) {
      return this.handleError(error, 'signIn');
    }
  }

  static async createUserProfileFromAuth(authUser: { 
    id: string; 
    email?: string; 
    user_metadata?: Record<string, unknown>; 
    email_confirmed_at?: string 
  }): Promise<User | null> {
    try {
      const profileData = {
        id: authUser.id,
        email: authUser.email || '',
        full_name: authUser.user_metadata?.full_name || 'User',
        phone: authUser.user_metadata?.phone || '+251000000000',
        role: authUser.user_metadata?.role || 'buyer',
        verified: !!authUser.email_confirmed_at,
        rating: { average: 0, count: 0 },
        is_active: true,
        preferences: {
          notifications: { email: true, sms: true, push: true },
          language: 'en',
          dark_mode: false
        }
      };

      const { data: newProfile, error } = await supabase
        .from('users')
        .insert(profileData)
        .select()
        .single();

      if (!error && newProfile) {
        return newProfile as User;
      }
      return null;
    } catch (error) {
      console.error('Failed to create profile from auth metadata:', error);
      return null;
    }
  }

  static async signOut(): Promise<{ success: boolean; message?: string }> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      return {
        success: true,
        message: 'Logged out successfully'
      };
    } catch (error: unknown) {
      console.error('Signout error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Logout failed';
      return {
        success: false,
        message: errorMessage
      };
    }
  }

  static async loadUserProfile(userId: string): Promise<User> {
    const userProfile = await this.getUserProfile(userId);
    if (!userProfile) {
      throw new Error('User profile not found');
    }
    return userProfile;
  }

  static async updateProfile(userId: string, data: UpdateUserData): Promise<{ success: boolean; user?: User; message?: string }> {
    try {
      const { data: updatedUser, error } = await supabase
        .from('users')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        user: updatedUser as User,
        message: 'Profile updated successfully'
      };
    } catch (error: unknown) {
      console.error('Update profile error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Profile update failed'
      };
    }
  }

  static async resetPassword(email: string): Promise<{ success: boolean; message?: string }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      return {
        success: true,
        message: 'Password reset email sent!'
      };
    } catch (error: unknown) {
      console.error('Reset password error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Password reset failed'
      };
    }
  }

  static async verifyEmail(token: string): Promise<{ success: boolean; message?: string }> {
    try {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'email',
      });

      if (error) throw error;

      return {
        success: true,
        message: 'Email verified successfully!'
      };
    } catch (error: unknown) {
      console.error('Verify email error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Email verification failed'
      };
    }
  }

  static async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return null;

      const timeoutPromise = new Promise<null>((_, reject) => {
        setTimeout(() => reject(new Error('Database query timeout')), 1000);
      });

      const profilePromise = this.getUserProfile(user.id);
      
      return await Promise.race([profilePromise, timeoutPromise]);
    } catch (error: unknown) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  static async getCurrentSession() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    } catch (error: unknown) {
      console.error('Get current session error:', error);
      return null;
    }
  }

  protected static handleError(error: unknown, context: string): ServiceResponse {
    console.error(`Error in ${context}:`, error);
    
    return {
      success: false,
      message: this.getErrorMessage(error),
      error,
    };
  }

  private static getErrorMessage(error: unknown): string {
    if (!error) return 'An unexpected error occurred.';

    // Handle Supabase AuthError and PostgrestError objects
    let message = '';
    if (error && typeof error === 'object') {
      // Supabase AuthError typically has 'message' property
      if ('message' in error && error.message) {
        message = String(error.message);
      } 
      // Some errors have 'error_description'
      else if ('error_description' in error && error.error_description) {
        message = String(error.error_description);
      } 
      // Some errors have 'msg'
      else if ('msg' in error && error.msg) {
        message = String(error.msg);
      }
      // PostgrestError might have 'details'
      else if ('details' in error && error.details) {
        message = String(error.details);
      }
      // PostgrestError might have 'hint'
      else if ('hint' in error && error.hint) {
        message = String(error.hint);
      }
      // Try to stringify the whole object if we can't find a message
      else {
        try {
          message = JSON.stringify(error);
        } catch {
          message = String(error);
        }
      }
    } else if (error instanceof Error) {
      message = error.message;
    } else {
      message = String(error);
    }

    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('user already registered') || 
        lowerMessage.includes('already registered') ||
        lowerMessage.includes('email address is already registered')) {
      return 'An account with this email already exists. Please sign in instead.';
    }
    if (lowerMessage.includes('invalid login credentials') || 
        lowerMessage.includes('invalid credentials') ||
        lowerMessage.includes('email or password is incorrect')) {
      return 'Invalid email or password. Please check your credentials and try again.';
    }
    if (lowerMessage.includes('email not confirmed') || 
        lowerMessage.includes('email not verified') ||
        lowerMessage.includes('confirm your email')) {
      return 'Please check your email and click the verification link to activate your account.';
    }
    if (lowerMessage.includes('password should be at least') || 
        lowerMessage.includes('password is too short')) {
      return 'Password must be at least 6 characters long.';
    }
    if (lowerMessage.includes('invalid email') || 
        lowerMessage.includes('email format is invalid')) {
      return 'Please enter a valid email address.';
    }
    if (lowerMessage.includes('rate limit') || 
        lowerMessage.includes('too many requests')) {
      return 'Too many attempts. Please wait a moment and try again.';
    }
    if (lowerMessage.includes('network') || 
        lowerMessage.includes('fetch') ||
        lowerMessage.includes('connection')) {
      return 'Network error. Please check your internet connection and try again.';
    }
    if (lowerMessage.includes('user not found')) {
      return 'No account found with this email address. Please sign up first.';
    }

    return message && message.length > 0 
      ? message 
      : 'An unexpected error occurred. Please try again.';
  }
}
