# Query String Versioning

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** api-versioning
- **Knowledge Unit:** Query String Versioning
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary
Query String Versioning appends a version parameter to the URL query string (e.g., `?version=2` or `?api_version=2024-01-01`) to select API versions. This approach is simple to implement and easy for clients to use, but can lead to caching issues and URL ambiguity.

---

## Core Concepts
- **Query Parameter Convention**: Choosing the parameter name (`version`, `api_version`, `v`) and value format (integer, date, semver)
- **Default Version**: Behavior when no version parameter is provided
- **Version Resolution in Middleware**: Extracting the parameter and routing to the correct handler
- **Cache Key Implications**: Query parameters affect HTTP cache keys in proxies and CDNs
- **Date-Based Versions**: Using date-based values (`2024-06-01`) for version selection, often paired with API version governance

---

## Mental Models
1. **URL Argument Model**: The version parameter is just another argument in the URL, like a filter or sort parameter. It's explicit and visible.
2. **Flag-Based Routing Model**: Each version is a flag that directs traffic to a specific code path. The flag is visible in the URL.

---

## Internal Mechanics
A middleware or route group reads `request()->query('version')` at the start of the request lifecycle. The value is validated against supported versions, then used to select the appropriate controller namespace, form request class, or resource transformer. The decision propagates through the application via request attributes or a version context class.

---

## Patterns

### Pattern 1: Middleware Version Router
**Purpose**: A middleware reads the version and sets `$request->attributes->set('api_version', $version)`
**Benefits**: Controllers don't know about versioning; clean separation
**Tradeoffs**: Middleware runs on every request, even non-versioned ones

### Pattern 2: Route Group Versioning
**Purpose**: Separate route groups per version, all sharing the same URL path but distinguished by query parameter
**Benefits**: Clear route organization; no middleware magic
**Tradeoffs**: Duplicated route definitions

---

## Architectural Decisions
### When To Use
- Simple APIs where clients appreciate explicit version control
- Internal APIs where URL cleanliness is not a priority
- Transition scenarios where you need a quick versioning solution

### When To Avoid
- REST-purist APIs (URL should identify resources, not versions)
- Public APIs served through CDNs (query params fragment cache)
- APIs where version is part of resource identity (bookmarkable URLs)

### Alternatives
- URL path versioning (`/api/v1/users`)
- Media type negotiation (`Accept: application/vnd.api.v2+json`)
- Custom header versioning (`X-API-Version: 2`)

---

## Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Simple to implement | Version visible in every URL | Less RESTful; clutters client code |
| Easy for clients to use | Cache fragmentation by version | CDN caching strategy must account for version param |
| No Accept header setup needed | URL-based routing conflicts | Ensure version param doesn't conflict with filter params |
| Easy to set default version | Ambiguous URLs (bookmark without version) | Educate clients to include version consistently |

---

## Performance Considerations
- Query string parsing is trivial (<0.1ms overhead)
- Cache keys include query parameters, so different versions produce different cache entries (may fragment CDN cache)
- Use a version-specific cache prefix to avoid cache key collisions

---

## Production Considerations
- Validate version parameter values to reject invalid versions early
- Return clear error messages for unsupported versions: `422 Unprocessable Entity` with supported versions listed
- Log version usage for deprecation tracking
- Consider URL rewriting at the reverse proxy level for cleaner external URLs

---

## Common Mistakes
**Using ambiguous parameter names**: `?version=` conflicts with resource version concepts. Use `?api_version=` or keep it specific.
**Ignoring URL encoding edge cases**: Version values with special characters (dates with slashes, semver with dots) must be URL-encoded properly.
**No default version fallback**: Missing `version` parameter should default to the latest stable version, not return an error.

---

## Failure Modes
**Cache poisoning via version parameter**: Incorrect version values in cache keys serve wrong content. *Detection:* Content mismatch audits. *Mitigation:* Validate version parameter before cache lookup.
**Version parameter collision**: `?version=` conflicts with a resource-level version parameter. *Detection:* Hard-to-diagnose bugs. *Mitigation:* Use a distinctive prefix like `api_`.

---

## Ecosystem Usage
Laravel's `Request::query('version')` provides the version value. Route groups with `prefix()` and `where()` constraints can filter valid versions. Middleware on the `api` middleware group handles version resolution before controllers execute.

---

## Related Knowledge Units
### Prerequisites
- HTTP query parameter conventions
- URL structure design

### Related Topics
- URL path versioning
- Media type version negotiation
- Query parameter filtering

### Advanced Follow-up Topics
- Date-based version release patterns
- Multi-parameter version negotiation
- API gateway version routing

---

## Research Notes
- Date-based versions (e.g., `?version=2024-06-01`) are preferred by some APIs (Stripe, Twilio) for their clear deprecation timeline
- Query string versioning is the simplest to implement but the most controversial among REST purists
- Cache invalidation for query-versioned APIs requires careful cache key design
