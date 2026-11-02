/**
 * data.ts — Deterministic content engine for PathForge's serverless backend.
 *
 * Ported from the (now retired) Python FastAPI backend's ai_fallback.py, cgpa.py
 * and score.py. These curated datasets power Role Compass, the 16-week roadmap,
 * CGPA cutoffs and the readiness score without any external AI/backend dependency.
 */

// ─── Role Compass ─────────────────────────────────────────────────────────────

export const COMPASS_QUESTIONS = [
  'Do you enjoy solving algorithmic puzzles and coding challenges?',
  'Are you more drawn to building things or analysing data?',
  'Do you prefer working with large codebases or running experiments?',
  'How comfortable are you with mathematics and statistics?',
  'Do you enjoy systems thinking — designing how things scale?',
  'Would you rather ship a product feature or train a model?',
  'Are you interested in cloud infrastructure or automation?',
  'Do you enjoy communicating ideas to non-technical stakeholders?',
  'How important is fast iteration and shipping to you?',
  'What excites you more: optimising performance or discovering patterns in data?',
]

export interface CompassResult {
  role: string
  confidence: number
  reasoning: string
  alternatives: { role: string; fit: number }[]
  traits: string[]
}

/**
 * Pick a best-fit role from the user's free-text answers using keyword scoring.
 * Deterministic, transparent, and good enough to give recruiters a real result.
 */
export function scoreCompass(answers: string[]): CompassResult {
  const text = answers.join(' ').toLowerCase()
  const score: Record<string, number> = {
    SDE: 1, // slight default bias — most common CSE path
    'ML Engineer': 0,
    'Data Analyst': 0,
    DevOps: 0,
    'Product Manager': 0,
  }

  const kw: Record<string, string[]> = {
    SDE: ['code', 'coding', 'build', 'algorithm', 'backend', 'software', 'develop', 'app', 'system', 'ship', 'feature', 'performance'],
    'ML Engineer': ['ml', 'machine learning', 'model', 'ai', 'math', 'statistics', 'experiment', 'train', 'neural', 'deep learning', 'research'],
    'Data Analyst': ['data', 'analys', 'sql', 'visuali', 'pattern', 'insight', 'dashboard', 'business', 'metric', 'excel', 'tableau'],
    DevOps: ['cloud', 'infrastructure', 'automation', 'deploy', 'docker', 'kubernetes', 'pipeline', 'ci', 'scale', 'ops', 'linux'],
    'Product Manager': ['communicat', 'stakeholder', 'people', 'product', 'user', 'strategy', 'design', 'manage', 'roadmap', 'non-technical'],
  }

  for (const [role, words] of Object.entries(kw)) {
    for (const w of words) if (text.includes(w)) score[role] += 1
  }

  const ranked = Object.entries(score).sort((a, b) => b[1] - a[1])
  const [topRole, topScore] = ranked[0]
  const totalSignal = ranked.reduce((s, [, v]) => s + v, 0) || 1
  const confidence = Math.min(95, Math.max(58, Math.round((topScore / totalSignal) * 100) + 45))

  const reasoningByRole: Record<string, string> = {
    SDE: 'Your answers point to a builder who enjoys writing code, working through algorithms and shipping features — the core of a Software Development Engineer role.',
    'ML Engineer': 'You show strong interest in models, mathematics and experimentation, which maps closely to a Machine Learning Engineer track.',
    'Data Analyst': 'You gravitate towards data, patterns and turning numbers into business insight — the hallmark of a Data Analyst.',
    DevOps: 'Your interest in infrastructure, automation and scale aligns well with a DevOps / Platform Engineering path.',
    'Product Manager': 'You enjoy communication, user problems and shaping what gets built, which suits a Product Manager career.',
  }

  const traitsByRole: Record<string, string[]> = {
    SDE: ['problem solver', 'builder', 'logical thinker'],
    'ML Engineer': ['analytical', 'experiment-driven', 'math-oriented'],
    'Data Analyst': ['detail-oriented', 'insight-driven', 'communicator'],
    DevOps: ['systems thinker', 'automation-minded', 'reliability-focused'],
    'Product Manager': ['empathetic', 'strategic', 'communicator'],
  }

  const alternatives = ranked
    .slice(1, 3)
    .map(([role, v]) => ({ role, fit: Math.min(85, Math.max(35, Math.round((v / totalSignal) * 100) + 30)) }))

  return {
    role: topRole,
    confidence,
    reasoning: reasoningByRole[topRole],
    alternatives,
    traits: traitsByRole[topRole],
  }
}

// ─── Roadmap templates ────────────────────────────────────────────────────────

interface Task {
  title: string
  type: string
  resource_link: string | null
  estimated_hours: number
  description: string
}
interface Week {
  week: number
  theme: string
  focus: string
  tasks: Task[]
}
export interface Roadmap {
  weeks: Week[]
}

