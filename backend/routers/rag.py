import os
import logging
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from auth import verify_token

logger = logging.getLogger(__name__)

router = APIRouter()

# ---------------------------------------------------------------------------
# Knowledge Base — 60 curated learning resources
# ---------------------------------------------------------------------------

RESOURCES = [
    # ── SDE / DSA ──────────────────────────────────────────────────────────
    {
        "title": "Striver's A2Z DSA Course Sheet",
        "url": "https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2/",
        "description": "Comprehensive DSA roadmap with 455 problems organized by topic, ideal for placement prep.",
        "role": "SDE",
        "topic": "DSA",
        "platform": "TakeUForward",
    },
    {
        "title": "Striver's DSA Playlist — YouTube",
        "url": "https://www.youtube.com/playlist?list=PLgUwDviBIf0oF6QL8m22w1hIDC1vJ_BHz",
        "description": "Video solutions to every problem on the A2Z sheet, with intuition-first explanations.",
        "role": "SDE",
        "topic": "DSA",
        "platform": "YouTube",
    },
    {
        "title": "NeetCode 150 — Blind 75 Extended",
        "url": "https://neetcode.io/practice",
        "description": "Curated 150 LeetCode problems with video walkthroughs, organized by pattern.",
        "role": "SDE",
        "topic": "DSA",
        "platform": "NeetCode",
    },
    {
        "title": "LeetCode Patterns by Sean Prashad",
        "url": "https://seanprashad.com/leetcode-patterns/",
        "description": "Groups LeetCode problems by pattern (sliding window, two-pointer, etc.) for systematic practice.",
        "role": "SDE",
        "topic": "DSA",
        "platform": "GitHub",
    },
    {
        "title": "CS Dojo — Data Structures & Algorithms",
        "url": "https://www.youtube.com/playlist?list=PLBZBJbE_rGRV8D7XZ08LK6z-4zPoWzu5H",
        "description": "Beginner-friendly YouTube series covering core DS&A concepts with Python examples.",
        "role": "SDE",
        "topic": "DSA",
        "platform": "YouTube",
    },
    # ── SDE / System Design ────────────────────────────────────────────────
    {
        "title": "Gaurav Sen — System Design Playlist",
        "url": "https://www.youtube.com/playlist?list=PLMCXHnjXnTnvo6alSjVkgxV-VH6EPyvoX",
        "description": "In-depth system design videos covering caching, load balancing, databases, and real-world architectures.",
        "role": "SDE",
        "topic": "System Design",
        "platform": "YouTube",
    },
    {
        "title": "System Design Primer — GitHub",
        "url": "https://github.com/donnemartin/system-design-primer",
        "description": "Open-source collection of system design study materials, diagrams, and interview prep.",
        "role": "SDE",
        "topic": "System Design",
        "platform": "GitHub",
    },
    {
        "title": "ByteByteGo — System Design Newsletter",
        "url": "https://bytebytego.com/",
        "description": "Visual system design breakdowns of real systems like YouTube, Twitter, and URL shorteners.",
        "role": "SDE",
        "topic": "System Design",
        "platform": "ByteByteGo",
    },
    {
        "title": "Designing Data-Intensive Applications (Kleppmann)",
        "url": "https://www.oreilly.com/library/view/designing-data-intensive-applications/9781491903063/",
        "description": "The definitive book on distributed systems, covering replication, partitioning, and consistency.",
        "role": "SDE",
        "topic": "System Design",
        "platform": "O'Reilly",
    },
    # ── SDE / Web Development ─────────────────────────────────────────────
    {
        "title": "Full Stack Open — University of Helsinki",
        "url": "https://fullstackopen.com/en/",
        "description": "Free university-grade course covering React, Node.js, GraphQL, TypeScript, and CI/CD.",
        "role": "SDE",
        "topic": "Web Dev",
        "platform": "University of Helsinki",
    },
    {
        "title": "The Odin Project",
        "url": "https://www.theodinproject.com/",
        "description": "Full-stack curriculum with projects covering HTML, CSS, JavaScript, React, and Ruby on Rails.",
        "role": "SDE",
        "topic": "Web Dev",
        "platform": "The Odin Project",
    },
    {
        "title": "Fireship — Web Dev Crash Courses",
        "url": "https://www.youtube.com/@Fireship",
        "description": "Fast-paced YouTube channel covering modern web frameworks, tools, and concepts in short videos.",
        "role": "SDE",
        "topic": "Web Dev",
        "platform": "YouTube",
    },
    # ── SDE / Git & GitHub ────────────────────────────────────────────────
    {
        "title": "Pro Git Book (Free)",
        "url": "https://git-scm.com/book/en/v2",
        "description": "Official comprehensive Git reference covering branching, merging, rebasing, and collaboration.",
        "role": "SDE",
        "topic": "Git",
        "platform": "git-scm.com",
    },
    {
        "title": "Learn Git Branching — Interactive",
        "url": "https://learngitbranching.js.org/",
        "description": "Visual interactive sandbox to master Git branching, merging, rebasing, and cherry-picking.",
        "role": "SDE",
        "topic": "Git",
        "platform": "Web App",
    },
    {
        "title": "GitHub Skills",
        "url": "https://skills.github.com/",
        "description": "Hands-on GitHub courses for pull requests, Actions CI/CD, GitHub Pages, and code review.",
        "role": "SDE",
        "topic": "Git",
        "platform": "GitHub",
    },
    # ── SDE / OOPS ────────────────────────────────────────────────────────
    {
        "title": "OOPS in Java — Kunal Kushwaha",
        "url": "https://www.youtube.com/playlist?list=PL9gnSGHSqcno1G3XjUbwzXHL8_EttOuKk",
        "description": "Deep-dive into object-oriented programming concepts with Java: classes, inheritance, polymorphism, and more.",
        "role": "SDE",
        "topic": "OOPS",
        "platform": "YouTube",
    },
    {
        "title": "Refactoring Guru — Design Patterns",
        "url": "https://refactoring.guru/design-patterns",
        "description": "Visual catalog of 22 classic design patterns with real-world examples in multiple languages.",
        "role": "SDE",
        "topic": "OOPS",
        "platform": "RefactoringGuru",
    },
    {
        "title": "Clean Code — Robert C. Martin Summary",
        "url": "https://gist.github.com/wojteklu/73f6214f9ffa4f94db80",
        "description": "Key takeaways and principles from Clean Code summarized for quick reference and daily practice.",
        "role": "SDE",
        "topic": "OOPS",
        "platform": "GitHub",
    },
    # ── ML Engineer / ML Basics ───────────────────────────────────────────
    {
        "title": "Machine Learning Specialization — Andrew Ng (Coursera)",
        "url": "https://www.coursera.org/specializations/machine-learning-introduction",
        "description": "Three-course series covering supervised, unsupervised learning, and reinforcement learning fundamentals.",
        "role": "ML Engineer",
        "topic": "ML Basics",
        "platform": "Coursera",
    },
    {
        "title": "Google Machine Learning Crash Course",
        "url": "https://developers.google.com/machine-learning/crash-course",
        "description": "Free Google course on ML fundamentals with TensorFlow exercises and real-world case studies.",
        "role": "ML Engineer",
        "topic": "ML Basics",
        "platform": "Google Developers",
    },
    {
        "title": "StatQuest — Machine Learning Playlist",
        "url": "https://www.youtube.com/playlist?list=PLblh5JKOoLUICTaGLRoHQDuF_7q2GfuJF",
        "description": "Visually intuitive explanations of ML algorithms from linear regression to random forests.",
        "role": "ML Engineer",
        "topic": "ML Basics",
        "platform": "YouTube",
    },
    # ── ML Engineer / Deep Learning ───────────────────────────────────────
    {
        "title": "fast.ai — Practical Deep Learning for Coders",
        "url": "https://course.fast.ai/",
        "description": "Top-down deep learning course using PyTorch, covering vision, NLP, and tabular models.",
        "role": "ML Engineer",
        "topic": "Deep Learning",
        "platform": "fast.ai",
    },
    {
        "title": "Deep Learning Specialization — Andrew Ng (Coursera)",
        "url": "https://www.coursera.org/specializations/deep-learning",
        "description": "Five-course series on neural networks, CNNs, RNNs, and structuring ML projects.",
        "role": "ML Engineer",
        "topic": "Deep Learning",
        "platform": "Coursera",
    },
    {
        "title": "Andrej Karpathy — Neural Networks: Zero to Hero",
        "url": "https://www.youtube.com/playlist?list=PLAqhIrjkxbuWI23v9cThsA9GvCAUhRvKZ",
        "description": "Build GPT from scratch step by step; covers backprop, transformers, and language model internals.",
        "role": "ML Engineer",
        "topic": "Deep Learning",
        "platform": "YouTube",
    },
    # ── ML Engineer / Python for ML ───────────────────────────────────────
    {
        "title": "Kaggle — Python Course",
        "url": "https://www.kaggle.com/learn/python",
        "description": "Free hands-on Python course tailored for data science workflows in Kaggle notebooks.",
        "role": "ML Engineer",
        "topic": "Python for ML",
        "platform": "Kaggle",
    },
    {
        "title": "Kaggle — Pandas Course",
        "url": "https://www.kaggle.com/learn/pandas",
        "description": "Practical pandas tutorial covering DataFrames, groupby, merges, and real dataset exercises.",
        "role": "ML Engineer",
        "topic": "Python for ML",
        "platform": "Kaggle",
    },
    {
        "title": "Real Python — Data Science Tutorials",
        "url": "https://realpython.com/tutorials/data-science/",
        "description": "Curated Python tutorials for NumPy, pandas, matplotlib, scikit-learn, and more.",
        "role": "ML Engineer",
        "topic": "Python for ML",
        "platform": "Real Python",
    },
    # ── ML Engineer / Frameworks ───────────────────────────────────────────
    {
        "title": "PyTorch Official Tutorials",
        "url": "https://pytorch.org/tutorials/",
        "description": "Official PyTorch docs with beginner to advanced tutorials on tensors, autograd, and training loops.",
        "role": "ML Engineer",
        "topic": "Frameworks",
        "platform": "PyTorch",
    },
    {
        "title": "TensorFlow — Learn ML",
        "url": "https://www.tensorflow.org/learn",
        "description": "Official TensorFlow learning path from basics to deployment with Keras and TFX pipelines.",
        "role": "ML Engineer",
        "topic": "Frameworks",
        "platform": "TensorFlow",
    },
    # ── ML Engineer / Statistics ───────────────────────────────────────────
    {
        "title": "Khan Academy — Statistics & Probability",
        "url": "https://www.khanacademy.org/math/statistics-probability",
        "description": "Free statistics curriculum covering distributions, hypothesis testing, and regression from first principles.",
        "role": "ML Engineer",
        "topic": "Statistics",
        "platform": "Khan Academy",
    },
    # ── Data Analyst / SQL ────────────────────────────────────────────────
    {
        "title": "Mode Analytics — SQL Tutorial",
        "url": "https://mode.com/sql-tutorial/",
        "description": "Hands-on SQL tutorial from basics to advanced window functions using a real dataset in Mode.",
        "role": "Data Analyst",
        "topic": "SQL",
        "platform": "Mode Analytics",
    },
    {
        "title": "SQLZoo — Interactive SQL",
        "url": "https://sqlzoo.net/",
        "description": "Browser-based SQL practice with progressive exercises covering SELECT, JOIN, aggregations, and subqueries.",
        "role": "Data Analyst",
        "topic": "SQL",
        "platform": "SQLZoo",
    },
    {
        "title": "LeetCode SQL 50 Study Plan",
        "url": "https://leetcode.com/studyplan/top-sql-50/",
        "description": "Curated 50 SQL interview problems from easy to hard, with company-specific tags.",
        "role": "Data Analyst",
        "topic": "SQL",
        "platform": "LeetCode",
    },
    # ── Data Analyst / Excel & Sheets ─────────────────────────────────────
    {
        "title": "ExcelJet — Excel Formulas & Functions",
        "url": "https://exceljet.net/formulas",
        "description": "Comprehensive reference for 500+ Excel formulas with plain-language explanations and examples.",
        "role": "Data Analyst",
        "topic": "Excel",
        "platform": "ExcelJet",
    },
    {
        "title": "Google Sheets — Official Training",
        "url": "https://workspace.google.com/learning-center/products/sheets/start/",
        "description": "Google's official Sheets learning path covering formulas, pivot tables, charts, and Apps Script.",
        "role": "Data Analyst",
        "topic": "Excel",
        "platform": "Google Workspace",
    },
    # ── Data Analyst / Python ─────────────────────────────────────────────
    {
        "title": "Kaggle — Data Visualization Course",
        "url": "https://www.kaggle.com/learn/data-visualization",
        "description": "Learn seaborn and matplotlib to create effective charts and dashboards in Python notebooks.",
        "role": "Data Analyst",
        "topic": "Python",
        "platform": "Kaggle",
    },
    {
        "title": "Kaggle — Data Cleaning Course",
        "url": "https://www.kaggle.com/learn/data-cleaning",
        "description": "Practical data cleaning techniques: handling missing values, scaling, parsing dates, and character encoding.",
        "role": "Data Analyst",
        "topic": "Python",
        "platform": "Kaggle",
    },
    # ── Data Analyst / BI Tools ───────────────────────────────────────────
    {
        "title": "Tableau Public — Free Learning Videos",
        "url": "https://public.tableau.com/app/learn/how-to-videos",
        "description": "Official Tableau how-to videos covering charts, dashboards, calculated fields, and publishing.",
        "role": "Data Analyst",
        "topic": "BI Tools",
        "platform": "Tableau",
    },
    {
        "title": "Microsoft Power BI — Guided Learning",
        "url": "https://learn.microsoft.com/en-us/training/powerplatform/power-bi",
        "description": "Microsoft's official Power BI learning path from data import to publishing interactive reports.",
        "role": "Data Analyst",
        "topic": "BI Tools",
        "platform": "Microsoft Learn",
    },
    # ── Data Analyst / Statistics ─────────────────────────────────────────
    {
        "title": "Statistics for Data Science — Towards Data Science",
        "url": "https://towardsdatascience.com/statistics-for-data-science-d46ca8944a11",
        "description": "Practical statistics guide covering descriptive stats, probability, distributions, and hypothesis testing.",
        "role": "Data Analyst",
        "topic": "Statistics",
        "platform": "Towards Data Science",
    },
    # ── DevOps / Docker ───────────────────────────────────────────────────
    {
        "title": "Docker Official Get Started Guide",
        "url": "https://docs.docker.com/get-started/",
        "description": "Official Docker tutorial: build, run, and push containers; write Dockerfiles and Compose files.",
        "role": "DevOps",
        "topic": "Docker",
        "platform": "Docker Docs",
    },
    {
        "title": "TechWorld with Nana — Docker Crash Course",
        "url": "https://www.youtube.com/watch?v=3c-iBn73dDE",
        "description": "Four-hour Docker course covering architecture, volumes, networks, and Docker Compose from scratch.",
        "role": "DevOps",
        "topic": "Docker",
        "platform": "YouTube",
    },
    # ── DevOps / Kubernetes ───────────────────────────────────────────────
    {
        "title": "Kubernetes Official Interactive Tutorial",
        "url": "https://kubernetes.io/docs/tutorials/kubernetes-basics/",
        "description": "Browser-based Kubernetes basics: deploy, expose, scale, and update containerized applications.",
        "role": "DevOps",
        "topic": "Kubernetes",
        "platform": "Kubernetes Docs",
    },
    {
        "title": "TechWorld with Nana — Kubernetes Course",
        "url": "https://www.youtube.com/watch?v=X48VuDVv0do",
        "description": "Four-hour complete Kubernetes course: pods, deployments, services, ingress, Helm, and more.",
        "role": "DevOps",
        "topic": "Kubernetes",
        "platform": "YouTube",
    },
    # ── DevOps / Cloud ────────────────────────────────────────────────────
    {
        "title": "AWS Skill Builder — Free Tier Courses",
        "url": "https://skillbuilder.aws/",
        "description": "AWS's official free learning portal with courses on EC2, S3, Lambda, IAM, and cloud fundamentals.",
        "role": "DevOps",
        "topic": "Cloud",
        "platform": "AWS",
    },
    {
        "title": "Google Cloud Skills Boost — Free Labs",
        "url": "https://cloudskillsboost.google/",
        "description": "Hands-on GCP labs for Compute Engine, Cloud Run, BigQuery, and professional certificate paths.",
        "role": "DevOps",
        "topic": "Cloud",
        "platform": "Google Cloud",
    },
    # ── DevOps / Linux ────────────────────────────────────────────────────
    {
        "title": "The Linux Command Line (Free Book)",
        "url": "https://linuxcommand.org/tlcl.php",
        "description": "Free comprehensive guide to Bash: navigation, scripting, processes, permissions, and package management.",
        "role": "DevOps",
        "topic": "Linux",
        "platform": "linuxcommand.org",
    },
    {
        "title": "OverTheWire — Bandit Wargame",
        "url": "https://overthewire.org/wargames/bandit/",
        "description": "Gamified Linux terminal challenges starting from basics and progressively covering advanced shell usage.",
        "role": "DevOps",
        "topic": "Linux",
        "platform": "OverTheWire",
    },
    # ── DevOps / CI/CD ────────────────────────────────────────────────────
    {
        "title": "GitHub Actions — Official Quickstart",
        "url": "https://docs.github.com/en/actions/quickstart",
        "description": "Official guide to creating GitHub Actions workflows for CI/CD, testing, and deployment automation.",
        "role": "DevOps",
        "topic": "CI/CD",
        "platform": "GitHub",
    },
    {
        "title": "GitLab CI/CD — Beginner Tutorial",
        "url": "https://docs.gitlab.com/ee/ci/quick_start/",
        "description": "Create your first GitLab CI pipeline: runners, jobs, stages, artifacts, and environment deployments.",
        "role": "DevOps",
        "topic": "CI/CD",
        "platform": "GitLab",
    },
    # ── General / Interview Prep ──────────────────────────────────────────
    {
        "title": "LeetCode — 14 Coding Patterns (AlgoMonster)",
        "url": "https://algo.monster/problems/stats",
        "description": "Statistical breakdown of LeetCode patterns by frequency, helping you focus on highest-ROI topics.",
        "role": "General",
        "topic": "Interview Prep",
        "platform": "AlgoMonster",
    },
    {
        "title": "Pramp — Free Peer Mock Interviews",
        "url": "https://www.pramp.com/",
        "description": "Practice coding interviews live with peers; covers DS&A, system design, and behavioral rounds.",
        "role": "General",
        "topic": "Interview Prep",
        "platform": "Pramp",
    },
    {
        "title": "interviewing.io — Mock Interviews",
        "url": "https://interviewing.io/",
        "description": "Anonymous mock interviews with engineers from top companies; watch recordings to improve technique.",
        "role": "General",
        "topic": "Interview Prep",
        "platform": "interviewing.io",
    },
    # ── General / Resume & Career ─────────────────────────────────────────
    {
        "title": "Harvard CS50 Resume Guide",
        "url": "https://cs50.harvard.edu/x/2024/cv/",
        "description": "CS50's concise one-page resume guidelines tailored for CS students and software engineering roles.",
        "role": "General",
        "topic": "Resume",
        "platform": "Harvard CS50",
    },
    {
        "title": "Levels.fyi — Salary & Career Data",
        "url": "https://www.levels.fyi/",
        "description": "Crowd-sourced compensation data for tech roles, useful for negotiation and understanding career ladders.",
        "role": "General",
        "topic": "Resume",
        "platform": "Levels.fyi",
    },
    # ── General / Soft Skills & Productivity ─────────────────────────────
    {
        "title": "MIT OpenCourseWare — Communication for Engineers",
        "url": "https://ocw.mit.edu/courses/6-892-the-craft-of-technical-writing-spring-2008/",
        "description": "MIT course on technical writing for engineers: documentation, reports, and clear communication.",
        "role": "General",
        "topic": "Soft Skills",
        "platform": "MIT OCW",
    },
    {
        "title": "Paul Graham — Essays on Startups & Thinking",
        "url": "http://www.paulgraham.com/articles.html",
        "description": "Collection of influential essays on technology, startups, learning, and long-term career thinking.",
        "role": "General",
        "topic": "Soft Skills",
        "platform": "paulgraham.com",
    },
    # ── General / Open Source & Community ────────────────────────────────
    {
        "title": "First Contributions — Open Source Guide",
        "url": "https://firstcontributions.github.io/",
        "description": "Step-by-step guide to making your first open source pull request on GitHub in under 10 minutes.",
        "role": "General",
        "topic": "Open Source",
        "platform": "GitHub",
    },
    {
        "title": "Good First Issues — OSS Finder",
        "url": "https://goodfirstissues.com/",
        "description": "Aggregator of beginner-friendly GitHub issues across popular open-source projects in any language.",
        "role": "General",
        "topic": "Open Source",
        "platform": "goodfirstissues.com",
    },
    {
        "title": "roadmap.sh — Developer Learning Paths",
        "url": "https://roadmap.sh/",
        "description": "Community-driven visual roadmaps for SDE, frontend, backend, DevOps, ML, and other tech career tracks.",
        "role": "General",
        "topic": "Career Path",
        "platform": "roadmap.sh",
    },
]

