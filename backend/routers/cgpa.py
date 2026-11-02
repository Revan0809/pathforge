from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
from auth import verify_token, get_user_id
from database import supabase

router = APIRouter()

# ---------------------------------------------------------------------------
# Grade → grade_points mapping (standard Indian 10-point grading system)
# ---------------------------------------------------------------------------
GRADE_POINTS_MAP = {
    "O":  10,
    "A+": 9,
    "A":  8,
    "B+": 7,
    "B":  6,
    "C":  5,
    "P":  4,
    "F":  0,
}

# ---------------------------------------------------------------------------
# Company CGPA cutoffs (hardcoded)
# ---------------------------------------------------------------------------
CUTOFFS = {
    "Google":     7.5,
    "Microsoft":  7.0,
    "Amazon":     6.0,
    "Flipkart":   6.5,
    "Infosys":    6.0,
    "TCS":        6.0,
    "Wipro":      6.0,
    "Cognizant":  6.5,
    "HCL":        6.0,
    "Accenture":  6.5,
    "Capgemini":  6.0,
    "IBM":        6.5,
    "Zoho":       7.0,
    "Freshworks": 7.0,
    "Swiggy":     7.0,
    "PhonePe":    7.5,
    "Paytm":      6.5,
    "Ola":        7.0,
}


# ---------------------------------------------------------------------------
# Pydantic request models
# ---------------------------------------------------------------------------

class SemesterCreate(BaseModel):
    semester_number: int = Field(..., ge=1, le=12)
    year: int = Field(..., ge=2000, le=2100)


class SubjectCreate(BaseModel):
    semester_id: str
    name: str
    credits: float = Field(..., gt=0)
    grade: Optional[str] = None          # e.g. "A+", "O" — optional if grade_points given directly
    grade_points: Optional[float] = Field(None, ge=0, le=10)


class SimulateSubject(BaseModel):
    credits: float = Field(..., gt=0)
    grade_points: Optional[float] = Field(None, ge=0, le=10)  # None = unknown (what we're solving for)


class SimulateRequest(BaseModel):
    target_cgpa: float = Field(..., ge=0, le=10)
    current_subjects: List[SimulateSubject]  # subjects planned for this semester


# ---------------------------------------------------------------------------
# Helper: compute CGPA from a flat list of {credits, grade_points} dicts
# ---------------------------------------------------------------------------
def _compute_cgpa(subjects: list) -> float:
    total_credits = sum(s["credits"] for s in subjects if s.get("grade_points") is not None)
    total_weighted = sum(s["credits"] * s["grade_points"] for s in subjects if s.get("grade_points") is not None)
    if total_credits == 0:
        return 0.0
    return round(total_weighted / total_credits, 4)


# ---------------------------------------------------------------------------
# Semester endpoints
# ---------------------------------------------------------------------------

@router.get("/semesters")
def list_semesters(payload: dict = Depends(verify_token)):
    """List all semesters for the authenticated user, each with its subjects."""
    user_id = get_user_id(payload)

    semesters = supabase.table("cgpa_semesters") \
        .select("*") \
        .eq("user_id", user_id) \
        .order("semester_number") \
        .execute().data or []

    if not semesters:
        return []

    semester_ids = [s["id"] for s in semesters]
    subjects_result = supabase.table("cgpa_subjects") \
        .select("*") \
        .in_("semester_id", semester_ids) \
        .execute().data or []

    # Group subjects by semester_id
    subjects_by_semester: dict = {}
    for subj in subjects_result:
        subjects_by_semester.setdefault(subj["semester_id"], []).append(subj)

    for sem in semesters:
        sem["subjects"] = subjects_by_semester.get(sem["id"], [])
        # Compute per-semester GPA
        sem["sgpa"] = _compute_cgpa(sem["subjects"])

    return semesters


@router.post("/semesters", status_code=201)
def add_semester(body: SemesterCreate, payload: dict = Depends(verify_token)):
    """Create a new semester record for the authenticated user."""
    user_id = get_user_id(payload)

    # Prevent duplicate semester numbers for the same user
    existing = supabase.table("cgpa_semesters") \
        .select("id") \
        .eq("user_id", user_id) \
        .eq("semester_number", body.semester_number) \
        .execute().data

    if existing:
        raise HTTPException(
            status_code=409,
            detail=f"Semester {body.semester_number} already exists for this user."
        )

    result = supabase.table("cgpa_semesters").insert({
        "user_id": user_id,
        "semester_number": body.semester_number,
        "year": body.year,
    }).execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create semester.")

    return result.data[0]


@router.delete("/semesters/{semester_id}", status_code=200)
def delete_semester(semester_id: str, payload: dict = Depends(verify_token)):
    """Delete a semester and all its subjects (cascade)."""
    user_id = get_user_id(payload)

    # Verify ownership
    sem = supabase.table("cgpa_semesters") \
        .select("id") \
        .eq("id", semester_id) \
        .eq("user_id", user_id) \
        .execute().data

    if not sem:
        raise HTTPException(status_code=404, detail="Semester not found.")

    # Delete subjects first (cascade manually in case DB FK cascade is not set)
    supabase.table("cgpa_subjects").delete().eq("semester_id", semester_id).execute()

    # Delete semester
    supabase.table("cgpa_semesters").delete().eq("id", semester_id).execute()

    return {"deleted": True, "semester_id": semester_id}


