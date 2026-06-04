# Decomposition: Retrieval Quality & Evaluation

## Topic Overview

Retrieval quality measures how well the RAG system finds relevant documents for a given query. High-quality retrieval is the foundation of effective RAG â€” even the best LLM cannot produce accurate answers from irrelevant context. Retrieval evaluation uses information retrieval (IR) metrics (precision, recall, MRR, NDCG) to measure and improve the retrieval pipeline's performance. In the Laravel AI ecosystem, retrieval quality is evaluated using a test set of query-relevant document pairs and automated pipeline testing.

## Decomposition Strategy

This Knowledge Unit is atomic. It covers a single well-bounded concept with independent decisions, tradeoffs, and architecture guidance.

## Proposed Folder Structure
```
ku-05/
  02-knowledge-unit.md
  03-decomposition.md
  04-standardized-knowledge.md
```

## Knowledge Unit Inventory

### Retrieval Quality & Evaluation
- **Purpose:** Retrieval quality measures how well the RAG system finds relevant documents for a given query. High-quality retrieval is the foundation of effective RAG â€” even the best LLM cannot produce accurate answers from irrelevant context. Retrieval evaluation uses information retrieval (IR) metrics (precision, recall, MRR, NDCG) to measure and improve the retrieval pipeline's performance. In the Laravel AI ecosystem, retrieval quality is evaluated using a test set of query-relevant document pairs and automated pipeline testing.
- **Difficulty:** Intermediate
- **Dependencies:** ku-01, ku-02, ku-03, ku-06, ku-05

## Dependency Graph
**Depends on:**
- ku-01
- ku-02
- ku-03
- ku-06
- ku-05

**Depended by:**
- This KU serves as prerequisite for advanced patterns in the same subdomain

## Boundary Analysis
**In scope:**
- **Precision@K:** Of the top-K retrieved documents, how many are relevant. Measures how much noise is in the results.
- **Recall@K:** Of all relevant documents in the corpus, how many are in the top-K results. Measures how well the system finds relevant content.
- **Mean Reciprocal Rank (MRR):** The average of the reciprocal rank of the first relevant document. Measures how quickly the system finds relevant content.
- **Normalized Discounted Cumulative Gain (NDCG):** Accounts for graded relevance (not just binary relevant/not relevant).
- **Hit Rate:** Whether at least one relevant document is in the top-K results. Simpler metric for production monitoring.
- **Relevance Judgments:** Human or LLM-generated labels for query-document pairs (relevant, partially relevant, not relevant).
- **Test Collection:** A set of queries with known relevant documents (ground truth) for evaluating retrieval quality.
- **Ablation Study:** Systematically disabling components (hybrid search, reranking, metadata filtering) to measure their impact.

**Out of scope:**
- ku-01 topics covered in their respective KUs
- ku-02 topics covered in their respective KUs
- ku-03 topics covered in their respective KUs
- ku-06 topics covered in their respective KUs
- ku-05 topics covered in their respective KUs

## Future Expansion Opportunities
The topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

- No Knowledge Unit is overloaded
- No major concept is missing
- Boundaries are clear
- Future phases can operate on individual units
- The structure can scale without reorganization

