# Retrieval evaluation harness

Measures how well PathForge's recommendation retrieval actually works, instead of assuming it does.

```bash
cd backend
PYTHONPATH=. python eval/run_eval.py --k 3
PYTHONPATH=. python eval/run_eval.py --k 3 --json eval/results_k3.json
python -m pytest tests/test_eval_metrics.py -q
```

Runs **offline with zero dependencies** — the catalogue is parsed out of `routers/rag.py` with
`ast`, so evaluating retrieval doesn't require FastAPI, JWT or a Qdrant instance.

## Where the ground truth comes from

Every resource in the catalogue is already labelled with a `role` and a `topic`. So a query
`(role, topic)` has a *derivable* correct answer: every resource carrying that role and topic is
relevant, plus `General`-role resources on the same topic (matching how the production fallback
scores them). 60 resources yield **20 labelled queries** with no hand-annotation.

## Metrics, and why each one is here

| Metric | Question it answers |
|---|---|
| **hit@k** | Did we surface *anything* usable? |
| **recall@k** | What fraction of the relevant resources reached the top-k? **The one that matters most for RAG** — if the right item is never retrieved, no prompt can recover it |
| **precision@k** | How much of the top-k was noise? Padding the prompt with irrelevant context costs tokens and measurably degrades answers |
| **MRR** | Did we rank a good result *first*, not merely somewhere in the list? |

## Retrievers compared

1. **keyword** — reproduces the production fallback in `routers/rag.py` (+2 role match, +3 topic hit)
2. **tf-idf** — classic lexical baseline, offline, no API key
3. **vector** — the production path, `text-embedding-3-small` + cosine. Skipped automatically when
   `OPENAI_API_KEY` is absent rather than reporting fabricated numbers

## Results (60 resources, 20 queries)

| k | retriever | hit@k | recall@k | precision@k | MRR |
|---|---|---|---|---|---|
| 1 | keyword | 0.9500 | 0.4475 | 0.9500 | 0.9500 |
| 1 | tf-idf | **1.0000** | **0.4642** | **1.0000** | **1.0000** |
| 3 | keyword | 1.0000 | **0.9508** | **0.7667** | 0.9750 |
| 3 | tf-idf | 1.0000 | 0.9092 | 0.7333 | **1.0000** |
| 5 | keyword | 1.0000 | **1.0000** | 0.5000 | 0.9750 |
| 5 | tf-idf | 1.0000 | 0.9833 | 0.4900 | **1.0000** |

### What this actually says

- **Recall is not the problem.** By k=5 the keyword scorer retrieves *every* relevant resource.
  On a 60-item, cleanly-labelled catalogue, lexical matching is close to sufficient.
- **TF-IDF ranks better; keyword recalls better.** TF-IDF puts a relevant item first on
  **every single query** (MRR 1.0), while the keyword scorer's coarse integer scores tie often
  and break arbitrarily. Keyword edges ahead on recall@3.
- **Precision falls as k grows** (0.95 → 0.77 → 0.50 at k=1/3/5) because most queries only have
  2–3 genuinely relevant resources. Production returns 2, which is the right call — asking for 5
  guarantees half the context is noise.
- ⚠️ **The open question this raises:** a paid embedding model has to beat a free TF-IDF baseline
  that already achieves MRR 1.0 here. Run with `OPENAI_API_KEY` set to find out. **If it doesn't
  win, the vector database is cost and latency for nothing at this corpus size** — the kind of
  thing worth knowing *before* scaling it.

## Honest limitations

- 60 resources and 20 queries is small; differences of a few points are not significant.
- Ground truth is derived from the catalogue's own labels, so it measures *retrieval consistency
  with those labels* — not whether a human would find the resource genuinely helpful.
- Only retrieval is scored here. Generation quality (faithfulness, answer relevance) is a
  separate axis and is not measured.
