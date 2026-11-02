import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')

  // OAuth provider returned an error
  if (error) {
    console.error('OAuth error:', error, errorDescription)
    return NextResponse.redirect(
      new URL(`/auth?error=${encodeURIComponent(errorDescription || error)}`, requestUrl.origin)
    )
  }

  if (!code) {
    return NextResponse.redirect(new URL('/auth', requestUrl.origin))
  }

  // Collect cookies to attach to the redirect response.
  // IMPORTANT: NextResponse.redirect() does NOT inherit cookies set via
  // next/headers cookies(). We must set them on the response directly.
  const pendingCookies: { name: string; value: string; options: Record<string, unknown> }[] = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Buffer — will be written onto the final redirect response below
          cookiesToSet.forEach((c) => pendingCookies.push(c))
        },
      },
    }
  )

  const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    console.error('Code exchange error:', exchangeError)
    return NextResponse.redirect(
      new URL(`/auth?error=${encodeURIComponent(exchangeError.message)}`, requestUrl.origin)
    )
  }

  // Decide where to send the user
  let redirectPath = '/onboarding'

  if (data.session) {
    try {
      const { data: profile } = await supabase
        .from('users')
        .select('onboarding_complete')
        .eq('id', data.session.user.id)
        .single()

      if (profile?.onboarding_complete) {
        redirectPath = '/dashboard'
      }
    } catch {
      // users table query failed — default to onboarding
    }
  }

  // Build redirect response and attach the session cookies
  const response = NextResponse.redirect(new URL(redirectPath, requestUrl.origin))
  pendingCookies.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
  })

  return response
}
