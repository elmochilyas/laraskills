| Metadata | |
|---|---|
| KU ID | K035 |
| Subdomain | relevance-and-ranking |
| Topic | Typesense Dynamic Search Parameters |
| Source | Typesense Docs / Scout |
| Maturity | Stable |

## Overview

Typesense supports dynamic search parameters that can be configured per-query via Scout's callback API. Parameters include `query_by` (which fields to search), `query_by_weights` (field importance), `num_typos` (typo tolerance), `max_candidates` (candidate pool), `prefix` (prefix matching), and `drop_tokens_threshold`. These parameters allow fine-grained control over search behavior for each query.

## Core Concepts

- **query_by**: Which fields to search and their order (determines field weighting).
- **query_by_weights**: Numeric weights per field setting relative importance.
- **num_typos**: Number of typo corrections allowed (0, 1, 2).
- **max_candidates**: Maximum candidates for ANNHSNW search (quality vs speed).
- **prefix**: Enable/disable prefix matching per field.
- **drop_tokens_threshold**: Threshold below which tokens are dropped for result inclusion.

## When To Use

- Every Typesense-based Scout integration (parameters are per-query customizable)
- Tuning search quality for specific query patterns
- Adjusting typo tolerance per-field (strict on SKUs, relaxed on descriptions)
- Setting different field weights for different search contexts

## When NOT To Use

- Static/global search behavior (configure in collection schema instead)
- When using a non-Typesense search engine
- Very simple search needs where defaults are sufficient

## Best Practices

1. **Set query_by with field priority**: Order fields by importance (title first, body last).
2. **Use query_by_weights for granular control**: Higher weight = more important field.
3. **Adjust num_typos per field**: SKUs and codes should have 0-1 typos; descriptions 2.
4. **Tune max_candidates**: Higher values improve recall at the cost of speed.
5. **Abstract through Scout callbacks**: Keep Typesense parameters in dedicated service classes.

## Architecture Guidelines

- Use Scout's callback API to pass Typesense-specific parameters per query.
- Define default parameters in a service class and override per-query as needed.
- Parameters are passed via `$builder->query(function ($typesense, $query) { ... })`.
- Schema-level defaults can be set in the collection schema in scout.php.

## Performance Considerations

- Larger `max_candidates` improves recall but increases query latency.
- Higher `num_typos` increases search space and latency slightly.
- Prefix search on many fields adds overhead.
- Parameter tuning has a direct impact on query performance.

## Related Topics

- K033 (Typesense driver setup)
- K034 (Typesense collection schemas)
- K040 (Typesense typo tolerance)
- K013 (Customizing engine searches)

## AI Agent Notes

- Typesense's per-query parameters provide fine-grained control over search behavior.
- `query_by` order determines field importance in search results.
- For agents: use Scout callback API for dynamic parameters; set field weights via `query_by_weights`; tune `num_typos` per field type.

## Verification

- [ ] query_by configured with correct field priority
- [ ] query_by_weights set for field importance
- [ ] num_typos tuned per field type
- [ ] max_candidates optimized for recall/latency balance
- [ ] Parameters abstracted through Scout callback API
