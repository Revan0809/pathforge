"""Retrievers under evaluation.

Each retriever is a callable ``(query_role, query_topic, k) -> list[int]``
returning resource indices ranked best-first, so the harness can score any of
them with identical code.
"""

from __future__ import annotations

import math
import re
from collections import Counter

_TOKEN = re.compile(r"[a-z0-9]+")


def _tokens(text: str) -> list[str]:
    return _TOKEN.findall(text.lower())


def _doc_text(r: dict) -> str:
    return f"{r['role']} {r['topic']} {r['title']} {r['description']}"


# --------------------------------------------------------------------------
# 1. Keyword scoring — mirrors the production fallback in routers/rag.py
# --------------------------------------------------------------------------

def keyword_retriever(resources: list[dict]):
    """Replicates `_keyword_fallback`: +2 for a role match, +3 for a topic hit."""

    def retrieve(role: str, topic: str, k: int) -> list[int]:
        role_l, topic_l = role.lower(), topic.lower()
        scored: list[tuple[int, int]] = []
        for idx, r in enumerate(resources):
            score = 0
            if role_l in r["role"].lower() or r["role"].lower() == "general":
                score += 2
            if (
                topic_l in r["topic"].lower()
                or topic_l in r["title"].lower()
                or topic_l in r["description"].lower()
            ):
                score += 3
            if score > 0:
                scored.append((score, idx))
        scored.sort(key=lambda x: (-x[0], x[1]))
        return [idx for _, idx in scored[:k]]

    return retrieve


# --------------------------------------------------------------------------
# 2. TF-IDF cosine — a real lexical baseline, no API keys, no dependencies
# --------------------------------------------------------------------------

def tfidf_retriever(resources: list[dict]):
    """Classic TF-IDF over the same text the embedder sees.

    Worth measuring because it is free and offline. If a paid embedding model
    cannot beat TF-IDF on your corpus, it is not earning its cost.
    """
    docs = [_tokens(_doc_text(r)) for r in resources]
    n_docs = len(docs)

    df = Counter()
    for d in docs:
        df.update(set(d))
    idf = {t: math.log((n_docs + 1) / (c + 1)) + 1.0 for t, c in df.items()}

    def _vec(toks: list[str]) -> dict[str, float]:
        tf = Counter(toks)
        if not tf:
            return {}
        v = {t: (c / len(toks)) * idf.get(t, 0.0) for t, c in tf.items()}
        norm = math.sqrt(sum(x * x for x in v.values())) or 1.0
        return {t: x / norm for t, x in v.items()}

    doc_vecs = [_vec(d) for d in docs]

    def retrieve(role: str, topic: str, k: int) -> list[int]:
        q = _vec(_tokens(f"{role} {topic}"))
        scored = []
        for idx, dv in enumerate(doc_vecs):
            small, large = (q, dv) if len(q) < len(dv) else (dv, q)
            sim = sum(w * large.get(t, 0.0) for t, w in small.items())
            if sim > 0:
                scored.append((sim, idx))
        scored.sort(key=lambda x: (-x[0], x[1]))
        return [idx for _, idx in scored[:k]]

    return retrieve


# --------------------------------------------------------------------------
# 3. Vector search — the production path (needs OPENAI_API_KEY + Qdrant)
# --------------------------------------------------------------------------

def vector_retriever(resources: list[dict]):
    """Embeds the catalogue with text-embedding-3-small and ranks by cosine.

    Returns ``None`` when credentials are absent so the harness can skip it
    rather than fabricate numbers.
    """
    import os

    if not os.getenv("OPENAI_API_KEY"):
        return None
    try:
        from openai import OpenAI
    except ImportError:
        return None

    client = OpenAI()
    texts = [_doc_text(r) for r in resources]
    embs: list[list[float]] = []
    for i in range(0, len(texts), 20):
        resp = client.embeddings.create(model="text-embedding-3-small", input=texts[i : i + 20])
        embs.extend(item.embedding for item in resp.data)

    def _cos(a, b):
        dot = sum(x * y for x, y in zip(a, b))
        na = math.sqrt(sum(x * x for x in a)) or 1.0
        nb = math.sqrt(sum(x * x for x in b)) or 1.0
        return dot / (na * nb)

    def retrieve(role: str, topic: str, k: int) -> list[int]:
        qv = client.embeddings.create(
            model="text-embedding-3-small", input=[f"{role} {topic}"]
        ).data[0].embedding
        scored = sorted(((_cos(qv, e), i) for i, e in enumerate(embs)), key=lambda x: -x[0])
        return [i for _, i in scored[:k]]

    return retrieve
