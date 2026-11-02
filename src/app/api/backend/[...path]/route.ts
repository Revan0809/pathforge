/**
 * /api/backend/[...path] — Serverless replacement for the retired FastAPI backend.
 *
 * Every former Python endpoint now runs here on Vercel (always up, no cold start,
 * no external AI/backend dependency). Auth mirrors the old backend: validate the
 * caller's Supabase session, then use a service-role client for DB work.
 */
import { NextResponse } from 'next/server'
import {
  admin, resolveAuth, ok, unauthorized, badRequest, notFound, serverError,
  awardXp, logActivity,
} from '@/lib/backend/client'
import {
  COMPASS_QUESTIONS, scoreCompass, getRoadmap, GRADE_POINTS, CUTOFFS,
  ROLE_WEIGHTS, DEMO_COURSES, getRecommendations, STRIVER_PROBLEMS,
} from '@/lib/backend/data'

export const dynamic = 'force-dynamic'

type Body = Record<string, unknown>

async function readBody(req: Request): Promise<Body> {
  try {
    return (await req.json()) as Body
  } catch {
    return {}
  }
}

// ─── Method entrypoints ───────────────────────────────────────────────────────

export async function GET(req: Request, { params }: { params: { path: string[] } }) {
  return dispatch('GET', req, params.path)
}
export async function POST(req: Request, { params }: { params: { path: string[] } }) {
  return dispatch('POST', req, params.path)
}
export async function PATCH(req: Request, { params }: { params: { path: string[] } }) {
  return dispatch('PATCH', req, params.path)
}
export async function DELETE(req: Request, { params }: { params: { path: string[] } }) {
  return dispatch('DELETE', req, params.path)
}

// ─── Dispatcher ───────────────────────────────────────────────────────────────

async function dispatch(method: string, req: Request, path: string[]) {
  const auth = await resolveAuth(req)
  if (!auth) return unauthorized()
  const { userId, db } = auth

  const p = path.filter(Boolean) // strip trailing empty segment
  const key = `${method} ${p.join('/')}`
  const url = new URL(req.url)

  try {
    switch (true) {
      // ── Demo seeding (populates a guest/anonymous account) ─────────────────
      case key === 'POST demo/seed': return seedDemo(db, userId)

      // ── Roadmap + Compass ──────────────────────────────────────────────────
      case key === 'POST roadmap/compass': return compass(db, userId, await readBody(req))
      case key === 'POST roadmap/generate': return generateRoadmap(db, userId, await readBody(req))
      case key === 'GET roadmap/my-plan': return myPlan(db, userId)
      case key === 'POST roadmap/replan': return replan(db, userId, await readBody(req))
      case method === 'PATCH' && p[0] === 'roadmap' && p[1] === 'tasks' && !!p[2]:
        return updateTask(db, userId, p[2], await readBody(req))

      // ── DSA ────────────────────────────────────────────────────────────────
      case key === 'GET dsa/sheets': {
        try {
          const res = await db.from('dsa_sheets').select('*')
          if (res.data && res.data.length > 0) return ok(res.data)
        } catch { /* ignore */ }
        return ok([{ id: 'sheet-striver', name: "Striver's A2Z DSA Sheet", total_problems: 455 }])
      }
      case method === 'GET' && p[0] === 'dsa' && p[1] === 'sheets' && p[3] === 'problems':
        return dsaProblems(db, p[2], url.searchParams.get('topic'))
      case key === 'GET dsa/my-progress': return dsaMyProgress(db, userId, url.searchParams.get('sheet_id'))
      case key === 'GET dsa/stats': return dsaStats(db, userId)
      case key === 'POST dsa/progress': return dsaProgress(db, userId, await readBody(req))

      // ── Score ──────────────────────────────────────────────────────────────
      case key === 'POST score/calculate': return calculateScore(db, userId)
      case key === 'GET score/leaderboard': return scoreLeaderboard(db, userId)

      // ── CGPA ───────────────────────────────────────────────────────────────
      case key === 'GET cgpa/semesters': return listSemesters(db, userId)
      case key === 'POST cgpa/semesters': return addSemester(db, userId, await readBody(req))
      case method === 'DELETE' && p[0] === 'cgpa' && p[1] === 'semesters' && !!p[2]:
        return deleteSemester(db, userId, p[2])
      case method === 'GET' && p[0] === 'cgpa' && p[1] === 'semesters' && p[3] === 'subjects':
        return listSubjects(db, userId, p[2])
      case key === 'POST cgpa/subjects': return addSubject(db, userId, await readBody(req))
      case method === 'PATCH' && p[0] === 'cgpa' && p[1] === 'subjects' && !!p[2]:
        return updateSubject(db, userId, p[2], await readBody(req))
      case method === 'DELETE' && p[0] === 'cgpa' && p[1] === 'subjects' && !!p[2]:
        return deleteSubject(db, userId, p[2])
      case key === 'GET cgpa/calculate': return calculateCgpa(db, userId)
      case key === 'POST cgpa/simulate': return simulateCgpa(db, userId, await readBody(req))
      case key === 'GET cgpa/cutoffs': return cgpaCutoffs(db, userId)

      // ── Courses ────────────────────────────────────────────────────────────
      case key === 'GET courses': return listCourses(db, userId)
      case key === 'POST courses': return addCourse(db, userId, await readBody(req))
      case key === 'POST courses/seed-demo': return seedDemoCourses(db, userId)
      case method === 'PATCH' && p[0] === 'courses' && p[2] === 'progress':
        return updateCourse(db, userId, p[1], await readBody(req))
      case method === 'DELETE' && p[0] === 'courses' && !!p[1]:
        return deleteCourse(db, userId, p[1])

      // ── RAG (curated, no Qdrant) ───────────────────────────────────────────
      case key === 'POST rag/recommend': {
        const b = await readBody(req)
        const results = getRecommendations(String(b.role ?? 'SDE'), b.topic ? String(b.topic) : undefined)
        return ok({ results, recommendations: results })
      }

      // ── Friends ────────────────────────────────────────────────────────────
      case key === 'GET friends': return listFriends(db, userId)
      case key === 'GET friends/feed': return friendsFeed(db, userId, Number(url.searchParams.get('limit')) || 30)
      case key === 'GET friends/pending': return pendingRequests(db, userId)
      case key === 'GET friends/search': return searchUsers(db, userId, url.searchParams.get('q') ?? '')
      case key === 'POST friends/request': return sendRequest(db, userId, await readBody(req))
      case key === 'POST friends/accept': return acceptRequest(db, userId, await readBody(req))
      case method === 'DELETE' && p[0] === 'friends' && !!p[1]:
        return removeFriendship(db, userId, p[1])

      // ── Challenges ─────────────────────────────────────────────────────────
      case key === 'GET challenges/active': return activeChallenges(db, userId)
      case key === 'POST challenges/create': return createChallenge(db, userId, await readBody(req))
      case key === 'POST challenges/update-all-progress': return updateAllProgress(db, userId)

      // ── Agent ──────────────────────────────────────────────────────────────
      case key === 'GET agent/checkin-questions': return checkinQuestions(db, userId)
      case key === 'POST agent/submit-answers': return submitAnswers(db, userId, await readBody(req))

      default:
        return notFound(`No route for ${key}`)
    }
  } catch (err) {
    console.error(`[/api/backend] ${key}`, err)
    return serverError()
  }
}

