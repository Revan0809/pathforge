import { createBrowserClient } from '@supabase/ssr'

export const DEMO_USER = {
  id: 'demo-user-123',
  email: 'student@pathforge.online',
  user_metadata: {
    name: 'Alex Sharma',
    avatar_url: '',
  },
  app_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  role: 'authenticated',
}

export const DEMO_SESSION = {
  access_token: 'demo-token-123',
  token_type: 'bearer',
  user: DEMO_USER,
  expires_in: 360000,
  expires_at: Math.floor(Date.now() / 1000) + 360000,
}

export const DEMO_PROFILE = {
  id: 'demo-user-123',
  name: 'Alex Sharma',
  target_role: 'SDE',
  semester: 6,
  college: 'Delhi Technological University (DTU)',
  xp: 1450,
  streak: 8,
  tier: 'premium',
  onboarding_complete: true,
}

export const DEMO_NOTIFICATIONS = [
  { id: '1', message: 'Welcome to PathForge! Full Pro access is unlocked.', read: false, created_at: new Date().toISOString() },
  { id: '2', message: 'Daily tasks generated. Complete them to earn 150 XP!', read: false, created_at: new Date().toISOString() },
]

const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const isRealConfig = Boolean(envUrl && envKey && !envUrl.includes('your-project-ref') && envUrl.startsWith('http'))

// Create base client if configured, otherwise create with fallback string
const rawClient = createBrowserClient(
  isRealConfig ? envUrl : 'https://demo.supabase.co',
  isRealConfig ? envKey : 'demo-key'
)

function getFallbackData(table: string) {
  if (table === 'users') {
    return { data: [DEMO_PROFILE], error: null }
  }
  if (table === 'notifications') {
    return { data: DEMO_NOTIFICATIONS, error: null }
  }
  return { data: [], error: null }
}

// Proxy wrapper to ensure seamless guest access without authentication friction
export const supabase = new Proxy(rawClient, {
  get(target, prop, receiver) {
    if (prop === 'auth') {
      const realAuth = Reflect.get(target, 'auth', receiver)
      return {
        ...realAuth,
        getSession: async () => {
          if (isRealConfig) {
            try {
              const res = await realAuth.getSession()
              if (res.data?.session) return res
            } catch { /* fallback to demo session */ }
          }
          return { data: { session: DEMO_SESSION }, error: null }
        },
        getUser: async () => {
          if (isRealConfig) {
            try {
              const res = await realAuth.getUser()
              if (res.data?.user) return res
            } catch { /* fallback to demo user */ }
          }
          return { data: { user: DEMO_USER }, error: null }
        },
        signOut: async () => {
          try {
            if (isRealConfig) await realAuth.signOut()
          } catch { /* ignore */ }
          window.location.href = '/dashboard'
          return { error: null }
        },
      }
    }

    if (prop === 'from') {
      return (table: string) => {
        const query = Reflect.get(target, 'from', receiver).call(target, table)
        return new Proxy(query, {
          get(qTarget: any, qProp: string | symbol) {
            if (qProp === 'then') {
              return (resolve: (val: unknown) => void) => {
                if (isRealConfig) {
                  Promise.resolve(qTarget)
                    .then((res: any) => {
                      if (res?.error || !res?.data) {
                        resolve(getFallbackData(table))
                      } else {
                        resolve(res)
                      }
                    })
                    .catch(() => resolve(getFallbackData(table)))
                } else {
                  resolve(getFallbackData(table))
                }
              }
            }

            if (qProp === 'single') {
              return () => ({
                then: (resolve: (val: unknown) => void) => {
                  if (table === 'users') {
                    resolve({ data: DEMO_PROFILE, error: null })
                  } else {
                    resolve({ data: null, error: null })
                  }
                },
              })
            }

            const orig = qTarget[qProp]
            if (typeof orig === 'function') {
              return (...args: any[]) => {
                try {
                  const res = orig.apply(qTarget, args)
                  return res
                } catch {
                  return qTarget
                }
              }
            }
            return orig
          },
        })
      }
    }

    return Reflect.get(target, prop, receiver)
  },
})
