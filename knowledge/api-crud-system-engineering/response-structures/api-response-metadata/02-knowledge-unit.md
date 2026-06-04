# API Response Metadata

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** response-structures
- **Knowledge Unit:** API Response Metadata
- **Difficulty Level:** Foundation
- **Last Updated:** 2026-06-04

---

## Executive Summary
API Response Metadata includes non-primary data in API responses — timestamps, request IDs, pagination info, resource counts, and version information. Well-designed metadata provides context that helps clients process responses correctly and debug issues efficiently.

---

## Core Concepts
- **Metadata Placement**: The `meta` key in the response envelope alongside `data` and optional `links`
- **Request Identifiers**: A unique `request_id` or `trace_id` for correlating client and server logs
- **Timestamps**: `server_time` for clock synchronization, `response_time` for latency tracking
- **Pagination Metadata**: `currentPage`, `perPage`, `total`, `lastPage`, `from`, `to` (see pagination metadata KU)
- **API Version Info**: Current API version in the response for client-side version detection
- **Resource Counts**: Total resources returned on list endpoints for display

---

## Mental Models
1. **Package Shipping Label Model**: The data is the package contents; the metadata is the shipping label with tracking number, timestamp, and handling instructions.
2. **Newspaper Header Model**: Data is the news articles; metadata is the masthead (publication date, edition number, section headers).

---

## Internal Mechanics
A base API resource class or response macro adds metadata to every response. Alternatively, middleware appends metadata to all JSON responses. `JsonResource::additional()` merges metadata into the resource response. A centralized `ApiResponse` helper class can ensure consistent metadata across all endpoints.

---

## Patterns

### Pattern 1: Middleware-Injected Metadata
**Purpose**: Global middleware appends metadata to all JSON responses
**Benefits**: Consistent, cannot be forgotten, centralized
**Tradeoffs**: All responses include metadata, even error responses

### Pattern 2: Resource Base Class Metadata
**Purpose**: A base resource adds metadata via `with()` method
**Benefits**: Resource-specific metadata; integrates with resource transformations
**Tradeoffs**: Only applies to resource responses, not errors

---

## Architectural Decisions
### When To Use
- All APIs where clients need request tracing or debugging context
- Public APIs where consumers need to know API version
- Multi-service architectures requiring request correlation

### When To Avoid
- Internal APIs with simple consumers that don't need metadata
- High-throughput APIs where every byte counts
- Real-time streaming APIs (metadata adds overhead per message)

### Alternatives
- Header-based metadata (X-Request-Id, X-API-Version)
- Response envelope only for error cases
- Client-provided correlation IDs

---

## Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Request tracing and debugging | Adds payload size | Keep metadata minimal (3-5 fields) |
| Client knows API version | Version in metadata may conflict with headers | Use consistent version source |
| Correlation across services | Must generate and propagate request IDs | Use distributed tracing middleware |

---

## Performance Considerations
- Metadata generation adds minimal overhead (<0.5ms)
- Timestamp resolution: use milliseconds, not microseconds, for readability
- Request IDs: UUID v4 generation is fast, but sequential IDs are faster
- Metadata serialization adds bytes to every response — keep the structure small

---

## Production Considerations
- Include a `request_id` in every response for debugging
- Log the request_id in server logs for correlation
- Use the same request_id across microservices for tracing
- Don't expose internal metadata (server hostname, internal IPs)
- Monitor metadata size in response payload statistics

---

## Common Mistakes
**Exposing internal server info**: Including `server_name`, `host`, `php_version` in metadata is a security risk.
**Inconsistent metadata across endpoints**: Some endpoints return metadata, others don't. Enforce via middleware or base class.
**Redundant version info**: Including version in both header and body metadata creates ambiguity. Use one canonical source.
**Overly verbose metadata**: Including unnecessary fields wastes bandwidth. Keep metadata minimal and focused on client needs.

---

## Failure Modes
**Request ID collision**: Non-unique request IDs make debugging impossible. *Detection:* Duplicate ID in logs. *Mitigation:* Use UUID v4 or database-generated sequence with high collision resistance.
**Clock skew in timestamps**: Different servers report different times for the same request. *Detection:* Client sees negative latency. *Mitigation:* Use a single NTP source, or use monotonic clocks for durations.

---

## Ecosystem Usage
Laravel doesn't include metadata by default. `Request::fingerprint()` provides a unique request identifier. Middleware can add `X-Request-Id` header. `JsonResource::with()` adds metadata to resource responses. Community packages provide response enrichers.

---

## Related Knowledge Units
### Prerequisites
- API response shapes
- HTTP headers

### Related Topics
- Top-level meta and links
- Pagination metadata design
- Response envelope design

### Advanced Follow-up Topics
- Distributed tracing with request IDs
- Metadata-driven client behavior
- Custom metadata enrichers

---

## Research Notes
- Stripe includes `request_id` in every response for debugging
- Mailgun includes `X-Request-Id` header and body metadata
- AWS APIs use `X-Amzn-RequestId` headers for request tracing
- JSON:API includes a `meta` top-level member for non-standard metadata