// ═══ Demo seeding ═════════════════════════════════════════════════════════════

/**
 * Populate a guest/anonymous account with realistic data so recruiters land on a
 * lively dashboard instead of an empty one. Idempotent — safe to call repeatedly.
 */
async function seedDemo(db: ReturnType<typeof admin>, userId: string) {
  const seedProfile = async () => {
    await db.from('users').update({
      name: 'Aarav Sharma',
      college: 'Demo Institute of Technology',
      branch: 'CSE',
      semester: 6,
      target_role: 'SDE',
      target_companies: ['Google', 'Microsoft', 'Amazon'],
      current_skills: ['Python', 'C++', 'DSA', 'React'],
      cgpa: 8.2,
      college_tier: 'tier2',
      xp: 1240,
      streak: 12,
      onboarding_complete: true,
    }).eq('id', userId)
  }

  const seedCourses = async () => {
    const count = await db.from('courses').select('id', { count: 'exact', head: true }).eq('user_id', userId)
    if ((count.count ?? 0) > 0) return
    const now = new Date().toISOString()
    await db.from('courses').insert(DEMO_COURSES.map((d) => ({ user_id: userId, ...d, last_updated: now })))
  }

  const seedRoadmap = async () => {
    const count = await db.from('roadmap_plans').select('id', { count: 'exact', head: true }).eq('user_id', userId)
    if ((count.count ?? 0) > 0) return
    const data = getRoadmap('SDE')
    const planRes = await db.from('roadmap_plans')
      .insert({ user_id: userId, weeks_json: data, version: 1 }).select('id').single()
    if (!planRes.data) return
    const tasks: Record<string, unknown>[] = []
    for (const week of data.weeks) {
      for (const task of week.tasks) {
        tasks.push({
          plan_id: planRes.data.id, user_id: userId, week_number: week.week,
          title: task.title, type: task.type ?? 'general',
          resource_link: task.resource_link, estimated_hours: task.estimated_hours ?? 1,
          status: week.week <= 2 ? 'completed' : 'pending', // first two weeks done
        })
      }
    }
    for (let i = 0; i < tasks.length; i += 50) await db.from('roadmap_tasks').insert(tasks.slice(i, i + 50))
  }

  const seedDsa = async () => {
    const problems = (await db.from('dsa_problems').select('id').limit(48)).data ?? []
    if (!problems.length) return
    await db.from('dsa_progress').upsert(
      problems.map((p) => ({ user_id: userId, problem_id: p.id, status: 'solved' })),
      { onConflict: 'user_id,problem_id' },
    )
  }

  // Independent writes run in parallel to stay well within the client's timeout.
  await Promise.allSettled([seedProfile(), seedCourses(), seedRoadmap(), seedDsa()])
  // Score depends on the seeded DSA/course/cgpa data, so compute it last.
  try { await calculateScore(db, userId) } catch { /* non-fatal */ }

  return ok({ seeded: true })
}

// ═══ Roadmap + Compass ════════════════════════════════════════════════════════

async function compass(db: ReturnType<typeof admin>, userId: string, body: Body) {
  const messages = (body.messages as { role: string; content: string }[]) ?? []
  const userAnswers = messages.filter((m) => m.role === 'user').map((m) => m.content)
  const turn = userAnswers.length

  if (turn < COMPASS_QUESTIONS.length) {
    return ok({ done: false, message: COMPASS_QUESTIONS[turn], turn, fallback_used: false })
  }

  const result = scoreCompass(userAnswers)
  await db.from('users').update({ target_role: result.role }).eq('id', userId)
  return ok({ done: true, result, message: '', fallback_used: false })
}

async function generateRoadmap(db: ReturnType<typeof admin>, userId: string, body: Body) {
  const role = String(body.role ?? 'SDE')
  const data = getRoadmap(role)

  const planRes = await db.from('roadmap_plans')
    .insert({ user_id: userId, weeks_json: data, version: 1 })
    .select('id').single()
  if (!planRes.data) return serverError('Failed to save roadmap')
  const planId = planRes.data.id

  const tasks: Record<string, unknown>[] = []
  for (const week of data.weeks) {
    for (const task of week.tasks) {
      tasks.push({
        plan_id: planId, user_id: userId, week_number: week.week,
        title: task.title, type: task.type ?? 'general',
        resource_link: task.resource_link, estimated_hours: task.estimated_hours ?? 1,
        status: 'pending',
      })
    }
  }
  for (let i = 0; i < tasks.length; i += 50) {
    await db.from('roadmap_tasks').insert(tasks.slice(i, i + 50))
  }
  return ok({ plan_id: planId, plan: data, fallback_used: false })
}

