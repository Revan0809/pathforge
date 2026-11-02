'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import {
  Compass, Map, Calculator, Code2, BookOpen, Users,
  Flame, Zap, LogOut, Bell, Trophy, Crown,
  CheckCircle2, Clock, Target, GraduationCap, ShieldCheck,
  TrendingUp, ArrowRight, Plus, RotateCcw, Sparkles, ArrowUpRight,
  Quote, ChevronDown, ChevronUp, Building2, AlertCircle,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { DailyTask } from '@/app/api/tasks/today/route'
import { DashboardSkeleton } from '@/components/ui/skeleton'

// ─── Types ────────────────────────────────────────────────────────────────────
interface UserProfile {
  name: string; target_role: string; semester: number
  college: string; xp: number; streak: number; tier: string
}
interface Notification { id: string; message: string; read: boolean; created_at: string }

// ─── Module config — each with its own vivid identity ────────────────────────
const MODULES = [
  {
    icon: Compass, title: 'Role Compass', desc: 'Find your best-fit career path with AI',
    href: '/compass',
    from: '#FF6B35', to: '#FF8C42', shadow: 'rgba(255,107,53,0.35)',
    text: 'text-orange-100',
  },
  {
    icon: Map, title: 'My Roadmap', desc: '16-week personalised placement plan',
    href: '/roadmap',
    from: '#7C3AED', to: '#9F67FF', shadow: 'rgba(124,58,237,0.35)',
    text: 'text-violet-100',
  },
  {
    icon: Code2, title: 'DSA Tracker', desc: 'Striver A2Z — 455 problems + XP',
    href: '/dsa',
    from: '#0EA5E9', to: '#38BDF8', shadow: 'rgba(14,165,233,0.35)',
    text: 'text-sky-100',
  },
  {
    icon: Calculator, title: 'CGPA Calculator', desc: 'Calculate CGPA, check company cutoffs',
    href: '/cgpa',
    from: '#059669', to: '#34D399', shadow: 'rgba(5,150,105,0.35)',
    text: 'text-emerald-100',
  },
  {
    icon: BookOpen, title: 'Course Tracker', desc: 'Track courses with velocity metrics',
    href: '/courses',
    from: '#D97706', to: '#FCD34D', shadow: 'rgba(217,119,6,0.35)',
    text: 'text-amber-100',
  },
  {
    icon: Users, title: 'Friends', desc: 'Batchmates, activity feed & leaderboards',
    href: '/friends',
    from: '#DB2777', to: '#F472B6', shadow: 'rgba(219,39,119,0.35)',
    text: 'text-pink-100',
  },
  {
    icon: Flame, title: 'Challenges', desc: 'Create challenges, compete live',
    href: '/challenges',
    from: '#DC2626', to: '#F87171', shadow: 'rgba(220,38,38,0.35)',
    text: 'text-red-100',
  },
  {
    icon: Trophy, title: 'Readiness Score', desc: 'Full placement readiness breakdown',
    href: '/score',
    from: '#7C3AED', to: '#C084FC', shadow: 'rgba(192,132,252,0.30)',
    text: 'text-purple-100',
  },
  {
    icon: GraduationCap, title: 'CSE Subjects', desc: 'OS, DBMS, CN, OOP, System Design paths',
    href: '/subjects',
    from: '#0891B2', to: '#22D3EE', shadow: 'rgba(8,145,178,0.35)',
    text: 'text-cyan-100',
  },
  {
    icon: Building2, title: 'Company Intel', desc: 'Target company roadmap, past questions & gaps',
    href: '/company',
    from: '#7C3AED', to: '#DB2777', shadow: 'rgba(124,58,237,0.35)',
    text: 'text-purple-100',
  },
]

