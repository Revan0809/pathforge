import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'PathForge — AI-Powered Placement Prep for CSE Students India',
  description:
    'PathForge helps CSE students crack campus placements with a personalised AI roadmap, DSA tracker (Striver A2Z), readiness score, and daily tasks. Used by 200+ students. Free to start.',
  alternates: { canonical: 'https://pathforge.online' },
}

const JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': 'https://pathforge.online/#website',
      url: 'https://pathforge.online',
      name: 'PathForge',
      description: 'AI-powered placement preparation platform for CSE students in India',
      potentialAction: {
        '@type': 'SearchAction',
        target: { '@type': 'EntryPoint', urlTemplate: 'https://pathforge.online/company?q={search_term_string}' },
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'Organization',
      '@id': 'https://pathforge.online/#organization',
      name: 'PathForge',
      url: 'https://pathforge.online',
      logo: {
        '@type': 'ImageObject',
        url: 'https://pathforge.online/icons/icon-512.png',
        width: 512,
        height: 512,
      },
      founder: { '@type': 'Person', name: 'Abhinav' },
      foundingDate: '2025',
      description:
        'PathForge is an AI-powered placement preparation platform built for Indian engineering students. It provides personalised 16-week roadmaps, DSA progress tracking, readiness scoring, and daily task planning.',
      sameAs: ['https://pathforge.online'],
      contactPoint: {
        '@type': 'ContactPoint',
        email: 'support@pathforge.dev',
        contactType: 'customer support',
      },
    },
    {
      '@type': 'SoftwareApplication',
      '@id': 'https://pathforge.online/#app',
      name: 'PathForge',
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'Web, Android, iOS',
      offers: [
        { '@type': 'Offer', price: '0', priceCurrency: 'INR', name: 'Free Plan' },
        { '@type': 'Offer', price: '99', priceCurrency: 'INR', name: 'Premium Plan', billingPeriod: 'Monthly' },
      ],
      description:
        'AI placement preparation app for CSE students with roadmaps, DSA tracking, and readiness scoring.',
      url: 'https://pathforge.online',
      screenshot: 'https://pathforge.online/og-image.png',
    },
  ],
}

const FEATURES = [
  { icon: '🧭', title: 'Role Compass', desc: 'AI chat that identifies your best-fit role — SDE, ML, DevOps, PM' },
  { icon: '🗺️', title: 'AI Roadmap', desc: '16-week personalised placement plan based on your profile & target companies' },
  { icon: '💻', title: 'DSA Tracker', desc: 'Striver A2Z — 455 problems with topics, XP, and progress analytics' },
  { icon: '🎯', title: 'Readiness Score', desc: 'Composite 0–100 score combining DSA, CGPA, courses, and consistency' },
  { icon: '📅', title: 'Daily Tasks', desc: 'AI-generated 6-task daily plan personalised to your weakest areas' },
  { icon: '👥', title: 'Challenges', desc: 'Compete with batchmates in timed DSA challenges and leaderboards' },
  { icon: '📊', title: 'CGPA Calculator', desc: 'Calculate CGPA and instantly see which company cutoffs you meet' },
  { icon: '🏢', title: 'Company Intel', desc: 'Target company roadmaps, past questions, and gap analysis' },
]

const STATS = [
  { value: '200+', label: 'Students enrolled' },
  { value: '455', label: 'DSA problems tracked' },
  { value: '16 weeks', label: 'Personalised roadmap' },
  { value: '₹99/mo', label: 'Premium plan' },
]