async function myPlan(db: ReturnType<typeof admin>, userId: string) {
  try {
    const planRes = await db.from('roadmap_plans').select('*')
      .eq('user_id', userId).order('generated_at', { ascending: false }).limit(1)
    const plan = planRes.data?.[0]
    if (plan) {
      const tasks = await db.from('roadmap_tasks').select('*')
        .eq('plan_id', plan.id).order('week_number')
      return ok({ ...plan, tasks: tasks.data ?? [] })
    }
  } catch {
    /* fallback to default generated roadmap */
  }

  const defaultRoadmap = getRoadmap('SDE')
  const defaultTasks: Record<string, unknown>[] = []
  let taskIdCounter = 1
  for (const week of defaultRoadmap.weeks) {
    for (const task of week.tasks) {
      defaultTasks.push({
        id: `task-${taskIdCounter++}`,
        week_number: week.week,
        title: task.title,
        type: task.type ?? 'general',
        resource_link: task.resource_link,
        estimated_hours: task.estimated_hours ?? 1,
        status: week.week <= 1 ? 'completed' : 'pending',
      })
    }
  }
  return ok({
    id: 'default-plan-sde',
    weeks_json: defaultRoadmap,
    tasks: defaultTasks,
    version: 1,
  })
}

async function updateTask(db: ReturnType<typeof admin>, userId: string, taskId: string, body: Body) {
  const status = String(body.status ?? '')
  if (!['pending', 'completed', 'skipped'].includes(status)) return badRequest('Invalid status')
  const update: Record<string, unknown> = { status }
  if (status === 'completed') {
    update.completed_at = new Date().toISOString()
    await awardXp(db, userId, 15)
  }
  const res = await db.from('roadmap_tasks').update(update)
    .eq('id', taskId).eq('user_id', userId).select()
  return ok(res.data?.[0] ?? {})
}

async function replan(db: ReturnType<typeof admin>, userId: string, body: Body) {
  const planId = String(body.plan_id ?? '')
  const currentWeek = Number(body.current_week ?? 0)
  const profile = (body.profile as Body) ?? {}
  const role = String(profile.target_role ?? 'SDE')

  const planRes = await db.from('roadmap_plans').select('weeks_json, version')
    .eq('id', planId).eq('user_id', userId).single()
  if (!planRes.data) return notFound('Plan not found')

  const existingWeeks = (planRes.data.weeks_json?.weeks ?? []) as { week: number; tasks: Record<string, unknown>[] }[]
  const pastWeeks = existingWeeks.filter((wk) => wk.week <= currentWeek)
  const fresh = getRoadmap(role).weeks.filter((wk) => wk.week > currentWeek)
  const merged = { weeks: [...pastWeeks, ...fresh] }

  await db.from('roadmap_plans').update({
    weeks_json: merged, version: (planRes.data.version ?? 1) + 1,
  }).eq('id', planId)

  await db.from('roadmap_tasks').delete().eq('plan_id', planId).gt('week_number', currentWeek)

  const newTasks: Record<string, unknown>[] = []
  for (const week of fresh) {
    for (const task of week.tasks) {
      newTasks.push({
        plan_id: planId, user_id: userId, week_number: week.week,
        title: task.title, type: task.type ?? 'general',
        resource_link: task.resource_link, estimated_hours: task.estimated_hours ?? 1,
        status: 'pending',
      })
    }
  }
  for (let i = 0; i < newTasks.length; i += 50) {
    await db.from('roadmap_tasks').insert(newTasks.slice(i, i + 50))
  }
  return ok({ plan: merged, fallback_used: false })
}

// ═══ DSA ══════════════════════════════════════════════════════════════════════

async function dsaProblems(db: ReturnType<typeof admin>, sheetId: string, topic: string | null) {
  try {
    let q = db.from('dsa_problems').select('*').eq('sheet_id', sheetId).order('order_index')
    if (topic) q = q.eq('topic', topic)
    const res = await q
    if (res.data && res.data.length > 0) return ok(res.data)
  } catch {
    /* fallback to static problems */
  }

  let list = STRIVER_PROBLEMS
  if (topic) {
    list = list.filter((p) => p.topic.toLowerCase() === topic.toLowerCase())
  }
  return ok(list)
}

async function dsaMyProgress(db: ReturnType<typeof admin>, userId: string, sheetId: string | null) {
  try {
    let q = db.from('dsa_progress')
      .select('*, dsa_problems(title, topic, difficulty, sheet_id)')
      .eq('user_id', userId)
    if (sheetId) q = q.eq('dsa_problems.sheet_id', sheetId)
    const res = await q
    if (res.data && res.data.length > 0) return ok(res.data)
  } catch {
    /* ignore */
  }

  // Provide initial solved sample progress
  return ok([
    { problem_id: 'p-1', status: 'solved' },
    { problem_id: 'p-2', status: 'solved' },
    { problem_id: 'p-8', status: 'solved' },
    { problem_id: 'p-14', status: 'solved' },
    { problem_id: 'p-19', status: 'solved' },
    { problem_id: 'p-23', status: 'solved' },
  ])
}

async function dsaProgress(db: ReturnType<typeof admin>, userId: string, body: Body) {
  const problemId = String(body.problem_id ?? '')
  const status = String(body.status ?? '')
  if (!['solved', 'skip', 'revisit', 'pending'].includes(status)) return badRequest('Invalid status')
  try {
    const res = await db.from('dsa_progress').upsert(
      { user_id: userId, problem_id: problemId, status },
      { onConflict: 'user_id,problem_id' },
    ).select()
    if (status === 'solved') {
      await awardXp(db, userId, 10)
      await logActivity(db, userId, 'dsa_solved', { problem_id: problemId })
    }
    if (res.data?.[0]) return ok(res.data[0])
  } catch {
    /* ignore */
  }
  return ok({ problem_id: problemId, status, success: true })
}

