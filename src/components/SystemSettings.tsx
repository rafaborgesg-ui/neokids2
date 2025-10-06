import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Switch } from './ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Alert, AlertDescription } from './ui/alert'
import { Badge } from './ui/badge'
import { 
  Settings, 
  Building, 
  Users, 
  Bell,
  Shield,
  FileText,
  Clock,
  DollarSign,
  Printer,
  Database,
  Wifi,
  Save,
  RotateCcw,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'
import { projectId } from '../utils/supabase/info'

interface SystemConfig {
  id: string
  category: string
  key: string
  value: string | boolean | number
  description: string
  type: 'text' | 'number' | 'boolean' | 'select' | 'textarea'
  options?: string[]
  updatedAt: string
  updatedBy: string
}

interface SystemSettingsProps {
  accessToken: string
  userRole: string
}

export const SystemSettings = ({ accessToken, userRole }: SystemSettingsProps) => {
  const [configs, setConfigs] = useState<SystemConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [activeTab, setActiveTab] = useState('clinic')

  useEffect(() => {
    fetchConfigs()
  }, [])

  const fetchConfigs = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f78aeac5/settings/configs`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        setConfigs(data)
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
      setMessage({ type: 'error', text: 'Erro ao carregar configurações do sistema' })
    } finally {
      setLoading(false)
    }
  }

  const updateConfig = async (configId: string, newValue: string | boolean | number) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f78aeac5/settings/configs/${configId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ value: newValue })
        }
      )

      if (response.ok) {
        setConfigs(configs.map(config => 
          config.id === configId 
            ? { ...config, value: newValue, updatedAt: new Date().toISOString() }
            : config
        ))
        return true
      }
      return false
    } catch (error) {
      console.error('Erro ao atualizar configuração:', error)
      return false
    }
  }

  const saveAllConfigs = async () => {
    setSaving(true)
    try {
      let allSuccess = true
      
      for (const config of configs) {
        const success = await updateConfig(config.id, config.value)
        if (!success) allSuccess = false
      }

      setMessage({
        type: allSuccess ? 'success' : 'error',
        text: allSuccess ? 'Configurações salvas com sucesso!' : 'Erro ao salvar algumas configurações'
      })
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao salvar configurações' })
    } finally {
      setSaving(false)
    }
  }

  const resetToDefaults = async () => {
    if (confirm('Tem certeza que deseja restaurar todas as configurações para os valores padrão?')) {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-f78aeac5/settings/reset`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          }
        )

        if (response.ok) {
          await fetchConfigs()
          setMessage({ type: 'success', text: 'Configurações restauradas para os valores padrão' })
        }
      } catch (error) {
        setMessage({ type: 'error', text: 'Erro ao restaurar configurações padrão' })
      }
    }
  }

  const renderConfigInput = (config: SystemConfig) => {
    const handleChange = (value: string | boolean | number) => {
      setConfigs(configs.map(c => c.id === config.id ? { ...c, value } : c))
    }

    switch (config.type) {
      case 'boolean':
        return (
          <Switch
            checked={config.value as boolean}
            onCheckedChange={handleChange}
          />
        )
      
      case 'select':
        return (
          <Select value={config.value as string} onValueChange={handleChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {config.options?.map(option => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case 'textarea':
        return (
          <Textarea
            value={config.value as string}
            onChange={(e) => handleChange(e.target.value)}
            rows={3}
          />
        )

      case 'number':
        return (
          <Input
            type="number"
            value={config.value as number}
            onChange={(e) => handleChange(Number(e.target.value))}
          />
        )

      default:
        return (
          <Input
            type="text"
            value={config.value as string}
            onChange={(e) => handleChange(e.target.value)}
          />
        )
    }
  }

  const getConfigsByCategory = (category: string) => {
    return configs.filter(config => config.category === category)
  }

  const categories = [
    { id: 'clinic', name: 'Clínica', icon: Building },
    { id: 'users', name: 'Usuários', icon: Users },
    { id: 'notifications', name: 'Notificações', icon: Bell },
    { id: 'security', name: 'Segurança', icon: Shield },
    { id: 'reports', name: 'Relatórios', icon: FileText },
    { id: 'scheduling', name: 'Agendamento', icon: Clock },
    { id: 'billing', name: 'Faturamento', icon: DollarSign },
    { id: 'printing', name: 'Impressão', icon: Printer },
    { id: 'system', name: 'Sistema', icon: Database }
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <h2>Configurações do Sistema</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-32 bg-gray-200 rounded"></div>
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
        <div>
          <h2 className="flex items-center space-x-2">
            <Settings className="w-6 h-6" />
            <span>Configurações do Sistema</span>
          </h2>
          <p className="text-gray-600 mt-1">
            Gerencie as configurações globais da clínica Neokids
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          {userRole === 'administrador' && (
            <>
              <Button
                variant="outline"
                onClick={resetToDefaults}
                className="flex items-center space-x-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Restaurar Padrão</span>
              </Button>
              <Button
                onClick={saveAllConfigs}
                disabled={saving}
                className="flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Salvando...' : 'Salvar Tudo'}</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {message && (
        <Alert className={message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          {message.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-green-600" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-600" />
          )}
          <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 lg:grid-cols-9 h-auto p-1">
          {categories.map(category => {
            const Icon = category.icon
            const configCount = getConfigsByCategory(category.id).length
            return (
              <TabsTrigger 
                key={category.id} 
                value={category.id}
                className="flex flex-col items-center space-y-1 p-3"
              >
                <Icon className="w-4 h-4" />
                <span className="text-xs">{category.name}</span>
                {configCount > 0 && (
                  <Badge variant="secondary" className="text-xs px-1">
                    {configCount}
                  </Badge>
                )}
              </TabsTrigger>
            )
          })}
        </TabsList>

        {categories.map(category => (
          <TabsContent key={category.id} value={category.id} className="space-y-4 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {getConfigsByCategory(category.id).map(config => (
                <Card key={config.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="text-base">{config.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                      <Badge variant="outline" className="text-xs">
                        {config.type}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600">{config.description}</p>
                    
                    <div className="space-y-2">
                      <Label>Valor atual</Label>
                      {userRole === 'administrador' ? (
                        renderConfigInput(config)
                      ) : (
                        <div className="p-2 bg-gray-50 border rounded">
                          {config.type === 'boolean' 
                            ? (config.value ? 'Ativado' : 'Desativado')
                            : String(config.value)
                          }
                        </div>
                      )}
                    </div>

                    {config.updatedAt && (
                      <div className="text-xs text-gray-500 flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>
                          Atualizado em {new Date(config.updatedAt).toLocaleString('pt-BR')}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              
              {getConfigsByCategory(category.id).length === 0 && (
                <div className="col-span-full text-center py-12 text-gray-500">
                  <Settings className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Nenhuma configuração encontrada para esta categoria</p>
                </div>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Wifi className="w-5 h-5" />
            <span>Status do Sistema</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-green-900">Banco de Dados</p>
                <p className="text-sm text-green-700">Conectado</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-green-900">Servidor de Aplicação</p>
                <p className="text-sm text-green-700">Online</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-green-900">Sistema de Backup</p>
                <p className="text-sm text-green-700">Ativo</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}