# ---------------------------------------------------------------------------
# Subject endpoints
# ---------------------------------------------------------------------------

@router.get("/semesters/{semester_id}/subjects")
def list_subjects(semester_id: str, payload: dict = Depends(verify_token)):
    """List all subjects belonging to a semester owned by the authenticated user."""
    user_id = get_user_id(payload)

    # Verify semester ownership
    sem = supabase.table("cgpa_semesters") \
        .select("id") \
        .eq("id", semester_id) \
        .eq("user_id", user_id) \
        .execute().data

    if not sem:
        raise HTTPException(status_code=404, detail="Semester not found.")

    subjects = supabase.table("cgpa_subjects") \
        .select("*") \
        .eq("semester_id", semester_id) \
        .execute().data or []

    return subjects


@router.post("/subjects", status_code=201)
def add_subject(body: SubjectCreate, payload: dict = Depends(verify_token)):
    """Add a subject to an existing semester."""
    user_id = get_user_id(payload)

    # Verify semester ownership
    sem = supabase.table("cgpa_semesters") \
        .select("id") \
        .eq("id", body.semester_id) \
        .eq("user_id", user_id) \
        .execute().data

    if not sem:
        raise HTTPException(status_code=404, detail="Semester not found or access denied.")

    # Resolve grade_points from grade string if not explicitly provided
    grade_points = body.grade_points
    if grade_points is None and body.grade:
        grade_upper = body.grade.strip().upper()
        if grade_upper not in GRADE_POINTS_MAP:
            raise HTTPException(
                status_code=400,
                detail=f"Unknown grade '{body.grade}'. Valid grades: {list(GRADE_POINTS_MAP.keys())}"
            )
        grade_points = float(GRADE_POINTS_MAP[grade_upper])

    result = supabase.table("cgpa_subjects").insert({
        "semester_id": body.semester_id,
        "name": body.name,
        "credits": body.credits,
        "grade": body.grade,
        "grade_points": grade_points,
    }).execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create subject.")

    return result.data[0]


@router.delete("/subjects/{subject_id}", status_code=200)
def delete_subject(subject_id: str, payload: dict = Depends(verify_token)):
    """Delete a subject by ID (verifies ownership via semester → user chain)."""
    user_id = get_user_id(payload)

    # Verify subject exists and belongs to the user
    subject = supabase.table("cgpa_subjects") \
        .select("id, semester_id") \
        .eq("id", subject_id) \
        .execute().data

    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found.")

    semester_id = subject[0]["semester_id"]
    sem = supabase.table("cgpa_semesters") \
        .select("id") \
        .eq("id", semester_id) \
        .eq("user_id", user_id) \
        .execute().data

    if not sem:
        raise HTTPException(status_code=403, detail="Access denied.")

    supabase.table("cgpa_subjects").delete().eq("id", subject_id).execute()

    return {"deleted": True, "subject_id": subject_id}


# ---------------------------------------------------------------------------
# CGPA calculation
# ---------------------------------------------------------------------------

@router.get("/calculate")
def calculate_cgpa(payload: dict = Depends(verify_token)):
    """
    Calculate cumulative CGPA across all semesters using the credit-weighted formula:
        CGPA = sum(grade_points * credits) / sum(credits)
    Only subjects with grade_points already assigned are included.
    """
    user_id = get_user_id(payload)

    # Fetch all semesters owned by user
    semesters = supabase.table("cgpa_semesters") \
        .select("id, semester_number, year") \
        .eq("user_id", user_id) \
        .order("semester_number") \
        .execute().data or []

    if not semesters:
        return {
            "cgpa": 0.0,
            "total_credits": 0,
            "total_subjects": 0,
            "semester_count": 0,
            "semester_breakdown": [],
        }

    semester_ids = [s["id"] for s in semesters]
    all_subjects = supabase.table("cgpa_subjects") \
        .select("semester_id, credits, grade_points") \
        .in_("semester_id", semester_ids) \
        .execute().data or []

    # Filter to only graded subjects
    graded = [s for s in all_subjects if s.get("grade_points") is not None]

    total_credits = sum(s["credits"] for s in graded)
    total_weighted = sum(s["credits"] * s["grade_points"] for s in graded)
    cgpa = round(total_weighted / total_credits, 4) if total_credits > 0 else 0.0

    # Per-semester breakdown
    subj_by_sem: dict = {}
    for s in graded:
        subj_by_sem.setdefault(s["semester_id"], []).append(s)

    breakdown = []
    for sem in semesters:
        sem_subjects = subj_by_sem.get(sem["id"], [])
        breakdown.append({
            "semester_id": sem["id"],
            "semester_number": sem["semester_number"],
            "year": sem["year"],
            "sgpa": _compute_cgpa(sem_subjects),
            "credits": sum(s["credits"] for s in sem_subjects),
            "subjects_graded": len(sem_subjects),
        })

    return {
        "cgpa": cgpa,
        "total_credits": total_credits,
        "total_subjects": len(graded),
        "semester_count": len(semesters),
        "semester_breakdown": breakdown,
    }


