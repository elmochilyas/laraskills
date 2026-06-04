# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** api-versioning
**Knowledge Unit:** Media Type Version Negotiation
**Difficulty:** Advanced
**Category:** API Versioning
**Last Updated:** 2026-06-03

---

# Overview

Media Type Version Negotiation is an API versioning strategy where the client specifies the desired API version through the HTTP `Accept` header using versioned media types (e.g. `Accept: application/vnd.api+json; version=2`). It exists because URL-based versioning couples the resource identifier to the version, creating maintenance problems when versions evolve at different rates. Media type negotiation keeps URLs stable while allowing per-representation versioning.

Engineers must care because this approach provides the cleanest separation between resource identity and representation. Same URL, different versions. It enables mobile apps to deep-link without breaking, supports gradual API evolution, and follows REST principles more faithfully than URL-based versioning. However, it requires clients to manage Accept headers and adds complexity to caching infrastructure.

---

# Core Concepts

**Content Negotiation:** HTTP mechanism where client and server agree on the best representation of a resource. Version negotiation extends this to include API version.

**Accept Header Parsing:** The middleware must parse the Accept header per RFC 2295/7231, extracting the media type and version parameter.

**Version Routing Map:** Configuration mapping media type patterns to internal version handlers. Version 2 of the API is served when `Accept: application/vnd.api+json; version=2`.

**Vary Header:** `Vary: Accept` must be included in responses to inform caches that responses vary based on Accept header value.

**406 Not Acceptable:** HTTP status returned when the client's Accept header specifies a version or media type the server does not support.

**Generic Accept Fallback:** When clients send `Accept: application/json` or `*/*`, the server resolves to the latest stable version.

---

# When To Use

- Hypermedia APIs where URL stability is paramount
- APIs requiring per-representation versioning (different content types per version)
- Mobile applications where deep-linking to URLs should never break
- APIs with long-lived resource identifiers that should not change
- Enterprise APIs where consumers cache URLs extensively
- APIs that serve multiple content types (JSON, XML) per version

---

# When NOT To Use

- Simple public APIs with few consumers
- Teams inexperienced with HTTP content negotiation
- Environments where clients cannot control Accept headers (webhook receivers, browser-based requests)
- APIs where version visibility in URLs is desired for debugging
- Rapidly iterating APIs where URL changes are acceptable

---

# Best Practices

**Use dedicated middleware for negotiation.** Create a `VersionNegotiationMiddleware` that handles Accept header parsing, validation, and version resolution. Keep this logic separate from controllers.

**Prefer version parameter over media type per version.** `application/vnd.api+json; version=2` is simpler than separate media types like `application/vnd.api.v2+json`. Parameter-based is easier to maintain.

**Include Vary: Accept in all negotiated responses.** Without Vary, CDNs and proxies may serve the wrong version to clients.

**Provide clear 406 responses.** Return a body listing supported versions/media types and a Link header pointing to documentation.

**Log Accept headers for analytics.** Track which versions and media types consumers request to inform deprecation planning.

**Validate version parameter strictly.** Accept only supported version numbers. Reject negative numbers, non-numeric values, and unsupported versions with 406.

---

# Architecture Guidelines

**The negotiation middleware runs early in the middleware stack** — before auth, before rate limiting — to ensure version resolution happens before any other processing.

**Version resolution produces a request attribute** (`$request->attributes->set('api_version', 2)`) that controllers and downstream middleware can access.

**Controller dispatch based on version** can be handled via route groups, conditional logic, or separate controller directories. Route groups keep version concerns at the routing layer.

**Response Content-Type must match the negotiated version.** If the client negotiated `version=2`, the response Content-Type should include that version.

**The Vary header must include all headers that influence content selection.** At minimum `Vary: Accept`, also `Authorization` if authenticated responses differ by user.

---

# Performance Considerations

**Accept header parsing is O(1)** with a simple regex — negligible overhead (~0.02ms per request).

**Vary: Accept splits cache entries by version.** Each unique Accept header creates a separate cache entry, reducing cache hit rates as versions increase.

**CDN configuration must account for Vary: Accept.** Some CDNs strip or ignore Vary headers; verify CDN behavior with your cache strategy.

**Middleware overhead is minimal.** The entire negotiation process adds less than 0.1ms to request processing.

---

# Security Considerations

**Validate Accept header to prevent injection.** Malformed Accept headers should not crash the parser. Reject with 400 for unparseable headers.

**Version whitelist prevents enumeration.** Only accept versions that exist. Reject 999, -1, or other out-of-range values.

**Generic Accept fallback must be documented.** Clients relying on `Accept: */*` receive the latest version, which may break when a new version is released.

**406 responses should not reveal internal version count.** List supported versions but don't expose internal numbering schemes.

---

# Common Mistakes

**Inconsistent Accept header parsing.** Some clients send version, others don't. The parser must handle both cases gracefully.

**Ambiguous version fallback.** Which version serves `Accept: application/json`? Document the default behavior explicitly.

**No 406 response.** Falling back silently to the latest version when the client requests an unsupported version masks client errors.

**Response Content-Type mismatch.** Returning a different version than the client negotiated causes client-side parsing failures.

**Missing Vary: Accept.** Caching infrastructure serves wrong version responses to clients with different Accept headers.

---

# Anti-Patterns

**URL-Accept Dual Versioning:** Specifying version in both URL and Accept header, creating ambiguity when they conflict.
**Better approach:** Choose one versioning mechanism and enforce it consistently.

**Per-Endpoint Version Variation:** Some endpoints use media type negotiation while others use URL versioning.
**Better approach:** Consistent versioning strategy across the entire API.

---

# Examples

**Negotiation middleware:**
```
class VersionNegotiationMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $accept = $request->header('Accept');
        $version = $this->parseVersion($accept) ?? $this->latestVersion;
        
        abort_if(!$this->isSupported($version), 406);
        
        $request->attributes->set('api_version', $version);
        $response = $next($request);
        $response->headers->set('Vary', 'Accept');
        
        return $response;
    }
}
```

---

# Related Topics

**Prerequisites:**
- HTTP Content Negotiation Fundamentals
- Middleware Implementation

**Closely Related Topics:**
- URL Path Versioning — alternative approach
- Query String Versioning — simpler alternative
- Versioning Strategy Selection — choosing between approaches

**Advanced Follow-Up Topics:**
- Accept Header Routing Design — advanced routing patterns
- Cache Strategy for Versioned APIs — managing Vary header cache impact

**Cross-Domain Connections:**
- Content Negotiation — general content-type negotiation
- Response Caching Headers — Vary header interaction with caching