export default function LandingPage() {
  return (
    <>
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />

      <div className="min-h-screen page-bg text-white">

        {/* ── Nav ─────────────────────────────────────────────────────────── */}
        <nav className="border-b border-white/8 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
          <span className="font-heading font-extrabold text-white text-xl tracking-tight">
            🧭 PathForge
          </span>
          <div className="flex items-center gap-4">
            <Link href="/about" className="text-white/50 hover:text-white text-sm font-body transition-colors hidden sm:block">
              About
            </Link>
            <Link href="/dashboard" className="text-sm font-heading font-semibold px-4 py-2 rounded-xl text-white transition-all shadow-lg hover:shadow-violet-500/20 hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #0EA5E9)' }}>
              Open Dashboard
            </Link>
          </div>
        </nav>

        {/* ── Hero ────────────────────────────────────────────────────────── */}
        <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white/50 text-xs font-body tracking-widest uppercase">
              AI-powered · Built for India · Free to start
            </span>
          </div>

          <h1 className="font-heading text-5xl md:text-7xl font-bold text-white mb-6 leading-[1.05] tracking-tight">
            PathForge —<br />
            <span className="bg-gradient-to-br from-violet-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Crack placements
            </span>
            <br />with AI
          </h1>

          <p className="font-body text-white/60 text-lg max-w-2xl mx-auto mb-4 leading-relaxed">
            PathForge is India's AI placement preparation platform for CSE students.
            Get a <strong className="text-white/90">personalised 16-week roadmap</strong>, track your DSA progress on Striver A2Z,
            score your placement readiness, and get a <strong className="text-white/90">6-task daily plan</strong> every morning —
            all powered by AI, all in one place.
          </p>
          <p className="font-body text-white/35 text-sm mb-10">
            200+ students already preparing with PathForge · Founded by Abhinav
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/dashboard"
              className="px-8 py-3.5 rounded-2xl font-heading font-bold text-white text-base transition-all hover:scale-105 shadow-xl hover:shadow-violet-500/25"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #0EA5E9)' }}>
              Launch Dashboard →
            </Link>
            <Link href="/about"
              className="px-8 py-3.5 rounded-2xl font-heading font-semibold text-white/60 text-base border border-white/10 hover:border-white/25 hover:text-white transition-all">
              About PathForge
            </Link>
          </div>
        </section>

        {/* ── Stats ───────────────────────────────────────────────────────── */}
        <section className="max-w-4xl mx-auto px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {STATS.map((s) => (
              <div key={s.label} className="text-center p-5 rounded-2xl border border-white/8"
                style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="font-heading font-extrabold text-3xl text-violet-400 mb-1">{s.value}</div>
                <div className="font-body text-white/45 text-sm">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Features ────────────────────────────────────────────────────── */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="font-heading font-extrabold text-3xl text-white text-center mb-3">
            Everything you need to crack placements
          </h2>
          <p className="font-body text-white/45 text-center mb-12 max-w-xl mx-auto">
            PathForge brings together every tool a CSE student needs — no more scattered YouTube tabs and random LeetCode sessions.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="p-5 rounded-2xl border border-white/8 hover:border-white/15 transition-all"
                style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="text-2xl mb-3">{f.icon}</div>
                <div className="font-heading font-bold text-white text-sm mb-1.5">{f.title}</div>
                <div className="font-body text-white/45 text-xs leading-relaxed">{f.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── How it works ────────────────────────────────────────────────── */}
        <section className="max-w-3xl mx-auto px-6 py-16">
          <h2 className="font-heading font-extrabold text-3xl text-white text-center mb-12">
            How PathForge works
          </h2>
          <div className="space-y-6">
            {[
              { step: '01', title: 'Create your free account', desc: 'Sign up with Google or email. Takes 30 seconds.' },
              { step: '02', title: 'Complete your profile', desc: 'Tell PathForge your semester, target role, current skills, and dream companies.' },
              { step: '03', title: 'Get your AI roadmap', desc: 'PathForge\'s AI generates a personalised 16-week placement roadmap just for you.' },
              { step: '04', title: 'Follow your daily plan', desc: 'Every morning, a fresh 6-task plan based on your weakest areas. DSA → subjects → courses → roadmap, all balanced.' },
              { step: '05', title: 'Track and score', desc: 'Watch your readiness score climb from 0 to 100 as you complete tasks and solve problems.' },
            ].map((h) => (
              <div key={h.step} className="flex gap-5 items-start">
                <div className="font-heading font-extrabold text-violet-500/60 text-xl w-10 shrink-0 mt-0.5">{h.step}</div>
                <div>
                  <div className="font-heading font-bold text-white text-base mb-1">{h.title}</div>
                  <div className="font-body text-white/50 text-sm leading-relaxed">{h.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ─────────────────────────────────────────────────────────── */}
        <section className="max-w-2xl mx-auto px-6 py-16 text-center">
          <h2 className="font-heading font-extrabold text-4xl text-white mb-4">
            Start your placement prep today
          </h2>
          <p className="font-body text-white/50 mb-8">
            Join 200+ CSE students already using PathForge. Free forever — premium for serious prep.
          </p>
          <Link href="/dashboard"
            className="inline-block px-10 py-4 rounded-2xl font-heading font-bold text-white text-lg transition-all hover:scale-105 shadow-2xl hover:shadow-cyan-500/25"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #0EA5E9)' }}>
            Open Placement Dashboard →
          </Link>
        </section>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <footer className="border-t border-white/8 px-6 py-8">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <span className="font-heading font-extrabold text-white">🧭 PathForge</span>
              <p className="text-white/30 text-xs mt-1 font-body">AI placement prep · Made in India · Founded by Abhinav</p>
            </div>
            <div className="flex gap-5 text-sm font-body text-white/40">
              <Link href="/about" className="hover:text-white/70 transition-colors">About</Link>
              <Link href="/dashboard" className="hover:text-white/70 transition-colors">Dashboard</Link>
              <Link href="/privacy" className="hover:text-white/70 transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-white/70 transition-colors">Terms</Link>
            </div>
            <p className="text-white/20 text-xs font-body">© 2025 PathForge. All rights reserved.</p>
          </div>
        </footer>

      </div>
    </>
  )
}
