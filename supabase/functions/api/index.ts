import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient, SupabaseClient } from 'npm:@supabase/supabase-js'
import { corsHeaders } from '../_shared/cors.ts'

// Define interfaces para os dados do Supabase para maior segurança de tipo
interface AppointmentService {
  services: {
    base_price: number
  }
}

interface AppointmentWithServices {
  appointment_services: AppointmentService[]
}

interface AppointmentStatus {
  status: string
}

// Lógica de negócio para o dashboard
async function getDashboardStats(supabaseAdmin: SupabaseClient) {
  const today = new Date().toISOString().split('T')[0];

  // 1. Contar atendimentos de hoje
  const { count: todayAppointments, error: todayError } = await supabaseAdmin
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', `${today}T00:00:00Z`)
    .lte('created_at', `${today}T23:59:59Z`);
  if (todayError) throw todayError;

  // 2. Contar total de atendimentos
  const { count: totalAppointments, error: totalError } = await supabaseAdmin
    .from('appointments')
    .select('*', { count: 'exact', head: true });
  if (totalError) throw totalError;

  // 3. Calcular receita
  const { data: appointmentsData, error: revenueError } = await supabaseAdmin
    .from('appointments')
    .select('appointment_services(services(base_price))');
  if (revenueError) throw revenueError;
  
  const totalRevenue = (appointmentsData as AppointmentWithServices[]).reduce(
    (sum, app) =>
      sum + (app.appointment_services?.reduce(
        (serviceSum, as) => serviceSum + as.services.base_price, 0
      ) || 0), 0
  );

  // 4. Contar status dos atendimentos
  const { data: statusData, error: statusError } = await supabaseAdmin
    .from('appointments')
    .select('status');
  if (statusError) throw statusError;

  const statusCounts = (statusData as AppointmentStatus[]).reduce((counts: Record<string, number>, apt) => {
    counts[apt.status] = (counts[apt.status] || 0) + 1;
    return counts;
  }, {});

  const responseData = {
    totalAppointments: totalAppointments ?? 0,
    todayAppointments: todayAppointments ?? 0,
    totalRevenue,
    todayRevenue: 0, // Lógica simplificada
    statusCounts,
  };

  return responseData;
}


// Handler principal da função
serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // O 'invoke' pode não enviar um corpo JSON, então verificamos o URL para um fallback
    const url = new URL(req.url);
    let path;
    try {
      const body = await req.json();
      path = body.path;
    } catch {
      // Se não houver corpo, use o final do caminho da URL como rota
      path = url.pathname.split('/').pop();
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let responseData;

    // Roteamento
    switch (path) {
      case 'dashboard-stats':
        responseData = await getDashboardStats(supabaseAdmin);
        break;
      
      // Adicione outros 'cases' para novas rotas no futuro
      // case 'outra-rota':
      //   responseData = await getOutraCoisa(supabaseAdmin);
      //   break;

      default:
        return new Response(JSON.stringify({ error: 'Path not found' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        });
    }

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Erro na Edge Function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})