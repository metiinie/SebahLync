import { supabase } from '../lib/supabase';
import { Notification, CreateNotificationData } from '../types';

export class NotificationsService {
  // Get user notifications
  static async getUserNotifications(
    userId: string,
    pagination: { page: number; limit: number } = { page: 1, limit: 20 }
  ): Promise<{ success: boolean; data: Notification[]; total: number; message?: string }> {
    try {
      const { page, limit } = pagination;
      const offset = (page - 1) * limit;

      const { data, error, count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      // Add timeAgo field to each notification
      const notificationsWithTimeAgo = (data || []).map(notification => ({
        ...notification,
        timeAgo: this.formatRelativeTime(notification.created_at),
      }));

      return {
        success: true,
        data: notificationsWithTimeAgo,
        total: count || 0,
      };
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      return {
        success: false,
        data: [],
        total: 0,
        message: error instanceof Error ? error.message : 'Failed to fetch notifications',
      };
    }
  }

  // Get unread notifications count
  static async getUnreadCount(userId: string): Promise<{ success: boolean; count: number; message?: string }> {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) throw error;

      return {
        success: true,
        count: count || 0,
      };
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return {
        success: false,
        count: 0,
        message: error instanceof Error ? error.message : 'Failed to fetch unread count',
      };
    }
  }

  // Create a new notification
  static async createNotification(
    notificationData: CreateNotificationData
  ): Promise<{ success: boolean; data: Notification | null; message?: string }> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert(notificationData)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('Error creating notification:', error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Failed to create notification',
      };
    }
  }

  // Mark notification as read
  static async markAsRead(notificationId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          read: true,
          read_at: new Date().toISOString(),
        })
        .eq('id', notificationId);

      if (error) throw error;

      return {
        success: true,
      };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to mark notification as read',
      };
    }
  }

  // Mark all notifications as read
  static async markAllAsRead(userId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          read: true,
          read_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) throw error;

      return {
        success: true,
      };
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to mark all notifications as read',
      };
    }
  }

  // Delete notification
  static async deleteNotification(notificationId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      return {
        success: true,
      };
    } catch (error) {
      console.error('Error deleting notification:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete notification',
      };
    }
  }

  // Delete all notifications for user
  static async deleteAllNotifications(userId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      return {
        success: true,
      };
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete all notifications',
      };
    }
  }

  // Create notification for listing approval
  static async createListingApprovalNotification(
    userId: string,
    listingTitle: string,
    listingId: string,
    approved: boolean
  ): Promise<{ success: boolean; data: Notification | null; message?: string }> {
    const notificationData: CreateNotificationData = {
      user_id: userId,
      type: approved ? 'listing_approved' : 'listing_rejected',
      title: approved ? 'Listing Approved!' : 'Listing Rejected',
      message: approved
        ? `Your listing "${listingTitle}" has been approved and is now active.`
        : `Your listing "${listingTitle}" was rejected. Please check the details and resubmit.`,
      link: approved ? `/listing/${listingId}` : '/profile?tab=my-listings',
      priority: 'high',
      channels: { in_app: true, email: false, sms: false, push: false },
      expires_at: '',
    };

    return await this.createNotification(notificationData);
  }

  // Create notification for payment received
  static async createPaymentReceivedNotification(
    sellerId: string,
    listingTitle: string,
    amount: number,
    currency: string,
    transactionId: string
  ): Promise<{ success: boolean; data: Notification | null; message?: string }> {
    const notificationData: CreateNotificationData = {
      user_id: sellerId,
      type: 'payment_received',
      title: 'Payment Received!',
      message: `Payment of ${amount} ${currency} for "${listingTitle}" is now in escrow.`,
      link: `/profile?tab=my-transactions&transaction=${transactionId}`,
      priority: 'high',
      channels: { in_app: true, email: false, sms: false, push: false },
      expires_at: '',
    };

    return await this.createNotification(notificationData);
  }

  // Create notification for escrow release
  static async createEscrowReleaseNotification(
    sellerId: string,
    listingTitle: string,
    amount: number,
    currency: string,
    transactionId: string
  ): Promise<{ success: boolean; data: Notification | null; message?: string }> {
    const notificationData: CreateNotificationData = {
      user_id: sellerId,
      type: 'escrow_released',
      title: 'Funds Released!',
      message: `Funds of ${amount} ${currency} for "${listingTitle}" have been released to your account.`,
      link: `/profile?tab=my-transactions&transaction=${transactionId}`,
      priority: 'high',
      channels: { in_app: true, email: false, sms: false, push: false },
      expires_at: '',
    };

    return await this.createNotification(notificationData);
  }

  // Create notification for user verification
  static async createUserVerificationNotification(
    userId: string,
    verified: boolean
  ): Promise<{ success: boolean; data: Notification | null; message?: string }> {
    const notificationData: CreateNotificationData = {
      user_id: userId,
      type: 'user_verified',
      title: verified ? 'Account Verified!' : 'Account Verification Required',
      message: verified
        ? 'Your account has been verified. You can now access all platform features.'
        : 'Your account verification is pending. Please complete the verification process.',
      link: '/profile',
      priority: verified ? 'high' : 'medium',
      channels: { in_app: true, email: false, sms: false, push: false },
      expires_at: '',
    };

    return await this.createNotification(notificationData);
  }

  // Create system notification
  static async createSystemNotification(
    userId: string,
    title: string,
    message: string,
    priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium',
    link?: string
  ): Promise<{ success: boolean; data: Notification | null; message?: string }> {
    const notificationData: CreateNotificationData = {
      user_id: userId,
      type: 'system_message',
      title,
      message,
      link,
      priority,
      channels: { in_app: true, email: false, sms: false, push: false },
      expires_at: '',
    };

    return await this.createNotification(notificationData);
  }

  // Create notification for all admins
  static async createAdminNotification(
    title: string,
    message: string,
    priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium',
    link?: string
  ): Promise<{ success: boolean; data: Notification[]; message?: string }> {
    try {
      // Get all admin users
      const { data: admins, error: adminError } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'admin');

      if (adminError) throw adminError;

      if (!admins || admins.length === 0) {
        return {
          success: true,
          data: [],
        };
      }

      // Create notifications for all admins
      const notifications = await Promise.all(
        admins.map(admin =>
          this.createSystemNotification(admin.id, title, message, priority, link)
        )
      );

      const successfulNotifications = notifications
        .filter(n => n.success)
        .map(n => n.data)
        .filter(Boolean) as Notification[];

      return {
        success: true,
        data: successfulNotifications,
      };
    } catch (error) {
      console.error('Error creating admin notifications:', error);
      return {
        success: false,
        data: [],
        message: error instanceof Error ? error.message : 'Failed to create admin notifications',
      };
    }
  }

  // Get notification statistics
  static async getNotificationStats(userId: string): Promise<{ success: boolean; data: any; message?: string }> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('type, priority, read, created_at')
        .eq('user_id', userId);

      if (error) throw error;

      const stats = {
        total: data?.length || 0,
        unread: 0,
        byType: {} as Record<string, number>,
        byPriority: {} as Record<string, number>,
        recent: 0,
      };

      if (data && data.length > 0) {
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        data.forEach((notification) => {
          if (!notification.read) {
            stats.unread += 1;
          }

          stats.byType[notification.type] = (stats.byType[notification.type] || 0) + 1;
          stats.byPriority[notification.priority] = (stats.byPriority[notification.priority] || 0) + 1;

          if (new Date(notification.created_at) > oneWeekAgo) {
            stats.recent += 1;
          }
        });
      }

      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      console.error('Error fetching notification stats:', error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Failed to fetch notification statistics',
      };
    }
  }

  // Format relative time
  private static formatRelativeTime(timestamp: string): string {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 2592000) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
      return time.toLocaleDateString();
    }
  }
}
