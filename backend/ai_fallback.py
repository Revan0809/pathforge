"""
ai_fallback.py — Resilient AI wrapper for PathForge.

Provides safe_ai_call() to wrap any AI/LLM call with automatic fallback.
All failures are logged but never surfaced as raw errors to users.
"""
import logging
from typing import Any, Callable, Tuple

logger = logging.getLogger("pathforge.ai")


def safe_ai_call(ai_fn: Callable, fallback_fn: Callable, *args, **kwargs) -> Tuple[Any, bool]:
    """
    Try ai_fn(*args, **kwargs).
    On any exception (timeout, quota, network, parse error), log it silently
    and call fallback_fn(*args, **kwargs) instead.
    Returns (result, fallback_used: bool).
    """
    try:
        return ai_fn(*args, **kwargs), False
    except Exception as exc:
        logger.error(
            "AI call failed [%s: %s] — activating fallback",
            type(exc).__name__, exc,
        )
        return fallback_fn(*args, **kwargs), True


# ─── Fallback: Role Compass ───────────────────────────────────────────────────

FALLBACK_COMPASS_QUESTIONS = [
    "Do you enjoy solving algorithmic puzzles and coding challenges?",
    "Are you more drawn to building things or analysing data?",
    "Do you prefer working with large codebases or running experiments?",
    "How comfortable are you with mathematics and statistics?",
    "Do you enjoy systems thinking — designing how things scale?",
    "Would you rather ship a product feature or train a model?",
    "Are you interested in cloud infrastructure or automation?",
    "Do you enjoy communicating ideas to non-technical stakeholders?",
    "How important is fast iteration and shipping to you?",
    "What excites you more: optimising performance or discovering patterns in data?",
]

FALLBACK_COMPASS_RESULT = {
    "done": True,
    "role": "SDE",
    "confidence": 70,
    "reasoning": (
        "Based on your profile as a CSE student, Software Development Engineering is the most "
        "common and well-supported path. You can refine this choice by retrying the compass "
        "when the AI engine is back online."
    ),
    "alternatives": [
        {"role": "ML Engineer", "fit": 60},
        {"role": "Data Analyst", "fit": 50},
    ],
    "traits": ["problem solver", "builder", "logical thinker"],
}


def fallback_compass_response(messages: list, turn: int) -> dict:
    """Return the next scripted question or final result based on turn count."""
    if turn >= 10:
        return {"done": True, "result": FALLBACK_COMPASS_RESULT, "message": "", "fallback_used": True}
    q = FALLBACK_COMPASS_QUESTIONS[min(turn, len(FALLBACK_COMPASS_QUESTIONS) - 1)]
    return {"done": False, "message": q, "turn": turn, "fallback_used": True}


# ─── Fallback: Roadmap Generator ─────────────────────────────────────────────

def _make_week(week: int, theme: str, focus: str, tasks: list) -> dict:
    return {"week": week, "theme": theme, "focus": focus, "tasks": tasks}


def _task(title: str, typ: str, link: str | None, hours: float, desc: str) -> dict:
    return {
        "title": title, "type": typ, "resource_link": link,
        "estimated_hours": hours, "description": desc,
    }


