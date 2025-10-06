import { useState, useCallback } from 'react';
import { supabase } from '../utils/supabase/client';
import { PostgrestError } from '@supabase/supabase-js';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message?: string;
  is_read: boolean;
  type: 'info' | 'warning' | 'alert';
  created_at: string;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  const handleSupabaseError = (error: PostgrestError) => {
    console.error('Supabase error:', error);
    setError(error);
  };

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    const { data, error, count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('is_read', false)
      .order('created_at', { ascending: false });

    if (error) {
      handleSupabaseError(error);
    } else {
      setNotifications(data || []);
      setUnreadCount(count || 0);
    }
    setLoading(false);
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);

    if (error) {
      handleSupabaseError(error);
    } else {
      setNotifications(prev => prev.filter(n => n.id !== id));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  }, []);
  
  const markAllAsRead = useCallback(async () => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('is_read', false);

    if (error) {
      handleSupabaseError(error);
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, []);

  return { notifications, unreadCount, loading, error, fetchNotifications, markAsRead, markAllAsRead };
};
