| Metadata | |
|---|---|
| KU ID | K025 |
| Subdomain | synonym-and-typology-management |
| Topic | Meilisearch Typo Tolerance |
| Source | Meilisearch Docs |
| Maturity | Stable |

## Overview

Meilisearch's typo tolerance corrects misspelled search queries by matching indexed terms with similar strings. It works out of the box with no configuration. Typo tolerance is controlled by `minWordSizeForTypos` (word length thresholds for 1 vs 2 typos), `disableOnAttributes` (per-field disabling), and `disableOnWords` (per-word disabling).

## Core Concepts

- **Automatic**: Enabled by default with sensible defaults
- **Levenshtein Distance**: Typos measured by character edits (insert, delete, substitute)
- **Configurable Thresholds**: `minWordSizeForTypos: { 1: 5, 2: 9 }` — words 5+ chars get 1 typo, 9+ get 2
- **Per-Field Control**: Disable on specific fields (e.g., SKUs) via `disableOnAttributes`
- **Scoring Impact**: Exact matches ranked higher than typo-corrected matches

## When To Use

- Any user-facing search where users may misspell queries
- Content with varied or complex vocabulary
- Default configuration is suitable for most applications

## When NOT To Use

- On identifier/code fields requiring exact matches (product SKUs, serial numbers)
- When search vocabulary is controlled and predictable
- On very short fields where typos cause excessive false positives

## Best Practices

1. **Leave defaults for general text** — the 5/9 thresholds work well
2. **Disable on IDs and codes** — product SKUs, order numbers, emails
3. **Adjust thresholds for language** — shorter words in some languages need lower minimums
4. **Test with real queries** — use search analytics to find frequently mistyped terms

## Architecture Guidelines

- Configure typo tolerance at the index level via settings API
- Use `disableOnAttributes` for exact-match fields
- Use `disableOnWords` for specific terms that should never undergo fuzzy matching
- Consider language-specific tuning for non-English deployments

## Performance Considerations

- Minimal impact on query latency (microseconds per typo variation)
- Disabling on many attributes slightly improves query speed
- Very short queries with typo tolerance disabled may return zero results for misspellings

## Security Considerations

- Typo tolerance does not affect data access control
- No special security implications

## Common Mistakes

- Disabling typo tolerance globally — severely degrades search UX
- Not adjusting thresholds for specialized vocabularies (medical, legal, technical)
- Expecting typo tolerance to handle high error rates (>2 edits per word)
- Not syncing settings via `scout:sync-index-settings`

## Anti-Patterns

- **Universal disable**: Turning off typo tolerance everywhere for perceived precision gains
- **Overly aggressive thresholds**: Setting high typo counts for short words causing false positives
- **Ignoring language**: Using English defaults for non-English content without adjustment

## Examples

```
// Default thresholds
minWordSizeForTypos: { 1: 5, 2: 9 }

// Disable on SKU field
disableOnAttributes: ["sku", "serial_number"]

// Disable specific words
disableOnWords: ["iPad"]
```

## Related Topics

- K023 (Meilisearch driver setup)
- K024 (Meilisearch filterable/sortable)
- K040 (Typesense typo tolerance)
- K026 (Meilisearch synonym management)

## AI Agent Notes

- Typo tolerance is enabled by default — no explicit configuration needed for basic operation
- Always disable on exact-match fields like SKUs and serial numbers
- For agents: default thresholds work well; adjust only when analytics show problems
