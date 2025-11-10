import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchRecords, updateRecord, deleteRecord, subscribeToUserNotifications, formatRelativeTime } from '../lib/supabase';
import { Notification } from '../types';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
}

interface NotificationContextType extends NotificationState {
  loadNotifications: (page?: number, limit?: number) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  updatePreferences: (preferences: any) => Promise<void>;
  addNotification: (notification: Notification) => void;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const loadNotifications = async (page = 1, limit = 20) => {
    if (!user) return;

    try {
      setLoading(true);
      const offset = (page - 1) * limit;
      
      const data = await fetchRecords<Notification>('notifications', {
        select: '*',
        filters: { user_id: user.id },
        orderBy: { column: 'created_at', ascending: false },
        limit,
        offset,
      });

      // Add timeAgo to each notification
      const notificationsWithTimeAgo = data.map(notification => ({
        ...notification,
        timeAgo: formatRelativeTime(notification.created_at),
      }));

      if (page === 1) {
        setNotifications(notificationsWithTimeAgo);
      } else {
        setNotifications(prev => [...prev, ...notificationsWithTimeAgo]);
      }

      // Calculate unread count
      const unread = notificationsWithTimeAgo.filter(n => !n.read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Failed to load notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    if (!user) return;

    try {
      await updateRecord('notifications', notificationId, {
        read: true,
        read_at: new Date().toISOString(),
      });

      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, read: true, read_at: new Date().toISOString() }
            : notification
        )
      );

      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      // Update all unread notifications for the user
      const unreadNotifications = notifications.filter(n => !n.read);
      
      for (const notification of unreadNotifications) {
        await updateRecord('notifications', notification.id, {
          read: true,
          read_at: new Date().toISOString(),
        });
      }

      setNotifications(prev =>
        prev.map(notification => ({
          ...notification,
          read: true,
          read_at: new Date().toISOString(),
        }))
      );

      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      toast.error('Failed to mark all notifications as read');
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await deleteRecord('notifications', notificationId);
      
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      // Update unread count if the deleted notification was unread
      const deletedNotification = notifications.find(n => n.id === notificationId);
      if (deletedNotification && !deletedNotification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Failed to delete notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  const updatePreferences = async (preferences: any) => {
    if (!user) return;

    try {
      await updateRecord('users', user.id, {
        preferences: {
          ...user.preferences,
          notifications: preferences,
        },
      });
      
      toast.success('Notification preferences updated');
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
      toast.error('Failed to update notification preferences');
    }
  };

  const addNotification = (notification: Notification) => {
    setNotifications(prev => [notification, ...prev]);
    
    if (!notification.read) {
      setUnreadCount(prev => prev + 1);
    }
    
    // Show toast for high priority notifications
    if (notification.priority === 'high' || notification.priority === 'urgent') {
      toast.info(notification.title, {
        description: notification.message,
        duration: 5000,
      });
    }
  };

  const refreshNotifications = async () => {
    await loadNotifications(1, 20);
  };

  // Set up real-time subscription for notifications
  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToUserNotifications(user.id, (payload) => {
      console.log('Real-time notification update:', payload);
      
      if (payload.eventType === 'INSERT') {
        const newNotification = {
          ...(payload.new as any),
          timeAgo: formatRelativeTime((payload.new as any).created_at),
        };
        addNotification(newNotification);
      } else if (payload.eventType === 'UPDATE') {
        setNotifications(prev =>
          prev.map(notification =>
            notification.id === (payload.new as any).id
              ? { ...(payload.new as any), timeAgo: formatRelativeTime((payload.new as any).created_at) }
              : notification
          )
        );
      } else if (payload.eventType === 'DELETE') {
        setNotifications(prev => prev.filter(n => n.id !== (payload.old as any).id));
      }
    });

    return () => {
      unsubscribe();
    };
  }, [user]);

  // Load notifications when user changes
  useEffect(() => {
    if (user) {
      loadNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    loading,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    updatePreferences,
    addNotification,
    refreshNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
