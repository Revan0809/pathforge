'use client'

import { Zap, X } from 'lucide-react'
import { useState } from 'react'

/**
 * FallbackBanner — shown when the AI engine is unavailable.
 * Drop above any AI-generated result. Dismissible.
 * Does NOT affect layout — inline element only.
 */
export function FallbackBanner() {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  return (
    <div className="flex items-start gap-3 bg-yellow-950/40 border border-yellow-500/25 rounded-xl px-4 py-3 mb-4">
      <Zap size={14} className="text-yellow-400 fill-yellow-400 shrink-0 mt-0.5" />
      <p className="text-yellow-300/80 text-xs font-body flex-1">
        <span className="font-semibold">AI engine temporarily unavailable.</span>{' '}
        Showing simplified results — full personalisation will resume automatically.
      </p>
      <button
        onClick={() => setDismissed(true)}
        className="text-yellow-500/50 hover:text-yellow-400 transition-colors shrink-0"
        aria-label="Dismiss"
      >
        <X size={12} />
      </button>
    </div>
  )
}
