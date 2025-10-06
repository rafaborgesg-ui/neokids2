import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Alert, AlertDescription } from './ui/alert'
import { ScrollArea } from './ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { 
  Bell, 
  BellRing,
  AlertCircle,
  Info,
  CheckCircle,
  AlertTriangle,
  Clock,
  User,
  FileText,
  Activity,
  Settings,
  Trash2,
  CheckCheck,
  Filter,
  Calendar
} from 'lucide-react'
import { projectId } from '../utils/supabase/info'

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'error' | 'success'
  category: 'system' | 'appointment' | 'result' | 'patient' | 'laboratory'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  read: boolean
  createdAt: string
  relatedId?: string
  relatedType?: string
  actionUrl?: string
}

interface NotificationSystemProps {
  accessToken: string
  userRole: string
  onNavigate?: (module: string) => void
}

export const NotificationSystem = ({ accessToken, userRole, onNavigate }: NotificationSystemProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')

  useEffect(() => {
    fetchNotifications()
    // Simular atualizações em tempo real
    const interval = setInterval(fetchNotifications, 30000) // A cada 30 segundos
    return () => clearInterval(interval)
  }, [])

  const fetchNotifications = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f78aeac5/notifications`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        setNotifications(data)
      }
    } catch (error) {
      console.error('Erro ao carregar notificações:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f78aeac5/notifications/${notificationId}/read`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )

      if (response.ok) {
        setNotifications(notifications.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        ))
      }
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f78aeac5/notifications/mark-all-read`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )

      if (response.ok) {
        setNotifications(notifications.map(n => ({ ...n, read: true })))
      }
    } catch (error) {
      console.error('Erro ao marcar todas as notificações como lidas:', error)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f78aeac5/notifications/${notificationId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )

      if (response.ok) {
        setNotifications(notifications.filter(n => n.id !== notificationId))
      }
    } catch (error) {
      console.error('Erro ao excluir notificação:', error)
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id)
    }

    if (notification.actionUrl && onNavigate) {
      onNavigate(notification.actionUrl)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      default:
        return <Info className="w-5 h-5 text-blue-600" />
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'system':
        return <Settings className="w-4 h-4" />
      case 'appointment':
        return <Calendar className="w-4 h-4" />
      case 'result':
        return <FileText className="w-4 h-4" />
      case 'patient':
        return <User className="w-4 h-4" />
      case 'laboratory':
        return <Activity className="w-4 h-4" />
      default:
        return <Bell className="w-4 h-4" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getFilteredNotifications = () => {
    let filtered = notifications

    // Filtrar por categoria
    if (activeTab !== 'all') {
      filtered = filtered.filter(n => n.category === activeTab)
    }

    // Filtrar por status de leitura
    if (filter === 'unread') {
      filtered = filtered.filter(n => !n.read)
    } else if (filter === 'read') {
      filtered = filtered.filter(n => n.read)
    }

    return filtered.sort((a, b) => {
      // Priorizar não lidas
      if (a.read !== b.read) {
        return a.read ? 1 : -1
      }
      // Depois por prioridade
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
      const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder]
      const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder]
      if (aPriority !== bPriority) {
        return aPriority - bPriority
      }
      // Por último, por data
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }

  const unreadCount = notifications.filter(n => !n.read).length

  const categories = [
    { id: 'all', name: 'Todas', icon: Bell },
    { id: 'system', name: 'Sistema', icon: Settings },
    { id: 'appointment', name: 'Atendimentos', icon: Calendar },
    { id: 'result', name: 'Resultados', icon: FileText },
    { id: 'patient', name: 'Pacientes', icon: User },
    { id: 'laboratory', name: 'Laboratório', icon: Activity }
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <h2>Sistema de Notificações</h2>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-16 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <BellRing className="w-6 h-6" />
          <h2>Sistema de Notificações</h2>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="px-2 py-1">
              {unreadCount} não lidas
            </Badge>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFilter(filter === 'all' ? 'unread' : filter === 'unread' ? 'read' : 'all')}
            className="flex items-center space-x-1"
          >
            <Filter className="w-4 h-4" />
            <span>{filter === 'all' ? 'Todas' : filter === 'unread' ? 'Não lidas' : 'Lidas'}</span>
          </Button>
          
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
              className="flex items-center space-x-1"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Marcar todas como lidas</span>
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-6 h-auto p-1">
          {categories.map(category => {
            const Icon = category.icon
            const categoryCount = notifications.filter(n => 
              category.id === 'all' || n.category === category.id
            ).length
            const unreadCategoryCount = notifications.filter(n => 
              (category.id === 'all' || n.category === category.id) && !n.read
            ).length
            
            return (
              <TabsTrigger 
                key={category.id} 
                value={category.id}
                className="flex flex-col items-center space-y-1 p-3 relative"
              >
                <Icon className="w-4 h-4" />
                <span className="text-xs">{category.name}</span>
                {categoryCount > 0 && (
                  <Badge variant="secondary" className="text-xs px-1">
                    {categoryCount}
                  </Badge>
                )}
                {unreadCategoryCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
                )}
              </TabsTrigger>
            )
          })}
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <ScrollArea className="h-[600px]">
            <div className="space-y-3">
              {getFilteredNotifications().map(notification => (
                <Card 
                  key={notification.id} 
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    !notification.read ? 'border-l-4 border-l-blue-500 bg-blue-50' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            {getCategoryIcon(notification.category)}
                            <h4 className={`${!notification.read ? 'font-semibold' : ''}`}>
                              {notification.title}
                            </h4>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Badge className={`text-xs ${getPriorityColor(notification.priority)}`}>
                              {notification.priority.toUpperCase()}
                            </Badge>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteNotification(notification.id)
                              }}
                              className="p-1 h-auto text-gray-400 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>
                              {new Date(notification.createdAt).toLocaleString('pt-BR')}
                            </span>
                          </div>
                          
                          {!notification.read && (
                            <Badge variant="outline" className="text-xs">
                              Nova
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {getFilteredNotifications().length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Nenhuma notificação encontrada</p>
                  <p className="text-sm">
                    {filter === 'unread' ? 'Todas as notificações foram lidas' : 
                     filter === 'read' ? 'Nenhuma notificação lida encontrada' :
                     'Não há notificações para exibir'}
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}