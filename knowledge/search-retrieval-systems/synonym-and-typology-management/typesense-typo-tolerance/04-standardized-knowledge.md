| Metadata | |
|---|---|
| KU ID | K040 |
| Subdomain | synonym-and-typology-management |
| Topic | Typesense Typo Tolerance |
| Source | Typesense Docs |
| Maturity | Stable |

## Overview

Typesense provides configurable typo tolerance with per-field control, enabling fine-grained management of fuzzy matching behavior. Parameters include `num_typos` (max allowed), `typo_tokens_threshold`, and per-field overrides. Typo tolerance is configured at the collection level during schema definition.

## Core Concepts

- **num_typos**: Maximum typo corrections per word (1 or 2)
- **typo_tokens_threshold**: Minimum query tokens that must have typos before tolerance activates
- **Per-Field Control**: Disable or adjust tolerance for specific fields
- **Levenshtein-Based**: Character edit distance measurement
- **Schema-Level Config**: Set during collection creation — changes may require re-creation

## When To Use

- User-facing search where misspellings are common
- General text fields (descriptions, body content)
- Multi-language search with varied spelling patterns

## When NOT To Use

- Identifier fields requiring exact matches (SKUs, order numbers, emails)
- Very short code fields where 2 typos cause excessive false positives
- When collection schema changes are expensive and typo settings are untested

## Best Practices

1. **Disable on identifier fields** — SKUs, serial numbers, product codes
2. **Lower tolerance on short fields** — names, codes have fewer characters
3. **Increase tolerance on long fields** — body text benefits from fuzzy matching
4. **Define in collection schema from the start** — changes may require collection re-creation
5. **Test with real user queries** before deploying

## Architecture Guidelines

- Configure at collection creation time via schema definition
- Use per-field overrides where exact vs fuzzy matching requirements differ
- Typesense's schema-level config is less flexible than Meilisearch's settings-based approach
- Scout does not expose per-field typo settings — use direct API or Scout callback

## Performance Considerations

- Minimal latency impact per query
- Disabling on high-cardinality fields reduces false positives
- Higher `num_typos` (2 vs 1) slightly increases candidate pool

## Security Considerations

- No security implications beyond standard API key management
- Schema-level settings affect all users equally

## Common Mistakes

- Setting `num_typos` too high for short fields — "iPad" with 2 typos matches unrelated products
- Not disabling on product SKUs — "ABC-123" matches "ABD-124"
- Relying on Scout to configure per-field typo settings
- Schema lock-in — cannot change typo tolerance without re-creating the collection

## Anti-Patterns

- **One-size-fits-all**: Applying the same typo settings to all fields
- **Post-hoc configuration**: Adding typo settings after collection creation is costly
- **No testing**: Deploying typo changes without validating against real queries

## Examples

```
// Collection schema with per-field typo settings
{
  "name": "products",
  "fields": [
    {"name": "title", "type": "string", "typo_tolerance": {"enabled": true}},
    {"name": "sku", "type": "string", "typo_tolerance": {"enabled": false}},
    {"name": "description", "type": "string", "typo_tolerance": {"enabled": true}}
  ],
  "default_sorting_field": "price"
}
```

## Related Topics

- K033 (Typesense driver setup)
- K034 (Typesense collection schemas)
- K025 (Meilisearch typo tolerance)
- K039 (Typesense synonym management)

## AI Agent Notes

- Per-field typo tolerance is configured at schema creation time in Typesense
- Scout does not abstract Typesense's typo settings — manage via CollectionSchema callback or direct API
- For agents: define typo tolerance in the collection schema; changes may require re-creation
