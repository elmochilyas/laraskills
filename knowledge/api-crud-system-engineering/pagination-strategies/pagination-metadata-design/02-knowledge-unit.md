# Pagination Metadata Design

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** pagination-strategies
- **Knowledge Unit:** Pagination Metadata Design
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary
Pagination Metadata Design defines what pagination information is included in API responses beyond the data itself — page numbers, cursor tokens, total counts, pagination links, and navigation hints. Well-designed metadata enables clients to build robust UIs without parsing response headers.

---

## Core Concepts
- **Metadata Structure**: The envelope containing `meta` or `links` alongside the `data` array
- **Pagination Links**: `first`, `last`, `next`, `prev`, `self` URLs in the response
- **Metadata Fields**: `currentPage`, `perPage`, `total`, `lastPage`, `from`, `to`
- **Cursor Metadata**: `nextCursor`, `previousCursor`, `hasMore`, `direction`
- **Header-Based Metadata**: Using `Link` and `X-Pagination-*` headers as alternatives to body metadata
- **Standard Formats**: JSON:API pagination, envelope pagination, raw array pagination

---

## Mental Models
1. **Road Sign Model**: Pagination metadata is the road signs telling the client where they are (current page) and how to get to other pages (links).
2. **Instrument Cluster Model**: Like a car dashboard showing speed (per_page), odometer (total), and trip meter (from-to), pagination metadata shows the state of the current request context.

---

## Internal Mechanics
After the query executes with pagination, Laravel's paginator computes metadata from the query results and count. The paginator exposes methods like `total()`, `lastPage()`, `currentPage()`, `hasMorePages()`, `nextPageUrl()`, and `previousPageUrl()`. API resources transform this into the desired response shape.

---

## Patterns

### Pattern 1: Body Meta Object
**Pattern**: Include pagination metadata in a `meta` key within the response body
**Benefits**: Self-contained; always available regardless of headers
**Tradeoffs**: Adds payload size

### Pattern 2: Header-Only Metadata
**Pattern**: Place pagination info in `Link` and `X-Pagination-*` headers only
**Benefits**: Clean response body; HTTP-native
**Tradeoffs**: Clients must inspect headers

### Pattern 3: Body + Links Object
**Pattern**: Pagination info in both body `meta` and body `links` (URL objects)
**Benefits**: Matches JSON:API spec; structured navigation
**Tradeoffs**: Verbose structure

---

## Architectural Decisions
### When To Use
- All paginated endpoints (metadata is essential for client navigation)
- APIs consumed by multiple client types (web, mobile, third-party)

### When To Avoid
- Non-paginated endpoints
- Internal APIs where clients control the complete navigation flow

### Alternatives
- Just `next` URL without full metadata (for simple infinite scroll)
- Raw array without metadata (client counts manually — not recommended)

---

## Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Clients can build complete navigation | Larger response payload | Design metadata to be minimal but sufficient |
| Self-documenting responses | Inconsistent metadata formats confuse clients | Adopt a standard format (JSON:API, custom envelope) |
| Supports both page and cursor | Maintaining multiple metadata formats is complex | Choose one primary pattern and document exceptions |

---

## Performance Considerations
- Generating pagination URLs requires route generation — negligible cost
- Count queries for offset pagination add significant cost (see offset pagination KU)
- Cursor metadata generation does not require count queries
- Include `hasMore` for cursor pagination to avoid unnecessary client requests

---

## Production Considerations
- Ensure pagination URLs respect the current request's query parameters (filters, sort)
- Don't include `last` link when total is unknown (cursor pagination)
- Version pagination metadata format when making breaking changes
- Test pagination metadata with edge cases (empty results, last page, single result)

---

## Common Mistakes
**Inconsistent metadata structure**: Different endpoints returning different pagination shapes. Use a consistent resource or trait.
**Omitting `hasMore` for cursor pagination**: Clients need `hasMore` to know when to stop requesting.
**Including `last` for cursor pagination**: Cursor pagination doesn't know the last page. Don't fabricate this value.
**URL encoding issues in pagination links**: Filter values in URLs need proper encoding.

---

## Failure Modes
**Metadata mismatch**: The `total` doesn't match actual results due to concurrent modifications. *Detection:* Client-side validation. *Mitigation:* Document that totals are approximate.
**Overflow in page calculations**: Integer overflow for very large page numbers. *Detection:* Server errors. *Mitigation:* Validate page number bounds.

---

## Ecosystem Usage
Laravel's `LengthAwarePaginator` provides `toArray()` with `current_page`, `data`, `first_page_url`, `from`, `last_page`, `last_page_url`, `links`, `next_page_url`, `path`, `per_page`, `prev_page_url`, `to`, `total`. The `links` array matches the Bootstrap pagination structure by default.

---

## Related Knowledge Units
### Prerequisites
- Offset-based pagination
- Cursor-based pagination

### Related Topics
- API resource transformation
- Top-level meta and links
- API response shapes

### Advanced Follow-up Topics
- Custom paginator classes
- JSON:API pagination compliance
- Pagination metadata in different response formats

---

## Research Notes
- JSON:API specifies `first`, `last`, `prev`, `next` in the `links` object and `total` in `meta`
- `Link` header (RFC 5988) provides HTTP-level navigation without body modification
- GraphQL Relay uses `pageInfo` with `hasNextPage`, `hasPreviousPage`, `startCursor`, `endCursor`
