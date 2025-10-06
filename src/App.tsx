import React, { useState, useEffect } from 'react'
import { supabase } from './utils/supabase/client' // Importar o cliente centralizado
import { LoginForm } from './components/LoginForm'
import { Dashboard } from './components/Dashboard'
import { PatientManagement } from './components/PatientManagement'
import { ServiceManagement } from './components/ServiceManagement'
import { AppointmentFlow } from './components/AppointmentFlow'
import { KanbanBoard } from './components/KanbanBoard'
import { DemoInitializer } from './components/DemoInitializer'
import { NavigationMenu } from './components/NavigationMenu'
import { ExamResults } from './components/ExamResults'
import { Reports } from './components/Reports'
import { AuditLog } from './components/AuditLog'
import { PrintSystem } from './components/PrintSystem'
import { SystemSettings } from './components/SystemSettings'
import { NotificationSystem } from './components/NotificationSystem'
import { InventoryManagement } from './components/InventoryManagement'
import { NeokidsLogo } from './components/NeokidsLogo'
import { NeokidsHead } from './components/NeokidsMetaTags'
import { Button } from './components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from './components/ui/sheet'
import { ToastProvider } from './components/ui/simple-toast'
import { useIsMobile } from './hooks/useIsMobile'
import { 
  User, 
  Users, 
  Calendar, 
  Activity, 
  Settings, 
  LogOut,
  FileText,
  BarChart3,
  Menu,
  Shield,
  ClipboardList,
  Printer,
  Bell,
  Package
} from 'lucide-react'

type UserSession = {
  access_token: string
  user: {
    id: string
    email: string
    user_metadata: {
      name?: string
      role?: string
    }
  }
}

const App = () => {
  const [session, setSession] = useState<UserSession | null>(null)
  const [activeModule, setActiveModule] = useState('dashboard')
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const isMobile = useIsMobile()

  useEffect(() => {
    // Check for existing session
    checkSession()
  }, [])

  const checkSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (session) {
        setSession(session as UserSession)
      }
    } catch (error) {
      console.error('Erro ao verificar sessão:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (email: string, password: string) => {
    try {
      const { data: { session }, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) {
        if (error.message === 'Invalid login credentials') {
          throw new Error('Credenciais inválidas. Verifique se os dados de demonstração foram inicializados.')
        }
        throw new Error(error.message)
      }
      
      if (session) {
        setSession(session as UserSession)
      }
    } catch (error) {
      throw error
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setActiveModule('dashboard')
  }

  const modules = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      icon: BarChart3,
      component: Dashboard,
      roles: ['administrador', 'atendente', 'tecnico']
    },
    {
      id: 'patients',
      name: 'Pacientes',
      icon: Users,
      component: PatientManagement,
      roles: ['administrador', 'atendente']
    },
    {
      id: 'services',
      name: 'Serviços',
      icon: Settings,
      component: ServiceManagement,
      roles: ['administrador']
    },
    {
      id: 'appointments',
      name: 'Atendimentos',
      icon: Calendar,
      component: AppointmentFlow,
      roles: ['administrador', 'atendente']
    },
    {
      id: 'laboratory',
      name: 'Laboratório',
      icon: Activity,
      component: KanbanBoard,
      roles: ['administrador', 'tecnico', 'atendente']
    },
    {
      id: 'exam-results',
      name: 'Resultados',
      icon: FileText,
      component: ExamResults,
      roles: ['administrador', 'tecnico', 'atendente']
    },
    {
      id: 'reports',
      name: 'Relatórios',
      icon: ClipboardList,
      component: Reports,
      roles: ['administrador', 'atendente']
    },
    {
      id: 'print',
      name: 'Impressão',
      icon: Printer,
      component: PrintSystem,
      roles: ['administrador', 'atendente', 'tecnico']
    },
    {
      id: 'audit',
      name: 'Auditoria',
      icon: Shield,
      component: AuditLog,
      roles: ['administrador']
    },
    {
      id: 'notifications',
      name: 'Notificações',
      icon: Bell,
      component: NotificationSystem,
      roles: ['administrador', 'atendente', 'tecnico']
    },
    {
      id: 'inventory',
      name: 'Estoque',
      icon: Package,
      component: InventoryManagement,
      roles: ['administrador', 'tecnico']
    },
    {
      id: 'settings',
      name: 'Configurações',
      icon: Settings,
      component: SystemSettings,
      roles: ['administrador']
    }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-6">
            <NeokidsLogo size="xl" variant="full" />
          </div>
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando sistema...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <>
        <DemoInitializer />
        <LoginForm onLogin={handleLogin} />
      </>
    )
  }

  const currentUserRole = session.user.user_metadata?.role || 'atendente'
  const availableModules = modules.filter(module => 
    module.roles.includes(currentUserRole)
  )

  const ActiveComponent = modules.find(m => m.id === activeModule)?.component || Dashboard

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-50">
        <NeokidsHead />
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              {/* Mobile menu button */}
              {isMobile && (
                <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                  <SheetTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-500 hover:text-gray-700 md:hidden"
                      aria-label="Abrir menu de navegação"
                    >
                      <Menu className="w-5 h-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="p-0 w-72">
                    <NavigationMenu
                      modules={availableModules}
                      activeModule={activeModule}
                      onModuleChange={setActiveModule}
                      onClose={() => setSidebarOpen(false)}
                    />
                  </SheetContent>
                </Sheet>
              )}
              
              {/* Logo - hidden on mobile when menu is available */}
              {!isMobile && (
                <NeokidsLogo 
                  size="lg" 
                  variant="full" 
                  showText={true}
                  className="transition-all duration-200 hover:scale-105"
                />
              )}
              
              {/* Mobile logo */}
              {isMobile && (
                <NeokidsLogo 
                  size="md" 
                  variant="full" 
                  showText={true}
                  className="transition-all duration-200"
                />
              )}
            </div>
            
            <div className="flex items-center space-x-2 md:space-x-4">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700 hidden sm:inline">
                  {session.user.user_metadata?.name || session.user.email}
                </span>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  {currentUserRole}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-gray-500 hover:text-gray-700"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        {!isMobile && (
          <aside className="w-64 bg-white shadow-sm min-h-[calc(100vh-4rem)] sticky top-16">
            <NavigationMenu
              modules={availableModules}
              activeModule={activeModule}
              onModuleChange={setActiveModule}
            />
          </aside>
        )}

        {/* Main Content */}
        <main className={`flex-1 p-4 md:p-6 ${isMobile ? 'w-full' : ''}`}>
          <div className="max-w-full">
            <ActiveComponent 
              userRole={currentUserRole}
              onNavigate={setActiveModule}
            />
          </div>
        </main>
      </div>
    </div>
    </ToastProvider>
  )
}

export default App