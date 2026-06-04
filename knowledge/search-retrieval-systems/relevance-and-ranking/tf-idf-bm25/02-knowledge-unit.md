# Knowledge Unit: Tf Idf Bm25

## Metadata

- **ID:** ku-01
- **Subdomain:** 08-relevance-and-ranking
- **Source:** Laravel Scout / Industry
- **Maturity:** Stable
- **Laravel Relevance:** Tf Idf Bm25

## Executive Summary

TF-IDF (Term Frequency-Inverse Document Frequency) and BM25 (Best Matching 25) are the foundational ranking algorithms for keyword search. TF-IDF balances term frequency within a document against how rare the term is across all documents. BM25 extends TF-IDF with document length normalization and saturation. BM25 is the standard baseline for modern keyword search engines.

## Core Concepts

- **TF (Term Frequency)**: How often a term appears in a document
- **IDF (Inverse Document Frequency)**: How rare a term is across all documents
- **BM25**: TF-IDF with saturation (k1) and length normalization (b)
- **Saturation**: Diminishing returns for very high term frequency
- **k1 Parameter**: Controls term frequency saturation (default 1.2)
- **b Parameter**: Controls document length normalization (default 0.75)

## Internal Mechanics

Standard implementation patterns for Tf Idf Bm25.

## Patterns

- Standard patterns apply for Tf Idf Bm25.

## Architectural Decisions

Standard architectural patterns for search and retrieval systems.

## Tradeoffs

- Standard tradeoffs apply, balancing complexity with capability.

## Performance Considerations

- Performance depends on scale and infrastructure choices.

## Production Considerations

- Standard production deployment practices apply.

## Common Mistakes

- Review anti-patterns and common pitfalls for Tf Idf Bm25.

## Failure Modes

- Understand failure modes for production resilience.

## Ecosystem Usage

Standard usage in Laravel search and retrieval applications.

## Related Knowledge Units

- - K030 (Meilisearch ranking rules)
- - K015 (SearchUsingFullText)

## Research Notes

Source: Industry documentation and community best practices.

## Mental Models

- **Abstraction Layer**: Common patterns apply across search and retrieval systems.
