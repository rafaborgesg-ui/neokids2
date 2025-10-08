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
    console.log('[DEBUG] Iniciando upsertResult com:', resultData);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('[DEBUG] Falha no upsert: Usuário não autenticado.');
      setLoading(false);
      return null;
    }

    const dataToUpsert = {
      ...resultData,
      created_by: user.id,
      updated_by: user.id,
      issued_at: new Date().toISOString(),
    };

    // Executa as duas operações em paralelo
    const [updateResponse, upsertResponse] = await Promise.all([
      supabase.from('appointment_services').update({
        result_data: resultData.result_data,
        notes: resultData.notes,
      }).match({ appointment_id: resultData.appointment_id, service_id: resultData.service_id }),
      
      supabase.from('exam_results')
        .upsert(dataToUpsert, { onConflict: 'appointment_id, service_id' })
        .select()
    ]);

    console.log('[DEBUG] Resposta do update em appointment_services:', updateResponse);
    console.log('[DEBUG] Resposta do upsert em exam_results:', upsertResponse);

    // Verifica se houve erro em QUALQUER uma das operações
    if (updateResponse.error || upsertResponse.error) {
      const error = updateResponse.error || upsertResponse.error;
      handleSupabaseError(error as PostgrestError);
      setLoading(false);
      return null;
    }

    const upsertedResult = upsertResponse.data ? upsertResponse.data[0] : null;
    if (upsertedResult) {
      setResults(prev => {
        const index = prev.findIndex(r => r.appointment_id === upsertedResult.appointment_id && r.service_id === upsertedResult.service_id);
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
  }, []);

  return {
    results,
    loading,
    error,
    fetchResultsForAppointments,
    upsertResult,
  };
};
