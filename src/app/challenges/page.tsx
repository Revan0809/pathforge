'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import {
  Trophy,
  Plus,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Clock,
  Zap,
  X,
  Crown,
} from 'lucide-react'

const BACKEND = '/api/backend'

// ─── Types ────────────────────────────────────────────────────────────────────

type ChallengeType = 'dsa_count' | 'course_percent' | 'streak' | 'readiness_score'

interface Participant {
  user_id: string
  name: string
  progress: number
  is_current_user: boolean
}

interface Challenge {
  id: string
  title: string
  type: ChallengeType
  goal_value: number
  deadline: string
  participants: Participant[]
  xp_reward?: number
}

interface StatsData {
  active_count: number
  challenges_won: number
  total_xp: number
}

interface Friend {
  user_id: string
  name: string
  college: string
}

interface CreateForm {
  title: string
  type: ChallengeType
  goal_value: string
  deadline: string
  invited_friends: string[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<ChallengeType, { label: string; color: string; bg: string; description: string }> = {
  dsa_count: {
    label: 'DSA Count',
    color: 'text-blue-400',
    bg: 'bg-blue-500/20 border-blue-500/40',
    description: 'First to solve X LeetCode problems wins',
  },
  course_percent: {
    label: 'Course %',
    color: 'text-purple-400',
    bg: 'bg-purple-500/20 border-purple-500/40',
    description: 'First to complete X% of their course wins',
  },
  streak: {
    label: 'Streak',
    color: 'text-orange-400',
    bg: 'bg-orange-500/20 border-orange-500/40',
    description: 'Maintain a X-day coding streak to win',
  },
  readiness_score: {
    label: 'Readiness',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/20 border-emerald-500/40',
    description: 'First to reach X readiness score wins',
  },
}

function deadlineBadge(deadlineStr: string): { label: string; className: string } {
  const ms = new Date(deadlineStr).getTime() - Date.now()
  const days = ms / 86400000
  if (days < 0) return { label: 'Expired', className: 'bg-white/10 text-white/40 border-white/10' }
  if (days < 2) return { label: `${Math.ceil(days * 24)}h left`, className: 'bg-red-500/20 text-red-400 border-red-500/40' }
  if (days < 5) return { label: `${Math.ceil(days)}d left`, className: 'bg-amber-500/20 text-amber-400 border-amber-500/40' }
  return { label: `${Math.ceil(days)}d left`, className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' }
}

function progressPercent(progress: number, goal: number): number {
  return Math.min(100, Math.max(0, (progress / goal) * 100))
}

function sortedParticipants(participants: Participant[]): (Participant & { rank: number })[] {
  return [...participants]
    .sort((a, b) => b.progress - a.progress)
    .map((p, i) => ({ ...p, rank: i + 1 }))
}

function minDeadlineDate(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode
  label: string
  value: number | string
  accent: string
}) {
  return (
    <div className={`flex-1 bg-white/5 rounded-xl p-4 border border-white/10 flex flex-col gap-2`}>
      <div className={`w-9 h-9 rounded-lg ${accent} flex items-center justify-center`}>{icon}</div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-xs text-white/50">{label}</p>
      </div>
    </div>
  )
}

function SkeletonChallenge() {
  return (
    <div className="animate-pulse bg-white/5 rounded-2xl p-5 border border-white/10 space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-5 bg-white/10 rounded w-48" />
        <div className="h-5 bg-white/10 rounded w-20 ml-auto" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-white/10" />
            <div className="flex-1 h-3 bg-white/10 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Challenge Card ───────────────────────────────────────────────────────────

function ChallengeCard({
  challenge,
  currentUserId: _currentUserId,
}: {
  challenge: Challenge
  currentUserId: string
}) {
  const [expanded, setExpanded] = useState(false)
  const cfg = TYPE_CONFIG[challenge.type] ?? TYPE_CONFIG.dsa_count
  const badge = deadlineBadge(challenge.deadline)
  const ranked = sortedParticipants(challenge.participants)

  return (
    <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden hover:border-white/20 transition-colors">
      {/* Gradient top border */}
      <div className="h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

      <div className="p-5 space-y-4">
        {/* Title row */}
        <div className="flex items-start gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white text-base leading-snug">{challenge.title}</h3>
            <p className="text-xs text-white/40 mt-0.5">{cfg.description.replace('X', String(challenge.goal_value))}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
            <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${cfg.bg} ${cfg.color}`}>
              {cfg.label}
            </span>
            <span className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border font-medium ${badge.className}`}>
              <Clock size={10} />
              {badge.label}
            </span>
          </div>
        </div>

        {/* Leaderboard preview (top 3 or all if expanded) */}
        <div className="space-y-2">
          {(expanded ? ranked : ranked.slice(0, 3)).map((p) => {
            const pct = progressPercent(p.progress, challenge.goal_value)
            const isLeader = p.rank === 1
            return (
              <div
                key={p.user_id}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${p.is_current_user ? 'bg-blue-500/15 border border-blue-500/30' : 'bg-white/5'
                  }`}
              >
                <span
                  className={`text-xs font-bold w-5 text-center shrink-0 ${isLeader ? 'text-amber-400' : 'text-white/40'
                    }`}
                >
                  {isLeader ? <Crown size={13} className="text-amber-400 mx-auto" /> : `#${p.rank}`}
                </span>
                <span className="text-sm text-white font-medium flex-1 truncate min-w-0">
                  {p.name}
                  {p.is_current_user && (
                    <span className="ml-1.5 text-xs text-blue-400 font-normal">(you)</span>
                  )}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${isLeader ? 'bg-emerald-400' : 'bg-blue-400'
                        }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-white/50 w-10 text-right">
                    {p.progress}/{challenge.goal_value}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Expand / collapse */}
        {ranked.length > 3 && (
          <button
            onClick={() => setExpanded((x) => !x)}
            className="w-full flex items-center justify-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors py-1"
          >
            {expanded ? (
              <>
                <ChevronUp size={13} /> Hide leaderboard
              </>
            ) : (
              <>
                <ChevronDown size={13} /> View all {ranked.length} participants
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Create Modal ─────────────────────────────────────────────────────────────

function CreateModal({
  friends,
  onClose,
  onCreated,
  token,
}: {
  friends: Friend[]
  onClose: () => void
  onCreated: (c: Challenge) => void
  token: string
}) {
  const [form, setForm] = useState<CreateForm>({
    title: '',
    type: 'dsa_count',
    goal_value: '',
    deadline: minDeadlineDate(),
    invited_friends: [],
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const cfg = TYPE_CONFIG[form.type]

  function toggleFriend(uid: string) {
    setForm((f) => ({
      ...f,
      invited_friends: f.invited_friends.includes(uid)
        ? f.invited_friends.filter((x) => x !== uid)
        : [...f.invited_friends, uid],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim() || !form.goal_value || !form.deadline) {
      setError('Please fill in all required fields.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch(`${BACKEND}/challenges/create`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          type: form.type,
          goal_value: Number(form.goal_value),
          deadline: form.deadline,
          invited_user_ids: form.invited_friends,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.detail || 'Failed to create challenge.')
        return
      }
      const created: Challenge = await res.json()
      onCreated(created)
      onClose()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
    >
      <div className="bg-[#0f0f0f] border border-white/15 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Modal header */}
        <div className="h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h2 className="font-semibold text-white">Create Challenge</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs text-white/50 font-medium uppercase tracking-wide">
              Challenge Title *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. 30 LeetCode in 30 Days"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-blue-500/60 focus:bg-white/8 transition-all text-sm"
            />
          </div>

          {/* Type */}
          <div className="space-y-1.5">
            <label className="text-xs text-white/50 font-medium uppercase tracking-wide">
              Challenge Type *
            </label>
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as ChallengeType }))}
              className="w-full bg-[#0f0f0f] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500/60 transition-all text-sm appearance-none"
            >
              {(Object.keys(TYPE_CONFIG) as ChallengeType[]).map((k) => (
                <option key={k} value={k}>
                  {TYPE_CONFIG[k].label}
                </option>
              ))}
            </select>
            <p className="text-xs text-white/30 px-1">{cfg.description}</p>
          </div>

          {/* Goal value */}
          <div className="space-y-1.5">
            <label className="text-xs text-white/50 font-medium uppercase tracking-wide">
              Goal Value *
            </label>
            <input
              type="number"
              min={1}
              value={form.goal_value}
              onChange={(e) => setForm((f) => ({ ...f, goal_value: e.target.value }))}
              placeholder={
                form.type === 'course_percent'
                  ? 'e.g. 50 (percent)'
                  : form.type === 'streak'
                    ? 'e.g. 14 (days)'
                    : form.type === 'readiness_score'
                      ? 'e.g. 800 (score)'
                      : 'e.g. 30 (problems)'
              }
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-blue-500/60 focus:bg-white/8 transition-all text-sm"
            />
          </div>

          {/* Deadline */}
          <div className="space-y-1.5">
            <label className="text-xs text-white/50 font-medium uppercase tracking-wide">
              Deadline *
            </label>
            <input
              type="date"
              min={minDeadlineDate()}
              value={form.deadline}
              onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500/60 focus:bg-white/8 transition-all text-sm [color-scheme:dark]"
            />
          </div>

          {/* Invite friends */}
          {friends.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs text-white/50 font-medium uppercase tracking-wide">
                Invite Friends
              </label>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {friends.map((fr) => {
                  const selected = form.invited_friends.includes(fr.user_id)
                  return (
                    <button
                      key={fr.user_id}
                      type="button"
                      onClick={() => toggleFriend(fr.user_id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg border transition-all text-left ${selected
                          ? 'bg-blue-500/20 border-blue-500/40'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                    >
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${selected ? 'bg-blue-500 border-blue-500' : 'border-white/30'
                          }`}
                      >
                        {selected && (
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                      <span className="text-sm text-white font-medium truncate">{fr.name}</span>
                      <span className="text-xs text-white/40 truncate ml-auto">{fr.college}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 bg-transparent border-white/20 text-white/70 hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white border-0"
            >
              {submitting ? 'Creating...' : 'Create Challenge'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ChallengesPage() {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string>('')

  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<StatsData>({ active_count: 0, challenges_won: 0, total_xp: 0 })
  const [friends, setFriends] = useState<Friend[]>([])
  const [showModal, setShowModal] = useState(false)

  // ── Auth ─────────────────────────────────────────────────────────────────────

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const session = data?.session
      setToken(session?.access_token ?? 'demo-token')
      setCurrentUserId(session?.user?.id ?? 'demo-user-123')
    })
  }, [router])

  // ── Data fetching ─────────────────────────────────────────────────────────────

  const fetchChallenges = useCallback(async (tok: string) => {
    setLoading(true)
    try {
      // Trigger progress update then fetch
      await fetch(`${BACKEND}/challenges/update-all-progress`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tok}` },
      }).catch(() => null)

      const res = await fetch(`${BACKEND}/challenges/active`, {
        headers: { Authorization: `Bearer ${tok}` },
      })
      if (res.ok) {
        const data: Challenge[] = await res.json()
        setChallenges(data)

        // Compute stats from challenges
        const active_count = data.length
        const challenges_won = data.filter((c) => {
          const ranked = sortedParticipants(c.participants)
          return ranked[0]?.is_current_user
        }).length
        const total_xp = data.reduce((sum, c) => sum + (c.xp_reward ?? 0), 0)
        setStats({ active_count, challenges_won, total_xp })
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchFriends = useCallback(async (tok: string) => {
    try {
      const res = await fetch(`${BACKEND}/friends`, {
        headers: { Authorization: `Bearer ${tok}` },
      })
      if (res.ok) {
        const data = await res.json()
        setFriends(
          data.map((f: { user_id: string; name: string; college: string }) => ({
            user_id: f.user_id,
            name: f.name,
            college: f.college,
          }))
        )
      }
    } catch {
      // silently fail
    }
  }, [])

  useEffect(() => {
    if (!token) return
    fetchChallenges(token)
    fetchFriends(token)
  }, [token, fetchChallenges, fetchFriends])

  // ── Realtime: challenge_participants ──────────────────────────────────────────

  useEffect(() => {
    if (!token) return
    const channel = supabase
      .channel('challenge_participants_update')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'challenge_participants' },
        () => {
          // Re-fetch when any participant progress changes
          fetchChallenges(token)
        }
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [token, fetchChallenges])

  // ── Handlers ──────────────────────────────────────────────────────────────────

  function handleCreated(challenge: Challenge) {
    setChallenges((prev) => [challenge, ...prev])
    setStats((s) => ({ ...s, active_count: s.active_count + 1 }))
  }

  if (!token) return null

  return (
    <div className="min-h-screen page-bg text-white">
      {/* Header */}
      <div className="border-b border-white/10 nav-bg sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-1 text-white/50 hover:text-white transition-colors text-sm"
            >
              <ChevronLeft size={16} />
              Dashboard
            </button>
            <span className="text-white/30">/</span>
            <span className="font-semibold text-white">Challenges</span>
          </div>
          <Button
            onClick={() => setShowModal(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white border-0 text-sm px-4 py-2"
          >
            <Plus size={15} className="mr-1.5" />
            Create Challenge
          </Button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Stats row */}
        <div className="flex gap-3">
          <StatCard
            icon={<Trophy size={18} className="text-amber-400" />}
            label="Active Challenges"
            value={stats.active_count}
            accent="bg-amber-500/20"
          />
          <StatCard
            icon={<Crown size={18} className="text-purple-400" />}
            label="Challenges Won"
            value={stats.challenges_won}
            accent="bg-purple-500/20"
          />
          <StatCard
            icon={<Zap size={18} className="text-blue-400" />}
            label="XP from Challenges"
            value={stats.total_xp.toLocaleString()}
            accent="bg-blue-500/20"
          />
        </div>

        {/* Challenges list */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <SkeletonChallenge key={i} />
            ))}
          </div>
        ) : challenges.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <div className="text-6xl">🏆</div>
            <div className="space-y-2">
              <p className="font-semibold text-white/70">No active challenges</p>
              <p className="text-sm text-white/40">Create one and challenge your friends!</p>
            </div>
            <Button
              onClick={() => setShowModal(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white border-0 mt-2"
            >
              <Plus size={15} className="mr-1.5" />
              Create Challenge
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {challenges.map((c) => (
              <ChallengeCard key={c.id} challenge={c} currentUserId={currentUserId} />
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showModal && token && (
        <CreateModal
          friends={friends}
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
          token={token}
        />
      )}
    </div>
  )
}
