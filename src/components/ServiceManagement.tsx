import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Badge } from './ui/badge'
import { Alert, AlertDescription } from './ui/alert'
import { 
  Plus, 
  Settings, 
  DollarSign, 
  Clock, 
  FileText,
  Edit,
  Trash2
} from 'lucide-react'
import { projectId, publicAnonKey } from '../utils/supabase/info'

interface Service {
  id: string
  name: string
  category: string
  code: string
  basePrice: number
  operationalCost: number
  estimatedTime: string
  instructions: string
  createdAt: string
}

interface ServiceManagementProps {
  accessToken: string
  userRole: string
  onNavigate?: (module: string) => void
}

export const ServiceManagement = ({ accessToken, userRole, onNavigate }: ServiceManagementProps) => {
  const [services, setServices] = useState<Service[]>([])
  const [isNewServiceOpen, setIsNewServiceOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [newService, setNewService] = useState({
    name: '',
    category: '',
    code: '',
    basePrice: '',
    operationalCost: '',
    estimatedTime: '',
    instructions: ''
  })

  const categories = [
    'Análises Clínicas',
    'Exames de Imagem',
    'Vacinas',
    'Consultas',
    'Procedimentos'
  ]

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f78aeac5/services`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        setServices(data.services || [])
      }
    } catch (error) {
      console.error('Erro ao carregar serviços:', error)
      setError('Erro ao carregar serviços')
    } finally {
      setLoading(false)
    }
  }

  const createService = async () => {
    setLoading(true)
    setError('')
    
    try {
      const serviceData = {
        ...newService,
        basePrice: parseFloat(newService.basePrice),
        operationalCost: parseFloat(newService.operationalCost)
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f78aeac5/services`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(serviceData)
        }
      )

      if (response.ok) {
        const data = await response.json()
        setServices(prev => [data.service, ...prev])
        setIsNewServiceOpen(false)
        resetNewService()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Erro ao criar serviço')
      }
    } catch (error) {
      console.error('Erro ao criar serviço:', error)
      setError('Erro ao criar serviço')
    } finally {
      setLoading(false)
    }
  }

  const resetNewService = () => {
    setNewService({
      name: '',
      category: '',
      code: '',
      basePrice: '',
      operationalCost: '',
      estimatedTime: '',
      instructions: ''
    })
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const calculateMargin = (basePrice: number, operationalCost: number) => {
    if (basePrice === 0) return 0
    return ((basePrice - operationalCost) / basePrice * 100).toFixed(1)
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Análises Clínicas': 'bg-blue-100 text-blue-800',
      'Exames de Imagem': 'bg-green-100 text-green-800',
      'Vacinas': 'bg-purple-100 text-purple-800',
      'Consultas': 'bg-yellow-100 text-yellow-800',
      'Procedimentos': 'bg-red-100 text-red-800'
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900">Catálogo de Serviços</h2>
        
        <Dialog open={isNewServiceOpen} onOpenChange={setIsNewServiceOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Novo Serviço</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Cadastrar Novo Serviço</DialogTitle>
              <DialogDescription>
                Preencha as informações do novo serviço que será adicionado ao catálogo.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Serviço *</Label>
                  <Input
                    id="name"
                    value={newService.name}
                    onChange={(e) => setNewService(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Hemograma Completo"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="code">Código *</Label>
                  <Input
                    id="code"
                    value={newService.code}
                    onChange={(e) => setNewService(prev => ({ ...prev, code: e.target.value }))}
                    placeholder="Ex: HG001"
                    required
                  />
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="category">Categoria *</Label>
                  <Select
                    value={newService.category}
                    onValueChange={(value) => setNewService(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="basePrice">Preço Base (R$) *</Label>
                  <Input
                    id="basePrice"
                    type="number"
                    step="0.01"
                    value={newService.basePrice}
                    onChange={(e) => setNewService(prev => ({ ...prev, basePrice: e.target.value }))}
                    placeholder="0,00"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="operationalCost">Custo Operacional (R$)</Label>
                  <Input
                    id="operationalCost"
                    type="number"
                    step="0.01"
                    value={newService.operationalCost}
                    onChange={(e) => setNewService(prev => ({ ...prev, operationalCost: e.target.value }))}
                    placeholder="0,00"
                  />
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="estimatedTime">Tempo Estimado para Resultado</Label>
                  <Input
                    id="estimatedTime"
                    value={newService.estimatedTime}
                    onChange={(e) => setNewService(prev => ({ ...prev, estimatedTime: e.target.value }))}
                    placeholder="Ex: 2-4 horas, 1 dia útil, 24-48 horas"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="instructions">Instruções de Preparo</Label>
                <Textarea
                  id="instructions"
                  value={newService.instructions}
                  onChange={(e) => setNewService(prev => ({ ...prev, instructions: e.target.value }))}
                  placeholder="Instruções detalhadas para o paciente (jejum, medicações, etc.)"
                  rows={4}
                />
              </div>
              
              {newService.basePrice && newService.operationalCost && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Análise Financeira</h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-blue-700">Margem de Contribuição</p>
                        <p className="font-semibold text-blue-900">
                          {calculateMargin(parseFloat(newService.basePrice), parseFloat(newService.operationalCost))}%
                        </p>
                      </div>
                      <div>
                        <p className="text-blue-700">Lucro por Serviço</p>
                        <p className="font-semibold text-blue-900">
                          {formatCurrency(parseFloat(newService.basePrice) - parseFloat(newService.operationalCost))}
                        </p>
                      </div>
                      <div>
                        <p className="text-blue-700">ROI</p>
                        <p className="font-semibold text-blue-900">
                          {parseFloat(newService.operationalCost) ? 
                            ((parseFloat(newService.basePrice) / parseFloat(newService.operationalCost)) * 100).toFixed(0) + '%' : 
                            'N/A'
                          }
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setIsNewServiceOpen(false)}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button onClick={createService} disabled={loading}>
                  {loading ? 'Criando...' : 'Criar Serviço'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Services Grid */}
      {loading && services.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando serviços...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {services.map((service) => (
            <Card key={service.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge className={getCategoryColor(service.category)}>
                        {service.category}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {service.code}
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">{service.name}</h3>
                  </div>
                  
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-gray-600">Preço Base</span>
                    </div>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(service.basePrice)}
                    </span>
                  </div>
                  
                  {service.operationalCost > 0 && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Custo Operacional</span>
                        <span className="text-sm text-red-600">
                          {formatCurrency(service.operationalCost)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Margem</span>
                        <span className="text-sm font-semibold text-blue-600">
                          {calculateMargin(service.basePrice, service.operationalCost)}%
                        </span>
                      </div>
                    </>
                  )}
                  
                  {service.estimatedTime && (
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{service.estimatedTime}</span>
                    </div>
                  )}
                  
                  {service.instructions && (
                    <div className="flex items-start space-x-2">
                      <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
                      <p className="text-sm text-gray-600 line-clamp-3">
                        {service.instructions}
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-gray-500">
                    Criado em {new Date(service.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {services.length === 0 && !loading && (
        <Card>
          <CardContent className="p-6 text-center">
            <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Nenhum serviço cadastrado</p>
            <p className="text-sm text-gray-500 mt-2">
              Comece cadastrando os serviços oferecidos pela clínica
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}