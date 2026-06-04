| Metadata | |
|---|---|
| KU ID | ku-01 |
| Subdomain | relevance-and-ranking |
| Topic | TF-IDF & BM25 |
| Source | Academic / Industry |
| Maturity | Mature |

## Overview

TF-IDF (Term Frequency-Inverse Document Frequency) and BM25 (Best Matching 25) are the foundational ranking algorithms for keyword search. TF-IDF balances term frequency within a document against how rare the term is across all documents. BM25 extends TF-IDF with document length normalization and saturation. BM25 is the standard baseline for modern keyword search engines.

## Core Concepts

- **TF (Term Frequency)**: How often a term appears in a document
- **IDF (Inverse Document Frequency)**: How rare a term is across all documents
- **BM25**: TF-IDF with saturation (k1) and length normalization (b)
- **Saturation**: Diminishing returns for very high term frequency
- **k1 Parameter**: Controls term frequency saturation (default 1.2)
- **b Parameter**: Controls document length normalization (default 0.75)

## When To Use

- Any keyword search system — BM25 is the standard baseline
- Evaluating search quality improvements (compare against BM25 baseline)
- Understanding how search engines rank results

## When NOT To Use

- Pure vector/embedding search (semantic, not keyword)
- Systems that don't expose ranking internals (abstracted by Scout)

## Best Practices

1. **Use BM25 over TF-IDF for production**: BM25 consistently outperforms TF-IDF.
2. **Tune k1 for your corpus**: Higher k1 (2.0+) for longer documents, lower for short.
3. **Tune b for your corpus**: Higher b (1.0) for documents of varying lengths.
4. **Normalize field lengths**: Boost title matches over body matches.
5. **Use BM25 as baseline**: Any custom ranking should beat BM25.

## Architecture Guidelines

- BM25 is the default ranking for most search engines (Meilisearch, Elasticsearch, PostgreSQL FTS)
- MySQL FULLTEXT uses TF-IDF
- Scout engines abstract BM25 configuration — fine-tuning requires engine-specific API

## Performance Considerations

- BM25 computation is O(1) per term-document pair (pre-computed in inverted index)
- Ranking computation adds negligible latency at query time
- Index storage includes term frequency information

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---|---|---|---|
| Using raw TF without IDF | Simpler implementation | Common terms dominate | Use BM25 or TF-IDF |
| Not tuning k1 and b | Defaults always work | Suboptimal ranking for corpus | Test k1=0.5-3.0, b=0.5-1.0 |
| Comparing non-normalized scores across fields | Different field lengths | Title vs body imbalance | Use per-field weighting |

## Anti-Patterns

- **Implementing custom TF-IDF when BM25 libraries exist**: Use proven implementations
- **Ignoring BM25 tuning**: Default parameters may not match your content
- **Field-weighting without BM25 baseline**: Understand baseline before customizing

## Related Topics

- K030 (Meilisearch ranking rules)
- K015 (SearchUsingFullText)

## AI Agent Notes

- BM25 is the standard baseline for keyword ranking
- Meilisearch, Elasticsearch, and PostgreSQL FTS all use BM25 variants
- For agents: BM25 is the starting point; custom ranking builds on top

## Verification

- [ ] Understand TF-IDF formula
- [ ] Understand BM25 formula
- [ ] Know k1 and b parameter effects
- [ ] Test BM25 tuning on corpus
