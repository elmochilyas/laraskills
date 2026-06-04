# Skill: Implement Pagination via Link Headers

## Purpose
Include pagination navigation in HTTP `Link` headers (RFC 5988) instead of response body: `Link: <https://api.example.com/users?page=2>; rel="next"` for header-based pagination.

## When To Use
- Bare-body (no envelope) response APIs
- Bandwidth-constrained APIs
- APIs where body should contain only data

## When NOT To Use
- Envelope-style APIs (pagination in body meta)
- APIs where clients expect body-only pagination

## Prerequisites
- Pagination implementation
- Response header manipulation

## Inputs
- Pagination configuration
- URL generation for link headers

## Workflow
1. Generate pagination links from Paginator instance
2. Set `Link` header with `rel` values: `first`, `last`, `prev`, `next`
3. Format per RFC 5988: `Link: <url>; rel="next", <url>; rel="prev"`
4. Include absolute URLs in link headers
5. Preserve query parameters (filter, sort, per_page) in pagination URLs
6. Use `appends()` to include query parameters
7. Include `Link` header on all paginated responses
8. Omit null rel values — don't include prev on first page
9. Test Link header format and URLs
10. Document header-based pagination for consumers

## Validation Checklist
- [ ] Link header with first, last, prev, next rel values
- [ ] RFC 5988 formatted URLs
- [ ] Absolute URLs
- [ ] Query parameters preserved
- [ ] Null rel values omitted
- [ ] Link header on all paginated responses
- [ ] Documented for consumer usage

## Related Skills
- Pagination Metadata Design
- Top-Level Meta and Links
- Offset-Based Pagination
