export default function TermsPage() {
  return (
    <div className="min-h-screen page-bg text-white">
      <nav className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <a href="/" className="font-heading font-extrabold text-white text-lg">PathForge</a>
        <a href="/dashboard" className="text-white/50 hover:text-white text-sm transition-colors font-body">Dashboard →</a>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-12 space-y-8 font-body">
        <div>
          <h1 className="font-heading font-extrabold text-3xl text-white mb-2">Terms of Service</h1>
          <p className="text-white/50 text-sm">Last updated: March 2026</p>
        </div>

        <section className="space-y-3">
          <h2 className="font-heading font-bold text-white text-xl">1. Acceptance of Terms</h2>
          <p className="text-white/70 leading-relaxed">By accessing or using PathForge ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Platform. PathForge is operated as an AI-powered career preparation platform for CSE students in India.</p>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading font-bold text-white text-xl">2. Description of Service</h2>
          <p className="text-white/70 leading-relaxed">PathForge provides tools including: AI-generated placement roadmaps, DSA problem tracking, readiness scoring, company-specific interview preparation, course tracking, and peer accountability features. Features are subject to change without notice.</p>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading font-bold text-white text-xl">3. User Accounts</h2>
          <ul className="text-white/70 leading-relaxed space-y-2 list-disc list-inside">
            <li>You must be at least 13 years old to use PathForge</li>
            <li>You are responsible for maintaining the security of your account credentials</li>
            <li>You must provide accurate information when creating your account</li>
            <li>One person may only create one account</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading font-bold text-white text-xl">4. Premium Subscription & Payments</h2>
          <p className="text-white/70 leading-relaxed">PathForge offers a Premium subscription at ₹99/month. Payments are processed by Razorpay. Subscriptions are billed monthly. Refunds are available within 7 days of purchase if you are not satisfied — contact support@pathforge.dev. PathForge reserves the right to change pricing with 30 days notice.</p>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading font-bold text-white text-xl">5. Cancellation & Refund Policy</h2>
          <p className="text-white/70 leading-relaxed">You may cancel your Premium subscription at any time. Access continues until the end of the current billing period. Refund requests within 7 days of payment will be honoured. Contact support@pathforge.dev with your payment ID for refund processing.</p>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading font-bold text-white text-xl">6. Acceptable Use</h2>
          <p className="text-white/70 leading-relaxed">You agree not to: share your account credentials, attempt to reverse-engineer the platform, use automated bots to interact with the platform, or post inappropriate content in community features.</p>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading font-bold text-white text-xl">7. Intellectual Property</h2>
          <p className="text-white/70 leading-relaxed">All content, features, and functionality of PathForge are owned by PathForge and protected by applicable intellectual property laws. The interview stories shared on the platform are contributed by community members and remain their property.</p>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading font-bold text-white text-xl">8. Disclaimer</h2>
          <p className="text-white/70 leading-relaxed">PathForge does not guarantee placement outcomes. The platform provides preparation tools and resources. Actual interview results depend on individual effort, skills, and circumstances beyond our control.</p>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading font-bold text-white text-xl">9. Limitation of Liability</h2>
          <p className="text-white/70 leading-relaxed">PathForge shall not be liable for any indirect, incidental, or consequential damages arising from your use of the platform. Our total liability shall not exceed the amount paid by you in the last 3 months.</p>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading font-bold text-white text-xl">10. Governing Law</h2>
          <p className="text-white/70 leading-relaxed">These Terms are governed by the laws of India. Any disputes shall be subject to the jurisdiction of courts in India.</p>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading font-bold text-white text-xl">11. Contact Us</h2>
          <p className="text-white/70 leading-relaxed">
            Email: <a href="mailto:support@pathforge.dev" className="text-violet-400 hover:text-violet-300">support@pathforge.dev</a><br />
            Website: <a href="https://pathforge.online" className="text-violet-400 hover:text-violet-300">https://pathforge.online</a>
          </p>
        </section>
      </main>

      <footer className="border-t border-white/8 px-6 py-6 text-center text-white/30 text-sm font-body">
        <p>© 2026 PathForge. All rights reserved. · <a href="/terms" className="hover:text-white/60 transition-colors">Terms of Service</a> · <a href="/privacy" className="hover:text-white/60 transition-colors">Privacy Policy</a></p>
      </footer>
    </div>
  )
}
