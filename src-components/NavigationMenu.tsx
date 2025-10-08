import { useState } from 'react';
import { Button } from './Button';
import { ScrollArea } from './ScrollArea';
import { NeokidsLogo } from './NeokidsLogo';
import { Download } from 'lucide-react';
import { IosInstallInstructions } from './IosInstallInstructions';
import { cn } from '../lib/utils';

interface Module {
  id: string;
  name: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
}

interface NavigationMenuProps {
  modules: Module[];
  activeModule: string;
  onModuleChange: (moduleId: string) => void;
  isStandalone: boolean;
  canInstall: boolean;
  isIos: boolean;
  onClose: () => void;
}

export const NavigationMenu = ({
  modules,
  activeModule,
  onModuleChange,
  isStandalone,
  canInstall,
  isIos,
  onClose,
}: NavigationMenuProps) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showIosInstructions, setShowIosInstructions] = useState(false);

  const handleModuleClick = (moduleId: string) => {
    onModuleChange(moduleId);
  };

  const handleInstallClick = () => {
    if (isStandalone) {
      // Already in standalone mode, no action needed
      return;
    }

    if (canInstall) {
      // Trigger the install prompt for supported browsers
      deferredPrompt?.prompt();
    } else if (isIos) {
      // Show iOS installation instructions
      setShowIosInstructions(true);
    }
  };

  return (
    <div className="relative h-full bg-white">
      {/* Cabeçalho Fixo */}
      <div className="absolute top-0 left-0 right-0 p-4 border-b h-[72px]">
        <NeokidsLogo size="lg" variant="full" showText={true} />
      </div>

      {/* Área de Rolagem que ocupa o espaço intermediário */}
      <ScrollArea className="absolute top-[72px] bottom-[88px] left-0 right-0">
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
        </nav>
      </ScrollArea>

      {/* Rodapé Fixo */}
      {!isStandalone && (canInstall || isIos) && (
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t h-[88px]">
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
  );
};