# Skill: Implement Standardized Query Parameter Filtering

## Purpose
Filter API lists by query parameters using exact match, partial match, and `null` filters with nested field filtering via dot notation, whitelisted fields, and consistent error responses for invalid filter keys.

## When To Use
- List endpoints requiring server-side filtering
- Public APIs with diverse client filtering needs
- Data tables with multiple filterable fields

## When NOT To Use
- Simple lists with under 100 records (client-side filtering suffices)
- Internal endpoints where all data is pre-filtered

## Prerequisites
- Eloquent query builder familiarity
- Query parameter parsing understanding

## Inputs
- Filterable field whitelist
- Filter operators per field type

## Workflow
1. Define whitelist of filterable fields with allowed operators per field (exact, partial, range, null)
2. Parse filter parameters using dot notation for nested fields: `?filter[address.city]=NYC&filter[email]=*@example.com`
3. Apply exact match filters: `where('field', $value)` for string, numeric, boolean fields
4. Apply partial match filters with wildcard `*` marker — convert to `LIKE` queries
5. Support `null` filter for nullable fields: `?filter[deleted_at]=null` resolves to `whereNull`
6. Support negated filter with `!` prefix: `?filter[!status]=archived`
7. Return 422 Unprocessable Entity for unrecognized filter keys with `available_filters` in error body
8. Return 400 Bad Request for invalid filter values against field type (string for integer field)
9. Cache filtered results when TTL and query space are appropriate
10. Document all filterable fields and operators in API documentation

## Validation Checklist
- [ ] Filterable fields whitelisted — unmatched keys return 422
- [ ] Dot notation supported for nested field filtering
- [ ] Exact match filters via `where()` on string/numeric/boolean
- [ ] Partial match via wildcard `*` converted to `LIKE`
- [ ] `null` filter resolves to `whereNull`
- [ ] Negated filters with `!` prefix supported
- [ ] 422 for unrecognized filter keys with clear error
- [ ] 400 for invalid filter values against field type
- [ ] Filterable fields documented
- [ ] Cache strategy appropriate for filter cardinality

## Common Failures
- No filter field whitelist — any field filterable, enabling data enumeration
- Wildcard filter without `LIKE` — using `=` for `*foo` misses matches
- No error response — invalid filter silently returns full dataset
- Escape missing in LIKE queries — SQL injection via `%` in filter values
- Case-sensitive matching — platform postgres vs mysql differences

## Decision Points
- Whitelist vs blacklist — whitelist for public, blacklist for internal
- Operator per field vs universal — specific operators for performance, universal for flexibility
- LIKE vs FULLTEXT — LIKE for simple, FULLTEXT for search

## Performance Considerations
- `LIKE '%value%'` cannot use indexes — prefer `LIKE 'value%'` (prefix) for indexed fields
- Composite indexes for commonly filtered field combinations
- Each filter adds a `WHERE` clause — 10+ filters on large tables may cause slow queries
- Pagination must account for filtered dataset, not total dataset

## Security Considerations
- Whitelist prevents mass enumeration via any DB column
- Escape `LIKE` wildcards (`%`, `_`) to prevent injection
- Never allow filtering on sensitive fields (password hashes, tokens)
- Rate-limit filter-heavy requests to prevent expensive query DoS

## Related Rules
- Define Filterable Field Whitelist
- Support Dot Notation For Nested Field Filtering
- Use Wildcard For Partial Match, Resolve to LIKE
- Return 422 For Unrecognized Filter Keys
- Return 400 For Invalid Filter Values
- Document Filterable Fields and Operators

## Related Skills
- Query Parameter Based Sorting — for sort functionality
- Pagination Strategy Selection — for paginated filtered results
- Search Query Implementation — for full-text search

## Success Criteria
- Filtering works for exact, partial, and null values across whitelisted fields
- Unrecognized filter keys return 422 with available filters listed
- Invalid filter values return 400 with type explanation
- LIKE queries use escaped values preventing SQL injection
- Documented filterable fields match actual behavior
