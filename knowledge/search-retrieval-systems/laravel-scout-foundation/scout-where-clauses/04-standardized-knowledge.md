| Metadata | |
|---|---|
| KU ID | K011 |
| Subdomain | scout-querying |
| Topic | Scout where / whereIn / whereNotIn |
| Source | Laravel Docs / Scout |
| Maturity | Stable |

## Overview

Scout provides `where()`, `whereIn()`, and `whereNotIn()` methods on the search builder to filter results by indexed attributes. These filters are applied at the search engine level (not post-query), making them efficient for narrowing result sets. Only fields present in the search index can be filtered.

## Core Concepts

- **where(col, value)**: Exact match filter on an indexed attribute.
- **whereIn(col, [values])**: Match any of the provided values.
- **whereNotIn(col, [values])**: Exclude records matching any provided value.
- **Engine-Level Filtering**: Filters are applied by the search engine, not in PHP.
- **Indexed Attributes**: Only fields returned by `toSearchableArray()` can be filtered.

## When To Use

- Category/type filtering: `where('category_id', 5)`
- Status filtering: `whereIn('status', ['published', 'draft'])`
- Excluding records: `whereNotIn('tenant_id', [1, 2])`
- Multi-filter queries: chaining multiple where clauses

## When NOT To Use

- Complex boolean logic (AND/OR nesting limitations vary by engine)
- Range/numeric comparison (use engine-specific callbacks instead)
- Text/partial matching within where values (use search query for text matching)
- Filtering on non-indexed attributes (these don't exist in the search index)

## Best Practices

1. **Only filter indexed fields**: Attributes must be in `toSearchableArray()`.
2. **Chain filters efficiently**: Scout combines multiple where clauses at the engine level.
3. **Prefer whereIn for multiple values**: More efficient than chained OR conditions.
4. **Combine with search**: `Model::search('query')->where('status', 'published')`.
5. **Monitor filter performance**: Complex filters may slow engine queries.

## Architecture Guidelines

- Use where clauses for structured metadata filtering (category, status, price range).
- Use search queries for text/full-text matching.
- For engine-specific filter features, use the callback API instead.
- Combine with `paginate()` for filtered, paginated results.

## Performance Considerations

- Engine-level filtering is faster than post-query collection filtering.
- Using too many filter clauses may impact query performance on large indexes.
- whereIn performs better than multiple chained OR where clauses.
- Filters on low-cardinality fields (status, boolean) are very efficient.

## Examples

```php
// Basic where
$products = Product::search('shoes')
    ->where('category_id', 5)
    ->get();

// Multiple whereIn
$products = Product::search('shoes')
    ->whereIn('status', ['published', 'draft'])
    ->whereIn('brand_id', [1, 3, 5])
    ->get();

// Combined with pagination
$products = Product::search($q)
    ->where('is_visible', true)
    ->whereNotIn('tenant_id', [1])
    ->paginate(20);
```

## Related Topics

- K001 (Searchable trait)
- K012 (Scout paginate)
- K013 (Customizing engine searches)
- K005 (toSearchableArray)

## AI Agent Notes

- Only indexed attributes can be filtered — plan `toSearchableArray()` accordingly.
- Chain multiple where clauses for complex filters.
- For agents: add commonly filtered fields (status, category, tenant) to `toSearchableArray()` even if they aren't displayed in search results.

## Verification

- [ ] Filtered attributes are included in toSearchableArray
- [ ] where, whereIn, whereNotIn work as expected
- [ ] Engine-level filtering verified (not post-query)
- [ ] Filter performance acceptable for dataset size
