import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Cria e exporta uma única instância do cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
