# Skill: Structure Top-Level Meta and Links in API Responses
## Purpose
Define a consistent top-level envelope for all API responses — `data` for primary resources, `meta` for metadata, `links` for navigational URLs — giving clients a predictable structure for every endpoint.
## When To Use
Every API response (success and error); when standardizing response structure; when adopting JSON:API or custom envelope conventions.
## When NOT To Use
Non-JSON responses (file downloads, redirects); streaming responses (SSE); when clients already parse a different structure (migrate with versioning).
## Prerequisites
Laravel API Resources; JSON response structure conventions; Pagination Metadata Design.
## Inputs
Primary resource data; metadata (timestamps, version, pagination); navigational links (self, related).
## Workflow
1. Wrap primary resource in a `data` key (single resource object or array)
2. Add `meta` key with resource metadata (timestamps, version, pagination meta)
3. Add `links` key with navigational URLs (self, related, pagination links)
4. For created resources, include `Location` header with resource URL
5. For error responses, use `error` or `errors` key with consistent error object structure
6. Use API Resources to generate the envelope — not manual array construction
7. For paginated responses, let Laravel's paginator generate `meta` and `links`
8. Keep the envelope structure identical across all endpoints
## Validation Checklist
- [ ] `data` key wraps the primary resource (object or array)
- [ ] `meta` key is present on all responses (empty object if no metadata)
- [ ] `links` key is present with at least `self` link
- [ ] Paginated responses include pagination meta and pagination links
- [ ] Error responses use `error`/`errors` key with consistent shape
- [ ] `Location` header is set for 201 responses
- [ ] Envelope structure is identical across all endpoints
- [ ] API Resources generate the envelope consistently
- [ ] `data` is `null` for 204 responses (no content)
- [ ] `meta` uses snake_case keys for consistency with JSON conventions
## Common Failures
- Inconsistent envelope — some endpoints wrap in `data`, others return raw arrays
- `meta` key omitted when there is no metadata — client must handle optional key
- `links` key absent — client can't construct related resource URLs
- Custom envelope differs between success and error responses
- `data` is an object for single resources but array for collections — client must handle both
- `Location` header missing on 201 responses
## Decision Points
- Single resource = `data` object vs `data` array with one item
- `meta` always present vs conditional presence
- Error response shape: single `error` object vs `errors` array
## Performance/Security Considerations
Envelope wrapping adds minimal JSON overhead. Security: consistent envelope prevents client-side parsing vulnerabilities; never expose internal data in `meta` or `links`.
## Related Rules/Skills
Pagination Metadata Design; Resource Controller Response Selection; Response Format Decision Framework; JSON:API Compound Documents.
## Success Criteria
All responses follow the same `data`/`meta`/`links` structure; clients parse every endpoint with the same logic; error responses match the success structure pattern.