const t = (title: string, type: string, resource_link: string | null, estimated_hours: number, description: string): Task => ({
  title, type, resource_link, estimated_hours, description,
})
const w = (week: number, theme: string, focus: string, tasks: Task[]): Week => ({ week, theme, focus, tasks })

const ROADMAP_SDE: Roadmap = { weeks: [
  w(1, 'DSA Foundations', 'Arrays, strings, complexity analysis', [
    t('Arrays & Strings — Striver A2Z', 'dsa', 'https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2/', 3, 'Solve first 30 array problems'),
    t('Big-O Notation — CS Dojo', 'course', 'https://youtu.be/D6xkbGLQesk', 1.5, 'Understand time/space complexity'),
    t('Setup LeetCode account + solve 5 easy', 'dsa', 'https://leetcode.com/problemset/', 2, 'Warm up on easy problems'),
  ]),
  w(2, 'Sorting & Searching', 'Merge sort, binary search, two pointers', [
    t('Sorting algorithms — Striver', 'dsa', 'https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2/', 3, 'Bubble, merge, quick sort'),
    t('Binary Search problems (20)', 'dsa', 'https://leetcode.com/tag/binary-search/', 3, 'Template-based binary search'),
    t('Two-pointer & sliding window', 'dsa', 'https://leetcode.com/tag/two-pointers/', 2, 'Solve 10 problems each pattern'),
  ]),
  w(3, 'Linked Lists', 'Singly, doubly, classic problems', [
    t('Linked List — Striver Sheet', 'dsa', 'https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2/', 4, 'All LL problems on sheet'),
    t('LeetCode LL problems (15)', 'dsa', 'https://leetcode.com/tag/linked-list/', 3, 'Reverse, cycle, merge'),
  ]),
  w(4, 'Stacks & Queues', 'Monotonic stack, BFS queue, deque', [
    t('Stacks & Queues — Striver', 'dsa', 'https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2/', 3, 'All stack/queue problems'),
    t('Monotonic stack problems (10)', 'dsa', 'https://leetcode.com/tag/monotonic-stack/', 2, 'Next greater element pattern'),
  ]),
  w(5, 'Trees — Basics', 'Binary tree traversals, construction', [
    t('Tree traversals & construction', 'dsa', 'https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2/', 4, 'Inorder, preorder, postorder'),
    t('BST problems (15)', 'dsa', 'https://leetcode.com/tag/binary-search-tree/', 3, 'Search, insert, validate BST'),
  ]),
  w(6, 'Trees — Advanced', 'Heaps, tries, segment trees', [
    t('Heaps & Priority Queue', 'dsa', 'https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2/', 3, 'Top K, merge K sorted lists'),
    t('Tries — implement & use', 'dsa', 'https://leetcode.com/tag/trie/', 2, 'Word search, prefix problems'),
  ]),
  w(7, 'Graphs', 'BFS, DFS, topological sort', [
    t('Graph BFS & DFS — Striver', 'dsa', 'https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2/', 4, 'All graph traversal problems'),
    t('Shortest path algorithms', 'dsa', 'https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2/', 3, 'Dijkstra, Bellman-Ford'),
  ]),
  w(8, 'Dynamic Programming I', '1D DP: fibonacci, climbing stairs, house robber', [
    t('1D DP problems — Striver', 'dsa', 'https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2/', 4, 'Memoization & tabulation'),
    t('DP on strings (LCS, edit distance)', 'dsa', 'https://leetcode.com/tag/dynamic-programming/', 3, 'Classic string DP'),
  ]),
  w(9, 'Dynamic Programming II', '2D DP, knapsack, interval DP', [
    t('Knapsack variants', 'dsa', 'https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2/', 3, '0/1, unbounded, subset sum'),
    t('Grid DP problems (10)', 'dsa', 'https://leetcode.com/tag/dynamic-programming/', 3, 'Unique paths, triangle'),
  ]),
  w(10, 'OS + DBMS Concepts', 'Core CS fundamentals for interviews', [
    t('OS — InterviewBit notes', 'course', 'https://www.interviewbit.com/operating-system-interview-questions/', 2, 'Processes, threads, deadlock'),
    t('DBMS — SQL + indexing', 'course', 'https://www.interviewbit.com/dbms-interview-questions/', 2, 'Joins, transactions, normalization'),
    t('SQL on HackerRank (20 queries)', 'dsa', 'https://www.hackerrank.com/domains/sql', 2, 'Practise real SQL queries'),
  ]),
  w(11, 'System Design Intro', 'HLD fundamentals: load balancers, caching, DBs', [
    t('Gaurav Sen System Design playlist', 'course', 'https://www.youtube.com/playlist?list=PLMCXHnjXnTnvo6alSjVkgxV-VH6EPyvoX', 4, 'Watch first 10 videos'),
    t('Design URL shortener', 'project', null, 3, 'Classic HLD problem'),
  ]),
  w(12, 'Project Sprint', 'Build a full-stack project for your portfolio', [
    t('Plan & scaffold your showcase project', 'project', null, 6, 'Choose CRUD app or API project'),
    t('Push to GitHub with README', 'project', null, 2, 'Clean commits, good README'),
  ]),
  w(13, 'Mock Interviews I', 'Company-style LeetCode + behavioural', [
    t('LeetCode mock interview (2 sessions)', 'mock', 'https://leetcode.com/assessment/', 4, 'Timed 45-min sessions'),
    t('STAR method behavioural prep', 'mock', null, 2, 'Prepare 5 STAR stories'),
  ]),
  w(14, 'Aptitude + Resume', 'Quant, logical reasoning, resume polish', [
    t('IndiaBix aptitude practice', 'aptitude', 'https://www.indiabix.com/aptitude/questions-and-answers/', 3, '50 quant + 50 logical'),
    t('Resume — one page, ATS-friendly', 'revision', null, 2, 'Use LaTeX or Overleaf template'),
  ]),
  w(15, 'Company Prep', 'Target company patterns and past questions', [
    t('GeeksForGeeks company-wise questions', 'dsa', 'https://www.geeksforgeeks.org/company-preparation/', 4, 'Top 50 for your target companies'),
    t('LLD — design parking lot / elevator', 'mock', 'https://github.com/prasadgujar/low-level-design-primer', 3, 'Object-oriented design'),
  ]),
  w(16, 'Final Sprint', 'Full mock, weak topic revision, confidence', [
    t('Full mock interview (Pramp / Interviewing.io)', 'mock', 'https://www.pramp.com/', 3, 'Real peer mock'),
    t('Revise top 50 LeetCode patterns', 'revision', 'https://seanprashad.com/leetcode-patterns/', 4, 'Quick revision pass'),
    t('Profile links: GitHub, LinkedIn ready', 'revision', null, 1, 'Polish online presence'),
  ]),
]}

