'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import {
  BookOpen,
  Trash2,
  ExternalLink,
  Plus,
  ChevronDown,
  Zap,
  TrendingUp,
  CheckCircle2,
  Loader2,
  Sparkles,
} from 'lucide-react'

const BACKEND = '/api/backend'

// ─── Types ───────────────────────────────────────────────────────────────────

type Platform = 'Udemy' | 'YouTube' | 'NPTEL' | 'Coursera' | 'Other'

interface Course {
  id: string
  name: string
  url: string
  platform: Platform
  total_sections: number
  completed_sections: number
  last_updated: string
  velocity: number
  is_stale: boolean
  days_since_update: number
  estimated_finish: string | null
}

interface Recommendation {
  title: string
  url: string
  description: string
  why_recommended: string
  platform?: string
  match_score?: number
}

type Role = 'SDE' | 'ML Engineer' | 'Data Analyst' | 'DevOps'
type Topic = 'DSA' | 'System Design' | 'Machine Learning' | 'Web Dev' | 'Python' | 'SQL' | 'DevOps' | 'Statistics'

// ─── Constants ────────────────────────────────────────────────────────────────

const PLATFORM_STYLES: Record<Platform, { pill: string; label: string }> = {
  Udemy:    { pill: 'bg-orange-500/15 text-orange-400 ring-1 ring-orange-500/30', label: 'Udemy' },
  YouTube:  { pill: 'bg-red-500/15 text-red-400 ring-1 ring-red-500/30',         label: 'YouTube' },
  NPTEL:    { pill: 'bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/30',       label: 'NPTEL' },
  Coursera: { pill: 'bg-purple-500/15 text-purple-400 ring-1 ring-purple-500/30', label: 'Coursera' },
  Other:    { pill: 'bg-white/10 text-white/50 ring-1 ring-white/15',             label: 'Other' },
}

const ROLES: Role[] = ['SDE', 'ML Engineer', 'Data Analyst', 'DevOps']
const TOPICS: Topic[] = ['DSA', 'System Design', 'Machine Learning', 'Web Dev', 'Python', 'SQL', 'DevOps', 'Statistics']

function getProgressColor(pct: number): string {
  if (pct >= 100) return 'bg-emerald-500'
  if (pct >= 75)  return 'bg-purple-500'
  if (pct >= 50)  return 'bg-blue-500'
  if (pct >= 25)  return 'bg-orange-500'
  return 'bg-red-500'
}

