from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from auth import verify_token, get_user_id
from database import supabase

router = APIRouter()


class ProgressUpdate(BaseModel):
    problem_id: str
    status: str  # 'solved' | 'skip' | 'revisit'


@router.get("/sheets")
def get_sheets():
    result = supabase.table("dsa_sheets").select("*").execute()
    return result.data


@router.get("/sheets/{sheet_id}/problems")
def get_problems(sheet_id: str, topic: Optional[str] = None):
    query = supabase.table("dsa_problems").select("*").eq("sheet_id", sheet_id).order("order_index")
    if topic:
        query = query.eq("topic", topic)
    return query.execute().data


@router.get("/my-progress")
def get_my_progress(sheet_id: Optional[str] = None, payload: dict = Depends(verify_token)):
    user_id = get_user_id(payload)
    query = supabase.table("dsa_progress")\
        .select("*, dsa_problems(title, topic, difficulty, sheet_id)")\
        .eq("user_id", user_id)
    if sheet_id:
        # Filter by sheet via join
        query = query.eq("dsa_problems.sheet_id", sheet_id)
    return query.execute().data


@router.post("/progress")
def update_progress(update: ProgressUpdate, payload: dict = Depends(verify_token)):
    user_id = get_user_id(payload)
    if update.status not in ("solved", "skip", "revisit"):
        raise HTTPException(status_code=400, detail="Invalid status")

    # Upsert progress
    result = supabase.table("dsa_progress").upsert({
        "user_id": user_id,
        "problem_id": update.problem_id,
        "status": update.status,
    }, on_conflict="user_id,problem_id").execute()

    # Award XP if solved
    if update.status == "solved":
        # Increment XP by 10
        supabase.rpc("increment_xp", {"p_user_id": user_id, "p_amount": 10}).execute()
        # Log to activity feed
        supabase.table("activity_feed").insert({
            "actor_id": user_id,
            "action_type": "dsa_solved",
            "metadata_json": {"problem_id": update.problem_id}
        }).execute()

    return result.data[0] if result.data else {}


@router.get("/stats")
def get_dsa_stats(payload: dict = Depends(verify_token)):
    user_id = get_user_id(payload)

    # Get all solved problems with topic info
    result = supabase.table("dsa_progress")\
        .select("status, dsa_problems(topic, difficulty)")\
        .eq("user_id", user_id)\
        .execute()

    stats: dict = {"total_solved": 0, "total_skipped": 0, "total_revisit": 0, "by_topic": {}, "by_difficulty": {}}
    for row in result.data:
        s = row["status"]
        if s == "solved":
            stats["total_solved"] += 1
        elif s == "skip":
            stats["total_skipped"] += 1
        elif s == "revisit":
            stats["total_revisit"] += 1

        prob = row.get("dsa_problems", {})
        topic = prob.get("topic", "Unknown")
        diff = prob.get("difficulty", "Unknown")

        stats["by_topic"].setdefault(topic, {"solved": 0, "skip": 0, "revisit": 0})
        stats["by_difficulty"].setdefault(diff, {"solved": 0})
        if s == "solved":
            stats["by_topic"][topic]["solved"] += 1
            stats["by_difficulty"][diff]["solved"] += 1
        elif s == "skip":
            stats["by_topic"][topic]["skip"] += 1
        elif s == "revisit":
            stats["by_topic"][topic]["revisit"] += 1

    return stats
