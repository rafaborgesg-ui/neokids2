import React from 'react'
import { toast as sonnerToast, Toaster as SonnerToaster } from 'sonner@2.0.3'
import { CheckCircle, AlertCircle, Info, X, AlertTriangle } from 'lucide-react'
import { cn } from './utils'

// Enhanced toast function with custom styling and icons
interface ToastOptions {
  title?: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  duration?: number
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'
}

const iconMap = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info
}

const toast = {
  success: (message: string, options?: ToastOptions) => {
    const Icon = iconMap.success
    return sonnerToast.success(message, {
      ...options,
      icon: <Icon className="w-5 h-5 text-green-600" />,
      className: cn(
        "border-l-4 border-l-green-500 bg-green-50 text-green-900",
        "data-[type=success]:border-l-green-500"
      )
    })
  },

  error: (message: string, options?: ToastOptions) => {
    const Icon = iconMap.error
    return sonnerToast.error(message, {
      ...options,
      icon: <Icon className="w-5 h-5 text-red-600" />,
      className: cn(
        "border-l-4 border-l-red-500 bg-red-50 text-red-900",
        "data-[type=error]:border-l-red-500"
      )
    })
  },

  warning: (message: string, options?: ToastOptions) => {
    const Icon = iconMap.warning
    return sonnerToast.warning(message, {
      ...options,
      icon: <Icon className="w-5 h-5 text-amber-600" />,
      className: cn(
        "border-l-4 border-l-amber-500 bg-amber-50 text-amber-900",
        "data-[type=warning]:border-l-amber-500"
      )
    })
  },

  info: (message: string, options?: ToastOptions) => {
    const Icon = iconMap.info
    return sonnerToast.info(message, {
      ...options,
      icon: <Icon className="w-5 h-5 text-blue-600" />,
      className: cn(
        "border-l-4 border-l-blue-500 bg-blue-50 text-blue-900",
        "data-[type=info]:border-l-blue-500"
      )
    })
  },

  loading: (message: string, options?: ToastOptions) => {
    return sonnerToast.loading(message, {
      ...options,
      className: "border-l-4 border-l-gray-500 bg-gray-50 text-gray-900"
    })
  },

  promise: <T,>(
    promise: Promise<T>,
    {
      loading: loadingMessage,
      success: successMessage,
      error: errorMessage,
      ...options
    }: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: any) => string)
    } & ToastOptions
  ) => {
    return sonnerToast.promise(promise, {
      loading: loadingMessage,
      success: successMessage,
      error: errorMessage,
      ...options
    })
  },

  dismiss: (id?: string | number) => sonnerToast.dismiss(id),
  
  custom: (jsx: React.ReactNode, options?: ToastOptions) => {
    return sonnerToast.custom(jsx, options)
  }
}

// Toaster component with enhanced styling
interface ToasterProps {
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'
  expand?: boolean
  richColors?: boolean
  closeButton?: boolean
  toastOptions?: {
    duration?: number
    className?: string
  }
}

const Toaster: React.FC<ToasterProps> = ({
  position = 'top-right',
  expand = true,
  richColors = false,
  closeButton = true,
  toastOptions = {}
}) => {
  return (
    <SonnerToaster
      position={position}
      expand={expand}
      richColors={richColors}
      closeButton={closeButton}
      toastOptions={{
        duration: 4000,
        style: {
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '0.5rem',
          fontSize: '14px',
          padding: '16px',
          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)'
        },
        className: 'font-medium',
        ...toastOptions
      }}
      theme="light"
      cn={cn}
    />
  )
}

// Specialized toast functions for common Neokids use cases
const neokidsToast = {
  // Patient operations
  patientCreated: (name: string) => 
    toast.success(`Paciente ${name} cadastrado com sucesso!`),
  
  patientUpdated: (name: string) => 
    toast.success(`Dados de ${name} atualizados com sucesso!`),
  
  patientError: (error: string) => 
    toast.error(`Erro no cadastro do paciente: ${error}`),

  // Appointment operations
  appointmentCreated: (id: string) => 
    toast.success(`Atendimento ${id} criado com sucesso!`, {
      action: {
        label: 'Ver detalhes',
        onClick: () => console.log('Navigate to appointment details')
      }
    }),
  
  appointmentStatusUpdated: (status: string) => 
    toast.info(`Status atualizado para: ${status}`),

  // Laboratory operations
  sampleCollected: (sampleId: string) => 
    toast.success(`Amostra ${sampleId} coletada!`),
  
  resultReady: (patientName: string) => 
    toast.info(`Resultado disponível para ${patientName}`, {
      action: {
        label: 'Visualizar',
        onClick: () => console.log('Navigate to results')
      }
    }),

  // System operations
  saveProgress: (action: string) => {
    const id = toast.loading(`${action}...`)
    return {
      success: (message?: string) => {
        toast.dismiss(id)
        toast.success(message || `${action} realizada com sucesso!`)
      },
      error: (error?: string) => {
        toast.dismiss(id)
        toast.error(error || `Erro ao realizar ${action.toLowerCase()}`)
      }
    }
  },

  // Validation errors
  validationError: (field: string, message: string) => 
    toast.warning(`${field}: ${message}`),

  // Permission errors
  permissionDenied: () => 
    toast.error('Você não tem permissão para esta ação'),

  // Network errors
  networkError: () => 
    toast.error('Erro de conexão. Verifique sua internet e tente novamente.', {
      action: {
        label: 'Tentar novamente',
        onClick: () => window.location.reload()
      }
    })
}

export { toast, neokidsToast, Toaster }
export type { ToastOptions }