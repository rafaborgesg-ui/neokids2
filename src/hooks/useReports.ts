import { useState, useCallback } from 'react';
import { supabase } from '../utils/supabase/client';
import { PostgrestError } from '@supabase/supabase-js';

// Tipo para os dados retornados pela função RPC
export interface TimeSeriesData {
  period: string; // ISO string date
  value: number;
}

// Tipo para os parâmetros da função
export interface ReportParams {
  metric: 'revenue' | 'appointments';
  startDate: string; // ISO string date
  endDate: string; // ISO string date
  timeUnit: 'day' | 'month';
}

export const useReports = () => {
  const [reportData, setReportData] = useState<TimeSeriesData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  const handleSupabaseError = (error: PostgrestError) => {
    console.error('Supabase error:', error);
    setError(error);
  };

  const fetchReport = useCallback(async (params: ReportParams) => {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.rpc('get_timeseries_stats', {
      metric: params.metric,
      start_date: params.startDate,
      end_date: params.endDate,
      time_unit: params.timeUnit,
    });

    if (error) {
      handleSupabaseError(error);
      setReportData([]);
    } else {
      setReportData(data || []);
    }
    setLoading(false);
  }, []);

  return {
    reportData,
    loading,
    error,
    fetchReport,
  };
};
