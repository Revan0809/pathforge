from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from auth import verify_token, get_user_id
from database import supabase

router = APIRouter()


class FriendRequest(BaseModel):
    friend_id: str


class SearchRequest(BaseModel):
    q: str


@router.post("/request")
def send_friend_request(req: FriendRequest, payload: dict = Depends(verify_token)):
    user_id = get_user_id(payload)

    if user_id == req.friend_id:
        raise HTTPException(status_code=400, detail="Cannot add yourself")

    # Check if friendship already exists
    existing = supabase.table("friendships")\
        .select("id, status")\
        .eq("user_id", user_id)\
        .eq("friend_id", req.friend_id)\
        .execute()

    if existing.data:
        raise HTTPException(status_code=400, detail=f"Friendship already exists: {existing.data[0]['status']}")

    result = supabase.table("friendships").insert({
        "user_id": user_id,
        "friend_id": req.friend_id,
        "status": "pending",
    }).execute()

    # Notify the friend
    supabase.table("notifications").insert({
        "user_id": req.friend_id,
        "type": "friend_request",
        "message": "You have a new friend request on PathForge",
    }).execute()

    return result.data[0] if result.data else {}


@router.post("/accept")
def accept_friend_request(req: FriendRequest, payload: dict = Depends(verify_token)):
    user_id = get_user_id(payload)

    # Update: friend_id sent request TO user_id
    result = supabase.table("friendships")\
        .update({"status": "accepted"})\
        .eq("user_id", req.friend_id)\
        .eq("friend_id", user_id)\
        .eq("status", "pending")\
        .execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Pending request not found")

    # Also create reverse row for easy querying
    supabase.table("friendships").insert({
        "user_id": user_id,
        "friend_id": req.friend_id,
        "status": "accepted",
    }).execute()

    return {"accepted": True}


@router.get("/list")
def get_friends(payload: dict = Depends(verify_token)):
    """Return accepted friends with name, college, xp, streak, and dsa_solved count."""
    user_id = get_user_id(payload)

    result = supabase.table("friendships")\
        .select("friend_id, status, users!friendships_friend_id_fkey(name, college, xp, streak)")\
        .eq("user_id", user_id)\
        .eq("status", "accepted")\
        .execute()

    friends = result.data or []

    # Enrich each friend with their dsa_solved count
    enriched = []
    for f in friends:
        friend_id = f["friend_id"]
        dsa_data = supabase.table("dsa_progress")\
            .select("id", count="exact")\
            .eq("user_id", friend_id)\
            .eq("status", "solved")\
            .execute()
        dsa_solved = dsa_data.count or 0

        user_info = f.get("users") or {}
        enriched.append({
            "friend_id": friend_id,
            "name": user_info.get("name"),
            "college": user_info.get("college"),
            "xp": user_info.get("xp"),
            "streak": user_info.get("streak"),
            "dsa_solved": dsa_solved,
            "total_solved": dsa_solved,  # alias for convenience
        })

    return enriched


@router.get("/pending")
def get_pending_requests(payload: dict = Depends(verify_token)):
    user_id = get_user_id(payload)
    # Requests sent TO this user
    result = supabase.table("friendships")\
        .select("user_id, users!friendships_user_id_fkey(name, college)")\
        .eq("friend_id", user_id)\
        .eq("status", "pending")\
        .execute()
    return result.data


@router.get("/search")
def search_users(q: str, payload: dict = Depends(verify_token)):
    """Search users by name and include friendship_status relative to current user."""
    user_id = get_user_id(payload)

    if len(q) < 2:
        raise HTTPException(status_code=400, detail="Query too short")

    result = supabase.table("users")\
        .select("id, name, college, xp, streak")\
        .ilike("name", f"%{q}%")\
        .limit(10)\
        .execute()

    users = result.data or []
    if not users:
        return []

    # Fetch all friendship rows involving the current user to resolve statuses
    target_ids = [u["id"] for u in users]

    # Outgoing requests from current user
    outgoing = supabase.table("friendships")\
        .select("friend_id, status")\
        .eq("user_id", user_id)\
        .in_("friend_id", target_ids)\
        .execute().data or []
    outgoing_map = {row["friend_id"]: row["status"] for row in outgoing}

    # Incoming requests to current user (they sent to us)
    incoming = supabase.table("friendships")\
        .select("user_id, status")\
        .eq("friend_id", user_id)\
        .in_("user_id", target_ids)\
        .execute().data or []
    incoming_map = {row["user_id"]: row["status"] for row in incoming}

    enriched = []
    for u in users:
        uid = u["id"]
        if uid in outgoing_map:
            friendship_status = outgoing_map[uid]  # "pending" or "accepted"
        elif uid in incoming_map:
            friendship_status = incoming_map[uid]   # "pending" or "accepted"
        else:
            friendship_status = "none"

        enriched.append({**u, "friendship_status": friendship_status})

    return enriched


@router.delete("/{friend_id}")
def remove_friend(friend_id: str, payload: dict = Depends(verify_token)):
    """Remove a friend — deletes both directions of the friendship row."""
    user_id = get_user_id(payload)

    # Delete user_id -> friend_id
    supabase.table("friendships")\
        .delete()\
        .eq("user_id", user_id)\
        .eq("friend_id", friend_id)\
        .execute()

    # Delete friend_id -> user_id (reverse row)
    supabase.table("friendships")\
        .delete()\
        .eq("user_id", friend_id)\
        .eq("friend_id", user_id)\
        .execute()

    return {"removed": True}


@router.get("/feed")
def get_feed(limit: int = 30, payload: dict = Depends(verify_token)):
    """Activity feed showing recent actions from the user and all accepted friends."""
    user_id = get_user_id(payload)

    # Get accepted friend IDs
    friends = supabase.table("friendships")\
        .select("friend_id")\
        .eq("user_id", user_id)\
        .eq("status", "accepted")\
        .execute().data or []

    friend_ids = [f["friend_id"] for f in friends] + [user_id]

    # Fetch recent activity_feed rows for these actor_ids
    rows = supabase.table("activity_feed")\
        .select("*, users!activity_feed_actor_id_fkey(name, college)")\
        .in_("actor_id", friend_ids)\
        .order("created_at", desc=True)\
        .limit(limit)\
        .execute().data

    return rows
