'use client'

import { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

export function CustomCursor() {
  const [visible, setVisible] = useState(false)
  const [clicking, setClicking] = useState(false)
  const [hovering, setHovering] = useState(false)
  const [isTouch, setIsTouch] = useState(true) // default true — avoid SSR flash

  const mouseX = useMotionValue(-200)
  const mouseY = useMotionValue(-200)

  // Dot: near-instant
  const dotX = useSpring(mouseX, { stiffness: 2000, damping: 90 })
  const dotY = useSpring(mouseY, { stiffness: 2000, damping: 90 })

  // Ring: follows with a smooth lag
  const ringX = useSpring(mouseX, { stiffness: 200, damping: 26 })
  const ringY = useSpring(mouseY, { stiffness: 200, damping: 26 })

  useEffect(() => {
    setIsTouch(window.matchMedia('(pointer: coarse)').matches)

    function onMove(e: MouseEvent) {
      mouseX.set(e.clientX)
      mouseY.set(e.clientY)
      setVisible(true)

      const el = e.target as HTMLElement
      const isClickable =
        el.tagName === 'A' ||
        el.tagName === 'BUTTON' ||
        el.tagName === 'INPUT' ||
        el.tagName === 'TEXTAREA' ||
        el.tagName === 'SELECT' ||
        !!el.closest('a') ||
        !!el.closest('button') ||
        el.getAttribute('role') === 'button' ||
        window.getComputedStyle(el).cursor === 'pointer'
      setHovering(isClickable)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseleave', () => setVisible(false))
    window.addEventListener('mouseenter', () => setVisible(true))
    window.addEventListener('mousedown', () => setClicking(true))
    window.addEventListener('mouseup', () => setClicking(false))

    return () => {
      window.removeEventListener('mousemove', onMove)
    }
  }, [mouseX, mouseY])

  if (isTouch) return null

  return (
    <>
      {/* Outer ring — lags behind */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[99999]"
        style={{ x: ringX, y: ringY, translateX: '-50%', translateY: '-50%', opacity: visible ? 1 : 0 }}
      >
        <motion.div
          animate={{
            width: hovering ? 48 : clicking ? 24 : 36,
            height: hovering ? 48 : clicking ? 24 : 36,
            borderColor: hovering ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.55)',
            borderWidth: hovering ? '2px' : '1.5px',
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 22 }}
          style={{ borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.55)' }}
        />
      </motion.div>

      {/* Center dot — instant */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[99999]"
        style={{ x: dotX, y: dotY, translateX: '-50%', translateY: '-50%', opacity: visible ? 1 : 0 }}
      >
        <motion.div
          animate={{
            width: hovering ? 10 : clicking ? 5 : 8,
            height: hovering ? 10 : clicking ? 5 : 8,
            background: hovering ? '#ffffff' : '#e2d9ff',
            boxShadow: hovering
              ? '0 0 10px 3px rgba(167,139,250,0.9)'
              : '0 0 6px 2px rgba(255,255,255,0.5)',
          }}
          transition={{ type: 'spring', stiffness: 700, damping: 35 }}
          style={{ borderRadius: '50%' }}
        />
      </motion.div>
    </>
  )
}
