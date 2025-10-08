import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { LoadingSpinner, LoadingCard } from './ui/loading-spinner'
import { useToast } from './ui/simple-toast'
import { useLoadingStates } from '../hooks/useLoadingStates'
import { 
  Users, 
  Calendar, 
  DollarSign, 
  Activity,
  TrendingUp,
  Clock,
  FileText,
  BarChart3,
  Printer,
  Bell,
  Package,
  Settings
} from 'lucide-react'
import { supabase } from '../utils/supabase/client';

interface DashboardStats {
  totalAppointments: number
  todayAppointments: number
  totalRevenue: number
  todayRevenue: number
  statusCounts: Record<string, number>
}

interface DashboardProps {
  userRole: string
  onNavigate?: (module: string) => void
}

export const Dashboard = ({ userRole, onNavigate }: DashboardProps) => {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const { isLoading, withLoading } = useLoadingStates()
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const { addToast } = useToast()

  useEffect(() => {
    const loadStats = async () => {
      try {
        await withLoading('fetchStats', async () => {
          // Chamada corrigida para a Edge Function com o nome correto e corpo da requisição
          const { data, error } = await supabase.functions.invoke('api', {
            body: {
              path: 'dashboard-stats' // Passando o caminho esperado pela sua função
            }
          });

          if (error) {
            throw error;
          }

          setStats(data);
          setLastUpdate(new Date());
        });
      } catch (error: any) {
        console.error('Erro detalhado ao carregar estatísticas:', error);
        addToast({
          type: 'error',
          title: 'Erro ao Carregar Dashboard',
          description: error.message || 'Não foi possível buscar os dados do dashboard.',
        });
      }
    };

    loadStats()

    // Auto-refresh every 30 seconds
    const interval = setInterval(loadStats, 30000)
    return () => clearInterval(interval)
  }, [addToast, withLoading])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  // Função para traduzir os status para termos amigáveis
  const translateStatus = (status: string) => {
    const translations: Record<string, string> = {
      'awaiting_collection': 'Aguardando Coleta',
      'in_analysis': 'Em Análise',
      'awaiting_report': 'Aguardando Laudo',
      'completed': 'Finalizado',
      'scheduled': 'Agendado',
      'canceled': 'Cancelado',
      'no-show': 'Não Compareceu'
    };
    return translations[status] || status;
  };

  const handleQuickAction = (action: string) => {
    if (!onNavigate) return

    switch (action) {
      case 'novo-paciente':
        onNavigate('patients')
        break
      case 'novo-atendimento':
        onNavigate('appointments')
        break
      case 'ver-laboratorio':
        onNavigate('laboratory')
        break
      case 'ver-resultados':
        onNavigate('exam-results')
        break
      case 'ver-relatorios':
        onNavigate('reports')
        break
      case 'imprimir-etiquetas':
        onNavigate('print')
        break
      case 'ver-notificacoes':
        onNavigate('notifications')
        break
      case 'gerenciar-estoque':
        onNavigate('inventory')
        break
      case 'configuracoes':
        onNavigate('settings')
        break
      default:
        break
    }
  }

  // Check user permissions for quick actions
  const canAccessPatients = userRole === 'administrador' || userRole === 'atendente'
  const canAccessAppointments = userRole === 'administrador' || userRole === 'atendente'
  const canAccessLaboratory = true // All roles can access laboratory
  const canAccessResults = true // All roles can access exam results
  const canAccessReports = userRole === 'administrador' || userRole === 'atendente'
  const canAccessPrint = true // All roles can access print system
  const canAccessNotifications = true // All roles can access notifications
  const canAccessInventory = userRole === 'administrador' || userRole === 'tecnico'
  const canAccessSettings = userRole === 'administrador'

  const statCards = [
    {
      title: 'Atendimentos Hoje',
      value: stats?.todayAppointments || 0,
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Total de Atendimentos',
      value: stats?.totalAppointments || 0,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Receita Hoje',
      value: formatCurrency(stats?.todayRevenue || 0),
      icon: DollarSign,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    {
      title: 'Receita Total',
      value: formatCurrency(stats?.totalRevenue || 0),
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ]

  const statusColors: Record<string, string> = {
    'Aguardando Coleta': 'bg-yellow-100 text-yellow-800',
    'Em Análise': 'bg-blue-100 text-blue-800',
    'Aguardando Laudo': 'bg-orange-100 text-orange-800',
    'Finalizado': 'bg-green-100 text-green-800'
  }

  if (isLoading('fetchStats') && !stats) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <LoadingCard key={index} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <h2 className="text-xl md:text-2xl font-semibold text-gray-900">Dashboard Gerencial</h2>
        <div className="flex items-center space-x-2 text-xs md:text-sm text-gray-500">
          <Clock className={`w-4 h-4 ${isLoading('fetchStats') ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">
            Atualizado às {lastUpdate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <span className="sm:hidden">
            {lastUpdate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs md:text-sm font-medium text-gray-600 truncate">{card.title}</p>
                    <p className="text-lg md:text-2xl font-bold text-gray-900 mt-1 md:mt-2">
                      {card.value}
                    </p>
                  </div>
                  <div className={`p-2 md:p-3 rounded-full ${card.bgColor} flex-shrink-0 ml-2`}>
                    <Icon className={`w-5 h-5 md:w-6 md:h-6 ${card.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card>
          <CardHeader className="pb-3 md:pb-6">
            <CardTitle className="flex items-center space-x-2 text-base md:text-lg">
              <Activity className="w-4 h-4 md:w-5 md:h-5" />
              <span>Status dos Atendimentos</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3 md:space-y-4">
              {stats?.statusCounts && Object.entries(stats.statusCounts).map(([status, count]) => {
                const translatedStatus = translateStatus(status);
                return (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 md:space-x-3 min-w-0 flex-1">
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[translatedStatus] || 'bg-gray-100 text-gray-800'} truncate`}>
                        {translatedStatus}
                      </div>
                    </div>
                    <span className="font-semibold text-sm md:text-base">{count}</span>
                  </div>
                );
              })}
              {(!stats?.statusCounts || Object.keys(stats.statusCounts).length === 0) && (
                <p className="text-gray-500 text-center py-6 md:py-8 text-sm md:text-base">
                  Nenhum atendimento encontrado
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3 md:pb-6">
            <CardTitle className="text-base md:text-lg">Resumo Financeiro</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3 md:space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm md:text-base">Receita Média por Atendimento</span>
                <span className="font-semibold text-sm md:text-base">
                  {stats?.totalAppointments ? 
                    formatCurrency((stats.totalRevenue || 0) / stats.totalAppointments) : 
                    formatCurrency(0)
                  }
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm md:text-base">Meta Mensal</span>
                <span className="font-semibold text-green-600 text-sm md:text-base">R$ 50.000,00</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm md:text-base">Progresso da Meta</span>
                <span className="font-semibold text-sm md:text-base">
                  {((stats?.totalRevenue || 0) / 50000 * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${Math.min(((stats?.totalRevenue || 0) / 50000) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3 md:pb-6">
          <CardTitle className="text-base md:text-lg">Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-3 md:gap-4">
            {canAccessPatients && (
              <button 
                onClick={() => handleQuickAction('novo-paciente')}
                className="p-3 md:p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 active:bg-blue-100 transition-all duration-200 text-left min-h-[60px] md:min-h-[80px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 group"
                title="Ir para módulo de pacientes para cadastrar novo paciente"
              >
                <div className="flex items-center space-x-3">
                  <Users className="w-5 h-5 md:w-6 md:h-6 text-blue-600 group-hover:text-blue-700 flex-shrink-0 transition-colors" />
                  <div className="min-w-0">
                    <p className="font-medium text-sm md:text-base group-hover:text-blue-700 transition-colors">Novo Paciente</p>
                    <p className="text-xs md:text-sm text-gray-600">Cadastrar novo paciente</p>
                  </div>
                </div>
              </button>
            )}
            
            {canAccessAppointments && (
              <button 
                onClick={() => handleQuickAction('novo-atendimento')}
                className="p-3 md:p-4 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-300 active:bg-green-100 transition-all duration-200 text-left min-h-[60px] md:min-h-[80px] focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 group"
                title="Ir para módulo de atendimentos para iniciar novo atendimento"
              >
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 md:w-6 md:h-6 text-green-600 group-hover:text-green-700 flex-shrink-0 transition-colors" />
                  <div className="min-w-0">
                    <p className="font-medium text-sm md:text-base group-hover:text-green-700 transition-colors">Novo Atendimento</p>
                    <p className="text-xs md:text-sm text-gray-600">Iniciar novo atendimento</p>
                  </div>
                </div>
              </button>
            )}
            
            {canAccessLaboratory && (
              <button 
                onClick={() => handleQuickAction('ver-laboratorio')}
                className="p-3 md:p-4 border border-gray-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 active:bg-purple-100 transition-all duration-200 text-left min-h-[60px] md:min-h-[80px] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 group"
                title="Ir para módulo de laboratório para acompanhar amostras"
              >
                <div className="flex items-center space-x-3">
                  <Activity className="w-5 h-5 md:w-6 md:h-6 text-purple-600 group-hover:text-purple-700 flex-shrink-0 transition-colors" />
                  <div className="min-w-0">
                    <p className="font-medium text-sm md:text-base group-hover:text-purple-700 transition-colors">Ver Laboratório</p>
                    <p className="text-xs md:text-sm text-gray-600">Acompanhar amostras</p>
                  </div>
                </div>
              </button>
            )}

            {canAccessResults && (
              <button 
                onClick={() => handleQuickAction('ver-resultados')}
                className="p-3 md:p-4 border border-gray-200 rounded-lg hover:bg-orange-50 hover:border-orange-300 active:bg-orange-100 transition-all duration-200 text-left min-h-[60px] md:min-h-[80px] focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 group"
                title="Ir para módulo de resultados de exames"
              >
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 md:w-6 md:h-6 text-orange-600 group-hover:text-orange-700 flex-shrink-0 transition-colors" />
                  <div className="min-w-0">
                    <p className="font-medium text-sm md:text-base group-hover:text-orange-700 transition-colors">Ver Resultados</p>
                    <p className="text-xs md:text-sm text-gray-600">Resultados de exames</p>
                  </div>
                </div>
              </button>
            )}

            {canAccessReports && (
              <button 
                onClick={() => handleQuickAction('ver-relatorios')}
                className="p-3 md:p-4 border border-gray-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 active:bg-indigo-100 transition-all duration-200 text-left min-h-[60px] md:min-h-[80px] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 group"
                title="Ir para módulo de relatórios gerenciais"
              >
                <div className="flex items-center space-x-3">
                  <BarChart3 className="w-5 h-5 md:w-6 md:h-6 text-indigo-600 group-hover:text-indigo-700 flex-shrink-0 transition-colors" />
                  <div className="min-w-0">
                    <p className="font-medium text-sm md:text-base group-hover:text-indigo-700 transition-colors">Ver Relatórios</p>
                    <p className="text-xs md:text-sm text-gray-600">Relatórios gerenciais</p>
                  </div>
                </div>
              </button>
            )}

            {canAccessPrint && (
              <button 
                onClick={() => handleQuickAction('imprimir-etiquetas')}
                className="p-3 md:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 active:bg-gray-100 transition-all duration-200 text-left min-h-[60px] md:min-h-[80px] focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 group"
                title="Ir para sistema de impressão"
              >
                <div className="flex items-center space-x-3">
                  <Printer className="w-5 h-5 md:w-6 md:h-6 text-gray-600 group-hover:text-gray-700 flex-shrink-0 transition-colors" />
                  <div className="min-w-0">
                    <p className="font-medium text-sm md:text-base group-hover:text-gray-700 transition-colors">Sistema Impressão</p>
                    <p className="text-xs md:text-sm text-gray-600">Etiquetas e comprovantes</p>
                  </div>
                </div>
              </button>
            )}

            {canAccessNotifications && (
              <button 
                onClick={() => handleQuickAction('ver-notificacoes')}
                className="p-3 md:p-4 border border-gray-200 rounded-lg hover:bg-red-50 hover:border-red-300 active:bg-red-100 transition-all duration-200 text-left min-h-[60px] md:min-h-[80px] focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 group"
                title="Ver notificações do sistema"
              >
                <div className="flex items-center space-x-3">
                  <Bell className="w-5 h-5 md:w-6 md:h-6 text-red-600 group-hover:text-red-700 flex-shrink-0 transition-colors" />
                  <div className="min-w-0">
                    <p className="font-medium text-sm md:text-base group-hover:text-red-700 transition-colors">Ver Notificações</p>
                    <p className="text-xs md:text-sm text-gray-600">Alertas e avisos</p>
                  </div>
                </div>
              </button>
            )}

            {canAccessInventory && (
              <button 
                onClick={() => handleQuickAction('gerenciar-estoque')}
                className="p-3 md:p-4 border border-gray-200 rounded-lg hover:bg-emerald-50 hover:border-emerald-300 active:bg-emerald-100 transition-all duration-200 text-left min-h-[60px] md:min-h-[80px] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 group"
                title="Gerenciar estoque de materiais"
              >
                <div className="flex items-center space-x-3">
                  <Package className="w-5 h-5 md:w-6 md:h-6 text-emerald-600 group-hover:text-emerald-700 flex-shrink-0 transition-colors" />
                  <div className="min-w-0">
                    <p className="font-medium text-sm md:text-base group-hover:text-emerald-700 transition-colors">Gerenciar Estoque</p>
                    <p className="text-xs md:text-sm text-gray-600">Materiais e insumos</p>
                  </div>
                </div>
              </button>
            )}

            {canAccessSettings && (
              <button 
                onClick={() => handleQuickAction('configuracoes')}
                className="p-3 md:p-4 border border-gray-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 active:bg-slate-100 transition-all duration-200 text-left min-h-[60px] md:min-h-[80px] focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 group"
                title="Ir para configurações do sistema"
              >
                <div className="flex items-center space-x-3">
                  <Settings className="w-5 h-5 md:w-6 md:h-6 text-slate-600 group-hover:text-slate-700 flex-shrink-0 transition-colors" />
                  <div className="min-w-0">
                    <p className="font-medium text-sm md:text-base group-hover:text-slate-700 transition-colors">Configurações</p>
                    <p className="text-xs md:text-sm text-gray-600">Parâmetros do sistema</p>
                  </div>
                </div>
              </button>
            )}
          </div>
          
          {/* Show message when no quick actions are available */}
          {!canAccessPatients && !canAccessAppointments && !canAccessLaboratory && !canAccessResults && !canAccessReports && !canAccessPrint && !canAccessNotifications && !canAccessInventory && !canAccessSettings && (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm">Nenhuma ação rápida disponível para seu perfil.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}