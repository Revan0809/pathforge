'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  Zap,
  Target,
  Trophy,
  BookOpen,
  Code2,
  TrendingUp,
  Lightbulb,
  RefreshCw,
} from 'lucide-react'

const BACKEND = '/api/backend'

interface ScoreData {
  score: number
  dsa_score: number
  cgpa_score: number
  course_score: number
  project_score: number
  aptitude_score: number
}

interface UserProfile {
  name: string
  target_role: string
  tier: string
}

export default function ScorePage() {
  const [loading, setLoading] = useState(true)
  const [recalcLoading, setRecalcLoading] = useState(false)
  const [score, setScore] = useState<ScoreData | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [token, setToken] = useState('')

  async function fetchScore(tok: string) {
    try {
      const res = await fetch(`${BACKEND}/score/calculate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tok}`,
          'Content-Type': 'application/json',
        },
      })
      if (res.ok) {
        const data = await res.json()
        setScore(data)
      }
    } catch {
      // backend may not be reachable
    }
  }

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getSession()
      const session = data?.session
      const tok = session?.access_token ?? 'demo-token'
      setToken(tok)

      try {
        const { data: user } = await supabase
          .from('users')
          .select('name, target_role, tier')
          .eq('id', session?.user?.id ?? 'demo-user-123')
          .single()
        setUserProfile(user)
      } catch { /* use default */ }

      await fetchScore(tok)
      setLoading(false)
    }
    init()
  }, [])

  async function handleRecalculate() {
    setRecalcLoading(true)
    await fetchScore(token)
    setRecalcLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen page-bg flex items-center justify-center">
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    )
  }

  const s = score?.score ?? 0

  const ringColor = s >= 70 ? '#22c55e' : s >= 50 ? '#eab308' : '#ef4444'
  const circumference = 326.7
  const filledArc = (s / 100) * circumference

  const tagline =
    s >= 80 ? "You're placement-ready 🚀" :
    s >= 60 ? 'Good progress, keep building 📈' :
    s >= 40 ? 'Solid start — stay consistent 💪' :
    'Time to grind 🔥'

  const tips: string[] = []
  if (score) {
    if (score.dsa_score < 50) tips.push('Solve more DSA problems daily — aim for 5/day on Striver A2Z')
    if (score.cgpa_score < 60) tips.push('Improve your CGPA — check cutoffs for target companies')
    if (score.course_score < 50) tips.push('Complete at least one course section daily')
  }

  return (
    <div className="min-h-screen page-bg text-white">
      {/* Navbar */}
      <nav className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <a
          href="/dashboard"
          className="flex items-center gap-1.5 text-white/40 hover:text-white text-sm transition-colors font-body"
        >
          <ArrowLeft size={14} />
          Dashboard
        </a>
        <div className="flex items-center gap-2">
          <span className="font-heading text-lg font-bold text-white tracking-tight">PathForge</span>
          {userProfile?.tier === 'premium' && (
            <span className="text-xs bg-gradient-to-r from-yellow-400 to-orange-400 text-black font-bold px-2 py-0.5 rounded-full">PRO</span>
          )}
        </div>
        <div className="w-24" />
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-10">

        {/* Hero: Score Ring */}
        <div className="flex flex-col items-center gap-4">
          <svg width="120" height="120" viewBox="0 0 120 120">
            {/* Background circle */}
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="8"
            />
            {/* Foreground arc */}
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke={ringColor}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${filledArc} ${circumference}`}
              transform="rotate(-90 60 60)"
              style={{ transition: 'stroke-dasharray 0.8s ease' }}
            />
          </svg>
          {/* Score overlaid: use negative margin to pull up into the SVG area */}
          <div className="-mt-[92px] flex flex-col items-center pointer-events-none">
            <span className="font-heading text-4xl font-black text-white leading-none">{s}</span>
            <span className="font-body text-xs text-white/40 mt-0.5">Readiness Score</span>
          </div>
          {/* Tagline below */}
          <p className="mt-16 font-heading text-lg font-semibold text-white/80 text-center">{tagline}</p>
          {userProfile?.name && (
            <p className="font-body text-sm text-white/30 text-center">
              {userProfile.name} · {userProfile.target_role ?? 'Role not set'}
            </p>
          )}
        </div>

        {/* Breakdown section */}
        <div>
          <div className="flex items-center gap-2 mb-5">
            <Trophy size={16} className="text-yellow-400" />
            <h2 className="font-heading font-semibold text-white/80">Score Breakdown</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <ScoreCard
              label="DSA Mastery"
              value={score?.dsa_score ?? 0}
              weight="30%"
              gradient="from-blue-500 to-cyan-500"
              icon={<Code2 size={14} />}
            />
            <ScoreCard
              label="Academic Score"
              value={score?.cgpa_score ?? 0}
              weight="20%"
              gradient="from-emerald-500 to-teal-500"
              icon={<TrendingUp size={14} />}
            />
            <ScoreCard
              label="Learning Progress"
              value={score?.course_score ?? 0}
              weight="20%"
              gradient="from-violet-500 to-purple-600"
              icon={<BookOpen size={14} />}
            />
            <ScoreCard
              label="Portfolio"
              value={score?.project_score ?? 0}
              weight="15%"
              gradient="from-orange-400 to-amber-500"
              icon={<Target size={14} />}
            />
            <ScoreCard
              label="Aptitude Prep"
              value={score?.aptitude_score ?? 0}
              weight="15%"
              gradient="from-pink-500 to-rose-500"
              icon={<Zap size={14} />}
            />
            <ScoreCard
              label="Overall Score"
              value={score?.score ?? 0}
              weight="100%"
              gradient="from-yellow-400 to-orange-500"
              icon={<Trophy size={14} />}
            />
          </div>
        </div>

        {/* Tips section */}
        {tips.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb size={16} className="text-yellow-400" />
              <h2 className="font-heading font-semibold text-white/80">Improvement Tips</h2>
            </div>
            <div className="space-y-3">
              {tips.map((tip, i) => (
                <div
                  key={i}
                  className="bg-white/3 border border-white/8 rounded-2xl px-5 py-4 flex items-start gap-3"
                >
                  <Lightbulb size={16} className="text-yellow-400 shrink-0 mt-0.5" />
                  <p className="font-body text-sm text-white/70 leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recalculate button */}
        <div className="flex justify-center pb-4">
          <Button
            onClick={handleRecalculate}
            disabled={recalcLoading}
            className="bg-white/10 hover:bg-white/15 text-white border border-white/10 rounded-xl font-body text-sm h-10 px-6 gap-2 transition-all"
          >
            {recalcLoading ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <RefreshCw size={14} />
            )}
            Recalculate Score
          </Button>
        </div>

      </main>
    </div>
  )
}

function ScoreCard({
  label,
  value,
  weight,
  gradient,
  icon,
}: {
  label: string
  value: number
  weight: string
  gradient: string
  icon: React.ReactNode
}) {
  const fillWidth = Math.min(Math.max(value, 0), 100)

  return (
    <div className="bg-white/3 border border-white/8 rounded-2xl p-4 space-y-3 hover:border-white/15 transition-colors">
      <div className={`inline-flex items-center gap-1.5 text-xs font-body bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
        <span className={`bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>{icon}</span>
        {label}
      </div>
      {/* Score bar */}
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${gradient} rounded-full transition-all duration-700`}
          style={{ width: `${fillWidth}%` }}
        />
      </div>
      <div className="flex items-center justify-between">
        <span className={`font-heading font-bold text-lg bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
          {value} <span className="text-sm font-normal text-white/30">/ 100</span>
        </span>
        <span className="font-body text-xs text-white/30">Weight: {weight}</span>
      </div>
    </div>
  )
}
