'use client'

import { Component, ReactNode } from 'react'
import { logError } from '@/lib/api'

interface Props  { children: ReactNode; fallback?: ReactNode }
interface State  { crashed: boolean }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { crashed: false }

  static getDerivedStateFromError(): State {
    return { crashed: true }
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    logError(error, 'ErrorBoundary')
    logError(info.componentStack, 'ComponentStack')
  }

  render() {
    if (this.state.crashed) {
      return this.props.fallback ?? <DefaultCrashUI onRetry={() => this.setState({ crashed: false })} />
    }
    return this.props.children
  }
}

function DefaultCrashUI({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="min-h-screen page-bg flex items-center justify-center px-4">
      <div className="text-center space-y-5 max-w-sm">
        <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center"
          style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}>
          <span className="text-3xl">⚠️</span>
        </div>
        <div>
          <p className="font-heading font-bold text-white text-xl mb-2">Something went wrong</p>
          <p className="text-white/55 text-sm font-body leading-relaxed">
            We hit an unexpected error. Your data is safe — this is just a display issue.
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <button
            onClick={onRetry}
            className="px-5 py-2.5 rounded-xl text-sm font-heading font-semibold text-white transition-all"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #0EA5E9)' }}
          >
            Try again
          </button>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="px-5 py-2.5 rounded-xl text-sm font-body text-white/60 hover:text-white border border-white/10 hover:border-white/25 transition-all"
          >
            Go to dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
