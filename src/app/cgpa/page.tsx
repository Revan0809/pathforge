'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import {
  Trash2,
  Loader2,
  ChevronDown,
  ChevronUp,
  Plus,
  TrendingUp,
  Target,
  BookOpen,
  Award,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Dot,
} from 'recharts'

const BACKEND = '/api/backend'

// Grade → grade points mapping
const GRADE_POINTS: Record<string, number> = {
  O: 10,
  'A+': 9,
  A: 8,
  'B+': 7,
  B: 6,
  C: 5,
  P: 4,
  F: 0,
}
const GRADE_OPTIONS = ['O', 'A+', 'A', 'B+', 'B', 'C', 'P', 'F']

interface Subject {
  id: string
  semester_id: string
  name: string
  credits: number
  grade: string
  grade_points: number
}

interface Semester {
  id: string
  number: number
  year: string
  subjects: Subject[]
}

interface Cutoff {
  company: string
  cutoff: number
}

interface SimulateResult {
  needed_grade_points: number
  achievable: boolean
  message: string
}

// Calculate GPA for a list of subjects
function calcGPA(subjects: Subject[]): number {
  if (!subjects || subjects.length === 0) return 0
  const totalCredits = subjects.reduce((s, sub) => s + sub.credits, 0)
  const totalPoints = subjects.reduce((s, sub) => s + sub.credits * sub.grade_points, 0)
  if (totalCredits === 0) return 0
  return totalPoints / totalCredits
}

// Calculate overall CGPA from all semesters
function calcCGPA(semesters: Semester[]): number {
  const allSubjects = semesters.flatMap((sem) => sem.subjects)
  return calcGPA(allSubjects)
}

// Color based on CGPA value
function cgpaColor(cgpa: number): string {
  if (cgpa < 6) return '#ef4444'
  if (cgpa < 7) return '#f97316'
  if (cgpa < 8) return '#eab308'
  if (cgpa < 9) return '#22c55e'
  return '#3b82f6'
}

function cgpaBarClass(cgpa: number): string {
  if (cgpa < 6) return 'bg-red-500'
  if (cgpa < 7) return 'bg-orange-500'
  if (cgpa < 8) return 'bg-yellow-500'
  if (cgpa < 9) return 'bg-green-500'
  return 'bg-blue-500'
}

// Loading skeleton
function SkeletonCard() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 animate-pulse space-y-3">
      <div className="h-4 bg-white/10 rounded w-1/3" />
      <div className="h-3 bg-white/10 rounded w-1/2" />
      <div className="h-3 bg-white/10 rounded w-2/3" />
    </div>
  )
}

// Custom tooltip for the line chart
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black border border-white/20 rounded-xl px-3 py-2 text-sm">
        <p className="text-white/50 font-body">{label}</p>
        <p className="font-heading font-bold text-white">{payload[0].value.toFixed(2)}</p>
      </div>
    )
  }
  return null
}

