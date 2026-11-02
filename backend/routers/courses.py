from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from auth import verify_token, get_user_id
from database import supabase
from datetime import datetime, timezone, timedelta

router = APIRouter()


class CourseCreate(BaseModel):
    name: str
    url: Optional[str] = None
    platform: Optional[str] = None
    total_sections: int


class CourseProgressUpdate(BaseModel):
    completed_sections: int


def build_course_response(course: dict) -> dict:
    """
    Enrich a raw courses row with computed fields:
    - is_stale: bool
    - days_since_update: int
    - estimated_finish: str | None (ISO date)
    """
    now = datetime.now(timezone.utc)

    # Parse last_updated; fall back to created_at if missing
    last_updated_raw = course.get("last_updated") or course.get("created_at")
    if last_updated_raw:
        last_updated = datetime.fromisoformat(last_updated_raw.replace("Z", "+00:00"))
    else:
        last_updated = now

    days_since_update = (now - last_updated).days
    total = course.get("total_sections", 0)
    completed = course.get("completed_sections", 0)

    is_stale = (days_since_update >= 5) and (completed < total)

    # Estimated finish
    velocity = course.get("velocity") or 0.0
    if velocity > 0 and completed < total:
        remaining = total - completed
        estimated_days = remaining / velocity
        estimated_finish = (now + timedelta(days=estimated_days)).date().isoformat()
    else:
        estimated_finish = None

    return {
        **course,
        "velocity": round(velocity, 2),
        "is_stale": is_stale,
        "days_since_update": days_since_update,
        "estimated_finish": estimated_finish,
    }


@router.get("/")
def get_courses(payload: dict = Depends(verify_token)):
    user_id = get_user_id(payload)
    rows = (
        supabase.table("courses")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
        .data
    )
    return [build_course_response(row) for row in rows]


@router.post("/")
def add_course(course: CourseCreate, payload: dict = Depends(verify_token)):
    user_id = get_user_id(payload)
    now_iso = datetime.now(timezone.utc).isoformat()
    result = (
        supabase.table("courses")
        .insert(
            {
                "user_id": user_id,
                "name": course.name,
                "url": course.url,
                "platform": course.platform,
                "total_sections": course.total_sections,
                "completed_sections": 0,
                "velocity": 0.0,
                "last_updated": now_iso,
            }
        )
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to insert course")
    return build_course_response(result.data[0])


@router.patch("/{course_id}/progress")
def update_course_progress(
    course_id: str,
    update: CourseProgressUpdate,
    payload: dict = Depends(verify_token),
):
    user_id = get_user_id(payload)

    # Fetch existing record to verify ownership and get current values
    existing_resp = (
        supabase.table("courses")
        .select("*")
        .eq("id", course_id)
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    if not existing_resp.data:
        raise HTTPException(status_code=404, detail="Course not found")

    existing = existing_resp.data
    total = existing["total_sections"]
    old_completed = existing.get("completed_sections", 0)

    # Clamp new value to valid range
    new_completed = min(max(update.completed_sections, 0), total)

    # --- Velocity calculation ---
    now = datetime.now(timezone.utc)
    last_updated_raw = existing.get("last_updated") or existing.get("created_at")
    if last_updated_raw:
        last_updated = datetime.fromisoformat(last_updated_raw.replace("Z", "+00:00"))
    else:
        last_updated = now

    days_since_last_update = max((now - last_updated).days, 1)
    sections_delta = new_completed - old_completed
    new_velocity = round(sections_delta / days_since_last_update, 2)

    # Keep the existing velocity if no progress was made (or negative delta)
    if sections_delta <= 0:
        new_velocity = existing.get("velocity") or 0.0

    now_iso = now.isoformat()

    result = (
        supabase.table("courses")
        .update(
            {
                "completed_sections": new_completed,
                "velocity": new_velocity,
                "last_updated": now_iso,
            }
        )
        .eq("id", course_id)
        .eq("user_id", user_id)
        .execute()
    )

    # --- Award XP for newly completed sections ---
    newly_completed = max(sections_delta, 0)
    if newly_completed > 0:
        xp_amount = newly_completed * 25
        try:
            supabase.rpc(
                "increment_xp",
                {"p_user_id": user_id, "p_amount": xp_amount},
            ).execute()
        except Exception:
            # Non-fatal: XP award failure should not block the update response
            pass

        # Log to activity feed
        try:
            supabase.table("activity_feed").insert(
                {
                    "actor_id": user_id,
                    "action_type": "course_progress",
                    "metadata_json": {
                        "course_id": course_id,
                        "completed_sections": new_completed,
                        "xp_awarded": xp_amount,
                    },
                }
            ).execute()
        except Exception:
            pass

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to update course")
    return build_course_response(result.data[0])


DEMO_COURSES = [
    {
        "name": "Striver's A2Z DSA Course",
        "url": "https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2/",
        "platform": "Other",
        "total_sections": 20,
        "completed_sections": 7,
        "velocity": 0.8,
    },
    {
        "name": "The Complete React Developer (Udemy)",
        "url": "https://www.udemy.com/course/complete-react-developer-zero-to-mastery/",
        "platform": "Udemy",
        "total_sections": 30,
        "completed_sections": 12,
        "velocity": 1.2,
    },
    {
        "name": "Andrew Ng Machine Learning Specialization",
        "url": "https://www.coursera.org/specializations/machine-learning-introduction",
        "platform": "Coursera",
        "total_sections": 24,
        "completed_sections": 4,
        "velocity": 0.4,
    },
]


@router.post("/seed-demo")
def seed_demo_courses(payload: dict = Depends(verify_token)):
    """Seed 3 realistic demo courses for a user who has none. Idempotent."""
    user_id = get_user_id(payload)

    # Only seed if user has no courses yet
    existing = supabase.table("courses").select("id", count="exact").eq("user_id", user_id).execute()
    if (existing.count or 0) > 0:
        return {"seeded": 0, "message": "Already has courses"}

    now_iso = datetime.now(timezone.utc).isoformat()
    created = []
    for demo in DEMO_COURSES:
        result = supabase.table("courses").insert({
            "user_id": user_id,
            "name": demo["name"],
            "url": demo["url"],
            "platform": demo["platform"],
            "total_sections": demo["total_sections"],
            "completed_sections": demo["completed_sections"],
            "velocity": demo["velocity"],
            "last_updated": now_iso,
        }).execute()
        if result.data:
            created.append(build_course_response(result.data[0]))

    return {"seeded": len(created), "courses": created}


@router.delete("/{course_id}")
def delete_course(course_id: str, payload: dict = Depends(verify_token)):
    user_id = get_user_id(payload)
    # Verify ownership before deleting
    existing = (
        supabase.table("courses")
        .select("id")
        .eq("id", course_id)
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="Course not found")

    supabase.table("courses").delete().eq("id", course_id).eq(
        "user_id", user_id
    ).execute()
    return {"deleted": True, "course_id": course_id}
