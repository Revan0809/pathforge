'use client'

import { ThemeProvider } from 'next-themes'
import { CustomCursor } from '@/components/ui/custom-cursor'
import { PageProgress } from '@/components/ui/page-progress'
import { OfflineBanner } from '@/components/ui/offline-banner'
import { ToastProvider } from '@/components/ui/toast'
import { ErrorBoundary } from '@/components/ui/error-boundary'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <ErrorBoundary>
        <ToastProvider>
          <OfflineBanner />
          <CustomCursor />
          <PageProgress />
          {children}
        </ToastProvider>
      </ErrorBoundary>
    </ThemeProvider>
  )
}
