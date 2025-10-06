import React from 'react'
import { LucideIcon } from 'lucide-react'
import { Button } from './ui/button'

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
  onClose
}) => {
  const handleModuleClick = (moduleId: string) => {
    onModuleChange(moduleId)
    onClose?.()
  }

  return (
    <nav className="p-4 space-y-2 h-full flex flex-col" role="navigation" aria-label="Menu principal">
      <div className="mb-6">
        <div className="flex items-center space-x-3 px-3 py-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center" aria-hidden="true">
            <span className="text-white font-bold text-sm">N</span>
          </div>
          <span className="font-semibold text-gray-900">Neokids</span>
        </div>
      </div>
      
      <div className="flex-1 space-y-2">
        {modules.map((module) => {
          const Icon = module.icon
          const isActive = activeModule === module.id
          return (
            <Button
              key={module.id}
              variant="ghost"
              onClick={() => handleModuleClick(module.id)}
              className={`w-full justify-start space-x-3 px-3 py-3 h-auto min-h-[48px] ${
                isActive
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-100'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
              <span className="truncate">{module.name}</span>
            </Button>
          )
        })}
      </div>
    </nav>
  )
}