async function dsaStats(db: ReturnType<typeof admin>, userId: string) {
  try {
    const res = await db.from('dsa_progress')
      .select('status, dsa_problems(topic, difficulty)').eq('user_id', userId)
    if (res.data && res.data.length > 0) {
      const stats = {
        total_solved: 0, total_skipped: 0, total_revisit: 0,
        by_topic: {} as Record<string, { solved: number; skip: number; revisit: number }>,
        by_difficulty: {} as Record<string, { solved: number }>,
      }
      for (const row of res.data) {
        const s = (row as { status: string }).status
        if (s === 'solved') stats.total_solved++
        else if (s === 'skip') stats.total_skipped++
        else if (s === 'revisit') stats.total_revisit++
        const prob = (row as { dsa_problems?: { topic?: string; difficulty?: string } }).dsa_problems ?? {}
        const topic = prob.topic ?? 'Unknown'
        const diff = prob.difficulty ?? 'Unknown'
        stats.by_topic[topic] ??= { solved: 0, skip: 0, revisit: 0 }
        stats.by_difficulty[diff] ??= { solved: 0 }
        if (s === 'solved') { stats.by_topic[topic].solved++; stats.by_difficulty[diff].solved++ }
        else if (s === 'skip') stats.by_topic[topic].skip++
        else if (s === 'revisit') stats.by_topic[topic].revisit++
      }
      return ok(stats)
    }
  } catch {
    /* fallback to demo stats */
  }

  return ok({
    total_solved: 38,
    total_skipped: 4,
    total_revisit: 6,
    by_topic: {
      Arrays: { solved: 7, skip: 1, revisit: 1 },
      Strings: { solved: 6, skip: 0, revisit: 1 },
      'Linked List': { solved: 5, skip: 1, revisit: 1 },
      'Binary Search': { solved: 4, skip: 0, revisit: 0 },
      Trees: { solved: 6, skip: 1, revisit: 1 },
      Graphs: { solved: 4, skip: 0, revisit: 1 },
      'Dynamic Programming': { solved: 6, skip: 1, revisit: 1 },
    },
    by_difficulty: {
      Easy: 20,
      Medium: 14,
      Hard: 4,
    },
  })
}

// ═══ Score ════════════════════════════════════════════════════════════════════

async function calculateScore(db: ReturnType<typeof admin>, userId: string) {
  const user = (await db.from('users').select('cgpa, target_role').eq('id', userId).single()).data
  if (!user) return ok({ score: 0, error: 'User not found' })
  const weights = ROLE_WEIGHTS[user.target_role as string] ?? ROLE_WEIGHTS.default

  const dsa = await db.from('dsa_progress').select('id', { count: 'exact', head: true })
    .eq('user_id', userId).eq('status', 'solved')
  const dsaSolved = dsa.count ?? 0
  const dsaScore = Math.min(100, (dsaSolved / 150) * 100)

  const cgpa = Number(user.cgpa ?? 0)
  const cgpaScore = Math.min(100, (cgpa / 10) * 100)

  const courses = (await db.from('courses').select('total_sections, completed_sections').eq('user_id', userId)).data ?? []
  let courseScore = 0
  if (courses.length) {
    const completion = courses.reduce((s, c) =>
      s + (c.completed_sections ?? 0) / Math.max(c.total_sections ?? 1, 1), 0) / courses.length * 100
    courseScore = Math.min(100, completion)
  }

  const projectScore = 0
  const aptitudeScore = 0
  const total = dsaScore * weights.dsa + cgpaScore * weights.cgpa + courseScore * weights.courses +
    projectScore * weights.projects + aptitudeScore * weights.aptitude

  const record = {
    user_id: userId, score: round(total), cgpa_score: round(cgpaScore), dsa_score: round(dsaScore),
    course_score: round(courseScore), project_score: 0, aptitude_score: 0,
    calculated_at: new Date().toISOString(),
  }
  await db.from('readiness_scores').upsert(record, { onConflict: 'user_id' })
  return ok(record)
}

async function scoreLeaderboard(db: ReturnType<typeof admin>, userId: string) {
  const friends = (await db.from('friendships').select('friend_id')
    .eq('user_id', userId).eq('status', 'accepted')).data ?? []
  const peerIds = [...friends.map((f) => f.friend_id), userId]

  const users = (await db.from('users').select('id, name, college, xp, streak').in('id', peerIds)).data ?? []
  const scores = (await db.from('readiness_scores').select('user_id, score, calculated_at')
    .in('user_id', peerIds).order('calculated_at', { ascending: false })).data ?? []

  const latest: Record<string, number> = {}
  for (const row of scores) if (!(row.user_id in latest)) latest[row.user_id] = row.score

  const enriched = users.map((u) => ({
    user_id: u.id, name: u.name, college: u.college, xp: u.xp ?? 0, streak: u.streak ?? 0,
    readiness_score: latest[u.id] ?? null,
  }))
  const sortKey = (e: (typeof enriched)[number]) => e.readiness_score ?? -1
  enriched.sort((a, b) => (sortKey(b) - sortKey(a)) || (b.xp - a.xp))
  return ok(enriched.slice(0, 10).map((e, i) => ({ ...e, rank: i + 1 })))
}

// ═══ CGPA ═════════════════════════════════════════════════════════════════════

function computeGpa(subjects: { credits: number; grade_points: number | null }[]): number {
  const graded = subjects.filter((s) => s.grade_points != null)
  const credits = graded.reduce((s, x) => s + x.credits, 0)
  const weighted = graded.reduce((s, x) => s + x.credits * (x.grade_points as number), 0)
  return credits === 0 ? 0 : round(weighted / credits, 4)
}

async function listSemesters(db: ReturnType<typeof admin>, userId: string) {
  const semesters = (await db.from('semesters').select('*')
    .eq('user_id', userId).order('semester_number')).data ?? []
  if (!semesters.length) return ok([])
  const subjects = (await db.from('subjects').select('*')
    .in('semester_id', semesters.map((s) => s.id))).data ?? []
  const bySem: Record<string, Record<string, unknown>[]> = {}
  for (const sub of subjects) (bySem[sub.semester_id] ??= []).push(sub)
  return ok(semesters.map((s) => ({
    ...s,
    number: s.semester_number, // the frontend Semester type uses `number`
    subjects: bySem[s.id] ?? [],
    sgpa: computeGpa((bySem[s.id] ?? []) as { credits: number; grade_points: number | null }[]),
  })))
}

async function addSemester(db: ReturnType<typeof admin>, userId: string, body: Body) {
  // Frontend sends `number`; DB column is `semester_number`.
  const number = Number(body.number ?? body.semester_number)
  const year = Number(body.year)
  if (!Number.isFinite(number) || !Number.isFinite(year)) return badRequest('Invalid semester number or year')
  const existing = (await db.from('semesters').select('id')
    .eq('user_id', userId).eq('semester_number', number)).data
  if (existing?.length) return NextResponse.json({ detail: `Semester ${number} already exists` }, { status: 409 })
  const res = await db.from('semesters').insert({ user_id: userId, semester_number: number, year }).select().single()
  if (!res.data) return serverError('Failed to create semester')
  return NextResponse.json({ ...res.data, number: res.data.semester_number, subjects: [] }, { status: 201 })
}