const ROADMAP_ML: Roadmap = { weeks: [
  w(1, 'Python & Math Refresh', 'NumPy, Pandas, linear algebra basics', [
    t('Python for ML — Kaggle course', 'course', 'https://www.kaggle.com/learn/python', 3, 'Free, fast Python refresher'),
    t('NumPy & Pandas essentials', 'course', 'https://www.kaggle.com/learn/pandas', 3, 'Data manipulation fundamentals'),
  ]),
  w(2, 'ML Fundamentals', 'Supervised learning, regression, classification', [
    t('Andrew Ng ML Specialization — Week 1-2', 'course', 'https://www.coursera.org/specializations/machine-learning-introduction', 5, 'Linear & logistic regression'),
    t('Kaggle Intro to ML', 'course', 'https://www.kaggle.com/learn/intro-to-machine-learning', 2, 'Hands-on exercises'),
  ]),
  w(3, 'Sklearn & Feature Eng', 'Preprocessing, pipelines, feature selection', [
    t('Sklearn documentation walkthrough', 'course', 'https://scikit-learn.org/stable/tutorial/index.html', 3, 'Fit/predict, cross-validation'),
    t('Feature Engineering — Kaggle', 'course', 'https://www.kaggle.com/learn/feature-engineering', 3, 'Imputation, encoding, scaling'),
  ]),
  w(4, 'Trees & Ensembles', 'Decision trees, random forest, XGBoost', [
    t('Tree-based models — StatQuest', 'course', 'https://www.youtube.com/playlist?list=PLblh5JKOoLUICTaGLRoHQDuF_7q2GfuJF', 4, 'Random Forest, XGBoost explained'),
    t('Titanic Kaggle competition', 'project', 'https://www.kaggle.com/c/titanic', 4, 'First end-to-end ML project'),
  ]),
  w(5, 'Deep Learning Intro', 'Neural networks, backprop, PyTorch basics', [
    t('fast.ai Practical Deep Learning', 'course', 'https://course.fast.ai/', 5, 'Top-down practical DL'),
    t('PyTorch 60-minute blitz', 'course', 'https://pytorch.org/tutorials/beginner/deep_learning_60min_blitz.html', 3, 'Tensors, autograd, training loop'),
  ]),
  w(6, 'CNNs — Computer Vision', 'Image classification, transfer learning', [
    t('CNN architecture — CS231n notes', 'course', 'https://cs231n.github.io/', 4, 'ConvNet intuition'),
    t('Image classification project (CIFAR-10)', 'project', 'https://www.kaggle.com/c/cifar-10', 4, 'Apply CNNs hands-on'),
  ]),
  w(7, 'NLP Basics', 'Text preprocessing, embeddings, transformers intro', [
    t('HuggingFace NLP course', 'course', 'https://huggingface.co/learn/nlp-course', 5, 'Tokenization, BERT, fine-tuning'),
    t('Sentiment analysis mini-project', 'project', null, 4, 'Fine-tune small transformer'),
  ]),
  w(8, 'MLOps Basics', 'Experiments, versioning, model serving', [
    t('MLflow experiment tracking', 'course', 'https://mlflow.org/docs/latest/tutorials-and-examples/index.html', 3, 'Track runs and metrics'),
    t('Deploy model as FastAPI endpoint', 'project', null, 4, 'Wrap model in REST API'),
  ]),
  w(9, 'DSA for ML Interviews', 'Core coding problems needed for ML roles', [
    t('LeetCode Medium — Arrays & Strings (30)', 'dsa', 'https://leetcode.com/problemset/', 5, 'ML roles still test DSA'),
    t('Matrix problems (10)', 'dsa', 'https://leetcode.com/tag/matrix/', 3, 'Rotate, spiral, search 2D'),
  ]),
  w(10, 'Statistics & Probability', 'Distributions, hypothesis testing, A/B testing', [
    t('StatQuest Statistics playlist', 'course', 'https://www.youtube.com/playlist?list=PLblh5JKOoLUK0FLuzwntyYI10UQFUhsY9', 4, 'p-values, distributions'),
    t('A/B testing fundamentals', 'course', 'https://www.udacity.com/course/ab-testing--ud257', 2, 'Experiment design basics'),
  ]),
  w(11, 'Capstone Project', 'End-to-end ML project from data to deployment', [
    t('Choose Kaggle competition + baseline', 'project', 'https://www.kaggle.com/competitions', 5, 'Pick an active competition'),
    t('EDA + feature engineering + model', 'project', null, 8, 'Full pipeline, track with MLflow'),
  ]),
  w(12, 'System Design for ML', 'Recommendation systems, model serving at scale', [
    t('ML system design — Chip Huyen', 'course', 'https://huyenchip.com/machine-learning-systems-design/toc.html', 4, 'Free online book'),
    t('Design a recommendation system', 'mock', null, 3, 'Common ML system design question'),
  ]),
  w(13, 'ML Interview Prep', 'Theory questions, coding, case studies', [
    t('ML interview questions — GitHub repo', 'revision', 'https://github.com/andrewekhalel/MLQuestions', 4, 'Top 100 ML Q&A'),
    t('Mock ML interview (peer)', 'mock', null, 3, 'Practice explaining models'),
  ]),
  w(14, 'Resume & Portfolio', 'ML projects on GitHub, Kaggle ranking', [
    t('Publish capstone project on GitHub', 'project', null, 3, 'Clean code, clear README, demo'),
    t('Kaggle profile: earn bronze medal', 'project', 'https://www.kaggle.com/', 4, 'Consistent top-50% finish'),
  ]),
  w(15, 'Company-Specific Prep', 'Amazon SDE/ML, Google, research roles', [
    t('Company ML engineering blog posts', 'revision', null, 3, 'Read engineering blogs of targets'),
    t('LeetCode company tag problems (30)', 'dsa', 'https://leetcode.com/problemset/', 4, 'Target company filtered'),
  ]),
  w(16, 'Final Mock + Confidence', 'Timed sessions, behavioural, polish', [
    t('Timed ML + coding mock interview', 'mock', null, 4, '45 min coding + 30 min ML theory'),
    t('Prepare 5 STAR behavioural answers', 'revision', null, 2, 'Projects, failures, learnings'),
  ]),
]}

