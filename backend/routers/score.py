from fastapi import APIRouter, Depends
from auth import verify_token, get_user_id
from database import supabase
from datetime import datetime, timezone

router = APIRouter()

# Role-specific weights
ROLE_WEIGHTS = {
    "SDE":            {"dsa": 0.35, "cgpa": 0.20, "courses": 0.20, "projects": 0.15, "aptitude": 0.10},
    "ML Engineer":    {"dsa": 0.20, "cgpa": 0.20, "courses": 0.30, "projects": 0.20, "aptitude": 0.10},
    "Data Analyst":   {"dsa": 0.15, "cgpa": 0.20, "courses": 0.25, "projects": 0.25, "aptitude": 0.15},
    "DevOps":         {"dsa": 0.20, "cgpa": 0.15, "courses": 0.30, "projects": 0.25, "aptitude": 0.10},
    "Product Manager":{"dsa": 0.10, "cgpa": 0.20, "courses": 0.25, "projects": 0.25, "aptitude": 0.20},
    "default":        {"dsa": 0.30, "cgpa": 0.20, "courses": 0.20, "projects": 0.15, "aptitude": 0.15},
}


@router.post("/calculate")
def calculate_readiness_score(payload: dict = Depends(verify_token)):
    user_id = get_user_id(payload)

    # Fetch user profile
    user = supabase.table("users").select("cgpa, target_role").eq("id", user_id).single().execute().data
    if not user:
        return {"score": 0, "error": "User not found"}

    weights = ROLE_WEIGHTS.get(user.get("target_role", ""), ROLE_WEIGHTS["default"])

    # --- DSA score (0-100) ---
    # Based on how many problems solved vs 150 target
    dsa_data = supabase.table("dsa_progress").select("id", count="exact").eq("user_id", user_id).eq("status", "solved").execute()
    dsa_solved = dsa_data.count or 0
    dsa_score = min(100, (dsa_solved / 150) * 100)

    # --- CGPA score (0-100) ---
    cgpa = float(user.get("cgpa") or 0)
    cgpa_score = min(100, (cgpa / 10) * 100)  # Assumes 10-point scale

    # --- Course score (0-100) ---
    courses = supabase.table("courses").select("total_sections, completed_sections").eq("user_id", user_id).execute().data or []
    if courses:
        course_completion = sum(
            (c["completed_sections"] / max(c["total_sections"], 1)) for c in courses
        ) / len(courses) * 100
        course_score = min(100, course_completion)
    else:
        course_score = 0

    # --- Project score (placeholder — Phase 6 adds portfolio analyser) ---
    project_score = 0

    # --- Aptitude score (placeholder) ---
    aptitude_score = 0

    # --- Weighted total ---
    total = (
        dsa_score    * weights["dsa"] +
        cgpa_score   * weights["cgpa"] +
        course_score * weights["courses"] +
        project_score * weights["projects"] +
        aptitude_score * weights["aptitude"]
    )

    score_record = {
        "user_id": user_id,
        "score": round(total, 2),
        "cgpa_score": round(cgpa_score, 2),
        "dsa_score": round(dsa_score, 2),
        "course_score": round(course_score, 2),
        "project_score": round(project_score, 2),
        "aptitude_score": round(aptitude_score, 2),
        "calculated_at": datetime.now(timezone.utc).isoformat(),
    }

    # Upsert — one row per user, updated in place (prevents unbounded table growth)
    supabase.table("readiness_scores").upsert(
        score_record,
        on_conflict="user_id"
    ).execute()

    return score_record


@router.get("/leaderboard")
def get_score_leaderboard(payload: dict = Depends(verify_token)):
    """Return the top-10 leaderboard among the current user and their accepted friends,
    ranked by latest readiness score (falls back to XP when no score exists)."""
    user_id = get_user_id(payload)

    # Collect current user + accepted friends
    friends = supabase.table("friendships")\
        .select("friend_id")\
        .eq("user_id", user_id)\
        .eq("status", "accepted")\
        .execute().data or []

    peer_ids = [f["friend_id"] for f in friends] + [user_id]

    # Fetch basic profile for all peers
    users_data = supabase.table("users")\
        .select("id, name, college, xp, streak")\
        .in_("id", peer_ids)\
        .execute().data or []

    # Fetch latest readiness score per user
    # We pull all recent rows and keep only the latest per user_id
    scores_data = supabase.table("readiness_scores")\
        .select("user_id, score, calculated_at")\
        .in_("user_id", peer_ids)\
        .order("calculated_at", desc=True)\
        .execute().data or []

    latest_score: dict = {}
    for row in scores_data:
        uid = row["user_id"]
        if uid not in latest_score:
            latest_score[uid] = row["score"]

    # Build enriched list and sort
    enriched = []
    for u in users_data:
        uid = u["id"]
        score = latest_score.get(uid)
        sort_key = score if score is not None else -1  # users with no score sort below scored ones
        enriched.append({
            "user_id": uid,
            "name": u.get("name"),
            "college": u.get("college"),
            "xp": u.get("xp") or 0,
            "streak": u.get("streak") or 0,
            "readiness_score": score,
            "_sort_key": sort_key,
        })

    # Sort: primary by readiness score desc, secondary by xp desc
    enriched.sort(key=lambda x: (x["_sort_key"], x["xp"]), reverse=True)

    # Take top 10 and assign rank
    top10 = []
    for rank, entry in enumerate(enriched[:10], start=1):
        entry.pop("_sort_key")
        entry["rank"] = rank
        top10.append(entry)

    return top10
