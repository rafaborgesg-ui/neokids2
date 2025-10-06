import { useState, useCallback } from 'react';
import { supabase } from '../utils/supabase/client';
import { PostgrestError } from '@supabase/supabase-js';

// A interface Patient deve corresponder à sua tabela no Supabase.
// Vamos garantir que os nomes das colunas estejam corretos.
// No SQL, você usou snake_case (ex: birth_date), então vamos usar aqui também.
export interface Patient {
  id: string;
  name: string;
  birth_date: string;
  cpf: string;
  phone: string;
  email?: string;
  address: string;
  responsible_name: string;
  responsible_cpf: string;
  responsible_phone: string;
  special_alert?: string;
  created_at: string;
  created_by: string;
}

// O tipo para um novo paciente não terá id, created_at, etc.
export type NewPatient = Omit<Patient, 'id' | 'created_at' | 'created_by'>;
export type UpdatePatient = Partial<NewPatient>;

export const usePatients = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  const handleSupabaseError = (error: PostgrestError) => {
    console.error('Supabase error:', error);
    setError(error);
    // Aqui você poderia adicionar uma notificação para o usuário
  };

  // Buscar pacientes
  const fetchPatients = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setPatients([]);
      return;
    }
    setLoading(true);
    setError(null);

    // O Supabase pode buscar em múltiplas colunas com 'or'
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .or(`name.ilike.%${searchQuery}%,cpf.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`);

    if (error) {
      handleSupabaseError(error);
    } else {
      setPatients(data || []);
    }
    setLoading(false);
  }, []);

  // Criar um novo paciente
  const createPatient = useCallback(async (patientData: NewPatient) => {
    setLoading(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      const authError = { message: "Usuário não autenticado.", details: "", hint: "", code: "401" };
      handleSupabaseError(authError as PostgrestError);
      setLoading(false);
      return null;
    }

    const dataToInsert = {
      ...patientData,
      created_by: user.id, // Garante que o criador seja registrado
    };

    const { data, error } = await supabase
      .from('patients')
      .insert([dataToInsert])
      .select();

    if (error) {
      handleSupabaseError(error);
      setLoading(false);
      return null;
    } else {
      const newPatient = data ? data[0] : null;
      if (newPatient) {
        setPatients((prev) => [newPatient, ...prev]);
      }
      setLoading(false);
      return newPatient;
    }
  }, []);

  // Atualizar um paciente
  const updatePatient = useCallback(async (id: string, updates: UpdatePatient) => {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from('patients')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) {
      handleSupabaseError(error);
      setLoading(false);
      return null;
    } else {
      const updatedPatient = data ? data[0] : null;
      if (updatedPatient) {
        setPatients((prev) =>
          prev.map((p) => (p.id === id ? updatedPatient : p))
        );
      }
      setLoading(false);
      return updatedPatient;
    }
  }, []);

  // Deletar um paciente
  const deletePatient = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    const { error } = await supabase.from('patients').delete().eq('id', id);

    if (error) {
      handleSupabaseError(error);
      setLoading(false);
      return false;
    } else {
      setPatients((prev) => prev.filter((p) => p.id !== id));
      setLoading(false);
      return true;
    }
  }, []);

  return {
    patients,
    loading,
    error,
    fetchPatients,
    createPatient,
    updatePatient,
    deletePatient,
  };
};