FALLBACK_ROADMAP_SDE = {"weeks": [
    _make_week(1,  "DSA Foundations",        "Arrays, strings, complexity analysis", [
        _task("Arrays & Strings — Striver A2Z",        "dsa",      "https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2/", 3, "Solve first 30 array problems"),
        _task("Big-O Notation — CS Dojo",              "course",   "https://youtu.be/D6xkbGLQesk", 1.5, "Understand time/space complexity"),
        _task("Setup LeetCode account + solve 5 easy", "dsa",      "https://leetcode.com/problemset/", 2, "Warm up on easy problems"),
    ]),
    _make_week(2,  "Sorting & Searching",    "Merge sort, binary search, two pointers", [
        _task("Sorting algorithms — Striver",          "dsa",      "https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2/", 3, "Bubble, merge, quick sort"),
        _task("Binary Search problems (20)",           "dsa",      "https://leetcode.com/tag/binary-search/", 3, "Template-based binary search"),
        _task("Two-pointer & sliding window",          "dsa",      "https://leetcode.com/tag/two-pointers/", 2, "Solve 10 problems each pattern"),
    ]),
    _make_week(3,  "Linked Lists",           "Singly, doubly, classic problems", [
        _task("Linked List — Striver Sheet",           "dsa",      "https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2/", 4, "All LL problems on sheet"),
        _task("LeetCode LL problems (15)",             "dsa",      "https://leetcode.com/tag/linked-list/", 3, "Reverse, cycle, merge"),
    ]),
    _make_week(4,  "Stacks & Queues",        "Monotonic stack, BFS queue, deque", [
        _task("Stacks & Queues — Striver",             "dsa",      "https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2/", 3, "All stack/queue problems"),
        _task("Monotonic stack problems (10)",         "dsa",      "https://leetcode.com/tag/monotonic-stack/", 2, "Next greater element pattern"),
    ]),
    _make_week(5,  "Trees — Basics",         "Binary tree traversals, construction", [
        _task("Tree traversals & construction",        "dsa",      "https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2/", 4, "Inorder, preorder, postorder"),
        _task("BST problems (15)",                     "dsa",      "https://leetcode.com/tag/binary-search-tree/", 3, "Search, insert, validate BST"),
    ]),
    _make_week(6,  "Trees — Advanced",       "Heaps, tries, segment trees", [
        _task("Heaps & Priority Queue",                "dsa",      "https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2/", 3, "Top K, merge K sorted lists"),
        _task("Tries — implement & use",               "dsa",      "https://leetcode.com/tag/trie/", 2, "Word search, prefix problems"),
    ]),
    _make_week(7,  "Graphs",                 "BFS, DFS, topological sort", [
        _task("Graph BFS & DFS — Striver",             "dsa",      "https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2/", 4, "All graph traversal problems"),
        _task("Shortest path algorithms",              "dsa",      "https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2/", 3, "Dijkstra, Bellman-Ford"),
    ]),
    _make_week(8,  "Dynamic Programming I",  "1D DP: fibonacci, climbing stairs, house robber", [
        _task("1D DP problems — Striver",              "dsa",      "https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2/", 4, "Memoization & tabulation"),
        _task("DP on strings (LCS, edit distance)",   "dsa",      "https://leetcode.com/tag/dynamic-programming/", 3, "Classic string DP"),
    ]),
    _make_week(9,  "Dynamic Programming II", "2D DP, knapsack, interval DP", [
        _task("Knapsack variants",                     "dsa",      "https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2/", 3, "0/1, unbounded, subset sum"),
        _task("Grid DP problems (10)",                 "dsa",      "https://leetcode.com/tag/dynamic-programming/", 3, "Unique paths, triangle"),
    ]),
    _make_week(10, "OS + DBMS Concepts",     "Core CS fundamentals for interviews", [
        _task("OS — InterviewBit notes",               "course",   "https://www.interviewbit.com/operating-system-interview-questions/", 2, "Processes, threads, deadlock"),
        _task("DBMS — SQL + indexing",                 "course",   "https://www.interviewbit.com/dbms-interview-questions/", 2, "Joins, transactions, normalization"),
        _task("SQL on HackerRank (20 queries)",        "dsa",      "https://www.hackerrank.com/domains/sql", 2, "Practise real SQL queries"),
    ]),
    _make_week(11, "System Design Intro",    "HLD fundamentals: load balancers, caching, DBs", [
        _task("Gaurav Sen System Design playlist",     "course",   "https://www.youtube.com/playlist?list=PLMCXHnjXnTnvo6alSjVkgxV-VH6EPyvoX", 4, "Watch first 10 videos"),
        _task("Design URL shortener",                  "project",  None, 3, "Classic HLD problem"),
    ]),
    _make_week(12, "Project Sprint",         "Build a full-stack project for your portfolio", [
        _task("Plan & scaffold your showcase project", "project",  None, 6, "Choose CRUD app or API project"),
        _task("Push to GitHub with README",            "project",  None, 2, "Clean commits, good README"),
    ]),
    _make_week(13, "Mock Interviews I",      "Company-style LeetCode + behavioural", [
        _task("LeetCode mock interview (2 sessions)",  "mock",     "https://leetcode.com/assessment/", 4, "Timed 45-min sessions"),
        _task("STAR method behavioural prep",          "mock",     None, 2, "Prepare 5 STAR stories"),
    ]),
    _make_week(14, "Aptitude + Resume",      "Quant, logical reasoning, resume polish", [
        _task("IndiaBix aptitude practice",            "aptitude", "https://www.indiabix.com/aptitude/questions-and-answers/", 3, "50 quant + 50 logical"),
        _task("Resume — one page, ATS-friendly",       "revision", None, 2, "Use LaTeX or Overleaf template"),
    ]),
    _make_week(15, "Company Prep",           "Target company patterns and past questions", [
        _task("GeeksForGeeks company-wise questions",  "dsa",      "https://www.geeksforgeeks.org/company-preparation/", 4, "Top 50 for your target companies"),
        _task("LLD — design parking lot / elevator",  "mock",     "https://github.com/prasadgujar/low-level-design-primer", 3, "Object-oriented design"),
    ]),
    _make_week(16, "Final Sprint",           "Full mock, weak topic revision, confidence", [
        _task("Full mock interview (Pramp / Interviewing.io)", "mock", "https://www.pramp.com/", 3, "Real peer mock"),
        _task("Revise top 50 LeetCode patterns",      "revision", "https://seanprashad.com/leetcode-patterns/", 4, "Quick revision pass"),
        _task("Profile links: GitHub, LinkedIn ready", "revision", None, 1, "Polish online presence"),
    ]),
]}