const ROADMAP_DA: Roadmap = { weeks: [
  w(1, 'SQL Foundations', 'SELECT, JOIN, GROUP BY, subqueries', [
    t('Mode Analytics SQL Tutorial', 'course', 'https://mode.com/sql-tutorial/', 3, 'Best free interactive SQL course'),
    t('HackerRank SQL (30 problems)', 'dsa', 'https://www.hackerrank.com/domains/sql', 3, 'Basic to intermediate SQL'),
  ]),
  w(2, 'Advanced SQL', 'Window functions, CTEs, query optimisation', [
    t('Window functions — Mode Analytics', 'course', 'https://mode.com/sql-tutorial/sql-window-functions/', 3, 'ROW_NUMBER, RANK, LAG, LEAD'),
    t('LeetCode SQL (20 medium)', 'dsa', 'https://leetcode.com/problemset/database/', 3, 'Interview-style SQL'),
  ]),
  w(3, 'Python for DA', 'Pandas, NumPy, data cleaning', [
    t('Kaggle Pandas course', 'course', 'https://www.kaggle.com/learn/pandas', 3, 'Hands-on data manipulation'),
    t('Real-world dataset cleaning exercise', 'project', 'https://www.kaggle.com/datasets', 4, 'Clean a messy Kaggle dataset'),
  ]),
  w(4, 'Data Visualisation', 'Matplotlib, Seaborn, storytelling with data', [
    t('Seaborn tutorial', 'course', 'https://seaborn.pydata.org/tutorial.html', 2, 'Statistical visualisation'),
    t('Storytelling with Data — blog', 'course', 'https://www.storytellingwithdata.com/blog', 2, 'Chart choice, clutter reduction'),
    t('EDA project on dataset of choice', 'project', null, 4, '10-chart EDA notebook on Kaggle'),
  ]),
  w(5, 'Statistics Essentials', 'Descriptive stats, hypothesis testing', [
    t('StatQuest Statistics series', 'course', 'https://www.youtube.com/playlist?list=PLblh5JKOoLUK0FLuzwntyYI10UQFUhsY9', 4, 'Mean, variance, distributions'),
    t('A/B testing case study', 'project', null, 3, 'Analyse a marketing experiment'),
  ]),
  w(6, 'Tableau / Power BI', 'Dashboard design for business stakeholders', [
    t('Tableau Public free training', 'course', 'https://www.tableau.com/learn/training', 4, 'Build 3 dashboards'),
    t('Build Superstore sales dashboard', 'project', null, 3, 'Classic Tableau project'),
  ]),
  w(7, 'Excel & Business Analysis', 'Pivot tables, VLOOKUP, business KPIs', [
    t('Excel for Data Analytics — YouTube', 'course', 'https://www.youtube.com/watch?v=Vl0H-qTclOg', 3, 'Pivot, VLOOKUP, INDEX/MATCH'),
    t('Product metrics case study', 'project', null, 3, 'Define KPIs for a product'),
  ]),
  w(8, 'Intro to ML for DA', 'Regression, clustering for business insights', [
    t('Kaggle Intro to ML', 'course', 'https://www.kaggle.com/learn/intro-to-machine-learning', 3, 'Decision trees, validation'),
    t('Customer segmentation (KMeans)', 'project', null, 4, 'Unsupervised clustering project'),
  ]),
  w(9, 'Case Study Practice', 'Google/Amazon-style analytics interviews', [
    t('DataLemur — top 50 SQL', 'revision', 'https://datalemur.com/', 3, 'SQL interview questions'),
    t('Product analytics case: user drop-off', 'mock', null, 3, 'Root cause analysis exercise'),
  ]),
  w(10, 'Capstone Project', 'End-to-end analysis with business insight', [
    t('Pick domain dataset (fintech/health)', 'project', 'https://www.kaggle.com/datasets', 2, 'Choose meaningful data'),
    t('SQL + Python + Tableau full analysis', 'project', null, 8, 'Full notebook + dashboard'),
  ]),
  w(11, 'Resume & Portfolio', 'Data projects on GitHub, Tableau Public', [
    t('Publish capstone on GitHub', 'project', null, 3, 'Jupyter notebook with insights'),
    t('Tableau Public: 3 dashboards', 'project', 'https://public.tableau.com/', 2, 'Portfolio for interviews'),
  ]),
  w(12, 'Company Research', "Target companies' data stack and format", [
    t('Research Flipkart/Swiggy data team', 'revision', null, 2, 'Blog posts, job descriptions'),
    t('SQL + stats mock interview (peer)', 'mock', null, 3, 'Practice explaining analysis'),
  ]),
  w(13, 'Interview Theory', 'Statistics, probability, estimation questions', [
    t('50 DA interview questions — Glassdoor', 'revision', 'https://www.glassdoor.com/Interview/data-analyst-interview-questions-SRCH_KO0,12.htm', 3, 'Theory + SQL mix'),
    t('Fermi estimation practice (10 q)', 'aptitude', null, 2, 'Back-of-envelope estimation'),
  ]),
  w(14, 'Aptitude + Resume Polish', 'Placement aptitude + one-page resume', [
    t('IndiaBix quant + logical (100 q)', 'aptitude', 'https://www.indiabix.com/', 3, 'Campus placement aptitude'),
    t('Final resume review', 'revision', null, 2, 'ATS-friendly, metrics in bullets'),
  ]),
  w(15, 'Mock Interviews', 'Full data analytics interview simulation', [
    t('2 timed mock DA interviews', 'mock', 'https://www.pramp.com/', 4, 'SQL + case + stats in 45 min'),
    t('Behavioural: projects, impact, metrics', 'revision', null, 2, 'STAR format with numbers'),
  ]),
  w(16, 'Final Sprint', 'Weak area revision and confidence building', [
    t('Revise top 30 SQL patterns', 'revision', null, 3, 'Window functions, CTEs'),
    t('Review all projects and key findings', 'revision', null, 2, 'Be ready to walk through your work'),
  ]),
]}

