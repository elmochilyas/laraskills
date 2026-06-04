# Knowledge Unit: Retrieval Quality & Evaluation

## Metadata

- **ID:** ku-05
- **Subdomain:** Retrieval-Augmented Generation
- **Slug:** retrieval-quality---evaluation
- **Version:** 1.0.0
- **Maturity:** Stable
- **Status:** Published

## Executive Summary

Retrieval quality measures how well the RAG system finds relevant documents for a given query. High-quality retrieval is the foundation of effective RAG â€” even the best LLM cannot produce accurate answers from irrelevant context. Retrieval evaluation uses information retrieval (IR) metrics (precision, recall, MRR, NDCG) to measure and improve the retrieval pipeline's performance. In the Laravel AI ecosystem, retrieval quality is evaluated using a test set of query-relevant document pairs and automated pipeline testing.

## Core Concepts

- **Precision@K:** Of the top-K retrieved documents, how many are relevant. Measures how much noise is in the results.
- **Recall@K:** Of all relevant documents in the corpus, how many are in the top-K results. Measures how well the system finds relevant content.
- **Mean Reciprocal Rank (MRR):** The average of the reciprocal rank of the first relevant document. Measures how quickly the system finds relevant content.
- **Normalized Discounted Cumulative Gain (NDCG):** Accounts for graded relevance (not just binary relevant/not relevant).
- **Hit Rate:** Whether at least one relevant document is in the top-K results. Simpler metric for production monitoring.
- **Relevance Judgments:** Human or LLM-generated labels for query-document pairs (relevant, partially relevant, not relevant).
- **Test Collection:** A set of queries with known relevant documents (ground truth) for evaluating retrieval quality.
- **Ablation Study:** Systematically disabling components (hybrid search, reranking, metadata filtering) to measure their impact.

## Mental Models

- **Precision@K:** Of the top-K retrieved documents, how many are relevant. Measures how much noise is in the results.
- **Recall@K:** Of all relevant documents in the corpus, how many are in the top-K results. Measures how well the system finds relevant content.
- **Mean Reciprocal Rank (MRR):** The average of the reciprocal rank of the first relevant document. Measures how quickly the system finds relevant content.


## Internal Mechanics

The internal mechanics of Retrieval Quality & Evaluation follow established patterns within the Retrieval-Augmented Generation domain. The implementation leverages the Laravel AI SDK conventions and ecosystem best practices.

- **Build a test collection of 100-500 query-relevant document pairs.** Manually curated or LLM-generated with human validation.
- **Evaluate multiple metrics.** Precision@K (precision focus) and Recall@K (recall focus) together tell the full story.
- **Segment evaluation by query type.** Different query types (factual, comparative, procedural) may have different optimal strategies.
- **Use relevance scoring, not just binary.** Partial relevance (a document that partially answers the query) should be scored between 0 and 1.
- **Automate evaluation in CI.** Every change to the retrieval pipeline should trigger a quality evaluation.
- **Track quality over time.** Retrieval quality changes as the corpus grows. Chart metrics weekly.

## Patterns

- **Build a test collection of 100-500 query-relevant document pairs.** Manually curated or LLM-generated with human validation.
- **Evaluate multiple metrics.** Precision@K (precision focus) and Recall@K (recall focus) together tell the full story.
- **Segment evaluation by query type.** Different query types (factual, comparative, procedural) may have different optimal strategies.
- **Use relevance scoring, not just binary.** Partial relevance (a document that partially answers the query) should be scored between 0 and 1.
- **Automate evaluation in CI.** Every change to the retrieval pipeline should trigger a quality evaluation.
- **Track quality over time.** Retrieval quality changes as the corpus grows. Chart metrics weekly.

## Architectural Decisions

- Implement a **retrieval evaluator service** that runs test queries against the pipeline and computes metrics.
- Store test collections in a **version-controlled dataset** (JSON/YAML) with query, relevant document IDs, and relevance scores.
- Use a **retrieval pipeline factory** that can construct different pipeline variants for A/B comparison.
- Generate evaluation reports as **structured data** (JSON) that can be stored and compared over time.
- For production monitoring, track **implicit quality signals**: user rephrasing queries, clicking "search again", session duration.

## Tradeoffs

Standard approach vs Custom implementation is the primary tradeoff in this KU. Standard implementations offer faster development and community support but may have overhead. Custom implementations provide tailored solutions at the cost of maintenance burden.

## Performance Considerations

