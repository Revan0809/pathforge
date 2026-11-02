// Reusable skeleton loaders for every page

export function SkeletonLine({ w = 'w-full', h = 'h-4' }: { w?: string; h?: string }) {
  return <div className={`${w} ${h} rounded-lg animate-pulse`} style={{ background: 'rgba(255,255,255,0.07)' }} />
}

export function SkeletonCard({ h = 'h-24' }: { h?: string }) {
  return <div className={`w-full ${h} rounded-2xl border border-white/5 animate-pulse`} style={{ background: 'rgba(255,255,255,0.04)' }} />
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Hero */}
      <div className="space-y-3">
        <SkeletonLine w="w-32" h="h-3" />
        <SkeletonLine w="w-56" h="h-10" />
        <SkeletonLine w="w-72" h="h-4" />
      </div>
      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <SkeletonCard key={i} h="h-24" />)}
      </div>
      {/* Two column */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <SkeletonCard key={i} h="h-20" />)}
        </div>
        <div className="space-y-4">
          <SkeletonCard h="h-48" />
          <SkeletonCard h="h-28" />
        </div>
      </div>
    </div>
  )
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex gap-4 items-center p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <div className="w-9 h-9 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.08)' }} />
          <div className="flex-1 space-y-2">
            <SkeletonLine w="w-40" h="h-3" />
            <SkeletonLine w="w-24" h="h-2" />
          </div>
          <SkeletonLine w="w-16" h="h-3" />
        </div>
      ))}
    </div>
  )
}

export function EmptyState({
  icon = '📭',
  title,
  subtitle,
  action,
}: {
  icon?: string
  title: string
  subtitle?: string
  action?: { label: string; href?: string; onClick?: () => void }
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center space-y-4">
      <span className="text-4xl">{icon}</span>
      <div>
        <p className="font-heading font-bold text-white text-lg">{title}</p>
        {subtitle && <p className="text-white/50 text-sm font-body mt-1 max-w-xs">{subtitle}</p>}
      </div>
      {action && (
        action.href
          ? <a href={action.href}
              className="px-5 py-2.5 rounded-xl text-sm font-heading font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #0EA5E9)' }}>
              {action.label}
            </a>
          : <button onClick={action.onClick}
              className="px-5 py-2.5 rounded-xl text-sm font-heading font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #0EA5E9)' }}>
              {action.label}
            </button>
      )}
    </div>
  )
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string
  onRetry?: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-4">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
        style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
        <span className="text-xl">⚠️</span>
      </div>
      <div>
        <p className="font-heading font-semibold text-white/80 text-sm">{message}</p>
      </div>
      {onRetry && (
        <button onClick={onRetry}
          className="px-4 py-2 rounded-xl text-xs font-body text-white/60 hover:text-white border border-white/10 hover:border-white/25 transition-all">
          Try again
        </button>
      )}
    </div>
  )
}
