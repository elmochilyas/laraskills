# Skill: Design API Response Structure

## Purpose
Design consistent API response shapes for list, detail, create, update, and delete operations with standard fields per operation type and predictable data placement within the envelope.

## When To Use
- API response structure design phase
- Every endpoint response shape definition
- API contract documentation

## When NOT To Use
- Non-API responses (Inertia, Blade)
- Binary/file download responses

## Inputs
- Resource schema definitions
- Operation type per endpoint

## Workflow
1. Define list response shape: `{data: [], meta: {pagination}, links: {navigation}}`
2. Define detail response shape: `{data: {attributes}, meta: {}}`
3. Define create response shape: `{data: {attributes}}` with 201 status and `Location` header
4. Define update response shape: `{data: {attributes}}` with 200 status
5. Define delete response shape: 204 No Content — no body, no envelope
6. Use consistent field names across resources: `id`, `type`, `attributes` for all resources
7. Place pagination metadata in `meta`, not in `data`
8. Place related resource URLs in `links`, not embedded in `data`
9. Include `Location` header for create responses pointing to new resource
10. Document response shapes per operation type in API docs

## Validation Checklist
- [ ] List response: `data[]` with pagination in `meta`
- [ ] Detail response: `data{}` with resource attributes
- [ ] Create response: 201 with resource in `data` and `Location` header
- [ ] Update response: 200 with resource in `data`
- [ ] Delete response: 204 No Content
- [ ] Consistent field names across all resources
- [ ] Pagination metadata in `meta` not in `data`
- [ ] Resource links in `links` section
- [ ] `Location` header on create responses
- [ ] Response shapes documented per operation type

## Common Failures
- Inconsistent shapes — list returns `{data: [...]}`, detail returns `{user: {...}}`
- Delete returning body — 200 with `{data: null}` instead of 204
- Create returning 200 instead of 201 — client can't distinguish create from non-create
- Missing `Location` header on create — client doesn't know new resource URL
- Pagination data in `data` key instead of `meta` — breaks generic list parsing
- Resource type missing — client can't determine resource type generically
- Field name inconsistency — `createdAt` in one, `created_at` in another

## Decision Points
- Single resource vs array for actions — single for create/update, array for list
- 201 vs 202 for async creates — 201 for synchronous, 202 for queued/async
- Response structure versioning — shaped in envelope, version affects envelope

## Performance Considerations
- Consistent shapes enable client code generation — reduces development time
- 204 for delete reduces bandwidth and processing — no body to parse
- 201 with body reduces client round-trip — client doesn't need separate GET
- `Location` header parsing is O(1) — no body parsing needed

## Security Considerations
- 204 responses must not have body — body on 204 may be ignored or expose data
- `Location` header must be valid, scoped URL — not open redirect
- Resource `type` field must not expose internal implementation details
- Response shapes must not differ for authorized vs unauthorized users (different shapes hint at existence)

## Related Rules
- Define Response Shape Per Operation Type
- Use Consistent Field Names Across Resources
- Return 201 With body And Location For Creates
- Return 204 No Content For Deletes
- Place Pagination In meta, Not data
- Document Response Shapes Per Operation Type

## Related Skills
- Envelope Response Design — for envelope structure
- API Resource Transformation — for resource serialization
- Pagination Metadata Design — for pagination in list responses
- HTTP Method Semantics — for status code selection

## Success Criteria
- Response shapes consistent across all endpoints of same operation type
- Clients can generically parse list, detail, create, update, delete responses
- 201 status with body and Location header for creates
- 204 with no body for deletes
- 200 with body for updates and detail
- Pagination in meta for lists
- Consistent field naming across all resource types
- Response shapes documented and testable
