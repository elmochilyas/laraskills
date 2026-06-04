# Skill: Validate Bulk/Create Request Arrays Against Unique Rules Per Expected Rows
## Purpose
Validate arrays of objects in bulk create/update requests — ensuring each row passes the same rules, unique rules account for per-row IDs, and the array structure itself is validated before row-level rules.
## When To Use
Bulk create endpoints (`POST /api/resources/bulk`); bulk update endpoints (`PATCH /api/resources/bulk`); CSV/JSON import endpoints that process multiple records.
## When NOT To Use
Single-record create/update (use standard Form Request); chunked batch processing (validate inside the chunk); file upload parsing that happens before validation.
## Prerequisites
Form Request Design; Validation Rule Arrays; Unique validation rule understanding.
## Inputs
Bulk input payload (array of objects); expected row schema; database table for unique checks.
## Workflow
1. Validate the outer array structure first — min/max size, required presence
2. Validate each row using `*.*` dot-notation rules in the Form Request
3. For unique rule in bulk updates, pass the per-row ID as the ignore parameter
4. Use `validationData()` or custom data preparation to ensure each row has its ID available
5. For bulk creates, skip the ignore parameter — all values must be unique
6. Return per-row validation error messages using `Validator::make()` with custom messages
## Validation Checklist
- [ ] Outer array is validated for min/max size
- [ ] Each row uses `*.*` dot-notation for field rules
- [ ] Bulk update unique rules use per-row ID as ignore value
- [ ] Bulk create unique rules have no ignore value
- [ ] Error messages include row index for debugging
- [ ] Required rules apply to each row independently
- [ ] Nested array validation handles nullable/missing rows gracefully
## Common Failures
- Applying `unique` without per-row ignore — first row passes, rest fail
- Using `array` validation rule without specifying `min`/`max`
- Forgetting to prepare validation data so each row contains its ID
- Not providing per-row error messages — consumer can't identify which row failed
## Decision Points
- Single bulk endpoint vs client-side batching with individual requests
- Row-level error reporting (indexed array) vs first-failure-fast approach
## Performance/Security Considerations
Bulk validation is memory-intensive — set reasonable array size limits. Use chunked DB validation for very large arrays. Security: validate array size before DB queries to prevent DoS via oversized payloads.
## Related Rules/Skills
Form Request Design; Validation Rule Array Design; Input Preparation; DTO Integration.
## Success Criteria
Bulk requests validate each row independently, unique rules correctly use per-row IDs for updates, and error messages identify the failing row index.
