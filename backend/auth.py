"""
Supabase JWT verification for FastAPI.
Supports both HS256 (legacy projects) and RS256 (newer Supabase projects).
RS256 keys are fetched from the Supabase JWKS endpoint and cached.
"""
import os
import jwt
from jwt import PyJWKClient
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv

load_dotenv()

security = HTTPBearer()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "")

# Lazily initialised JWKS client (for RS256 / newer Supabase projects)
_jwks_client: PyJWKClient | None = None


def _get_jwks_client() -> PyJWKClient:
    global _jwks_client
    if _jwks_client is None:
        jwks_url = f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json"
        _jwks_client = PyJWKClient(jwks_url, cache_keys=True)
    return _jwks_client


def verify_token(credentials: HTTPAuthorizationCredentials = Security(security)) -> dict:
    token = credentials.credentials

    # ── Try HS256 first (legacy Supabase projects) ────────────────────────────
    if SUPABASE_JWT_SECRET:
        try:
            return jwt.decode(
                token,
                SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                options={"verify_aud": False},
            )
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token expired")
        except (jwt.InvalidAlgorithmError, jwt.DecodeError):
            pass  # token is likely RS256 — fall through to JWKS
        except jwt.InvalidTokenError as e:
            # Only re-raise if it's not an algorithm mismatch
            if "alg" not in str(e).lower():
                raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")

    # ── Fallback: RS256 via Supabase JWKS endpoint (newer projects) ───────────
    try:
        client = _get_jwks_client()
        signing_key = client.get_signing_key_from_jwt(token)
        return jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256", "ES256"],
            options={"verify_aud": False},
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")


def get_user_id(payload: dict) -> str:
    """Extract user UUID from Supabase JWT payload."""
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="No user ID in token")
    return user_id
