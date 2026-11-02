from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from auth import verify_token, get_user_id
from database import supabase

router = APIRouter()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def log_activity(user_id: str, action_type: str, metadata: dict):
    """Insert a row into activity_feed. Failures are silently swallowed so they
    never break the primary operation."""
    try:
        supabase.table("activity_feed").insert({
            "actor_id": user_id,
            "action_type": action_type,
            "metadata": metadata,
        }).execute()
    except Exception:
        pass


def _compute_progress_for_user(user_id: str, challenge_type: str, goal_value: float) -> float:
    """Return a 0–100 progress percentage for a single user/challenge type."""
    try:
        if challenge_type == "dsa_count":
            data = supabase.table("dsa_progress")\
                .select("id", count="exact")\
                .eq("user_id", user_id)\
                .eq("status", "solved")\
                .execute()
            solved = data.count or 0
            return min(100.0, (solved / max(goal_value, 1)) * 100)

        elif challenge_type == "course_percent":
            courses = supabase.table("courses")\
                .select("total_sections, completed_sections")\
                .eq("user_id", user_id)\
                .execute().data or []
            if not courses:
                return 0.0
            avg = sum(
                (c["completed_sections"] / max(c["total_sections"], 1)) for c in courses
            ) / len(courses) * 100
            return min(100.0, avg)

        elif challenge_type == "streak":
            user = supabase.table("users")\
                .select("streak")\
                .eq("id", user_id)\
                .single()\
                .execute().data or {}
            streak = user.get("streak") or 0
            return min(100.0, (streak / max(goal_value, 1)) * 100)

        elif challenge_type == "readiness_score":
            rows = supabase.table("readiness_scores")\
                .select("score")\
                .eq("user_id", user_id)\
                .order("calculated_at", desc=True)\
                .limit(1)\
                .execute().data or []
            score = rows[0]["score"] if rows else 0.0
            return min(100.0, (score / max(goal_value, 1)) * 100)

    except Exception:
        pass

    return 0.0


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

class ChallengeCreate(BaseModel):
    title: str
    type: str  # 'dsa_count' | 'course_percent' | 'readiness_score' | 'streak'
    goal_value: float
    deadline: str  # ISO date string
    invite_user_ids: Optional[List[str]] = []


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/create")
def create_challenge(challenge: ChallengeCreate, payload: dict = Depends(verify_token)):
    user_id = get_user_id(payload)

    # Create challenge
    ch_result = supabase.table("challenges").insert({
        "creator_id": user_id,
        "title": challenge.title,
        "type": challenge.type,
        "goal_value": challenge.goal_value,
        "deadline": challenge.deadline,
        "status": "active",
    }).execute()

    if not ch_result.data:
        raise HTTPException(status_code=500, detail="Failed to create challenge")

    challenge_id = ch_result.data[0]["id"]

    # Add creator as participant
    participants = [{"challenge_id": challenge_id, "user_id": user_id}]
    # Add invited users
    for invited_id in (challenge.invite_user_ids or []):
        participants.append({"challenge_id": challenge_id, "user_id": invited_id})

    supabase.table("challenge_participants").insert(participants).execute()

    # Notify invited users
    for invited_id in (challenge.invite_user_ids or []):
        supabase.table("notifications").insert({
            "user_id": invited_id,
            "type": "challenge",
            "message": f"You've been invited to a challenge: {challenge.title}",
        }).execute()

    # Log activity
    log_activity(user_id, "challenge_created", {"title": challenge.title})

    return ch_result.data[0]


@router.get("/active")
def get_active_challenges(payload: dict = Depends(verify_token)):
    """Return challenges the user participates in with nested participant list and my_progress."""
    user_id = get_user_id(payload)

    # Get all challenge_ids for this user
    participation = supabase.table("challenge_participants")\
        .select("challenge_id, progress, completed")\
        .eq("user_id", user_id)\
        .execute().data or []

    if not participation:
        return []

    challenge_ids = [p["challenge_id"] for p in participation]
    my_progress_map = {p["challenge_id"]: p for p in participation}

    # Fetch challenge details
    challenges_data = supabase.table("challenges")\
        .select("*")\
        .in_("id", challenge_ids)\
        .eq("status", "active")\
        .execute().data or []

    result = []
    for ch in challenges_data:
        cid = ch["id"]

        # Fetch all participants for this challenge with user info
        parts = supabase.table("challenge_participants")\
            .select("user_id, progress, completed, users!challenge_participants_user_id_fkey(name, xp)")\
            .eq("challenge_id", cid)\
            .execute().data or []

        participants = []
        for p in parts:
            user_info = p.get("users") or {}
            participants.append({
                "user_id": p["user_id"],
                "progress": p["progress"],
                "completed": p["completed"],
                "name": user_info.get("name"),
                "xp": user_info.get("xp"),
            })

        my_rec = my_progress_map.get(cid, {})
        result.append({
            "challenge": ch,
            "participants": participants,
            "my_progress": my_rec.get("progress", 0.0),
        })

    return result


