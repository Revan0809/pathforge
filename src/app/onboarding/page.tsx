'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// ─── Types ────────────────────────────────────────────────────────────────────
interface OnboardingData {
  name: string
  college: string
  branch: string
  semester: string
  target_role: string
  college_tier: string
  target_companies: string[]
  current_skills: string[]
}

// ─── Constants ────────────────────────────────────────────────────────────────
const ROLES = ['SDE', 'ML Engineer', 'Data Analyst', 'DevOps', 'Product Manager']
const COMPANY_TYPES = ['FAANG / Big Tech', 'Product Companies', 'Service Companies', 'Startups', 'Government / PSU']
const COLLEGE_TIERS = ['Tier 1 (IIT/NIT/BITS)', 'Tier 2 (State NITs/IIIT)', 'Tier 3 (Other colleges)']
const BRANCHES = ['CSE', 'IT', 'ECE', 'EEE', 'Mechanical', 'Civil', 'Other']
const SKILL_OPTIONS = [
  'Python', 'JavaScript', 'Java', 'C++', 'C',
  'React', 'Node.js', 'SQL', 'Machine Learning', 'Data Structures',
  'System Design', 'Docker', 'Git', 'HTML/CSS', 'TypeScript',
  'MongoDB', 'PostgreSQL', 'AWS', 'Linux', 'REST APIs'
]

