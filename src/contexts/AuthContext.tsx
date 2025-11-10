import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { User, LoginFormData, RegisterFormData, ProfileFormData } from '../types';
import { AuthService } from '../services/auth';
import { toast } from 'sonner';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  signUp: (data: RegisterFormData) => Promise<void>;
  signIn: (data: LoginFormData) => Promise<void>;
  login: (data: LoginFormData) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<ProfileFormData>) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  resendVerification: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        
        if (session?.user) {
          await loadUserProfile(session.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        
        if (session?.user) {
          await loadUserProfile(session.user);
        } else {
          setUser(null);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (supabaseUser: SupabaseUser) => {
    const createMinimalProfile = (): User => ({
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      full_name: supabaseUser.user_metadata?.full_name || 'User',
      phone: supabaseUser.user_metadata?.phone || '+251000000000',
      role: supabaseUser.user_metadata?.role || 'buyer',
      verified: !!supabaseUser.email_confirmed_at,
      rating: { average: 0, count: 0 },
      is_active: true,
      preferences: {
        notifications: { email: true, sms: true, push: true },
        language: 'en',
        dark_mode: false
      },
      created_at: supabaseUser.created_at,
      updated_at: new Date().toISOString()
    });

    setUser(createMinimalProfile());

    try {
      const timeoutPromise = new Promise<null>((_, reject) => {
        setTimeout(() => reject(new Error('Database query timeout')), 1500);
      });

      const profilePromise = AuthService.getCurrentUser();
      const userProfile = await Promise.race([profilePromise, timeoutPromise]);
      
      if (userProfile) {
        setUser(userProfile);
      }
    } catch (error) {
      // Keep the minimal profile that was already set
    }
  };

  const signUp = async (data: RegisterFormData) => {
    try {
      setLoading(true);
      
      const result = await AuthService.signUp(data);
      
      if (result.success) {
        toast.success(result.message || 'Registration successful!');
        if (result.user) {
          setUser(result.user);
        }
      } else {
        const errorMessage = result.message || 'Registration failed. Please try again.';
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Registration failed. Please check your information and try again.';
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (data: LoginFormData) => {
    try {
      setLoading(true);
      
      const result = await AuthService.signIn(data);
      
      if (result.success) {
        toast.success(result.message || 'Login successful!');
        if (result.user) {
          setUser(result.user);
        }
      } else {
        const errorMessage = result.message || 'Login failed. Please check your credentials and try again.';
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Login failed. Please check your email and password and try again.';
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const login = signIn;

  const signOut = async () => {
    try {
      const result = await AuthService.signOut();
      
      if (result.success) {
        setUser(null);
        setSession(null);
        toast.success(result.message || 'Logged out successfully');
      } else {
        toast.error(result.message || 'Logout failed');
        throw new Error(result.message || 'Logout failed');
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Logout failed');
      throw error;
    }
  };

  const updateProfile = async (data: Partial<ProfileFormData>) => {
    if (!user) throw new Error('No user logged in');

    try {
      const result = await AuthService.updateProfile(user.id, data);
      
      if (result.success) {
        if (result.user) {
          setUser(result.user);
        }
        toast.success(result.message || 'Profile updated successfully');
      } else {
        toast.error(result.message || 'Profile update failed');
        throw new Error(result.message || 'Profile update failed');
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Profile update failed');
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const result = await AuthService.resetPassword(email);
      
      if (result.success) {
        toast.success(result.message || 'Password reset email sent');
      } else {
        toast.error(result.message || 'Password reset failed');
        throw new Error(result.message || 'Password reset failed');
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Password reset failed');
      throw error;
    }
  };

  const verifyEmail = async (token: string) => {
    try {
      const result = await AuthService.verifyEmail(token);
      
      if (result.success) {
        toast.success(result.message || 'Email verified successfully');
      } else {
        toast.error(result.message || 'Email verification failed');
        throw new Error(result.message || 'Email verification failed');
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Email verification failed');
      throw error;
    }
  };

  const resendVerification = async () => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user?.email || '',
      });

      if (error) throw error;
      toast.success('Verification email sent');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to send verification email');
      throw error;
    }
  };

  const refreshUser = async () => {
    if (session?.user) {
      await loadUserProfile(session.user);
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    isAuthenticated: !!user,
    signUp,
    signIn,
    login,
    signOut,
    updateProfile,
    resetPassword,
    verifyEmail,
    resendVerification,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
