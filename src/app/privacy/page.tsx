export default function PrivacyPage() {
  return (
    <div className="min-h-screen page-bg text-white">
      <nav className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <a href="/" className="font-heading font-extrabold text-white text-lg">PathForge</a>
        <a href="/dashboard" className="text-white/50 hover:text-white text-sm transition-colors font-body">Dashboard →</a>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-12 space-y-8 font-body">
        <div>
          <h1 className="font-heading font-extrabold text-3xl text-white mb-2">Privacy Policy</h1>
          <p className="text-white/50 text-sm">Last updated: March 2026</p>
        </div>

        <section className="space-y-3">
          <h2 className="font-heading font-bold text-white text-xl">1. Information We Collect</h2>
          <p className="text-white/70 leading-relaxed">We collect information you provide when you create an account: name, email address, college name, semester, and career goals. We also collect usage data such as DSA problems solved, courses tracked, and roadmap progress to personalise your experience.</p>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading font-bold text-white text-xl">2. How We Use Your Information</h2>
          <ul className="text-white/70 leading-relaxed space-y-2 list-disc list-inside">
            <li>To provide and personalise the PathForge platform</li>
            <li>To generate your AI-powered placement roadmap and daily tasks</li>
            <li>To track your DSA progress, readiness score, and milestones</li>
            <li>To send streak reminders and progress notifications (only if opted in)</li>
            <li>To process payments via Razorpay for Premium subscriptions</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading font-bold text-white text-xl">3. Payment Information</h2>
          <p className="text-white/70 leading-relaxed">PathForge uses Razorpay as its payment processor. We do not store your credit/debit card details. All payment transactions are encrypted and processed securely by Razorpay. By making a payment, you agree to Razorpay's Terms of Service.</p>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading font-bold text-white text-xl">4. Data Storage</h2>
          <p className="text-white/70 leading-relaxed">Your data is stored securely on Supabase (PostgreSQL) servers. We use industry-standard encryption for data in transit (HTTPS/TLS) and at rest. We do not sell your personal data to third parties.</p>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading font-bold text-white text-xl">5. Third-Party Services</h2>
          <p className="text-white/70 leading-relaxed">PathForge integrates with the following third-party services: Google (for OAuth sign-in), Supabase (database and authentication), Razorpay (payment processing), and Groq (AI features). Each service has its own privacy policy.</p>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading font-bold text-white text-xl">6. Cookies</h2>
          <p className="text-white/70 leading-relaxed">We use cookies solely for authentication (Supabase session tokens) and your saved preferences (target company, buddy name, completed tasks). We do not use advertising or tracking cookies.</p>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading font-bold text-white text-xl">7. Your Rights</h2>
          <p className="text-white/70 leading-relaxed">You may request deletion of your account and all associated data at any time by emailing us. You can also export your data from your profile settings.</p>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading font-bold text-white text-xl">8. Contact</h2>
          <p className="text-white/70 leading-relaxed">For privacy-related queries, contact us at: <a href="mailto:support@pathforge.dev" className="text-violet-400 hover:text-violet-300">support@pathforge.dev</a></p>
        </section>
      </main>

      <footer className="border-t border-white/8 px-6 py-6 text-center text-white/30 text-sm font-body">
        <p>© 2026 PathForge. All rights reserved. · <a href="/terms" className="hover:text-white/60 transition-colors">Terms of Service</a> · <a href="/privacy" className="hover:text-white/60 transition-colors">Privacy Policy</a></p>
      </footer>
    </div>
  )
}