// ─── Interview Stories ────────────────────────────────────────────────────────
const STORIES = [
  {
    id: 1,
    name: 'Arjun Sharma',
    college: 'NIT Trichy',
    batch: '2024',
    company: 'Google',
    role: 'SDE-1, Bangalore',
    avatar: 'AS',
    avatarGrad: 'from-blue-500 to-cyan-400',
    companyColor: '#4285F4',
    companyBg: 'rgba(66,133,244,0.12)',
    companyBorder: 'rgba(66,133,244,0.25)',
    tagline: 'From Tier-2 college to Google — 8 months of focused prep',
    story: `I started prep in July 2023 with zero prior DSA knowledge. My college wasn't great for placements so I had to figure everything out myself. I followed Striver's A2Z sheet religiously — took me 5 months to complete it. The last 3 months were all about mock interviews and system design.

Google's process had 5 rounds: 2 DSA, 1 low-level design, 1 system design, and 1 Googleyness. The DSA rounds focused heavily on graphs and DP — both topics I almost skipped early on. My biggest mistake early on was solving too many easy problems instead of grinding mediums.`,
    tips: [
      'Do Striver A2Z completely — don\'t skip topics you find hard',
      'Practice explaining your thought process out loud while coding',
      'System design: start with requirements, then high-level, then deep dive',
      'Mock interviews are non-negotiable — at least 20 before the real thing',
      'Don\'t underestimate OS and CN — Google asks them in depth',
    ],
    ctc: '₹32 LPA',
    duration: '8 months prep',
  },
  {
    id: 2,
    name: 'Priya Nair',
    college: 'BITS Pilani',
    batch: '2024',
    company: 'Microsoft',
    role: 'SDE-1, Hyderabad',
    avatar: 'PN',
    avatarGrad: 'from-violet-500 to-purple-400',
    companyColor: '#00A4EF',
    companyBg: 'rgba(0,164,239,0.12)',
    companyBorder: 'rgba(0,164,239,0.25)',
    tagline: 'Cracked Microsoft with 3 failed attempts in semester 5',
    story: `I failed OA rounds twice before cracking Microsoft. Both times I panicked under time pressure. What changed the third time was that I stopped treating OA as a final exam and started treating every LeetCode problem as practice for OA conditions — timer on, no hints, write actual code in the editor.

Microsoft's interview had 3 technical rounds and 1 HR. Each round had 2 DSA problems and some OOPS/design questions. Round 3 was the hardest — the interviewer kept pushing follow-ups even after I solved the main problem. Stay calm, think out loud, never give up mid-problem.`,
    tips: [
      'Solve LeetCode with a timer — simulate real test conditions always',
      'OOPS concepts are heavily tested at Microsoft — master them thoroughly',
      'For every problem, discuss brute → better → optimal before coding',
      'Behavioural prep matters — have 5-6 STAR stories ready',
      'Failures are data points — debrief after every OA and interview',
    ],
    ctc: '₹26 LPA',
    duration: '6 months prep',
  },
  {
    id: 3,
    name: 'Rohit Verma',
    college: 'Amity University, Noida',
    batch: '2024',
    company: 'Amazon',
    role: 'SDE-1, Chennai',
    avatar: 'RV',
    avatarGrad: 'from-orange-500 to-yellow-400',
    companyColor: '#FF9900',
    companyBg: 'rgba(255,153,0,0.12)',
    companyBorder: 'rgba(255,153,0,0.25)',
    tagline: 'Tier-3 college, no internship — cracked Amazon in final year',
    story: `Everyone told me Amazon won't shortlist from my college. I didn't listen. I applied off-campus through Amazon's careers portal, got an OA, cleared it, and went through 4 interview rounds. The key insight: Amazon doesn't care about your college as much as your problem-solving and Leadership Principles.

Every single Amazon round had LP questions woven in. "Tell me about a time you disagreed with a manager" "When did you take ownership beyond your role?" — prepare these as seriously as DSA. I had 14 LP stories mapped to all 16 LPs. That preparation alone set me apart.`,
    tips: [
      'Apply off-campus aggressively — LinkedIn Easy Apply, careers portals, referrals',
      'Map your experiences to all 16 Amazon Leadership Principles with STAR format',
      'Amazon loves Trees, Graphs, and DP — focus 60% of DSA time here',
      'Have a GitHub with 2-3 solid projects — it comes up in HR rounds',
      'Cgpa < 7? Make up for it with DSA + projects + communication skills',
    ],
    ctc: '₹24 LPA',
    duration: '10 months prep',
  },
  {
    id: 4,
    name: 'Sneha Reddy',
    college: 'IIT Hyderabad',
    batch: '2023',
    company: 'Flipkart',
    role: 'SDE-1 → SDE-2 (promoted in 1 year)',
    avatar: 'SR',
    avatarGrad: 'from-yellow-400 to-orange-400',
    companyColor: '#F7BE00',
    companyBg: 'rgba(247,190,0,0.12)',
    companyBorder: 'rgba(247,190,0,0.25)',
    tagline: 'Rejected by 6 big techs before Flipkart — best thing that happened',
    story: `I got rejected by Google, Microsoft, Amazon, Uber, Swiggy, and Meesho before Flipkart. I'm not ashamed to say that anymore. Each rejection taught me something specific. After Amazon rejection (failed LP round), I rewrote all my stories. After Microsoft (failed system design), I spent 3 weeks doing nothing but system design.

Flipkart's process was 5 rounds over 2 days. Machine coding round was brutal — they gave me 90 minutes to build a working parking lot system in Java. I barely finished but my code was clean and OOP was solid. That round is what got me the offer.`,
    tips: [
      'Machine coding rounds: practice LLD in actual IDEs, not just on paper',
      'Rejections aren\'t stop signs — do a detailed debrief and fix the gap',
      'Strong DSA + weak LLD is very common — don\'t ignore design rounds',
      'Core subjects (DBMS, OS) are still tested in product companies — revise them',
      'Your first offer is rarely your best — keep grinding even after one offer',
    ],
    ctc: '₹22 LPA',
    duration: '12 months prep',
  },
  {
    id: 5,
    name: 'Karthik Iyer',
    college: 'PSG College of Technology',
    batch: '2024',
    company: 'Razorpay',
    role: 'SDE-1, Bangalore (Fintech)',
    avatar: 'KI',
    avatarGrad: 'from-emerald-500 to-teal-400',
    companyColor: '#2EB5C9',
    companyBg: 'rgba(46,181,201,0.12)',
    companyBorder: 'rgba(46,181,201,0.25)',
    tagline: 'Skipped FAANG rat race — targeted product startups strategically',
    story: `I made a deliberate choice not to chase FAANG. I wanted fast growth, ownership, and good pay without the 2-year grind that top companies demand. I targeted Series B–D startups: Razorpay, Zepto, CRED, and Groww. Got offers from all four.

Razorpay's process had a take-home assignment (build a payment link system in 3 hours), then 2 technical rounds heavily focused on that assignment. They cared less about classic LeetCode grinding and more about system thinking, code quality, and how you handle edge cases. I spent 4 hours on that assignment and it showed.`,
    tips: [
      'Product startups care about code quality and system thinking over raw DSA',
      'Take-home assignments: treat them like production code — clean, tested, documented',
      'Research the company\'s tech stack deeply — mention it in interviews',
      'Targeting 10-15 companies strategically beats applying to 100 randomly',
      'Negotiate hard — startup offers are often 20-30% negotiable at offer stage',
    ],
    ctc: '₹18 LPA + ESOPs',
    duration: '5 months prep',
  },
]