# ---------------------------------------------------------------------------
# Qdrant / OpenAI lazy-init state
# ---------------------------------------------------------------------------

_qdrant_client = None
_collection_ready = False
_COLLECTION_NAME = "pathforge_resources"
_VECTOR_DIM = 1536


def _get_openai_client():
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None
    from openai import OpenAI
    return OpenAI(api_key=api_key)


def _get_qdrant_client():
    global _qdrant_client
    if _qdrant_client is not None:
        return _qdrant_client
    try:
        from qdrant_client import QdrantClient
        url = os.getenv("QDRANT_URL", "http://localhost:6333")
        api_key = os.getenv("QDRANT_API_KEY", "") or None
        _qdrant_client = QdrantClient(url=url, api_key=api_key, timeout=5)
        return _qdrant_client
    except Exception as exc:
        logger.warning(f"Qdrant unavailable: {exc}")
        return None


def _embed(client, texts: list[str]) -> list[list[float]]:
    """Embed a list of texts using text-embedding-3-small."""
    response = client.embeddings.create(
        model="text-embedding-3-small",
        input=texts,
    )
    return [item.embedding for item in response.data]


def _ensure_collection_populated():
    """Lazy init: create + populate Qdrant collection if it doesn't exist yet."""
    global _collection_ready
    if _collection_ready:
        return True

    qdrant = _get_qdrant_client()
    if qdrant is None:
        return False

    openai_client = _get_openai_client()
    if openai_client is None:
        return False

    try:
        from qdrant_client.models import Distance, VectorParams, PointStruct

        existing = [c.name for c in qdrant.get_collections().collections]
        if _COLLECTION_NAME not in existing:
            qdrant.create_collection(
                collection_name=_COLLECTION_NAME,
                vectors_config=VectorParams(size=_VECTOR_DIM, distance=Distance.COSINE),
            )
            logger.info(f"Created Qdrant collection '{_COLLECTION_NAME}'.")

            # Embed all resources and upsert
            texts = [
                f"{r['role']} {r['topic']} {r['title']} {r['description']}"
                for r in RESOURCES
            ]
            # Batch in groups of 20 to stay within rate limits
            batch_size = 20
            all_embeddings = []
            for i in range(0, len(texts), batch_size):
                batch = texts[i: i + batch_size]
                all_embeddings.extend(_embed(openai_client, batch))
                logger.info(f"Embedded batch {i // batch_size + 1}/{(len(texts) + batch_size - 1) // batch_size}")

            points = [
                PointStruct(
                    id=idx,
                    vector=emb,
                    payload={
                        "title": RESOURCES[idx]["title"],
                        "url": RESOURCES[idx]["url"],
                        "description": RESOURCES[idx]["description"],
                        "role": RESOURCES[idx]["role"],
                        "topic": RESOURCES[idx]["topic"],
                        "platform": RESOURCES[idx]["platform"],
                    },
                )
                for idx, emb in enumerate(all_embeddings)
            ]
            qdrant.upsert(collection_name=_COLLECTION_NAME, points=points)
            logger.info(f"Upserted {len(points)} points into '{_COLLECTION_NAME}'.")

        _collection_ready = True
        return True

    except Exception as exc:
        logger.warning(f"Qdrant init failed: {exc}")
        return False


