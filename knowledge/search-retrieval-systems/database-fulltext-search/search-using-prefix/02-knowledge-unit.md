# Knowledge Unit: SearchUsingPrefix Attribute

## Metadata

- **ID:** K016
- **Subdomain:** Full-Text Search Engines
- **Source:** Laravel Docs / Scout
- **Maturity:** Stable
- **Laravel Relevance:** Prefix search optimization

## Executive Summary

The `SearchUsingPrefix` attribute optimizes Scout's database engine to use prefix matching (`example%`) instead of substring matching (`%example%`) for specific columns. This enables the use of standard B-tree indexes for LIKE queries with trailing wildcards, avoiding expensive full-text scans on columns where prefix matching is semantically appropriate (IDs, SKUs, emails, slugs).

## Core Concepts

- **Prefix-Only Search**: The search term is matched against the beginning of the column value only.
- **B-Tree Index Compatible**: A standard B-tree index on the column can accelerate prefix searches.
- **Use Case**: Columns where users search by prefix: order numbers (`ORD-2024-*`), emails (`user@*`), SKUs (`PROD-*`).
- **Scout's Database Engine**: Only effective with the `database` Scout driver.

## Internal Mechanics

Scout's database engine, when encountering a `SearchUsingPrefix`-attributed column, generates `LIKE 'term%'` instead of `LIKE '%term%'`. The trailing wildcard allows PostgreSQL and MySQL to use a standard B-tree index on the column (if one exists). Without the prefix optimization, the leading `%` prevents index usage and forces a full sequential scan.

## Patterns

- **Apply to identifier columns**: `sku`, `order_number`, `email`, `username`, `slug`.
- **Combine with `SearchUsingFullText`**: Use prefix for IDs/codes, full-text for body content.
- **Create B-tree indexes** on prefix-searched columns.

## Architectural Decisions

The attribute-based design keeps the optimization declaration close to the property definition. Laravel chose a separate attribute (rather than a parameter on `SearchUsingFullText`) because the underlying index strategy is fundamentally different.

## Tradeoffs

| Strategy | Index Used | Performance | Use Case |
|---|---|---|---|
| Default LIKE `%term%` | None (seq scan unless pg_trgm) | Slow on large tables | Substring matching |
| `SearchUsingPrefix` | B-tree index | Fast (index seek) | Prefix matching |
| `SearchUsingFullText` | FULLTEXT/GIN | Very fast | Natural language |

## Performance Considerations

- Prefix search with a B-tree index is O(log n) — sub-millisecond even on millions of rows.
- Default LIKE `%term%` is O(n) — full scan of all rows.
- Without `SearchUsingPrefix`, B-tree indexes are useless for search queries.

## Production Considerations

- **Create B-tree indexes** on prefix-searchable columns for performance gains.
- **Use for columns where prefix search is the correct behavior**: SKUs, order IDs, email domains.
- **Do not use for natural language text** where users need substring matching.

## Common Mistakes

- Using on natural language text where substring matching is expected (users search "shirt" and expect "t-shirt" to match).
- Not creating a B-tree index — the prefix optimization still works but without the index benefit.
- Applying to both `SearchUsingFullText` and `SearchUsingPrefix` (mutually exclusive strategies).

## Failure Modes

- **Missing index**: Prefix LIKE performs a sequential scan without a B-tree index, though still faster than full substring scan.
- **Wrong semantic**: Applying prefix to text columns where expected search behavior is substring or full-text matching.

## Ecosystem Usage

Recommended for production use of Scout's database engine where columns have identifier semantics. Often paired with `SearchUsingFullText` for a hybrid column strategy.

## Related Knowledge Units

- K002 (Scout database engine)
- K015 (SearchUsingFullText attribute)

## Research Notes

Source: Laravel 11.x docs. The `SearchUsingPrefix` attribute is part of Laravel's continued investment in making the database engine production-viable. It directly addresses the most common performance complaint about the database engine: slow LIKE queries.


## Mental Models

- **Autocomplete on Steroids**: Prefix search is like having a phone's autocomplete for your entire database — as you type each character, the search narrows in real-time.

