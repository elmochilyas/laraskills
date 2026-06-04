# API Response Shapes

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** response-structures
- **Knowledge Unit:** API Response Shapes
- **Difficulty Level:** Foundation
- **Last Updated:** 2026-06-04

---

## Executive Summary
API Response Shapes define the top-level structure of API responses — how data, errors, metadata, and links are organized in the JSON payload. Choosing and enforcing a consistent shape ensures that all API responses follow a predictable contract that clients can rely on.

---

## Core Concepts
- **Envelope vs Bare**: Whether responses use a wrapper (`{ "data": {...} }`) or return data directly (`{...}`)
- **Standard Shape Families**: JSON:API, plain JSON envelope, bare body, data-only
- **Success Shape**: The structure for 2xx responses — typically `{ "data": ..., "meta": {...} }`
- **Error Shape**: The structure for 4xx/5xx responses — typically `{ "error": { "code": "...", "message": "..." } }`
- **Empty Response Shape**: What a 204 No Content or empty collection looks like
- **Shape Consistency**: Ensuring all endpoints return the same response structure

---

## Mental Models
1. **Blueprint Model**: The response shape is a blueprint that every response must follow. Any deviation is a defect.
2. **House Frame Model**: Like a house frame with designated spaces — data goes here, errors go there, metadata goes in this corner. Every response is a house built on this frame.

---

## Internal Mechanics
The response shape is enforced at the controller layer where resources, responses, and error handlers are returned. A base controller, response macro, or response class ensures consistent structure. `Response::macro('success', function ($data) { ... })` defines reusable response patterns. The exception handler enforces the error shape.

---

## Patterns

### Pattern 1: JSON:API Shape
**Purpose**: Follow the JSON:API specification with `data`, `included`, `links`, `meta`, `errors` top-level keys
**Benefits**: Standardized, well-documented, ecosystem support
**Tradeoffs**: Verbose; may be overengineered for simple APIs

### Pattern 2: Custom Envelope Shape
**Purpose**: Use `{ "status": "success", "data": {...}, "message": "..." }`
**Benefits**: Simple, familiar, easy to implement
**Tradeoffs**: Not standardized; reinvents conventions

### Pattern 3: Bare Body Shape
**Purpose**: Return data directly without wrapping: `[{...}, {...}]` or `{...}`
**Benefits**: Minimal bandwidth; simple responses
**Tradeoffs**: No room for metadata or links in the same structure

---

## Architectural Decisions
### When To Use
- All API endpoints need a consistent shape — choose one and enforce it
- Public APIs benefit from standardized shapes (JSON:API)
- Internal APIs can use lighter shapes

### When To Avoid
- Mixed-content APIs that need different shapes for different endpoints (avoid at all costs)
- Binary/file responses (they have their own shape)
- Streaming responses

### Alternatives
- Custom envelope with status/data/error keys
- JSON:API compliance for public/third-party APIs
- Bare body for resource-only responses with HTTP headers for metadata

---

## Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Predictable client contract | Response payload size increases | Choose envelope only when needed |
| Self-documenting structure | Inconsistent shape confuses clients | Enforce via base class / middleware |
| Framework support (JSON:API) | JSON:API complexity for simple APIs | Start simple; adopt standards as needed |
| Error/data consistency | Shape changes are breaking changes | Version the shape or evolve carefully |

---

## Performance Considerations
- Envelope wrapping adds ~10-20% payload overhead on small responses
- JSON serialization cost is proportional to payload size
- Bare body responses are most bandwidth-efficient
- Use gzip/deflate compression to mitigate payload size differences

---

## Production Considerations
- Enforce the response shape via architecture tests
- Test that error responses follow the same shape as success responses
- Document the response shape in API documentation
- Monitor response shape compliance via contract tests
- Version the response shape if making breaking changes

---

## Common Mistakes
**Mixed shapes in one API**: Some endpoints return `{ data }`, others return `[ ... ]`. Enforce a single shape across all endpoints.
**Inconsistent error shapes**: Error responses with different structures at different endpoints make client error handling impossible.
**Shape without error cases**: Defining only the success shape without specifying the error shape leaves ambiguity.
**Over-wrapping**: Wrapping simple, single-resource responses in unnecessary envelopes.

---

## Failure Modes
**Shape regression**: A deploy changes the response shape without notice, breaking clients. *Detection:* Contract tests. *Mitigation:* Lock response shape with automated contract tests.
**Inconsistent shape across versions**: Different API versions use different shapes. *Detection:* Consumer complaints. *Mitigation:* Enforce shape consistency across all versions.

---

## Ecosystem Usage
Laravel doesn't enforce a specific response shape. `JsonResource` wraps in `{ data: ... }` by default. `Response::macro()` can define custom shapes. The `JsonResponse` class enables arbitrary response construction. Packages like `laravel-json-api` provide full JSON:API compliance.

---

## Related Knowledge Units
### Prerequisites
- JSON data format
- HTTP status codes

### Related Topics
- API resource transformation
- API response metadata
- Top-level meta and links

### Advanced Follow-up Topics
- JSON:API specification compliance
- Response shape versioning
- Custom envelope response design patterns

---

## Research Notes
- JSON:API is the most widely adopted standardized response shape for APIs
- Bare body responses are common in internal APIs and mobile-optimized backends
- Envelope responses originated from the need to include status/message alongside data
- Stripe uses `{ "data": [...], "has_more": bool }` — a minimal envelope approach
