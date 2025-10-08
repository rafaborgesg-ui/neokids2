import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { cn } from './ui/utils';
import { NeokidsLogo } from './NeokidsLogo';
import { IosInstallInstructions } from './IosInstallInstructions';
import { Download, type LucideIcon } from 'lucide-react';
import { Separator } from './ui/separator';
import { useToast } from './ui/simple-toast';

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
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isMobile, setIsMobile] = useState(false); // Apenas este estado é necessário para a visibilidade
  const [showIosInstructions, setShowIosInstructions] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    // Verifica se o app já está rodando em modo standalone (instalado)
    const runningStandalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(runningStandalone);

    if (runningStandalone) return;

    // Detecta se é um dispositivo móvel (iOS ou Android) para controlar a VISIBILIDADE
    const isMobileDevice = /Android|iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsMobile(isMobileDevice);

    // Apenas captura o evento para a AÇÃO de clique, não para a visibilidade
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = () => {
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    if (isIos) {
      setShowIosInstructions(true);
      return;
    }

    // Lógica para Android e Desktop
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          addToast({ type: 'success', title: 'Aplicativo instalado com sucesso!' });
          setIsStandalone(true);
        } else {
          addToast({ type: 'info', title: 'Instalação cancelada.' });
        }
      });
    } else {
      addToast({ type: 'info', title: 'Instalação manual', description: 'Use a opção "Adicionar à tela inicial" do seu navegador.' });
    }
  };

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

      {/* Área de Rolagem Nativa (ocupa todo o espaço restante) */}
      <div className="flex-grow overflow-y-auto hide-scrollbar">
        <nav className="p-4 space-y-2">
          {modules.map(module => {
            const Icon = module.icon;
            const isActive = activeModule === module.id;
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
            );
          })}

          {/* Botão de Instalação: Aparece se for um dispositivo móvel e o app não estiver instalado */}
          {!isStandalone && isMobile && (
            <>
              <Separator className="my-4" />
              <Button
                variant="default"
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={handleInstallClick}
              >
                <Download className="w-4 h-4 mr-2" />
                Instalar APP
              </Button>
            </>
          )}
        </nav>
      </div>

      {/* Modal de Instruções para iOS */}
      <IosInstallInstructions
        isOpen={showIosInstructions}
        onClose={() => setShowIosInstructions(false)}
      />
    </div>
  );
};