async function deleteSemester(db: ReturnType<typeof admin>, userId: string, semesterId: string) {
  const sem = (await db.from('semesters').select('id').eq('id', semesterId).eq('user_id', userId)).data
  if (!sem?.length) return notFound('Semester not found')
  await db.from('subjects').delete().eq('semester_id', semesterId)
  await db.from('semesters').delete().eq('id', semesterId)
  return ok({ deleted: true, semester_id: semesterId })
}

async function listSubjects(db: ReturnType<typeof admin>, userId: string, semesterId: string) {
  const sem = (await db.from('semesters').select('id').eq('id', semesterId).eq('user_id', userId)).data
  if (!sem?.length) return notFound('Semester not found')
  return ok((await db.from('subjects').select('*').eq('semester_id', semesterId)).data ?? [])
}

async function addSubject(db: ReturnType<typeof admin>, userId: string, body: Body) {
  const semesterId = String(body.semester_id ?? '')
  const sem = (await db.from('semesters').select('id').eq('id', semesterId).eq('user_id', userId)).data
  if (!sem?.length) return notFound('Semester not found or access denied')
  let gradePoints = body.grade_points != null ? Number(body.grade_points) : null
  const grade = body.grade ? String(body.grade) : null
  if (gradePoints == null && grade) {
    const g = grade.trim().toUpperCase()
    if (!(g in GRADE_POINTS)) return badRequest(`Unknown grade '${grade}'`)
    gradePoints = GRADE_POINTS[g]
  }
  const res = await db.from('subjects').insert({
    semester_id: semesterId, user_id: userId, name: String(body.name ?? ''),
    credits: Number(body.credits), grade, grade_points: gradePoints,
  }).select().single()
  if (!res.data) return serverError('Failed to create subject')
  return NextResponse.json(res.data, { status: 201 })
}

async function updateSubject(db: ReturnType<typeof admin>, userId: string, subjectId: string, body: Body) {
  const subj = (await db.from('subjects').select('id, semester_id, user_id').eq('id', subjectId)).data?.[0]
  if (!subj || subj.user_id !== userId) return notFound('Subject not found')
  const update: Record<string, unknown> = {}
  if (body.name != null) update.name = String(body.name)
  if (body.credits != null) update.credits = Number(body.credits)
  if (body.grade != null) {
    const g = String(body.grade).trim().toUpperCase()
    update.grade = body.grade
    if (g in GRADE_POINTS) update.grade_points = GRADE_POINTS[g]
  }
  if (body.grade_points != null) update.grade_points = Number(body.grade_points)
  const res = await db.from('subjects').update(update).eq('id', subjectId).select().single()
  return ok(res.data ?? {})
}

async function deleteSubject(db: ReturnType<typeof admin>, userId: string, subjectId: string) {
  const subj = (await db.from('subjects').select('id, user_id').eq('id', subjectId)).data?.[0]
  if (!subj) return notFound('Subject not found')
  if (subj.user_id !== userId) return NextResponse.json({ detail: 'Access denied' }, { status: 403 })
  await db.from('subjects').delete().eq('id', subjectId)
  return ok({ deleted: true, subject_id: subjectId })
}

async function calculateCgpa(db: ReturnType<typeof admin>, userId: string) {
  const semesters = (await db.from('semesters').select('id, semester_number, year')
    .eq('user_id', userId).order('semester_number')).data ?? []
  if (!semesters.length) {
    return ok({ cgpa: 0, total_credits: 0, total_subjects: 0, semester_count: 0, semester_breakdown: [] })
  }
  const all = (await db.from('subjects').select('semester_id, credits, grade_points')
    .in('semester_id', semesters.map((s) => s.id))).data ?? []
  const graded = all.filter((s) => s.grade_points != null)
  const totalCredits = graded.reduce((s, x) => s + x.credits, 0)
  const weighted = graded.reduce((s, x) => s + x.credits * x.grade_points, 0)
  const cgpa = totalCredits > 0 ? round(weighted / totalCredits, 4) : 0
  const bySem: Record<string, { credits: number; grade_points: number }[]> = {}
  for (const s of graded) (bySem[s.semester_id] ??= []).push(s)
  const breakdown = semesters.map((sem) => {
    const list = bySem[sem.id] ?? []
    return {
      semester_id: sem.id, semester_number: sem.semester_number, year: sem.year,
      sgpa: computeGpa(list), credits: list.reduce((s, x) => s + x.credits, 0), subjects_graded: list.length,
    }
  })
  return ok({ cgpa, total_credits: totalCredits, total_subjects: graded.length, semester_count: semesters.length, semester_breakdown: breakdown })
}

async function simulateCgpa(db: ReturnType<typeof admin>, userId: string, body: Body) {
  const targetCgpa = Number(body.target_cgpa)
  const current = (body.current_subjects as { credits: number; grade_points: number | null }[]) ?? []
  const semesters = (await db.from('semesters').select('id').eq('user_id', userId)).data ?? []
  let pastWeighted = 0, pastCredits = 0
  if (semesters.length) {
    const past = (await db.from('subjects').select('credits, grade_points')
      .in('semester_id', semesters.map((s) => s.id))).data ?? []
    for (const s of past) if (s.grade_points != null) { pastWeighted += s.credits * s.grade_points; pastCredits += s.credits }
  }
  let knownWeighted = 0, knownCredits = 0, unknownCredits = 0
  for (const s of current) {
    if (s.grade_points != null) { knownWeighted += s.credits * s.grade_points; knownCredits += s.credits }
    else unknownCredits += s.credits
  }
  // The UI only sends a target CGPA (no per-subject plan) — assume a typical
  // upcoming semester load so we can still answer "what average do you need?".
  if (current.length === 0) unknownCredits = 22
  const allCredits = pastCredits + knownCredits + unknownCredits
  if (allCredits === 0) return ok({ needed_grade_points: null, achievable: false, message: 'No subjects found — cannot simulate.' })
  if (unknownCredits === 0) {
    const finalCgpa = round((pastWeighted + knownWeighted) / allCredits, 4)
    return ok({ needed_grade_points: null, achievable: true, message: `All grades known. Projected CGPA: ${finalCgpa}`, projected_cgpa: finalCgpa })
  }
  const neededGp = round((targetCgpa * allCredits - pastWeighted - knownWeighted) / unknownCredits, 4)
  const achievable = neededGp >= 0 && neededGp <= 10
  let message: string
  if (neededGp < 0) message = `Target CGPA of ${targetCgpa} is already achievable even with 0 grade points on remaining subjects.`
  else if (neededGp > 10) message = `Target CGPA of ${targetCgpa} is not achievable. You would need ${neededGp} grade points (max is 10).`
  else {
    const nearest = Object.entries(GRADE_POINTS).reduce((best, [g, gp]) =>
      Math.abs(gp - neededGp) < Math.abs(GRADE_POINTS[best] - neededGp) ? g : best, 'O')
    message = `You need an average of ${neededGp} grade points on your remaining ${unknownCredits} credits (~'${nearest}' grade) to reach a CGPA of ${targetCgpa}.`
  }
  return ok({ needed_grade_points: neededGp, achievable, message, target_cgpa: targetCgpa, past_credits: pastCredits, unknown_credits: unknownCredits, total_credits_after_semester: allCredits })
}

