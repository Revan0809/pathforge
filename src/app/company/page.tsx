'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2, Target, ChevronDown, ChevronUp, Star, CheckCircle2,
  AlertCircle, ArrowRight, Zap, TrendingUp, Code2, BookOpen,
  Clock, Users, Award, ExternalLink, Sparkles, BarChart3,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Company {
  id: string
  name: string
  type: 'FAANG' | 'Product' | 'Fintech' | 'Service' | 'Global MNC'
  difficulty: 'Very Hard' | 'Hard' | 'Medium' | 'Easy'
  ctcRange: string
  color: string
  bg: string
  border: string
  shortcode: string
  tagline: string
  rounds: { name: string; desc: string; focus: string }[]
  oaPattern: string
  keyTopics: string[]
  mustDoCount: number
  pastQuestions: { q: string; tag: string; diff: 'Easy' | 'Medium' | 'Hard' }[]
  prepFocus: { area: string; weight: number; tip: string }[]
  readinessFormula: (dsa: number) => number
  insiderTip: string
}

// ─── Company Data ─────────────────────────────────────────────────────────────
const COMPANIES: Company[] = [
  {
    id: 'google',
    name: 'Google',
    type: 'FAANG',
    difficulty: 'Very Hard',
    ctcRange: '28–52 LPA',
    color: '#4285F4',
    bg: 'rgba(66,133,244,0.10)',
    border: 'rgba(66,133,244,0.28)',
    shortcode: 'G',
    tagline: 'World-class DSA + system design. Highest bar, highest reward.',
    rounds: [
      { name: 'Online Assessment', desc: '3 DSA problems, 90 min, Competitive difficulty', focus: 'Hard DP, Graph problems' },
      { name: 'Phone Screen (×1)', desc: '45 min, 2 medium-hard DSA problems', focus: 'Strings, Arrays, Trees' },
      { name: 'Onsite — DSA (×2)', desc: '45 min each, 1–2 problems per round', focus: 'Graphs, DP, Advanced Trees' },
      { name: 'Onsite — System Design', desc: '45 min, design a large-scale system', focus: 'HLD: scalability, databases, caching' },
      { name: 'Onsite — Low-Level Design', desc: '45 min, object-oriented design', focus: 'Design patterns, class diagrams' },
      { name: 'Googleyness & Leadership', desc: '45 min behavioural round', focus: 'Culture fit, ambiguity, collaboration' },
    ],
    oaPattern: '3 problems (1 Easy + 1 Medium + 1 Hard) in 90 minutes. CodeSignal or HackerRank. No partial scoring — correct output only.',
    keyTopics: ['Dynamic Programming', 'Graphs & BFS/DFS', 'Trees & BST', 'Strings & Hashing', 'Greedy', 'Segment Trees', 'System Design', 'OS Concepts', 'Trie', 'Sliding Window'],
    mustDoCount: 150,
    pastQuestions: [
      { q: 'Find the shortest path in a weighted graph with obstacles', tag: 'Graph', diff: 'Hard' },
      { q: 'Design a URL shortener with analytics', tag: 'System Design', diff: 'Hard' },
      { q: 'Minimum window substring', tag: 'Sliding Window', diff: 'Hard' },
      { q: 'Word break II — all possible sentences', tag: 'DP + Backtracking', diff: 'Hard' },
      { q: 'LRU Cache implementation', tag: 'Design', diff: 'Medium' },
    ],
    prepFocus: [
      { area: 'DSA (Hard problems)', weight: 40, tip: 'Solve 150+ LeetCode, 50% must be Hard' },
      { area: 'System Design', weight: 25, tip: 'Study Grokking the System Design' },
      { area: 'Low-Level Design', weight: 15, tip: 'Practice design patterns + UML' },
      { area: 'OS/CN/DBMS', weight: 10, tip: 'Google asks deep OS questions' },
      { area: 'Behavioural', weight: 10, tip: '5-6 strong STAR stories minimum' },
    ],
    readinessFormula: (dsa) => Math.min(100, Math.round((dsa / 200) * 60 + 40)),
    insiderTip: 'Googlers say the #1 failure point is staying silent. Think out loud even when stuck — the interviewer wants to see your process, not just the answer.',
  },
  {
    id: 'microsoft',
    name: 'Microsoft',
    type: 'FAANG',
    difficulty: 'Hard',
    ctcRange: '22–42 LPA',
    color: '#00A4EF',
    bg: 'rgba(0,164,239,0.10)',
    border: 'rgba(0,164,239,0.28)',
    shortcode: 'M',
    tagline: 'OOP-heavy interviews with strong behavioural component.',
    rounds: [
      { name: 'Online Assessment', desc: '2 DSA problems, 75 min, Medium-Hard', focus: 'Trees, Arrays, OOP design' },
      { name: 'Technical Round 1', desc: '1 hr, 2 DSA + OOP concepts', focus: 'Trees, Linked List, class design' },
      { name: 'Technical Round 2', desc: '1 hr, 2 DSA + system thinking', focus: 'Graphs, DP, scalability discussion' },
      { name: 'Technical Round 3 (As Appropriate)', desc: '1 hr, design-heavy', focus: 'LLD + API design + edge cases' },
      { name: 'HR Round', desc: '30 min, culture & motivation', focus: 'Growth mindset, collaboration stories' },
    ],
    oaPattern: '2 problems in 75 min (1 Medium + 1 Hard). HackerRank. Also includes a 15-min productivity & situational judgement quiz.',
    keyTopics: ['Trees & BST', 'OOP & Design Patterns', 'Arrays & Strings', 'Linked Lists', 'Graphs', 'Dynamic Programming', 'SQL Basics', 'OS Concepts', 'SOLID Principles', 'Recursion'],
    mustDoCount: 100,
    pastQuestions: [
      { q: 'Serialize and deserialize a binary tree', tag: 'Trees', diff: 'Hard' },
      { q: 'Design a parking lot system in Java/C++', tag: 'LLD', diff: 'Medium' },
      { q: 'Clone a graph with random pointers', tag: 'Graph', diff: 'Medium' },
      { q: 'Find all anagrams in a string', tag: 'Sliding Window', diff: 'Medium' },
      { q: 'Implement a thread-safe Singleton', tag: 'OOP', diff: 'Medium' },
    ],
    prepFocus: [
      { area: 'DSA (Medium focus)', weight: 35, tip: '80% Medium, 20% Hard on LeetCode' },
      { area: 'OOP & Design Patterns', weight: 25, tip: 'GoF patterns: Singleton, Factory, Observer, Strategy' },
      { area: 'Low-Level Design', weight: 20, tip: 'Practice designing Parking Lot, Elevator, BookMyShow' },
      { area: 'OS & DBMS', weight: 10, tip: 'Threading, deadlocks, SQL joins are common' },
      { area: 'Behavioural', weight: 10, tip: 'Growth mindset stories are key at Microsoft' },
    ],
    readinessFormula: (dsa) => Math.min(100, Math.round((dsa / 120) * 60 + 35)),
    insiderTip: 'Microsoft loves follow-up questions. Once you solve the main problem, they\'ll add constraints. Don\'t code immediately — discuss approach for 5 min first.',
  },
  {
    id: 'amazon',
    name: 'Amazon',
    type: 'FAANG',
    difficulty: 'Hard',
    ctcRange: '20–38 LPA',
    color: '#FF9900',
    bg: 'rgba(255,153,0,0.10)',
    border: 'rgba(255,153,0,0.28)',
    shortcode: 'A',
    tagline: 'Leadership Principles are as important as your DSA skills.',
    rounds: [
      { name: 'Online Assessment', desc: '2 DSA + Work Style Survey, 105 min', focus: 'Arrays, Trees, Strings + WS survey' },
      { name: 'Technical Round 1', desc: '1 hr, 2 DSA + LP questions', focus: 'Arrays, Hashing, LP: Ownership' },
      { name: 'Technical Round 2', desc: '1 hr, 2 DSA + LP questions', focus: 'Trees, Graphs, LP: Dive Deep' },
      { name: 'Technical Round 3', desc: '1 hr, system design + LP', focus: 'HLD basics + LP: Bias for Action' },
      { name: 'Bar Raiser', desc: '1 hr — independent interviewer, LP-heavy', focus: 'Culture, judgement, past incidents' },
    ],
    oaPattern: '2 DSA problems in 70 min (Easy-Medium) + 15 min Work Style Survey (don\'t rush this, pick Leader-aligned answers). HackerRank.',
    keyTopics: ['Arrays & Hashing', 'Trees', 'Graphs', 'Dynamic Programming', 'Two Pointers', 'Leadership Principles (×16)', 'System Design Basics', 'Recursion', 'Stacks & Queues', 'String Manipulation'],
    mustDoCount: 120,
    pastQuestions: [
      { q: 'Number of islands — count connected components', tag: 'Graph', diff: 'Medium' },
      { q: 'Top K frequent elements', tag: 'Heap', diff: 'Medium' },
      { q: 'Meeting rooms II — min rooms needed', tag: 'Intervals', diff: 'Medium' },
      { q: 'Design Amazon\'s product recommendation system', tag: 'System Design', diff: 'Hard' },
      { q: 'Longest palindromic substring', tag: 'DP/String', diff: 'Medium' },
    ],
    prepFocus: [
      { area: 'DSA (Medium)', weight: 30, tip: 'Focus on Trees, Arrays, Graphs — Amazon repeats these' },
      { area: 'Leadership Principles', weight: 30, tip: 'Map 2 stories per LP. 16 LPs × 2 = 32 STAR stories' },
      { area: 'System Design', weight: 20, tip: 'Learn URL shortener, rate limiter, notification system' },
      { area: 'Communication', weight: 15, tip: 'Amazon cares about clear thinking more than perfect code' },
      { area: 'SQL/DB', weight: 5, tip: 'Basic SQL for the OA quiz section' },
    ],
    readinessFormula: (dsa) => Math.min(100, Math.round((dsa / 130) * 55 + 30)),
    insiderTip: 'Bar Raiser rounds can go sideways fast. If they ask "tell me about a time you failed" — they want real failure, not a disguised success. Authenticity wins.',
  },
  {
    id: 'flipkart',
    name: 'Flipkart',
    type: 'Product',
    difficulty: 'Hard',
    ctcRange: '18–32 LPA',
    color: '#F7BE00',
    bg: 'rgba(247,190,0,0.10)',
    border: 'rgba(247,190,0,0.28)',
    shortcode: 'F',
    tagline: 'India\'s toughest LLD rounds. Machine coding is the differentiator.',
    rounds: [
      { name: 'Online Assessment', desc: '3 DSA problems, 90 min', focus: 'Arrays, DP, Machine Coding' },
      { name: 'DSA Round', desc: '1 hr, 2 problems', focus: 'Graphs, DP, Trees — medium-hard' },
      { name: 'Machine Coding Round', desc: '90 min — build a working app', focus: 'Parking Lot, Snakes & Ladders, Chess board' },
      { name: 'High-Level Design', desc: '1 hr, system design', focus: 'Flipkart-like systems — catalog, search, checkout' },
      { name: 'Hiring Manager Round', desc: '45 min, leadership + product', focus: 'Past projects, product thinking, growth mindset' },
    ],
    oaPattern: '3 DSA problems (Easy + Medium + Hard) in 90 min on HackerEarth. Partial scoring enabled — write clean code even for partial solutions.',
    keyTopics: ['Low-Level Design', 'OOP & SOLID', 'DSA Advanced', 'Graphs & DP', 'Design Patterns', 'System Design', 'Product Thinking', 'Concurrency', 'Database Design', 'API Design'],
    mustDoCount: 100,
    pastQuestions: [
      { q: 'Build a functional Parking Lot with multi-floor support', tag: 'Machine Coding', diff: 'Hard' },
      { q: 'K closest points to origin', tag: 'Heap', diff: 'Medium' },
      { q: 'Design Flipkart\'s search autocomplete system', tag: 'System Design', diff: 'Hard' },
      { q: 'Implement a rate limiter (sliding window)', tag: 'Design', diff: 'Hard' },
      { q: 'Course schedule — detect cycle in directed graph', tag: 'Graph', diff: 'Medium' },
    ],
    prepFocus: [
      { area: 'Machine Coding / LLD', weight: 35, tip: 'Practice building apps in IDE under 90 min — Parking Lot, Library, Elevator' },
      { area: 'DSA', weight: 25, tip: '100+ LeetCode, focus Medium-Hard' },
      { area: 'System Design', weight: 20, tip: 'Study Flipkart-specific: catalog, cart, search' },
      { area: 'OOP & Design Patterns', weight: 15, tip: 'GoF patterns — especially Composite, Strategy, Command' },
      { area: 'Product Thinking', weight: 5, tip: 'Know how Flipkart\'s major features work' },
    ],
    readinessFormula: (dsa) => Math.min(100, Math.round((dsa / 110) * 50 + 30)),
    insiderTip: 'The machine coding round is won or lost before you write the first line. Spend 10 minutes planning classes, relationships, and edge cases on paper. Clean structure beats working but messy code.',
  },
  {
    id: 'goldman',
    name: 'Goldman Sachs',
    type: 'Global MNC',
    difficulty: 'Hard',
    ctcRange: '20–35 LPA',
    color: '#7AC3C3',
    bg: 'rgba(122,195,195,0.10)',
    border: 'rgba(122,195,195,0.28)',
    shortcode: 'GS',
    tagline: 'Quant + DSA fusion. Finance domain knowledge is a big plus.',
    rounds: [
      { name: 'Online Assessment', desc: 'Coding (2 DSA) + Quant Aptitude, 2 hr', focus: 'DP, Math, Probability, Number Theory' },
      { name: 'Technical Round 1', desc: '1 hr, DSA + CS fundamentals', focus: 'Graphs, DP, OS, Networks' },
      { name: 'Technical Round 2', desc: '1 hr, system design + CS', focus: 'Concurrency, databases, distributed systems' },
      { name: 'HR / Manager Round', desc: '45 min', focus: 'Finance interest, problem-solving mindset, ethics' },
    ],
    oaPattern: '2 DSA problems + 20 quant/aptitude MCQs + 10 CS fundamentals MCQs in 2 hours. Math aptitude is scored separately — don\'t skip it.',
    keyTopics: ['Dynamic Programming', 'Graphs', 'Number Theory & Math', 'Probability', 'OS & Threading', 'Database Concepts', 'Bit Manipulation', 'Sorting Algorithms', 'Finance Basics', 'Concurrency'],
    mustDoCount: 80,
    pastQuestions: [
      { q: 'Implement a producer-consumer queue with mutexes', tag: 'Concurrency', diff: 'Hard' },
      { q: 'Find the Nth Fibonacci number in O(log N)', tag: 'Math', diff: 'Medium' },
      { q: 'Design a stock ticker system with real-time updates', tag: 'System Design', diff: 'Hard' },
      { q: 'Maximum profit from stock with cooldown', tag: 'DP', diff: 'Medium' },
      { q: 'Count prime numbers using Sieve of Eratosthenes', tag: 'Math', diff: 'Easy' },
    ],
    prepFocus: [
      { area: 'DSA + Quant Math', weight: 35, tip: 'Brush up probability, combinatorics, number theory' },
      { area: 'OS & Concurrency', weight: 25, tip: 'Threading, mutex, deadlock, memory management' },
      { area: 'Database & SQL', weight: 20, tip: 'GS uses heavy DB internals — indexing, transactions' },
      { area: 'Finance Basics', weight: 15, tip: 'Know options, bonds, risk — shows genuine interest' },
      { area: 'Behavioural', weight: 5, tip: 'Ethics and integrity stories are key at GS' },
    ],
    readinessFormula: (dsa) => Math.min(100, Math.round((dsa / 90) * 50 + 30)),
    insiderTip: 'GS gives bonus points for candidates who know basic finance. Even saying "I understand how options pricing works" during interviews shows cultural fit they value highly.',
  },
  {
    id: 'razorpay',
    name: 'Razorpay',
    type: 'Fintech',
    difficulty: 'Medium',
    ctcRange: '15–28 LPA',
    color: '#2EB5C9',
    bg: 'rgba(46,181,201,0.10)',
    border: 'rgba(46,181,201,0.28)',
    shortcode: 'R',
    tagline: 'Fast-growing fintech. Cares about code quality + system thinking.',
    rounds: [
      { name: 'Take-Home Assignment', desc: '3 hr window, build a working feature', focus: 'Code quality, edge cases, README' },
      { name: 'Technical Round 1 (Assignment Review)', desc: '1 hr, deep dive into your submission', focus: 'Design decisions, trade-offs, extensions' },
      { name: 'Technical Round 2', desc: '1 hr, DSA + concurrency', focus: 'Medium DSA + real-world problem-solving' },
      { name: 'Hiring Manager', desc: '45 min, culture + ownership', focus: 'Bias for action, product curiosity' },
    ],
    oaPattern: 'Take-home project (not timed OA). You get 24–72 hours to build a small but functional system. Focus on clean architecture, test cases, and clear README.',
    keyTopics: ['System Design', 'API Design', 'Code Quality & Patterns', 'Concurrency', 'DSA Intermediate', 'Database Design', 'Payment Systems', 'Testing', 'REST APIs', 'Clean Code'],
    mustDoCount: 60,
    pastQuestions: [
      { q: 'Build a payment link generation system', tag: 'Take-Home', diff: 'Hard' },
      { q: 'Design a transaction ledger with idempotency', tag: 'System Design', diff: 'Hard' },
      { q: 'Implement an in-memory cache with TTL', tag: 'Coding', diff: 'Medium' },
      { q: 'Find duplicate transactions in O(n) time', tag: 'Hashing', diff: 'Medium' },
      { q: 'Design a webhook retry system with exponential backoff', tag: 'System Design', diff: 'Medium' },
    ],
    prepFocus: [
      { area: 'System & API Design', weight: 30, tip: 'Learn REST best practices, idempotency, pagination' },
      { area: 'Code Quality', weight: 25, tip: 'Clean code, SOLID, meaningful variable names, tests' },
      { area: 'DSA (Medium)', weight: 20, tip: 'Hashing, Heaps, Intervals — 60 problems is enough' },
      { area: 'Payment Domain', weight: 15, tip: 'Know how UPI, NEFT, payment gateways work conceptually' },
      { area: 'Testing', weight: 10, tip: 'Write unit tests in your take-home — it stands out' },
    ],
    readinessFormula: (dsa) => Math.min(100, Math.round((dsa / 70) * 45 + 40)),
    insiderTip: 'Your take-home README is read before your code. A clear explanation of design decisions + trade-offs can carry a submission that has minor bugs to the next round.',
  },
  {
    id: 'infosys',
    name: 'Infosys',
    type: 'Service',
    difficulty: 'Easy',
    ctcRange: '3.6–9 LPA',
    color: '#007CC3',
    bg: 'rgba(0,124,195,0.10)',
    border: 'rgba(0,124,195,0.28)',
    shortcode: 'IN',
    tagline: 'Aptitude-heavy. Basic DSA + good communication wins.',
    rounds: [
      { name: 'InfyTQ / Infosys Hackathon OA', desc: 'Aptitude + Verbal + Coding, 3 hr', focus: 'Aptitude, Pseudocode, Basic SQL, OOP MCQs' },
      { name: 'Technical Interview', desc: '30–45 min', focus: 'C/C++/Java basics, OOPS, DBMS, 1–2 easy DSA' },
      { name: 'HR Interview', desc: '15–20 min', focus: 'Communication, relocation, role clarity' },
    ],
    oaPattern: 'InfyTQ certification (free, online) + Infosys Hackathon. InfyTQ has: Quantitative Aptitude (15Q) + Logical Reasoning (10Q) + Verbal English (20Q) + Pseudo Code (5Q) + Coding (2 Easy problems). Scoring: 65% = Pass.',
    keyTopics: ['Basic DSA (Arrays, Strings)', 'OOP Concepts', 'SQL & DBMS', 'Aptitude (QA + LR)', 'C/C++/Java Basics', 'Operating System Basics', 'Data Types & Algorithms', 'Pseudocode', 'Networking Basics', 'Communication Skills'],
    mustDoCount: 30,
    pastQuestions: [
      { q: 'Reverse a linked list', tag: 'Linked List', diff: 'Easy' },
      { q: 'Find all duplicates in an array', tag: 'Arrays', diff: 'Easy' },
      { q: 'Write SQL query for 2nd highest salary', tag: 'SQL', diff: 'Easy' },
      { q: 'Explain OOPS: inheritance vs composition', tag: 'OOP Concepts', diff: 'Easy' },
      { q: 'What is a deadlock? How to prevent it?', tag: 'OS', diff: 'Easy' },
    ],
    prepFocus: [
      { area: 'Aptitude (QA + LR)', weight: 30, tip: 'Practice IndiaBIX, 100 questions daily for 2 weeks' },
      { area: 'OOP & Core Java/C++', weight: 25, tip: 'Master 4 pillars of OOP + basic exception handling' },
      { area: 'DBMS & SQL', weight: 20, tip: 'Normalization, joins, basic SQL queries' },
      { area: 'Basic DSA', weight: 15, tip: 'Arrays, Strings, Sorting — 30 Easy LeetCode problems' },
      { area: 'Communication', weight: 10, tip: 'HR round is eliminatory at Infosys — speak confidently' },
    ],
    readinessFormula: (dsa) => Math.min(100, Math.round((dsa / 35) * 40 + 55)),
    insiderTip: 'InfyTQ is a certification platform — take it early, it\'s free. Scoring 75%+ on InfyTQ gets you fast-tracked to the Power Programmer / Specialist Programmer track with 2× salary.',
  },
  {
    id: 'adobe',
    name: 'Adobe',
    type: 'Global MNC',
    difficulty: 'Hard',
    ctcRange: '20–36 LPA',
    color: '#FF0000',
    bg: 'rgba(255,0,0,0.10)',
    border: 'rgba(255,0,0,0.25)',
    shortcode: 'AD',
    tagline: 'Creative + analytical. Strong DSA with product/design awareness.',
    rounds: [
      { name: 'Online Assessment', desc: '3 DSA problems, 90 min', focus: 'Arrays, DP, Graph — LeetCode Medium-Hard' },
      { name: 'Technical Round 1', desc: '1 hr, 2 DSA problems', focus: 'Heaps, Graphs, Recursion' },
      { name: 'Technical Round 2', desc: '1 hr, 1 DSA + LLD', focus: 'Complex problem + design a system component' },
      { name: 'Technical Round 3 (SDE 2+)', desc: '1 hr, HLD + project discussion', focus: 'Scalability + your past projects in depth' },
      { name: 'HR Round', desc: '30 min', focus: 'Creativity, ownership, cross-functional mindset' },
    ],
    oaPattern: '3 DSA problems in 90 min on HackerEarth. Difficulty: 1 Easy + 2 Medium-Hard. Adobe tests edge cases aggressively — always handle null, empty, and boundary inputs.',
    keyTopics: ['Dynamic Programming', 'Graphs', 'Heaps & Priority Queues', 'Trees', 'Backtracking', 'Low-Level Design', 'System Design Basics', 'OS Memory Management', 'String Algorithms', 'Project Deep-Dives'],
    mustDoCount: 100,
    pastQuestions: [
      { q: 'Regular expression matching', tag: 'DP', diff: 'Hard' },
      { q: 'Median of two sorted arrays', tag: 'Binary Search', diff: 'Hard' },
      { q: 'Design Adobe Acrobat\'s annotation system', tag: 'LLD', diff: 'Hard' },
      { q: 'Find all permutations of a string', tag: 'Backtracking', diff: 'Medium' },
      { q: 'Implement a simple version control system', tag: 'Design', diff: 'Hard' },
    ],
    prepFocus: [
      { area: 'DSA (Hard focus)', weight: 35, tip: 'Adobe repeats DP and Graph problems — drill these hard' },
      { area: 'Low-Level Design', weight: 25, tip: 'Practice designing feature-level systems like undo/redo' },
      { area: 'System Design', weight: 20, tip: 'Focus on media storage, document processing pipelines' },
      { area: 'Project Depth', weight: 15, tip: 'Know every detail of your resume projects — they dig deep' },
      { area: 'Creativity & Problem Solving', weight: 5, tip: 'Adobe values original thinking in design discussions' },
    ],
    readinessFormula: (dsa) => Math.min(100, Math.round((dsa / 120) * 55 + 30)),
    insiderTip: 'Adobe interviewers often ask you to extend your solution — add a new constraint. If your initial design can\'t extend cleanly, that\'s a red flag. Always code with extensibility in mind.',
  },
]