// ─── Component ────────────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [data, setData] = useState<OnboardingData>({
    name: '',
    college: '',
    branch: '',
    semester: '',
    target_role: '',
    college_tier: '',
    target_companies: [],
    current_skills: [],
  })

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const session = data?.session
      setUserId(session?.user?.id ?? 'demo-user-123')
      const name = session?.user?.user_metadata?.full_name || 'Alex Sharma'
      if (name) setData(prev => ({ ...prev, name }))
    })
  }, [])

  function toggleArrayItem(arr: string[], item: string): string[] {
    return arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item]
  }

  async function handleFinish() {
    if (!userId) return
    setLoading(true)

    const { error } = await supabase
      .from('users')
      .update({
        name: data.name,
        college: data.college,
        branch: data.branch,
        semester: parseInt(data.semester),
        target_role: data.target_role,
        college_tier: data.college_tier,
        target_companies: data.target_companies,
        current_skills: data.current_skills,
        onboarding_complete: true,
      })
      .eq('id', userId)

    setLoading(false)
    if (!error) {
      window.location.href = '/dashboard'
    }
  }

  const progress = ((step - 1) / 5) * 100

  return (
    <div className="min-h-screen page-bg flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">PathForge</h1>
          <p className="text-purple-300 mt-1 text-sm">Let&apos;s personalise your experience</p>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Step {step} of 5</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <Progress value={progress} className="h-2 bg-slate-700" />
        </div>

        {/* Step 1: Name + College + Branch */}
        {step === 1 && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Tell us about yourself</CardTitle>
              <CardDescription className="text-slate-400">Basic info to personalise your roadmap</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Full Name</Label>
                <Input
                  placeholder="Rahul Sharma"
                  value={data.name}
                  onChange={e => setData(p => ({ ...p, name: e.target.value }))}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">College Name</Label>
                <Input
                  placeholder="VIT Vellore / BITS Pilani / ..."
                  value={data.college}
                  onChange={e => setData(p => ({ ...p, college: e.target.value }))}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">College Tier</Label>
                <Select value={data.college_tier} onValueChange={v => { if (v) setData(p => ({ ...p, college_tier: v })) }}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Select tier" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    {COLLEGE_TIERS.map(t => (
                      <SelectItem key={t} value={t} className="text-white hover:bg-slate-600">{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Branch</Label>
                <Select value={data.branch} onValueChange={v => { if (v) setData(p => ({ ...p, branch: v })) }}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    {BRANCHES.map(b => (
                      <SelectItem key={b} value={b} className="text-white hover:bg-slate-600">{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={() => setStep(2)}
                disabled={!data.name || !data.college || !data.branch || !data.college_tier}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              >
                Continue →
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Semester + Target Role */}
        {step === 2 && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Where are you headed?</CardTitle>
              <CardDescription className="text-slate-400">Your semester and target role shape your entire roadmap</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Current Semester</Label>
                <Select value={data.semester} onValueChange={v => { if (v) setData(p => ({ ...p, semester: v })) }}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    {[1,2,3,4,5,6,7,8].map(s => (
                      <SelectItem key={s} value={String(s)} className="text-white hover:bg-slate-600">Semester {s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Target Role</Label>
                <p className="text-xs text-slate-500">Not sure? Use the Role Compass after setup</p>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {ROLES.map(role => (
                    <button
                      key={role}
                      onClick={() => setData(p => ({ ...p, target_role: role }))}
                      className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                        data.target_role === role
                          ? 'bg-purple-600 border-purple-500 text-white'
                          : 'bg-slate-700 border-slate-600 text-slate-300 hover:border-purple-500'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                  <button
                    onClick={() => setData(p => ({ ...p, target_role: 'Not sure yet' }))}
                    className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                      data.target_role === 'Not sure yet'
                        ? 'bg-purple-600 border-purple-500 text-white'
                        : 'bg-slate-700 border-slate-600 text-slate-300 hover:border-purple-500'
                    }`}
                  >
                    Not sure yet
                  </button>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setStep(1)} variant="outline" className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700">← Back</Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={!data.semester || !data.target_role}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Continue →
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Target Companies */}
        {step === 3 && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Target companies</CardTitle>
              <CardDescription className="text-slate-400">Select all that apply — this calibrates difficulty and cutoffs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {COMPANY_TYPES.map(company => (
                  <button
                    key={company}
                    onClick={() => setData(p => ({ ...p, target_companies: toggleArrayItem(p.target_companies, company) }))}
                    className={`w-full p-3 rounded-lg border text-left text-sm font-medium transition-all ${
                      data.target_companies.includes(company)
                        ? 'bg-purple-600 border-purple-500 text-white'
                        : 'bg-slate-700 border-slate-600 text-slate-300 hover:border-purple-500'
                    }`}
                  >
                    <span className="mr-2">{data.target_companies.includes(company) ? '✓' : '○'}</span>
                    {company}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setStep(2)} variant="outline" className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700">← Back</Button>
                <Button
                  onClick={() => setStep(4)}
                  disabled={data.target_companies.length === 0}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Continue →
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Current Skills */}
        {step === 4 && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Your current skills</CardTitle>
              <CardDescription className="text-slate-400">Select everything you&apos;re comfortable with — be honest, this helps us skip basics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {SKILL_OPTIONS.map(skill => (
                  <button
                    key={skill}
                    onClick={() => setData(p => ({ ...p, current_skills: toggleArrayItem(p.current_skills, skill) }))}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                      data.current_skills.includes(skill)
                        ? 'bg-purple-600 border-purple-500 text-white'
                        : 'bg-slate-700 border-slate-600 text-slate-300 hover:border-purple-500'
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-500">{data.current_skills.length} skill{data.current_skills.length !== 1 ? 's' : ''} selected</p>
              <div className="flex gap-2">
                <Button onClick={() => setStep(3)} variant="outline" className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700">← Back</Button>
                <Button
                  onClick={() => setStep(5)}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Continue →
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 5: Confirmation */}
        {step === 5 && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">You&apos;re all set, {data.name.split(' ')[0]}!</CardTitle>
              <CardDescription className="text-slate-400">Here&apos;s what we&apos;ll build your roadmap around</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 bg-slate-700/50 rounded-lg p-4">
                <SummaryRow label="College" value={data.college} />
                <SummaryRow label="Branch" value={`${data.branch} — Sem ${data.semester}`} />
                <SummaryRow label="College Tier" value={data.college_tier} />
                <SummaryRow label="Target Role" value={data.target_role} />
                <div className="flex justify-between items-start gap-4">
                  <span className="text-slate-400 text-sm">Target Companies</span>
                  <div className="flex flex-wrap gap-1 justify-end max-w-xs">
                    {data.target_companies.map(c => (
                      <Badge key={c} variant="secondary" className="bg-slate-600 text-slate-200 text-xs">{c}</Badge>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between items-start gap-4">
                  <span className="text-slate-400 text-sm">Skills</span>
                  <div className="flex flex-wrap gap-1 justify-end max-w-xs">
                    {data.current_skills.length > 0
                      ? data.current_skills.slice(0, 5).map(s => (
                          <Badge key={s} variant="secondary" className="bg-slate-600 text-slate-200 text-xs">{s}</Badge>
                        ))
                      : <span className="text-slate-400 text-sm">None selected</span>
                    }
                    {data.current_skills.length > 5 && (
                      <Badge variant="secondary" className="bg-slate-600 text-slate-200 text-xs">+{data.current_skills.length - 5} more</Badge>
                    )}
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-500 text-center">
                PathForge will generate your personalised 16-week roadmap. You can update your profile anytime.
              </p>

              <div className="flex gap-2">
                <Button onClick={() => setStep(4)} variant="outline" className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700">← Back</Button>
                <Button
                  onClick={handleFinish}
                  disabled={loading}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold"
                >
                  {loading ? 'Saving...' : 'Launch PathForge 🚀'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-slate-400 text-sm">{label}</span>
      <span className="text-white text-sm font-medium">{value}</span>
    </div>
  )
}
