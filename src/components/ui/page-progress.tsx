'use client'

import { useEffect, useState, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

export function PageProgress() {
  const pathname = usePathname()
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const prevPath = useRef(pathname)

  useEffect(() => {
    if (pathname === prevPath.current) return
    prevPath.current = pathname

    // Clear any existing timers
    if (timerRef.current) clearTimeout(timerRef.current)
    if (intervalRef.current) clearInterval(intervalRef.current)

    // Start progress
    setProgress(15)
    setVisible(true)

    let current = 15
    intervalRef.current = setInterval(() => {
      current += Math.random() * 18
      if (current >= 85) {
        if (intervalRef.current) clearInterval(intervalRef.current)
        current = 85
      }
      setProgress(current)
    }, 120)

    // Complete after a short delay
    timerRef.current = setTimeout(() => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      setProgress(100)
      setTimeout(() => setVisible(false), 350)
    }, 500)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [pathname])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed top-0 left-0 right-0 z-[99999] h-[2.5px] pointer-events-none"
          style={{ background: 'rgba(124,58,237,0.15)' }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{
              background: 'linear-gradient(90deg, #7C3AED, #A78BFA, #06B6D4)',
              width: `${progress}%`,
              boxShadow: '0 0 10px rgba(167,139,250,0.8), 0 0 20px rgba(124,58,237,0.4)',
              transition: 'width 0.12s ease-out',
            }}
          />
          {/* Glowing tip */}
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full"
            style={{
              left: `calc(${progress}% - 6px)`,
              background: '#A78BFA',
              boxShadow: '0 0 8px 3px rgba(167,139,250,0.9)',
              transition: 'left 0.12s ease-out',
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
