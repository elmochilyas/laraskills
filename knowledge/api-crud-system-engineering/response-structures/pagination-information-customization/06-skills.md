# Skill: Customize Pagination Information in Response Metadata
## Purpose
Augment or restructure pagination metadata — adding custom fields, renaming standard keys, or including context-specific information (filter summary, sorting state) — to match client requirements and API conventions.
## When To Use
When the default pagination metadata keys don't match the API convention; when additional context (applied filters, sort state) should be included; when different endpoints need different pagination metadata.
## When NOT To Use
Standardized pagination across all endpoints (use default Laravel pagination resource); when client tooling depends on standard pagination keys.
## Prerequisites
Offset Pagination Design; Laravel API Resources; `LengthAwarePaginator` / `CursorPaginator`.
## Inputs
Paginator instance; custom metadata requirements; API design conventions.
## Workflow
1. Create a custom Pagination Resource class extending `ResourceCollection`
2. Override the `paginationInformation()` method to customize the structure
3. Add custom meta fields (filter values, sort state, request timestamp)
4. Rename keys as needed (e.g., `currentPage` → `page`)
5. Keep the `data` key unchanged — clients depend on it
6. Keep `links` structure if client tooling relies on it
7. For per-endpoint customization, use the Resource's `->additional()` method
8. Document the custom metadata keys for API consumers
## Validation Checklist
- [ ] `data` key is preserved in its expected structure
- [ ] Custom meta fields are documented and predictable
- [ ] Renamed keys are communicated to API consumers
- [ ] Different endpoints can have different metadata if needed (per-resource customization)
- [ ] `paginationInformation()` returns both `meta` and `links` arrays
- [ ] Custom fields include context (filter summary, sort state) where useful
- [ ] Null/missing values are handled consistently in custom fields
- [ ] Default pagination metadata is preserved for backward compatibility when possible
## Common Failures
- Changing the `data` key structure — breaks all clients
- Overriding `toResponse()` instead of `paginationInformation()` — more fragile
- Adding unrequested custom fields that bloat the response
- Not documenting renamed keys — client integration breaks silently
- Forgetting to preserve `links` when paginated UIs rely on link headers
## Decision Points
- Global custom pagination resource vs per-endpoint customization
- Rename keys (breaking change) vs add custom keys alongside standard ones
- `paginationInformation()` override vs `->additional()` per response
## Performance/Security Considerations
Custom pagination metadata is computed after pagination — negligible cost. Security: avoid exposing internal state (DB query conditions) in meta unless intentional.
## Related Rules/Skills
Offset Pagination Design; Cursor Pagination Metadata; Pagination Metadata Design; Top-Level Meta and Links.
## Success Criteria
Pagination metadata follows the API's custom conventions; data key preserved; additional context is included where useful; changes are documented for consumers.
