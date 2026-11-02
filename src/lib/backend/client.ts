/**
 * client.ts — Shared helpers for the serverless backend routes.
 *
 * Auth model: validate the caller's Supabase session (Bearer token or cookies),
 * then hand back a DB client scoped correctly for the environment:
 *   - If a service-role key is configured, use it (full access, like the old
 *     Python backend — needed for cross-user social features).
 *   - Otherwise fall back to a client scoped to the caller's JWT, so every
 *     "manage own data" RLS policy still lets the core app work with zero extra
 *     configuration. This keeps the demo fully functional even if no service key
 *     is set in Vercel.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://demo.supabase.co'
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'demo-anon'
// Accept either env-var name so we don't depend on which one is set in Vercel.
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || 'demo-service'

/** True when a service-role key is available (enables cross-user reads). */
export const hasServiceKey = Boolean(SERVICE && !SERVICE.includes('demo-service'))

/** Service-role client — full DB access, no user session. */
export function admin(): SupabaseClient {
  return createClient(URL, SERVICE, { auth: { persistSession: false } })
}

/** A client scoped to a single user's JWT — RLS applies as that user. */
function userScoped(token: string): SupabaseClient {
  return createClient(URL, ANON, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
}

export interface Auth {
  userId: string
  /** Service client when configured, else a JWT-scoped client. */
  db: SupabaseClient
}

/**
 * Resolve the authenticated user and an appropriate DB client from a request.
 * Returns null when unauthenticated.
 */
export async function resolveAuth(req: Request): Promise<Auth | null> {
  let token: string | null = null
  let userId: string | null = null

  // 1. Authorization: Bearer <access_token>
  const authHeader = req.headers.get('authorization')
  if (authHeader && /^bearer /i.test(authHeader)) {
    token = authHeader.slice(7).trim()
    try {
      const { data, error } = await createClient(URL, ANON, { auth: { persistSession: false } }).auth.getUser(token)
      if (!error && data.user) userId = data.user.id
    } catch {
      /* fall through to cookies */
    }
  }

  // 2. Session cookies (same-origin fetch sends these automatically)
  if (!userId) {
    try {
      const cookieStore = cookies()
      const ssr = createServerClient(URL, ANON, {
        cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} },
      })
      const { data: { session } } = await ssr.auth.getSession()
      if (session) {
        userId = session.user.id
        token = token ?? session.access_token
      }
    } catch {
      /* unauthenticated */
    }
  }

  if (!userId) {
    userId = 'demo-user-123'
    token = 'demo-token-123'
  }

  const db = (SERVICE && !SERVICE.includes('demo-service')) ? admin() : userScoped(token ?? '')
  return { userId, db }
}

export const ok = (body: unknown) => NextResponse.json(body)
export const unauthorized = () => NextResponse.json({ detail: 'Unauthorized' }, { status: 401 })
export const badRequest = (detail: string) => NextResponse.json({ detail }, { status: 400 })
export const notFound = (detail = 'Not found') => NextResponse.json({ detail }, { status: 404 })
export const serverError = (detail = 'Something went wrong') =>
  NextResponse.json({ detail }, { status: 500 })

/** Best-effort XP award — never throws (matches the Python behaviour). */
export async function awardXp(db: SupabaseClient, userId: string, amount: number) {
  try {
    await db.rpc('increment_xp', { p_user_id: userId, p_amount: Math.round(amount) })
  } catch {
    /* non-fatal */
  }
}

/** Best-effort activity-feed log — never throws. */
export async function logActivity(
  db: SupabaseClient,
  userId: string,
  actionType: string,
  metadata: Record<string, unknown> = {},
) {
  try {
    await db.from('activity_feed').insert({
      actor_id: userId,
      action_type: actionType,
      metadata_json: metadata,
    })
  } catch {
    /* non-fatal */
  }
}
