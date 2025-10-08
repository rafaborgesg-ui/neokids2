import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Share } from 'lucide-react';

interface IosInstallInstructionsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IosInstallInstructions = ({ isOpen, onClose }: IosInstallInstructionsProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Instalar o Neokids no seu iOS</DialogTitle>
          <DialogDescription>
            Para uma melhor experiência, adicione o Neokids à sua tela de início.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p>Siga estes passos simples:</p>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              Toque no botão <strong>Compartilhar</strong> na barra de ferramentas do Safari.
              <div className="flex justify-center my-2">
                <Share className="w-8 h-8 text-blue-600" />
              </div>
            </li>
            <li>
              Role para baixo e selecione a opção <strong>"Adicionar à Tela de Início"</strong>.
            </li>
            <li>
              Confirme tocando em <strong>"Adicionar"</strong> no canto superior direito.
            </li>
          </ol>
        </div>
        <Button onClick={onClose} className="w-full">
          Entendi
        </Button>
      </DialogContent>
    </Dialog>
  );
};