// ─── Tag colors ───────────────────────────────────────────────────────────────
const TAG: Record<string, string> = {
  blue:    'bg-sky-500/20 text-sky-300 border-sky-500/30',
  violet:  'bg-violet-500/20 text-violet-300 border-violet-500/30',
  purple:  'bg-purple-500/20 text-purple-300 border-purple-500/30',
  orange:  'bg-orange-500/20 text-orange-300 border-orange-500/30',
  emerald: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  rose:    'bg-rose-500/20 text-rose-300 border-rose-500/30',
  pink:    'bg-pink-500/20 text-pink-300 border-pink-500/30',
  cyan:    'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}
function formatDate() {
  return new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })
}
function timeAgo(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (d < 60) return `${d}m ago`
  if (d < 1440) return `${Math.floor(d / 60)}h ago`
  return `${Math.floor(d / 1440)}d ago`
}
function getTodayKey(uid: string) {
  return `pf_done_${uid}_${new Date().toISOString().split('T')[0]}`
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [userId, setUserId] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [showProfile, setShowProfile] = useState(false)
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState<DailyTask[]>([])
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())
  const [tasksLoading, setTasksLoading] = useState(true)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showNotifs, setShowNotifs] = useState(false)
  const [dsaSolved, setDsaSolved] = useState(0)
  const [readinessScore, setReadinessScore] = useState<number | null>(null)
  const [addingTask, setAddingTask] = useState(false)
  const [customTask, setCustomTask] = useState('')
  const BACKEND = '/api/backend'

  const loadCompleted = useCallback((uid: string) => {
    try {
      const raw = localStorage.getItem(getTodayKey(uid))
      if (raw) setCompletedIds(new Set(JSON.parse(raw)))
    } catch { /* ignore */ }
  }, [])

  const saveCompleted = useCallback((uid: string, ids: Set<string>) => {
    try { localStorage.setItem(getTodayKey(uid), JSON.stringify(Array.from(ids))) } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    async function init() {
      try {
        const sessionRes = await supabase.auth.getSession()
        const session = sessionRes.data?.session

        const defaultProfile: UserProfile = {
          name: 'Alex Sharma',
          target_role: 'SDE (Product & Fullstack)',
          semester: 6,
          college: 'Delhi Technological University (DTU)',
          xp: 1450,
          streak: 8,
          tier: 'premium',
        }

        const uid = session?.user?.id ?? 'demo-user-123'
        setUserId(uid)
        setUserEmail(session?.user?.email ?? 'student@pathforge.online')
        setAvatarUrl(session?.user?.user_metadata?.avatar_url ?? '')
        loadCompleted(uid)

        let profileData: UserProfile | null = null
        try {
          const { data } = await supabase.from('users')
            .select('name, target_role, semester, college, xp, streak, tier')
            .eq('id', uid).single()
          if (data) profileData = data
        } catch { /* use default */ }

        setUser(profileData || defaultProfile)
        setLoading(false)

        const tok = session?.access_token ?? 'demo-token'

        // Tasks — with timeout + graceful fallback
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), 8000)
        fetch('/api/tasks/today', { signal: controller.signal })
          .then(r => r.ok ? r.json() : Promise.reject(r.status))
          .then(d => { if (d.tasks) setTasks(d.tasks) })
          .catch(e => console.error('[Dashboard:tasks]', e))
          .finally(() => { clearTimeout(timer); setTasksLoading(false) })

        // DSA stats + readiness + notifications — all best-effort
        Promise.allSettled([
          fetch(`${BACKEND}/dsa/stats`, { headers: { Authorization: `Bearer ${tok}` }, signal: AbortSignal.timeout?.(8000) })
            .then(r => r.ok ? r.json() : Promise.reject())
            .then(d => setDsaSolved(d.total_solved ?? 0))
            .catch(() => { /* backend offline — skip silently */ }),

          fetch(`${BACKEND}/score/calculate`, { method: 'POST', headers: { Authorization: `Bearer ${tok}` }, signal: AbortSignal.timeout?.(8000) })
            .then(r => r.ok ? r.json() : Promise.reject())
            .then(d => { if (d.score !== undefined) setReadinessScore(d.score) })
            .catch(() => { /* backend offline — skip silently */ }),

          Promise.resolve(
            supabase.from('notifications').select('*')
              .eq('user_id', uid).eq('read', false)
              .order('created_at', { ascending: false }).limit(10)
          ).then(({ data: n }) => { if (n) setNotifications(n) })
           .catch(() => { /* notifications unavailable — skip silently */ }),
        ])
      } catch (err) {
        console.error('[Dashboard:init]', err)
        setLoading(false) // unblock UI even on total failure
      }
    }
    init()
  }, [loadCompleted, BACKEND])

  function toggleTask(id: string) {
    setCompletedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      saveCompleted(userId, next)
      return next
    })
  }
  function addCustomTask() {
    if (!customTask.trim()) return
    const t: DailyTask = {
      id: `custom-${Date.now()}`, title: customTask.trim(), subtitle: 'Custom task',
      category: 'meta', tag: 'Custom', tagColor: 'violet', xp: 10, minutes: 30, priority: 'medium',
    }
    setTasks(prev => [...prev, t])
    setCustomTask('')
    setAddingTask(false)
  }
  async function markNotifsRead() {
    await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false)
    setNotifications([])
  }

  if (loading) return (
    <div className="min-h-screen page-bg">
      <div className="max-w-6xl mx-auto px-4 py-24">
        <DashboardSkeleton />
      </div>
    </div>
  )

  const level = Math.floor((user?.xp ?? 0) / 500) + 1
  const xpProgress = ((user?.xp ?? 0) % 500) / 500
  const unread = notifications.length
  const doneCount = tasks.filter(t => completedIds.has(t.id)).length
  const totalXpToday = tasks.filter(t => completedIds.has(t.id)).reduce((a, t) => a + t.xp, 0)
  const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? '').split(',').map(e => e.trim())

  return (
    <div className="min-h-screen text-white relative overflow-x-hidden"
      style={{ background: 'linear-gradient(135deg, #1A0B2E 0%, #0D1B3E 55%, #1A0B2E 100%)' }}>

      {/* ── Background: grid + vivid orbs ───────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        {/* Subtle dot grid */}
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }} />
        {/* Orb 1 — hot orange top-left */}
        <motion.div animate={{ x: [0, 40, 0], y: [0, -25, 0] }} transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-40 -left-40 w-[700px] h-[700px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(255,107,53,0.28) 0%, transparent 65%)' }} />
        {/* Orb 2 — violet top-right */}
        <motion.div animate={{ x: [0, -30, 0], y: [0, 25, 0] }} transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-20 -right-40 w-[750px] h-[750px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.30) 0%, transparent 65%)' }} />
        {/* Orb 3 — sky blue bottom-center */}
        <motion.div animate={{ x: [0, 25, 0], y: [0, -20, 0] }} transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(14,165,233,0.18) 0%, transparent 65%)' }} />
        {/* Orb 4 — pink mid-left accent */}
        <motion.div animate={{ x: [0, -20, 0], y: [0, 30, 0] }} transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/2 -left-20 w-[400px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(219,39,119,0.12) 0%, transparent 65%)' }} />
      </div>

      {/* ── Floating Nav ──────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-50 px-4 pt-4 pb-2">
        <motion.nav initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.2, 0.7, 0.4, 1] }}
          className="max-w-6xl mx-auto flex items-center justify-between px-5 py-3 rounded-2xl border border-white/8"
          style={{ background: 'rgba(12,12,24,0.85)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 overflow-hidden"
              style={{ background: '#12102A', border: '1px solid rgba(124,58,237,0.35)' }}>
              <svg width="20" height="20" viewBox="0 0 90 90" fill="none">
                <polygon points="45,14 58,32 52,32 52,45 62,45 62,55 52,55 52,76 45,76 45,55 38,55 38,45 48,45 48,32 38,32" fill="#7C3AED"/>
                <path d="M30 52 C24 46 24 32 34 26" stroke="#C4B5FD" strokeWidth="5" strokeLinecap="round"/>
                <circle cx="30" cy="54" r="5" fill="#8B5CF6"/>
                <circle cx="45" cy="14" r="4" fill="#F59E0B"/>
                <circle cx="62" cy="45" r="3" fill="#06B6D4"/>
              </svg>
            </div>
            <span className="font-heading font-extrabold text-white tracking-tight text-lg">PathForge</span>
            {user?.tier === 'premium' && (
              <span className="text-[10px] bg-gradient-to-r from-yellow-400 to-orange-400 text-black font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                <Crown size={8} /> PRO
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5">
            <motion.div whileHover={{ scale: 1.05 }}
              className="hidden sm:flex items-center gap-1.5 rounded-full px-3 py-1.5 border"
              style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.25)' }}>
              <Flame size={12} className="text-orange-400 fill-orange-400" />
              <span className="text-orange-400 text-xs font-heading font-bold">{user?.streak ?? 0}d</span>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }}
              className="hidden sm:flex items-center gap-1.5 rounded-full px-3 py-1.5 border"
              style={{ background: 'rgba(234,179,8,0.1)', borderColor: 'rgba(234,179,8,0.25)' }}>
              <Zap size={12} className="text-yellow-400 fill-yellow-400" />
              <span className="text-yellow-400 text-xs font-heading font-bold">{user?.xp ?? 0} XP</span>
              <span className="text-yellow-500/50 text-xs">Lv{level}</span>
            </motion.div>
            <a href="/subjects" className="hidden md:flex items-center gap-1.5 text-white/30 hover:text-white/70 text-xs transition-colors px-2 py-1.5 rounded-lg hover:bg-white/5">
              <GraduationCap size={13} /> Subjects
            </a>
            {adminEmails.includes(userEmail) && (
              <a href="/admin" className="hidden md:flex items-center gap-1.5 text-rose-400/50 hover:text-rose-400 text-xs transition-colors px-2 py-1.5 rounded-lg hover:bg-rose-500/5">
                <ShieldCheck size={13} /> Admin
              </a>
            )}
            {/* Bell */}
            <div className="relative">
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
                onClick={() => { setShowNotifs(v => !v); if (!showNotifs && unread > 0) markNotifsRead() }}
                className="relative p-2 rounded-xl hover:bg-white/8 transition-colors">
                <Bell size={15} className="text-white/40" />
                <AnimatePresence>
                  {unread > 0 && (
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                      className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-500 rounded-full text-[9px] font-bold flex items-center justify-center">
                      {unread > 9 ? '9+' : unread}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
              <AnimatePresence>
                {showNotifs && (
                  <motion.div initial={{ opacity: 0, y: 8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }} transition={{ duration: 0.15 }}
                    className="absolute right-0 top-12 w-72 rounded-2xl border border-white/10 shadow-2xl overflow-hidden z-50"
                    style={{ background: 'rgba(14,14,28,0.97)', backdropFilter: 'blur(20px)' }}>
                    <div className="px-4 py-3 border-b border-white/8 flex items-center justify-between">
                      <span className="text-sm font-heading font-semibold">Notifications</span>
                      <button onClick={() => setShowNotifs(false)} className="text-white/30 hover:text-white text-xs">✕</button>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length === 0
                        ? <p className="text-white/30 text-xs text-center py-6">All caught up ✓</p>
                        : notifications.map(n => (
                          <div key={n.id} className="px-4 py-3 border-b border-white/5">
                            <p className="text-sm text-white/80 leading-snug">{n.message}</p>
                            <p className="text-xs text-white/25 mt-1">{timeAgo(n.created_at)}</p>
                          </div>
                        ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {/* Profile avatar button */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => setShowProfile(v => !v)}
                className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-xl border border-white/10 hover:border-white/20 transition-all"
                style={{ background: 'rgba(255,255,255,0.05)' }}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="avatar" className="w-7 h-7 rounded-lg object-cover" />
                ) : (
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center font-heading font-bold text-xs text-white"
                    style={{ background: 'linear-gradient(135deg, #7C3AED, #0EA5E9)' }}>
                    {user?.name?.[0]?.toUpperCase() ?? '?'}
                  </div>
                )}
                <span className="hidden sm:block text-xs font-heading font-semibold text-white/80 max-w-[80px] truncate">
                  {user?.name?.split(' ')[0] ?? 'Profile'}
                </span>
                <ChevronDown size={11} className="text-white/40 hidden sm:block" />
              </motion.button>

              <AnimatePresence>
                {showProfile && (
                  <>
                    {/* Backdrop */}
                    <div className="fixed inset-0 z-40" onClick={() => setShowProfile(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.18 }}
                      className="absolute right-0 top-12 w-72 rounded-2xl border border-white/10 shadow-2xl overflow-hidden z-50"
                      style={{ background: 'rgba(10,8,24,0.97)', backdropFilter: 'blur(24px)' }}
                    >
                      {/* Profile header */}
                      <div className="p-4 border-b border-white/8"
                        style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(14,165,233,0.08) 100%)' }}>
                        <div className="flex items-center gap-3">
                          {avatarUrl ? (
                            <img src={avatarUrl} alt="avatar" className="w-12 h-12 rounded-xl object-cover ring-2 ring-violet-500/40" />
                          ) : (
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center font-heading font-bold text-xl text-white ring-2 ring-violet-500/40"
                              style={{ background: 'linear-gradient(135deg, #7C3AED, #0EA5E9)' }}>
                              {user?.name?.[0]?.toUpperCase() ?? '?'}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-heading font-bold text-white text-sm truncate">{user?.name ?? 'Student'}</p>
                              {user?.tier === 'premium' && (
                                <span className="text-[9px] bg-gradient-to-r from-yellow-400 to-orange-400 text-black font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shrink-0">
                                  <Crown size={7} /> PRO
                                </span>
                              )}
                            </div>
                            <p className="text-white/50 text-[11px] font-body truncate">{userEmail}</p>
                          </div>
                        </div>
                      </div>

                      {/* Stats row */}
                      <div className="grid grid-cols-3 divide-x divide-white/8 border-b border-white/8">
                        {[
                          { label: 'Level', value: `Lv ${level}`, icon: '⚡' },
                          { label: 'Streak', value: `${user?.streak ?? 0}d`, icon: '🔥' },
                          { label: 'XP', value: String(user?.xp ?? 0), icon: '✨' },
                        ].map(s => (
                          <div key={s.label} className="flex flex-col items-center py-3 px-2">
                            <span className="text-sm">{s.icon}</span>
                            <p className="font-heading font-bold text-white text-sm">{s.value}</p>
                            <p className="text-white/35 text-[9px] font-body">{s.label}</p>
                          </div>
                        ))}
                      </div>

                      {/* Details */}
                      <div className="p-3 space-y-1.5 border-b border-white/8">
                        {[
                          { icon: GraduationCap, label: 'College', value: user?.college ?? '—' },
                          { icon: BookOpen, label: 'Semester', value: `Semester ${user?.semester ?? '—'}` },
                          { icon: Target, label: 'Target Role', value: user?.target_role ?? 'SDE' },
                        ].map(d => (
                          <div key={d.label} className="flex items-center gap-2.5 px-1 py-1">
                            <d.icon size={12} className="text-white/35 shrink-0" />
                            <span className="text-white/40 text-xs font-body">{d.label}</span>
                            <span className="text-white/80 text-xs font-body ml-auto truncate max-w-[130px]">{d.value}</span>
                          </div>
                        ))}
                      </div>

                      {/* Actions */}
                      <div className="p-2 space-y-0.5">
                        <a href="/score"
                          onClick={() => setShowProfile(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/6 transition-colors text-sm font-body text-white/70 hover:text-white">
                          <TrendingUp size={13} className="text-violet-400" /> Readiness Score
                          {readinessScore !== null && <span className="ml-auto text-xs font-heading font-bold text-violet-400">{Math.round(readinessScore)}%</span>}
                        </a>
                        <a href="/company"
                          onClick={() => setShowProfile(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/6 transition-colors text-sm font-body text-white/70 hover:text-white">
                          <Building2 size={13} className="text-cyan-400" /> Company Intel
                        </a>
                        {user?.tier !== 'premium' && (
                          <a href="/upgrade"
                            onClick={() => setShowProfile(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors text-sm font-body font-semibold"
                            style={{ background: 'rgba(234,179,8,0.08)', color: '#FCD34D' }}>
                            <Crown size={13} /> Upgrade to Premium
                            <span className="ml-auto text-[10px] opacity-60">₹99/mo</span>
                          </a>
                        )}
                        <button
                          onClick={async () => { await supabase.auth.signOut(); window.location.href = '/auth' }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-red-500/8 transition-colors text-sm font-body text-red-400/70 hover:text-red-400">
                          <LogOut size={13} /> Sign out
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.nav>
      </div>

      {/* ── Page content ──────────────────────────────────────────────────── */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 py-8 space-y-10">

        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.55 }}>
          <p className="text-white/70 text-sm font-body mb-2 tracking-wide">{formatDate()}</p>
          <h1 className="font-heading font-extrabold leading-[1.05] tracking-tight">
            <span className="block text-white/85 text-2xl sm:text-3xl">{getGreeting()},</span>
            <span className="block text-4xl sm:text-6xl animate-gradient-title">{user?.name?.split(' ')[0] ?? 'there'} 👋</span>
          </h1>
          <p className="text-white/75 font-body text-sm mt-3 flex items-center gap-2 flex-wrap">
            <span>{user?.college}</span>
            <span className="text-white/40">·</span>
            <span>Semester {user?.semester}</span>
            <span className="text-white/40">·</span>
            <span className="font-semibold" style={{ color: '#FF6B35' }}>Targeting {user?.target_role ?? 'SDE'}</span>
          </p>
        </motion.div>

        {/* ── Stats Strip ───────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14, duration: 0.45 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Level', value: `Lv ${level}`, sub: `${user?.xp ?? 0} XP total`, from: '#F59E0B', to: '#EF4444', icon: <Zap size={14} /> },
            { label: 'Streak', value: `${user?.streak ?? 0}d`, sub: 'current streak', from: '#FF6B35', to: '#EF4444', icon: <Flame size={14} /> },
            { label: 'DSA Solved', value: String(dsaSolved), sub: `of 455 problems`, from: '#0EA5E9', to: '#7C3AED', icon: <Code2 size={14} /> },
            {
              label: 'Readiness', value: readinessScore !== null ? `${Math.round(readinessScore)}%` : '—',
              sub: readinessScore !== null ? (readinessScore >= 70 ? 'Placement ready 🚀' : 'Keep grinding') : 'Not calculated',
              from: '#059669', to: '#0EA5E9', icon: <TrendingUp size={14} />,
            },
          ].map((s, i) => (
            <motion.div key={s.label}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 + i * 0.06 }}
              whileHover={{ y: -4, boxShadow: `0 16px 40px rgba(0,0,0,0.4)` }}
              className="relative overflow-hidden rounded-2xl p-4 border border-white/8 cursor-default"
              style={{ background: `linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)` }}>
              {/* Color accent bar top */}
              <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl" style={{ background: `linear-gradient(90deg, ${s.from}, ${s.to})` }} />
              <div className="flex items-center gap-1.5 mb-3" style={{ color: s.from }}>
                {s.icon}
                <span className="text-xs font-body text-white/75">{s.label}</span>
              </div>
              <p className="font-heading text-2xl font-extrabold text-white">{s.value}</p>
              <p className="text-white/65 text-[11px] mt-0.5 font-body">{s.sub}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Two-column layout ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">

          {/* ── Today's Forge ─────────────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.22, duration: 0.5 }}>
            {/* Section header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #7C3AED, #0EA5E9)' }}>
                  <Target size={15} className="text-white" />
                </div>
                <div>
                  <h2 className="font-heading font-bold text-white text-lg">Today&apos;s Forge</h2>
                  {!tasksLoading && (
                    <p className="text-white/70 text-xs font-body">
                      {doneCount}/{tasks.length} done
                      {totalXpToday > 0 && <span className="text-yellow-400/80 ml-2">· +{totalXpToday} XP earned</span>}
                    </p>
                  )}
                </div>
              </div>
              <motion.button whileHover={{ scale: 1.1, rotate: 180 }} whileTap={{ scale: 0.9 }}
                transition={{ duration: 0.3 }}
                onClick={() => { setTasksLoading(true); fetch('/api/tasks/today').then(r => r.json()).then(d => { if (d.tasks) setTasks(d.tasks) }).finally(() => setTasksLoading(false)) }}
                className="p-2 rounded-xl hover:bg-white/8 text-white/20 hover:text-white/60 transition-colors">
                <RotateCcw size={14} />
              </motion.button>
            </div>

            {/* XP bar */}
            <div className="mb-5 p-3.5 rounded-2xl border border-white/6"
              style={{ background: 'rgba(255,255,255,0.025)' }}>
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-1.5">
                  <Zap size={11} className="text-yellow-400 fill-yellow-400" />
                  <span className="text-[11px] text-white/80 font-body">Level {level}</span>
                </div>
                <span className="text-[11px] text-white/65 font-body">{500 - ((user?.xp ?? 0) % 500)} XP to next level</span>
              </div>
              <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                <motion.div className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, #FF6B35, #7C3AED, #0EA5E9)' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${xpProgress * 100}%` }}
                  transition={{ duration: 1.2, delay: 0.6, ease: [0.2, 0.7, 0.4, 1] }} />
              </div>
            </div>

            {/* Tasks */}
            <div className="space-y-3">
              {tasksLoading ? (
                [...Array(4)].map((_, i) => (
                  <div key={i} className="h-[84px] rounded-2xl border border-white/5 animate-pulse"
                    style={{ background: 'rgba(255,255,255,0.025)', animationDelay: `${i * 80}ms` }} />
                ))
              ) : (
                <AnimatePresence mode="popLayout">
                  {tasks.map((task, i) => {
                    const done = completedIds.has(task.id)
                    return (
                      <motion.div key={task.id}
                        initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 16, scale: 0.96 }}
                        transition={{ delay: i * 0.07, duration: 0.32 }}
                        whileHover={done ? {} : { y: -2, boxShadow: '0 8px 32px rgba(0,0,0,0.35)' }}
                        onClick={() => toggleTask(task.id)}
                        className={`group flex items-start gap-3.5 p-4 rounded-2xl border cursor-pointer select-none transition-all duration-200 ${
                          done
                            ? 'border-white/4 opacity-40'
                            : 'border-white/8 hover:border-white/16'
                        }`}
                        style={{ background: done ? 'rgba(255,255,255,0.015)' : 'rgba(255,255,255,0.04)' }}>

                        {/* Checkbox */}
                        <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-300 ${
                          done ? 'border-emerald-500 bg-emerald-500' : 'border-white/20 group-hover:border-violet-400/70'
                        }`}>
                          <AnimatePresence>
                            {done && (
                              <motion.svg initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                                width="10" height="10" viewBox="0 0 10 10" fill="none">
                                <path d="M2 5L4.5 7.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              </motion.svg>
                            )}
                          </AnimatePresence>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <span className={`text-sm font-heading font-semibold transition-all ${done ? 'line-through text-white/20' : 'text-white/90'}`}>
                              {task.title}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-body ${TAG[task.tagColor] ?? TAG.violet}`}>
                              {task.tag}
                            </span>
                            {task.priority === 'high' && !done && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-body"
                                style={{ background: 'rgba(239,68,68,0.12)', color: '#F87171', border: '1px solid rgba(239,68,68,0.25)' }}>
                                Priority
                              </span>
                            )}
                          </div>
                          <p className={`text-xs font-body ${done ? 'text-white/20' : 'text-white/75'}`}>{task.subtitle}</p>
                        </div>

                        <div className="shrink-0 flex flex-col items-end gap-1.5 ml-2">
                          <div className="flex items-center gap-1" style={{ color: done ? 'rgba(234,179,8,0.3)' : '#FBBF24' }}>
                            <Zap size={9} />
                            <span className="text-[10px] font-heading">{task.xp}</span>
                          </div>
                          <div className="flex items-center gap-1 text-white/60">
                            <Clock size={9} />
                            <span className="text-[10px] font-body">{task.minutes}m</span>
                          </div>
                          {task.link && !done && (
                            <a href={task.link} onClick={e => e.stopPropagation()}
                              className="flex items-center gap-0.5 text-[10px] text-violet-400/50 hover:text-violet-400 transition-colors">
                              Go <ArrowUpRight size={8} />
                            </a>
                          )}
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              )}

              {/* Add custom task */}
              <AnimatePresence>
                {addingTask ? (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="flex gap-2">
                    <input autoFocus value={customTask} onChange={e => setCustomTask(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') addCustomTask(); if (e.key === 'Escape') { setAddingTask(false); setCustomTask('') } }}
                      placeholder="Add a task..."
                      className="flex-1 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none font-body border border-white/10 focus:border-violet-500/60"
                      style={{ background: 'rgba(255,255,255,0.05)' }} />
                    <button onClick={addCustomTask}
                      className="px-4 py-2.5 text-white text-sm rounded-xl font-heading transition-colors"
                      style={{ background: 'linear-gradient(135deg, #7C3AED, #0EA5E9)' }}>
                      Add
                    </button>
                    <button onClick={() => { setAddingTask(false); setCustomTask('') }}
                      className="px-3 py-2.5 text-white/30 hover:text-white text-sm rounded-xl hover:bg-white/5 transition-colors">✕</button>
                  </motion.div>
                ) : (
                  <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                    onClick={() => setAddingTask(true)}
                    className="w-full flex items-center gap-2 px-4 py-3.5 rounded-2xl border border-dashed border-white/10 hover:border-violet-500/40 text-white/25 hover:text-violet-400 text-sm transition-all font-body">
                    <Plus size={14} /> Add custom task
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* All done banner */}
            <AnimatePresence>
              {doneCount > 0 && doneCount === tasks.length && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  className="mt-4 rounded-2xl p-4 text-center border"
                  style={{ background: 'rgba(5,150,105,0.12)', borderColor: 'rgba(5,150,105,0.3)' }}>
                  <p className="text-emerald-400 font-heading font-bold">🎉 All done for today!</p>
                  <p className="text-emerald-400/50 text-xs mt-1 font-body">+{totalXpToday} XP · Streak maintained</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* ── Right Sidebar ──────────────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.28, duration: 0.5 }}
            className="space-y-5">

            {/* Score Ring */}
            <div className="rounded-2xl p-5 border border-white/8 flex flex-col items-center"
              style={{ background: 'rgba(255,255,255,0.03)' }}>
              <p className="text-xs text-white/70 font-body uppercase tracking-widest mb-4">Readiness Score</p>
              {readinessScore !== null ? (
                <>
                  <div className="relative w-28 h-28 mb-3">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7" />
                      <motion.circle cx="50" cy="50" r="42" fill="none"
                        stroke={readinessScore >= 70 ? '#10b981' : readinessScore >= 50 ? '#f59e0b' : '#ef4444'}
                        strokeWidth="7" strokeLinecap="round"
                        initial={{ pathLength: 0 }} animate={{ pathLength: readinessScore / 100 }}
                        transition={{ duration: 1.4, delay: 0.8, ease: [0.2, 0.7, 0.4, 1] }}
                        strokeDasharray="1 0" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="font-heading text-3xl font-extrabold text-white">{Math.round(readinessScore)}</span>
                      <span className="text-[10px] text-white/60">/100</span>
                    </div>
                  </div>
                  <p className="text-xs text-white/75 font-body text-center">
                    {readinessScore >= 80 ? 'Placement ready 🚀' : readinessScore >= 60 ? 'Good progress 📈' : readinessScore >= 40 ? 'Stay consistent 💪' : 'Time to grind 🔥'}
                  </p>
                  <a href="/score" className="mt-3 text-[11px] text-violet-400/60 hover:text-violet-400 flex items-center gap-1 transition-colors">
                    Full breakdown <ArrowRight size={9} />
                  </a>
                </>
              ) : (
                <div className="text-center py-2">
                  <p className="text-white/60 text-xs mb-3">Not yet calculated</p>
                  <a href="/score" className="text-xs px-4 py-2 rounded-xl font-body transition-colors border border-violet-500/30 text-violet-400 hover:bg-violet-500/10">
                    Calculate now →
                  </a>
                </div>
              )}
            </div>

            {/* Upgrade */}
            {user?.tier !== 'premium' && (
              <motion.a href="/upgrade" whileHover={{ scale: 1.02 }}
                className="block rounded-2xl p-4 border border-yellow-500/20 cursor-pointer transition-all"
                style={{ background: 'linear-gradient(135deg, rgba(217,119,6,0.15) 0%, rgba(220,38,38,0.10) 100%)' }}>
                <div className="flex items-center gap-2 mb-1.5">
                  <Crown size={14} className="text-yellow-400" />
                  <span className="text-sm font-heading font-bold text-yellow-400">Go Premium</span>
                  <span className="ml-auto text-[10px] text-yellow-400/50 border border-yellow-500/20 px-1.5 py-0.5 rounded-full">₹99/mo</span>
                </div>
                <p className="text-xs text-white/75 font-body">AI weekly check-ins · unlimited DSA · adaptive replanning</p>
              </motion.a>
            )}

            {/* Weekly check-in */}
            <CheckinPanel />

            {/* Accountability Buddy */}
            <AccountabilityBuddy streak={user?.streak ?? 0} doneToday={doneCount > 0} />

            {/* Profile Updater */}
            <ProfileUpdater targetRole={user?.target_role ?? ''} xp={user?.xp ?? 0} />
          </motion.div>
        </div>

        {/* ── Modules Grid — BIG, bold, colorful ─────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.5 }}>
          <div className="flex items-center gap-3 mb-5">
            <h2 className="font-heading font-bold text-white text-xl">Modules</h2>
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.08) 0%, transparent 100%)' }} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {MODULES.map((m, i) => (
              <motion.a key={m.title} href={m.href}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.38 + i * 0.05, duration: 0.35 }}
                whileHover={{ y: -5, boxShadow: `0 20px 48px ${m.shadow}` }}
                whileTap={{ scale: 0.97 }}
                className="group relative overflow-hidden rounded-2xl p-5 border border-white/8 flex items-start gap-4 transition-all duration-250"
                style={{ background: 'rgba(255,255,255,0.035)' }}>

                {/* Hover color fill */}
                <motion.div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{ background: `linear-gradient(135deg, ${m.from}14 0%, ${m.to}0A 100%)` }} />

                {/* Colored icon box */}
                <div className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
                  style={{ background: `linear-gradient(135deg, ${m.from}, ${m.to})`, boxShadow: `0 4px 16px ${m.shadow}` }}>
                  <m.icon size={22} className="text-white" />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-heading font-bold text-white text-base leading-tight group-hover:text-white transition-colors">{m.title}</h3>
                  <p className="text-white/75 text-xs font-body mt-1 leading-relaxed">{m.desc}</p>
                </div>

                {/* Arrow */}
                <ArrowUpRight size={16} className="shrink-0 text-white/15 group-hover:text-white/60 transition-colors mt-0.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
              </motion.a>
            ))}
          </div>
        </motion.div>

        {/* ── Interview Stories ──────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42, duration: 0.5 }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg, #F59E0B, #EF4444)' }}>
              <Quote size={15} className="text-white" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-white text-xl">Interview Stories</h2>
              <p className="text-white/55 text-xs font-body mt-0.5">Real experiences from students who cracked top companies</p>
            </div>
          </div>
          <div className="flex-1 h-px mb-6" style={{ background: 'linear-gradient(90deg, rgba(245,158,11,0.3) 0%, transparent 100%)' }} />

          <div className="space-y-4">
            {STORIES.map((s, i) => (
              <StoryCard key={s.id} story={s} index={i} />
            ))}
          </div>
        </motion.div>

      </main>
    </div>
  )
}

// ─── Story Card ───────────────────────────────────────────────────────────────
function StoryCard({ story, index }: { story: typeof STORIES[0]; index: number }) {
  const [expanded, setExpanded] = useState(false)
  const paragraphs = story.story.trim().split('\n\n')

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.44 + index * 0.07, duration: 0.38 }}
      className="rounded-2xl border overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}
    >
      {/* ── Card header (always visible) ── */}
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className={`shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br ${story.avatarGrad} flex items-center justify-center font-heading font-bold text-white text-sm`}>
            {story.avatar}
          </div>

          {/* Name + meta */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-heading font-bold text-white text-base">{story.name}</span>
              <span className="text-white/35 text-xs font-body">{story.college} · {story.batch}</span>
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs font-body px-2.5 py-0.5 rounded-full border font-semibold"
                style={{ background: story.companyBg, borderColor: story.companyBorder, color: story.companyColor }}>
                <Building2 size={9} className="inline mr-1 mb-0.5" />{story.company}
              </span>
              <span className="text-white/55 text-xs font-body">{story.role}</span>
            </div>
          </div>

          {/* CTC badge */}
          <div className="shrink-0 text-right hidden sm:block">
            <p className="font-heading font-bold text-emerald-400 text-sm">{story.ctc}</p>
            <p className="text-white/35 text-[10px] font-body">{story.duration}</p>
          </div>
        </div>

        {/* Tagline quote */}
        <div className="mt-4 flex gap-2.5">
          <Quote size={14} className="shrink-0 mt-0.5 opacity-40" style={{ color: story.companyColor }} />
          <p className="text-white/85 text-sm font-body italic leading-relaxed">{story.tagline}</p>
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(v => !v)}
          className="mt-4 flex items-center gap-1.5 text-xs font-body transition-colors"
          style={{ color: expanded ? 'rgba(255,255,255,0.5)' : story.companyColor }}
        >
          {expanded ? <><ChevronUp size={13} /> Hide story</> : <><ChevronDown size={13} /> Read full story & tips</>}
        </button>
      </div>

      {/* ── Expanded content ── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.2, 0.7, 0.4, 1] }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-5"
              style={{ borderTop: `1px solid rgba(255,255,255,0.06)` }}>

              {/* Story paragraphs */}
              <div className="pt-4 space-y-3">
                {paragraphs.map((para, pi) => (
                  <p key={pi} className="text-white/75 text-sm font-body leading-relaxed">{para}</p>
                ))}
              </div>

              {/* Tips */}
              <div className="rounded-xl p-4 border"
                style={{ background: story.companyBg, borderColor: story.companyBorder }}>
                <p className="text-xs font-heading font-bold mb-3 uppercase tracking-wider"
                  style={{ color: story.companyColor }}>
                  Top Tips from {story.name.split(' ')[0]}
                </p>
                <ul className="space-y-2">
                  {story.tips.map((tip, ti) => (
                    <li key={ti} className="flex items-start gap-2.5 text-sm font-body text-white/85">
                      <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5"
                        style={{ background: story.companyBg, border: `1px solid ${story.companyBorder}`, color: story.companyColor }}>
                        {ti + 1}
                      </span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between">
                <p className="text-white/35 text-[11px] font-body">Verified story · PathForge community</p>
                <div className="flex items-center gap-1.5">
                  <span className="font-heading font-bold text-emerald-400 text-sm sm:hidden">{story.ctc}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Accountability Buddy ─────────────────────────────────────────────────────
function AccountabilityBuddy({ streak, doneToday }: { streak: number; doneToday: boolean }) {
  const [buddy, setBuddy] = useState<string | null>(null)
  const [inputting, setInputting] = useState(false)
  const [val, setVal] = useState('')
  const hour = new Date().getHours()
  const missedToday = !doneToday && hour >= 18

  useEffect(() => { setBuddy(localStorage.getItem('pf_buddy_name')) }, [])

  function saveBuddy() {
    if (!val.trim()) return
    localStorage.setItem('pf_buddy_name', val.trim())
    setBuddy(val.trim())
    setInputting(false)
    setVal('')
  }

  return (
    <div className="rounded-2xl p-4 border border-white/8 space-y-3"
      style={{ background: 'rgba(255,255,255,0.03)' }}>
      {/* Missed-day nudge */}
      <AnimatePresence>
        {missedToday && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-start gap-2.5 p-3 rounded-xl border"
            style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)' }}>
            <AlertCircle size={13} className="text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-heading font-semibold text-red-400">No activity today yet!</p>
              <p className="text-[11px] text-red-400/70 font-body mt-0.5">Complete at least 1 task to keep your streak alive.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg, #DB2777, #7C3AED)' }}>
          <Users size={12} className="text-white" />
        </div>
        <span className="text-sm font-heading font-semibold text-white/90">Accountability Buddy</span>
      </div>

      {buddy ? (
        <div className="space-y-2">
          <div className="flex items-center gap-3 p-2.5 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.04)' }}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-violet-500 flex items-center justify-center font-heading font-bold text-xs text-white">
              {buddy[0].toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="text-sm font-heading font-semibold text-white">{buddy}</p>
              <p className="text-[10px] text-white/40 font-body">Your prep partner</p>
            </div>
            <div className={`w-2 h-2 rounded-full ${doneToday ? 'bg-emerald-400' : 'bg-white/20'}`} title={doneToday ? 'Active today' : 'Not active yet'} />
          </div>
          <p className="text-[11px] text-white/45 font-body px-1">
            {doneToday
              ? `Great work today! Share your progress with ${buddy}.`
              : `${buddy} is waiting — complete a task and let them know!`}
          </p>
          <button onClick={() => { localStorage.removeItem('pf_buddy_name'); setBuddy(null) }}
            className="text-[10px] text-white/25 hover:text-white/50 font-body transition-colors">
            Change buddy
          </button>
        </div>
      ) : inputting ? (
        <div className="flex gap-2">
          <input autoFocus value={val} onChange={e => setVal(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') saveBuddy(); if (e.key === 'Escape') setInputting(false) }}
            placeholder="Buddy's name..."
            className="flex-1 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none border border-white/10 focus:border-violet-500/50 font-body"
            style={{ background: 'rgba(255,255,255,0.05)' }} />
          <button onClick={saveBuddy}
            className="px-3 py-2 rounded-lg text-white text-xs font-heading"
            style={{ background: 'linear-gradient(135deg, #DB2777, #7C3AED)' }}>
            Save
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-white/55 font-body leading-relaxed">
            Add a prep partner who holds you accountable. Research shows accountability partners increase study consistency by 65%.
          </p>
          <button onClick={() => setInputting(true)}
            className="text-xs flex items-center gap-1.5 font-body text-violet-400 hover:text-violet-300 transition-colors">
            <Plus size={11} /> Add accountability buddy
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Profile Updater ──────────────────────────────────────────────────────────
function ProfileUpdater({ targetRole, xp }: { targetRole: string; xp: number }) {
  const [dismissed, setDismissed] = useState<string[]>([])
  const level = Math.floor(xp / 500) + 1

  useEffect(() => {
    const d = JSON.parse(localStorage.getItem('pf_profile_dismissed') ?? '[]')
    setDismissed(d)
  }, [])

  function dismiss(id: string) {
    const next = [...dismissed, id]
    setDismissed(next)
    localStorage.setItem('pf_profile_dismissed', JSON.stringify(next))
  }

  // Dynamic suggestions based on level/role
  const suggestions = [
    level >= 2 && {
      id: 'linkedin-dsa',
      icon: '💼',
      title: 'Update LinkedIn',
      desc: 'You\'ve been active on DSA — add "Data Structures & Algorithms" to your LinkedIn skills.',
      action: 'Add to LinkedIn →',
      link: 'https://www.linkedin.com/in/me/edit/skills/',
      color: '#0A66C2',
    },
    level >= 3 && {
      id: 'resume-role',
      icon: '📄',
      title: 'Resume Tip',
      desc: `Targeting ${targetRole || 'SDE'}? Add a "Target Role" headline to your resume: "${targetRole || 'Software Development Engineer'} | CSE 20XX"`,
      action: null,
      link: null,
      color: '#7C3AED',
    },
    level >= 4 && {
      id: 'linkedin-project',
      icon: '🚀',
      title: 'Showcase a project',
      desc: 'At Level 4+, you\'re ready to feature a project on LinkedIn. Add a post: "Built X using Y — here\'s what I learned."',
      action: 'Post on LinkedIn →',
      link: 'https://www.linkedin.com/feed/',
      color: '#0A66C2',
    },
  ].filter(Boolean).filter(s => s && !dismissed.includes(s.id)) as { id: string; icon: string; title: string; desc: string; action: string | null; link: string | null; color: string }[]

  if (suggestions.length === 0) return null

  return (
    <div className="rounded-2xl p-4 border border-white/8 space-y-3"
      style={{ background: 'rgba(255,255,255,0.03)' }}>
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg, #0EA5E9, #059669)' }}>
          <TrendingUp size={12} className="text-white" />
        </div>
        <span className="text-sm font-heading font-semibold text-white/90">Profile Updater</span>
        <span className="ml-auto text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 px-1.5 py-0.5 rounded-full font-body">
          {suggestions.length} tip{suggestions.length > 1 ? 's' : ''}
        </span>
      </div>

      <div className="space-y-2.5">
        {suggestions.map(s => (
          <div key={s.id} className="p-3 rounded-xl border"
            style={{ background: 'rgba(255,255,255,0.025)', borderColor: 'rgba(255,255,255,0.06)' }}>
            <div className="flex items-start gap-2.5">
              <span className="text-base shrink-0">{s.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-heading font-semibold text-white/90">{s.title}</p>
                <p className="text-[11px] text-white/60 font-body mt-0.5 leading-relaxed">{s.desc}</p>
                <div className="flex items-center gap-3 mt-2">
                  {s.action && s.link && (
                    <a href={s.link} target="_blank" rel="noopener noreferrer"
                      className="text-[11px] font-body font-semibold transition-colors hover:opacity-80"
                      style={{ color: s.color }}>
                      {s.action}
                    </a>
                  )}
                  <button onClick={() => dismiss(s.id)}
                    className="text-[10px] text-white/25 hover:text-white/50 font-body transition-colors">
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Weekly Check-in Panel ────────────────────────────────────────────────────
function CheckinPanel() {
  const BACKEND = '/api/backend'
  const [step, setStep] = useState<'idle' | 'answering' | 'done'>('idle')
  const [loading, setLoading] = useState(false)
  const [questions, setQuestions] = useState<string[]>([])
  const [answers, setAnswers] = useState<string[]>([])
  const [result, setResult] = useState('')

  async function start() {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const r = await fetch(`${BACKEND}/agent/checkin-questions`, { headers: { Authorization: `Bearer ${session.access_token}` } })
      const d = await r.json()
      if (d.questions) { setQuestions(d.questions); setAnswers(new Array(d.questions.length).fill('')); setStep('answering') }
    } catch { setResult('Backend unavailable.'); setStep('done') }
    setLoading(false)
  }
  async function submit() {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const r = await fetch(`${BACKEND}/agent/submit-answers`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions, answers }),
      })
      const d = await r.json()
      setResult(d.message || 'Check-in complete!')
    } catch { setResult('Something went wrong.') }
    setStep('done')
    setLoading(false)
  }

  return (
    <div className="rounded-2xl p-4 border border-white/8" style={{ background: 'rgba(255,255,255,0.03)' }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #7C3AED, #0EA5E9)' }}>
          <CheckCircle2 size={12} className="text-white" />
        </div>
        <span className="text-sm font-heading font-semibold text-white/90">Weekly Check-in</span>
      </div>
      {step === 'done' ? (
        <p className="text-xs text-emerald-400 font-body flex items-center gap-1.5"><CheckCircle2 size={11} /> {result}</p>
      ) : step === 'answering' ? (
        <div className="space-y-2.5">
          {questions.map((q, i) => (
            <div key={i}>
              <p className="text-[11px] text-white/45 mb-1 font-body">{q}</p>
              <input value={answers[i]} onChange={e => { const n = [...answers]; n[i] = e.target.value; setAnswers(n) }}
                className="w-full rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-white/20 focus:outline-none border border-white/10 focus:border-violet-500/50 font-body"
                style={{ background: 'rgba(255,255,255,0.05)' }} placeholder="Your answer..." />
            </div>
          ))}
          <button onClick={submit} disabled={loading || answers.every(a => !a.trim())}
            className="w-full text-white text-xs h-8 rounded-xl font-heading transition-colors disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #0EA5E9)' }}>
            {loading ? 'Processing...' : 'Submit'}
          </button>
        </div>
      ) : (
        <>
          <p className="text-xs text-white/30 font-body mb-3">AI reviews your week and replans your roadmap.</p>
          <button onClick={start} disabled={loading}
            className="w-full flex items-center justify-center gap-1.5 border border-white/10 hover:border-violet-500/40 hover:bg-violet-500/8 text-white/40 hover:text-white/80 text-xs h-9 rounded-xl font-body transition-all">
            <Clock size={11} /> {loading ? 'Loading...' : 'Start check-in'}
          </button>
        </>
      )}
    </div>
  )
}
