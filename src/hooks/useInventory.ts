import { useState, useCallback } from 'react';
import { supabase } from '../utils/supabase/client';
import { PostgrestError } from '@supabase/supabase-js';

export interface InventoryItem {
  id: string;
  created_at: string;
  name: string;
  description?: string;
  quantity: number;
  unit?: string;
  alert_level: number;
  supplier?: string;
  last_updated_by?: string;
}

export type NewInventoryItem = Omit<InventoryItem, 'id' | 'created_at' | 'last_updated_by'>;
export type UpdateInventoryItem = Partial<NewInventoryItem>;

export const useInventory = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  const handleSupabaseError = (error: PostgrestError) => {
    console.error('[DEBUG] Erro retornado pelo Supabase:', error); // Log do erro
    setError(error);
  };

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .order('name');
    
    if (error) handleSupabaseError(error);
    else setItems(data || []);
    setLoading(false);
  }, []);

  const createItem = useCallback(async (itemData: NewInventoryItem) => {
    setLoading(true);
    console.log('[DEBUG] Hook createItem recebido:', itemData); // Log dos dados recebidos pelo hook

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('[DEBUG] Usuário não autenticado ao tentar criar item.');
      setLoading(false);
      return null;
    }

    const dataToInsert = { ...itemData, last_updated_by: user.id };
    console.log('[DEBUG] Enviando para o Supabase:', dataToInsert); // Log dos dados a serem inseridos

    const { data, error } = await supabase
      .from('inventory_items')
      .insert([dataToInsert])
      .select();
      
    if (error) {
      handleSupabaseError(error);
      setLoading(false);
      return null;
    } else {
      console.log('[DEBUG] Resposta de sucesso do Supabase:', data); // Log da resposta de sucesso
      const newItem = data ? data[0] : null;
      if (newItem) setItems(prev => [...prev, newItem].sort((a, b) => a.name.localeCompare(b.name)));
      setLoading(false);
      return newItem;
    }
  }, []);

  const updateItem = useCallback(async (id: string, updates: UpdateInventoryItem) => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return null;
    }

    const dataToUpdate = { ...updates, last_updated_by: user.id };

    const { data, error } = await supabase
      .from('inventory_items')
      .update(dataToUpdate)
      .eq('id', id)
      .select();

    if (error) {
      handleSupabaseError(error);
      setLoading(false);
      return null;
    } else {
      const updatedItem = data ? data[0] : null;
      if (updatedItem) {
        setItems(prev => prev.map(item => item.id === id ? updatedItem : item));
      }
      setLoading(false);
      return updatedItem;
    }
  }, []);
  
  const deleteItem = useCallback(async (id: string) => {
    setLoading(true);
    const { error } = await supabase.from('inventory_items').delete().eq('id', id);

    if (error) {
      handleSupabaseError(error);
      setLoading(false);
      return false;
    } else {
      setItems(prev => prev.filter(item => item.id !== id));
      setLoading(false);
      return true;
    }
  }, []);

  return { items, loading, error, fetchItems, createItem, updateItem, deleteItem };
};
