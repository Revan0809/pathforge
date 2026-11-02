import os, json, re
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List
from groq import Groq
from auth import verify_token, get_user_id
from database import supabase
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
MODEL = "llama-3.3-70b-versatile"


# ─── Helpers ──────────────────────────────────────────────────────────────────

def extract_json(text: str):
    """Extract JSON from LLM response even if wrapped in markdown code fences."""
    match = re.search(r"```(?:json)?\s*([\s\S]+?)```", text)
    if match:
        return json.loads(match.group(1))
    return json.loads(text)


# ─── GET /agent/checkin-questions ─────────────────────────────────────────────

@router.get("/checkin-questions")
def get_checkin_questions(payload: dict = Depends(verify_token)):
    user_id = get_user_id(payload)

    # Fetch user profile
    profile_result = supabase.table("users").select("name, target_role, streak").eq("id", user_id).single().execute()
    profile = profile_result.data or {}
    name = profile.get("name", "there")
    target_role = profile.get("target_role", "SDE")
    streak = profile.get("streak", 0)

    # Fetch last 7 days of activity
    week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    activity_result = supabase.table("activity_feed")\
        .select("action_type")\
        .eq("actor_id", user_id)\
        .gte("created_at", week_ago)\
        .execute()

    activity = activity_result.data or []
    dsa_solved = sum(1 for a in activity if a.get("action_type") == "dsa_solved")
    course_progress = sum(1 for a in activity if a.get("action_type") == "course_progress")
    task_completed = sum(1 for a in activity if a.get("action_type") == "task_completed")

    # Fetch latest roadmap plan and first 5 pending task titles
    plan_result = supabase.table("roadmap_plans")\
        .select("id")\
        .eq("user_id", user_id)\
        .order("generated_at", desc=True)\
        .limit(1)\
        .execute()

    pending_titles: List[str] = []
    if plan_result.data:
        plan_id = plan_result.data[0]["id"]
        tasks_result = supabase.table("roadmap_tasks")\
            .select("title")\
            .eq("plan_id", plan_id)\
            .eq("status", "pending")\
            .order("week_number")\
            .limit(5)\
            .execute()
        pending_titles = [t["title"] for t in (tasks_result.data or [])]

    # Build Groq prompt
    prompt = f"""You are a supportive AI career coach for PathForge.

Student details:
- Name: {name}
- Target role: {target_role}
- Current streak: {streak} days
- Last 7 days activity: {dsa_solved} DSA problems solved, {course_progress} course progress events, {task_completed} tasks completed
- Upcoming pending tasks: {', '.join(pending_titles) if pending_titles else 'none'}

Generate exactly 3 short, personalised check-in questions for this student's weekly Sunday reflection.
Questions should be warm, specific to their progress, and forward-looking.

Output ONLY a JSON array of 3 strings, no explanation, no markdown:
["question 1", "question 2", "question 3"]"""

    fallback_questions = [
        "How was your week overall?",
        "What got in your way this week?",
        "What do you want to focus on next week?",
    ]

    try:
        response = groq_client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=256,
        )
        raw = response.choices[0].message.content.strip()
        questions = extract_json(raw)
        if not isinstance(questions, list) or len(questions) != 3:
            raise ValueError("Expected a list of 3 questions")
    except Exception:
        questions = fallback_questions

    # Insert each question as a notification (silently swallow errors)
    for q in questions:
        try:
            supabase.table("notifications").insert({
                "user_id": user_id,
                "type": "checkin",
                "message": q,
                "read": False,
            }).execute()
        except Exception:
            pass

    return {"questions": questions}


# ─── POST /agent/submit-answers ───────────────────────────────────────────────

class CheckinAnswers(BaseModel):
    questions: List[str]
    answers: List[str]


@router.post("/submit-answers")
def submit_checkin_answers(body: CheckinAnswers, payload: dict = Depends(verify_token)):
    user_id = get_user_id(payload)

    # Fetch user profile
    profile_result = supabase.table("users").select("name, target_role").eq("id", user_id).single().execute()
    profile = profile_result.data or {}
    name = profile.get("name", "there")
    target_role = profile.get("target_role", "SDE")

    # Pair Q&A into a readable string
    qa_pairs = "\n".join(
        f"Q: {q}\nA: {a}"
        for q, a in zip(body.questions, body.answers)
    )

    # Fetch latest plan_id and pending tasks (limit 20, ordered by week_number)
    plan_result = supabase.table("roadmap_plans")\
        .select("id")\
        .eq("user_id", user_id)\
        .order("generated_at", desc=True)\
        .limit(1)\
        .execute()

    plan_id = None
    pending_tasks = []
    if plan_result.data:
        plan_id = plan_result.data[0]["id"]
        tasks_result = supabase.table("roadmap_tasks")\
            .select("id, title")\
            .eq("plan_id", plan_id)\
            .eq("status", "pending")\
            .order("week_number")\
            .limit(20)\
            .execute()
        pending_tasks = tasks_result.data or []

    pending_titles = [t["title"] for t in pending_tasks]

    # Build Groq prompt for re-prioritisation
    prompt = f"""You are PathForge's adaptive planning AI.

Student: {name} | Target role: {target_role}

Weekly check-in responses:
{qa_pairs}

Pending tasks in their roadmap:
{json.dumps(pending_titles, indent=2)}

Based on the student's reflections, identify which tasks should be prioritised for next week.
Return ONLY a JSON array of task titles (exactly as they appear above) that should be prioritised, no explanation:
["task title 1", "task title 2", ...]"""

    priority_titles: List[str] = []
    try:
        response = groq_client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.5,
            max_tokens=512,
        )
        raw = response.choices[0].message.content.strip()
        priority_titles = extract_json(raw)
        if not isinstance(priority_titles, list):
            priority_titles = []
    except Exception:
        priority_titles = []

    # Fuzzy-match pending tasks against priority titles and update status
    tasks_updated = 0
    updated_task_titles: List[str] = []

    for task in pending_tasks:
        task_title_lower = task["title"].lower()
        matched = any(
            p.lower() in task_title_lower or task_title_lower in p.lower()
            for p in priority_titles
        )
        if matched:
            try:
                supabase.table("roadmap_tasks")\
                    .update({"status": "prioritized"})\
                    .eq("id", task["id"])\
                    .execute()
                tasks_updated += 1
                updated_task_titles.append(task["title"])
            except Exception:
                pass

    # Insert agent_replan notification
    notification_message = (
        f"Your roadmap has been updated! {tasks_updated} task{'s' if tasks_updated != 1 else ''} "
        f"prioritised for this week."
    )
    try:
        supabase.table("notifications").insert({
            "user_id": user_id,
            "type": "agent_replan",
            "message": notification_message,
            "read": False,
        }).execute()
    except Exception:
        pass

    return {
        "message": notification_message,
        "priority_tasks": updated_task_titles,
        "tasks_updated": tasks_updated,
    }
