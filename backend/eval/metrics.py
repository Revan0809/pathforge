"""Ranking metrics for retrieval evaluation.

All functions take ``retrieved`` (an ordered list of item ids, best first) and
``relevant`` (the set of ids that *should* be retrieved for the query).
"""

from __future__ import annotations


def hit_rate(retrieved: list[int], relevant: set[int], k: int) -> float:
    """1.0 if at least one relevant item appears in the top-k, else 0.0.

    The bluntest useful question: did we surface anything usable at all?
    """
    return 1.0 if set(retrieved[:k]) & relevant else 0.0


def recall_at_k(retrieved: list[int], relevant: set[int], k: int) -> float:
    """Fraction of all relevant items that made it into the top-k.

    This is the metric that matters most for RAG: if the right chunk never gets
    retrieved, no amount of prompting can rescue the answer.
    """
    if not relevant:
        return 0.0
    return len(set(retrieved[:k]) & relevant) / len(relevant)


def precision_at_k(retrieved: list[int], relevant: set[int], k: int) -> float:
    """Fraction of the top-k that is actually relevant.

    Low precision means the prompt gets padded with irrelevant context, which
    costs tokens and measurably degrades answer quality.
    """
    if k == 0:
        return 0.0
    return len(set(retrieved[:k]) & relevant) / min(k, len(retrieved)) if retrieved else 0.0


def reciprocal_rank(retrieved: list[int], relevant: set[int]) -> float:
    """1 / rank of the first relevant item (0.0 if none).

    Rewards putting a good result *first*, not merely somewhere in the list.
    """
    for idx, item in enumerate(retrieved, start=1):
        if item in relevant:
            return 1.0 / idx
    return 0.0


def aggregate(per_query: list[dict]) -> dict:
    """Mean of each metric across queries."""
    if not per_query:
        return {}
    keys = per_query[0].keys()
    return {k: round(sum(q[k] for q in per_query) / len(per_query), 4) for k in keys}
