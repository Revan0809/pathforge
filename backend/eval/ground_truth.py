"""Build an evaluation query set from the curated resource catalogue.

The catalogue already carries ``role`` and ``topic`` labels for every resource,
so a query of the form (role, topic) has a *derivable* ground-truth answer:
every resource sharing that role and topic is relevant. That gives a labelled
retrieval benchmark without hand-annotating anything.

Resources tagged ``role == "General"`` are treated as relevant to any role with
the same topic, mirroring how the production keyword fallback scores them.
"""

from __future__ import annotations

from collections import defaultdict


def load_resources(path: str | None = None) -> list[dict]:
    """Read the RESOURCES catalogue straight out of routers/rag.py.

    Parsed from the source with ``ast`` rather than imported, so evaluating
    retrieval does not require FastAPI, JWT or any of the serving stack to be
    installed. The harness stays runnable in CI with zero dependencies.
    """
    import ast
    import os

    if path is None:
        here = os.path.dirname(os.path.abspath(__file__))
        path = os.path.join(here, os.pardir, "routers", "rag.py")

    with open(path, encoding="utf-8") as fh:
        tree = ast.parse(fh.read())

    for node in tree.body:
        if isinstance(node, ast.Assign):
            for target in node.targets:
                if isinstance(target, ast.Name) and target.id == "RESOURCES":
                    return ast.literal_eval(node.value)

    raise RuntimeError(f"RESOURCES not found in {path}")


def build_queries(resources: list[dict], min_relevant: int = 1) -> list[dict]:
    """Return [{query, role, topic, relevant: set[int]}] for each (role, topic).

    ``min_relevant`` drops pairs too sparse to score meaningfully.
    """
    by_pair: dict[tuple[str, str], set[int]] = defaultdict(set)
    for idx, r in enumerate(resources):
        by_pair[(r["role"], r["topic"])].add(idx)

    # General-role resources are valid answers for any role on the same topic.
    general_by_topic: dict[str, set[int]] = defaultdict(set)
    for idx, r in enumerate(resources):
        if r["role"].lower() == "general":
            general_by_topic[r["topic"]].add(idx)

    queries = []
    for (role, topic), ids in sorted(by_pair.items()):
        if role.lower() == "general":
            continue
        relevant = ids | general_by_topic.get(topic, set())
        if len(relevant) < min_relevant:
            continue
        queries.append(
            {
                "query": f"{role} {topic}",
                "role": role,
                "topic": topic,
                "relevant": relevant,
            }
        )
    return queries