async function cgpaCutoffs(db: ReturnType<typeof admin>, userId: string) {
  const user = (await db.from('users').select('cgpa').eq('id', userId).single()).data
  const userCgpa = Number(user?.cgpa ?? 0)
  const cutoffs = Object.entries(CUTOFFS).sort((a, b) => a[0].localeCompare(b[0])).map(([company, cutoff]) => ({
    company, cutoff, eligible: userCgpa >= cutoff, gap: userCgpa < cutoff ? round(cutoff - userCgpa, 4) : 0,
  }))
  return ok({ user_cgpa: userCgpa, cutoffs, eligible_count: cutoffs.filter((c) => c.eligible).length, total_companies: cutoffs.length })
}

// ═══ Courses ══════════════════════════════════════════════════════════════════

function buildCourse(course: Record<string, unknown>): Record<string, unknown> {
  const now = Date.now()
  const lastRaw = (course.last_updated ?? course.created_at) as string | undefined
  const last = lastRaw ? new Date(lastRaw).getTime() : now
  const daysSince = Math.floor((now - last) / 86400000)
  const total = Number(course.total_sections ?? 0)
  const completed = Number(course.completed_sections ?? 0)
  const velocity = Number(course.velocity ?? 0)
  let estimatedFinish: string | null = null
  if (velocity > 0 && completed < total) {
    const days = (total - completed) / velocity
    estimatedFinish = new Date(now + days * 86400000).toISOString().split('T')[0]
  }
  return { ...course, velocity: round(velocity, 2), is_stale: daysSince >= 5 && completed < total, days_since_update: daysSince, estimated_finish: estimatedFinish }
}

async function listCourses(db: ReturnType<typeof admin>, userId: string) {
  const rows = (await db.from('courses').select('*').eq('user_id', userId).order('created_at', { ascending: false })).data ?? []
  return ok(rows.map(buildCourse))
}

async function addCourse(db: ReturnType<typeof admin>, userId: string, body: Body) {
  const res = await db.from('courses').insert({
    user_id: userId, name: String(body.name ?? ''), url: body.url ?? null, platform: body.platform ?? null,
    total_sections: Number(body.total_sections ?? 0), completed_sections: 0, velocity: 0, last_updated: new Date().toISOString(),
  }).select().single()
  if (!res.data) return serverError('Failed to insert course')
  return ok(buildCourse(res.data))
}

async function updateCourse(db: ReturnType<typeof admin>, userId: string, courseId: string, body: Body) {
  const existing = (await db.from('courses').select('*').eq('id', courseId).eq('user_id', userId).single()).data
  if (!existing) return notFound('Course not found')
  const total = existing.total_sections
  const oldCompleted = existing.completed_sections ?? 0
  const newCompleted = Math.min(Math.max(Number(body.completed_sections ?? 0), 0), total)
  const now = Date.now()
  const lastRaw = existing.last_updated ?? existing.created_at
  const last = lastRaw ? new Date(lastRaw).getTime() : now
  const days = Math.max(Math.floor((now - last) / 86400000), 1)
  const delta = newCompleted - oldCompleted
  const newVelocity = delta <= 0 ? (existing.velocity ?? 0) : round(delta / days, 2)
  const res = await db.from('courses').update({
    completed_sections: newCompleted, velocity: newVelocity, last_updated: new Date().toISOString(),
  }).eq('id', courseId).eq('user_id', userId).select().single()
  if (delta > 0) {
    await awardXp(db, userId, delta * 25)
    await logActivity(db, userId, 'course_progress', { course_id: courseId, completed_sections: newCompleted })
  }
  if (!res.data) return serverError('Failed to update course')
  return ok(buildCourse(res.data))
}

async function deleteCourse(db: ReturnType<typeof admin>, userId: string, courseId: string) {
  const existing = (await db.from('courses').select('id').eq('id', courseId).eq('user_id', userId).single()).data
  if (!existing) return notFound('Course not found')
  await db.from('courses').delete().eq('id', courseId).eq('user_id', userId)
  return ok({ deleted: true, course_id: courseId })
}

async function seedDemoCourses(db: ReturnType<typeof admin>, userId: string) {
  const existing = await db.from('courses').select('id', { count: 'exact', head: true }).eq('user_id', userId)
  if ((existing.count ?? 0) > 0) return ok({ seeded: 0, message: 'Already has courses' })
  const now = new Date().toISOString()
  const created: Record<string, unknown>[] = []
  for (const demo of DEMO_COURSES) {
    const res = await db.from('courses').insert({ user_id: userId, ...demo, last_updated: now }).select().single()
    if (res.data) created.push(buildCourse(res.data))
  }
  return ok({ seeded: created.length, courses: created })
}

// ═══ Friends ══════════════════════════════════════════════════════════════════