FALLBACK_ROADMAP_ML = {"weeks": [
    _make_week(1,  "Python & Math Refresh",  "NumPy, Pandas, linear algebra basics", [
        _task("Python for ML — Kaggle course",         "course",   "https://www.kaggle.com/learn/python", 3, "Free, fast Python refresher"),
        _task("NumPy & Pandas essentials",             "course",   "https://www.kaggle.com/learn/pandas", 3, "Data manipulation fundamentals"),
    ]),
    _make_week(2,  "ML Fundamentals",        "Supervised learning, regression, classification", [
        _task("Andrew Ng ML Specialization — Week 1-2", "course", "https://www.coursera.org/specializations/machine-learning-introduction", 5, "Linear & logistic regression"),
        _task("Kaggle Intro to ML",                    "course",   "https://www.kaggle.com/learn/intro-to-machine-learning", 2, "Hands-on exercises"),
    ]),
    _make_week(3,  "Sklearn & Feature Eng",  "Preprocessing, pipelines, feature selection", [
        _task("Sklearn documentation walkthrough",     "course",   "https://scikit-learn.org/stable/tutorial/index.html", 3, "Fit/predict, cross-validation"),
        _task("Feature Engineering — Kaggle",          "course",   "https://www.kaggle.com/learn/feature-engineering", 3, "Imputation, encoding, scaling"),
    ]),
    _make_week(4,  "Trees & Ensembles",      "Decision trees, random forest, XGBoost", [
        _task("Tree-based models — StatQuest YouTube",  "course",  "https://www.youtube.com/playlist?list=PLblh5JKOoLUICTaGLRoHQDuF_7q2GfuJF", 4, "Random Forest, XGBoost explained"),
        _task("Titanic Kaggle competition",            "project",  "https://www.kaggle.com/c/titanic", 4, "First end-to-end ML project"),
    ]),
    _make_week(5,  "Deep Learning Intro",    "Neural networks, backprop, PyTorch basics", [
        _task("fast.ai Practical Deep Learning",       "course",   "https://course.fast.ai/", 5, "Top-down practical DL"),
        _task("PyTorch 60-minute blitz",               "course",   "https://pytorch.org/tutorials/beginner/deep_learning_60min_blitz.html", 3, "Tensors, autograd, training loop"),
    ]),
    _make_week(6,  "CNNs — Computer Vision", "Image classification, transfer learning", [
        _task("CNN architecture — Stanford CS231n notes", "course","https://cs231n.github.io/", 4, "ConvNet intuition"),
        _task("Image classification project (CIFAR-10)", "project","https://www.kaggle.com/c/cifar-10", 4, "Apply CNNs hands-on"),
    ]),
    _make_week(7,  "NLP Basics",             "Text preprocessing, embeddings, transformers intro", [
        _task("HuggingFace NLP course",                "course",   "https://huggingface.co/learn/nlp-course", 5, "Tokenization, BERT, fine-tuning"),
        _task("Sentiment analysis mini-project",       "project",  None, 4, "Fine-tune small transformer"),
    ]),
    _make_week(8,  "MLOps Basics",           "Experiments, versioning, model serving", [
        _task("MLflow experiment tracking",            "course",   "https://mlflow.org/docs/latest/tutorials-and-examples/index.html", 3, "Track runs and metrics"),
        _task("Deploy model as FastAPI endpoint",      "project",  None, 4, "Wrap model in REST API"),
    ]),
    _make_week(9,  "DSA for ML Interviews",  "Core coding problems needed for ML roles", [
        _task("LeetCode Medium — Arrays & Strings (30)", "dsa",   "https://leetcode.com/problemset/", 5, "ML roles still test DSA"),
        _task("Matrix problems (10)",                  "dsa",      "https://leetcode.com/tag/matrix/", 3, "Rotate, spiral, search 2D"),
    ]),
    _make_week(10, "Statistics & Probability","Distributions, hypothesis testing, A/B testing", [
        _task("StatQuest Statistics playlist",         "course",   "https://www.youtube.com/playlist?list=PLblh5JKOoLUK0FLuzwntyYI10UQFUhsY9", 4, "p-values, distributions"),
        _task("A/B testing fundamentals",              "course",   "https://www.udacity.com/course/ab-testing--ud257", 2, "Experiment design basics"),
    ]),
    _make_week(11, "Capstone Project",       "End-to-end ML project from data to deployment", [
        _task("Choose Kaggle competition + baseline",  "project",  "https://www.kaggle.com/competitions", 5, "Pick an active competition"),
        _task("EDA + feature engineering + model",     "project",  None, 8, "Full pipeline, track with MLflow"),
    ]),
    _make_week(12, "System Design for ML",   "Recommendation systems, model serving at scale", [
        _task("ML system design — Chip Huyen book",    "course",   "https://huyenchip.com/machine-learning-systems-design/toc.html", 4, "Free online book"),
        _task("Design a recommendation system",        "mock",     None, 3, "Common ML system design question"),
    ]),
    _make_week(13, "ML Interview Prep",      "Theory questions, coding, case studies", [
        _task("ML interview questions — GitHub repo",  "revision", "https://github.com/andrewekhalel/MLQuestions", 4, "Top 100 ML Q&A"),
        _task("Mock ML interview (peer)",              "mock",     None, 3, "Practice explaining models"),
    ]),
    _make_week(14, "Resume & Portfolio",     "ML projects on GitHub, Kaggle ranking", [
        _task("Publish capstone project on GitHub",    "project",  None, 3, "Clean code, clear README, demo"),
        _task("Kaggle profile: earn bronze medal",     "project",  "https://www.kaggle.com/", 4, "Consistent top-50% finish"),
    ]),
    _make_week(15, "Company-Specific Prep",  "Amazon SDE/ML, Google, OpenAI research roles", [
        _task("Company ML engineering blog posts",     "revision", None, 3, "Read engineering blogs of targets"),
        _task("LeetCode company tag problems (30)",    "dsa",      "https://leetcode.com/problemset/", 4, "Target company filtered"),
    ]),
    _make_week(16, "Final Mock + Confidence","Timed sessions, behavioural, polish", [
        _task("Timed ML + coding mock interview",      "mock",     None, 4, "45 min coding + 30 min ML theory"),
        _task("Prepare 5 STAR behavioural answers",    "revision", None, 2, "Projects, failures, learnings"),
    ]),
]}

