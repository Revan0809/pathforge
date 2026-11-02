'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import {
  CheckCircle2,
  Circle,
  SkipForward,
  RefreshCw,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Flame,
  Zap,
  TrendingUp,
} from 'lucide-react'
import { STRIVER_PROBLEMS } from '@/lib/backend/data'

const BACKEND = '/api/backend'
const PAGE_SIZE = 20

// ─── Types ──────────────────────────────────────────────────────────────────

interface Sheet {
  id: string
  name: string
  total_problems: number
}

interface Problem {
  id: string
  title: string
  topic: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  lc_link: string
  order_index: number
}

interface Progress {
  problem_id: string
  status: Status
}

type Status = 'pending' | 'solved' | 'skip' | 'revisit'

interface ProblemWithStatus extends Problem {
  status: Status
}

interface TopicStats {
  solved: number
  skip: number
  revisit: number
  total?: number
}

interface StatsResponse {
  total_solved: number
  by_topic: Record<string, TopicStats>
}

interface XpPopup {
  id: number
  x: number
  y: number
}

// ─── Constants ──────────────────────────────────────────────────────────────

const STATUS_CYCLE: Record<Status, Status> = {
  pending: 'solved',
  solved: 'skip',
  skip: 'revisit',
  revisit: 'pending',
}

const TOPIC_COLORS: Record<string, string> = {
  Arrays: 'bg-blue-500',
  Array: 'bg-blue-500',
  Strings: 'bg-purple-500',
  String: 'bg-purple-500',
  Trees: 'bg-green-500',
  Tree: 'bg-green-500',
  Graphs: 'bg-orange-500',
  Graph: 'bg-orange-500',
  DP: 'bg-pink-500',
  'Dynamic Programming': 'bg-pink-500',
  'Linked List': 'bg-cyan-500',
  'Binary Search': 'bg-indigo-500',
  Stacks: 'bg-yellow-500',
  Stack: 'bg-yellow-500',
  Recursion: 'bg-rose-500',
  Heap: 'bg-emerald-500',
  Trie: 'bg-violet-500',
  Backtracking: 'bg-amber-500',
  Greedy: 'bg-teal-500',
  'Sliding Window': 'bg-sky-500',
  'Two Pointers': 'bg-lime-500',
  'Bit Manipulation': 'bg-fuchsia-500',
  Math: 'bg-red-500',
  default: 'bg-white/30',
}

const TOPIC_RING_COLORS: Record<string, string> = {
  Arrays: 'ring-blue-500/30',
  Array: 'ring-blue-500/30',
  Strings: 'ring-purple-500/30',
  String: 'ring-purple-500/30',
  Trees: 'ring-green-500/30',
  Tree: 'ring-green-500/30',
  Graphs: 'ring-orange-500/30',
  Graph: 'ring-orange-500/30',
  DP: 'ring-pink-500/30',
  'Dynamic Programming': 'ring-pink-500/30',
  'Linked List': 'ring-cyan-500/30',
  'Binary Search': 'ring-indigo-500/30',
  Stacks: 'ring-yellow-500/30',
  Stack: 'ring-yellow-500/30',
  Recursion: 'ring-rose-500/30',
  Heap: 'ring-emerald-500/30',
  default: 'ring-white/10',
}

function getTopicColor(topic: string): string {
  return TOPIC_COLORS[topic] ?? TOPIC_COLORS.default
}

function getTopicRing(topic: string): string {
  return TOPIC_RING_COLORS[topic] ?? TOPIC_RING_COLORS.default
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b border-white/5 animate-pulse">
      <div className="w-6 h-6 rounded-full bg-white/10 shrink-0" />
      <div className="flex-1 h-4 bg-white/10 rounded-lg" />
      <div className="w-16 h-5 bg-white/10 rounded-full" />
      <div className="w-20 h-4 bg-white/10 rounded" />
      <div className="w-6 h-6 bg-white/10 rounded" />
    </div>
  )
}

function StatusIcon({ status }: { status: Status }) {
  if (status === 'solved')
    return <CheckCircle2 size={20} className="text-emerald-400" />
  if (status === 'skip')
    return <SkipForward size={20} className="text-amber-400" />
  if (status === 'revisit')
    return <RefreshCw size={20} className="text-orange-400" />
  return <Circle size={20} className="text-white/25" />
}

