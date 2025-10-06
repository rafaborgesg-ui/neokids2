import { useState, useCallback } from 'react';
import { supabase } from '../utils/supabase/client';
import { PostgrestError } from '@supabase/supabase-js';
import { Appointment } from './useAppointments';

// Interface para um resultado de exame
export interface ExamResult {
  id: string;
  appointment_id: string;
  service_id: string;
  patient_id: string;
  result_data: any; // JSONB pode ser qualquer objeto
  notes?: string;
  status: 'pending' | 'preliminary' | 'final' | 'corrected';
  issued_at?: string;
  created_at: string;
  created_by: string;
  updated_at?: string;
  updated_by?: string;
}

// Tipo para criar ou atualizar um resultado
export type UpsertExamResult = {
  appointment_id: string;
  service_id: string;
  patient_id: string;
  result_data: any;
  notes?: string;
  status: ExamResult['status'];
};

export const useExamResults = () => {
  const [results, setResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  const handleSupabaseError = (error: PostgrestError) => {
    console.error('Supabase error:', error);
    setError(error);
  };

  // Buscar resultados para um ou mais agendamentos
  const fetchResultsForAppointments = useCallback(async (appointmentIds: string[]) => {
    if (appointmentIds.length === 0) {
      setResults([]);
      return;
    }
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from('exam_results')
      .select('*')
      .in('appointment_id', appointmentIds);

    if (error) {
      handleSupabaseError(error);
    } else {
      setResults(data || []);
    }
    setLoading(false);
  }, []);

  // Criar ou atualizar um resultado de exame (Upsert)
  const upsertResult = useCallback(async (resultData: UpsertExamResult) => {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from('exam_results')
      .upsert(resultData, { onConflict: 'appointment_id, service_id' })
      .select();

    if (error) {
      handleSupabaseError(error);
      setLoading(false);
      return null;
    } else {
      const upsertedResult = data ? data[0] : null;
      if (upsertedResult) {
        // Atualiza a lista local de resultados
        setResults(prev => {
          const index = prev.findIndex(r => r.id === upsertedResult.id);
          if (index !== -1) {
            const newResults = [...prev];
            newResults[index] = upsertedResult;
            return newResults;
          }
          return [...prev, upsertedResult];
        });
      }
      setLoading(false);
      return upsertedResult;
    }
  }, []);

  return {
    results,
    loading,
    error,
    fetchResultsForAppointments,
    upsertResult,
  };
};
