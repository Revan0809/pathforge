'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Send, Loader2, ArrowRight, RotateCcw } from 'lucide-react'
import { FallbackBanner } from '@/components/ui/fallback-banner'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface CompassResult {
  role: string
  confidence: number
  reasoning: string
  alternatives: { role: string; fit: number }[]
  traits: string[]
}

const BACKEND = '/api/backend'

export default function CompassPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CompassResult | null>(null)
  const [profile, setProfile] = useState<Record<string, unknown>>({})
  const [token, setToken] = useState('')
  const [turn, setTurn] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [compassFallback, setCompassFallback] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getSession()
      const session = data?.session
      const tok = session?.access_token ?? 'demo-token'
      setToken(tok)

      let userProfile = {}
      try {
        const { data: user } = await supabase
          .from('users')
          .select('name,semester,college_tier,target_role,current_skills,target_companies')
          .eq('id', session?.user?.id ?? 'demo-user-123')
          .single()
        if (user) {
          userProfile = user
          setProfile(user)
        }
      } catch { /* use default */ }

      // Kick off first question
      await sendToAPI([], userProfile, tok)
    }
    init()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function sendToAPI(msgs: Message[], prof: Record<string, unknown>, tok: string) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${BACKEND}/roadmap/compass`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok}` },
        body: JSON.stringify({ messages: msgs, profile: prof }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data?.detail || `Server error ${res.status}`)
        setLoading(false)
        return
      }

      if (data.fallback_used) setCompassFallback(true)

      if (data.done && data.result) {
        setResult(data.result)
      } else if (data.message) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.message }])
        setTurn(data.turn || 0)
      } else {
        setError('Hmm, no response just now. Please try again.')
      }
    } catch {
      setError('Network hiccup — please check your connection and try again.')
    }
    setLoading(false)
  }

  async function handleSend() {
    if (!input.trim() || loading) return
    const userMsg: Message = { role: 'user', content: input.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    await sendToAPI(newMessages, profile, token)
  }

  async function handleGenerateRoadmap() {
    if (!result) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${BACKEND}/roadmap/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role: result.role, profile }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.detail || `Roadmap generation failed (${res.status})`)
      } else if (data.plan_id) {
        window.location.href = '/roadmap'
      } else {
        setError('Roadmap saved but ID missing — try again')
      }
    } catch {
      setError('Network hiccup — please check your connection and try again.')
    }
    setLoading(false)
  }

  function handleReset() {
    setMessages([])
    setResult(null)
    setTurn(0)
    sendToAPI([], profile, token)
  }

  const roleColors: Record<string, string> = {
    'SDE': 'from-blue-500 to-indigo-600',
    'ML Engineer': 'from-violet-500 to-purple-600',
    'Data Analyst': 'from-emerald-500 to-teal-600',
    'DevOps': 'from-orange-500 to-amber-600',
    'Product Manager': 'from-pink-500 to-rose-600',
  }
  const roleEmoji: Record<string, string> = {
    'SDE': '💻', 'ML Engineer': '🤖', 'Data Analyst': '📊', 'DevOps': '⚙️', 'Product Manager': '🧭',
  }

  return (
    <div className="min-h-screen page-bg text-white flex flex-col">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a href="/dashboard" className="text-white/40 hover:text-white text-sm transition-colors">← Dashboard</a>
          <span className="text-white/20">/</span>
          <span className="text-white font-heading font-semibold">Role Compass</span>
        </div>
        {messages.length > 0 && !result && (
          <div className="flex items-center gap-2">
            <span className="text-white/30 text-sm">{Math.min(turn, 10)} / 10 questions</span>
            <div className="flex gap-0.5">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className={`h-1 w-4 rounded-full transition-all ${i < Math.min(turn, 10) ? 'bg-white' : 'bg-white/10'}`} />
              ))}
            </div>
            <button onClick={handleReset} className="ml-2 text-white/30 hover:text-white/60 transition-colors">
              <RotateCcw size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Result screen */}
      {result ? (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-lg w-full space-y-6">
            <div className="text-center space-y-2">
              <p className="text-white/40 text-sm font-body tracking-widest uppercase">Your best-fit role</p>
              <div className={`inline-flex items-center gap-3 bg-gradient-to-r ${roleColors[result.role] || 'from-white/20 to-white/10'} px-6 py-3 rounded-2xl`}>
                <span className="text-3xl">{roleEmoji[result.role] || '🎯'}</span>
                <span className="font-heading text-4xl font-bold text-white">{result.role}</span>
              </div>
              <p className="text-white/50 text-sm">{result.confidence}% confidence</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
              <p className="text-white/70 text-sm leading-relaxed font-body">{result.reasoning}</p>

              <div className="flex flex-wrap gap-2">
                {result.traits?.map(t => (
                  <span key={t} className="text-xs bg-white/10 text-white/60 px-3 py-1 rounded-full font-body">{t}</span>
                ))}
              </div>

              {result.alternatives?.length > 0 && (
                <div className="border-t border-white/10 pt-4">
                  <p className="text-white/30 text-xs mb-2 font-body uppercase tracking-wider">Alternative fits</p>
                  <div className="space-y-2">
                    {result.alternatives.map(a => (
                      <div key={a.role} className="flex items-center justify-between">
                        <span className="text-white/50 text-sm font-body">{roleEmoji[a.role]} {a.role}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-1 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-white/40 rounded-full" style={{ width: `${a.fit}%` }} />
                          </div>
                          <span className="text-white/30 text-xs w-8 text-right">{a.fit}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-2.5">
                <p className="text-red-400 text-xs font-body">{error}</p>
              </div>
            )}

            <Button
              onClick={handleGenerateRoadmap}
              disabled={loading}
              className="w-full h-12 bg-white text-black font-heading font-semibold hover:bg-white/90 rounded-xl text-base"
            >
              {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
              Generate my 16-week roadmap
              {!loading && <ArrowRight size={18} className="ml-2" />}
            </Button>

            <button onClick={handleReset} className="w-full text-white/30 text-sm hover:text-white/50 transition-colors font-body">
              Retake the compass
            </button>
          </div>
        </div>
      ) : (
        /* Chat UI */
        <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full">
          {compassFallback && <div className="px-4 pt-4"><FallbackBanner /></div>}
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
            {messages.length === 0 && !loading && (
              <div className="text-center py-16 space-y-3">
                <div className="text-5xl">🧭</div>
                <p className="font-heading text-xl text-white/80">Role Compass</p>
                <p className="font-body text-white/40 text-sm max-w-xs mx-auto">10 questions to find your best-fit career in tech. Be honest for the most accurate result.</p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm font-body leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-white text-black rounded-br-sm'
                    : 'bg-white/8 border border-white/10 text-white/80 rounded-bl-sm'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white/8 border border-white/10 px-4 py-3 rounded-2xl rounded-bl-sm">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Error banner */}
          {error && (
            <div className="mx-4 mb-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-2.5">
              <p className="text-red-400 text-xs font-body">{error}</p>
            </div>
          )}

          {/* Input */}
          <div className="border-t border-white/10 p-4">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Type your answer..."
                disabled={loading}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 text-sm font-body focus:outline-none focus:border-white/30 disabled:opacity-40 transition-colors"
              />
              <Button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="bg-white text-black hover:bg-white/90 rounded-xl w-12 h-12 p-0 flex items-center justify-center"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