export default function CGPAPage() {
  const [token, setToken] = useState('')
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [cutoffs, setCutoffs] = useState<Cutoff[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedSems, setExpandedSems] = useState<Set<string>>(new Set())

  // Add semester form
  const [showAddSem, setShowAddSem] = useState(false)
  const [newSemNumber, setNewSemNumber] = useState(1)
  const [newSemYear, setNewSemYear] = useState(new Date().getFullYear().toString())
  const [addSemLoading, setAddSemLoading] = useState(false)

  // Add subject inline states per semester
  const [addSubjectState, setAddSubjectState] = useState<
    Record<string, { name: string; credits: number; grade: string }>
  >({})
  const [addSubjectLoading, setAddSubjectLoading] = useState<Record<string, boolean>>({})

  // Simulator
  const [targetCGPA, setTargetCGPA] = useState('')
  const [simResult, setSimResult] = useState<SimulateResult | null>(null)
  const [simLoading, setSimLoading] = useState(false)

  const authFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      return fetch(`${BACKEND}${url}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          ...(options.headers || {}),
        },
      })
    },
    [token]
  )

  // Initial load
  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getSession()
      const session = data?.session
      setToken(session?.access_token ?? 'demo-token')
    }
    init()
  }, [])

  useEffect(() => {
    if (!token) return
    async function loadData() {
      setLoading(true)
      try {
        const [semRes, cutoffRes] = await Promise.all([
          fetch(`${BACKEND}/cgpa/semesters`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${BACKEND}/cgpa/cutoffs`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ])
        if (semRes.ok) {
          const semData = await semRes.json()
          setSemesters(semData)
          if (semData.length > 0) {
            setExpandedSems(new Set([semData[semData.length - 1].id]))
          }
        }
        if (cutoffRes.ok) {
          const cutoffData = await cutoffRes.json()
          setCutoffs(cutoffData)
        }
      } catch {
        // backend may not be running; proceed with empty state
      }
      setLoading(false)
    }
    loadData()
  }, [token])

  // Toggle semester expand
  function toggleSem(id: string) {
    setExpandedSems((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Add semester
  async function handleAddSemester() {
    if (!newSemYear.trim()) return
    setAddSemLoading(true)
    // Optimistic
    const tempId = `temp-${Date.now()}`
    const optimistic: Semester = {
      id: tempId,
      number: newSemNumber,
      year: newSemYear,
      subjects: [],
    }
    setSemesters((prev) => [...prev, optimistic])
    setExpandedSems((prev) => new Set(Array.from(prev).concat([tempId])))
    setShowAddSem(false)

    try {
      const res = await authFetch('/cgpa/semesters', {
        method: 'POST',
        body: JSON.stringify({ number: newSemNumber, year: newSemYear }),
      })
      if (res.ok) {
        const created = await res.json()
        setSemesters((prev) =>
          prev.map((s) => (s.id === tempId ? { ...created, subjects: [] } : s))
        )
        setExpandedSems((prev) => {
          const next = new Set(prev)
          next.delete(tempId)
          next.add(created.id)
          return next
        })
      }
    } catch {
      // keep optimistic
    }
    setAddSemLoading(false)
  }

  // Delete semester
  async function handleDeleteSemester(semId: string) {
    setSemesters((prev) => prev.filter((s) => s.id !== semId))
    try {
      await authFetch(`/cgpa/semesters/${semId}`, { method: 'DELETE' })
    } catch {
      // silent
    }
  }

  // Add subject
  async function handleAddSubject(semId: string) {
    const state = addSubjectState[semId]
    if (!state || !state.name.trim()) return
    const gradePoints = GRADE_POINTS[state.grade] ?? 0

    const tempId = `temp-sub-${Date.now()}`
    const optimistic: Subject = {
      id: tempId,
      semester_id: semId,
      name: state.name.trim(),
      credits: state.credits,
      grade: state.grade,
      grade_points: gradePoints,
    }

    // Optimistic update
    setSemesters((prev) =>
      prev.map((s) =>
        s.id === semId ? { ...s, subjects: [...s.subjects, optimistic] } : s
      )
    )
    setAddSubjectState((prev) => ({
      ...prev,
      [semId]: { name: '', credits: 3, grade: 'O' },
    }))
    setAddSubjectLoading((prev) => ({ ...prev, [semId]: true }))

    try {
      const res = await authFetch('/cgpa/subjects', {
        method: 'POST',
        body: JSON.stringify({
          semester_id: semId,
          name: optimistic.name,
          credits: optimistic.credits,
          grade: optimistic.grade,
          grade_points: gradePoints,
        }),
      })
      if (res.ok) {
        const created = await res.json()
        setSemesters((prev) =>
          prev.map((s) =>
            s.id === semId
              ? {
                  ...s,
                  subjects: s.subjects.map((sub) =>
                    sub.id === tempId ? created : sub
                  ),
                }
              : s
          )
        )
      }
    } catch {
      // keep optimistic
    }
    setAddSubjectLoading((prev) => ({ ...prev, [semId]: false }))
  }

  // Delete subject
  async function handleDeleteSubject(semId: string, subId: string) {
    setSemesters((prev) =>
      prev.map((s) =>
        s.id === semId
          ? { ...s, subjects: s.subjects.filter((sub) => sub.id !== subId) }
          : s
      )
    )
    try {
      await authFetch(`/cgpa/subjects/${subId}`, { method: 'DELETE' })
    } catch {
      // silent
    }
  }

  // Update subject grade inline
  async function handleGradeChange(semId: string, subId: string, grade: string) {
    const gradePoints = GRADE_POINTS[grade] ?? 0
    setSemesters((prev) =>
      prev.map((s) =>
        s.id === semId
          ? {
              ...s,
              subjects: s.subjects.map((sub) =>
                sub.id === subId ? { ...sub, grade, grade_points: gradePoints } : sub
              ),
            }
          : s
      )
    )
    try {
      await authFetch(`/cgpa/subjects/${subId}`, {
        method: 'PATCH',
        body: JSON.stringify({ grade, grade_points: gradePoints }),
      })
    } catch {
      // silent
    }
  }

  // Simulate
  async function handleSimulate() {
    const target = parseFloat(targetCGPA)
    if (isNaN(target) || target < 0 || target > 10) return
    setSimLoading(true)
    try {
      const res = await authFetch('/cgpa/simulate', {
        method: 'POST',
        body: JSON.stringify({ target_cgpa: target }),
      })
      if (res.ok) {
        const data = await res.json()
        setSimResult(data)
      } else {
        setSimResult({ needed_grade_points: 0, achievable: false, message: 'Could not simulate.' })
      }
    } catch {
      setSimResult({ needed_grade_points: 0, achievable: false, message: 'Backend not reachable.' })
    }
    setSimLoading(false)
  }

  // Computed values
  const cgpa = calcCGPA(semesters)
  const totalSubjects = semesters.reduce((s, sem) => s + sem.subjects.length, 0)
  const totalSemesters = semesters.length

  const chartData = semesters
    .sort((a, b) => a.number - b.number)
    .map((sem) => ({
      name: `Sem ${sem.number}`,
      gpa: parseFloat(calcGPA(sem.subjects).toFixed(2)),
    }))
    .filter((d) => d.gpa > 0)

  const barPercent = Math.min((cgpa / 10) * 100, 100)

  return (
    <div className="min-h-screen page-bg text-white">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4 flex items-center gap-3">
        <a
          href="/dashboard"
          className="text-white/40 hover:text-white text-sm transition-colors font-body"
        >
          ← Dashboard
        </a>
        <span className="text-white/20">/</span>
        <span className="text-white font-heading font-semibold">CGPA Tracker</span>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {!loading && (
          <>
            {/* ── Section 1: CGPA Overview ── */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-5">
              {/* Top row: big CGPA + chart */}
              <div className="flex flex-col md:flex-row gap-6 items-start">
                {/* Left: CGPA number */}
                <div className="flex-shrink-0 space-y-2">
                  <p className="text-white/40 text-xs font-body uppercase tracking-widest">
                    Cumulative GPA
                  </p>
                  <div
                    className="font-heading font-black text-7xl bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent leading-none tabular-nums"
                    style={{
                      filter: 'drop-shadow(0 0 30px rgba(139,92,246,0.4))',
                    }}
                  >
                    {cgpa > 0 ? cgpa.toFixed(2) : '—'}
                  </div>
                  <p className="text-white/40 text-sm font-body">
                    based on{' '}
                    <span className="text-white/70">{totalSubjects} subject{totalSubjects !== 1 ? 's' : ''}</span>{' '}
                    across{' '}
                    <span className="text-white/70">{totalSemesters} semester{totalSemesters !== 1 ? 's' : ''}</span>
                  </p>

                  {/* Progress bar */}
                  <div className="w-48 space-y-1 pt-1">
                    <div className="flex justify-between text-xs text-white/30 font-body">
                      <span>0</span>
                      <span>10</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${cgpaBarClass(cgpa)}`}
                        style={{ width: `${barPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Right: Line chart */}
                <div className="flex-1 min-w-0">
                  {chartData.length >= 1 ? (
                    <div className="h-44">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                              <stop offset="0%" stopColor="#60a5fa" />
                              <stop offset="100%" stopColor="#a855f7" />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis
                            dataKey="name"
                            tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11, fontFamily: 'var(--font-body)' }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            domain={[0, 10]}
                            ticks={[0, 6, 7, 8, 9, 10]}
                            tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11, fontFamily: 'var(--font-body)' }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Line
                            type="monotone"
                            dataKey="gpa"
                            stroke="url(#lineGrad)"
                            strokeWidth={2.5}
                            dot={<Dot r={4} fill="#a855f7" stroke="#000" strokeWidth={2} />}
                            activeDot={{ r: 6, fill: '#60a5fa', stroke: '#000', strokeWidth: 2 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-44 flex items-center justify-center text-white/20 text-sm font-body">
                      <div className="text-center space-y-2">
                        <TrendingUp size={28} className="mx-auto opacity-30" />
                        <p>Add subjects to see your GPA trend</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Company cutoff pills */}
              {cutoffs.length > 0 && (
                <div className="border-t border-white/10 pt-4">
                  <p className="text-white/30 text-xs font-body uppercase tracking-wider mb-3">
                    Company Cutoffs
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {cutoffs.map((c) => {
                      const qualifies = cgpa >= c.cutoff
                      return (
                        <div
                          key={c.company}
                          className={`px-3 py-1.5 rounded-full text-xs font-body font-medium flex items-center gap-1.5 transition-all ${
                            qualifies
                              ? 'bg-green-500/15 text-green-400 border border-green-500/30'
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${qualifies ? 'bg-green-400' : 'bg-red-400'}`}
                          />
                          {c.company}
                          <span className="opacity-60">≥{c.cutoff}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* ── Section 2: Semester Cards ── */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-heading font-semibold text-white/80 flex items-center gap-2">
                  <BookOpen size={16} className="text-blue-400" />
                  Semesters
                </h2>
                <Button
                  onClick={() => setShowAddSem(true)}
                  className="bg-white/10 hover:bg-white/15 text-white border-0 rounded-xl text-sm h-9 px-4 font-body"
                >
                  <Plus size={14} className="mr-1.5" />
                  Add Semester
                </Button>
              </div>

              {/* Empty state */}
              {semesters.length === 0 && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center space-y-3">
                  <Award size={32} className="mx-auto text-white/20" />
                  <p className="font-heading text-white/50">No semesters yet.</p>
                  <p className="font-body text-white/30 text-sm">
                    Add your first semester to start tracking your CGPA.
                  </p>
                  <Button
                    onClick={() => setShowAddSem(true)}
                    className="mt-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white border-0 rounded-xl font-body"
                  >
                    <Plus size={14} className="mr-1.5" />
                    Add First Semester
                  </Button>
                </div>
              )}

              {/* Add semester inline form */}
              {showAddSem && (
                <div className="bg-white/5 border border-blue-500/30 rounded-2xl p-5 space-y-4">
                  <p className="font-heading font-semibold text-sm text-white/70">New Semester</p>
                  <div className="flex flex-wrap gap-3">
                    <div className="space-y-1">
                      <label className="text-white/40 text-xs font-body">Semester Number</label>
                      <select
                        value={newSemNumber}
                        onChange={(e) => setNewSemNumber(Number(e.target.value))}
                        className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm font-body focus:outline-none focus:border-white/30 w-36"
                      >
                        {Array.from({ length: 8 }, (_, i) => i + 1).map((n) => (
                          <option key={n} value={n} className="bg-black">
                            Semester {n}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-white/40 text-xs font-body">Year</label>
                      <input
                        type="text"
                        value={newSemYear}
                        onChange={(e) => setNewSemYear(e.target.value)}
                        placeholder="e.g. 2024"
                        className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm font-body focus:outline-none focus:border-white/30 w-28 placeholder:text-white/20"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleAddSemester}
                      disabled={addSemLoading}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white border-0 rounded-xl font-body text-sm h-9"
                    >
                      {addSemLoading ? <Loader2 size={14} className="animate-spin mr-1" /> : <Plus size={14} className="mr-1" />}
                      Add Semester
                    </Button>
                    <Button
                      onClick={() => setShowAddSem(false)}
                      className="bg-white/5 hover:bg-white/10 text-white/50 border-0 rounded-xl font-body text-sm h-9"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Semester cards */}
              {semesters
                .sort((a, b) => a.number - b.number)
                .map((sem) => {
                  const isOpen = expandedSems.has(sem.id)
                  const semGPA = calcGPA(sem.subjects)
                  const subState = addSubjectState[sem.id] || { name: '', credits: 3, grade: 'O' }

                  return (
                    <div
                      key={sem.id}
                      className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden transition-all"
                    >
                      {/* Card header */}
                      <div
                        className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-white/[0.03] transition-colors"
                        onClick={() => toggleSem(sem.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <span className="font-heading font-semibold text-white">
                              Semester {sem.number}
                            </span>
                            {sem.year && (
                              <span className="text-white/30 text-sm font-body">({sem.year})</span>
                            )}
                          </div>
                          {sem.subjects.length > 0 && (
                            <span className="text-xs font-body text-white/40">
                              {sem.subjects.length} subject{sem.subjects.length !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          {semGPA > 0 && (
                            <span
                              className="font-heading font-bold text-sm px-3 py-1 rounded-full border"
                              style={{
                                color: cgpaColor(semGPA),
                                borderColor: cgpaColor(semGPA) + '40',
                                backgroundColor: cgpaColor(semGPA) + '15',
                              }}
                            >
                              {semGPA.toFixed(2)} GPA
                            </span>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteSemester(sem.id)
                            }}
                            className="text-white/20 hover:text-red-400 transition-colors p-1"
                          >
                            <Trash2 size={14} />
                          </button>
                          {isOpen ? (
                            <ChevronUp size={16} className="text-white/40" />
                          ) : (
                            <ChevronDown size={16} className="text-white/40" />
                          )}
                        </div>
                      </div>

                      {/* Expanded content */}
                      {isOpen && (
                        <div className="border-t border-white/10 px-5 pb-4 pt-3 space-y-3">
                          {/* Subjects table */}
                          {sem.subjects.length > 0 && (
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="text-white/30 font-body text-xs uppercase tracking-wider">
                                    <th className="text-left pb-2 font-normal">Subject</th>
                                    <th className="text-center pb-2 font-normal w-20">Credits</th>
                                    <th className="text-center pb-2 font-normal w-24">Grade</th>
                                    <th className="text-center pb-2 font-normal w-20">Points</th>
                                    <th className="w-10 pb-2" />
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                  {sem.subjects.map((sub) => (
                                    <tr key={sub.id} className="group">
                                      <td className="py-2.5 pr-3 font-body text-white/80 text-sm">
                                        {sub.name}
                                      </td>
                                      <td className="text-center py-2.5 font-body text-white/50 text-sm">
                                        {sub.credits}
                                      </td>
                                      <td className="text-center py-2.5">
                                        <select
                                          value={sub.grade}
                                          onChange={(e) =>
                                            handleGradeChange(sem.id, sub.id, e.target.value)
                                          }
                                          className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white text-xs font-body focus:outline-none focus:border-white/30 cursor-pointer"
                                        >
                                          {GRADE_OPTIONS.map((g) => (
                                            <option key={g} value={g} className="bg-black">
                                              {g}
                                            </option>
                                          ))}
                                        </select>
                                      </td>
                                      <td className="text-center py-2.5">
                                        <span
                                          className="font-heading font-semibold text-sm"
                                          style={{ color: cgpaColor(sub.grade_points) }}
                                        >
                                          {sub.grade_points}
                                        </span>
                                      </td>
                                      <td className="text-center py-2.5">
                                        <button
                                          onClick={() => handleDeleteSubject(sem.id, sub.id)}
                                          className="text-white/0 group-hover:text-white/30 hover:!text-red-400 transition-colors p-1"
                                        >
                                          <Trash2 size={13} />
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}

                          {/* Add subject row */}
                          <div className="flex flex-wrap items-end gap-2 pt-1">
                            <div className="flex-1 min-w-32 space-y-1">
                              <label className="text-white/30 text-xs font-body">Subject Name</label>
                              <input
                                type="text"
                                value={subState.name}
                                onChange={(e) =>
                                  setAddSubjectState((prev) => ({
                                    ...prev,
                                    [sem.id]: { ...subState, name: e.target.value },
                                  }))
                                }
                                onKeyDown={(e) => e.key === 'Enter' && handleAddSubject(sem.id)}
                                placeholder="e.g. Data Structures"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm font-body focus:outline-none focus:border-white/30 placeholder:text-white/15 transition-colors"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-white/30 text-xs font-body">Credits</label>
                              <input
                                type="number"
                                min={1}
                                max={5}
                                value={subState.credits}
                                onChange={(e) =>
                                  setAddSubjectState((prev) => ({
                                    ...prev,
                                    [sem.id]: {
                                      ...subState,
                                      credits: Math.max(1, Math.min(5, Number(e.target.value))),
                                    },
                                  }))
                                }
                                className="w-20 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm font-body focus:outline-none focus:border-white/30 transition-colors"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-white/30 text-xs font-body">Grade</label>
                              <select
                                value={subState.grade}
                                onChange={(e) =>
                                  setAddSubjectState((prev) => ({
                                    ...prev,
                                    [sem.id]: { ...subState, grade: e.target.value },
                                  }))
                                }
                                className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm font-body focus:outline-none focus:border-white/30 cursor-pointer w-24 transition-colors"
                              >
                                {GRADE_OPTIONS.map((g) => (
                                  <option key={g} value={g} className="bg-black">
                                    {g} ({GRADE_POINTS[g]})
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-white/30 text-xs font-body">Points</label>
                              <div className="w-16 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-center font-heading font-semibold text-sm" style={{ color: cgpaColor(GRADE_POINTS[subState.grade] ?? 0) }}>
                                {GRADE_POINTS[subState.grade] ?? 0}
                              </div>
                            </div>
                            <Button
                              onClick={() => handleAddSubject(sem.id)}
                              disabled={addSubjectLoading[sem.id] || !subState.name.trim()}
                              className="bg-white/10 hover:bg-white/15 text-white border-0 rounded-xl font-body text-sm h-[38px] px-4 self-end"
                            >
                              {addSubjectLoading[sem.id] ? (
                                <Loader2 size={13} className="animate-spin" />
                              ) : (
                                <Plus size={13} className="mr-1" />
                              )}
                              Add
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
            </div>

            {/* ── Section 3: Simulator ── */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-5">
              <div className="flex items-center gap-2">
                <Target size={16} className="text-purple-400" />
                <h2 className="font-heading font-semibold text-white/80">Grade Simulator</h2>
              </div>

              <p className="text-white/40 text-sm font-body">
                Find out what grades you need this semester to hit your target CGPA.
              </p>

              <div className="flex flex-wrap items-end gap-3">
                <div className="space-y-1">
                  <label className="text-white/30 text-xs font-body">Target CGPA (0–10)</label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    step={0.1}
                    value={targetCGPA}
                    onChange={(e) => {
                      setTargetCGPA(e.target.value)
                      setSimResult(null)
                    }}
                    placeholder="e.g. 9.0"
                    className="w-36 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm font-body focus:outline-none focus:border-purple-500/50 placeholder:text-white/15 transition-colors"
                  />
                </div>
                <Button
                  onClick={handleSimulate}
                  disabled={simLoading || !targetCGPA}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white border-0 rounded-xl font-body text-sm h-[42px] px-5"
                >
                  {simLoading ? (
                    <Loader2 size={14} className="animate-spin mr-1.5" />
                  ) : (
                    <Target size={14} className="mr-1.5" />
                  )}
                  Simulate
                </Button>
              </div>

              {simResult && (
                <div
                  className={`rounded-xl p-4 border space-y-2 transition-all ${
                    simResult.achievable
                      ? 'bg-green-500/10 border-green-500/30'
                      : parseFloat(targetCGPA) <= 10
                      ? 'bg-orange-500/10 border-orange-500/30'
                      : 'bg-red-500/10 border-red-500/30'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        simResult.achievable ? 'bg-green-400' : 'bg-orange-400'
                      }`}
                    />
                    <p
                      className={`font-heading font-semibold text-sm ${
                        simResult.achievable ? 'text-green-400' : 'text-orange-400'
                      }`}
                    >
                      {simResult.achievable ? 'Achievable' : 'Stretch Goal'}
                    </p>
                  </div>
                  <p className="font-body text-white/70 text-sm">{simResult.message}</p>
                  {simResult.needed_grade_points > 0 && (
                    <p className="font-body text-white/50 text-xs">
                      Required grade points this semester:{' '}
                      <span
                        className="font-heading font-semibold"
                        style={{ color: cgpaColor(simResult.needed_grade_points) }}
                      >
                        {simResult.needed_grade_points.toFixed(2)}
                      </span>
                    </p>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
