import { useState, useCallback } from 'react';
import { supabase } from '../utils/supabase/client';
import { PostgrestError } from '@supabase/supabase-js';
import { Patient } from './usePatients';
import { Service } from './useServices';

// Interface para um agendamento, incluindo dados do paciente e serviços
export interface Appointment {
  id: string;
  patient_id: string;
  appointment_date: string;
  status: 'scheduled' | 'completed' | 'canceled' | 'no-show';
  notes?: string;
  created_at: string;
  created_by: string;
  // Campos populados a partir de joins
  patients: Patient; // Supabase renomeia a tabela para o singular
  appointment_services: { services: Service }[]; // Relação de serviços
}

// Tipo para a criação de um novo agendamento
export interface NewAppointmentData {
  p_patient_id: string;
  p_appointment_date: string;
  p_status: 'scheduled' | 'completed' | 'canceled' | 'no-show';
  p_notes?: string;
  p_service_ids: string[];
}

export const useAppointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  const handleSupabaseError = (error: PostgrestError) => {
    console.error('Supabase error:', error);
    setError(error);
  };

  // Buscar agendamentos (com detalhes de paciente e serviços)
  const fetchAppointments = useCallback(async (filters: { patientId?: string, date?: string } = {}) => {
    setLoading(true);
    setError(null);

    let query = supabase
      .from('appointments')
      .select(`
        *,
        patients (*),
        appointment_services (
          services (*)
        )
      `)
      .order('appointment_date', { ascending: false });

    if (filters.patientId) {
      query = query.eq('patient_id', filters.patientId);
    }
    // Adicionar filtro de data se necessário

    const { data, error } = await query;

    if (error) {
      handleSupabaseError(error);
    } else {
      // O tipo 'data' pode não corresponder perfeitamente a 'Appointment[]' por causa dos joins.
      // Fazemos um cast aqui, assumindo que a estrutura da query está correta.
      setAppointments(data as Appointment[] || []);
    }
    setLoading(false);
  }, []);

  // Criar um novo agendamento usando a função RPC
  const createAppointment = useCallback(async (appointmentData: NewAppointmentData) => {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.rpc('create_appointment_with_services', appointmentData);

    if (error) {
      handleSupabaseError(error);
      setLoading(false);
      return null;
    }
    
    // Após a criação, podemos buscar a lista atualizada para refletir a mudança
    await fetchAppointments();
    setLoading(false);
    return data; // Retorna o ID do novo agendamento
  }, [fetchAppointments]);

  // Atualizar o status de um agendamento
  const updateAppointmentStatus = useCallback(async (id: string, status: Appointment['status']) => {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from('appointments')
      .update({ status })
      .eq('id', id)
      .select();

    if (error) {
      handleSupabaseError(error);
      setLoading(false);
      return null;
    } else {
      const updatedAppointment = data ? data[0] : null;
      if (updatedAppointment) {
        setAppointments((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status: updatedAppointment.status } : a))
        );
      }
      setLoading(false);
      return updatedAppointment;
    }
  }, []);

  return {
    appointments,
    loading,
    error,
    fetchAppointments,
    createAppointment,
    updateAppointmentStatus,
  };
};
