import { useState, useCallback } from 'react';
import { supabase } from '../utils/supabase/client';
import { PostgrestError } from '@supabase/supabase-js';

export interface InventoryItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  low_stock_threshold: number;
  unit?: string;
  created_at: string;
  updated_at?: string;
}

export type NewInventoryItem = Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>;

export const useInventory = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  const handleSupabaseError = (error: PostgrestError) => {
    console.error('Supabase error:', error);
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
    const { data, error } = await supabase
      .from('inventory_items')
      .insert([itemData])
      .select();
      
    if (error) {
      handleSupabaseError(error);
      setLoading(false);
      return null;
    } else {
      const newItem = data ? data[0] : null;
      if (newItem) setItems(prev => [...prev, newItem].sort((a, b) => a.name.localeCompare(b.name)));
      setLoading(false);
      return newItem;
    }
  }, []);

  const updateItem = useCallback(async (id: string, updates: Partial<InventoryItem>) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('inventory_items')
      .update(updates)
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
