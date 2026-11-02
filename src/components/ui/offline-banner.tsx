'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WifiOff, Wifi } from 'lucide-react'

export function OfflineBanner() {
  const [offline, setOffline] = useState(false)
  const [justReconnected, setJustReconnected] = useState(false)

  useEffect(() => {
    function handleOffline() { setOffline(true); setJustReconnected(false) }
    function handleOnline() {
      setOffline(false)
      setJustReconnected(true)
      setTimeout(() => setJustReconnected(false), 3000)
    }

    setOffline(!navigator.onLine)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)
    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [])

  return (
    <AnimatePresence>
      {(offline || justReconnected) && (
        <motion.div
          initial={{ y: -48, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -48, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="fixed top-0 left-0 right-0 z-[99999] flex items-center justify-center gap-2 py-2.5 text-sm font-body"
          style={offline
            ? { background: 'rgba(239,68,68,0.92)', backdropFilter: 'blur(12px)' }
            : { background: 'rgba(16,185,129,0.92)', backdropFilter: 'blur(12px)' }
          }
        >
          {offline
            ? <><WifiOff size={14} className="text-white" /><span className="text-white font-semibold">No internet connection — some features may not work</span></>
            : <><Wifi size={14} className="text-white" /><span className="text-white font-semibold">Back online!</span></>
          }
        </motion.div>
      )}
    </AnimatePresence>
  )
}
