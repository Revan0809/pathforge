import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DailyTask {
  id: string
  title: string
  subtitle: string
  category: 'dsa' | 'subject' | 'roadmap' | 'course' | 'meta'
  tag: string
  tagColor: string
  xp: number
  minutes: number
  link?: string
  priority: 'high' | 'medium' | 'low'
}

// ─── Subject rotation by weekday ─────────────────────────────────────────────

const SUBJECT_BY_DAY: Record<number, { tag: string; title: string; subtitle: string; link: string }> = {
  0: { tag: 'OS', title: 'Study OS: CPU Scheduling', subtitle: 'FCFS, SJF, Round Robin — solve 2 Gantt chart numericals', link: '/subjects' },
  1: { tag: 'DSA', title: 'Practice DSA: Trees & BST', subtitle: 'Pick 2 medium tree problems — focus on recursion patterns', link: '/dsa' },
  2: { tag: 'DBMS', title: 'Study DBMS: SQL Practice', subtitle: 'Write 5 SQL queries — JOINs, GROUP BY, window functions', link: '/subjects' },
  3: { tag: 'CN', title: 'Study Networks: TCP/IP', subtitle: 'Revise TCP 3-way handshake + subnetting practice', link: '/subjects' },
  4: { tag: 'OOP', title: 'Study OOP: Design Patterns', subtitle: 'Implement Singleton & Observer patterns in code', link: '/subjects' },
  5: { tag: 'Sys Design', title: 'System Design: URL Shortener', subtitle: 'Design TinyURL — schema, hashing, scalability', link: '/subjects' },
  6: { tag: 'Revision', title: 'Weekly Revision + Mock', subtitle: 'Revise the week\'s topics, attempt a timed mock test', link: '/subjects' },
}

// ─── DSA recommendations by topic weakness ───────────────────────────────────

function getDSATask(solved: number, byTopic: Record<string, { solved: number }>): DailyTask {
  if (solved < 30) {
    return {
      id: 'dsa-beginner',
      title: 'DSA: Arrays & Two Pointers',
      subtitle: 'Solve 2 easy array problems — Two Sum, Valid Palindrome',
      category: 'dsa', tag: 'DSA', tagColor: 'blue',
      xp: 20, minutes: 45, priority: 'high', link: '/dsa',
    }
  }
  // Find weakest topic
  const topics = ['Graphs', 'Dynamic Programming', 'Trees', 'Linked List', 'Stack & Queue']
  const weakest = topics.find((t) => !byTopic[t] || byTopic[t].solved < 5)
  if (weakest) {
    return {
      id: `dsa-${weakest.toLowerCase().replace(/ /g, '-')}`,
      title: `DSA: ${weakest}`,
      subtitle: `Solve 2 ${weakest} problems — look up the pattern before coding`,
      category: 'dsa', tag: 'DSA', tagColor: 'blue',
      xp: 25, minutes: 60, priority: 'high', link: '/dsa',
    }
  }
  return {
    id: 'dsa-hard',
    title: 'DSA: Hard Challenge',
    subtitle: `${solved} solved — attempt 1 hard problem today, focus on DP`,
    category: 'dsa', tag: 'DSA', tagColor: 'blue',
    xp: 40, minutes: 90, priority: 'high', link: '/dsa',
  }
}

// ─── Role-specific task ───────────────────────────────────────────────────────

function getRoleTask(role: string, xp: number): DailyTask | null {
  const level = Math.floor(xp / 500) + 1
  const tasks: Record<string, DailyTask> = {
    'ML Engineer': {
      id: 'role-ml',
      title: 'ML: Study a core algorithm',
      subtitle: 'Linear regression → gradient descent derivation + implement from scratch',
      category: 'subject', tag: 'ML', tagColor: 'violet',
      xp: 30, minutes: 45, priority: 'medium', link: '/subjects',
    },
    'Data Analyst': {
      id: 'role-da',
      title: 'SQL + Pandas practice',
      subtitle: 'Solve 3 SQL problems on LeetCode, practice groupby in Pandas',
      category: 'subject', tag: 'Data', tagColor: 'emerald',
      xp: 25, minutes: 40, priority: 'medium', link: '/subjects',
    },
    'DevOps': {
      id: 'role-devops',
      title: 'DevOps: Docker basics',
      subtitle: 'Containerise a small app — write a Dockerfile + docker-compose',
      category: 'subject', tag: 'DevOps', tagColor: 'orange',
      xp: 30, minutes: 60, priority: 'medium', link: '/subjects',
    },
    'Product Manager': {
      id: 'role-pm',
      title: 'PM: Product case study',
      subtitle: 'Analyse one product feature — user problem, metrics, trade-offs',
      category: 'subject', tag: 'PM', tagColor: 'pink',
      xp: 20, minutes: 30, priority: 'medium',
    },
  }
  if (level < 3) return null // Low-level users focus on fundamentals first
  return tasks[role] ?? null
}

