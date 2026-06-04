# Skill: Implement Query Parameter Sorting

## Purpose
Sort API list responses via `sort` query parameter with multi-field support, direction prefixes (`+`/`-`), whitelisted sortable fields, stable sort by ID tiebreaker, and 422 for invalid sort fields.

## When To Use
- List endpoints requiring server-side sorting
- Data tables with sortable column headers
- APIs serving UI components with user-configurable sort

## When NOT To Use
- Lists with fixed sort order (e.g. recent first always)
- Internal feeds where sort is pre-determined

## Prerequisites
- Eloquent query builder familiarity
- Query parameter parsing understanding

## Inputs
- Sortable field whitelist
- Default sort specification

## Workflow
1. Define whitelist of sortable fields — never allow arbitrary column sorting
2. Parse sort parameter with multi-field support: `sort=-created_at,name`
3. Use `+` prefix for ascending (default) and `-` prefix for descending
4. Apply `orderBy` for each field in the order specified — first field is primary sort
5. Append model's primary key as tiebreaker to ensure stable pagination: `->orderBy('id')`
6. Return 422 Unprocessable Entity for unrecognized sort fields with `available_sort_fields` in error body
7. Document default sort order and all sortable fields
8. Log excessive sort field counts (>3) as potential scraping attempts
9. Respect direction case — `+field` and `-field`, not `field:asc`

## Validation Checklist
- [ ] Sortable fields whitelisted — unmatched fields return 422
- [ ] Multi-field sort supported with comma separation
- [ ] `+` prefix for ascending, `-` prefix for descending
- [ ] Primary key used as tiebreaker for stable pagination
- [ ] 422 for unrecognized sort fields with available list
- [ ] Default sort documented and applied when sort param missing
- [ ] Sorting direction respects `+`/`-` convention
- [ ] Excessive sort field counts logged
- [ ] Sort applied in client-specified order (first field = primary)

## Common Failures
- No sort tiebreaker — pagination duplicates/omits records when sort values repeat
- Allowing sort on non-indexed fields — full table scans on large datasets
- No validation of sort fields — client can sort by `password` if exposed
- Unsafe column names — SQL injection via sort field
- ASC as default when field is logically DESC (e.g. created_at typically newest first)
- Case-sensitive sorting config — mysql `utf8_general_ci` sorts differently from `utf8mb4_unicode_ci`

## Decision Points
- `+`/`-` prefix vs `field:asc` syntax — `+`/`-` is more concise
- Default sort — typically `-created_at` for most resources
- Sortable fields whitelist — include indexed fields first for performance

## Performance Considerations
- Sorting on non-indexed fields causes filesort (full table scan)
- Multi-field sort with 3+ fields increases sort time exponentially
- Tiebreaker `id` column should be indexed — it's always in sort
- Consider covering indexes for common sort + filter combinations

## Security Considerations
- Whitelist prevents sorting on sensitive or internal fields
- Never allow sorting on hashed/password/secret columns
- Log anomalous sort patterns (>3 fields, uncommon field combinations)
- SQL injection via sort field is prevented by whitelist validation

## Related Rules
- Define Sortable Field Whitelist
- Support Multi-Field Sort With Direction Prefix
- Append Primary Key as Tiebreaker For Stable Pagination
- Return 422 For Unrecognized Sort Fields
- Document Default and Available Sort Orders
- Log Excessive Sort Field Counts

## Related Skills
- Query Parameter Filtering — for filter parameter design
- Pagination Strategy Selection — for paginated sorted results
- Pagination Cursor vs Offset — for cursor-based pagination

## Success Criteria
- Multi-field sorting works with `+`/`-` direction prefixes
- Pagination is stable — no duplicate/missing records across pages
- Sortable fields whitelist prevents column enumeration
- Unrecognized sort fields return 422 with available options
- Default sort applied when parameter is absent
- Indexed fields used for sort where available
