import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About PathForge — Founded by Abhinav',
  description:
    'PathForge is an AI-powered placement preparation platform for Indian CSE students, founded by Abhinav. Learn about our mission, story, and the problem we solve.',
  alternates: { canonical: 'https://pathforge.online/about' },
  openGraph: {
    title: 'About PathForge — Founded by Abhinav',
    description: 'The story behind PathForge — why it was built, who built it, and what we are trying to solve for Indian CSE students.',
    url: 'https://pathforge.online/about',
  },
}

const JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  name: 'About PathForge',
  url: 'https://pathforge.online/about',
  description: 'PathForge is an AI-powered placement preparation platform for Indian CSE students, founded by Abhinav.',
  mainEntity: {
    '@type': 'Organization',
    name: 'PathForge',
    founder: { '@type': 'Person', name: 'Abhinav' },
    foundingDate: '2025',
    url: 'https://pathforge.online',
    description:
      'PathForge helps CSE students crack campus placements with AI-generated roadmaps, DSA tracking, and readiness scoring.',
  },
}

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />

      <div className="min-h-screen page-bg text-white">

        {/* ── Nav ─────────────────────────────────────────────────────────── */}
        <nav className="border-b border-white/8 px-6 py-4 flex items-center justify-between max-w-4xl mx-auto">
          <Link href="/" className="font-heading font-extrabold text-white text-xl tracking-tight">
            🧭 PathForge
          </Link>
          <Link href="/auth"
            className="text-sm font-heading font-semibold px-4 py-2 rounded-xl text-white transition-all"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #0EA5E9)' }}>
            Get Started Free
          </Link>
        </nav>

        <main className="max-w-3xl mx-auto px-6 py-16 space-y-16 font-body">

          {/* ── Header ──────────────────────────────────────────────────── */}
          <div>
            <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 mb-6">
              <span className="text-violet-400 text-xs font-body tracking-widest uppercase font-semibold">Our Story</span>
            </div>
            <h1 className="font-heading font-extrabold text-4xl md:text-5xl text-white mb-5 leading-tight">
              About PathForge
            </h1>
            <p className="text-white/60 text-lg leading-relaxed">
              PathForge is an AI-powered placement preparation platform built for Indian engineering students — specifically CSE students targeting product-based companies like Google, Microsoft, Amazon, and leading Indian tech firms.
            </p>
          </div>

          {/* ── Founder ─────────────────────────────────────────────────── */}
          <section className="rounded-3xl border border-white/8 p-8"
            style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(14,165,233,0.06))' }}>
            <div className="flex items-start gap-5">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 font-heading font-extrabold text-white"
                style={{ background: 'linear-gradient(135deg, #7C3AED, #0EA5E9)' }}>
                A
              </div>
              <div>
                <p className="font-heading font-bold text-white text-xl mb-1">Founded by Abhinav</p>
                <p className="text-white/45 text-sm mb-4">Builder · CSE Student · India</p>
                <p className="text-white/65 leading-relaxed text-sm">
                  PathForge was built by Abhinav, a CSE student who experienced firsthand the chaos of campus placement preparation — scattered resources, no structured plan, and no way to know if you were actually ready. PathForge is the platform he wished existed when he was preparing.
                </p>
              </div>
            </div>
          </section>

          {/* ── Mission ─────────────────────────────────────────────────── */}
          <section className="space-y-4">
            <h2 className="font-heading font-bold text-white text-2xl">The problem we solve</h2>
            <p className="text-white/60 leading-relaxed">
              Most Indian CSE students approaching campus placements have no structured plan. They know they need DSA, DBMS, OS, system design, and a decent CGPA — but they don't know <strong className="text-white/85">what to do today, in what order, at what depth</strong>.
            </p>
            <p className="text-white/60 leading-relaxed">
              They scatter across YouTube tutorials, random LeetCode sessions, and PDF checklists with no feedback loop. Two months before placement season, they panic.
            </p>
            <p className="text-white/60 leading-relaxed">
              PathForge gives every student a personalised, adaptive plan — built by AI using their actual semester, target companies, skill gaps, and daily progress. Not a generic checklist. <strong className="text-white/85">A plan built for them.</strong>
            </p>
          </section>

          {/* ── What PathForge offers ────────────────────────────────────── */}
          <section className="space-y-4">
            <h2 className="font-heading font-bold text-white text-2xl">What PathForge offers</h2>
            <ul className="space-y-3 text-white/60">
              {[
                ['🧭', 'Role Compass', 'AI conversation that identifies your best-fit career role based on your skills and interests'],
                ['🗺️', 'AI Roadmap', 'Personalised 16-week placement plan generated by AI, specific to your profile and target companies'],
                ['💻', 'DSA Tracker', 'Track all 455 Striver A2Z problems with topic filters, difficulty, XP rewards, and analytics'],
                ['🎯', 'Readiness Score', 'A composite 0–100 score combining DSA progress, CGPA, courses, and consistency'],
                ['📅', 'Daily Task Engine', 'Every morning, a fresh 6-task personalised plan based on your weakest areas'],
                ['👥', 'Challenges & Friends', 'Compete with batchmates, view leaderboards, and run timed DSA challenges'],
                ['🏢', 'Company Intel', 'Target company analysis — roadmap, past interview questions, and your skill gap report'],
              ].map(([icon, title, desc]) => (
                <li key={String(title)} className="flex gap-4">
                  <span className="text-lg shrink-0 mt-0.5">{icon}</span>
                  <span><strong className="text-white/85">{title}</strong> — {desc}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* ── Tech ────────────────────────────────────────────────────── */}
          <section className="space-y-4">
            <h2 className="font-heading font-bold text-white text-2xl">Built with</h2>
            <p className="text-white/50 text-sm leading-relaxed">
              PathForge is built on a modern full-stack architecture: <strong className="text-white/70">Next.js 14</strong> with TypeScript, <strong className="text-white/70">Supabase</strong> (PostgreSQL + auth), a <strong className="text-white/70">FastAPI</strong> Python backend for AI inference, <strong className="text-white/70">Claude AI</strong> for roadmap and compass features, and deployed on <strong className="text-white/70">Vercel</strong> with a custom domain at pathforge.online. It runs as a <strong className="text-white/70">PWA</strong> — installable on Android and iOS like a native app.
            </p>
            <p className="text-white/50 text-sm">
              Payments are processed via <strong className="text-white/70">Razorpay</strong> with server-side HMAC signature verification. The platform is used by 200+ real students.
            </p>
          </section>

          {/* ── Contact ─────────────────────────────────────────────────── */}
          <section className="space-y-3">
            <h2 className="font-heading font-bold text-white text-2xl">Contact</h2>
            <p className="text-white/60 text-sm">
              Reach out for feedback, partnership, or support:{' '}
              <a href="mailto:support@pathforge.dev" className="text-violet-400 hover:text-violet-300 transition-colors">
                support@pathforge.dev
              </a>
            </p>
          </section>

          {/* ── CTA ─────────────────────────────────────────────────────── */}
          <div className="text-center pt-4">
            <Link href="/auth"
              className="inline-block px-10 py-4 rounded-2xl font-heading font-bold text-white text-base transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #0EA5E9)' }}>
              Start your prep — it's free →
            </Link>
          </div>

        </main>

        <footer className="border-t border-white/8 px-6 py-6 text-center text-white/30 text-sm font-body">
          <p>
            © 2025 PathForge · Founded by Abhinav ·{' '}
            <Link href="/privacy" className="hover:text-white/60 transition-colors">Privacy</Link>
            {' · '}
            <Link href="/terms" className="hover:text-white/60 transition-colors">Terms</Link>
          </p>
        </footer>

      </div>
    </>
  )
}
