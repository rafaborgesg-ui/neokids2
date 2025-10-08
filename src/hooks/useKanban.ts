import { useState, useCallback } from 'react';
import { supabase } from '../utils/supabase/client';
import { PostgrestError } from '@supabase/supabase-js';
import { Appointment, AppointmentStatus } from './useAppointments'; // Reutilizar tipos existentes

export const useKanban = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  const handleSupabaseError = (error: PostgrestError) => {
    console.error('Supabase error:', error);
    setError(error);
  };

  const fetchLabAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.rpc('get_lab_appointments');
    
    if (error) {
      handleSupabaseError(error);
      setAppointments([]);
    } else {
      setAppointments(data || []);
    }
    setLoading(false);
  }, []);

  const updateAppointmentStatus = useCallback(async (appointmentId: string, newStatus: AppointmentStatus) => {
    // A lógica de update pode permanecer a mesma, mas atualizamos o estado local
    const { data, error } = await supabase
      .from('appointments')
      .update({ status: newStatus })
      .eq('id', appointmentId)
      .select();

    if (error) {
      handleSupabaseError(error);
    } else {
      // Atualiza o estado local para refletir a mudança instantaneamente no Kanban
      setAppointments(prev => 
        prev.map(app => 
          app.id === appointmentId ? { ...app, status: newStatus } : app
        )
      );
    }
  }, []);

  return { appointments, loading, error, fetchLabAppointments, updateAppointmentStatus };
};
