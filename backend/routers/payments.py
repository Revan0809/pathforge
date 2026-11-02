import os, hmac, hashlib
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from auth import verify_token, get_user_id
from database import supabase
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

# ─── Razorpay availability ────────────────────────────────────────────────────

try:
    import razorpay
    RAZORPAY_AVAILABLE = True
except ImportError:
    RAZORPAY_AVAILABLE = False

RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "")


# ─── POST /payments/create-order ─────────────────────────────────────────────

@router.post("/create-order")
def create_order(payload: dict = Depends(verify_token)):
    user_id = get_user_id(payload)

    if not RAZORPAY_AVAILABLE or not RAZORPAY_KEY_ID or not RAZORPAY_KEY_SECRET:
        raise HTTPException(
            status_code=503,
            detail="Payment service is not available. Please contact support.",
        )

    client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

    try:
        order = client.order.create({
            "amount": 9900,
            "currency": "INR",
            "notes": {
                "user_id": user_id,
                "plan": "premium",
            },
        })
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to create payment order: {str(e)}")

    return {
        "order_id": order["id"],
        "amount": 9900,
        "currency": "INR",
        "key_id": RAZORPAY_KEY_ID,
    }


# ─── POST /payments/verify ────────────────────────────────────────────────────

class PaymentVerifyRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


@router.post("/verify")
def verify_payment(body: PaymentVerifyRequest, payload: dict = Depends(verify_token)):
    user_id = get_user_id(payload)

    if not RAZORPAY_AVAILABLE or not RAZORPAY_KEY_SECRET:
        raise HTTPException(
            status_code=503,
            detail="Payment service is not available. Please contact support.",
        )

    # Verify HMAC-SHA256 signature
    message = f"{body.razorpay_order_id}|{body.razorpay_payment_id}"
    expected_signature = hmac.new(
        RAZORPAY_KEY_SECRET.encode("utf-8"),
        message.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(expected_signature, body.razorpay_signature):
        raise HTTPException(status_code=400, detail="Invalid payment signature")

    # Upgrade user tier to premium
    try:
        supabase.table("users").update({"tier": "premium"}).eq("id", user_id).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upgrade account: {str(e)}")

    # Insert upgrade notification
    try:
        supabase.table("notifications").insert({
            "user_id": user_id,
            "type": "upgrade",
            "message": "Welcome to PathForge Premium! All features unlocked.",
            "read": False,
        }).execute()
    except Exception:
        pass

    return {
        "success": True,
        "tier": "premium",
        "message": "Upgraded to Premium!",
    }
