"""Tests for the retrieval metrics and ground-truth construction."""

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), os.pardir))

from eval.ground_truth import build_queries, load_resources
from eval.metrics import hit_rate, precision_at_k, recall_at_k, reciprocal_rank
from eval.retrievers import keyword_retriever, tfidf_retriever


def test_recall_counts_only_top_k():
    assert recall_at_k([1, 2, 3], {1, 2}, k=3) == 1.0
    assert recall_at_k([9, 8, 1], {1, 2}, k=2) == 0.0      # relevant item is below the cut-off
    assert recall_at_k([1, 9, 9], {1, 2}, k=3) == 0.5


def test_precision_penalises_padding():
    assert precision_at_k([1, 2], {1, 2}, k=2) == 1.0
    assert precision_at_k([1, 9], {1, 2}, k=2) == 0.5


def test_reciprocal_rank_rewards_ranking_first():
    assert reciprocal_rank([1, 9, 9], {1}) == 1.0
    assert reciprocal_rank([9, 1, 9], {1}) == 0.5
    assert reciprocal_rank([9, 9, 9], {1}) == 0.0          # nothing relevant found


def test_hit_rate_is_binary():
    assert hit_rate([9, 1], {1}, k=2) == 1.0
    assert hit_rate([9, 8], {1}, k=2) == 0.0


def test_empty_relevant_set_does_not_divide_by_zero():
    assert recall_at_k([1, 2], set(), k=2) == 0.0


def test_ground_truth_builds_a_usable_benchmark():
    resources = load_resources()
    queries = build_queries(resources)
    assert len(resources) > 0
    assert len(queries) > 0
    for q in queries:
        assert q["relevant"], f"{q['query']} has no relevant resources"
        assert all(0 <= i < len(resources) for i in q["relevant"])


def test_retrievers_return_at_most_k_valid_indices():
    resources = load_resources()
    for build in (keyword_retriever, tfidf_retriever):
        retrieve = build(resources)
        got = retrieve("SDE", "DSA", 3)
        assert len(got) <= 3
        assert len(set(got)) == len(got), "duplicate indices returned"
        assert all(0 <= i < len(resources) for i in got)


def test_retrievers_find_something_relevant_for_a_known_query():
    """Sanity check: 'SDE DSA' must surface at least one DSA resource."""
    resources = load_resources()
    queries = {q["query"]: q for q in build_queries(resources)}
    q = queries.get("SDE DSA")
    assert q is not None, "expected an 'SDE DSA' pair in the catalogue"
    for build in (keyword_retriever, tfidf_retriever):
        got = build(resources)("SDE", "DSA", 3)
        assert set(got) & q["relevant"], "no relevant resource in top-3"