# ---------------------------------------------------------------------------
# Keyword fallback search
# ---------------------------------------------------------------------------

def _keyword_fallback(role: str, topic: str, top_k: int = 2) -> list[dict]:
    """Simple substring filter when vector search is unavailable."""
    role_lower = role.lower()
    topic_lower = topic.lower()

    scored = []
    for r in RESOURCES:
        score = 0
        if role_lower in r["role"].lower() or r["role"].lower() == "general":
            score += 2
        if topic_lower in r["topic"].lower() or topic_lower in r["title"].lower() or topic_lower in r["description"].lower():
            score += 3
        if score > 0:
            scored.append((score, r))

    scored.sort(key=lambda x: x[0], reverse=True)
    results = []
    for score, r in scored[:top_k]:
        results.append({
            "title": r["title"],
            "url": r["url"],
            "description": r["description"],
            "platform": r["platform"],
            "why_recommended": "Keyword match (vector search unavailable)",
        })
    return results


# ---------------------------------------------------------------------------
# Core recommend logic
# ---------------------------------------------------------------------------

def _recommend(role: str, topic: str) -> dict:
    qdrant_ready = _ensure_collection_populated()

    if qdrant_ready:
        openai_client = _get_openai_client()
        qdrant = _get_qdrant_client()
        try:
            query_text = f"{role} {topic}"
            query_vector = _embed(openai_client, [query_text])[0]

            hits = qdrant.search(
                collection_name=_COLLECTION_NAME,
                query_vector=query_vector,
                limit=3,
            )

            results = []
            for hit in hits[:2]:
                payload = hit.payload
                match_pct = round(hit.score * 100, 1)
                results.append({
                    "title": payload["title"],
                    "url": payload["url"],
                    "description": payload["description"],
                    "platform": payload["platform"],
                    "why_recommended": f"{match_pct}% match",
                })

            return {
                "query": {"role": role, "topic": topic},
                "source": "qdrant_vector_search",
                "fallback_used": False,
                "results": results,
            }

        except Exception as exc:
            logger.warning(f"Qdrant search failed, falling back to keyword: {exc}")

    # Fallback
    fallback_results = _keyword_fallback(role, topic)
    return {
        "query": {"role": role, "topic": topic},
        "source": "keyword_fallback",
        "fallback_used": True,
        "results": fallback_results,
    }


# ---------------------------------------------------------------------------
# Request model
# ---------------------------------------------------------------------------

class RecommendRequest(BaseModel):
    role: str
    topic: str


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/recommend")
async def recommend_post(
    body: RecommendRequest,
    payload: dict = Depends(verify_token),
):
    """
    POST /rag/recommend
    Body: {"role": "SDE", "topic": "DSA"}
    Returns top 2 resources matched via OpenAI embeddings + Qdrant cosine search.
    Falls back to keyword search if vector infra is unavailable.
    """
    return _recommend(role=body.role.strip(), topic=body.topic.strip())


@router.get("/recommend")
async def recommend_get(
    role: str = Query(..., description="Target role e.g. SDE, ML Engineer, Data Analyst, DevOps"),
    topic: str = Query(..., description="Topic of interest e.g. DSA, System Design, SQL"),
    payload: dict = Depends(verify_token),
):
    """
    GET /rag/recommend?role=SDE&topic=DSA
    Same as POST but via query params for easy browser/Swagger testing.
    """
    return _recommend(role=role.strip(), topic=topic.strip())
