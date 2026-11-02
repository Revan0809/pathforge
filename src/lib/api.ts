/**
 * Production-grade API wrapper
 * – timeout protection (8s default)
 * – auto-retry (2 attempts, exponential backoff)
 * – structured error logging (no sensitive data leaked to UI)
 * – human-readable error messages
 */

const DEFAULT_TIMEOUT_MS = 8000
const MAX_RETRIES = 2

export class AppError extends Error {
  constructor(
    public readonly userMessage: string,
    public readonly code: string,
    public readonly status?: number,
    originalError?: unknown
  ) {
    super(userMessage)
    this.name = 'AppError'
    if (originalError) logError(originalError, code)
  }
}

// ── Internal error logger (never exposes stack to users) ──────────────────────
export function logError(err: unknown, context = 'unknown') {
  const message = err instanceof Error ? err.message : String(err)
  const stack   = err instanceof Error ? err.stack   : undefined
  // In production this could ship to Sentry / LogRocket
  console.error(`[PathForge:${context}]`, message, stack ?? '')
}

// ── Human-readable message mapper ─────────────────────────────────────────────
function toUserMessage(status: number | undefined, raw: string): string {
  if (!navigator.onLine) return 'No internet connection. Please check your network.'
  if (raw.includes('rate limit') || raw.includes('429') || status === 429)
    return 'AI is currently busy. Please try again in a few seconds.'
  if (raw.includes('quota') || raw.includes('billing'))
    return 'AI service limit reached. Please try again later.'
  if (raw.includes('timeout') || raw.includes('AbortError'))
    return 'Request timed out. Please check your connection and retry.'
  if (status === 401 || status === 403)
    return 'Session expired. Please sign in again.'
  if (status === 503 || status === 502)
    return 'Service temporarily unavailable. Please try again shortly.'
  if (status && status >= 500)
    return 'Something went wrong on our end. We\'re on it — try again in a moment.'
  return 'Service temporarily unavailable. Please try again shortly.'
}

// ── Core fetch wrapper ────────────────────────────────────────────────────────
export async function apiFetch<T = unknown>(
  url: string,
  options: RequestInit & { timeoutMs?: number } = {},
  retries = MAX_RETRIES
): Promise<T> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, ...fetchOptions } = options

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(url, { ...fetchOptions, signal: controller.signal })
    clearTimeout(timer)

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      const raw  = body?.error ?? body?.message ?? res.statusText
      throw new AppError(toUserMessage(res.status, raw), `HTTP_${res.status}`, res.status)
    }

    return res.json() as Promise<T>
  } catch (err: unknown) {
    clearTimeout(timer)

    // Retry on network errors or 5xx (not on 4xx — those are client errors)
    const status = err instanceof AppError ? err.status : undefined
    const isRetryable = !status || status >= 500

    if (retries > 0 && isRetryable) {
      const delay = (MAX_RETRIES - retries + 1) * 800
      await new Promise(r => setTimeout(r, delay))
      return apiFetch<T>(url, options, retries - 1)
    }

    if (err instanceof AppError) throw err

    const raw = err instanceof Error ? err.message : String(err)
    throw new AppError(toUserMessage(undefined, raw), 'FETCH_ERROR', undefined, err)
  }
}

// ── Backend API helper (pre-fills auth header) ────────────────────────────────
export async function backendFetch<T = unknown>(
  path: string,
  token: string,
  options: RequestInit & { timeoutMs?: number } = {}
): Promise<T> {
  const BACKEND = '/api/backend'
  return apiFetch<T>(`${BACKEND}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  })
}
