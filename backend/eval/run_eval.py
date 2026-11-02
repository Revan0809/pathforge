"""Score every retriever on the derived benchmark and print a comparison.

    cd backend && PYTHONPATH=. python eval/run_eval.py
    cd backend && PYTHONPATH=. python eval/run_eval.py --k 3 --json results.json
"""

from __future__ import annotations

import argparse
import json

from eval.ground_truth import build_queries, load_resources
from eval.metrics import aggregate, hit_rate, precision_at_k, recall_at_k, reciprocal_rank
from eval.retrievers import keyword_retriever, tfidf_retriever, vector_retriever


def evaluate(retrieve, queries: list[dict], k: int) -> dict:
    per_query = []
    for q in queries:
        got = retrieve(q["role"], q["topic"], k)
        rel = q["relevant"]
        per_query.append(
            {
                f"hit@{k}": hit_rate(got, rel, k),
                f"recall@{k}": recall_at_k(got, rel, k),
                f"precision@{k}": precision_at_k(got, rel, k),
                "mrr": reciprocal_rank(got, rel),
            }
        )
    return aggregate(per_query)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--k", type=int, default=3, help="cut-off for @k metrics")
    ap.add_argument("--json", help="write results to this path")
    args = ap.parse_args()

    resources = load_resources()
    queries = build_queries(resources)
    print(f"catalogue: {len(resources)} resources · benchmark: {len(queries)} queries · k={args.k}\n")

    candidates = {
        "keyword (production fallback)": keyword_retriever(resources),
        "tf-idf (offline baseline)": tfidf_retriever(resources),
    }
    vec = vector_retriever(resources)
    if vec is not None:
        candidates["vector (text-embedding-3-small)"] = vec
    else:
        print("note: vector retriever skipped — OPENAI_API_KEY not set\n")

    results = {name: evaluate(fn, queries, args.k) for name, fn in candidates.items()}

    cols = list(next(iter(results.values())).keys())
    width = max(len(n) for n in results) + 2
    print(f"{'retriever'.ljust(width)}" + "".join(c.rjust(14) for c in cols))
    print("-" * (width + 14 * len(cols)))
    for name, scores in results.items():
        print(name.ljust(width) + "".join(f"{scores[c]:.4f}".rjust(14) for c in cols))

    if args.json:
        with open(args.json, "w") as fh:
            json.dump({"k": args.k, "n_queries": len(queries), "results": results}, fh, indent=2)
        print(f"\nwrote {args.json}")


if __name__ == "__main__":
    main()
