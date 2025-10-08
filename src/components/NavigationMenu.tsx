import React, { useState, useEffect } from 'react'
import { LucideIcon } from 'lucide-react'
import { Button } from './ui/button'
import { cn } from './ui/utils'
import { NeokidsLogo } from './NeokidsLogo'
import { IosInstallInstructions } from './IosInstallInstructions'
import { Download } from 'lucide-react'

interface Module {
  id: string
  name: string
  icon: LucideIcon
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
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIos, setIsIos] = useState(false);
  const [showIosInstructions, setShowIosInstructions] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false); // Novo estado para verificar se já está instalado

  useEffect(() => {
    // Verifica se o app já está rodando em modo standalone (instalado)
    const runningStandalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(runningStandalone);

    // Detecta se é iOS
    const isDeviceIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIos(isDeviceIos);

    // Ouve o evento de instalação para navegadores que o suportam (Chrome, Edge, etc.)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      // Só mostra o prompt se o app não estiver instalado
      if (!runningStandalone) {
        setDeferredPrompt(e);
        setCanInstall(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

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
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <NeokidsLogo size="lg" variant="full" showText={true} />
      </div>
      <nav className="flex-1 p-4 space-y-2" role="navigation" aria-label="Menu principal">
        {modules.map((module) => {
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

      {/* Botão de Instalação: Só aparece se o app NÃO estiver instalado */}
      {!isStandalone && (canInstall || isIos) && (
        <div className="p-4 mt-auto border-t">
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

      {/* Modal de Instruções para iOS */}
      <IosInstallInstructions
        isOpen={showIosInstructions}
        onClose={() => setShowIosInstructions(false)}
      />
    </div>
  )
}