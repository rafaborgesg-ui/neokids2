import React, { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Alert, AlertDescription } from './ui/alert'
import { CheckCircle, Loader2, Database } from 'lucide-react'
import { projectId, publicAnonKey } from '../utils/supabase/info'

export const DemoInitializer = () => {
  const [isInitialized, setIsInitialized] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showModal, setShowModal] = useState(true)

  useEffect(() => {
    // Check if demo data already exists
    checkDemoData()
  }, [])

  const checkDemoData = async () => {
    try {
      console.log('Verificando se dados de demonstração já existem...')
      
      // Check if we have a flag in localStorage indicating demo was initialized
      const demoInitialized = localStorage.getItem('neokids-demo-initialized')
      console.log('Flag localStorage:', demoInitialized)
      
      if (demoInitialized === 'true') {
        console.log('Dados já inicializados segundo localStorage')
        setIsInitialized(true)
        return
      }

      // Try to login with a demo user to see if they exist
      console.log('Testando login com usuário demo...')
      const testResponse = await fetch(
        `https://${projectId}.supabase.co/auth/v1/token?grant_type=password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': publicAnonKey
          },
          body: JSON.stringify({
            email: 'admin@neokids.com',
            password: 'admin123'
          })
        }
      )
      
      console.log('Status do teste de login:', testResponse.status)
      
      if (testResponse.ok) {
        // Demo users exist, mark as initialized
        console.log('Usuários demo já existem!')
        localStorage.setItem('neokids-demo-initialized', 'true')
        setIsInitialized(true)
      } else {
        console.log('Usuários demo não existem, precisa inicializar')
      }
    } catch (error) {
      // Demo users don't exist or other error, need to initialize
      console.log('Erro ao verificar dados de demonstração:', error)
      console.log('Dados de demonstração não encontrados, inicialização necessária')
    }
  }

  const initializeDemoData = async () => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      console.log('Iniciando criação dos dados de demonstração...')
      console.log('URL:', `https://${projectId}.supabase.co/functions/v1/make-server-f78aeac5/init-demo`)
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f78aeac5/init-demo`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      )

      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)

      if (response.ok) {
        const data = await response.json()
        console.log('Dados criados:', data)
        setSuccess(`Dados de demonstração criados: ${data.users} usuários, ${data.services} serviços, ${data.patients} paciente`)
        localStorage.setItem('neokids-demo-initialized', 'true')
        setIsInitialized(true)
      } else {
        const errorText = await response.text()
        console.error('Erro na resposta:', errorText)
        try {
          const errorData = JSON.parse(errorText)
          setError(errorData.error || 'Erro ao inicializar dados de demonstração')
        } catch {
          setError(`Erro ${response.status}: ${errorText || 'Erro ao inicializar dados de demonstração'}`)
        }
      }
    } catch (error) {
      console.error('Erro ao inicializar demo:', error)
      setError(`Erro de conexão: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  if (isInitialized || !showModal) {
    return null // Don't show if already initialized or modal closed
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center relative">
          <button
            onClick={() => setShowModal(false)}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-xl"
          >
            ×
          </button>
          <Database className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <CardTitle>Inicializar Sistema Neokids</CardTitle>
          <p className="text-gray-600">
            Para começar a usar o sistema, precisamos criar os dados de demonstração
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <CheckCircle className="w-4 h-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2 text-sm text-gray-600">
            <p>Será criado:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>3 usuários de exemplo (admin, atendente, técnico)</li>
              <li>5 serviços/exames básicos</li>
              <li>1 paciente de exemplo</li>
            </ul>
          </div>

          <Button
            onClick={initializeDemoData}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Inicializando...
              </>
            ) : (
              'Inicializar Dados de Demonstração'
            )}
          </Button>

          <Button
            onClick={() => {
              localStorage.removeItem('neokids-demo-initialized')
              setIsInitialized(false)
            }}
            variant="outline"
            size="sm"
            className="w-full mt-2"
          >
            Forçar Reinicialização
          </Button>

          {success && (
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">
                Agora você pode fazer login com:
              </p>
              <div className="text-xs space-y-1">
                <p><strong>Admin:</strong> admin@neokids.com / admin123</p>
                <p><strong>Atendente:</strong> atendente@neokids.com / atendente123</p>
                <p><strong>Técnico:</strong> tecnico@neokids.com / tecnico123</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}