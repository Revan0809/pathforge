'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp, ExternalLink, BookOpen, ArrowLeft } from 'lucide-react'

// ─── Data ─────────────────────────────────────────────────────────────────────

interface Resource { label: string; url: string; type: 'video' | 'book' | 'site' }
interface Step { title: string; topics: string[]; tip?: string }
interface Subject {
  id: string
  name: string
  short: string
  emoji: string
  color: string
  border: string
  glow: string
  importance: 'Critical' | 'High' | 'Medium'
  whyItMatters: string
  steps: Step[]
  resources: Resource[]
  examTips: string[]
}

const SUBJECTS: Subject[] = [
  {
    id: 'dsa',
    name: 'Data Structures & Algorithms',
    short: 'DSA',
    emoji: '💻',
    color: 'from-blue-500 to-cyan-500',
    border: 'border-blue-500/30',
    glow: 'shadow-blue-500/10',
    importance: 'Critical',
    whyItMatters: 'Every product company interview — Google, Microsoft, Amazon — is primarily DSA rounds. This is non-negotiable.',
    steps: [
      { title: 'Arrays & Strings', topics: ['Two pointers', 'Sliding window', 'Prefix sums', 'Kadane\'s algorithm'], tip: 'Solve 20 easy problems before moving on.' },
      { title: 'Linked Lists', topics: ['Reversal', 'Cycle detection (Floyd)', 'Merge sort on LL', 'LRU Cache'] },
      { title: 'Stacks & Queues', topics: ['Monotonic stack', 'Min stack', 'Circular queue', 'Next greater element'] },
      { title: 'Trees & BST', topics: ['DFS / BFS traversals', 'Height, diameter', 'Lowest common ancestor', 'BST insert/delete/search'], tip: 'Trees appear in ~30% of interviews.' },
      { title: 'Heaps & Hashing', topics: ['Min/max heap', 'Top-K problems', 'HashMap patterns', 'Two-sum family'] },
      { title: 'Graphs', topics: ['BFS, DFS', 'Topological sort', 'Dijkstra, Bellman-Ford', 'Union-Find', 'Cycle detection'], tip: 'Most feared, but 3 patterns cover 80% of questions.' },
      { title: 'Dynamic Programming', topics: ['Memoisation vs tabulation', '1D DP (Fibonacci family)', '2D DP (LCS, LIS)', 'Knapsack variants', 'Interval DP'], tip: 'Start with recursion → add memo → convert to table.' },
      { title: 'Advanced Topics', topics: ['Segment trees', 'Tries', 'Bit manipulation', 'Backtracking', 'Divide & Conquer'] },
    ],
    resources: [
      { label: 'Striver A2Z Sheet (455 problems)', url: 'https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2/', type: 'site' },
      { label: 'NeetCode 150 (YouTube)', url: 'https://www.youtube.com/@NeetCode', type: 'video' },
      { label: 'Abdul Bari Algorithms (YouTube)', url: 'https://www.youtube.com/@abdul_bari', type: 'video' },
      { label: 'LeetCode Patterns', url: 'https://seanprashad.com/leetcode-patterns/', type: 'site' },
    ],
    examTips: [
      'Solve minimum 150 problems — quality over quantity.',
      'Time yourself: easy ≤15 min, medium ≤30 min.',
      'After solving, read editorial even if you got it right.',
      'Keep a "revisit" list — problems you solved but couldn\'t explain.',
    ],
  },
  {
    id: 'os',
    name: 'Operating Systems',
    short: 'OS',
    emoji: '⚙️',
    color: 'from-orange-500 to-amber-500',
    border: 'border-orange-500/30',
    glow: 'shadow-orange-500/10',
    importance: 'Critical',
    whyItMatters: 'Asked heavily in SDE-2+ interviews, GATE, and any system-level role. Concepts like threads, deadlocks, virtual memory are directly applicable.',
    steps: [
      { title: 'Introduction & System Calls', topics: ['OS structure (monolithic, microkernel)', 'System call interface', 'User mode vs kernel mode', 'Interrupts & traps'] },
      { title: 'Process Management', topics: ['Process vs Thread', 'PCB structure', 'Context switching', 'Fork & exec', 'Process states (5-state model)'], tip: 'Draw the 5-state diagram from memory.' },
      { title: 'CPU Scheduling', topics: ['FCFS, SJF, SRTF, Round Robin', 'Priority scheduling', 'Multilevel queue', 'Gantt charts + avg waiting time'], tip: 'GATE loves numerical scheduling questions.' },
      { title: 'Process Synchronisation', topics: ['Race condition', 'Critical section problem', 'Mutex & semaphores', 'Peterson\'s solution', 'Producer-Consumer, Reader-Writer, Dining Philosophers'] },
      { title: 'Deadlocks', topics: ['Necessary conditions (CHEN)', 'Resource Allocation Graph', 'Banker\'s algorithm (safety + request)', 'Prevention vs Avoidance vs Detection'] },
      { title: 'Memory Management', topics: ['Contiguous allocation (first/best/worst fit)', 'Paging & page tables', 'Segmentation', 'Internal vs External fragmentation', 'TLB'] },
      { title: 'Virtual Memory', topics: ['Demand paging', 'Page fault handling', 'Page replacement (FIFO, LRU, Optimal)', 'Thrashing', 'Working set model'] },
      { title: 'File Systems & I/O', topics: ['File allocation (contiguous, linked, indexed)', 'Directory structures', 'Disk scheduling (SSTF, SCAN, C-SCAN)', 'RAID levels'] },
    ],
    resources: [
      { label: 'OSTEP (free online textbook)', url: 'https://pages.cs.wisc.edu/~remzi/OSTEP/', type: 'book' },
      { label: 'Neso Academy OS (YouTube)', url: 'https://www.youtube.com/playlist?list=PLBlnK6fEyqRiVhbXDGLXDk_OQAeuVcp2O', type: 'video' },
      { label: 'Gate Smashers OS (YouTube)', url: 'https://www.youtube.com/playlist?list=PLxCzCOWd7aiGz9donHRrE9I3Mwn6XdP8p', type: 'video' },
      { label: 'GeeksforGeeks OS', url: 'https://www.geeksforgeeks.org/operating-systems/', type: 'site' },
    ],
    examTips: [
      'Banker\'s algorithm: practice 3–4 numericals end-to-end.',
      'Page replacement: solve Belady\'s anomaly example.',
      'Scheduling: calculate turnaround time and waiting time for each algorithm.',
      'Deadlock: draw RAG and check for cycles.',
    ],
  },
  {
    id: 'dbms',
    name: 'Database Management Systems',
    short: 'DBMS',
    emoji: '🗄️',
    color: 'from-emerald-500 to-teal-500',
    border: 'border-emerald-500/30',
    glow: 'shadow-emerald-500/10',
    importance: 'Critical',
    whyItMatters: 'Every backend role needs SQL. DBMS theory covers GATE. Normalization and indexing are asked in almost every SDE interview.',
    steps: [
      { title: 'Relational Model Basics', topics: ['Relations, tuples, attributes', 'Keys: primary, foreign, super, candidate', 'Integrity constraints', 'Relational algebra (σ, π, ⋈, ∪, −)'] },
      { title: 'SQL (Must Master)', topics: ['SELECT, WHERE, GROUP BY, HAVING, ORDER BY', 'JOINs (INNER, LEFT, RIGHT, FULL)', 'Subqueries & CTEs', 'Window functions (ROW_NUMBER, RANK, LAG/LEAD)', 'Indexes, Views'], tip: 'Write 50+ SQL queries on LeetCode/HackerRank.' },
      { title: 'ER Modeling', topics: ['Entities, attributes, relationships', 'Cardinality (1:1, 1:N, M:N)', 'Weak entities', 'ER to relational mapping'] },
      { title: 'Normalisation', topics: ['Functional dependencies', '1NF, 2NF, 3NF', 'BCNF (Boyce-Codd)', 'Decomposition: lossless join + dependency preservation'], tip: 'GATE always has a normalisation question. Understand BCNF deeply.' },
      { title: 'Transactions & Concurrency', topics: ['ACID properties', 'Transaction states', 'Serializability (conflict, view)', 'Locking (2PL, shared/exclusive)', 'Deadlock in transactions', 'Recovery (undo, redo, checkpoint)'] },
      { title: 'Indexing & Query Optimisation', topics: ['B-tree & B+ tree indexes', 'Dense vs sparse index', 'Clustered vs non-clustered', 'Query cost estimation', 'EXPLAIN in SQL'] },
      { title: 'NoSQL & Modern Databases', topics: ['CAP theorem', 'MongoDB (document store)', 'Redis (key-value cache)', 'Cassandra (wide-column)', 'When to use SQL vs NoSQL'] },
    ],
    resources: [
      { label: 'CMU 15-445 (free lecture videos)', url: 'https://15445.courses.cs.cmu.edu/', type: 'video' },
      { label: 'Neso Academy DBMS (YouTube)', url: 'https://www.youtube.com/playlist?list=PLBlnK6fEyqRi_CUQ-FXxgZZUSKu2f89TV', type: 'video' },
      { label: 'LeetCode SQL 50', url: 'https://leetcode.com/studyplan/top-sql-50/', type: 'site' },
      { label: 'GeeksforGeeks DBMS', url: 'https://www.geeksforgeeks.org/dbms/', type: 'site' },
    ],
    examTips: [
      'SQL window functions are asked in product company interviews.',
      'Normalisation: given a relation + FDs, find the highest normal form.',
      'Practise drawing B+ tree insertion/deletion.',
      '2PL: understand why it guarantees serializability.',
    ],
  },
  {
    id: 'cn',
    name: 'Computer Networks',
    short: 'CN',
    emoji: '🌐',
    color: 'from-violet-500 to-purple-600',
    border: 'border-violet-500/30',
    glow: 'shadow-violet-500/10',
    importance: 'High',
    whyItMatters: 'Asked in DevOps, backend, and SDE roles. HTTP, TCP, DNS are discussed in every system design interview.',
    steps: [
      { title: 'Network Models', topics: ['OSI 7 layers (and what each does)', 'TCP/IP 4-layer model', 'Encapsulation & decapsulation', 'PDUs at each layer'] },
      { title: 'Physical & Data Link Layer', topics: ['Encoding (NRZ, Manchester)', 'Error detection: CRC, checksum, parity', 'MAC address, ARP', 'Ethernet, 802.11 (Wi-Fi)', 'Sliding window protocols (Go-Back-N, Selective Repeat)', 'CSMA/CD, CSMA/CA'] },
      { title: 'Network Layer', topics: ['IPv4 addressing & subnetting (CIDR)', 'IPv6 basics', 'Routing: RIP, OSPF, BGP', 'NAT, ICMP, ping, traceroute', 'Dijkstra & Bellman-Ford for routing'] },
      { title: 'Transport Layer', topics: ['TCP vs UDP', 'TCP 3-way handshake & 4-way close', 'Flow control (sliding window)', 'Congestion control (slow start, AIMD)', 'TCP segment structure, sequence numbers'], tip: 'TCP vs UDP is asked in almost every interview.' },
      { title: 'Application Layer', topics: ['HTTP/1.1 vs HTTP/2 vs HTTP/3', 'HTTPS & TLS handshake', 'DNS (resolution, recursive vs iterative)', 'SMTP, FTP, DHCP', 'REST vs WebSockets'] },
      { title: 'Security Basics', topics: ['Symmetric vs Asymmetric encryption', 'SSL/TLS certificates', 'Firewalls & proxy servers', 'Common attacks: MITM, DDoS, SQL injection'] },
    ],
    resources: [
      { label: 'Kurose & Ross (textbook)', url: 'https://gaia.cs.umass.edu/kurose_ross/index.php', type: 'book' },
      { label: 'Neso Academy CN (YouTube)', url: 'https://www.youtube.com/playlist?list=PLBlnK6fEyqRgMCUAG0XRw78UA8qnmVjjr', type: 'video' },
      { label: 'Cisco Packet Tracer (free labs)', url: 'https://www.netacad.com/courses/packet-tracer', type: 'site' },
      { label: 'GeeksforGeeks CN', url: 'https://www.geeksforgeeks.org/computer-network-tutorials/', type: 'site' },
    ],
    examTips: [
      'Subnetting: practice 10 CIDR questions until you can do them in 1 minute.',
      'Sliding window: draw a timeline diagram for Go-Back-N.',
      'TCP handshake: explain every flag (SYN, ACK, FIN, RST).',
      'Know the default port numbers: HTTP 80, HTTPS 443, SSH 22, DNS 53.',
    ],
  },
  {
    id: 'oop',
    name: 'Object-Oriented Programming',
    short: 'OOP',
    emoji: '🧩',
    color: 'from-pink-500 to-rose-500',
    border: 'border-pink-500/30',
    glow: 'shadow-pink-500/10',
    importance: 'High',
    whyItMatters: 'Fundamental to all software engineering. Design pattern questions + OOP concepts are asked in every SDE interview, especially for Java/C++ roles.',
    steps: [
      { title: 'Core OOP Concepts', topics: ['Class vs Object', 'Constructors & destructors', 'this keyword', 'static members', 'Access modifiers (public, private, protected)'] },
      { title: 'Encapsulation', topics: ['Getters & setters', 'Data hiding', 'Information hiding vs encapsulation', 'JavaBeans convention'] },
      { title: 'Inheritance', topics: ['Single, multi-level, hierarchical', 'Method overriding vs overloading', 'super keyword', 'Diamond problem & solution', 'Abstract classes'] },
      { title: 'Polymorphism', topics: ['Compile-time (overloading)', 'Runtime (overriding + virtual functions)', 'Dynamic dispatch', 'Interfaces vs abstract classes'], tip: 'Explain runtime polymorphism with a real example.' },
      { title: 'Abstraction', topics: ['Abstract classes', 'Interfaces', 'When to use each', 'Dependency inversion principle'] },
      { title: 'SOLID Principles', topics: ['S – Single Responsibility', 'O – Open/Closed', 'L – Liskov Substitution', 'I – Interface Segregation', 'D – Dependency Inversion'], tip: 'Know 1 code example for each SOLID principle.' },
      { title: 'Design Patterns', topics: ['Creational: Singleton, Factory, Builder', 'Structural: Adapter, Decorator, Proxy, Facade', 'Behavioural: Observer, Strategy, Command, Iterator'], tip: 'Singleton, Factory, Observer are asked most frequently.' },
    ],
    resources: [
      { label: 'Head First Design Patterns (book)', url: 'https://www.oreilly.com/library/view/head-first-design/0596007124/', type: 'book' },
      { label: 'Refactoring Guru (free website)', url: 'https://refactoring.guru/design-patterns', type: 'site' },
      { label: 'Derek Banas Design Patterns (YouTube)', url: 'https://www.youtube.com/playlist?list=PLF206E906175C7E07', type: 'video' },
      { label: 'GeeksforGeeks OOP', url: 'https://www.geeksforgeeks.org/object-oriented-programming-oops-concept-in-java/', type: 'site' },
    ],
    examTips: [
      'Be able to code Singleton (thread-safe) in your preferred language.',
      'Observer pattern: explain how it\'s used in event listeners.',
      'SOLID: prepare a 30-second explanation for each.',
      'Difference between interface and abstract class — asked in 70% of interviews.',
    ],
  },
  {
    id: 'sysdesign',
    name: 'System Design',
    short: 'Sys Design',
    emoji: '🏗️',
    color: 'from-cyan-500 to-blue-500',
    border: 'border-cyan-500/30',
    glow: 'shadow-cyan-500/10',
    importance: 'High',
    whyItMatters: 'Mandatory for SDE-2+ and product company final rounds. Start learning from 5th semester.',
    steps: [
      { title: 'Fundamentals', topics: ['Scalability (vertical vs horizontal)', 'Latency vs throughput', 'Availability vs consistency', 'CAP theorem', 'SLA / SLO / SLI'] },
      { title: 'Databases at Scale', topics: ['SQL vs NoSQL trade-offs', 'Sharding strategies', 'Replication (master-slave, multi-master)', 'Read replicas', 'Connection pooling'] },
      { title: 'Caching', topics: ['Cache-aside, write-through, write-back', 'Redis data structures', 'Cache eviction (LRU, LFU)', 'CDN for static assets', 'Cache stampede'] },
      { title: 'Messaging & Async', topics: ['Message queues (Kafka, RabbitMQ)', 'Pub-sub pattern', 'Event-driven architecture', 'Eventual consistency'] },
      { title: 'APIs & Communication', topics: ['REST design principles', 'Rate limiting (token bucket, leaky bucket)', 'API gateway', 'gRPC vs REST', 'GraphQL basics'] },
      { title: 'High-Level Design Framework', topics: ['Clarify requirements (functional + non-functional)', 'Estimate scale (QPS, storage)', 'Draw high-level diagram', 'Dive into bottlenecks', 'Identify trade-offs'], tip: 'Use this framework in every mock interview.' },
      { title: 'Real System Case Studies', topics: ['URL shortener (TinyURL)', 'Twitter feed / news feed', 'WhatsApp / chat system', 'YouTube / video streaming', 'Uber / ride-sharing', 'Notification system'] },
    ],
    resources: [
      { label: 'System Design Primer (GitHub)', url: 'https://github.com/donnemartin/system-design-primer', type: 'site' },
      { label: 'ByteByteGo (YouTube)', url: 'https://www.youtube.com/@ByteByteGo', type: 'video' },
      { label: 'Gaurav Sen (YouTube)', url: 'https://www.youtube.com/@gkcs', type: 'video' },
      { label: 'Grokking System Design (Educative)', url: 'https://www.educative.io/courses/grokking-modern-system-design-interview', type: 'site' },
    ],
    examTips: [
      'Always start with requirements clarification — never jump to design.',
      'Estimate scale before drawing: "10M users, 100 writes/sec" → what does that mean for DB choice?',
      'Know the numbers: disk read ~1ms, RAM ~100ns, network ~150ms intercontinental.',
      'Practice drawing diagrams on paper/whiteboard.',
    ],
  },
  {
    id: 'coa',
    name: 'Computer Organisation & Architecture',
    short: 'COA',
    emoji: '🔧',
    color: 'from-yellow-500 to-orange-500',
    border: 'border-yellow-500/30',
    glow: 'shadow-yellow-500/10',
    importance: 'Medium',
    whyItMatters: 'High weightage in GATE. Some system-level interviews ask about cache, pipelining, and instruction sets.',
    steps: [
      { title: 'Number Systems & Boolean Algebra', topics: ['Binary, octal, hex conversions', 'BCD, 2\'s complement, IEEE 754 float', 'Boolean laws, De Morgan\'s', 'SOP, POS, K-map simplification'] },
      { title: 'Combinational Circuits', topics: ['Half/full adder', 'Multiplexer, demultiplexer', 'Encoder, decoder', 'Comparator', 'Ripple carry vs CLA adder'] },
      { title: 'Sequential Circuits', topics: ['SR, JK, D, T flip-flops', 'Registers and shift registers', 'Counters (synchronous, asynchronous)', 'Finite state machines (Mealy vs Moore)'] },
      { title: 'CPU Organisation', topics: ['ALU, control unit, registers', 'Instruction cycle (fetch-decode-execute)', 'Addressing modes', 'Instruction formats (R, I, J type in MIPS)'] },
      { title: 'Pipelining', topics: ['5-stage pipeline (IF, ID, EX, MEM, WB)', 'Data hazards, control hazards', 'Stalls and forwarding', 'Pipeline performance calculation'], tip: 'GATE numericals on speedup and efficiency.' },
      { title: 'Memory Hierarchy', topics: ['Cache organisation (direct mapped, set associative, fully associative)', 'Hit/miss ratio, AMAT calculation', 'Write policy (write-through, write-back)', 'Virtual memory + TLB'] },
      { title: 'I/O & Buses', topics: ['Polling vs interrupt-driven vs DMA', 'Bus arbitration', 'Memory-mapped I/O vs port-mapped I/O'] },
    ],
    resources: [
      { label: 'Patterson & Hennessy CORG (textbook)', url: 'https://www.elsevier.com/books/computer-organization-and-design-mips-edition/patterson/978-0-12-820331-6', type: 'book' },
      { label: 'Gate Smashers COA (YouTube)', url: 'https://www.youtube.com/playlist?list=PLxCzCOWd7aiHMonh3G6QNKq53C6oNXGrX', type: 'video' },
      { label: 'GeeksforGeeks COA', url: 'https://www.geeksforgeeks.org/computer-organization-and-architecture-tutorials/', type: 'site' },
    ],
    examTips: [
      'K-map: minimise expressions up to 4 variables confidently.',
      'Cache AMAT: AMAT = Hit time + Miss rate × Miss penalty.',
      'Pipeline speedup = n / (1 + stall cycles per instruction).',
      'Addressing modes: know direct, indirect, immediate, register, indexed.',
    ],
  },
  {
    id: 'dm',
    name: 'Discrete Mathematics',
    short: 'Discrete Math',
    emoji: '∑',
    color: 'from-indigo-500 to-violet-500',
    border: 'border-indigo-500/30',
    glow: 'shadow-indigo-500/10',
    importance: 'Medium',
    whyItMatters: 'Foundation of computer science. Directly tested in GATE. Graph theory feeds directly into algorithms.',
    steps: [
      { title: 'Logic & Proofs', topics: ['Propositional logic (connectives, truth tables)', 'Predicate logic (∀, ∃)', 'Rules of inference', 'Proof techniques (direct, contradiction, induction)'] },
      { title: 'Sets, Relations & Functions', topics: ['Set operations, power sets, Cartesian product', 'Relations (reflexive, symmetric, transitive, equivalence)', 'Partial orders, Hasse diagrams', 'Functions (injective, surjective, bijective)', 'Pigeonhole principle'] },
      { title: 'Combinatorics', topics: ['Permutations & combinations', 'Inclusion-exclusion principle', 'Generating functions basics', 'Recurrence relations', 'Binomial theorem'], tip: '10+ numerical questions from P&C for GATE.' },
      { title: 'Graph Theory', topics: ['Graph types (directed, undirected, weighted)', 'Paths, cycles, connectivity', 'Trees and spanning trees', 'Eulerian and Hamiltonian paths', 'Graph colouring', 'Planar graphs'] },
      { title: 'Number Theory', topics: ['Divisibility, GCD (Euclidean algorithm)', 'Modular arithmetic', 'Fermat\'s & Euler\'s theorem', 'RSA basics (why primes matter)'] },
      { title: 'Automata & Formal Languages', topics: ['DFA, NFA (and NFA→DFA conversion)', 'Regular expressions', 'Context-free grammars, PDAs', 'Turing machines (basics)', 'Chomsky hierarchy'] },
    ],
    resources: [
      { label: 'Rosen Discrete Mathematics (textbook)', url: 'https://www.mheducation.com/highered/product/discrete-mathematics-its-applications-rosen/M9780073383095.html', type: 'book' },
      { label: 'NPTEL Discrete Math (YouTube)', url: 'https://www.youtube.com/playlist?list=PLbMVogVj5nJRbGFqKs-GXgn6HQbqBhOmH', type: 'video' },
      { label: 'Gate Smashers TOC (YouTube)', url: 'https://www.youtube.com/playlist?list=PLxCzCOWd7aiFM9Lj5G9G_76adtytsV_zk', type: 'video' },
    ],
    examTips: [
      'GATE: combinatorics + graph theory + TOC = highest weightage.',
      'Practice NFA to DFA conversion with 5 examples.',
      'Recurrence relations: master Master Theorem.',
      'Equivalence relations vs partial order — know the difference by examples.',
    ],
  },
]

