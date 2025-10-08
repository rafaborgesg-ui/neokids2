import { useState, useCallback } from 'react';
import { supabase } from '../utils/supabase/client';
import { PostgrestError } from '@supabase/supabase-js';

export interface AuditLogEntry {
  id: string; // UUID é uma string
  table_name: string;
  record_id: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  old_record_data?: any;
  new_record_data?: any;
  user_id: string;
  user_email: string;
  created_at: string; // Corrigir o nome da coluna
}

export interface LogFilters {
  page: number;
  perPage: number;
  tableName?: string;
}

export const useAuditLogs = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  const handleSupabaseError = (error: PostgrestError) => {
    console.error('Supabase error:', error);
    setError(error);
  };

  const fetchLogs = useCallback(async (filters: LogFilters) => {
    setLoading(true);
    setError(null);

    const from = (filters.page - 1) * filters.perPage;
    const to = from + filters.perPage - 1;

    let query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false }) // Corrigir o nome da coluna
      .range(from, to);

    if (filters.tableName) {
      query = query.eq('table_name', filters.tableName);
    }

    const { data, error, count } = await query;

    if (error) {
      handleSupabaseError(error);
    } else {
      setLogs(data || []);
      setCount(count);
    }
    setLoading(false);
  }, []);

  return {
    logs,
    count,
    loading,
    error,
    fetchLogs,
  };
};
