# Skill: Validate Pagination Parameters Thoroughly
## Purpose
Validate pagination input — per_page value, page number, cursor/sort parameters — before they reach the pagination query, rejecting invalid values with clear error messages.
## When To Use
Every index/list endpoint; both offset and cursor pagination; when accepting custom `per_page` values from clients.
## When NOT To Use
Non-paginated endpoints; internal endpoints that use fixed pagination (validate once in config).
## Prerequisites
Form Request Design; Offset/Cursor Pagination Design; Pagination Parameter Conventions.
## Inputs
Request parameters: `page`, `per_page`, `cursor`, `direction`, `sort` (depending on pagination type).
## Workflow
1. Validate `per_page` as integer with min/max bounds (e.g., `integer|min:1|max:100`)
2. Validate `page` as integer with minimum of 1 for offset pagination
3. Validate `cursor` as string/encoded format for cursor pagination
4. Validate `sort` against a whitelist of allowed columns (use `Rule::in()`)
5. Validate `direction` as `asc` or `desc` when applicable
6. Apply defaults via `prepareForValidation()` when parameters are missing
7. Return validation errors with the exact parameter name and allowed values
## Validation Checklist
- [ ] `per_page` has integer validation with explicit min/max
- [ ] `page` is integer and minimum 1 (offset pagination only)
- [ ] `cursor` format is validated (base64-encoded or custom format checks)
- [ ] `sort` is validated against an allowed-column whitelist
- [ ] `direction` is validated as exactly `asc` or `desc`
- [ ] Default values are applied when parameters are absent
- [ ] Error messages tell the client the allowed bounds/values
- [ ] Offset and cursor pagination have separate Form Requests (different rules)
## Common Failures
- Accepting any column name in `sort` — leads to SQL errors or column injection
- Not bounding `per_page` — clients can request 100k records per page
- Accepting `page=0` or negative page numbers
- Not validating cursor format — passing raw SQL values as cursor
## Decision Points
- Reusable PaginationRequest base class vs per-endpoint Form Request
- Enum-backed whitelist vs array-based allowed values for sort columns
## Performance/Security Considerations
Validation runs before any DB query — cheap protection against DoS via excessive per_page or invalid sort columns. Security: sort-column whitelist prevents SQL column injection through ORDER BY.
## Related Rules/Skills
Offset Pagination Design; Cursor Pagination Design; Form Request Design; Input Preparation.
## Success Criteria
All pagination parameters are validated with explicit bounds; invalid values return clear error messages; sort columns are whitelisted; per_page is capped.
