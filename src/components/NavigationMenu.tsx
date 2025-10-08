import React, { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { cn } from './ui/utils'
import { NeokidsLogo } from './NeokidsLogo'
import { IosInstallInstructions } from './IosInstallInstructions'
import { Download, type LucideIcon } from 'lucide-react' // Importar o tipo LucideIcon
import { ScrollArea } from './ui/scroll-area'

interface Module {
  id: string
  name: string
  icon: LucideIcon // Usar o tipo importado
  roles: string[]
}

interface NavigationMenuProps {
  modules: Module[]
  activeModule: string
  onModuleChange: (moduleId: string) => void
  onClose?: () => void
}

export const NavigationMenu: React.FC<NavigationMenuProps> = ({
  modules,
  activeModule,
  onModuleChange,
  onClose,
}: NavigationMenuProps) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isIos, setIsIos] = useState(false)
  const [showIosInstructions, setShowIosInstructions] = useState(false)
  const [canInstall, setCanInstall] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    const runningStandalone = window.matchMedia('(display-mode: standalone)').matches
    setIsStandalone(runningStandalone)

    const isDeviceIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    setIsIos(isDeviceIos)

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      if (!runningStandalone) {
        setDeferredPrompt(e)
        setCanInstall(true)
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = () => {
    if (isIos) {
      setShowIosInstructions(true)
    } else if (deferredPrompt) {
      deferredPrompt.prompt()
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('Usuário instalou o app')
        } else {
          console.log('Usuário dispensou a instalação')
        }
        setDeferredPrompt(null)
        setCanInstall(false)
      })
    }
  }

  const handleModuleClick = (moduleId: string) => {
    onModuleChange(moduleId)
    if (onClose) {
      onClose()
    }
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Cabeçalho (não encolhe) */}
      <div className="p-4 border-b flex-shrink-0">
        <NeokidsLogo size="lg" variant="full" showText={true} />
      </div>

      {/* Área de Rolagem (ocupa todo o espaço restante) com efeito de fade */}
      <div className="flex-grow relative">
        <ScrollArea className="absolute inset-0">
          <nav className="p-4 space-y-2">
            {modules.map(module => {
              const Icon = module.icon
              const isActive = activeModule === module.id
              return (
                <Button
                  key={module.id}
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start',
                    isActive && 'font-semibold'
                  )}
                  onClick={() => handleModuleClick(module.id)}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {module.name}
                </Button>
              )
            })}
          </nav>
        </ScrollArea>
        {/* Efeito de fade no topo */}
        <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-white to-transparent pointer-events-none" />
        {/* Efeito de fade na base */}
        <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-white to-transparent pointer-events-none" />
      </div>

      {/* Rodapé / Botão de Instalação (não encolhe) */}
      {!isStandalone && (canInstall || isIos) && (
        <div className="p-4 mt-auto border-t flex-shrink-0">
          <Button
            variant="default"
            className="w-full bg-blue-600 hover:bg-blue-700"
            onClick={handleInstallClick}
          >
            <Download className="w-4 h-4 mr-2" />
            Instalar APP
          </Button>
        </div>
      )}

      <IosInstallInstructions
        isOpen={showIosInstructions}
        onClose={() => setShowIosInstructions(false)}
      />
    </div>
  )
}