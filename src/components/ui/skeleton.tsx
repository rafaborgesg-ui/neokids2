import React from 'react'
import { cn } from './utils'

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'card' | 'avatar' | 'text' | 'button'
  lines?: number
  width?: string | number
  height?: string | number
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = 'default', lines = 1, width, height, ...props }, ref) => {
    const baseClass = "animate-pulse bg-muted rounded-md"
    
    const variantClasses = {
      default: "h-4 w-full",
      card: "h-32 w-full",
      avatar: "h-10 w-10 rounded-full",
      text: "h-4 w-3/4",
      button: "h-10 w-24"
    }

    const skeletonClass = cn(
      baseClass,
      variantClasses[variant],
      className
    )

    const style = {
      ...(width && { width: typeof width === 'number' ? `${width}px` : width }),
      ...(height && { height: typeof height === 'number' ? `${height}px` : height })
    }

    if (lines > 1) {
      return (
        <div className="space-y-2" ref={ref} {...props}>
          {Array.from({ length: lines }).map((_, index) => (
            <div
              key={index}
              className={cn(skeletonClass, index === lines - 1 && 'w-2/3')}
              style={style}
            />
          ))}
        </div>
      )
    }

    return (
      <div
        ref={ref}
        className={skeletonClass}
        style={style}
        {...props}
      />
    )
  }
)

Skeleton.displayName = "Skeleton"

// Componentes específicos para diferentes casos de uso
export const SkeletonCard = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("p-4 md:p-6 space-y-4", className)} {...props}>
    <div className="flex items-center space-x-4">
      <Skeleton variant="avatar" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    </div>
    <Skeleton variant="text" lines={3} />
    <div className="flex space-x-2">
      <Skeleton variant="button" />
      <Skeleton variant="button" />
    </div>
  </div>
)

export const SkeletonTable = ({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) => (
  <div className="space-y-4">
    {/* Header */}
    <div className="flex space-x-4">
      {Array.from({ length: cols }).map((_, index) => (
        <Skeleton key={`header-${index}`} className="h-6 flex-1" />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={`row-${rowIndex}`} className="flex space-x-4">
        {Array.from({ length: cols }).map((_, colIndex) => (
          <Skeleton key={`cell-${rowIndex}-${colIndex}`} className="h-8 flex-1" />
        ))}
      </div>
    ))}
  </div>
)

export const SkeletonKanbanCard = () => (
  <div className="p-4 border rounded-lg space-y-3 bg-white">
    <div className="flex items-center justify-between">
      <Skeleton className="h-5 w-2/3" />
      <Skeleton className="h-4 w-16" />
    </div>
    <Skeleton className="h-3 w-1/2" />
    <Skeleton className="h-3 w-3/4" />
    <div className="flex space-x-2">
      <Skeleton className="h-6 w-12" />
      <Skeleton className="h-6 w-16" />
    </div>
    <Skeleton variant="button" className="w-full" />
  </div>
)

export const SkeletonDashboard = () => (
  <div className="space-y-6">
    {/* Header */}
    <div className="flex justify-between items-center">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-32" />
    </div>
    
    {/* KPI Cards */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="p-4 md:p-6 border rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
            </div>
            <Skeleton variant="avatar" className="w-12 h-12" />
          </div>
        </div>
      ))}
    </div>
    
    {/* Charts */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="p-6 border rounded-lg space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
      <div className="p-6 border rounded-lg space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  </div>
)

export { Skeleton }