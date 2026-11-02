import { NextResponse } from 'next/server'

/**
 * GET /api/health
 * Liveness probe. PathForge now runs fully serverless (Next.js on Vercel +
 * Supabase) — there is no separate backend service to ping, so the whole app
 * is healthy whenever this route responds.
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    frontend: 'ok',
    backend: 'serverless',
    timestamp: new Date().toISOString(),
  })
}
