import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: number;
  type: ToastType;
  title: string;
  description?: string;
}

interface ToastContextType {
  addToast: (toast: Omit<Toast, 'id'>) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const newToast = { ...toast, id: Date.now() }; // Usar Date.now() para um ID numérico
    setToasts(prev => [...prev, newToast]);

    setTimeout(() => {
      removeToast(newToast.id);
    }, 4000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const getIcon = (type: Toast['type']) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-600" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case 'info': return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getColorClasses = (type: Toast['type']) => {
    switch (type) {
      case 'success': return 'border-l-green-500 bg-green-50 text-green-900';
      case 'error': return 'border-l-red-500 bg-red-50 text-red-900';
      case 'warning': return 'border-l-amber-500 bg-amber-50 text-amber-900';
      case 'info': return 'border-l-blue-500 bg-blue-50 text-blue-900';
    }
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, translateY: -10 }}
              animate={{ opacity: 1, translateY: 0 }}
              exit={{ opacity: 0, translateY: -10 }}
              className={`border-l-4 p-4 rounded-lg shadow-lg max-w-sm ${getColorClasses(toast.type)}`}
            >
              <div className="flex items-start space-x-3">
                {getIcon(toast.type)}
                <div className="flex-1">
                  <h4 className="font-medium">{toast.title}</h4>
                  {toast.description && (
                    <p className="text-sm mt-1">{toast.description}</p>
                  )}
                </div>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Convenience functions
export const toast = {
  success: (title: string, description?: string) => {
    // This will be replaced by the hook version in components
  },
  error: (title: string, description?: string) => {
    // This will be replaced by the hook version in components
  },
  warning: (title: string, description?: string) => {
    // This will be replaced by the hook version in components
  },
  info: (title: string, description?: string) => {
    // This will be replaced by the hook version in components
  }
};