FALLBACK_ROADMAP_DA = {"weeks": [
    _make_week(1,  "SQL Foundations",        "SELECT, JOIN, GROUP BY, subqueries", [
        _task("Mode Analytics SQL Tutorial",           "course",   "https://mode.com/sql-tutorial/", 3, "Best free interactive SQL course"),
        _task("HackerRank SQL (30 problems)",          "dsa",      "https://www.hackerrank.com/domains/sql", 3, "Basic to intermediate SQL"),
    ]),
    _make_week(2,  "Advanced SQL",           "Window functions, CTEs, query optimisation", [
        _task("Window functions — Mode Analytics",     "course",   "https://mode.com/sql-tutorial/sql-window-functions/", 3, "ROW_NUMBER, RANK, LAG, LEAD"),
        _task("LeetCode SQL (20 medium)",              "dsa",      "https://leetcode.com/problemset/database/", 3, "Interview-style SQL"),
    ]),
    _make_week(3,  "Python for DA",          "Pandas, NumPy, data cleaning", [
        _task("Kaggle Pandas course",                  "course",   "https://www.kaggle.com/learn/pandas", 3, "Hands-on data manipulation"),
        _task("Real-world dataset cleaning exercise",  "project",  "https://www.kaggle.com/datasets", 4, "Find messy Kaggle dataset and clean it"),
    ]),
    _make_week(4,  "Data Visualisation",     "Matplotlib, Seaborn, storytelling with data", [
        _task("Seaborn tutorial",                      "course",   "https://seaborn.pydata.org/tutorial.html", 2, "Statistical visualisation"),
        _task("Storytelling with Data — book summary", "course",   "https://www.storytellingwithdata.com/blog", 2, "Chart choice, clutter reduction"),
        _task("EDA project on dataset of choice",      "project",  None, 4, "10-chart EDA notebook on Kaggle"),
    ]),
    _make_week(5,  "Statistics Essentials",  "Descriptive stats, hypothesis testing", [
        _task("StatQuest Statistics series",           "course",   "https://www.youtube.com/playlist?list=PLblh5JKOoLUK0FLuzwntyYI10UQFUhsY9", 4, "Mean, variance, distributions"),
        _task("A/B testing case study",                "project",  None, 3, "Analyse a marketing experiment"),
    ]),
    _make_week(6,  "Tableau / Power BI",     "Dashboard design for business stakeholders", [
        _task("Tableau Public free training",          "course",   "https://www.tableau.com/learn/training", 4, "Build 3 dashboards"),
        _task("Build Superstore sales dashboard",      "project",  None, 3, "Classic Tableau project"),
    ]),
    _make_week(7,  "Excel & Business Analysis", "Pivot tables, VLOOKUP, business KPIs", [
        _task("Excel for Data Analytics — YouTube",   "course",   "https://www.youtube.com/watch?v=Vl0H-qTclOg", 3, "Pivot, VLOOKUP, INDEX/MATCH"),
        _task("Product metrics case study",            "project",  None, 3, "Define KPIs for a product"),
    ]),
    _make_week(8,  "Intro to ML for DA",     "Regression, clustering for business insights", [
        _task("Kaggle Intro to ML",                    "course",   "https://www.kaggle.com/learn/intro-to-machine-learning", 3, "Decision trees, validation"),
        _task("Customer segmentation (KMeans)",        "project",  None, 4, "Unsupervised clustering project"),
    ]),
    _make_week(9,  "Case Study Practice",    "Google/Amazon-style analytics interviews", [
        _task("Ace the Data Science Interview — top 50 SQL", "revision", "https://datalemur.com/", 3, "DataLemur SQL questions"),
        _task("Product analytics case: user drop-off", "mock",    None, 3, "Root cause analysis exercise"),
    ]),
    _make_week(10, "Capstone Project",       "End-to-end analysis with business insight", [
        _task("Pick domain dataset (fintech/health/e-comm)", "project", "https://www.kaggle.com/datasets", 2, "Choose meaningful data"),
        _task("SQL + Python + Tableau full analysis", "project",  None, 8, "Full notebook + dashboard"),
    ]),
    _make_week(11, "Resume & Portfolio",     "Data projects on GitHub, Kaggle, Tableau Public", [
        _task("Publish capstone on GitHub",            "project",  None, 3, "Jupyter notebook with insights"),
        _task("Tableau Public: 3 published dashboards","project",  "https://public.tableau.com/", 2, "Portfolio for interviews"),
    ]),
    _make_week(12, "Company Research",       "Target companies' data stack and interview format", [
        _task("Research Flipkart/Swiggy data team",    "revision", None, 2, "Blog posts, job descriptions"),
        _task("SQL + stats mock interview (peer)",      "mock",    None, 3, "Practice explaining analysis"),
    ]),
    _make_week(13, "Interview Theory",       "Statistics, probability, estimation questions", [
        _task("50 DA interview questions — Glassdoor", "revision", "https://www.glassdoor.com/Interview/data-analyst-interview-questions-SRCH_KO0,12.htm", 3, "Theory + SQL mix"),
        _task("Fermi estimation practice (10 q)",      "aptitude", None, 2, "Back-of-envelope estimation"),
    ]),
    _make_week(14, "Aptitude + Resume Polish","Placement aptitude + one-page resume", [
        _task("IndiaBix quant + logical (100 q)",      "aptitude", "https://www.indiabix.com/", 3, "Campus placement aptitude"),
        _task("Final resume review",                   "revision", None, 2, "ATS-friendly, metrics in bullets"),
    ]),
    _make_week(15, "Mock Interviews",        "Full data analytics interview simulation", [
        _task("2 timed mock DA interviews",            "mock",     "https://www.pramp.com/", 4, "SQL + case + stats in 45 min"),
        _task("Behavioural: projects, impact, metrics","revision", None, 2, "STAR format with numbers"),
    ]),
    _make_week(16, "Final Sprint",           "Weak area revision and confidence building", [
        _task("Revise top 30 SQL patterns",            "revision", None, 3, "Window functions, CTEs"),
        _task("Review all projects and key findings",  "revision", None, 2, "Be ready to walk through your work"),
    ]),
]}

FALLBACK_ROADMAPS = {
    "SDE":             FALLBACK_ROADMAP_SDE,
    "ML Engineer":     FALLBACK_ROADMAP_ML,
    "Data Analyst":    FALLBACK_ROADMAP_DA,
    "DevOps":          FALLBACK_ROADMAP_SDE,   # closest fallback
    "Product Manager": FALLBACK_ROADMAP_DA,    # closest fallback
}


def get_fallback_roadmap(role: str) -> dict:
    return FALLBACK_ROADMAPS.get(role, FALLBACK_ROADMAP_SDE)