function DifficultyBadge({ difficulty }: { difficulty: Problem['difficulty'] }) {
  const map: Record<string, string> = {
    Easy: 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30',
    Medium: 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30',
    Hard: 'bg-red-500/15 text-red-400 ring-1 ring-red-500/30',
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-body font-medium ${map[difficulty] ?? ''}`}>
      {difficulty}
    </span>
  )
}

// ─── Completion Ring ────────────────────────────────────────────────────────

function CompletionRing({ pct }: { pct: number }) {
  const r = 28
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  return (
    <svg width="72" height="72" className="-rotate-90">
      <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
      <circle
        cx="36"
        cy="36"
        r={r}
        fill="none"
        stroke="#3b82f6"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        style={{ transition: 'stroke-dasharray 0.8s ease' }}
      />
    </svg>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function DSAPage() {
  const [token, setToken] = useState('')
  const [sheets, setSheets] = useState<Sheet[]>([])
  const [activeSheet, setActiveSheet] = useState<Sheet | null>(null)
  const [problems, setProblems] = useState<ProblemWithStatus[]>([])

  const [loadingProblems, setLoadingProblems] = useState(false)
  const [initialLoad, setInitialLoad] = useState(true)

  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | Status>('all')
  const [topicFilter, setTopicFilter] = useState<string>('all')
  const [page, setPage] = useState(1)

  // XP
  const [xp, setXp] = useState(0)
  const [xpPopups, setXpPopups] = useState<XpPopup[]>([])
  const xpPopupId = useRef(0)
  const streakDays = 7 // placeholder — could be fetched from backend

  // ── Auth + initial data load ──────────────────────────────────────────────

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getSession()
      const session = data?.session
      const tok = session?.access_token ?? 'demo-token'
      setToken(tok)

      const defaultSheet: Sheet = { id: 'sheet-striver', name: "Striver's A2Z DSA Sheet", total_problems: 455 }

      try {
        const [sheetsRes, statsRes] = await Promise.all([
          fetch(`${BACKEND}/dsa/sheets`, {
            headers: { Authorization: `Bearer ${tok}` },
          }),
          fetch(`${BACKEND}/dsa/stats`, {
            headers: { Authorization: `Bearer ${tok}` },
          }),
        ])

        if (sheetsRes.ok) {
          const sheetData: Sheet[] = await sheetsRes.json()
          if (sheetData.length > 0) {
            setSheets(sheetData)
            setActiveSheet(sheetData[0])
          } else {
            setSheets([defaultSheet])
            setActiveSheet(defaultSheet)
          }
        } else {
          setSheets([defaultSheet])
          setActiveSheet(defaultSheet)
        }

        if (statsRes.ok) {
          const statsData: StatsResponse = await statsRes.json()
          setXp((statsData.total_solved || 0) * 10)
        } else {
          setXp(380)
        }
      } catch {
        setSheets([defaultSheet])
        setActiveSheet(defaultSheet)
        setXp(380)
      }
      setInitialLoad(false)
    }
    init()
  }, [])

  // ── Load problems when sheet changes ─────────────────────────────────────

  const loadProblems = useCallback(
    async (sheet: Sheet, tok: string) => {
      setLoadingProblems(true)
      setPage(1)
      setStatusFilter('all')
      setTopicFilter('all')
      try {
        const [problemsRes, progressRes] = await Promise.all([
          fetch(`${BACKEND}/dsa/sheets/${sheet.id}/problems`, {
            headers: { Authorization: `Bearer ${tok}` },
          }),
          fetch(`${BACKEND}/dsa/my-progress`, {
            headers: { Authorization: `Bearer ${tok}` },
          }),
        ])

        if (!problemsRes.ok) throw new Error('problems fetch failed')

        const problemData: Problem[] = await problemsRes.json()
        const progressData: Progress[] = progressRes.ok ? await progressRes.json() : []

        const progressMap: Record<string, Status> = {}
        for (const p of progressData) {
          progressMap[p.problem_id] = p.status
        }

        const merged: ProblemWithStatus[] = problemData.map((p) => ({
          ...p,
          status: progressMap[p.id] ?? 'pending',
        }))

        merged.sort((a, b) => a.order_index - b.order_index)
        setProblems(merged.length > 0 ? merged : STRIVER_PROBLEMS.map(p => ({ ...p, status: 'pending' as Status })))
      } catch {
        setProblems(STRIVER_PROBLEMS.map(p => ({ ...p, status: 'pending' as Status })))
      }
      setLoadingProblems(false)
    },
    [],
  )

  useEffect(() => {
    if (activeSheet && token) {
      loadProblems(activeSheet, token)
    }
  }, [activeSheet, token, loadProblems])

  // ── Status toggle ─────────────────────────────────────────────────────────

  function handleStatusToggle(problemId: string, currentStatus: Status, e: React.MouseEvent) {
    const newStatus = STATUS_CYCLE[currentStatus]

    // Optimistic update
    setProblems((prev) =>
      prev.map((p) => (p.id === problemId ? { ...p, status: newStatus } : p)),
    )

    // Update stats optimistically
    if (newStatus === 'solved') {
      setXp((prev) => prev + 10)
      // Spawn XP popup
      const id = ++xpPopupId.current
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      setXpPopups((prev) => [...prev, { id, x: rect.left, y: rect.top }])
      setTimeout(() => {
        setXpPopups((prev) => prev.filter((p) => p.id !== id))
      }, 1200)
    }
    if (currentStatus === 'solved') {
      setXp((prev) => Math.max(0, prev - 10))
    }

    // Sync backend (fire-and-forget)
    fetch(`${BACKEND}/dsa/progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ problem_id: problemId, status: newStatus }),
    }).catch(() => {})
  }

  // ── Derived data ──────────────────────────────────────────────────────────

  const totalSolved = problems.filter((p) => p.status === 'solved').length
  const totalSkipped = problems.filter((p) => p.status === 'skip').length
  const totalRevisit = problems.filter((p) => p.status === 'revisit').length
  const completionPct =
    problems.length > 0 ? Math.round((totalSolved / problems.length) * 100) : 0

  // Topic breakdown
  const topicMap: Record<string, { total: number; solved: number; skip: number; revisit: number }> = {}
  for (const p of problems) {
    if (!topicMap[p.topic]) topicMap[p.topic] = { total: 0, solved: 0, skip: 0, revisit: 0 }
    topicMap[p.topic].total++
    if (p.status === 'solved') topicMap[p.topic].solved++
    else if (p.status === 'skip') topicMap[p.topic].skip++
    else if (p.status === 'revisit') topicMap[p.topic].revisit++
  }

  const topicsSorted = Object.entries(topicMap).sort((a, b) => {
    const progressA = a[1].total > 0 ? (a[1].solved + a[1].skip + a[1].revisit) / a[1].total : 0
    const progressB = b[1].total > 0 ? (b[1].solved + b[1].skip + b[1].revisit) / b[1].total : 0
    return progressB - progressA
  })

  const allTopics = Object.keys(topicMap)

  // Filtered problems
  const filtered = problems.filter((p) => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false
    if (topicFilter !== 'all' && p.topic !== topicFilter) return false
    return true
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen page-bg text-white">
      {/* XP Popups (fixed, pointer-events-none) */}
      {xpPopups.map((popup) => (
        <div
          key={popup.id}
          className="fixed z-50 pointer-events-none text-yellow-400 font-heading font-bold text-sm"
          style={{
            left: popup.x,
            top: popup.y,
            animation: 'xpFloat 1.2s ease-out forwards',
          }}
        >
          +10 XP
        </div>
      ))}

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between sticky top-0 nav-bg z-30">
        <div className="flex items-center gap-3">
          <a
            href="/dashboard"
            className="text-white/40 hover:text-white text-sm transition-colors"
          >
            ← Dashboard
          </a>
          <span className="text-white/20">/</span>
          <span className="text-white font-heading font-semibold">DSA Tracker</span>
        </div>

        <div className="flex items-center gap-4">
          {/* Streak */}
          <div className="flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 rounded-full">
            <Flame size={14} className="text-orange-400" />
            <span className="text-orange-300 text-sm font-heading font-semibold">
              {streakDays} day streak
            </span>
          </div>

          {/* XP Counter */}
          <div className="flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/20 px-3 py-1.5 rounded-full">
            <Zap size={14} className="text-yellow-400" />
            <span className="font-heading font-bold text-sm bg-gradient-to-r from-yellow-300 to-amber-400 bg-clip-text text-transparent">
              {xp.toLocaleString()} XP
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* ── Stats Row ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total Solved */}
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5 flex flex-col gap-2">
            <span className="text-white/40 text-xs font-body uppercase tracking-wider">Total Solved</span>
            <span className="font-heading text-4xl font-bold text-emerald-400">
              {totalSolved.toLocaleString()}
            </span>
            <div className="flex items-center gap-1 text-emerald-500/60 text-xs font-body">
              <TrendingUp size={11} />
              <span>out of {problems.length}</span>
            </div>
          </div>

          {/* Total Skipped */}
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5 flex flex-col gap-2">
            <span className="text-white/40 text-xs font-body uppercase tracking-wider">Skipped</span>
            <span className="font-heading text-4xl font-bold text-amber-400">
              {totalSkipped.toLocaleString()}
            </span>
            <span className="text-amber-500/60 text-xs font-body">problems skipped</span>
          </div>

          {/* Total Revisit */}
          <div className="bg-orange-500/5 border border-orange-500/20 rounded-2xl p-5 flex flex-col gap-2">
            <span className="text-white/40 text-xs font-body uppercase tracking-wider">To Revisit</span>
            <span className="font-heading text-4xl font-bold text-orange-400">
              {totalRevisit.toLocaleString()}
            </span>
            <span className="text-orange-500/60 text-xs font-body">need review</span>
          </div>

          {/* Completion % */}
          <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-5 flex items-center gap-4">
            <div className="relative shrink-0">
              <CompletionRing pct={completionPct} />
              <span className="absolute inset-0 flex items-center justify-center font-heading text-sm font-bold text-blue-400">
                {completionPct}%
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-white/40 text-xs font-body uppercase tracking-wider">
                Completion
              </span>
              <span className="font-heading text-lg font-semibold text-white">
                {completionPct}%
              </span>
              <span className="text-blue-500/60 text-xs font-body">of sheet done</span>
            </div>
          </div>
        </div>

        {/* ── Sheet Selector — only shown when >1 sheet exists ─────────────── */}
        {(initialLoad || sheets.length > 1) && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {initialLoad
                ? Array.from({ length: 1 }).map((_, i) => (
                    <div key={i} className="h-9 w-40 bg-white/10 rounded-xl animate-pulse" />
                  ))
                : sheets.map((sheet) => (
                    <button
                      key={sheet.id}
                      onClick={() => setActiveSheet(sheet)}
                      className={`px-4 py-2 rounded-xl text-sm font-heading font-medium transition-all ${
                        activeSheet?.id === sheet.id
                          ? 'bg-white text-black'
                          : 'bg-transparent border border-white/20 text-white/40 hover:text-white/70 hover:border-white/40'
                      }`}
                    >
                      {sheet.name} ({sheet.total_problems})
                    </button>
                  ))}
            </div>
          </div>
        )}

        {/* Active sheet summary */}
        {activeSheet && !loadingProblems && (
          <p className="text-white/30 text-sm font-body -mt-4">
            <span className="text-white/50 font-heading font-semibold">{activeSheet.name}</span>
            {' — '}
            <span className="text-white/60">{problems.length}</span> problems loaded ·{' '}
            <span className="text-emerald-400">{totalSolved} solved</span>
          </p>
        )}

        {/* ── Topic Progress Bars ────────────────────────────────────────────── */}
        {!loadingProblems && topicsSorted.length > 0 && (
          <div className="bg-white/3 border border-white/8 rounded-2xl p-6 space-y-4">
            <h2 className="font-heading font-semibold text-white/80 text-sm uppercase tracking-wider">
              Topic Progress
            </h2>
            <div className="grid gap-3 md:grid-cols-2">
              {topicsSorted.map(([topic, data]) => {
                const pct = data.total > 0 ? Math.round((data.solved / data.total) * 100) : 0
                const barColor = getTopicColor(topic)
                const ringColor = getTopicRing(topic)
                return (
                  <div
                    key={topic}
                    className={`flex items-center gap-3 bg-white/3 border border-white/5 hover:border-white/10 rounded-xl px-4 py-3 transition-colors ring-1 ${ringColor}`}
                  >
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-white/70 text-sm font-body truncate">{topic}</span>
                        <span className="text-white/40 text-xs font-body ml-2 shrink-0">
                          {data.solved} / {data.total}
                        </span>
                      </div>
                      <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${barColor} rounded-full transition-all duration-700 ease-out`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-white/30 text-xs font-heading font-semibold w-8 text-right shrink-0">
                      {pct}%
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Problem Table ──────────────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Filter bar */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Status pills */}
            <div className="flex gap-1.5 flex-wrap">
              {(
                [
                  ['all', 'All'],
                  ['pending', 'Unsolved'],
                  ['solved', 'Solved'],
                  ['skip', 'Skipped'],
                  ['revisit', 'Revisit'],
                ] as const
              ).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => {
                    setStatusFilter(val)
                    setPage(1)
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-heading font-medium transition-all ${
                    statusFilter === val
                      ? 'bg-white text-black'
                      : 'bg-white/5 border border-white/10 text-white/40 hover:text-white/70 hover:bg-white/10'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Topic dropdown */}
            {allTopics.length > 0 && (
              <select
                value={topicFilter}
                onChange={(e) => {
                  setTopicFilter(e.target.value)
                  setPage(1)
                }}
                className="bg-white/5 border border-white/10 text-white/60 text-xs font-body rounded-lg px-3 py-1.5 focus:outline-none focus:border-white/30 appearance-none cursor-pointer"
              >
                <option value="all" className="bg-black">
                  All Topics
                </option>
                {allTopics.map((t) => (
                  <option key={t} value={t} className="bg-black">
                    {t}
                  </option>
                ))}
              </select>
            )}

            <span className="text-white/25 text-xs font-body ml-auto">
              {filtered.length} problems
            </span>
          </div>

          {/* Table */}
          <div className="border border-white/8 rounded-2xl overflow-hidden">
            {/* Loading skeleton */}
            {loadingProblems && (
              <div>
                {Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonRow key={i} />
                ))}
              </div>
            )}

            {/* Empty state */}
            {!loadingProblems && problems.length === 0 && (
              <div className="py-16 text-center space-y-3">
                <div className="text-4xl">📭</div>
                <p className="text-white/50 font-body text-sm">No problems in this sheet yet.</p>
                <p className="text-white/25 font-body text-xs">
                  Pick another sheet or check back soon — new problem sets are added regularly.
                </p>
              </div>
            )}

            {/* No filter results */}
            {!loadingProblems && problems.length > 0 && filtered.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-white/40 font-body text-sm">No problems match the current filters.</p>
              </div>
            )}

            {/* Problem rows */}
            {!loadingProblems &&
              paginated.map((problem, idx) => (
                <ProblemRow
                  key={problem.id}
                  problem={problem}
                  idx={(page - 1) * PAGE_SIZE + idx + 1}
                  onToggle={handleStatusToggle}
                />
              ))}
          </div>

          {/* Pagination */}
          {!loadingProblems && totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={14} />
              </button>

              {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
                let pageNum: number
                if (totalPages <= 7) {
                  pageNum = i + 1
                } else if (page <= 4) {
                  pageNum = i + 1
                } else if (page >= totalPages - 3) {
                  pageNum = totalPages - 6 + i
                } else {
                  pageNum = page - 3 + i
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-8 h-8 text-xs font-heading font-medium rounded-lg transition-all ${
                      page === pageNum
                        ? 'bg-white text-black'
                        : 'bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* CSS for XP float animation */}
      <style jsx global>{`
        @keyframes xpFloat {
          0% {
            opacity: 1;
            transform: translateY(0px) scale(1);
          }
          60% {
            opacity: 1;
            transform: translateY(-28px) scale(1.15);
          }
          100% {
            opacity: 0;
            transform: translateY(-48px) scale(0.9);
          }
        }
      `}</style>
    </div>
  )
}

// ─── Problem Row (memoized) ──────────────────────────────────────────────────

function ProblemRow({
  problem,
  idx,
  onToggle,
}: {
  problem: ProblemWithStatus
  idx: number
  onToggle: (id: string, status: Status, e: React.MouseEvent) => void
}) {
  const isSolved = problem.status === 'solved'

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 border-b border-white/5 last:border-b-0 hover:bg-white/[0.03] transition-colors group ${
        isSolved ? 'opacity-60' : ''
      }`}
    >
      {/* Row number */}
      <span className="text-white/15 text-xs font-body w-6 text-right shrink-0 group-hover:text-white/25 transition-colors">
        {idx}
      </span>

      {/* Status toggle */}
      <button
        onClick={(e) => onToggle(problem.id, problem.status, e)}
        className="shrink-0 hover:scale-110 active:scale-95 transition-transform"
        title={`Status: ${problem.status} — click to cycle`}
      >
        <StatusIcon status={problem.status} />
      </button>

      {/* Title */}
      <span
        className={`flex-1 text-sm font-body min-w-0 truncate transition-colors ${
          isSolved ? 'line-through text-white/40' : 'text-white/85 group-hover:text-white'
        }`}
      >
        {problem.title}
      </span>

      {/* Difficulty */}
      <div className="shrink-0">
        <DifficultyBadge difficulty={problem.difficulty} />
      </div>

      {/* Topic tag */}
      <span className="hidden sm:block text-white/25 text-xs font-body shrink-0 max-w-[100px] truncate">
        {problem.topic}
      </span>

      {/* LeetCode link */}
      {problem.lc_link ? (
        <a
          href={problem.lc_link}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-white/20 hover:text-amber-400 transition-colors"
          title="Open on LeetCode"
        >
          <ExternalLink size={14} />
        </a>
      ) : (
        <div className="w-[14px] shrink-0" />
      )}
    </div>
  )
}