@router.post("/{challenge_id}/join")
def join_challenge(challenge_id: str, payload: dict = Depends(verify_token)):
    """Join a challenge the user was invited to but hasn't joined yet."""
    user_id = get_user_id(payload)

    # Verify challenge exists and is active
    ch = supabase.table("challenges")\
        .select("id, title, status")\
        .eq("id", challenge_id)\
        .single()\
        .execute().data

    if not ch:
        raise HTTPException(status_code=404, detail="Challenge not found")
    if ch.get("status") != "active":
        raise HTTPException(status_code=400, detail="Challenge is no longer active")

    # Check if already a participant
    existing = supabase.table("challenge_participants")\
        .select("id")\
        .eq("challenge_id", challenge_id)\
        .eq("user_id", user_id)\
        .execute().data

    if existing:
        raise HTTPException(status_code=400, detail="Already a participant in this challenge")

    result = supabase.table("challenge_participants").insert({
        "challenge_id": challenge_id,
        "user_id": user_id,
        "progress": 0.0,
        "completed": False,
    }).execute()

    # Log activity
    log_activity(user_id, "challenge_joined", {"title": ch.get("title"), "challenge_id": challenge_id})

    return result.data[0] if result.data else {}


@router.get("/leaderboard/{challenge_id}")
def get_challenge_leaderboard(challenge_id: str, payload: dict = Depends(verify_token)):
    """Return participants sorted by progress descending with rank."""
    # Verify challenge exists
    ch = supabase.table("challenges")\
        .select("id, title, type, goal_value")\
        .eq("id", challenge_id)\
        .single()\
        .execute().data

    if not ch:
        raise HTTPException(status_code=404, detail="Challenge not found")

    parts = supabase.table("challenge_participants")\
        .select("user_id, progress, completed, users!challenge_participants_user_id_fkey(name, college, xp)")\
        .eq("challenge_id", challenge_id)\
        .order("progress", desc=True)\
        .execute().data or []

    leaderboard = []
    for rank, p in enumerate(parts, start=1):
        user_info = p.get("users") or {}
        leaderboard.append({
            "rank": rank,
            "user_id": p["user_id"],
            "name": user_info.get("name"),
            "college": user_info.get("college"),
            "xp": user_info.get("xp"),
            "progress": p["progress"],
            "completed": p["completed"],
        })

    return {"challenge": ch, "leaderboard": leaderboard}


@router.patch("/{challenge_id}/progress")
def update_challenge_progress(challenge_id: str, progress: float, payload: dict = Depends(verify_token)):
    user_id = get_user_id(payload)
    result = supabase.table("challenge_participants")\
        .update({"progress": progress})\
        .eq("challenge_id", challenge_id)\
        .eq("user_id", user_id)\
        .execute()
    return result.data[0] if result.data else {}


@router.post("/update-all-progress")
def update_all_progress(payload: dict = Depends(verify_token)):
    """Auto-compute and persist progress for every active challenge the user participates in.
    Intended to be called on page load from the frontend."""
    user_id = get_user_id(payload)

    # Get user's active participations with challenge details
    participation = supabase.table("challenge_participants")\
        .select("challenge_id, challenges!challenge_participants_challenge_id_fkey(type, goal_value, status)")\
        .eq("user_id", user_id)\
        .execute().data or []

    updated = []
    for p in participation:
        ch = p.get("challenges") or {}
        if ch.get("status") != "active":
            continue

        challenge_id = p["challenge_id"]
        challenge_type = ch.get("type")
        goal_value = float(ch.get("goal_value") or 1)

        progress = _compute_progress_for_user(user_id, challenge_type, goal_value)
        completed = progress >= 100.0

        supabase.table("challenge_participants")\
            .update({"progress": round(progress, 2), "completed": completed})\
            .eq("challenge_id", challenge_id)\
            .eq("user_id", user_id)\
            .execute()

        updated.append({
            "challenge_id": challenge_id,
            "progress": round(progress, 2),
            "completed": completed,
        })

    return {"updated": updated}
