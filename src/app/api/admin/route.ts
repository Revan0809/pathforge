import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Server-side admin endpoint — service role key stays on the server, never reaches the browser.
// Only users whose email is in ADMIN_EMAILS env var can access this.

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim().toLowerCase())

export async function GET(req: NextRequest) {
  // 1. Verify the caller is an authenticated admin
  const cookieStore = cookies()
  const userClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() {},
      },
    }
  )
  const { data: { user } } = await userClient.auth.getUser()

  if (!user || !ADMIN_EMAILS.includes((user.email ?? '').toLowerCase())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 2. Use service role key to bypass RLS and read all data
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  const [usersRes, dsaRes, coursesRes, scoresRes, plansRes] = await Promise.all([
    admin.from('users').select('id, name, email, college, branch, semester, target_role, college_tier, xp, streak, tier, onboarding_complete, created_at').order('created_at', { ascending: false }),
    admin.from('dsa_progress').select('user_id, status').eq('status', 'solved'),
    admin.from('courses').select('user_id, completed_sections, total_sections'),
    admin.from('readiness_scores').select('user_id, score, calculated_at').order('calculated_at', { ascending: false }),
    admin.from('roadmap_plans').select('user_id, generated_at').order('generated_at', { ascending: false }),
  ])

  const users = usersRes.data ?? []

  // Build per-user stats map
  const dsaCount: Record<string, number> = {}
  for (const row of (dsaRes.data ?? [])) {
    dsaCount[row.user_id] = (dsaCount[row.user_id] ?? 0) + 1
  }

  const latestScore: Record<string, number> = {}
  for (const row of (scoresRes.data ?? [])) {
    if (!(row.user_id in latestScore)) latestScore[row.user_id] = row.score
  }

  const hasRoadmap = new Set((plansRes.data ?? []).map((r) => r.user_id))

  const courseCompletion: Record<string, number> = {}
  for (const row of (coursesRes.data ?? [])) {
    if (!courseCompletion[row.user_id]) courseCompletion[row.user_id] = 0
    const pct = row.total_sections > 0 ? (row.completed_sections / row.total_sections) * 100 : 0
    courseCompletion[row.user_id] = Math.max(courseCompletion[row.user_id], pct)
  }

  const enriched = users.map((u) => ({
    ...u,
    dsa_solved: dsaCount[u.id] ?? 0,
    readiness_score: latestScore[u.id] ?? null,
    has_roadmap: hasRoadmap.has(u.id),
    course_completion_pct: Math.round(courseCompletion[u.id] ?? 0),
  }))

  return NextResponse.json({ users: enriched, total: enriched.length })
}
