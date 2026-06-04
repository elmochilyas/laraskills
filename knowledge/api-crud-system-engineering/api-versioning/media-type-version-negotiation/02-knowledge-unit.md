# Media Type Version Negotiation

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** api-versioning
- **Knowledge Unit:** Media Type Version Negotiation
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-04

---

## Executive Summary
Media Type Version Negotiation uses the `Accept` header to let clients request specific API versions via custom media types (e.g., `application/vnd.api.v2+json`). This approach keeps URLs clean and follows REST principles by treating version as a content negotiation concern rather than a routing concern.

---

## Core Concepts
- **Custom Media Types**: Registering application-specific media types like `application/vnd.myapp.v1+json` in the `Accept` header
- **Content Negotiation**: The server inspects `Accept` headers and chooses the appropriate response format and version
- **Vendor Prefix**: The `vnd.` prefix signals vendor-specific media types per RFC 6838
- **Fallback Behavior**: What happens when a client doesn't send an Accept header or sends an unsupported one
- **Response Content-Type**: The `Content-Type` response header echoes the negotiated media type

---

## Mental Models
1. **Restaurant Menu Model**: The Accept header is the customer's order (what they want). The server is the kitchen that prepares the requested version. Different versions are different menu items.
2. **Language Translation Model**: The Accept header is like requesting a document in a specific language — the same content presented in a different "dialect."

---

## Internal Mechanics
Laravel's middleware inspects `$request->header('Accept')` and parses the media type. A custom middleware or route group maps the parsed version to the appropriate controller. Responses set `Content-Type` to the negotiated media type. The version is resolved before the controller is dispatched, allowing version-specific logic in controllers or form requests.

---

## Patterns

### Pattern 1: Middleware-Based Negotiation
**Purpose**: A single middleware extracts version from Accept header and sets a route parameter or request attribute
**Benefits**: Centralized version logic; clean controllers
**Tradeoffs**: All requests pass through version middleware

### Pattern 2: Route Group Negotiation
**Purpose**: Route groups with Accept header matching in route constraints
**Benefits**: Laravel's native route-level filtering; no custom middleware
**Tradeoffs**: Less flexibility for complex negotiation logic

---

## Architectural Decisions
### When To Use
- REST-purist APIs where URLs should remain clean and semantic
- Public APIs where URL path versioning is considered an anti-pattern
- APIs serving multiple representations (JSON, XML) where version is part of the representation

### When To Avoid
- APIs where discoverability is important (browsers don't set Accept headers)
- Simple internal APIs where URL path versioning is more pragmatic
- APIs that need version-aware URL generation for client-side linking

### Alternatives
- URL path versioning (`/api/v1/users`)
- Query string versioning (`?version=1`)
- Custom header versioning (`X-API-Version: 1`)

---

## Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Clean URLs without version prefix | Requires client to set Accept headers | Non-browser clients must configure headers |
| REST-idiomatic approach | More complex middleware setup | Invest in robust middleware testing |
| Version as representation concern | Harder to debug (version is implicit) | Log resolved version in request context |

---

## Performance Considerations
- Media type parsing in middleware adds ~1ms per request
- Cache parsed Accept headers in request attributes to avoid re-parsing in downstream code
- Complex media type matching (wildcard, quality values) requires careful regex

---

## Production Considerations
- Log the resolved version and the original Accept header for debugging
- Return `406 Not Acceptable` for unsupported media types
- Document all supported media types in your API docs
- Test with clients that send various Accept header formats

---

## Common Mistakes
**Not handling missing Accept header**: Clients that don't send Accept should get a default version, not an error.
**Incorrect media type format**: `application/vnd.api+json; version=2` is different from `application/vnd.api.v2+json`. Choose one convention and stick with it.
**Version leaking in Content-Type**: If the response Content-Type doesn't match the negotiated version, clients can't tell what they received.

---

## Failure Modes
**Negotiation failure on preflight requests**: CORS preflight `OPTIONS` requests don't include custom Accept headers. *Detection:* CORS errors in browser clients. *Mitigation:* Handle OPTIONS before version negotiation middleware.
**Proxies stripping custom Accept headers**: CDN or reverse proxy strips vendor media types. *Detection:* Version negotiation fails for proxied requests. *Mitigation:* Configure proxy to pass Accept headers.

---

## Ecosystem Usage
Laravel doesn't provide built-in media type negotiation — it's implemented via custom middleware. The `Request::header()` method accesses the Accept header. Route model binding and middleware can use the resolved version for conditional logic.

---

## Related Knowledge Units
### Prerequisites
- HTTP content negotiation basics
- HTTP headers and request flow

### Related Topics
- URL path versioning
- Query string versioning
- Header-based versioning

### Advanced Follow-up Topics
- Multiple media type support (JSON, XML, MessagePack)
- Quality value-based content negotiation
- Custom media type registration and IANA standards

---

## Research Notes
- RFC 6838 defines vendor media types; `vnd.` is the standard prefix
- GitHub uses `application/vnd.github.v3+json` — a widely adopted example
- Quality values (`q=0.9`) in Accept headers can express version preference weights
