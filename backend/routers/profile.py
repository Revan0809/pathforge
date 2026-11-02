from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from auth import verify_token, get_user_id
from database import supabase

router = APIRouter()


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    college: Optional[str] = None
    branch: Optional[str] = None
    semester: Optional[int] = None
    target_role: Optional[str] = None
    target_companies: Optional[List[str]] = None
    current_skills: Optional[List[str]] = None
    college_tier: Optional[str] = None


@router.get("/me")
def get_profile(payload: dict = Depends(verify_token)):
    user_id = get_user_id(payload)
    result = supabase.table("users").select("*").eq("id", user_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="User not found")
    return result.data


@router.patch("/me")
def update_profile(updates: ProfileUpdate, payload: dict = Depends(verify_token)):
    user_id = get_user_id(payload)
    data = updates.model_dump(exclude_none=True)
    if not data:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = supabase.table("users").update(data).eq("id", user_id).execute()
    return result.data[0] if result.data else {}