const ROADMAPS: Record<string, Roadmap> = {
  SDE: ROADMAP_SDE,
  'ML Engineer': ROADMAP_ML,
  'Data Analyst': ROADMAP_DA,
  DevOps: ROADMAP_SDE,
  'Product Manager': ROADMAP_DA,
}

export function getRoadmap(role: string): Roadmap {
  return ROADMAPS[role] ?? ROADMAP_SDE
}

// ─── CGPA ─────────────────────────────────────────────────────────────────────

export const GRADE_POINTS: Record<string, number> = {
  O: 10, 'A+': 9, A: 8, 'B+': 7, B: 6, C: 5, P: 4, F: 0,
}

export const CUTOFFS: Record<string, number> = {
  Google: 7.5, Microsoft: 7.0, Amazon: 6.0, Flipkart: 6.5, Infosys: 6.0,
  TCS: 6.0, Wipro: 6.0, Cognizant: 6.5, HCL: 6.0, Accenture: 6.5,
  Capgemini: 6.0, IBM: 6.5, Zoho: 7.0, Freshworks: 7.0, Swiggy: 7.0,
  PhonePe: 7.5, Paytm: 6.5, Ola: 7.0,
}

// ─── Readiness score weights ──────────────────────────────────────────────────

export const ROLE_WEIGHTS: Record<string, Record<string, number>> = {
  SDE: { dsa: 0.35, cgpa: 0.2, courses: 0.2, projects: 0.15, aptitude: 0.1 },
  'ML Engineer': { dsa: 0.2, cgpa: 0.2, courses: 0.3, projects: 0.2, aptitude: 0.1 },
  'Data Analyst': { dsa: 0.15, cgpa: 0.2, courses: 0.25, projects: 0.25, aptitude: 0.15 },
  DevOps: { dsa: 0.2, cgpa: 0.15, courses: 0.3, projects: 0.25, aptitude: 0.1 },
  'Product Manager': { dsa: 0.1, cgpa: 0.2, courses: 0.25, projects: 0.25, aptitude: 0.2 },
  default: { dsa: 0.3, cgpa: 0.2, courses: 0.2, projects: 0.15, aptitude: 0.15 },
}