function getProgressGlow(pct: number): string {
  if (pct >= 100) return 'shadow-emerald-500/40'
  if (pct >= 75)  return 'shadow-purple-500/40'
  if (pct >= 50)  return 'shadow-blue-500/40'
  if (pct >= 25)  return 'shadow-orange-500/40'
  return 'shadow-red-500/40'
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function computeSectionsCompletedToday(courses: Course[]): number {
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
  return courses.filter((c) => {
    const updated = new Date(c.last_updated).getTime()
    return updated >= oneDayAgo && c.completed_sections > 0
  }).length
}

function computeAvgCompletion(courses: Course[]): number {
  if (courses.length === 0) return 0
  const total = courses.reduce((sum, c) => {
    return sum + (c.total_sections > 0 ? Math.min(100, Math.round((c.completed_sections / c.total_sections) * 100)) : 0)
  }, 0)
  return Math.round(total / courses.length)
}

function formatEstimate(course: Course): string | null {
  if (!course.estimated_finish) return null
  // Try to parse and format nicely
  try {
    const d = new Date(course.estimated_finish)
    if (isNaN(d.getTime())) return course.estimated_finish
    const now = new Date()
    const diffMs = d.getTime() - now.getTime()
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
    if (diffDays <= 0) return 'Overdue'
    if (diffDays === 1) return 'Finishes in ~1 day'
    if (diffDays < 30) return `Finishes in ~${diffDays} days`
    return `Est. ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
  } catch {
    return course.estimated_finish
  }
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white/3 border border-white/8 rounded-2xl p-5 animate-pulse space-y-4">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-5 w-48 bg-white/10 rounded-lg" />
          <div className="h-4 w-20 bg-white/10 rounded-full" />
        </div>
        <div className="w-6 h-6 bg-white/10 rounded" />
      </div>
      <div className="h-2.5 bg-white/10 rounded-full" />
      <div className="flex justify-between">
        <div className="h-3 w-24 bg-white/10 rounded" />
        <div className="h-3 w-16 bg-white/10 rounded" />
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CoursesPage() {
  const [token, setToken] = useState('')
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [totalXp, setTotalXp] = useState(0)

  // Add form
  const [showForm, setShowForm] = useState(false)
  const [formName, setFormName] = useState('')
  const [formUrl, setFormUrl] = useState('')
  const [formPlatform, setFormPlatform] = useState<Platform>('Udemy')
  const [formSections, setFormSections] = useState<number>(10)
  const [submitting, setSubmitting] = useState(false)
  const [addError, setAddError] = useState('')

  // Progress updates
  const [progressInputs, setProgressInputs] = useState<Record<string, number>>({})
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [seeding, setSeeding] = useState(false)

  // RAG recommender
  const [ragRole, setRagRole] = useState<Role>('SDE')
  const [ragTopic, setRagTopic] = useState<Topic>('DSA')
  const [ragLoading, setRagLoading] = useState(false)
  const [ragResults, setRagResults] = useState<Recommendation[] | null>(null)
  const [ragError, setRagError] = useState('')

  // ── Auth + Load ─────────────────────────────────────────────────────────────

  const loadCourses = useCallback(async (tok: string) => {
    try {
      const res = await fetch(`${BACKEND}/courses/`, {
        headers: { Authorization: `Bearer ${tok}` },
      })
      if (res.ok) {
        const data: Course[] = await res.json()
        setCourses(data)
        // XP: 10 per completed section
        const xp = data.reduce((sum, c) => sum + c.completed_sections * 10, 0)
        setTotalXp(xp)
      }
    } catch {
      // backend may not be running
    }
  }, [])

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getSession()
      const session = data?.session
      const tok = session?.access_token ?? 'demo-token'
      setToken(tok)
      await loadCourses(tok)
      setLoading(false)
    }
    init()
  }, [loadCourses])

  // ── Initialise progress inputs when courses change ──────────────────────────

  useEffect(() => {
    setCourses((prev) => {
      setProgressInputs((inputs) => {
        const next = { ...inputs }
        for (const c of prev) {
          if (!(c.id in next)) next[c.id] = c.completed_sections
        }
        return next
      })
      return prev
    })
  }, [courses])

  // ── Add Course ──────────────────────────────────────────────────────────────

  async function handleAddCourse(e: React.FormEvent) {
    e.preventDefault()
    if (!formName.trim()) return
    setSubmitting(true)
    setAddError('')

    // Optimistic add
    const tempId = `temp-${Date.now()}`
    const optimistic: Course = {
      id: tempId,
      name: formName.trim(),
      url: formUrl.trim(),
      platform: formPlatform,
      total_sections: formSections,
      completed_sections: 0,
      last_updated: new Date().toISOString(),
      velocity: 0,
      is_stale: false,
      days_since_update: 0,
      estimated_finish: null,
    }
    setCourses((prev) => [optimistic, ...prev])
    setProgressInputs((prev) => ({ ...prev, [tempId]: 0 }))

    // Reset form
    const payload = { name: formName.trim(), url: formUrl.trim(), platform: formPlatform, total_sections: formSections }
    setFormName(''); setFormUrl(''); setFormPlatform('Udemy'); setFormSections(10)
    setShowForm(false)

    try {
      const res = await fetch(`${BACKEND}/courses/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        const created: Course = await res.json()
        setCourses((prev) => prev.map((c) => (c.id === tempId ? created : c)))
        setProgressInputs((prev) => {
          const next = { ...prev }
          delete next[tempId]
          next[created.id] = created.completed_sections
          return next
        })
      } else {
        const err = await res.json().catch(() => ({}))
        setCourses((prev) => prev.filter((c) => c.id !== tempId))
        setAddError(err?.detail || `Failed to add course (${res.status}). Make sure the backend is running.`)
        setShowForm(true)
      }
    } catch {
      setCourses((prev) => prev.filter((c) => c.id !== tempId))
      setAddError('Network hiccup while adding your course. Please check your connection and try again.')
      setShowForm(true)
    }
    setSubmitting(false)
  }

  // ── Update Progress ─────────────────────────────────────────────────────────

  async function handleUpdateProgress(course: Course) {
    const newVal = progressInputs[course.id] ?? course.completed_sections
    if (newVal === course.completed_sections) return
    setUpdatingId(course.id)

    // Optimistic update
    setCourses((prev) =>
      prev.map((c) =>
        c.id === course.id
          ? { ...c, completed_sections: newVal, last_updated: new Date().toISOString() }
          : c,
      ),
    )

    try {
      await fetch(`${BACKEND}/courses/${course.id}/progress`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ completed_sections: newVal }),
      })
      // Refresh to get updated velocity/estimate
      await loadCourses(token)
    } catch {
      // revert on error
      setCourses((prev) =>
        prev.map((c) =>
          c.id === course.id ? { ...c, completed_sections: course.completed_sections } : c,
        ),
      )
    }
    setUpdatingId(null)
  }

  // ── Delete ──────────────────────────────────────────────────────────────────

  async function handleDelete(id: string) {
    setDeletingId(id)
    // Optimistic
    const backup = courses.find((c) => c.id === id)
    setCourses((prev) => prev.filter((c) => c.id !== id))

    try {
      const res = await fetch(`${BACKEND}/courses/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok && backup) {
        setCourses((prev) => [backup, ...prev])
      }
    } catch {
      if (backup) setCourses((prev) => [backup, ...prev])
    }
    setDeletingId(null)
  }

  // ── Seed demo courses ───────────────────────────────────────────────────────

  async function handleSeedDemo() {
    setSeeding(true)
    try {
      const res = await fetch(`${BACKEND}/courses/seed-demo`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) await loadCourses(token)
    } catch { /* ignore */ }
    setSeeding(false)
  }

  // ── RAG Recommender ─────────────────────────────────────────────────────────

  async function handleRagRecommend() {
    setRagLoading(true)
    setRagResults(null)
    setRagError('')
    try {
      const res = await fetch(`${BACKEND}/rag/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role: ragRole, topic: ragTopic }),
      })
      if (res.ok) {
        const data = await res.json()
        setRagResults(data.results ?? data.recommendations ?? [])
      } else {
        setRagError('Could not fetch recommendations. Try again.')
      }
    } catch {
      setRagError('Could not load recommendations right now. Please try again.')
    }
    setRagLoading(false)
  }

  // ── Derived stats ───────────────────────────────────────────────────────────

  const activeCourses = courses.filter((c) => {
    const pct = c.total_sections > 0 ? (c.completed_sections / c.total_sections) * 100 : 0
    return pct < 100
  }).length
  const sectionsToday = computeSectionsCompletedToday(courses)
  const avgCompletion = computeAvgCompletion(courses)

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen page-bg text-white">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between sticky top-0 nav-bg z-30">
        <div className="flex items-center gap-3">
          <a href="/dashboard" className="text-white/40 hover:text-white text-sm transition-colors font-body">
            ← Dashboard
          </a>
          <span className="text-white/20">/</span>
          <span className="text-white font-heading font-semibold">Course Tracker</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Course count */}
          <div className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <BookOpen size={13} className="text-white/40" />
            <span className="text-white/60 text-sm font-body">{courses.length} course{courses.length !== 1 ? 's' : ''}</span>
          </div>
          {/* XP counter */}
          <div className="flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/20 px-3 py-1.5 rounded-full">
            <Zap size={13} className="text-yellow-400" />
            <span className="font-heading font-bold text-sm bg-gradient-to-r from-yellow-300 to-amber-400 bg-clip-text text-transparent">
              {totalXp.toLocaleString()} XP
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">

        {/* ── Stats Row ───────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Active Courses */}
          <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/10 border border-blue-500/20 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
              <BookOpen size={20} className="text-blue-400" />
            </div>
            <div>
              <p className="text-white/40 text-xs font-body uppercase tracking-wider">Active Courses</p>
              <p className="font-heading text-3xl font-bold text-blue-400">{loading ? '—' : activeCourses}</p>
              <p className="text-blue-500/50 text-xs font-body">in progress</p>
            </div>
          </div>

          {/* Sections Completed Today */}
          <div className="bg-gradient-to-br from-emerald-900/40 to-emerald-800/10 border border-emerald-500/20 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
              <CheckCircle2 size={20} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-white/40 text-xs font-body uppercase tracking-wider">Updated Today</p>
              <p className="font-heading text-3xl font-bold text-emerald-400">{loading ? '—' : sectionsToday}</p>
              <p className="text-emerald-500/50 text-xs font-body">courses updated in 24h</p>
            </div>
          </div>

          {/* Avg Completion */}
          <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/10 border border-purple-500/20 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0">
              <TrendingUp size={20} className="text-purple-400" />
            </div>
            <div>
              <p className="text-white/40 text-xs font-body uppercase tracking-wider">Avg Completion</p>
              <p className="font-heading text-3xl font-bold text-purple-400">{loading ? '—' : `${avgCompletion}%`}</p>
              <p className="text-purple-500/50 text-xs font-body">across all courses</p>
            </div>
          </div>
        </div>

        {/* ── Add Course Form ──────────────────────────────────────────────────── */}
        <div className="space-y-3">
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/15 bg-white/3 hover:bg-white/6 hover:border-white/25 text-white/60 hover:text-white text-sm font-heading font-medium transition-all"
          >
            <Plus size={15} className={`transition-transform duration-200 ${showForm ? 'rotate-45' : ''}`} />
            {showForm ? 'Cancel' : '+ Add Course'}
          </button>

          {showForm && (
            <form
              onSubmit={handleAddCourse}
              className="bg-white/3 border border-white/10 rounded-2xl p-5 space-y-4"
            >
              <h3 className="font-heading font-semibold text-white text-sm">New Course</h3>
              {addError && (
                <div className="bg-red-950/60 border border-red-700/40 rounded-xl px-3 py-2.5">
                  <p className="text-red-400 text-xs font-body">{addError}</p>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Course Name */}
                <div className="space-y-1.5">
                  <label className="text-white/40 text-xs font-body uppercase tracking-wider">Course Name *</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. The Complete React Developer"
                    required
                    className="w-full bg-white/5 border border-white/10 text-white text-sm font-body rounded-xl px-3 py-2.5 placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors"
                  />
                </div>

                {/* URL */}
                <div className="space-y-1.5">
                  <label className="text-white/40 text-xs font-body uppercase tracking-wider">URL (optional)</label>
                  <input
                    type="text"
                    value={formUrl}
                    onChange={(e) => setFormUrl(e.target.value)}
                    placeholder="https://udemy.com/course/..."
                    className="w-full bg-white/5 border border-white/10 text-white text-sm font-body rounded-xl px-3 py-2.5 placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors"
                  />
                </div>

                {/* Platform */}
                <div className="space-y-1.5">
                  <label className="text-white/40 text-xs font-body uppercase tracking-wider">Platform</label>
                  <select
                    value={formPlatform}
                    onChange={(e) => setFormPlatform(e.target.value as Platform)}
                    className="w-full bg-white/5 border border-white/10 text-white text-sm font-body rounded-xl px-3 py-2.5 focus:outline-none focus:border-white/30 appearance-none cursor-pointer transition-colors"
                  >
                    {(['Udemy', 'YouTube', 'NPTEL', 'Coursera', 'Other'] as Platform[]).map((p) => (
                      <option key={p} value={p} className="bg-[#0a0a0a] text-white">{p}</option>
                    ))}
                  </select>
                </div>

                {/* Total Sections */}
                <div className="space-y-1.5">
                  <label className="text-white/40 text-xs font-body uppercase tracking-wider">Total Sections</label>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={formSections}
                    onChange={(e) => setFormSections(Math.max(1, Math.min(500, parseInt(e.target.value) || 1)))}
                    className="w-full bg-white/5 border border-white/10 text-white text-sm font-body rounded-xl px-3 py-2.5 focus:outline-none focus:border-white/30 transition-colors"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting || !formName.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white text-black rounded-xl font-heading font-semibold text-sm hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  Add Course
                </button>
              </div>
            </form>
          )}
        </div>

        {/* ── Course Cards Grid ────────────────────────────────────────────────── */}
        <div className="space-y-4">
          <h2 className="font-heading text-xs text-white/40 uppercase tracking-widest">
            Your Courses
          </h2>

          {/* Loading skeletons */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
            </div>
          )}

          {/* Empty state with demo preview */}
          {!loading && courses.length === 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-white/30 text-xs font-body">Here&apos;s a preview of what your tracker will look like:</p>
                <button
                  onClick={handleSeedDemo}
                  disabled={seeding}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white/50 hover:text-white hover:border-white/20 text-xs font-heading transition-all disabled:opacity-40"
                >
                  {seeding ? <Loader2 size={11} className="animate-spin" /> : <Zap size={11} />}
                  {seeding ? 'Loading...' : 'Load sample courses'}
                </button>
              </div>
              {/* Demo preview cards — non-interactive */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pointer-events-none select-none opacity-60">
                {[
                  { name: "Striver's A2Z DSA Course", platform: "Other", done: 7, total: 20, pct: 35, vel: 0.8 },
                  { name: "The Complete React Developer", platform: "Udemy", done: 12, total: 30, pct: 40, vel: 1.2 },
                  { name: "Andrew Ng ML Specialization", platform: "Coursera", done: 4, total: 24, pct: 17, vel: 0.4 },
                ].map((demo, i) => (
                  <div key={i} className="bg-white/3 border border-dashed border-white/10 rounded-2xl p-5 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-2">
                        <h3 className="font-heading font-semibold text-white text-base">{demo.name}</h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-body font-medium ${PLATFORM_STYLES[demo.platform as Platform]?.pill ?? PLATFORM_STYLES.Other.pill}`}>
                          {demo.platform}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-white/40 text-xs">{demo.done} / {demo.total} sections</span>
                        <span className="text-xs font-heading font-semibold text-blue-400">{demo.pct}%</span>
                      </div>
                      <div className="h-2.5 bg-white/8 rounded-full overflow-hidden">
                        <div className={`h-full ${getProgressColor(demo.pct)} rounded-full`} style={{ width: `${demo.pct}%` }} />
                      </div>
                    </div>
                    <span className="text-emerald-400/80 text-xs">📈 {demo.vel} sections/day</span>
                  </div>
                ))}
              </div>
              <p className="text-white/20 text-xs font-body text-center pt-2">
                Click <strong className="text-white/40">&quot;Load sample courses&quot;</strong> to add real demo data, or use <strong className="text-white/40">&quot;+ Add Course&quot;</strong> to start fresh.
              </p>
            </div>
          )}

          {/* Cards */}
          {!loading && courses.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {courses.map((course) => {
                const pct = course.total_sections > 0
                  ? Math.min(100, Math.round((course.completed_sections / course.total_sections) * 100))
                  : 0
                const isComplete = pct >= 100
                const barColor = getProgressColor(pct)
                const barGlow = getProgressGlow(pct)
                const platformStyle = PLATFORM_STYLES[course.platform] ?? PLATFORM_STYLES.Other
                const estimate = formatEstimate(course)

                return (
                  <div
                    key={course.id}
                    className={`bg-white/3 border border-white/8 rounded-2xl p-5 space-y-4 transition-all hover:border-white/15 group relative ${isComplete ? 'opacity-70' : ''}`}
                  >
                    {/* Card header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0 space-y-2">
                        {/* Title row */}
                        <div className="flex items-start gap-2 flex-wrap">
                          <h3 className="font-heading font-semibold text-white text-base leading-snug break-words">
                            {course.name}
                          </h3>
                          {isComplete && (
                            <span className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-body ring-1 ring-emerald-500/30">
                              <CheckCircle2 size={10} /> Done
                            </span>
                          )}
                          {course.is_stale && !isComplete && (
                            <span className="shrink-0 px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 text-xs font-body ring-1 ring-orange-500/30">
                              🔔 {course.days_since_update}d no progress
                            </span>
                          )}
                        </div>

                        {/* Platform + URL */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-body font-medium ${platformStyle.pill}`}>
                            {platformStyle.label}
                          </span>
                          {course.url && (
                            <a
                              href={course.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-white/30 hover:text-white/70 transition-colors"
                              title="Open course URL"
                            >
                              <ExternalLink size={13} />
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Delete button */}
                      <button
                        onClick={() => handleDelete(course.id)}
                        disabled={deletingId === course.id}
                        className="opacity-0 group-hover:opacity-100 shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-white/25 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        title="Delete course"
                      >
                        {deletingId === course.id
                          ? <Loader2 size={13} className="animate-spin text-white/30" />
                          : <Trash2 size={13} />
                        }
                      </button>
                    </div>

                    {/* Progress bar */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-white/40 text-xs font-body">
                          {course.completed_sections} / {course.total_sections} sections
                        </span>
                        <span className={`text-xs font-heading font-semibold ${pct >= 100 ? 'text-emerald-400' : pct >= 75 ? 'text-purple-400' : pct >= 50 ? 'text-blue-400' : pct >= 25 ? 'text-orange-400' : 'text-red-400'}`}>
                          {pct}%
                        </span>
                      </div>
                      <div className="h-2.5 bg-white/8 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${barColor} rounded-full shadow-sm ${barGlow} transition-all duration-700 ease-out`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    {/* Velocity + estimate */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-xs font-body">
                        {course.velocity > 0 ? (
                          <span className="text-emerald-400/80">📈 {course.velocity.toFixed(1)} sections/day</span>
                        ) : (
                          <span className="text-white/25">⏸ No recent progress</span>
                        )}
                      </span>
                      {estimate && !isComplete && (
                        <span className="text-white/25 text-xs font-body">{estimate}</span>
                      )}
                    </div>

                    {/* Inline progress update */}
                    {!isComplete && (
                      <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                        <span className="text-white/30 text-xs font-body shrink-0">Update sections:</span>
                        <input
                          type="number"
                          min={0}
                          max={course.total_sections}
                          value={progressInputs[course.id] ?? course.completed_sections}
                          onChange={(e) =>
                            setProgressInputs((prev) => ({
                              ...prev,
                              [course.id]: Math.max(0, Math.min(course.total_sections, parseInt(e.target.value) || 0)),
                            }))
                          }
                          className="w-16 bg-white/5 border border-white/10 text-white text-sm font-body rounded-lg px-2 py-1 focus:outline-none focus:border-white/30 text-center transition-colors"
                        />
                        <button
                          onClick={() => handleUpdateProgress(course)}
                          disabled={
                            updatingId === course.id ||
                            (progressInputs[course.id] ?? course.completed_sections) === course.completed_sections
                          }
                          className="px-3 py-1 bg-white/8 hover:bg-white/15 border border-white/10 hover:border-white/25 text-white/60 hover:text-white text-xs font-heading font-medium rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1"
                        >
                          {updatingId === course.id && <Loader2 size={11} className="animate-spin" />}
                          Update
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── RAG Recommender Panel ────────────────────────────────────────────── */}
        <div className="bg-gradient-to-br from-violet-900/30 via-purple-900/20 to-blue-900/20 border border-violet-500/20 rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-violet-400" />
            <h2 className="font-heading font-semibold text-white">AI Resource Recommender</h2>
          </div>
          <p className="text-white/40 text-sm font-body -mt-2">
            Find the best curated learning resource for your role and topic — from 60+ hand-picked resources.
          </p>

          <div className="flex flex-wrap items-end gap-3">
            {/* Role dropdown */}
            <div className="space-y-1.5">
              <label className="text-white/40 text-xs font-body uppercase tracking-wider">Your Role</label>
              <div className="relative">
                <select
                  value={ragRole}
                  onChange={(e) => setRagRole(e.target.value as Role)}
                  className="bg-white/5 border border-white/10 text-white text-sm font-body rounded-xl px-3 py-2.5 pr-8 focus:outline-none focus:border-violet-500/50 appearance-none cursor-pointer transition-colors min-w-[140px]"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r} className="bg-[#0a0a0a] text-white">{r}</option>
                  ))}
                </select>
                <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
              </div>
            </div>

            {/* Topic dropdown */}
            <div className="space-y-1.5">
              <label className="text-white/40 text-xs font-body uppercase tracking-wider">Topic</label>
              <div className="relative">
                <select
                  value={ragTopic}
                  onChange={(e) => setRagTopic(e.target.value as Topic)}
                  className="bg-white/5 border border-white/10 text-white text-sm font-body rounded-xl px-3 py-2.5 pr-8 focus:outline-none focus:border-violet-500/50 appearance-none cursor-pointer transition-colors min-w-[160px]"
                >
                  {TOPICS.map((t) => (
                    <option key={t} value={t} className="bg-[#0a0a0a] text-white">{t}</option>
                  ))}
                </select>
                <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={handleRagRecommend}
              disabled={ragLoading}
              className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-heading font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {ragLoading
                ? <><Loader2 size={14} className="animate-spin" /> Searching...</>
                : <><Sparkles size={14} /> Find best resource</>
              }
            </button>
          </div>

          {/* Loading state */}
          {ragLoading && (
            <div className="flex items-center gap-3 py-4 text-violet-400/70 text-sm font-body">
              <Loader2 size={16} className="animate-spin" />
              Searching through 60+ curated resources...
            </div>
          )}

          {/* Error */}
          {ragError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm font-body">
              {ragError}
            </div>
          )}

          {/* Results */}
          {ragResults && ragResults.length === 0 && !ragLoading && (
            <div className="text-white/40 text-sm font-body py-3">
              No recommendations found for this combination. Try a different role or topic.
            </div>
          )}

          {ragResults && ragResults.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {ragResults.map((rec, i) => (
                <div
                  key={i}
                  className="bg-white/3 border border-white/8 hover:border-violet-500/30 rounded-xl p-4 space-y-2 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-heading font-semibold text-white text-sm leading-snug">{rec.title}</h4>
                    {rec.match_score !== undefined && (
                      <span className="shrink-0 px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-400 text-xs font-body ring-1 ring-violet-500/30">
                        {rec.match_score}% match
                      </span>
                    )}
                  </div>

                  {rec.platform && (
                    <span className="inline-block text-xs text-white/40 font-body bg-white/5 px-2 py-0.5 rounded-full">
                      {rec.platform}
                    </span>
                  )}

                  <p className="text-white/50 text-xs font-body leading-relaxed">{rec.description}</p>

                  {rec.why_recommended && (
                    <p className="text-violet-400/70 text-xs font-body italic leading-relaxed">
                      ✨ {rec.why_recommended}
                    </p>
                  )}

                  {rec.url && (
                    <a
                      href={rec.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-heading font-medium text-violet-400 hover:text-violet-300 transition-colors mt-1"
                    >
                      <ExternalLink size={11} /> Open Resource
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* CSS for animations */}
      <style jsx global>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