// ─── Component ────────────────────────────────────────────────────────────────

const IMPORTANCE_COLOR = {
  Critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  High: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  Medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
}

export default function SubjectsPage() {
  const [open, setOpen] = useState<string | null>('dsa')
  const [filter, setFilter] = useState<'All' | 'Critical' | 'High' | 'Medium'>('All')

  const visible = filter === 'All' ? SUBJECTS : SUBJECTS.filter((s) => s.importance === filter)

  return (
    <div className="min-h-screen page-bg text-white">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4 flex items-center gap-3">
        <a href="/dashboard" className="text-white/40 hover:text-white text-sm transition-colors flex items-center gap-1">
          <ArrowLeft size={14} /> Dashboard
        </a>
        <span className="text-white/20">/</span>
        <span className="font-heading font-semibold">CSE Core Subjects</span>
      </div>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        {/* Hero */}
        <div className="text-center space-y-3 pb-2">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5">
            <BookOpen size={13} className="text-violet-400" />
            <span className="text-white/50 text-xs tracking-widest uppercase">8 Core Subjects · Complete Learning Paths</span>
          </div>
          <h1 className="font-heading text-4xl font-bold text-white">CSE Subjects Roadmap</h1>
          <p className="text-white/40 font-body max-w-lg mx-auto">
            Structured learning paths for every core CSE subject — what to study, in what order, and the best free resources.
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2 flex-wrap justify-center">
          {(['All', 'Critical', 'High', 'Medium'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs px-4 py-1.5 rounded-full border transition-all ${
                filter === f
                  ? 'bg-violet-600 border-violet-500 text-white'
                  : 'bg-white/3 border-white/10 text-white/50 hover:border-white/30'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Subject Accordions */}
        <div className="space-y-3">
          {visible.map((subject) => (
            <motion.div
              key={subject.id}
              layout
              className={`border rounded-2xl overflow-hidden ${subject.border} bg-white/3`}
            >
              {/* Header */}
              <button
                onClick={() => setOpen(open === subject.id ? null : subject.id)}
                className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-white/3 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{subject.emoji}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-heading font-bold text-white text-base">{subject.name}</h2>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${IMPORTANCE_COLOR[subject.importance]}`}>
                        {subject.importance}
                      </span>
                    </div>
                    <p className="text-white/40 text-xs font-body mt-0.5 hidden sm:block">{subject.whyItMatters}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className="text-white/30 text-xs hidden sm:block">{subject.steps.length} steps</span>
                  {open === subject.id ? <ChevronUp size={16} className="text-white/40" /> : <ChevronDown size={16} className="text-white/40" />}
                </div>
              </button>

              {/* Body */}
              <AnimatePresence>
                {open === subject.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-6 space-y-6 border-t border-white/8 pt-5">

                      {/* Why it matters (mobile) */}
                      <p className="text-white/50 text-sm font-body sm:hidden">{subject.whyItMatters}</p>

                      {/* Learning Path */}
                      <div>
                        <h3 className="font-heading text-xs text-white/40 uppercase tracking-widest mb-4">Learning Path</h3>
                        <div className="relative">
                          {/* Vertical line */}
                          <div className="absolute left-4 top-5 bottom-5 w-px bg-white/10" />
                          <div className="space-y-4">
                            {subject.steps.map((step, i) => (
                              <div key={i} className="flex gap-4 relative">
                                {/* Step number bubble */}
                                <div className={`relative z-10 w-8 h-8 rounded-full bg-gradient-to-br ${subject.color} flex items-center justify-center shrink-0 mt-0.5`}>
                                  <span className="text-white font-heading font-bold text-xs">{i + 1}</span>
                                </div>
                                <div className="bg-white/3 border border-white/8 rounded-xl p-4 flex-1">
                                  <h4 className="font-heading font-semibold text-white/90 text-sm mb-2">{step.title}</h4>
                                  <div className="flex flex-wrap gap-1.5">
                                    {step.topics.map((t) => (
                                      <span key={t} className="text-xs bg-white/5 text-white/50 border border-white/8 px-2 py-0.5 rounded-full font-body">
                                        {t}
                                      </span>
                                    ))}
                                  </div>
                                  {step.tip && (
                                    <p className="mt-2 text-xs text-yellow-400/80 font-body flex items-start gap-1">
                                      <span className="shrink-0">💡</span> {step.tip}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Two-column: Resources + Exam Tips */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        {/* Resources */}
                        <div>
                          <h3 className="font-heading text-xs text-white/40 uppercase tracking-widest mb-3">Free Resources</h3>
                          <div className="space-y-2">
                            {subject.resources.map((r) => (
                              <a
                                key={r.label}
                                href={r.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2.5 bg-white/3 border border-white/8 rounded-xl px-3 py-2.5 hover:border-white/20 hover:bg-white/5 transition-colors group"
                              >
                                <span className="text-base">
                                  {r.type === 'video' ? '▶️' : r.type === 'book' ? '📚' : '🔗'}
                                </span>
                                <span className="text-white/70 text-xs font-body flex-1 group-hover:text-white transition-colors">{r.label}</span>
                                <ExternalLink size={11} className="text-white/20 group-hover:text-white/50 shrink-0" />
                              </a>
                            ))}
                          </div>
                        </div>

                        {/* Exam Tips */}
                        <div>
                          <h3 className="font-heading text-xs text-white/40 uppercase tracking-widest mb-3">Exam / Interview Tips</h3>
                          <div className="space-y-2">
                            {subject.examTips.map((tip, i) => (
                              <div key={i} className="flex gap-2.5 bg-white/3 border border-white/8 rounded-xl px-3 py-2.5">
                                <span className="text-violet-400 font-heading font-bold text-xs shrink-0 mt-0.5">{i + 1}.</span>
                                <p className="text-white/60 text-xs font-body leading-relaxed">{tip}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* Footer note */}
        <p className="text-center text-white/20 text-xs font-body pb-4">
          All resources linked are free. Textbook PDFs are available via your college library or Z-Library.
        </p>

      </main>
    </div>
  )
}
