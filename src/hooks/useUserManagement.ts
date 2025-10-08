import { useState, useCallback } from 'react';
import { supabase } from '../utils/supabase/client';
import { User } from '@supabase/supabase-js';

export type AppUser = User & {
  user_metadata: {
    role: string;
    name?: string;
  }
};

export const useUserManagement = () => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleError = (error: any) => {
    const errorMessage = error.message || 'Ocorreu um erro desconhecido.';
    console.error('User management error:', errorMessage);
    setError(errorMessage);
  };

  const listUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke('user-management', {
        body: { action: 'list-users' },
      });
      if (error) throw error;
      setUsers(data.users || []);
    } catch (e) {
      handleError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateUserRole = useCallback(async (userId: string, role: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke('user-management', {
        body: { action: 'update-user-role', payload: { userId, role } },
      });
      if (error) throw error;
      // Atualiza o usuário na lista local
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, user_metadata: { ...u.user_metadata, role } } : u));
    } catch (e) {
      handleError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteUser = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.functions.invoke('user-management', {
        body: { action: 'delete-user', payload: { userId } },
      });
      if (error) throw error;
      // Remove o usuário da lista local
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (e) {
      handleError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const inviteUser = useCallback(async (email: string, role: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke('user-management', {
        body: { action: 'invite-user', payload: { email, role } },
      });
      if (error) throw error;
      // Após o convite, recarrega a lista para mostrar o novo usuário (que aparecerá como "Aguardando...")
      await listUsers();
      return data;
    } catch (e) {
      handleError(e);
      return null;
    } finally {
      setLoading(false);
    }
  }, [listUsers]);

  const createUser = useCallback(async (userData: any) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke('user-management', {
        body: { action: 'create-user', payload: userData },
      });
      if (error) throw error;
      // Recarrega a lista para mostrar o novo usuário
      await listUsers();
      return data;
    } catch (e) {
      handleError(e);
      return null;
    } finally {
      setLoading(false);
    }
  }, [listUsers]);

  return { users, loading, error, listUsers, updateUserRole, deleteUser, inviteUser, createUser };
};
