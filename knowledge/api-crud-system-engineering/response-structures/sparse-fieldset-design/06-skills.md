# Skill: Implement Sparse Fieldsets to Let Clients Select Response Fields
## Purpose
Allow clients to request only the fields they need via `?fields[resource]=id,title,created_at` — reducing payload size, bandwidth, and processing time on both server and client.
## When To Use
Public APIs with large resources; mobile clients with limited bandwidth; list endpoints where most fields aren't needed for display; GraphQL-like field selection without the GraphQL overhead.
## When NOT To Use
Internal/admin APIs with few field variations; resources with <5 fields (no benefit); when clients expect all fields (first-party SPA with full cache).
## Prerequisites
Laravel API Resources; `?fields[]=` query parameter parsing; response structure conventions.
## Inputs
Field whitelist per resource type; query parameter (e.g., `?fields[posts]=id,title`); API Resource class.
## Workflow
1. Define an allowed field whitelist per resource type (never accept arbitrary field names)
2. Parse `fields[resource_type]` from query string
3. Validate each requested field against the whitelist — reject or silently ignore invalid fields
4. In the API Resource's `toArray()`, filter the returned fields to match the request
5. For list endpoints, apply field filtering before serialization for performance
6. Use `$this->when(in_array('field', $requestedFields))` for conditional inclusion
7. Apply the same logic to nested/included resources
8. Return 400 error if any requested field is not in the whitelist (strict mode)
## Validation Checklist
- [ ] Field whitelist exists per resource type — no arbitrary field selection
- [ ] Invalid field names are rejected (400) or silently ignored (lax mode)
- [ ] API Resource respects the field filter — unused fields are excluded
- [ ] Nested/included resources also apply their own field filtering
- [ ] Required fields (id, type) are always included, even if not requested
- [ ] Default response (no fields parameter) includes all fields
- [ ] Field selection is tested per resource type
- [ ] Whitelist is documented in the API reference
## Common Failures
- Accepting arbitrary field names from clients — exposes internal columns or relations
- `id` field is omitted when not requested — client can't identify resources
- Nested resources don't filter fields — client gets full related objects
- Whitelist not defined — server must manually check each field
- Fields parameter parsing fails with special characters or dots
## Decision Points
- Strict mode (reject invalid fields) vs lax mode (silently ignore)
- Query parameter format: `?fields[]=id,title` vs `?fields[posts]=id,title` (JSON:API style)
- Always-include fields (id, type) vs client-in-control
## Performance/Security Considerations
Sparse fieldsets reduce payload size proportionally to fields excluded. Field filtering in the Resource avoids unnecessary serialization. Security: whitelist prevents field injection; sensitive fields are excluded from the whitelist entirely.
## Related Rules/Skills
Conditional Aggregate Inclusion; JSON:API Compound Documents; Response Compression; Response Format Decision Framework.
## Success Criteria
Clients can select exactly which fields they need; invalid fields are handled gracefully; nested resources also support field selection; whitelist prevents field injection.
