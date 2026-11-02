"""
seed_users.py — Seed 10 dummy batchmate profiles for testing friends + challenges.

Creates real Supabase auth users (email confirmed, no real email sent),
then updates their profile rows with realistic data.

Usage:
    python seed_users.py

Password for all dummy accounts: PathForge@123
"""

import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_KEY"),
)

DUMMY_PASSWORD = "PathForge@123"

DUMMY_USERS = [
    {
        "name": "Rahul Sharma",
        "email": "rahul.sharma@dummy.pathforge.dev",
        "college": "BITS Pilani",
        "branch": "CSE",
        "semester": 6,
        "target_role": "SDE",
        "target_companies": ["Google", "Microsoft"],
        "current_skills": ["Python", "C++", "DSA"],
        "cgpa": 8.4,
        "xp": 1240,
        "streak": 12,
    },
    {
        "name": "Priya Nair",
        "email": "priya.nair@dummy.pathforge.dev",
        "college": "NIT Trichy",
        "branch": "CSE",
        "semester": 5,
        "target_role": "ML Engineer",
        "target_companies": ["Amazon", "OpenAI"],
        "current_skills": ["Python", "ML", "TensorFlow"],
        "cgpa": 9.1,
        "xp": 2100,
        "streak": 21,
    },
    {
        "name": "Arjun Mehta",
        "email": "arjun.mehta@dummy.pathforge.dev",
        "college": "IIT Bombay",
        "branch": "CS",
        "semester": 7,
        "target_role": "SDE",
        "target_companies": ["Google", "Meta"],
        "current_skills": ["Java", "System Design", "DSA"],
        "cgpa": 8.9,
        "xp": 3450,
        "streak": 45,
    },
    {
        "name": "Sneha Reddy",
        "email": "sneha.reddy@dummy.pathforge.dev",
        "college": "VIT Vellore",
        "branch": "CSE",
        "semester": 6,
        "target_role": "Data Analyst",
        "target_companies": ["Flipkart", "Swiggy"],
        "current_skills": ["SQL", "Python", "Tableau"],
        "cgpa": 8.0,
        "xp": 870,
        "streak": 7,
    },
    {
        "name": "Karan Gupta",
        "email": "karan.gupta@dummy.pathforge.dev",
        "college": "NSIT Delhi",
        "branch": "IT",
        "semester": 6,
        "target_role": "SDE",
        "target_companies": ["Paytm", "Razorpay"],
        "current_skills": ["JavaScript", "React", "Node.js"],
        "cgpa": 7.6,
        "xp": 560,
        "streak": 3,
    },
    {
        "name": "Ananya Singh",
        "email": "ananya.singh@dummy.pathforge.dev",
        "college": "DTU Delhi",
        "branch": "CSE",
        "semester": 5,
        "target_role": "DevOps",
        "target_companies": ["AWS", "Atlassian"],
        "current_skills": ["Linux", "Docker", "Kubernetes"],
        "cgpa": 8.2,
        "xp": 1080,
        "streak": 9,
    },
    {
        "name": "Dev Patel",
        "email": "dev.patel@dummy.pathforge.dev",
        "college": "DAIICT Gandhinagar",
        "branch": "ICT",
        "semester": 7,
        "target_role": "ML Engineer",
        "target_companies": ["DeepMind", "Adobe"],
        "current_skills": ["PyTorch", "NLP", "Python"],
        "cgpa": 8.7,
        "xp": 1900,
        "streak": 18,
    },
    {
        "name": "Meera Krishnan",
        "email": "meera.krishnan@dummy.pathforge.dev",
        "college": "PSG Tech Coimbatore",
        "branch": "CSE",
        "semester": 6,
        "target_role": "SDE",
        "target_companies": ["Zoho", "Freshworks"],
        "current_skills": ["Java", "Spring Boot", "MySQL"],
        "cgpa": 8.5,
        "xp": 740,
        "streak": 6,
    },
    {
        "name": "Rohan Verma",
        "email": "rohan.verma@dummy.pathforge.dev",
        "college": "Manipal Institute",
        "branch": "CSE",
        "semester": 8,
        "target_role": "SDE",
        "target_companies": ["Infosys", "TCS"],
        "current_skills": ["C", "C++", "DBMS"],
        "cgpa": 7.3,
        "xp": 320,
        "streak": 2,
    },
    {
        "name": "Ishaan Bose",
        "email": "ishaan.bose@dummy.pathforge.dev",
        "college": "Jadavpur University",
        "branch": "CSE",
        "semester": 6,
        "target_role": "Product Manager",
        "target_companies": ["Notion", "Figma"],
        "current_skills": ["Product Thinking", "Figma", "Python"],
        "cgpa": 8.1,
        "xp": 650,
        "streak": 5,
    },
]


def seed():
    print("=== PathForge Dummy User Seed ===\n")
    inserted = 0
    skipped = 0

    for u in DUMMY_USERS:
        email = u["email"]

        # Check if auth user already exists via users table
        existing = supabase.table("users").select("id").eq("email", email).execute()
        if existing.data:
            print(f"  SKIP  {u['name']} already exists")
            skipped += 1
            continue

        # 1. Create auth user (email confirmed, no email sent)
        try:
            auth_resp = supabase.auth.admin.create_user({
                "email": email,
                "password": DUMMY_PASSWORD,
                "email_confirm": True,
                "user_metadata": {"name": u["name"]},
            })
            user_id = auth_resp.user.id
        except Exception as e:
            print(f"  FAIL  {u['name']} auth create failed: {e}")
            continue

        # 2. Upsert profile row (trigger may have created a bare row already)
        profile = {
            "id": user_id,
            "name": u["name"],
            "email": email,
            "college": u["college"],
            "branch": u["branch"],
            "semester": u["semester"],
            "target_role": u["target_role"],
            "target_companies": u["target_companies"],
            "current_skills": u["current_skills"],
            "cgpa": u["cgpa"],
            "xp": u["xp"],
            "streak": u["streak"],
            "tier": "free",
        }
        try:
            supabase.table("users").upsert(profile).execute()
            print(f"  OK    {u['name']} ({u['college']}, {u['target_role']}, {u['xp']} XP)")
            inserted += 1
        except Exception as e:
            print(f"  FAIL  {u['name']} profile update failed: {e}")

    print(f"\nDone: {inserted} inserted, {skipped} skipped.")
    print(f"Password for all dummy accounts: {DUMMY_PASSWORD}")
    print("\nSearch for these users in /friends:")
    for u in DUMMY_USERS:
        print(f"  - {u['name']}  ({u['college']})")


if __name__ == "__main__":
    seed()
