import { useState, useCallback } from 'react';
import { supabase } from '../utils/supabase/client';
import { PostgrestError } from '@supabase/supabase-js';

// Interface atualizada para corresponder à nova estrutura da tabela 'services'
export interface Service {
  id: string;
  name: string;
  category: string;
  code: string;
  base_price: number;
  operational_cost: number;
  estimated_time?: string;
  instructions?: string;
  created_at: string;
}

// Tipo atualizado para a criação de um novo serviço
export type NewService = Omit<Service, 'id' | 'created_at'>;

export const useServices = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  const handleSupabaseError = (error: PostgrestError) => {
    console.error('Supabase error:', error);
    setError(error);
  };

  // Buscar todos os serviços
  const fetchServices = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      handleSupabaseError(error);
    } else {
      setServices(data || []);
    }
    setLoading(false);
  }, []);

  // Criar um novo serviço
  const createService = useCallback(async (serviceData: NewService) => {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from('services')
      .insert([serviceData])
      .select();

    if (error) {
      handleSupabaseError(error);
      setLoading(false);
      return null;
    } else {
      const newService = data ? data[0] : null;
      if (newService) {
        setServices((prev) => [...prev, newService].sort((a, b) => a.name.localeCompare(b.name)));
      }
      setLoading(false);
      return newService;
    }
  }, []);

  // Atualizar um serviço existente
  const updateService = useCallback(async (id: string, updates: Partial<NewService>) => {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from('services')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) {
      handleSupabaseError(error);
      setLoading(false);
      return null;
    } else {
      const updatedService = data ? data[0] : null;
      if (updatedService) {
        setServices((prev) =>
          prev.map((s) => (s.id === id ? updatedService : s))
        );
      }
      setLoading(false);
      return updatedService;
    }
  }, []);

  // Deletar um serviço
  const deleteService = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    const { error } = await supabase.from('services').delete().eq('id', id);

    if (error) {
      handleSupabaseError(error);
      setLoading(false);
      return false;
    } else {
      setServices((prev) => prev.filter((s) => s.id !== id));
      setLoading(false);
      return true;
    }
  }, []);

  return {
    services,
    loading,
    error,
    fetchServices,
    createService,
    updateService,
    deleteService,
  };
};
