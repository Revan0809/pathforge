'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, WifiOff, AlertCircle, CheckCircle2, Info } from 'lucide-react'

type ToastType = 'error' | 'success' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  message: string
  action?: { label: string; onClick: () => void }
}

interface ToastCtx {
  toast: (message: string, type?: ToastType, action?: Toast['action']) => void
  error: (message: string, action?: Toast['action']) => void
  success: (message: string) => void
  warn: (message: string) => void
}

const ToastContext = createContext<ToastCtx | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}

const ICONS = {
  error:   <AlertCircle size={15} className="text-red-400 shrink-0" />,
  success: <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />,
  warning: <AlertCircle size={15} className="text-yellow-400 shrink-0" />,
  info:    <Info size={15} className="text-blue-400 shrink-0" />,
}

const BORDERS = {
  error:   'rgba(239,68,68,0.3)',
  success: 'rgba(16,185,129,0.3)',
  warning: 'rgba(234,179,8,0.3)',
  info:    'rgba(59,130,246,0.3)',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts(p => p.filter(t => t.id !== id))
  }, [])

  const toast = useCallback((message: string, type: ToastType = 'info', action?: Toast['action']) => {
    const id = `${Date.now()}-${Math.random()}`
    setToasts(p => [...p.slice(-3), { id, type, message, action }]) // max 4 toasts
    if (type !== 'error') setTimeout(() => dismiss(id), type === 'success' ? 3000 : 5000)
  }, [dismiss])

  const ctx: ToastCtx = {
    toast,
    error:   (m, a) => toast(m, 'error', a),
    success: (m)    => toast(m, 'success'),
    warn:    (m)    => toast(m, 'warning'),
  }

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      <div className="fixed bottom-6 right-4 z-[999999] space-y-2 max-w-sm w-full pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map(t => (
            <motion.div key={t.id}
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="pointer-events-auto flex items-start gap-3 px-4 py-3.5 rounded-2xl border shadow-2xl"
              style={{
                background: 'rgba(10,8,24,0.97)',
                backdropFilter: 'blur(20px)',
                borderColor: BORDERS[t.type],
              }}
            >
              {ICONS[t.type]}
              <p className="flex-1 text-sm font-body text-white/85 leading-snug">{t.message}</p>
              <div className="flex items-center gap-2 shrink-0">
                {t.action && (
                  <button onClick={() => { t.action!.onClick(); dismiss(t.id) }}
                    className="text-xs font-heading font-semibold text-violet-400 hover:text-violet-300 transition-colors">
                    {t.action.label}
                  </button>
                )}
                <button onClick={() => dismiss(t.id)} className="text-white/30 hover:text-white transition-colors">
                  <X size={13} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
