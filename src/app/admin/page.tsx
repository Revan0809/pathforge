'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  Users, TrendingUp, Code2, Map, BookOpen,
  Crown, ChevronDown, ChevronUp, Search, LogOut,
} from 'lucide-react'
import { motion } from 'framer-motion'

interface StudentRow {
  id: string
  name: string
  email: string
  college: string
  branch: string
  semester: number
  target_role: string
  college_tier: string
  xp: number
  streak: number
  tier: string
  onboarding_complete: boolean
  created_at: string
  dsa_solved: number
  readiness_score: number | null
  has_roadmap: boolean
  course_completion_pct: number
}

type SortKey = 'name' | 'xp' | 'dsa_solved' | 'readiness_score' | 'streak' | 'created_at'

export default function AdminPage() {
  const [students, setStudents] = useState<StudentRow[]>([])
  const [filtered, setFiltered] = useState<StudentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('created_at')
  const [sortAsc, setSortAsc] = useState(false)
  const [roleFilter, setRoleFilter] = useState('All')

  useEffect(() => {
    async function load() {
      const { data: sessionData } = await supabase.auth.getSession()
      const session = sessionData?.session

      const res = await fetch('/api/admin', {
        headers: { Authorization: `Bearer ${session?.access_token ?? 'demo-token'}` },
      })
      if (res.status === 403) {
        setError('Access denied. Your email is not in the admin list.')
        setLoading(false)
        return
      }
      const data = await res.json()
      if (data.error) { setError(data.error); setLoading(false); return }
      setStudents(data.users)
      setFiltered(data.users)
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    let list = [...students]
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(
        (s) => s.name?.toLowerCase().includes(q) ||
               s.email?.toLowerCase().includes(q) ||
               s.college?.toLowerCase().includes(q)
      )
    }
    if (roleFilter !== 'All') list = list.filter((s) => s.target_role === roleFilter)
    list.sort((a, b) => {
      const av = a[sortKey] ?? (sortKey === 'readiness_score' ? -1 : 0)
      const bv = b[sortKey] ?? (sortKey === 'readiness_score' ? -1 : 0)
      if (typeof av === 'string' && typeof bv === 'string')
        return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av)
      return sortAsc ? (av as number) - (bv as number) : (bv as number) - (av as number)
    })
    setFiltered(list)
  }, [students, search, sortKey, sortAsc, roleFilter])

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((v) => !v)
    else { setSortKey(key); setSortAsc(false) }
  }

  const total = students.length
  const onboarded = students.filter((s) => s.onboarding_complete).length
  const premium = students.filter((s) => s.tier === 'premium').length
  const avgDSA = total ? Math.round(students.reduce((a, s) => a + s.dsa_solved, 0) / total) : 0
  const avgScore = total
    ? Math.round(students.filter((s) => s.readiness_score !== null).reduce((a, s) => a + (s.readiness_score ?? 0), 0) / Math.max(students.filter((s) => s.readiness_score !== null).length, 1))
    : 0
  const roles = ['All', ...Array.from(new Set(students.map((s) => s.target_role).filter(Boolean)))]

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k
      ? sortAsc ? <ChevronUp size={12} /> : <ChevronDown size={12} />
      : <ChevronDown size={12} className="opacity-20" />

  if (loading) return (
    <div className="min-h-screen page-bg flex items-center justify-center">
      <div className="flex gap-1">
        {[0, 150, 300].map((d) => (
          <span key={d} className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
        ))}
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen page-bg flex items-center justify-center p-6">
      <div className="bg-red-950/60 border border-red-700/50 rounded-2xl p-8 max-w-md text-center">
        <p className="text-red-400 text-sm mb-4">{error}</p>
        <a href="/dashboard" className="text-white/40 hover:text-white text-sm">← Back to dashboard</a>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen page-bg text-white">
      {/* Nav */}
      <nav className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a href="/dashboard" className="text-white/40 hover:text-white text-sm transition-colors">← Dashboard</a>
          <span className="text-white/20">/</span>
          <span className="font-heading font-semibold">Admin Panel</span>
          <span className="text-xs bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-full">Admin Only</span>
        </div>
        <button
          onClick={async () => { await supabase.auth.signOut(); window.location.href = '/auth' }}
          className="flex items-center gap-1.5 text-white/40 hover:text-white text-xs"
        >
          <LogOut size={12} /> Sign out
        </button>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Total Students', value: total, icon: <Users size={14} />, color: 'from-violet-500 to-purple-600' },
            { label: 'Onboarded', value: onboarded, icon: <TrendingUp size={14} />, color: 'from-emerald-500 to-teal-500' },
            { label: 'Premium', value: premium, icon: <Crown size={14} />, color: 'from-yellow-400 to-orange-500' },
            { label: 'Avg DSA Solved', value: avgDSA, icon: <Code2 size={14} />, color: 'from-blue-500 to-cyan-500' },
            { label: 'Avg Readiness', value: `${avgScore}%`, icon: <Map size={14} />, color: 'from-pink-500 to-rose-500' },
          ].map((s) => (
            <motion.div
              key={s.label}
              whileHover={{ y: -2 }}
              className="bg-white/3 border border-white/8 rounded-2xl p-4"
            >
              <div className={`inline-flex items-center gap-1.5 text-xs font-body bg-gradient-to-r ${s.color} bg-clip-text text-transparent mb-1`}>
                {s.icon} {s.label}
              </div>
              <p className={`font-heading text-2xl font-bold bg-gradient-to-r ${s.color} bg-clip-text text-transparent`}>{s.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, college..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {roles.map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  roleFilter === r
                    ? 'bg-violet-600 border-violet-500 text-white'
                    : 'bg-white/3 border-white/10 text-white/50 hover:border-white/30'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <span className="text-white/30 text-xs">{filtered.length} students</span>
        </div>

        {/* Table */}
        <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-white/40 text-xs uppercase tracking-wider">
                  {[
                    { label: 'Student', key: 'name' as SortKey },
                    { label: 'College / Role', key: null },
                    { label: 'XP', key: 'xp' as SortKey },
                    { label: 'Streak', key: 'streak' as SortKey },
                    { label: 'DSA', key: 'dsa_solved' as SortKey },
                    { label: 'Score', key: 'readiness_score' as SortKey },
                    { label: 'Joined', key: 'created_at' as SortKey },
                    { label: 'Status', key: null },
                  ].map((col) => (
                    <th
                      key={col.label}
                      onClick={col.key ? () => toggleSort(col.key!) : undefined}
                      className={`px-4 py-3 text-left font-body ${col.key ? 'cursor-pointer hover:text-white/60 select-none' : ''}`}
                    >
                      <span className="flex items-center gap-1">
                        {col.label}
                        {col.key && <SortIcon k={col.key} />}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-white/3 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-heading font-semibold text-white/90 text-sm">{s.name || '—'}</p>
                        <p className="text-white/30 text-xs font-body">{s.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-white/70 text-xs font-body">{s.college || '—'}</p>
                      <p className="text-white/30 text-xs">{s.target_role || '—'} · Sem {s.semester || '?'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-yellow-400 font-heading font-semibold">{s.xp}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-orange-400 font-heading">{s.streak}d</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-heading text-blue-400">{s.dsa_solved}</span>
                        <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min((s.dsa_solved / 150) * 100, 100)}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {s.readiness_score !== null ? (
                        <span className={`font-heading font-semibold ${s.readiness_score >= 70 ? 'text-emerald-400' : s.readiness_score >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {Math.round(s.readiness_score)}%
                        </span>
                      ) : <span className="text-white/20 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3 text-white/30 text-xs font-body">
                      {new Date(s.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {s.tier === 'premium' && (
                          <span className="text-[10px] bg-yellow-400/15 text-yellow-400 border border-yellow-400/30 px-1.5 py-0.5 rounded-full">PRO</span>
                        )}
                        {s.onboarding_complete && (
                          <span className="text-[10px] bg-emerald-400/15 text-emerald-400 border border-emerald-400/30 px-1.5 py-0.5 rounded-full">Onboarded</span>
                        )}
                        {s.has_roadmap && (
                          <span className="text-[10px] bg-violet-400/15 text-violet-400 border border-violet-400/30 px-1.5 py-0.5 rounded-full">Roadmap</span>
                        )}
                        {!s.onboarding_complete && (
                          <span className="text-[10px] bg-white/5 text-white/25 border border-white/10 px-1.5 py-0.5 rounded-full">Pending</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="py-12 text-center text-white/30 text-sm font-body">No students match your filters.</div>
            )}
          </div>
        </div>

      </main>
    </div>
  )
}
