'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  Crown,
  Check,
  X,
  Zap,
  Star,
  Shield,
} from 'lucide-react'

interface UserProfile {
  name: string
  email: string
  tier: string
}

// Extend window to allow Razorpay
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any
  }
}

export default function UpgradePage() {
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/auth'; return }

      const { data } = await supabase
        .from('users')
        .select('name, email, tier')
        .eq('id', session.user.id)
        .single()

      setUserProfile(data)
      setLoading(false)
    }
    init()
  }, [])

  async function loadRazorpayScript(): Promise<boolean> {
    return new Promise((resolve) => {
      if (window.Razorpay) { resolve(true); return }
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  async function handleUpgrade() {
    setPaymentLoading(true)
    try {
      // 1. Create order via Next.js API route (no external backend needed)
      const orderRes = await fetch('/api/payments/create-order', { method: 'POST' })
      const orderData = await orderRes.json()

      if (orderRes.status === 503) {
        alert('Payment coming soon! Razorpay keys not configured yet.')
        setPaymentLoading(false)
        return
      }
      if (!orderRes.ok) {
        alert(orderData.error ?? 'Failed to create payment order. Please try again.')
        setPaymentLoading(false)
        return
      }

      // 2. Load Razorpay checkout SDK
      const loaded = await loadRazorpayScript()
      if (!loaded) {
        alert('Failed to load payment gateway. Check your internet connection.')
        setPaymentLoading(false)
        return
      }

      // 3. Open Razorpay checkout
      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'PathForge',
        description: 'Premium — Monthly',
        image: '/icon.svg',
        order_id: orderData.order_id,
        handler: async (response: {
          razorpay_payment_id: string
          razorpay_order_id: string
          razorpay_signature: string
        }) => {
          // 4. Verify signature + upgrade tier server-side
          const verifyRes = await fetch('/api/payments/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(response),
          })
          const verifyData = await verifyRes.json()
          if (verifyRes.ok) {
            setSuccess(true)
          } else {
            alert(verifyData.error ?? 'Payment verification failed. Contact support@pathforge.dev')
          }
        },
        prefill: {
          name: userProfile?.name ?? '',
          email: userProfile?.email ?? '',
        },
        notes: { platform: 'pathforge_web' },
        theme: { color: '#7C3AED' },
        modal: {
          ondismiss: () => setPaymentLoading(false),
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', (r: { error: { description: string } }) => {
        alert(`Payment failed: ${r.error.description}`)
        setPaymentLoading(false)
      })
      rzp.open()
    } catch (err) {
      console.error(err)
      alert('Something went wrong. Please try again.')
      setPaymentLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen page-bg flex items-center justify-center">
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    )
  }

  // Already premium state
  if (userProfile?.tier === 'premium') {
    return (
      <div className="min-h-screen page-bg text-white">
        <nav className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <a
            href="/dashboard"
            className="flex items-center gap-1.5 text-white/40 hover:text-white text-sm transition-colors font-body"
          >
            <ArrowLeft size={14} />
            Dashboard
          </a>
          <span className="font-heading text-lg font-bold text-white tracking-tight">PathForge</span>
          <div className="w-24" />
        </nav>
        <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 px-6">
          <div className="w-16 h-16 rounded-full bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center">
            <Crown size={28} className="text-yellow-400" />
          </div>
          <div className="text-center space-y-2">
            <h1 className="font-heading text-2xl font-bold text-white">You&apos;re already on Premium!</h1>
            <p className="font-body text-white/40 text-sm">Enjoy all PathForge Premium features.</p>
          </div>
          <a href="/dashboard">
            <Button className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold font-heading rounded-xl h-11 px-8">
              Back to Dashboard
            </Button>
          </a>
        </div>
      </div>
    )
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen page-bg text-white">
        <nav className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <a
            href="/dashboard"
            className="flex items-center gap-1.5 text-white/40 hover:text-white text-sm transition-colors font-body"
          >
            <ArrowLeft size={14} />
            Dashboard
          </a>
          <span className="font-heading text-lg font-bold text-white tracking-tight">PathForge</span>
          <div className="w-24" />
        </nav>
        <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 px-6">
          <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
            <Check size={28} className="text-green-400" />
          </div>
          <div className="text-center space-y-2">
            <h1 className="font-heading text-2xl font-bold text-white">You&apos;re now Premium! 🎉</h1>
            <p className="font-body text-white/40 text-sm">All features are unlocked. Time to forge your path.</p>
          </div>
          <a href="/dashboard">
            <Button className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold font-heading rounded-xl h-11 px-8">
              Go to Dashboard
            </Button>
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navbar */}
      <nav className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <a
          href="/dashboard"
          className="flex items-center gap-1.5 text-white/40 hover:text-white text-sm transition-colors font-body"
        >
          <ArrowLeft size={14} />
          Dashboard
        </a>
        <span className="font-heading text-lg font-bold text-white tracking-tight">PathForge</span>
        <div className="w-24" />
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-10">

        {/* Hero */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-b from-yellow-900/20 to-transparent border border-yellow-400/10 px-8 py-10 text-center space-y-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-yellow-400/10 border border-yellow-400/20 mb-2">
            <Crown size={26} className="text-yellow-400" />
          </div>
          <h1 className="font-heading text-3xl font-black text-white">
            Upgrade to PathForge Premium
          </h1>
          <p className="font-body text-white/50 text-lg">
            Unlock everything for <span className="text-yellow-400 font-semibold">₹99/month</span>
          </p>
          <div className="flex items-center justify-center gap-4 pt-2">
            <div className="flex items-center gap-1.5 text-white/40 text-sm font-body">
              <Shield size={13} className="text-green-400" />
              Secure payment
            </div>
            <div className="flex items-center gap-1.5 text-white/40 text-sm font-body">
              <Zap size={13} className="text-yellow-400" />
              Instant access
            </div>
            <div className="flex items-center gap-1.5 text-white/40 text-sm font-body">
              <Star size={13} className="text-blue-400" />
              Cancel anytime
            </div>
          </div>
        </div>

        {/* Feature comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Free column */}
          <div className="bg-white/3 border border-white/10 rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-heading font-bold text-white text-lg">Free</h2>
              <span className="text-xs bg-white/10 text-white/50 font-body px-3 py-1 rounded-full">Current plan</span>
            </div>
            <ul className="space-y-3">
              <FeatureItem included label="Role Compass (once)" />
              <FeatureItem included label="Basic Roadmap" />
              <FeatureItem included label="CGPA Tracker" />
              <FeatureItem included label="DSA Tracker (5/day)" />
              <FeatureItem included label="1 Active Challenge" />
              <FeatureItem included label="Up to 5 Friends" />
              <FeatureItem included={false} label="Sunday AI Agent" />
              <FeatureItem included={false} label="Adaptive Replanning" />
              <FeatureItem included={false} label="Unlimited DSA" />
              <FeatureItem included={false} label="Portfolio Analyser" />
              <FeatureItem included={false} label="College Leaderboard" />
              <FeatureItem included={false} label="RAG Recommender" />
            </ul>
          </div>

          {/* Premium column */}
          <div
            className="bg-yellow-400/5 border border-yellow-400/40 rounded-2xl p-6 space-y-5 relative overflow-hidden"
            style={{ boxShadow: '0 0 40px rgba(250,204,21,0.07)' }}
          >
            {/* Subtle glow backdrop */}
            <div className="absolute inset-0 bg-gradient-to-b from-yellow-400/5 to-transparent pointer-events-none rounded-2xl" />
            <div className="relative flex items-center justify-between">
              <h2 className="font-heading font-bold text-white text-lg">Premium</h2>
              <span className="text-xs bg-gradient-to-r from-yellow-400 to-orange-400 text-black font-bold font-body px-3 py-1 rounded-full">
                ₹99/mo
              </span>
            </div>
            <ul className="relative space-y-3">
              <FeatureItem included label="Role Compass (once)" premium />
              <FeatureItem included label="Basic Roadmap" premium />
              <FeatureItem included label="CGPA Tracker" premium />
              <FeatureItem included label="DSA Tracker (5/day)" premium />
              <FeatureItem included label="1 Active Challenge" premium />
              <FeatureItem included label="Up to 5 Friends" premium />
              <FeatureItem included label="Sunday AI Agent" premium />
              <FeatureItem included label="Adaptive Replanning" premium />
              <FeatureItem included label="Unlimited DSA" premium />
              <FeatureItem included label="Portfolio Analyser" premium />
              <FeatureItem included label="College Leaderboard" premium />
              <FeatureItem included label="RAG Recommender" premium />
            </ul>
          </div>
        </div>

        {/* Upgrade button */}
        <div className="flex flex-col items-center gap-4">
          <Button
            onClick={handleUpgrade}
            disabled={paymentLoading}
            className="w-full max-w-md h-14 text-base bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold font-heading rounded-2xl hover:from-yellow-300 hover:to-orange-400 transition-all shadow-lg shadow-yellow-500/20 gap-2"
          >
            {paymentLoading ? (
              <>
                <RefreshIcon />
                Processing...
              </>
            ) : (
              <>
                <Crown size={18} />
                Upgrade Now — ₹99/month
              </>
            )}
          </Button>

          {/* Bottom note */}
          <p className="font-body text-xs text-white/25 text-center max-w-sm leading-relaxed">
            Secure payment via Razorpay. Cancel anytime. UPI, Cards, Net Banking accepted.
          </p>
        </div>

      </main>
    </div>
  )
}

function FeatureItem({
  included,
  label,
  premium = false,
}: {
  included: boolean
  label: string
  premium?: boolean
}) {
  if (included) {
    return (
      <li className="flex items-center gap-2.5">
        <span className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${premium ? 'bg-green-500/20' : 'bg-green-500/15'}`}>
          <Check size={10} className="text-green-400" />
        </span>
        <span className="font-body text-sm text-white/70">{label}</span>
      </li>
    )
  }
  return (
    <li className="flex items-center gap-2.5">
      <span className="w-4 h-4 rounded-full bg-white/5 flex items-center justify-center shrink-0">
        <X size={10} className="text-white/20" />
      </span>
      <span className="font-body text-sm text-white/25">{label}</span>
    </li>
  )
}

// Small inline spinner icon
function RefreshIcon() {
  return (
    <svg
      className="animate-spin h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}