const DIFFICULTY_COLOR: Record<string, string> = {
  'Very Hard': 'text-red-400 bg-red-400/10 border-red-400/25',
  'Hard': 'text-orange-400 bg-orange-400/10 border-orange-400/25',
  'Medium': 'text-yellow-400 bg-yellow-400/10 border-yellow-400/25',
  'Easy': 'text-emerald-400 bg-emerald-400/10 border-emerald-400/25',
}

const TYPE_COLOR: Record<string, string> = {
  'FAANG': 'text-violet-400 bg-violet-400/10 border-violet-400/25',
  'Product': 'text-blue-400 bg-blue-400/10 border-blue-400/25',
  'Fintech': 'text-cyan-400 bg-cyan-400/10 border-cyan-400/25',
  'Service': 'text-emerald-400 bg-emerald-400/10 border-emerald-400/25',
  'Global MNC': 'text-pink-400 bg-pink-400/10 border-pink-400/25',
}

const FILTERS = ['All', 'FAANG', 'Product', 'Fintech', 'Service', 'Global MNC']

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CompanyPage() {
  const [filter, setFilter] = useState('All')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [target, setTarget] = useState<string | null>(null)
  const [dsaSolved, setDsaSolved] = useState(0)

  useEffect(() => {
    // Load saved target company and DSA count from localStorage
    setTarget(localStorage.getItem('pf_target_company'))
    const dsa = parseInt(localStorage.getItem('pf_dsa_count') ?? '0', 10)
    setDsaSolved(isNaN(dsa) ? 0 : dsa)
  }, [])

  function setTargetCompany(id: string) {
    const next = target === id ? null : id
    if (next) localStorage.setItem('pf_target_company', next)
    else localStorage.removeItem('pf_target_company')
    setTarget(next)
  }

  const filtered = filter === 'All' ? COMPANIES : COMPANIES.filter(c => c.type === filter)

  return (
    <div className="min-h-screen page-bg text-white">
      {/* Nav */}
      <nav className="border-b border-white/10 px-6 py-4 flex items-center justify-between sticky top-0 nav-bg z-30">
        <div className="flex items-center gap-3">
          <a href="/dashboard" className="text-white/50 hover:text-white text-sm transition-colors font-body">← Dashboard</a>
          <span className="text-white/20">/</span>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #0EA5E9)' }}>
              <Building2 size={12} className="text-white" />
            </div>
            <span className="font-heading font-semibold text-white">Company Intelligence</span>
          </div>
        </div>
        {target && (
          <div className="flex items-center gap-2 text-xs font-body">
            <Target size={12} className="text-violet-400" />
            <span className="text-white/60">Target:</span>
            <span className="text-violet-400 font-semibold">
              {COMPANIES.find(c => c.id === target)?.name}
            </span>
          </div>
        )}
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">

        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
          <h1 className="font-heading font-extrabold text-3xl text-white mb-2">
            Company{' '}
            <span style={{
              background: 'linear-gradient(135deg, #7C3AED, #0EA5E9)',
              WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              Intelligence
            </span>
          </h1>
          <p className="text-white/65 font-body text-sm max-w-xl">
            Know exactly what each company tests, how many problems to solve, and where your gaps are — before you walk into the interview.
          </p>
        </motion.div>

        {/* DSA solved input */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }}
          className="flex items-center gap-4 p-4 rounded-2xl border"
          style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #0EA5E9, #7C3AED)' }}>
            <Code2 size={14} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-heading font-semibold text-white">Your DSA problems solved</p>
            <p className="text-white/50 text-xs font-body">Used to calculate your readiness score for each company</p>
          </div>
          <input
            type="number"
            value={dsaSolved || ''}
            onChange={e => {
              const v = parseInt(e.target.value, 10)
              const val = isNaN(v) ? 0 : Math.max(0, v)
              setDsaSolved(val)
              localStorage.setItem('pf_dsa_count', String(val))
            }}
            placeholder="0"
            className="w-20 text-center rounded-xl px-3 py-2 text-white font-heading font-bold text-lg focus:outline-none border border-white/10 focus:border-violet-500/60"
            style={{ background: 'rgba(255,255,255,0.05)' }}
          />
        </motion.div>

        {/* Filter chips */}
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-xs px-3.5 py-1.5 rounded-full border font-body transition-all ${
                filter === f
                  ? 'bg-violet-600 border-violet-500 text-white'
                  : 'bg-white/3 border-white/10 text-white/60 hover:border-white/30 hover:text-white'
              }`}>
              {f}
            </button>
          ))}
        </div>

        {/* Company cards */}
        <div className="space-y-3">
          {filtered.map((company, i) => (
            <CompanyCard
              key={company.id}
              company={company}
              index={i}
              isExpanded={expanded === company.id}
              isTarget={target === company.id}
              dsaSolved={dsaSolved}
              onExpand={() => setExpanded(expanded === company.id ? null : company.id)}
              onSetTarget={() => setTargetCompany(company.id)}
            />
          ))}
        </div>

      </main>
    </div>
  )
}

// ─── Company Card ─────────────────────────────────────────────────────────────
function CompanyCard({
  company, index, isExpanded, isTarget, dsaSolved, onExpand, onSetTarget,
}: {
  company: Company; index: number; isExpanded: boolean; isTarget: boolean
  dsaSolved: number; onExpand: () => void; onSetTarget: () => void
}) {
  const readiness = company.readinessFormula(dsaSolved)
  const readinessColor = readiness >= 70 ? '#10b981' : readiness >= 45 ? '#f59e0b' : '#ef4444'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35 }}
      className="rounded-2xl border overflow-hidden"
      style={{
        background: isTarget ? company.bg : 'rgba(255,255,255,0.03)',
        borderColor: isTarget ? company.border : 'rgba(255,255,255,0.08)',
      }}
    >
      {/* ── Header row ── */}
      <div className="p-5">
        <div className="flex items-center gap-4">
          {/* Company avatar */}
          <div className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center font-heading font-extrabold text-white text-sm"
            style={{ background: `linear-gradient(135deg, ${company.color}90, ${company.color}50)`, border: `1px solid ${company.border}` }}>
            {company.shortcode}
          </div>

          {/* Name + badges */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-heading font-bold text-white text-lg">{company.name}</span>
              {isTarget && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-body font-semibold"
                  style={{ background: company.bg, border: `1px solid ${company.border}`, color: company.color }}>
                  🎯 Your Target
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-body ${DIFFICULTY_COLOR[company.difficulty]}`}>
                {company.difficulty}
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-body ${TYPE_COLOR[company.type]}`}>
                {company.type}
              </span>
              <span className="text-white/50 text-xs font-body">{company.ctcRange}</span>
              <span className="text-white/35 text-xs font-body">· {company.rounds.length} rounds</span>
            </div>
          </div>

          {/* Readiness ring */}
          <div className="shrink-0 flex flex-col items-center gap-1">
            <div className="relative w-14 h-14">
              <svg viewBox="0 0 48 48" className="w-full h-full -rotate-90">
                <circle cx="24" cy="24" r="19" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
                <motion.circle
                  cx="24" cy="24" r="19" fill="none"
                  stroke={readinessColor} strokeWidth="4" strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: readiness / 100 }}
                  transition={{ duration: 1, delay: index * 0.08, ease: [0.2, 0.7, 0.4, 1] }}
                  strokeDasharray="1 0"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-heading font-bold text-xs" style={{ color: readinessColor }}>{readiness}%</span>
              </div>
            </div>
            <span className="text-[10px] text-white/40 font-body">ready</span>
          </div>
        </div>

        <p className="text-white/60 text-xs font-body mt-3 italic">{company.tagline}</p>

        {/* Action row */}
        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={onSetTarget}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-body transition-all"
            style={isTarget
              ? { background: company.bg, borderColor: company.border, color: company.color }
              : { background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.55)' }
            }
          >
            <Target size={11} />
            {isTarget ? 'Remove target' : 'Set as target'}
          </button>
          <button
            onClick={onExpand}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-white/10 bg-white/4 text-white/65 hover:text-white hover:border-white/25 font-body transition-all"
          >
            {isExpanded ? <><ChevronUp size={11} /> Hide details</> : <><ChevronDown size={11} /> Full intel</>}
          </button>
        </div>
      </div>

      {/* ── Expanded details ── */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.2, 0.7, 0.4, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t space-y-6 p-5" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>

              {/* Readiness gap analysis */}
              <div>
                <p className="text-xs font-heading font-bold text-white/70 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <BarChart3 size={12} /> Your Readiness Breakdown
                </p>
                <div className="space-y-2.5">
                  {company.prepFocus.map((pf, pi) => {
                    const filled = Math.min(100, Math.round((dsaSolved / company.mustDoCount) * pf.weight * 2.5))
                    return (
                      <div key={pi}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-body text-white/75">{pf.area}</span>
                          <span className="text-[10px] font-body text-white/40">{pf.weight}% weight</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                          <motion.div
                            className="h-full rounded-full"
                            style={{ background: `linear-gradient(90deg, ${company.color}, ${company.color}90)` }}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(filled, 100)}%` }}
                            transition={{ duration: 0.8, delay: pi * 0.1 }}
                          />
                        </div>
                        <p className="text-[10px] text-white/35 font-body mt-1">{pf.tip}</p>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Interview rounds */}
              <div>
                <p className="text-xs font-heading font-bold text-white/70 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Users size={12} /> Interview Rounds
                </p>
                <div className="space-y-2">
                  {company.rounds.map((r, ri) => (
                    <div key={ri} className="flex gap-3 p-3 rounded-xl border"
                      style={{ background: 'rgba(255,255,255,0.025)', borderColor: 'rgba(255,255,255,0.06)' }}>
                      <div className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-heading font-bold"
                        style={{ background: company.bg, border: `1px solid ${company.border}`, color: company.color }}>
                        {ri + 1}
                      </div>
                      <div>
                        <p className="text-sm font-heading font-semibold text-white/90">{r.name}</p>
                        <p className="text-xs font-body text-white/55 mt-0.5">{r.desc}</p>
                        <p className="text-[11px] font-body mt-1" style={{ color: company.color }}>Focus: {r.focus}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* OA pattern */}
              <div className="p-4 rounded-xl border"
                style={{ background: company.bg, borderColor: company.border }}>
                <p className="text-xs font-heading font-bold uppercase tracking-wider mb-2 flex items-center gap-2"
                  style={{ color: company.color }}>
                  <Clock size={11} /> OA Pattern
                </p>
                <p className="text-sm font-body text-white/80 leading-relaxed">{company.oaPattern}</p>
              </div>

              {/* Key topics */}
              <div>
                <p className="text-xs font-heading font-bold text-white/70 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <BookOpen size={12} /> Must-Know Topics ({company.keyTopics.length} topics)
                </p>
                <div className="flex flex-wrap gap-2">
                  {company.keyTopics.map(t => (
                    <span key={t} className="text-xs px-2.5 py-1 rounded-lg border font-body"
                      style={{ background: company.bg, borderColor: company.border, color: company.color }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Past questions sample */}
              <div>
                <p className="text-xs font-heading font-bold text-white/70 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Code2 size={12} /> Past Questions Sample
                </p>
                <div className="space-y-2">
                  {company.pastQuestions.map((q, qi) => (
                    <div key={qi} className="flex items-start gap-3 p-3 rounded-xl border"
                      style={{ background: 'rgba(255,255,255,0.025)', borderColor: 'rgba(255,255,255,0.06)' }}>
                      <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full border font-body mt-0.5 ${DIFFICULTY_COLOR[q.diff]}`}>
                        {q.diff}
                      </span>
                      <div>
                        <p className="text-sm font-body text-white/85">{q.q}</p>
                        <p className="text-[10px] font-body text-white/35 mt-0.5">{q.tag}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Insider tip */}
              <div className="flex gap-3 p-4 rounded-xl border"
                style={{ background: 'rgba(139,92,246,0.08)', borderColor: 'rgba(139,92,246,0.2)' }}>
                <Sparkles size={14} className="shrink-0 text-violet-400 mt-0.5" />
                <div>
                  <p className="text-[10px] font-heading font-bold text-violet-400 uppercase tracking-wider mb-1">Insider Tip</p>
                  <p className="text-sm font-body text-white/80 leading-relaxed">{company.insiderTip}</p>
                </div>
              </div>

              {/* What you need */}
              <div className="p-4 rounded-xl border flex items-center gap-4"
                style={{ background: 'rgba(255,255,255,0.025)', borderColor: 'rgba(255,255,255,0.07)' }}>
                <div>
                  <p className="text-xs text-white/50 font-body">Problems needed</p>
                  <p className="font-heading font-bold text-white text-xl">{company.mustDoCount}+</p>
                </div>
                <div className="w-px h-10 bg-white/10" />
                <div>
                  <p className="text-xs text-white/50 font-body">You have solved</p>
                  <p className="font-heading font-bold text-xl" style={{ color: dsaSolved >= company.mustDoCount ? '#10b981' : '#f59e0b' }}>
                    {dsaSolved}
                  </p>
                </div>
                <div className="w-px h-10 bg-white/10" />
                <div>
                  <p className="text-xs text-white/50 font-body">Gap</p>
                  <p className="font-heading font-bold text-xl" style={{ color: '#ef4444' }}>
                    {Math.max(0, company.mustDoCount - dsaSolved)}
                  </p>
                </div>
                {dsaSolved >= company.mustDoCount && (
                  <div className="ml-auto flex items-center gap-1.5 text-emerald-400 text-sm font-heading">
                    <CheckCircle2 size={14} />
                    DSA Ready!
                  </div>
                )}
                {dsaSolved < company.mustDoCount && (
                  <a href="/dsa"
                    className="ml-auto flex items-center gap-1 text-xs font-body transition-colors"
                    style={{ color: company.color }}>
                    Solve now <ArrowRight size={10} />
                  </a>
                )}
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