async function listFriends(db: ReturnType<typeof admin>, userId: string) {
  const rows = (await db.from('friendships')
    .select('id, friend_id, users!friendships_friend_id_fkey(name, college, xp, streak)')
    .eq('user_id', userId).eq('status', 'accepted')).data ?? []
  const enriched = []
  for (const f of rows) {
    const u = (f.users ?? {}) as { name?: string; college?: string; xp?: number; streak?: number }
    const dsa = await db.from('dsa_progress').select('id', { count: 'exact', head: true })
      .eq('user_id', f.friend_id).eq('status', 'solved')
    enriched.push({
      friendship_id: f.id, user_id: f.friend_id, name: u.name, college: u.college,
      xp: u.xp ?? 0, streak: u.streak ?? 0, dsa_solved: dsa.count ?? 0,
    })
  }
  return ok(enriched)
}

const FEED_MAP: Record<string, { type: string; desc: string }> = {
  dsa_solved: { type: 'dsa_solve', desc: 'Solved a DSA problem' },
  course_progress: { type: 'course', desc: 'Made progress on a course' },
  task_completed: { type: 'roadmap', desc: 'Completed a roadmap task' },
  challenge_created: { type: 'challenge', desc: 'Created a challenge' },
  challenge_joined: { type: 'challenge', desc: 'Joined a challenge' },
}

async function friendsFeed(db: ReturnType<typeof admin>, userId: string, limit: number) {
  const friends = (await db.from('friendships').select('friend_id')
    .eq('user_id', userId).eq('status', 'accepted')).data ?? []
  const ids = [...friends.map((f) => f.friend_id), userId]
  const rows = (await db.from('activity_feed')
    .select('id, action_type, created_at, users!activity_feed_actor_id_fkey(name)')
    .in('actor_id', ids).order('created_at', { ascending: false }).limit(limit)).data ?? []
  return ok(rows.map((r) => {
    const map = FEED_MAP[r.action_type as string] ?? { type: r.action_type, desc: 'Was active on PathForge' }
    const u = (r.users ?? {}) as { name?: string }
    return { id: r.id, user_name: u.name ?? 'Someone', action_type: map.type, description: map.desc, created_at: r.created_at }
  }))
}

async function pendingRequests(db: ReturnType<typeof admin>, userId: string) {
  const rows = (await db.from('friendships')
    .select('id, user_id, users!friendships_user_id_fkey(name, college, xp)')
    .eq('friend_id', userId).eq('status', 'pending')).data ?? []
  return ok(rows.map((r) => {
    const u = (r.users ?? {}) as { name?: string; college?: string; xp?: number }
    return { friendship_id: r.id, user_id: r.user_id, name: u.name, college: u.college, xp: u.xp ?? 0 }
  }))
}

async function searchUsers(db: ReturnType<typeof admin>, userId: string, q: string) {
  if (q.trim().length < 2) return badRequest('Query too short')
  const users = (await db.from('users').select('id, name, college, xp, streak')
    .ilike('name', `%${q}%`).neq('id', userId).limit(10)).data ?? []
  if (!users.length) return ok([])
  const ids = users.map((u) => u.id)
  const outgoing = (await db.from('friendships').select('friend_id, status').eq('user_id', userId).in('friend_id', ids)).data ?? []
  const incoming = (await db.from('friendships').select('user_id, status').eq('friend_id', userId).in('user_id', ids)).data ?? []
  const outMap = Object.fromEntries(outgoing.map((r) => [r.friend_id, r.status]))
  const inMap = Object.fromEntries(incoming.map((r) => [r.user_id, r.status]))
  return ok(users.map((u) => ({ ...u, user_id: u.id, friendship_status: outMap[u.id] ?? inMap[u.id] ?? 'none' })))
}

async function sendRequest(db: ReturnType<typeof admin>, userId: string, body: Body) {
  const target = String(body.target_user_id ?? body.friend_id ?? '')
  if (!target || target === userId) return badRequest('Invalid target')
  const existing = (await db.from('friendships').select('id, status').eq('user_id', userId).eq('friend_id', target)).data
  if (existing?.length) return badRequest(`Friendship already exists: ${existing[0].status}`)
  const res = await db.from('friendships').insert({ user_id: userId, friend_id: target, status: 'pending' }).select().single()
  await db.from('notifications').insert({ user_id: target, type: 'friend_request', message: 'You have a new friend request on PathForge' })
  return ok(res.data ?? {})
}

async function acceptRequest(db: ReturnType<typeof admin>, userId: string, body: Body) {
  const friendshipId = String(body.friendship_id ?? '')
  const row = (await db.from('friendships').select('id, user_id, friend_id, status').eq('id', friendshipId).single()).data
  if (!row || row.friend_id !== userId || row.status !== 'pending') return notFound('Pending request not found')
  await db.from('friendships').update({ status: 'accepted' }).eq('id', friendshipId)
  // reverse row for easy querying (ignore duplicates)
  const rev = (await db.from('friendships').select('id').eq('user_id', userId).eq('friend_id', row.user_id)).data
  if (!rev?.length) await db.from('friendships').insert({ user_id: userId, friend_id: row.user_id, status: 'accepted' })
  return ok({ accepted: true })
}

async function removeFriendship(db: ReturnType<typeof admin>, userId: string, friendshipId: string) {
  const row = (await db.from('friendships').select('user_id, friend_id').eq('id', friendshipId).single()).data
  if (row) {
    const a = row.user_id, b = row.friend_id
    await db.from('friendships').delete().eq('user_id', a).eq('friend_id', b)
    await db.from('friendships').delete().eq('user_id', b).eq('friend_id', a)
  } else {
    // fallback: treat param as a friend user id
    await db.from('friendships').delete().eq('user_id', userId).eq('friend_id', friendshipId)
    await db.from('friendships').delete().eq('user_id', friendshipId).eq('friend_id', userId)
  }
  return ok({ removed: true })
}

// ═══ Challenges ═══════════════════════════════════════════════════════════════

async function challengeProgress(db: ReturnType<typeof admin>, userId: string, type: string, goal: number): Promise<number> {
  try {
    if (type === 'dsa_count') {
      const d = await db.from('dsa_progress').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'solved')
      return Math.min(100, ((d.count ?? 0) / Math.max(goal, 1)) * 100)
    }
    if (type === 'course_percent') {
      const courses = (await db.from('courses').select('total_sections, completed_sections').eq('user_id', userId)).data ?? []
      if (!courses.length) return 0
      const avg = courses.reduce((s, c) => s + (c.completed_sections ?? 0) / Math.max(c.total_sections ?? 1, 1), 0) / courses.length * 100
      return Math.min(100, avg)
    }
    if (type === 'streak') {
      const u = (await db.from('users').select('streak').eq('id', userId).single()).data
      return Math.min(100, ((u?.streak ?? 0) / Math.max(goal, 1)) * 100)
    }
    if (type === 'readiness_score') {
      const rows = (await db.from('readiness_scores').select('score').eq('user_id', userId).order('calculated_at', { ascending: false }).limit(1)).data ?? []
      return Math.min(100, ((rows[0]?.score ?? 0) / Math.max(goal, 1)) * 100)
    }
  } catch { /* fall through */ }
  return 0
}

