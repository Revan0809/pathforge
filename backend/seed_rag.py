"""
seed_rag.py — Pre-populate Qdrant with all 60 PathForge learning resources.

Usage:
    python seed_rag.py

Requires:
    - OPENAI_API_KEY set in .env
    - QDRANT_URL (default: http://localhost:6333) set in .env
    - QDRANT_API_KEY (optional, for Qdrant Cloud) set in .env

Run this once before starting the backend to avoid cold-start embedding delay.
"""

import os
import sys
import time
from dotenv import load_dotenv

load_dotenv()

# ---------------------------------------------------------------------------
# Validate environment early
# ---------------------------------------------------------------------------

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY", "") or None

if not OPENAI_API_KEY:
    print("ERROR: OPENAI_API_KEY is not set in .env — cannot embed resources.")
    sys.exit(1)

print(f"OpenAI key   : {OPENAI_API_KEY[:12]}...{OPENAI_API_KEY[-4:]}")
print(f"Qdrant URL   : {QDRANT_URL}")
print(f"Qdrant auth  : {'yes' if QDRANT_API_KEY else 'no (local mode)'}")
print()

# ---------------------------------------------------------------------------
# Import resource list directly from rag router
# ---------------------------------------------------------------------------

# Add backend directory to path so we can import the router module
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from routers.rag import RESOURCES
except ImportError as exc:
    print(f"ERROR: Could not import RESOURCES from routers/rag.py: {exc}")
    sys.exit(1)

print(f"Loaded {len(RESOURCES)} resources from routers/rag.py")
print()

# ---------------------------------------------------------------------------
# Set up clients
# ---------------------------------------------------------------------------

from openai import OpenAI
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct

openai_client = OpenAI(api_key=OPENAI_API_KEY)
qdrant = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY, timeout=30)

COLLECTION_NAME = "pathforge_resources"
VECTOR_DIM = 1536
BATCH_SIZE = 20

# ---------------------------------------------------------------------------
# Create or recreate collection
# ---------------------------------------------------------------------------

existing_collections = [c.name for c in qdrant.get_collections().collections]

if COLLECTION_NAME in existing_collections:
    user_input = input(
        f"Collection '{COLLECTION_NAME}' already exists. Recreate it? [y/N]: "
    ).strip().lower()
    if user_input == "y":
        qdrant.delete_collection(COLLECTION_NAME)
        print(f"Deleted existing collection '{COLLECTION_NAME}'.")
    else:
        print("Aborted. Existing collection was not modified.")
        sys.exit(0)

qdrant.create_collection(
    collection_name=COLLECTION_NAME,
    vectors_config=VectorParams(size=VECTOR_DIM, distance=Distance.COSINE),
)
print(f"Created collection '{COLLECTION_NAME}' (dim={VECTOR_DIM}, metric=COSINE).")
print()

# ---------------------------------------------------------------------------
# Embed all resources in batches
# ---------------------------------------------------------------------------

texts = [
    f"{r['role']} {r['topic']} {r['title']} {r['description']}"
    for r in RESOURCES
]

total_batches = (len(texts) + BATCH_SIZE - 1) // BATCH_SIZE
all_embeddings: list[list[float]] = []

for batch_idx in range(total_batches):
    start = batch_idx * BATCH_SIZE
    end = min(start + BATCH_SIZE, len(texts))
    batch_texts = texts[start:end]

    print(f"Embedding batch {batch_idx + 1}/{total_batches} ({len(batch_texts)} texts)...", end=" ", flush=True)
    t0 = time.time()

    response = openai_client.embeddings.create(
        model="text-embedding-3-small",
        input=batch_texts,
    )
    batch_embeddings = [item.embedding for item in response.data]
    all_embeddings.extend(batch_embeddings)

    elapsed = time.time() - t0
    print(f"done ({elapsed:.2f}s)")

print()
print(f"Total embeddings: {len(all_embeddings)}")
print()

# ---------------------------------------------------------------------------
# Upsert all points into Qdrant
# ---------------------------------------------------------------------------

points = [
    PointStruct(
        id=idx,
        vector=emb,
        payload={
            "title": RESOURCES[idx]["title"],
            "url": RESOURCES[idx]["url"],
            "description": RESOURCES[idx]["description"],
            "role": RESOURCES[idx]["role"],
            "topic": RESOURCES[idx]["topic"],
            "platform": RESOURCES[idx]["platform"],
        },
    )
    for idx, emb in enumerate(all_embeddings)
]

# Upsert in batches to avoid payload size limits
upsert_batch_size = 50
total_upsert_batches = (len(points) + upsert_batch_size - 1) // upsert_batch_size

for batch_idx in range(total_upsert_batches):
    start = batch_idx * upsert_batch_size
    end = min(start + upsert_batch_size, len(points))
    batch_points = points[start:end]

    print(f"Upserting batch {batch_idx + 1}/{total_upsert_batches} ({len(batch_points)} points)...", end=" ", flush=True)
    t0 = time.time()
    qdrant.upsert(collection_name=COLLECTION_NAME, points=batch_points)
    elapsed = time.time() - t0
    print(f"done ({elapsed:.2f}s)")

print()

# ---------------------------------------------------------------------------
# Verify
# ---------------------------------------------------------------------------

info = qdrant.get_collection(COLLECTION_NAME)
vectors_count = info.vectors_count

print(f"Verification: collection '{COLLECTION_NAME}' now has {vectors_count} vectors.")

if vectors_count == len(RESOURCES):
    print(f"All {len(RESOURCES)} resources successfully seeded into Qdrant.")
else:
    print(
        f"WARNING: Expected {len(RESOURCES)} vectors but found {vectors_count}. "
        "Re-run the script if counts mismatch."
    )

print()
print("Done. You can now start the backend — RAG recommender is ready.")