// ─── Demo courses (seed) ──────────────────────────────────────────────────────

export const DEMO_COURSES = [
  { name: "Striver's A2Z DSA Course", url: 'https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2/', platform: 'Other', total_sections: 20, completed_sections: 7, velocity: 0.8 },
  { name: 'The Complete React Developer (Udemy)', url: 'https://www.udemy.com/course/complete-react-developer-zero-to-mastery/', platform: 'Udemy', total_sections: 30, completed_sections: 12, velocity: 1.2 },
  { name: 'Andrew Ng Machine Learning Specialization', url: 'https://www.coursera.org/specializations/machine-learning-introduction', platform: 'Coursera', total_sections: 24, completed_sections: 4, velocity: 0.4 },
]

// ─── Curated recommendations (replaces the Qdrant RAG recommender) ────────────

interface Recommendation { title: string; platform: string; url: string; why: string }

const RECS: Record<string, Record<string, Recommendation[]>> = {
  SDE: {
    default: [
      { title: 'Striver A2Z DSA Sheet', platform: 'takeuforward', url: 'https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2/', why: 'The most complete free DSA roadmap for placements.' },
      { title: 'NeetCode 150', platform: 'NeetCode', url: 'https://neetcode.io/practice', why: 'Curated must-do interview problems with video solutions.' },
      { title: 'System Design Primer', platform: 'GitHub', url: 'https://github.com/donnemartin/system-design-primer', why: 'Free, thorough intro to HLD for SDE interviews.' },
    ],
  },
  'ML Engineer': {
    default: [
      { title: 'Andrew Ng ML Specialization', platform: 'Coursera', url: 'https://www.coursera.org/specializations/machine-learning-introduction', why: 'The canonical starting point for ML fundamentals.' },
      { title: 'fast.ai Practical Deep Learning', platform: 'fast.ai', url: 'https://course.fast.ai/', why: 'Hands-on, top-down deep learning for builders.' },
      { title: 'HuggingFace NLP Course', platform: 'HuggingFace', url: 'https://huggingface.co/learn/nlp-course', why: 'Modern transformers and fine-tuning, free.' },
    ],
  },
  'Data Analyst': {
    default: [
      { title: 'Mode SQL Tutorial', platform: 'Mode', url: 'https://mode.com/sql-tutorial/', why: 'Best free interactive SQL course for analysts.' },
      { title: 'Kaggle Pandas', platform: 'Kaggle', url: 'https://www.kaggle.com/learn/pandas', why: 'Fast, practical data-wrangling skills.' },
      { title: 'Tableau Public Training', platform: 'Tableau', url: 'https://www.tableau.com/learn/training', why: 'Build a dashboard portfolio recruiters can see.' },
    ],
  },
}