# ---------------------------------------------------------------------------
# CGPA simulator
# ---------------------------------------------------------------------------

@router.post("/simulate")
def simulate_cgpa(body: SimulateRequest, payload: dict = Depends(verify_token)):
    """
    Given a target CGPA and the subjects planned for this semester
    (some may already have grade_points, others unknown), calculate
    the minimum average grade_points needed on the unknown subjects
    to reach the target CGPA.

    Formula derivation:
        target = (past_weighted + known_this_sem_weighted + needed_gp * unknown_credits)
                 / (past_credits + all_this_sem_credits)

        => needed_gp = (target * total_credits - past_weighted - known_this_sem_weighted)
                       / unknown_credits
    """
    user_id = get_user_id(payload)

    # Pull all past graded subjects from DB
    semesters = supabase.table("cgpa_semesters") \
        .select("id") \
        .eq("user_id", user_id) \
        .execute().data or []

    past_weighted = 0.0
    past_credits = 0.0

    if semesters:
        semester_ids = [s["id"] for s in semesters]
        past_subjects = supabase.table("cgpa_subjects") \
            .select("credits, grade_points") \
            .in_("semester_id", semester_ids) \
            .execute().data or []

        for s in past_subjects:
            if s.get("grade_points") is not None:
                past_weighted += s["credits"] * s["grade_points"]
                past_credits += s["credits"]

    # Separate this semester's subjects into known and unknown
    known_weighted = 0.0
    known_credits = 0.0
    unknown_credits = 0.0

    for subj in body.current_subjects:
        if subj.grade_points is not None:
            known_weighted += subj.credits * subj.grade_points
            known_credits += subj.credits
        else:
            unknown_credits += subj.credits

    all_credits = past_credits + known_credits + unknown_credits

    if all_credits == 0:
        return {
            "needed_grade_points": None,
            "achievable": False,
            "message": "No subjects found — cannot simulate.",
        }

    if unknown_credits == 0:
        # All grades known — just compute final CGPA
        final_cgpa = (past_weighted + known_weighted) / all_credits
        return {
            "needed_grade_points": None,
            "achievable": True,
            "message": f"All grades known. Projected CGPA: {round(final_cgpa, 4)}",
            "projected_cgpa": round(final_cgpa, 4),
        }

    # Solve for needed_gp
    needed_gp = (
        body.target_cgpa * all_credits - past_weighted - known_weighted
    ) / unknown_credits

    needed_gp = round(needed_gp, 4)
    achievable = 0.0 <= needed_gp <= 10.0

    if needed_gp < 0:
        message = (
            f"Target CGPA of {body.target_cgpa} is already achievable even with 0 grade points "
            f"on remaining subjects."
        )
    elif needed_gp > 10:
        message = (
            f"Target CGPA of {body.target_cgpa} is not achievable. "
            f"You would need {needed_gp} grade points (max is 10)."
        )
    else:
        # Map needed_gp to nearest grade label
        nearest_grade = min(GRADE_POINTS_MAP, key=lambda g: abs(GRADE_POINTS_MAP[g] - needed_gp))
        message = (
            f"You need an average of {needed_gp} grade points on your remaining "
            f"{unknown_credits} credits (~'{nearest_grade}' grade) to reach a CGPA of {body.target_cgpa}."
        )

    return {
        "needed_grade_points": needed_gp,
        "achievable": achievable,
        "message": message,
        "target_cgpa": body.target_cgpa,
        "past_credits": past_credits,
        "unknown_credits": unknown_credits,
        "total_credits_after_semester": all_credits,
    }


# ---------------------------------------------------------------------------
# Company cutoffs
# ---------------------------------------------------------------------------

@router.get("/cutoffs")
def get_cutoffs(payload: dict = Depends(verify_token)):
    """
    Return hardcoded company CGPA cutoffs.
    Optionally compares authenticated user's current CGPA against each cutoff.
    """
    user_id = get_user_id(payload)

    # Fetch user's current stored CGPA (populated by profile or score endpoints)
    user = supabase.table("users") \
        .select("cgpa") \
        .eq("id", user_id) \
        .single() \
        .execute().data

    user_cgpa = float(user.get("cgpa") or 0) if user else 0.0

    result = []
    for company, cutoff in sorted(CUTOFFS.items(), key=lambda x: x[0]):
        result.append({
            "company": company,
            "cutoff": cutoff,
            "eligible": user_cgpa >= cutoff,
            "gap": round(cutoff - user_cgpa, 4) if user_cgpa < cutoff else 0.0,
        })

    return {
        "user_cgpa": user_cgpa,
        "cutoffs": result,
        "eligible_count": sum(1 for r in result if r["eligible"]),
        "total_companies": len(result),
    }
