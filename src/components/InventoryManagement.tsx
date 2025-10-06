import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Badge } from './ui/badge'
import { Alert, AlertDescription } from './ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { 
  Package, 
  Plus,
  Search,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  BarChart3,
  Calendar,
  ShoppingCart,
  Truck,
  CheckCircle,
  Edit,
  Trash2,
  Archive,
  Filter,
  Download
} from 'lucide-react'
import { projectId } from '../utils/supabase/info'

interface InventoryItem {
  id: string
  name: string
  code: string
  category: string
  supplier: string
  currentStock: number
  minStock: number
  maxStock: number
  unit: string
  unitCost: number
  totalValue: number
  expirationDate?: string
  lastUpdated: string
  status: 'active' | 'inactive' | 'discontinued'
  location: string
  description?: string
}

interface StockMovement {
  id: string
  itemId: string
  itemName: string
  type: 'entry' | 'exit' | 'adjustment'
  quantity: number
  unitCost?: number
  reason: string
  responsibleUser: string
  createdAt: string
  batchNumber?: string
  expirationDate?: string
}

interface InventoryManagementProps {
  accessToken: string
  userRole: string
}

export const InventoryManagement = ({ accessToken, userRole }: InventoryManagementProps) => {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [isNewItemOpen, setIsNewItemOpen] = useState(false)
  const [isMovementOpen, setIsMovementOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('items')

  useEffect(() => {
    fetchInventoryData()
  }, [])

  const fetchInventoryData = async () => {
    try {
      const [itemsResponse, movementsResponse] = await Promise.all([
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-f78aeac5/inventory/items`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }),
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-f78aeac5/inventory/movements`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        })
      ])

      if (itemsResponse.ok && movementsResponse.ok) {
        const [itemsData, movementsData] = await Promise.all([
          itemsResponse.json(),
          movementsResponse.json()
        ])
        setItems(itemsData)
        setMovements(movementsData)
      }
    } catch (error) {
      console.error('Erro ao carregar dados do estoque:', error)
    } finally {
      setLoading(false)
    }
  }

  const createItem = async (itemData: Partial<InventoryItem>) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f78aeac5/inventory/items`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(itemData)
        }
      )

      if (response.ok) {
        await fetchInventoryData()
        setIsNewItemOpen(false)
        return true
      }
      return false
    } catch (error) {
      console.error('Erro ao criar item:', error)
      return false
    }
  }

  const createMovement = async (movementData: Partial<StockMovement>) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f78aeac5/inventory/movements`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(movementData)
        }
      )

      if (response.ok) {
        await fetchInventoryData()
        setIsMovementOpen(false)
        return true
      }
      return false
    } catch (error) {
      console.error('Erro ao criar movimentação:', error)
      return false
    }
  }

  const getStockStatus = (item: InventoryItem) => {
    if (item.currentStock <= item.minStock) {
      return { status: 'critical', color: 'text-red-600 bg-red-100', label: 'Crítico' }
    } else if (item.currentStock <= item.minStock * 1.5) {
      return { status: 'low', color: 'text-yellow-600 bg-yellow-100', label: 'Baixo' }
    } else if (item.currentStock >= item.maxStock) {
      return { status: 'excess', color: 'text-blue-600 bg-blue-100', label: 'Excesso' }
    }
    return { status: 'normal', color: 'text-green-600 bg-green-100', label: 'Normal' }
  }

  const isExpiringSoon = (expirationDate: string) => {
    if (!expirationDate) return false
    const today = new Date()
    const expDate = new Date(expirationDate)
    const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 3600 * 24))
    return diffDays <= 30 && diffDays > 0
  }

  const isExpired = (expirationDate: string) => {
    if (!expirationDate) return false
    return new Date(expirationDate) < new Date()
  }

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.code.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const categories = [...new Set(items.map(item => item.category))]
  const criticalItems = items.filter(item => item.currentStock <= item.minStock)
  const expiringItems = items.filter(item => item.expirationDate && isExpiringSoon(item.expirationDate))
  const expiredItems = items.filter(item => item.expirationDate && isExpired(item.expirationDate))

  const totalValue = items.reduce((sum, item) => sum + item.totalValue, 0)

  if (loading) {
    return (
      <div className="space-y-6">
        <h2>Gestão de Estoque</h2>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-gray-200 rounded"></div>
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
          <Package className="w-6 h-6" />
          <h2>Gestão de Estoque</h2>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" className="flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Exportar</span>
          </Button>
          
          <Dialog open={isMovementOpen} onOpenChange={setIsMovementOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center space-x-2">
                <Archive className="w-4 h-4" />
                <span>Nova Movimentação</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Nova Movimentação de Estoque</DialogTitle>
                <DialogDescription>
                  Registre uma nova movimentação de entrada ou saída de estoque.
                </DialogDescription>
              </DialogHeader>
              <StockMovementForm 
                items={items}
                onSubmit={createMovement}
                onCancel={() => setIsMovementOpen(false)}
              />
            </DialogContent>
          </Dialog>

          <Dialog open={isNewItemOpen} onOpenChange={setIsNewItemOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Novo Item</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Cadastrar Novo Item</DialogTitle>
                <DialogDescription>
                  Cadastre um novo item no estoque com informações detalhadas.
                </DialogDescription>
              </DialogHeader>
              <ItemForm 
                onSubmit={createItem}
                onCancel={() => setIsNewItemOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Itens</p>
                <p className="text-2xl font-bold text-gray-900">{items.length}</p>
              </div>
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Valor Total</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)}
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Estoque Crítico</p>
                <p className="text-2xl font-bold text-red-700">{criticalItems.length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">Vencendo em 30 dias</p>
                <p className="text-2xl font-bold text-yellow-700">{expiringItems.length}</p>
              </div>
              <Calendar className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {(criticalItems.length > 0 || expiredItems.length > 0) && (
        <div className="space-y-3">
          {criticalItems.length > 0 && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>{criticalItems.length} item(s)</strong> com estoque crítico necessitam de reposição urgente.
              </AlertDescription>
            </Alert>
          )}
          
          {expiredItems.length > 0 && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>{expiredItems.length} item(s)</strong> estão vencidos e devem ser removidos do estoque.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="items" className="flex items-center space-x-2">
            <Package className="w-4 h-4" />
            <span>Itens</span>
          </TabsTrigger>
          <TabsTrigger value="movements" className="flex items-center space-x-2">
            <Archive className="w-4 h-4" />
            <span>Movimentações</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4" />
            <span>Relatórios</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por nome ou código..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Items Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Categoria
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estoque Atual
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vencimento
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredItems.map((item) => {
                    const stockStatus = getStockStatus(item)
                    return (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="font-medium text-gray-900">{item.name}</div>
                            <div className="text-sm text-gray-500">{item.code}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="outline">{item.category}</Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {item.currentStock} {item.unit}
                          </div>
                          <div className="text-xs text-gray-500">
                            Min: {item.minStock} | Max: {item.maxStock}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={stockStatus.color}>
                            {stockStatus.label}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.totalValue)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {item.expirationDate ? (
                            <div className={`text-sm ${
                              isExpired(item.expirationDate) ? 'text-red-600' :
                              isExpiringSoon(item.expirationDate) ? 'text-yellow-600' :
                              'text-gray-600'
                            }`}>
                              {new Date(item.expirationDate).toLocaleDateString('pt-BR')}
                            </div>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="movements" className="space-y-6">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data/Hora
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantidade
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Responsável
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Motivo
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {movements.map((movement) => (
                    <tr key={movement.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(movement.createdAt).toLocaleString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {movement.itemName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={
                          movement.type === 'entry' ? 'bg-green-100 text-green-800' :
                          movement.type === 'exit' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }>
                          {movement.type === 'entry' ? 'Entrada' :
                           movement.type === 'exit' ? 'Saída' : 'Ajuste'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {movement.type === 'exit' ? '-' : '+'}{movement.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {movement.responsibleUser}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {movement.reason}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Itens com Estoque Baixo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {criticalItems.slice(0, 5).map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div>
                        <p className="font-medium text-red-900">{item.name}</p>
                        <p className="text-sm text-red-700">{item.currentStock} {item.unit} restantes</p>
                      </div>
                      <Badge className="bg-red-100 text-red-800">Crítico</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Itens Vencendo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {expiringItems.slice(0, 5).map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div>
                        <p className="font-medium text-yellow-900">{item.name}</p>
                        <p className="text-sm text-yellow-700">
                          Vence em {new Date(item.expirationDate!).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-800">Atenção</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Componente de formulário para novos itens
const ItemForm = ({ onSubmit, onCancel }: {
  onSubmit: (data: Partial<InventoryItem>) => Promise<boolean>
  onCancel: () => void
}) => {
  const [formData, setFormData] = useState<Partial<InventoryItem>>({
    name: '',
    code: '',
    category: '',
    supplier: '',
    currentStock: 0,
    minStock: 0,
    maxStock: 0,
    unit: '',
    unitCost: 0,
    location: '',
    description: '',
    status: 'active'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const success = await onSubmit({
      ...formData,
      totalValue: (formData.currentStock || 0) * (formData.unitCost || 0)
    })
    if (success) {
      onCancel()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Nome do Item</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="code">Código</Label>
          <Input
            id="code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="category">Categoria</Label>
          <Input
            id="category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="supplier">Fornecedor</Label>
          <Input
            id="supplier"
            value={formData.supplier}
            onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="currentStock">Estoque Atual</Label>
          <Input
            id="currentStock"
            type="number"
            value={formData.currentStock}
            onChange={(e) => setFormData({ ...formData, currentStock: Number(e.target.value) })}
            required
          />
        </div>
        <div>
          <Label htmlFor="minStock">Estoque Mínimo</Label>
          <Input
            id="minStock"
            type="number"
            value={formData.minStock}
            onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) })}
            required
          />
        </div>
        <div>
          <Label htmlFor="maxStock">Estoque Máximo</Label>
          <Input
            id="maxStock"
            type="number"
            value={formData.maxStock}
            onChange={(e) => setFormData({ ...formData, maxStock: Number(e.target.value) })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="unit">Unidade</Label>
          <Input
            id="unit"
            value={formData.unit}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            placeholder="ex: un, kg, L"
            required
          />
        </div>
        <div>
          <Label htmlFor="unitCost">Custo Unitário</Label>
          <Input
            id="unitCost"
            type="number"
            step="0.01"
            value={formData.unitCost}
            onChange={(e) => setFormData({ ...formData, unitCost: Number(e.target.value) })}
            required
          />
        </div>
        <div>
          <Label htmlFor="location">Localização</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="ex: Sala 1, Prateleira A"
            required
          />
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          Salvar Item
        </Button>
      </div>
    </form>
  )
}

// Componente de formulário para movimentações
const StockMovementForm = ({ 
  items, 
  onSubmit, 
  onCancel 
}: {
  items: InventoryItem[]
  onSubmit: (data: Partial<StockMovement>) => Promise<boolean>
  onCancel: () => void
}) => {
  const [formData, setFormData] = useState<Partial<StockMovement>>({
    itemId: '',
    type: 'entry',
    quantity: 0,
    reason: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const selectedItem = items.find(item => item.id === formData.itemId)
    const success = await onSubmit({
      ...formData,
      itemName: selectedItem?.name
    })
    if (success) {
      onCancel()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="itemId">Item</Label>
        <Select value={formData.itemId} onValueChange={(value) => setFormData({ ...formData, itemId: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Selecionar item" />
          </SelectTrigger>
          <SelectContent>
            {items.map(item => (
              <SelectItem key={item.id} value={item.id}>
                {item.name} - Estoque atual: {item.currentStock} {item.unit}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="type">Tipo de Movimentação</Label>
          <Select value={formData.type} onValueChange={(value: 'entry' | 'exit' | 'adjustment') => setFormData({ ...formData, type: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="entry">Entrada</SelectItem>
              <SelectItem value="exit">Saída</SelectItem>
              <SelectItem value="adjustment">Ajuste</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="quantity">Quantidade</Label>
          <Input
            id="quantity"
            type="number"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="reason">Motivo</Label>
        <Input
          id="reason"
          value={formData.reason}
          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
          placeholder="Descreva o motivo da movimentação"
          required
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          Registrar Movimentação
        </Button>
      </div>
    </form>
  )
}