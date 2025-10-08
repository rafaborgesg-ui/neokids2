// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

console.log("Hello from Functions!")

serve(async (req) => {
  // Lida com a requisição pre-flight do CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, payload } = await req.json()

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verificação de segurança robusta
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Acesso negado: cabeçalho de autorização ausente.')
    }

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user } } = await userClient.auth.getUser()

    if (!user || user.user_metadata?.role !== 'administrador') {
      throw new Error('Acesso negado: somente administradores podem gerenciar usuários.')
    }

    let data: any = null;
    let error: any = null;
    let auditLogPayload: any = null;

    switch (action) {
      case 'list-users':
        ({ data, error } = await adminClient.auth.admin.listUsers());
        break;
      
      case 'update-user-role':
        if (!payload.userId || !payload.role) throw new Error('ID do usuário e nova função são obrigatórios.');
        
        // Busca o estado antigo do usuário para o log
        const { data: userBeforeUpdate, error: fetchError } = await adminClient.auth.admin.getUserById(payload.userId);
        if (fetchError) throw fetchError;

        ({ data, error } = await adminClient.auth.admin.updateUserById(
          payload.userId,
          { user_metadata: { role: payload.role } }
        ));

        if (!error) {
          auditLogPayload = {
            action: 'UPDATE',
            table_name: 'auth.users',
            record_id: payload.userId,
            old_record_data: { user_metadata: userBeforeUpdate.user.user_metadata },
            new_record_data: { user_metadata: data.user.user_metadata }
          };
        }
        break;

      case 'delete-user':
        if (!payload.userId) throw new Error('ID do usuário é obrigatório.');

        // Busca o estado antigo do usuário para o log
        const { data: userBeforeDelete, error: fetchErrorDelete } = await adminClient.auth.admin.getUserById(payload.userId);
        if (fetchErrorDelete) throw fetchErrorDelete;

        ({ data, error } = await adminClient.auth.admin.deleteUser(payload.userId));

        if (!error) {
          auditLogPayload = {
            action: 'DELETE',
            table_name: 'auth.users',
            record_id: payload.userId,
            old_record_data: { user_metadata: userBeforeDelete.user.user_metadata }
          };
        }
        break;

      case 'invite-user':
        if (!payload.email || !payload.role) throw new Error('Email e função são obrigatórios para o convite.');
        ({ data, error } = await adminClient.auth.admin.inviteUserByEmail(
          payload.email,
          { data: { role: payload.role, name: 'Novo Usuário' } } // Pré-define o nome e a função
        ));
        break;

      case 'create-user':
        if (!payload.email || !payload.password || !payload.role || !payload.name) {
          throw new Error('Email, senha, nome e função são obrigatórios.');
        }
        ({ data, error } = await adminClient.auth.admin.createUser({
          email: payload.email,
          password: payload.password,
          user_metadata: { role: payload.role, name: payload.name },
          email_confirm: true, // Auto-confirma o email, já que o admin está criando
        }));

        if (!error) {
          auditLogPayload = {
            action: 'INSERT',
            table_name: 'auth.users',
            record_id: data.user.id,
            new_record_data: { email: data.user.email, user_metadata: data.user.user_metadata }
          };
        }
        break;

      default:
        throw new Error('Ação desconhecida.');
    }

    if (error) throw error

    // Se uma ação de auditoria foi gerada, insere o log
    if (auditLogPayload) {
      await adminClient.from('audit_logs').insert({
        ...auditLogPayload,
        user_id: user.id,
        user_email: user.email
      });
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/user-management' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