// ─── API Route ────────────────────────────────────────────────────────────────

export async function GET() {
  try {
  // Verify caller
  const cookieStore = cookies()
  const userClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { session } } = await userClient.auth.getSession()
  const user = session?.user
  if (!user || !session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Use the service-role key when configured, otherwise fall back to a client
  // scoped to the caller's JWT — the "manage own data" RLS policies cover every
  // read below, so the dashboard works with zero extra Vercel configuration.
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
  const admin = serviceKey
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, { auth: { persistSession: false } })
    : createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
        auth: { persistSession: false },
        global: { headers: { Authorization: `Bearer ${session.access_token}` } },
      })

  // Fetch user profile + roadmap + dsa in parallel
  const [profileRes, roadmapRes, dsaRes, coursesRes] = await Promise.all([
    admin.from('users').select('name, target_role, semester, xp, streak, onboarding_complete').eq('id', user.id).single(),
    admin.from('roadmap_tasks').select('id, title, type, week_number, status').eq('user_id', user.id).eq('status', 'pending').order('week_number').limit(3),
    admin.from('dsa_progress').select('status, dsa_problems(topic)').eq('user_id', user.id),
    admin.from('courses').select('id, name, completed_sections, total_sections').eq('user_id', user.id).order('last_updated', { ascending: false }).limit(1),
  ])

  const profile = profileRes.data
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const roadmapTasks = roadmapRes.data ?? []
  const dsaRows = dsaRes.data ?? []
  const latestCourse = coursesRes.data?.[0] ?? null

  // ── Build DSA stats ──
  const dsaByTopic: Record<string, { solved: number }> = {}
  let dsaSolved = 0
  for (const row of dsaRows) {
    if (row.status === 'solved') {
      dsaSolved++
      const topic = (row.dsa_problems as { topic?: string })?.topic ?? 'Unknown'
      dsaByTopic[topic] = { solved: (dsaByTopic[topic]?.solved ?? 0) + 1 }
    }
  }

  const today = new Date()
  const dayOfWeek = today.getDay() // 0 = Sunday
  const dateStr = today.toISOString().split('T')[0]

  const tasks: DailyTask[] = []

  // ── Task 1: Always DSA ──
  tasks.push(getDSATask(dsaSolved, dsaByTopic))

  // ── Task 2: Today's subject rotation ──
  const subjectDay = SUBJECT_BY_DAY[dayOfWeek]
  tasks.push({
    id: `subject-${dateStr}`,
    title: subjectDay.title,
    subtitle: subjectDay.subtitle,
    category: 'subject', tag: subjectDay.tag, tagColor: 'violet',
    xp: 20, minutes: 40, priority: 'medium', link: subjectDay.link,
  })

  // ── Task 3: Roadmap task (if exists) ──
  if (roadmapTasks.length > 0) {
    const rt = roadmapTasks[0]
    tasks.push({
      id: `roadmap-${rt.id}`,
      title: rt.title,
      subtitle: `Week ${rt.week_number} · ${rt.type ?? 'Task'} — part of your personalised plan`,
      category: 'roadmap', tag: 'Roadmap', tagColor: 'purple',
      xp: 30, minutes: 50, priority: 'high', link: '/roadmap',
    })
  }

  // ── Task 4: Active course (if any) ──
  if (latestCourse) {
    const remaining = latestCourse.total_sections - latestCourse.completed_sections
    if (remaining > 0) {
      tasks.push({
        id: `course-${latestCourse.id}`,
        title: `Continue: ${latestCourse.name}`,
        subtitle: `${latestCourse.completed_sections}/${latestCourse.total_sections} sections done — aim for 2 sections today`,
        category: 'course', tag: 'Course', tagColor: 'orange',
        xp: 15, minutes: 35, priority: 'medium', link: '/courses',
      })
    }
  }

  // ── Task 5: Role-specific task ──
  const roleTask = getRoleTask(profile.target_role ?? 'SDE', profile.xp ?? 0)
  if (roleTask) tasks.push(roleTask)

  // ── Task 6: Meta / streak / onboarding ──
  if (!profile.onboarding_complete) {
    tasks.push({
      id: 'meta-onboard',
      title: 'Complete your onboarding',
      subtitle: 'Set your target role, college, skills — takes 2 minutes',
      category: 'meta', tag: 'Setup', tagColor: 'rose',
      xp: 50, minutes: 5, priority: 'high', link: '/onboarding',
    })
  } else if ((profile.streak ?? 0) === 0) {
    tasks.push({
      id: 'meta-streak',
      title: 'Rebuild your streak',
      subtitle: 'Log any activity today to restart your daily streak 🔥',
      category: 'meta', tag: 'Streak', tagColor: 'orange',
      xp: 10, minutes: 10, priority: 'medium',
    })
  } else if (roadmapTasks.length === 0 && profile.onboarding_complete) {
    tasks.push({
      id: 'meta-roadmap',
      title: 'Generate your personalized roadmap',
      subtitle: 'AI builds your 16-week placement plan based on your profile',
      category: 'meta', tag: 'Roadmap', tagColor: 'purple',
      xp: 25, minutes: 5, priority: 'high', link: '/compass',
    })
  }

  return NextResponse.json({
    tasks: tasks.slice(0, 6),
    date: dateStr,
    userName: profile.name?.split(' ')[0] ?? 'there',
    targetRole: profile.target_role ?? 'SDE',
    streak: profile.streak ?? 0,
    xp: profile.xp ?? 0,
  })
  } catch (err) {
    console.error('[/api/tasks/today] Using fallback daily tasks:', err)
    return NextResponse.json({
      tasks: [
        {
          id: 'task-dsa-trees',
          title: 'DSA: Trees & Binary Search Trees',
          subtitle: 'Solve 2 medium tree problems — focus on recursion patterns',
          category: 'dsa',
          tag: 'DSA',
          tagColor: 'blue',
          xp: 25,
          minutes: 45,
          priority: 'high',
          link: '/dsa',
        },
        {
          id: 'task-subj-os',
          title: 'Study OS: CPU Scheduling & Threads',
          subtitle: 'FCFS, SJF, Round Robin — revise Gantt chart numericals',
          category: 'subject',
          tag: 'OS',
          tagColor: 'cyan',
          xp: 20,
          minutes: 30,
          priority: 'medium',
          link: '/subjects',
        },
        {
          id: 'task-roadmap-w1',
          title: '16-Week Placement Roadmap: Week 1',
          subtitle: 'Complete array manipulation and time complexity fundamentals',
          category: 'roadmap',
          tag: 'Roadmap',
          tagColor: 'purple',
          xp: 30,
          minutes: 40,
          priority: 'high',
          link: '/roadmap',
        },
        {
          id: 'task-sys-design',
          title: 'System Design: URL Shortener (TinyURL)',
          subtitle: 'Design schema, hashing algorithm, caching, and rate limiting',
          category: 'subject',
          tag: 'Sys Design',
          tagColor: 'emerald',
          xp: 25,
          minutes: 35,
          priority: 'medium',
          link: '/subjects',
        },
        {
          id: 'task-company-intel',
          title: 'Company Intel: Google & Amazon Patterns',
          subtitle: 'Review past OA coding questions and core topics',
          category: 'meta',
          tag: 'Company',
          tagColor: 'orange',
          xp: 20,
          minutes: 25,
          priority: 'medium',
          link: '/company',
        },
        {
          id: 'task-dsa-hard',
          title: 'DSA Challenge: Dynamic Programming',
          subtitle: 'Attempt 1 classic 0/1 knapsack or house robber problem',
          category: 'dsa',
          tag: 'DSA',
          tagColor: 'rose',
          xp: 35,
          minutes: 50,
          priority: 'high',
          link: '/dsa',
        },
      ],
      date: new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }),
      userName: 'Alex',
      targetRole: 'SDE',
      streak: 8,
      xp: 1450,
    })
  }
}