- Running a full evaluation suite (100 queries Ã— multiple K values) takes 1-10 minutes (embedding + search).
- Evaluation queries should run against a **frozen snapshot** of the vector index to ensure reproducible results.
- Computed metrics can be cached â€” if the pipeline hasn't changed, neither have the metrics.
- For large test collections, sample queries for quick CI checks and run the full suite nightly.
- Relevance judgments from LLM-as-Judge: use a cheaper model and validate with human spot-checks.

## Production Considerations

- **Test collection sensitivity:** Test queries may contain sensitive information or business secrets. Store access-controlled.
- **Evaluation leakage:** Ensure test queries are not part of the indexed corpus (contaminates evaluation).
- **LLM-as-Judge bias:** The evaluation model may have biases that skew relevance judgments. Validate with human judges periodically.
- **Metric manipulation:** If quality metrics are tied to team performance, ensure they cannot be gamed.
- **Corpus integrity:** The evaluation corpus must be a representative sample of the production corpus, not cherry-picked.

## Common Mistakes

- Only measuring Precision@K without Recall@K â€” you find only relevant documents but miss many relevant ones.
- Using a test collection that doesn't represent real user queries â€” lab metrics don't match production performance.
- Not segmenting by query type â€” optimizing for the average may hurt specific query categories.
- Evaluating retrieval without evaluating end-to-end RAG quality â€” good retrieval + bad generation = bad answers.
- Over-optimizing for a test collection (overfitting) â€” the pipeline may not generalize to unseen queries.
- Not tracking quality over time â€” degradation goes unnoticed until users complain.

## Failure Modes

- **Metric Hacking:** Optimizing metrics instead of user experience. A 5% improvement in Recall@10 that doesn't improve answer quality is waste.
- **One-Time Evaluation:** Measuring quality once during development and never again. Retrieval quality degrades over time.
- **Manual Evaluation Only:** Relying entirely on human judges without automation. Doesn't scale.
- **No Baseline:** Implementing retrieval improvements without a baseline measurement â€” you can't measure improvement.
- **Ignoring Edge Queries:** Only testing with typical queries. Edge cases (typos, jargon, very short/long queries) reveal weaknesses.

## Ecosystem Usage

### Retrieval Evaluator
```php
class RetrievalEvaluator {
    /** @param TestQuery[] $testQueries */
    public function evaluate(RetrievalPipeline $pipeline, array $testQueries): EvaluationResult {
        $metrics = [];
        foreach ($testQueries as $query) {
            $results = $pipeline->search($query->text, topK: 10);
            $relevantIds = $query->relevantDocumentIds;

            $hits = 0;
            foreach ($results as $i => $result) {
                if (in_array($result->documentId, $relevantIds)) {
                    $hits++;
                    if (!isset($firstRelevantRank)) $firstRelevantRank = $i + 1;
                }
            }

            $metrics[] = [
                'query_id' => $query->id,
                'precision_at_5' => $this->precision($results, $relevantIds, 5),
                'recall_at_5' => $this->recall($results, $relevantIds, 5),
                'recall_at_10' => $this->recall($results, $relevantIds, 10),
                'mrr' => $firstRelevantRank ? (1 / $firstRelevantRank) : 0,
                'hit_rate' => $hits > 0 ? 1 : 0,
            ];
        }

        return new EvaluationResult(
            avgPrecisionAt5: array_sum(array_column($metrics, 'precision_at_5')) / count($metrics),
            avgRecallAt5: array_sum(array_column($metrics, 'recall_at_5')) / count($metrics),
            avgRecallAt10: array_sum(array_column($metrics, 'recall_at_10')) / count($metrics),
            avgMrr: array_sum(array_column($metrics, 'mrr')) / count($metrics),
            hitRate: array_sum(array_column($metrics, 'hit_rate')) / count($metrics),
        );
    }
}
```

### Test Query Collection
```json
[
  {
    "id": "q001",
    "text": "What is the refund policy for digital purchases?",
    "relevant_document_ids": ["doc_refund_policy_v2", "doc_digital_purchases_faq"],
    "relevance_scores": {"doc_refund_policy_v2": 1.0, "doc_digital_purchases_faq": 0.7}
  }
]
```

## Related Knowledge Units

- ku-01 (RAG Architecture Fundamentals): Pipeline being evaluated.
- ku-02 (Document Chunking): Chunking impact on retrieval quality.
- ku-03 (Embedding Generation): Embedding impact on retrieval quality.
- ku-06 (Multi-Modal RAG): Evaluating multi-modal retrieval.
- vector-database-integration/ku-05: Vector index quality metrics.

## Research Notes

Source: Domain analysis for AI and Intelligence Systems (Laravel/PHP ecosystem)
Source: Laravel AI SDK documentation and ecosystem package references

