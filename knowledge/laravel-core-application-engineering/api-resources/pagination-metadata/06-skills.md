# Skill: Customize Pagination Metadata in Collections

## Purpose

Customize the pagination `links` and `meta` structure in collection responses to provide consistent navigation metadata across all list endpoints.

## When To Use

- Customizing the default pagination metadata shape for your API
- Adding endpoint-specific context (applied filters, sort parameters) to pagination metadata
- Creating a base collection class for consistent pagination structure
- Switching between paginator types (`LengthAwarePaginator`, `CursorPaginator`, `Paginator`)

## When NOT To Use

- When the default pagination structure is sufficient — avoid unnecessary customization
- When business data needs to be in the response — place it in `data` or dedicated top-level keys, not in pagination metadata
- When pagination metadata structure changes per endpoint — clients need consistent parsing

## Prerequisites

- A `ResourceCollection` class (named or anonymous)
- A controller that passes a paginator instance to the collection
- Understanding of paginator types: `LengthAwarePaginator`, `CursorPaginator`, `Paginator`

## Inputs

- Collection class file
- Paginator type decision (offset, cursor, or simple)
- Desired metadata structure (default or custom)
- Controller that sets `per_page` cap

## Workflow

1. Decide which paginator type to use:
   - `LengthAwarePaginator` — full metadata (`total`, `last_page`), requires `COUNT(*)` query
   - `CursorPaginator` — no count query, stable performance at any depth, no random page access
   - `Paginator` — simple prev/next, no `total` or `last_page`
2. Create a base collection class (if 3+ collection endpoints exist) to enforce consistent `links` and `meta` structure.
3. Override `paginationInformation()` in the collection or base class to customize the metadata shape — keep customizations minimal.
4. Always include `per_page` and `total` in pagination metadata (except cursor pagination where total is unavailable).
5. Cap `per_page` in the controller: `$perPage = min((int) $request->input('per_page', 20), 100)`.
6. Use unique key names for any added metadata that will not collide with pagination's built-in `data`, `links`, and `meta` keys.
7. Never embed business data (aggregate counts, computed values) inside pagination metadata — use separate top-level keys or the `data` array.
8. Document the paginator type per endpoint so clients know which metadata fields to expect.
9. Write tests that assert pagination structure (key presence and types) rather than exact URL values.

## Validation Checklist

- [ ] All list endpoints returning >50 items are paginated
- [ ] Paginated responses include consistent `links` and `meta` keys
- [ ] `per_page` is capped (max 100) to prevent oversized responses
- [ ] Pagination metadata structure is consistent across all endpoints (via base class)
- [ ] Cursor pagination is used for datasets >1M rows or deep page access
- [ ] No sensitive data in pagination metadata
- [ ] No business data mixed into pagination metadata
- [ ] Paginator type is documented per endpoint

## Common Failures

- Mixing paginator types — expecting cursor metadata from `LengthAwarePaginator` or vice versa causes missing keys
- Hardcoded pagination URLs in tests — tests fail in different environments (localhost vs production URL)
- Inconsistent meta across endpoints — every collection customizing `paginationInformation()` differently prevents generic client pagination handlers
- Unlimited `per_page` — allowing clients to request `per_page=999999` bypasses pagination and risks memory exhaustion
- Business data in pagination metadata — mixing filtering counts or aggregate values with pagination state violates separation of concerns

## Decision Points

- **Offset vs cursor pagination**: Use offset (`LengthAwarePaginator`) when random page access is required ("go to page 5"). Use cursor (`CursorPaginator`) for datasets >1M rows or when deep pagination causes performance issues.
- **Default vs custom metadata**: Use the default structure unless you have a specific reason to change it. Every customization makes client code more complex.
- **Base class vs per-collection customization**: Use a base class when 3+ collection endpoints exist. For fewer, the overhead of maintaining a base class may outweigh the consistency benefit.

## Performance Considerations

- `LengthAwarePaginator` runs `COUNT(*)` — expensive on tables with millions of rows even with indexes
- `CursorPaginator` uses WHERE clauses instead of OFFSET — no count query, stable performance at any depth
- Large offset pagination (page 1000 of 10M) scans and skips millions of rows — always use cursor pagination for deep pagination
- `paginationInformation()` adds sub-millisecond overhead — negligible compared to the data query

## Security Considerations

- Pagination links expose the API base URL structure — ensure URL generation does not leak internal hostnames or ports
- `per_page` values should be capped to prevent client-requested oversized responses (DoS vector)
- Cursor values are base64-encoded JSON — they can be decoded by clients; do not put sensitive data in cursor values
- Rate limiting should apply to paginated endpoints to prevent exhaustive data scraping

## Related Rules

- Always Include per_page and total in Paginated Responses (Design)
- Cap per_page to Prevent Oversized Responses (Security)
- Use a Base Collection Class for Consistent Pagination Metadata (Code Organization)
- Prefer CursorPaginator for Datasets Over 1M Rows (Performance)
- Never Include Business Data Inside Pagination Metadata (Design)
- Test Pagination Structure, Not Exact URLs (Testing)
- Document the Paginator Type Per Endpoint (Maintainability)
- Keep paginationInformation Customizations Minimal (Maintainability)

## Related Skills

- [Resource Collections](../resource-collections/06-skills.md)
- [Top-Level Meta Data](../top-level-meta-data/06-skills.md)
- [Data Wrapping](../data-wrapping/06-skills.md)

## Success Criteria

- All paginated list endpoints return consistent `links` and `meta` structure
- `per_page` is always capped at a reasonable maximum
- Paginator type is chosen appropriately for the dataset size
- No business data appears inside pagination metadata
- Tests verify pagination structure without depending on exact URLs