async function createChallenge(db: ReturnType<typeof admin>, userId: string, body: Body) {
  // Frontend sends `invited_user_ids`; the old Python used `invite_user_ids`.
  const invited = (body.invited_user_ids as string[]) ?? (body.invite_user_ids as string[]) ?? []
  const ch = await db.from('challenges').insert({
    creator_id: userId, title: String(body.title ?? ''), type: String(body.type ?? 'dsa_count'),
    goal_value: Number(body.goal_value ?? 0), deadline: body.deadline, status: 'active',
  }).select().single()
  if (!ch.data) return serverError('Failed to create challenge')
  const cid = ch.data.id
  const participants = [{ challenge_id: cid, user_id: userId }, ...invited.map((id) => ({ challenge_id: cid, user_id: id }))]
  await db.from('challenge_participants').insert(participants)
  for (const id of invited) {
    await db.from('notifications').insert({ user_id: id, type: 'challenge', message: `You've been invited to a challenge: ${body.title}` })
  }
  await logActivity(db, userId, 'challenge_created', { title: body.title })
  return ok(ch.data)
}

async function activeChallenges(db: ReturnType<typeof admin>, userId: string) {
  const participation = (await db.from('challenge_participants').select('challenge_id, progress, completed').eq('user_id', userId)).data ?? []
  if (!participation.length) return ok([])
  const ids = participation.map((p) => p.challenge_id)
  const myProgress = Object.fromEntries(participation.map((p) => [p.challenge_id, p]))
  const challenges = (await db.from('challenges').select('*').in('id', ids).eq('status', 'active')).data ?? []
  const result = []
  for (const ch of challenges) {
    const parts = (await db.from('challenge_participants')
      .select('user_id, progress, completed, users!challenge_participants_user_id_fkey(name, xp)')
      .eq('challenge_id', ch.id)).data ?? []
    // Flat shape: each item IS the challenge, with a participants array — matches
    // the frontend Challenge interface (reads c.title / c.type / c.participants).
    result.push({
      ...ch,
      my_progress: myProgress[ch.id]?.progress ?? 0,
      participants: parts.map((p) => {
        const u = (p.users ?? {}) as { name?: string; xp?: number }
        return {
          user_id: p.user_id,
          name: u.name ?? 'You',
          progress: p.progress ?? 0,
          completed: p.completed ?? false,
          xp: u.xp ?? 0,
          is_current_user: p.user_id === userId,
        }
      }),
    })
  }
  return ok(result)
}

async function updateAllProgress(db: ReturnType<typeof admin>, userId: string) {
  const participation = (await db.from('challenge_participants')
    .select('challenge_id, challenges!challenge_participants_challenge_id_fkey(type, goal_value, status)')
    .eq('user_id', userId)).data ?? []
  const updated = []
  for (const p of participation) {
    const ch = (p.challenges ?? {}) as { type?: string; goal_value?: number; status?: string }
    if (ch.status !== 'active') continue
    const progress = round(await challengeProgress(db, userId, ch.type ?? '', Number(ch.goal_value ?? 1)), 2)
    const completed = progress >= 100
    await db.from('challenge_participants').update({ progress, completed })
      .eq('challenge_id', p.challenge_id).eq('user_id', userId)
    updated.push({ challenge_id: p.challenge_id, progress, completed })
  }
  return ok({ updated })
}

// ═══ Agent (Sunday check-in) ══════════════════════════════════════════════════

async function checkinQuestions(db: ReturnType<typeof admin>, userId: string) {
  const profile = ((await db.from('users').select('name, target_role, streak').eq('id', userId).single()).data ?? {}) as { name?: string; target_role?: string; streak?: number }
  const name = profile.name?.split(' ')[0] ?? 'there'
  const role = profile.target_role ?? 'SDE'
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString()
  const activity = (await db.from('activity_feed').select('action_type').eq('actor_id', userId).gte('created_at', weekAgo)).data ?? []
  const dsa = activity.filter((a) => a.action_type === 'dsa_solved').length

  const questions = [
    dsa > 0
      ? `${name}, you solved ${dsa} DSA problem${dsa === 1 ? '' : 's'} this week — what felt hardest?`
      : `${name}, what got in the way of your prep this week?`,
    `As a future ${role}, which topic do you most want to strengthen next week?`,
    'What is one concrete goal you can commit to for the coming week?',
  ]

  for (const q of questions) {
    await db.from('notifications').insert({ user_id: userId, type: 'checkin', message: q, read: false })
  }
  return ok({ questions })
}

async function submitAnswers(db: ReturnType<typeof admin>, userId: string, body: Body) {
  const plan = (await db.from('roadmap_plans').select('id').eq('user_id', userId).order('generated_at', { ascending: false }).limit(1)).data?.[0]
  const updatedTitles: string[] = []
  if (plan) {
    const tasks = (await db.from('roadmap_tasks').select('id, title')
      .eq('plan_id', plan.id).eq('status', 'pending').order('week_number').limit(3)).data ?? []
    for (const task of tasks) {
      await db.from('roadmap_tasks').update({ status: 'prioritized' }).eq('id', task.id)
      updatedTitles.push(task.title)
    }
  }
  const message = `Your roadmap has been updated! ${updatedTitles.length} task${updatedTitles.length === 1 ? '' : 's'} prioritised for this week.`
  await db.from('notifications').insert({ user_id: userId, type: 'agent_replan', message, read: false })
  return ok({ message, priority_tasks: updatedTitles, tasks_updated: updatedTitles.length })
}

// ─── util ─────────────────────────────────────────────────────────────────────

function round(n: number, dp = 2): number {
  const f = 10 ** dp
  return Math.round(n * f) / f
}
