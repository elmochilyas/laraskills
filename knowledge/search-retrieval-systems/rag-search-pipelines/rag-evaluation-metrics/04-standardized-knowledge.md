| Metadata | |
|---|---|
| Knowledge Unit ID | ku-04 |
| Subdomain | rag-search-pipelines |
| Topic | RAG Evaluation Metrics |
| Source | Academic / Industry |
| Maturity | New |

## Overview

RAG evaluation measures both retrieval quality and generation quality. Retrieval metrics (recall, precision, MRR, NDCG) assess whether relevant context was found. Generation metrics (faithfulness, relevance, answer rate) assess whether the LLM produced correct answers grounded in context. The RAGAS framework provides a structured approach to evaluation.

## Core Concepts

- **Retrieval Recall**: Fraction of relevant documents retrieved among all relevant documents
- **Retrieval Precision**: Fraction of retrieved documents that are relevant
- **MRR (Mean Reciprocal Rank)**: Position of first relevant result (inverse rank)
- **NDCG (Normalized Discounted Cumulative Gain)**: Graded relevance with position discount
- **Faithfulness**: Does the answer stay true to retrieved context?
- **Answer Relevance**: Does the answer address the user query?
- **Context Precision**: Are all retrieved chunks actually relevant?

## When To Use

- Evaluating RAG pipeline quality before production deployment
- Comparing different chunking/embedding/retrieval strategies
- Monitoring RAG quality in production (drift detection)
- A/B testing RAG configuration changes

## When NOT To Use

- Simple keyword search (not RAG)
- No ground truth data available for evaluation
- Only qualitative assessment is needed (manual review)
- Early prototyping (focus on building first, evaluate later)

## Best Practices

1. **Create a test set of 100-200 queries** with ground truth relevant documents.
2. **Evaluate retrieval and generation separately**: Fix retrieval first.
3. **Use RAGAS framework** for standardized evaluation.
4. **Monitor both online (user feedback) and offline (test set) metrics**.
5. **Track "answer from context" rate**: Percentage where LLM used context.
6. **Set up regression tests**: Ensure new changes don't degrade quality.

## Architecture Guidelines

- Offline evaluation: Run test set nightly, report metrics to dashboard
- Online monitoring: Log queries, retrieved chunks, generated answers, user feedback
- Alert on metric degradation: Faithfulness drop, answer rate drop
- A/B test framework: Compare two configurations on live traffic (small percentage)

## Performance Considerations

- Offline evaluation: Compute-intensive (embed all test queries, generate answers)
- RAGAS evaluation: Requires LLM calls to judge answer quality
- Store evaluation results in database for trend analysis
- Evaluation pipeline should run async (queue job)

## Security Considerations

- Test set may contain sensitive data — secure storage required
- LLM-based evaluation sends data to API providers
- Avoid including PII in evaluation samples

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---|---|---|---|
| Evaluating only retrieval or only generation | Reductionist | Miss pipeline issues | Evaluate end-to-end |
| Over-relying on a single metric | Simplification | Miss nuance | Use multiple metrics |
| Not creating ground truth data | Hard work | Can't measure quality | Invest in test set (100+ queries) |
| Ignoring user feedback | System-centric | Wrong priorities | Track thumbs up/down |
| No regression testing | Assumption changes don't regress | Degraded quality unnoticed | Automate nightly eval |

## Anti-Patterns

- **Evaluating without ground truth**: Metrics without ground truth are unreliable
- **Only measuring generation quality**: Retrieval issues go unnoticed
- **No online monitoring**: Offline metrics miss real-world performance
- **Treating evaluation as one-time**: RAG quality degrades over time (data drift)

## Examples

`php
class RAGEvaluator
{
    public function evaluate(array ): array
    {
         = [];
        foreach ( as  => ) {
             = ->ragService->answer();
            ['retrieval_recall'][] = ->recall(->chunks, );
            ['faithfulness'][] = ->faithfulness(->answer, ->chunks);
        }
        return [
            'avg_recall' => average(['retrieval_recall']),
            'avg_faithfulness' => average(['faithfulness']),
        ];
    }
}
`

## Related Topics

- K069 (RAG pipeline architecture)
- K062 (Cross-encoder re-ranking)
- K067 (Embedding generation strategies)
- K068 (Chunking strategies for RAG)

## AI Agent Notes

- RAG evaluation is essential but often skipped — prioritize it
- RAGAS is the leading framework for RAG evaluation
- Separate retrieval and generation evaluation to isolate issues
- For agents: implement a test set and nightly evaluation before production launch

## Verification

- [ ] Test set of 100+ queries with ground truth created
- [ ] Retrieval metrics (recall, MRR, NDCG) implemented
- [ ] Generation metrics (faithfulness, relevance) implemented
- [ ] Nightly evaluation pipeline running
- [ ] Online user feedback tracking (thumbs up/down)
- [ ] Alerts configured for metric degradation
- [ ] Regression testing before deployment changes
