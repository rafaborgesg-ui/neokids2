import React from 'react'
import { cn } from './ui/utils'

interface NeokidsLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'full' | 'icon' | 'text'
  className?: string
  showText?: boolean
}

const sizeClasses = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16'
}

const textSizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-xl',
  xl: 'text-2xl'
}

export const NeokidsLogo: React.FC<NeokidsLogoProps> = ({
  size = 'md',
  variant = 'full',
  className,
  showText = true
}) => {
  const IconComponent = () => (
    <div className={cn(
      sizeClasses[size],
      "bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-md",
      className
    )}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="w-3/5 h-3/5 text-white"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Coração infantil estilizado */}
        <path
          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          fill="currentColor"
        />
        {/* Pequeno símbolo + médico */}
        <circle cx="12" cy="10" r="2" fill="rgba(255,255,255,0.9)"/>
        <path
          d="M11 8h2v4h-2V8zm-1 1v2h4V9h-4z"
          fill="currentColor"
          className="text-blue-600"
        />
      </svg>
    </div>
  )

  if (variant === 'icon') {
    return <IconComponent />
  }

  if (variant === 'text') {
    return (
      <span className={cn(
        textSizeClasses[size],
        "font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent",
        className
      )}>
        Neokids
      </span>
    )
  }

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <IconComponent />
      {showText && (
        <div className="flex flex-col leading-none">
          <span className={cn(
            textSizeClasses[size],
            "font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent"
          )}>
            Neokids
          </span>
          {size !== 'sm' && (
            <span className="text-xs text-gray-500 font-medium">
              Sistema de Gestão
            </span>
          )}
        </div>
      )}
    </div>
  )
}

// Componente específico para favicon/meta tags
export const NeokidsFavicon = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="32" height="32" rx="8" fill="url(#gradient)"/>
    <path
      d="M16 28.35l-1.93-1.76C8.72 21.81 4 18.04 4 13c0-4.08 2.89-7 6.5-7 2.32 0 4.55 1.08 6 2.79C17.95 7.08 20.18 6 22.5 6 26.11 6 29 8.92 29 13c0 5.04-4.72 8.81-11.07 13.59L16 28.35z"
      fill="white"
    />
    <circle cx="16" cy="15" r="2.5" fill="#2563eb"/>
    <path
      d="M14.5 13h3v5h-3v-5zm-1.5 1.5v2h6v-2h-6z"
      fill="white"
    />
    <defs>
      <linearGradient id="gradient" x1="0" y1="0" x2="32" y2="32">
        <stop stopColor="#3b82f6"/>
        <stop offset="1" stopColor="#1d4ed8"/>
      </linearGradient>
    </defs>
  </svg>
)