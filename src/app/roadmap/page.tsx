'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Circle, SkipForward, ChevronDown, ChevronUp, Clock, ExternalLink, Loader2, ArrowRight, RefreshCw } from 'lucide-react'
import { FallbackBanner } from '@/components/ui/fallback-banner'

interface Task {
  id: string
  title: string
  type: string
  resource_link: string | null
  estimated_hours: number
  status: 'pending' | 'completed' | 'skipped'
  week_number: number
  description?: string
}

interface Week {
  week: number
  theme: string
  focus: string
  tasks: Task[]
}

const BACKEND = '/api/backend'

const TYPE_COLORS: Record<string, string> = {
  dsa:      'bg-blue-500/10 text-blue-400 border-blue-500/20',
  course:   'bg-purple-500/10 text-purple-400 border-purple-500/20',
  project:  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  aptitude: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  revision: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  mock:     'bg-pink-500/10 text-pink-400 border-pink-500/20',
  general:  'bg-white/10 text-white/50 border-white/10',
}

export default function RoadmapPage() {
  const [weeks, setWeeks] = useState<Week[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [token, setToken] = useState('')
  const [profile, setProfile] = useState<Record<string, unknown>>({})
  // planId managed via the state declared below
  const [openWeeks, setOpenWeeks] = useState<Set<number>>(new Set([1]))
  const [updatingTask, setUpdatingTask] = useState<string | null>(null)
  const [replanning, setReplanning] = useState(false)
  const [planId, setPlanId] = useState<string | null>(null)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [roadmapFallback, setRoadmapFallback] = useState(false)

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getSession()
      const session = data?.session
      const tok = session?.access_token ?? 'demo-token'
      setToken(tok)

      try {
        const { data: user } = await supabase
          .from('users')
          .select('*')
          .eq('id', session?.user?.id ?? 'demo-user-123')
          .single()
        if (user) setProfile(user)
      } catch { /* use default */ }

      await loadPlan(tok)
    }
    init()
  }, [])

  async function loadPlan(tok: string) {
    setLoading(true)
    try {
      const res = await fetch(`${BACKEND}/roadmap/my-plan`, {
        headers: { Authorization: `Bearer ${tok}` },
      })
      const data = await res.json()
      if (data && data.weeks_json) {
        setPlanId(data.id)
        const tasksFlat: Task[] = data.tasks || []
        const weekMap = new Map<number, Task[]>()
        tasksFlat.forEach(t => {
          if (!weekMap.has(t.week_number)) weekMap.set(t.week_number, [])
          weekMap.get(t.week_number)!.push(t)
        })

        const builtWeeks: Week[] = (data.weeks_json.weeks || []).map((w: { week: number; theme: string; focus: string }) => ({
          ...w,
          tasks: weekMap.get(w.week) || [],
        }))
        setWeeks(builtWeeks)
        // Open current week (first with any pending task)
        const currentWeek = builtWeeks.find(w => w.tasks.some(t => t.status === 'pending'))
        if (currentWeek) setOpenWeeks(new Set([currentWeek.week]))
      }
    } catch { /* backend not running */ }
    setLoading(false)
  }

  async function generateRoadmap() {
    setGenerating(true)
    setGenerateError(null)
    try {
      const res = await fetch(`${BACKEND}/roadmap/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role: profile.target_role || 'SDE', profile }),
      })
      const data = await res.json()
      if (!res.ok) {
        setGenerateError(data?.detail || 'Could not generate your roadmap right now. Please try again.')
      } else if (data.plan_id) {
        if (data.fallback_used) setRoadmapFallback(true)
        await loadPlan(token)
      } else {
        setGenerateError('Roadmap generated but plan ID missing — try again')
      }
    } catch {
      setGenerateError('Network hiccup while generating your roadmap. Please check your connection and try again.')
    }
    setGenerating(false)
  }

  async function updateTask(taskId: string, status: 'completed' | 'skipped' | 'pending') {
    setUpdatingTask(taskId)
    try {
      await fetch(`${BACKEND}/roadmap/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      })
      setWeeks(prev => prev.map(w => ({
        ...w,
        tasks: w.tasks.map(t => t.id === taskId ? { ...t, status } : t),
      })))
    } catch { /* ignore */ }
    setUpdatingTask(null)
  }

  async function handleReplan() {
    if (!planId || replanning) return
    setReplanning(true)
    try {
      // Current week = last week that has any completed task, else 1
      const completedTasks = weeks.flatMap(w => w.tasks.filter(t => t.status === 'completed'))
      const skippedTasks = weeks.flatMap(w => w.tasks.filter(t => t.status === 'skipped'))
      const maxCompletedWeek = completedTasks.length
        ? Math.max(...completedTasks.map(t => t.week_number))
        : 1

      const res = await fetch(`${BACKEND}/roadmap/replan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          plan_id: planId,
          current_week: maxCompletedWeek,
          completed_task_ids: completedTasks.map(t => t.id),
          skipped_task_ids: skippedTasks.map(t => t.id),
          profile,
        }),
      })
      if (res.ok) {
        await loadPlan(token)
      }
    } catch { /* ignore */ }
    setReplanning(false)
  }

  function toggleWeek(week: number) {
    setOpenWeeks(prev => {
      const next = new Set(prev)
      if (next.has(week)) next.delete(week)
      else next.add(week)
      return next
    })
  }

  function weekProgress(w: Week) {
    const total = w.tasks.length
    const done = w.tasks.filter(t => t.status === 'completed').length
    return total === 0 ? 0 : Math.round((done / total) * 100)
  }

  if (loading) {
    return (
      <div className="min-h-screen page-bg flex items-center justify-center">
        <Loader2 className="animate-spin text-white/40" size={32} />
      </div>
    )
  }

  return (
    <div className="min-h-screen page-bg text-white">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a href="/dashboard" className="text-white/40 hover:text-white text-sm transition-colors">← Dashboard</a>
          <span className="text-white/20">/</span>
          <span className="font-heading font-semibold text-white">My Roadmap</span>
        </div>
        {weeks.length > 0 && (
          <div className="text-right">
            <p className="text-white/30 text-xs font-body">
              {weeks.reduce((s, w) => s + w.tasks.filter(t => t.status === 'completed').length, 0)} /
              {weeks.reduce((s, w) => s + w.tasks.length, 0)} tasks done
            </p>
          </div>
        )}
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {roadmapFallback && <FallbackBanner />}
        {/* No plan state */}
        {weeks.length === 0 && (
          <div className="text-center py-24 space-y-6">
            <div className="text-6xl">🗺️</div>
            <div className="space-y-2">
              <h2 className="font-heading text-2xl font-semibold text-white">No roadmap yet</h2>
              <p className="font-body text-white/40 text-sm max-w-xs mx-auto">
                {profile.target_role
                  ? `Generate your personalised 16-week ${profile.target_role} roadmap`
                  : 'Complete the Role Compass first to get a personalised roadmap'}
              </p>
            </div>
            {generateError && (
              <div className="max-w-sm mx-auto bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-left">
                <p className="text-red-400 text-xs font-body leading-relaxed">{generateError}</p>
              </div>
            )}
            {profile.target_role ? (
              <Button
                onClick={generateRoadmap}
                disabled={generating}
                className="bg-white text-black hover:bg-white/90 font-heading font-semibold px-8 h-12 rounded-xl"
              >
                {generating ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                {generating ? 'Generating with AI... (takes ~15s)' : 'Generate my 16-week roadmap'}
                {!generating && <ArrowRight size={16} className="ml-2" />}
              </Button>
            ) : (
              <a href="/compass">
                <Button className="bg-white text-black hover:bg-white/90 font-heading font-semibold px-8 h-12 rounded-xl">
                  Take Role Compass first <ArrowRight size={16} className="ml-2" />
                </Button>
              </a>
            )}
          </div>
        )}

        {/* Roadmap weeks */}
        {weeks.length > 0 && (
          <div className="space-y-3">
            {generateError && (
              <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                <p className="text-red-400 text-xs font-body">{generateError}</p>
              </div>
            )}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="font-heading text-2xl font-bold text-white">
                  {String(profile.target_role || 'Your')} Roadmap
                </h1>
                <p className="font-body text-white/40 text-sm mt-0.5">16 weeks · personalised to your profile</p>
              </div>
              <div className="flex items-center gap-2">
                {/* Replan button — show when 3+ tasks are skipped */}
                {weeks.flatMap(w => w.tasks).filter(t => t.status === 'skipped').length >= 3 && (
                  <Button
                    onClick={handleReplan}
                    disabled={replanning}
                    className="bg-white/10 text-white hover:bg-white/20 text-xs h-8 rounded-lg border border-white/20 gap-1"
                  >
                    {replanning ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                    {replanning ? 'Replanning...' : 'Replan remaining'}
                  </Button>
                )}
                <Button
                  onClick={generateRoadmap}
                  disabled={generating}
                  variant="outline"
                  className="border-white/10 text-white/50 hover:text-white hover:border-white/30 text-xs h-8 rounded-lg bg-transparent"
                >
                  {generating ? <Loader2 size={12} className="animate-spin mr-1" /> : null}
                  Regenerate
                </Button>
              </div>
            </div>

            {weeks.map(week => {
              const prog = weekProgress(week)
              const isOpen = openWeeks.has(week.week)
              const allDone = prog === 100
              return (
                <div
                  key={week.week}
                  className={`border rounded-2xl overflow-hidden transition-all ${
                    allDone ? 'border-white/5 opacity-60' : 'border-white/10'
                  }`}
                >
                  {/* Week header */}
                  <button
                    onClick={() => toggleWeek(week.week)}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/3 transition-colors text-left"
                  >
                    <div className="flex items-center gap-4">
                      <span className={`font-heading font-bold text-sm w-8 ${allDone ? 'text-white/30' : 'text-white/40'}`}>
                        W{week.week}
                      </span>
                      <div>
                        <p className={`font-heading font-semibold text-sm ${allDone ? 'text-white/40' : 'text-white'}`}>
                          {week.theme}
                        </p>
                        <p className="font-body text-white/30 text-xs mt-0.5">{week.focus}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* Progress bar */}
                      <div className="hidden sm:flex items-center gap-2">
                        <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-white/50 rounded-full transition-all" style={{ width: `${prog}%` }} />
                        </div>
                        <span className="text-white/30 text-xs w-7 text-right">{prog}%</span>
                      </div>
                      {isOpen ? <ChevronUp size={16} className="text-white/30" /> : <ChevronDown size={16} className="text-white/30" />}
                    </div>
                  </button>

                  {/* Tasks */}
                  {isOpen && (
                    <div className="border-t border-white/5 divide-y divide-white/5">
                      {week.tasks.map(task => (
                        <div key={task.id} className={`flex items-start gap-3 px-5 py-3.5 transition-colors ${task.status === 'completed' ? 'opacity-40' : 'hover:bg-white/2'}`}>
                          {/* Status toggle */}
                          <button
                            onClick={() => updateTask(task.id, task.status === 'completed' ? 'pending' : 'completed')}
                            disabled={updatingTask === task.id}
                            className="mt-0.5 shrink-0 text-white/30 hover:text-white transition-colors"
                          >
                            {updatingTask === task.id
                              ? <Loader2 size={18} className="animate-spin" />
                              : task.status === 'completed'
                              ? <CheckCircle2 size={18} className="text-emerald-400" />
                              : task.status === 'skipped'
                              ? <SkipForward size={18} className="text-white/20" />
                              : <Circle size={18} />}
                          </button>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 flex-wrap">
                              <p className={`font-body text-sm ${task.status === 'completed' ? 'line-through text-white/30' : 'text-white/80'}`}>
                                {task.title}
                              </p>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className={`text-xs px-2 py-0.5 rounded-full border font-body ${TYPE_COLORS[task.type] || TYPE_COLORS.general}`}>
                                  {task.type}
                                </span>
                                <span className="text-white/20 text-xs flex items-center gap-1 font-body">
                                  <Clock size={10} /> {task.estimated_hours}h
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 mt-1.5">
                              {task.resource_link && (
                                <a
                                  href={task.resource_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-white/30 hover:text-white/60 text-xs flex items-center gap-1 font-body transition-colors"
                                >
                                  <ExternalLink size={10} /> Resource
                                </a>
                              )}
                              {task.status !== 'skipped' && task.status !== 'completed' && (
                                <button
                                  onClick={() => updateTask(task.id, 'skipped')}
                                  className="text-white/20 hover:text-white/40 text-xs font-body transition-colors"
                                >
                                  Skip
                                </button>
                              )}
                              {task.status === 'skipped' && (
                                <button
                                  onClick={() => updateTask(task.id, 'pending')}
                                  className="text-white/20 hover:text-white/40 text-xs font-body transition-colors"
                                >
                                  Undo skip
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}

                      {week.tasks.length === 0 && (
                        <div className="px-5 py-4 text-white/20 text-sm font-body">No tasks for this week</div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
