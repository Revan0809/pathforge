from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from routers import profile, roadmap, dsa, courses, challenges, friends, rag, score, cgpa, agent, payments
from auth import verify_token
import os
import sys
import uvicorn

# ── Startup env-var guard ─────────────────────────────────────────────────────
_REQUIRED = ["SUPABASE_URL", "SUPABASE_SERVICE_KEY", "SUPABASE_JWT_SECRET", "GROQ_API_KEY"]
_missing = [k for k in _REQUIRED if not os.getenv(k)]
if _missing:
    print(f"[PathForge] FATAL: missing environment variables: {_missing}", file=sys.stderr)
    print("[PathForge] Set these in your Railway dashboard before deploying.", file=sys.stderr)
    sys.exit(1)

app = FastAPI(
    title="PathForge API",
    description="AI-powered career OS backend for CSE students",
    version="1.0.0"
)

# ── CORS ──────────────────────────────────────────────────────────────────────
# Always allow the production domain + local dev. Never rely solely on env var.
_extra = os.getenv("FRONTEND_URL", "")
_origins = [
    "http://localhost:3000",
    "https://pathforge.online",
    "https://www.pathforge.online",
]
if _extra and _extra not in _origins:
    _origins.append(_extra)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",   # allow Vercel preview URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(profile.router,    prefix="/profile",    tags=["Profile"])
app.include_router(roadmap.router,    prefix="/roadmap",    tags=["Roadmap"])
app.include_router(dsa.router,        prefix="/dsa",        tags=["DSA"])
app.include_router(courses.router,    prefix="/courses",    tags=["Courses"])
app.include_router(challenges.router, prefix="/challenges", tags=["Challenges"])
app.include_router(friends.router,    prefix="/friends",    tags=["Friends"])
app.include_router(rag.router,        prefix="/rag",        tags=["RAG"])
app.include_router(score.router,      prefix="/score",      tags=["Score"])
app.include_router(cgpa.router,       prefix="/cgpa",       tags=["CGPA"])
app.include_router(agent.router,      prefix="/agent",      tags=["Agent"])
app.include_router(payments.router,   prefix="/payments",   tags=["Payments"])


@app.get("/health")
def health_check():
    """Lightweight liveness probe — used by Railway and uptime monitors."""
    return {"status": "ok", "service": "PathForge API"}


@app.get("/health/detailed")
def health_check_detailed():
    """Deep health check — verifies DB connectivity. Used for debugging only."""
    from database import supabase
    try:
        supabase.table("users").select("id").limit(1).execute()
        db_status = "ok"
    except Exception as e:
        db_status = f"error: {str(e)}"
    return {
        "status": "ok" if db_status == "ok" else "degraded",
        "service": "PathForge API",
        "db": db_status,
        "ai": "groq/llama-3.3-70b-versatile",
    }


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
