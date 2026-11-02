"""
Supabase Python client for backend operations.
Uses the service role key for server-side queries (bypasses RLS where needed).
"""
import os
import sys
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")  # Service role key — never expose to frontend

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("[PathForge] FATAL: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set.", file=sys.stderr)
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