export function getRecommendations(role: string, topic?: string): Recommendation[] {
  const roleRecs = RECS[role] ?? RECS['SDE']
  const list = roleRecs[topic ?? 'default'] ?? roleRecs['default']
  return list
}

export interface DSAProblemItem {
  id: string
  sheet_id: string
  title: string
  topic: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  lc_link: string
  order_index: number
}

export const STRIVER_PROBLEMS: DSAProblemItem[] = [
  // Arrays
  { id: 'p-1', sheet_id: 'sheet-striver', title: 'Two Sum', topic: 'Arrays', difficulty: 'Easy', lc_link: 'https://leetcode.com/problems/two-sum/', order_index: 1 },
  { id: 'p-2', sheet_id: 'sheet-striver', title: 'Best Time to Buy and Sell Stock', topic: 'Arrays', difficulty: 'Easy', lc_link: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/', order_index: 2 },
  { id: 'p-3', sheet_id: 'sheet-striver', title: 'Maximum Subarray (Kadane)', topic: 'Arrays', difficulty: 'Medium', lc_link: 'https://leetcode.com/problems/maximum-subarray/', order_index: 3 },
  { id: 'p-4', sheet_id: 'sheet-striver', title: 'Product of Array Except Self', topic: 'Arrays', difficulty: 'Medium', lc_link: 'https://leetcode.com/problems/product-of-array-except-self/', order_index: 4 },
  { id: 'p-5', sheet_id: 'sheet-striver', title: '3Sum', topic: 'Arrays', difficulty: 'Medium', lc_link: 'https://leetcode.com/problems/3sum/', order_index: 5 },
  { id: 'p-6', sheet_id: 'sheet-striver', title: 'Container With Most Water', topic: 'Arrays', difficulty: 'Medium', lc_link: 'https://leetcode.com/problems/container-with-most-water/', order_index: 6 },
  { id: 'p-7', sheet_id: 'sheet-striver', title: 'Trapping Rain Water', topic: 'Arrays', difficulty: 'Hard', lc_link: 'https://leetcode.com/problems/trapping-rain-water/', order_index: 7 },
  
  // Strings
  { id: 'p-8', sheet_id: 'sheet-striver', title: 'Valid Anagram', topic: 'Strings', difficulty: 'Easy', lc_link: 'https://leetcode.com/problems/valid-anagram/', order_index: 8 },
  { id: 'p-9', sheet_id: 'sheet-striver', title: 'Valid Palindrome', topic: 'Strings', difficulty: 'Easy', lc_link: 'https://leetcode.com/problems/valid-palindrome/', order_index: 9 },
  { id: 'p-10', sheet_id: 'sheet-striver', title: 'Longest Substring Without Repeating Characters', topic: 'Strings', difficulty: 'Medium', lc_link: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/', order_index: 10 },
  { id: 'p-11', sheet_id: 'sheet-striver', title: 'Group Anagrams', topic: 'Strings', difficulty: 'Medium', lc_link: 'https://leetcode.com/problems/group-anagrams/', order_index: 11 },
  { id: 'p-12', sheet_id: 'sheet-striver', title: 'Valid Parentheses', topic: 'Strings', difficulty: 'Easy', lc_link: 'https://leetcode.com/problems/valid-parentheses/', order_index: 12 },
  { id: 'p-13', sheet_id: 'sheet-striver', title: 'Minimum Window Substring', topic: 'Strings', difficulty: 'Hard', lc_link: 'https://leetcode.com/problems/minimum-window-substring/', order_index: 13 },

  // Linked List
  { id: 'p-14', sheet_id: 'sheet-striver', title: 'Reverse Linked List', topic: 'Linked List', difficulty: 'Easy', lc_link: 'https://leetcode.com/problems/reverse-linked-list/', order_index: 14 },
  { id: 'p-15', sheet_id: 'sheet-striver', title: 'Merge Two Sorted Lists', topic: 'Linked List', difficulty: 'Easy', lc_link: 'https://leetcode.com/problems/merge-two-sorted-lists/', order_index: 15 },
  { id: 'p-16', sheet_id: 'sheet-striver', title: 'Linked List Cycle', topic: 'Linked List', difficulty: 'Easy', lc_link: 'https://leetcode.com/problems/linked-list-cycle/', order_index: 16 },
  { id: 'p-17', sheet_id: 'sheet-striver', title: 'Remove Nth Node From End of List', topic: 'Linked List', difficulty: 'Medium', lc_link: 'https://leetcode.com/problems/remove-nth-node-from-end-of-list/', order_index: 17 },
  { id: 'p-18', sheet_id: 'sheet-striver', title: 'Add Two Numbers', topic: 'Linked List', difficulty: 'Medium', lc_link: 'https://leetcode.com/problems/add-two-numbers/', order_index: 18 },

  // Binary Search
  { id: 'p-19', sheet_id: 'sheet-striver', title: 'Binary Search', topic: 'Binary Search', difficulty: 'Easy', lc_link: 'https://leetcode.com/problems/binary-search/', order_index: 19 },
  { id: 'p-20', sheet_id: 'sheet-striver', title: 'Search in Rotated Sorted Array', topic: 'Binary Search', difficulty: 'Medium', lc_link: 'https://leetcode.com/problems/search-in-rotated-sorted-array/', order_index: 20 },
  { id: 'p-21', sheet_id: 'sheet-striver', title: 'Find Minimum in Rotated Sorted Array', topic: 'Binary Search', difficulty: 'Medium', lc_link: 'https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/', order_index: 21 },
  { id: 'p-22', sheet_id: 'sheet-striver', title: 'Koko Eating Bananas', topic: 'Binary Search', difficulty: 'Medium', lc_link: 'https://leetcode.com/problems/koko-eating-bananas/', order_index: 22 },

  // Trees
  { id: 'p-23', sheet_id: 'sheet-striver', title: 'Invert Binary Tree', topic: 'Trees', difficulty: 'Easy', lc_link: 'https://leetcode.com/problems/invert-binary-tree/', order_index: 23 },
  { id: 'p-24', sheet_id: 'sheet-striver', title: 'Maximum Depth of Binary Tree', topic: 'Trees', difficulty: 'Easy', lc_link: 'https://leetcode.com/problems/maximum-depth-of-binary-tree/', order_index: 24 },
  { id: 'p-25', sheet_id: 'sheet-striver', title: 'Validate Binary Search Tree', topic: 'Trees', difficulty: 'Medium', lc_link: 'https://leetcode.com/problems/validate-binary-search-tree/', order_index: 25 },
  { id: 'p-26', sheet_id: 'sheet-striver', title: 'Lowest Common Ancestor of a BST', topic: 'Trees', difficulty: 'Medium', lc_link: 'https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/', order_index: 26 },
  { id: 'p-27', sheet_id: 'sheet-striver', title: 'Binary Tree Level Order Traversal', topic: 'Trees', difficulty: 'Medium', lc_link: 'https://leetcode.com/problems/binary-tree-level-order-traversal/', order_index: 27 },

  // Graphs
  { id: 'p-28', sheet_id: 'sheet-striver', title: 'Number of Islands', topic: 'Graphs', difficulty: 'Medium', lc_link: 'https://leetcode.com/problems/number-of-islands/', order_index: 28 },
  { id: 'p-29', sheet_id: 'sheet-striver', title: 'Clone Graph', topic: 'Graphs', difficulty: 'Medium', lc_link: 'https://leetcode.com/problems/clone-graph/', order_index: 29 },
  { id: 'p-30', sheet_id: 'sheet-striver', title: 'Course Schedule (Topological Sort)', topic: 'Graphs', difficulty: 'Medium', lc_link: 'https://leetcode.com/problems/course-schedule/', order_index: 30 },
  { id: 'p-31', sheet_id: 'sheet-striver', title: 'Word Ladder', topic: 'Graphs', difficulty: 'Hard', lc_link: 'https://leetcode.com/problems/word-ladder/', order_index: 31 },

  // Dynamic Programming
  { id: 'p-32', sheet_id: 'sheet-striver', title: 'Climbing Stairs', topic: 'Dynamic Programming', difficulty: 'Easy', lc_link: 'https://leetcode.com/problems/climbing-stairs/', order_index: 32 },
  { id: 'p-33', sheet_id: 'sheet-striver', title: 'House Robber', topic: 'Dynamic Programming', difficulty: 'Medium', lc_link: 'https://leetcode.com/problems/house-robber/', order_index: 33 },
  { id: 'p-34', sheet_id: 'sheet-striver', title: 'Coin Change', topic: 'Dynamic Programming', difficulty: 'Medium', lc_link: 'https://leetcode.com/problems/coin-change/', order_index: 34 },
  { id: 'p-35', sheet_id: 'sheet-striver', title: 'Longest Increasing Subsequence', topic: 'Dynamic Programming', difficulty: 'Medium', lc_link: 'https://leetcode.com/problems/longest-increasing-subsequence/', order_index: 35 },
  { id: 'p-36', sheet_id: 'sheet-striver', title: '0/1 Knapsack Problem', topic: 'Dynamic Programming', difficulty: 'Medium', lc_link: 'https://leetcode.com/problems/partition-equal-subset-sum/', order_index: 36 },
]
