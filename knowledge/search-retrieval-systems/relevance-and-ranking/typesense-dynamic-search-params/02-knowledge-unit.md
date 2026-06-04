# Knowledge Unit: Typesense Dynamic Search Parameters

## Metadata

- **ID:** K035
- **Subdomain:** Relevance & Ranking
- **Source:** Typesense Docs / Scout
- **Maturity:** Stable
- **Laravel Relevance:** query_by, query_by_weights, etc.

## Executive Summary

Typesense's dynamic search parameters provide granular, query-level control over search behavior. Unlike configuration-based relevance tuning (Meilisearch ranking rules, Algolia settings), Typesense parameters like `query_by`, `query_by_weights`, `prefix`, and `drop_tokens_threshold` are specified per-query, enabling context-aware relevance strategies within a single request.

## Core Concepts

- **query_by**: The field(s) to search. Multi-field with comma separation.
- **query_by_weights**: Per-field weights (e.g., `query_by_weights: "2,1"` gives field1 twice the importance of field2).
- **prefix**: Whether to enable prefix matching (search-as-you-type).
- **drop_tokens_threshold**: Number of query tokens that must match. Lower values increase recall.
- **typo_tokens_threshold**: Number of tokens allowing typos.

## Internal Mechanics

Typesense translates these parameters into its internal scoring algorithm at query time. `query_by_weights` scales the relevance score from each field. `prefix` controls whether term matches can be prefix-only. `drop_tokens_threshold` allows dropping less important query tokens when the result set is too small. These parameters are passed in the search API call and affect only that query.

## Patterns

- **Vary search scope by context**: Search all fields for general queries, restrict to title for autocomplete.
- **Field boosting by query type**: Boost title for navigation queries, body for content queries.
- **Adjust tolerance**: Lower `typo_tokens_threshold` for short queries, higher for long.
- **Increase recall**: Lower `drop_tokens_threshold` for "no results" scenarios.

## Architectural Decisions

Typesense's parameter-per-query approach differs from Meilisearch's settings-per-index model. This provides maximum flexibility at the cost of more complex client code — each query type may need different parameter combinations.

## Tradeoffs

- Query-level control enables sophisticated per-context relevance but increases code complexity.
- Scout's abstraction layers may not expose all Typesense parameters — the callback API is needed for full access.
- Parameters must be tuned per query type, adding testing burden.

## Performance Considerations

- `query_by_weights` adds no latency — weights are applied during scoring.
- `prefix` matching may increase candidate pool size, slightly increasing latency.
- `drop_tokens_threshold` significantly impacts recall and latency — low values return more results but may be slower.

## Production Considerations

- **Define parameter presets** for each query type (autocomplete, full search, filtered search).
- **Use Scout's callback API** (K013) when Scout's abstraction doesn't expose the needed parameter.
- **Test all query types** — each parameter combination should be validated.
- **Document parameter choices** — the per-query approach makes relevance harder to reason about globally.

## Common Mistakes

- Not setting `query_by_weights` — all fields weighted equally.
- Using `prefix: true` on all queries — autocomplete behavior may be inappropriate for full-text search.
- Not adjusting `drop_tokens_threshold` — default may be too strict or too permissive.
- Expecting Scout's `where()` to expose all Typesense parameters.

## Failure Modes

- **Query returns no results**: If `drop_tokens_threshold` is too high and all tokens contain typos.
- **Slow prefix queries**: Very broad prefix matches on large datasets.
- **Inconsistent behavior**: Different parameter combinations produce results that seem inconsistent to users.

## Ecosystem Usage

Typesense's primary differentiator from Meilisearch in terms of relevance control. Used by teams that need fine-grained, per-query relevance tuning.

## Related Knowledge Units

- K033 (Typesense driver setup)
- K034 (Typesense collection schemas)
- K013 (Customizing engine searches)

## Research Notes

Source: Typesense docs. Typesense's per-query parameter approach is closer to a full-text search API than a "set and forget" search engine. This makes it more powerful but requires more developer attention to relevance tuning.


## Mental Models

- **Lightning Rod**: Typesense is designed for sub-50ms responses. Every architectural decision prioritizes speed, like a lightning rod channeling energy with minimal resistance.
- **Schema-on-Write**: Unlike schema-on-read databases, Typesense enforces structure at write time, like pre-sorting mail before delivery rather than sorting at the mailbox.

