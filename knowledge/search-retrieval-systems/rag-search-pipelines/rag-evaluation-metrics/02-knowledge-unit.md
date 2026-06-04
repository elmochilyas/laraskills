# Knowledge Unit: Rag Evaluation Metrics

## Metadata

- **ID:** ku-00
- **Subdomain:** 14-rag-search-pipelines
- **Source:** Laravel Scout / Industry
- **Maturity:** Stable
- **Laravel Relevance:** Rag Evaluation Metrics

## Executive Summary

RAG evaluation measures both retrieval quality and generation quality. Retrieval metrics (recall, precision, MRR, NDCG) assess whether relevant context was found. Generation metrics (faithfulness, relevance, answer rate) assess whether the LLM produced correct answers grounded in context. The RAGAS framework provides a structured approach to evaluation.

## Core Concepts

- **Retrieval Recall**: Fraction of relevant documents retrieved among all relevant documents
- **Retrieval Precision**: Fraction of retrieved documents that are relevant
- **MRR (Mean Reciprocal Rank)**: Position of first relevant result (inverse rank)
- **NDCG (Normalized Discounted Cumulative Gain)**: Graded relevance with position discount
- **Faithfulness**: Does the answer stay true to retrieved context?
- **Answer Relevance**: Does the answer address the user query?
- **Context Precision**: Are all retrieved chunks actually relevant?

## Internal Mechanics

Standard implementation patterns for Rag Evaluation Metrics.

## Patterns

- Standard patterns apply for Rag Evaluation Metrics.

## Architectural Decisions

Standard architectural patterns for search and retrieval systems.

## Tradeoffs

- Standard tradeoffs apply, balancing complexity with capability.

## Performance Considerations

- Performance depends on scale and infrastructure choices.

## Production Considerations

- Standard production deployment practices apply.

## Common Mistakes

- Review anti-patterns and common pitfalls for Rag Evaluation Metrics.

## Failure Modes

- Understand failure modes for production resilience.

## Ecosystem Usage

Standard usage in Laravel search and retrieval applications.

## Related Knowledge Units

- - K069 (RAG pipeline architecture)
- - K062 (Cross-encoder re-ranking)
- - K067 (Embedding generation strategies)
- - K068 (Chunking strategies for RAG)

## Research Notes

Source: Industry documentation and community best practices.

## Mental Models

- **Abstraction Layer**: Common patterns apply across search and retrieval systems.
